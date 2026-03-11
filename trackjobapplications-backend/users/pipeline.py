from django.contrib.auth import get_user_model

User = get_user_model()


def associate_by_email(backend, details, user=None, *args, **kwargs):
    """Link an existing password-registered account when the social provider
    returns the same *verified* email address, preventing duplicate user rows."""
    if user:
        return {}
    email = details.get("email")
    if not email:
        return {}

    # Only auto-link if the provider has verified the email.
    # Google always returns verified emails; GitHub may not.
    response = kwargs.get("response", {})
    email_verified = response.get("email_verified") or response.get("verified_email")
    if not email_verified:
        # GitHub: check the emails endpoint for a verified primary email
        if hasattr(backend, "name") and backend.name == "github":
            emails_data = kwargs.get("emails", [])
            email_verified = any(
                e.get("email", "").lower() == email.lower()
                and e.get("verified")
                and e.get("primary")
                for e in (emails_data or [])
            )
        if not email_verified:
            return {}

    try:
        existing = User.objects.get(email__iexact=email)
        return {"user": existing}
    except User.DoesNotExist:
        return {}


def set_user_fields(backend, details, user=None, is_new=False, *args, **kwargs):
    """Populate first_name/last_name from the provider and mark email as verified."""
    if not user:
        return {}
    update_fields = []
    if not user.first_name and details.get("first_name"):
        user.first_name = details["first_name"]
        update_fields.append("first_name")
    if not user.last_name and details.get("last_name"):
        user.last_name = details["last_name"]
        update_fields.append("last_name")
    if not user.is_email_verified:
        user.is_email_verified = True
        update_fields.append("is_email_verified")
    if update_fields:
        user.save(update_fields=update_fields)
    return {}
