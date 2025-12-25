"""Result caching for AgentTopTen probes"""

import hashlib
import json
import time
from typing import Dict, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AgentTopTenCache:
    """Cache for AgentTopTen probe results"""

    def __init__(self, ttl: int = 3600, max_size: int = 1000):
        """
        Initialize cache

        Args:
            ttl: Time-to-live in seconds
            max_size: Maximum cache entries
        """
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl
        self.max_size = max_size
        self.hits = 0
        self.misses = 0

    def _generate_key(
        self,
        probe_name: str,
        model_name: str,
        model_type: str,
        model_config: Dict,
    ) -> str:
        """Generate cache key from probe and model parameters"""
        # Create a stable hash from parameters
        key_data = {
            "probe": probe_name,
            "model": model_name,
            "type": model_type,
            "config": json.dumps(model_config, sort_keys=True),
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.sha256(key_string.encode()).hexdigest()

    def get(
        self,
        probe_name: str,
        model_name: str,
        model_type: str,
        model_config: Dict,
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached result

        Args:
            probe_name: Probe name
            model_name: Model name
            model_type: Model type
            model_config: Model configuration

        Returns:
            Cached result or None if not found/expired
        """
        key = self._generate_key(probe_name, model_name, model_type, model_config)

        if key not in self.cache:
            self.misses += 1
            return None

        entry = self.cache[key]

        # Check if expired
        if time.time() > entry["expires_at"]:
            del self.cache[key]
            self.misses += 1
            return None

        self.hits += 1
        logger.debug(f"Cache hit for probe {probe_name}")
        return entry["result"]

    def set(
        self,
        probe_name: str,
        model_name: str,
        model_type: str,
        model_config: Dict,
        result: Dict[str, Any],
    ) -> None:
        """
        Cache a result

        Args:
            probe_name: Probe name
            model_name: Model name
            model_type: Model type
            model_config: Model configuration
            result: Result to cache
        """
        # Evict if cache is full
        if len(self.cache) >= self.max_size:
            # Remove oldest entry
            oldest_key = min(
                self.cache.keys(),
                key=lambda k: self.cache[k]["expires_at"],
            )
            del self.cache[oldest_key]
            logger.debug(f"Cache evicted entry for {oldest_key[:8]}")

        key = self._generate_key(probe_name, model_name, model_type, model_config)

        self.cache[key] = {
            "result": result,
            "expires_at": time.time() + self.ttl,
            "cached_at": datetime.utcnow().isoformat(),
        }

        logger.debug(f"Cached result for probe {probe_name}")

    def clear(self) -> None:
        """Clear all cached entries"""
        self.cache.clear()
        logger.info("AgentTopTen cache cleared")

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total = self.hits + self.misses
        hit_rate = self.hits / total if total > 0 else 0.0

        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": hit_rate,
            "ttl": self.ttl,
        }


