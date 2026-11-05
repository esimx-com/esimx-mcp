# Verification record

## 1. Scope

**Initial check date:** 2026-11-04. **Installation follow-up:** 2026-11-05. **Target:** `https://api.esimx.com/mcp`.

The local project completed implementation and independent review. The final network check used only the existing anonymous read-only catalog service. No deployment, purchase, payment, account operation, or client-global configuration change was performed.

## 2. Offline acceptance

The completed implementation and review ran:

```sh
npm ci --ignore-scripts --offline
uv sync --locked --offline
npm run generate
npm run generate -- --check
npm run check
npm run typecheck
npm test
UV_OFFLINE=1 npm run test:python
claude plugin validate . --strict --json
claude plugin validate ./plugins/esimx --strict --json
```

**Observed result:** 39 Node tests passed: 20 contract tests and 19 TypeScript client tests. Ten Python client tests passed. TypeScript checking, generated-file drift checks, local links, native configurations, and the pinned official Registry schema passed. Both Claude manifest validators returned `success: true` with no manifest errors or warnings. Optional public-directory listing advice is separate from manifest validity.

Client tests use a synthetic loopback fixture backed by the official SDK. Fixture prices and identifiers are not real offers. The subsequently pushed project passed GitHub Actions on Linux: [native contracts](https://github.com/esimx-com/esimx-mcp/actions/runs/42004026516) and [offline SDK clients](https://github.com/esimx-com/esimx-mcp/actions/runs/42004026478). Windows execution remains untested.

## 3. Public SDK checks

From the repository root, each command was run once:

```sh
npm run smoke -- --confirm-read-only
UV_OFFLINE=1 npm run example:python -- --confirm-read-only
```

| Probe | Pinned SDK | Observed result |
| --- | --- | --- |
| TypeScript | `@modelcontextprotocol/sdk` 1.32.2 | Exit 0; both tools discovered; search `ok`; comparison `ok` |
| Python | `mcp` 1.26.0 | Exit 0; both tools discovered; search `ok`; comparison `ok` |

Each example initialized, listed tools, called `search_plans`, and called `compare_trip_options` through the stable 2025-11-25 lane. Search used Japan, 3 days, and 1024 MB total. Comparison used Japan and South Korea, 3 days and 1024 MB total per stop. Four tool calls were made across the two examples. No retry was scheduled.

**Expected result on a later run:** either native results with the current catalog status, or a nonzero exit with the actual transport/tool error. These observations are not a promise about future inventory, prices, or availability. A normal `no_match` exchange is not a transport failure.

## 4. Limits and corrective action

- The initial 2026-11-04 acceptance did not test a named AI application. The later Claude Code result below is partial; other named AI applications remain unverified.
- A prior unidentified AI-client success remains separate evidence; it does not establish a named application's compatibility.
- A prior Python urllib request received Cloudflare 403 / Error 1010. The later official Python SDK success does not erase that denial or certify every HTTP transport or network route.
- The public checks above did not retest the separate 2026-07-28 service lane.
- Private diagnostic logs remain local and are excluded from repository artifacts. No production offers or private records are copied into test fixtures.

For a later failure, record the client version and redacted error, then follow [Troubleshooting](troubleshooting.md). Stop on a gateway denial; honor `Retry-After` on throttling. Do not use browser spoofing, repeated polling, or offline fixture success to claim that a failed live request passed.

## 5. GitHub installation and Claude Code — 2026-11-05

**Client:** Claude Code 2.1.318. **Installed repository revision:** `06094bbfc2319def1f2c4385fb0e26a6f36cbec9`. **Plugin:** `esimx@esimx-local`, version `1.0.0`.

The test used an isolated client configuration and workspace. Existing local provider settings were retained in memory; this is not a claim of Anthropic-hosted model certification. User-global client settings were not changed.

1. `claude plugin marketplace add esimx-com/esimx-mcp --json` exited 0.
2. `claude plugin install esimx@esimx-local --json` exited 0; the plugin was installed and enabled.
3. `claude mcp list` reported the plugin connection as connected. The native transport negotiated `2026-07-28`.
4. The installed plugin passed strict manifest validation. Icon/privacy listing advice is separate from manifest validity.
5. Real client sessions exposed and called `compare_trip_options` with Japan and South Korea, each 3 days and 1024 MB total. The structured result was `status: ok`.
6. Both original session inventories lacked `search_plans`; no successful search call is claimed.

**Observed failure:** a further bounded diagnostic session disabled tool deferral, but search was still missing. The native debug log identified the reason:

```text
Skipping tool "search_plans": its input schema uses top-level allOf, which the Anthropic API does not accept. Other tools from this server remain available.
```

The live `tools/list` response contained both tool definitions, so this was not a GitHub installation or missing-server-definition failure. The client filtered the search tool locally. A diagnostic did not call or retry the missing tool, and no production settings were changed.

**Acceptance status:** installation, connection, and one actual comparison passed; complete two-tool Claude Code acceptance did not pass. A change to the live MCP tool Schema and a new client check are required before claiming a full pass. Editing only this repository's Schema snapshot cannot alter the service response. The previously successful official TypeScript/Python SDK results remain separate evidence.
