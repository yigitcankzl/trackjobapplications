import pytest
from datetime import date

from applications.models import Application
from .factories import ApplicationFactory, TagFactory


@pytest.mark.django_db
class TestApplicationFilters:
    URL = "/api/v1/applications/"

    def test_filter_by_source(self, auth_client, user):
        ApplicationFactory(user=user, source="linkedin")
        ApplicationFactory(user=user, source="indeed")
        res = auth_client.get(self.URL, {"source": "linkedin"})
        assert res.data["count"] == 1

    def test_filter_date_range(self, auth_client, user):
        ApplicationFactory(user=user, applied_date="2024-01-01")
        ApplicationFactory(user=user, applied_date="2024-06-15")
        ApplicationFactory(user=user, applied_date="2024-12-01")
        res = auth_client.get(self.URL, {"applied_date_after": "2024-03-01", "applied_date_before": "2024-09-01"})
        assert res.data["count"] == 1

    def test_filter_by_tag(self, auth_client, user):
        tag = TagFactory(user=user, name="remote")
        app1 = ApplicationFactory(user=user)
        app1.tags.add(tag)
        ApplicationFactory(user=user)
        res = auth_client.get(self.URL, {"tags": str(tag.id)})
        assert res.data["count"] == 1

    def test_combined_filters(self, auth_client, user):
        ApplicationFactory(user=user, status="applied", source="linkedin")
        ApplicationFactory(user=user, status="rejected", source="linkedin")
        ApplicationFactory(user=user, status="applied", source="indeed")
        res = auth_client.get(self.URL, {"status": "applied", "source": "linkedin"})
        assert res.data["count"] == 1
