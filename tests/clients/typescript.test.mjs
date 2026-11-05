import assert from 'node:assert/strict';
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import project from '../../project.json' with { type: 'json' };
import { startFixture } from '../fixtures/catalog.mjs';
import { runExample, withCatalogClient, callCatalogTool, ToolCallError, EXAMPLE_STOPS, PUBLIC_ENDPOINT } from '../../dist/examples/typescript/client.js';

async function fixtureFor(t, mode = 'normal') {
  const fixture = await startFixture({ mode });
  t.after(async () => {
    await fixture.close();
    assert.equal(fixture.stats().listening, false);
    assert.equal(fixture.stats().activeTransports, 0);
    assert.deepEqual(fixture.stats().failures, []);
  });
  return fixture;
}
const calls = (fixture) => fixture.events.filter((event) => event.body?.method === 'tools/call');

test('TypeScript SDK initializes, discovers, searches and compares; null and zero survive', async (t) => {
  const fixture = await fixtureFor(t);
  const output = await runExample(fixture.endpoint);
  assert.equal(output.server.name, 'synthetic-esimx-fixture');
  assert.deepEqual(output.tools, ['search_plans', 'compare_trip_options']);
  const search = output.search.structuredContent;
  const comparison = output.comparison.structuredContent;
  assert.match(search.notes[0], /SYNTHETIC/);
  assert.equal(search.plans[0].price_usd_cents, 0);
  assert.equal(search.plans[0].tethering, null);
  assert.equal(search.plans[0].product_url, null);
  assert.equal(comparison.options[0].total_price_usd_cents, 0);
  assert.equal(comparison.options[1].available, false);
  assert.equal(comparison.options[1].total_price_usd_cents, null);
  assert.equal(comparison.price_difference_usd_cents, null);
  assert.deepEqual(calls(fixture).map((event) => event.body.params), [
    { name: 'search_plans', arguments: { destination: 'Japan', days: 3, min_data_mb: 1024, limit: 3 } },
    { name: 'compare_trip_options', arguments: { stops: EXAMPLE_STOPS } },
  ]);
  const posts = fixture.events.filter((event) => event.method === 'POST');
  assert.deepEqual(posts.map((event) => event.body.method), [
    'initialize', 'notifications/initialized', 'tools/list', 'tools/call', 'tools/call',
  ]);
  assert.equal(posts[0].body.params.protocolVersion, '2025-11-25');
  assert.equal(posts[0].body.params.clientInfo.version, project.version);
  assert.equal(PUBLIC_ENDPOINT, project.endpoint);
  for (const event of posts) {
    assert.match(event.headers.accept, /application\/json/);
    assert.match(event.headers.accept, /text\/event-stream/);
    assert.equal(event.headers.origin, undefined);
    assert.equal(event.headers.authorization, undefined);
    if (event.body.method !== 'initialize') assert.equal(event.headers['mcp-protocol-version'], '2025-11-25');
  }
  assert.ok(fixture.events.every((event) => event.method !== 'DELETE'), 'Stateless clients must not terminate a nonexistent session');
});

test('TypeScript SDK preserves a zero price difference and complete tied options', async (t) => {
  const fixture = await fixtureFor(t, 'zero-difference');
  const output = await runExample(fixture.endpoint);
  const result = output.comparison.structuredContent;
  assert.equal(result.price_difference_usd_cents, 0);
  assert.ok(result.options.every((option) => option.available && option.total_price_usd_cents === 0));
  assert.equal(result.reason_code, 'same_price_fewer_installations');
});

for (const [label, name, args] of [
  ['missing destination', 'search_plans', {}],
  ['daily missing duration', 'search_plans', { destination: 'Japan', data_mode: 'daily', min_data_mb: 1024 }],
  ['unknown property', 'search_plans', { destination: 'Japan', purchase: true }],
  ['wrong type', 'search_plans', { destination: 'Japan', days: '3' }],
  ['stops is an object', 'compare_trip_options', { stops: {} }],
  ['null stop', 'compare_trip_options', { stops: [null, EXAMPLE_STOPS[1]] }],
  ['too few stops', 'compare_trip_options', { stops: [EXAMPLE_STOPS[0]] }],
  ['trip over 365 days', 'compare_trip_options', { stops: EXAMPLE_STOPS.map((stop) => ({ ...stop, days: 200 })) }],
  ['one country', 'compare_trip_options', { stops: [EXAMPLE_STOPS[0], EXAMPLE_STOPS[0]] }],
]) {
  test(`TypeScript SDK exposes invalid arguments: ${label}`, async (t) => {
    const fixture = await fixtureFor(t);
    await withCatalogClient(fixture.endpoint, async (client) => {
      await client.listTools();
      await assert.rejects(callCatalogTool(client, name, args), (error) => {
        assert.ok(error instanceof ToolCallError);
        assert.equal(error.result.isError, true);
        assert.equal(error.result.structuredContent.error_code, 'invalid_arguments');
        return true;
      });
    });
    assert.equal(calls(fixture).length, 1);
  });
}

