import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { generate, generatedFiles, json, projectRoot, readProject, validateRepository } from '../../scripts/generate.mjs';
import { checkContracts, checkDocumentLinks } from '../../scripts/check.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'esimx-metadata-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of ['project.json', 'schemas', 'skills/esimx-travel']) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    cpSync(join(projectRoot, path), join(root, path), { recursive: true });
  }
  update(root, (project) => { project.repository = null; project.maintainers = []; });
  generate({ root });
  return root;
}

function update(root, change) {
  const project = readProject(root);
  change(project);
  writeFileSync(join(root, 'project.json'), json(project));
}

function snapshot(root) {
  const result = {};
  function visit(directory) {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      if (statSync(path).isDirectory()) visit(path);
      else result[relative(root, path)] = { sha256: createHash('sha256').update(readFileSync(path)).digest('hex'), mtime: statSync(path).mtimeMs };
    }
  }
  visit(root);
  return result;
}

const load = (root, path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

test('public schema snapshot matches its SHA256 provenance', () => {
  const provenance = load(projectRoot, 'schemas/provenance.json');
  assert.equal(provenance.sha256, createHash('sha256').update(readFileSync(join(projectRoot, provenance.snapshot))).digest('hex'));
  assert.equal(provenance.source.path, 'sim-portal/src/main/resources/mcp/public-tools.json');
});

test('Registry schema rejects overlong descriptions rather than emitting invalid metadata', (t) => {
  const root = fixture(t);
  update(root, (p) => { p.description = 'x'.repeat(101); });
  generate({ root });
  assert.throws(() => checkContracts(root), /must NOT have more than 100 characters/);
});

test('exported schemas preserve exact public tool constraints', () => {
  const [search, compare] = load(projectRoot, 'schemas/tools.json');
  assert.equal(search.name, 'search_plans');
  assert.deepEqual(search.inputSchema.required, ['destination']);
  assert.deepEqual(search.inputSchema.allOf[0].then.required, ['days', 'min_data_mb']);
  assert.equal(search.inputSchema.properties.limit.maximum, 20);
  assert.equal(compare.name, 'compare_trip_options');
  assert.equal(compare.inputSchema.properties.stops.minItems, 2);
  assert.equal(compare.inputSchema.properties.stops.maxItems, 10);
  assert.deepEqual(compare.inputSchema.properties.stops.items.required, ['destination', 'days', 'min_data_mb']);
  for (const tool of [search, compare]) assert.deepEqual(tool.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
});

test('all metadata contracts work locally without a repository or identities', (t) => {
  const root = fixture(t);
  update(root, (p) => { p.repository = null; p.maintainers = []; });
  generate({ root });
  assert.equal(checkContracts(root), 2);
  assert.ok(!existsSync(join(root, 'glama.json')));
  assert.ok(!('repository' in load(root, 'server.json')));
});

test('generation is deterministic and a second pass writes nothing', (t) => {
  const root = fixture(t);
  const before = snapshot(root);
  assert.deepEqual(generate({ root }).drift, []);
  assert.deepEqual(snapshot(root), before);
});

test('--check reports changed and missing generated files without any writes', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'configs/cursor.json'), '{}\n');
  rmSync(join(root, 'configs/codex.toml'));
  const before = snapshot(root);
  const result = generate({ root, check: true });
  assert.deepEqual(result.drift.sort(), ['configs/codex.toml', 'configs/cursor.json']);
  assert.deepEqual(snapshot(root), before);
  assert.throws(() => checkContracts(root), /Generated drift/);
});

