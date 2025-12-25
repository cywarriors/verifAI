"""Model connector for interacting with different LLM providers"""

import logging
from typing import Dict, Optional, Any
import httpx
import asyncio

logger = logging.getLogger(__name__)


class ModelConnector:
    """Connector for different LLM model types"""
    
    def __init__(self, model_name: str, model_type: str, model_config: Dict):
        """
        Initialize model connector
        
        Args:
            model_name: Name of the model (e.g., "gpt-4", "claude-3")
            model_type: Type of model provider ("openai", "anthropic", "huggingface", "local")
            model_config: Configuration dict with API keys, endpoints, etc.
        """
        self.model_name = model_name
        self.model_type = model_type
        self.model_config = model_config
        self.client = None
        
        self._initialize_client()
    
    def _initialize_client(self) -> None:
        """Initialize the appropriate client based on model type"""
        if self.model_type == "openai":
            try:
                import openai
                api_key = self.model_config.get("api_key") or self.model_config.get("openai_api_key")
                if api_key:
                    self.client = openai.AsyncOpenAI(api_key=api_key)
                else:
                    logger.warning("OpenAI API key not provided")
            except ImportError:
                logger.warning("OpenAI library not installed")
        
        elif self.model_type == "anthropic":
            try:
                import anthropic
                api_key = self.model_config.get("api_key") or self.model_config.get("anthropic_api_key")
                if api_key:
                    self.client = anthropic.AsyncAnthropic(api_key=api_key)
                else:
                    logger.warning("Anthropic API key not provided")
            except ImportError:
                logger.warning("Anthropic library not installed")
        
        elif self.model_type == "huggingface":
            # HuggingFace models use transformers
            try:
                from transformers import pipeline
                try:
                    # Try to initialize the pipeline - this may fail for invalid model names
                    self.client = pipeline(
                        "text-generation",
                        model=self.model_name,
                        device=self.model_config.get("device", "cpu"),
                        return_full_text=False  # Only return generated text, not input
                    )
                    logger.info(f"HuggingFace model '{self.model_name}' initialized successfully")
                except (OSError, ValueError, Exception) as e:
                    error_msg = str(e)
                    if "not a valid model identifier" in error_msg or "Repository Not Found" in error_msg:
                        raise ValueError(
                            f"Invalid HuggingFace model name: '{self.model_name}'. "
                            f"Please check that the model exists on HuggingFace Hub. "
                            f"Error: {error_msg}"
                        )
                    elif "authentication" in error_msg.lower() or "401" in error_msg:
                        raise ValueError(
                            f"Authentication required for HuggingFace model '{self.model_name}'. "
                            f"Please provide a HuggingFace token in model_config with key 'hf_token' or 'huggingface_token'"
                        )
                    else:
                        raise ValueError(
                            f"Failed to load HuggingFace model '{self.model_name}': {error_msg}"
                        )
            except ImportError:
                logger.warning("Transformers library not installed")
                raise ValueError(
                    "Transformers library is required for HuggingFace models. "
                    "Install with: pip install transformers"
                )
        
        elif self.model_type == "local":
            # Local model - could be Ollama, local server, etc.
            self.base_url = self.model_config.get("base_url", "http://localhost:11434")
            self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate a response from the model
        
        Args:
            prompt: Input prompt
            **kwargs: Additional generation parameters
            
        Returns:
            Model response text
        """
        try:
            if self.model_type == "openai" and self.client:
                response = await self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    **kwargs
                )
                return response.choices[0].message.content
            
            elif self.model_type == "anthropic" and self.client:
                response = await self.client.messages.create(
                    model=self.model_name,
                    max_tokens=kwargs.get("max_tokens", 1024),
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text
            
            elif self.model_type == "huggingface" and self.client:
                # Synchronous call - wrap in executor
                result = await asyncio.to_thread(
                    self.client,
                    prompt,
                    max_length=kwargs.get("max_length", 512),
                    num_return_sequences=1
                )
                return result[0]["generated_text"]
            
            elif self.model_type == "local":
                # Try Ollama format
                response = await self.client.post(
                    "/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        **kwargs
                    }
                )
                if response.status_code == 200:
                    return response.json().get("response", "")
                else:
                    raise Exception(f"Local model error: {response.status_code}")
            
            else:
                raise ValueError(f"Unsupported model type: {self.model_type}")
                
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            raise
    
    async def close(self) -> None:
        """Close the client connection"""
        if hasattr(self.client, "close"):
            if asyncio.iscoroutinefunction(self.client.close):
                await self.client.close()
            else:
                self.client.close()

