# Maintenance instructions

## Boundaries

- Work in this repository. Keep public schemas and synthetic fixtures; keep private backend files and customer data out.
- Keep documentation and descriptions English-only.
- Use official MCP SDKs and native client formats. This project connects to an existing service; it does not implement another server.
- Run verification offline. Production calls, publication, commits/pushes, and global client settings require separate explicit authorization.
- Preserve unresolved identity and license fields. Obtain owner input before filling them.

## Change procedure

1. Read `project.json` and the relevant package scripts. Edit generator inputs, then run `npm run generate`; retain a clean `npm run generate -- --check` result.
2. For tool or result changes, read [tools](docs/tools.md), [data](docs/data.md), and `schemas/tools.json`. Preserve integer cents, null values, zero prices, and complete-option comparison.
3. For transport or SDK changes, read [protocol](docs/protocol.md); run official SDK tests against loopback fixtures.
4. For client packaging changes, read the matching [client guide](README.md#1-connect-a-client). Validate each native shape separately.
5. Run the affected checks in [maintenance](docs/maintenance.md). Report exact commands, results, and anything not verified.

For releases or metadata identity changes, read [publishing](docs/publishing.md) before acting. For sensitive findings, follow [security](SECURITY.md).
