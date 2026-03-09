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


@pytest.mark.django_db
class TestLogoutView:
    URL = "/api/auth/logout/"

    def test_logout_success(self, user):
        client = APIClient()
        login_res = client.post("/api/auth/login/", {"email": user.email, "password": "testpass123"})
        assert login_res.status_code == 200
        refresh = login_res.data["refresh"]
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_res.data['access']}")
        res = client.post(self.URL, {"refresh": refresh})
        assert res.status_code == 200

    def test_logout_unauthenticated(self, anon_client):
        res = anon_client.post(self.URL, {"refresh": "fake"})
        assert res.status_code == 401


@pytest.mark.django_db
class TestLogoutAllView:
    URL = "/api/auth/logout/all/"

    def test_logout_all(self, auth_client):
        res = auth_client.post(self.URL)
        assert res.status_code == 200


@pytest.mark.django_db
class TestVerifyEmailView:
    URL = "/api/auth/verify-email/"

    def test_verify_success(self, anon_client, user):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        res = anon_client.post(self.URL, {"uid": uid, "token": token})
        assert res.status_code == 200
        user.refresh_from_db()
        assert user.is_email_verified is True

    def test_verify_invalid_token(self, anon_client, user):
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        res = anon_client.post(self.URL, {"uid": uid, "token": "invalid"})
        assert res.status_code == 400

    def test_verify_invalid_uid(self, anon_client):
        res = anon_client.post(self.URL, {"uid": "invalid", "token": "fake"})
        assert res.status_code == 400


@pytest.mark.django_db
class TestPasswordResetFlow:
    def test_request_reset(self, anon_client, user):
        res = anon_client.post("/api/auth/password-reset/", {"email": user.email})
        assert res.status_code == 200

    def test_request_reset_nonexistent_email(self, anon_client):
        res = anon_client.post("/api/auth/password-reset/", {"email": "nobody@x.com"})
        # Should still return 200 to prevent enumeration
        assert res.status_code == 200

    def test_confirm_reset(self, anon_client, user):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        res = anon_client.post("/api/auth/password-reset/confirm/", {
            "uid": uid,
            "token": token,
            "new_password": "BrandNewPass789!",
            "new_password2": "BrandNewPass789!",
        })
        assert res.status_code == 200
        user.refresh_from_db()
        assert user.check_password("BrandNewPass789!")

    def test_confirm_reset_mismatch(self, anon_client, user):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        res = anon_client.post("/api/auth/password-reset/confirm/", {
            "uid": uid,
            "token": token,
            "new_password": "Pass1!",
            "new_password2": "Pass2!",
        })
        assert res.status_code == 400
