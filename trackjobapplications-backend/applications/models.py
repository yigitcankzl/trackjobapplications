import uuid

from django.conf import settings
from django.db import models


def attachment_upload_path(instance, filename):
    ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
    return f"attachments/{uuid.uuid4().hex}.{ext}"


class Application(models.Model):
    STATUS_CHOICES = [
        ("to_apply", "To Apply"),
        ("applied", "Applied"),
        ("interview", "Interview"),
        ("offer", "Offer"),
        ("rejected", "Rejected"),
        ("withdrawn", "Withdrawn"),
    ]

    SOURCE_CHOICES = [
        ("linkedin", "LinkedIn"),
        ("indeed", "Indeed"),
        ("glassdoor", "Glassdoor"),
        ("referral", "Referral"),
        ("company_website", "Company Website"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    company = models.CharField(max_length=200)
    position = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="to_apply")
    applied_date = models.DateField()
    url = models.URLField(blank=True, default="")
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, blank=True, default="")
    tags = models.ManyToManyField("Tag", blank=True, related_name="applications")
    is_pinned = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-applied_date"]
        indexes = [
            models.Index(fields=["status", "updated_at"]),
            models.Index(fields=["-applied_date"]),
            models.Index(fields=["user", "-applied_date"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "company", "position"],
                name="unique_user_company_position",
            ),
        ]

    def __str__(self):
        return f"{self.company} — {self.position}"


class Tag(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tags",
    )
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#3B82F6")

    class Meta:
        unique_together = ("user", "name")
        ordering = ["name"]

    def __str__(self):
        return self.name


class ApplicationNote(models.Model):
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name="note_entries",
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Note on {self.application} at {self.created_at}"


class ApplicationContact(models.Model):
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name="contacts",
    )
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=30, blank=True, default="")
    role = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        if self.role:
            return f"{self.name} ({self.role})"
        return self.name


class InterviewStage(models.Model):
    STAGE_CHOICES = [
        ("phone_screen", "Phone Screen"),
        ("technical", "Technical Interview"),
        ("behavioral", "Behavioral Interview"),
        ("onsite", "On-site"),
        ("take_home", "Take-home Assignment"),
        ("final", "Final Round"),
        ("other", "Other"),
    ]

    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name="interview_stages",
    )
    stage_type = models.CharField(max_length=20, choices=STAGE_CHOICES)
    scheduled_at = models.DateTimeField()
    notes = models.TextField(blank=True, default="")
    completed = models.BooleanField(default=False)
    reminder_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["scheduled_at"]
        indexes = [
            models.Index(fields=["reminder_sent", "completed", "scheduled_at"]),
        ]

    def __str__(self):
        return f"{self.get_stage_type_display()} - {self.application}"


class CoverLetterTemplate(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cover_letter_templates",
    )
    name = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        unique_together = ("user", "name")

    def __str__(self):
        return self.name


class ApplicationAttachment(models.Model):
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    file = models.FileField(upload_to=attachment_upload_path)
    name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        file_to_delete = self.file
        super().delete(*args, **kwargs)
        if file_to_delete:
            from django.db import transaction
            transaction.on_commit(lambda: file_to_delete.delete(save=False))
