from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({"status": "ok"})


from applications.media_views import SecureMediaView

urlpatterns = [
    path("api/health/", health_check),
    path("api/v1/auth/", include("users.urls")),
    path("api/v1/applications/", include("applications.urls")),
    path("api/v1/media/<path:path>", SecureMediaView.as_view()),
]

if settings.DEBUG:
    urlpatterns += [path("admin/", admin.site.urls)]

if settings.DEBUG:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
