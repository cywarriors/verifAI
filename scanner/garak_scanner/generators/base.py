"""Garak Generator base classes"""


class BaseGenerator:
    """Base class for Garak generators"""
    
    name: str = None
    description: str = None
    
    def generate(self, prompt: str, **kwargs) -> list:
        """Generate test payloads"""
        raise NotImplementedError


class TextGenerator(BaseGenerator):
    """Base class for text generators"""
    pass
