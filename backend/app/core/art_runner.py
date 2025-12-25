"""ART runner for executing security probes"""

import asyncio
from typing import Dict, List, Optional

try:
    import art  # type: ignore
    ART_AVAILABLE = True
except ImportError:
    ART_AVAILABLE = False
    art = None  # type: ignore


class ARTRunner:
    """Wrapper for running ART (Adversarial Robustness Toolbox) security probes"""
    
    def __init__(self, model_name: str, model_type: str, model_config: Dict):
        self.model_name = model_name
        self.model_type = model_type
        self.model_config = model_config
        
        if not ART_AVAILABLE:
            raise ImportError(
                "Adversarial Robustness Toolbox (ART) is not installed. "
                "Install with: pip install adversarial-robustness-toolbox"
            )
    
    async def run_probe(self, probe_name: str, **kwargs) -> Dict:
        """Run a specific ART attack/probe
        
        Note: ART requires specific estimator setup. The scanner integration
        in scanner/art/ handles the actual ART usage with proper estimators.
        """
        if not ART_AVAILABLE:
            raise ImportError("ART is not available")
        
        # ART integration is handled by scanner/art/art_integration.py
        # This wrapper exists for consistency with GarakRunner
        # but actual ART usage requires estimator configuration
        
        return {
            "probe_name": probe_name,
            "status": "not_implemented",
            "error": "ART requires estimator setup. Use scanner.art.ARTIntegration instead."
        }
    
    async def run_all_probes(self, probe_list: Optional[List[str]] = None) -> List[Dict]:
        """Run all available probes or a subset"""
        if not ART_AVAILABLE:
            return []
        
        if probe_list is None:
            probe_list = []
        
        results = []
        for probe in probe_list:
            result = await self.run_probe(probe)
            results.append(result)
        
        return results

