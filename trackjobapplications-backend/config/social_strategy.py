from django.contrib.auth import authenticate
from social_django.strategy import DjangoStrategy


class DjangoStrategyWithRequest(DjangoStrategy):
    """Custom strategy that:
    - Runs the social auth pipeline directly (bypassing Django's authenticate()
      loop) to prevent social backends from re-triggering auth_complete and
      to stop django-axes from logging OAuth callbacks as login failures.
    - Passes the Django request to authenticate() for regular credential logins
      so django-axes can inspect it.
    """

    def authenticate(self, *args, **kwargs):
        backend = kwargs.get("backend")
        if backend is not None:
            # Called from social_core.backends.oauth.do_auth — run the pipeline
            # directly instead of routing through Django's authenticate() loop.
            pipeline = self.setting("PIPELINE", (
                "social_core.pipeline.social_auth.social_details",
                "social_core.pipeline.social_auth.social_uid",
                "social_core.pipeline.social_auth.auth_allowed",
                "social_core.pipeline.social_auth.social_user",
                "social_core.pipeline.user.get_username",
                "social_core.pipeline.user.create_user",
                "social_core.pipeline.social_auth.associate_user",
                "social_core.pipeline.social_auth.load_extra_data",
                "social_core.pipeline.user.user_details",
            ))
            out = backend.run_pipeline(pipeline, *args, **kwargs)
            if not isinstance(out, dict):
                return out
            return out.get("user")

        # Regular credential login — inject request so django-axes can inspect it.
        if "request" not in kwargs and self.request is not None:
            kwargs["request"] = getattr(self.request, "_request", self.request)
        return authenticate(*args, **kwargs)