test('TypeScript SDK distinguishes catalog unavailability from no matches', async (t) => {
  const unavailable = await fixtureFor(t, 'catalog-unavailable');
  await assert.rejects(runExample(unavailable.endpoint), /catalog_unavailable/);
  assert.equal(calls(unavailable).length, 1);
  const empty = await fixtureFor(t, 'no-match');
  const output = await runExample(empty.endpoint);
  assert.equal(output.search.isError, false);
  assert.equal(output.search.structuredContent.status, 'no_match');
  assert.deepEqual(output.search.structuredContent.plans, []);
});

test('TypeScript SDK stops on HTTP 429, reports Retry-After and never retries', async (t) => {
  const fixture = await fixtureFor(t, 'throttle');
  await assert.rejects(runExample(fixture.endpoint), /HTTP 429; Retry-After: 60; stopped without retrying/);
  assert.equal(calls(fixture).length, 1);
});

test('TypeScript SDK stops when the background GET is throttled', async (t) => {
  const fixture = await fixtureFor(t, 'throttle-get');
  await assert.rejects(runExample(fixture.endpoint), /HTTP 429; Retry-After: 60; stopped without retrying/);
  assert.equal(calls(fixture).length, 0);
});

test('TypeScript SDK reports gateway 403/1010 denial without browser impersonation', async (t) => {
  const fixture = await fixtureFor(t, 'http-denied');
  await assert.rejects(runExample(fixture.endpoint), (error) => {
    assert.equal(error.code, 403);
    assert.match(error.message, /1010.*browser_signature_banned/);
    return true;
  });
  assert.equal(fixture.events.length, 1);
  assert.doesNotMatch(fixture.events[0].headers['user-agent'] ?? '', /Mozilla|Chrome|Safari/);
});

test('TypeScript SDK reports background GET denial instead of claiming success', async (t) => {
  const fixture = await fixtureFor(t, 'http-denied-get');
  await assert.rejects(runExample(fixture.endpoint), (error) => {
    assert.equal(error.code, 403);
    assert.match(error.message, /1010.*browser_signature_banned/);
    return true;
  });
  assert.equal(calls(fixture).length, 0);
});

test('TypeScript SDK propagates protocol errors for unknown tools', async (t) => {
  const fixture = await fixtureFor(t);
  await withCatalogClient(fixture.endpoint, async (client) => {
    await client.listTools();
    await assert.rejects(callCatalogTool(client, 'not_a_tool', {}), /Unknown tool/);
  });
  assert.equal(calls(fixture).length, 1);
});

test('smoke and TypeScript executable require explicit opt-in before networking', () => {
  for (const script of ['scripts/smoke.mjs', 'dist/examples/typescript/client.js']) {
    const result = spawnSync(process.execPath, [script], {
      cwd: new URL('../../', import.meta.url), encoding: 'utf8', timeout: 5000,
    });
    assert.notEqual(result.status, 0, result.stderr);
    assert.match(result.stderr, /--confirm-read-only/);
    const unknown = spawnSync(process.execPath, [script, '--unknown'], {
      cwd: new URL('../../', import.meta.url), encoding: 'utf8', timeout: 5000,
    });
    assert.notEqual(unknown.status, 0);
  }
});

test('root TypeScript example script runs against loopback without a production opt-in', async (t) => {
  const fixture = await fixtureFor(t);
  const command = process.env.npm_execpath ? process.execPath : 'npm';
  const args = [...(process.env.npm_execpath ? [process.env.npm_execpath] : []), 'run', 'example:typescript', '--', '--endpoint', fixture.endpoint];
  const { stdout } = await promisify(execFile)(command, args, {
    cwd: new URL('../../', import.meta.url), timeout: 15_000,
  });
  const output = JSON.parse(stdout.slice(stdout.indexOf('{\n')));
  assert.deepEqual(output.tools, ['search_plans', 'compare_trip_options']);
  assert.equal(output.comparison.structuredContent.price_difference_usd_cents, null);
  assert.equal(fixture.stats().toolCalls, 2);
});
