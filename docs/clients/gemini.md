# Gemini CLI

## 1. Select a route

**Prerequisites:** current Gemini CLI with remote HTTP MCP and extension support. Choose either the extension or a standalone connection. A user/project server named `esimx` takes precedence over an extension server with the same name.

## 2. Use the local extension

From this repository root, run only if you want to link the extension into your Gemini CLI installation:

```sh
gemini extensions link .
gemini extensions list
```

To install the canonical remote extension instead of linking a local checkout:

```sh
gemini extensions install https://github.com/esimx-com/esimx-mcp
```

Choose one extension route. Then start a new Gemini CLI session and review the extension trust prompt. Linking changes the user's Gemini extension registration; this repository does not execute the command for you. The extension's native manifest is [gemini-extension.json](../../gemini-extension.json); [GEMINI.md](../../GEMINI.md) points to the bundled canonical skill. It contains no local executable server.

## 3. Use a project connection instead

Merge [configs/gemini-cli.json](../../configs/gemini-cli.json) into the target workspace's `.gemini/settings.json`:

```json
{
  "mcpServers": {
    "esimx": { "httpUrl": "https://api.esimx.com/mcp" }
  }
}
```

Use **`httpUrl`**, not `url`: in Gemini's native settings, `url` selects SSE and `httpUrl` selects Streamable HTTP. Preserve other servers and normal tool confirmations. No `trust: true`, headers, or credentials are necessary.

## 4. Verify and remove

1. Restart the session if configuration was changed. Use `/mcp` to inspect the tools.
2. Request a destination search and a two-country comparison with explicit days/data.
3. Expect both catalog tools and no purchase operation.
4. For the extension route, run `gemini extensions uninstall esimx-mcp` when you deliberately want to remove the registration. For the standalone route, remove only `mcpServers.esimx` from project settings, then reload.

Metadata validity and offline tests do not certify a real Gemini session. Retain a 403 denial and stop; honor `Retry-After` on 429. See [Troubleshooting](../troubleshooting.md).

Reference: [Extension reference](https://geminicli.com/docs/extensions/reference/), [MCP configuration](https://geminicli.com/docs/tools/mcp-server/).
