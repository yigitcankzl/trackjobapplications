import logging

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from django.core.management import call_command

logger = logging.getLogger(__name__)


class CronSendRemindersView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def post(self, request):
        token = request.headers.get("X-Cron-Secret", "")
        if not token or token != settings.CRON_SECRET:
            return Response(status=status.HTTP_403_FORBIDDEN)

        call_command("send_reminders")
        return Response({"status": "ok"})
