"""Smoke tests for service layer"""

import pytest
from app.services.plugin_manager import PluginManager
from app.services.compliance_engine import ComplianceEngine, COMPLIANCE_FRAMEWORKS
from app.db.models import Scan, ScanStatus, Vulnerability, Severity, ComplianceMapping, ComplianceStatus


class TestPluginManager:
    """Test Plugin Manager functionality"""

    def test_initialization(self):
        """Test plugin manager initializes correctly"""
        manager = PluginManager()
        assert manager is not None

    def test_get_available_probes(self):
        """Test getting available probes"""
        manager = PluginManager()
        probes = manager.get_available_probes()
        
        assert isinstance(probes, list)

    def test_probe_structure(self):
        """Test probe dictionary structure"""
        manager = PluginManager()
        probes = manager.get_available_probes()
        
        if probes:
            probe = probes[0]
            assert "name" in probe
            assert "category" in probe
            assert "description" in probe
            assert "source" in probe

    def test_get_probe_by_name(self):
        """Test getting a specific probe by name"""
        manager = PluginManager()
        probes = manager.get_available_probes()
        
        if probes:
            probe_name = probes[0]["name"]
            found_probe = manager.get_probe_by_name(probe_name)
            assert found_probe is not None
            assert found_probe["name"] == probe_name

    def test_get_nonexistent_probe(self):
        """Test getting non-existent probe returns None"""
        manager = PluginManager()
        probe = manager.get_probe_by_name("nonexistent_probe_xyz")
        
        assert probe is None

    def test_get_probes_by_category(self):
        """Test filtering probes by category"""
        manager = PluginManager()
        probes = manager.get_available_probes()
        
        if probes:
            category = probes[0].get("category")
            if category:
                filtered = manager.get_probes_by_category(category)
                assert isinstance(filtered, list)
                for probe in filtered:
                    assert probe["category"] == category

    def test_get_probes_by_invalid_category(self):
        """Test filtering by invalid category returns empty list"""
        manager = PluginManager()
        filtered = manager.get_probes_by_category("nonexistent_category")
        
        assert filtered == []


class TestComplianceFrameworks:
    """Test compliance framework definitions"""

    def test_frameworks_defined(self):
        """Test that compliance frameworks are defined"""
        assert "nist_ai_rmf" in COMPLIANCE_FRAMEWORKS
        assert "iso_42001" in COMPLIANCE_FRAMEWORKS
        assert "eu_ai_act" in COMPLIANCE_FRAMEWORKS
        assert "india_dpdp" in COMPLIANCE_FRAMEWORKS
        assert "telecom_iot" in COMPLIANCE_FRAMEWORKS

    def test_framework_structure(self):
        """Test framework structure"""
        for framework_id, framework in COMPLIANCE_FRAMEWORKS.items():
            assert "name" in framework
            assert "requirements" in framework
            assert isinstance(framework["requirements"], list)

    def test_requirement_structure(self):
        """Test requirement structure within frameworks"""
        for framework_id, framework in COMPLIANCE_FRAMEWORKS.items():
            for req in framework["requirements"]:
                assert "id" in req
                assert "name" in req
                assert "categories" in req
                assert isinstance(req["categories"], list)

    def test_nist_ai_rmf_requirements(self):
        """Test NIST AI RMF has expected requirements"""
        nist = COMPLIANCE_FRAMEWORKS["nist_ai_rmf"]
        req_ids = [r["id"] for r in nist["requirements"]]
        
        assert "MAP-1.1" in req_ids
        assert "MEASURE-2.1" in req_ids
        assert "MANAGE-1.1" in req_ids
        assert "GOVERN-1.1" in req_ids

    def test_eu_ai_act_requirements(self):
        """Test EU AI Act has expected requirements"""
        eu = COMPLIANCE_FRAMEWORKS["eu_ai_act"]
        req_ids = [r["id"] for r in eu["requirements"]]
        
        assert "ART-9" in req_ids
        assert "ART-10" in req_ids
        assert "ART-15" in req_ids


