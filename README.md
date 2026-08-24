# Elemental Duel — sept éléments, un duel

Clone haute fidélité des duels d'éléments de la chaîne de référence
(*Elemental Armory League*), en **HTML + CSS + JavaScript** avec un rendu
**Canvas 2D**. Aucune dépendance, aucun build : le dépôt se publie tel quel sur
GitHub Pages.

**Huit éléments jouables**, chacun relevé sur sa propre vidéo :

| Élément | Arme | Signature | Ultime |
| --- | --- | --- | --- |
| **Ombre** | Lame du Néant | pas d'ombre + volée de traits | Lien d'essence (dôme débordant + drain) |
| **Glace** | Hache de givre | piles de dégâts/ralentissement | Blizzard (champ + neige) |
| **Feu** | Lame ardente (garde à gemme, flamme effilée) | brûlure qui **colore et cercle** sa victime | Rage infernale (nova + ailes) |
| **Eau** | Trident des marées | tourbillons — **spirales en pixels** qui grandissent | Maelström (la même spirale, géante) |
| **Lumière** | Marteau d’aube | encaisse pour devenir puissante (liseré doré qui convertit) | Piège radiant (trait doré, halo sur **elle**) |
| **Foudre** | Lame fulgurante | **bobines** statiques + arcs en chaîne, halo bleu permanent | Surcharge (toile cyan) |
| **Vent** | Shuriken de bourrasque (losange évidé, sans manche) | le plus rapide, rafales tournoyantes autour de lui | Salve de tempête |
| **Plante** | Liane fouettante (crochet en escalier de pixels) | bulbes qui blessent l'un et **soignent** l'autre | Tempête de fleurs (nuée de cubes roses) |

![Lumière contre Feu](docs/capture-duel.png)

<sup>Lumière (marteau, bouclier, piège radiant) contre Feu (brûlure, rage infernale). Voir aussi [les zones](docs/capture-zones.png), [la Plante](docs/capture-plante.png), [la Lumière qui encaisse](docs/capture-lumiere.png), [la rafale du Vent](docs/capture-vent.png), [le dôme de l'Ombre](docs/capture-ombre.png), [la brûlure du Feu](docs/capture-feu.png), [l'écran de sélection](docs/capture-selection.png) et [l'écran de fin avec l'export Short](docs/capture-fin.png).</sup>

---

## Démarrer

```bash
# n'importe quel serveur statique (les modules ES nécessitent http://, pas file://)
python3 -m http.server 8080
# puis http://localhost:8080
```

### Publier sur GitHub Pages

