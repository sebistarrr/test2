# CLAUDE.md — mémoire du projet

Clone haute fidélité des duels d'éléments *Elemental Armory League*, **plus les
trois personnages venus de la chaîne « ballthingsim »** — le Hors-la-loi, le
Bretteur et le Dragoon — portés sur le même moteur.
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
| Stats, couleurs, armes, pouvoirs d'un combattant | `src/data/elements.js` (fiches gelées) |
| Géométrie de scène, phases, export vidéo | `src/data/tuning.js` |
| Sprites pixel-art (texte) | `src/data/pixelmaps.js` |
| Déroulé du duel, dégâts, rendu global | `src/game/match.js` |
| Entité combattant (état + dessin) | `src/game/fighter.js` |
| Pouvoirs d'un combattant | `src/game/abilities/<id>.js` |
| Mise en scène (rubans, fuseaux, nappes, ondes, nombres) | `src/render/flair.js` + `look.flair` de chaque fiche |
| Écrans DOM | `src/ui/select.js`, `src/ui/result.js`, `index.html`, `styles/style.css` |
| Libellés d'interface (les deux langues) | `src/ui/lang.js` |
| Câblage, boucle, seed, enregistreur | `src/main.js` |
| Relevés vidéo détaillés, par combattant | `docs/FICHES.md` |

---

## Roster

Onze combattants, de **deux origines**.

Huit éléments : `shadow ice fire water light lightning wind plant`, relevés sur
les vidéos *Elemental Armory League* (720 × 1280).

Trois personnages : `outlaw bladesman dragoon`, relevés sur deux vidéos de la
chaîne « ballthingsim », toutes deux en **576 × 1024, 30 fps** :
*Outlaw vs Bladesman* (1159 images, 38,6 s) et *Dragoon vs Outlaw*
(33,6 s) — la seconde montre le Hors-la-loi vu depuis l'autre camp.

**Conséquence : deux repères de mesure cohabitent dans `elements.js`.** Toute
mesure prise sur la vidéo 576 se convertit en **×1,25** vers le repère logique
720 × 1280 du jeu — c'est exactement le rapport entre les deux vidéos. Chaque
valeur convertie cite la mesure d'origine dans son commentaire ; ne jamais
« corriger » un commentaire qui cite un chiffre en 576.

Ce qui **n'a pas** été reporté tel quel : les vitesses et les cadences. Le jeu
d'origine tournait sous Matter.js à pas fixe, celui-ci intègre à la main et
pilote au cap ; sa propre documentation le disait déjà — « recaler
l'équilibrage après tout changement de moteur, jamais reporter les constantes
telles quelles ». Ces valeurs-là sont donc `calé`, avec la mesure d'origine en
commentaire.

| Personnage | Archétype | Signature | Module |
| --- | --- | --- | --- |
| `outlaw` Hors-la-loi | Pistolero | canon **asservi à la cible** (`weapon.spin = 0`), barillet de 6, dégâts +0,10 par balle au but | `abilities/outlaw.js` |
| `bladesman` Bretteur | Duelliste | rotation 0,80 → 3,00 tour/s puis surchauffe, `Damage = 2 × Spin` | `abilities/bladesman.js` |
| `dragoon` Dragoon | Lancier | lance de **164 px, la plus longue portée du jeu**, dégâts +2 par touche, et le **Bond** qui le sort de l'arène | `abilities/dragoon.js` |

### Le Dragoon en détail

| Ce qu'il porte | Relevé sur la vidéo | Ce qui est dans la fiche |
| --- | --- | --- |
| Corps | bille `#574a84` (pipette), rayon 33 px vidéo | `look.body`, `radius: 41` |
| Traînée | **deux effets** : boucles roses tracées par la pointe d'arme, **et** un fuseau cramoisi `#a32b4a` derrière la bille | `look.flair.ribbon` **et** `look.flair.smear` (le second a dû être ajouté à `render/flair.js` : le ruban ne suit que la pointe) |
| Portée | centre → pointe = **164 px** | `weapon.reach: 164` |
| Talon | dépasse de 42 px **derrière** le pivot | `handle.length: -44`, `handle.width: 0` — toute la lance est une carte 52 × 8 à `scale: 4` |
| Forme de lame | **en feuille** : 24 px de large à la bille, **32 au ventre**, 21 près de la pointe. Relevé en aplatissant la lance sur trois images | `dragoonLance` — le premier portage l'affinait de façon monotone, c'était faux |
| Cadence relevée | **5 touches en 27,6 s = 0,181 coup/s**, budget 2,54 PV/s | le moteur rend 0,192 et 2,36 (voir plus bas) |
| Dégâts | 10, **+2 par touche portée** (10→12→14→16→18→20, six touches pour tuer) | `stack: 10`, `stackGain: 2` — gardés bruts, comme ceux du Hors-la-loi |
| Vitesse | 432 px/s vidéo → **540** | gardée telle quelle : vérifié au banc, 15 victoires sur 30 à 540 contre 16 à 470 |
| Jauge « JUMP » | pleine en ~10 s, marches de ~8 % aux touches | `chargeRate: 10`, `chargeOnHit: 8` |
| Bond | 0,45 s d'élan, **1,5 s hors de l'arène**, marqueur gris qui suit la cible, chute dans un rayon de 110 px | `ultimate.windup / flight / marker / impact` |

