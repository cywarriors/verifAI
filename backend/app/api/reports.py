"""Report endpoints"""

from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.dependencies import get_current_active_user
from app.db.models import User, Scan, Vulnerability, ComplianceMapping, ScanStatus
from app.services.report_generator import ReportGenerator

router = APIRouter()


@router.get("/{scan_id}/json")
async def get_json_report(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get JSON report for a scan"""
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.created_by == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    if scan.status != ScanStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report only available for completed scans"
        )
    
    report_generator = ReportGenerator(db)
    report = report_generator.generate_json_report(scan_id)
    
    return JSONResponse(content=report)


@router.get("/{scan_id}/json/download")
async def download_json_report(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Download JSON report file"""
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.created_by == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    if scan.status != ScanStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report only available for completed scans"
        )
    
    report_generator = ReportGenerator(db)
    filepath = report_generator.save_json_report(scan_id)
    
    return FileResponse(
        path=str(filepath),
        filename=filepath.name,
        media_type="application/json"
    )


@router.get("/{scan_id}/pdf/download")
async def download_pdf_report(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Download PDF report file"""
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.created_by == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    if scan.status != ScanStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report only available for completed scans"
        )
    
    report_generator = ReportGenerator(db)
    filepath = report_generator.generate_pdf_report(scan_id)
    
    return FileResponse(
        path=str(filepath),
        filename=filepath.name,
        media_type="application/pdf"
    )
