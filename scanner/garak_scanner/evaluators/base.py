"""Garak Evaluator base classes"""


class BaseEvaluator:
    """Base class for Garak evaluators"""
    
    name: str = None
    description: str = None
    
    def evaluate(self, results: dict, **kwargs) -> dict:
        """Evaluate probe results"""
        raise NotImplementedError
