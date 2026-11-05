# Troubleshooting

## 1. Identify the failing layer

Record the client name/version, configuration route, HTTP status, protocol version, and redacted error. Do not publish tokens, conversation content, customer data, or security details. A named client is considered live-tested only when an actual session and its result were recorded; a valid configuration or fixture pass is not enough.

| Symptom | Check | Corrective action |
| --- | --- | --- |
| Browser shows 405 | Was the endpoint opened with GET? | Use an MCP client. GET is not discovery. |
| Cleanup reports DELETE 404 | Did discovery/tools already succeed? | Keep the tool result; report cleanup separately. The public gateway does not provide a session DELETE endpoint. |
| No tools discovered | Native format, URL, disabled connection, trust prompt | Use the matching [client guide](../README.md#1-connect-a-client). Confirm `/mcp`, enable the connection, and review trust prompts. |
| Gemini tries SSE | Was `url` used? | Use `httpUrl` for Streamable HTTP. |
| VS Code rejects JSON | Was `mcpServers` pasted into native VS Code config? | Use native `servers` with `type: "http"`, or the guided add-server flow. |
| Codex ignores project config | Is the project trusted? | Review project trust and `.codex/config.toml`; do not lower unrelated protections. |
| Login/API-key prompt | Was an authenticated template copied? | Remove irrelevant auth configuration. This endpoint is anonymous; use the product's unauthenticated option. |
| Cloudflare 403 / Error 1010 / `browser_signature_banned` | Gateway error, SDK/client transport, network route | Keep the denial visible and stop. Do not spoof a browser, switch proxies to bypass denial, or call the request successful. |
| HTTP 429 | `Retry-After` and request frequency | Stop parallel calls, honor the wait, and use a bounded retry budget. |
| Protocol/header error | Negotiated version and supported SDK | Use the stable SDK lane in [Protocol](protocol.md); do not set a newer version header by hand. |
| `invalid_arguments` | Tool input schema and required fields | Correct types, ranges, daily-mode fields, trip duration, or distinct-country count. |
| `needs_clarification` | Returned candidates and `stop_index` | Ask the user to choose a country/area code. |
| `no_match` | Duration, data mode, coverage | Ask which condition may change. Do not fabricate a price or silently relax criteria. |
| `catalog_unavailable` | Tool `isError` payload | Report temporary unavailability; try later only within a bounded policy. |
| Missing connector UI | Account, client release, workspace policy | Check the provider's current availability and ask the workspace administrator. Do not substitute a model name as a server. |
| Stale tool metadata | Client cache/refresh flow | Reconnect or refresh using the client guide, then start a new conversation if required. |

The pinned TypeScript and Python SDK examples passed public discovery and both tools on 2026-11-04; see the [verification record](verification.md). A previous Python urllib probe was denied by the gateway. Neither result applies to every Python client or network route. SDK success, a prior curl success, and an unidentified AI-client success do not certify a named desktop application.

## 2. Reproduce locally

1. Install dependencies from the lockfiles.
2. Run `npm run typecheck`, `npm test`, and `npm run test:python`.
3. Compare the error against the loopback fixture's success and failure cases.
4. If native configuration or generated files differ, run `npm run generate` and `npm run check`.

**Expected result:** local protocol/configuration defects are separated from production reachability. Keep live tests out of pull-request CI.

## 3. Escalate without leaking data

Use the non-sensitive bug template only after redaction. Include the expected and actual result, exact offline command, and whether a real public request was made. Use the canonical repository for non-sensitive reports; a verified private security reporting route is still pending. Sensitive evidence follows [SECURITY.md](../SECURITY.md), not a public issue.
