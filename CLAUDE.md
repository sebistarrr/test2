# CLAUDE.md — mémoire du projet

Duels **à deux, en 2 contre 2 ou en bataille royale**, avec cinq combattants
repris de la chaîne « ballthingsim » — Calamity, Cinder, Tempest,
le Shinobi et Briar — sur un moteur écrit d'après les vidéos de référence.
HTML + CSS + JS ES modules, Canvas 2D, **aucune dépendance, aucun build**.
Publié sur GitHub Pages à chaque push sur `main` → <https://sebistarrr.github.io/test2/>

**Lis ce fichier avant d'ouvrir quoi que ce soit d'autre**, puis va droit au
fichier concerné. Il porte la carte, les invariants, les pièges et les outils —
c'est-à-dire ce qui vaut pour *tout* le dépôt.

**Ce qu'il ne porte pas :** l'historique et les relevés **par combattant**, qui
sont dans `docs/FICHES.md` — à ouvrir seulement quand on travaille sur ce
combattant-là. Et la marche à suivre pour ajouter ou modifier un personnage,
qui est dans `docs/AJOUTER-UN-COMBATTANT.md`.

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
| Écrans DOM | `src/ui/select.js`, `src/ui/result.js`, `index.html`, `styles/style.css` |
| Libellés d'interface (les deux langues) | `src/ui/lang.js` |
| Câblage, boucle, seed, enregistreur | `src/main.js` |
| **Formats de partie** (duel, 2 contre 2, bataille royale) | `src/ui/select.js` (les camps) + `src/game/match.js` (le moteur) |
| **Ajouter / modifier un combattant** | `docs/AJOUTER-UN-COMBATTANT.md` |
| Relevés vidéo détaillés, par combattant | `docs/FICHES.md` |

`elements.js` et `pixelmaps.js` ne sont que des **registres** : ils n'ont
aucune valeur de combattant. Les ouvrir pour changer une couleur est une erreur
de navigation, pas un besoin.

---

## Roster

**Cinq combattants, tous jouables.** Ils viennent de la chaîne
« ballthingsim », relevés sur trois vidéos en **576 × 1024, 30 fps** :
*Outlaw vs Bladesman* (1159 images, 38,6 s), *Dragoon vs Outlaw* (33,6 s) et
*Dragoon vs Magia* (24,4 s).

| Personnage | Archétype | Signature |
| --- | --- | --- |
| `outlaw` Calamity | Pistolero de **glace** | **revolver de givre**, canon **asservi à la cible** (`weapon.spin = 0`), barillet de 6, balles qui **gèlent** (−30 % de vitesse, 1,6 s), et, au rechargement, **un tour complet du pistolet sur lui-même** (`weaponTwirl`). Porte en plus le **Vent de tombe**, greffé |
| `bladesman` Cinder | Duelliste | rotation 0,80 → 3,00 tour/s puis surchauffe, `Damage = 2 × Spin`, brûlure au contact. Porte en plus la **Rage infernale**, greffée |
| `lancer` Tempest | Chargeur | **la lance suit le cap** (`weapon.spin = 0`), **charge** en ligne droite avec la lance de **164 px, la plus longue portée du jeu**, dégâts +2 par touche, et la **Foudre tombante** qui le sort de l'arène. Porte en plus le **Lien d'essence**, greffé |
| `wind` Shinobi | Ninja | la **bille est le shuriken** — sprite centré, hitbox en **disque** de 75 px tout autour. Palette sombre. Porte le **Clone d'ombre**, conçu pour lui : des clones de 15 PV, permanents, solides, qui ripostent |
| `mage` Briar | Tireur | **sceptre braqué, posé sur le flanc et dessiné par-dessus la bille** (`weapon.spin = 0` + `weaponLateral` + `weapon.overBody`), qui envoie des **orbes guidées** (`projectiles.orb.homing`). Sa stat est une **cadence de tir qui monte seule**, +0,05 par orbe tirée. Porte la **Ronceraie** et le **Tir enraciné** — des racines le clouent au sol 1 s pour une **orbe majeure** à 3 × les dégâts |

**Les identifiants internes ne sont pas les noms affichés**, et l'écart est
volontaire. Un id ne se renomme pas : il n'est montré à personne, et le changer
toucherait `ROSTER`, `abilities/index.js`, les trois registres, les noms de
fichiers et les URL d'archive — sans rien apporter au joueur. Seuls
`name`/`nameRef` changent.

| id | affiché | d'où vient l'id |
| --- | --- | --- |
| `outlaw` | **CALAMITY** | son archétype d'origine, le hors-la-loi de la vidéo |
| `bladesman` | **CINDER** | idem, le bretteur |
| `lancer` | **TEMPEST** | idem, le lancier |
| `wind` | **SHINOBI** | le Vent, dont il est le reskin |
| `mage` | **BRIAR** | son archétype d'origine |

Le roster est donc passé de noms d'**archétypes** à des **noms propres** : un
nom propre ne se traduit pas, `name` et `nameRef` sont identiques pour les
cinq, et seuls les descriptifs (rôle, arme, pouvoirs) portent encore les deux
langues. C'est aussi pourquoi la documentation dit « Calamity » et non « le
Calamity » : un nom propre perd son article.

Le détail de chacun — relevés, écarts, historique des demandes — est dans
`docs/FICHES.md`, une section par combattant.

### Le repère de mesure n'est pas le même partout

Les deux premières vidéos se convertissent **×1,25** vers le repère logique
720 × 1280 du jeu. **Celle de Magia, non : ×1,275** — son arène mesure 502 px
de bord extérieur contre 640 dans le jeu, et la bille le confirme (32 px de
rayon × 1,275 = 40,8, soit les 41 du roster). Ne pas supposer le facteur : le
mesurer sur l'arène, le vérifier sur la bille. Chaque valeur convertie cite sa
mesure d'origine en commentaire ; ne jamais « corriger » un commentaire qui
cite un chiffre en 576.

Ce qui **n'a pas** été reporté tel quel : les vitesses et les cadences. Le jeu
d'origine tournait sous Matter.js à pas fixe, celui-ci intègre à la main et
pilote au cap. Ces valeurs-là sont donc `calé`, mesure d'origine en commentaire.

### Huit éléments supprimés

Le dépôt a longtemps porté huit **éléments** relevés sur les vidéos *Elemental
Armory League* — Ombre, Glace, Feu, Eau, Lumière, Foudre, Vent, Plante. Sept
ont été gelés, puis **supprimés** ; le huitième, le Vent, survit sous les traits
du Shinobi.

