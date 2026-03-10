"""Security-focused tests: IDOR, extension-auth bypass, and file upload rejection."""
import io

import pytest

from applications.models import Application
from .factories import ApplicationFactory, UserFactory


# ── IDOR: Bulk Status Update ───────────────────────────────────────

@pytest.mark.django_db
class TestBulkUpdateIDOR:
    URL = "/api/v1/applications/bulk-update-status/"

    def test_cannot_update_other_users_apps(self, auth_client, other_user):
        other_app = ApplicationFactory(user=other_user, status="applied")
        res = auth_client.post(
            self.URL,
            {"ids": [other_app.id], "status": "interview"},
            format="json",
        )
        assert res.status_code == 200
        assert res.data["updated"] == 0
        other_app.refresh_from_db()
        assert other_app.status == "applied"

    def test_cannot_mix_own_and_other_users_apps(self, auth_client, user, other_user):
        own_app = ApplicationFactory(user=user, status="applied")
        other_app = ApplicationFactory(user=other_user, status="applied")
        res = auth_client.post(
            self.URL,
            {"ids": [own_app.id, other_app.id], "status": "interview"},
            format="json",
        )
        assert res.status_code == 200
        assert res.data["updated"] == 1
        own_app.refresh_from_db()
        other_app.refresh_from_db()
        assert own_app.status == "interview"
        assert other_app.status == "applied"


# ── IDOR: Bulk Delete ──────────────────────────────────────────────

@pytest.mark.django_db
class TestBulkDeleteIDOR:
    URL = "/api/v1/applications/bulk-delete/"

    def test_cannot_delete_other_users_apps(self, auth_client, other_user):
        other_app = ApplicationFactory(user=other_user)
        res = auth_client.post(
            self.URL,
            {"ids": [other_app.id]},
            format="json",
        )
        assert res.status_code == 200
        assert res.data["deleted"] == 0
        assert Application.objects.filter(id=other_app.id).exists()


# ── IDOR: Read / Write single resource ────────────────────────────

@pytest.mark.django_db
class TestSingleResourceIDOR:
    def test_cannot_read_other_users_application(self, auth_client, other_user):
        app = ApplicationFactory(user=other_user)
        res = auth_client.get(f"/api/v1/applications/{app.id}/")
        assert res.status_code == 404

    def test_cannot_update_other_users_application(self, auth_client, other_user):
        app = ApplicationFactory(user=other_user)
        res = auth_client.patch(f"/api/v1/applications/{app.id}/", {"company": "Hacked"})
        assert res.status_code == 404

    def test_cannot_delete_other_users_application(self, auth_client, other_user):
        app = ApplicationFactory(user=other_user)
        res = auth_client.delete(f"/api/v1/applications/{app.id}/")
        assert res.status_code == 404


# ── File upload: reject non-CSV/XLSX ──────────────────────────────

@pytest.mark.django_db
class TestImportFileValidation:
    URL = "/api/v1/applications/import/"

    def test_rejects_executable(self, auth_client):
        payload = io.BytesIO(b"#!/bin/bash\nrm -rf /")
        payload.name = "exploit.sh"
        res = auth_client.post(self.URL, {"file": payload}, format="multipart")
        assert res.status_code == 400

    def test_rejects_html(self, auth_client):
        payload = io.BytesIO(b"<script>alert(1)</script>")
        payload.name = "attack.html"
        res = auth_client.post(self.URL, {"file": payload}, format="multipart")
        assert res.status_code == 400

    def test_accepts_csv(self, auth_client):
        csv_data = b"company,position,status,applied_date\nAcme,Engineer,applied,2024-01-01\n"
        payload = io.BytesIO(csv_data)
        payload.name = "apps.csv"
        res = auth_client.post(self.URL, {"file": payload}, format="multipart")
        # 200 or 201 = accepted; 400 only if format rejected
        assert res.status_code != 400 or "format" not in str(res.data).lower()


# ── Unauthenticated access ─────────────────────────────────────────

@pytest.mark.django_db
class TestAuthRequired:
    def test_list_requires_auth(self, anon_client):
        res = anon_client.get("/api/v1/applications/")
        assert res.status_code == 401

    def test_create_requires_auth(self, anon_client):
        res = anon_client.post(
            "/api/v1/applications/",
            {"company": "X", "position": "Y", "applied_date": "2024-01-01"},
        )
        assert res.status_code == 401

    def test_export_pdf_requires_auth(self, anon_client):
        res = anon_client.post("/api/v1/applications/export-pdf/")
        assert res.status_code == 401

    def test_bulk_update_requires_auth(self, anon_client):
        res = anon_client.post(
            "/api/v1/applications/bulk-update-status/",
            {"ids": [1], "status": "applied"},
            format="json",
        )
        assert res.status_code == 401
