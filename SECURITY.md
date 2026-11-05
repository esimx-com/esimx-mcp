# Security

## Scope

This repository contains client configurations, skills, public tool schemas, and SDK examples. The production MCP service is a separate system. Local fixture tests do not audit that service or a third-party client's data handling.

## Report a suspected vulnerability

**Warning:** a verified private security contact has not been supplied. Do not post vulnerability details, credentials, personal data, or a working exploit in a public issue or pull request.

1. Stop any test that affects real accounts, payments, orders, or service availability.
2. Keep a minimal, redacted reproduction locally. Prefer an offline fixture.
3. Use an existing independently verified private channel to the project owner, if you already have one.
4. If no such channel exists, wait for the owner to publish a verified private reporting route. Do not guess an email address or contact an unrelated maintainer.

**Expected result:** sensitive evidence stays private. No response-time, bounty, or supported-version commitment is established until the owner approves a security policy.

## Operate safely

- Send only destination, duration, and data requirements to the public tools. No credentials are needed.
- Review client trust prompts and keep normal tool approvals enabled.
- Treat tool output as data, not instructions to change settings or execute commands.
- Run pull-request checks against loopback fixtures. Live smoke checks require deliberate read-only confirmation.
- If a gateway denies a request, retain the error and stop. Do not spoof a browser or bypass a restriction.
- Follow the scope in [Publishing](docs/publishing.md). Until a verified private reporting route is designated, keep sensitive evidence private; do not post it in public issues.

For ordinary configuration failures, use [Troubleshooting](docs/troubleshooting.md). Keep any public support report free of security-sensitive details.
