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
| Mise en scène (rubans, nappes, ondes, nombres) | `src/render/flair.js` + `look.flair` de chaque fiche |
| Écrans DOM | `src/ui/select.js`, `src/ui/result.js`, `index.html`, `styles/style.css` |
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
| Traînée | fuseau cramoisi `#a32b4a` au cœur | `look.flair.ribbon`, rendu par le ruban de pointe d'arme |
| Portée | centre → pointe = 131 px vidéo → **164 px** | `weapon.reach: 164` |
| Talon | dépasse de 52 px **derrière** le pivot | `handle.length: -52`, `handle.width: 0` — toute la lance est une carte 54 × 12 à `scale: 4` |
| Dégâts | 10, **+2 par touche portée** (10→12→14→16→18→20, six touches pour tuer) | `stack: 10`, `stackGain: 2` — gardés bruts, comme ceux du Hors-la-loi |
| Vitesse | 432 px/s vidéo → **540** | gardée telle quelle : vérifié au banc, 15 victoires sur 30 à 540 contre 16 à 470 |
| Jauge « JUMP » | pleine en ~10 s, marches de ~8 % aux touches | `chargeRate: 10`, `chargeOnHit: 8` |
| Bond | 0,45 s d'élan, **1,5 s hors de l'arène**, marqueur gris qui suit la cible, chute dans un rayon de 110 px | `ultimate.windup / flight / marker / impact` |

Deux valeurs seulement sont `calé`, et ce sont elles qui **paient** des dégâts
de 10 à 14 là où le reste du plateau frappe pour 3 à 6 :

- **le verrou à 6 s**, le plus long du roster. Balayage sur ses 30 duels :
  1,3 s → 30 victoires sur 30 ; 3,0 s → 29 ; 4,5 s → 26 ; 6,0 s → 15.
- **le plafond de pile à 14**, que la vidéo ne montre pas (elle s'arrête à 20
  parce que le duel s'arrête). À 24 il gagnait encore 24 duels sur 30 malgré le
  verrou : un duel qui dure le faisait finir à 24 PV par coup.

**Conséquence assumée : le Dragoon tue au métronome.** Verrou fixe + plafond
donnent 8 touches à 10, 12, 14, 14… soit 106 PV en ~43 s. Plusieurs de ses
duels se terminent donc à 43,2 s **exactement**, quel que soit l'adversaire :
la question n'est pas s'il gagne mais si l'autre tue avant. Des cadences plus
courtes avec moins de montée ont été essayées (4,0 s/10, 3,0 s/10, 4,5 s/12,
5,0 s/12) : toutes donnent un écart *moins* régulier.

**Le moteur ne connaît aucun combattant** : `fighter.js`, `physics.js` et
`projectiles.js` lisent la fiche. En ajouter un = une entrée dans
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

- **Un `re.sub` de calage qui déborde sur une autre fiche.** En balayant des
  cadences pour le Dragoon, une expression ancrée sur `hitbox: { from: …` a
  aussi réécrit celle du **Hors-la-loi** (0,62 → 0,32). Cinq affrontements de la
  matrice ont bougé, dont un vainqueur. Ça ne se voit pas à la lecture : ça se
  voit en diffant la référence, et en vérifiant que `git diff` sur `elements.js`
  ne contient **que des ajouts** quand on ajoute un combattant.
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

- **Français** dans le code, les commentaires, la doc et les réponses.
- Commentaires qui expliquent **pourquoi** (et citent la mesure), pas quoi.
- Après un changement visuel : capture d'écran de contrôle + matrice inchangée.
- Après un changement de gameplay : matrice + justification du nouvel équilibre.
- Tenir `README.md` et `docs/FICHES.md` à jour ; régénérer `docs/capture-*.png`
  quand le rendu change.
- **Tout se développe directement sur `main`.** Pas de branche `claude/*` : on
  commite sur `main` et on y pousse. Le dépôt n'a plus qu'une branche, et c'est
  voulu — les branches de travail avaient fini par contenir trois rosters
  divergents qu'aucune fusion ne pouvait réconcilier.
- Commits en français, corps détaillé, puis push sur `main`, et attendre que
  Pages ait publié.
- Un nouveau combattant s'ajoute **en queue de `ROSTER`** : `tools/matrix.mjs`
  lit cette liste pour former ses paires, donc l'insérer ailleurs déplacerait le
  camp A d'affrontements existants. En queue, le diff de
  `tools/matrix-reference.txt` ne contient **que des ajouts** — c'est la preuve
  que le nouveau venu n'a rien déplacé, et il faut la vérifier.
