from django_filters.rest_framework import DjangoFilterBackend
import csv
import io
import json
import logging

from django.db import transaction
from django.http import StreamingHttpResponse
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle

from django.utils import timezone as tz

from .constants import (
    ALLOWED_IMPORT_FIELDS,
    FORMULA_PREFIXES,
    MAX_ATTACHMENTS_PER_APPLICATION,
    MAX_CONTACTS_PER_APPLICATION,
    MAX_EMAILS_PER_APPLICATION,
    MAX_IMPORT_FILE_SIZE,
    MAX_IMPORT_ROWS,
    MAX_INTERVIEWS_PER_APPLICATION,
    MAX_NOTES_PER_APPLICATION,
    MAX_PAGE_SIZE_ALL,
    MAX_PDF_SIZE_BYTES,
    MAX_TAGS_PER_USER,
    MAX_TEMPLATES_PER_USER,
)


class ExportThrottle(SimpleRateThrottle):
    scope = "export"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": request.user.pk}


class ImportThrottle(SimpleRateThrottle):
    scope = "import"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": request.user.pk}

logger = logging.getLogger(__name__)


def _sanitize_cell(value):
    """Prefix formula-like cell values to prevent CSV injection."""
    if isinstance(value, str) and value and value[0] in FORMULA_PREFIXES:
        return f"'{value}"
    return value

