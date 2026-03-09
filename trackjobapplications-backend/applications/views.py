from django_filters.rest_framework import DjangoFilterBackend
import csv
import io
import json
import logging

from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle

from django.utils import timezone as tz


class ExportThrottle(SimpleRateThrottle):
    scope = "export"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": request.user.pk}


class ImportThrottle(SimpleRateThrottle):
    scope = "import"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": request.user.pk}

logger = logging.getLogger(__name__)

MAX_IMPORT_ROWS = 1000
MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_PAGE_SIZE_ALL = 500
ALLOWED_IMPORT_FIELDS = {"company", "position", "status", "applied_date", "url", "source", "notes"}
FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def _sanitize_cell(value):
    """Prefix formula-like cell values to prevent CSV injection."""
    if isinstance(value, str) and value and value[0] in FORMULA_PREFIXES:
        return f"'{value}"
    return value

from .filters import ApplicationFilter
from .models import Application, ApplicationAttachment, ApplicationContact, ApplicationNote, CoverLetterTemplate, InterviewStage, Tag
from .serializers import (
    ApplicationAttachmentSerializer,
    ApplicationContactSerializer,
    ApplicationNoteSerializer,
    ApplicationSerializer,
    CoverLetterTemplateSerializer,
    InterviewStageSerializer,
    TagSerializer,
)


class ApplicationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = MAX_PAGE_SIZE_ALL

    def get_page_size(self, request):
        if request.query_params.get("page_size") == "all":
            return self.max_page_size
        return super().get_page_size(request)


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
        qs = self.request.user.applications.all()
        if self.action == "list":
            return qs.prefetch_related("tags")
        return qs.prefetch_related("note_entries", "tags")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="toggle-pin")
    def toggle_pin(self, request, pk=None):
        app = self.get_object()
        app.is_pinned = not app.is_pinned
        app.save(update_fields=["is_pinned"])
        return Response({"is_pinned": app.is_pinned})

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        from django.db.models import Count

        result = {"total": 0, "to_apply": 0, "applied": 0, "interview": 0, "offer": 0, "rejected": 0, "withdrawn": 0}
        for entry in self.request.user.applications.values("status").annotate(count=Count("id")):
            key = entry["status"]
            if key in result:
                result[key] = entry["count"]
            result["total"] += entry["count"]
        return Response(result)

    @action(
        detail=False,
        methods=["get"],
        url_path="export-pdf",
        throttle_classes=[ExportThrottle],
    )
    def export_pdf(self, request):
        from django.http import HttpResponse

        apps = list(self.get_queryset().order_by("-applied_date")[:MAX_PAGE_SIZE_ALL])
        try:
            pdf_bytes = self._generate_pdf(apps, request.user)
        except Exception:
            logger.exception("PDF generation failed for user %s", request.user.id)
            return Response({"error": "Failed to generate PDF."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="applications.pdf"'
        return response

    @staticmethod
    def _generate_pdf(apps, user):
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=landscape(A4), leftMargin=15 * mm, rightMargin=15 * mm, topMargin=15 * mm, bottomMargin=15 * mm)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph(f"Job Applications — {user.first_name} {user.last_name}", styles["Title"]))
        elements.append(Spacer(1, 6 * mm))

        header = ["Company", "Position", "Status", "Applied", "Source", "Notes"]
        data = [header]
        for app in apps:
            data.append([
                app.company[:40],
                app.position[:40],
                app.get_status_display(),
                str(app.applied_date),
                app.get_source_display() or "—",
                (app.notes[:60] + "...") if len(app.notes) > 60 else (app.notes or "—"),
            ])

        col_widths = [80 * mm, 80 * mm, 30 * mm, 25 * mm, 30 * mm, 50 * mm]
        table = Table(data, colWidths=col_widths, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563EB")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(table)

        doc.build(elements)
        return buf.getvalue()

    @action(detail=False, methods=["post"], url_path="bulk-update-status")
    def bulk_update_status(self, request):
        ids = request.data.get("ids", [])
        new_status = request.data.get("status", "")
        if not ids or not isinstance(ids, list) or len(ids) > 100:
            return Response({"error": "Provide 1-100 ids."}, status=status.HTTP_400_BAD_REQUEST)
        valid_statuses = [c[0] for c in Application.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({"error": f"Invalid status. Choose from: {valid_statuses}"}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            updated = self.get_queryset().filter(id__in=ids).update(
                status=new_status, updated_at=tz.now()
            )
        return Response({"updated": updated, "skipped": len(ids) - updated})

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not ids or not isinstance(ids, list) or len(ids) > 100:
            return Response({"error": "Provide 1-100 ids."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            deleted, _ = self.get_queryset().filter(id__in=ids).delete()
        return Response({"deleted": deleted, "skipped": len(ids) - deleted})

    @action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[MultiPartParser],
        throttle_classes=[ImportThrottle],
    )
    def import_applications(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
        if file.size > MAX_IMPORT_FILE_SIZE:
            return Response(
                {"error": f"File too large. Maximum is {MAX_IMPORT_FILE_SIZE // (1024 * 1024)} MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        column_mapping = {}
        raw_mapping = request.data.get("column_mapping", "{}")
        if isinstance(raw_mapping, str):
            try:
                column_mapping = json.loads(raw_mapping)
            except json.JSONDecodeError:
                return Response(
                    {"error": "Invalid column_mapping JSON."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Validate mapping values against allowed fields
        if column_mapping:
            invalid = set(column_mapping.values()) - ALLOWED_IMPORT_FIELDS
            if invalid:
                return Response(
                    {"error": f"Invalid mapping targets: {', '.join(invalid)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        name = file.name.lower()
        try:
            if name.endswith(".csv"):
                rows = self._parse_csv(file)
            elif name.endswith((".xlsx", ".xls")):
                rows = self._parse_excel(file)
            else:
                return Response({"error": "Unsupported format. Use .csv or .xlsx"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception("Failed to parse import file: %s", file.name)
            return Response({"error": "Failed to parse file. Please check the format."}, status=status.HTTP_400_BAD_REQUEST)

        if len(rows) > MAX_IMPORT_ROWS:
            return Response(
                {"error": f"Too many rows. Maximum is {MAX_IMPORT_ROWS}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_count = 0
        errors = []
        with transaction.atomic():
            for i, row in enumerate(rows):
                mapped = {column_mapping.get(k, k): v for k, v in row.items()} if column_mapping else row
                serializer = ApplicationSerializer(data=mapped, context={"request": request})
                if serializer.is_valid():
                    sid = transaction.savepoint()
                    try:
                        serializer.save(user=request.user)
                        transaction.savepoint_commit(sid)
                        created_count += 1
                    except Exception:
                        transaction.savepoint_rollback(sid)
                        errors.append({"row": i + 1, "errors": {"detail": "Failed to save row."}})
                else:
                    errors.append({"row": i + 1, "errors": serializer.errors})

        return Response({"created": created_count, "errors": errors})

    @staticmethod
    def _parse_csv(file):
        decoded = file.read().decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(decoded))
        return [{k: _sanitize_cell(v) for k, v in row.items()} for row in reader]

    @staticmethod
    def _parse_excel(file):
        import openpyxl
        wb = openpyxl.load_workbook(file, read_only=True, keep_vba=False, keep_links=False)
        try:
            ws = wb.active
            rows_iter = ws.iter_rows(values_only=True)
            headers = [str(h or "").strip() for h in next(rows_iter)]
            result = []
            for i, row in enumerate(rows_iter):
                if i >= MAX_IMPORT_ROWS:
                    break
                result.append({h: _sanitize_cell(str(v) if v is not None else "") for h, v in zip(headers, row)})
            return result
        finally:
            wb.close()


class CoverLetterTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = CoverLetterTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    MAX_TEMPLATES_PER_USER = 50

    def get_queryset(self):
        return self.request.user.cover_letter_templates.all()

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        if self.request.user.cover_letter_templates.count() >= self.MAX_TEMPLATES_PER_USER:
            raise ValidationError({"detail": f"Maximum {self.MAX_TEMPLATES_PER_USER} cover letter templates per user."})
        serializer.save(user=self.request.user)


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    MAX_TAGS_PER_USER = 200

    def get_queryset(self):
        return self.request.user.tags.all()

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        if self.request.user.tags.count() >= self.MAX_TAGS_PER_USER:
            raise ValidationError({"detail": f"Maximum {self.MAX_TAGS_PER_USER} tags per user."})
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

    MAX_NOTES_PER_APPLICATION = 50

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        with transaction.atomic():
            application = Application.objects.select_for_update().get(
                pk=self.kwargs["application_pk"], user=self.request.user,
            )
            if application.note_entries.count() >= self.MAX_NOTES_PER_APPLICATION:
                raise ValidationError({"detail": f"Maximum {self.MAX_NOTES_PER_APPLICATION} notes per application."})
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
    MAX_CONTACTS_PER_APPLICATION = 20

    def get_queryset(self):
        return ApplicationContact.objects.select_related("application").filter(
            application__pk=self.kwargs["application_pk"],
            application__user=self.request.user,
        )

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        with transaction.atomic():
            app = Application.objects.select_for_update().get(
                pk=self.kwargs["application_pk"], user=self.request.user,
            )
            if app.contacts.count() >= self.MAX_CONTACTS_PER_APPLICATION:
                raise ValidationError({"detail": f"Maximum {self.MAX_CONTACTS_PER_APPLICATION} contacts per application."})
            serializer.save(application=app)


class InterviewStageViewSet(_NestedApplicationMixin, viewsets.ModelViewSet):
    serializer_class = InterviewStageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    MAX_INTERVIEWS_PER_APPLICATION = 20

    def get_queryset(self):
        return InterviewStage.objects.select_related("application").filter(
            application__pk=self.kwargs["application_pk"],
            application__user=self.request.user,
        )

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        with transaction.atomic():
            app = Application.objects.select_for_update().get(
                pk=self.kwargs["application_pk"], user=self.request.user,
            )
            if app.interview_stages.count() >= self.MAX_INTERVIEWS_PER_APPLICATION:
                raise ValidationError({"detail": f"Maximum {self.MAX_INTERVIEWS_PER_APPLICATION} interview stages per application."})
            serializer.save(application=app)


class ApplicationAttachmentViewSet(_NestedApplicationMixin, viewsets.ModelViewSet):
    serializer_class = ApplicationAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None
    http_method_names = ["get", "post", "delete"]
    MAX_ATTACHMENTS_PER_APPLICATION = 10

    def get_queryset(self):
        return ApplicationAttachment.objects.select_related("application").filter(
            application__pk=self.kwargs["application_pk"],
            application__user=self.request.user,
        )

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        with transaction.atomic():
            app = Application.objects.select_for_update().get(
                pk=self.kwargs["application_pk"], user=self.request.user,
            )
            if app.attachments.count() >= self.MAX_ATTACHMENTS_PER_APPLICATION:
                raise ValidationError({"detail": f"Maximum {self.MAX_ATTACHMENTS_PER_APPLICATION} attachments per application."})
            serializer.save(application=app)