Ils ne sont pas masqués, ils ne sont plus là : ni fiche, ni module, ni sprite,
ni liste `DISABLED`. Ce qu'il en reste est **greffé sur un survivant** et
documenté comme tel — le Vent de tombe chez Calamity, la Rage infernale chez
Cinder, le Lien d'essence chez Tempest, la Ronceraie chez Briar, l'éclat de givre dans `pixelart/outlaw.js`. Un commentaire qui cite un
élément disparu parle donc d'une **provenance**, pas d'un fichier à ouvrir.

**Relevé de matrice courant** (`tools/matrix-reference.txt`), sur 12 duels hors
miroir chacun : Tempest 11, Cinder 6, Briar 5, Calamity 4, Shinobi 4.

Écart **4 à 11**, et il s'est **creusé** au dernier relevé : il était de 4 à 9.

**La cause n'est pas un réglage, c'est le gel de l'attente d'avant-combat.**
Les combattants se déplaçaient pendant la seconde d'ouverture — ce n'était donc
pas une attente mais un début de course, et aucun duel ne partait vraiment des
deux points de départ mesurés. Les figer était demandé, et c'est aussi plus
juste au regard du relevé ; mais partir des vrais points de départ **profite à
Tempest** (9 → 11), dont la charge en ligne droite aime les longues lignes de
vue, et coûte au Shinobi (6 → 4).

C'est un déséquilibre connu et non corrigé : le corriger demanderait un
rééquilibrage complet, qui est un autre chantier que celui qui l'a produit.

**Attention à la convention de la matrice quand on juge un écart.** Elle ne
joue chaque paire qu'**une fois**, donc chacun est toujours du même côté, et le
camp A pèse lourd (invariant 3). Le banc des **deux camps** donne une image
sensiblement plus plate : avant ce réglage, Calamity 10/24 et Cinder 9/24
là où la matrice officielle disait 3/12 et 3/12. Un combattant « dernier » à la
matrice ne l'est pas forcément au jeu — vérifier sur les deux camps avant de
conclure qu'il faut le remonter.

---

## Formats de partie

Trois, et **un seul mécanisme** : le moteur reçoit une liste de combattants et
un camp pour chacun. Il ne sait pas ce qu'est un « 2 contre 2 » ; il sait qui
peut blesser qui.

| Format | `elements` | `teams` |
| --- | --- | --- |
| Duel | 2 identifiants | omis → `[0, 1]` |
| 2 contre 2 | 4 identifiants | `[0, 0, 1, 1]` |
| Bataille royale | 3 à 5 identifiants | omis → chacun le sien |

**Les points de vie se règlent par combattant** (`hp`, un tableau dans le même
ordre ; 100 par défaut, bornés 1–999). C'est le levier le moins cher pour
compenser un déséquilibre sans toucher à une fiche — et le seul qui ne demande
pas de repasser la matrice, puisqu'elle joue toujours à 100.

`Fighter.maxHp` porte la valeur ; **rien ne doit plus diviser par une
constante**. Le cerclage rouge de danger le faisait (`hp > 25`) : à 500 PV il ne
se serait jamais allumé, à 20 PV il l'aurait été d'entrée. C'est passé à un
quart de `maxHp` — soit toujours 25 au défaut. La leçon vaut au-delà : **un
seuil écrit en valeur absolue devient faux le jour où la grandeur qu'il compare
devient réglable**, et il ne crie pas en devenant faux.

`ui/select.js` porte la table des formats et fabrique les camps ; `main.js` les
lit aussi depuis l'URL (`?f=a,b,c&teams=0,0,1`). Ajouter un format (3 contre 3,
deux équipes de trois, un contre tous) ne demande **qu'une entrée dans cette
table** — pas une ligne de moteur.

**Ce qui change à l'écran au-delà de deux :**

- **le HUD se sépare en deux bandeaux**. Les points de vie montent **en haut de
  l'écran** — une plaque par combattant dans la bande vide au-dessus du titre —
  et le bas garde ce que le duel y met : jauge d'ultime, jauge de pouvoir
  spécial et ligne de stat, pour **chaque** combattant. Les deux bandeaux
  partagent le même ordre de placement (`placer()` dans `render/hud.js`), donc
  un combattant est à la même colonne et à la même rangée dans les deux — sinon
  l'œil cherche deux fois. En duel, rien ne change : les deux grandes jauges
  mesurées restent, et les points de vie restent sur la bille ;
- **un mort quitte le terrain tout de suite**. En duel, la première mort finit
  le combat et le perdant reste en place pendant le K.O. au ralenti, qui est la
  belle image du duel. À plusieurs, le laisser gisant encombrerait l'arène pour
  tout le reste de la partie : il disparaît, et seul le dernier tombé reste le
  temps du K.O. final ;
- **le titre d'arène**. À deux, le bandeau relevé sur la vidéo. Au-delà, les
  noms se suivent, groupés par camp, et les icônes tombent : cinq icônes de
  28 px et quatre « VS » ne tiennent pas dans la largeur de l'arène ;
- **le placement**. Les deux points de départ sont mesurés et ne servent qu'au
  duel ; à trois et plus, un anneau centré, chacun tourné vers le centre — seule
  disposition qui ne donne à personne deux voisins immédiats quand les autres
  n'en ont qu'un ;
- **l'écran de fin** gagne un classement, du vainqueur au premier tombé ;
- **la parade se joue à plusieurs**. Un 2 contre 2 se gagne à deux : les deux
  survivants glissent au centre, écartés de `victory.pairGap`, et grandissent
  ensemble. Ne mettre en scène que `this.winner` laissait son coéquipier figé
  là où il se trouvait, ce qui se lisait comme un bug.

**Deux durées règlent la fin, à ne pas confondre.** `MATCH.victory.settle` est
le temps de **mise en place** — glissement, ressort d'échelle, nappe de
lumière ; `MATCH.victoryDuration` est le temps **total**. Allonger la seconde ne
fait que tenir l'image plus longtemps. Sans cette séparation, ajouter une
seconde d'affichage **ralentissait toute l'animation** au lieu de laisser le
temps de lire — l'inverse de ce qu'on voulait.

**Un bandeau nomme le ou les vainqueurs pendant la parade**, dans l'arène. Le
nom n'apparaissait qu'à l'écran de résultat, qui **n'est pas filmé** : la vidéo
exportée se terminait donc sans jamais dire qui avait gagné.

**La matrice reste un outil de duel**, et c'est délibéré : elle est le garde-fou
de non-régression du 1v1, la seule configuration dont l'équilibrage soit relevé.
Un banc multi-combattants serait une autre mesure, pas la même en plus grand.

---

## Langue

**L'application est en anglais, le dépôt est en français.** Deux règles
distinctes, à ne pas confondre :

