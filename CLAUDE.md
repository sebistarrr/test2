# CLAUDE.md — mémoire du projet

Duel d'arène 2D, roster **Bêtes Spirituelles** (animaux totems).
Le roster rhabille les huit éléments de l'ancien *Elemental Armory League*
sans toucher à leur mécanique — voir « Roster » ci-dessous.
HTML + CSS + JS ES modules, Canvas 2D, **aucune dépendance, aucun build**.
Publié sur GitHub Pages à chaque push sur `main` → <https://sebistarrr.github.io/test2/>

**Lis ce fichier avant d'ouvrir quoi que ce soit d'autre.** Il existe pour
éviter de réexplorer le dépôt : la carte, les invariants et les outils sont ici.
Va droit au fichier concerné, en `grep` ciblé plutôt qu'en lecture intégrale —
`elements.js` fait 1 200 lignes et `FICHES.md` 500.

---

## Carte

| Besoin | Fichier |
| --- | --- |
| Stats, couleurs, armes, pouvoirs d'une bête | `src/data/elements.js` (fiches gelées) |
| Géométrie de scène, phases, export vidéo | `src/data/tuning.js` |
| Sprites pixel-art (texte) | `src/data/pixelmaps.js` |
| Roster « Bêtes Spirituelles » (palette + sprite/projectile/icône) | `src/data/pixelmaps.js` → `SPIRIT_BEASTS` |
| Déroulé du duel, dégâts, rendu global | `src/game/match.js` |
| Entité combattant (état + dessin) | `src/game/fighter.js` |
| Pouvoirs d'une bête | `src/game/abilities/<id>.js` |
| Mise en scène (rubans, nappes, ondes, nombres) | `src/render/flair.js` + `look.flair` de chaque fiche |
| Barre de vie (haut) + jauges d'ultime (bas) | `src/render/hud.js` + `HUD` de `tuning.js` |
| Écrans DOM | `src/ui/select.js`, `src/ui/result.js`, `index.html`, `styles/style.css` |
| Câblage, boucle, seed, enregistreur | `src/main.js` |
| Relevés vidéo détaillés, par élément | `docs/FICHES.md` |

## Roster

Huit bêtes : `wolf turtle hawk snake bear tiger spider deer`.

Chacune **reprend telle quelle** la mécanique d'un élément de l'ancien roster —
aucune valeur de jeu n'a bougé, seules l'identité, les couleurs et les sprites
changent :

| Bête | Archétype | Mécanique héritée de | Module |
| --- | --- | --- | --- |
| `wolf` Loup | Traqueur | `shadow` Ombre | `abilities/wolf.js` |
| `turtle` Tortue | Forteresse | `light` Lumière | `abilities/turtle.js` |
| `hawk` Faucon | Zoner | `wind` Vent | `abilities/hawk.js` |
| `snake` Serpent | Embuscade | `plant` Plante | `abilities/snake.js` |
| `bear` Ours | Berserker | `fire` Feu | `abilities/bear.js` |
| `tiger` Tigre | Combo | `lightning` Foudre | `abilities/tiger.js` |
| `spider` Araignée | Contrôle | `ice` Glace | `abilities/spider.js` |
| `deer` Cerf | Mystique | `water` Eau | `abilities/deer.js` |

**Conséquence** : les annotations `mesuré` et les noms de vidéos cités dans
`elements.js` disent d'où vient le chiffre, **pas qui le porte aujourd'hui**.
Un relevé fait sur l'Ombre décrit désormais le Loup. Ne jamais « corriger » un
commentaire de relevé au prétexte qu'il cite un ancien nom d'élément.

Quelques clés de fiche gardent aussi leur nom d'origine parce que le moteur les
lit ainsi : `ability.tornado` (Faucon), `ability.whirlpool` / `ultimate.maelstrom`
(Cerf), `ability.bulb` (Serpent), `weapon.vine` (fouet du Serpent),
`ultimate.snow` (soie de l'Araignée), `ultimate.wings` (crinière de l'Ours).
Chacune porte un commentaire le disant.

**Le moteur ne connaît aucune bête** : `fighter.js`, `physics.js` et
`projectiles.js` lisent la fiche. Ajouter une bête = une entrée dans
`elements.js` + un module dans `abilities/` + une ligne dans `ROSTER`.

---

## Invariants — à ne jamais casser

1. **Fiches gelées.** `deepFreeze` + `assertFrozen()` à chaque duel. Un duel ne
   peut pas déteindre sur le suivant.
