"""Compliance mapping engine"""

from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.db.models import Scan, Vulnerability, ComplianceMapping, ComplianceStatus, Severity


# Compliance framework definitions
COMPLIANCE_FRAMEWORKS = {
    "nist_ai_rmf": {
        "name": "NIST AI Risk Management Framework",
        "requirements": [
            {"id": "MAP-1.1", "name": "Context of AI System", "categories": ["all"]},
            {"id": "MAP-1.2", "name": "Intended Purposes", "categories": ["all"]},
            {"id": "MEASURE-2.1", "name": "Accuracy Testing", "categories": ["Hallucination"]},
            {"id": "MEASURE-2.2", "name": "Reliability Testing", "categories": ["all"]},
            {"id": "MANAGE-1.1", "name": "Risk Response Plan", "categories": ["Prompt Injection", "Data Leakage"]},
            {"id": "MANAGE-2.1", "name": "Risk Documentation", "categories": ["all"]},
            {"id": "GOVERN-1.1", "name": "AI Policies", "categories": ["all"]},
            {"id": "GOVERN-1.2", "name": "Accountability Structures", "categories": ["all"]},
        ]
    },
    "iso_42001": {
        "name": "ISO/IEC 42001 AI Management System",
        "requirements": [
            {"id": "5.1", "name": "Leadership Commitment", "categories": ["all"]},
            {"id": "6.1", "name": "Risk Assessment", "categories": ["all"]},
            {"id": "6.2", "name": "AI System Objectives", "categories": ["all"]},
            {"id": "7.1", "name": "Resources", "categories": ["all"]},
            {"id": "8.1", "name": "Operational Planning", "categories": ["Prompt Injection", "Data Leakage"]},
            {"id": "8.2", "name": "AI System Lifecycle", "categories": ["all"]},
            {"id": "9.1", "name": "Monitoring and Measurement", "categories": ["Hallucination"]},
            {"id": "10.1", "name": "Continual Improvement", "categories": ["all"]},
        ]
    },
    "eu_ai_act": {
        "name": "EU Artificial Intelligence Act",
        "requirements": [
            {"id": "ART-9", "name": "Risk Management System", "categories": ["all"]},
            {"id": "ART-10", "name": "Data Governance", "categories": ["Data Leakage"]},
            {"id": "ART-11", "name": "Technical Documentation", "categories": ["all"]},
            {"id": "ART-12", "name": "Record Keeping", "categories": ["all"]},
            {"id": "ART-13", "name": "Transparency", "categories": ["Hallucination"]},
            {"id": "ART-14", "name": "Human Oversight", "categories": ["Prompt Injection"]},
            {"id": "ART-15", "name": "Accuracy and Robustness", "categories": ["all"]},
            {"id": "ART-16", "name": "Quality Management", "categories": ["all"]},
        ]
    },
    "india_dpdp": {
        "name": "India Digital Personal Data Protection Act",
        "requirements": [
            {"id": "SEC-4", "name": "Lawful Processing", "categories": ["Data Leakage"]},
            {"id": "SEC-5", "name": "Consent Requirements", "categories": ["all"]},
            {"id": "SEC-6", "name": "Purpose Limitation", "categories": ["Data Leakage"]},
            {"id": "SEC-7", "name": "Data Quality", "categories": ["Hallucination"]},
            {"id": "SEC-8", "name": "Security Safeguards", "categories": ["Prompt Injection", "Data Leakage"]},
            {"id": "SEC-9", "name": "Data Retention", "categories": ["Data Leakage"]},
        ]
    },
    "telecom_iot": {
        "name": "Telecom/IoT Security Standards",
        "requirements": [
            {"id": "IOT-1", "name": "Device Authentication", "categories": ["Telecom/IoT"]},
            {"id": "IOT-2", "name": "Secure Communication", "categories": ["Telecom/IoT"]},
            {"id": "IOT-3", "name": "Firmware Security", "categories": ["Telecom/IoT"]},
            {"id": "NET-1", "name": "Network Segmentation", "categories": ["Telecom/IoT"]},
            {"id": "NET-2", "name": "Protocol Security", "categories": ["Telecom/IoT"]},
            {"id": "NET-3", "name": "Intrusion Detection", "categories": ["all"]},
        ]
    },
}


