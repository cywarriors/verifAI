"""Smoke tests for compliance endpoints"""

import pytest
from app.db.models import Scan, ScanStatus, ComplianceMapping, ComplianceStatus


class TestComplianceSummary:
    """Test compliance summary scenarios"""

    def test_get_summary_empty(self, client, auth_headers, db_session, auth_user):
        """Test getting compliance summary with no mappings"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(
            f"/api/v1/compliance/{scan.id}/summary",
            headers=auth_headers
        )
        assert response.status_code == 200
        # Should return empty summaries for all frameworks
        data = response.json()
        assert isinstance(data, dict)

    def test_get_summary_with_mappings(self, client, auth_headers, db_session, auth_user):
        """Test getting compliance summary with existing mappings"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        # Add compliance mappings
        mappings = [
            ComplianceMapping(
                scan_id=scan.id,
                framework="nist_ai_rmf",
                requirement_id="MAP-1.1",
                requirement_name="Context of AI System",
                compliance_status=ComplianceStatus.COMPLIANT
            ),
            ComplianceMapping(
                scan_id=scan.id,
                framework="nist_ai_rmf",
                requirement_id="MAP-1.2",
                requirement_name="Intended Purposes",
                compliance_status=ComplianceStatus.NON_COMPLIANT
            ),
            ComplianceMapping(
                scan_id=scan.id,
                framework="nist_ai_rmf",
                requirement_id="MEASURE-2.1",
                requirement_name="Accuracy Testing",
                compliance_status=ComplianceStatus.PARTIAL
            ),
        ]
        for m in mappings:
            db_session.add(m)
        db_session.commit()

        response = client.get(
            f"/api/v1/compliance/{scan.id}/summary",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "nist_ai_rmf" in data
        assert data["nist_ai_rmf"]["total"] == 3
        assert data["nist_ai_rmf"]["passed"] == 1
        assert data["nist_ai_rmf"]["failed"] == 1
        assert data["nist_ai_rmf"]["partial"] == 1

    def test_get_summary_by_framework(self, client, auth_headers, db_session, auth_user):
        """Test getting compliance summary for specific framework"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        # Add mappings for multiple frameworks
        for framework in ["nist_ai_rmf", "iso_42001"]:
            mapping = ComplianceMapping(
                scan_id=scan.id,
                framework=framework,
                requirement_id="REQ-1",
                requirement_name="Test Requirement",
                compliance_status=ComplianceStatus.COMPLIANT
            )
            db_session.add(mapping)
        db_session.commit()

        response = client.get(
            f"/api/v1/compliance/{scan.id}/summary?framework=nist_ai_rmf",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["framework"] == "nist_ai_rmf"
        assert data["total"] == 1

    def test_get_summary_invalid_framework(self, client, auth_headers, db_session, auth_user):
        """Test getting compliance summary with invalid framework"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(
            f"/api/v1/compliance/{scan.id}/summary?framework=invalid_framework",
            headers=auth_headers
        )
        assert response.status_code == 400

    def test_get_summary_scan_not_found(self, client, auth_headers):
        """Test getting compliance summary for non-existent scan"""
        response = client.get(
            "/api/v1/compliance/99999/summary",
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_get_summary_no_auth(self, client, db_session, test_user):
        """Test getting compliance summary without auth fails"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(f"/api/v1/compliance/{scan.id}/summary")
        assert response.status_code == 401


class TestComplianceMappings:
    """Test compliance mappings scenarios"""

    def test_get_mappings_empty(self, client, auth_headers, db_session, auth_user):
        """Test getting mappings when none exist"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(
            f"/api/v1/compliance/{scan.id}/mappings",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_get_mappings_with_data(self, client, auth_headers, db_session, auth_user):
        """Test getting mappings with existing data"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        mapping = ComplianceMapping(
            scan_id=scan.id,
            framework="eu_ai_act",
            requirement_id="ART-9",
            requirement_name="Risk Management System",
            compliance_status=ComplianceStatus.COMPLIANT,
            evidence="All risks documented and managed.",
            vulnerability_ids=[1, 2, 3]
        )
        db_session.add(mapping)
        db_session.commit()

        response = client.get(
            f"/api/v1/compliance/{scan.id}/mappings",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["framework"] == "eu_ai_act"
        assert data[0]["requirement_id"] == "ART-9"
        assert data[0]["compliance_status"] == "compliant"

    def test_get_mappings_filter_by_framework(self, client, auth_headers, db_session, auth_user):
        """Test filtering mappings by framework"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        # Add mappings for different frameworks
        for framework in ["eu_ai_act", "iso_42001", "india_dpdp"]:
            mapping = ComplianceMapping(
                scan_id=scan.id,
                framework=framework,
                requirement_id="REQ-1",
                requirement_name="Test Requirement",
                compliance_status=ComplianceStatus.COMPLIANT
            )
            db_session.add(mapping)
        db_session.commit()

        response = client.get(
            f"/api/v1/compliance/{scan.id}/mappings?framework=eu_ai_act",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["framework"] == "eu_ai_act"

    def test_get_mappings_scan_not_found(self, client, auth_headers):
        """Test getting mappings for non-existent scan"""
        response = client.get(
            "/api/v1/compliance/99999/mappings",
            headers=auth_headers
        )
        assert response.status_code == 404


class TestComplianceStatusValues:
    """Test compliance status enum values"""

    def test_compliance_status_values(self):
        """Test ComplianceStatus enum has expected values"""
        assert ComplianceStatus.COMPLIANT == "compliant"
        assert ComplianceStatus.PARTIAL == "partial"
        assert ComplianceStatus.NON_COMPLIANT == "non_compliant"
        assert ComplianceStatus.NOT_ASSESSED == "not_assessed"