2. **Déterminisme.** `?seed=` doit rejouer un duel à l'identique, et le bouton
   « Revoir ce duel » en dépend.
   - `game.rng` = simulation. **Tout appel consomme le flux** : ajouter un
     `fx.burst()` dans un chemin de simulation décale tout ce qui suit et change
     les vainqueurs. Déjà arrivé deux fois.
   - `game.viewRng` = rendu seul (tremblement de caméra, gigue des arcs).
     Toute décoration passe par lui, ou par un hachage pur (`hash01` dans
     `plant.js`).
   - `render/flair.js` est **la** porte d'entrée pour ajouter du spectacle :
     aléa `viewRng`, banc de particules séparé, aucun accès à `game.rng`.
     Y ajouter un effet ne peut pas casser l'équilibrage.
     Sa règle de composition : **rien entre le spectateur et les combattants**.
     Remplir le cadre par le fond (nappe de sol), les bords (ondes de mur) ou
     l'arrière du combattant (ruban, sillage) — jamais par une nuée flottante,
     essayée puis retirée pour cette raison.
3. **Équilibrage.** Chaque bête gagne 9 à 12 duels sur 21. Après **tout**
   changement, comparer la matrice (voir Outils) : un changement visuel doit
   la laisser **identique au fichier près**.
   - **`ROSTER` ≠ ordre d'appariement.** Les paires de la matrice sont formées
     en `[liste[i], liste[j]]` : la liste décide **qui est le combattant A**, et
     le camp A pèse lourd. Mesuré sur ce roster : passer de l'ordre
     d'appariement à l'ordre d'affichage fait monter la Tortue de 12 à 14
     victoires et tomber le Serpent de 9 à 5, **sans qu'une valeur de fiche ait
     bougé**. L'ordre d'appariement est donc figé en tête de `tools/matrix.mjs`
     et `ROSTER` n'est plus que l'ordre d'affichage : réordonner le menu ne doit
     jamais déplacer la référence.
4. **Le décor ne bouge jamais** (cahier des charges) — rasterisé une fois dans
   `scene.js`, blitté en un `drawImage`.
   - **Le corps d'un combattant est son portrait, plus une boule.** `look.radius`
     ne dessine plus rien : il ne sert qu'aux collisions. La taille à l'écran
     vient de `BODY.scale` (× le rayon) dans `tuning.js`. Les PV ne sont plus
     écrits dans le corps mais dans la **barre de vie en haut de l'écran**
     (`HUD.hp`), au-dessus du titre.
   - **Le corps est le seul élément rendu lisse.** `getSmoothSprite`
     (`render/sprites.js`) agrandit la pixelmap par interpolation bilinéaire :
     la bête n'a plus de marches d'escalier. Tout le reste — armes, projectiles,
     œufs, marques, icônes — **garde le pixel-art**. Deux réglages commandent
     la douceur, `SMOOTH_SOURCE` surtout : comparé côte à côte, 1 rend la bête
     floue, 3-4 laissent revenir la grille, 2 est le bon compromis.
     Le blit doit réactiver `imageSmoothingEnabled` : le contexte de scène
     tourne en `false` pour le pixel-art et ré-escalierait la réduction.
5. **Convention de commentaire dans les fiches** : chaque valeur porte
   `mesuré` (relevé vidéo), `calé` (ajusté par simulation) ou `déduit`.
   Ne jamais changer une valeur `mesuré` sans nouveau relevé.

## Écarts volontaires au relevé

- Fond hors-arène : la vidéo est sur papier crème, le site est en **encre
  sombre `#1c1a26`**. L'arène reste blanche → le pixel-art garde ses contours
  noirs mesurés. Le « chrome » posé sur le fond sombre (titre, lignes de stat)
  passe à un liseré crème `STAGE.outline` ; les jauges gardent une plaque crème.
- Filigrane `@ElementalArmoryLeague` non reproduit.

---

## Outils (dans `tools/`)

```bash
python3 -m http.server 8085 &            # requis par les outils Playwright

node tools/beasts-preview.mjs            # planche du roster Bêtes Spirituelles :
                                         # valide les 24 maps + rend docs/roster-beasts.png
                                         # sur fond sombre ET clair (aucune dépendance)

node tools/matrix.mjs                    # 36 affrontements x 3 seeds, sans rendu
node tools/matrix.mjs > /tmp/a.txt && diff tools/matrix-reference.txt /tmp/a.txt

node tools/shot.mjs "?a=hawk&b=snake&seed=5" /tmp/s 3,9,20
FORCE=snake:ult node tools/shot.mjs "?a=hawk&b=snake" /tmp/s 8   # déclenche l'ultime

python3 tools/frames.py <video.mp4> <dossier> <pas_s> [t0] [t1]
python3 tools/montage.py <dossier> <sortie.jpg> <cols> <lignes> <largeur> [début]
python3 tools/crop.py <image> <sortie.png> x0 y0 x1 y1 [zoom]
```

