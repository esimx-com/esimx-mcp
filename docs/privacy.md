# Privacy and data handling

## Scope

The public tools accept destination, duration, and data requirements. They do not require a login, payment details, passport, email address, account identifier, or device identifier.

Anonymous access does not mean that network activity is unobservable. The MCP service, network gateway, and selected AI client can process connection metadata. This repository does not establish their logging, retention, geographic storage, or deletion policies. Consult the provider's current terms before sending sensitive travel information.

## Before a request

1. Remove names, booking references, exact addresses, and other identifiers from the prompt and arguments.
2. Send only the country/area, day count, and data requirement needed for the tool.
3. Check the AI client's conversation and tool-data controls. Hosted connectors may send requests through the client provider's infrastructure, not your own computer.
4. Review returned product links before opening them. Opening a website is a separate request governed by that site's policies.

**Expected result:** the tool receives the minimum planning inputs, not a traveler's personal record.

## Repository and test handling

- Fixtures are synthetic. Their identifiers and prices are not real offers or customer records.
- Offline checks use loopback transports. They do not need production credentials or trip histories.
- Keep local diagnostic files out of published artifacts. Redact prompts, headers, cookies, tokens, paths, and identifiers before sharing logs.
- Client trust and approval settings remain under the user's control; the configurations do not grant blanket approval.
- This repository is not a privacy notice for the production service and does not promise retention periods or compliance certification.

Use [SECURITY.md](../SECURITY.md) for sensitive findings. GitHub private vulnerability reporting is enabled; do not put confidential evidence in a public issue.