**Un seul écart au relevé subsiste, et il est chiffré : le verrou.** La vidéo
donne trois touches de lance consécutives à 13,63 / 14,77 / 16,37 s, donc un
verrou réel d'environ **1,1 s**. Mais à 1 s la lance de 164 px accroche ici
**0,341 fois par seconde** contre 0,181 relevé — deux fois trop. À 6 s le moteur
rend 0,192 coup/s et 2,36 PV/s, contre 0,181 et 2,54 : *ce que la vidéo montre*
est donc exact, seul le mécanisme diffère — un verrou long ici, des coups
manqués là-bas.

Ce n'est pas un défaut général du moteur : `tools/probe.mjs` donne au
Hors-la-loi **0,649 coup/s** là où sa vidéo en mesure 0,65. Le Dragoon fait
exception parce que son segment tranchant balaie près d'un cinquième de l'arène.

Le **plafond de pile à 14** est `déduit`, pas `calé` : la vidéo n'en montre
aucun (elle s'arrête à 20 parce que le Dragoon meurt), mais tous les combattants
à stat croissante du roster en ont un, et sans plafond la montée est quadratique
en durée de duel. Au banc : 12 → 10 victoires sur 30 ; **14 → 15** ; 16 → 22.

**Conséquence assumée : le Dragoon tue au métronome.** Verrou fixe + plafond
donnent 8 touches à 10, 12, 14, 14… soit 106 PV en ~43 s. Plusieurs de ses
duels se terminent donc à 43,2 s **exactement**, quel que soit l'adversaire :
la question n'est pas s'il gagne mais si l'autre tue avant. C'est aussi, de tout
le roster, le profil qui colle le mieux à sa vidéo : rare et lourd, exactement
les cinq touches à 10-12-14-16-18 du duel de référence.

**Le moteur ne connaît aucun combattant** : `fighter.js`, `physics.js` et
`projectiles.js` lisent la fiche. En ajouter un = une entrée dans
`elements.js` + un module dans `abilities/` + une ligne dans `ROSTER`.

---

## Langue

**L'application est en anglais, le dépôt est en français.** Deux règles
distinctes, à ne pas confondre :

- **ce que voit le joueur** est en anglais — c'est la langue de la vidéo de
  référence (`DARK`, `HIGH NOON`, `Damage: 5.50`), donc celle du HUD et du
  titre d'arène depuis toujours. Les écrans DOM ont suivi ;
- **le code, les commentaires, la doc et les réponses** restent en français
  (voir « Habitudes attendues »). Les messages d'erreur console aussi : ils
  s'adressent à qui développe, pas à qui joue.

Tout l'affichage passe par `src/ui/lang.js` : une table `UI.ref` (anglais) et
`UI.fr` (français), aux **clés strictement identiques**, plus l'aide `label()`
qui choisit entre `name` et `nameRef`. `?lang=fr` bascule l'ensemble — HUD,
titre d'arène *et* chrome DOM. Avant, seul le HUD suivait et l'écran de
sélection restait français quoi qu'il arrive.

Chaque fiche porte donc **les deux moitiés** de son identité :

| Français | Anglais | Où c'est lu |
| --- | --- | --- |
| `name` | `nameRef` | titre d'arène, cartes, écran de fin |
| `tagline` | `taglineRef` | rôle de la carte + ligne « Role » |
| `weapon.name` | `weapon.nameRef` | ligne « Weapon » |
| `ability.name` / `ultimate.name` | `.nameRef` | lignes « Ability » / « Ultimate » |
| `projectiles.*.label` | `.labelRef` | ligne « Projectile » |
| `hud.statsFr` | `hud.stats` | ligne de stat du HUD |
| `ultimate.barLabelFr` | `ultimate.barLabel` | jauge d'ultime |

**Ajouter un combattant sans ses champs `Ref` le fait retomber en français au
milieu d'un écran anglais** : `label()` a un repli silencieux (`nameRef ?? name`)
qui évite le plantage mais pas l'incohérence. Les remplir fait partie de la
fiche, pas d'une passe de traduction ultérieure.

`index.html` est écrit en anglais pour que la page soit correcte avant même que
le module ne se charge, puis `applyStaticLabels()` la réécrit — y compris en
anglais. C'est volontaire : c'est ce qui empêche le HTML et la table de diverger
sans que ça se voie.

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
3. **Équilibrage.** Avec onze combattants, chacun en dispute **30** (10
   adversaires × 3 seeds) et la bande visée est **13 à 17 victoires**, soit la
   même part qu'à huit (9 à 12 sur 21). Après **tout** changement, comparer la
   matrice (voir Outils) : un changement visuel doit la laisser **identique au
   fichier près**.
   - **Deux écarts connus, tous deux hérités du même couplage.**
     La **Lumière à 21/30** : son Égide grandit quand elle **encaisse**, et les
     trois invités frappent rarement pour beaucoup — exactement le profil que le
     bouclier absorbe. Elle les bat 9-0. Ce n'est pas une dérive, c'est un
     couplage de fiches ; aucune valeur de la Lumière n'a été touchée.
     Le **Vent à 12/30** : il était déjà au plancher de la bande (12/27) et perd
     3-0 contre le Dragoon, ce qui le fait passer juste dessous. Là encore,
     aucune valeur du Vent n'a bougé.
   - Relevé courant : Lumière 21, Hors-la-loi 17, Glace 16, Ombre 15,
     **Dragoon 15**, Feu 14, Foudre 14, Plante 14, Bretteur 14, Eau 13,
     Vent 12.
   - **`ROSTER` décide qui est le camp A.** Les paires sont formées en
     `[liste[i], liste[j]]`, et le camp A pèse lourd. Un nouveau venu s'ajoute
     donc **en queue** : inséré ailleurs, il déplacerait le camp A
     d'affrontements existants et changerait leur issue sans qu'aucune valeur
     de fiche n'ait bougé.
4. **Le décor ne bouge jamais** (cahier des charges) — rasterisé une fois dans
   `scene.js`, blitté en un `drawImage`.
5. **Convention de commentaire dans les fiches** : chaque valeur porte
   `mesuré` (relevé vidéo), `calé` (ajusté par simulation) ou `déduit`.
   Ne jamais changer une valeur `mesuré` sans nouveau relevé. Et ne pas caler
   par réflexe : la vitesse du Dragoon a été mesurée à 540 px/s et **gardée**,
   parce que le banc a montré qu'elle ne cassait rien (15/30 contre 16/30 à
   470). Un `calé` doit être justifié par une mesure, pas par une intuition.
