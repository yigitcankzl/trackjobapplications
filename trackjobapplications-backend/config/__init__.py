import defusedxml.ElementTree
defusedxml.defuse_stdlib()
from .celery import app as celery_app

__all__ = ("celery_app",)
