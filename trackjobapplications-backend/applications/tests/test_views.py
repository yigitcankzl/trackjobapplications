import pytest
from datetime import date, datetime, timezone

from applications.models import Application, ApplicationContact, InterviewStage, Tag
from .factories import (
    ApplicationContactFactory,
    ApplicationFactory,
    InterviewStageFactory,
    TagFactory,
)


# ── Application CRUD ──────────────────────────────────────────────

@pytest.mark.django_db
class TestApplicationViewSet:
    URL = "/api/applications/"

    def test_list_own(self, auth_client, user):
        ApplicationFactory.create_batch(3, user=user)
        res = auth_client.get(self.URL)
        assert res.status_code == 200
        assert res.data["count"] == 3

    def test_list_excludes_others(self, auth_client, user, other_user):
        ApplicationFactory(user=user)
        ApplicationFactory(user=other_user)
        res = auth_client.get(self.URL)
        assert res.data["count"] == 1

    def test_create(self, auth_client):
        data = {"company": "Google", "position": "SWE", "applied_date": "2024-06-01"}
        res = auth_client.post(self.URL, data)
        assert res.status_code == 201
        assert res.data["company"] == "Google"

    def test_create_unauthenticated(self, anon_client):
        res = anon_client.post(self.URL, {"company": "X", "position": "Y", "applied_date": "2024-01-01"})
        assert res.status_code == 401

    def test_update(self, auth_client, user):
        app = ApplicationFactory(user=user, company="Old")
        res = auth_client.patch(f"{self.URL}{app.id}/", {"company": "New"})
        assert res.status_code == 200
        assert res.data["company"] == "New"

    def test_delete(self, auth_client, user):
        app = ApplicationFactory(user=user)
        res = auth_client.delete(f"{self.URL}{app.id}/")
        assert res.status_code == 204
        assert not Application.objects.filter(id=app.id).exists()

    def test_cannot_access_others(self, other_client, user):
        app = ApplicationFactory(user=user)
        res = other_client.get(f"{self.URL}{app.id}/")
        assert res.status_code == 404

    def test_search(self, auth_client, user):
        ApplicationFactory(user=user, company="Google", position="SWE")
        ApplicationFactory(user=user, company="Meta", position="PM")
        res = auth_client.get(self.URL, {"search": "Google"})
        assert res.data["count"] == 1

    def test_filter_status(self, auth_client, user):
        ApplicationFactory(user=user, status="applied")
        ApplicationFactory(user=user, status="rejected")
        res = auth_client.get(self.URL, {"status": "applied"})
        assert res.data["count"] == 1

    def test_ordering(self, auth_client, user):
        ApplicationFactory(user=user, company="AAA", applied_date="2024-01-01")
        ApplicationFactory(user=user, company="ZZZ", applied_date="2024-06-01")
        res = auth_client.get(self.URL, {"ordering": "company"})
        companies = [r["company"] for r in res.data["results"]]
        assert companies == sorted(companies)


# ── Bulk Actions ──────────────────────────────────────────────────

@pytest.mark.django_db
class TestBulkActions:
    def test_bulk_update_status(self, auth_client, user):
        apps = ApplicationFactory.create_batch(3, user=user, status="applied")
        ids = [a.id for a in apps]
        res = auth_client.post("/api/applications/bulk-update-status/", {"ids": ids, "status": "interview"}, format="json")
        assert res.status_code == 200
        assert res.data["updated"] == 3
        assert Application.objects.filter(id__in=ids, status="interview").count() == 3

    def test_bulk_update_invalid_status(self, auth_client, user):
        app = ApplicationFactory(user=user)
        res = auth_client.post("/api/applications/bulk-update-status/", {"ids": [app.id], "status": "invalid"}, format="json")
        assert res.status_code == 400

    def test_bulk_update_empty_ids(self, auth_client):
        res = auth_client.post("/api/applications/bulk-update-status/", {"ids": [], "status": "applied"}, format="json")
        assert res.status_code == 400

    def test_bulk_delete(self, auth_client, user):
        apps = ApplicationFactory.create_batch(2, user=user)
        ids = [a.id for a in apps]
        res = auth_client.post("/api/applications/bulk-delete/", {"ids": ids}, format="json")
        assert res.status_code == 200
        assert res.data["deleted"] == 2

    def test_bulk_delete_only_own(self, auth_client, user, other_user):
        own = ApplicationFactory(user=user)
        foreign = ApplicationFactory(user=other_user)
        res = auth_client.post("/api/applications/bulk-delete/", {"ids": [own.id, foreign.id]}, format="json")
        assert res.status_code == 200
        assert res.data["deleted"] == 1
        assert Application.objects.filter(id=foreign.id).exists()


