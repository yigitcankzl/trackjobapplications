from django.contrib import admin

from .models import Application, ApplicationNote, Tag


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


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "user")
    list_filter = ("user",)
    search_fields = ("name",)
