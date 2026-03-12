from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.middleware.csrf import get_token
from django.urls import include, path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle
from rest_framework.views import APIView


class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def get(self, request):
        return Response({"status": "ok"})


class CsrfCookieView(APIView):
    """GET this endpoint to obtain the CSRF token for cross-origin POSTs."""
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "csrf"

    def get(self, request):
        token = get_token(request)
        return Response({"csrfToken": token})


from applications.media_views import SecureMediaView

urlpatterns = [
    path("api/health/", HealthCheckView.as_view()),
    path("api/v1/csrf/", CsrfCookieView.as_view()),
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