# ── Tags ──────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestTagViewSet:
    URL = "/api/applications/tags/"

    def test_create(self, auth_client):
        res = auth_client.post(self.URL, {"name": "Remote", "color": "#10B981"})
        assert res.status_code == 201
        assert res.data["name"] == "Remote"

    def test_list_own(self, auth_client, user, other_user):
        TagFactory(user=user, name="mine")
        TagFactory(user=other_user, name="theirs")
        res = auth_client.get(self.URL)
        assert len(res.data) == 1
        assert res.data[0]["name"] == "mine"

    def test_delete(self, auth_client, user):
        tag = TagFactory(user=user)
        res = auth_client.delete(f"{self.URL}{tag.id}/")
        assert res.status_code == 204

    def test_assign_tag_to_application(self, auth_client, user):
        tag = TagFactory(user=user)
        res = auth_client.post("/api/applications/", {
            "company": "X", "position": "Y", "applied_date": "2024-01-01", "tag_ids": [tag.id],
        }, format="json")
        assert res.status_code == 201
        assert any(t["id"] == tag.id for t in res.data["tags"])


# ── Contacts ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestContactViewSet:
    def _url(self, app_id):
        return f"/api/applications/{app_id}/contacts/"

    def test_create(self, auth_client, user):
        app = ApplicationFactory(user=user)
        res = auth_client.post(self._url(app.id), {"name": "Jane", "email": "j@x.com", "role": "HR"})
        assert res.status_code == 201
        assert res.data["name"] == "Jane"

    def test_list(self, auth_client, user):
        app = ApplicationFactory(user=user)
        ApplicationContactFactory.create_batch(2, application=app)
        res = auth_client.get(self._url(app.id))
        assert len(res.data) == 2

    def test_delete(self, auth_client, user):
        app = ApplicationFactory(user=user)
        contact = ApplicationContactFactory(application=app)
        res = auth_client.delete(f"{self._url(app.id)}{contact.id}/")
        assert res.status_code == 204

    def test_cannot_access_others_contacts(self, auth_client, other_user):
        app = ApplicationFactory(user=other_user)
        ApplicationContactFactory(application=app)
        res = auth_client.get(self._url(app.id))
        assert res.status_code == 200
        assert len(res.data) == 0


# ── Interview Stages ──────────────────────────────────────────────

@pytest.mark.django_db
class TestInterviewStageViewSet:
    def _url(self, app_id):
        return f"/api/applications/{app_id}/interviews/"

    def test_create(self, auth_client, user):
        app = ApplicationFactory(user=user)
        res = auth_client.post(self._url(app.id), {
            "stage_type": "technical",
            "scheduled_at": "2024-06-15T10:00:00Z",
        })
        assert res.status_code == 201

    def test_toggle_complete(self, auth_client, user):
        app = ApplicationFactory(user=user)
        stage = InterviewStageFactory(application=app, completed=False)
        res = auth_client.patch(f"{self._url(app.id)}{stage.id}/", {"completed": True}, format="json")
        assert res.status_code == 200
        assert res.data["completed"] is True

    def test_cannot_access_others(self, auth_client, other_user):
        app = ApplicationFactory(user=other_user)
        res = auth_client.get(self._url(app.id))
        assert res.status_code == 200
        assert len(res.data) == 0


# ── Attachments ───────────────────────────────────────────────────

@pytest.mark.django_db
class TestAttachmentViewSet:
    def _url(self, app_id):
        return f"/api/applications/{app_id}/attachments/"

    def test_upload(self, auth_client, user, tmp_path, settings):
        from django.core.files.uploadedfile import SimpleUploadedFile
        settings.MEDIA_ROOT = tmp_path
        app = ApplicationFactory(user=user)
        f = SimpleUploadedFile("resume.pdf", b"%PDF-1.4 fakepdf", content_type="application/pdf")
        res = auth_client.post(self._url(app.id), {"file": f, "name": "resume.pdf"}, format="multipart")
        assert res.status_code == 201

    def test_reject_exe(self, auth_client, user):
        from django.core.files.uploadedfile import SimpleUploadedFile
        app = ApplicationFactory(user=user)
        f = SimpleUploadedFile("malware.exe", b"bad", content_type="application/octet-stream")
        res = auth_client.post(self._url(app.id), {"file": f, "name": "malware.exe"}, format="multipart")
        assert res.status_code == 400

    def test_cannot_access_others_attachments(self, auth_client, other_user):
        app = ApplicationFactory(user=other_user)
        res = auth_client.get(self._url(app.id))
        assert res.status_code == 200
        assert len(res.data) == 0


# ── Stats ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestStats:
    URL = "/api/applications/stats/"

    def test_stats_returns_counts(self, auth_client, user):
        ApplicationFactory(user=user, status="applied")
        ApplicationFactory(user=user, status="applied")
        ApplicationFactory(user=user, status="interview")
        res = auth_client.get(self.URL)
        assert res.status_code == 200
        assert res.data["total"] == 3
        assert res.data["applied"] == 2
        assert res.data["interview"] == 1
        assert res.data["rejected"] == 0

    def test_stats_empty(self, auth_client):
        res = auth_client.get(self.URL)
        assert res.status_code == 200
        assert res.data["total"] == 0

    def test_stats_excludes_other_users(self, auth_client, user, other_user):
        ApplicationFactory(user=user, status="applied")
        ApplicationFactory(user=other_user, status="offer")
        res = auth_client.get(self.URL)
        assert res.data["total"] == 1
        assert res.data["offer"] == 0


