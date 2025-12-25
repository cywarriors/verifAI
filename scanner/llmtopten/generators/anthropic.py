"""Anthropic Claude API Generator - Following Garak framework architecture"""

import logging
import asyncio
from typing import List, Union, Optional
import os

from .base import Generator, Message, Conversation

logger = logging.getLogger(__name__)

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    logger.warning("Anthropic library not installed. Install with: pip install anthropic")


class AnthropicGenerator(Generator):
    """
    Generator for Anthropic Claude API models (following Garak pattern).
    """
    
    generator_family_name = "anthropic"
    
    def __init__(self, name: str = "", api_key: Optional[str] = None):
        """
        Initialize Anthropic generator
        
        Args:
            name: Model name (e.g., "claude-3-opus-20240229", "claude-3-sonnet-20240229")
            api_key: Anthropic API key (or use ANTHROPIC_API_KEY env var)
        """
        if not ANTHROPIC_AVAILABLE:
            raise ImportError("Anthropic library not installed. Install with: pip install anthropic")
        
        super().__init__(name=name)
        
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key required. Set ANTHROPIC_API_KEY env var or pass api_key parameter")
        
        self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
        
        logger.info(f"Initialized Anthropic generator: {name}")
    
    async def _call_model_async(self, prompt: Conversation, generations_this_call: int = 1) -> List[Union[Message, None]]:
        """Async implementation of _call_model"""
        try:
            # Convert Conversation to Anthropic format
            messages = []
            system_prompt = None
            
            for turn in prompt.turns:
                if turn.role == "system":
                    system_prompt = turn.content.text
                elif turn.role == "user":
                    messages.append({
                        "role": "user",
                        "content": turn.content.text
                    })
                elif turn.role == "assistant":
                    messages.append({
                        "role": "assistant",
                        "content": turn.content.text
                    })
            
            outputs = []
            for _ in range(generations_this_call):
                response = await self.client.messages.create(
                    model=self.name,
                    max_tokens=self.max_tokens if hasattr(self, "max_tokens") else 1024,
                    system=system_prompt if system_prompt else None,
                    messages=messages
                )
                
                if response.content and len(response.content) > 0:
                    output_text = response.content[0].text
                    outputs.append(Message(text=output_text))
                else:
                    outputs.append(None)
            
            return outputs
            
        except Exception as e:
            logger.error(f"Error calling Anthropic API: {e}", exc_info=True)
            return [None] * generations_this_call
    
    def _call_model(self, prompt: Conversation, generations_this_call: int = 1) -> List[Union[Message, None]]:
        """Call Anthropic API (synchronous wrapper)"""
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

