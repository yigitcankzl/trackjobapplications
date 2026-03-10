from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


class JWTCookieAuthentication(JWTAuthentication):
    """
    Extends JWTAuthentication to also accept the access token from an httpOnly cookie.
    Falls back to the Authorization header so the browser extension continues to work.
    """

    def get_header(self, request):
        raw = request.COOKIES.get(settings.JWT_AUTH_COOKIE)
        if raw:
            # Reuse simplejwt's header parsing by synthesising a Bearer header value.
            return f"Bearer {raw}".encode()
        return super().get_header(request)

    def get_raw_token(self, header):
        # When we synthesised the header above it already contains the scheme prefix,
        # so we need to strip "Bearer " before passing to the parent.
        if header and header.startswith(b"Bearer "):
            return header[len(b"Bearer "):]
        return super().get_raw_token(header)