from .filters import ApplicationFilter
from .models import Application, ApplicationAttachment, ApplicationContact, ApplicationNote, CoverLetterTemplate, EmailLog, InterviewStage, OfferDetail, Tag
from .pdf_utils import generate_applications_pdf
from .serializers import (
    ApplicationAttachmentSerializer,
    ApplicationBriefSerializer,
    ApplicationContactSerializer,
    ApplicationNoteSerializer,
    ApplicationSerializer,
    CoverLetterTemplateSerializer,
    EmailLogSerializer,
    InterviewStageSerializer,
    OfferDetailSerializer,
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
        return qs.prefetch_related("note_entries", "tags", "email_logs").select_related("offer_detail")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="toggle-pin")
    def toggle_pin(self, request, pk=None):
        app = self.get_object()
        app.is_pinned = not app.is_pinned
        app.save(update_fields=["is_pinned"])
        return Response({"is_pinned": app.is_pinned})

    @action(detail=False, methods=["get"], url_path="brief")
    def brief(self, request):
        qs = request.user.applications.only("id", "company", "position", "status").order_by("-applied_date")
        serializer = ApplicationBriefSerializer(qs, many=True)
        return Response(serializer.data)

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
        methods=["post"],
        url_path="export-pdf",
        throttle_classes=[ExportThrottle],
    )
    def export_pdf(self, request):
        apps = list(self.get_queryset().order_by("-applied_date")[:MAX_PAGE_SIZE_ALL])
        try:
            pdf_bytes = generate_applications_pdf(apps, request.user)
        except Exception:
            logger.exception("PDF generation failed for user %s", request.user.id)
            return Response({"error": "Failed to generate PDF."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if len(pdf_bytes) > MAX_PDF_SIZE_BYTES:
            size_mb = len(pdf_bytes) / (1024 * 1024)
            return Response(
                {"error": f"PDF is too large ({size_mb:.1f} MB). Apply filters to reduce the number of applications."},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        def _stream(data: bytes, chunk_size: int = 8192):
            buf = io.BytesIO(data)
            while True:
                chunk = buf.read(chunk_size)
                if not chunk:
                    break
                yield chunk

        response = StreamingHttpResponse(_stream(pdf_bytes), content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="applications.pdf"'
        response["Content-Length"] = str(len(pdf_bytes))
        return response

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

    def get_queryset(self):
        return self.request.user.cover_letter_templates.all()

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        if self.request.user.cover_letter_templates.count() >= MAX_TEMPLATES_PER_USER:
            raise ValidationError({"detail": f"Maximum {MAX_TEMPLATES_PER_USER} cover letter templates per user."})
        serializer.save(user=self.request.user)


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return self.request.user.tags.all()

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        if self.request.user.tags.count() >= MAX_TAGS_PER_USER:
            raise ValidationError({"detail": f"Maximum {MAX_TAGS_PER_USER} tags per user."})
        serializer.save(user=self.request.user)


class _NestedApplicationMixin:
    """Shared logic for nested viewsets under /applications/{pk}/..."""

    def _get_application(self):
        return get_object_or_404(
            Application,
            pk=self.kwargs["application_pk"],
            user=self.request.user,
        )


class ApplicationNoteViewSet(_NestedApplicationMixin, viewsets.ModelViewSet):
    serializer_class = ApplicationNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        return ApplicationNote.objects.filter(
            application__pk=self.kwargs["application_pk"],
            application__user=self.request.user,
        )

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        with transaction.atomic():
            application = Application.objects.select_for_update().get(
                pk=self.kwargs["application_pk"], user=self.request.user,
            )
            if application.note_entries.count() >= MAX_NOTES_PER_APPLICATION:
                raise ValidationError({"detail": f"Maximum {MAX_NOTES_PER_APPLICATION} notes per application."})
            serializer.save(application=application)


class ApplicationContactViewSet(_NestedApplicationMixin, viewsets.ModelViewSet):
    serializer_class = ApplicationContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

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
            if app.contacts.count() >= MAX_CONTACTS_PER_APPLICATION:
                raise ValidationError({"detail": f"Maximum {MAX_CONTACTS_PER_APPLICATION} contacts per application."})
            serializer.save(application=app)


class InterviewStageViewSet(_NestedApplicationMixin, viewsets.ModelViewSet):
    serializer_class = InterviewStageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

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
            if app.interview_stages.count() >= MAX_INTERVIEWS_PER_APPLICATION:
                raise ValidationError({"detail": f"Maximum {MAX_INTERVIEWS_PER_APPLICATION} interview stages per application."})
            serializer.save(application=app)


class ApplicationAttachmentViewSet(_NestedApplicationMixin, viewsets.ModelViewSet):
    serializer_class = ApplicationAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None
    http_method_names = ["get", "post", "delete"]

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
            if app.attachments.count() >= MAX_ATTACHMENTS_PER_APPLICATION:
                raise ValidationError({"detail": f"Maximum {MAX_ATTACHMENTS_PER_APPLICATION} attachments per application."})
            serializer.save(application=app)


import re

_REJECTION_PATTERNS = re.compile(
    r"(unfortunately|regret to inform|not (been )?selected|decided not to|"
    r"moved forward with other|position has been filled|not a (good )?match|"
    r"will not be moving forward|unable to offer|rejected|rejection)",
    re.IGNORECASE,
)
_INTERVIEW_PATTERNS = re.compile(
    r"(schedule.{0,20}interview|interview invitation|invite you.{0,20}interview|"
    r"like to (meet|speak|chat)|phone screen|technical interview|"
    r"next (step|round|stage)|would you be available)",
    re.IGNORECASE,
)
_OFFER_PATTERNS = re.compile(
    r"(pleased to offer|offer (letter|of employment)|extend.{0,20}offer|"
    r"congratulations.{0,30}(offer|position)|job offer|welcome aboard)",
    re.IGNORECASE,
)


def _classify_email(subject, snippet):
    """Classify an email based on subject and snippet text."""
    text = f"{subject} {snippet}"
    if _OFFER_PATTERNS.search(text):
        return "offer", "offer"
    if _REJECTION_PATTERNS.search(text):
        return "rejection", "rejected"
    if _INTERVIEW_PATTERNS.search(text):
        return "interview_invite", "interview"
    return "general", ""


class EmailLogViewSet(_NestedApplicationMixin, viewsets.ModelViewSet):
    serializer_class = EmailLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        return EmailLog.objects.filter(
            application__pk=self.kwargs["application_pk"],
            application__user=self.request.user,
        )

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        with transaction.atomic():
            app = Application.objects.select_for_update().get(
                pk=self.kwargs["application_pk"], user=self.request.user,
            )
            if app.email_logs.count() >= MAX_EMAILS_PER_APPLICATION:
                raise ValidationError({"detail": f"Maximum {MAX_EMAILS_PER_APPLICATION} emails per application."})

            subject = serializer.validated_data.get("subject", "")
            snippet = serializer.validated_data.get("snippet", "")
            email_type = serializer.validated_data.get("email_type", "")
            suggested_status = serializer.validated_data.get("suggested_status", "")

            if not email_type or email_type == "general":
                detected_type, detected_status = _classify_email(subject, snippet)
                email_type = detected_type
                suggested_status = detected_status

            serializer.save(
                application=app,
                email_type=email_type,
                suggested_status=suggested_status,
            )

            thread_id = serializer.validated_data.get("thread_id", "")
            if thread_id and not app.email_thread_id:
                app.email_thread_id = thread_id
                app.save(update_fields=["email_thread_id"])


class OfferDetailViewSet(_NestedApplicationMixin, viewsets.ModelViewSet):
    serializer_class = OfferDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    http_method_names = ["get", "post", "put", "patch", "delete"]

    def get_queryset(self):
        return OfferDetail.objects.select_related("application").filter(
            application__pk=self.kwargs["application_pk"],
            application__user=self.request.user,
        )

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        with transaction.atomic():
            app = Application.objects.select_for_update().get(
                pk=self.kwargs["application_pk"], user=self.request.user,
            )
            if OfferDetail.objects.filter(application=app).exists():
                raise ValidationError({"detail": "Offer detail already exists for this application."})
            serializer.save(application=app)

    def list(self, request, *args, **kwargs):
        app = self._get_application()
        try:
            detail = app.offer_detail
            return Response(OfferDetailSerializer(detail).data)
        except OfferDetail.DoesNotExist:
            return Response(None, status=status.HTTP_204_NO_CONTENT)


class CompareApplicationsView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        ids = request.query_params.getlist("ids")
        if not ids or len(ids) < 2 or len(ids) > 5:
            return Response(
                {"error": "Provide 2-5 application ids."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            ids = [int(i) for i in ids]
        except (ValueError, TypeError):
            return Response({"error": "Invalid ids."}, status=status.HTTP_400_BAD_REQUEST)

        apps = (
            request.user.applications
            .filter(id__in=ids)
            .select_related("offer_detail")
            .prefetch_related("tags")
        )
        data = []
        for app in apps:
            offer = None
            try:
                offer = OfferDetailSerializer(app.offer_detail).data
            except OfferDetail.DoesNotExist:
                pass
            data.append({
                "id": app.id,
                "company": app.company,
                "position": app.position,
                "status": app.status,
                "applied_date": str(app.applied_date),
                "source": app.source,
                "url": app.url,
                "tags": TagSerializer(app.tags.all(), many=True).data,
                "offer_detail": offer,
            })
        return Response(data)
