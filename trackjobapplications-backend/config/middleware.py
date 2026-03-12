class ContentSecurityPolicyMiddleware:
    """Add Content-Security-Policy header to all responses."""

    CSP = "default-src 'none'; frame-ancestors 'none'"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["Content-Security-Policy"] = self.CSP
        return response
