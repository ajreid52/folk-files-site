import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const publication = z.enum(['published', 'unlisted', 'archived']);
const storyStatus = z.enum([
  'announced',
  'preview',
  'serializing',
  'complete',
  'hiatus',
  'retired',
]);
const contentType = z.enum(['short-story', 'novella', 'vignette', 'serial']);
const releaseRole = z.enum(['standard', 'installment', 'preview']);
const dossierStyle = z.enum([
  'federal',
  'paranormal',
  'police',
  'medical',
  'corporate',
  'personal',
]);
const worldEntryType = z.enum([
  'place',
  'folk',
  'organization',
  'law',
  'technology',
  'culture',
  'event',
  'language',
  'term',
]);
const spoilerLevel = z.enum(['none', 'mild', 'major']);
const actStatus = z.enum(['active', 'amended', 'repealed', 'disputed']);
const collectionType = z.enum(['thematic', 'role', 'cycle', 'editorial']);
const sortMode = z.enum(['manual', 'publication', 'chronology']);

const textList = z.array(z.string()).default([]);
const optionalDate = z.coerce.date().optional();
const urlSlug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase kebab case.');

const stories = defineCollection({
  loader: glob({
    base: './src/content/stories',
    pattern: '*/index.mdx',
    generateId: ({ entry }) => entry.replace(/\/index\.mdx$/, ''),
  }),
  schema: z.object({
    title: z.string().min(1),
    urlSlug,
    summary: z.string().min(1),
    shortSummary: z.string().min(1).optional(),
    author: z.literal('aj-reid').default('aj-reid'),
    publication,
    storyStatus,
    contentType,
    language: z.string().default('en'),
    subtitle: z.string().optional(),
    eyebrow: z.string().optional(),
    firstPublishedAt: optionalDate,
    updatedAt: optionalDate,
    expectedSceneCount: z.number().int().positive().optional(),
    plannedReleaseAt: optionalDate,
    releaseNote: z.string().optional(),
    contentWarnings: textList,
    characters: z.array(reference('characters')).default([]),
    locations: z.array(reference('world')).default([]),
    organizations: z.array(reference('world')).default([]),
    folk: z.array(reference('world')).default([]),
    actSections: z.array(reference('acts')).default([]),
    featuredActSection: reference('acts').optional(),
    themes: textList,
    cycle: z.string().optional(),
    collections: z.array(reference('collections')).default([]),
    chronologyOrder: z.number().optional(),
    displayChronology: z.boolean().default(false),
    dossierLabel: z.string().optional(),
    accent: z.string().optional(),
    socialImage: z.string().optional(),
    canonicalUrl: z.url().optional(),
  }),
});

const scenes = defineCollection({
  loader: glob({
    base: './src/content/stories',
    pattern: '*/scenes/*.{md,mdx}',
    generateId: ({ entry }) =>
      entry.replace(/\/scenes\//, '/').replace(/\.mdx?$/, ''),
  }),
  schema: z.object({
    story: reference('stories'),
    title: z.string().min(1),
    urlSlug,
    order: z.number().int().positive(),
    publication,
    chapter: z.union([z.number().int().positive(), z.string()]).optional(),
    chapterTitle: z.string().optional(),
    firstPublishedAt: optionalDate,
    updatedAt: optionalDate,
    summary: z.string().optional(),
    contentWarnings: textList,
    characters: z.array(reference('characters')).default([]),
    locations: z.array(reference('world')).default([]),
    actSection: reference('acts').optional(),
    excludeFromFeed: z.boolean().default(false),
    readerNote: z.string().optional(),
    releaseRole: releaseRole.default('standard'),
  }),
});

const characters = defineCollection({
  loader: glob({
    base: './src/content/characters',
    pattern: '*.{md,mdx}',
  }),
  schema: z.object({
    name: z.string().min(1),
    publication,
    dossierStyle,
    aliases: textList,
    pronouns: z.string().optional(),
    portrait: z.string().optional(),
    portraitAlt: z.string().optional(),
    classification: z.string().optional(),
    folkType: reference('world').optional(),
    occupation: z.string().optional(),
    affiliations: z.array(reference('world')).default([]),
    locations: z.array(reference('world')).default([]),
    introducedIn: reference('stories').optional(),
    statusLabel: z.string().optional(),
    clearance: z.string().optional(),
    spoilerFor: z.array(reference('stories')).default([]),
    relatedCharacters: z.array(reference('characters')).default([]),
    gallery: z.array(z.string()).default([]),
    accent: z.string().optional(),
  }),
});

const storyCollections = defineCollection({
  loader: glob({
    base: './src/content/collections',
    pattern: '*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string().min(1),
    publication,
    summary: z.string().min(1),
    collectionType: collectionType.optional(),
    sortMode: sortMode.default('publication'),
    storyOrder: z.array(reference('stories')).default([]),
    image: z.string().optional(),
    socialImage: z.string().optional(),
  }),
});

const world = defineCollection({
  loader: glob({
    base: './src/content/world',
    pattern: '*.{md,mdx}',
  }),
  schema: z.object({
    name: z.string().min(1),
    entryType: worldEntryType,
    publication,
    summary: z.string().min(1),
    aliases: textList,
    parent: reference('world').optional(),
    relatedEntries: z.array(reference('world')).default([]),
    introducedIn: reference('stories').optional(),
    spoilerFor: z.array(reference('stories')).default([]),
    spoilerLevel: spoilerLevel.default('none'),
    map: z.string().optional(),
    image: z.string().optional(),
    classificationLabel: z.string().optional(),
    sortName: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const acts = defineCollection({
  loader: glob({
    base: './src/content/acts',
    pattern: '*.{md,mdx}',
  }),
  schema: z.object({
    actTitle: z.string().min(1),
    actNumber: z.string().min(1),
    section: z.string().min(1),
    title: z.string().min(1),
    publication,
    shortTitle: z.string().optional(),
    effectiveDate: optionalDate,
    jurisdiction: reference('world').optional(),
    relatedStories: z.array(reference('stories')).default([]),
    contradictedBy: textList,
    annotation: z.string().optional(),
    status: actStatus.default('active'),
  }),
});

const dispatches = defineCollection({
  loader: glob({
    base: './src/content/dispatches',
    pattern: '*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string().min(1),
    urlSlug,
    publication,
    firstPublishedAt: z.coerce.date(),
    summary: z.string().min(1),
    author: z.literal('aj-reid').default('aj-reid'),
    relatedStories: z.array(reference('stories')).default([]),
    relatedCharacters: z.array(reference('characters')).default([]),
    tags: textList,
    featured: z.boolean().default(false),
    excludeFromFeed: z.boolean().default(false),
    externalUrl: z.url().optional(),
  }),
});

const settings = defineCollection({
  loader: glob({
    base: './src/content/settings',
    pattern: '*.{yaml,yml,json}',
  }),
  schema: z.object({
    featuredStory: z.string().nullable().default(null),
    featuredLabel: z.string().optional(),
    featuredScene: z.string().nullable().default(null),
    fallback: z.enum(['latest-published', 'latest-complete', 'none']).default('none'),
  }),
});

export const collections = {
  stories,
  scenes,
  characters,
  collections: storyCollections,
  world,
  acts,
  dispatches,
  settings,
};
