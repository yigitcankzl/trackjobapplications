from rest_framework import serializers

from .models import Application, ApplicationAttachment, ApplicationContact, ApplicationNote, InterviewStage, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "color")
        read_only_fields = ("id",)


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

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError("File size must be under 10MB.")
        allowed = (".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".txt")
        ext = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if f".{ext}" not in allowed:
            raise serializers.ValidationError(f"Allowed file types: {', '.join(allowed)}")
        return value


class ApplicationNoteSerializer(serializers.ModelSerializer):
    content = serializers.CharField(max_length=10000)

    class Meta:
        model = ApplicationNote
        fields = ("id", "content", "created_at")
        read_only_fields = ("id", "created_at")


class ApplicationSerializer(serializers.ModelSerializer):
    note_entries = ApplicationNoteSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True, required=False, source="tags"
    )

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
            "interview_date",
            "notes",
            "created_at",
            "updated_at",
            "note_entries",
            "tags",
            "tag_ids",
        )
        read_only_fields = ("id", "created_at", "updated_at")
