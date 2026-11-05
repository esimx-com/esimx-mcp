# Protocol and transport

## 1. Connection contract

| Item | Value |
| --- | --- |
| URL | `https://api.esimx.com/mcp` |
| Transport | Anonymous read-only Streamable HTTP |
| Request method | MCP JSON-RPC over POST |
| Request content type | `application/json` |
| Accept | `application/json, text/event-stream` |
| Actual POST response | JSON; no SSE stream or session is required by this service |
| Tools | `search_plans`, `compare_trip_options` |

Use the official SDK to manage initialization, request IDs, headers, notifications, and cleanup. Server-to-server examples add no `Origin` header. No Authorization header, API key, OAuth client, or session ID is needed. Do not add a browser-spoofing header to bypass a gateway denial.

GET returns HTTP 405. A public DELETE has returned HTTP 404 through the gateway. Neither result establishes a failed MCP POST connection. A cleanup DELETE error must not erase an earlier valid tool result or be misreported as a failed search; close the SDK transport and report cleanup issues separately when applicable.

## 2. Stable SDK lane: 2025-11-25

The pinned examples use the official SDKs' supported stable protocol:

1. Connect and initialize.
2. Send the initialized notification through the SDK lifecycle.
3. Discover tools with `tools/list`.
4. Call each tool with `tools/call` and validated arguments.
5. Close the client and transport when finished, including failure paths.

The negotiated protocol is `2025-11-25`. The SDK handles the matching `MCP-Protocol-Version` header for subsequent requests. Do not silently switch the examples to a protocol that their installed SDK does not implement.

## 3. Separate service lane: 2026-07-28

The service also describes a newer request model. This is a service capability, not a claim that every configured client or pinned SDK supports it.

- Discovery uses `server/discover` without initialization.
- Every request includes `params._meta` entries `io.modelcontextprotocol/protocolVersion` and `io.modelcontextprotocol/clientCapabilities`.
- The HTTP `MCP-Protocol-Version` header matches the metadata version.
- The HTTP `Mcp-Method` header matches the JSON-RPC method.
- `tools/call` also includes `Mcp-Name` matching the tool name.
- Discovery/tool-list responses include public cache metadata; `ttlMs: 0` is not permission to invent an indefinite cache.

Do not retrofit this lane with handwritten JSON-RPC inside an SDK example. Upgrade only after the official SDK supports the required lifecycle and offline tests verify it.

## 4. Errors and throttling

A successful HTTP exchange is not necessarily a successful tool operation. Inspect three layers:

1. **HTTP:** transport/gateway errors, including 403 and 429.
2. **JSON-RPC:** parse, request, method, metadata, or protocol errors.
3. **Tool result:** `isError: true` with `error_code`, such as `invalid_arguments` or `catalog_unavailable`.

Normal domain results such as `no_match` or `needs_clarification` are not transport failures. Structured output is returned in `structuredContent`; text content also contains the result JSON. Preserve the error state rather than treating every text block as a plan list.

The service uses an instance-shared token bucket: refill 120 calls/minute, burst capacity 20, shared across both tools. This is not a global per-user entitlement. Other callers on the same instance can use the bucket.

On HTTP 429:

1. Read `Retry-After`.
2. Wait at least that interval before any allowed retry.
3. Bound the retry count and total time. If the budget is exhausted, report throttling.
4. Do not run concurrent retry loops, polling, or a rate-limit load test against production.

See [Troubleshooting](troubleshooting.md) for corrective actions and [Maintenance](maintenance.md) for offline verification.
