# Verification record

## 1. Scope

**Initial check date:** 2026-11-04. **Installation follow-up:** 2026-11-05. **Target:** `https://api.esimx.com/mcp`.

The local project completed implementation and independent review. Initial network checks used only the existing anonymous read-only catalog service. On 2026-11-05, an authorized live Schema compatibility update was followed by a fresh GitHub installation and two actual Claude Code tool calls. No purchase, payment, account operation, or client-global configuration change was performed.

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

Client tests use a synthetic loopback fixture backed by the official SDK. Fixture prices and identifiers are not real offers. The subsequently pushed project passed GitHub Actions on Linux: [native contracts](https://github.com/esimx-com/esimx-mcp/actions/runs/42004026516) and [offline SDK clients](https://github.com/esimx-com/esimx-mcp/actions/runs/42004026478). The 2026-11-05 Schema follow-up passed 22 metadata contracts and 19 TypeScript client tests: 41 Node tests in total. Generated outputs, configuration checks, and English documentation links passed. The corrected commit also passed Linux CI: [native contracts](https://github.com/esimx-com/esimx-mcp/actions/runs/42022511588) and [offline SDK clients](https://github.com/esimx-com/esimx-mcp/actions/runs/42022511620), including the Python suite. These follow-up counts supersede the initial Node count above. Windows execution remains untested.

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

- The initial 2026-11-04 acceptance did not test a named AI application. The later Claude Code two-tool check passed after the live Schema fix; other named AI applications remain unverified.
- A prior unidentified AI-client success remains separate evidence; it does not establish a named application's compatibility.
- A prior Python urllib request received Cloudflare 403 / Error 1010. The later official Python SDK success does not erase that denial or certify every HTTP transport or network route.
- The initial SDK checks used the stable 2025-11-25 lane. The post-fix Claude Code check below negotiated the separate 2026-07-28 lane.
- Private diagnostic logs remain local and are excluded from repository artifacts. No production offers or private records are copied into test fixtures.

For a later failure, record the client version and redacted error, then follow [Troubleshooting](troubleshooting.md). Stop on a gateway denial; honor `Retry-After` on throttling. Do not use browser spoofing, repeated polling, or offline fixture success to claim that a failed live request passed.

## 5. GitHub installation and Claude Code — 2026-11-05

### Initial installation, before the live Schema fix

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

**Initial acceptance status:** installation, connection, and one actual comparison passed; the two-tool check failed. Editing only this repository's Schema snapshot could not fix the service response. The live Schema was subsequently corrected and checked below.

### Post-fix acceptance

**Completed:** 2026-11-05 at 11:55 UTC. **Client:** Claude Code 2.1.318. **Freshly installed repository revision:** `06bbf738d522b4f5353f6f112e81ef4cc9a8c8f4`. **Plugin:** `esimx@esimx-local`, version `1.0.0`.

1. Created a new isolated configuration and workspace. Installed the marketplace and plugin directly from GitHub; both commands exited 0. Checked the installed Git commit rather than relying on the unchanged plugin version.
2. Retained the existing provider environment in memory. No global client configuration, provider, or model was switched. The diagnostic tool-deferral override was not used.
3. The native connection negotiated `2026-07-28`. Its tool inventory contained both `search_plans` and `compare_trip_options`.
4. Called `search_plans` exactly once with Japan, 3 days, 1024 MB total, and limit 1. The actual tool result returned `status: ok`, with no tool error.
5. Called `compare_trip_options` exactly once with Japan and South Korea, each 3 days and 1024 MB total. The actual tool result returned `status: ok`, with no tool error.
6. Independently fetched the live modern tool definitions. They exactly matched the corrected public export. Neither input root contains `allOf`, `anyOf`, or `oneOf`; the daily-mode conditional remains in the Schema.

**Acceptance status:** GitHub installation, native discovery, and both actual tool calls passed for this client version and network route. This is not Anthropic-hosted model certification, a test of every listed client, or a promise about future catalog availability. No catalog call was retried. Private traces and diagnostic logs remain excluded from source archives.
