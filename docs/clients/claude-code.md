# Claude Code

## 1. Select a route

**Prerequisites:** a current Claude Code release with remote HTTP MCP support and outbound HTTPS access. Plugin routes also require plugin support. Choose one route to avoid duplicate tool connections.

| Route | Supplies |
| --- | --- |
| Project connection | The two remote catalog tools. |
| Session plugin | The same connection plus the travel skill, bundled under one plugin root. |
| Skill only | Planning instructions; an existing eSIMX connection is still required. |

These are native packages, not a claim that this Claude Code release was tested against production.

## 2. Add a project connection

Run in the workspace where you want the connection. This command changes that project's configuration, not this service:

```sh
claude mcp add --scope project --transport http esimx https://api.esimx.com/mcp
claude mcp list
```

Alternatively, merge [configs/claude-code.json](../../configs/claude-code.json) into the workspace's `.mcp.json`. This repository already has that generated file. Do not overwrite unrelated servers. Review the project trust prompt when Claude Code loads the connection.

## 3. Load the plugin for one session

From this repository root:

```sh
claude plugin validate ./plugins/esimx --strict --json
claude --plugin-dir ./plugins/esimx
```

The plugin contains its own `.mcp.json` and self-contained skill references. No script, secret, or local server is required. The root [marketplace manifest](../../.claude-plugin/marketplace.json) points to `./plugins/esimx`. To install from the canonical GitHub repository instead of loading a local session:

```sh
claude plugin marketplace add esimx-com/esimx-mcp
claude plugin install esimx@esimx-local
```

These commands change your Claude Code marketplace/plugin registration; review the trust prompt. Repository installation is not approval by a public plugin directory.

For instructions only, copy the complete canonical [skill directory](../../skills/esimx-travel/SKILL.md) and its references into the target project's `.claude/skills/esimx-travel/`. A skill does not configure the remote server.

## 4. Verify and remove

1. Use `/mcp` to inspect the eSIMX connection and discovered tools.
2. Ask: “Find Japan eSIM plans for 7 days and at least 5 GB total.”
3. Ask for a Japan/South Korea comparison with explicit days and data for both stops.
4. Expect `search_plans` and `compare_trip_options`, USD catalog results, and no account or checkout action.
5. To undo a project connection, run `claude mcp remove --scope project esimx` in that workspace. To stop the session plugin, exit and restart without `--plugin-dir`.

For 403, 429, or missing tools, follow [Troubleshooting](../troubleshooting.md). Do not add OAuth or bypass trust prompts.

Reference: [Claude Code MCP](https://code.claude.com/docs/en/mcp), [plugin reference](https://code.claude.com/docs/en/plugins-reference), [marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference).
