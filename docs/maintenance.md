# Maintenance procedure

## 1. Prepare

**Prerequisites:** Node.js 24, npm, Python 3.11+, uv, and a local checkout. Strict plugin checks also require a current Claude Code CLI that supports `--strict --json`. Dependency installation uses package registries; the verification below uses offline MCP fixtures.

```sh
npm ci
uv sync --locked
```

Read the actual scripts in `package.json` before changing the command contract. The [TypeScript](../examples/typescript/README.md) and [Python](../examples/python/README.md) READMEs own example invocation details.

## 2. Change authoritative sources

| Change | Source and action |
| --- | --- |
| Product version, endpoint, repository, identity | Edit `project.json` through the supported metadata procedure; regenerate. |
| Native configuration, plugin, extension, listing | Change `scripts/generate.mjs` or its inputs; regenerate all outputs. |
| Registry schema | Keep the official versioned snapshot in `schemas/registry.schema.json` and its SHA256/source in `schemas/provenance.json` together. `npm run check` validates `server.json` offline, including the 100-character description limit. |
| Tool input schema | Replace the public snapshot in `schemas/tools.json` only from an approved public export; compute its SHA256 and deliberately update `schemas/provenance.json`. Review tool/data docs and contract tests. |
| Skill behavior | Edit canonical `skills/esimx-travel/`; regenerate self-contained copies. Keep references inside each package root. |
| SDK behavior | Change examples/tests and pinned dependencies together. Refresh lockfiles deliberately. Preserve the supported protocol lane. |
| Client documentation | Verify the vendor's current native format and UI flow; state availability and live-test limits. |

Copy only the public tool schema from the service source. Do not copy Java implementation, private configuration, internal credentials, or business records into this repository. Fixture values must remain clearly synthetic.

## 3. Verify the revision

Run from the repository root:

```sh
npm run generate
npm run generate -- --check
npm run check
npm run typecheck
npm test
npm run test:python
claude plugin validate . --strict --json
claude plugin validate ./plugins/esimx --strict --json
```

**Expected result:** no generated drift, valid native configurations and links, successful compilation, passing Node/Python fixture tests, and strict plugin validation. Inspect any validation warnings. The manifests use the known eSIMX product brand; they do not invent an individual maintainer.

For client changes, verify initialization, discovery, both tools, invalid input, tool errors, null/zero values, bounded throttling, and cleanup. Keep tests on loopback. Check failure paths as well as successful output.

For documentation changes, verify all local links and fenced commands. Keep application names separate from model names. State which tests actually ran; do not convert a fixture pass into live certification.

## 4. Optional production smoke

**Warning:** the following command contacts the public service. It is not part of the offline acceptance sequence. Run it only after explicit authorization for the read-only target, and use no account or payment operations.

```sh
npm run smoke -- --confirm-read-only
```

Inspect the script before use. Keep discovery and calls bounded. Retain gateway denials and cleanup errors as evidence; do not spoof a browser or run throttling/load tests. If 429 is returned, record `Retry-After` and stop; the script performs no retry.

**Expected result:** a small recorded reachability/tool check for that exact SDK and network path. It does not certify every desktop product. A manual workflow can run the same check only under its separate authorization/gating policy.

## 5. Close the change

1. Record exact commands, outcomes, and any unverified client paths in the review handoff.
2. Recheck that no translated documents, private artifacts, invented identities, or automatic live calls were added.
3. Keep owner-dependent publication items in [Publishing](publishing.md) current.
4. Obtain separate authorization before commit, push, release, Registry submission, or client-global configuration changes.

## 6. CI operating rules

- `docs-check.yml` checks generated drift, native contracts, English documents, and local links on pull requests.
- `client-tests.yml` runs TypeScript and Python SDK suites against loopback fixtures on pull requests. Registry dependency installation needs network access, but tests make no production MCP requests.
- `remote-smoke.yml` is dispatch-only, default-branch-only, serialized, and requires `READ_ONLY`. GitHub requires repository write access to dispatch it. Before enabling this workflow, create the `remote-smoke` environment, restrict it to the default branch, and add a trusted required reviewer. An automatically created unprotected environment is not an approval gate.
- `release.yml` is dispatch-only and prepares a source archive plus SHA256 checksum after offline tests. It does not create a tag, public release, listing, or deployment. See [Publishing](publishing.md) for the separate manual steps.
- Workflows use hosted runners, read-only repository permissions, and no publication credentials. Do not add `pull_request_target` execution of PR code. If publication automation is added later, store credentials only in a protected environment with branch rules and required reviewers, not general repository secrets.
