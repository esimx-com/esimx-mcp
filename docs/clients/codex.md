# Codex

## 1. Add the connection

**Prerequisites:** current Codex CLI or IDE extension with Streamable HTTP MCP support. Project configuration is loaded only for trusted projects. The connection is an application setting, not a GPT model setting.

1. Open the target workspace's `.codex/config.toml`.
2. Merge [configs/codex.toml](../../configs/codex.toml), preserving other settings:

   ```toml
   [mcp_servers.esimx]
   url = "https://api.esimx.com/mcp"
   ```

3. Review the workspace trust decision and restart Codex if required.
4. Run `codex mcp list` to inspect configured servers. In an interactive session, use `/mcp` to inspect availability.

The vendor's CLI alternative is `codex mcp add esimx --url https://api.esimx.com/mcp`. It normally writes the user's Codex configuration; run it only if you deliberately want that scope. This repository does not run it or change user-level settings.

## 2. Enable the optional skill

The generated [.agents/skills/esimx-travel](../../.agents/skills/esimx-travel/SKILL.md) is already present for this repository. For another workspace, copy that whole directory, including `references/`, into its `.agents/skills/`. Keep the skill name unique; duplicate skill names can appear separately rather than merge.

The skill supplies travel-planning instructions. It does not install or connect the server. Use the MCP configuration above as well.

## 3. Verify and remove

1. Ask Codex to discover the connected eSIMX tools.
2. Request a Japan search with explicit days and total MB, then a two-country comparison.
3. Expect `search_plans` and `compare_trip_options`. Preserve null/zero values and catalog notes.
4. To remove the project connection, delete only `[mcp_servers.esimx]` from that project's TOML. Remove the optional skill directory if no longer needed, then reload Codex.

No token, environment variable, bearer header, or OAuth client is needed. A successful local fixture is not proof of production access from Codex. Use [Troubleshooting](../troubleshooting.md) for connection failures.

Reference: [Codex MCP](https://developers.openai.com/codex/mcp), [Codex skills](https://developers.openai.com/codex/skills).
