from django.contrib import admin

from .models import Application, ApplicationAttachment, ApplicationContact, ApplicationNote, CoverLetterTemplate, InterviewStage, Tag


class ApplicationNoteInline(admin.TabularInline):
    model = ApplicationNote
    extra = 0
    readonly_fields = ("created_at",)


class ApplicationContactInline(admin.TabularInline):
    model = ApplicationContact
    extra = 0
    readonly_fields = ("created_at",)


class InterviewStageInline(admin.TabularInline):
    model = InterviewStage
    extra = 0
    readonly_fields = ("created_at",)


class ApplicationAttachmentInline(admin.TabularInline):
    model = ApplicationAttachment
    extra = 0
    readonly_fields = ("uploaded_at",)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("company", "position", "status", "user", "applied_date")
    list_filter = ("status", "source")
    search_fields = ("company", "position")
    list_select_related = ("user",)
    inlines = [ApplicationNoteInline, ApplicationContactInline, InterviewStageInline, ApplicationAttachmentInline]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "user")
    list_filter = ("user",)
    search_fields = ("name",)
    list_select_related = ("user",)


@admin.register(CoverLetterTemplate)
class CoverLetterTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "created_at")
    list_filter = ("user",)
    search_fields = ("name",)
    list_select_related = ("user",)
