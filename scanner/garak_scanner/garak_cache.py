"""Garak Scanner Result Caching"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import json
import hashlib


class GarakCache:
    """LRU cache for Garak probe results"""
    
    def __init__(self, ttl: int = 3600, max_size: int = 1000):
        """
        Initialize cache
        
        Args:
            ttl: Time-to-live for cache entries in seconds
            max_size: Maximum number of entries in cache
        """
        self.ttl = ttl
        self.max_size = max_size
        self.cache: Dict[str, Dict[str, Any]] = {}
    
    def _generate_key(self, probe_name: str, model: str, config: Dict) -> str:
        """Generate cache key from probe, model, and config"""
        key_data = f"{probe_name}:{model}:{json.dumps(config, sort_keys=True)}"
        return hashlib.sha256(key_data.encode()).hexdigest()
    
    def get(self, probe_name: str, model: str, config: Dict) -> Optional[Dict[str, Any]]:
        """Get cached result if available and not expired"""
        key = self._generate_key(probe_name, model, config)
        
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        
        # Check if entry has expired
        created_at = datetime.fromisoformat(entry["created_at"])
        if datetime.now() - created_at > timedelta(seconds=self.ttl):
            del self.cache[key]
            return None
        
        return entry["result"]
    
    def set(self, probe_name: str, model: str, config: Dict, result: Dict[str, Any]) -> None:
        """Cache a probe result"""
        key = self._generate_key(probe_name, model, config)
        
        # Remove oldest entry if cache is full
        if len(self.cache) >= self.max_size:
            oldest_key = min(
                self.cache.keys(),
                key=lambda k: self.cache[k]["created_at"]
            )
            del self.cache[oldest_key]
        
        self.cache[key] = {
            "created_at": datetime.now().isoformat(),
            "result": result
        }
    
    def clear(self) -> None:
        """Clear all cache entries"""
        self.cache.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "ttl": self.ttl,
        }
