import pytest
from rest_framework.test import APIClient

from users.models import User


@pytest.mark.django_db
class TestRegisterView:
    URL = "/api/auth/register/"

    def test_register_success(self, anon_client):
        data = {
            "email": "new@example.com",
            "first_name": "New",
            "last_name": "User",
            "password": "StrongPass123!",
            "password2": "StrongPass123!",
        }
        res = anon_client.post(self.URL, data)
        assert res.status_code == 201
        assert User.objects.filter(email="new@example.com").exists()

    def test_register_password_mismatch(self, anon_client):
        data = {
            "email": "new@example.com",
            "first_name": "New",
            "last_name": "User",
            "password": "StrongPass123!",
            "password2": "DifferentPass123!",
        }
        res = anon_client.post(self.URL, data)
        assert res.status_code == 400

    def test_register_duplicate_email(self, anon_client, user):
        data = {
            "email": user.email,
            "first_name": "Dup",
            "last_name": "User",
            "password": "StrongPass123!",
            "password2": "StrongPass123!",
        }
        res = anon_client.post(self.URL, data)
        assert res.status_code == 400


@pytest.mark.django_db
class TestMeView:
    URL = "/api/auth/me/"

    def test_get_profile(self, auth_client, user):
        res = auth_client.get(self.URL)
        assert res.status_code == 200
        assert res.data["email"] == user.email

    def test_update_profile(self, auth_client, user):
        res = auth_client.patch(self.URL, {"first_name": "Updated"}, format="json")
        assert res.status_code == 200
        user.refresh_from_db()
        assert user.first_name == "Updated"

    def test_unauthenticated(self, anon_client):
        res = anon_client.get(self.URL)
        assert res.status_code == 401


@pytest.mark.django_db
class TestChangePasswordView:
    URL = "/api/auth/change-password/"

    def test_success(self, auth_client, user):
        data = {
            "old_password": "testpass123",
            "new_password": "NewStrongPass456!",
            "new_password2": "NewStrongPass456!",
        }
        res = auth_client.post(self.URL, data)
        assert res.status_code == 200
        user.refresh_from_db()
        assert user.check_password("NewStrongPass456!")

    def test_wrong_old_password(self, auth_client):
        data = {
            "old_password": "wrongpassword",
            "new_password": "NewStrongPass456!",
            "new_password2": "NewStrongPass456!",
        }
        res = auth_client.post(self.URL, data)
        assert res.status_code == 400

    def test_mismatch_new(self, auth_client):
        data = {
            "old_password": "testpass123",
            "new_password": "NewStrongPass456!",
            "new_password2": "DifferentPass!",
        }
        res = auth_client.post(self.URL, data)
        assert res.status_code == 400
