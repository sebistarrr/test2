# CLAUDE.md — mémoire du projet

Duels **à deux, en 2 contre 2 ou en bataille royale**, avec sept combattants :
cinq repris de la chaîne « ballthingsim » — le Pistolero, le Ronin, l’Hoplite,
le Shinobi et le Druide — et **deux inventés**, le Golem et le Mannequin (une
cible d'entraînement qui ne frappe pas), sur un moteur écrit d'après les vidéos
de référence.
HTML + CSS + JS ES modules, Canvas 2D, **aucune dépendance, aucun build**.
Publié sur GitHub Pages à chaque push sur `main` → <https://sebistarrr.github.io/test2/>

**Lis ce fichier avant d'ouvrir quoi que ce soit d'autre**, puis va droit au
fichier concerné. Il porte **les règles** : la carte, les invariants, l'index
des pièges, les outils. Il est chargé à chaque session, donc chaque ligne y est
payée à chaque fois — **il ne porte que ce qui vaut pour tout le dépôt, et sous
sa forme la plus courte.**

Le reste s'ouvre à la demande, et une seule fois chacun :

| Quand | Fichier |
| --- | --- |
| Savoir **pourquoi** une règle existe : mesures, chiffres, histoire. Y sont aussi la **méthode de relevé vidéo** et les **écarts volontaires** au relevé (PNG, fond sombre, modes de traînée, largeurs réglées à l'image) | `docs/PIEGES.md` |
| Travailler sur **un combattant** : relevés, écarts, demandes passées | `docs/FICHES.md` |
| **Ajouter ou modifier** un personnage | `docs/AJOUTER-UN-COMBATTANT.md` |

Un piège de l'index ci-dessous tient en une ligne ; sa mesure, son balayage et
son histoire sont dans `docs/PIEGES.md`, sous le même intitulé. **Avant de
refaire un geste qu'un piège nomme, y aller lire le détail** — c'est là qu'est
le chiffre qui évite de le repayer.

Ces deux fichiers-là sont longs et **ne se lisent jamais en entier** : chacun
porte en tête un sommaire avec le numéro de ligne de ses sections, à ouvrir sur
la bonne (`offset` / `limit`). Les numéros dérivent ; `grep -n '^#\+ '` les
recale.

---

## Carte

**Un combattant = trois fichiers du même nom.** `wind` par exemple, c'est
`data/fighters/wind.js` (sa fiche), `game/abilities/wind.js` (ses pouvoirs) et
`data/pixelart/wind.js` (ses dessins). Rien d'autre à ouvrir pour le modifier.

| Besoin | Fichier |
| --- | --- |
| Stats, couleurs, armes, pouvoirs d'un combattant | `src/data/fighters/<id>.js` |
| Valeurs universelles + helper `fiche()` | `src/data/defaults.js` |
| Registre du roster (`ELEMENTS`, `ROSTER`) | `src/data/elements.js` |
| Sprites pixel-art (texte) | `src/data/pixelart/<id>.js`, recensés dans `src/data/pixelmaps.js` |
| Overrides de sprites en vrai PNG (écart assumé à « aucun binaire ») | `assets/sprites/` + `manifest.json` |
| Géométrie de scène, phases, export vidéo | `src/data/tuning.js` |
| Déroulé du duel, dégâts, rendu global | `src/game/match.js` |
| Entité combattant (état + dessin) | `src/game/fighter.js` |
| Pouvoirs d'un combattant | `src/game/abilities/<id>.js` |
| Pouvoir **spécial** greffé (3<sup>e</sup> créneau) | bloc `special` de la fiche + `f.state.spec` dans le module |
| Mise en scène (rubans, fuseaux, nappes, ondes, nombres) | `src/render/flair.js` + `look.flair` de chaque fiche |
| **Son** : synthèse des bruitages et annonceur | `src/render/audio.js` |
| **Recettes de bruitage** (aucun fichier audio) | `src/data/sound.js` + `sound` de chaque fiche |
| Écrans DOM | `src/ui/select.js`, `src/ui/result.js`, `index.html`, `styles/style.css` |
| Libellés d'interface (les deux langues) | `src/ui/lang.js` |
| Câblage, boucle, seed, enregistreur | `src/main.js` |
| **Formats de partie** (duel, 2 contre 2, bataille royale) | `src/ui/select.js` (les camps) + `src/game/match.js` (le moteur) |

`elements.js` et `pixelmaps.js` ne sont que des **registres** : ils n'ont
aucune valeur de combattant. Les ouvrir pour changer une couleur est une erreur
de navigation, pas un besoin.

---

## Roster

**Sept combattants, tous jouables.** Cinq sont relevés sur trois vidéos
« ballthingsim » en 576 × 1024, 30 fps (*Outlaw vs Bladesman*, *Dragoon vs
Outlaw*, *Dragoon vs Magia*) ; **les deux derniers — le Golem et le Mannequin —
sont inventés**, aucune de leurs valeurs ne peut donc porter `mesuré`, tout y
est `calé` ou `déduit`.

| Personnage | Signature |
| --- | --- |
| `outlaw` **PISTOLERO** | tireur de glace, **canon asservi à la cible** (`weapon.spin = 0`), barillet de **10** et **0,345 s entre deux tirs** (6 et 0,6 mesurés, écarts demandés), balles gelantes (−30 % de vitesse, 1,6 s), `weaponTwirl` au rechargement. Porte le **Champ de givre**, greffé |
| `bladesman` **RONIN** | duelliste, rotation 0,80 → 3,00 tour/s puis surchauffe, `Damage = Spin` (mesuré `2 × Spin`, divisé par deux avec tout le roster), brûlure au contact. Porte l’**Aura de braise**, greffée |
| `lancer` **HOPLITE** | chargeur, **lance braquée sur le cap** (`weapon.spin = 0`), charge en ligne droite, **164 px, la plus longue portée du jeu**, +0,5 dégât par touche (mesuré +2, demandé +1, puis divisé par deux), **Foudre tombante** qui le sort de l'arène. Porte le **Dôme de drain**, greffé |
| `wind` **SHINOBI** | ninja sombre, **la bille est le shuriken** — sprite centré, hitbox en **disque** de 75 px. Porte le **Clone d'ombre** (voir plus bas) |
| `mage` **DRUIDE** / DRUID | tireur, **sceptre braqué posé sur le flanc et dessiné par-dessus la bille** (`weapon.spin = 0` + `weaponLateral` + `weapon.overBody`), **orbes guidées** (`projectiles.orb.homing`), cadence qui monte seule (+0,05 par orbe). Porte l’**Orage de ronces** et le **Tir enraciné** |
| `golem` **GOLEM** | **inventé, pas relevé.** Le plus lent (370 px/s), la portée la plus courte (100 px), le plus gros corps (**rayon 50** contre 41) et **200 PV** quand tout le monde en a 100 — sa seule défense, sans aucune réduction de dégâts. Onde sismique sur horloge, Éclats de roche, **Séisme** |
| `dummy` **MANNEQUIN** / DUMMY | **cible d'entraînement, pas un adversaire.** Aucune arme (pas de `head.sprite`, portée 0, hitbox de rayon 0), **aucun dégât**, aucun pouvoir, blanc, et les PV de la norme. Il existe pour qu'on **regarde l'autre** : sa ligne de HUD affiche les dégâts qu'il a **subis**, donc la production réelle de l'adversaire |

**Le Clone d'ombre**, parce qu'il touche le moteur : des doubles de 15 PV
(25 à l'origine, **un quart d'un combattant** — c'est le rapport qui borne le
pouvoir, pas le chiffre — puis descendu **sous** ce quart sur demande) qui
sont de **vrais combattants du tableau**, dans le camp du Shinobi, avec **tous
ses pouvoirs** — Clone d'ombre compris, donc **un clone invoque des clones**.
**Le groupe ne fait qu'un au HUD** (une plaque, PV cumulés, une paire de
jauges), **qu'un seul nom** au bandeau de victoire et au classement de fin, et
**ses pouvoirs battent à une horloge unique, partagée par référence** : ils
partent tous en même temps.

**Les identifiants internes ne sont pas les noms affichés**, et un id ne se
renomme pas : il n'est montré à personne et le changer toucherait `ROSTER`,
`abilities/index.js`, les trois registres, les noms de fichiers et les URL
d'archive. Seuls `name`/`nameRef` changent.

Les sept noms sont des **archétypes, pas des noms propres**, sur le patron de
SHINOBI. Trois conséquences :

- **l'article revient** : « le Pistolero », « l'Hoplite », « le Druide » ;
- **le genre suit le nom, pas le personnage** — « le Fer de lance » devient
  « **la** Charge de lance ». Un remplacement de jeton ne peut pas le savoir ;
- **`name` et `nameRef` peuvent rediverger** : un archétype **se traduit**
  (`DRUIDE`/`DRUID`), un nom propre non.

**Sept éléments supprimés.** Le dépôt a porté huit éléments relevés sur
*Elemental Armory League* ; sept ont été supprimés — ni fiche, ni module, ni
sprite, ni liste `DISABLED` — et le huitième, le Vent, survit sous les traits du
Shinobi. Ce qu'il en reste est **greffé sur un survivant** (Champ de givre,
Aura de braise, Dôme de drain, Orage de ronces, éclat de givre dans
`pixelart/outlaw.js`). Un commentaire qui cite un élément disparu parle d'une
**provenance**, pas d'un fichier à ouvrir.

