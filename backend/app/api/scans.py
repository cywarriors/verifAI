"""Scan endpoints"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.dependencies import get_current_active_user
from app.db.models import User, Scan, ScanStatus, Vulnerability
from app.api.models import ScanCreate, ScanResponse, VulnerabilityResponse
from app.services.scan_orchestrator import ScanOrchestrator

router = APIRouter()


@router.post("/", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    scan_data: ScanCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new scan"""
    try:
        # Create scan record
        scan = Scan(
            name=scan_data.name,
            description=scan_data.description,
            scanner_type=scan_data.scanner_type,
            model_name=scan_data.model_name,
            model_type=scan_data.model_type,
            model_config=scan_data.llm_config.model_dump() if scan_data.llm_config else {},
            status=ScanStatus.PENDING,
            created_by=current_user.id
        )
        
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        # Execute scan in background (create new DB session for background task)
        async def run_scan_background(scan_id: int):
            """Background task wrapper that creates its own DB session"""
            from app.db.session import SessionLocal
            
            db_session = SessionLocal()
            try:
                orchestrator = ScanOrchestrator(db_session)
                await orchestrator.execute_scan(scan_id)
            except Exception as e:
                # Log error but don't raise - scan status will be set to FAILED
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Background scan task failed for scan {scan_id}: {e}", exc_info=True)
            finally:
                db_session.close()
        
        background_tasks.add_task(run_scan_background, scan.id)
        
        return scan
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create scan: {str(e)}"
        )


@router.get("/", response_model=List[ScanResponse])
async def list_scans(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[ScanStatus] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all scans for current user"""
    query = db.query(Scan).filter(Scan.created_by == current_user.id)
    
    if status_filter:
        query = query.filter(Scan.status == status_filter)
    
    scans = query.order_by(Scan.created_at.desc()).offset(skip).limit(limit).all()
    return scans


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific scan"""
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.created_by == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    return scan


@router.get("/{scan_id}/vulnerabilities", response_model=List[VulnerabilityResponse])
async def get_scan_vulnerabilities(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get vulnerabilities for a scan"""
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.created_by == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    vulnerabilities = db.query(Vulnerability).filter(
        Vulnerability.scan_id == scan_id
    ).order_by(Vulnerability.severity).all()
    
    return vulnerabilities


@router.post("/{scan_id}/cancel")
async def cancel_scan(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel a running scan"""
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.created_by == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    if scan.status not in [ScanStatus.PENDING, ScanStatus.RUNNING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel scan with status {scan.status}"
        )
    
    scan.status = ScanStatus.CANCELLED
    scan.completed_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Scan cancelled", "scan_id": scan_id}


@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a scan"""
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.created_by == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    if scan.status == ScanStatus.RUNNING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a running scan"
        )
    
    db.delete(scan)
    db.commit()
    
    return {"message": "Scan deleted", "scan_id": scan_id}
