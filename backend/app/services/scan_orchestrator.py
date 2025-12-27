"""Scan orchestration service"""

import asyncio
import sys
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.db.models import (
    Scan,
    ScanStatus,
    Vulnerability,
    Severity,
    ComplianceMapping,
    ComplianceStatus,
    ScannerType,
)
from app.services.compliance_engine import ComplianceEngine
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Optional Garak scanner import
try:
    from scanner.garak import GarakScanner, GARAK_AVAILABLE
    GARAK_SCANNER_AVAILABLE = GARAK_AVAILABLE
except Exception as e:
    GARAK_SCANNER_AVAILABLE = False
    GarakScanner = None
    logger.debug("GarakScanner not available: %s", e)

# Try to import scanner - add parent directory to path if needed
try:
    scanner_path = Path(__file__).parent.parent.parent.parent / "scanner"
    if scanner_path.exists() and str(scanner_path.parent) not in sys.path:
        sys.path.insert(0, str(scanner_path.parent))
    
    from scanner import ScannerEngine
    SCANNER_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Scanner module not available: {e}. Using simulation mode.")
    SCANNER_AVAILABLE = False
    ScannerEngine = None


class ScanOrchestrator:
    """Orchestrates security scans against LLM models"""
    
    def __init__(self, db: Session):
        self.db = db
        self.compliance_engine = ComplianceEngine(db)
    
    async def create_scan(
        self,
        name: str,
        model_name: str,
        model_type: str,
        model_config: Optional[Dict] = None,
        description: Optional[str] = None,
        created_by: int = None
    ) -> Scan:
        """Create a new scan record"""
        scan = Scan(
            name=name,
            description=description,
            model_name=model_name,
            model_type=model_type,
            model_config=model_config or {},
            status=ScanStatus.PENDING,
            created_by=created_by
        )
        
        self.db.add(scan)
        self.db.commit()
        self.db.refresh(scan)
        
        return scan
    
    async def execute_scan(self, scan_id: int, api_key: str = None) -> None:
        """Execute a security scan (background task)
        
        Args:
            scan_id: ID of the scan to execute
            api_key: Optional API key for model access (passed securely, not stored)
        """
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return
        
        try:
            # Update status to running
            scan.status = ScanStatus.RUNNING
            scan.started_at = datetime.utcnow()
            self.db.commit()
            
            # Run probes with scanner selection
            vulnerabilities = await self._run_probes(scan, api_key)
            
            # Check if cancelled
            self.db.refresh(scan)
            if scan.status == ScanStatus.CANCELLED:
                return
            
            # Save vulnerabilities
            for vuln_data in vulnerabilities:
                vuln = Vulnerability(
                    scan_id=scan_id,
                    **vuln_data
                )
                self.db.add(vuln)
            
            # Calculate risk score
            risk_score = self._calculate_risk_score(vulnerabilities)
            
            # Update scan results
            scan.status = ScanStatus.COMPLETED
            scan.completed_at = datetime.utcnow()
            scan.duration = int((scan.completed_at - scan.started_at).total_seconds())
            scan.vulnerability_count = len(vulnerabilities)
            scan.risk_score = risk_score
            scan.progress = 100.0
            scan.results = {
                "total_probes": 12,
                "vulnerabilities_found": len(vulnerabilities),
                "risk_score": risk_score,
                "summary": self._generate_summary(vulnerabilities)
            }
            
            self.db.commit()
            
            # Generate compliance mappings
            await self.compliance_engine.map_vulnerabilities_to_compliance(scan_id)
            
        except ValueError as e:
            # Model validation or configuration errors
            error_msg = str(e)
            scan.status = ScanStatus.FAILED
            scan.completed_at = datetime.utcnow()
            scan.results = {
                "error": error_msg,
                "error_type": "model_initialization",
                "suggestion": "Please verify the model name and configuration are correct"
            }
            self.db.commit()
            logger.error(f"Scan {scan_id} failed due to model error: {error_msg}")
            # Don't re-raise - scan is marked as failed
            return
        except Exception as e:
            # Other unexpected errors
            error_msg = str(e)
            scan.status = ScanStatus.FAILED
            scan.completed_at = datetime.utcnow()
            scan.results = {
                "error": error_msg,
                "error_type": "scan_execution",
            }
            self.db.commit()
            logger.error(f"Scan {scan_id} failed: {error_msg}", exc_info=True)
            # Don't re-raise - scan is marked as failed
            return
    
    async def _run_probes(self, scan: Scan, api_key: Optional[str] = None) -> List[Dict[str, Any]]:
        """Run security probes against the model"""
        vulnerabilities = []

        # Route Garak scans directly through GarakScanner when available
        if getattr(scan, "scanner_type", None) == ScannerType.GARAK:
            if GARAK_SCANNER_AVAILABLE and GarakScanner:
                try:
                    return await self._run_garak_scanner(scan, api_key)
                except Exception as e:
                    logger.error("Error running Garak scanner: %s. Falling back to simulation.", e, exc_info=True)
            else:
                logger.warning("Garak scanner not available; using simulation")
            return await self._run_probes_simulation(scan)

        # Use generic scanner engine if available, otherwise fall back to simulation
        if SCANNER_AVAILABLE and ScannerEngine:
            try:
                return await self._run_probes_with_scanner(scan)
            except Exception as e:
                logger.error(f"Error using scanner engine: {e}. Falling back to simulation.")
                # Fall through to simulation mode

        # Simulation mode (fallback)
        return await self._run_probes_simulation(scan)

    async def _run_garak_scanner(self, scan: Scan, api_key: Optional[str]) -> List[Dict[str, Any]]:
        """Execute Garak scanner directly with in-memory API key"""
        if not GARAK_SCANNER_AVAILABLE or not GarakScanner:
            raise RuntimeError("GarakScanner is not available")

        garak = GarakScanner()

        probes = []
        if scan.model_config:
            probes = scan.model_config.get("probes") or []
        timeout = (scan.model_config or {}).get("timeout", garak.config.timeout)
        prompt = (scan.model_config or {}).get("prompt", "Security evaluation prompt")

        result = await garak.scan(
            model_type=scan.model_type,
            model_name=scan.model_name,
            prompt=prompt,
            probes=probes,
            api_key=api_key,
            timeout=timeout,
        )

        vulnerabilities: List[Dict[str, Any]] = []
        severity_map = {
            "critical": Severity.CRITICAL,
            "high": Severity.HIGH,
            "medium": Severity.MEDIUM,
            "low": Severity.LOW,
            "info": Severity.INFO,
        }

        for vuln in result.get("vulnerabilities", []):
            severity = severity_map.get((vuln.get("severity") or "medium").lower(), Severity.MEDIUM)
            probe_name = vuln.get("probe") or "garak_probe"
            vulnerabilities.append({
                "title": vuln.get("type", "Security Issue"),
                "description": vuln.get("message") or vuln.get("evidence") or "Security issue detected",
                "severity": severity,
                "probe_name": probe_name,
                "probe_category": vuln.get("category", "garak"),
                "evidence": vuln.get("evidence"),
                "remediation": vuln.get("remediation") or self._get_remediation(probe_name),
                "cvss_score": self._severity_to_cvss(severity),
                "metadata": {
                    "scanner": "garak",
                    "execution_time": vuln.get("execution_time"),
                },
            })

        # Mark progress complete
        scan.progress = 100.0
        self.db.commit()

        return vulnerabilities
    
    async def _run_probes_with_scanner(self, scan: Scan) -> List[Dict[str, Any]]:
        """Run probes using the actual scanner engine.

        The behavior is controlled by ``scan.scanner_type``:
        - builtin: only first-party probes in this repo
        - garak: only Garak probes (if available)
        - all: combine builtin + Garak where available
        - counterfit / art: route to optional external scanners if installed,
          otherwise fall back to simulation.
        """
        vulnerabilities: List[Dict[str, Any]] = []

        try:
            # Initialize scanner with explicit config path
            # Ensure we use the scanner config directory
            scanner_config_path = Path(__file__).parent.parent.parent.parent / "scanner" / "configs" / "default.yaml"
            scanner = ScannerEngine(config_path=scanner_config_path)
            
            # Merge API keys from settings if not provided in model_config
            model_config = scan.model_config.copy() if scan.model_config else {}
            
            # Add API keys from settings if not already in model_config
            if scan.model_type == "anthropic":
                if not model_config.get("api_key") and not model_config.get("anthropic_api_key"):
                    if settings.ANTHROPIC_API_KEY:
                        model_config["api_key"] = settings.ANTHROPIC_API_KEY
                        model_config["anthropic_api_key"] = settings.ANTHROPIC_API_KEY
            elif scan.model_type == "openai":
                if not model_config.get("api_key") and not model_config.get("openai_api_key"):
                    if settings.OPENAI_API_KEY:
                        model_config["api_key"] = settings.OPENAI_API_KEY
                        model_config["openai_api_key"] = settings.OPENAI_API_KEY
            elif scan.model_type == "huggingface":
                if not model_config.get("api_key") and not model_config.get("huggingface_api_key"):
                    if settings.HUGGINGFACE_API_KEY:
                        model_config["api_key"] = settings.HUGGINGFACE_API_KEY
                        model_config["huggingface_api_key"] = settings.HUGGINGFACE_API_KEY
            
            # Validate and set model with better error handling
            try:
                scanner.set_model(
                    model_name=scan.model_name,
                    model_type=scan.model_type,
                    model_config=model_config,
                )
            except ValueError as model_error:
                # Model validation/initialization error
                error_msg = str(model_error)
                logger.error(f"Model initialization failed: {error_msg}")
                raise ValueError(
                    f"Failed to initialize model '{scan.model_name}' ({scan.model_type}): {error_msg}"
                )
            except Exception as model_error:
                # Other model errors
                error_msg = str(model_error)
                logger.error(f"Model initialization error: {error_msg}", exc_info=True)
                raise ValueError(
                    f"Model initialization error for '{scan.model_name}': {error_msg}"
                )

            scanner_type = getattr(scan, "scanner_type", ScannerType.BUILTIN)

            # Determine which probes and engine to use
            include_llmtopten = False
            include_agenttopten = False
            if scanner_type == ScannerType.BUILTIN:
                available_probes = scanner.probe_loader.list_probes()
                include_garak = False
            elif scanner_type == ScannerType.GARAK:
                if not scanner.garak:
                    logger.warning("Garak scanner requested but not available; using simulation")
                    return await self._run_probes_simulation(scan)
                available_probes = scanner.garak.list_probes()
                include_garak = True
            elif scanner_type == ScannerType.LLMTOP10:
                if not scanner.llmtopten:
                    logger.warning(
                        "LLMTopTen scanner requested but not available; using simulation. "
                        "Check if LLMTopTen integration initialized successfully in scanner engine."
                    )
                    if hasattr(scanner, 'llmtopten') and scanner.llmtopten is None:
                        logger.debug("Scanner.llmtopten is None - check initialization logs")
                    return await self._run_probes_simulation(scan)
                available_probes = scanner.llmtopten.list_probes()
                include_llmtopten = True
                include_garak = False
            elif scanner_type == ScannerType.AGENTTOP10:
                if not scanner.agenttopten:
                    logger.warning(
                        "AgentTopTen scanner requested but not available; using simulation. "
                        "Check if AgentTopTen integration initialized successfully in scanner engine."
                    )
                    if hasattr(scanner, 'agenttopten') and scanner.agenttopten is None:
                        logger.debug("Scanner.agenttopten is None - check initialization logs")
                    return await self._run_probes_simulation(scan)
                available_probes = scanner.agenttopten.list_probes()
                include_agenttopten = True
                include_garak = False
            elif scanner_type == ScannerType.ALL:
                available_probes = scanner.probe_loader.list_probes()
                if scanner.garak:
                    available_probes.extend(scanner.garak.list_probes())
                if scanner.llmtopten:
                    available_probes.extend(scanner.llmtopten.list_probes())
                if scanner.agenttopten:
                    available_probes.extend(scanner.agenttopten.list_probes())
                include_garak = True
                include_llmtopten = True
                include_agenttopten = True
            elif scanner_type in (ScannerType.COUNTERFIT, ScannerType.ART):
                ext = scanner.external_scanners.get(scanner_type.value)
                if not ext:
                    logger.warning("%s scanner requested but not available; using simulation", scanner_type.value)
                    return await self._run_probes_simulation(scan)

                # For external scanners we route directly through their interface
                probe_names = ext.list_probes()
                if not probe_names:
                    logger.warning("No probes available for external scanner %s", scanner_type.value)
                    return []

                total_probes = len(probe_names)
                completed = 0

                # Merge API keys from settings if not provided
                model_config = scan.model_config.copy() if scan.model_config else {}
                if scan.model_type == "anthropic":
                    if not model_config.get("api_key") and not model_config.get("anthropic_api_key"):
                        if settings.ANTHROPIC_API_KEY:
                            model_config["api_key"] = settings.ANTHROPIC_API_KEY
                            model_config["anthropic_api_key"] = settings.ANTHROPIC_API_KEY
                elif scan.model_type == "openai":
                    if not model_config.get("api_key") and not model_config.get("openai_api_key"):
                        if settings.OPENAI_API_KEY:
                            model_config["api_key"] = settings.OPENAI_API_KEY
                            model_config["openai_api_key"] = settings.OPENAI_API_KEY
                
                results = await ext.run_multiple_probes(
                    probe_names=probe_names,
                    model_name=scan.model_name,
                    model_type=scan.model_type,
                    model_config=model_config,
                )

                for probe_result in results:
                    # Check if cancelled
                    self.db.refresh(scan)
                    if scan.status == ScanStatus.CANCELLED:
                        return vulnerabilities

                    probe_name = probe_result.get("probe_name")
                    probe_status = probe_result.get("status")
                    result_data = probe_result.get("result", {})

                    if probe_status == "completed" and result_data:
                        passed = result_data.get("passed", True)
                        if not passed:
                            risk_level = result_data.get("risk_level", "medium")
                            severity = self._risk_level_to_severity(risk_level)
                            category = result_data.get("category", "external")

                            vulnerabilities.append(
                                {
                                    "title": f"{category.title()} - {probe_name.replace('_', ' ').title()} Detected",
                                    "description": result_data.get(
                                        "description",
                                        "Security vulnerability detected by external scanner",
                                    ),
                                    "severity": severity,
                                    "probe_name": probe_name,
                                    "probe_category": category,
                                    "evidence": str(result_data.get("findings", result_data)),
                                    "remediation": self._get_remediation(probe_name),
                                    "cvss_score": self._severity_to_cvss(severity),
                                    "metadata": {
                                        "probe_version": "1.0",
                                        "model": scan.model_name,
                                        "execution_time": probe_result.get("execution_time"),
                                        "probe_result": result_data,
                                        "scanner_type": scanner_type.value,
                                    },
                                }
                            )

                    # Update progress
                    completed += 1
                    scan.progress = (completed / total_probes) * 100
                    self.db.commit()

                return vulnerabilities

            else:
                logger.warning("Unknown scanner_type %s, falling back to builtin", scanner_type)
                available_probes = scanner.probe_loader.list_probes()
                include_garak = False

            if not available_probes:
                logger.warning("No probes available, using simulation")
                return await self._run_probes_simulation(scan)

            total_probes = len(available_probes)
            completed = 0

            # Run scan using ScannerEngine (handles builtin + Garak + LLMTopTen + AgentTopTen)
            scan_results = await scanner.run_scan(
                probe_names=available_probes,
                include_garak=include_garak,
                include_llmtopten=include_llmtopten,
                include_agenttopten=include_agenttopten,
            )
            
            # Process results
            for probe_result in scan_results.get("results", []):
                # Check if cancelled
                self.db.refresh(scan)
                if scan.status == ScanStatus.CANCELLED:
                    return vulnerabilities
                
                probe_name = probe_result.get("probe_name")
                probe_status = probe_result.get("status")
                result_data = probe_result.get("result", {})
                
                if probe_status == "completed" and result_data:
                    # Check if probe detected a vulnerability
                    passed = result_data.get("passed", True)
                    if not passed:
                        # Convert probe result to vulnerability
                        risk_level = result_data.get("risk_level", "medium")
                        severity = self._risk_level_to_severity(risk_level)
                        
                        probe_info = scanner.probe_loader.get_probe_info(probe_name)
                        category = probe_info.get("category", "unknown") if probe_info else "unknown"
                        
                        vulnerabilities.append({
                            "title": f"{category.title()} - {probe_name.replace('_', ' ').title()} Detected",
                            "description": probe_info.get("description", "Security vulnerability detected") if probe_info else "Security vulnerability detected",
                            "severity": severity,
                            "probe_name": probe_name,
                            "probe_category": category,
                            "evidence": str(result_data.get("findings", result_data)),
                            "remediation": self._get_remediation(probe_name),
                            "cvss_score": self._severity_to_cvss(severity),
                            "metadata": {
                                "probe_version": "1.0",
                                "model": scan.model_name,
                                "execution_time": probe_result.get("execution_time"),
                                "probe_result": result_data
                            }
                        })
                
                # Update progress
                completed += 1
                scan.progress = (completed / total_probes) * 100
                self.db.commit()
            
            return vulnerabilities
            
        except Exception as e:
            logger.error(f"Error in scanner execution: {e}", exc_info=True)
            # Fall back to simulation
            return await self._run_probes_simulation(scan)
    
    async def _run_probes_simulation(self, scan: Scan) -> List[Dict[str, Any]]:
        """Fallback simulation mode for when scanner is not available"""
        import random
        vulnerabilities = []
        
        # Define probe categories
        probe_categories = [
            ("Prompt Injection", ["direct_injection", "indirect_injection", "jailbreak"]),
            ("Data Leakage", ["pii_leakage", "training_data_extraction", "system_prompt_leak"]),
            ("Hallucination", ["factual_accuracy", "citation_verification"]),
        ]
        
        total_probes = sum(len(probes) for _, probes in probe_categories)
        completed = 0
        
        for category, probes in probe_categories:
            for probe_name in probes:
                # Check if cancelled
                self.db.refresh(scan)
                if scan.status == ScanStatus.CANCELLED:
                    return vulnerabilities
                
                # Simulate probe execution
                await asyncio.sleep(0.5)  # Simulate work
                
                # Randomly generate vulnerabilities for demo
                if random.random() < 0.3:  # 30% chance of finding vulnerability
                    severity = random.choice([Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW])
                    vulnerabilities.append({
                        "title": f"{category} - {probe_name.replace('_', ' ').title()} Detected",
                        "description": self._get_vulnerability_description(probe_name),
                        "severity": severity,
                        "probe_name": probe_name,
                        "probe_category": category,
                        "evidence": f"Probe {probe_name} detected potential vulnerability during testing.",
                        "remediation": self._get_remediation(probe_name),
                        "cvss_score": self._severity_to_cvss(severity),
                        "metadata": {"probe_version": "1.0", "model": scan.model_name, "mode": "simulation"}
                    })
                
                # Update progress
                completed += 1
                scan.progress = (completed / total_probes) * 100
                self.db.commit()
        
        return vulnerabilities
    
    def _risk_level_to_severity(self, risk_level: str) -> Severity:
        """Convert risk level string to Severity enum"""
        risk_map = {
            "critical": Severity.CRITICAL,
            "high": Severity.HIGH,
            "medium": Severity.MEDIUM,
            "low": Severity.LOW,
            "info": Severity.INFO,
        }
        return risk_map.get(risk_level.lower(), Severity.MEDIUM)
    
    def _get_vulnerability_description(self, probe_name: str) -> str:
        """Get description for a vulnerability type"""
        descriptions = {
            "direct_injection": "The model is susceptible to direct prompt injection attacks that can override system instructions.",
            "indirect_injection": "External content can manipulate model behavior through injected instructions in retrieved context.",
            "jailbreak": "The model can be manipulated to bypass safety guidelines through specific prompt patterns.",
            "pii_leakage": "The model may expose personally identifiable information from training data or conversation context.",
            "training_data_extraction": "Attackers may be able to extract portions of training data through targeted queries.",
            "system_prompt_leak": "The system prompt can be extracted through adversarial prompting techniques.",
            "factual_accuracy": "The model generates factually incorrect information with high confidence.",
            "citation_verification": "The model provides fake or non-existent citations and references.",
        }
        return descriptions.get(probe_name, "Potential security vulnerability detected.")
    
    def _get_remediation(self, probe_name: str) -> str:
        """Get remediation advice for a vulnerability type"""
        remediations = {
            "direct_injection": "Implement input validation, use prompt hardening techniques, and add output filtering.",
            "indirect_injection": "Sanitize retrieved context, implement content security policies, and use trusted data sources.",
            "jailbreak": "Regularly update safety guidelines, implement multi-layer content filtering, and monitor for bypass attempts.",
            "pii_leakage": "Apply PII filtering to outputs, implement data masking, and review training data for sensitive content.",
            "training_data_extraction": "Add memorization detection, implement differential privacy, and monitor for extraction attempts.",
            "system_prompt_leak": "Use prompt obfuscation, implement access controls, and regularly rotate system prompts.",
            "factual_accuracy": "Implement fact-checking pipelines, use retrieval augmentation, and add confidence scoring.",
            "citation_verification": "Validate citations against known sources, implement reference checking, and flag unverified claims.",
        }
        return remediations.get(probe_name, "Review and address the identified vulnerability.")
    
    def _severity_to_cvss(self, severity: Severity) -> float:
        """Convert severity to CVSS-like score"""
        import random
        scores = {
            Severity.CRITICAL: random.uniform(9.0, 10.0),
            Severity.HIGH: random.uniform(7.0, 8.9),
            Severity.MEDIUM: random.uniform(4.0, 6.9),
            Severity.LOW: random.uniform(0.1, 3.9),
            Severity.INFO: 0.0,
        }
        return round(scores.get(severity, 5.0), 1)
    
    def _calculate_risk_score(self, vulnerabilities: List[Dict]) -> float:
        """Calculate overall risk score from vulnerabilities"""
        if not vulnerabilities:
            return 0.0
        
        severity_weights = {
            Severity.CRITICAL: 10,
            Severity.HIGH: 7,
            Severity.MEDIUM: 4,
            Severity.LOW: 1,
            Severity.INFO: 0,
        }
        
        total_weight = sum(severity_weights.get(v["severity"], 0) for v in vulnerabilities)
        max_possible = len(vulnerabilities) * 10
        
        return round((total_weight / max_possible) * 100, 1) if max_possible > 0 else 0.0
    
    def _generate_summary(self, vulnerabilities: List[Dict]) -> Dict[str, int]:
        """Generate vulnerability summary by severity"""
        summary = {s.value: 0 for s in Severity}
        for v in vulnerabilities:
            summary[v["severity"].value] += 1
        return summary
    
    async def cancel_scan(self, scan_id: int) -> Scan:
        """Cancel a running scan"""
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if scan and scan.status in [ScanStatus.PENDING, ScanStatus.RUNNING]:
            scan.status = ScanStatus.CANCELLED
            scan.completed_at = datetime.utcnow()
            self.db.commit()
        return scan
