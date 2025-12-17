"""ART integration for LLM security scanning - Production Ready.

This module integrates the Adversarial Robustness Toolbox (ART) behind the
generic ``ExternalScanner`` interface. It provides config, caching,
metrics, and circuit breaker support similar to the Garak integration,
while requiring project-specific ART estimators and attacks.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional

from scanner.external_scanners import ExternalScanner
from .art_config import ARTConfig
from .art_metrics import ARTMetrics
from .art_cache import ARTCache
from .art_circuit_breaker import ARTCircuitBreaker, CircuitState

logger = logging.getLogger(__name__)

try:
    import art  # type: ignore

    ART_AVAILABLE = True
except ImportError:  # pragma: no cover
    ART_AVAILABLE = False
    art = None  # type: ignore


class ARTIntegration(ExternalScanner):
    """Integration with Adversarial Robustness Toolbox (ART)."""

    name = "art"

    def __init__(self, config: Optional[ARTConfig] = None):
        if not ART_AVAILABLE:
            raise ImportError(
                "Adversarial Robustness Toolbox (ART) is not installed. "
                "Install with: pip install adversarial-robustness-toolbox"
            )

        self.config = config or ARTConfig()
        if not self.config.enabled:
            logger.warning("ART integration is disabled in configuration")

        self.metrics = ARTMetrics()
        self.cache = (
            ARTCache(ttl=self.config.cache_ttl) if self.config.cache_enabled else None
        )
        self.circuit_breaker = ARTCircuitBreaker(
            failure_threshold=self.config.circuit_breaker_threshold,
            timeout=self.config.circuit_breaker_timeout,
        )
        self.rate_limiter: Dict[str, List[float]] = {}
        self.rate_limit_per_minute = self.config.rate_limit_per_minute

        self.available_probes = self._discover_probes()
        logger.info(
            "ART integration initialized: %s conceptual probes, cache=%s, max_concurrent=%s",
            len(self.available_probes),
            "enabled" if self.cache else "disabled",
            self.config.max_concurrent,
        )

    # ---- Discovery -----------------------------------------------------

    def _discover_probes(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "art_text_attack",
                "description": "Generic text adversarial test using ART.",
                "tags": ["text", "adversarial", "art"],
                "source": "art",
            },
            {
                "name": "art_image_attack",
                "description": "Generic image adversarial test using ART.",
                "tags": ["image", "adversarial", "art"],
                "source": "art",
            },
            {
                "name": "art_tabular_attack",
                "description": "Generic tabular adversarial test using ART.",
                "tags": ["tabular", "adversarial", "art"],
                "source": "art",
            },
        ]

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
        if not ART_AVAILABLE:
            return {
                "probe_name": probe_name,
                "status": "error",
                "error": "ART is not installed",
            }

        if not self.config.enabled:
            return {
                "probe_name": probe_name,
                "status": "error",
                "error": "ART is disabled in configuration",
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

        # Rate limit
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
                    raise Exception("ART circuit breaker is OPEN")

                result = await asyncio.wait_for(
                    self._execute_art_probe(
                        probe_name, model_name, model_type, model_config
                    ),
                    timeout=timeout,
                )

                parsed = self._parse_art_results(result, probe_name)
                exec_time = time.time() - start_time
                self.metrics.record_execution(probe_name, "completed", exec_time)

                result_dict: Dict[str, Any] = {
                    "probe_name": probe_name,
                    "probe_info": probe_info,
                    "status": "completed",
                    "result": parsed,
                    "source": "art",
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
                msg = f"ART probe execution exceeded {timeout} seconds"
                logger.warning("ART probe %s timed out (attempt %s)", probe_name, attempt + 1)
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

            except Exception as e:  # pragma: no cover
                exec_time = time.time() - start_time
                msg = str(e)
                logger.error(
                    "Error running ART probe %s (attempt %s): %s",
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

    async def _execute_art_probe(
        self,
        probe_name: str,
        model_name: str,
        model_type: str,
        model_config: Dict[str, Any],
    ) -> Any:
        """Execute an ART probe.

        Expects project-specific configuration:
        - ``model_config['art_estimator']``: name or handle of an ART estimator
        - ``model_config['art_attack']``: name of an ART attack to run

        Without these, this method raises a clear error to prompt the user
        to configure ART per the guidance in:
        https://github.com/Trusted-AI/adversarial-robustness-toolbox
        """
        estimator_name = model_config.get("art_estimator")
        attack_name = model_config.get("art_attack")

        if not estimator_name or not attack_name:
            raise RuntimeError(
                "ART estimator/attack not configured. "
                "Set 'art_estimator' and 'art_attack' in model_config "
                "to use ART with this model."
            )

        raise RuntimeError(
            f"ART execution hook not implemented for estimator={estimator_name}, "
            f"attack={attack_name}. Implement project-specific logic in "
            "ARTIntegration._execute_art_probe."
        )

    def _parse_art_results(self, art_result: Any, probe_name: str) -> Dict[str, Any]:
        """Parse ART results into normalized format."""
        try:
            return {
                "probe_name": probe_name,
                "passed": False,
                "findings": [
                    {
                        "message": "ART probe executed. "
                        "Project-specific parsing of results is required.",
                        "raw_result": str(art_result),
                    }
                ],
                "risk_level": "medium",
            }
        except Exception as e:  # pragma: no cover
            logger.warning("Error parsing ART results: %s", e)
            return {
                "probe_name": probe_name,
                "passed": False,
                "findings": [{"error": "Could not parse ART results"}],
                "risk_level": "medium",
                "raw_result": str(art_result),
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
        key = f"{model_name}_art_rate"
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


