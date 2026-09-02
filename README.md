# Elemental Duel — douze combattants, un duel

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

**Plus quatre invités**, repris de la chaîne « ballthingsim » et portés sur ce
moteur : le Hors-la-loi et le Bretteur du duel *Outlaw vs Bladesman*, le
Lancier de *Dragoon vs Outlaw* — la même vidéo que le Hors-la-loi, vue depuis
l'autre camp — et le Mage, construit sur la mécanique de Magia dans
*Dragoon vs Magia*. Ils ne sont pas des éléments : ce sont des personnages,
avec leurs couleurs, leurs armes et leurs formules relevées sur *leur* vidéo.

| Personnage | Arme | Signature | Ultime |
| --- | --- | --- | --- |
| **Hors-la-loi** | Revolver de glace | **canon asservi à la cible** — il ne tourne pas ; barillet de 6, balles qui gèlent, et **un tour du pistolet sur lui-même** au rechargement | Plein soleil / HIGH NOON (cadence doublée, recul ×8) |
| **Bretteur** | Lame de braise (transcrite d'une maquette, remplace le sabre dentelé relevé — voir `docs/FICHES.md`) | rotation qui monte de 0,80 à 3,00 tour/s puis **surchauffe** ; `Damage = 2 × Spin` | Ruée de lame / BLADE RUSH (verrou de touche à 115 ms, éventail vert grand ouvert) |
| **Lancier** | Lance électrique (**164 px, la plus longue portée du jeu**) — **elle suit son cap de déplacement**, elle ne vise pas | **charge** en ligne droite à 2,6 × sa vitesse, pointe en avant, en semant des images fantômes ; dégâts qui montent de **+2 par touche portée** | Bond / JUMP — il **quitte l'arène** 1,5 s, un marqueur suit sa cible, puis il retombe dessus |
| **Mage** | Sceptre de sève (transcrit d'une maquette) — **braqué sur la cible, posé sur le flanc et dessiné par-dessus la bille** | **tireur** : des **orbes guidées** qui virent vers l'adversaire, à une **cadence qui monte toute seule** (+0,05 par orbe, de 1,00 à 4,00 par seconde) | Tempête de sève / SAPWOOD STORM — celle de la Plante, reteintée |

Les quatre invités portent en plus un **pouvoir spécial greffé**, sur horloge
propre, avec leur propre jauge juste sous celle de l'ultime. Il s'ajoute à leur
ultime, il ne le remplace pas — voir [`docs/FICHES.md`](docs/FICHES.md).

Trois sont **empruntés** à un élément gelé : le **Blizzard** de la Glace pour
le Hors-la-loi (champ de givre qui le suit, ralentit et grignote), la **Rage
infernale** du Feu pour le Bretteur, et le **Lien d'essence** de l'Ombre pour
le Lancier (dôme figé + rayon qui draine).

Celui du Mage est **original**, comme le Clone d'ombre du Shinobi : le **Tir
enraciné**. Des racines le clouent au sol une seconde — il cesse de bouger *et*
de tirer — puis il lâche une **orbe majeure** à trois fois les dégâts d'une
orbe ordinaire. C'est la seule prise de risque de son jeu : partout ailleurs il
tire en fuyant.

Son ultime, en revanche, est **emprunté à la Plante** — la Tempête de sève, à
sa place normale. Son module ne le recopie pas, il **délègue** à celui de la
Plante ; c'est la seule façon qu'il ne diverge pas au premier réglage. Le Semis
(les bulbes posés au sol) n'a pas été repris : retiré à la demande, un tireur
qui vise et guide ses orbes n'a pas besoin d'une mine plantée par terre.

<sup>[Le Blizzard du Hors-la-loi](docs/capture-blizzard.png) · [le Lien d'essence du Lancier](docs/capture-lien.png) · [les orbes guidées du Mage](docs/capture-mage.png) · [sa Tempête de sève](docs/capture-mage-tempete.png) · [son Tir enraciné](docs/capture-mage-enracine.png).</sup>

![Lumière contre Feu](docs/capture-duel.png)

<sup>Lumière (marteau, bouclier, piège radiant) contre Feu (brûlure, rage infernale). Voir aussi [les zones](docs/capture-zones.png), [la Plante](docs/capture-plante.png), [la Lumière qui encaisse](docs/capture-lumiere.png), [la rafale du Vent](docs/capture-vent.png), [le dôme de l'Ombre](docs/capture-ombre.png), [la brûlure du Feu](docs/capture-feu.png), [l'écran de sélection](docs/capture-selection.png), [le Hors-la-loi sous HIGH NOON](docs/capture-horsloi.png), [la ruée du Bretteur](docs/capture-bretteur.png), [le Bond du Lancier](docs/capture-lancer.png), [sa charge de lance](docs/capture-lancer-charge.png) et [l'écran de fin avec l'export Short](docs/capture-fin.png).</sup>

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
telle quelle (site en ligne : <https://sebistarrr.github.io/test2/>). Le workflow
se lance aussi à la main depuis l'onglet *Actions*.

Pour un déploiement « depuis une branche » plutôt que par Actions, choisis la
branche et le dossier `/ (root)` : le fichier `.nojekyll` (déjà présent)
empêche Jekyll d'ignorer les dossiers.

### Paramètres d'URL

| Paramètre    | Effet                                                             |
| ------------ | ----------------------------------------------------------------- |
| `?a=&b=`     | lance directement un duel sans écran de sélection — `shadow`, `ice`, `fire`, `water`, `light`, `lightning`, `wind`, `plant`, `outlaw`, `bladesman`, `lancer`, `mage` |
| `?seed=1234` | rejoue **exactement** le même duel (déterminisme complet)          |
| `?lang=fr`   | **toute l'interface** en français — HUD, titre d'arène et écrans DOM (par défaut : l'anglais de la vidéo) |
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
│   ├── fighters/<id>.js   **une fiche par combattant** (gelée) : apparence,
│   │                      vitesse, arme, pouvoir, ultime, projectiles, HUD
│   ├── pixelart/<id>.js   ses sprites pixel-art, en texte
│   ├── elements.js        registre : ELEMENTS, ROSTER, DISABLED, PLAYABLE
│   ├── pixelmaps.js       registre des sprites (PIXEL_MAPS)
│   ├── defaults.js        valeurs universelles + helper `fiche()`
│   ├── format.js          formatage des lignes de stat du HUD
│   ├── tuning.js          géométrie de scène mesurée sur la vidéo
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
│       ├── plant.js       Semis (dégâts/soin) + Tempête de fleurs
│       ├── outlaw.js      Visée asservie + Barillet + Plein soleil
│       └── bladesman.js   Courbe de rotation (surchauffe) + Ruée de lame
└── ui/
    ├── lang.js            libellés d'interface, anglais et français
    ├── select.js          écran de sélection (lit les fiches)
    └── result.js          écran de fin
tools/                     outillage de vérification (non chargé par la page)
├── matrix.mjs             66 affrontements x 3 seeds, sans rendu
├── matrix-reference.txt   sortie de référence, à differ après tout changement
├── probe.mjs              durée, touches et coups/s d'un combattant sur tout
│                          le roster — garde-fou chiffré du Hors-la-loi
├── lang-check.mjs         garde-fou de la langue (tables et champs `Ref`)
├── shot.mjs               captures d'écran, avec déclenchement de pouvoir
├── frames.py              extraction d'images d'une vidéo de référence
├── montage.py             planche-contact des images extraites
└── crop.py                recadrage/zoom pour mesurer au pixel
```

### Pourquoi ce découpage

- **Le moteur ne connaît aucun combattant.** `fighter.js`, `physics.js` et
  `projectiles.js` lisent la fiche. Ajouter « Feu » — ou un personnage venu
  d'un tout autre jeu, comme le Hors-la-loi — = une fiche dans `data/fighters/`
  + un module dans `abilities/`, sans toucher au reste.
- **Un combattant, trois fichiers du même nom.** `wind` c'est
  `data/fighters/wind.js`, `game/abilities/wind.js` et `data/pixelart/wind.js`.
  `elements.js` et `pixelmaps.js` ne sont que des registres : ils ne portent
  aucune valeur de combattant, et on n'a pas à les ouvrir pour en modifier un.
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

## Langue

**L'application est en anglais** — c'est la langue de la vidéo de référence
(`DARK`, `HIGH NOON`, `Damage: 5.50`), donc celle du HUD et du titre d'arène
depuis toujours ; les écrans de sélection et de fin ont suivi. `?lang=fr`
bascule l'ensemble, chrome DOM compris.

Le dépôt, lui, reste en français : code, commentaires, documentation et
messages d'erreur console. Ce sont deux publics différents. Tout l'affichage
passe par [`src/ui/lang.js`](src/ui/lang.js), deux tables aux clés identiques.

---

## Fidélité à la vidéo

Toutes les constantes de mise en page proviennent d'un relevé image par image
(720 × 1280, 30 fps) ; elles sont regroupées dans `src/data/tuning.js` et
`src/data/fighters/`, chacune commentée `mesuré`, `calé` ou `déduit`.

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

Les trois invités viennent d'**autres vidéos, en 576 × 1024** : toute mesure
prise dessus se convertit en **×1,25** vers ce repère 720 × 1280.

| Élément mesuré                | Valeur relevée (convertie)        |
| ----------------------------- | --------------------------------- |
| Boule Hors-la-loi / Bretteur  | `#8a5934` / mesurée `#dcc462` ; le jeu met le Bretteur en **orange `#e8621b`**, avec sa lame de braise (écart assumé, voir `docs/FICHES.md`) |
| Portée d'arme                 | revolver 122 px, sabre/lame 152 px |
| Rotation du sabre             | 0,80 → 3,00 tour/s, palier de 1,8 s au plafond, effondrement à −3,0/s |
| Recul du revolver             | 119 px/s, **988 px/s sous HIGH NOON** |
| Progression « Damage » (Hors-la-loi) | 3,00 → 5,50 par pas de 0,10, **au coup au but** |
| « Damage » du Bretteur        | `2,00 × Spin Speed`, exact, jamais stocké |
| HIGH NOON                     | horloge de 7,0 s, effet 6,2 s, cadence doublée |
| BLADE RUSH                    | horloge de 9 s + 6 % par coup, ruée de 1,5 s, verrou à 115 ms |
| Précision du Hors-la-loi      | 25 coups au but en 38,6 s = **0,65 coup/s** |
| Boule Lancier                 | mesurée `#574a84` indigo ; le jeu la met en **violet `#7046ac`**, la teinte de la lance électrique — donc tout près du relevé. Traînée cramoisie `#a32b4a` conservée |
| Lance du Lancier              | centre → pointe 164 px, talon 42 px **derrière** le pivot. Le **dessin** ne vient pas de la vidéo mais d'une maquette : une **lance électrique** violette — pommeau doré, hampe fissurée de blanc, garde, tête hérissée à gemme. Elle est *transcrite* et non redessinée : réduction par blocs 3 × 3 exacts, 624 × 129 → 208 × 43. L'encombrement, lui, reste celui du relevé |
| Progression « Damage » (Lancier) | 10,00 → 20,00 par pas de **2,00**, à la touche portée ; 5 touches en 27,6 s, soit 0,181 coup/s et 2,54 PV/s (le moteur rend 0,195 et **2,52**) |
| Angle de lance (Lancier)      | **elle suit le cap de déplacement** : 6,6° d'écart médian sur 141 images de toute la vidéo, contre 37,9° du cap vers l'adversaire. Elle ne tourne pas librement et ne vise pas |
| Charge du Lancier             | le corps file à ~1 400 px/s pendant ~0,15 s contre 540 en croisière, lance dans l'axe |
| Bond du Lancier               | jauge pleine en 10 s, 0,45 s d'élan, **1,5 s hors de l'arène**, impact de rayon 110 px |

Le rythme est calé pour retrouver ces compteurs en fin de duel : sur les
**66 affrontements possibles** (3 seeds chacun), un duel dure **17 à 72 s**
(38 s en moyenne, pile la durée de la vidéo de référence du Hors-la-loi),
la Glace finit à 12-13 piles, l'Ombre atteint son plancher de 0,7 s et le
Hors-la-loi termine autour de 5,0 de dégâts, comme sur sa vidéo. Une
**mort subite** amplifie les dégâts au-delà de 55 s pour qu'aucun duel ne
s'éternise. Détail de l'équilibrage dans [`docs/FICHES.md`](docs/FICHES.md).

---

## Ajouter un combattant

Marche à suivre complète, avec les vérifications :
[`docs/AJOUTER-UN-COMBATTANT.md`](docs/AJOUTER-UN-COMBATTANT.md). En résumé,
**un combattant = trois fichiers du même nom**, plus trois lignes de registre :

1. **Les sprites** dans `src/data/pixelart/<id>.js` (texte), recensés dans
   `src/data/pixelmaps.js` — ou en PNG via `assets/sprites/manifest.json`, voir
   [`assets/sprites/README.md`](assets/sprites/README.md).
2. **La fiche** dans `src/data/fighters/<id>.js` (copie une existante et
   adapte). Tout y passe : couleurs, vitesse, arme, dégâts, pouvoir, ultime,
   projectiles, libellés du HUD. **Les deux langues sont dans la fiche** :
   `name`/`nameRef`, `tagline`/`taglineRef`, `weapon.name`/`weapon.nameRef`,
   `hud.statFr`/`hud.stat`… L'application affiche l'anglais ; oublier un champ
   `Ref` fait retomber une ligne en français au milieu d'un écran anglais (le
   repli est silencieux). `fiche()` pose les huit valeurs universelles.
3. **Les pouvoirs** : un module dans `src/game/abilities/<id>.js` exposant
   `init / update / drawUnder / drawOver / barValue`, puis une ligne dans
   `abilities/index.js`.
4. **Trois lignes dans `src/data/elements.js`** : l'import, l'entrée dans
   `ELEMENTS`, et l'id **en queue de `ROSTER`**. Les paires de la matrice sont
   formées en `[liste[i], liste[j]]` : insérer un nouveau venu ailleurs qu'à la
   fin changerait le camp A d'affrontements existants, et avec lui leur issue,
   sans qu'aucune valeur de fiche n'ait bougé. Il apparaît alors dans l'écran de
   sélection avec sa fiche générée automatiquement.

`node tools/fiche-check.mjs` attrape les oublis de câblage et les clés de
sprite inconnues, qui ne lèvent aucune erreur par eux-mêmes.

Rien d'autre à modifier : HUD, sélection, physique et projectiles sont
pilotés par les données.

---

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — mémoire du projet : carte des fichiers,
  invariants (déterminisme, fiches gelées, matrice d'équilibrage), outils et
  pièges déjà rencontrés. C'est le point d'entrée pour reprendre le travail.
- [`docs/FICHES.md`](docs/FICHES.md) — fiches complètes des combattants
  (apparence, vitesse, pouvoirs, projectiles) et méthode de mesure.
- [`assets/sprites/README.md`](assets/sprites/README.md) — remplacer les
  sprites par les tiens.
- [`assets/fonts/LICENSE.md`](assets/fonts/LICENSE.md) — polices embarquées.

## Licence

Code sous licence MIT. Les polices sont sous SIL OFL (voir `assets/fonts/`).
La vidéo de référence appartient à ses auteurs : ce dépôt n'en redistribue
aucun extrait, les sprites sont redessinés en pixel-art.
