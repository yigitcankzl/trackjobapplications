"""TrackJobs MCP server: manage your job applications from any MCP client."""
import os
from datetime import date

import httpx
from mcp.server.mcpserver import Context, MCPServer
from mcp.server.mcpserver.exceptions import ToolError

API = os.environ.get("TRACKJOBS_API_URL", "https://trackjobapplications-backend.onrender.com/api/v1").rstrip("/")

mcp = MCPServer("trackjobs")
TOKEN_HINT = "Create a token at https://www.trackjobapplications.com/profile (MCP / API token)"


def _auth_header(ctx: Context) -> str:
    if ctx.headers is None:  # stdio: the user's own machine
        token = os.environ.get("TRACKJOBS_TOKEN")
        if not token:
            raise ToolError(f"Set TRACKJOBS_TOKEN. {TOKEN_HINT}")
        return f"Bearer {token}"
    # remote: each request carries its own user's token, never fall back to server env
    header = ctx.headers.get("authorization", "")
    if not header.startswith("Bearer tj_"):
        raise ToolError(f"Send 'Authorization: Bearer tj_...'. {TOKEN_HINT}")
    return header


def _request(ctx: Context, method: str, path: str, **kwargs):
    r = httpx.request(method, f"{API}/applications/{path}", timeout=60,
                      headers={"Authorization": _auth_header(ctx)}, **kwargs)
    if r.status_code >= 400:
        raise ToolError(f"{r.status_code}: {r.text}")
    return r.json() if r.content else None


def _brief(a: dict) -> dict:
    keys = ("id", "company", "position", "status", "applied_date", "source", "url", "notes")
    return {k: a.get(k) for k in keys}


@mcp.tool()
def list_applications(ctx: Context, status: str | None = None, search: str | None = None, page: int = 1) -> dict:
    """List your job applications. status: to_apply | applied | interview | offer | rejected | withdrawn. search matches company/position."""
    params = {k: v for k, v in {"status": status, "search": search, "page": page}.items() if v}
    data = _request(ctx, "GET", "", params=params)
    return {"count": data["count"], "next_page": page + 1 if data["next"] else None,
            "results": [_brief(a) for a in data["results"]]}


@mcp.tool()
def get_application(ctx: Context, id: int) -> dict:
    """Get full details of one application, including notes, tags and job posting."""
    return _request(ctx, "GET", f"{id}/")


@mcp.tool()
def add_application(ctx: Context, company: str, position: str, status: str = "applied", applied_date: str | None = None,
                    url: str = "", source: str = "", notes: str = "") -> dict:
    """Add a job application. status: to_apply | applied | interview | offer | rejected | withdrawn. source: linkedin | indeed | glassdoor | ziprecruiter | referral | company_website | other. applied_date: YYYY-MM-DD (default today)."""
    body = {"company": company, "position": position, "status": status,
            "applied_date": applied_date or date.today().isoformat(), "url": url, "source": source, "notes": notes}
    return _brief(_request(ctx, "POST", "", json=body))


@mcp.tool()
def update_application(ctx: Context, id: int, company: str | None = None, position: str | None = None, status: str | None = None,
                       applied_date: str | None = None, url: str | None = None, source: str | None = None,
                       notes: str | None = None) -> dict:
    """Update fields of an application; omitted fields stay unchanged. status: to_apply | applied | interview | offer | rejected | withdrawn."""
    body = {k: v for k, v in locals().items() if k not in ("id", "ctx") and v is not None}
    return _brief(_request(ctx, "PATCH", f"{id}/", json=body))


@mcp.tool()
def delete_application(ctx: Context, id: int) -> str:
    """Permanently delete an application."""
    _request(ctx, "DELETE", f"{id}/")
    return f"Deleted application {id}"


def main():
    if port := os.environ.get("PORT"):  # Render (and most PaaS) set PORT -> serve over HTTP at /mcp
        mcp.run("streamable-http", host="0.0.0.0", port=int(port), stateless_http=True, json_response=True)
    else:
        mcp.run()


if __name__ == "__main__":
    main()
