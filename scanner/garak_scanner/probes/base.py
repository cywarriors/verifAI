"""Garak Probe base classes"""


class BaseProbe:
    """Base class for Garak probes"""
    
    name: str = None
    category: str = None
    description: str = None
    
    def run(self, model_response: str, **kwargs) -> dict:
        """Run probe analysis"""
        raise NotImplementedError


class TextProbe(BaseProbe):
    """Base class for text-based probes"""
    pass
