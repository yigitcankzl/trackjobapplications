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


@admin.register(ApplicationNote)
class ApplicationNoteAdmin(admin.ModelAdmin):
    list_display = ("application", "created_at")
    list_select_related = ("application",)
    search_fields = ("content",)


@admin.register(ApplicationContact)
class ApplicationContactAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "role", "application")
    list_select_related = ("application",)
    search_fields = ("name", "email")


@admin.register(InterviewStage)
class InterviewStageAdmin(admin.ModelAdmin):
    list_display = ("application", "stage_type", "scheduled_at", "completed", "reminder_sent")
    list_filter = ("stage_type", "completed", "reminder_sent")
    list_select_related = ("application",)


@admin.register(ApplicationAttachment)
class ApplicationAttachmentAdmin(admin.ModelAdmin):
    list_display = ("name", "application", "uploaded_at")
    list_select_related = ("application",)
    search_fields = ("name",)
