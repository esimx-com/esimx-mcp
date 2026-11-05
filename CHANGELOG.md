# Changelog

## 1.0.0

### Added

- Native remote MCP configurations for Claude Code, Codex, Gemini CLI, Cursor, and VS Code.
- Local Claude Code plugin/marketplace and Gemini extension packaging.
- Portable travel-planning skill with self-contained client copies.
- Public schemas for `search_plans` and `compare_trip_options`.
- Official TypeScript and Python SDK examples with offline loopback tests.
- Deterministic generation, metadata checks, and offline CI.
- English client guides, tool/data references, and maintenance policies.

### Fixed

- Removed the unsupported top-level `allOf` wrapper from the live search input Schema and its public snapshots. Daily-mode required-field validation is retained.
- A fresh GitHub installation in Claude Code 2.1.318 exposed both tools on 2026-11-05. One actual search and one comparison each returned `ok` over the modern protocol lane.

### Publication status

Source repository: https://github.com/esimx-com/esimx-mcp. Original project material is MIT-licensed. GitHub private vulnerability reporting is enabled. Registry domain verification, Registry registration, and public directory submissions are not included. Client acceptance is limited to the versions and routes recorded in [Verification](docs/verification.md).
