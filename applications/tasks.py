import logging
from datetime import timedelta
from collections import defaultdict

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import Application, InterviewStage

logger = logging.getLogger(__name__)

STALE_STATUSES = [choice[0] for choice in Application.STATUS_CHOICES if choice[0] in ("applied", "interview")]


@shared_task
def check_stale_applications():
    """Find applications not updated in 3+ days and notify users."""
    try:
        threshold = timezone.now() - timedelta(days=3)
        stale = Application.objects.filter(
            status__in=STALE_STATUSES,
            updated_at__lte=threshold,
        ).select_related("user")

        by_user = defaultdict(list)
        for app in stale:
            email = app.user.notification_email or app.user.email
            by_user[email].append(app)

        for email, apps in by_user.items():
            lines = [f"- {a.company} — {a.position} (last updated {a.updated_at.strftime('%Y-%m-%d')})" for a in apps]
            body = (
                f"You have {len(apps)} application(s) that haven't been updated in over 3 days:\n\n"
                + "\n".join(lines)
                + "\n\nLog in to TrackJobs to follow up!"
            )
            try:
                send_mail(
                    subject=f"TrackJobs: {len(apps)} application(s) need follow-up",
                    message=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                )
            except Exception:
                logger.exception("Failed to send stale application email to %s", email)

        result = f"Notified {len(by_user)} user(s) about {sum(len(a) for a in by_user.values())} stale application(s)"
        logger.info(result)
        return result
    except Exception:
        logger.exception("check_stale_applications task failed")
        raise


@shared_task
def send_interview_reminders():
    """Email reminder for interviews in the next 24 hours."""
    try:
        now = timezone.now()
        upcoming = InterviewStage.objects.filter(
            scheduled_at__gte=now,
            scheduled_at__lte=now + timedelta(hours=24),
            completed=False,
        ).select_related("application__user")

        by_user = defaultdict(list)
        for stage in upcoming:
            email = stage.application.user.notification_email or stage.application.user.email
            by_user[email].append(stage)

        for email, stages in by_user.items():
            lines = [
                f"- {s.get_stage_type_display()} at {s.application.company} — {s.application.position} "
                f"({s.scheduled_at.strftime('%Y-%m-%d %H:%M')})"
                for s in stages
            ]
            body = (
                f"You have {len(stages)} upcoming interview(s) in the next 24 hours:\n\n"
                + "\n".join(lines)
                + "\n\nGood luck!"
            )
            try:
                send_mail(
                    subject=f"TrackJobs: {len(stages)} interview(s) coming up!",
                    message=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                )
            except Exception:
                logger.exception("Failed to send interview reminder to %s", email)

        result = f"Sent interview reminders to {len(by_user)} user(s) for {sum(len(s) for s in by_user.values())} interview(s)"
        logger.info(result)
        return result
    except Exception:
        logger.exception("send_interview_reminders task failed")
        raise
