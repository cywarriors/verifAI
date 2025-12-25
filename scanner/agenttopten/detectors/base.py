"""Base Detector classes for AgentTopTen - Following Garak framework architecture

Detectors analyze model outputs to detect vulnerabilities. They return scores
in the range 0.0-1.0 where 1.0 represents a successful hit (vulnerability found).
This follows the garak.detectors.base.Detector pattern.
"""

import logging
from typing import List, Dict, Any, Optional, Iterable
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class Attempt:
    """
    Attempt object representing a probe attempt (simplified from Garak pattern).
    
    In Garak, Attempt contains prompt, outputs, detector_results, etc.
    For AgentTopTen, we use a simplified version that contains:
    - prompt: The input prompt
    - outputs: List of Message objects (model responses)
    - probe_name: Name of the probe that generated this attempt
    """
    
    def __init__(self, prompt: str, outputs: List, probe_name: str = "", seq: int = 0):
        self.prompt = prompt
        self.outputs = outputs  # List of Message objects or strings
        self.probe_name = probe_name
        self.seq = seq
        self.detector_results: Dict[str, List[float]] = {}  # detector_name -> scores
    
    def outputs_for(self, lang_spec: Optional[str] = None) -> List:
        """
        Get outputs, optionally filtered by language (Garak pattern).
        
        Args:
            lang_spec: Language specification to filter by (None = all)
            
        Returns:
            List of output Messages
        """
        if lang_spec is None:
            return self.outputs
        
        # Filter by language if specified
        filtered = []
        for output in self.outputs:
            if hasattr(output, "lang"):
                if lang_spec == "*" or output.lang == lang_spec:
                    filtered.append(output)
            else:
                # If no lang attribute, include it
                filtered.append(output)
        return filtered


class Detector(ABC):
    """
    Base class for detectors that analyze model outputs (following Garak pattern).
    
    Detectors take Attempt objects and return scores in the range 0.0-1.0,
    where 1.0 indicates a vulnerability was found.
    """
    
    def __init__(self):
        """Initialize detector"""
        self.name = self.__class__.__name__
        self.detectorname = f"agenttopten.detectors.{self.__class__.__module__.split('.')[-1]}.{self.name}"
        self.lang_spec = "*"  # Language specification (BCP47 format or "*")
        self.active = True
        self.tags = []
        
        if hasattr(self, "__doc__") and self.__doc__:
            self.description = self.__doc__.split("\n")[0]
        else:
            self.description = ""
        
        logger.debug(f"Initialized detector: {self.detectorname}")
    
    @abstractmethod
    def detect(self, attempt: Attempt) -> Iterable[float]:
        """
        Detect vulnerabilities in attempt outputs.
        
        Args:
            attempt: Attempt object containing prompt and outputs
            
        Returns:
            Iterable of scores (0.0-1.0) for each output, where:
            - 0.0 = no vulnerability found
            - 1.0 = vulnerability found
            - None = unable to evaluate (should be avoided)
        """
        raise NotImplementedError
    
    def as_dict(self) -> Dict[str, Any]:
        """Convert detector metadata to dictionary"""
        return {
            "name": self.name,
            "detectorname": self.detectorname,
            "description": self.description,
            "lang_spec": self.lang_spec,
            "tags": self.tags,
            "active": self.active,
        }


