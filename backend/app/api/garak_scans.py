"""Garak-specific scan endpoints"""


from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
import logging

from app.db.session import get_db
from app.api.dependencies import get_current_active_user
from app.db.models import User, Scan, ScanStatus, Vulnerability, ScannerType
from app.api.models import ScanResponse
from app.services.scan_orchestrator import ScanOrchestrator
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/garak", tags=["garak"])



class GarakScanRequest(BaseModel):
    """Garak scan request model with validation"""
    
    name: str = Field(..., min_length=1, max_length=255, description="Scan name")
    description: Optional[str] = Field(None, max_length=1000, description="Scan description")
    model_type: str = Field("openai", pattern="^(openai|anthropic|huggingface|custom)$")
    model_name: str = Field(..., min_length=1, max_length=255)
    probes: Optional[List[str]] = Field(default_factory=list, description="List of probe names")
    max_concurrent: int = Field(3, ge=1, le=10, description="Max concurrent probes")
    timeout: int = Field(60, ge=5, le=600, description="Probe timeout in seconds")
    llm_config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="LLM configuration")
    
    @validator('llm_config')
    def validate_llm_config(cls, v):
        """Validate LLM config doesn't contain sensitive data"""
        if not isinstance(v, dict):
            raise ValueError('llm_config must be a dictionary')
        if 'api_key' in v and v['api_key']:
            if not isinstance(v['api_key'], str) or len(v['api_key']) < 10:
                raise ValueError('Invalid API key format')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "OpenAI GPT-4 Security Scan",
                "description": "Full Garak probe suite on GPT-4",
                "model_type": "openai",
                "model_name": "gpt-4",
                "probes": ["injection.prompt_injection"],
                "max_concurrent": 3,
                "timeout": 120,
                "llm_config": {"api_key": "sk-...", "base_url": "https://api.openai.com/v1"}
            }
        }

