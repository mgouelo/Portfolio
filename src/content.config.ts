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

// Bibliothèque : livres, jeux, films… qui nourrissent la réflexion.
const lectures = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lectures' }),
  schema: z.object({
    titre: z.string(),
    auteur: z.string(),
    annee: z.number().int().optional(),
    type: z.enum(['Livre', 'Jeu vidéo', 'Film', 'Article']).default('Livre'),
    statut: z.enum(['Lu', 'En cours', 'À lire']).default('Lu'),
    resume: z.string(),
    citation: z.string().optional(),
    ordre: z.number().default(99),
  }),
});

// Essais : textes personnels, publiés même inachevés avec leur statut.
const essais = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/essais' }),
  schema: z.object({
    title: z.string(),
    resume: z.string(),
    statut: z.enum(['Brouillon', 'En cours', 'Terminé']).default('En cours'),
    // Mise en scène au scroll : chaque titre ## devient un chapitre, illustré par un tableau
    mise_en_scene: z.enum(['aucune', 'galerie']).default('aucune'),
    // Un tableau par chapitre, dans l'ordre. Sans image, une esquisse au trait est affichée.
    tableaux: z
      .array(
        z.object({
          image: z.string().optional(),
          titre: z.string().optional(),
          artiste: z.string().optional(),
          annee: z.string().optional(),
          alt: z.string().optional(),
        })
      )
      .default([]),
    date: z.coerce.date(),
    brouillon: z.boolean().default(false),
  }),
});

export const collections = { projets, lectures, essais };
