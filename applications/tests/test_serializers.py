import pytest
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile

from applications.serializers import (
    ApplicationAttachmentSerializer,
    ApplicationContactSerializer,
    ApplicationSerializer,
    InterviewStageSerializer,
    TagSerializer,
)
from .factories import TagFactory


@pytest.mark.django_db
class TestTagSerializer:
    def test_valid(self):
        data = {"name": "Remote", "color": "#10B981"}
        s = TagSerializer(data=data)
        assert s.is_valid(), s.errors

    def test_missing_name(self):
        s = TagSerializer(data={"color": "#10B981"})
        assert not s.is_valid()
        assert "name" in s.errors


@pytest.mark.django_db
class TestApplicationSerializer:
    def test_valid_minimal(self):
        data = {
            "company": "Acme",
            "position": "Dev",
            "applied_date": "2024-06-01",
        }
        s = ApplicationSerializer(data=data)
        assert s.is_valid(), s.errors

    def test_missing_company(self):
        data = {"position": "Dev", "applied_date": "2024-06-01"}
        s = ApplicationSerializer(data=data)
        assert not s.is_valid()
        assert "company" in s.errors

    def test_tag_ids_write(self, user):
        tag = TagFactory(user=user)
        data = {
            "company": "Acme",
            "position": "Dev",
            "applied_date": "2024-06-01",
            "tag_ids": [tag.id],
        }
        s = ApplicationSerializer(data=data)
        assert s.is_valid(), s.errors

    def test_invalid_status(self):
        data = {
            "company": "Acme",
            "position": "Dev",
            "applied_date": "2024-06-01",
            "status": "invalid_status",
        }
        s = ApplicationSerializer(data=data)
        assert not s.is_valid()
        assert "status" in s.errors


@pytest.mark.django_db
class TestApplicationContactSerializer:
    def test_valid(self):
        data = {"name": "Jane Doe", "email": "jane@example.com", "role": "HR"}
        s = ApplicationContactSerializer(data=data)
        assert s.is_valid(), s.errors

    def test_missing_name(self):
        data = {"email": "jane@example.com"}
        s = ApplicationContactSerializer(data=data)
        assert not s.is_valid()
        assert "name" in s.errors


@pytest.mark.django_db
class TestInterviewStageSerializer:
    def test_valid(self):
        data = {"stage_type": "technical", "scheduled_at": "2024-06-01T10:00:00Z"}
        s = InterviewStageSerializer(data=data)
        assert s.is_valid(), s.errors

    def test_invalid_stage_type(self):
        data = {"stage_type": "invalid", "scheduled_at": "2024-06-01T10:00:00Z"}
        s = InterviewStageSerializer(data=data)
        assert not s.is_valid()
        assert "stage_type" in s.errors


@pytest.mark.django_db
class TestApplicationAttachmentSerializer:
    def test_valid_pdf(self):
        f = SimpleUploadedFile("resume.pdf", b"fakecontent", content_type="application/pdf")
        s = ApplicationAttachmentSerializer(data={"file": f, "name": "resume.pdf"})
        assert s.is_valid(), s.errors

    def test_reject_large_file(self):
        content = b"x" * (10 * 1024 * 1024 + 1)
        f = SimpleUploadedFile("big.pdf", content, content_type="application/pdf")
        s = ApplicationAttachmentSerializer(data={"file": f, "name": "big.pdf"})
        assert not s.is_valid()
        assert "file" in s.errors

    def test_reject_disallowed_extension(self):
        f = SimpleUploadedFile("script.exe", b"fakecontent", content_type="application/octet-stream")
        s = ApplicationAttachmentSerializer(data={"file": f, "name": "script.exe"})
        assert not s.is_valid()
        assert "file" in s.errors
