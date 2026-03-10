import io
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from applications.models import Application


@pytest.mark.django_db
class TestImportApplications:
    URL = "/api/v1/applications/import/"

    def test_import_csv(self, auth_client, user):
        csv_content = "company,position,applied_date,status\nGoogle,SWE,2024-06-01,applied\nMeta,PM,2024-07-01,interview\n"
        f = SimpleUploadedFile("apps.csv", csv_content.encode(), content_type="text/csv")
        res = auth_client.post(self.URL, {"file": f}, format="multipart")
        assert res.status_code == 200
        assert res.data["created"] == 2
        assert len(res.data["errors"]) == 0
        assert Application.objects.filter(user=user).count() == 2

    def test_import_csv_with_errors(self, auth_client, user):
        csv_content = "company,position,applied_date,status\n,SWE,2024-06-01,applied\nMeta,PM,2024-07-01,interview\n"
        f = SimpleUploadedFile("apps.csv", csv_content.encode(), content_type="text/csv")
        res = auth_client.post(self.URL, {"file": f}, format="multipart")
        assert res.status_code == 200
        assert res.data["created"] == 1
        assert len(res.data["errors"]) == 1
        assert res.data["errors"][0]["row"] == 1

    def test_import_no_file(self, auth_client):
        res = auth_client.post(self.URL, {}, format="multipart")
        assert res.status_code == 400

    def test_import_unsupported_format(self, auth_client):
        f = SimpleUploadedFile("apps.json", b'{}', content_type="application/json")
        res = auth_client.post(self.URL, {"file": f}, format="multipart")
        assert res.status_code == 400

    def test_import_with_column_mapping(self, auth_client, user):
        csv_content = "firma,pozisyon,tarih\nGoogle,SWE,2024-06-01\n"
        f = SimpleUploadedFile("apps.csv", csv_content.encode(), content_type="text/csv")
        import json
        mapping = json.dumps({"firma": "company", "pozisyon": "position", "tarih": "applied_date"})
        res = auth_client.post(self.URL, {"file": f, "column_mapping": mapping}, format="multipart")
        assert res.status_code == 200
        assert res.data["created"] == 1

    def test_import_unauthenticated(self, anon_client):
        f = SimpleUploadedFile("apps.csv", b"company,position\n", content_type="text/csv")
        res = anon_client.post(self.URL, {"file": f}, format="multipart")
        assert res.status_code == 401
