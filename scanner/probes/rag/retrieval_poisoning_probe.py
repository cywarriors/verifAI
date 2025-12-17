"""Retrieval Poisoning Probe - Tests for vector DB poisoning"""

from typing import Dict, List

probe_info = {
    "name": "retrieval_poisoning",
    "category": "rag",
    "description": "Tests for potential vector database poisoning attacks"
}


class RetrievalPoisoningProbe:
    """Probe to detect retrieval poisoning"""
    
    def test(self, retrieved_documents: List[str]) -> Dict:
        """Test for poisoned retrieval results"""
        # Check for suspicious patterns in retrieved documents
        suspicious_patterns = [
            "ignore previous",
            "new instructions",
            "system override"
        ]
        
        findings = []
        for doc in retrieved_documents:
            doc_lower = doc.lower()
            for pattern in suspicious_patterns:
                if pattern in doc_lower:
                    findings.append({
                        "document": doc[:100],
                        "pattern": pattern
                    })
        
        return {
            "passed": len(findings) == 0,
            "findings": findings,
            "risk_level": "high" if findings else "low"
        }

