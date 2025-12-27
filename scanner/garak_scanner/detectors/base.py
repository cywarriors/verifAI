"""Garak Detector base classes"""


class BaseDetector:
    """Base class for Garak detectors"""
    
    name: str = None
    description: str = None
    
    def detect(self, response: str, **kwargs) -> dict:
        """Detect vulnerabilities"""
        raise NotImplementedError
