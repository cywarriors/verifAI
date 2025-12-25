"""Base probe class for AgentTopTen - OWASP Agentic AI Top 10 probes"""

import logging
from typing import List, Dict, Any, Optional, Iterable, Union
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class OWASPProbe(ABC):
    """
    Base class for AgentTopTen probes (OWASP Agentic AI Top 10) following Garak framework architecture.
    
    This class mirrors the structure of garak.probes.base.Probe to ensure
    consistency with Garak's plugin system.
    
    Attributes:
        name: Short name identifier for the probe
        goal: What the probe is trying to do, phrased as an imperative
        description: Detailed description of the probe
        tags: MISP-format taxonomy categories or OWASP categories
        active: Whether this probe should be included by default
        primary_detector: Default detector to use for this probe
        extended_detectors: Optional extended detectors
        prompts: List of test prompts to send to the model
        lang: Language this probe is for (BCP47 format), '*' for all langs
        owasp_id: OWASP Agentic AI Top 10 identifier (e.g., "AA01")
        category: Category of the probe ("owasp_agentic_top10")
    """
    
    # Class attributes following Garak pattern
    name: str = ""
    goal: str = ""
    description: str = ""
    tags: Iterable[str] = []
    active: bool = True
    primary_detector: Optional[str] = None
    extended_detectors: Iterable[str] = []
    lang: Optional[str] = None  # BCP47 format, '*' for all
    owasp_id: str = ""
    category: str = "owasp_agentic_top10"
    
    # Probe-specific attributes
    prompts: List[str] = []
    modality: dict = {"in": {"text"}, "out": {"text"}}  # Input/output modalities (Garak pattern)
    
    def __init__(self):
        """Initialize the probe with default attributes."""
        # Ensure class attributes are copied to instance
        if not hasattr(self, 'name') or not self.name:
            self.name = self.__class__.__name__.replace('Probe', '').lower()
        
        if not hasattr(self, 'description') or not self.description:
            if self.__doc__:
                self.description = self.__doc__.split("\n", maxsplit=1)[0]
            else:
                self.description = ""
        
        # Set probename (following garak pattern)
        self.probename = f"agenttopten.{self.__class__.__module__.split('.')[-1]}.{self.__class__.__name__}"
        
        # Ensure category is set
        self.category = "owasp_agentic_top10"
        
        # Initialize prompts if not set
        if not hasattr(self, 'prompts') or not self.prompts:
            self.prompts = self._init_prompts()
        
        # Log probe initialization
        logger.debug(f"Initialized AgentTopTen probe: {self.probename}")
    
    def _init_prompts(self) -> List[str]:
        """
        Initialize default prompts for this probe.
        
        Subclasses should override this to provide probe-specific prompts.
        Returns empty list by default.
        """
        return []
    
    @abstractmethod
    def test(self, model_response: str, user_query: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        Test method that analyzes model response for vulnerabilities.
        
        This method is called by the AgentTopTen integration to evaluate
        the model's response. It should return structured results.
        
        Args:
            model_response: Response from the model
            user_query: Original user query/prompt (if available)
            **kwargs: Additional context (model_info, response_time, etc.)
        
        Returns:
            Dictionary with test results containing:
            - passed: bool - Whether the test passed (no vulnerability found)
            - findings: List[Dict] - List of vulnerability findings
            - risk_level: str - Risk level (critical, high, medium, low, info)
            - vulnerability_score: float - Numeric score (0.0-1.0)
            - owasp_id: str - OWASP identifier
            - probe_name: str - Name of the probe
        """
        raise NotImplementedError("Subclasses must implement test() method")
    
    def probe(self, generator, detector=None) -> Iterable:
        """
        Garak-style probe method using AgentTopTen generators and detectors.
        
        This method follows Garak's probe() pattern:
        1. Generate prompts using self.prompts
        2. Get responses from generator
        3. Create Attempt objects
        4. Run detector on attempts
        5. Return attempts with detector results
        
        Args:
            generator: Generator instance with generate() method
            detector: Optional Detector instance (if None, uses test() method)
        
        Returns:
            Iterable of Attempt objects with detector_results populated
        """
        from scanner.agenttopten.generators.base import Conversation, Message
        from scanner.agenttopten.detectors.base import Attempt
        
        attempts = []
        
        for seq, prompt_text in enumerate(self.prompts):
            try:
                # Create conversation from prompt
                prompt = Conversation.from_string(prompt_text)
                
                # Get response from generator
                try:
                    if hasattr(generator, 'generate'):
                        outputs = generator.generate(prompt, generations_this_call=1)
                    else:
                        logger.warning(f"Generator {generator} does not have generate() method")
                        outputs = [None]
                except Exception as e:
                    logger.error(f"Error generating response: {e}", exc_info=True)
                    outputs = [None]
                
                # Convert outputs to Messages if needed
                messages = []
                for output in outputs:
                    if isinstance(output, Message):
                        messages.append(output)
                    elif output is None:
                        messages.append(Message(text=""))
                    else:
                        messages.append(Message(text=str(output)))
                
                # Create Attempt object
                attempt = Attempt(
                    prompt=prompt_text,
                    outputs=messages,
                    probe_name=self.name,
                    seq=seq
                )
                
                # Run detector if provided
                if detector:
                    try:
                        scores = list(detector.detect(attempt))
                        attempt.detector_results[detector.detectorname] = scores
                    except Exception as e:
                        logger.error(f"Error running detector {detector.detectorname}: {e}", exc_info=True)
                        attempt.detector_results[detector.detectorname] = [0.0] * len(messages)
                else:
                    # Fallback to test() method
                    if messages and messages[0].text:
                        test_result = self.test(
                            model_response=messages[0].text,
                            user_query=prompt_text,
                            seq=seq
                        )
                        if isinstance(test_result, dict):
                            score = test_result.get("vulnerability_score", 0.0)
                            attempt.detector_results["test_method"] = [score]
                
                attempts.append(attempt)
                    
            except Exception as e:
                logger.error(f"Error in probe {self.probename} for prompt {seq}: {e}", exc_info=True)
                from scanner.agenttopten.generators.base import Message
                attempt = Attempt(
                    prompt=prompt_text,
                    outputs=[Message(text="")],
                    probe_name=self.name,
                    seq=seq
                )
                attempts.append(attempt)
        
        return attempts
    
    def _get_example_attack_scenarios(self) -> List[str]:
        """
        Return example attack scenarios for this vulnerability.
        
        Subclasses should override this to provide specific examples.
        Returns empty list by default.
        """
        return []
    
    def _get_prevention_mitigation(self) -> List[str]:
        """
        Return prevention and mitigation strategies for this vulnerability.
        
        Subclasses should override this to provide specific mitigation strategies.
        Returns empty list by default.
        """
        return []
    
    def as_dict(self) -> Dict[str, Any]:
        """Convert probe metadata to dictionary (for discovery/inspection)"""
        return {
            "name": self.name,
            "probename": self.probename,
            "goal": self.goal,
            "description": self.description,
            "tags": list(self.tags) if self.tags else [],
            "active": self.active,
            "lang": self.lang,
            "owasp_id": self.owasp_id,
            "category": self.category,
            "primary_detector": self.primary_detector,
            "extended_detectors": list(self.extended_detectors) if self.extended_detectors else [],
            "prompt_count": len(self.prompts),
            "example_attack_scenarios": self._get_example_attack_scenarios(),
            "prevention_mitigation": self._get_prevention_mitigation(),
        }


class TextProbe(OWASPProbe):
    """
    Base class for text-based AgentTopTen probes.
    
    Most AgentTopTen probes will inherit from this class.
    """
    
    def __init__(self):
        super().__init__()
        self.modality = {"in": {"text"}, "out": {"text"}}
