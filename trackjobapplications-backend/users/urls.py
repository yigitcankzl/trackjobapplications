from django.urls import path

from .views import (
    ChangePasswordView,
    LogoutAllView,
    LogoutView,
    MeView,
    NotificationPreferenceView,
    RegisterView,
    ThrottledTokenObtainPairView,
    ThrottledTokenRefreshView,
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
]
