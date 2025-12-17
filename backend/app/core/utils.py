"""Core utility functions"""

from datetime import datetime
from typing import Any, Dict
import json
import hashlib


def generate_scan_id(model_name: str, timestamp: datetime = None) -> str:
    """Generate a unique scan ID"""
    if timestamp is None:
        timestamp = datetime.utcnow()
    
    data = f"{model_name}_{timestamp.isoformat()}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]


def sanitize_model_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize model configuration by removing sensitive data for logging"""
    sanitized = config.copy()
    
    # Remove sensitive keys
    sensitive_keys = ["api_key", "access_token", "secret", "password", "credential"]
    for key in sanitized.keys():
        if any(sensitive in key.lower() for sensitive in sensitive_keys):
            sanitized[key] = "***REDACTED***"
    
    return sanitized


def validate_model_type(model_type: str) -> bool:
    """Validate model type"""
    valid_types = ["openai", "huggingface", "rest", "local"]
    return model_type.lower() in valid_types


def format_risk_score(score: float) -> str:
    """Format risk score with color coding"""
    if score >= 80:
        return f"🔴 CRITICAL ({score:.1f})"
    elif score >= 60:
        return f"🟠 HIGH ({score:.1f})"
    elif score >= 40:
        return f"🟡 MEDIUM ({score:.1f})"
    elif score >= 20:
        return f"🟢 LOW ({score:.1f})"
    else:
        return f"⚪ INFO ({score:.1f})"

