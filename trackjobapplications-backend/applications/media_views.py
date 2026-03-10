import os

from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView


class SecureMediaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, path):
        full_path = os.path.join(settings.MEDIA_ROOT, path)
        # Prevent path traversal
        if not os.path.abspath(full_path).startswith(os.path.abspath(str(settings.MEDIA_ROOT))):
            raise Http404
        if not os.path.isfile(full_path):
            raise Http404
        self._check_ownership(request.user, path)
        safe_name = os.path.basename(full_path).replace('"', "").replace("\n", "").replace("\r", "")
        response = FileResponse(open(full_path, "rb"))
        response["Content-Disposition"] = f'attachment; filename="{safe_name}"'
        return response

    def _check_ownership(self, user, path):
        from applications.models import ApplicationAttachment
        from django.contrib.auth import get_user_model

        User = get_user_model()

        if path.startswith("attachments/"):
            if not ApplicationAttachment.objects.filter(
                file=path, application__user=user
            ).exists():
                raise Http404
        elif path.startswith("avatars/"):
            if not User.objects.filter(pk=user.pk, avatar=path).exists():
                raise Http404
        elif path.startswith("resumes/"):
            if not User.objects.filter(pk=user.pk, resume=path).exists():
                raise Http404
        else:
            raise Http404
