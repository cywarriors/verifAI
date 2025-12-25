"""Agent Generator Factory - Creates agent-specific generators for OWASP Agentic AI Top 10 probes"""

import logging
from typing import Dict, Optional

from .base import Generator
from .openai import OpenAIGenerator
from .anthropic import AnthropicGenerator
from .huggingface import HuggingFaceGenerator

logger = logging.getLogger(__name__)


class AgentGeneratorFactory:
    """
    Factory for creating agent-specific generators for OWASP Agentic AI Top 10 probes.
    
    This factory creates generators optimized for agent security testing.
    """
    
    @staticmethod
    def create_generator(
        model_type: str,
        model_name: str,
        model_config: Optional[Dict] = None,
        probe_category: Optional[str] = None  # Should be "owasp_agentic_top10" for AgentTopTen
    ) -> Generator:
        """
        Create a generator for Agentic AI Top 10 probes.
        
        Args:
            model_type: Type of model provider ("openai", "anthropic", "huggingface", "local")
            model_name: Name of the model
            model_config: Configuration dictionary with API keys, etc.
            probe_category: Should be "owasp_agentic_top10" (used for validation)
            
        Returns:
            Generator instance configured for agent security testing
        """
        model_config = model_config or {}
        
        logger.info(f"Creating Agent generator for {model_type}/{model_name} (category: {probe_category or 'default'})")
        
        if model_type == "openai":
            api_key = model_config.get("api_key") or model_config.get("openai_api_key")
            generator = OpenAIGenerator(name=model_name, api_key=api_key)
            # Enable agentic features (function calling, tools, etc.)
            logger.debug(f"Created OpenAI generator for agentic probe: {model_name}")
            return generator
        
        elif model_type == "anthropic":
            api_key = model_config.get("api_key") or model_config.get("anthropic_api_key")
            generator = AnthropicGenerator(name=model_name, api_key=api_key)
            logger.debug(f"Created Anthropic generator for agentic probe: {model_name}")
            return generator
        
        elif model_type == "huggingface":
            device = model_config.get("device", "cpu")
            use_api = model_config.get("use_api", False)
            api_key = model_config.get("api_key") or model_config.get("hf_token") or model_config.get("huggingface_token")
            model_path = model_config.get("model_path")
            generator = HuggingFaceGenerator(
                name=model_name,
                model_path=model_path,
                device=device,
                use_api=use_api,
                api_key=api_key
            )
            logger.debug(f"Created HuggingFace generator for agentic probe: {model_name}")
            return generator
        
        elif model_type == "local":
            logger.warning(f"Local model type not yet fully supported, using HuggingFace generator")
            generator = HuggingFaceGenerator(name=model_name, device=model_config.get("device", "cpu"))
            logger.debug(f"Created local/HuggingFace generator for agentic probe: {model_name}")
            return generator
        
        else:
            raise ValueError(f"Unsupported Agent model type: {model_type}. Supported types: openai, anthropic, huggingface, local")
