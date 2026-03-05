from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ApplicationViewSet, ApplicationNoteViewSet

router = DefaultRouter()
router.register("", ApplicationViewSet, basename="application")

note_router = DefaultRouter()
note_router.register("", ApplicationNoteViewSet, basename="application-note")

urlpatterns = [
    path("<int:application_pk>/notes/", include(note_router.urls)),
] + router.urls
