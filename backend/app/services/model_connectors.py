"""Model Connectors - Interfaces with different LLM providers"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
import openai
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import httpx


class ModelConnector(ABC):
    """Base class for model connectors"""
    
    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the model"""
        pass
    
    @abstractmethod
    async def batch_generate(self, prompts: List[str], **kwargs) -> List[str]:
        """Generate responses for multiple prompts"""
        pass


class OpenAIConnector(ModelConnector):
    """OpenAI API connector"""
    
    def __init__(self, api_key: str, model_name: str = "gpt-3.5-turbo"):
        self.client = openai.OpenAI(api_key=api_key)
        self.model_name = model_name
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate response using OpenAI API"""
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            **kwargs
        )
        return response.choices[0].message.content
    
    async def batch_generate(self, prompts: List[str], **kwargs) -> List[str]:
        """Generate responses for multiple prompts"""
        results = []
        for prompt in prompts:
            result = await self.generate(prompt, **kwargs)
            results.append(result)
        return results


class HuggingFaceConnector(ModelConnector):
    """HuggingFace connector for local/remote models"""
    
    def __init__(self, model_name: str, api_key: Optional[str] = None, use_api: bool = False):
        self.model_name = model_name
        self.api_key = api_key
        self.use_api = use_api
        
        if not use_api:
            # Load model locally
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForCausalLM.from_pretrained(model_name)
            self.pipeline = pipeline("text-generation", model=self.model, tokenizer=self.tokenizer)
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate response using HuggingFace"""
        if self.use_api:
            return await self._generate_via_api(prompt, **kwargs)
        else:
            return await self._generate_local(prompt, **kwargs)
    
    async def _generate_local(self, prompt: str, **kwargs) -> str:
        """Generate using local model"""
        result = self.pipeline(prompt, **kwargs)
        return result[0]["generated_text"]
    
    async def _generate_via_api(self, prompt: str, **kwargs) -> str:
        """Generate using HuggingFace API"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api-inference.huggingface.co/models/{self.model_name}",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"inputs": prompt, **kwargs},
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            return result[0]["generated_text"]
    
    async def batch_generate(self, prompts: List[str], **kwargs) -> List[str]:
        """Generate responses for multiple prompts"""
        results = []
        for prompt in prompts:
            result = await self.generate(prompt, **kwargs)
            results.append(result)
        return results


class RESTAPIConnector(ModelConnector):
    """Generic REST API connector for custom LLM endpoints"""
    
    def __init__(self, endpoint: str, api_key: Optional[str] = None, headers: Optional[Dict] = None):
        self.endpoint = endpoint
        self.api_key = api_key
        self.headers = headers or {}
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate response via REST API"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.endpoint,
                headers=self.headers,
                json={"prompt": prompt, **kwargs},
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            # Assume response has 'text' or 'response' field
            return result.get("text") or result.get("response") or str(result)
    
    async def batch_generate(self, prompts: List[str], **kwargs) -> List[str]:
        """Generate responses for multiple prompts"""
        results = []
        for prompt in prompts:
            result = await self.generate(prompt, **kwargs)
            results.append(result)
        return results


class LocalModelConnector(ModelConnector):
    """Local model connector for models running on the same machine"""
    
    def __init__(self, model_path: str, model_type: str = "causal_lm"):
        self.model_path = model_path
        self.model_type = model_type
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForCausalLM.from_pretrained(model_path)
        self.pipeline = pipeline("text-generation", model=self.model, tokenizer=self.tokenizer)
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate response using local model"""
        result = self.pipeline(prompt, **kwargs)
        return result[0]["generated_text"]
    
    async def batch_generate(self, prompts: List[str], **kwargs) -> List[str]:
        """Generate responses for multiple prompts"""
        results = []
        for prompt in prompts:
            result = await self.generate(prompt, **kwargs)
            results.append(result)
        return results


class ModelConnectorFactory:
    """Factory for creating model connectors"""
    
    @staticmethod
    def create_connector(model_type: str, model_config: Dict[str, Any]) -> ModelConnector:
        """Create a connector based on model type"""
        if model_type == "openai":
            return OpenAIConnector(
                api_key=model_config.get("api_key"),
                model_name=model_config.get("model_name", "gpt-3.5-turbo")
            )
        elif model_type == "huggingface":
            return HuggingFaceConnector(
                model_name=model_config.get("model_name"),
                api_key=model_config.get("api_key"),
                use_api=model_config.get("use_api", False)
            )
        elif model_type == "rest":
            return RESTAPIConnector(
                endpoint=model_config.get("endpoint"),
                api_key=model_config.get("api_key"),
                headers=model_config.get("headers")
            )
        elif model_type == "local":
            return LocalModelConnector(
                model_path=model_config.get("model_path"),
                model_type=model_config.get("model_type", "causal_lm")
            )
        else:
            raise ValueError(f"Unsupported model type: {model_type}")

