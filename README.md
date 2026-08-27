# Outlaw vs Bladesman

Simulation d'auto-battler 2D : deux billes s'affrontent dans une arène
carrée. Le pistolero vise et tire, le bretteur fait tourner sa lame de plus
en plus vite. Chacun charge un ultime — **HIGH NOON** et **BLADE RUSH**.

Reproduction d'une vidéo de référence (576 × 1024, 30 fps, 38,6 s), relevée
image par image : géométrie, palette, typographie, durées et formules sont
mesurées et documentées dans [`CLAUDE.md`](CLAUDE.md).

## Stack

| Rôle | Outil |
| --- | --- |
| Structure et cycle de vie | React 18 + TypeScript strict |
| Physique | Matter.js — hitboxes, collisions, rebonds, forces |
| Rendu et VFX | API Canvas 2D native, dans une boucle `requestAnimationFrame` |
| Build | Vite |

Matter ne dessine rien : `Matter.Render` n'est jamais instancié. Le canvas
lit les corps physiques et peint par-dessus.

## Lancer

```bash
npm install
npm run dev       # serveur de développement
npm run build     # tsc -b puis vite build -> dist/
npm run check     # typage seul
```

`?seed=1234` fixe les tirages aléatoires du duel.

## Carte des fichiers

| Besoin | Fichier |
| --- | --- |
| Constantes du relevé | `src/constants.ts` |
| Types des entités | `src/types.ts` |
| Pixelmaps des armes | `src/sprites.ts` |
| Monde Matter, unités | `src/physics.ts` |
| Logique du duel | `src/duel.ts` |
| Tracé Canvas | `src/render.ts` |
| Montage et boucle rAF | `src/App.tsx` |

## Déploiement

Chaque push sur `main` construit le projet et publie `dist/` sur GitHub
Pages via `.github/workflows/deploy.yml`. Activer Pages en mode
« GitHub Actions » dans les réglages du dépôt.
