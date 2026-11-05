# Cursor

## 1. Configure the workspace

**Prerequisites:** a Cursor version with remote MCP support and a trusted target workspace. This procedure changes project configuration only.

1. Open or create `.cursor/mcp.json` in the target workspace.
2. Merge [configs/cursor.json](../../configs/cursor.json), preserving other servers:

   ```json
   {
     "mcpServers": {
       "esimx": { "url": "https://api.esimx.com/mcp" }
     }
   }
   ```

3. Reload the MCP connection or restart Cursor if required.
4. Review the server and tool approval prompts in Cursor's MCP settings.

Cursor uses `url` for the remote connection. Do not paste Gemini's `httpUrl` or VS Code's top-level `servers` object. No authorization header or OAuth configuration is needed.

## 2. Verify and remove

1. Check that `search_plans` and `compare_trip_options` appear as enabled tools.
2. In Agent, request a Japan search with days and total MB, then a two-country comparison.
3. Review arguments and returned USD catalog results. Keep normal call approvals enabled.
4. To remove the connection, delete only `mcpServers.esimx` from `.cursor/mcp.json`, then reload it.

A valid project file does not prove that a particular Cursor release or network path can reach production. If discovery fails, record the actual error and use [Troubleshooting](../troubleshooting.md). Do not alter `~/.cursor/mcp.json` unless you separately want a user-wide connection.

Reference: [Cursor MCP](https://cursor.com/docs/context/mcp).