# ── Toggle Pin ───────────────────────────────────────────────────

@pytest.mark.django_db
class TestTogglePin:
    def test_toggle_pin_on(self, auth_client, user):
        app = ApplicationFactory(user=user, is_pinned=False)
        res = auth_client.post(f"/api/applications/{app.id}/toggle-pin/")
        assert res.status_code == 200
        assert res.data["is_pinned"] is True

    def test_toggle_pin_off(self, auth_client, user):
        app = ApplicationFactory(user=user, is_pinned=True)
        res = auth_client.post(f"/api/applications/{app.id}/toggle-pin/")
        assert res.status_code == 200
        assert res.data["is_pinned"] is False

    def test_toggle_pin_others_denied(self, auth_client, other_user):
        app = ApplicationFactory(user=other_user)
        res = auth_client.post(f"/api/applications/{app.id}/toggle-pin/")
        assert res.status_code == 404


# ── Export PDF ───────────────────────────────────────────────────

@pytest.mark.django_db
class TestExportPdf:
    def test_export_pdf(self, auth_client, user):
        ApplicationFactory(user=user, company="TestCo", position="Dev")
        res = auth_client.get("/api/applications/export-pdf/")
        assert res.status_code == 200
        assert res["Content-Type"] == "application/pdf"
        assert b"%PDF" in res.content

    def test_export_pdf_empty(self, auth_client):
        res = auth_client.get("/api/applications/export-pdf/")
        assert res.status_code == 200
        assert b"%PDF" in res.content

    def test_export_pdf_includes_content_length(self, auth_client, user):
        ApplicationFactory(user=user)
        res = auth_client.get("/api/applications/export-pdf/")
        assert res.status_code == 200
        assert "Content-Length" in res
        assert int(res["Content-Length"]) > 0

    def test_export_pdf_content_length_matches_body(self, auth_client, user):
        ApplicationFactory(user=user)
        res = auth_client.get("/api/applications/export-pdf/")
        assert res.status_code == 200
        assert int(res["Content-Length"]) == len(res.content)

    def test_export_pdf_returns_413_when_too_large(self, auth_client, user, monkeypatch):
        from applications import views as app_views
        big = b"x" * (11 * 1024 * 1024)  # 11 MB > 10 MB limit
        monkeypatch.setattr(app_views, "generate_applications_pdf", lambda *_: big)
        ApplicationFactory(user=user)
        res = auth_client.get("/api/applications/export-pdf/")
        assert res.status_code == 413
        assert "too large" in res.json()["error"].lower()

    def test_export_pdf_accepts_exactly_at_limit(self, auth_client, user, monkeypatch):
        from applications import views as app_views
        at_limit = b"%PDF" + b"x" * (10 * 1024 * 1024 - 4)  # exactly 10 MB
        monkeypatch.setattr(app_views, "generate_applications_pdf", lambda *_: at_limit)
        ApplicationFactory(user=user)
        res = auth_client.get("/api/applications/export-pdf/")
        assert res.status_code == 200

    def test_export_pdf_requires_auth(self, anon_client):
        res = anon_client.get("/api/applications/export-pdf/")
        assert res.status_code == 401

    def test_export_pdf_generation_failure_returns_500(self, auth_client, user, monkeypatch):
        from applications import views as app_views
        monkeypatch.setattr(app_views, "generate_applications_pdf", lambda *_: (_ for _ in ()).throw(RuntimeError("boom")))
        ApplicationFactory(user=user)
        res = auth_client.get("/api/applications/export-pdf/")
        assert res.status_code == 500


# ── Cover Letter Templates ───────────────────────────────────────

@pytest.mark.django_db
class TestCoverLetterTemplateViewSet:
    URL = "/api/applications/cover-letters/"

    def test_create(self, auth_client):
        res = auth_client.post(self.URL, {"name": "General", "content": "Dear {company}..."})
        assert res.status_code == 201
        assert res.data["name"] == "General"

    def test_list_own(self, auth_client, user, other_user):
        from applications.models import CoverLetterTemplate
        CoverLetterTemplate.objects.create(user=user, name="Mine", content="...")
        CoverLetterTemplate.objects.create(user=other_user, name="Theirs", content="...")
        res = auth_client.get(self.URL)
        assert len(res.data) == 1
        assert res.data[0]["name"] == "Mine"

    def test_update(self, auth_client, user):
        from applications.models import CoverLetterTemplate
        tpl = CoverLetterTemplate.objects.create(user=user, name="Old", content="old content")
        res = auth_client.patch(f"{self.URL}{tpl.id}/", {"name": "New"})
        assert res.status_code == 200
        assert res.data["name"] == "New"

    def test_delete(self, auth_client, user):
        from applications.models import CoverLetterTemplate
        tpl = CoverLetterTemplate.objects.create(user=user, name="ToDelete", content="...")
        res = auth_client.delete(f"{self.URL}{tpl.id}/")
        assert res.status_code == 204
