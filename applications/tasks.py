import logging
from datetime import timedelta
from collections import defaultdict

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import Application

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
