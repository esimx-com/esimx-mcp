# Python SDK example

## 1. Prepare

Use Python 3.11+ and uv. The fixture tests also need Node.js 24 and the root npm dependencies. From the repository root:

```sh
npm ci
uv sync --locked
```

The example uses pinned `mcp` 1.26.0 and its official Streamable HTTP transport. `httpx` is supplied by that SDK's locked dependencies. Do not install another MCP implementation or a global wrapper.

## 2. Run offline

```sh
npm run test:python
```

**Expected result:** the Python SDK connects to a synthetic Node SDK server bound to loopback. Tests exercise initialization, discovery, both tools, invalid arguments, tool/protocol errors, no match, unavailability, null/zero, 403, 429, and shutdown. No production request is made. The fixture values are not real offers.

## 3. Run against the public catalog

**Warning:** this command sends requests to the public service. Use it only for an intended anonymous read-only check:

```sh
npm run example:python -- --confirm-read-only
```

The root script runs [client.py](client.py) through `uv run --locked`. It searches Japan for 3 days/1024 MB total, then compares Japan and South Korea for 3 days/1024 MB each. It prints the native SDK results as JSON. Null and zero values are retained. `call_catalog_tool` raises `ToolCallError` on `isError: true`.

`catalog_session` initializes the SDK session and closes session, streams, and HTTP connections on success and failure. There is a 7-second HTTP/read timeout and a 25-second total operation limit. No automatic retry, Origin, authentication, or browser-spoofing header is added. A 429 reports `Retry-After` and stops. The CLI flattens AnyIO exception groups so the actual failure remains visible.

Without confirmation, the executable exits before networking. `--endpoint URL` selects a test endpoint; only `http://127.0.0.1` is exempt from confirmation.

**Expected result:** JSON with `tools`, `search`, and `comparison`, or a nonzero exit and the actual error. This pinned SDK example passed a public read-only check on 2026-11-04; see the [verification record](../../docs/verification.md). A prior Python urllib probe was denied by Cloudflare, so do not generalize SDK success to every Python HTTP client. Never conceal a denial or imitate a browser to bypass it.

See [Protocol](../../docs/protocol.md) and [Troubleshooting](../../docs/troubleshooting.md). The pinned SDK implements the stable 2025-11-25 lane, not a handwritten emulation of the newer service wire model.
