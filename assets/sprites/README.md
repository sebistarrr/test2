# Remplacer les sprites par les tiens

Le jeu fonctionne **sans aucun fichier binaire** : les sprites sont décrits en
pixel-art texte dans [`src/data/pixelmaps.js`](../../src/data/pixelmaps.js) et
compilés en canvas au démarrage.

Tu peux remplacer n'importe lequel par un PNG, sans toucher au code du moteur.

## 1. Préparer le PNG

| Clé                | Rôle                                    | Taille conseillée | Orientation               |
| ------------------ | --------------------------------------- | ----------------- | ------------------------- |
| `darkBlade`        | lame de l'Ombre (et ses projectiles)    | 80 × 36 px        | **pointe vers la droite** |
| `iceAxeHead`       | tête de hache de la Glace               | 48 × 68 px        | tranchant vers la droite  |
| `fireBlade`        | lame de flamme du Feu                   | 72 × 40 px        | pointe vers la droite     |
| `lightHammerHead`  | tête de marteau de la Lumière           | 56 × 68 px        | —                         |
| `windShuriken`     | shuriken du Vent                        | 52 × 52 px        | —                         |
| `boltBlade`        | lame-éclair de la Foudre                | 64 × 48 px        | pointe vers la droite     |
| `waterTrident`     | tête de trident de l'Eau                | 48 × 60 px        | dents vers la droite      |
| `iceShard`         | éclat de givre (projectile)             | 32 × 44 px        | pointe vers la droite     |
| `ember`            | braise du Feu (projectile)              | 28 × 28 px        | —                         |
| `windCrescent`     | lame d'air (projectile)                 | 36 × 42 px        | pointe vers la droite     |
| `waterDrop`        | goutte (projectile)                     | 24 × 32 px        | pointe vers la droite     |
| `teslaNode`        | borne statique de la Foudre             | 36 × 44 px        | —                         |
| `plantBulb`        | bulbe semé par la Plante                | 32 × 40 px        | —                         |
| `flower`           | fleur (projectile)                      | 28 × 28 px        | —                         |
| `orbDark`          | icône du titre (Ombre)                  | 64 × 64 px        | —                         |
| `snowflake`        | icône du titre (Glace)                  | 64 × 64 px        | —                         |
| `iconFlame`        | icône du titre (Feu)                    | 64 × 64 px        | —                         |
| `iconShield`       | icône du titre (Lumière)                | 64 × 64 px        | —                         |
| `iconTornado`      | icône du titre (Vent)                   | 64 × 64 px        | —                         |
| `iconBolt`         | icône du titre (Foudre)                 | 64 × 64 px        | —                         |
| `iconDroplet`      | icône du titre (Eau)                    | 64 × 64 px        | —                         |
| `iconLeaf`         | icône du titre (Plante)                 | 64 × 64 px        | —                         |

Règles :

- fond **transparent** (PNG-24 avec alpha) ;
- pas d'anticrénelage si tu veux garder le rendu pixel-art (le canvas est en
  `imageSmoothingEnabled = false`) ;
- le sprite est dessiné **pointe vers la droite**, angle 0 = est. Le moteur
  applique lui-même la rotation de l'arme ;
- le ratio largeur/hauteur **doit être celui de la carte pixel-art qu'il
  remplace**. Le moteur impose la hauteur (`head.scale × hauteur du pixel-map`)
  et calcule la largeur à partir du ratio **du PNG** : un ratio différent change
  donc la largeur dessinée *sans toucher à la hitbox*, la somme
  `handle.length + largeur` cesse de valoir `reach`, et le dessin ment sur
  l'endroit où il coupe. C'est arrivé à la lame du Bretteur, dont le PNG est à
  3,47 quand sa carte est à 3,89 — écart connu, pas corrigé.

## 2. Déposer le fichier ici

```
assets/sprites/
├── manifest.json
├── ma-lame.png
└── ma-hache.png
```

## 3. Déclarer l'override dans `manifest.json`

```json
{
  "sprites": {
    "darkBlade": "ma-lame.png",
    "iceAxeHead": "ma-hache.png"
  }
}
```

Rechargement de la page = sprites remplacés. Si un fichier manque, le moteur
affiche un avertissement en console et **retombe sur le pixel-art intégré** :
le jeu démarre toujours.

## 4. Ajuster les proportions

Les dimensions à l'écran ne sont pas dans le PNG mais dans la fiche de
l'élément ([`src/data/elements.js`](../../src/data/elements.js)) :

```js
weapon: {
  reach: 132,                                  // centre du corps → pointe (px)
  handle: { length: 90, width: 11, ... },      // manche dessiné en vectoriel
  head:   { sprite: 'iceAxeHead', scale: 3.5 },// hauteur = 17 px × 3.5 = 59 px
}
```

`reach` doit rester cohérent : `handle.length + largeur de la tête ≈ reach`.
La zone qui blesse est décrite juste en dessous (`hitbox.from/to/radius`) et
peut être visualisée avec `?debug=1`.

## 5. Une arme sans sprite : la liane

La Plante fait exception : sa liane est **courbe**, donc dessinée en tracé par
`src/game/abilities/plant.js` (`drawWeapon`) plutôt qu'en sprite droit. Ses
dimensions se règlent dans `weapon.vine` de sa fiche (longueur, ouverture de
l'arc, épaisseur, teintes). Tout module de pouvoirs peut faire de même en
exposant un `drawWeapon(ctx, f)`.

## 6. Corps des combattants

Les boules ne sont pas des sprites : ce sont des cercles vectoriels (couleur,
contour, rayon) définis dans `look` de chaque fiche. Pour un corps en sprite,
remplace l'appel `ctx.arc(...)` de `Fighter.draw()` par un `drawSpriteCentered`
— tout le reste (PV, halo, flash) continue de fonctionner.
