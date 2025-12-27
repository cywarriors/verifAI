"""Smoke tests for authentication endpoints"""

import pytest


class TestAuthRegistration:
    """Test user registration scenarios"""

    def test_register_success(self, client):
        """Test successful user registration"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "Password123!",
                "full_name": "New User"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert data["is_active"] is True
        assert "id" in data

    def test_register_duplicate_username(self, client, test_user):
        """Test registration with existing username fails"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",  # Already exists
                "email": "different@example.com",
                "password": "Password123!"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_duplicate_email(self, client, test_user):
        """Test registration with existing email fails"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "differentuser",
                "email": "test@example.com",  # Already exists
                "password": "Password123!"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_invalid_email(self, client):
        """Test registration with invalid email fails"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "newuser",
                "email": "invalid-email",
                "password": "Password123!"
            }
        )
        assert response.status_code == 422  # Validation error

    def test_register_short_password(self, client):
        """Test registration with short password fails"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "short"  # Too short
            }
        )
        assert response.status_code == 422  # Validation error

    def test_register_short_username(self, client):
        """Test registration with short username fails"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "ab",  # Too short (min 3)
                "email": "newuser@example.com",
                "password": "Password123!"
            }
        )
        assert response.status_code == 422  # Validation error


class TestAuthLogin:
    """Test user login scenarios"""

    def test_login_success(self, client, test_user):
        """Test successful login"""
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "testuser", "password": "Test1234!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, test_user):
        """Test login with wrong password fails"""
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "testuser", "password": "wrongpassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user fails"""
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "nonexistent", "password": "Password123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 401

    def test_login_inactive_user(self, client, db_session, test_user):
        """Test login with inactive user fails"""
        # Deactivate the user
        test_user.is_active = False
        db_session.commit()

        response = client.post(
            "/api/v1/auth/login",
            data={"username": "testuser", "password": "Test1234!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 403
        assert "inactive" in response.json()["detail"].lower()


class TestAuthMe:
    """Test current user endpoint scenarios"""

    def test_get_current_user(self, client, auth_headers):
        """Test getting current user info"""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"

    def test_get_current_user_no_auth(self, client):
        """Test getting current user without auth fails"""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token fails"""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401

    def test_update_current_user(self, client, auth_headers):
        """Test updating current user info"""
        response = client.put(
            "/api/v1/auth/me",
            headers=auth_headers,
            json={"full_name": "Updated Name"}
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "Updated Name"











