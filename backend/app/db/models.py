"""Database models"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, 
    ForeignKey, Enum, JSON, Float
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class UserRole(str, PyEnum):
    ADMIN = "admin"
    USER = "user"
    VIEWER = "viewer"


class ScanStatus(str, PyEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Severity(str, PyEnum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ComplianceStatus(str, PyEnum):
    COMPLIANT = "compliant"
    PARTIAL = "partial"
    NON_COMPLIANT = "non_compliant"
    NOT_ASSESSED = "not_assessed"


class ScannerType(str, PyEnum):
    """Supported external scanner engines for LLM security testing."""

    BUILTIN = "builtin"          # Only first-party probes in this repo
    GARAK = "garak"              # Garak integration
    LLMTOP10 = "llmtopten"       # LLMTopTen OWASP LLM Top 10 scanner
    AGENTTOP10 = "agenttopten"   # AgentTopTen OWASP Agentic AI Top 10 scanner
    COUNTERFIT = "counterfit"    # Azure Counterfit (optional)
    ART = "art"                  # Adversarial Robustness Toolbox (optional)
    ALL = "all"                  # Combined where applicable


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    scans = relationship("Scan", back_populates="user", cascade="all, delete-orphan")


class Scan(Base):
    __tablename__ = "scans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)
    model_config = Column(JSON, default=dict)
    scanner_type = Column(Enum(ScannerType), default=ScannerType.BUILTIN, nullable=False)
    
    status = Column(Enum(ScanStatus), default=ScanStatus.PENDING, index=True)
    progress = Column(Float, default=0.0)
    
    # Results
    results = Column(JSON, default=dict)
    vulnerability_count = Column(Integer, default=0)
    risk_score = Column(Float)
    
    # Timing
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    duration = Column(Integer)  # seconds
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="scans")
    vulnerabilities = relationship("Vulnerability", back_populates="scan", cascade="all, delete-orphan")
    compliance_mappings = relationship("ComplianceMapping", back_populates="scan", cascade="all, delete-orphan")


class Vulnerability(Base):
    __tablename__ = "vulnerabilities"
    
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False)
    
    title = Column(String(200), nullable=False)
    description = Column(Text)
    severity = Column(Enum(Severity), default=Severity.MEDIUM)
    
    probe_name = Column(String(100))
    probe_category = Column(String(100))
    
    evidence = Column(Text)
    remediation = Column(Text)
    
    # CVSS-like scoring
    cvss_score = Column(Float)
    
    # Additional data
    extra_data = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    scan = relationship("Scan", back_populates="vulnerabilities")


class ComplianceMapping(Base):
    __tablename__ = "compliance_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False)
    
    framework = Column(String(50), nullable=False, index=True)
    requirement_id = Column(String(50), nullable=False)
    requirement_name = Column(String(200), nullable=False)
    
    compliance_status = Column(Enum(ComplianceStatus), default=ComplianceStatus.NOT_ASSESSED)
    evidence = Column(Text)
    
    # Linked vulnerabilities
    vulnerability_ids = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    scan = relationship("Scan", back_populates="compliance_mappings")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    action = Column(String(50), nullable=False)
    resource_type = Column(String(50))
    resource_id = Column(Integer)
    
    details = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    
    created_at = Column(DateTime, default=datetime.utcnow)
