from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        data = response.data
        # Normalize to {"errors": ...} wrapper for non-dict responses
        if isinstance(data, list):
            response.data = {"errors": data}
        elif isinstance(data, dict) and "detail" in data:
            response.data = {"errors": {"detail": data["detail"]}}
    return response
