# TrackJobs MCP

Manage your [TrackJobs](https://www.trackjobapplications.com) applications from Claude Code, Claude Desktop, Cursor, or any MCP client.

Tools: `list_applications`, `get_application`, `add_application`, `update_application`, `delete_application`.

## Setup

1. Create a token on your [profile page](https://www.trackjobapplications.com/profile) under **MCP / API token**. It only accesses your applications, never your account settings, and you can revoke it any time.
2. Connect your client.

### Hosted (nothing to install)

```bash
claude mcp add --transport http trackjobs https://trackjobs-mcp.onrender.com/mcp \
  --header "Authorization: Bearer tj_your_token"
```

The first call after idle can take ~1 min while the free server wakes up.

### Local (stdio)

```bash
claude mcp add trackjobs -s user -e TRACKJOBS_TOKEN=tj_your_token -- uvx trackjobs-mcp
```

Claude Desktop / Cursor (`mcpServers` config):

```json
{
  "trackjobs": {
    "command": "uvx",
    "args": ["trackjobs-mcp"],
    "env": { "TRACKJOBS_TOKEN": "tj_your_token" }
  }
}
```

Then ask: *"Add a Backend Engineer application at Stripe, applied today via LinkedIn"* or *"Move my Google application to interview."*

Self-host: set `PORT` to serve over HTTP at `/mcp` (tokens then come from each request's `Authorization` header, never from env). Custom backend: set `TRACKJOBS_API_URL` (default `https://trackjobapplications-backend.onrender.com/api/v1`).