6. **`alive` ≠ `onStage`.** Un combattant peut être vivant *et absent* :
   `Fighter.offstage` (secondes restantes hors du plateau) le retire du
   déplacement, des collisions, des touches, des projectiles, du rendu et de
   toute la mise en scène. Le moteur ne sait pas *pourquoi* il est parti — seul
   son module le sait (le Bond du Dragoon). **Toute boucle sur les combattants
   qui teste `f.alive` pour décider de le *voir* doit tester `f.onStage`** :
   `render/flair.js` (six boucles), `physics.js`, `projectiles.js` et le rendu
   de `match.js`. Un oubli laisse un ruban, une nappe ou une hitbox fantôme au
   dernier point connu.

## Écarts volontaires au relevé

- Fond hors-arène : la vidéo est sur papier crème, le site est en **encre
  sombre `#1c1a26`**. L'arène reste blanche → le pixel-art garde ses contours
  noirs mesurés. Le « chrome » posé sur le fond sombre (titre, lignes de stat)
  passe à un liseré crème `STAGE.outline` ; les jauges gardent une plaque crème.
- Filigrane `@ElementalArmoryLeague` non reproduit — ni le « ballthing.com » /
  « @ballthingsim » des vidéos des trois invités.
- **HIGH NOON ne teinte pas l'arène.** Sur sa vidéo, l'arène entière vire au
  crème `#FDF7ED` pendant l'ultime du Hors-la-loi. Ici le décor est rasterisé
  une fois et **ne bouge jamais** (invariant 4) : la lumière se pose donc au
  sol, sous le pistolero, ce qui la laisse en plus derrière les combattants.
