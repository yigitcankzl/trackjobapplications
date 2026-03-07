import os
import uuid

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models


def avatar_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    return f"avatars/{uuid.uuid4().hex}{ext}"


def resume_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    return f"resumes/{uuid.uuid4().hex}{ext}"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        if not password:
            raise ValueError("Password is required")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(blank=False, unique=True, verbose_name="Email")
    first_name = models.CharField(blank=False, max_length=30, verbose_name="First Name")
    last_name = models.CharField(blank=False, max_length=30, verbose_name="Last Name")
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name="Date Joined")
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True, null=True)
    resume = models.FileField(upload_to=resume_upload_path, blank=True, null=True)
    notification_email = models.EmailField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class NotificationPreference(models.Model):
    REMINDER_HOUR_CHOICES = [
        (1, "1 hour before"),
        (6, "6 hours before"),
        (24, "24 hours before"),
        (48, "48 hours before"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
    )
    email_notifications_enabled = models.BooleanField(default=False)
    interview_reminder_hours = models.PositiveIntegerField(
        default=24,
        choices=REMINDER_HOUR_CHOICES,
    )

    def __str__(self):
        return f"NotificationPreference for {self.user}"
