"""API Request/Response Models (Pydantic Schemas)"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from app.db.models import UserRole, ScanStatus, Severity, ComplianceStatus, ScannerType


# ============== Auth Models ==============

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


# ============== Scan Models ==============

class LLMConfig(BaseModel):
    api_key: Optional[str] = None
    endpoint: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None


class ScanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    model_name: str = Field(..., min_length=1, max_length=100)
    model_type: str = Field(..., min_length=1, max_length=50)
    scanner_type: ScannerType = ScannerType.BUILTIN
    llm_config: Optional[LLMConfig] = None


class ScanResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    model_name: str
    model_type: str
    scanner_type: ScannerType
    status: ScanStatus
    progress: float
    vulnerability_count: int
    risk_score: Optional[float]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration: Optional[int]
    created_by: int
    created_at: datetime
    updated_at: datetime
    results: Optional[Dict[str, Any]] = None
    
    model_config = {"from_attributes": True}


class ScanListResponse(BaseModel):
    items: List[ScanResponse]
    total: int
    skip: int
    limit: int


# ============== Vulnerability Models ==============

class VulnerabilityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: Severity = Severity.MEDIUM
    probe_name: Optional[str] = None
    probe_category: Optional[str] = None
    evidence: Optional[str] = None
    remediation: Optional[str] = None
    cvss_score: Optional[float] = None
    extra_data: Optional[Dict[str, Any]] = None


class VulnerabilityResponse(BaseModel):
    id: int
    scan_id: int
    title: str
    description: Optional[str]
    severity: Severity
    probe_name: Optional[str]
    probe_category: Optional[str]
    evidence: Optional[str]
    remediation: Optional[str]
    cvss_score: Optional[float]
    extra_data: Optional[Dict[str, Any]]
    created_at: datetime
    
    model_config = {"from_attributes": True}


# ============== Compliance Models ==============

class ComplianceMappingCreate(BaseModel):
    framework: str
    requirement_id: str
    requirement_name: str
    compliance_status: ComplianceStatus = ComplianceStatus.NOT_ASSESSED
    evidence: Optional[str] = None


class ComplianceMappingResponse(BaseModel):
    id: int
    scan_id: int
    framework: str
    requirement_id: str
    requirement_name: str
    compliance_status: ComplianceStatus
    evidence: Optional[str]
    vulnerability_ids: List[int]
    created_at: datetime
    
    model_config = {"from_attributes": True}


class ComplianceSummary(BaseModel):
    framework: str
    total: int
    passed: int
    failed: int
    partial: int
    not_assessed: int
    score: float


# ============== Report Models ==============

class ReportRequest(BaseModel):
    include_vulnerabilities: bool = True
    include_compliance: bool = True
    frameworks: Optional[List[str]] = None


class ReportResponse(BaseModel):
    scan_id: int
    scan_name: str
    model_name: str
    generated_at: datetime
    summary: Dict[str, Any]
    vulnerabilities: Optional[List[VulnerabilityResponse]] = None
    compliance: Optional[Dict[str, ComplianceSummary]] = None


# ============== General Models ==============

class MessageResponse(BaseModel):
    message: str
    details: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    timestamp: datetime
