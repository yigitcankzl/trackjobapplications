from django.conf import settings
from django.db import models


class Application(models.Model):
    STATUS_CHOICES = [
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="applied")
    applied_date = models.DateField()
    url = models.URLField(blank=True, default="")
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, blank=True, default="")
    interview_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-applied_date"]
        indexes = [
            models.Index(fields=["status", "updated_at"]),
        ]

    def __str__(self):
        return f"{self.company} — {self.position}"


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
