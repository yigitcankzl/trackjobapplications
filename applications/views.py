from rest_framework import permissions, viewsets
from rest_framework.generics import get_object_or_404

from .models import Application, ApplicationNote
from .serializers import ApplicationSerializer, ApplicationNoteSerializer


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.applications.prefetch_related("note_entries").all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ApplicationNoteViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete"]

    def _get_application(self):
        return get_object_or_404(
            Application,
            pk=self.kwargs["application_pk"],
            user=self.request.user,
        )

    def get_queryset(self):
        return ApplicationNote.objects.filter(
            application__pk=self.kwargs["application_pk"],
            application__user=self.request.user,
        )

    def perform_create(self, serializer):
        application = self._get_application()
        serializer.save(application=application)
