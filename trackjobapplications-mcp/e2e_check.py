"""End-to-end check against a local backend on :8765 (python manage.py runserver 8765).
Needs two users' API tokens: TOKEN_A=tj_... TOKEN_B=tj_... uv run --with mcp python e2e_check.py
Covers stdio mode and remote HTTP mode (per-user isolation)."""
import asyncio, json, os, subprocess, sys, time

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.client.streamable_http import streamable_http_client
from mcp.shared._httpx_utils import create_mcp_http_client

API = "http://localhost:8765/api/v1"
TOKEN_A, TOKEN_B = os.environ["TOKEN_A"], os.environ["TOKEN_B"]
SERVER = ["uv", "run", "-q", "--with", "mcp>=2.2", "--with", "httpx", "python", "trackjobs_mcp.py"]


def data(res):
    assert not res.is_error, res.content[0].text
    return json.loads(res.content[0].text)


async def crud(s):
    new = data(await s.call_tool("add_application", {"company": "Stripe", "position": "Backend Engineer", "source": "linkedin"}))
    assert new["status"] == "applied"
    assert data(await s.call_tool("update_application", {"id": new["id"], "status": "interview"}))["status"] == "interview"
    assert data(await s.call_tool("list_applications", {"search": "strip"}))["count"] == 1
    res = await s.call_tool("add_application", {"company": "X", "position": "Y", "status": "bogus"})
    assert res.is_error and "not a valid choice" in res.content[0].text
    return new["id"]


async def stdio_mode():
    env = {**os.environ, "TRACKJOBS_API_URL": API, "TRACKJOBS_TOKEN": TOKEN_A}
    async with stdio_client(StdioServerParameters(command=SERVER[0], args=SERVER[1:], env=env)) as (r, w), ClientSession(r, w) as s:
        await s.initialize()
        app_id = await crud(s)
        await s.call_tool("delete_application", {"id": app_id})
        assert data(await s.call_tool("list_applications", {}))["count"] == 0
    print("stdio OK")


async def http_session(url, token):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return streamable_http_client(url, http_client=create_mcp_http_client(headers=headers))


async def http_mode():
    # server env deliberately carries credentials: remote mode must ignore them
    env = {**os.environ, "PORT": "8766", "TRACKJOBS_API_URL": API, "TRACKJOBS_TOKEN": TOKEN_A}
    proc = subprocess.Popen(SERVER, env=env)
    try:
        time.sleep(4)
        url = "http://localhost:8766/mcp"
        async with await http_session(url, TOKEN_A) as (r, w), ClientSession(r, w) as s:
            await s.initialize()
            app_id = await crud(s)
        async with await http_session(url, TOKEN_B) as (r, w), ClientSession(r, w) as s:
            await s.initialize()
            assert data(await s.call_tool("list_applications", {}))["count"] == 0, "user isolation broken"
            assert (await s.call_tool("delete_application", {"id": app_id})).is_error
        async with await http_session(url, None) as (r, w), ClientSession(r, w) as s:
            await s.initialize()
            res = await s.call_tool("list_applications", {})
            assert res.is_error and "Authorization" in res.content[0].text, "must not fall back to server env"
        async with await http_session(url, TOKEN_A) as (r, w), ClientSession(r, w) as s:
            await s.initialize()
            await s.call_tool("delete_application", {"id": app_id})
    finally:
        proc.terminate()
    print("http OK")


asyncio.run(stdio_mode())
asyncio.run(http_mode())
print("E2E OK")
