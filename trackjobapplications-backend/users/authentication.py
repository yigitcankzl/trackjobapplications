from django.conf import settings
from django.utils import timezone
from django.middleware.csrf import CsrfViewMiddleware
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from users.models import ApiToken


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


class ApiTokenAuthentication(BaseAuthentication):
    """
    Personal API tokens ("Authorization: Bearer tj_...") for MCP clients and scripts.
    Scoped to application endpoints so a leaked token cannot change the password or delete the account.
    """

    ALLOWED_PREFIX = "/api/v1/applications/"

    def authenticate(self, request):
        header = request.headers.get("Authorization", "")
        if not header.startswith(f"Bearer {ApiToken.PREFIX}"):
            return None
        if not request.path.startswith(self.ALLOWED_PREFIX):
            raise AuthenticationFailed("API tokens can only access application endpoints.")
        token = ApiToken.objects.select_related("user").filter(key_hash=ApiToken.hash(header[len("Bearer "):])).first()
        if token is None or not token.user.is_active:
            raise AuthenticationFailed("Invalid API token.")
        ApiToken.objects.filter(pk=token.pk).update(last_used_at=timezone.now())
        return token.user, token
