"""Basic API endpoint tests"""

import pytest


class TestBasicEndpoints:
    """Test basic API endpoints"""

    def test_root_endpoint(self, client):
        """Test root endpoint returns app info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "docs" in data
        assert "health" in data

    def test_health_endpoint(self, client):
        """Test health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data

    def test_docs_endpoint(self, client):
        """Test OpenAPI docs endpoint exists"""
        response = client.get("/api/v1/docs")
        # Should redirect or return docs
        assert response.status_code in [200, 307]

    def test_openapi_json(self, client):
        """Test OpenAPI JSON schema endpoint"""
        response = client.get("/api/v1/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "paths" in data


class TestAPIVersioning:
    """Test API versioning"""

    def test_v1_auth_routes_exist(self, client):
        """Test v1 auth routes are accessible"""
        response = client.post("/api/v1/auth/login", data={})
        # Should return 422 (validation error) not 404
        assert response.status_code != 404

    def test_v1_scans_routes_exist(self, client, auth_headers):
        """Test v1 scans routes are accessible"""
        response = client.get("/api/v1/scans/", headers=auth_headers)
        assert response.status_code == 200

    def test_invalid_route_returns_404(self, client):
        """Test invalid routes return 404"""
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404