test('CLI --check fails on drift without repairing it', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, 'scripts'));
  cpSync(join(projectRoot, 'scripts/generate.mjs'), join(root, 'scripts/generate.mjs'));
  writeFileSync(join(root, '.mcp.json'), '{}\n');
  const before = snapshot(root);
  const result = spawnSync(process.execPath, [join(root, 'scripts/generate.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Generated file drift/);
  assert.deepEqual(snapshot(root), before);
});

test('removed references are detected without writes, then removed from generated skill copies', (t) => {
  const root = fixture(t);
  const stale = 'plugins/esimx/skills/esimx-travel/references/stale.md';
  writeFileSync(join(root, stale), 'Synthetic stale reference.\n');
  const before = snapshot(root);
  assert.ok(generate({ root, check: true }).drift.includes(stale));
  assert.deepEqual(snapshot(root), before);
  generate({ root });
  assert.ok(!existsSync(join(root, stale)));
});

test('native transports remain platform-specific with no anonymous auth fields', (t) => {
  const root = fixture(t);
  const endpoint = readProject(root).endpoint;
  assert.deepEqual(load(root, '.mcp.json'), { mcpServers: { esimx: { type: 'http', url: endpoint } } });
  assert.deepEqual(load(root, 'configs/cursor.json'), { mcpServers: { esimx: { url: endpoint } } });
  assert.deepEqual(load(root, 'configs/gemini-cli.json'), { mcpServers: { esimx: { httpUrl: endpoint } } });
  assert.deepEqual(load(root, 'configs/vscode.json'), { servers: { esimx: { type: 'http', url: endpoint } } });
  assert.match(readFileSync(join(root, 'configs/codex.toml'), 'utf8'), /^\[mcp_servers\.esimx\]\nurl = "https:\/\/api\.esimx\.com\/mcp"$/m);
  assert.deepEqual(load(root, 'gemini-extension.json').mcpServers, load(root, 'configs/gemini-cli.json').mcpServers);
  assert.equal(load(root, 'gemini-extension.json').contextFileName, 'GEMINI.md');
});

test('marketplace sources and components remain native and plugin-contained', (t) => {
  const root = fixture(t);
  const marketplace = load(root, '.claude-plugin/marketplace.json');
  assert.deepEqual(marketplace.plugins, [{ name: 'esimx', source: './plugins/esimx' }]);
  assert.equal(marketplace.owner.name, load(root, 'plugins/esimx/.claude-plugin/plugin.json').author.name);
  assert.equal(marketplace.owner.name, 'eSIMX');
  assert.deepEqual(load(root, 'plugins/esimx/.mcp.json'), load(root, '.mcp.json'));
});

test('skill distributions include identical canonical content and local schema references', (t) => {
  const root = fixture(t);
  for (const destination of ['plugins/esimx/skills/esimx-travel', '.agents/skills/esimx-travel']) {
    for (const file of ['SKILL.md', 'references/tools.md', 'references/results.md', 'references/tools.json']) {
      assert.equal(readFileSync(join(root, destination, file), 'utf8'), readFileSync(join(root, 'skills/esimx-travel', file), 'utf8'));
    }
  }
  assert.ok(checkDocumentLinks(root) >= 10);
});

test('Registry manifest is remote-only, versioned, and does not claim namespace verification', (t) => {
  const root = fixture(t);
  const server = load(root, 'server.json');
  assert.equal(server.name, 'com.esimx/mcp');
  assert.equal(server.version, '1.0.0');
  assert.deepEqual(server.remotes, [{ type: 'streamable-http', url: 'https://api.esimx.com/mcp' }]);
  assert.ok(!('packages' in server));
  assert.ok(!('verified' in server), 'A manifest is not namespace verification');
});

test('URL-dependent identities appear only after explicit metadata inputs', (t) => {
  const root = fixture(t);
  update(root, (p) => { p.repository = 'https://github.com/synthetic-owner/synthetic-project'; p.maintainers = ['synthetic-owner']; });
  generate({ root });
  assert.equal(load(root, 'server.json').repository.url, 'https://github.com/synthetic-owner/synthetic-project');
  assert.equal(load(root, 'server.json').repository.source, 'github');
  assert.deepEqual(load(root, 'glama.json').maintainers, ['synthetic-owner']);
  assert.equal(load(root, 'plugins/esimx/.claude-plugin/plugin.json').author.name, 'eSIMX');
  update(root, (p) => { p.repository = null; p.maintainers = []; });
  assert.ok(generate({ root, check: true }).drift.includes('glama.json'));
  generate({ root });
  assert.ok(!existsSync(join(root, 'glama.json')));
});

test('repository metadata command changes no git remote and performs no network calls', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, 'scripts'));
  for (const file of ['generate.mjs', 'metadata.mjs']) cpSync(join(projectRoot, 'scripts', file), join(root, 'scripts', file));
  const result = spawnSync(process.execPath, [join(root, 'scripts/metadata.mjs'), '--repository', 'https://example.invalid/synthetic/project'], { encoding: 'utf8', cwd: root });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readProject(root).repository, 'https://example.invalid/synthetic/project');
  assert.ok(!existsSync(join(root, '.git')));
  assert.ok(!existsSync(join(root, 'glama.json')), 'Repository alone must not invent maintainers');
});

test('unsafe or nonpublic repository URL forms are rejected', () => {
  for (const url of ['file:///private/repository', 'git@example.invalid:team/repo', 'http://example.invalid/team/repo', 'https://name:secret@example.invalid/team/repo', 'https://example.invalid/', 'https://example.invalid/team/repo?secret=1']) {
    assert.throws(() => validateRepository(url), undefined, url);
  }
});

test('schema corruption fails before generated drift can hide it', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'schemas/tools.json'), '[]\n');
  assert.throws(() => checkContracts(root), /SHA256 mismatch/);
});

test('metadata changes propagate through native versions and endpoint fields', (t) => {
  const root = fixture(t);
  update(root, (p) => { p.version = '1.1.0'; p.endpoint = 'https://example.invalid/synthetic-mcp'; });
  generate({ root });
  assert.equal(load(root, 'gemini-extension.json').version, '1.1.0');
  assert.equal(load(root, 'server.json').version, '1.1.0');
  assert.equal(load(root, 'plugins/esimx/.claude-plugin/plugin.json').version, '1.1.0');
  assert.equal(load(root, 'configs/cursor.json').mcpServers.esimx.url, 'https://example.invalid/synthetic-mcp');
});

test('document checks reject broken links, missing anchors, and translations', (t) => {
  const root = fixture(t);
  const file = join(root, 'synthetic.md');
  writeFileSync(file, '[broken](missing.md)\n');
  assert.throws(() => checkDocumentLinks(root), /missing link target/);
  writeFileSync(file, '# Synthetic\n\n[broken](#missing)\n');
  assert.throws(() => checkDocumentLinks(root), /missing heading/);
  writeFileSync(file, String.fromCodePoint(0x4e2d, 0x6587));
  assert.throws(() => checkDocumentLinks(root), /English only/);
});

test('document checks permit valid local links, duplicate heading IDs, and code examples', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'synthetic.md'), '# Synthetic\n\n## Repeat\n\n## Repeat\n\n[valid](#repeat-1)\n\n```md\n[example](not-a-real-file.md)\n```\n');
  assert.ok(checkDocumentLinks(root) > 0);
});

test('generated product configs include neither installation hooks nor approvals', (t) => {
  const root = fixture(t);
  const outputs = generatedFiles(root);
  for (const [path, content] of outputs) {
    if (!path.endsWith('.json')) continue;
    assert.doesNotMatch(content, /"(?:headers|env|command|args|hooks|trust|autoApprove|alwaysAllow)"\s*:/, path);
  }
});