- **ce que voit le joueur** est en anglais — c'est la langue de la vidéo de
  référence (`DARK`, `HAILFIRE`, `Damage: 5.50`), donc celle du HUD, du titre
  d'arène et des écrans DOM ;
- **le code, les commentaires, la doc et les réponses** restent en français.
  Les messages d'erreur console aussi : ils s'adressent à qui développe.

Tout l'affichage passe par `src/ui/lang.js` : une table `UI.ref` (anglais) et
`UI.fr` (français), aux **clés strictement identiques**, plus l'aide `label()`
qui choisit entre `name` et `nameRef`. `?lang=fr` bascule l'ensemble.

Chaque fiche porte donc **les deux moitiés** de son identité :

| Français | Anglais | Où c'est lu |
| --- | --- | --- |
| `name` | `nameRef` | titre d'arène, cartes, écran de fin |
| `tagline` | `taglineRef` | rôle de la carte + ligne « Role » |
| `weapon.name` | `weapon.nameRef` | ligne « Weapon » |
| `ability.name` / `ultimate.name` | `.nameRef` | lignes « Ability » / « Ultimate » |
| `projectiles.*.label` | `.labelRef` | ligne « Projectile » |
| `hud.statFr` | `hud.stat` | ligne de stat du HUD |
| `ultimate.barLabelFr` | `ultimate.barLabel` | jauge d'ultime |

**Ajouter un combattant sans ses champs `Ref` le fait retomber en français au
milieu d'un écran anglais** : `label()` a un repli silencieux (`nameRef ?? name`)
qui évite le plantage mais pas l'incohérence. `tools/lang-check.mjs` les
vérifie.

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
     aléa `viewRng`, banc de particules séparé, aucun accès à `game.rng`. Y
     ajouter un effet ne peut pas casser l'équilibrage. Sa règle de
     composition : **rien entre le spectateur et les combattants**. Remplir le
     cadre par le fond (nappe de sol), les bords (ondes de mur) ou l'arrière du
     combattant (ruban, sillage) — jamais par une nuée flottante, essayée puis
     retirée pour cette raison.

3. **Équilibrage.** Après **tout** changement, comparer la matrice : un
   changement visuel doit la laisser **identique au fichier près**.
   `tools/matrix-reference.txt` ne se régénère que quand un changement
   d'équilibrage est **voulu et assumé**, et il faut alors le justifier.
   - **`ROSTER` décide qui est le camp A.** Les paires sont formées en
     `[liste[i], liste[j]]`, et le camp A pèse lourd. Un nouveau venu s'ajoute
     donc **en queue** : inséré ailleurs, il déplacerait le camp A
     d'affrontements existants et changerait leur issue sans qu'aucune valeur
     de fiche n'ait bougé. Preuve à vérifier : le diff de la matrice ne doit
     contenir **que des ajouts**.
   - **Un changement confiné à un combattant ne doit déplacer que *ses*
     affrontements.** Une ligne déplacée ailleurs est un bug, pas un effet de
     bord acceptable.
   - Le relevé historique du temps des douze combattants, et les leviers qu'il
     a livrés (Tempest à 30/30, Calamity à 25…), sont dans `docs/FICHES.md`,
     section « Équilibrage du roster ». Il ne se régénère plus.

4. **Le décor ne bouge jamais** (cahier des charges) — rasterisé une fois dans
   `scene.js`, blitté en un `drawImage`.

5. **Deux rotations d'arme, à ne jamais confondre.** `weaponAngle` est la
   direction dans laquelle l'arme **pointe depuis le corps** : la faire tourner
   fait *orbiter* l'arme autour de la bille, comme une aiguille d'horloge.
   `weaponTwirl` est la rotation **propre** de l'arme autour du milieu de sa
   carte : elle la fait *vriller sur place*. Le rechargement de Calamity a
   été écrit avec la première avant d'être repris avec la seconde. Le centre de
   vrille est **déduit de la portée** (`(handle.length + reach) / 2`), pas
   mesuré sur le sprite, ce qui le garde cohérent avec la pointe.

6. **Convention de commentaire dans les fiches** : chaque valeur porte
   `mesuré` (relevé vidéo), `calé` (ajusté par simulation) ou `déduit`.
   Ne jamais changer une valeur `mesuré` sans nouveau relevé. Et ne pas caler
   par réflexe : la vitesse de Tempest a été mesurée à 540 px/s et **gardée**,
   parce que le banc a montré qu'elle ne cassait rien (15/30 contre 16/30 à
   470). Un `calé` doit être justifié par une mesure, pas par une intuition.

7. **Les compteurs génériques du `Fighter`.** `offstage`, `invulnerable`,
   `boost`, `ghosting`, `weaponLateral` et `weaponTwirl` ont tous la même
   forme : un module les allume, le moteur les décompte, et le moteur **ne sait
   pas pourquoi**. `ghosting` dit « sème des images fantômes », il n'est lu que
   par `render/flair.js`, donc l'allumer ne peut rien changer au duel. C'est la
   forme à reprendre pour tout nouvel effet accroché à un état de module.

8. **`alive` ≠ `onStage`.** Un combattant peut être vivant *et absent* :
   `Fighter.offstage` le retire du déplacement, des collisions, des touches, des
   projectiles, du rendu et de toute la mise en scène. Le moteur ne sait pas
   *pourquoi* il est parti — seul son module le sait (la Foudre tombante de Tempest).
   **Toute boucle sur les combattants qui teste `f.alive` pour décider de le
   *voir* doit tester `f.onStage`** : `render/flair.js` (six boucles),
   `physics.js`, `projectiles.js` et le rendu de `match.js`. Un oubli laisse un
   ruban, une nappe ou une hitbox fantôme au dernier point connu.

9. **Une clé de fiche que plus personne ne lit ne crie pas.** Deux régressions
   du même type : `lunge.recoil` et `lunge.hitRing` supprimés alors que le
   module les lisait encore (`push(..., undefined)` → NaN dès la première
   touche) ; puis l'écriture de `weaponLateral` perdue dans une réécriture,
   `lunge.lateral` restant dans la fiche sans lecteur. Le premier cas plante
   bruyamment, **le second jamais** : l'arme cesse simplement de se décaler.
   `tools/fiche-check.mjs` recoupe désormais les deux sens. Il ne couvre que
   `weapon.lunge` et `special`, et c'est délibéré — `ability` a été essayé et
   criait à tort dix-neuf fois, or un garde-fou qui crie à tort n'est plus lu.

10. **Un ancrage d'arme se pose, il ne s'interpole pas.** `weaponLateral`
    bascule entre `lunge.lateral` et zéro **dans l'image même** où la phase
    change. La première version le rapprochait à vitesse bornée pour éviter un
    saut : c'était une erreur de lecture, parce qu'une interpolation, si rapide
    soit-elle, fait *glisser* l'arme pendant la charge — donc elle court après
    la bille au lieu de former un bloc avec elle. Le saut est exactement ce
    qu'on veut voir.

