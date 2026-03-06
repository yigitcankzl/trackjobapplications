from rest_framework import serializers

from .models import Application, ApplicationNote, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "color")
        read_only_fields = ("id",)


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
