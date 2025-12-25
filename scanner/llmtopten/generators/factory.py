"""LLM Generator Factory - Creates LLM-specific generators for OWASP LLM Top 10 probes"""

import logging
from typing import Dict, Optional

from .base import Generator
from .openai import OpenAIGenerator
from .anthropic import AnthropicGenerator
from .huggingface import HuggingFaceGenerator

logger = logging.getLogger(__name__)


class LLMGeneratorFactory:
    """
    Factory for creating LLM-specific generators for OWASP LLM Top 10 probes.
    
    This factory creates generators optimized for LLM security testing.
    """
    
    @staticmethod
    def create_generator(
        model_type: str,
        model_name: str,
        model_config: Optional[Dict] = None,
        probe_category: Optional[str] = None  # Should be "owasp_llm_top10" for LLMTopTen
    ) -> Generator:
        """
        Create a generator for LLM Top 10 probes.
        
        Args:
            model_type: Type of model provider ("openai", "anthropic", "huggingface", "local")
            model_name: Name of the model
            model_config: Configuration dictionary with API keys, etc.
            probe_category: Should be "owasp_llm_top10" (used for validation)
            
        Returns:
            Generator instance configured for LLM security testing
        """
        model_config = model_config or {}
        
        logger.info(f"Creating LLM generator for {model_type}/{model_name} (category: {probe_category or 'default'})")
        
        if model_type == "openai":
            api_key = model_config.get("api_key") or model_config.get("openai_api_key")
            return OpenAIGenerator(name=model_name, api_key=api_key)
        
        elif model_type == "anthropic":
            api_key = model_config.get("api_key") or model_config.get("anthropic_api_key")
            return AnthropicGenerator(name=model_name, api_key=api_key)
        
        elif model_type == "huggingface":
            device = model_config.get("device", "cpu")
            use_api = model_config.get("use_api", False)
            api_key = model_config.get("api_key") or model_config.get("hf_token") or model_config.get("huggingface_token")
            model_path = model_config.get("model_path")
            return HuggingFaceGenerator(
                name=model_name,
                model_path=model_path,
                device=device,
                use_api=use_api,
                api_key=api_key
            )
        
        elif model_type == "local":
            logger.warning(f"Local model type not yet fully supported, using HuggingFace generator")
            return HuggingFaceGenerator(name=model_name, device=model_config.get("device", "cpu"))
        
        else:
            raise ValueError(f"Unsupported LLM model type: {model_type}. Supported types: openai, anthropic, huggingface, local")

