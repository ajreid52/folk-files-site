import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const validator = fileURLToPath(new URL('./validate-content.mjs', import.meta.url));
const fixtureRoot = fileURLToPath(
  new URL('../tests/fixtures/invalid-content/', import.meta.url),
);

const result = spawnSync(process.execPath, [validator], {
  encoding: 'utf8',
  env: {
    ...process.env,
    FOLK_FILES_CONTENT_ROOT: fixtureRoot,
  },
});

const output = `${result.stdout}\n${result.stderr}`;
const expected = [
  'draft content belongs in the private editorial repository',
  '"Romin" is a private working label',
  'summary must be plain text',
  'scene order 1 duplicates',
];

if (result.status === 0) {
  console.error('Validation fixture unexpectedly passed.');
  process.exit(1);
}

for (const message of expected) {
  if (!output.includes(message)) {
    console.error(`Validation fixture did not report: ${message}`);
    console.error(output);
    process.exit(1);
  }
}

console.log('Content validator rejected the deliberate publication errors.');
