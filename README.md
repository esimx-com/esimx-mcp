# eSIMX MCP

Search the public eSIMX travel eSIM catalog and compare a whole-trip plan with one local plan per country. Connect an MCP client to the existing anonymous, read-only service:

```text
https://api.esimx.com/mcp
```

This repository supplies native client configurations, a portable travel-planning skill, and TypeScript/Python examples using the official MCP SDKs. It does not deploy another server. No API key, account, checkout, payment, or order tool is provided.

## 1. Connect a client

Choose one route. Installation commands change that client's configuration; run them only where you want the connection.

| Client | Procedure | Native configuration |
| --- | --- | --- |
| Claude Code | [Connection, plugin, or skill](docs/clients/claude-code.md) | [JSON](configs/claude-code.json) |
| Codex | [Connection and optional skill](docs/clients/codex.md) | [TOML](configs/codex.toml) |
| Gemini CLI | [Extension or standalone connection](docs/clients/gemini.md) | [JSON](configs/gemini-cli.json) |
| Cursor | [Project connection](docs/clients/cursor.md) | [JSON](configs/cursor.json) |
| VS Code | [Workspace connection](docs/clients/vscode.md) | [JSON](configs/vscode.json) |
| ChatGPT | [Custom remote MCP connection](docs/clients/chatgpt.md) | Product UI |
| Claude Desktop / web | [Custom remote connector](docs/clients/claude-desktop.md) | Product UI |

For example, in Claude Code:

```sh
claude mcp add --transport http esimx https://api.esimx.com/mcp
```

**Expected result:** discovery shows `search_plans` and `compare_trip_options`. A browser GET is not a connection test; this endpoint accepts MCP POST requests. If discovery fails, use [Troubleshooting](docs/troubleshooting.md).

The pinned TypeScript and Python SDK examples passed a public read-only check on 2026-11-04: discovery, search, and comparison succeeded. GitHub installation in Claude Code 2.1.318 passed on 2026-11-05, but that client skipped `search_plans` because its input Schema contains top-level `allOf`; only the comparison tool was exposed and successfully called. See [Verification record](docs/verification.md) for the exact scope, current limitation, and commands. Native configuration support and SDK success do not certify the listed AI applications. A previous Python urllib request was denied by Cloudflare; account plans, workspace policy, client versions, and network routes can still restrict access.

## 2. Use the tools

- “Find Japan eSIM plans for 7 days with at least 5 GB total.”
- “Compare one plan for my trip against local plans: Japan for 4 days with 3 GB total, then South Korea for 3 days with 2 GB total.”

Give the destination, duration, and data need. State whether data is **total** or **per day**. If a destination is ambiguous, choose from the returned candidates before proceeding.

Results cover the eSIMX catalog, not live supplier inventory or a market-wide price search. Prices are USD integer cents; 1024 MB = 1 GB. Unknown activation, tethering, and speed rules remain unknown. Review the supplied product link before purchase through the normal website. See [Tool reference](docs/tools.md) and [Data interpretation](docs/data.md).

## 3. Run the local checks

**Prerequisites:** Node.js 24, npm, Python 3.11 or newer, and [uv](https://docs.astral.sh/uv/getting-started/installation/). Client connection alone does not need these developer dependencies.

From the repository root:

```sh
npm ci
uv sync --locked
npm run generate
npm run check
npm run typecheck
npm test
npm run test:python
```

**Expected result:** generation is deterministic; configuration, documentation links, TypeScript, and loopback fixture tests pass. Dependency installation accesses package registries. These checks do not call the production MCP endpoint.

[TypeScript examples](examples/typescript/README.md) and [Python examples](examples/python/README.md) show discovery and both tools. Their production mode is an explicit network action. Read each example's command and confirmation requirement before running it. Use [Maintenance](docs/maintenance.md) for the full verification order.

## 4. Reference and operating limits

- [Protocol](docs/protocol.md) — Streamable HTTP, SDK version lane, and errors.
- [Privacy](docs/privacy.md) — trip data and third-party client handling.
- [Security](SECURITY.md) — private vulnerability reporting through GitHub.
- [Contributing](CONTRIBUTING.md) — local change procedure.
- [Publishing](docs/publishing.md) — release gates and unresolved ownership inputs.
- [Changelog](CHANGELOG.md) — local release scope.

Source repository: [esimx-com/esimx-mcp](https://github.com/esimx-com/esimx-mcp). Original repository material is licensed under [MIT](LICENSE); copied third-party material retains its [upstream terms and notices](THIRD_PARTY_NOTICES.md). The code license does not grant unlimited service access or trademark rights.

Private vulnerability reports use [GitHub private reporting](https://github.com/esimx-com/esimx-mcp/security/advisories/new). Domain-namespace proof remains pending. `com.esimx/mcp` is a proposed Registry name, not a registration claim. No marketplace listing, domain verification, or universal client approval is claimed.
