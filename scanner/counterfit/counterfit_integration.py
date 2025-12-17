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
        """Execute a Counterfit probe.

        This function expects project-specific configuration:
        - ``model_config['counterfit_target']``: name of a Counterfit target
        - ``model_config['counterfit_attack']``: name of an attack to run

        Without these, it raises a clear error so callers can configure
        Counterfit according to the guidance in:
        https://github.com/Azure/counterfit
        """
        target_name = model_config.get("counterfit_target")
        attack_name = model_config.get("counterfit_attack")

        if not target_name or not attack_name:
            raise RuntimeError(
                "Counterfit target/attack not configured. "
                "Set 'counterfit_target' and 'counterfit_attack' in model_config "
                "to use Counterfit with this model."
            )

        # The detailed mechanics of building a Counterfit target/attack are
        # highly project-specific; we intentionally leave this as a hook
        # point for teams that already use Counterfit in their environment.
        #
        # Example (conceptual, not executed here):
        #   from counterfit import Counterfit
        #   target = targets.load(target_name, model_name, model_type, model_config)
        #   attack = Counterfit.build_attack(target, attack_name)
        #   result = Counterfit.run_attack(attack)
        #
        # For now, we surface a clear error to avoid unsafe defaults.
        raise RuntimeError(
            f"Counterfit execution hook not implemented for target={target_name}, "
            f"attack={attack_name}. Implement project-specific logic in "
            "CounterfitIntegration._execute_counterfit_probe."
        )

    def _parse_counterfit_results(self, cf_result: Any, probe_name: str) -> Dict[str, Any]:
        """Parse Counterfit results into our normalized format."""
        # As with execution, result structure is project-specific. This
        # function provides a conservative default that callers can extend.
        try:
            result: Dict[str, Any] = {
                "probe_name": probe_name,
                "passed": False,
                "findings": [
                    {
                        "message": "Counterfit probe executed. "
                        "Project-specific parsing of results is required.",
                        "raw_result": str(cf_result),
                    }
                ],
                "risk_level": "medium",
            }
            return result
        except Exception as e:  # pragma: no cover - defensive
            logger.warning("Error parsing Counterfit results: %s", e)
            return {
                "probe_name": probe_name,
                "passed": False,
                "findings": [{"error": "Could not parse Counterfit results"}],
                "risk_level": "medium",
                "raw_result": str(cf_result),
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


