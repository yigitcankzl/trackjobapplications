import logging

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

logger = logging.getLogger(__name__)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_notification_preferences(sender, instance, created, **kwargs):
    if created:
        from users.models import NotificationPreference

        try:
            NotificationPreference.objects.get_or_create(user=instance)
        except Exception:
            logger.exception("Failed to create NotificationPreference for user %s", instance.pk)
