# Portfolio – Matthieu Gouélo

Portfolio construit avec [Astro](https://astro.build), publié sur GitHub Pages.

## Développer en local

```bash
npm install
npm run dev      # http://localhost:4321/Portfolio/
npm run build    # génère le site dans dist/
```

Astro 7 demande Node.js 22.23.4 ou plus récent.

## Ajouter un projet sans toucher au code

Le contenu est géré avec [Pages CMS](https://pagescms.org) :

1. Aller sur https://app.pagescms.org et se connecter avec GitHub.
2. Ouvrir le dépôt `mgouelo/Portfolio` et choisir la branche.
3. Dans « Projets », cliquer sur « Ajouter », remplir le formulaire et enregistrer.

Pages CMS crée un fichier Markdown dans `src/content/projets/` et le commite sur le dépôt.
Seules les personnes ayant un accès en écriture au dépôt peuvent modifier le contenu.

## Organisation

- `src/content/projets/` : un fichier `.md` par projet
- `src/data/` : citations, compétences, outils
- `src/components/`, `src/layouts/`, `src/pages/` : le site
- `public/` : images, icônes et pages de compétences
- `.pages.yml` : configuration de l'interface Pages CMS