class TestComplianceEngine:
    """Test Compliance Engine functionality"""

    def test_engine_initialization(self, db_session):
        """Test compliance engine initializes correctly"""
        engine = ComplianceEngine(db_session)
        assert engine is not None
        assert engine.db == db_session

    def test_get_compliance_summary_empty(self, db_session, test_user):
        """Test getting compliance summary for scan with no mappings"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()

        engine = ComplianceEngine(db_session)
        summary = engine.get_compliance_summary(scan.id)
        
        assert summary == {}

    def test_get_compliance_summary_with_mappings(self, db_session, test_user):
        """Test getting compliance summary with existing mappings"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()

        # Add compliance mappings
        mapping = ComplianceMapping(
            scan_id=scan.id,
            framework="nist_ai_rmf",
            requirement_id="MAP-1.1",
            requirement_name="Context of AI System",
            compliance_status=ComplianceStatus.COMPLIANT
        )
        db_session.add(mapping)
        db_session.commit()

        engine = ComplianceEngine(db_session)
        summary = engine.get_compliance_summary(scan.id)
        
        assert "nist_ai_rmf" in summary
        assert summary["nist_ai_rmf"]["total"] == 1
        assert summary["nist_ai_rmf"]["passed"] == 1

    def test_get_compliance_summary_by_framework(self, db_session, test_user):
        """Test getting compliance summary for specific framework"""
        scan = Scan(
            name="Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()

        # Add mappings for multiple frameworks
        for fw in ["nist_ai_rmf", "iso_42001"]:
            mapping = ComplianceMapping(
                scan_id=scan.id,
                framework=fw,
                requirement_id="REQ-1",
                requirement_name="Test Requirement",
                compliance_status=ComplianceStatus.COMPLIANT
            )
            db_session.add(mapping)
        db_session.commit()

        engine = ComplianceEngine(db_session)
        summary = engine.get_compliance_summary(scan.id, framework="nist_ai_rmf")
        
        assert summary.get("framework") == "nist_ai_rmf"
        assert summary.get("total") == 1

    @pytest.mark.asyncio
    async def test_map_vulnerabilities_no_vulns(self, db_session, test_user):
        """Test mapping vulnerabilities when none exist"""
        scan = Scan(
            name="Clean Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()

        engine = ComplianceEngine(db_session)
        await engine.map_vulnerabilities_to_compliance(scan.id)
        
        # Should create mappings for all frameworks
        mappings = db_session.query(ComplianceMapping).filter(
            ComplianceMapping.scan_id == scan.id
        ).all()
        
        assert len(mappings) > 0

    @pytest.mark.asyncio
    async def test_map_vulnerabilities_with_vulns(self, db_session, test_user):
        """Test mapping vulnerabilities with existing vulnerabilities"""
        scan = Scan(
            name="Vulnerable Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()

        # Add a critical vulnerability
        vuln = Vulnerability(
            scan_id=scan.id,
            title="Critical Vulnerability",
            description="A critical issue",
            severity=Severity.CRITICAL,
            probe_name="test_probe",
            probe_category="Prompt Injection"
        )
        db_session.add(vuln)
        db_session.commit()

        engine = ComplianceEngine(db_session)
        await engine.map_vulnerabilities_to_compliance(scan.id)
        
        # Check that some mappings are non-compliant
        non_compliant = db_session.query(ComplianceMapping).filter(
            ComplianceMapping.scan_id == scan.id,
            ComplianceMapping.compliance_status == ComplianceStatus.NON_COMPLIANT
        ).all()
        
        assert len(non_compliant) > 0


class TestDatabaseModels:
    """Test database model creation and relationships"""

    def test_create_user(self, db_session):
        """Test creating a user"""
        from app.db.models import User, UserRole
        from app.core.security import get_password_hash
        
        user = User(
            username="modeltest",
            email="model@test.com",
            hashed_password=get_password_hash("Password123!"),
            role=UserRole.USER
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.is_active is True

    def test_create_scan(self, db_session, test_user):
        """Test creating a scan"""
        scan = Scan(
            name="Model Test Scan",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.PENDING,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()
        
        assert scan.id is not None
        assert scan.progress == 0.0

    def test_create_vulnerability(self, db_session, test_user):
        """Test creating a vulnerability"""
        scan = Scan(
            name="Vuln Test Scan",
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
            severity=Severity.HIGH
        )
        db_session.add(vuln)
        db_session.commit()
        
        assert vuln.id is not None
        assert vuln.scan_id == scan.id

    def test_scan_user_relationship(self, db_session, test_user):
        """Test scan-user relationship"""
        scan = Scan(
            name="Relationship Test",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.PENDING,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()
        
        assert scan.user == test_user
        assert scan in test_user.scans

    def test_scan_vulnerability_relationship(self, db_session, test_user):
        """Test scan-vulnerability relationship"""
        scan = Scan(
            name="Vuln Relationship Test",
            model_name="gpt-4",
            model_type="openai",
            status=ScanStatus.COMPLETED,
            created_by=test_user.id
        )
        db_session.add(scan)
        db_session.commit()

        vuln = Vulnerability(
            scan_id=scan.id,
            title="Related Vulnerability",
            severity=Severity.MEDIUM
        )
        db_session.add(vuln)
        db_session.commit()
        
        assert vuln in scan.vulnerabilities
        assert vuln.scan == scan


class TestHealthEndpoints:
    """Test application health endpoints"""

    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data

    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "docs" in data










