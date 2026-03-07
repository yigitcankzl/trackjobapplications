import logging
from collections import defaultdict
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from .email_utils import send_html_email
from .models import InterviewStage

logger = logging.getLogger(__name__)


@shared_task
def send_interview_reminders():
    """Email reminder for upcoming interviews based on user preferences."""
    try:
        from users.models import NotificationPreference

        now = timezone.now()
        prefs = NotificationPreference.objects.filter(
            email_notifications_enabled=True,
        ).select_related("user")

        total_users = 0
        total_stages = 0

        for pref in prefs:
            window = timedelta(hours=pref.interview_reminder_hours)
            upcoming = InterviewStage.objects.filter(
                application__user=pref.user,
                scheduled_at__gte=now,
                scheduled_at__lte=now + window,
                completed=False,
                reminder_sent=False,
            ).select_related("application")

            stages_list = list(upcoming)
            if not stages_list:
                continue

            email = pref.user.notification_email or pref.user.email
            try:
                send_html_email(
                    subject=f"TrackJobs: {len(stages_list)} interview(s) coming up!",
                    template_name="emails/interview_reminder.html",
                    context={
                        "user_name": pref.user.first_name,
                        "stages": stages_list,
                        "frontend_url": settings.FRONTEND_URL,
                    },
                    recipient_email=email,
                )
                upcoming.update(reminder_sent=True)
                total_users += 1
                total_stages += len(stages_list)
            except Exception:
                logger.exception("Failed to send interview reminder to %s", email)

        result = f"Sent interview reminders to {total_users} user(s) for {total_stages} interview(s)"
        logger.info(result)
        return result
    except Exception:
        logger.exception("send_interview_reminders task failed")
        raise