11. **Un décalage de dessin doit passer par le pivot, jamais par le seul
    `translate`.** `weaponPivot()` est lu par `drawWeapon()` **et** par
    `bladeSegment()` : décaler seulement le dessin ferait mentir le sprite sur
    l'endroit où il coupe. Même discipline que `handle.length`, dont la somme
    avec la carte doit retomber sur la portée.

12. **Le moteur ne connaît aucun combattant.** `fighter.js`, `physics.js` et
    `projectiles.js` lisent la fiche, jamais un `if (id === …)`. La hitbox en
    disque du Shinobi l'a éprouvé : `hitbox.from` et `to` à zéro confondent les
    deux bouts du segment tranchant sur le pivot, `segmentPointDistance` traite
    déjà le cas dégénéré, et **la forme de la hitbox se dit entièrement dans la
    fiche** — sans une ligne de moteur. Le guidage des orbes de Briar est le
    second cas : `projectiles.orb.homing` décrit un virage borné, et
    `projectiles.js` l'applique en visant « le premier combattant en scène qui
    n'est pas le tireur » — exactement le test que fait déjà sa boucle de
    touche. Un autre combattant en hériterait sans une ligne de moteur, et la
    branche n'existe pas pour ceux qui ne la déclarent pas : les affrontements
    d'avant sont restés identiques au caractère près.

    **Corollaire pour les modules de pouvoirs.** Un module qui code en dur une
    clé de sprite se ferme à sa propre réutilisation : `plant.js` dessinait
    `'flower'` en littéral, ce qui faisait voler des corolles **roses** dans la
    tempête verte de Briar. Les deux littéraux concernés (la corolle, la gerbe
    d'éclatement d'un bulbe) sont passés en clés de fiche **avec le littéral
    d'origine en repli**, donc la Plante ne change pas d'un pixel — matrice
    vérifiée identique.

13. **Le moteur accepte *n* combattants répartis en camps** — et le duel passe
    toujours par ses propres expressions.

    Cet invariant disait l'inverse (« deux combattants, et ce n'est pas près de
    changer »). Il est tombé en ajoutant le 2 contre 2 et la bataille royale, et
    la surprise est que ça a coûté peu : le couplage réputé « de bout en bout »
    tenait en **vingt lignes de `match.js` et trois de `fighter.js`**.
    `physics.js`, `projectiles.js`, `flair.js`, le HUD et le décor prenaient déjà
    leurs arguments. **Recompter avant de croire un couplage sur parole** — le
    dépôt a déjà payé la leçon inverse en cherchant une duplication qui n'était
    pas là où on la disait.

    Ce qui structure le code désormais :

    - `Match({ elements, teams })` — `elements` est une liste d'identifiants,
      `teams` le camp de chacun. Omis, chacun a le sien : à deux, c'est le duel ;
      au-delà, la bataille royale. `[0,0,1,1]` fait un 2 contre 2.
    - Le moteur ne connaît **que « même camp » ou « camp adverse »**. Il n'y a
      ni notion d'équipe nommée, ni de format : « 2 contre 2 » et « chacun pour
      soi » sont deux façons de remplir `teams`, décidées par `ui/select.js`.
    - Les corps se bousculent entre **tous**, alliés compris ; les armes et les
      projectiles ne touchent que le camp adverse.
    - `f.opponent` devient l'**ennemi vivant le plus proche**, recalculé une fois
      par pas. Les modules le lisent sans le tester, comme avant.

    **Et le duel garde ses expressions, littéralement.** Partout où la
    généralisation aurait réécrit le chemin à deux — placement, collisions,
    mêlée, index de stats, fin de partie — la branche `length === 2` reprend le
    code d'origine mot pour mot. Ce n'est pas de la prudence de principe : la
    multiplication flottante n'est pas associative, et regrouper autrement les
    mêmes produits a déjà déplacé deux affrontements où le combattant modifié
    n'était même pas. Preuve exigée à chaque étape : **matrice identique au
    caractère près**.

    Ce qui n'a pas changé : une entité qui n'est pas un combattant du tableau
    (les clones du Shinobi) reste **confinée à son module**, coiffée du prototype
    `Fighter` (`Object.setPrototypeOf`) pour hériter du rendu sans le dupliquer.
    Contrepartie assumée : elle ne se déplace pas.

---

## Écarts volontaires au relevé

Les écarts **par combattant** — arme de Tempest remplacée par une maquette,
reskin de Cinder en lame de braise, Shinobi en ninja sombre — sont détaillés
dans `docs/FICHES.md`. Ce qui suit vaut pour tout le dépôt.

- **Trois vrais PNG dans un dépôt « sans binaire »** : la lame de Cinder, le
  shuriken du Shinobi (deux versions, flamme et ombre). `assets/sprites/manifest.json`
  fait pointer une clé de `PIXEL_MAPS` sur un fichier ; la carte pixel-art reste
  comme **repli automatique** (`render/sprites.js`). C'est cette couche
  d'indirection qui rend un changement d'apparence réversible en une ligne de
  JSON.
- **Fond hors-arène** : la vidéo est sur papier crème, le site est en **encre
  sombre `#1c1a26`**. L'arène reste blanche → le pixel-art garde ses contours
  noirs mesurés. Le « chrome » posé sur le fond sombre passe à un liseré crème
  `STAGE.outline` ; les jauges gardent une plaque crème.
- **L'arène est blanche, et ça contraint toutes les palettes.** Un jaune pâle,
  un grain de poudre quasi blanc, un gris clair n'y existent pas. La traînée de
  Tempest est donc en ambres saturés (`#f0b400`) et non en jaunes clairs ; la
  poudre de givre de Calamity en bleus tenus ; le shuriken sombre du Shinobi
  plafonné à 168/255. Même leçon que le mode additif, qui ne fonctionnait que
  sur le cadre sombre.
