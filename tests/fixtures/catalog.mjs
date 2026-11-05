/** Synthetic SDK-backed loopback fixture. Never a deployable eSIMX server. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import {
  CallToolRequestSchema, ListToolsRequestSchema, InitializedNotificationSchema,
  McpError, ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';

const tools = JSON.parse(await readFile(new URL('../../schemas/tools.json', import.meta.url), 'utf8'));
const validator = new AjvJsonSchemaValidator();
const validators = new Map(tools.map((tool) => [tool.name, validator.getValidator(tool.inputSchema)]));
const notes = ['SYNTHETIC LOOPBACK FIXTURE. Not production prices or inventory.'];
const base = { status: 'ok', scope: 'esimx_catalog', currency: 'USD', checked_at: '2026-01-01T00:00:00Z', notes };
const plan = {
  package_id: '0', package_code: 'synthetic-free', package_name: 'Synthetic zero-price plan',
  area_code: 'JP', area_slug: 'synthetic-japan', area_name: 'Japan',
  price_usd_cents: 0, price_usd: '0.00', currency: 'USD', validity_days: 7,
  allowance_type: 'total', total_data_mb: 2048, daily_data_mb: null,
  coverage_country_codes: ['JP', 'KR'], throttle_speed: null, tethering: null,
  billing_type: null, activation_type: null, activation_desc: null, additional_desc: null,
  product_url: null,
};

function toolResult(data, isError = false) {
  return { structuredContent: data, content: [{ type: 'text', text: JSON.stringify(data) }], isError };
}

function syntheticSearch(args, mode) {
  if (mode === 'catalog-unavailable' || args.destination === 'Fixture unavailable') {
    return toolResult({ error_code: 'catalog_unavailable', message: 'Synthetic unavailable catalog' }, true);
  }
  if (args.destination === 'Nowhere') {
    return toolResult({ ...base, status: 'destination_not_found', candidates: [], candidate_count: 0, truncated: false });
  }
  return toolResult({
    ...base,
    destination: { code: 'JP', slug: 'synthetic-japan', name: 'Japan', type: 'local' },
    criteria: { days: args.days ?? null, min_data_mb: args.min_data_mb ?? null, data_mode: args.data_mode ?? 'total', limit: args.limit ?? 10 },
    status: mode === 'no-match' ? 'no_match' : 'ok',
    matched_count: mode === 'no-match' ? 0 : 1, returned_count: mode === 'no-match' ? 0 : 1,
    truncated: false, plans: mode === 'no-match' ? [] : [plan],
  });
}

function syntheticComparison(args, mode) {
  const localAvailable = mode === 'zero-difference';
  const days = args.stops.reduce((sum, stop) => sum + stop.days, 0);
  let day = 0;
  const stops = args.stops.map((stop) => {
    const start = day + 1;
    day += stop.days;
    return { ...stop, destination: { code: stop.destination === 'Japan' ? 'JP' : 'KR', name: stop.destination, slug: `synthetic-${stop.destination.toLowerCase().replaceAll(' ', '-')}`, type: 'local' }, start_day: start, end_day: day };
  });
  const entry = (code, start, end) => ({
    plan: { ...plan, area_code: code, coverage_country_codes: [code] },
    country_codes: [code], start_day: start, end_day: end,
  });
  const option = (type, available) => ({
    type, available,
    plans: type === 'single_plan'
      ? [{ plan, country_codes: ['JP', 'KR'], start_day: 1, end_day: days }]
      : [entry('JP', 1, args.stops[0].days), ...(available ? [entry('KR', args.stops[0].days + 1, days)] : [])],
    installation_count: type === 'single_plan' ? 1 : 2,
    total_price_usd_cents: available ? 0 : null,
    total_price_usd: available ? '0.00' : null,
    unavailable_reasons: available ? [] : ['missing_local_plan'],
    missing_country_codes: available ? [] : ['KR'],
  });
  return toolResult({
    ...base, stops, data_mode: args.data_mode ?? 'total', total_days: days,
    options: [option('single_plan', true), option('local_plans', localAvailable)],
    recommended_option: 'single_plan', reason_code: localAvailable ? 'same_price_fewer_installations' : 'only_complete_option',
    price_difference_usd_cents: localAvailable ? 0 : null,
  });
}

export async function startFixture({ mode = 'normal' } = {}) {
  const events = [];
  const failures = [];
  const transports = new Set();
  const sockets = new Set();
  let toolCalls = 0;
  const http = createServer(async (request, response) => {
    try {
      if (request.url !== '/mcp') {
        response.writeHead(404).end();
        return;
      }
      let body;
      if (request.method === 'POST') {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      }
      events.push({ method: request.method, headers: request.headers, body });
      if (request.method === 'GET' && mode === 'http-denied-get') {
        response.writeHead(403, { 'content-type': 'text/plain' }).end('Synthetic Cloudflare denial: Error 1010 browser_signature_banned');
        return;
      }
      if (request.method === 'GET' && mode === 'throttle-get') {
        response.writeHead(429, { 'retry-after': '60' }).end();
        return;
      }
      if (request.method !== 'POST') {
        response.writeHead(request.method === 'GET' ? 405 : 404).end();
        return;
      }
      if (mode === 'http-denied') {
        response.writeHead(403, { 'content-type': 'text/plain' }).end('Synthetic Cloudflare denial: Error 1010 browser_signature_banned');
        return;
      }
      if (body.method === 'tools/call') {
        toolCalls += 1;
        if (mode === 'throttle') {
          response.writeHead(429, { 'content-type': 'application/json', 'retry-after': '60' })
            .end(JSON.stringify({ jsonrpc: '2.0', id: body.id, error: { code: -32000, message: 'Synthetic rate limit' } }));
          return;
        }
      }
      const server = new Server({ name: 'synthetic-esimx-fixture', version: '1.0.0' }, { capabilities: { tools: {} } });
      server.setNotificationHandler(InitializedNotificationSchema, () => {});
      server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));
      server.setRequestHandler(CallToolRequestSchema, (request) => {
        const { name, arguments: args = {} } = request.params;
        const validate = validators.get(name);
        if (!validate) throw new McpError(ErrorCode.InvalidParams, 'Unknown tool');
        const validation = validate(args);
        if (!validation.valid) return toolResult({ error_code: 'invalid_arguments', message: validation.errorMessage }, true);
        let violation = null;
        const destinations = name === 'search_plans' ? [args.destination] : args.stops?.map((stop) => stop.destination);
        if (!violation && destinations.some((value) => !value.trim())) violation = 'Destination must not be blank';
        if (!violation && name === 'compare_trip_options') {
          if (args.stops.reduce((sum, stop) => sum + stop.days, 0) > 365) violation = 'Total trip days must not exceed 365';
          if (new Set(args.stops.map((stop) => stop.destination.trim().toLowerCase())).size < 2) violation = 'At least two distinct countries required';
        }
        if (violation) return toolResult({ error_code: 'invalid_arguments', message: violation }, true);
        return name === 'search_plans' ? syntheticSearch(args, mode) : syntheticComparison(args, mode);
      });
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      transports.add(transport);
      await server.connect(transport);
      try {
        await transport.handleRequest(request, response, body);
      } finally {
        await server.close();
        transports.delete(transport);
      }
    } catch (error) {
      failures.push(String(error));
      if (!response.headersSent) response.writeHead(500, { 'content-type': 'text/plain' }).end(String(error));
      else response.destroy(error);
    }
  });
  http.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  await new Promise((resolve, reject) => {
    http.once('error', reject);
    http.listen(0, '127.0.0.1', resolve);
  });
  return {
    endpoint: `http://127.0.0.1:${http.address().port}/mcp`,
    events,
    stats: () => ({ events, failures, toolCalls, activeTransports: transports.size, openSockets: sockets.size, listening: http.listening }),
    async close() {
      const closing = new Promise((resolve, reject) => http.close((error) => error ? reject(error) : resolve()));
      http.closeAllConnections();
      await Promise.all([...transports].map((transport) => transport.close()));
      await closing;
    },
  };
}

// Process-control messages are test-harness IPC, not MCP requests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] ?? 'normal';
  const fixture = await startFixture({ mode });
  console.log(JSON.stringify({ endpoint: fixture.endpoint }));
  const input = createInterface({ input: process.stdin });
  for await (const line of input) {
    if (line === 'stats') console.log(JSON.stringify(fixture.stats()));
    else if (line === 'close') break;
    else throw new Error('Unknown fixture control command');
  }
  await fixture.close();
  console.log(JSON.stringify({ ...fixture.stats(), closed: true }));
}
