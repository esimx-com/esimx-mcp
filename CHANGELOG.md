# Changelog

## 1.0.0 — Unreleased

### Added

- Native remote MCP configurations for Claude Code, Codex, Gemini CLI, Cursor, and VS Code.
- Local Claude Code plugin/marketplace and Gemini extension packaging.
- Portable travel-planning skill with self-contained client copies.
- Public schemas for `search_plans` and `compare_trip_options`.
- Official TypeScript and Python SDK examples with offline loopback tests.
- Deterministic generation, metadata checks, and offline CI.
- English client guides, tool/data references, and maintenance policies.

### Known compatibility issue

Claude Code 2.1.318 installs and connects successfully but skips `search_plans` because the live input Schema contains top-level `allOf`. An actual comparison returned `ok`; complete two-tool acceptance is not yet satisfied. The pinned official TypeScript/Python SDKs support both tools.

### Publication status

Source repository: https://github.com/esimx-com/esimx-mcp. Original project material is MIT-licensed. GitHub private vulnerability reporting is enabled; domain verification remains pending. No tagged release, Registry registration, public directory listing, or named AI-application live certification is claimed.
