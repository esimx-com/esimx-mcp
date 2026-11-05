import { parseArgs } from 'node:util';
import project from '../../project.json' with { type: 'json' };
import { pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport, StreamableHTTPError } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const PUBLIC_ENDPOINT = project.endpoint;
const REQUEST_TIMEOUT_MS = 7_000;
export const EXAMPLE_STOPS = [
  { destination: 'Japan', days: 3, min_data_mb: 1024 },
  { destination: 'South Korea', days: 3, min_data_mb: 1024 },
];

export class ToolCallError extends Error {
  constructor(readonly result: CallToolResult) {
    super(`Tool failed: ${JSON.stringify(result.structuredContent ?? result.content)}`);
    this.name = 'ToolCallError';
  }
}

/** The SDK owns initialization, protocol headers, encoding, and cleanup. No retries. */
export async function withCatalogClient<T>(
  endpoint: string,
  action: (client: Client) => Promise<T>,
): Promise<T> {
  const deadline = AbortSignal.timeout(25_000);
  const operation = new AbortController();
  let stoppedError: Error | undefined;
  const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
    reconnectionOptions: {
      maxRetries: 0,
      initialReconnectionDelay: 1000,
      maxReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1,
    },
    fetch: async (url, init) => {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.any([
          deadline,
          operation.signal,
          AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          ...(init?.signal ? [init.signal] : []),
        ]),
      });
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after') ?? 'not supplied';
        await response.body?.cancel();
        stoppedError = new Error(`HTTP 429; Retry-After: ${retryAfter}; stopped without retrying`);
        operation.abort(stoppedError);
        throw stoppedError;
      }
      if (response.status === 403) {
        stoppedError = new StreamableHTTPError(403, await response.text());
        operation.abort(stoppedError);
        throw stoppedError;
      }
      return response;
    },
  });
  const client = new Client({ name: 'esimx-typescript-example', version: project.version });
  try {
    await client.connect(transport, { timeout: REQUEST_TIMEOUT_MS });
    const result = await action(client);
    operation.signal.throwIfAborted();
    return result;
  } catch (error) {
    throw stoppedError ?? error;
  } finally {
    // This endpoint is stateless. Do not send DELETE to terminate a nonexistent session.
    await client.close();
  }
}

export async function callCatalogTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const result = await client.callTool({ name, arguments: args }, CallToolResultSchema, { timeout: REQUEST_TIMEOUT_MS });
  if (result.isError) throw new ToolCallError(result as CallToolResult);
  return result as CallToolResult;
}

export async function runExample(endpoint: string) {
  return withCatalogClient(endpoint, async (client) => {
    const discovery = await client.listTools({}, { timeout: REQUEST_TIMEOUT_MS });
    const names = discovery.tools.map((tool) => tool.name);
    for (const required of ['search_plans', 'compare_trip_options']) {
      if (!names.includes(required)) throw new Error(`Expected tool not discovered: ${required}`);
    }
    const search = await callCatalogTool(client, 'search_plans', {
      destination: 'Japan', days: 3, min_data_mb: 1024, limit: 3,
    });
    const comparison = await callCatalogTool(client, 'compare_trip_options', { stops: EXAMPLE_STOPS });
    // Return the native result objects. Never replace null with zero or reprice plans.
    return { server: client.getServerVersion(), tools: names, search, comparison };
  });
}

export function errorMessage(error: unknown): string {
  if (error instanceof StreamableHTTPError) return `HTTP ${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : String(error);
}

export async function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: {
    endpoint: { type: 'string', default: PUBLIC_ENDPOINT },
    'confirm-read-only': { type: 'boolean', default: false },
  } });
  const endpoint = new URL(values.endpoint!);
  const loopback = endpoint.protocol === 'http:' && endpoint.hostname === '127.0.0.1';
  if (!loopback && !values['confirm-read-only']) {
    throw new Error('No network request sent. Add --confirm-read-only to allow three read-only catalog requests plus initialization.');
  }
  console.log(JSON.stringify(await runExample(endpoint.href), null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}
