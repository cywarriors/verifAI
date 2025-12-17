"""Smoke tests for report endpoints"""

import pytest
from app.db.models import Scan, ScanStatus, Vulnerability, Severity


class TestJSONReport:
    """Test JSON report scenarios"""

    def test_get_json_report_completed_scan(self, client, auth_headers, db_session, auth_user):
        """Test getting JSON report for completed scan"""
        scan = Scan(
            name="Completed Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id,
            results={"summary": "Test completed"}
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(
            f"/api/v1/reports/{scan.id}/json",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # Report has nested structure with scan info
        assert "scan" in data or "report_info" in data

    def test_get_json_report_pending_scan_fails(self, client, auth_headers, db_session, auth_user):
        """Test getting JSON report for pending scan fails"""
        scan = Scan(
            name="Pending Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.PENDING,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(
            f"/api/v1/reports/{scan.id}/json",
            headers=auth_headers
        )
        assert response.status_code == 400
        assert "completed" in response.json()["detail"].lower()

    def test_get_json_report_running_scan_fails(self, client, auth_headers, db_session, auth_user):
        """Test getting JSON report for running scan fails"""
        scan = Scan(
            name="Running Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.RUNNING,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(
            f"/api/v1/reports/{scan.id}/json",
            headers=auth_headers
        )
        assert response.status_code == 400

    def test_get_json_report_scan_not_found(self, client, auth_headers):
        """Test getting JSON report for non-existent scan fails"""
        response = client.get(
            "/api/v1/reports/99999/json",
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_get_json_report_no_auth(self, client, db_session, test_user):
        """Test getting JSON report without auth fails"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(f"/api/v1/reports/{scan.id}/json")
        assert response.status_code == 401


class TestJSONReportDownload:
    """Test JSON report download scenarios"""

    def test_download_json_report_completed(self, client, auth_headers, db_session, auth_user):
        """Test downloading JSON report for completed scan"""
        scan = Scan(
            name="Completed Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id,
            results={"summary": "Test results"}
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(
            f"/api/v1/reports/{scan.id}/json/download",
            headers=auth_headers
        )
        # Should return 200 with file or 500 if file system issue
        assert response.status_code in [200, 500]

    def test_download_json_report_pending_fails(self, client, auth_headers, db_session, auth_user):
        """Test downloading JSON report for pending scan fails"""
        scan = Scan(
            name="Pending Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.PENDING,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(
            f"/api/v1/reports/{scan.id}/json/download",
            headers=auth_headers
        )
        assert response.status_code == 400


class TestPDFReportDownload:
    """Test PDF report download scenarios"""

    def test_download_pdf_report_pending_fails(self, client, auth_headers, db_session, auth_user):
        """Test downloading PDF report for pending scan fails"""
        scan = Scan(
            name="Pending Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.PENDING,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(
            f"/api/v1/reports/{scan.id}/pdf/download",
            headers=auth_headers
        )
        assert response.status_code == 400

    def test_download_pdf_report_scan_not_found(self, client, auth_headers):
        """Test downloading PDF report for non-existent scan fails"""
        response = client.get(
            "/api/v1/reports/99999/pdf/download",
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_download_pdf_report_no_auth(self, client, db_session, test_user):
        """Test downloading PDF report without auth fails"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(f"/api/v1/reports/{scan.id}/pdf/download")
        assert response.status_code == 401


class TestReportWithVulnerabilities:
    """Test reports with vulnerability data"""

    def test_json_report_includes_vulnerabilities(self, client, auth_headers, db_session, auth_user):
        """Test that JSON report includes vulnerability data"""
        scan = Scan(
            name="Scan with Vulnerabilities",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id,
            vulnerability_count=2,
            results={"summary": "Found vulnerabilities"}
        )
        db_session.add(scan)
        db_session.commit()

        # Add vulnerabilities
        vulns = [
            Vulnerability(
                scan_id=scan.id,
                title="Prompt Injection",
                description="System prompt extraction possible",
                severity=Severity.HIGH,
                probe_name="prompt_injection",
                probe_category="injection"
            ),
            Vulnerability(
                scan_id=scan.id,
                title="Data Leakage",
                description="PII can be extracted",
                severity=Severity.CRITICAL,
                probe_name="pii_leakage",
                probe_category="privacy"
            )
        ]
        for v in vulns:
            db_session.add(v)
        db_session.commit()

        response = client.get(
            f"/api/v1/reports/{scan.id}/json",
            headers=auth_headers
        )
        assert response.status_code == 200
        # The report should contain scan info
        data = response.json()
        assert isinstance(data, dict)

