# Find travel eSIM plans in your AI chat with eSIMX MCP

Planning a trip to one country is one thing. Choosing mobile data for several countries adds another question: should you use one eSIM for the whole trip or buy a local plan for each country?

eSIMX MCP lets your AI assistant search the eSIMX catalog and compare those options using your destinations, trip length, and data needs. You can keep planning in your chat instead of copying plan details between tabs.

## What can it do?

MCP stands for Model Context Protocol. It gives compatible AI applications a standard way to connect to tools and data sources. The eSIMX connection provides two read-only tools:

- `search_plans` finds catalog plans for a destination, filtered by duration and data needs.
- `compare_trip_options` compares one plan for a complete multi-country trip with one local plan per country.

The connection does not place orders, reserve plans, take payments, or access your eSIMX account. You review the results and use the supplied product links if you want to buy through the website.

## Connect your AI application

The remote MCP endpoint is:

```text
https://api.esimx.com/mcp
```

No eSIMX API key, eSIMX sign-in, or local MCP server is required. Add this address in an application that supports remote MCP over Streamable HTTP. Opening the address in a browser is not a connection test.

### Claude Code

Install the plugin from the public GitHub repository. These commands add the marketplace and install the plugin in your Claude Code configuration. Use this route instead of adding a second connection to the same server.

```sh
claude plugin marketplace add esimx-com/esimx-mcp
claude plugin install esimx@esimx-local
```

Review the trust prompts and start a new session if requested. Use `/mcp` to inspect the connection and check that both tools are available.

### ChatGPT

Use a ChatGPT account and workspace that allow custom remote MCP servers. The controls and their availability can vary by plan and workspace policy.

1. Open [ChatGPT Plugins](https://chatgpt.com/plugins). If available, select the plus button, then **Add custom MCP server**.
2. Set the name to **eSIMX** and the description to **Read-only eSIM catalog search and trip comparison**.
3. Under **Connection**, enter `https://api.esimx.com/mcp` as the remote server URL.
4. Select the unauthenticated option. The eSIMX server does not require OAuth credentials or an API key.
5. Review the risk warning. Select **I understand and want to continue**, then **Create as a plugin**, if those controls are shown.
6. Check that `search_plans` and `compare_trip_options` are discovered, then install or enable the connection.
7. Start a new conversation and select eSIMX. Where supported, type `@` to select the custom plugin, then try the search and comparison prompts below.

If the custom-server controls are absent, check your account's availability and workspace policy. If the workspace requires OAuth, ask its administrator rather than entering invented credentials. See the [ChatGPT connection guide](https://github.com/esimx-com/esimx-mcp/blob/v1.0.0/docs/clients/chatgpt.md) for details. Creating a connection in your account does not publish eSIMX in a public ChatGPT directory.

### Claude web and Claude Desktop

If your account and workspace allow custom remote MCP connections, add the endpoint through the application's connector controls. Name the connection eSIMX, select the unauthenticated option, and review the trust prompts before enabling it.

Availability and menu labels vary by product and plan. Follow the [Claude connector guide](https://github.com/esimx-com/esimx-mcp/blob/v1.0.0/docs/clients/claude-desktop.md) for the matching route.

### Gemini CLI

This route is for **Gemini CLI**, not the Gemini web chat. Use a current CLI release with remote HTTP MCP and extension support. Choose one of the following routes to avoid duplicate connections.

**Install the extension**

1. Run this command if you want to register the eSIMX extension in your Gemini CLI installation:

   ```sh
   gemini extensions install https://github.com/esimx-com/esimx-mcp
   ```

2. Review the extension trust prompt and start a new Gemini CLI session.
3. Run `/mcp` and check that `search_plans` and `compare_trip_options` are available.
4. Try the destination search and trip comparison prompts below. Keep the normal tool approval prompts enabled.

**Use a project configuration instead**

If you prefer a workspace connection without installing the extension, merge the following into that project's `.gemini/settings.json`. Preserve existing settings and other servers.

```json
{
  "mcpServers": {
    "esimx": {
      "httpUrl": "https://api.esimx.com/mcp"
    }
  }
}
```

Use `httpUrl`, not `url`, for this Streamable HTTP connection. Restart the session and inspect `/mcp`. No authorization header or API key is required. See the [Gemini CLI guide](https://github.com/esimx-com/esimx-mcp/blob/v1.0.0/docs/clients/gemini.md) for setup and removal instructions.

### Other AI clients

The repository also includes native configuration instructions for [Codex](https://github.com/esimx-com/esimx-mcp/blob/v1.0.0/docs/clients/codex.md), [Cursor](https://github.com/esimx-com/esimx-mcp/blob/v1.0.0/docs/clients/cursor.md), and [VS Code](https://github.com/esimx-com/esimx-mcp/blob/v1.0.0/docs/clients/vscode.md). Use the guide for your client rather than copying another application's configuration format.

## Try a destination search

Once connected, tell your AI assistant where you are going, how long you will stay, and how much data you need. For example:

> Find Japan eSIM plans for 7 days with at least 5 GB total. Show prices in USD and links to the plans.

State whether the data amount is for the whole stay or for each day. “5 GB total” and “5 GB per day” are different requirements. If no plan matches, ask which requirement to change rather than treating a smaller plan as a match.

## Compare a multi-country trip

List each country in travel order, with its stay length and data requirement:

> Compare one plan for my whole trip with local plans: Japan for 4 days with 3 GB total, then South Korea for 3 days with 2 GB total.

The comparison checks for complete options: one plan that covers the trip, or qualifying local plans for every country. If one option is incomplete, it should not be presented as a complete trip price.

## Review the results before you buy

- Results cover the eSIMX catalog, not every provider on the market or live supplier inventory.
- Check the returned USD price, coverage, data allowance, and validity.
- Do not assume hotspot support, activation rules, or speed limits when those details are unknown.
- Open the supplied product link and review the plan details before purchasing.

Send only the countries, days, and data needs required for the search. Leave out names, booking references, passport details, and payment information. Your AI provider and network services may process requests and connection metadata. Read the [MCP data-handling notes](https://github.com/esimx-com/esimx-mcp/blob/v1.0.0/docs/privacy.md) before sharing sensitive travel details.

## Get started

Open the [eSIMX MCP repository](https://github.com/esimx-com/esimx-mcp), choose your client guide, and connect the remote endpoint. The [v1.0.0 release](https://github.com/esimx-com/esimx-mcp/releases/tag/v1.0.0) includes the client configurations, plugin, documentation, and SDK examples.

Claude Code 2.1.318 was tested on November 5, 2026: both search and comparison returned successful results. Other client guides describe setup routes, not a guarantee for every version, account, or network. See the [verification record](https://github.com/esimx-com/esimx-mcp/blob/v1.0.0/docs/verification.md) for the tested scope.