**Relevé de matrice courant** (`tools/matrix-reference.txt`), 18 duels hors
miroir chacun : **Pistolero 13**, Druide 13, Shinobi 12, Hoplite 11, Golem 10,
**Ronin 4**, Mannequin 0 (il ne peut pas gagner, c'est sa définition).
Quatre changements successifs y sont empilés : **Neon Shadow a été supprimé**
(invariant 3 : il était en queue de `ROSTER`, sa suppression ne déplace donc
aucune autre ligne), puis **les dégâts de tous les combattants ont été divisés
par deux** — sur la fiche, pas au moteur (`opts.kind`/`Match.damage` ne
changent pas, chaque combattant porte sa propre division) —, puis un
**rééquilibrage confiné au Golem et au Ronin**, les deux plus faibles, puis un
**nerf confiné au Shinobi et au Pistolero**, les deux qui dominaient le plus.
`docs/FICHES.md` porte le détail par combattant et les relevés, avant/après.
Sur le rééquilibrage Golem/Ronin : Golem gagne `movement.speed` 370 → 420 et
`weapon.melee.damage` 4 → 7 (les deux leviers combinés font mieux que la
somme de leurs effets isolés, banc à dix duels par adversaire : 12/50 → 24/50
en combinant, contre 20/50 pour le dégât seul) ; Ronin gagne
`weapon.melee.onHit.dot.duration` 1 → 1,5 (5/50 → 8/50 au même banc). Le
Pistolero et le Shinobi restaient des murs pour les deux — rapides, à
distance, 0 ou 1/10 à chaque palier testé — écart structurel, connu et non
corrigé.
**Sur la matrice officielle à 3 seeds, le Golem reste à 8/18** (gagne un
affrontement au Hoplite, en perd un au Pistolero — net nul sur ces seeds
précises) **et le Ronin reste à 4/18** : le gain que le banc à 10 seeds montre
ne tombe pas dans les 3 seeds que joue `matrix.mjs`. Ce n'est pas une
contradiction, c'est la limite déjà documentée plus bas : une matrice à seed
unique peut cacher un écart aussi bien qu'elle peut l'exagérer.
Sur le nerf Shinobi/Pistolero, demandé directement en valeurs (pas de banc de
calage) : le Clone d'ombre naît à `special.aura.hp` 25 → 15 PV, sous le quart
d'un combattant qui bornait le pouvoir jusqu'ici ; le Pistolero tire à
`weapon.cooldown` 0,3 → 0,345 s (+15 %). Effet sur la matrice officielle,
avant → après : **Shinobi 16 → 12** (perd l'Hoplite, le Druide et le Golem —
le clone plus fragile meurt avant d'avoir pesé), **Pistolero 14 → 13** (perd
l'Hoplite, gagne le Shinobi — net −1, la cadence plus lente coûte plus qu'elle
ne rapporte face à un adversaire déjà touché par le nerf du Shinobi). Sans
qu'on ait touché à leur fiche : **Hoplite 9 → 11**, **Golem 8 → 10**, Druide
12 → 13 — encore le piège « le levier d'un combattant faible est parfois chez
un autre ».
**Diviser les dégâts par deux rallonge les duels**, comme diviser les PV les
aurait raccourcis — même levier, sens inverse : 41,2 s en moyenne au lieu de
26,3, et les deux mêmes combattants rebasculent que lors du changement de
norme de PV, dans le **même sens** cette fois (un duel plus long, par une autre
voie). Le **Shinobi bondit de 7 à 16** — ses clones s'invoquent entre eux, et
un duel deux fois plus long lui laisse le temps de doubler sa population deux
fois plus souvent. Le **Ronin s'effondre de 10 à 4** — ses dégâts plafonnent
(`Damage = Spin`, avec surchauffe), donc un duel plus long ne lui donne rien de
plus, seulement plus de temps pour se faire rattraper.
**Les six lignes `… vs dummy` sont un banc de DPS**, pas un relevé
d'équilibrage — et il **ne suit pas simplement la division**, cette fois non
plus : Pistolero 3,3, Ronin 3,1, Shinobi 3,1, Hoplite 3,0, Druide 2,8,
Golem 2,6 PV/s. La ligne `dummy vs dummy` finit en **`timeout`** : deux
combattants sans dégâts ne se départagent jamais, le moteur n'ayant aucune
limite de temps.
Écart **4 à 16** entre les six qui frappent, connu et non corrigé. **La matrice ne joue chaque paire qu'une fois, et
toujours dans le même sens : elle exagère les écarts, et peut aussi en cacher
un.** Le Golem le montre en grand — 5/15 dans un relevé antérieur, mais
**54/100** sur un banc à 10 seeds × les deux camps, parce qu'il est en queue de
`ROSTER` donc toujours camp B. Avant de conclure qu'un « dernier » doit
remonter, le remesurer **sur les deux camps**.
D'où vient l'écart, et les deux fois où la matrice a menti dans un sens puis
dans l'autre : `docs/PIEGES.md`.

---

## Formats de partie

Trois, et **un seul mécanisme** : le moteur reçoit une liste de combattants et
un camp pour chacun. Il ne sait pas ce qu'est un « 2 contre 2 » ; il sait qui
peut blesser qui.

| Format | `elements` | `teams` |
| --- | --- | --- |
| Duel | 2 identifiants | omis → `[0, 1]` |
| 2 contre 2 | 4 identifiants | `[0, 0, 1, 1]` |
| Bataille royale | 3 à 7 identifiants | omis → chacun le sien |

`ui/select.js` porte la table des formats et fabrique les camps ; `main.js` les
lit aussi depuis l'URL (`?f=a,b,c&teams=0,0,1`). Ajouter un format ne demande
**qu'une entrée dans cette table** — pas une ligne de moteur.

- **Les points de vie ne se règlent pas** — demandé. Il n'y a plus d'option de
  partie : le champ, ses bornes et le paramètre du moteur ont été **retirés**
  plutôt que masqués.
- **La norme est de 100 PV** (`MATCH.maxHp`), demandée — après un aller-retour :
  passée à 200 le temps d'une session, redivisée par deux sur demande. Modifier
  cette constante **change la durée des duels d'autant** et déplace donc la
  matrice entière : ce n'est pas un réglage confiné, c'est le rythme du jeu.
- **Mais `maxHp` est une valeur de fiche**, lue en une ligne par `Match`
  (`el.maxHp ?? MATCH.maxHp`) : absente de toutes les fiches sauf une, et à
  **200 chez le Golem**. À ne pas confondre avec le curseur retiré ci-dessus.
- **`Fighter.maxHp` est donc par combattant** (le Golem 200, le Clone d'ombre
  25), donc **rien ne doit diviser par une constante** : un seuil écrit en
  valeur absolue devient faux le jour où la grandeur qu'il compare cesse d'être
  constante, et il ne crie pas en devenant faux.
- **`MATCH.timeScale` règle la vitesse de déroulement, et vaut 1.** C'est un
  facteur de **temps réel consommé** (`acc += elapsed * timeScale` dans
  `core/loop.js`), pas un facteur de pas : la même suite de pas fixes est jouée,
  simplement étalée. Le mettre dans le pas (`update(SIM_DT * 0.5)`) changerait
  toutes les intégrations, donc les collisions limites, donc les vainqueurs.
- **Deux durées règlent la fin, à ne pas confondre** : `MATCH.victory.settle`
  est le temps de **mise en place**, `MATCH.victoryDuration` le temps **total**.
  Allonger la seconde tient l'image plus longtemps ; allonger la première
  ralentit l'animation.
- **Un bandeau nomme les vainqueurs pendant la parade**, dans l'arène : l'écran
  de résultat **n'est pas filmé**.
- **La matrice reste un outil de duel**, délibérément : elle est le garde-fou de
  non-régression du 1v1, la seule configuration dont l'équilibrage soit relevé.

Ce qui change à l'écran au-delà de deux — HUD en deux bandeaux, mort retirée
aussitôt, titre d'arène, placement en anneau, classement, parade à plusieurs :
`docs/PIEGES.md`.

---

## Langue

**L'application est en anglais, le dépôt est en français.** Deux règles
distinctes : ce que voit le joueur est en anglais (c'est la langue de la vidéo
de référence) ; le code, les commentaires, la doc, les réponses **et les
messages d'erreur console** restent en français.

Tout l'affichage passe par `src/ui/lang.js` : `UI.ref` (anglais) et `UI.fr`, aux
**clés strictement identiques**, plus l'aide `label()` qui choisit entre `name`
et `nameRef`. `?lang=fr` bascule l'ensemble.

Chaque fiche porte donc **les deux moitiés** de son identité : `name`/`nameRef`,
`tagline`/`taglineRef`, `weapon.name`/`.nameRef`, `ability`+`ultimate`
`.name`/`.nameRef`, `projectiles.*.label`/`.labelRef`, `hud.statFr`/`hud.stat`,
`ultimate.barLabelFr`/`.barLabel`.

**Ajouter un combattant sans ses champs `Ref` le fait retomber en français au
milieu d'un écran anglais** : `label()` a un repli silencieux (`nameRef ?? name`)
qui évite le plantage mais pas l'incohérence. `tools/lang-check.mjs` les
vérifie. `index.html` est écrit en anglais pour que la page soit correcte avant
le chargement du module, puis `applyStaticLabels()` la réécrit — c'est ce qui
empêche le HTML et la table de diverger sans que ça se voie.

---

## Son

**Aucun fichier audio, et ce n'est pas une contrainte subie** : les bruitages
sont **synthétisés** (`data/sound.js` porte les recettes, `render/audio.js` les
monte). Rien à charger, rien qui puisse manquer à la première touche, et un
timbre qui se **transpose par combattant**.

- **La fiche décide, comme pour les sprites.** Bloc `sound` : `pitch` et un nom
  de recette par créneau (`shot`, `hit`, `impact`, `bounce`, `ability`,
  `special`, `ultimate`). Le moteur ne connaît toujours aucun combattant : il
  joue le créneau, la fiche dit la matière. Un projectile peut nommer la sienne
  (`projectiles.x.sound`), et une fiche peut ajouter un créneau que son seul
  module lit (l'Hoplite : `strike`, la foudre qui tombe).
- **Chaque combattant a son jeu de bruitages, demandé — le chantier est clos.**
  Le banc avait d'abord été écrit en matières partagées : quatre combattants sur
  `blade`, **cinq sur `riser`**, le Pistolero jusqu'à emprunter `click`, le son
  de l'interface, pour son rechargement — la transposition (`pitch`) faisant
  seule la différence. Plus aucun créneau n'est partagé aujourd'hui, sauf
  `bounce` (`thud`, le mur, qui n'appartient à personne) et `impact` (le
  projectile générique). `riser` a été **supprimé** : sans lecteur, une recette
  est du poids mort, et `sound-check` la signale. Les recettes restent nommées
  par **matière**, jamais par combattant : c'est la fiche qui les attribue.
- **Deux combattants qui partagent une recette se font taire l'un l'autre** —
  `MIX.repeatGap` est indexé par recette, pas par combattant. Séparer `blade` en
  trois a donc fait passer **plus** de sons, pas moins (4393 → 4409 sur quinze
  duels), à sons perdus constants. Contre-intuitif, mesuré, détaillé dans
  `docs/PIEGES.md`.
- **Deux familles de recettes, et la seconde dit un *état*.** `SOUNDS` joue des
  **événements** ; `LOOPS` tient une voix tant qu'un état dure et en module la
  matière image par image (`sfx.swing`, déclaré par `sound.swing` dans la
  fiche). C'est ce qui manquait au Ronin, dont toute la fiche tient dans
  `Damage = Spin` : son cycle de rotation était **visible et muet**. Le régime
  est **mesuré sur `weaponAngle`**, jamais lu dans `weapon.spin`, qui n'en porte
  que le plancher — d'où, gratuitement, une lame ralentie par le givre qui
  siffle plus bas. Les quatre armes braquées du roster (`spin = 0`) restent
  muettes sans qu'aucun test ne les nomme.
- **Le son ne lit que de l'état déjà calculé** et n'écrit rien — même contrat
  que `flair.js`. Il ne tire ni dans `game.rng` ni dans `viewRng` (voir
  l'invariant 2) : sa dérive de hauteur passe par `Math.random`, exprès.
- **Trois créneaux n'ont demandé aucune ligne dans les huit modules** parce que
  le moteur voyait déjà passer l'événement : le tir (`Projectiles.spawn`), la
  touche (`Match.damage`) et l'ultime (la bascule de `f.ult.active`, déjà
  détectée pour l'éclat d'incantation). Seuls `ability` et `special` sont
  appelés par les modules, une ligne chacun.
- **L'annonceur parle la langue de l'écran** (`ui/lang.js`, clés `speech*`), et
  les noms lui sont passés **en minuscules** : une voix de synthèse épelle
  volontiers un mot tout en capitales.
- **Le son s'ouvre à un geste** et pas avant (`sfx.unlock()` sur le premier
  clic) : sans geste, `sfx` n'a pas de contexte et **tous ses appels sont des
  `return`** — c'est ce qui le rend gratuit pour `matrix.mjs` et `shot.mjs`.
- **La vidéo exportée porte les bruitages** — c'est l'objet de l'export, publier
  le duel. Le graphe se sépare en deux après le compresseur : une branche va aux
  enceintes, l'autre est une piste audio que `recorder.js` ajoute au flux du
  canvas. Trois conséquences :
  - **le MIME se choisit à chaque `start()`**, pas une fois pour la session : un
    conteneur qui ne nomme aucun codec audio donne un fichier muet, et le son
    peut n'être ouvert qu'au deuxième duel (il faut un geste) ;
  - **couper le son ne coupe que les enceintes** (le robinet est après la
    dérivation) : on regarde en silence, on publie avec le son. L'inverse
    livrerait un fichier muet sans prévenir ;
  - **un duel lancé sur `?a=…&b=…` est filmé muet** : personne n'a cliqué. La
    ligne d'export le dit (`with sound` / `no sound`), plutôt que de le laisser
    découvrir après publication.
- **La voix, elle, n'entre pas dans l'export et ne le pourra pas** :
  `speechSynthesis` sort hors de tout graphe `AudioContext`, aucune API ne
  permet de la router. Ce que la voix dit, **l'image le dit aussi** — le titre
  d'arène nomme les deux camps, le bandeau de parade nomme le vainqueur.

---

## Invariants — à ne jamais casser

1. **Fiches gelées.** `deepFreeze` + `assertFrozen()` à chaque duel. Un duel ne
   peut pas déteindre sur le suivant.

2. **Déterminisme.** `?seed=` doit rejouer un duel à l'identique, et le bouton
   « Revoir ce duel » en dépend.
   - `game.rng` = simulation. **Tout appel consomme le flux** : ajouter un
     `fx.burst()` dans un chemin de simulation décale tout ce qui suit et change
     les vainqueurs. Déjà arrivé deux fois.
   - `game.viewRng` = rendu seul. Toute décoration passe par lui, ou par un
     hachage pur (`hash01` dans `plant.js`).
   - `render/audio.js` a son propre aléa, et c'est **`Math.random`** : ni l'un
     ni l'autre des deux flux. Le premier changerait les vainqueurs, le second
     déplacerait le tremblement de caméra — donc l'image d'un duel rejoué à la
     même graine, que le bouton « Revoir ce duel » promet identique.
   - `render/flair.js` est **la** porte d'entrée pour ajouter du spectacle :
     aléa `viewRng`, banc de particules séparé, aucun accès à `game.rng`. Sa
     règle de composition : **rien entre le spectateur et les combattants** —
     remplir le cadre par le fond, les bords ou l'arrière du combattant, jamais
     par une nuée flottante.

3. **Équilibrage.** Après **tout** changement, comparer la matrice : un
   changement visuel doit la laisser **identique au fichier près**.
   `tools/matrix-reference.txt` ne se régénère que quand un changement
   d'équilibrage est **voulu et assumé**, et il faut alors le justifier.
   - **`ROSTER` décide qui est le camp A.** Les paires sont formées en
     `[liste[i], liste[j]]`, et le camp A pèse lourd. Un nouveau venu s'ajoute
     donc **en queue** ; preuve à vérifier : le diff de la matrice ne contient
     **que des ajouts**.
   - **Un changement confiné à un combattant ne doit déplacer que *ses*
     affrontements.** Une ligne déplacée ailleurs est un bug.
   - Le relevé historique du temps des douze combattants, et les leviers qu'il
     a livrés, sont dans `docs/FICHES.md`, section « Équilibrage du roster ».
     Il ne se régénère plus.

4. **Le décor ne bouge jamais** (cahier des charges) — rasterisé une fois dans
   `scene.js`, blitté en un `drawImage`.

5. **Deux rotations d'arme, à ne jamais confondre.** `weaponAngle` est la
   direction dans laquelle l'arme **pointe depuis le corps** (la faire tourner
   fait *orbiter* l'arme) ; `weaponTwirl` est sa rotation **propre** autour du
   milieu de sa carte (elle *vrille sur place*). Le centre de vrille est
   **déduit de la portée** (`(handle.length + reach) / 2`), pas mesuré sur le
   sprite.

6. **Convention de commentaire dans les fiches** : chaque valeur porte
   `mesuré` (relevé vidéo), `calé` (ajusté par simulation) ou `déduit`.
   Ne jamais changer une valeur `mesuré` sans nouveau relevé, et ne pas caler
   par réflexe : un `calé` doit être justifié par une mesure, pas par une
   intuition.

7. **Les compteurs génériques du `Fighter`.** `offstage`, `invulnerable`,
   `boost`, `ghosting`, `weaponLateral` et `weaponTwirl` ont tous la même
   forme : un module les allume, le moteur les décompte, et le moteur **ne sait
   pas pourquoi**. C'est la forme à reprendre pour tout nouvel effet accroché à
   un état de module.

8. **`alive` ≠ `onStage`.** Un combattant peut être vivant *et absent*
   (`Fighter.offstage`). **Toute boucle qui teste `f.alive` pour décider de le
   *voir* doit tester `f.onStage`** : `render/flair.js`, `physics.js`,
   `projectiles.js`, le rendu de `match.js`. Un oubli laisse un ruban ou une
   hitbox fantôme au dernier point connu.

9. **Une clé de fiche que plus personne ne lit ne crie pas.** Deux régressions :
   `lunge.recoil`/`hitRing` supprimés alors que le module les lisait encore
   (NaN dès la première touche), puis l'écriture de `weaponLateral` perdue,
   `lunge.lateral` restant sans lecteur — **le premier plante, le second
   jamais**. `tools/fiche-check.mjs` recoupe les deux sens, sur `weapon.lunge`
   et `special` seulement : `ability` criait à tort dix-neuf fois, et un
   garde-fou qui crie à tort n'est plus lu.

10. **Un ancrage d'arme se pose, il ne s'interpole pas.** `weaponLateral`
    bascule **dans l'image même** où la phase change. Interpoler, si vite que
    ce soit, fait *glisser* l'arme pendant la charge : elle court après la bille
    au lieu de former un bloc avec elle. Le saut est ce qu'on veut voir.

11. **Un décalage de dessin doit passer par le pivot, jamais par le seul
    `translate`.** `weaponPivot()` est lu par `drawWeapon()` **et** par
    `bladeSegment()` : décaler seulement le dessin ferait mentir le sprite sur
    l'endroit où il coupe.

12. **Le moteur ne connaît aucun combattant.** `fighter.js`, `physics.js` et
    `projectiles.js` lisent la fiche, jamais un `if (id === …)`. La hitbox en
    disque du Shinobi et le guidage des orbes du Druide l'ont éprouvé : **la
    forme se dit entièrement dans la fiche**, un autre combattant en hériterait
    sans une ligne de moteur, et la branche n'existe pas pour ceux qui ne la
    déclarent pas. Corollaire : un module qui code en dur une clé de sprite se
    ferme à sa propre réutilisation (`plant.js` et ses corolles roses).

13. **Le moteur accepte *n* combattants répartis en camps**, et leur nombre peut
    changer **en cours de partie** — et le duel passe toujours par ses propres
    expressions.
    - `Match({ elements, teams })` ; omis, chacun a son camp.
    - Le moteur ne connaît **que « même camp » ou « camp adverse »** : il n'y a
      ni équipe nommée, ni notion de format.
    - Les corps se bousculent entre **tous**, alliés compris ; armes et
      projectiles ne touchent que le camp adverse.
    - `f.opponent` = l'**ennemi vivant le plus proche**, recalculé une fois par
      pas. Les modules le lisent sans le tester.
    - `Match.join()` inscrit un combattant après le départ ; il ne tient à jour
      que les six choses indexées par rang, plus `flair.attach()`.
      **L'entrée est différée d'un pas** (`flushArrivals()` en fin de pas) :
      une `Map` de JavaScript **visite les entrées ajoutées pendant
      l'itération**, donc le nouveau venu tournerait dans l'image de sa
      naissance, avant son premier pas.
    - **Le duel garde ses expressions, littéralement** : partout où la
      généralisation aurait réécrit le chemin à deux, la branche `length === 2`
      reprend le code d'origine mot pour mot — la multiplication flottante n'est
      pas associative. Preuve exigée à chaque étape : **matrice identique au
      caractère près**.

---

## Outils (dans `tools/`)

```bash
python3 -m http.server 8085 &            # requis par les outils Playwright

node tools/fiche-snapshot.mjs            # empreinte des 5 fiches + 15 cartes,
                                         # SANS serveur. Le garde-fou des
                                         # refactorisations de `src/data/` :
                                         # doit rester identique au caractère près

node tools/fiche-check.mjs               # trois pannes silencieuses :
                                         #  • câblage (ROSTER / ELEMENTS / module)
                                         #  • clé de sprite absente de PIXEL_MAPS
                                         #  • fiche ↔ module (`weapon.lunge`, `special`)

node tools/lang-check.mjs                # les deux tables de ui/lang.js portent les
                                         # mêmes clés, et chaque fiche ses champs `Ref`

node tools/sound-check.mjs               # deux pannes muettes :
                                         #  • une action qui ne sonne pas (duels joués,
                                         #    sons comptés, par combattant)
                                         #  • une recette que l'AudioContext refuse

node tools/export-check.mjs              # le fichier exporté sonne-t-il vraiment ?
                                         # deux duels filmés (dont un son coupé),
                                         # relus puis **redécodés en PCM** : le compte
                                         # d'octets prouve la piste, le RMS le contenu

node tools/matrix.mjs                    # tous les affrontements x 3 seeds, sans rendu
node tools/matrix.mjs > /tmp/a.txt && diff tools/matrix-reference.txt /tmp/a.txt

node tools/probe.mjs outlaw              # durée, touches et coups/s d'un combattant
                                         # sur tout le roster

node tools/shot.mjs "?a=wind&b=outlaw&seed=5" /tmp/s 3,9,20
FORCE=bladesman:ult node tools/shot.mjs "?a=bladesman&b=outlaw" /tmp/s 8
                                         # les instants sont des secondes de
                                         # DUEL : l'outil lit `MATCH.timeScale`
                                         # et divise ses attentes par lui

python3 tools/frames.py <video.mp4> <dossier> <pas_s> [t0] [t1]
python3 tools/montage.py <dossier> <sortie.jpg> <cols> <lignes> <largeur> [début]
python3 tools/crop.py <image> <sortie.png> x0 y0 x1 y1 [zoom]
```

**Lequel pour quoi.** `fiche-snapshot` prouve qu'une **réorganisation** n'a rien
changé : il sérialise **les valeurs**, y compris celles qu'aucun duel n'exerce.
`matrix` prouve qu'un changement **visuel** n'a rien changé — il couvre le
**comportement**, que l'empreinte ne voit pas. Aucun ne remplace l'autre.

Vérification syntaxique (pas d'ESLint dans le dépôt) :
`for f in $(find src tools -name '*.js' -o -name '*.mjs'); do node --check "$f"; done`
— **insuffisant seul** : `node --check` analyse en script, pas en module, et a
déjà laissé passer un `};` orphelin qu'a trouvé le navigateur (`fiche-check`).

Poignée de debug exposée en page : `globalThis.__match`.

---

## Pièges déjà rencontrés — l'index

Une ligne par piège ; **la mesure, le balayage et l'histoire sont dans
`docs/PIEGES.md`**, sous les mêmes intitulés.

**Mesurer**

- Mesurer un angle contre la mauvaise référence donne une conclusion vraie et
  fausse à la fois → échantillonner **toute** la vidéo, et mettre les hypothèses
  **en concurrence** dans le même script.
- Un détecteur qui *sélectionne* ce qu'il mesure rapporte ce qu'on y a mis.
- Mesurer une orientation demande une **ACP, jamais un barycentre** — celui-ci
  suit la traînée et bascule sur un objet symétrique.
- Un mécanisme juste rend des chiffres qu'on n'a pas calés ; quand une hypothèse
  demande un paramètre par comportement observé, elle est fausse.
- Une cadence n'a de sens qu'en **nommant l'adversaire** (facteur 2,5 sur le
  même personnage).
- Une maquette ne contient pas toujours ce qu'on vient y chercher : transcrire
  quand c'est possible, **composer** sinon, et le dire en commentaire.

**Équilibrer**

- **Une arme braquée touche en permanence** : chaque arme braquée doit porter
  **son propre garde-fou** (dispersion, ou « ne blesse qu'en charge »).
- Une visée réécrite à chaque image touche toujours ; `ability.spread` est
  **raide** et se règle au banc, jamais à l'estime.
- Caler une cadence par le temps mort donne un personnage planté : se demander
  si c'est la **fréquence** de l'action ou son **taux de réussite** qui est faux
  (serrer `lunge.cone` *améliore* la cadence).
- Un banc qui plafonne dit que le levier n'est pas le bon → **mesurer d'où vient
  le dégât** (`opts.kind` dans `game.damage`) avant de balayer à l'aveugle —
  repayé sur le Golem, dont le pouvoir le plus voyant ne pèse que 9,7 %.
- La source du dégât dit *quoi* regarder, pas *quelle poignée tourner*.
- **Deux leviers qui marchent chacun ne s'additionnent pas** : en régler un,
  remesurer, et seulement ensuite en toucher un autre.
- **Le levier d'un combattant faible est parfois chez un autre** — et le pouvoir
  d'un combattant peut peser sur un troisième.
- **Une grosse barre de vie décide de la *forme* des affrontements** : le total
  se règle sur la fiche, la forme ne s'y règle pas (Golem, le double de tous).
- **Lire le banc ligne par ligne, pas seulement en total** : un total stable
  peut cacher une redistribution.
- Un balayage **non monotone** est du bruit : le paramètre n'équilibre pas, et
  son commentaire doit le dire.
- Un changement de formule (seuil d'arrondi) doit repasser par la matrice.
- **Regrouper autrement les mêmes produits change le résultat** (flottant non
  associatif) : le garde-fou n'est pas la relecture mais la matrice.
- Rééquilibrer un combattant : ne toucher que ses `calé` ou `déduit`.

**Déterminisme et ordre d'exécution**

- **Une décoration qui tire dans `game.rng` transforme un levier en bruit** : ça
  ne plante pas, ça fait **mentir un balayage**.
- **Vérifier la correction à la source, pas au symptôme** — une moitié corrigée
  ne se voit pas. *Reste à faire : `fx.burst` tire encore 4 fois par particule
  dans le flux de simulation, pour tout le roster ; le corriger déplacerait
  toute la matrice — chantier à part.*
- Un garde-fou du moteur réutilisé depuis un module hérite de **l'ordre d'appel**
  du moteur (corps → mêlée → pouvoirs → projectiles), pas seulement de sa
  géométrie : ce qui teste après coup arrive **derrière**. Ça ne se lit pas dans
  le code, **ça se compte**.
- Les minuteurs sont **figés** pendant `offstage`, pas suspendus : une chute
  doit reposer le verrou de mêlée comme le ferait `resolveMelee`.
- `offstage` ne doit pas expirer avant le module (marge de 0,1 s).
- `Match` appelle `Fighter.step()` **avant** `mod.update()` : le module lit un
  cap déjà intégré et déjà réfléchi par les rebonds du pas courant.

**Éditer les données**

- Un `re.sub` de calage qui déborde sur une autre fiche — arrivé deux fois, sans
  rien qui plante : un setter de balayage doit `assert` que son ancre est
  **unique**, et il faut relire le `git diff` avant de croire un chiffre.
- **La hauteur d'une carte d'arme ne coûte rien** (elle s'annule) ; la
  **largeur**, elle, déplace la pointe. **Sauf sous override PNG** : la largeur
  dessinée vient alors du *rapport d'aspect de l'image*, pas de `map.w` — c'est
  `map.h × scale × (img.w / img.h)` qu'il faut faire retomber sur `reach`.
- **`handle.length` + largeur dessinée doit toujours valoir la portée** — une
  valeur négative démarre en arrière de la bille (c'est voulu, Hoplite −44,
  Shinobi −75).
- Générer un sprite par une formule au lieu de transcrire la maquette :
  une formule interpole ce qu'on ne lui a pas demandé.
- Une icône redessinée à la main diverge de son arme → l'échantillonner sur le
  profil de l'arme.

**Interface et rendu**

- **Une moitié d'écran dans chaque langue** : tout passe par `ui/lang.js`. Une
  ligne y a échappé trois mois — un garde-fou sur l'**existence** d'un champ ne
  dit rien sur son **usage**.
- La fiche de sélection lit des valeurs qui peuvent être des **fonctions**, et
  des cas limites qui se lisent comme des bugs (`weapon.spin = 0`,
  `cooldown: Infinity`) : les replis sont dans `ui/select.js`.
- Le chiffre de PV n'a **pas** de contour dans ce moteur ; les nombres de dégâts
  en **ont** un — un remplissage noir s'y noie.
- **Assombrir un corps rend illisible tout ce qui était déjà sombre** : vérifier
  à l'écran (`tools/shot.mjs`) après tout changement de `look.body`.
- **Un corps blanc sur l'arène blanche demande quatre compensations** — contour,
  chiffre de PV, aura permanente, et un `bodyHit` qui **rougit** au lieu de
  blanchir (Mannequin).
- **Une passe de couleur incomplète n'est pas une passe de couleur** : faire le
  tour du bloc `look` **en entier**, `flair` compris.
- Une ruée a **un seul point de sortie** (`endRush()`, `endDash()`) : vitesse,
  pilotage et ouverture y sont remis **ensemble**.
- L'éventail est borné **en angle, jamais en nombre d'images**.
- **Un pouvoir s'ajoute sur un troisième créneau** (bloc `special` +
  `f.state.spec` + `specialBar(f)` optionnelle), il ne remplace pas l'ultime ;
  les deux rangées du HUD passent par le **même tracé** (`drawGauge`).
- Un élément sans `head.sprite` doit avoir une chaîne de repli sprite →
  projectile → icône à la sélection — et un **garde dans `drawWeapon`**, qui
  lisait `PIXEL_MAPS[undefined].h` (Mannequin).
- **Un combattant sans dégâts ne finit jamais son duel** : le moteur n'a pas de
  limite de temps, une partie ne s'arrête que par un mort.
- `imageSmoothingQuality = 'high'` coûtait 72 % du fil principal à l'export :
  rester en `'low'`. Et `captureStream()` ne s'appelle **qu'une fois par
  session**.
- **Un recul se règle en direction, pas en force** : son ampleur est un levier
  plat, le pilotage la ravale (Pistolero, +2 px quel que soit 200 à 420).
- **Un combattant à plusieurs corps ne se nomme qu'une fois** : dédoublonner par
  `el.id`, comme le HUD le fait déjà (bandeau de victoire, classement).
- Un pouvoir dessiné dans `drawOver` peut **recouvrir le chiffre de PV** : il
  est **repassé** après la boucle (`Fighter.drawHpNumber()`, appelée deux fois),
  `globalAlpha` remis à 1 avant.

**Sonoriser**

- **Un son ne s'ouvre qu'à un geste** : un `AudioContext` créé au chargement
  naît suspendu et reste muet tout le duel, **sans une erreur**.
- **Un plafond de voix qui se décrémente dans un rappel finit par ne plus
  redescendre** : compter des échéances, pas des voix.
- **Le même bruitage joué deux fois en 50 ms ne s'entend pas deux fois**, il
  sature : un garde-fou de répétition est aussi nécessaire qu'un `meleeCd`.
- **La synthèse vocale ne passe par aucun graphe audio** : elle ne peut donc
  ni se mixer, ni s'enregistrer, ni entrer dans la vidéo exportée. Ce que la
  voix dit, l'image doit le dire aussi.
- **Une piste audio dans le flux ne fait pas un fichier sonore** : le MIME doit
  nommer le codec audio, et seul un **redécodage en PCM** distingue une piste
  vivante d'une piste silencieuse — un encodeur à débit constant produit autant
  d'octets pour l'une que pour l'autre.
- **Un robinet de coupure placé avant la dérivation d'enregistrement livre une
  vidéo muette** sans que rien ne le dise.
- **Chercher l'endroit où l'image lit déjà l'événement** avant d'ajouter un
  état pour le son : trois créneaux sur cinq n'ont coûté aucune ligne aux huit
  modules.
- **Une arme que le moteur ne connaît pas doit dire qu'elle en est une**
  (`opts.sound` dans `damage`), sinon elle sonne comme un projectile perdu.
- **Une voix est une *couche*, pas un bruitage** : enrichir une recette se paie
  sur **les autres sons** (`MIX.maxVoices` refuse le son entier), et un son
  refusé ne plante pas — il manque. À remesurer à chaque combattant sonorisé,
  et **sur l'horloge du duel**, jamais sur celle du contexte audio.
- **Un garde-fou de couverture ne voit que ce qu'il exerce** : `sound-check`
  ne joue que des duels, donc il criait « recette morte » sur le clic des
  écrans DOM.
- **« Aucun instant à sonoriser » ne veut pas dire « rien à sonoriser »** : ce
  qui manquait au Ronin était un *état*, pas un événement — la bonne question
  est « quel état le joueur doit entendre », pas « quel instant sonoriser ».
- **Piloter une voix tenue par la fiche la fait sonner plate** : mesurer la
  grandeur réelle, la fiche n'en porte souvent que le plancher.
- **Une voix tenue n'a pas d'échéance** : la mettre dans le compteur de voix
  bloquerait une place du plafond pour toujours. Elle démarre au silence, et
  s'arrête six constantes de lissage après sa consigne, jamais à une.
- **Un pouvoir qui emprunte le son d'un accident devient un accident** : l'onde
  sismique du Golem jouait le bruit de ses propres rebonds sur le mur. Regarder
  ce que le combattant joue **déjà** avant d'attribuer une recette.

**Refactoriser**

- **Une refactorisation se mesure à ce qu'elle retire**, pas à ce qu'elle
  ajoute : le dépôt a porté des semaines une refonte « prête à l'emploi »
  jamais appliquée, qui a coûté deux fois.
- **Recompter avant de factoriser** : la duplication annoncée n'était pas là où
  on la cherchait (six clés identiques sur onze fiches, ~5 % des lignes).
- **Supprimer un combattant, ce n'est pas effacer ses fichiers** : rapatrier
  d'abord ce qu'il partage, vérifier la matrice, supprimer ensuite.
- **Le code mort d'un combattant supprimé ne se voit pas dans son dossier** — il
  faut le chercher, un crochet à la fois.
- **Prouver une réorganisation demande son propre garde-fou** : la matrice
  serait restée verte avec des fiches corrompues sur des valeurs qu'aucun duel
  ne lit. C'est `fiche-snapshot` qui les couvre.

---

## Habitudes attendues

- **Français** dans le code, les commentaires, la doc et les réponses — mais
  **anglais dans l'application**. Un nouveau combattant apporte ses champs `Ref`
  en même temps que sa fiche, et son bloc `sound` avec : sans lui il est
  **muet**, et rien ne crie à part `tools/sound-check.mjs`.
- Commentaires qui expliquent **pourquoi** (et citent la mesure), pas quoi.
- Après un changement **visuel** : capture de contrôle + matrice inchangée. Si
  la matrice bouge, le changement n'était pas visuel.
- Après un changement de **gameplay** : matrice régénérée + justification.
- Après une **réorganisation de `src/data/`** : `fiche-snapshot` identique.
- Tenir `README.md`, `docs/PIEGES.md`, `docs/FICHES.md` et
  `docs/AJOUTER-UN-COMBATTANT.md` à jour ; régénérer `docs/capture-*.png` quand
  le rendu change. **Une leçon nouvelle va dans `docs/PIEGES.md` et n'ajoute
  qu'une ligne ici** — ce fichier est relu à chaque session, les autres à la
  demande. Après un ajout de section dans `docs/PIEGES.md` ou `docs/FICHES.md`,
  recaler leur sommaire (`grep -n '^#\+ ' <fichier>`).
- **Tout se développe directement sur `main`.** Pas de branche `claude/*` : on
  commite sur `main` et on y pousse. Le dépôt **n'a plus qu'une branche** — les
  quatre branches de travail portaient trois rosters divergents qu'aucune fusion
  ne pouvait réconcilier. N'en recrée pas.
- Commits en français, corps détaillé, puis push sur `main`, et attendre que
  Pages ait publié.
