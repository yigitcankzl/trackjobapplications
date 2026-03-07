import pytest
from django.db import IntegrityError

from applications.models import Application, ApplicationContact, ApplicationNote, InterviewStage, Tag
from .factories import ApplicationFactory, ApplicationContactFactory, ApplicationNoteFactory, InterviewStageFactory, TagFactory


@pytest.mark.django_db
class TestApplicationModel:
    def test_str(self, user):
        app = ApplicationFactory(user=user, company="Google", position="SWE")
        assert str(app) == "Google — SWE"

    def test_default_ordering(self, user):
        a1 = ApplicationFactory(user=user, applied_date="2024-01-01")
        a2 = ApplicationFactory(user=user, applied_date="2024-06-01")
        apps = list(Application.objects.filter(user=user))
        assert apps[0] == a2
        assert apps[1] == a1

    def test_tags_m2m(self, user):
        app = ApplicationFactory(user=user)
        tag = TagFactory(user=user, name="urgent")
        app.tags.add(tag)
        assert tag in app.tags.all()


@pytest.mark.django_db
class TestTagModel:
    def test_str(self, user):
        tag = TagFactory(user=user, name="Remote")
        assert str(tag) == "Remote"

    def test_unique_together(self, user):
        TagFactory(user=user, name="duplicate")
        with pytest.raises(IntegrityError):
            TagFactory(user=user, name="duplicate")

    def test_different_users_same_name(self, user, other_user):
        TagFactory(user=user, name="shared")
        tag2 = TagFactory(user=other_user, name="shared")
        assert tag2.pk is not None


@pytest.mark.django_db
class TestApplicationNoteModel:
    def test_str(self, user):
        app = ApplicationFactory(user=user)
        note = ApplicationNoteFactory(application=app, content="Follow up")
        assert "Note on" in str(note)


@pytest.mark.django_db
class TestApplicationContactModel:
    def test_str(self, user):
        app = ApplicationFactory(user=user)
        contact = ApplicationContactFactory(application=app, name="Jane", role="HR")
        assert str(contact) == "Jane (HR)"


@pytest.mark.django_db
class TestInterviewStageModel:
    def test_str(self, user):
        app = ApplicationFactory(user=user)
        stage = InterviewStageFactory(application=app, stage_type="technical")
        assert "Technical" in str(stage)

    def test_default_ordering(self, user):
        from datetime import datetime, timezone, timedelta
        app = ApplicationFactory(user=user)
        s1 = InterviewStageFactory(application=app, scheduled_at=datetime(2024, 6, 1, tzinfo=timezone.utc))
        s2 = InterviewStageFactory(application=app, scheduled_at=datetime(2024, 1, 1, tzinfo=timezone.utc))
        stages = list(InterviewStage.objects.filter(application=app))
        assert stages[0] == s2
        assert stages[1] == s1
