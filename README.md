# Outlaw vs Bladesman

Simulation d'auto-battler 2D : deux billes s'affrontent dans une arène
carrée. Le pistolero vise et tire, le bretteur fait tourner sa lame de plus
en plus vite. Chacun charge un ultime — **HIGH NOON** et **BLADE RUSH**.

Reproduction d'une vidéo de référence (576 × 1024, 30 fps, 38,6 s), relevée
image par image : géométrie, palette, typographie, durées et formules sont
mesurées et documentées dans [`CLAUDE.md`](CLAUDE.md).

## Lancer en local

```bash
python3 -m http.server 8085
# puis http://localhost:8085/
```

Aucun build, aucune dépendance à installer : Phaser 3 est chargé depuis un
CDN, le reste tient dans trois fichiers statiques.

| Fichier | Rôle |
| --- | --- |
| `index.html` | page et chargement de Phaser |
| `style.css` | centrage du canvas |
| `script.js` | tout le jeu : constantes relevées, sprites, boucle |
| `CLAUDE.md` | le relevé vidéo complet et le guide de maintenance |

`?seed=1234` fixe les tirages aléatoires du duel.

## Déploiement

Chaque push sur `main` publie la racine du dépôt sur GitHub Pages via
`.github/workflows/deploy.yml`. Activer Pages en mode « GitHub Actions »
dans les réglages du dépôt.
