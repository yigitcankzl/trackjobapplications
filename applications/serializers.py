from rest_framework import serializers

from .models import Application, ApplicationNote


class ApplicationNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationNote
        fields = ("id", "content", "created_at")
        read_only_fields = ("id", "created_at")


class ApplicationSerializer(serializers.ModelSerializer):
    note_entries = ApplicationNoteSerializer(many=True, read_only=True)

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
            "notes",
            "created_at",
            "updated_at",
            "note_entries",
        )
        read_only_fields = ("id", "created_at", "updated_at")
