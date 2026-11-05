# ChatGPT

## 1. Prepare

Use a ChatGPT account and workspace that permit custom remote MCP servers. Availability, administrator controls, and labels can vary. GPT model names do not install a connection. The Claude Code plugin and Gemini extension are not ChatGPT upload packages.

The endpoint is public and anonymous. Do not create OAuth credentials, provide an API key, or invent an authorization server. A hosted connector may contact eSIMX from OpenAI infrastructure; see [Privacy](../privacy.md).

## 2. Add a custom MCP server

1. Open [ChatGPT Plugins](https://chatgpt.com/plugins).
2. Select the plus button, then **Add custom MCP server**.
3. Enter a name such as **eSIMX** and a description such as **Read-only eSIM catalog search and trip comparison**.
4. Under **Connection**, choose the public endpoint route. Enter `https://api.esimx.com/mcp`.
5. Select the unauthenticated option supported by the UI. No sign-in is required by this server. If the workspace forces OAuth, stop and ask its administrator; do not fabricate credentials.
6. Review the risk warning. Select **I understand and want to continue**, then **Create as a plugin** if those controls are available.
7. Review the discovered tools and metadata before enabling the connection.

**Expected result:** `search_plans` and `compare_trip_options` are discovered. There is no checkout or account tool. If the custom-server UI is absent, consult current product availability and workspace policy rather than assuming all accounts support it.

## 3. Use and remove

1. Install/enable the resulting custom plugin, then start a new conversation.
2. Type `@` and select it, where supported by the current UI.
3. Request a destination search, then a comparison with two ordered country stops, days, and data requirements.
4. Inspect tool selection, arguments, returned scope, price, and unknown restrictions.
5. To disconnect, disable or remove the custom plugin in the product's plugin management UI.

A connection created in your account is not a public directory approval. No named ChatGPT production session has been certified by this repository. A 403 is a failed connection attempt; a 429 requires waiting. See [Troubleshooting](../troubleshooting.md).

Reference: [Connect from ChatGPT](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt).
