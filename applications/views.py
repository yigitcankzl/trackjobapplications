from rest_framework import permissions, viewsets

from .models import Application
from .serializers import ApplicationSerializer


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.applications.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