class ComplianceEngine:
    """Engine for mapping vulnerabilities to compliance frameworks"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def map_vulnerabilities_to_compliance(self, scan_id: int) -> None:
        """Map scan vulnerabilities to compliance requirements"""
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return
        
        # Get all vulnerabilities for this scan
        vulnerabilities = self.db.query(Vulnerability).filter(
            Vulnerability.scan_id == scan_id
        ).all()
        
        vuln_categories = set(v.probe_category for v in vulnerabilities if v.probe_category)
        vuln_by_category = {}
        for v in vulnerabilities:
            if v.probe_category:
                if v.probe_category not in vuln_by_category:
                    vuln_by_category[v.probe_category] = []
                vuln_by_category[v.probe_category].append(v)
        
        # Create compliance mappings for each framework
        for framework_id, framework_data in COMPLIANCE_FRAMEWORKS.items():
            for req in framework_data["requirements"]:
                # Determine compliance status based on vulnerabilities
                status, evidence, related_vuln_ids = self._assess_requirement(
                    req, vulnerabilities, vuln_categories, vuln_by_category
                )
                
                mapping = ComplianceMapping(
                    scan_id=scan_id,
                    framework=framework_id,
                    requirement_id=req["id"],
                    requirement_name=req["name"],
                    compliance_status=status,
                    evidence=evidence,
                    vulnerability_ids=related_vuln_ids
                )
                self.db.add(mapping)
        
        self.db.commit()
    
    def _assess_requirement(
        self,
        requirement: Dict,
        all_vulnerabilities: List[Vulnerability],
        vuln_categories: set,
        vuln_by_category: Dict
    ) -> tuple:
        """Assess compliance status for a requirement"""
        req_categories = requirement["categories"]
        
        # Find relevant vulnerabilities
        relevant_vulns = []
        if "all" in req_categories:
            relevant_vulns = all_vulnerabilities
        else:
            for cat in req_categories:
                relevant_vulns.extend(vuln_by_category.get(cat, []))
        
        vuln_ids = [v.id for v in relevant_vulns]
        
        if not relevant_vulns:
            # No vulnerabilities found for this category
            if "all" in req_categories:
                return ComplianceStatus.NOT_ASSESSED, "No relevant vulnerabilities assessed.", []
            return ComplianceStatus.COMPLIANT, "No vulnerabilities found in relevant category.", []
        
        # Check severity of vulnerabilities
        critical_high = [v for v in relevant_vulns if v.severity in [Severity.CRITICAL, Severity.HIGH]]
        medium = [v for v in relevant_vulns if v.severity == Severity.MEDIUM]
        
        if critical_high:
            evidence = f"Found {len(critical_high)} critical/high severity vulnerabilities affecting this requirement."
            return ComplianceStatus.NON_COMPLIANT, evidence, vuln_ids
        elif medium:
            evidence = f"Found {len(medium)} medium severity vulnerabilities. Partial compliance achieved."
            return ComplianceStatus.PARTIAL, evidence, vuln_ids
        else:
            evidence = f"Found {len(relevant_vulns)} low severity issues. Requirement substantially met."
            return ComplianceStatus.COMPLIANT, evidence, vuln_ids
    
    def get_compliance_summary(self, scan_id: int, framework: str = None) -> Dict:
        """Get compliance summary for a scan"""
        query = self.db.query(ComplianceMapping).filter(ComplianceMapping.scan_id == scan_id)
        
        if framework:
            query = query.filter(ComplianceMapping.framework == framework)
        
        mappings = query.all()
        
        if not mappings:
            return {}
        
        # Group by framework
        by_framework = {}
        for m in mappings:
            if m.framework not in by_framework:
                by_framework[m.framework] = []
            by_framework[m.framework].append(m)
        
        summaries = {}
        for fw, fw_mappings in by_framework.items():
            total = len(fw_mappings)
            passed = sum(1 for m in fw_mappings if m.compliance_status == ComplianceStatus.COMPLIANT)
            failed = sum(1 for m in fw_mappings if m.compliance_status == ComplianceStatus.NON_COMPLIANT)
            partial = sum(1 for m in fw_mappings if m.compliance_status == ComplianceStatus.PARTIAL)
            not_assessed = sum(1 for m in fw_mappings if m.compliance_status == ComplianceStatus.NOT_ASSESSED)
            
            score = (passed / total * 100) if total > 0 else 0
            
            summaries[fw] = {
                "framework": fw,
                "framework_name": COMPLIANCE_FRAMEWORKS.get(fw, {}).get("name", fw),
                "total": total,
                "passed": passed,
                "failed": failed,
                "partial": partial,
                "not_assessed": not_assessed,
                "score": round(score, 1)
            }
        
        if framework:
            return summaries.get(framework, {})
        
        return summaries
