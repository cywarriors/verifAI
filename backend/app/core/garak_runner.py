"""Garak runner for executing security probes"""

import asyncio
from typing import Dict, List, Optional
from pathlib import Path

try:
    import garak
    # Try to import garak components - API structure may vary by version
    try:
        from garak import _config
    except ImportError:
        _config = None
    try:
        from garak.run import run
    except ImportError:
        # Note: Garak API structure has changed in newer versions
        # The scanner integration in scanner/garak/ handles the actual garak usage
        run = None
    GARAK_AVAILABLE = True
except ImportError:
    GARAK_AVAILABLE = False
    _config = None
    run = None


class GarakRunner:
    """Wrapper for running Garak security probes"""
    
    def __init__(self, model_name: str, model_type: str, model_config: Dict):
        self.model_name = model_name
        self.model_type = model_type
        self.model_config = model_config
        
        if not GARAK_AVAILABLE:
            raise ImportError("Garak is not installed. Cannot run probes.")
    
    async def run_probe(self, probe_name: str, **kwargs) -> Dict:
        """Run a specific Garak probe"""
        if not GARAK_AVAILABLE:
            raise ImportError("Garak is not available")
        
        # Configure Garak
        _config.model_type = self.model_type
        _config.model_name = self.model_name
        
        # Map model config to Garak format
        if self.model_type == "openai":
            _config.plugins.model_spec = f"openai/{self.model_name}"
            if "api_key" in self.model_config:
                _config.plugins.model_spec += f":{self.model_config['api_key']}"
        
        # Run the probe
        try:
            results = await asyncio.to_thread(
                run,
                model_type=self.model_type,
                model_name=self.model_name,
                probes=[probe_name],
                **kwargs
            )
            
            return {
                "probe_name": probe_name,
                "status": "completed",
                "results": results
            }
        except Exception as e:
            return {
                "probe_name": probe_name,
                "status": "failed",
                "error": str(e)
            }
    
    async def run_all_probes(self, probe_list: Optional[List[str]] = None) -> List[Dict]:
        """Run all available probes or a subset"""
        if not GARAK_AVAILABLE:
            return []
        
        if probe_list is None:
            # Get default probe list from Garak
            probe_list = []
        
        results = []
        for probe in probe_list:
            result = await self.run_probe(probe)
            results.append(result)
        
        return results

