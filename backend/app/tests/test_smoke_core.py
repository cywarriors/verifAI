"""Smoke tests for core utilities and security"""

import pytest
from datetime import datetime, timedelta

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token
)
from app.core.utils import (
    generate_scan_id,
    sanitize_model_config,
    validate_model_type,
    format_risk_score
)
from app.db.models import UserRole, ScanStatus, Severity, ComplianceStatus


class TestPasswordHashing:
    """Test password hashing functionality"""

    def test_hash_password(self):
        """Test password hashing creates valid hash"""
        password = "SecurePassword123!"
        hashed = get_password_hash(password)
        
        assert hashed is not None
        assert hashed != password
        assert len(hashed) > 0

    def test_verify_correct_password(self):
        """Test verifying correct password returns True"""
        password = "SecurePassword123!"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True

    def test_verify_wrong_password(self):
        """Test verifying wrong password returns False"""
        password = "SecurePassword123!"
        wrong_password = "WrongPassword456!"
        hashed = get_password_hash(password)
        
        assert verify_password(wrong_password, hashed) is False

    def test_different_passwords_different_hashes(self):
        """Test different passwords produce different hashes"""
        password1 = "Password1!"
        password2 = "Password2!"
        
        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)
        
        assert hash1 != hash2

    def test_same_password_different_hashes(self):
        """Test same password produces different hashes (due to salt)"""
        password = "SamePassword123!"
        
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Hashes should be different due to random salt
        assert hash1 != hash2
        # But both should verify
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_long_password_truncation(self):
        """Test that long passwords are handled (bcrypt 72 byte limit)"""
        long_password = "A" * 100  # Longer than 72 bytes
        hashed = get_password_hash(long_password)
        
        # Should still work
        assert verify_password(long_password, hashed) is True


class TestJWTTokens:
    """Test JWT token creation and validation"""

    def test_create_access_token(self):
        """Test creating an access token"""
        data = {"sub": 1}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_token_with_expiry(self):
        """Test creating token with custom expiry"""
        data = {"sub": 1}
        expires = timedelta(minutes=30)
        token = create_access_token(data, expires_delta=expires)
        
        assert token is not None

    def test_decode_valid_token(self):
        """Test decoding a valid token"""
        data = {"sub": "1"}  # JWT requires sub to be string
        token = create_access_token(data)
        
        decoded = decode_access_token(token)
        
        assert decoded is not None
        assert decoded["sub"] == "1"
        assert "exp" in decoded

    def test_decode_invalid_token(self):
        """Test decoding an invalid token returns None"""
        decoded = decode_access_token("invalid.token.here")
        
        assert decoded is None

    def test_decode_tampered_token(self):
        """Test decoding a tampered token returns None"""
        data = {"sub": 1}
        token = create_access_token(data)
        
        # Tamper with the token
        tampered = token[:-5] + "XXXXX"
        decoded = decode_access_token(tampered)
        
        assert decoded is None


class TestScanIdGeneration:
    """Test scan ID generation"""

    def test_generate_scan_id(self):
        """Test generating a scan ID"""
        scan_id = generate_scan_id("gpt-4")
        
        assert scan_id is not None
        assert len(scan_id) == 16  # First 16 chars of SHA256
        assert scan_id.isalnum()

    def test_scan_id_with_timestamp(self):
        """Test generating scan ID with specific timestamp"""
        timestamp = datetime(2024, 1, 1, 12, 0, 0)
        scan_id = generate_scan_id("gpt-4", timestamp)
        
        assert scan_id is not None
        assert len(scan_id) == 16

    def test_different_models_different_ids(self):
        """Test different models produce different IDs"""
        timestamp = datetime.utcnow()
        id1 = generate_scan_id("gpt-4", timestamp)
        id2 = generate_scan_id("gpt-3.5-turbo", timestamp)
        
        assert id1 != id2

    def test_same_input_same_id(self):
        """Test same input produces same ID"""
        timestamp = datetime(2024, 1, 1, 12, 0, 0)
        id1 = generate_scan_id("gpt-4", timestamp)
        id2 = generate_scan_id("gpt-4", timestamp)
        
        assert id1 == id2


