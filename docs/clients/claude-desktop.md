# Claude remote connector

## 1. Prepare

Use a Claude Desktop or web account with custom remote connector access. Product version, account plan, and workspace administrator policy can affect availability. This route uses a hosted remote connector; it is not a local `claude_desktop_config.json` stdio setup or a Claude Code plugin installation.

No local bridge, Node/Python runtime, API key, or OAuth application is needed. Review [Privacy](../privacy.md) because the hosted provider may send the requests from its infrastructure.

## 2. Connect

1. Open **Customize > Connectors**.
2. Select **Add > Add custom connector**.
3. Enter **eSIMX** as the name and `https://api.esimx.com/mcp` as the remote MCP URL.
4. Select **No sign in** for authentication.
5. Review the trust prompts, add the connector, and enable it for the conversation if required.
6. Inspect the discovered tools before making a request.

**Expected result:** `search_plans` and `compare_trip_options` are available. No account, purchase, or payment permission is requested. If the controls are absent or the workspace requires incompatible authentication, ask the administrator; do not invent OAuth metadata.

## 3. Verify and disconnect

1. Request Japan plans for a stated number of days and total or daily data.
2. Request a Japan/South Korea trip comparison with both stops specified.
3. Confirm that the answer uses returned USD prices and product URLs, not fabricated offers.
4. To disconnect, disable or remove the connector under **Customize > Connectors**. Refresh the conversation if old tool metadata remains visible.

No named Claude Desktop/web production session has been verified by the offline tests. Treat gateway denials and timeouts as failures, not compatibility evidence. Use [Troubleshooting](../troubleshooting.md).

Reference: [Claude custom connectors](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp).
