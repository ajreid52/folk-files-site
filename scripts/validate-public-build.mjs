import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

const dist = new URL('../dist/', import.meta.url);
const files = [];
const problems = [];

async function walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) await walk(path);
    else files.push(path);
  }
}

await walk(dist.pathname);

for (const file of files) {
  const relativePath = relative(dist.pathname, file).split(sep).join('/');
  if (['.md', '.mdx', '.map'].includes(extname(file))) {
    problems.push(`${relativePath}: source content or source map was emitted.`);
  }

  if (extname(file) === '.html') {
    const html = await readFile(file, 'utf8');
    if (/\bpublication:\s*draft\b/i.test(html)) {
      problems.push(`${relativePath}: draft metadata appears in public HTML.`);
    }
    if (!html.includes('© AJ Reid')) {
      problems.push(`${relativePath}: AJ Reid copyright notice is missing.`);
    }
  }
}

const expected = ['index.html', 'sitemap-index.xml'];
for (const path of expected) {
  if (!files.some((file) => relative(dist.pathname, file).split(sep).join('/') === path)) {
    problems.push(`${path}: expected public build file is missing.`);
  }
}

if (problems.length > 0) {
  console.error(`Public-build validation failed with ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`Public-build validation passed (${files.length} emitted files).`);
