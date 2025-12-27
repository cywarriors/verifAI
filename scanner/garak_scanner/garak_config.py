"""Garak Scanner Configuration"""

import os
from typing import Optional, Dict, Any


class GarakConfig:
    """Configuration for Garak security scanner"""
    
    def __init__(
        self,
        enabled: bool = True,
        timeout: int = 60,
        max_concurrent: int = 3,
        retry_attempts: int = 2,
        cache_enabled: bool = True,
        cache_ttl: int = 3600,
        circuit_breaker_threshold: int = 5,
        circuit_breaker_timeout: int = 60,
        rate_limit_per_minute: int = 60,
        log_level: str = "INFO",
    ):
        """
        Initialize Garak configuration
        
        Args:
            enabled: Whether Garak scanner is enabled
            timeout: Default probe timeout in seconds
            max_concurrent: Max concurrent probes to run
            retry_attempts: Number of retry attempts for failed probes
            cache_enabled: Enable result caching
            cache_ttl: Cache time-to-live in seconds
            circuit_breaker_threshold: Failures before circuit opens
            circuit_breaker_timeout: Circuit breaker timeout in seconds
            rate_limit_per_minute: Rate limit per minute
            log_level: Logging level
        """
        self.enabled = enabled
        self.timeout = timeout
        self.max_concurrent = max_concurrent
        self.retry_attempts = retry_attempts
        self.cache_enabled = cache_enabled
        self.cache_ttl = cache_ttl
        self.circuit_breaker_threshold = circuit_breaker_threshold
        self.circuit_breaker_timeout = circuit_breaker_timeout
        self.rate_limit_per_minute = rate_limit_per_minute
        self.log_level = log_level
        
    @classmethod
    def from_env(cls) -> "GarakConfig":
        """Load configuration from environment variables"""
        return cls(
            enabled=os.getenv("GARAK_ENABLED", "true").lower() == "true",
            timeout=int(os.getenv("GARAK_TIMEOUT", "60")),
            max_concurrent=int(os.getenv("GARAK_MAX_CONCURRENT", "3")),
            retry_attempts=int(os.getenv("GARAK_RETRY_ATTEMPTS", "2")),
            cache_enabled=os.getenv("GARAK_CACHE_ENABLED", "true").lower() == "true",
            cache_ttl=int(os.getenv("GARAK_CACHE_TTL", "3600")),
            circuit_breaker_threshold=int(os.getenv("GARAK_CIRCUIT_BREAKER_THRESHOLD", "5")),
            circuit_breaker_timeout=int(os.getenv("GARAK_CIRCUIT_BREAKER_TIMEOUT", "60")),
            rate_limit_per_minute=int(os.getenv("GARAK_RATE_LIMIT_PER_MINUTE", "60")),
            log_level=os.getenv("GARAK_LOG_LEVEL", "INFO"),
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary"""
        return {
            "enabled": self.enabled,
            "timeout": self.timeout,
            "max_concurrent": self.max_concurrent,
            "retry_attempts": self.retry_attempts,
            "cache_enabled": self.cache_enabled,
            "cache_ttl": self.cache_ttl,
            "circuit_breaker_threshold": self.circuit_breaker_threshold,
            "circuit_breaker_timeout": self.circuit_breaker_timeout,
            "rate_limit_per_minute": self.rate_limit_per_minute,
            "log_level": self.log_level,
        }