class StringDetector(Detector):
    """
    Detector that checks for presence of substrings in outputs (Garak pattern).
    
    Useful for detecting specific keywords, phrases, or patterns.
    """
    
    def __init__(self, substrings: List[str], matchtype: str = "str", case_sensitive: bool = False):
        """
        Initialize string detector
        
        Args:
            substrings: List of strings to search for
            matchtype: "str" (substring) or "word" (word boundary)
            case_sensitive: Whether matching should be case-sensitive
        """
        super().__init__()
        self.substrings = substrings
        self.matchtype = matchtype
        self.case_sensitive = case_sensitive
    
    def detect(self, attempt: Attempt) -> Iterable[float]:
        """Detect if any substrings are present in outputs"""
        import re
        
        results = []
        outputs = attempt.outputs_for(self.lang_spec)
        
        for output in outputs:
            # Extract text from Message or use string directly
            output_text = output.text if hasattr(output, "text") else str(output)
            if not output_text:
                results.append(0.0)
                continue
            
            match_found = False
            for substring in self.substrings:
                if not self.case_sensitive:
                    search_text = output_text.lower()
                    search_substring = substring.lower()
                else:
                    search_text = output_text
                    search_substring = substring
                
                if self.matchtype == "str":
                    if search_substring in search_text:
                        match_found = True
                        break
                elif self.matchtype == "word":
                    if re.search(r"\b" + re.escape(search_substring) + r"\b", search_text):
                        match_found = True
                        break
            
            results.append(1.0 if match_found else 0.0)
        
        return results


class PatternDetector(Detector):
    """
    Detector that uses regular expressions to detect patterns.
    
    Useful for detecting structured data leaks, code injection, etc.
    """
    
    def __init__(self, patterns: List[str], flags: int = 0):
        """
        Initialize pattern detector
        
        Args:
            patterns: List of regex patterns to search for
            flags: re flags (e.g., re.IGNORECASE)
        """
        super().__init__()
        self.patterns = patterns
        self.flags = flags
    
    def detect(self, attempt: Attempt) -> Iterable[float]:
        """Detect if any patterns match outputs"""
        import re
        
        results = []
        outputs = attempt.outputs_for(self.lang_spec)
        
        for output in outputs:
            output_text = output.text if hasattr(output, "text") else str(output)
            if not output_text:
                results.append(0.0)
                continue
            
            match_found = False
            for pattern in self.patterns:
                if re.search(pattern, output_text, self.flags):
                    match_found = True
                    break
            
            results.append(1.0 if match_found else 0.0)
        
        return results


class ProbeIntegratedDetector(Detector):
    """
    Detector that uses a probe's test() method for detection.
    
    This bridges existing probes that have embedded detection logic
    with the detector pattern.
    """
    
    def __init__(self, probe_instance):
        """
        Initialize with a probe instance
        
        Args:
            probe_instance: Probe instance with test() method
        """
        super().__init__()
        self.probe = probe_instance
        self.name = f"{probe_instance.name}_detector"
    
    def detect(self, attempt: Attempt) -> Iterable[float]:
        """Use probe's test method for detection"""
        results = []
        outputs = attempt.outputs_for(self.lang_spec)
        
        for output in outputs:
            output_text = output.text if hasattr(output, "text") else str(output)
            if not output_text:
                results.append(0.0)
                continue
            
            try:
                # Call probe's test method
                test_result = self.probe.test(
                    model_response=output_text,
                    user_query=attempt.prompt
                )
                
                # Convert test result to score
                if isinstance(test_result, dict):
                    # Use vulnerability_score if available, otherwise derive from passed/findings
                    if "vulnerability_score" in test_result:
                        score = test_result["vulnerability_score"]
                    elif "findings" in test_result and test_result["findings"]:
                        # Calculate score based on findings severity
                        score = 0.0
                        for finding in test_result["findings"]:
                            severity = finding.get("severity", "low")
                            severity_scores = {"critical": 1.0, "high": 0.8, "medium": 0.5, "low": 0.2}
                            score = max(score, severity_scores.get(severity, 0.0))
                    elif "passed" in test_result:
                        score = 0.0 if test_result["passed"] else 0.5
                    else:
                        score = 0.0
                else:
                    score = 0.0
                
                results.append(min(1.0, max(0.0, score)))  # Clamp to 0.0-1.0
                
            except Exception as e:
                logger.error(f"Error in ProbeIntegratedDetector.detect: {e}", exc_info=True)
                results.append(0.0)
        
        return results

