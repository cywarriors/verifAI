"""Configuration management for Counterfit integration."""

import os
from typing import Dict, Optional
from pathlib import Path
import yaml
import logging

logger = logging.getLogger(__name__)


class CounterfitConfig:
    """Configuration for Counterfit integration."""

    def __init__(self, config_path: Optional[Path] = None):
        self.config = self._load_config(config_path)

    def _load_config(self, config_path: Optional[Path]) -> Dict:
        config = self._default_config()

        # Try to load from shared scanner YAML
        if config_path and config_path.exists():
            try:
                with open(config_path, "r") as f:
                    file_config = yaml.safe_load(f)
                    if file_config and "counterfit" in file_config:
                        config.update(file_config["counterfit"])
            except Exception as e:  # pragma: no cover - defensive
                logger.warning("Error loading Counterfit config from %s: %s", config_path, e)

        # Environment overrides (prefix: COUNTERFIT_)
        config["enabled"] = (
            os.getenv("COUNTERFIT_ENABLED", str(config["enabled"])).lower() == "true"
        )
        config["timeout"] = int(os.getenv("COUNTERFIT_TIMEOUT", config["timeout"]))
        config["max_concurrent"] = int(
            os.getenv("COUNTERFIT_MAX_CONCURRENT", config["max_concurrent"])
        )
        config["retry_attempts"] = int(
            os.getenv("COUNTERFIT_RETRY_ATTEMPTS", config["retry_attempts"])
        )
        config["retry_delay"] = float(
            os.getenv("COUNTERFIT_RETRY_DELAY", config["retry_delay"])
        )
        config["cache_enabled"] = (
            os.getenv("COUNTERFIT_CACHE_ENABLED", str(config["cache_enabled"])).lower()
            == "true"
        )
        config["cache_ttl"] = int(os.getenv("COUNTERFIT_CACHE_TTL", config["cache_ttl"]))
        config["rate_limit_per_minute"] = int(
            os.getenv(
                "COUNTERFIT_RATE_LIMIT_PER_MINUTE",
                config["rate_limit_per_minute"],
            )
        )

        config["circuit_breaker_threshold"] = int(
            os.getenv(
                "COUNTERFIT_CIRCUIT_BREAKER_THRESHOLD",
                config["circuit_breaker_threshold"],
            )
        )
        config["circuit_breaker_timeout"] = int(
            os.getenv(
                "COUNTERFIT_CIRCUIT_BREAKER_TIMEOUT",
                config["circuit_breaker_timeout"],
            )
        )

        return config

    def _default_config(self) -> Dict:
        """Default configuration values."""
        return {
            "enabled": False,
            "timeout": 60,
            "max_concurrent": 2,
            "retry_attempts": 1,
            "retry_delay": 1.0,
            "cache_enabled": True,
            "cache_ttl": 3600,
            "rate_limit_per_minute": 30,
            "circuit_breaker_threshold": 5,
            "circuit_breaker_timeout": 60,
        }

    @property
    def enabled(self) -> bool:
        return self.config.get("enabled", False)

    @property
    def timeout(self) -> int:
        return self.config.get("timeout", 60)

    @property
    def max_concurrent(self) -> int:
        return self.config.get("max_concurrent", 2)

    @property
    def retry_attempts(self) -> int:
        return self.config.get("retry_attempts", 1)

    @property
    def retry_delay(self) -> float:
        return self.config.get("retry_delay", 1.0)

    @property
    def cache_enabled(self) -> bool:
        return self.config.get("cache_enabled", True)

    @property
    def cache_ttl(self) -> int:
        return self.config.get("cache_ttl", 3600)

    @property
    def rate_limit_per_minute(self) -> int:
        return self.config.get("rate_limit_per_minute", 30)

    @property
    def circuit_breaker_threshold(self) -> int:
        return self.config.get("circuit_breaker_threshold", 5)

    @property
    def circuit_breaker_timeout(self) -> int:
        return self.config.get("circuit_breaker_timeout", 60)


