import logging
import time
import uuid

from django.core.cache import cache
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect
from django.middleware.csrf import get_token as get_csrf_token
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from social_core.exceptions import AuthCanceled, AuthForbidden, AuthMissingParameter, MissingBackend, SocialAuthBaseException
from social_django.utils import load_backend, load_strategy

from users.models import NotificationPreference

logger = logging.getLogger(__name__)
User = get_user_model()


def _blacklist_all_tokens(user):
    """Blacklist all outstanding refresh tokens for a user."""
    tokens = OutstandingToken.objects.filter(user=user)
    existing = set(
        BlacklistedToken.objects.filter(token__in=tokens).values_list("token_id", flat=True)
    )
    BlacklistedToken.objects.bulk_create(
        [BlacklistedToken(token=t) for t in tokens if t.id not in existing],
        ignore_conflicts=True,
    )

from .serializers import (
    ChangePasswordSerializer,
    LogoutSerializer,
    NotificationPreferenceSerializer,
    RegisterSerializer,
    UserSerializer,
)


def _set_auth_cookies(response, access_token, refresh_token=None):
    """Set httpOnly JWT cookies on a response."""
    cookie_kwargs = {
        "httponly": settings.JWT_AUTH_COOKIE_HTTPONLY,
        "samesite": settings.JWT_AUTH_COOKIE_SAMESITE,
        "secure": settings.JWT_AUTH_COOKIE_SECURE,
        "path": "/",
    }
    from datetime import datetime
    from rest_framework_simplejwt.settings import api_settings as jwt_settings

    access_max_age = int(jwt_settings.ACCESS_TOKEN_LIFETIME.total_seconds())
    response.set_cookie(settings.JWT_AUTH_COOKIE, access_token, max_age=access_max_age, **cookie_kwargs)
    if refresh_token is not None:
        refresh_max_age = int(jwt_settings.REFRESH_TOKEN_LIFETIME.total_seconds())
        # Restrict refresh cookie to auth endpoints only to limit exposure
        response.set_cookie(
            settings.JWT_AUTH_REFRESH_COOKIE, refresh_token,
            max_age=refresh_max_age, path="/api/v1/auth/",
            httponly=cookie_kwargs["httponly"],
            samesite=cookie_kwargs["samesite"],
            secure=cookie_kwargs["secure"],
        )
    return response


def _clear_auth_cookies(response):
    """Delete JWT cookies from a response."""
    response.delete_cookie(settings.JWT_AUTH_COOKIE, path="/")
    response.delete_cookie(settings.JWT_AUTH_REFRESH_COOKIE, path="/api/v1/auth/")
    return response