`tools/matrix-reference.txt` est la matrice de référence : la régénérer
**uniquement** quand un changement d'équilibrage est voulu et assumé.

Vérification syntaxique (pas d'ESLint dans le dépôt) :
`for f in $(find src tools -name '*.js' -o -name '*.mjs'); do node --check "$f"; done`

Poignée de debug exposée en page : `globalThis.__match`.

---

## Méthode de relevé vidéo

Les vidéos de référence font 576 × 1024, sauf la première en 720 × 1280 —
soit exactement 0,8 ×. **Toute mesure prise sur une vidéo 576 se convertit
en ×1,25** vers le repère logique du jeu (720 × 1280).

Arène : carré 640 × 640 à (40, 320), bord noir 6 px. Boule : rayon 41.

Marche à suivre : `frames.py` → `montage.py` pour repérer les moments →
`crop.py` pour zoomer → masques numpy pour mesurer (tailles, positions,
couleurs par percentile plutôt que par moyenne, le JPEG bruite).

---

## Pièges déjà rencontrés

- **Seuil d'arrondi.** `Math.round(stat/18)` → `stat/15` a doublé des dégâts
  (round(1,33)=1 vs round(1,6)=2) et fait passer le Vent de 5 à 19 victoires.
  Toujours repasser la matrice après un changement de formule.
- **Rééquilibrer un élément affaibli** : ne toucher que ses paramètres `calé`
  ou `déduit`, jamais les `mesuré`.
- **`imageSmoothingQuality = 'high'`** sur le rééchantillonnage de l'export
  coûtait 72 % du fil principal. Rester en `'low'` (`render/recorder.js`).
- **`captureStream()`** ne doit être appelé qu'une fois par session : un appel
  par duel laissait des pistes de capture vivantes.
- Le filigrane TikTok dérive sur les vidéos : binariser la zone de texte avant
  de hacher une bande de stats.
- Écran de sélection : une bête sans `head.sprite` (le Serpent) doit avoir une
  chaîne de repli portrait → arme → projectile → icône.
- **Sur le fond sombre `#1c1a26`, un contour `K` ne dessine rien.** Les icônes
  de l'Ours, du Tigre et de la Tortue ont dû être refaites pour tenir par leurs
  seules valeurs claires — la première version disparaissait. Toute nouvelle
  icône doit être relue sur `docs/roster-beasts.png`, qui la rend sur fond
  sombre *et* clair.
- **Têtes d'arme carrées.** Les armes d'origine étaient des sprites allongés
  (28 × 9) ; celles du roster font 8 × 8. `headH = map.h × head.scale` et le
  sprite démarre à `handle.length` : si `handle.length + 8 × scale` ne vaut pas
  la portée, l'arme reste cachée sous la boule (rayon 41). Les deux sont
  purement visuels — ni la portée ni la hitbox n'en dépendent.
- **Flash blanc sur fond blanc.** Depuis que le corps est un sprite, teinter
  la silhouette en blanc plein la fait **disparaître sur l'arène blanche** — la
  boule d'origine, elle, gardait son contour noir. D'où `FLASH_ALPHA = 0.7`
  dans `fighter.js` : le pixel-art garde ses contours sous le flash.
- **Couleur de barre de vie.** La barre se remplit de `look.body`. Celui de
  l'Araignée est si proche du fond sombre qu'on ne la voyait pas se vider :
  elle est la seule à porter un `look.hpFill` (son rouge). Toute bête à corps
  très sombre aura le même besoin.

---

## Habitudes attendues

- **Français** dans le code, les commentaires, la doc et les réponses.
- Commentaires qui expliquent **pourquoi** (et citent la mesure), pas quoi.
- Après un changement visuel : capture d'écran de contrôle + matrice inchangée.
- Après un changement de gameplay : matrice + justification du nouvel équilibre.
- Tenir `README.md` et `docs/FICHES.md` à jour ; régénérer `docs/capture-*.png`
  quand le rendu change.
- Commits en français, corps détaillé, puis push sur `main` **et** sur
  `claude/spiritual-beasts-pixelmaps-cm5put`, et attendre que Pages ait publié.