- **Deux modes de traînée, `electric` et `powder`, et chaque règle de l'un est
  l'inverse de l'autre.** L'électrique est un **trait** continu et cassé, dont
  l'écart s'annule au point le plus récent, à `rate` élevé pour grésiller. La
  poudre est un nuage de **grains isolés**, dont l'écart **s'ouvre** en
  s'éloignant du combattant, à `rate` bas pour tenir en place, posée sur une
  **nappe** large et transparente sans laquelle les grains se lisent comme des
  taches détachées. Trois choses font tenir l'électrique, chacune payée : le
  trait doit être **continu** (des points très écartés se referment en chapelet
  de perles), la cassure doit être **perpendiculaire** à la trajectoire (sinon
  le trait s'allonge au lieu de zigzaguer), et son amplitude doit **s'annuler au
  point le plus récent** (sinon la traînée se décroche et flotte à côté). Les
  Tout le roster passe par ce code ; seul celui qui déclare le mode prend la
  branche.
- **Les arcs électriques le long d'une lame** (`look.flair.weaponArc`) sont
  tracés par un **hachage pur** de (indice, temps quantifié), pas par un
  tirage : un aléa consommé dans une méthode de *dessin* dépendrait du nombre
  d'images affichées, qui n'est pas le nombre de pas de simulation, et deux
  machines au même `?seed=` verraient des décorations différentes. Deux réglages
  appris à l'image : `rate` décide si c'est de l'électricité ou du bruit (18
  paliers par seconde), et l'amplitude doit **dépasser la demi-épaisseur du
  sprite**, sinon les arcs restent dans la silhouette qui les recouvre.
- **Les largeurs d'aura et de ruban se règlent à l'image, pas au calcul.** Une
  aura à 26 px formait une **gélule** qui délavait la hampe au lieu de la cerner
  (14 la borde) ; un coin de pénétration à 60 × 26 se lisait comme une **boule**
  collée à la pointe (82 × 12 le rend élancé) ; un ruban de 18 px se referme en
  barres pâles détachées pendant une charge, où la pointe parcourt 224 px en
  0,16 s (13 px tient). Et la largeur des passes d'aura calculée en `1/k` mettait
  la passe **la plus large en dernier**, donc le cœur opaque délavait l'arme au
  lieu de la cerner.
- **HAILFIRE ne teinte pas l'arène.** Sur sa vidéo, l'arène entière vire au
  crème pendant l'ultime de Calamity. Ici le décor est rasterisé une fois et
  **ne bouge jamais** (invariant 4) : la lumière se pose donc au sol.
- Filigrane `@ElementalArmoryLeague` non reproduit — ni le « ballthing.com » /
  « @ballthingsim » des vidéos des trois invités.

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

node tools/matrix.mjs                    # tous les affrontements x 3 seeds, sans rendu
node tools/matrix.mjs > /tmp/a.txt && diff tools/matrix-reference.txt /tmp/a.txt

node tools/probe.mjs outlaw              # durée, touches et coups/s d'un combattant
                                         # sur tout le roster

node tools/shot.mjs "?a=wind&b=outlaw&seed=5" /tmp/s 3,9,20
FORCE=bladesman:ult node tools/shot.mjs "?a=bladesman&b=outlaw" /tmp/s 8