class TestConfigSanitization:
    """Test model config sanitization"""

    def test_sanitize_api_key(self):
        """Test API keys are sanitized"""
        config = {
            "api_key": "sk-secret123456",
            "model": "gpt-4"
        }
        
        sanitized = sanitize_model_config(config)
        
        assert sanitized["api_key"] == "***REDACTED***"
        assert sanitized["model"] == "gpt-4"

    def test_sanitize_multiple_sensitive_keys(self):
        """Test multiple sensitive keys are sanitized"""
        config = {
            "api_key": "secret1",
            "access_token": "secret2",
            "password": "secret3",
            "secret": "secret4",
            "credential": "secret5",
            "safe_key": "not_sensitive"
        }
        
        sanitized = sanitize_model_config(config)
        
        assert sanitized["api_key"] == "***REDACTED***"
        assert sanitized["access_token"] == "***REDACTED***"
        assert sanitized["password"] == "***REDACTED***"
        assert sanitized["secret"] == "***REDACTED***"
        assert sanitized["credential"] == "***REDACTED***"
        assert sanitized["safe_key"] == "not_sensitive"

    def test_sanitize_empty_config(self):
        """Test sanitizing empty config"""
        sanitized = sanitize_model_config({})
        assert sanitized == {}

    def test_original_config_unchanged(self):
        """Test original config is not modified"""
        config = {"api_key": "secret"}
        
        sanitize_model_config(config)
        
        assert config["api_key"] == "secret"


class TestModelTypeValidation:
    """Test model type validation"""

    def test_valid_model_types(self):
        """Test valid model types"""
        assert validate_model_type("openai") is True
        assert validate_model_type("huggingface") is True
        assert validate_model_type("rest") is True
        assert validate_model_type("local") is True

    def test_valid_model_types_case_insensitive(self):
        """Test validation is case insensitive"""
        assert validate_model_type("OpenAI") is True
        assert validate_model_type("HUGGINGFACE") is True
        assert validate_model_type("REST") is True

    def test_invalid_model_types(self):
        """Test invalid model types"""
        assert validate_model_type("invalid") is False
        assert validate_model_type("azure") is False
        assert validate_model_type("") is False


class TestRiskScoreFormatting:
    """Test risk score formatting"""

    def test_critical_risk(self):
        """Test critical risk formatting"""
        result = format_risk_score(85.5)
        assert "CRITICAL" in result
        assert "🔴" in result
        assert "85.5" in result

    def test_high_risk(self):
        """Test high risk formatting"""
        result = format_risk_score(65.0)
        assert "HIGH" in result
        assert "🟠" in result

    def test_medium_risk(self):
        """Test medium risk formatting"""
        result = format_risk_score(45.0)
        assert "MEDIUM" in result
        assert "🟡" in result

    def test_low_risk(self):
        """Test low risk formatting"""
        result = format_risk_score(25.0)
        assert "LOW" in result
        assert "🟢" in result

    def test_info_risk(self):
        """Test info level formatting"""
        result = format_risk_score(10.0)
        assert "INFO" in result
        assert "⚪" in result

    def test_boundary_values(self):
        """Test boundary values"""
        assert "CRITICAL" in format_risk_score(80.0)
        assert "HIGH" in format_risk_score(60.0)
        assert "MEDIUM" in format_risk_score(40.0)
        assert "LOW" in format_risk_score(20.0)


class TestEnumValues:
    """Test database enum values"""

    def test_user_role_values(self):
        """Test UserRole enum values"""
        assert UserRole.ADMIN == "admin"
        assert UserRole.USER == "user"
        assert UserRole.VIEWER == "viewer"

    def test_scan_status_values(self):
        """Test ScanStatus enum values"""
        assert ScanStatus.PENDING == "pending"
        assert ScanStatus.RUNNING == "running"
        assert ScanStatus.COMPLETED == "completed"
        assert ScanStatus.FAILED == "failed"
        assert ScanStatus.CANCELLED == "cancelled"

    def test_severity_values(self):
        """Test Severity enum values"""
        assert Severity.CRITICAL == "critical"
        assert Severity.HIGH == "high"
        assert Severity.MEDIUM == "medium"
        assert Severity.LOW == "low"
        assert Severity.INFO == "info"

    def test_compliance_status_values(self):
        """Test ComplianceStatus enum values"""
        assert ComplianceStatus.COMPLIANT == "compliant"
        assert ComplianceStatus.PARTIAL == "partial"
        assert ComplianceStatus.NON_COMPLIANT == "non_compliant"
        assert ComplianceStatus.NOT_ASSESSED == "not_assessed"

