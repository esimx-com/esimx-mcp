import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generate, json, projectRoot, readProject, validateRepository } from './generate.mjs';

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--repository') {
  console.error('Usage: npm run metadata -- --repository https://HOST/OWNER/REPOSITORY');
  process.exitCode = 1;
} else {
  validateRepository(args[1]);
  const project = readProject();
  project.repository = args[1];
  writeFileSync(join(projectRoot, 'project.json'), json(project));
  const result = generate();
  console.log(`Saved repository metadata; ${result.drift.length} generated files updated. No git remote or publication changed.`);
}
