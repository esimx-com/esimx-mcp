# eSIMX plugin

## Purpose

Connect Claude Code to the anonymous, read-only eSIMX catalog and load the [travel skill](skills/esimx-travel/SKILL.md). No local server, API key, or account is required.

## Local setup

1. Use a current Claude Code installation with plugin and Streamable HTTP support.
2. From the repository root, start `claude --plugin-dir ./plugins/esimx`. This loads the plugin for that session without publishing it.
3. Inspect the MCP connection, then request an eSIM search or trip comparison. Expect the `search_plans` and `compare_trip_options` tools.

If the connection fails, check outbound HTTPS access to https://api.esimx.com/mcp. On HTTP 429, wait for `Retry-After`; on HTTP 403, report the client restriction without bypassing it.

## Distribution status

Repository: https://github.com/esimx-com/esimx-mcp. The plugin author and marketplace owner use the eSIMX product brand. Repository material is licensed under MIT. Directory submissions need separate approval; Registry submission also needs domain ownership proof.

The skill references are bundled inside this plugin. Install either this plugin or a standalone connection as appropriate; avoid duplicate eSIMX connections.
