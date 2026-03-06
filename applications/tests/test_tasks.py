import pytest
from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone

from applications.tasks import check_stale_applications, send_interview_reminders
from .factories import ApplicationFactory, InterviewStageFactory


@pytest.mark.django_db
class TestCheckStaleApplications:
    @patch("applications.tasks.send_mail")
    def test_notifies_stale(self, mock_mail, user):
        app = ApplicationFactory(user=user, status="applied")
        # Force updated_at to 5 days ago
        from applications.models import Application
        Application.objects.filter(id=app.id).update(updated_at=timezone.now() - timedelta(days=5))

        result = check_stale_applications()
        assert "1 user(s)" in result
        assert mock_mail.called

    @patch("applications.tasks.send_mail")
    def test_ignores_recent(self, mock_mail, user):
        ApplicationFactory(user=user, status="applied")
        # updated_at is now, so not stale
        result = check_stale_applications()
        assert "0 user(s)" in result
        assert not mock_mail.called

    @patch("applications.tasks.send_mail")
    def test_ignores_non_active_statuses(self, mock_mail, user):
        app = ApplicationFactory(user=user, status="rejected")
        from applications.models import Application
        Application.objects.filter(id=app.id).update(updated_at=timezone.now() - timedelta(days=5))

        result = check_stale_applications()
        assert "0 user(s)" in result


@pytest.mark.django_db
class TestSendInterviewReminders:
    @patch("applications.tasks.send_mail")
    def test_sends_for_upcoming(self, mock_mail, user):
        app = ApplicationFactory(user=user)
        InterviewStageFactory(
            application=app,
            scheduled_at=timezone.now() + timedelta(hours=6),
            completed=False,
        )
        result = send_interview_reminders()
        assert "1 user(s)" in result
        assert mock_mail.called

    @patch("applications.tasks.send_mail")
    def test_ignores_completed(self, mock_mail, user):
        app = ApplicationFactory(user=user)
        InterviewStageFactory(
            application=app,
            scheduled_at=timezone.now() + timedelta(hours=6),
            completed=True,
        )
        result = send_interview_reminders()
        assert "0 user(s)" in result
        assert not mock_mail.called

    @patch("applications.tasks.send_mail")
    def test_ignores_past(self, mock_mail, user):
        app = ApplicationFactory(user=user)
        InterviewStageFactory(
            application=app,
            scheduled_at=timezone.now() - timedelta(hours=2),
            completed=False,
        )
        result = send_interview_reminders()
        assert "0 user(s)" in result

    @patch("applications.tasks.send_mail")
    def test_uses_notification_email(self, mock_mail, user):
        user.notification_email = "notify@example.com"
        user.save()
        app = ApplicationFactory(user=user)
        InterviewStageFactory(
            application=app,
            scheduled_at=timezone.now() + timedelta(hours=6),
            completed=False,
        )
        send_interview_reminders()
        call_kwargs = mock_mail.call_args
        assert "notify@example.com" in call_kwargs.kwargs.get("recipient_list", call_kwargs[1].get("recipient_list", []))
