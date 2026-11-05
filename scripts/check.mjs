import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { generate, projectRoot, readProject, verifyProvenance } from './generate.mjs';

const readJSON = (root, path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

export function checkContracts(root = projectRoot) {
  const project = readProject(root);
  const tools = JSON.parse(verifyProvenance(root).toString('utf8'));
  const drift = generate({ root, check: true }).drift;
  assert.deepEqual(drift, [], `Generated drift; run npm run generate: ${drift.join(', ')}`);
  assert.deepEqual(readJSON(root, 'configs/claude-code.json').mcpServers.esimx, { type: 'http', url: project.endpoint });
  assert.deepEqual(readJSON(root, 'configs/cursor.json').mcpServers.esimx, { url: project.endpoint });
  assert.deepEqual(readJSON(root, 'configs/gemini-cli.json').mcpServers.esimx, { httpUrl: project.endpoint });
  assert.deepEqual(readJSON(root, 'configs/vscode.json').servers.esimx, { type: 'http', url: project.endpoint });
  const marketplace = readJSON(root, '.claude-plugin/marketplace.json');
  assert.ok(marketplace.owner.name);
  assert.deepEqual(marketplace.plugins, [{ name: 'esimx', source: './plugins/esimx' }]);
  const server = readJSON(root, 'server.json');
  const registry = readJSON(root, 'schemas/provenance.json').registry;
  const registryBytes = readFileSync(join(root, registry.snapshot));
  assert.equal(createHash('sha256').update(registryBytes).digest('hex'), registry.sha256, 'Registry schema SHA256 mismatch');
  const result = new AjvJsonSchemaValidator().getValidator(JSON.parse(registryBytes.toString('utf8')))(server);
  assert.ok(result.valid, `Registry manifest violates the pinned official schema: ${result.errorMessage}`);
  assert.deepEqual(server.remotes, [{ type: 'streamable-http', url: project.endpoint }]);
  assert.ok(!('packages' in server), 'Remote-only metadata must not invent server packages');
  assert.equal(server.version, project.version);
  if (existsSync(join(root, 'package.json'))) {
    const pkg = readJSON(root, 'package.json');
    assert.equal(pkg.name, project.name, 'package.json name must match project.json');
    assert.equal(pkg.version, project.version, 'package.json version must match project.json');
    assert.equal(pkg.license, project.license, 'package.json license must match project.json');
  }
  return tools.length;
}

const ignored = new Set(['.git', '.local', '.venv', 'node_modules', 'dist', '__pycache__', '.pytest_cache', '.mypy_cache']);
function documentsUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name) || entry.isSymbolicLink()) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? documentsUnder(path) : extname(path) === '.md' ? [path] : [];
  });
}

function headingIds(text) {
  const ids = new Set();
  const counts = new Map();
  for (const line of text.replace(/^```[^\n]*\n[\s\S]*?^```/gm, '').split('\n')) {
    const heading = line.match(/^ {0,3}#{1,6}\s+(.+?)(?:\s+#+)?$/);
    if (!heading) continue;
    const slug = heading[1].toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}_\-\s]/gu, '').replace(/ /g, '-');
    const count = counts.get(slug) ?? 0;
    counts.set(slug, count + 1);
    ids.add(count ? `${slug}-${count}` : slug);
  }
  for (const match of text.matchAll(/\bid=["']([^"']+)["']/g)) ids.add(match[1]);
  return ids;
}

const escapes = (path) => path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path);

export function checkDocumentLinks(root = projectRoot) {
  const errors = [];
  const documents = documentsUnder(root);
  const pkg = existsSync(join(root, 'package.json')) ? readJSON(root, 'package.json') : null;
  for (const file of documents) {
    const source = readFileSync(file, 'utf8');
    const label = relative(root, file);
    if (/[㐀-鿿぀-ヿ가-힯]/u.test(source)) errors.push(`${label}: documentation must be English only`);
    if (/\.(?:zh(?:-cn|-tw)?|ja|ko|fr|de|es|pt|ru)\.md$/i.test(file)) errors.push(`${label}: translated document is not allowed`);
    if (pkg) {
      for (const match of source.matchAll(/\bnpm run ([a-z][a-z\d:_-]*)/g)) {
        if (!Object.hasOwn(pkg.scripts ?? {}, match[1])) errors.push(`${label}: unknown npm script ${match[1]}`);
      }
    }
    const text = source.replace(/^```[^\n]*\n[\s\S]*?^```/gm, '');
    const links = [
      ...Array.from(text.matchAll(/!?\[[^\]\n]*\]\(<?([^\s)>]+)>?(?:\s+["'][^\n]*["'])?\)/g), (match) => match[1]),
      ...Array.from(text.matchAll(/^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?/gm), (match) => match[1]),
    ];
    for (const href of links) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) {
        if (/^file:/i.test(href)) errors.push(`${label}: private file link ${href}`);
        continue;
      }
      let decoded;
      try { decoded = decodeURIComponent(href); } catch { errors.push(`${label}: invalid URL encoding ${href}`); continue; }
      const [path, anchor] = decoded.split('#', 2);
      const target = path ? resolve(dirname(file), path.split('?')[0]) : file;
      if (isAbsolute(path) || escapes(relative(root, target))) { errors.push(`${label}: link escapes repository: ${href}`); continue; }
      if (!existsSync(target)) { errors.push(`${label}: missing link target ${href}`); continue; }
      if (escapes(relative(realpathSync(root), realpathSync(target)))) { errors.push(`${label}: link resolves outside repository: ${href}`); continue; }
      if (anchor && extname(target) === '.md' && !headingIds(readFileSync(target, 'utf8')).has(anchor)) errors.push(`${label}: missing heading ${href}`);
    }
  }
  assert.deepEqual(errors, [], `Document checks failed:\n${errors.join('\n')}`);
  return documents.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(resolve(process.argv[1]))).href) {
  try {
    const args = process.argv.slice(2);
    assert.equal(args.length, 0, 'Usage: node scripts/check.mjs');
    const tools = checkContracts();
    const documents = checkDocumentLinks();
    console.log(`Offline checks passed: ${tools} tool schemas, native configs, generated drift, ${documents} English documents and local links.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
