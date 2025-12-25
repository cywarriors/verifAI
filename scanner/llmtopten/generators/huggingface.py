"""HuggingFace Generator - Following Garak framework architecture"""

import logging
import asyncio
from typing import List, Union, Optional
import os

from .base import Generator, Message, Conversation

logger = logging.getLogger(__name__)

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False
    logger.warning("Transformers library not installed. Install with: pip install transformers")


class HuggingFaceGenerator(Generator):
    """
    Generator for HuggingFace models (following Garak pattern).
    
    Supports local models via transformers library.
    """
    
    generator_family_name = "huggingface"
    
    def __init__(self, name: str = "", model_path: Optional[str] = None, device: str = "cpu", use_api: bool = False, api_key: Optional[str] = None):
        """
        Initialize HuggingFace generator
        
        Args:
            name: Model name (e.g., "gpt2", "meta-llama/Llama-2-7b-chat-hf")
            model_path: Optional local path to model (if different from name)
            device: Device to run model on ("cpu", "cuda", etc.)
            use_api: If True, use HuggingFace Inference API
            api_key: HuggingFace API key (required if use_api=True)
        """
        if not HUGGINGFACE_AVAILABLE:
            raise ImportError("Transformers library not installed. Install with: pip install transformers")
        
        super().__init__(name=name or model_path or "")
        
        self.model_name = name or model_path
        self.device = device
        self.use_api = use_api
        self.api_key = api_key or os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")
        
        if use_api and not self.api_key:
            raise ValueError("HuggingFace API key required when use_api=True. Set HUGGINGFACE_API_KEY or HF_TOKEN env var")
        
        if not use_api:
            # Load local model
            try:
                self.pipeline = pipeline(
                    "text-generation",
                    model=self.model_name,
                    device=device,
                    return_full_text=False
                )
                logger.info(f"Loaded HuggingFace model: {self.model_name}")
            except Exception as e:
                raise ValueError(f"Failed to load HuggingFace model {self.model_name}: {e}")
        else:
            self.pipeline = None
            import httpx
            self.client = httpx.AsyncClient(
                base_url="https://api-inference.huggingface.co",
                headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {},
                timeout=30.0
            )
        
        logger.info(f"Initialized HuggingFace generator: {self.model_name} (api={use_api})")
    
    async def _call_model_async(self, prompt: Conversation, generations_this_call: int = 1) -> List[Union[Message, None]]:
        """Async implementation of _call_model"""
        try:
            # Convert Conversation to text prompt (use last user message)
            prompt_text = ""
            for turn in prompt.turns:
                if turn.role == "user":
                    prompt_text = turn.content.text
            
            outputs = []
            
            if self.use_api:
                # Use HuggingFace Inference API
                for _ in range(generations_this_call):
                    response = await self.client.post(
                        f"/models/{self.model_name}",
                        json={
                            "inputs": prompt_text,
                            "parameters": {
                                "max_new_tokens": getattr(self, "max_tokens", 150),
                                "return_full_text": False
                            }
                        }
                    )
                    response.raise_for_status()
                    result = response.json()
                    if isinstance(result, list) and len(result) > 0:
                        output_text = result[0].get("generated_text", "")
                        outputs.append(Message(text=output_text) if output_text else None)
                    else:
                        outputs.append(None)
            else:
                # Use local pipeline
                for _ in range(generations_this_call):
                    result = await asyncio.to_thread(
                        self.pipeline,
                        prompt_text,
                        max_new_tokens=getattr(self, "max_tokens", 150),
                        num_return_sequences=1,
                        return_full_text=False
                    )
                    if result and len(result) > 0:
                        output_text = result[0].get("generated_text", "")
                        outputs.append(Message(text=output_text) if output_text else None)
                    else:
                        outputs.append(None)
            
            return outputs
            
        except Exception as e:
            logger.error(f"Error calling HuggingFace model: {e}", exc_info=True)
            return [None] * generations_this_call
    
    def _call_model(self, prompt: Conversation, generations_this_call: int = 1) -> List[Union[Message, None]]:
        """Call HuggingFace model (synchronous wrapper)"""
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
    
    async def close(self):
        """Close the client connection"""
        if self.use_api and hasattr(self, "client"):
            await self.client.aclose()

