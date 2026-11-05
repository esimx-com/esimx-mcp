# VS Code

## 1. Configure the workspace

**Prerequisites:** a VS Code release with MCP support, a supported agent/chat setup, and a workspace policy that allows MCP servers. Review Workspace Trust before loading project configuration.

1. Open or create `.vscode/mcp.json` in the target workspace.
2. Merge [configs/vscode.json](../../configs/vscode.json), preserving other servers:

   ```json
   {
     "servers": {
       "esimx": {
         "type": "http",
         "url": "https://api.esimx.com/mcp"
       }
     }
   }
   ```

3. Open the Command Palette and run **MCP: List Servers**. Select eSIMX and start or restart it as needed.
4. Review the discovered tools and trust prompts. Keep normal tool confirmations.

VS Code uses top-level **`servers`**, not `mcpServers`. Alternatively, use **MCP: Add Server**, select HTTP, enter the endpoint, and choose workspace scope. No token, API key, or OAuth client is required.

## 2. Verify and remove

1. In an agent-enabled chat, make both eSIMX tools available through the tool selector.
2. Request a Japan search, then a two-country comparison with explicit days/data.
3. Expect catalog-only USD results and no checkout operation.
4. To remove the connection, stop eSIMX and remove only `servers.esimx` from `.vscode/mcp.json`.

This is VS Code's native MCP configuration, not a Cline/Roo extension configuration. A valid file and passing fixture do not certify an actual VS Code session. Use [Troubleshooting](../troubleshooting.md) if the server cannot start or tools remain stale.

Reference: [VS Code MCP servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).
