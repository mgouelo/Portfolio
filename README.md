# Portfolio – Matthieu Gouélo

Portfolio construit avec [Astro](https://astro.build), design identique à la version HTML/CSS/JS native.

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:4321/Portfolio/
npm run build    # génère dist/
```

Node 22.23.4 ou plus récent est requis.

## Organisation

- `src/pages/index.astro` : la page d'accueil
- `src/components/` : header, footer, carte projet, carte compétence, modale
- `src/data/` : contenu modifiable sans toucher au code (`projets.json`, `competences.json`, `outils.json`)
- `src/styles/global.css` : la feuille de style d'origine
- `src/scripts/main.js` : le script d'origine (menu mobile, thème, modale)
- `public/` : images (`assets/`) et pages de compétences Notion (`skills/`)

Ajouter un projet : ajouter une entrée dans `src/data/projets.json` et son image dans `public/assets/`.

## Déploiement

`.github/workflows/deploy.yml` publie sur GitHub Pages à chaque push sur `main`.
Avant la fusion : Settings > Pages > Source = « GitHub Actions ».
