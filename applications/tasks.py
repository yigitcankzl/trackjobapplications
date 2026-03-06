from datetime import timedelta
from collections import defaultdict

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import Application


@shared_task
def check_stale_applications():
    """Find applications not updated in 3+ days and notify users."""
    threshold = timezone.now() - timedelta(days=3)
    stale = Application.objects.filter(
        status__in=["applied", "interview"],
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
        send_mail(
            subject=f"TrackJobs: {len(apps)} application(s) need follow-up",
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )

    return f"Notified {len(by_user)} user(s) about {sum(len(a) for a in by_user.values())} stale application(s)"
