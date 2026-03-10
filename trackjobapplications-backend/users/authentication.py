from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware
from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class JWTCookieAuthentication(JWTAuthentication):
    """
    Extends JWTAuthentication to also accept the access token from an httpOnly cookie.
    Falls back to the Authorization header so the browser extension continues to work.
    When authentication succeeds via cookie, CSRF is enforced (double-submit pattern).
    """

    def authenticate(self, request):
        using_cookie = bool(request.COOKIES.get(settings.JWT_AUTH_COOKIE))
        try:
            result = super().authenticate(request)
        except (InvalidToken, TokenError, AuthenticationFailed):
            # Invalid/expired cookie or deleted user — treat as unauthenticated
            # so that AllowAny endpoints (register, login) are not blocked.
            return None
        if result is not None and using_cookie:
            self.enforce_csrf(request)
        return result

    def enforce_csrf(self, request):
        def dummy_get_response(req):
            return None
        check = CsrfViewMiddleware(dummy_get_response)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise exceptions.PermissionDenied(f"CSRF Failed: {reason}")

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
