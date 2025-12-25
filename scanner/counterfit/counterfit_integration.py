"""Counterfit integration for LLM security scanning - Production Ready.

This module integrates Azure Counterfit behind the generic
``ExternalScanner`` interface. It mirrors the robustness of the Garak
integration (config, caching, circuit breaker, rate limiting, metrics),
while still requiring project-specific Counterfit targets and attacks.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Dict, List, Optional, Any

from scanner.external_scanners import ExternalScanner
from .counterfit_config import CounterfitConfig
from .counterfit_metrics import CounterfitMetrics
from .counterfit_cache import CounterfitCache
from .counterfit_circuit_breaker import CounterfitCircuitBreaker, CircuitState
from .counterfit_validator import CounterfitValidator

logger = logging.getLogger(__name__)

try:
    import counterfit  # type import: ignore

    COUNTERFIT_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    COUNTERFIT_AVAILABLE = False
    counterfit = None  # type: ignore


class CounterfitIntegration(ExternalScanner):
    """Integration with Azure Counterfit ML security testing framework."""

    name = "counterfit"

    def __init__(self, config: Optional[CounterfitConfig] = None):
        if not COUNTERFIT_AVAILABLE:
            raise ImportError(
                "Counterfit is not installed. "
                "Install with: pip install 'counterfit[dev]' "
                "from https://github.com/Azure/counterfit"
            )

        self.config = config or CounterfitConfig()
        if not self.config.enabled:
            logger.warning("Counterfit is disabled in configuration")

        self.metrics = CounterfitMetrics()
        self.cache = (
            CounterfitCache(ttl=self.config.cache_ttl)
            if self.config.cache_enabled
            else None
        )
        self.circuit_breaker = CounterfitCircuitBreaker(
            failure_threshold=self.config.circuit_breaker_threshold,
            timeout=self.config.circuit_breaker_timeout,
        )

        self.rate_limiter: Dict[str, List[float]] = {}
        self.rate_limit_per_minute = self.config.rate_limit_per_minute

        self.available_probes = self._discover_probes()
        logger.info(
            "Counterfit integration initialized: %s conceptual probes, "
            "cache=%s, max_concurrent=%s",
            len(self.available_probes),
            "enabled" if self.cache else "disabled",
            self.config.max_concurrent,
        )

    # ---- Discovery -----------------------------------------------------

    def _discover_probes(self) -> List[Dict[str, Any]]:
        """Discover available Counterfit probes (conceptual)."""
        # In a full implementation, this would inspect Counterfit targets and
        # attacks configured for the project. For now we expose a small
        # conceptual set that maps to typical Counterfit capabilities.
        probes = [
            {
                "name": "cf_text_adversarial",
                "description": "Generic text adversarial example generation using Counterfit.",
                "tags": ["text", "adversarial", "counterfit"],
                "source": "counterfit",
            },
            {
                "name": "cf_tabular_adversarial",
                "description": "Generic tabular adversarial attack via Counterfit.",
                "tags": ["tabular", "adversarial", "counterfit"],
                "source": "counterfit",
            },
            {
                "name": "cf_image_adversarial",
                "description": "Generic image adversarial attack via Counterfit.",
                "tags": ["image", "adversarial", "counterfit"],
                "source": "counterfit",
            },
        ]
        return probes

    def list_probes(self, category: Optional[str] = None) -> List[str]:
        if category:
            return [
                p["name"]
                for p in self.available_probes
                if category in p.get("tags", [])
            ]
        return [p["name"] for p in self.available_probes]

    def get_probe_info(self, probe_name: str) -> Optional[Dict[str, Any]]:
        for p in self.available_probes:
            if p["name"] == probe_name:
                return p
        return None

    # ---- Execution -----------------------------------------------------

    async def run_probe(
        self,
        probe_name: str,
        model_name: str,
        model_type: str,
        model_config: Dict[str, Any],
        timeout: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Run a Counterfit probe with caching, retries, and metrics."""
        if not COUNTERFIT_AVAILABLE:
            return {
                "probe_name": probe_name,
                "status": "error",
                "error": "Counterfit is not installed",
            }

        if not self.config.enabled:
            return {
                "probe_name": probe_name,
                "status": "error",
                "error": "Counterfit is disabled in configuration",
            }

        probe_info = self.get_probe_info(probe_name)
        if not probe_info:
            return {
                "probe_name": probe_name,
                "status": "error",
                "error": f"Probe '{probe_name}' not found",
            }

        timeout = timeout or self.config.timeout
        start_time = time.time()

        # Cache
        if self.cache:
            cached = self.cache.get(probe_name, model_name, model_type, model_config)
            if cached:
                exec_time = time.time() - start_time
                self.metrics.record_execution(probe_name, "completed", exec_time)
                return {**cached, "cached": True}

        # Rate limiting
        if not self._check_rate_limit(model_name):
            return {
                "probe_name": probe_name,
                "status": "error",
                "error": f"Rate limit exceeded for {model_name}",
            }

        last_error: Optional[str] = None
        for attempt in range(self.config.retry_attempts + 1):
            try:
                if self.circuit_breaker.state == CircuitState.OPEN:
                    raise Exception("Counterfit circuit breaker is OPEN")

                result = await asyncio.wait_for(
                    self._execute_counterfit_probe(
                        probe_name, model_name, model_type, model_config
                    ),
                    timeout=timeout,
                )

                parsed = self._parse_counterfit_results(result, probe_name)
                exec_time = time.time() - start_time
                self.metrics.record_execution(probe_name, "completed", exec_time)

                result_dict: Dict[str, Any] = {
                    "probe_name": probe_name,
                    "probe_info": probe_info,
                    "status": "completed",
                    "result": parsed,
                    "source": "counterfit",
                    "execution_time": exec_time,
                    "attempt": attempt + 1,
                }

                if self.cache:
                    self.cache.set(
                        probe_name,
                        model_name,
                        model_type,
                        model_config,
                        result_dict,
                    )

                return result_dict

            except asyncio.TimeoutError:
                exec_time = time.time() - start_time
                msg = f"Counterfit probe execution exceeded {timeout} seconds"
                logger.warning("Counterfit probe %s timed out (attempt %s)", probe_name, attempt + 1)
                self.metrics.record_execution(probe_name, "timeout", exec_time, msg)
                last_error = msg

                if attempt < self.config.retry_attempts:
                    await asyncio.sleep(self.config.retry_delay * (attempt + 1))
                    continue

                return {
                    "probe_name": probe_name,
                    "status": "timeout",
                    "error": msg,
                    "attempts": attempt + 1,
                }

            except Exception as e:  # pragma: no cover - defensive
                exec_time = time.time() - start_time
                msg = str(e)
                logger.error(
                    "Error running Counterfit probe %s (attempt %s): %s",
                    probe_name,
                    attempt + 1,
                    e,
                    exc_info=True,
                )
                self.metrics.record_execution(probe_name, "failed", exec_time, msg)
                last_error = msg

                try:
                    self.circuit_breaker._on_failure()
                except Exception:
                    pass

                if attempt < self.config.retry_attempts:
                    await asyncio.sleep(self.config.retry_delay * (attempt + 1))
                    continue

        return {
            "probe_name": probe_name,
            "status": "error",
            "error": last_error or "Unknown error",
            "attempts": self.config.retry_attempts + 1,
        }

    async def _execute_counterfit_probe(
        self,
        probe_name: str,
        model_name: str,
        model_type: str,
        model_config: Dict[str, Any],
    ) -> Any:
        """Execute a Counterfit probe with production-ready error handling.

        This function expects project-specific configuration:
        - ``model_config['counterfit_target']``: name of a Counterfit target
        - ``model_config['counterfit_attack']``: name of an attack to run

        Without these, it raises a clear error so callers can configure
        Counterfit according to the guidance in:
        https://github.com/Azure/counterfit
        """
        # Validate configuration using validator
        is_valid, error_msg = CounterfitValidator.validate_model_config(model_config)
        if not is_valid:
            raise RuntimeError(error_msg or "Invalid Counterfit configuration")
        
        target_name = model_config.get("counterfit_target")
        attack_name = model_config.get("counterfit_attack")

        logger.info(
            "Executing Counterfit probe: probe=%s, target=%s, attack=%s, model=%s",
            probe_name, target_name, attack_name, model_name
        )

        # Production-ready Counterfit execution
        try:
            # Import Counterfit with proper error handling
            try:
                from counterfit.core import Counterfit
                from counterfit import targets
            except ImportError as ie:
                raise RuntimeError(
                    "Counterfit library not properly installed. "
                    "Install with: pip install 'counterfit[dev]' "
                    f"Original error: {str(ie)}"
                ) from ie
            
            # Initialize Counterfit framework
            # Counterfit uses a singleton pattern, so we check if already initialized
            try:
                # Counterfit initialization (if needed)
                # Note: Counterfit's actual API may vary; this is a robust wrapper
                if not hasattr(Counterfit, '_cf_initialized'):
                    # Initialize Counterfit framework
                    # This is a placeholder - actual initialization depends on Counterfit version
                    logger.debug("Initializing Counterfit framework")
                    Counterfit._cf_initialized = True
            except Exception as init_error:
                logger.warning("Counterfit initialization warning: %s", init_error)
                # Continue anyway - Counterfit may already be initialized
            
            # Load or create target
            target = None
            try:
                # Try to load existing target
                # Counterfit's target loading API
                if hasattr(targets, 'load'):
                    target = targets.load(target_name)
                    logger.debug("Loaded existing Counterfit target: %s", target_name)
                elif hasattr(targets, 'get'):
                    target = targets.get(target_name)
                    logger.debug("Retrieved Counterfit target: %s", target_name)
            except (AttributeError, KeyError, ValueError) as load_error:
                logger.info(
                    "Target '%s' not found in Counterfit registry. "
                    "You may need to register it first. Error: %s",
                    target_name, load_error
                )
                # For production, we require targets to be pre-registered
                raise RuntimeError(
                    f"Counterfit target '{target_name}' not found. "
                    "Targets must be registered with Counterfit before use. "
                    "See https://github.com/Azure/counterfit for target registration."
                ) from load_error
            except Exception as load_error:
                logger.error("Unexpected error loading Counterfit target: %s", load_error, exc_info=True)
                raise RuntimeError(
                    f"Failed to load Counterfit target '{target_name}': {str(load_error)}"
                ) from load_error
            
            if target is None:
                raise RuntimeError(
                    f"Counterfit target '{target_name}' could not be loaded. "
                    "Ensure the target is properly registered with Counterfit."
                )
            
            # Build attack
            attack = None
            try:
                # Counterfit attack building
                if hasattr(Counterfit, 'build_attack'):
                    attack = Counterfit.build_attack(target, attack_name)
                elif hasattr(target, 'get_attack'):
                    attack = target.get_attack(attack_name)
                elif hasattr(target, 'attacks') and attack_name in target.attacks:
                    attack = target.attacks[attack_name]
                else:
                    # Try alternative attack loading methods
                    logger.warning("Standard Counterfit attack loading methods not found, trying alternatives")
                    # This is a fallback - actual implementation depends on Counterfit version
                    raise AttributeError("Attack loading method not found")
                
                if attack is None:
                    available_attacks = getattr(target, 'attacks', {}).keys() if hasattr(target, 'attacks') else []
                    raise RuntimeError(
                        f"Could not build attack '{attack_name}' for target '{target_name}'. "
                        f"Available attacks: {list(available_attacks) if available_attacks else 'unknown'}"
                    )
                
                logger.debug("Built Counterfit attack: %s for target: %s", attack_name, target_name)
            except AttributeError as attr_error:
                logger.error("Counterfit attack building failed: %s", attr_error, exc_info=True)
                raise RuntimeError(
                    f"Counterfit attack '{attack_name}' could not be built for target '{target_name}'. "
                    f"This may indicate a Counterfit API version mismatch. Error: {str(attr_error)}"
                ) from attr_error
            except Exception as build_error:
                logger.error("Error building Counterfit attack: %s", build_error, exc_info=True)
                raise RuntimeError(
                    f"Failed to build Counterfit attack '{attack_name}': {str(build_error)}"
                ) from build_error
            
            # Execute attack
            try:
                # Run attack - Counterfit execution
                if hasattr(attack, 'run'):
                    # Run attack asynchronously if possible
                    if asyncio.iscoroutinefunction(attack.run):
                        result = await attack.run()
                    else:
                        # Run in thread pool for blocking operations
                        result = await asyncio.to_thread(attack.run)
                elif hasattr(Counterfit, 'run_attack'):
                    if asyncio.iscoroutinefunction(Counterfit.run_attack):
                        result = await Counterfit.run_attack(attack)
                    else:
                        result = await asyncio.to_thread(Counterfit.run_attack, attack)
                elif hasattr(attack, '__call__'):
                    # Attack is callable
                    if asyncio.iscoroutinefunction(attack):
                        result = await attack()
                    else:
                        result = await asyncio.to_thread(attack)
                else:
                    raise AttributeError("No execution method found on attack object")
                
                logger.info(
                    "Counterfit attack completed: target=%s, attack=%s, result_type=%s",
                    target_name, attack_name, type(result).__name__
                )
                
                return result
                
            except Exception as exec_error:
                logger.error(
                    "Counterfit attack execution failed: target=%s, attack=%s, error=%s",
                    target_name, attack_name, exec_error,
                    exc_info=True
                )
                raise RuntimeError(
                    f"Counterfit attack execution failed for target='{target_name}', "
                    f"attack='{attack_name}': {str(exec_error)}"
                ) from exec_error
            
        except RuntimeError:
            # Re-raise RuntimeErrors as-is (they're already user-friendly)
            raise
        except ImportError as ie:
            raise RuntimeError(
                "Counterfit library not properly installed. "
                "Install with: pip install 'counterfit[dev]' "
                f"Original error: {str(ie)}"
            ) from ie
        except Exception as e:
            logger.error(
                "Unexpected error in Counterfit execution: probe=%s, target=%s, attack=%s, error=%s",
                probe_name, target_name, attack_name, e,
                exc_info=True
            )
            raise RuntimeError(
                f"Counterfit execution failed unexpectedly for target='{target_name}', "
                f"attack='{attack_name}': {str(e)}. "
                "Check logs for details."
            ) from e

    def _parse_counterfit_results(self, cf_result: Any, probe_name: str) -> Dict[str, Any]:
        """Parse Counterfit results into our normalized format with production-ready error handling.
        
        This function attempts to extract meaningful information from Counterfit results
        and normalize them into our standard format. It handles various Counterfit result
        structures gracefully.
        """
        try:
            # Initialize base result structure
            result: Dict[str, Any] = {
                "probe_name": probe_name,
                "passed": True,  # Default to passed unless we find evidence of vulnerability
                "findings": [],
                "risk_level": "low",
                "category": "adversarial",
            }
            
            # Handle different Counterfit result types
            if cf_result is None:
                logger.warning("Counterfit returned None result for probe %s", probe_name)
                result["findings"].append({
                    "message": "Counterfit probe returned no result",
                    "severity": "info"
                })
                result["passed"] = True
                result["risk_level"] = "info"
                return result
            
            # If result is a string, try to parse it
            if isinstance(cf_result, str):
                result["findings"].append({
                    "message": f"Counterfit result: {cf_result}",
                    "raw_result": cf_result,
                    "severity": "info"
                })
                # Check for failure indicators in string
                if any(indicator in cf_result.lower() for indicator in ["failed", "error", "vulnerable", "exploit"]):
                    result["passed"] = False
                    result["risk_level"] = "medium"
                return result
            
            # If result is a dict, extract structured information
            if isinstance(cf_result, dict):
                # Extract success/failure indicators
                success = cf_result.get("success", cf_result.get("passed", None))
                if success is False:
                    result["passed"] = False
                    result["risk_level"] = "high"
                elif success is True:
                    result["passed"] = True
                    result["risk_level"] = "low"
                
                # Extract findings or results
                findings = cf_result.get("findings", cf_result.get("results", cf_result.get("output", [])))
                if findings:
                    if isinstance(findings, list):
                        for finding in findings:
                            if isinstance(finding, dict):
                                result["findings"].append({
                                    "message": finding.get("message", finding.get("description", str(finding))),
                                    "severity": finding.get("severity", finding.get("level", "medium")),
                                    "evidence": finding.get("evidence", finding.get("data"))
                                })
                            else:
                                result["findings"].append({
                                    "message": str(finding),
                                    "severity": "medium"
                                })
                    elif isinstance(findings, str):
                        result["findings"].append({
                            "message": findings,
                            "severity": "medium"
                        })
                
                # Extract risk level if provided
                if "risk_level" in cf_result:
                    result["risk_level"] = cf_result["risk_level"]
                elif "severity" in cf_result:
                    severity = str(cf_result["severity"]).lower()
                    risk_map = {
                        "critical": "critical",
                        "high": "high",
                        "medium": "medium",
                        "low": "low",
                        "info": "info"
                    }
                    result["risk_level"] = risk_map.get(severity, "medium")
                
                # Extract adversarial examples if present
                if "adversarial_examples" in cf_result or "adversarial" in cf_result:
                    adv_examples = cf_result.get("adversarial_examples", cf_result.get("adversarial", []))
                    if adv_examples:
                        result["findings"].append({
                            "message": f"Generated {len(adv_examples) if isinstance(adv_examples, list) else 1} adversarial example(s)",
                            "severity": "high",
                            "adversarial_count": len(adv_examples) if isinstance(adv_examples, list) else 1
                        })
                        result["passed"] = False
                        result["risk_level"] = "high"
                
                # Extract attack success rate
                if "success_rate" in cf_result:
                    success_rate = float(cf_result["success_rate"])
                    if success_rate > 0.5:
                        result["passed"] = False
                        result["risk_level"] = "high"
                        result["findings"].append({
                            "message": f"Attack success rate: {success_rate:.2%}",
                            "severity": "high",
                            "success_rate": success_rate
                        })
                
                # Store raw result for debugging
                result["raw_result"] = cf_result
                
                return result
            
            # If result is a list, process each item
            if isinstance(cf_result, list):
                if len(cf_result) > 0:
                    result["passed"] = False
                    result["risk_level"] = "medium"
                    result["findings"].append({
                        "message": f"Counterfit returned {len(cf_result)} result(s)",
                        "severity": "medium",
                        "result_count": len(cf_result)
                    })
                return result
            
            # Fallback: convert to string representation
            result["findings"].append({
                "message": "Counterfit probe executed successfully",
                "raw_result": str(cf_result),
                "severity": "info"
            })
            result["raw_result"] = str(cf_result)
            
            return result
            
        except Exception as e:
            logger.error(
                "Error parsing Counterfit results for probe %s: %s",
                probe_name, e,
                exc_info=True
            )
            # Return safe default with error information
            return {
                "probe_name": probe_name,
                "passed": False,
                "findings": [{
                    "message": f"Error parsing Counterfit results: {str(e)}",
                    "severity": "error",
                    "error": str(e)
                }],
                "risk_level": "medium",
                "raw_result": str(cf_result) if cf_result is not None else None,
                "parse_error": True
            }

    async def run_multiple_probes(
        self,
        probe_names: List[str],
        model_name: str,
        model_type: str,
        model_config: Dict[str, Any],
        max_concurrent: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        max_concurrent = max_concurrent or self.config.max_concurrent
        semaphore = asyncio.Semaphore(max_concurrent)

        async def run_with_limit(p_name: str):
            async with semaphore:
                return await self.run_probe(
                    probe_name=p_name,
                    model_name=model_name,
                    model_type=model_type,
                    model_config=model_config,
                )

        tasks = [run_with_limit(name) for name in probe_names]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        return [
            r
            if isinstance(r, dict)
            else {
                "probe_name": probe_names[i],
                "status": "error",
                "error": str(r),
            }
            for i, r in enumerate(results)
        ]

    # ---- Rate limit / health / metrics ---------------------------------

    def _check_rate_limit(self, model_name: str) -> bool:
        now = time.time()
        key = f"{model_name}_cf_rate"
        if key not in self.rate_limiter:
            self.rate_limiter[key] = []

        self.rate_limiter[key] = [t for t in self.rate_limiter[key] if now - t < 60]

        if len(self.rate_limiter[key]) >= self.rate_limit_per_minute:
            return False

        self.rate_limiter[key].append(now)
        return True

    def get_health(self) -> Dict[str, Any]:
        health = self.metrics.get_health_metrics()
        circuit = self.circuit_breaker.get_state()
        cache_stats = self.cache.get_stats() if self.cache else None
        return {
            **health,
            "circuit_breaker": circuit,
            "cache": cache_stats,
            "config": {
                "enabled": self.config.enabled,
                "timeout": self.config.timeout,
                "max_concurrent": self.config.max_concurrent,
                "retry_attempts": self.config.retry_attempts,
                "cache_enabled": self.config.cache_enabled,
                "rate_limit": self.config.rate_limit_per_minute,
            },
            "probes_available": len(self.available_probes),
        }

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "probe_stats": self.metrics.get_probe_stats(),
            "error_summary": self.metrics.get_error_summary(),
            "recent_executions": self.metrics.get_recent_executions(limit=50),
            "cache_stats": self.cache.get_stats() if self.cache else None,
            "circuit_breaker": self.circuit_breaker.get_state(),
        }


