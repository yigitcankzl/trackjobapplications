from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import NotificationPreference

User = get_user_model()


def _validate_file_upload(value, *, max_size, allowed_extensions, magic_bytes, label):
    """Validate an uploaded file's size, extension, and magic bytes."""
    if not value:
        return value
    if value.size > max_size:
        raise serializers.ValidationError(
            f"{label} file size must be under {max_size // (1024 * 1024)} MB."
        )
    ext = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
    if f".{ext}" not in allowed_extensions:
        raise serializers.ValidationError(
            f"Allowed {label.lower()} types: {', '.join(allowed_extensions)}"
        )
    header = value.read(12)
    value.seek(0)
    matched = False
    for magic, exts in magic_bytes.items():
        if header.startswith(magic) and f".{ext}" in exts:
            if magic == b"RIFF" and header[8:12] != b"WEBP":
                continue
            matched = True
            break
    if not matched:
        raise serializers.ValidationError("File content does not match its extension.")
    return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "password", "password2")
        extra_kwargs = {
            "email": {
                "validators": [],  # Remove default unique validator to prevent email enumeration
            },
        }

    def validate_email(self, value):
        return value.lower().strip()

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "date_joined", "is_staff", "avatar", "resume", "notification_email")
        read_only_fields = ("id", "email", "date_joined", "is_staff")

    AVATAR_ALLOWED_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")
    AVATAR_MAGIC_BYTES = {
        b"\x89PNG": {".png"},
        b"\xff\xd8\xff": {".jpg", ".jpeg"},
        b"RIFF": {".webp"},
    }

    def validate_avatar(self, value):
        return _validate_file_upload(
            value,
            max_size=5 * 1024 * 1024,
            allowed_extensions=self.AVATAR_ALLOWED_EXTENSIONS,
            magic_bytes=self.AVATAR_MAGIC_BYTES,
            label="Avatar",
        )

    RESUME_ALLOWED_EXTENSIONS = (".pdf", ".doc", ".docx")
    RESUME_MAGIC_BYTES = {
        b"%PDF": {".pdf"},
        b"\xd0\xcf\x11\xe0": {".doc", ".docx"},
        b"PK": {".docx"},
    }

    def validate_notification_email(self, value):
        if not value:
            return value
        return value.lower().strip()

    def validate_resume(self, value):
        return _validate_file_upload(
            value,
            max_size=10 * 1024 * 1024,
            allowed_extensions=self.RESUME_ALLOWED_EXTENSIONS,
            magic_bytes=self.RESUME_MAGIC_BYTES,
            label="Resume",
        )


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password": "Passwords do not match."})
        return attrs


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    interview_reminder_hours = serializers.ChoiceField(
        choices=NotificationPreference.REMINDER_HOUR_CHOICES,
        required=False,
    )

    class Meta:
        model = NotificationPreference
        fields = ("email_notifications_enabled", "interview_reminder_hours")


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        try:
            self.token = RefreshToken(attrs["refresh"])
        except TokenError:
            raise serializers.ValidationError({"refresh": "Token is invalid or expired."})
        request = self.context.get("request")
        if request and request.user.id != self.token.get("user_id"):
            raise serializers.ValidationError({"refresh": "Token is invalid or expired."})
        return attrs

    def save(self):
        self.token.blacklist()
