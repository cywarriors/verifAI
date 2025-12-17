"""Application configuration"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # Application
    APP_NAME: str = "SecureAI - LLM Security Scanner"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production-use-strong-secret"
    API_V1_STR: str = "/api/v1"
    
    # Security
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520  # 8 days
    ALGORITHM: str = "HS256"
    ALLOWED_HOSTS: List[str] = ["*"]
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:6789",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:6789",
        "http://127.0.0.1:8000",
    ]
    
    # Database - SQLite for simple setup, PostgreSQL for production
    DATABASE_URL: str = "sqlite:///./secureai.db"
    
    # Redis (optional)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Storage
    S3_ENDPOINT: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET: str = "secureai-reports"
    USE_MINIO: bool = False
    
    # LLM Providers (optional - for actual scanning)
    OPENAI_API_KEY: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Report Generation
    REPORT_STORAGE_PATH: str = "./scanner/results"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Garak Configuration
    GARAK_ENABLED: bool = True
    GARAK_TIMEOUT: int = 60  # Default timeout for Garak probes (seconds)
    GARAK_MAX_CONCURRENT: int = 3  # Max concurrent Garak probes
    GARAK_RETRY_ATTEMPTS: int = 2  # Retry attempts for failed probes
    GARAK_RETRY_DELAY: float = 1.0  # Delay between retries (seconds)
    GARAK_CACHE_ENABLED: bool = True  # Enable result caching
    GARAK_CACHE_TTL: int = 3600  # Cache TTL in seconds (1 hour)
    GARAK_RATE_LIMIT_PER_MINUTE: int = 60  # Rate limit for API calls


settings = Settings()
