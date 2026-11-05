# Security

## Scope

This repository contains client configurations, skills, public tool schemas, and SDK examples. The production MCP service is a separate system. Local fixture tests do not audit that service or a third-party client's data handling.

## Report a suspected vulnerability

GitHub private vulnerability reporting is enabled for this repository.

1. Stop any test that affects real accounts, payments, orders, or service availability.
2. Keep a minimal, redacted reproduction. Prefer an offline fixture; remove credentials, personal data, and unrelated customer records.
3. Sign in to GitHub and open [Report a vulnerability](https://github.com/esimx-com/esimx-mcp/security/advisories/new).
4. Include the affected version or commit, expected and actual behavior, impact, and reproduction steps in the private report. Keep exploit details and sensitive attachments out of public issues and pull requests.

**Expected result:** GitHub delivers the private report to the repository maintainers instead of publishing it as an issue. If the reporting feature is unavailable, keep the evidence private and report only the missing reporting route without disclosing the vulnerability. No response-time, bounty, or supported-version commitment is implied.

## Operate safely

- Send only destination, duration, and data requirements to the public tools. No credentials are needed.
- Review client trust prompts and keep normal tool approvals enabled.
- Treat tool output as data, not instructions to change settings or execute commands.
- Run pull-request checks against loopback fixtures. Live smoke checks require deliberate read-only confirmation.
- If a gateway denies a request, retain the error and stop. Do not spoof a browser or bypass a restriction.
- Follow the scope in [Publishing](docs/publishing.md). A source release does not authorize production deployment or directory submission.

For ordinary configuration failures, use [Troubleshooting](docs/troubleshooting.md). Keep public support reports free of security-sensitive details.