Le dépôt est configuré en *Settings → Pages → Source = GitHub Actions* : chaque
push sur `main` déclenche `.github/workflows/pages.yml`, qui publie la racine
telle quelle (site en ligne : <https://sebistarrr.github.io/test/>). Le workflow
se lance aussi à la main depuis l'onglet *Actions*.

Pour un déploiement « depuis une branche » plutôt que par Actions, choisis la
branche et le dossier `/ (root)` : le fichier `.nojekyll` (déjà présent)
empêche Jekyll d'ignorer les dossiers.

### Paramètres d'URL

| Paramètre    | Effet                                                             |
| ------------ | ----------------------------------------------------------------- |
| `?a=&b=`     | lance directement un duel sans écran de sélection — `shadow`, `ice`, `fire`, `water`, `light`, `lightning`, `wind`, `plant` |
| `?seed=1234` | rejoue **exactement** le même duel (déterminisme complet)          |
| `?lang=fr`   | HUD en français (par défaut : libellés anglais de la vidéo)        |
| `?debug=1`   | hitboxes, vitesses, charge d'ultime, seed                          |
| `?rec=0`     | n'enregistre pas le duel : pas d'export possible, mais pas un cycle dépensé pour lui |

Exemple : `index.html?a=shadow&b=ice&seed=6&debug=1`

### À la fin d'un duel

| Action | Effet |
| --- | --- |
| **Revanche** | même affiche, **nouveau** tirage |
| **Revoir ce duel** | même affiche **et** même seed : la simulation étant déterministe, le duel se rejoue coup pour coup — vérifié automatiquement (mêmes touches, mêmes dégâts, même durée à la milliseconde) |
| **Exporter en Short** | télécharge la vidéo du duel qu'on vient de regarder, en **vertical 1080 × 1920**, prête à publier en YouTube Short |

La seed du duel est affichée sous le vainqueur : elle suffit à le refaire jouer
plus tard avec `?seed=`.

Chaque élément a sa **signature à l'écran** (`look.flair`) : ruban de couleur
derrière la pointe de l'arme, nappe de sol à ses teintes, frémissement collé au
corps, gerbe d'impact et éclat d'incantation. S'y ajoutent les **nombres de
dégâts** qui s'envolent à chaque touche, les **ondes qui courent le long des
murs** à chaque rebond, le **sillage** derrière une boule projetée, la
**convergence de matière** dès 85 % de jauge d'ultime et le **cerclage rouge
pulsé** sous 25 PV.

Tout cela suit une règle de composition : **rien ne se pose entre le spectateur
et les combattants**. Ce qui remplit le cadre est au fond, sur les bords, ou
derrière la boule. Tout vit dans `src/render/flair.js`, avec son propre aléa :
la mise en scène ne peut pas déplacer une virgule de l'équilibrage.

Le duel se termine par **une seconde de parade** : le perdant quitte l'arène, le
vainqueur glisse au centre, grandit, son arme s'emballe et il pousse des anneaux
à sa couleur. C'est aussi la dernière image de la vidéo exportée.

---

## Architecture

```
index.html                 page unique : canvas + écrans DOM
styles/style.css           mise à l'échelle de la scène + écrans de sélection/fin
assets/
├── fonts/                 Archivo Black + Oswald auto-hébergées (OFL)
└── sprites/               overrides PNG facultatifs + manifeste
src/
├── main.js                bootstrap : ressources, écrans, boucle
├── core/
│   ├── loop.js            boucle à pas fixe 120 Hz + rendu rAF
│   ├── math.js            vecteurs, angles, distance segment/point
│   ├── rng.js             aléa déterministe (mulberry32) piloté par seed
│   └── fonts.js           attente des webfonts avant la 1re frame
├── data/                  ← LES DONNÉES, séparées du moteur
│   ├── elements.js        **fiches d'éléments** (gelées) : apparence, vitesse,
│   │                      arme, pouvoir, ultime, projectiles, HUD
│   ├── tuning.js          géométrie de scène mesurée sur la vidéo
│   ├── pixelmaps.js       sprites pixel-art en texte
│   └── freeze.js          deepFreeze + garde-fou d'immutabilité
├── render/
│   ├── canvas.js          repère logique 720x1280, DPR, pixel-perfect
│   ├── scene.js           décor statique (fond, titre, arène) mis en cache
│   ├── sprites.js         banque de sprites + overrides PNG
│   ├── pixelart.js        compilation pixel-map → canvas
│   ├── hud.js             jauges d'ultime + ligne de stat
│   ├── recorder.js        film du duel → vidéo verticale 1080x1920 (Shorts)
│   ├── effects.js         particules de jeu (étincelles, neige, fantômes)
│   ├── flair.js           mise en scène : rubans, nappes, ondes de mur, nombres
│   └── text.js            texte ajusté pour ne jamais déborder du HUD
├── game/
│   ├── match.js           machine à états du duel + dégâts + rendu global
│   ├── fighter.js         entité combattant (état runtime + dessin)
│   ├── physics.js         collisions corps/corps et arme/corps
│   ├── projectiles.js     projectiles génériques pilotés par la fiche
│   └── abilities/
│       ├── index.js       registre
│       ├── zone.js        helper des zones (tornade, tourbillon, maelström)
│       ├── shadow.js      Pas d'ombre + Lien d'essence
│       ├── ice.js         Éclats de givre + Blizzard
│       ├── fire.js        Gerbe de braises + Rage infernale
│       ├── light.js       Égide (bouclier/riposte) + Piège radiant
│       ├── wind.js        Tornade + Salve de tempête
│       ├── lightning.js   Bornes statiques + Surcharge
│       ├── water.js       Tourbillon + Maelström
│       └── plant.js       Semis (dégâts/soin) + Tempête de fleurs
└── ui/
    ├── select.js          écran de sélection (lit les fiches)
    └── result.js          écran de fin
tools/                     outillage de vérification (non chargé par la page)
├── matrix.mjs             36 affrontements x 3 seeds, sans rendu
├── matrix-reference.txt   sortie de référence, à differ après tout changement
├── shot.mjs               captures d'écran, avec déclenchement de pouvoir
├── frames.py              extraction d'images d'une vidéo de référence
├── montage.py             planche-contact des images extraites
└── crop.py                recadrage/zoom pour mesurer au pixel
```

### Pourquoi ce découpage

- **Le moteur ne connaît aucun élément.** `fighter.js`, `physics.js` et
  `projectiles.js` lisent la fiche. Ajouter « Feu » = une entrée dans
  `elements.js` + un module dans `abilities/`, sans toucher au reste.
- **Les fiches sont gelées** (`deepFreeze`) et le duel travaille sur un état
  séparé : impossible qu'une partie modifie les stats d'un élément pour la
  suivante. `assertFrozen()` le vérifie au lancement de chaque duel.
- **Le décor est rasterisé une fois** dans un canvas hors écran, puis blitté :
  le fond ne bouge jamais (cahier des charges) et coûte un seul `drawImage`.

### Choix du langage d'animation

**JavaScript ES modules + Canvas 2D**, pas de TypeScript ni de framework :

| Option              | Verdict                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| CSS/DOM animations  | ✗ 200+ particules en DOM = saccades, pas de contrôle du pas de temps       |
| SVG + SMIL          | ✗ coût de layout à chaque frame, pas fait pour une simulation physique     |
| WebGL / PixiJS      | ✗ surdimensionné ici (2 entités + particules), et ajoute une dépendance    |
| **Canvas 2D + ESM** | ✓ 60 fps large, code lisible, zéro build, déployable en glisser-déposer    |
| TypeScript          | ✗ imposerait une étape de compilation avant chaque publication Pages       |

Le typage n'est pas perdu pour autant : les modules sont annotés en **JSDoc**,
donc VS Code fait la vérification de types (`// @ts-check` suffit à l'activer).

La boucle est à **pas fixe (120 Hz)** avec accumulateur : la simulation est
identique sur un écran 60 Hz ou 144 Hz, et les collisions arme/corps ne
« traversent » pas à haute vitesse.

---

## Fidélité à la vidéo

Toutes les constantes de mise en page proviennent d'un relevé image par image
(720 × 1280, 30 fps) ; elles sont regroupées dans `src/data/tuning.js` et
`src/data/elements.js`, chacune commentée `mesuré` ou `calé`.

| Élément mesuré                | Valeur relevée                    |
| ----------------------------- | --------------------------------- |
| Fond hors-arène               | `rgb(249,241,218)` sur la vidéo — **le site l'a remplacé par une encre sombre `#1c1a26`**, seul écart volontaire au relevé ; l'arène reste blanche |
| Arène                         | carré 640 × 640 à (40, 320), bord noir 6 px |
| Boule                         | rayon 41 px, contour noir 5 px    |
| Boule Ombre / Glace           | `#870286` / `#00eff0`             |
| Portée d'arme Ombre / Glace   | 77 px / 132 px depuis le centre   |
| Rotation d'arme               | ≈ 330 °/s (0,92 tour/s), sens inversé aux rebonds |
| Vitesse de déplacement        | 400 → 500 px/s                    |
| Jauges du HUD                 | 268 × 35 px, en x = 39 et x = 412, y = 965 |
| Ligne de stat                 | ligne de base y = 1036            |
| Dôme du Lien d'essence        | rayon ≈ 265 px, `rgb(52,46,70)`, 5,65 s, non clippé |
| Champ de Blizzard             | rayon ≈ 130 px                    |
| Progression « Shadow Step Cooldown » | 3 s → 0,7 s par paliers de 0,2 s |
| Progression « Damage/Slow »   | 1 → 13 sur un duel d'une minute   |
| Progression « Burn Damage/Duration » | 1 → 5,5 par pas de 0,5     |
| Progression « Shield Damage » / « Knockback » | 1 → 14 / 1500 → 5400, **+1 / +300 par coup encaissé** |
| Progression « Tornado Damage » / « Cooldown » | 10 → 24 (+2) / 4 s → 0,5 s (−0,5 s) |
| Progression « Chain Damage »  | 1 → 4,5 par pas de 0,5            |
| Progression « Whirlpool Damage » / « Size » | 1 → 7 / 70 → 100    |
| Progression « Bulb Damage/Heal » | 1 → 8 (+1 par touche)        |
| Shuriken du Vent              | losange évidé 74 px, double contour noir, 4 ergots gris, collé au corps |
| Liane de la Plante            | arc de rayon 46,7 px sur 151°, rasterisé en blocs de 4 px |
| Tempête de fleurs             | grappes de cubes `rgb(248,120,184)` de 11 à 26 px, aucun cerceau |
| Tourbillon de l'Eau           | spirale en pixels, diamètre = la stat « Size » (70 → 150 px) |
| Brûlure du Feu                | teinte du corps **et** anneau orange sur la victime |
| Borne de la Foudre            | bobine de 34 px, halo bleu permanent sur le porteur |

Le rythme est calé pour retrouver ces compteurs en fin de duel : sur les
**36 affrontements possibles** (3 seeds chacun), un duel dure **21 à 79 s**
(41 s en moyenne),
la Glace finit à 12-13 piles et l'Ombre atteint son plancher de 0,7 s. Une
**mort subite** amplifie les dégâts au-delà de 55 s pour qu'aucun duel ne
s'éternise. Détail de l'équilibrage dans [`docs/FICHES.md`](docs/FICHES.md).

---

## Ajouter un élément

1. **La fiche** dans `src/data/elements.js` (copie `SHADOW` et adapte).
   Tout y passe : couleurs, rayon, vitesse, arme, dégâts, pouvoir, ultime,
   projectiles, libellés du HUD.
2. **Les sprites** dans `src/data/pixelmaps.js` (texte) ou en PNG via
   `assets/sprites/manifest.json` — voir
   [`assets/sprites/README.md`](assets/sprites/README.md).
3. **Les pouvoirs** : un module dans `src/game/abilities/` exposant
   `init / update / drawUnder / drawOver / barValue`, puis une ligne dans
   `abilities/index.js`.
4. Ajoute son id à `ROSTER` : il apparaît dans l'écran de sélection avec sa
   fiche générée automatiquement.

Rien d'autre à modifier : HUD, sélection, physique et projectiles sont
pilotés par les données.

---

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — mémoire du projet : carte des fichiers,
  invariants (déterminisme, fiches gelées, matrice d'équilibrage), outils et
  pièges déjà rencontrés. C'est le point d'entrée pour reprendre le travail.
- [`docs/FICHES.md`](docs/FICHES.md) — fiches complètes des deux éléments
  (apparence, vitesse, pouvoirs, projectiles) et méthode de mesure.
- [`assets/sprites/README.md`](assets/sprites/README.md) — remplacer les
  sprites par les tiens.
- [`assets/fonts/LICENSE.md`](assets/fonts/LICENSE.md) — polices embarquées.

## Licence

Code sous licence MIT. Les polices sont sous SIL OFL (voir `assets/fonts/`).
La vidéo de référence appartient à ses auteurs : ce dépôt n'en redistribue
aucun extrait, les sprites sont redessinés en pixel-art.
