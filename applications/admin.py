from django.contrib import admin

from .models import Application, ApplicationNote


class ApplicationNoteInline(admin.TabularInline):
    model = ApplicationNote
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("company", "position", "status", "user", "applied_date")
    list_filter = ("status", "source")
    search_fields = ("company", "position")
    inlines = [ApplicationNoteInline]