- Chiffre de PV du Bretteur en encre sombre plutôt qu'en crème (voir Pièges).

---

## Outils (dans `tools/`)

```bash
python3 -m http.server 8085 &            # requis par les outils Playwright

node tools/matrix.mjs                    # 66 affrontements x 3 seeds, sans rendu
node tools/matrix.mjs > /tmp/a.txt && diff tools/matrix-reference.txt /tmp/a.txt

node tools/lang-check.mjs                # garde-fou de la langue : les deux tables
                                         # de ui/lang.js doivent porter les mêmes clés,
                                         # et chaque fiche tous ses champs `Ref`

node tools/probe.mjs outlaw              # durée, touches et coups/s d'un combattant
                                         # sur tout le roster — c'est le garde-fou
                                         # chiffré du Hors-la-loi (0,65 coup/s relevé)

node tools/shot.mjs "?a=wind&b=plant&seed=5" /tmp/s 3,9,20
FORCE=plant:ult node tools/shot.mjs "?a=wind&b=plant" /tmp/s 8   # déclenche l'ultime
FORCE=bladesman:ult node tools/shot.mjs "?a=bladesman&b=shadow" /tmp/s 8

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
en ×1,25** vers le repère logique du jeu (720 × 1280). C'est vrai des vidéos
*Elemental Armory League* comme de celles des trois invités.

Arène : carré 640 × 640 à (40, 320), bord noir 6 px. Boule : rayon 41.

Marche à suivre : `frames.py` → `montage.py` pour repérer les moments →
`crop.py` pour zoomer → masques numpy pour mesurer (tailles, positions,
couleurs par percentile plutôt que par moyenne, le JPEG bruite).

---

## Pièges déjà rencontrés

- **Une moitié d'écran dans chaque langue.** `?lang=fr` ne pilotait que le HUD
  et le titre d'arène ; les écrans DOM étaient français en dur. En anglais, on
  lisait donc « CHOISIS TES COMBATTANTS » au-dessus d'un duel « DARK vs ICE ».
  Tout l'affichage passe désormais par `src/ui/lang.js`, un seul interrupteur.

- **Un `re.sub` de calage qui déborde sur une autre fiche. Deux fois.** En
  balayant des cadences pour le Dragoon, une expression ancrée sur
  `hitbox: { from: …` a réécrit celle du **Hors-la-loi** (0,62 → 0,32) : cinq
  affrontements de la matrice ont bougé, dont un vainqueur. La seconde fois,
  un `re.sub` sur `onHit: { stackGain: …` a réécrit ceux du Hors-la-loi **et**
  du Bretteur, et un `s.index('damage: (f) => Math.max(')` a pris la première
  fiche du fichier au lieu de la bonne : **tout un balayage de mesures était
  faux sans que rien ne plante**. Règle : un setter de balayage doit
  `assert` que son ancre est **unique**, et il faut relire
  `git diff src/data/elements.js` avant de croire un chiffre.
- **Un pouvoir sans recharge finie.** Le Dragoon n'a pas de pouvoir actif : sa
  fiche porte `ability.cooldown: Infinity` et l'écran de sélection affichait
  « recharge Infinitys ». `select.js` teste maintenant `Number.isFinite` et
  écrit « passif ». Le moteur, lui, s'en moque : le module n'arme aucune
  minuterie.
- **Le talon de la lance passe derrière le pivot.** `drawSpriteLeft` blitte le
  sprite à partir de `handle.length` : une valeur **négative** le fait démarrer
  en arrière de la bille. Corollaire : `handle.length + map.w × scale` doit
  toujours valoir la portée (−52 + 54 × 4 = 164), sinon la pointe ment sur la
  hitbox.
- **`offstage` ne doit pas expirer avant le module.** Le décompte de
  `Fighter.offstage` et celui de `f.ult.active` avancent du même `dt` : à
  l'égalité stricte le Dragoon réapparaît une image **à son ancienne position**
  avant que `land()` ne le téléporte. D'où la marge de 0,1 s posée au décollage,
  et c'est bien `land()` qui remet `offstage` à zéro.

- **Seuil d'arrondi.** `Math.round(stat/18)` → `stat/15` a doublé des dégâts
  (round(1,33)=1 vs round(1,6)=2) et fait passer le Vent de 5 à 19 victoires.
  Toujours repasser la matrice après un changement de formule.
- **Rééquilibrer un combattant affaibli** : ne toucher que ses paramètres `calé`
  ou `déduit`, jamais les `mesuré`.
- **`imageSmoothingQuality = 'high'`** sur le rééchantillonnage de l'export
  coûtait 72 % du fil principal. Rester en `'low'` (`render/recorder.js`).
- **`captureStream()`** ne doit être appelé qu'une fois par session : un appel
  par duel laissait des pistes de capture vivantes.
- Le filigrane TikTok dérive sur les vidéos : binariser la zone de texte avant
  de hacher une bande de stats.
- Écran de sélection : un élément sans `head.sprite` (la Plante) doit avoir une
  chaîne de repli sprite → projectile → icône.
- **La fiche de sélection lit des valeurs qui peuvent être des fonctions.**
  `melee.damage`, `melee.cooldown` et, depuis le Hors-la-loi, `projectile.damage`
  peuvent dépendre de la pile courante. Affichées telles quelles, elles
  imprimaient le **code source de la fonction** dans la fiche. Même piège pour
  `weapon.spin = 0` : « rotation 0 °/s » se lisait comme un bug alors que c'est
  une arme braquée. Les deux ont leur repli dans `ui/select.js`.
- **Une visée réécrite à chaque image touche toujours.** Le canon du
  Hors-la-loi est asservi à sa cible (c'est le relevé) : sans dispersion il
  gagnait **27 duels sur 27** et touchait 1,30 fois par seconde, exactement le
  double de sa précision relevée. Sa dispersion `ability.spread` n'est pas un
  ornement, c'est le paramètre qui le ramène à 0,65 coup/s — et elle est
  **raide** : 0,72 → 10 victoires, 0,75 → 15, 0,80 → 9. Elle se règle au banc
  (`tools/probe.mjs`), jamais à l'estime.
- **La ruée du Bretteur a un seul point de sortie**, `endRush()`. Vitesse,
  pilotage et ouverture de l'éventail y sont remis **ensemble** : dispersés,
  une fin de duel en pleine ruée laissait l'éventail large accroché derrière la
  lame. C'est le piège hérité du jeu d'origine, reporté ici tel quel.
- **L'éventail vert est borné en angle, jamais en nombre d'images.** À 3 tours/s
  un compteur d'images donne trois tours complets de vert. Déjà fait, déjà
  corrigé — dans les deux moteurs.
- **Le chiffre de PV n'a pas de contour dans ce moteur.** La vidéo d'origine
  écrit les PV en crème `#F5F2EA` avec un contour sombre ; ici `fighter.js` ne
  fait qu'un `fillText`. Le crème mesuré marche sur le brun du Hors-la-loi et
  disparaît sur l'or du Bretteur, qui porte donc un `hpColor` sombre — écart
  volontaire, documenté dans sa fiche.

---

## Habitudes attendues

- **Français** dans le code, les commentaires, la doc et les réponses — mais
  **anglais dans l'application** (section « Langue »).
- Commentaires qui expliquent **pourquoi** (et citent la mesure), pas quoi.
- Après un changement visuel : capture d'écran de contrôle + matrice inchangée.
- Après un changement de gameplay : matrice + justification du nouvel équilibre.
- Tenir `README.md` et `docs/FICHES.md` à jour ; régénérer `docs/capture-*.png`
  quand le rendu change.
- **Tout se développe directement sur `main`.** Pas de branche `claude/*` : on
  commite sur `main` et on y pousse. Le dépôt **n'a plus qu'une branche**, et
  `main` est la branche par défaut — les quatre branches de travail ont été
  supprimées, elles avaient fini par porter trois rosters divergents qu'aucune
  fusion ne pouvait réconcilier. N'en recrée pas.
- **Français dans le code, anglais à l'écran** — voir la section « Langue ».
  Un nouveau combattant apporte ses champs `Ref` en même temps que sa fiche.
- Commits en français, corps détaillé, puis push sur `main`, et attendre que
  Pages ait publié.
- Un nouveau combattant s'ajoute **en queue de `ROSTER`** : `tools/matrix.mjs`
  lit cette liste pour former ses paires, donc l'insérer ailleurs déplacerait le
  camp A d'affrontements existants. En queue, le diff de
  `tools/matrix-reference.txt` ne contient **que des ajouts** — c'est la preuve
  que le nouveau venu n'a rien déplacé, et il faut la vérifier.