def axes_lockout_response(request, credentials=None, *args, **kwargs):
    """Return a JSON 401 response when axes locks out an IP, so the frontend can display a proper message."""
    from django.http import JsonResponse
    return JsonResponse(
        {"detail": "Too many failed login attempts. Please try again in 30 minutes."},
        status=401,
    )


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request, *args, **kwargs):
        email = request.data.get("email", "").lower().strip()
        try:
            u = User.objects.get(email__iexact=email)
            if not u.has_usable_password():
                return Response(
                    {"detail": "This account uses Google Sign-In. Please use the 'Sign in with Google' button."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        except User.DoesNotExist:
            pass
        response = super().post(request, *args, **kwargs)
        if response.status_code != 200:
            logger.warning(
                "Failed login attempt for email=%s from IP=%s",
                email,
                request.META.get("REMOTE_ADDR", ""),
            )
        else:
            _set_auth_cookies(response, response.data["access"], response.data["refresh"])
            # Ensure csrftoken cookie is set so subsequent POSTs can pass CSRF validation
            get_csrf_token(request)
            # Extension clients cannot use cookies — keep tokens in body for them
            if not request.headers.get("X-Extension-Auth"):
                response.data.pop("access", None)
                response.data.pop("refresh", None)
        return response


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "token_refresh"

    def post(self, request, *args, **kwargs):
        # If refresh token is not in body, try the cookie
        if "refresh" not in request.data and settings.JWT_AUTH_REFRESH_COOKIE in request.COOKIES:
            data = request.data.copy()
            data["refresh"] = request.COOKIES[settings.JWT_AUTH_REFRESH_COOKIE]
            request._full_data = data
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            refresh = response.data.get("refresh")
            _set_auth_cookies(response, response.data["access"], refresh)
            # Refresh the csrftoken cookie alongside the JWT cookies
            get_csrf_token(request)
            # Extension clients cannot use cookies — keep tokens in body for them
            if not request.headers.get("X-Extension-Auth"):
                response.data.pop("access", None)
                response.data.pop("refresh", None)
        return response


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def create(self, request, *args, **kwargs):
        email = request.data.get("email", "").lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            return Response({"email": ["An account with this email already exists."]}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])
        return Response({"detail": "Registration submitted."}, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Accept refresh token from body or from cookie
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if "refresh" not in data and settings.JWT_AUTH_REFRESH_COOKIE in request.COOKIES:
            data["refresh"] = request.COOKIES[settings.JWT_AUTH_REFRESH_COOKIE]
        serializer = LogoutSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        _clear_auth_cookies(response)
        return response


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        prefs, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        return prefs


class LogoutAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        _blacklist_all_tokens(request.user)
        response = Response({"detail": "All sessions logged out."}, status=status.HTTP_200_OK)
        _clear_auth_cookies(response)
        return response


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_change"

    def post(self, request):
        if not request.user.has_usable_password():
            return Response(
                {"detail": "No password set. Use password reset to create one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        _blacklist_all_tokens(request.user)
        response = Response({"detail": "Password updated."}, status=status.HTTP_200_OK)
        _clear_auth_cookies(response)
        return response


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def post(self, request):
        uid = request.data.get("uid", "")
        token = request.data.get("token", "")
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"detail": "Invalid verification link."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired verification link."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])
        return Response({"detail": "Email verified successfully."}, status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def post(self, request):
        if request.user.is_email_verified:
            return Response({"detail": "Email already verified."}, status=status.HTTP_200_OK)
        request.user.send_verification_email()
        return Response({"detail": "Verification email sent."}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        # Always return success to prevent email enumeration.
        # Sleep on the unknown-email path to prevent timing-based enumeration.
        _start = time.monotonic()
        try:
            user = User.objects.get(email__iexact=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            try:
                send_mail(
                    subject="Reset your TrackJobs password",
                    message=f"Click the link to reset your password: {reset_url}",
                    from_email=None,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception("Failed to send password reset email to user %s", user.id)
        except User.DoesNotExist:
            # Pad response time to match the email-send path and prevent timing enumeration
            elapsed = time.monotonic() - _start
            time.sleep(max(0, 0.5 - elapsed))
        return Response(
            {"detail": "If an account exists with this email, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_confirm"

    def post(self, request):
        uid = request.data.get("uid", "")
        token = request.data.get("token", "")
        new_password = request.data.get("new_password", "")
        new_password2 = request.data.get("new_password2", "")

        if not new_password or new_password != new_password2:
            return Response({"detail": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"detail": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired reset link."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({"detail": e.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        _blacklist_all_tokens(user)
        return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)


class SocialLoginInitView(APIView):
    """Redirect the browser to the OAuth provider's authorization page."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "social_login"

    def get(self, request, backend_name):
        try:
            strategy = load_strategy(request)
            callback_url = request.build_absolute_uri(f'/api/v1/auth/social/callback/{backend_name}/')
            backend = load_backend(strategy, backend_name, redirect_uri=callback_url)
        except MissingBackend:
            return Response({"detail": "Unknown provider."}, status=status.HTTP_400_BAD_REQUEST)
        return HttpResponseRedirect(backend.auth_url())


class OAuthCallbackView(APIView):
    """Handle the OAuth provider callback, issue JWT cookies, redirect to dashboard."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "social_callback"

    def get(self, request, backend_name):
        try:
            strategy = load_strategy(request)
            callback_url = request.build_absolute_uri(f'/api/v1/auth/social/callback/{backend_name}/')
            backend = load_backend(strategy, backend_name, redirect_uri=callback_url)
            user = backend.auth_complete()
        except (AuthForbidden, AuthCanceled, AuthMissingParameter) as e:
            logger.warning("OAuth %s for backend=%s: %s", type(e).__name__, backend_name, e)
            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?error=oauth_failed")
        except SocialAuthBaseException as e:
            logger.exception("OAuth %s for backend=%s: %s", type(e).__name__, backend_name, e)
            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?error=oauth_error")
        except Exception as e:
            logger.exception("Unexpected OAuth error for backend=%s: %s", backend_name, e)
            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?error=oauth_error")

        if not user or not user.is_active:
            logger.warning("OAuth returned no user or inactive user for backend=%s, user=%s", backend_name, user)
            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/login?error=account_disabled")

        logger.info("OAuth success for backend=%s user=%s", backend_name, user.pk)
        code = str(uuid.uuid4())
        cache.set(f"oauth_code:{code}", user.pk, timeout=300)
        return HttpResponseRedirect(f"{settings.FRONTEND_URL}/oauth-callback?code={code}")


class SocialTokenExchangeView(APIView):
    """Exchange a short-lived OAuth auth code for JWT cookies.
    The code is generated by OAuthCallbackView after successful OAuth and stored in cache.
    This endpoint is called by the frontend via XHR so cookies are set via credentialed XHR
    rather than a redirect response, which is more reliably handled by browsers.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "social_callback"

    def post(self, request):
        code = request.data.get("code", "").strip()
        if not code:
            return Response({"detail": "Code required."}, status=status.HTTP_400_BAD_REQUEST)

        user_id = cache.get(f"oauth_code:{code}")
        if not user_id:
            return Response({"detail": "Invalid or expired code."}, status=status.HTTP_400_BAD_REQUEST)

        cache.delete(f"oauth_code:{code}")

        try:
            user = User.objects.get(pk=user_id, is_active=True)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        response = Response({"detail": "OK"})
        _set_auth_cookies(response, str(refresh.access_token), str(refresh))
        get_csrf_token(request)
        logger.info("OAuth token exchange success for user=%s", user.pk)
        return response
