import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import YAML from 'yaml';

const defaultRoot = fileURLToPath(new URL('../src/content/', import.meta.url));
const rootPath = resolve(process.env.FOLK_FILES_CONTENT_ROOT ?? defaultRoot);
const problems = [];
const entries = [];

async function walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) {
      await walk(path);
      continue;
    }

    if (!['.md', '.mdx', '.yaml', '.yml', '.json'].includes(extname(path))) {
      continue;
    }

    const source = await readFile(path, 'utf8');
    const data =
      extname(path) === '.yaml' || extname(path) === '.yml'
        ? YAML.parse(source)
        : extname(path) === '.json'
          ? JSON.parse(source)
          : matter(source).data;

    entries.push({
      path,
      relativePath: relative(rootPath, path).split(sep).join('/'),
      data,
    });
  }
}

await walk(rootPath);

const contentEntries = entries.filter(
  ({ relativePath }) =>
    !relativePath.startsWith('settings/') && relativePath !== 'README.md',
);
const storyEntries = entries.filter(({ relativePath }) =>
  /^stories\/[^/]+\/index\.mdx$/.test(relativePath),
);
const sceneEntries = entries.filter(({ relativePath }) =>
  /^stories\/[^/]+\/scenes\/[^/]+\.mdx?$/.test(relativePath),
);
const actEntries = entries.filter(({ relativePath }) => relativePath.startsWith('acts/'));

const storyById = new Map(
  storyEntries.map((entry) => [entry.relativePath.split('/')[1], entry]),
);
const actById = new Map(
  actEntries.map((entry) => [entry.relativePath.split('/').at(-1).replace(/\.mdx?$/, ''), entry]),
);

for (const entry of contentEntries) {
  if (entry.data.publication === 'draft') {
    problems.push(`${entry.relativePath}: draft content belongs in the private editorial repository.`);
  }

  for (const key of ['summary', 'shortSummary']) {
    const value = entry.data[key];
    if (
      typeof value === 'string' &&
      /(?:!\[[^\]]*\]\(|\[[^\]]+\]\(|<\/?[A-Za-z]|[*_]{2}|`)/.test(value)
    ) {
      problems.push(`${entry.relativePath}: ${key} must be plain text.`);
    }
  }
}

for (const story of storyEntries) {
  if (/^(romin|harvest)$/i.test(story.data.title?.trim())) {
    problems.push(
      `${story.relativePath}: "${story.data.title}" is a private working label, not an approved public title.`,
    );
  }

  if (story.data.featuredActSection) {
    const actId =
      typeof story.data.featuredActSection === 'string'
        ? story.data.featuredActSection
        : story.data.featuredActSection.id;
    if (!actById.has(actId)) {
      problems.push(`${story.relativePath}: featured Act section "${actId}" does not exist.`);
    }
  }
}

const sceneOrders = new Map();
for (const scene of sceneEntries) {
  const folderStoryId = scene.relativePath.split('/')[1];
  const referencedStoryId =
    typeof scene.data.story === 'string' ? scene.data.story : scene.data.story?.id;

  if (!storyById.has(folderStoryId)) {
    problems.push(`${scene.relativePath}: parent story "${folderStoryId}" does not exist.`);
  }

  if (referencedStoryId && referencedStoryId !== folderStoryId) {
    problems.push(
      `${scene.relativePath}: story reference "${referencedStoryId}" does not match its folder.`,
    );
  }

  const orderKey = `${folderStoryId}:${scene.data.order}`;
  if (sceneOrders.has(orderKey)) {
    problems.push(
      `${scene.relativePath}: scene order ${scene.data.order} duplicates ${sceneOrders.get(orderKey)}.`,
    );
  } else {
    sceneOrders.set(orderKey, scene.relativePath);
  }
}

const home = entries.find(({ relativePath }) => relativePath === 'settings/home.yaml');
if (!home) {
  problems.push('settings/home.yaml: homepage settings are required.');
} else if (home.data.featuredStory) {
  const featured = storyById.get(home.data.featuredStory);
  if (!featured) {
    problems.push(`settings/home.yaml: featured story "${home.data.featuredStory}" does not exist.`);
  } else if (!featured.data.featuredActSection) {
    problems.push(
      `settings/home.yaml: featured story "${home.data.featuredStory}" needs featuredActSection.`,
    );
  }
}

if (problems.length > 0) {
  console.error(`Content validation failed with ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`Content validation passed (${contentEntries.length} public content files).`);
