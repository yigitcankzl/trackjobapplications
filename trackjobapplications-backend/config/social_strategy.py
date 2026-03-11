from django.contrib.auth import authenticate
from social_django.strategy import DjangoStrategy


class DjangoStrategyWithRequest(DjangoStrategy):
    """Pass the Django request to authenticate() so django-axes can inspect it."""

    def authenticate(self, *args, **kwargs):
        if "request" not in kwargs and self.request is not None:
            kwargs["request"] = getattr(self.request, "_request", self.request)
        return authenticate(*args, **kwargs)
