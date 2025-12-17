"""Smoke tests for scan endpoints"""

import pytest
from app.db.models import Scan, ScanStatus, Vulnerability, Severity


class TestScanCreate:
    """Test scan creation scenarios"""

    def test_create_scan_success(self, client, auth_headers):
        """Test successful scan creation"""
        response = client.post(
            "/api/v1/scans/",
            headers=auth_headers,
            json={
                "name": "Test Scan",
                "description": "A test scan",
                "model_name": "gpt-3.5-turbo",
                "model_type": "openai"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Scan"
        assert data["model_name"] == "gpt-3.5-turbo"
        assert data["model_type"] == "openai"
        assert data["status"] == "pending"
        assert "id" in data

    def test_create_scan_with_config(self, client, auth_headers):
        """Test scan creation with LLM config"""
        response = client.post(
            "/api/v1/scans/",
            headers=auth_headers,
            json={
                "name": "Configured Scan",
                "model_name": "gpt-4",
                "model_type": "openai",
                "llm_config": {
                    "temperature": 0.5,
                    "max_tokens": 1000
                }
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Configured Scan"

    def test_create_scan_no_auth(self, client):
        """Test scan creation without auth fails"""
        response = client.post(
            "/api/v1/scans/",
            json={
                "name": "Test Scan",
                "model_name": "gpt-3.5-turbo",
                "model_type": "openai"
            }
        )
        assert response.status_code == 401

    def test_create_scan_missing_required_fields(self, client, auth_headers):
        """Test scan creation with missing fields fails"""
        response = client.post(
            "/api/v1/scans/",
            headers=auth_headers,
            json={
                "name": "Test Scan"
                # Missing model_name and model_type
            }
        )
        assert response.status_code == 422


class TestScanList:
    """Test scan listing scenarios"""

    def test_list_scans_empty(self, client, auth_headers):
        """Test listing scans when none exist"""
        response = client.get("/api/v1/scans/", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_list_scans_with_data(self, client, auth_headers, db_session, auth_user):
        """Test listing scans with existing data"""
        # Create a scan directly in DB
        scan = Scan(
            name="Existing Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get("/api/v1/scans/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Existing Scan"

    def test_list_scans_with_status_filter(self, client, auth_headers, db_session, auth_user):
        """Test listing scans with status filter"""
        # Create scans with different statuses
        for status in [ScanStatus.PENDING, ScanStatus.COMPLETED, ScanStatus.FAILED]:
            scan = Scan(
                name=f"Scan {status.value}",
                model_name="gpt-4",
                model_type="openai",
                status=status,
                created_by=auth_user.id
            )
            db_session.add(scan)
        db_session.commit()

        response = client.get(
            "/api/v1/scans/?status_filter=completed",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "completed"

    def test_list_scans_pagination(self, client, auth_headers, db_session, auth_user):
        """Test scan listing with pagination"""
        # Create multiple scans
        for i in range(5):
            scan = Scan(
                name=f"Scan {i}",
                model_name="gpt-4",
                model_type="openai",
                status=ScanStatus.PENDING,
                created_by=auth_user.id
            )
            db_session.add(scan)
        db_session.commit()

        response = client.get(
            "/api/v1/scans/?skip=0&limit=2",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_list_scans_no_auth(self, client):
        """Test listing scans without auth fails"""
        response = client.get("/api/v1/scans/")
        assert response.status_code == 401


class TestScanGet:
    """Test getting individual scan scenarios"""

    def test_get_scan_success(self, client, auth_headers, db_session, auth_user):
        """Test getting a specific scan"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(f"/api/v1/scans/{scan.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["name"] == "Test Scan"

    def test_get_scan_not_found(self, client, auth_headers):
        """Test getting non-existent scan fails"""
        response = client.get("/api/v1/scans/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_scan_other_users(self, client, admin_auth_headers, db_session, auth_user):
        """Test that users cannot access other users' scans"""
        scan = Scan(
            name="Other User Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id  # Created by test_user
        )
        db_session.add(scan)
        db_session.commit()

        # Admin trying to access (in current implementation, users can only see their own)
        response = client.get(f"/api/v1/scans/{scan.id}", headers=admin_auth_headers)
        assert response.status_code == 404  # Not found for this user


class TestScanVulnerabilities:
    """Test scan vulnerabilities endpoint"""

    def test_get_vulnerabilities_empty(self, client, auth_headers, db_session, auth_user):
        """Test getting vulnerabilities when none exist"""
        scan = Scan(
            name="Clean Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.get(
            f"/api/v1/scans/{scan.id}/vulnerabilities",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_get_vulnerabilities_with_data(self, client, auth_headers, db_session, auth_user):
        """Test getting vulnerabilities with data"""
        scan = Scan(
            name="Vulnerable Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        vuln = Vulnerability(
            scan_id=scan.id,
            title="Prompt Injection",
            description="System prompt can be extracted",
            severity=Severity.HIGH,
            probe_name="prompt_injection",
            probe_category="injection"
        )
        db_session.add(vuln)
        db_session.commit()

        response = client.get(
            f"/api/v1/scans/{scan.id}/vulnerabilities",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Prompt Injection"
        assert data[0]["severity"] == "high"


class TestScanCancel:
    """Test scan cancellation scenarios"""

    def test_cancel_pending_scan(self, client, auth_headers, db_session, auth_user):
        """Test cancelling a pending scan"""
        scan = Scan(
            name="Pending Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.PENDING,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.post(
            f"/api/v1/scans/{scan.id}/cancel",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert "cancelled" in response.json()["message"].lower()

    def test_cancel_running_scan(self, client, auth_headers, db_session, auth_user):
        """Test cancelling a running scan"""
        scan = Scan(
            name="Running Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.RUNNING,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.post(
            f"/api/v1/scans/{scan.id}/cancel",
            headers=auth_headers
        )
        assert response.status_code == 200

    def test_cancel_completed_scan_fails(self, client, auth_headers, db_session, auth_user):
        """Test cancelling a completed scan fails"""
        scan = Scan(
            name="Completed Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.post(
            f"/api/v1/scans/{scan.id}/cancel",
            headers=auth_headers
        )
        assert response.status_code == 400


class TestScanDelete:
    """Test scan deletion scenarios"""

    def test_delete_scan_success(self, client, auth_headers, db_session, auth_user):
        """Test deleting a scan"""
        scan = Scan(
            name="To Delete",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()
        scan_id = scan.id

        response = client.delete(f"/api/v1/scans/{scan_id}", headers=auth_headers)
        assert response.status_code == 200

        # Verify deletion
        response = client.get(f"/api/v1/scans/{scan_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_running_scan_fails(self, client, auth_headers, db_session, auth_user):
        """Test deleting a running scan fails"""
        scan = Scan(
            name="Running Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.RUNNING,
            created_by=auth_user.id
        )
        db_session.add(scan)
        db_session.commit()

        response = client.delete(f"/api/v1/scans/{scan.id}", headers=auth_headers)
        assert response.status_code == 400

    def test_delete_nonexistent_scan(self, client, auth_headers):
        """Test deleting non-existent scan fails"""
        response = client.delete("/api/v1/scans/99999", headers=auth_headers)
        assert response.status_code == 404

