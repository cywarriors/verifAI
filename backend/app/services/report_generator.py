"""Report generation service"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

from sqlalchemy.orm import Session

from app.db.models import Scan, Vulnerability, ComplianceMapping, Severity, ComplianceStatus
from app.config.settings import settings


class ReportGenerator:
    """Generates JSON reports for security scans"""
    
    def __init__(self, db: Session):
        self.db = db
        self.report_path = Path(settings.REPORT_STORAGE_PATH)
        self.report_path.mkdir(parents=True, exist_ok=True)
    
    def generate_json_report(self, scan_id: int) -> Dict[str, Any]:
        """Generate JSON report data"""
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return {"error": "Scan not found"}
        
        vulnerabilities = self.db.query(Vulnerability).filter(
            Vulnerability.scan_id == scan_id
        ).order_by(Vulnerability.severity).all()
        
        compliance_mappings = self.db.query(ComplianceMapping).filter(
            ComplianceMapping.scan_id == scan_id
        ).all()
        
        # Build compliance summary
        compliance_summary = {}
        for mapping in compliance_mappings:
            if mapping.framework not in compliance_summary:
                compliance_summary[mapping.framework] = {
                    "total": 0,
                    "compliant": 0,
                    "non_compliant": 0,
                    "partial": 0,
                    "not_assessed": 0
                }
            compliance_summary[mapping.framework]["total"] += 1
            if mapping.compliance_status == ComplianceStatus.COMPLIANT:
                compliance_summary[mapping.framework]["compliant"] += 1
            elif mapping.compliance_status == ComplianceStatus.NON_COMPLIANT:
                compliance_summary[mapping.framework]["non_compliant"] += 1
            elif mapping.compliance_status == ComplianceStatus.PARTIAL:
                compliance_summary[mapping.framework]["partial"] += 1
            else:
                compliance_summary[mapping.framework]["not_assessed"] += 1
        
        # Build report
        report = {
            "report_info": {
                "generated_at": datetime.utcnow().isoformat(),
                "generator_version": "1.0.0",
                "scan_id": scan_id
            },
            "scan": {
                "id": scan.id,
                "name": scan.name,
                "description": scan.description,
                "model_name": scan.model_name,
                "model_type": scan.model_type,
                "status": scan.status.value,
                "started_at": scan.started_at.isoformat() if scan.started_at else None,
                "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
                "duration_seconds": scan.duration,
                "risk_score": scan.risk_score
            },
            "summary": {
                "total_vulnerabilities": len(vulnerabilities),
                "by_severity": {
                    "critical": sum(1 for v in vulnerabilities if v.severity == Severity.CRITICAL),
                    "high": sum(1 for v in vulnerabilities if v.severity == Severity.HIGH),
                    "medium": sum(1 for v in vulnerabilities if v.severity == Severity.MEDIUM),
                    "low": sum(1 for v in vulnerabilities if v.severity == Severity.LOW),
                    "info": sum(1 for v in vulnerabilities if v.severity == Severity.INFO),
                },
                "risk_score": scan.risk_score
            },
            "vulnerabilities": [
                {
                    "id": v.id,
                    "title": v.title,
                    "description": v.description,
                    "severity": v.severity.value,
                    "probe_name": v.probe_name,
                    "probe_category": v.probe_category,
                    "evidence": v.evidence,
                    "remediation": v.remediation,
                    "cvss_score": v.cvss_score
                }
                for v in vulnerabilities
            ],
            "compliance": compliance_summary,
            "compliance_details": [
                {
                    "framework": m.framework,
                    "requirement_id": m.requirement_id,
                    "requirement_name": m.requirement_name,
                    "status": m.compliance_status.value,
                    "evidence": m.evidence
                }
                for m in compliance_mappings
            ]
        }
        
        return report
    
    def save_json_report(self, scan_id: int) -> Path:
        """Save JSON report to file"""
        report = self.generate_json_report(scan_id)
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        
        safe_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in scan.name)
        filename = f"scan_{scan_id}_{safe_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = self.report_path / filename
        
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2)
        
        return filepath
    
    def generate_pdf_report(self, scan_id: int) -> Path:
        """Generate PDF report (returns JSON as fallback if reportlab not available)"""
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.enums import TA_CENTER
            
            return self._generate_pdf_with_reportlab(scan_id)
        except ImportError:
            # Fallback to JSON if reportlab not installed
            return self.save_json_report(scan_id)
    
    def _generate_pdf_with_reportlab(self, scan_id: int) -> Path:
        """Generate actual PDF report"""
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.enums import TA_CENTER
        
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            raise ValueError("Scan not found")
        
        vulnerabilities = self.db.query(Vulnerability).filter(
            Vulnerability.scan_id == scan_id
        ).order_by(Vulnerability.severity).all()
        
        safe_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in scan.name)
        filename = f"scan_{scan_id}_{safe_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = self.report_path / filename
        
        doc = SimpleDocTemplate(str(filepath), pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#06b6d4')
        )
        
        story = []
        
        # Title
        story.append(Paragraph("LLM Security Scan Report", title_style))
        story.append(Paragraph(f"<b>{scan.name}</b>", styles['Heading2']))
        story.append(Spacer(1, 20))
        
        # Scan Info
        scan_info = [
            ["Model Name:", scan.model_name],
            ["Status:", scan.status.value.upper()],
            ["Risk Score:", f"{scan.risk_score:.1f}/100" if scan.risk_score else "N/A"],
        ]
        
        info_table = Table(scan_info, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 20))
        
        # Summary
        story.append(Paragraph(f"<b>Total Vulnerabilities Found: {len(vulnerabilities)}</b>", styles['Normal']))
        
        doc.build(story)
        return filepath
