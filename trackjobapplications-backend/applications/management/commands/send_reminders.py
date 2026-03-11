import logging
import smtplib
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from applications.email_utils import send_html_email
from applications.models import InterviewStage
from users.models import NotificationPreference

logger = logging.getLogger(__name__)

MAX_RETRIES = 3


class Command(BaseCommand):
    help = "Send email reminders for upcoming interviews."

    def handle(self, *args, **options):
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

            stage_ids = [s.id for s in stages_list]
            email = pref.user.notification_email or pref.user.email
            try:
                self._send_with_retry(pref, stages_list, email)
                InterviewStage.objects.filter(id__in=stage_ids).update(reminder_sent=True)
                total_users += 1
                total_stages += len(stages_list)
            except Exception:
                logger.exception("Failed to send interview reminder to user %s", pref.user.id)

        result = f"Sent interview reminders to {total_users} user(s) for {total_stages} interview(s)"
        logger.info(result)
        self.stdout.write(self.style.SUCCESS(result))

    def _send_with_retry(self, pref, stages_list, email):
        last_exc = None
        for attempt in range(1, MAX_RETRIES + 1):
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
                return
            except (smtplib.SMTPException, IOError, ConnectionError) as exc:
                last_exc = exc
                logger.warning("Attempt %d/%d failed for user %s: %s", attempt, MAX_RETRIES, pref.user.id, exc)
        raise last_exc
