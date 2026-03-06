from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination

from .filters import ApplicationFilter
from .models import Application, ApplicationNote
from .serializers import ApplicationSerializer, ApplicationNoteSerializer


class ApplicationPagination(PageNumberPagination):
    page_size = 20

    def paginate_queryset(self, queryset, request, view=None):
        if request.query_params.get("page_size") == "all":
            return None
        return super().paginate_queryset(queryset, request, view)


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = ApplicationPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ApplicationFilter
    search_fields = ["company", "position"]
    ordering_fields = ["applied_date", "company", "status", "created_at"]
    ordering = ["-applied_date"]

    def get_queryset(self):
        return self.request.user.applications.prefetch_related("note_entries").all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ApplicationNoteViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
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
