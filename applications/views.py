from django_filters.rest_framework import DjangoFilterBackend
import csv
import io
import json

from rest_framework import permissions, serializers as drf_serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

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

    @action(detail=False, methods=["post"], url_path="bulk-update-status")
    def bulk_update_status(self, request):
        ids = request.data.get("ids", [])
        new_status = request.data.get("status", "")
        if not ids or not isinstance(ids, list) or len(ids) > 100:
            return Response({"error": "Provide 1-100 ids."}, status=status.HTTP_400_BAD_REQUEST)
        valid_statuses = [c[0] for c in Application.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({"error": f"Invalid status. Choose from: {valid_statuses}"}, status=status.HTTP_400_BAD_REQUEST)
        updated = self.get_queryset().filter(id__in=ids).update(status=new_status)
        return Response({"updated": updated})

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not ids or not isinstance(ids, list) or len(ids) > 100:
            return Response({"error": "Provide 1-100 ids."}, status=status.HTTP_400_BAD_REQUEST)
        deleted, _ = self.get_queryset().filter(id__in=ids).delete()
        return Response({"deleted": deleted})

    @action(detail=False, methods=["post"], url_path="import", parser_classes=[MultiPartParser])
    def import_applications(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        column_mapping = {}
        raw_mapping = request.data.get("column_mapping", "{}")
        if isinstance(raw_mapping, str):
            try:
                column_mapping = json.loads(raw_mapping)
            except json.JSONDecodeError:
                pass

        name = file.name.lower()
        try:
            if name.endswith(".csv"):
                rows = self._parse_csv(file)
            elif name.endswith((".xlsx", ".xls")):
                rows = self._parse_excel(file)
            else:
                return Response({"error": "Unsupported format. Use .csv or .xlsx"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to parse file: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        errors = []
        for i, row in enumerate(rows):
            mapped = {column_mapping.get(k, k): v for k, v in row.items()} if column_mapping else row
            serializer = ApplicationSerializer(data=mapped)
            if serializer.is_valid():
                serializer.save(user=request.user)
                created_count += 1
            else:
                errors.append({"row": i + 1, "errors": serializer.errors})

        return Response({"created": created_count, "errors": errors})

    @staticmethod
    def _parse_csv(file):
        decoded = file.read().decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(decoded))
        return list(reader)

    @staticmethod
    def _parse_excel(file):
        import openpyxl
        wb = openpyxl.load_workbook(file, read_only=True)
        ws = wb.active
        rows_iter = ws.iter_rows(values_only=True)
        headers = [str(h or "").strip() for h in next(rows_iter)]
        result = []
        for row in rows_iter:
            result.append({h: (str(v) if v is not None else "") for h, v in zip(headers, row)})
        return result


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
