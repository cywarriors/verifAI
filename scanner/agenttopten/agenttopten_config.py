"""Configuration management for AgentTopTen integration"""

import os
from typing import Dict, Optional
from pathlib import Path
import yaml
import logging

logger = logging.getLogger(__name__)


class AgentTopTenConfig:
    """Configuration for AgentTopTen integration (OWASP Agentic AI Top 10)"""

    def __init__(self, config_path: Optional[Path] = None):
        """
        Initialize AgentTopTen configuration

        Args:
            config_path: Optional path to config YAML file
        """
        self.config_key = "agenttopten"
        self.config = self._load_config(config_path)

    def _load_config(self, config_path: Optional[Path]) -> Dict:
        """Load configuration from file or environment"""
        config = self._default_config()

        # Try to load from YAML file
        if config_path and config_path.exists():
            try:
                with open(config_path, "r") as f:
                    file_config = yaml.safe_load(f)
                    if file_config and self.config_key in file_config:
                        config.update(file_config[self.config_key])
            except Exception as e:
                logger.warning(f"Error loading {self.config_key} config from {config_path}: {e}")

        # Override with environment variables
        env_prefix = self.config_key.upper()
        config["enabled"] = (
            os.getenv(f"{env_prefix}_ENABLED", str(config["enabled"])).lower() == "true"
        )
        config["timeout"] = int(os.getenv(f"{env_prefix}_TIMEOUT", config["timeout"]))
        config["max_concurrent"] = int(
            os.getenv(f"{env_prefix}_MAX_CONCURRENT", config["max_concurrent"])
        )
        config["retry_attempts"] = int(
            os.getenv(f"{env_prefix}_RETRY_ATTEMPTS", config["retry_attempts"])
        )
        config["retry_delay"] = float(
            os.getenv(f"{env_prefix}_RETRY_DELAY", config["retry_delay"])
        )
        config["cache_enabled"] = (
            os.getenv(f"{env_prefix}_CACHE_ENABLED", str(config["cache_enabled"])).lower()
            == "true"
        )
        config["cache_ttl"] = int(os.getenv(f"{env_prefix}_CACHE_TTL", config["cache_ttl"]))
        config["rate_limit_per_minute"] = int(
            os.getenv(f"{env_prefix}_RATE_LIMIT_PER_MINUTE", config["rate_limit_per_minute"])
        )

        return config

    def _default_config(self) -> Dict:
        """Default configuration values"""
        return {
            "enabled": True,
            "timeout": 120,
            "max_concurrent": 3,
            "retry_attempts": 2,
            "retry_delay": 1.0,
            "cache_enabled": True,
            "cache_ttl": 3600,
            "rate_limit_per_minute": 60,
            "circuit_breaker_threshold": 10,
            "circuit_breaker_timeout": 30,
        }

    @property
    def enabled(self) -> bool:
        """Check if scanner is enabled"""
        return self.config.get("enabled", True)

    @property
    def timeout(self) -> int:
        """Get probe timeout"""
        return self.config.get("timeout", 120)

    @property
    def max_concurrent(self) -> int:
        """Get max concurrent probes"""
        return self.config.get("max_concurrent", 3)

    @property
    def retry_attempts(self) -> int:
        """Get retry attempts"""
        return self.config.get("retry_attempts", 2)

    @property
    def retry_delay(self) -> float:
        """Get retry delay"""
        return self.config.get("retry_delay", 1.0)

    @property
    def cache_enabled(self) -> bool:
        """Check if caching is enabled"""
        return self.config.get("cache_enabled", True)

    @property
    def cache_ttl(self) -> int:
        """Get cache TTL"""
        return self.config.get("cache_ttl", 3600)

    @property
    def rate_limit_per_minute(self) -> int:
        """Get rate limit"""
        return self.config.get("rate_limit_per_minute", 60)

    @property
    def circuit_breaker_threshold(self) -> int:
        """Get circuit breaker threshold"""
        return self.config.get("circuit_breaker_threshold", 10)

    @property
    def circuit_breaker_timeout(self) -> int:
        """Get circuit breaker timeout"""
        return self.config.get("circuit_breaker_timeout", 30)
