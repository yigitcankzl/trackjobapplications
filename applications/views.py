from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from .filters import ApplicationFilter
from .models import Application, ApplicationAttachment, ApplicationContact, ApplicationNote, InterviewStage, Tag
from .serializers import (
    ApplicationAttachmentSerializer,
    ApplicationContactSerializer,
    ApplicationNoteSerializer,
    ApplicationSerializer,
    InterviewStageSerializer,
    TagSerializer,
)


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
        return self.request.user.applications.prefetch_related("note_entries", "tags").all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return self.request.user.tags.all()

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


class _NestedApplicationMixin:
    """Shared logic for nested viewsets under /applications/{pk}/..."""

    def _get_application(self):
        return get_object_or_404(
            Application,
            pk=self.kwargs["application_pk"],
            user=self.request.user,
        )


class ApplicationContactViewSet(_NestedApplicationMixin, viewsets.ModelViewSet):
    serializer_class = ApplicationContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return ApplicationContact.objects.filter(
            application__pk=self.kwargs["application_pk"],
            application__user=self.request.user,
        )

    def perform_create(self, serializer):
        serializer.save(application=self._get_application())


class InterviewStageViewSet(_NestedApplicationMixin, viewsets.ModelViewSet):
    serializer_class = InterviewStageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return InterviewStage.objects.filter(
            application__pk=self.kwargs["application_pk"],
            application__user=self.request.user,
        )

    def perform_create(self, serializer):
        serializer.save(application=self._get_application())


class ApplicationAttachmentViewSet(_NestedApplicationMixin, viewsets.ModelViewSet):
    serializer_class = ApplicationAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        return ApplicationAttachment.objects.filter(
            application__pk=self.kwargs["application_pk"],
            application__user=self.request.user,
        )

    def perform_create(self, serializer):
        serializer.save(application=self._get_application())
