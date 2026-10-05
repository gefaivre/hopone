import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    category: z.enum(['Markets', 'Brands', 'Races', 'Sponsorship', 'Startups', 'Retail']),
    date: z.coerce.date(),
    // Lower = more prominent on the homepage.
    priority: z.number().default(100),
    tone: z.enum(['lime', 'orange', 'blue', 'ink']).default('lime'),
    // Data for the generated cover image (scripts/generate-covers.mjs).
    cover: z
      .object({
        stat: z.string(),
        label: z.string(),
        chart: z.object({
          type: z.enum(['bars', 'diverging', 'timeline', 'clock', 'line', 'columns', 'donut', 'stacked', 'versus']),
          title: z.string(),
          items: z.array(z.record(z.string(), z.unknown())).min(1),
        }),
      })
      .optional(),
    sources: z
      .array(z.object({ name: z.string(), title: z.string(), url: z.string().url() }))
      .min(1),
  }),
});

export const collections = { articles };
