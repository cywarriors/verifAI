"""Compliance endpoints"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.dependencies import get_current_active_user
from app.db.models import User, Scan, ComplianceMapping, ComplianceStatus
from app.api.models import ComplianceMappingResponse, ComplianceSummary

router = APIRouter()


@router.get("/{scan_id}/summary")
async def get_compliance_summary(
    scan_id: int,
    framework: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get compliance summary for a scan"""
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.created_by == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    def get_summary_for_framework(fw: str) -> dict:
        mappings = db.query(ComplianceMapping).filter(
            ComplianceMapping.scan_id == scan_id,
            ComplianceMapping.framework == fw
        ).all()
        
        total = len(mappings)
        passed = sum(1 for m in mappings if m.compliance_status == ComplianceStatus.COMPLIANT)
        failed = sum(1 for m in mappings if m.compliance_status == ComplianceStatus.NON_COMPLIANT)
        partial = sum(1 for m in mappings if m.compliance_status == ComplianceStatus.PARTIAL)
        not_assessed = sum(1 for m in mappings if m.compliance_status == ComplianceStatus.NOT_ASSESSED)
        
        score = (passed / total * 100) if total > 0 else 0
        
        return {
            "framework": fw,
            "total": total,
            "passed": passed,
            "failed": failed,
            "partial": partial,
            "not_assessed": not_assessed,
            "score": round(score, 1)
        }
    
    frameworks = ["nist_ai_rmf", "iso_42001", "eu_ai_act", "india_dpdp", "telecom_iot"]
    
    if framework:
        if framework not in frameworks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown framework: {framework}"
            )
        return get_summary_for_framework(framework)
    
    # Return all frameworks
    return {fw: get_summary_for_framework(fw) for fw in frameworks}


@router.get("/{scan_id}/mappings", response_model=List[ComplianceMappingResponse])
async def get_compliance_mappings(
    scan_id: int,
    framework: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get compliance mappings for a scan"""
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.created_by == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    query = db.query(ComplianceMapping).filter(ComplianceMapping.scan_id == scan_id)
    
    if framework:
        query = query.filter(ComplianceMapping.framework == framework)
    
    mappings = query.order_by(ComplianceMapping.framework, ComplianceMapping.requirement_id).all()
    
    return mappings
