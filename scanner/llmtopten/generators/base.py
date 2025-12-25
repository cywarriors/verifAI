"""Base Generator classes for LLMTopTen - Following Garak framework architecture

Generators wrap LLM models and provide a standard interface for generating responses.
This follows the garak.generators.base.Generator pattern.
"""

import logging
from typing import List, Optional, Union
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class Message:
    """Message object representing a single message in a conversation (Garak pattern)"""
    
    def __init__(self, text: str, lang: Optional[str] = None):
        self.text = text
        self.lang = lang or "*"
    
    def as_dict(self):
        """Convert to dictionary"""
        return {
            "text": self.text,
            "lang": self.lang
        }


class Turn:
    """Turn object representing a role and message (Garak pattern)"""
    
    def __init__(self, role: str, content: Message):
        self.role = role  # "system", "user", "assistant"
        self.content = content


class Conversation:
    """Conversation object representing a sequence of turns (Garak pattern)"""
    
    def __init__(self, turns: Optional[List[Turn]] = None):
        self.turns = turns or []
    
    @classmethod
    def from_string(cls, prompt: str, system_prompt: Optional[str] = None) -> "Conversation":
        """Create a Conversation from a simple string prompt"""
        turns = []
        if system_prompt:
            turns.append(Turn("system", Message(system_prompt)))
        turns.append(Turn("user", Message(prompt)))
        return cls(turns=turns)
    
    def as_dict(self):
        """Convert to dictionary"""
        return {
            "turns": [
                {
                    "role": turn.role,
                    "content": turn.content.as_dict()
                }
                for turn in self.turns
            ]
        }


class Generator(ABC):
    """
    Base class for generators that wrap LLM models (following Garak pattern).
    
    Generators provide a standard interface for generating text responses from
    prompts, abstracting away the details of different model providers.
    """
    
    def __init__(self, name: str = ""):
        """
        Initialize generator
        
        Args:
            name: Name identifier for this generator
        """
        self.name = name
        self.generator_family_name = None
        self.fullname = name
        logger.debug(f"Initialized generator: {name}")
    
    @abstractmethod
    def _call_model(self, prompt: Conversation, generations_this_call: int = 1) -> List[Union[Message, None]]:
        """
        Call the underlying model API (to be implemented by subclasses).
        
        Args:
            prompt: Conversation object with turns
            generations_this_call: Number of generations to request
            
        Returns:
            List of Message objects (or None for failures)
        """
        raise NotImplementedError
    
    def generate(self, prompt: Union[str, Conversation], generations_this_call: int = 1) -> List[Union[Message, None]]:
        """
        Generate responses from the model (main interface method).
        
        Args:
            prompt: Either a string or Conversation object
            generations_this_call: Number of generations to request
            
        Returns:
            List of Message objects (or None for failures)
        """
        # Convert string to Conversation if needed
        if isinstance(prompt, str):
            prompt = Conversation.from_string(prompt)
        
        # Call the model
        outputs = self._call_model(prompt, generations_this_call)
        
        return outputs
    
    def clear_history(self):
        """Clear any conversation history (for stateful models)"""
        pass


class ModelConnectorGenerator(Generator):
    """
    Generator that wraps the existing ModelConnector class.
    
    This bridges the existing ModelConnector with the Garak Generator pattern.
    """
    
    def __init__(self, model_name: str, model_type: str, model_config: dict, name: str = ""):
        """
        Initialize generator with ModelConnector
        
        Args:
            model_name: Name of the model
            model_type: Type of model provider
            model_config: Configuration dictionary
            name: Optional name identifier
        """
        from scanner.model_connector import ModelConnector
        
        generator_name = name or f"{model_type}:{model_name}"
        super().__init__(name=generator_name)
        
        self.model_name = model_name
        self.model_type = model_type
        self.model_config = model_config
        self.generator_family_name = model_type
        self.fullname = f"{model_type}:{model_name}"
        
        # Initialize ModelConnector (async, but we'll handle it in _call_model)
        self.connector = ModelConnector(
            model_name=model_name,
            model_type=model_type,
            model_config=model_config
        )
        logger.debug(f"Initialized ModelConnectorGenerator: {self.fullname}")
    
    async def _call_model_async(self, prompt: Conversation, generations_this_call: int = 1) -> List[Union[Message, None]]:
        """Async version of _call_model"""
        try:
            # Convert Conversation to string (use last user message)
            prompt_text = ""
            for turn in prompt.turns:
                if turn.role == "user":
                    prompt_text = turn.content.text
                elif turn.role == "system":
                    # Could prepend system prompt if connector supports it
                    pass
            
            # Call ModelConnector
            response_text = await self.connector.generate(prompt_text)
            
            # Convert to Message objects
            if response_text:
                return [Message(text=response_text)]
            else:
                return [None]
                
        except Exception as e:
            logger.error(f"Error in ModelConnectorGenerator._call_model_async: {e}", exc_info=True)
            return [None]
    
    def _call_model(self, prompt: Conversation, generations_this_call: int = 1) -> List[Union[Message, None]]:
        """
        Call the model via ModelConnector (synchronous wrapper).
        
        Note: This runs async code synchronously, which works but may block.
        For async usage, use _call_model_async directly.
        """
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is running, we need to use a different approach
                # For now, create a new event loop (not ideal but works)
                import nest_asyncio
                try:
                    nest_asyncio.apply()
                except ImportError:
                    logger.warning("nest_asyncio not available, may have issues with async in sync context")
            return loop.run_until_complete(self._call_model_async(prompt, generations_this_call))
        except RuntimeError:
            # No event loop, create one
            return asyncio.run(self._call_model_async(prompt, generations_this_call))
    
    async def generate_async(self, prompt: Union[str, Conversation], generations_this_call: int = 1) -> List[Union[Message, None]]:
        """Async version of generate()"""
        if isinstance(prompt, str):
            prompt = Conversation.from_string(prompt)
        return await self._call_model_async(prompt, generations_this_call)
    
    async def close(self):
        """Close the connector"""
        if hasattr(self.connector, "close"):
            await self.connector.close()

