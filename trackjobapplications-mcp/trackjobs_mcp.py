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
    return {**{k: a.get(k) for k in keys}, "tags": [t["name"] for t in a.get("tags", [])]}


def _tags_by_name(ctx: Context) -> dict[str, dict]:
    return {t["name"].lower(): t for t in _request(ctx, "GET", "tags/")}


def _tag_ids(ctx: Context, names: list[str]) -> list[int]:
    """Resolve tag names (case-insensitive) to ids, creating tags that don't exist yet."""
    existing = _tags_by_name(ctx)
    ids = []
    for name in dict.fromkeys(n.strip() for n in names if n.strip()):
        tag = existing.get(name.lower()) or _request(ctx, "POST", "tags/", json={"name": name})
        ids.append(tag["id"])
    return ids


@mcp.tool()
def list_applications(ctx: Context, status: str | None = None, search: str | None = None, tag: str | None = None,
                      page: int = 1) -> dict:
    """List your job applications. status: to_apply | applied | interview | offer | rejected | withdrawn. search matches company/position. tag: filter by tag name."""
    params = {k: v for k, v in {"status": status, "search": search, "page": page}.items() if v}
    if tag:
        found = _tags_by_name(ctx).get(tag.strip().lower())
        if found is None:
            return {"count": 0, "next_page": None, "results": [], "note": f"No tag named {tag!r}. Use list_tags."}
        params["tags"] = found["id"]
    data = _request(ctx, "GET", "", params=params)
    return {"count": data["count"], "next_page": page + 1 if data["next"] else None,
            "results": [_brief(a) for a in data["results"]]}


@mcp.tool()
def list_tags(ctx: Context) -> list[dict]:
    """List your tags (labels) with their colors."""
    return [{"name": t["name"], "color": t["color"]} for t in _request(ctx, "GET", "tags/")]


@mcp.tool()
def get_application(ctx: Context, id: int) -> dict:
    """Get full details of one application, including notes, tags and job posting."""
    return _request(ctx, "GET", f"{id}/")


@mcp.tool()
def add_application(ctx: Context, company: str, position: str, status: str = "applied", applied_date: str | None = None,
                    url: str = "", source: str = "", notes: str = "", tags: list[str] | None = None) -> dict:
    """Add a job application. status: to_apply | applied | interview | offer | rejected | withdrawn. source: linkedin | indeed | glassdoor | ziprecruiter | referral | company_website | other. applied_date: YYYY-MM-DD (default today). tags: tag names; missing tags are created."""
    body = {"company": company, "position": position, "status": status,
            "applied_date": applied_date or date.today().isoformat(), "url": url, "source": source, "notes": notes}
    if tags:
        body["tag_ids"] = _tag_ids(ctx, tags)
    return _brief(_request(ctx, "POST", "", json=body))


@mcp.tool()
def update_application(ctx: Context, id: int, company: str | None = None, position: str | None = None, status: str | None = None,
                       applied_date: str | None = None, url: str | None = None, source: str | None = None,
                       notes: str | None = None, tags: list[str] | None = None) -> dict:
    """Update fields of an application; omitted fields stay unchanged. status: to_apply | applied | interview | offer | rejected | withdrawn. tags: replaces the full tag list (pass [] to clear); missing tags are created."""
    body = {k: v for k, v in locals().items() if k not in ("id", "ctx", "tags") and v is not None}
    if tags is not None:
        body["tag_ids"] = _tag_ids(ctx, tags)
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
