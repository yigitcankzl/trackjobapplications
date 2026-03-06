from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ApplicationViewSet, ApplicationNoteViewSet, TagViewSet

router = DefaultRouter()
router.register("", ApplicationViewSet, basename="application")

note_router = DefaultRouter()
note_router.register("", ApplicationNoteViewSet, basename="application-note")

tag_router = DefaultRouter()
tag_router.register("", TagViewSet, basename="tag")

urlpatterns = [
    path("<int:application_pk>/notes/", include(note_router.urls)),
    path("tags/", include(tag_router.urls)),
] + router.urls
