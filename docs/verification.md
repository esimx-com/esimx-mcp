# Verification record

## 1. Scope

**Check date:** 2026-11-04. **Target:** `https://api.esimx.com/mcp`.

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

Client tests use a synthetic loopback fixture backed by the official SDK. Fixture prices and identifiers are not real offers. GitHub Actions and Windows execution have not been tested.

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

- No named Claude Code, Codex, ChatGPT, Claude Desktop, Gemini, Cursor, or VS Code production session was tested in this project acceptance.
- A prior unidentified AI-client success remains separate evidence; it does not establish a named application's compatibility.
- A prior Python urllib request received Cloudflare 403 / Error 1010. The later official Python SDK success does not erase that denial or certify every HTTP transport or network route.
- The public checks above did not retest the separate 2026-07-28 service lane.
- Private diagnostic logs remain local and are excluded from repository artifacts. No production offers or private records are copied into test fixtures.

For a later failure, record the client version and redacted error, then follow [Troubleshooting](troubleshooting.md). Stop on a gateway denial; honor `Retry-After` on throttling. Do not use browser spoofing, repeated polling, or offline fixture success to claim that a failed live request passed.
