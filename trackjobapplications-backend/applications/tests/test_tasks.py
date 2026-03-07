import pytest
from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone

from applications.tasks import send_interview_reminders
from users.models import NotificationPreference
from .factories import ApplicationFactory, InterviewStageFactory


@pytest.mark.django_db
class TestSendInterviewReminders:
    def _enable_notifications(self, user, hours=24):
        pref, _ = NotificationPreference.objects.get_or_create(user=user)
        pref.email_notifications_enabled = True
        pref.interview_reminder_hours = hours
        pref.save()

    @patch("applications.email_utils.send_mail")
    def test_sends_for_upcoming(self, mock_mail, user):
        self._enable_notifications(user)
        app = ApplicationFactory(user=user)
        InterviewStageFactory(
            application=app,
            scheduled_at=timezone.now() + timedelta(hours=6),
            completed=False,
        )
        result = send_interview_reminders()
        assert "1 user(s)" in result
        assert mock_mail.called

    @patch("applications.email_utils.send_mail")
    def test_ignores_when_disabled(self, mock_mail, user):
        app = ApplicationFactory(user=user)
        InterviewStageFactory(
            application=app,
            scheduled_at=timezone.now() + timedelta(hours=6),
            completed=False,
        )
        result = send_interview_reminders()
        assert "0 user(s)" in result
        assert not mock_mail.called

    @patch("applications.email_utils.send_mail")
    def test_ignores_completed(self, mock_mail, user):
        self._enable_notifications(user)
        app = ApplicationFactory(user=user)
        InterviewStageFactory(
            application=app,
            scheduled_at=timezone.now() + timedelta(hours=6),
            completed=True,
        )
        result = send_interview_reminders()
        assert "0 user(s)" in result
        assert not mock_mail.called

    @patch("applications.email_utils.send_mail")
    def test_ignores_past(self, mock_mail, user):
        self._enable_notifications(user)
        app = ApplicationFactory(user=user)
        InterviewStageFactory(
            application=app,
            scheduled_at=timezone.now() - timedelta(hours=2),
            completed=False,
        )
        result = send_interview_reminders()
        assert "0 user(s)" in result

    @patch("applications.email_utils.send_mail")
    def test_respects_reminder_hours(self, mock_mail, user):
        self._enable_notifications(user, hours=1)
        app = ApplicationFactory(user=user)
        InterviewStageFactory(
            application=app,
            scheduled_at=timezone.now() + timedelta(hours=6),
            completed=False,
        )
        result = send_interview_reminders()
        assert "0 user(s)" in result
        assert not mock_mail.called

    @patch("applications.email_utils.send_mail")
    def test_uses_notification_email(self, mock_mail, user):
        user.notification_email = "notify@example.com"
        user.save()
        self._enable_notifications(user)
        app = ApplicationFactory(user=user)
        InterviewStageFactory(
            application=app,
            scheduled_at=timezone.now() + timedelta(hours=6),
            completed=False,
        )
        send_interview_reminders()
        call_kwargs = mock_mail.call_args
        assert "notify@example.com" in call_kwargs.kwargs.get("recipient_list", [])

    @patch("applications.email_utils.send_mail")
    def test_reminder_sent_dedup(self, mock_mail, user):
        self._enable_notifications(user)
        app = ApplicationFactory(user=user)
        stage = InterviewStageFactory(
            application=app,
            scheduled_at=timezone.now() + timedelta(hours=6),
            completed=False,
        )
        send_interview_reminders()
        assert mock_mail.call_count == 1
        stage.refresh_from_db()
        assert stage.reminder_sent is True

        mock_mail.reset_mock()
        send_interview_reminders()
        assert not mock_mail.called
