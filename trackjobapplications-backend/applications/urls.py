from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ApplicationAttachmentViewSet,
    ApplicationContactViewSet,
    ApplicationNoteViewSet,
    ApplicationViewSet,
    CoverLetterTemplateViewSet,
    EmailLogViewSet,
    InterviewStageViewSet,
    TagViewSet,
)

router = DefaultRouter()
router.register("", ApplicationViewSet, basename="application")

note_router = DefaultRouter()
note_router.register("", ApplicationNoteViewSet, basename="application-note")

contact_router = DefaultRouter()
contact_router.register("", ApplicationContactViewSet, basename="application-contact")

interview_router = DefaultRouter()
interview_router.register("", InterviewStageViewSet, basename="interview-stage")

attachment_router = DefaultRouter()
attachment_router.register("", ApplicationAttachmentViewSet, basename="application-attachment")

email_router = DefaultRouter()
email_router.register("", EmailLogViewSet, basename="email-log")

tag_router = DefaultRouter()
tag_router.register("", TagViewSet, basename="tag")

cover_letter_router = DefaultRouter()
cover_letter_router.register("", CoverLetterTemplateViewSet, basename="cover-letter-template")

urlpatterns = [
    path("<int:application_pk>/notes/", include(note_router.urls)),
    path("<int:application_pk>/contacts/", include(contact_router.urls)),
    path("<int:application_pk>/interviews/", include(interview_router.urls)),
    path("<int:application_pk>/attachments/", include(attachment_router.urls)),
    path("<int:application_pk>/emails/", include(email_router.urls)),
    path("tags/", include(tag_router.urls)),
    path("cover-letters/", include(cover_letter_router.urls)),
] + router.urls
