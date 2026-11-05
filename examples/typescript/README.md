# TypeScript SDK example

## 1. Prepare

Use Node.js 24 and npm. Run commands from the repository root:

```sh
npm ci
npm run typecheck
npm run build
```

The example uses pinned `@modelcontextprotocol/sdk` 1.32.2. It does not implement its own JSON-RPC client. The SDK initializes, sends the initialized notification, discovers tools, and manages protocol headers and cleanup.

## 2. Run offline

```sh
npm run test:clients
```

**Expected result:** a synthetic SDK-backed server on `127.0.0.1` receives initialization, discovery, search, and comparison calls. Tests cover schema rejection, tool/protocol errors, no match, catalog unavailability, null/zero values, 403, and 429 without retries. No production request is made. Fixture data is not a real offer.

## 3. Run against the public catalog

**Warning:** this is a network action. Run it only when you intend to contact the anonymous read-only service:

```sh
npm run example:typescript -- --confirm-read-only
```

The root script builds and runs [client.ts](client.ts). It searches Japan for 3 days and 1024 MB total, then compares Japan and South Korea for 3 days/1024 MB each. It prints native result objects, preserving `isError`, null, and zero semantics. Calls to `callCatalogTool` throw `ToolCallError` for a tool failure rather than report a successful offer.

The example performs one initialize, one initialized notification, one tool discovery, and two tool calls. It uses a 7-second per-request timeout and a 25-second HTTP budget. It schedules no retries and no session DELETE for this stateless endpoint. On 429, the error reports `Retry-After` and stops. On 403, it keeps the status and gateway error visible without browser spoofing.

Without confirmation, the executable exits nonzero before networking. `--endpoint URL` selects a test endpoint; only `http://127.0.0.1` is exempt from confirmation. Do not point it at unrelated services.

**Expected result:** JSON with `server`, discovered tool names, `search`, and `comparison`, or a nonzero exit with the actual error. Domain statuses such as `no_match` remain successful tool exchanges, not a claim of available inventory. This pinned SDK example passed a public read-only check on 2026-11-04; see the [verification record](../../docs/verification.md). A successful request does not certify other applications.

For the bounded maintenance probe, use `npm run smoke -- --confirm-read-only` only with separate authorization. That script has a 30-second process deadline and prints a compact result. See [Protocol](../../docs/protocol.md) and [Troubleshooting](../../docs/troubleshooting.md).