@router.post("/scan", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def create_garak_scan(
    scan_request: GarakScanRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create and run a Garak security scan
    
    Parameters:
    - name: Scan name
    - description: Optional scan description
    - model_type: openai, anthropic, huggingface, custom
    - model_name: Model identifier (e.g., gpt-3.5-turbo, claude-3-opus)
    - probes: List of probe names to run (leave empty for all)
    - max_concurrent: Max concurrent probes (default 3)
    - timeout: Probe timeout in seconds (default 60)
    - llm_config: LLM configuration (api_key, base_url, etc.)
    """
    try:
        # Validate model type
        valid_models = {
            "openai": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4-32k"],
            "anthropic": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
            "huggingface": ["meta-llama/Llama-2-7b", "mistralai/Mistral-7B", "mistralai/Mistral-Large"],
            "custom": []  # Custom endpoints allowed
        }
        
        if scan_request.model_type not in valid_models:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid model_type: {scan_request.model_type}"
            )
        
        # Validate model name for known providers
        if scan_request.model_type != "custom" and scan_request.model_name not in valid_models[scan_request.model_type]:
            logger.warning(f"Model {scan_request.model_name} not in known list for {scan_request.model_type}")
        
        # Validate API key if required
        if not scan_request.llm_config.get("api_key") and scan_request.model_type != "huggingface":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"API key required for {scan_request.model_type} model"
            )
        
        # Validate probes if specified
        if scan_request.probes:
            if not isinstance(scan_request.probes, list):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Probes must be a list of strings"
                )
            if len(scan_request.probes) > 100:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Maximum 100 probes allowed per scan"
                )
        
        
        # Create scan record - exclude API key from storage for security
        # Only store safe configuration parameters
        safe_config = {k: v for k, v in scan_request.llm_config.items() if k != "api_key"}
        safe_config.update({
            "probes": scan_request.probes,
            "max_concurrent": scan_request.max_concurrent,
            "timeout": scan_request.timeout,
        })
        
        scan = Scan(
            name=scan_request.name,
            description=scan_request.description or f"Garak scan for {scan_request.model_name}",
            scanner_type=ScannerType.GARAK,
            model_name=scan_request.model_name,
            model_type=scan_request.model_type,
            model_config=safe_config,
            status=ScanStatus.PENDING,
            created_by=current_user.id
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        logger.info(f"Created Garak scan {scan.id} for user {current_user.id}")
        
        
        # Execute scan in background with in-memory key (no persistence)
        api_key = scan_request.llm_config.get("api_key")
        
        async def run_garak_scan(scan_id: int, api_key: str):
            from app.db.session import SessionLocal
            db_session = SessionLocal()
            try:
                orchestrator = ScanOrchestrator(db_session)
                await orchestrator.execute_scan(scan_id, api_key=api_key)
            except Exception as e:
                logger.error(f"Garak scan {scan_id} failed: {e}", exc_info=True)
            finally:
                db_session.close()
        
        background_tasks.add_task(run_garak_scan, scan.id, api_key)
        return scan
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create Garak scan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create Garak scan: {str(e)}"
        )


@router.get("/probes")
async def list_garak_probes(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, List[str]]:
    """
    List all available Garak probes
    
    Returns probe names organized by category
    """
    # Prefer tag-based grouping when available; fallback to name-based category
    try:
        organized: Dict[str, List[str]] = {}
        
        # Try using the richer integration that exposes tags
        try:
            from scanner.garak.garak_integration import GarakIntegration  # type: ignore
            gi = GarakIntegration()
            
            # Each item in gi.available_probes should include 'name' and 'tags'
            for probe in getattr(gi, "available_probes", []):
                name = probe.get("name")
                tags = probe.get("tags") or []
                
                # If no tags, put under 'other'
                if not tags:
                    organized.setdefault("other", []).append(name)
                    continue
                
                for tag in tags:
                    organized.setdefault(tag, []).append(name)
            
            # If we collected anything via tags, return it
            if organized:
                return organized
        except Exception as e:
            logger.warning(f"Tag-based probe grouping unavailable, falling back: {e}")
        
        # Fallback: return a static set of common Garak probes organized by tag
        common_probes = {
            "injection": ["promptinject", "goodside"],
            "jailbreak": ["dan"],
            "obfuscation": ["leetspeak", "encoding"],
            "safety": ["knownbadsignatures"],
            "other": [],
        }
        return common_probes
    except Exception as e:
        logger.error(f"Failed to list Garak probes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list Garak probes: {str(e)}"
        )


@router.get("/status/{scan_id}")
async def get_garak_scan_status(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get Garak scan status and progress"""
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.created_by == current_user.id,
        Scan.scanner_type == ScannerType.GARAK
    ).first()
    
    if not scan:
        raise HTTPException(status_code=404, detail="Garak scan not found")
    
    # Get vulnerabilities found
    vulnerabilities = db.query(Vulnerability).filter(
        Vulnerability.scan_id == scan_id
    ).all()
    
    return {
        "scan_id": scan.id,
        "status": scan.status.value,
        "progress": scan.progress or 0,
        "created_at": scan.created_at.isoformat(),
        "updated_at": scan.updated_at.isoformat() if scan.updated_at else None,
        "vulnerabilities_found": len(vulnerabilities),
        "model": f"{scan.model_type}/{scan.model_name}",
    }


@router.get("/results/{scan_id}")
async def get_garak_scan_results(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get detailed Garak scan results"""
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.created_by == current_user.id,
        Scan.scanner_type == "garak"
    ).first()
    
    if not scan:
        raise HTTPException(status_code=404, detail="Garak scan not found")
    
    vulnerabilities = db.query(Vulnerability).filter(
        Vulnerability.scan_id == scan_id
    ).order_by(Vulnerability.severity.desc()).all()
    
    # Group by severity
    by_severity: Dict[str, List[Dict[str, Any]]] = {}
    for vuln in vulnerabilities:
        severity_key = vuln.severity.value if hasattr(vuln.severity, "value") else (vuln.severity or "unknown")
        if severity_key not in by_severity:
            by_severity[severity_key] = []
        by_severity[severity_key].append({
            "id": vuln.id,
            "probe": vuln.probe_name,
            "message": vuln.description,
            "evidence": vuln.evidence,
            "remediation": vuln.remediation,
        })
    
    return {
        "scan_id": scan.id,
        "scan_name": scan.name,
        "status": scan.status.value,
        "model": f"{scan.model_type}/{scan.model_name}",
        "created_at": scan.created_at.isoformat(),
        "total_vulnerabilities": len(vulnerabilities),
        "by_severity": by_severity,
        "vulnerabilities": [
            {
                "id": v.id,
                "probe": v.probe_name,
                "severity": (v.severity.value if hasattr(v.severity, "value") else v.severity),
                "type": v.title,
                "evidence": v.evidence,
                "remediation": v.remediation,
            }
            for v in vulnerabilities
        ]
    }