python3 tools/frames.py <video.mp4> <dossier> <pas_s> [t0] [t1]
python3 tools/montage.py <dossier> <sortie.jpg> <cols> <lignes> <largeur> [début]
python3 tools/crop.py <image> <sortie.png> x0 y0 x1 y1 [zoom]
```

**Lequel pour quoi.** `fiche-snapshot` prouve qu'une **réorganisation** n'a rien
changé : il sérialise **les valeurs**, y compris celles qu'aucun duel
n'exerce. `matrix` prouve qu'un changement **visuel** n'a rien changé — il
couvre le **comportement**, que l'empreinte ne voit pas. Les deux sont
complémentaires, aucun ne remplace l'autre.

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

### Mesurer

- **Mesurer un angle contre la mauvaise référence donne une conclusion vraie et
  fausse à la fois.** Le deuxième relevé de la lance concluait « elle vise
  l'adversaire, à ±5° ». C'était exact **sur les images mesurées** — mais elles
  avaient toutes été prises pendant que Tempest fonçait *sur* l'adversaire,
  là où cap de déplacement et cap adverse se confondent. Deux gardes-fous en
  sortent : échantillonner **toute** la vidéo et pas les plages où le détecteur
  marche bien ; et mettre les hypothèses **en concurrence** dans le même script
  plutôt que d'en vérifier une seule.
- **Un détecteur qui *sélectionne* ce qu'il mesure rapporte ce qu'on y a mis.**
  Le troisième relevé de la lance retenait les images « bien allongées » — donc
  celles contenant le **cadre noir de l'arène**, une droite parfaite que l'ACP
  privilégie. Le relevé de l'arrêt avant charge ne retenait un déclenchement que
  si `v[i-1] < 0,35 × v[i]`, puis rapportait qu'il y avait un creux. Les deux
  chiffres ont été **retirés** (voir `docs/FICHES.md`).
- **Un détecteur qui suit la traînée, pas l'arme.** Le premier portage donnait
  à Tempest une rotation d'arme de 327 °/s « mesurée » : le relevé prenait le
  barycentre des pixels lointains, et pendant une charge ce sont les **images
  fantômes**. Mesurer une orientation demande une **ACP, jamais un barycentre**
  — un barycentre bascule d'un bout à l'autre d'un objet symétrique, et se
  laisse tirer par tout ce qui traîne.
- **Un mécanisme juste rend des chiffres qu'on n'a pas calés.** C'est le
  meilleur test disponible. `weaponAngle = heading` produit tout seul l'angle
  figé une demi-seconde en ligne droite, le saut de 85° au rebond mural, et les
  33 °/s médians de rotation — aucun de ces trois nombres n'est écrit nulle
  part. Quand une hypothèse demande un paramètre par comportement observé,
  c'est qu'elle est fausse.
- **La cadence d'un combattant n'a de sens qu'en nommant l'adversaire.** Tempest rend 0,506 coup/s contre le panel de `probe.mjs` (qui pilote vers lui)
  et 0,202 dans son miroir. Facteur 2,5, même personnage.
- **Une maquette ne contient pas toujours ce qu'on vient y chercher.** Celle de
  Calamity montre ses munitions en **paquet** : aucun recadrage n'en isole
  une, une composante connexe en attrape deux. Transcrire quand c'est possible,
  **composer** quand la source ne s'y prête pas, et le dire dans le commentaire.

### Équilibrer

- **Une arme braquée touche en permanence.** Le piège de Calamity, repayé à
  l'identique sur Tempest. Dès qu'une arme cesse de tourner pour **viser**,
  elle pointe sur la cible à chaque image, donc elle la touche à chaque fenêtre
  de recharge : Tempest est monté à **0,42 coup/s** contre 0,181 relevé, et
  gagnait ses 30 duels en 19 s. Chaque arme braquée doit porter **son propre
  garde-fou** — une dispersion pour le canon, « la lance ne blesse qu'en
  charge » pour la lance. Le garde-fou n'est pas un ornement : c'est ce qui rend
  la précision relevée.
- **Une visée réécrite à chaque image touche toujours.** Sans dispersion Calamity gagnait 27 duels sur 27. `ability.spread` est **raide** : 0,72 →
  10 victoires, 0,75 → 15, 0,80 → 9. Elle se règle au banc, jamais à l'estime.
- **Caler une cadence par le temps mort donne un personnage planté.** Ramener
  la cadence de Tempest en allongeant la pause entre charges marchait — à 2,5 s
  de temps mort, quand la vidéo montre *beaucoup* de charges dont *peu*
  portent. Quand une cadence est trop haute, se demander d'abord si c'est la
  **fréquence** de l'action ou son **taux de réussite** qui est faux.
  Corollaire, à contre-intuition : **serrer** `lunge.cone` améliore la cadence
  (0,15 → 0,157 coup/s ; 0,60 → 0,120), parce qu'un cône large laisse partir
  des charges mal alignées qui manquent.
- **Un banc qui plafonne dit que le levier n'est pas le bon.** Pousser la
  dispersion de Calamity de 0,75 à 1,35 rad ne faisait tomber le banc que de
  1,11 à 0,86 coup/s : une part croissante de ses touches venait des **éclats de
  givre**, que la dispersion n'affecte pas. Quand un levier connu cesse de
  répondre, chercher ce qui a changé de *source*.
  **Deuxième instance, sur Briar, et l'ablation a tranché en une minute.**
  Son guidage semblait être son levier évident : balayé de 3,4 à 0,4 rad/s, il
  ne l'a fait passer que de 22 à 16 victoires sur 24 — plat. Compter les dégâts
  **par source** (`opts.kind` dans `game.damage`) a montré que 73 % venaient
  des projectiles ; `orb.damage` s'est révélé raide au point de rupture (3 →
  20 victoires, 2 → 15, 1 → 0). Avant de balayer un paramètre, **mesurer d'où
  vient réellement le dégât** — c'est plus rapide qu'un balayage à l'aveugle,
  et ça dit *lequel* balayer.

- **Deux leviers qui marchent chacun ne s'additionnent pas.** Orbe à 2 **et**
  mêlée à 1 faisaient tomber Briar de 20 à 8 victoires sur 24, alors que
  chacun seul le posait autour de 15. Près du seuil, un point de dégât bascule
  des courses déjà serrées. Régler **un** levier, remesurer, et seulement
  ensuite en toucher un autre.

- **La matrice ne joue chaque paire qu'une fois, donc elle exagère les écarts.**
  Chacun y est toujours du même côté, et le camp A pèse lourd (invariant 3).
  Avant de remonter un « dernier », le remesurer sur **les deux camps** : Calamity et Cinder étaient à 3/12 et 3/12 à la matrice, mais à 10/24
  et 9/24 sur les deux camps — presque la moyenne. L'outillage doit servir la
  question posée : la matrice est un garde-fou de **non-régression** (elle doit
  rester identique), pas une mesure de force.

- **Chercher le levier là où l'ablation trouve la source ne suffit pas.** Calamity tire 62 % de ses dégâts de ses balles, et pourtant grossir la
  balle (`radius` 8 → 14) ne bouge rien : 10 / 9 / 10 / 9 victoires. La source
  dit *quoi* regarder, pas *quelle poignée tourner* — ici c'est la dispersion
  qui décide si la balle part sur la ligne, pas sa taille une fois partie.

- **Le levier d'un combattant faible est parfois chez un autre.** Les leviers
  propres de Calamity et de Cinder étaient morts ou coûtaient une mesure ;
  c'est **baisser les dégâts du Shinobi** qui les a remontés tous les deux,
  sans toucher à leur fiche, et qui a le plus resserré le roster. Quand un
  combattant plafonne, regarder aussi ce qui le bat.

- **Un paramètre qui ne fait rien doit être documenté comme tel.** Le verrou de
  mêlée de Briar, balayé à 1,4 / 1,7 / 2,2 s, rend 15 / 12 / 14 victoires :
  **non monotone, donc du bruit**. Il est resté à 1,7 s — c'est la
  configuration sur laquelle la matrice a été relevée — mais son commentaire
  dit qu'il n'équilibre pas. Un commentaire qui attribue un résultat au mauvais
  paramètre coûte plus cher que pas de commentaire du tout : le suivant le
  tournera dans le vide.
- **Seuil d'arrondi.** `Math.round(stat/18)` → `stat/15` a doublé des dégâts
  (round(1,33)=1 vs round(1,6)=2) et fait passer le Vent de 5 à 19 victoires.
  Toujours repasser la matrice après un changement de formule.
- **Regrouper autrement les mêmes produits change le résultat.** En réécrivant
  `bladeSegment()`, `c * reach * hitbox.from` est devenu `c * (reach *
  hitbox.from)`. La multiplication flottante **n'est pas associative** : un bit
  d'écart a fait basculer deux affrontements où le combattant modifié n'était
  même pas. Le garde-fou n'est pas la relecture mais la **matrice**.
- **Rééquilibrer un combattant affaibli** : ne toucher que ses paramètres `calé`
  ou `déduit`, jamais les `mesuré`.

### Déterminisme et ordre d'exécution

- **Une décoration qui tire dans `game.rng` transforme un levier en bruit.** Un
  balayage de recharge rendait des chiffres impossibles (un Vent de tombe *plus rare*
  rendait Calamity *plus fort*) : la neige et la poussière du dôme
  tiraient dans le flux de **simulation**, donc chaque valeur rebattait le
  tirage de tous les duels. Passées à `viewRng`, la recharge redevient monotone.
  Ça ne se manifeste pas par un plantage mais par **un balayage qui ment**.
- **Une décoration se corrige jusqu'au bout, sinon elle n'est pas corrigée.**
  Suite directe : seules les **positions** passées en argument avaient été
  déplacées vers `viewRng` ; `Effects.snow` continuait de tirer quatre fois par
  flocon dans le flux de simulation. La monotonie observée après coup avait fait
  croire l'affaire réglée — elle ne prouvait rien. **Vérifier la correction à la
  source, pas au symptôme.** Note pour la suite : `fx.burst` tire encore 4 fois
  par particule dans le flux de simulation, pour tout le roster. Le corriger
  déplacerait toute la matrice d'un coup — chantier à part.
- **Un garde-fou du moteur réutilisé depuis un module hérite de l'ordre d'appel
  du moteur, pas seulement de sa géométrie.** `weaponHit()` refuse la touche
  quand `attacker.meleeCd > 0`, et `Match.resolveMelee` tourne **avant** les
  modules : le verrou était déjà posé quand le module du Shinobi testait ses
  clones, qui n'ont donc **jamais** encaissé un seul coup de mêlée — 100 % des
  occasions bloquées, sur les trois adversaires. Ce que j'avais documenté comme
  une « mutuelle exclusion » était une famine. `Match.update()` fixe l'ordre
  (corps → mêlée → pouvoirs → projectiles) ; tout ce qu'un module teste après
  coup arrive **derrière** les deux vrais combattants. Ça ne se lit pas dans le
  code : **ça se compte.**
- **Les minuteurs sont *figés* pendant `offstage`, pas seulement suspendus.**
  `Fighter.step` sort avant de décompter `meleeCd`, qui garde donc pour toute la
  durée de la Foudre tombante la valeur qu'il avait au décollage. Quand la Foudre tombante partait en
  pleine charge, cette valeur était zéro, et Tempest touchait **gratuitement**
  à l'atterrissage : une touche garantie tous les ~8 s, invisible au relevé, qui
  portait à elle seule **dix victoires sur trente**. Toute chute de la Foudre tombante doit
  poser le verrou comme le ferait `resolveMelee`.
- **`offstage` ne doit pas expirer avant le module.** À l'égalité stricte Tempest réapparaît une image **à son ancienne position** avant que `land()` ne
  le téléporte. D'où la marge de 0,1 s posée au décollage.
- **`Match` appelle `Fighter.step()` avant `mod.update()`.** Le module lit donc
  un cap déjà intégré et déjà réfléchi par les rebonds du pas courant : l'arme
  ne traîne jamais d'une image derrière le corps.

### Éditer les données

- **Un `re.sub` de calage qui déborde sur une autre fiche. Deux fois.** Une
  expression ancrée sur `hitbox: { from: …` a réécrit celle de Calamity au
  lieu de Tempest ; un `s.index('damage: (f) => Math.max(')` a pris la première
  fiche du fichier au lieu de la bonne — **tout un balayage de mesures était
  faux sans que rien ne plante**. Règle : un setter de balayage doit `assert`
  que son ancre est **unique**, et il faut relire le `git diff` avant de croire
  un chiffre. *La découpe en un fichier par combattant retire l'essentiel de ce
  risque : l'ancre ne peut plus déborder sur un voisin.*
- **La hauteur d'une carte d'arme ne coûte rien.** `fighter.js` pose `headH =
  map.h × scale` et `drawSpriteLeft` en tire `w = headH × map.w/map.h` — la
  hauteur **s'annule**, la largeur dessinée vaut toujours `map.w × scale`.
  Grandir une carte en hauteur ne change ni la portée, ni la hitbox, ni la
  taille du pixel : seulement la place disponible. Grandir en **largeur**, en
  revanche, déplacerait la pointe.
- **`handle.length` + largeur dessinée doit toujours valoir la portée.**
  `drawSpriteLeft` blitte à partir de `handle.length` : une valeur **négative**
  démarre en arrière de la bille (talon de Tempest à −44 ; sprite centré du
  Shinobi à −75). Si la somme ne retombe pas sur `reach`, la pointe ment sur la
  hitbox.
- **Générer un sprite par une formule au lieu de transcrire la maquette.** La
  première lance livrée était une **feuille arrondie** là où la maquette montre
  une **pointe de flèche à bords droits** : le profil était tracé en `(1-u)**1.3`
  (exposant convexe ; des bords droits demandent 1), et le contour tombait hors
  carte. Une formule interpole ce qu'on ne lui a pas demandé ; quand un dessin
  est fourni, les arêtes qui font la silhouette se posent **explicitement**.
- **Une icône redessinée à la main diverge de son arme.** `ICON_LANCE` avait
  lâché deux fois (restée indigo quand l'arme est passée au cuivre, restée une
  lame fine quand la tête est devenue une pointe de flèche). Elle
  **échantillonne maintenant le profil de `LANCER_SPEAR`**, donc elle ne peut
  plus mentir sur l'arme qu'elle annonce.

### Interface et rendu

- **Une moitié d'écran dans chaque langue.** `?lang=fr` ne pilotait que le HUD
  et le titre d'arène ; les écrans DOM étaient français en dur. On lisait
  « CHOISIS TES COMBATTANTS » au-dessus d'un duel « DARK vs ICE ». Tout
  l'affichage passe désormais par `src/ui/lang.js`, un seul interrupteur.
  **Il en restait une ligne, trouvée trois mois plus tard en ajoutant Briar** : la ligne « Projectile » de la fiche de sélection lisait `labelRef`
  sans regarder la langue, donc restait **en anglais pour tout le roster**. Elle a échappé à l'aide `label()` parce que c'est le seul
  endroit du dépôt où le couple des deux langues s'appelle `label`/`labelRef`
  et non `name`/`nameRef` — et à `lang-check`, qui vérifie que les champs
  *existent*, pas qu'ils sont *lus*. Un garde-fou sur l'existence ne dit rien
  sur l'usage.
- **La fiche de sélection lit des valeurs qui peuvent être des fonctions.**
  `melee.damage`, `melee.cooldown` et `projectile.damage` peuvent dépendre de la
  pile courante : affichées telles quelles, elles imprimaient le **code source
  de la fonction**. Même piège pour `weapon.spin = 0` (« rotation 0 °/s » se lit
  comme un bug alors que c'est une arme braquée) et `ability.cooldown: Infinity`
  (« recharge Infinitys » ; `select.js` teste `Number.isFinite` et écrit
  « passif »). Les replis sont dans `ui/select.js`.
- **Le chiffre de PV n'a pas de contour dans ce moteur.** La vidéo d'origine
  écrit les PV en crème avec un contour sombre ; ici `fighter.js` ne fait qu'un
  `fillText`. D'où les `hpColor` sur mesure. Corollaire pour les nombres de
  dégâts, qui eux **ont** un contour `#0a0a0a` posé par le moteur : un
  remplissage noir s'y noie et le chiffre devient une masse sans relief — c'est
  pourquoi l'accent du Shinobi est un gris, pas un noir.
- **Assombrir un corps rend illisible tout ce qui était déjà sombre.** Le
  Shinobi passé au noir aurait gardé un contour `#0a0a0a` et un chiffre de PV
  `#0a0a0a` : noir sur noir. Piège payé une fois sur Cinder, évité d'entrée
  ici. Vérifier à l'écran (`tools/shot.mjs`) après tout changement de `look.body`.
- **Une passe de couleur incomplète n'est pas une passe de couleur.** « Aura et
  traînée en noir » n'avait touché que `look.aura` et `look.trail`, en laissant
  le bloc `flair` — or c'est lui qui porte ce qu'on voit vraiment traîner
  (ruban, motes, gerbe d'impact, éclair d'incantation). Faire le tour du bloc
  `look` en entier.
- **La ruée de Cinder a un seul point de sortie**, `endRush()`. Vitesse,
  pilotage et ouverture de l'éventail y sont remis **ensemble** : dispersés, une
  fin de duel en pleine ruée laissait l'éventail large accroché derrière la
  lame. Même patron pour `endDash()` de Tempest.
- **L'éventail vert est borné en angle, jamais en nombre d'images.** À 3 tours/s
  un compteur d'images donne trois tours complets de vert. Déjà fait, déjà
  corrigé — dans les deux moteurs.
- **Un pouvoir s'ajoute sur un troisième créneau, il ne remplace pas l'ultime.**
  Vent de tombe, Rage infernale, Lien d'essence et Clone d'ombre passent par un bloc
  `special` et un compteur `f.state.spec` de la forme des compteurs génériques —
  rien ne passe par `f.ult`. Le HUD porte **deux rangées** par le **même tracé**
  (`drawGauge` dans `render/hud.js`) : la première version en avait deux copies,
  dont l'une avait déjà dérivé. Un module alimente la seconde par `specialBar(f)`,
  méthode **optionnelle** — les combattants sans troisième créneau n'affichent
  pas un cadre vide.
- Écran de sélection : un élément sans `head.sprite` (la Plante) doit avoir une
  chaîne de repli sprite → projectile → icône.
- **`imageSmoothingQuality = 'high'`** sur le rééchantillonnage de l'export
  coûtait 72 % du fil principal. Rester en `'low'` (`render/recorder.js`).
- **`captureStream()`** ne doit être appelé qu'une fois par session : un appel
  par duel laissait des pistes de capture vivantes.
- Le filigrane TikTok dérive sur les vidéos : binariser la zone de texte avant
  de hacher une bande de stats.
- **Un pouvoir dessiné dans `drawOver` peut recouvrir le chiffre de PV de sa
  cible**, et rien dans le pipeline ne le rattrapait : `f.draw()` (qui trace ce
  chiffre) tourne avant la boucle `drawOver` de `Match.draw()`, donc une nuée
  opaque — la Ronceraie de Briar — passait dessus sans recours, comme
  `weaponLateral` couvrait déjà le manche avant `look.hpOverWeapon`. Le chiffre
  est maintenant **repassé** après `drawOver`, pour tout le monde plutôt que
  pour la seule cible touchée (`Fighter.drawHpNumber()`, appelée deux fois :
  dans `draw()`, puis à nouveau à la fin de `Match.draw()`). Un second
  `fillText` opaque au même endroit est invisible à l'écran, donc les neuf
  combattants qu'aucun effet ne recouvre ne changent pas d'un pixel —
  `globalAlpha` est remis à 1 avant ce second passage, sinon un `drawOver` mal
  restauré aurait délavé le chiffre au lieu de le rendre net.

### Refactoriser

- **Une refactorisation livrée « prête à l'emploi » mais jamais appliquée coûte
  deux fois.** Le dépôt a porté pendant des semaines un `templates.js`, un
  `elements-compact-example.js`, un minificateur, un script de migration et
  1 433 lignes de markdown racine annonçant −60 % — sans qu'une seule fiche soit
  touchée. Résultat net : **plus** de lignes à lire, une doc qui contredisait
  `CLAUDE.md`, et un exemple de référence qui ne compilait pas. Le tout a été
  supprimé et remplacé par la découpe réelle. Une refactorisation se mesure à ce
  qu'elle **retire**, pas à ce qu'elle ajoute.
- **La duplication annoncée n'était pas là où on la cherchait.** Recompter avant
  de factoriser : sur les onze fiches d'alors, **six** clés seulement étaient
  identiques partout (rayon, contour, police et décalage du chiffre de PV,
  masse, `head.anchorY`), soit ~5 % des lignes. Le vrai coût n'était pas la
  répétition mais le **monolithe** : ouvrir 2 995 lignes pour en toucher 130.
- **Supprimer un combattant, ce n'est pas effacer ses fichiers.** Les sept
  éléments gelés partaient avec des morceaux d'eux-mêmes greffés ailleurs : le
  module de Briar **déléguait** sa tempête à `plant.js`, sa corolle *partageait*
  le tableau `rows` de celle de la Plante, et Calamity tirait l'éclat de
  givre dessiné dans `pixelart/ice.js`. La méthode qui a marché : **rapatrier
  d'abord, vérifier la matrice inchangée, supprimer ensuite** — deux étapes,
  deux preuves, au lieu d'un `rm` suivi d'une chasse aux imports cassés.

- **Le code mort d'un combattant supprimé ne se voit pas dans son dossier.**
  Retirer les sept fiches laissait derrière : le bouclier de l'Égide dans
  `fighter.js`, le crochet `onDamage` dans `match.js`, le rendu d'arme sur
  mesure (`customWeapon`), `fx.ghost` et trois `clear()` sans appelant. Rien de
  tout ça ne plante ni ne crie — il faut le **chercher**, un crochet à la fois,
  en se demandant qui le fournit encore.

- **Prouver une réorganisation demande son propre garde-fou.** La matrice ne
  couvre que ce qu'un duel exerce : elle serait restée verte avec des fiches
  corrompues sur des valeurs qu'aucun combat ne lit. `tools/fiche-snapshot.mjs`
  sérialise toutes les fiches et toutes les cartes, et c'est lui qui a validé
  chaque étape de la découpe — puis chaque étape de la suppression des sept
  éléments.

---

## Habitudes attendues

- **Français** dans le code, les commentaires, la doc et les réponses — mais
  **anglais dans l'application** (section « Langue »). Un nouveau combattant
  apporte ses champs `Ref` en même temps que sa fiche.
- Commentaires qui expliquent **pourquoi** (et citent la mesure), pas quoi.
- Après un changement **visuel** : capture d'écran de contrôle + matrice
  inchangée. Si la matrice bouge, le changement n'était pas visuel.
- Après un changement de **gameplay** : matrice régénérée + justification du
  nouvel équilibre.
- Après une **réorganisation de `src/data/`** : `fiche-snapshot` identique.
- Tenir `README.md`, `docs/FICHES.md` et `docs/AJOUTER-UN-COMBATTANT.md` à
  jour ; régénérer `docs/capture-*.png` quand le rendu change.
- **Tout se développe directement sur `main`.** Pas de branche `claude/*` : on
  commite sur `main` et on y pousse. Le dépôt **n'a plus qu'une branche**, et
  `main` est la branche par défaut — les quatre branches de travail ont été
  supprimées, elles avaient fini par porter trois rosters divergents qu'aucune
  fusion ne pouvait réconcilier. N'en recrée pas.
- Commits en français, corps détaillé, puis push sur `main`, et attendre que
  Pages ait publié.
