from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_html_email(subject, template_name, context, recipient_email):
    html_message = render_to_string(template_name, context)
    plain_message = strip_tags(html_message)
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient_email],
        html_message=html_message,
    )
