"""OpenAI API Generator - Following Garak framework architecture"""

import logging
import asyncio
from typing import List, Union, Optional
import os

from .base import Generator, Message, Conversation

logger = logging.getLogger(__name__)

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI library not installed. Install with: pip install openai")


class OpenAIGenerator(Generator):
    """
    Generator for OpenAI API models (following Garak pattern).
    
    Supports both chat and completion models.
    """
    
    generator_family_name = "openai"
    
    def __init__(self, name: str = "", api_key: Optional[str] = None):
        """
        Initialize OpenAI generator
        
        Args:
            name: Model name (e.g., "gpt-4", "gpt-3.5-turbo")
            api_key: OpenAI API key (or use OPENAI_API_KEY env var)
        """
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI library not installed. Install with: pip install openai")
        
        super().__init__(name=name)
        
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key required. Set OPENAI_API_KEY env var or pass api_key parameter")
        
        self.client = openai.AsyncOpenAI(api_key=self.api_key)
        
        # Determine if model is chat or completion model
        self.is_chat_model = self._is_chat_model(name)
        
        logger.info(f"Initialized OpenAI generator: {name}")
    
    def _is_chat_model(self, model_name: str) -> bool:
        """Check if model is a chat model"""
        chat_indicators = ["gpt-4", "gpt-3.5-turbo", "o1", "o3"]
        return any(indicator in model_name.lower() for indicator in chat_indicators)
    
    async def _call_model_async(self, prompt: Conversation, generations_this_call: int = 1) -> List[Union[Message, None]]:
        """Async implementation of _call_model"""
        try:
            # Convert Conversation to OpenAI format
            messages = []
            for turn in prompt.turns:
                messages.append({
                    "role": turn.role,
                    "content": turn.content.text
                })
            
            outputs = []
            for _ in range(generations_this_call):
                if self.is_chat_model:
                    response = await self.client.chat.completions.create(
                        model=self.name,
                        messages=messages,
                        max_tokens=self.max_tokens if hasattr(self, "max_tokens") else 150
                    )
                    output_text = response.choices[0].message.content
                else:
                    # Completion model
                    prompt_text = "\n".join([msg["content"] for msg in messages])
                    response = await self.client.completions.create(
                        model=self.name,
                        prompt=prompt_text,
                        max_tokens=self.max_tokens if hasattr(self, "max_tokens") else 150
                    )
                    output_text = response.choices[0].text
                
                if output_text:
                    outputs.append(Message(text=output_text))
                else:
                    outputs.append(None)
            
            return outputs
            
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}", exc_info=True)
            return [None] * generations_this_call
    
    def _call_model(self, prompt: Conversation, generations_this_call: int = 1) -> List[Union[Message, None]]:
        """Call OpenAI API (synchronous wrapper)"""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import nest_asyncio
                try:
                    nest_asyncio.apply()
                except ImportError:
                    logger.warning("nest_asyncio not available, may have issues with async in sync context")
            return loop.run_until_complete(self._call_model_async(prompt, generations_this_call))
        except RuntimeError:
            return asyncio.run(self._call_model_async(prompt, generations_this_call))
    
    async def generate_async(self, prompt: Union[str, Conversation], generations_this_call: int = 1) -> List[Union[Message, None]]:
        """Async version of generate()"""
        if isinstance(prompt, str):
            prompt = Conversation.from_string(prompt)
        return await self._call_model_async(prompt, generations_this_call)


