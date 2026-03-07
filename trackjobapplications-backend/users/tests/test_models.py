import pytest
from users.models import User


@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self):
        user = User.objects.create_user(
            email="test@example.com",
            password="pass123",
            first_name="Test",
            last_name="User",
        )
        assert user.email == "test@example.com"
        assert user.check_password("pass123")
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_user_no_email(self):
        with pytest.raises(ValueError, match="Email is required"):
            User.objects.create_user(email="", password="pass123", first_name="T", last_name="U")

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            email="admin@example.com",
            password="admin123",
            first_name="Admin",
            last_name="User",
        )
        assert user.is_staff
        assert user.is_superuser

    def test_str(self):
        user = User.objects.create_user(
            email="test@example.com",
            password="pass123",
            first_name="John",
            last_name="Doe",
        )
        assert str(user) == "John Doe"

    def test_normalize_email(self):
        user = User.objects.create_user(
            email="Test@EXAMPLE.COM",
            password="pass123",
            first_name="T",
            last_name="U",
        )
        assert user.email == "Test@example.com"
