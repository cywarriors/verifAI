"""Policy Engine - Enforces scanning policies, thresholds, and alerting rules"""

from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.db.models import Scan, ScanFinding, RiskLevel


class PolicyEngine:
    """Enforces scanning policies and thresholds"""
    
    DEFAULT_THRESHOLDS = {
        "max_critical_findings": 0,
        "max_high_findings": 5,
        "max_medium_findings": 10,
        "max_risk_score": 50,
        "require_remediation_critical": True,
        "require_remediation_high": True
    }
    
    def __init__(self, db: Session, policy_config: Optional[Dict] = None):
        self.db = db
        self.thresholds = policy_config or self.DEFAULT_THRESHOLDS
    
    def evaluate_scan(self, scan_id: int) -> Dict:
        """Evaluate a scan against policies"""
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            raise ValueError(f"Scan {scan_id} not found")
        
        findings = self.db.query(ScanFinding).filter(ScanFinding.scan_id == scan_id).all()
        
        # Count findings by risk level
        counts = {
            "critical": len([f for f in findings if f.risk_level == RiskLevel.CRITICAL]),
            "high": len([f for f in findings if f.risk_level == RiskLevel.HIGH]),
            "medium": len([f for f in findings if f.risk_level == RiskLevel.MEDIUM]),
            "low": len([f for f in findings if f.risk_level == RiskLevel.LOW]),
            "info": len([f for f in findings if f.risk_level == RiskLevel.INFO])
        }
        
        # Calculate risk score
        risk_score = self._calculate_risk_score(findings)
        
        # Check violations
        violations = []
        alerts = []
        
        if counts["critical"] > self.thresholds["max_critical_findings"]:
            violations.append("CRITICAL: Exceeds maximum critical findings threshold")
            alerts.append({
                "level": "critical",
                "message": f"Scan has {counts['critical']} critical findings, exceeding threshold of {self.thresholds['max_critical_findings']}",
                "action": "block_deployment"
            })
        
        if counts["high"] > self.thresholds["max_high_findings"]:
            violations.append("HIGH: Exceeds maximum high findings threshold")
            alerts.append({
                "level": "high",
                "message": f"Scan has {counts['high']} high findings, exceeding threshold of {self.thresholds['max_high_findings']}",
                "action": "require_approval"
            })
        
        if counts["medium"] > self.thresholds["max_medium_findings"]:
            violations.append("MEDIUM: Exceeds maximum medium findings threshold")
            alerts.append({
                "level": "medium",
                "message": f"Scan has {counts['medium']} medium findings, exceeding threshold of {self.thresholds['max_medium_findings']}",
                "action": "warn"
            })
        
        if risk_score > self.thresholds["max_risk_score"]:
            violations.append(f"RISK_SCORE: Overall risk score {risk_score} exceeds threshold of {self.thresholds['max_risk_score']}")
            alerts.append({
                "level": "high",
                "message": f"Overall risk score of {risk_score} exceeds threshold",
                "action": "require_review"
            })
        
        # Check remediation requirements
        if self.thresholds.get("require_remediation_critical", False):
            critical_findings = [f for f in findings if f.risk_level == RiskLevel.CRITICAL]
            unremediated = [f for f in critical_findings if not f.remediation]
            if unremediated:
                violations.append("REMEDIATION: Critical findings without remediation")
                alerts.append({
                    "level": "critical",
                    "message": f"{len(unremediated)} critical findings lack remediation plans",
                    "action": "block_deployment"
                })
        
        policy_passed = len(violations) == 0
        
        return {
            "policy_passed": policy_passed,
            "violations": violations,
            "alerts": alerts,
            "findings_count": counts,
            "risk_score": risk_score,
            "thresholds": self.thresholds
        }
    
    def _calculate_risk_score(self, findings: List[ScanFinding]) -> float:
        """Calculate overall risk score"""
        risk_weights = {
            RiskLevel.CRITICAL: 10,
            RiskLevel.HIGH: 7,
            RiskLevel.MEDIUM: 4,
            RiskLevel.LOW: 1,
            RiskLevel.INFO: 0
        }
        
        total_score = sum(risk_weights.get(f.risk_level, 0) for f in findings)
        max_possible = len(findings) * 10 if findings else 1
        return min(100, (total_score / max_possible * 100)) if max_possible > 0 else 0
    
    def should_block_deployment(self, scan_id: int) -> bool:
        """Determine if deployment should be blocked based on policies"""
        evaluation = self.evaluate_scan(scan_id)
        
        # Block if critical violations exist
        critical_alerts = [a for a in evaluation["alerts"] if a["action"] == "block_deployment"]
        return len(critical_alerts) > 0
    
    def get_policy_recommendations(self, scan_id: int) -> List[str]:
        """Get policy recommendations for a scan"""
        evaluation = self.evaluate_scan(scan_id)
        recommendations = []
        
        if not evaluation["policy_passed"]:
            recommendations.append("Review and remediate all critical findings before deployment")
            recommendations.append("Address high-risk findings to improve security posture")
            recommendations.append("Consider implementing additional security controls")
        
        return recommendations

