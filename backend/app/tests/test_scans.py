"""Tests for scan models and status"""

import pytest
from app.db.models import Scan, ScanStatus, Vulnerability, Severity


class TestScanStatusEnum:
    """Test ScanStatus enum"""

    def test_status_values(self):
        """Test ScanStatus enum values"""
        assert ScanStatus.PENDING == "pending"
        assert ScanStatus.RUNNING == "running"
        assert ScanStatus.COMPLETED == "completed"
        assert ScanStatus.FAILED == "failed"
        assert ScanStatus.CANCELLED == "cancelled"

    def test_status_comparison(self):
        """Test status value comparison"""
        assert ScanStatus.PENDING.value == "pending"
        assert ScanStatus.COMPLETED.value == "completed"


class TestSeverityEnum:
    """Test Severity enum"""

    def test_severity_values(self):
        """Test Severity enum values"""
        assert Severity.CRITICAL == "critical"
        assert Severity.HIGH == "high"
        assert Severity.MEDIUM == "medium"
        assert Severity.LOW == "low"
        assert Severity.INFO == "info"


class TestScanModel:
    """Test Scan model"""

    def test_scan_creation(self, db_session, test_user):
        """Test creating a scan model"""
        scan = Scan(
            name="Test Scan Model",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.PENDING,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()
        
        assert scan.id is not None
        assert scan.name == "Test Scan Model"
        assert scan.status == ScanStatus.PENDING
        assert scan.progress == 0.0

    def test_scan_default_values(self, db_session, test_user):
        """Test scan model default values"""
        scan = Scan(
            name="Default Test",
            model_name="gpt-4",
            model_type="openai",
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()
        
        assert scan.status == ScanStatus.PENDING
        assert scan.progress == 0.0
        assert scan.vulnerability_count == 0
        assert scan.created_at is not None


class TestVulnerabilityModel:
    """Test Vulnerability model"""

    def test_vulnerability_creation(self, db_session, test_user):
        """Test creating a vulnerability model"""
        scan = Scan(
            name="Vuln Test",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()

        vuln = Vulnerability(
            scan_id=scan.id,
            title="Test Vulnerability",
            description="Test description",
            severity=Severity.HIGH,
            probe_name="test_probe",
            probe_category="test_category"
        )
        db_session.add(vuln)
        db_session.commit()
        
        assert vuln.id is not None
        assert vuln.title == "Test Vulnerability"
        assert vuln.severity == Severity.HIGH
