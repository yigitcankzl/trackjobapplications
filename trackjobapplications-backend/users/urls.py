from django.urls import path

from .views import (
    ChangePasswordView,
    LogoutAllView,
    LogoutView,
    MeView,
    NotificationPreferenceView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    ResendVerificationView,
    ThrottledTokenObtainPairView,
    ThrottledTokenRefreshView,
    VerifyEmailView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", ThrottledTokenObtainPairView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("logout/all/", LogoutAllView.as_view(), name="auth-logout-all"),
    path("token/refresh/", ThrottledTokenRefreshView.as_view(), name="auth-token-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("me/notifications/", NotificationPreferenceView.as_view(), name="notification-preferences"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("verify-email/", VerifyEmailView.as_view(), name="auth-verify-email"),
    path("resend-verification/", ResendVerificationView.as_view(), name="auth-resend-verification"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
]
