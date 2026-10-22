import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Un fichier Markdown par projet dans src/content/projets.
// Pages CMS écrit ces fichiers pour toi depuis son interface.
const projets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projets' }),
  schema: z.object({
    title: z.string(),
    annee: z.number().int(),
    resume: z.string(),
    image: z.string(),
    imageAlt: z.string().default(''),
    technologies: z.array(z.string()).default([]),
    lien: z.string().optional(),
    ordre: z.number().default(99),
    brouillon: z.boolean().default(false),
  }),
});

export const collections = { projets };
