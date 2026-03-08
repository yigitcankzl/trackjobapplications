import re

from rest_framework import serializers

from .models import Application, ApplicationAttachment, ApplicationContact, ApplicationNote, CoverLetterTemplate, InterviewStage, Tag

HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "color")
        read_only_fields = ("id",)

    def validate_color(self, value):
        if not HEX_COLOR_RE.match(value):
            raise serializers.ValidationError("Color must be a valid hex color (e.g. #3B82F6).")
        return value


class ApplicationContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationContact
        fields = ("id", "name", "email", "phone", "role", "created_at")
        read_only_fields = ("id", "created_at")


class InterviewStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewStage
        fields = ("id", "stage_type", "scheduled_at", "notes", "completed", "created_at")
        read_only_fields = ("id", "created_at")


class ApplicationAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationAttachment
        fields = ("id", "file", "name", "uploaded_at")
        read_only_fields = ("id", "uploaded_at")

    # Magic bytes for known file types
    MAGIC_BYTES = {
        b"%PDF": {".pdf"},
        b"\xd0\xcf\x11\xe0": {".doc", ".docx"},  # OLE2 (legacy doc)
        b"PK": {".docx", ".xlsx"},  # ZIP-based (docx/xlsx)
        b"\x89PNG": {".png"},
        b"\xff\xd8\xff": {".jpg", ".jpeg"},
    }

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError("File size must be under 10MB.")
        allowed = (".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".txt")
        ext = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if f".{ext}" not in allowed:
            raise serializers.ValidationError(f"Allowed file types: {', '.join(allowed)}")
        # Validate magic bytes for binary files (skip .txt)
        if ext != "txt":
            header = value.read(8)
            value.seek(0)
            matched = False
            for magic, exts in self.MAGIC_BYTES.items():
                if header.startswith(magic) and f".{ext}" in exts:
                    matched = True
                    break
            if not matched:
                raise serializers.ValidationError("File content does not match its extension.")
        return value


class ApplicationNoteSerializer(serializers.ModelSerializer):
    content = serializers.CharField(max_length=10000)

    class Meta:
        model = ApplicationNote
        fields = ("id", "content", "created_at")
        read_only_fields = ("id", "created_at")


class CoverLetterTemplateSerializer(serializers.ModelSerializer):
    content = serializers.CharField(max_length=50000)

    class Meta:
        model = CoverLetterTemplate
        fields = ("id", "name", "content", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class ApplicationSerializer(serializers.ModelSerializer):
    note_entries = ApplicationNoteSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.none(), write_only=True, required=False, source="tags"
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            self.fields["tag_ids"].child_relation.queryset = request.user.tags.all()

    class Meta:
        model = Application
        fields = (
            "id",
            "company",
            "position",
            "status",
            "applied_date",
            "url",
            "source",
            "is_pinned",
            "notes",
            "created_at",
            "updated_at",
            "note_entries",
            "tags",
            "tag_ids",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            company = attrs.get("company", getattr(self.instance, "company", None))
            position = attrs.get("position", getattr(self.instance, "position", None))
            if company and position:
                qs = Application.objects.filter(user=request.user, company__iexact=company, position__iexact=position)
                if self.instance:
                    qs = qs.exclude(pk=self.instance.pk)
                if qs.exists():
                    raise serializers.ValidationError(
                        {"company": f"You already have an application for {company} — {position}."}
                    )
        return attrs
