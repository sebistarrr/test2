# PIEGES.md — le détail long

Ce fichier porte ce que `CLAUDE.md` ne peut plus porter : il est lu **à chaque
session**, donc tout ce qui s'y trouve est payé en contexte à chaque fois.
`CLAUDE.md` garde la carte, les invariants et la **règle** de chaque piège en une
ligne ; ici se trouvent les mesures, les chiffres et l'histoire qui l'ont
produite — à ouvrir quand on veut savoir *pourquoi*, ou quand on s'apprête à
refaire le geste.

Trois blocs, dans cet ordre : la méthode de relevé, les écarts assumés au
relevé, puis les pièges eux-mêmes.

**Sommaire** (numéros indicatifs ; `grep -n '^#\+ ' docs/PIEGES.md` les recale) :

| Section | Ligne |
| --- | --- |
| **Méthode de relevé vidéo** | 36 |
| &nbsp;&nbsp;· Le repère de mesure n'est pas le même partout | 48 |
| **Écarts volontaires au relevé** | 65 |
| **Pièges déjà rencontrés** | 139 |
| &nbsp;&nbsp;· Mesurer | 141 |
| &nbsp;&nbsp;· Équilibrer | 176 |
| &nbsp;&nbsp;· Déterminisme et ordre d'exécution | 352 |
| &nbsp;&nbsp;· Éditer les données | 391 |
| &nbsp;&nbsp;· Interface et rendu | 424 |
| &nbsp;&nbsp;· Le son | 510 |
| &nbsp;&nbsp;· Refactoriser | 765 |
| **Le détail des sections condensées de `CLAUDE.md`** | 806 |
| &nbsp;&nbsp;· L'écart du roster, et ce que la matrice cache | 808 |
| &nbsp;&nbsp;· Formats — ce qui change à l'écran au-delà de deux | 851 |
| &nbsp;&nbsp;· Invariant 12 — corollaire pour les modules de pouvoirs | 894 |
| &nbsp;&nbsp;· Invariant 13 — comment le moteur a cessé de compter jusqu'à deux | 913 |

---

## Méthode de relevé vidéo

Les vidéos de référence font 576 × 1024, sauf la première en 720 × 1280 —
soit exactement 0,8 ×. **Toute mesure prise sur une vidéo 576 se convertit
en ×1,25** vers le repère logique du jeu (720 × 1280).

Arène : carré 640 × 640 à (40, 320), bord noir 6 px. Boule : rayon 41.

Marche à suivre : `frames.py` → `montage.py` pour repérer les moments →
`crop.py` pour zoomer → masques numpy pour mesurer (tailles, positions,
couleurs par percentile plutôt que par moyenne, le JPEG bruite).

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

---


## Écarts volontaires au relevé

Les écarts **par combattant** — arme de l’Hoplite remplacée par une maquette,
reskin du Ronin en lame de braise, Shinobi en ninja sombre — sont détaillés
dans `docs/FICHES.md`. Ce qui suit vaut pour tout le dépôt.

- **Trois vrais PNG dans un dépôt « sans binaire »** : la lame du Ronin, le
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
  celle de l’Hoplite est donc en ambres saturés (`#f0b400`) et non en jaunes clairs ; la
  poudre de givre du Pistolero en bleus tenus ; le shuriken sombre du Shinobi
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
- **L'ultime du Pistolero (`DEAD MAN’S HAND`, anciennement `LEAD HAIL`) ne
  teinte pas l'arène.** Sur sa vidéo, l'arène entière vire au crème pendant cet
  ultime. Ici le décor est rasterisé une fois et **ne bouge jamais**
  (invariant 4) : la lumière se pose donc au sol.
- Filigrane `@ElementalArmoryLeague` non reproduit — ni le « ballthing.com » /
  « @ballthingsim » des vidéos des trois invités.
- **Les bruitages de touche sonnent plus fort et plus large que sur la vidéo
  de référence, demandé.** L'audio de *Outlaw vs Bladesman* (le duel qui a
  fourni le relevé visuel du Pistolero et du Ronin) a été mesuré directement :
  crête proche de la saturation (0,7 à 1,0 en amplitude normalisée) et une
  énergie qui déborde largement dans le médium-aigu, contre des recettes de
  `data/sound.js` plus mesurées. `gunshot`, `blade`, `pierce`, `crunch` et
  `impact` ont leur `gain` relevé, et `blade`/`pierce` leur `q` de bandpass
  abaissé (bande plus large, moins « sifflement fin »). Le compresseur de
  `render/audio.js` (seuil −18 dB, ratio 8:1) fait le reste : le gain plus
  haut le sollicite davantage, ce qui *est* le son « à la limite de la
  saturation » entendu sur la vidéo — pas un défaut à corriger derrière. Aucun
  gain de fiche de combattant n'a bougé, la matrice reste identique au
  caractère près.

---


## Pièges déjà rencontrés

### Mesurer

- **Mesurer un angle contre la mauvaise référence donne une conclusion vraie et
  fausse à la fois.** Le deuxième relevé de la lance concluait « elle vise
  l'adversaire, à ±5° ». C'était exact **sur les images mesurées** — mais elles
  avaient toutes été prises pendant que l’Hoplite fonçait *sur* l'adversaire,
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
  à l’Hoplite une rotation d'arme de 327 °/s « mesurée » : le relevé prenait le
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
- **La cadence d'un combattant n'a de sens qu'en nommant l'adversaire.** L’Hoplite rend 0,506 coup/s contre le panel de `probe.mjs` (qui pilote vers lui)
  et 0,202 dans son miroir. Facteur 2,5, même personnage.
- **Une maquette ne contient pas toujours ce qu'on vient y chercher.** Celle de
  Celle du Pistolero montre ses munitions en **paquet** : aucun recadrage n'en isole
  une, une composante connexe en attrape deux. Transcrire quand c'est possible,
  **composer** quand la source ne s'y prête pas, et le dire dans le commentaire.

### Équilibrer

- **Une arme braquée touche en permanence.** Le piège du Pistolero, repayé à
  l'identique sur l’Hoplite. Dès qu'une arme cesse de tourner pour **viser**,
  elle pointe sur la cible à chaque image, donc elle la touche à chaque fenêtre
  de recharge : Hoplite est monté à **0,42 coup/s** contre 0,181 relevé, et
  gagnait ses 30 duels en 19 s. Chaque arme braquée doit porter **son propre
  garde-fou** — une dispersion pour le canon, « la lance ne blesse qu'en
  charge » pour la lance. Le garde-fou n'est pas un ornement : c'est ce qui rend
  la précision relevée.
- **Une visée réécrite à chaque image touche toujours.** Sans dispersion le Pistolero gagnait 27 duels sur 27. `ability.spread` est **raide** : 0,72 →
  10 victoires, 0,75 → 15, 0,80 → 9. Elle se règle au banc, jamais à l'estime.
- **Caler une cadence par le temps mort donne un personnage planté.** Ramener
  la cadence de l’Hoplite en allongeant la pause entre charges marchait — à 2,5 s
  de temps mort, quand la vidéo montre *beaucoup* de charges dont *peu*
  portent. Quand une cadence est trop haute, se demander d'abord si c'est la
  **fréquence** de l'action ou son **taux de réussite** qui est faux.
  Corollaire, à contre-intuition : **serrer** `lunge.cone` améliore la cadence
  (0,15 → 0,157 coup/s ; 0,60 → 0,120), parce qu'un cône large laisse partir
  des charges mal alignées qui manquent.
- **Un banc qui plafonne dit que le levier n'est pas le bon.** Pousser la
  dispersion du Pistolero de 0,75 à 1,35 rad ne faisait tomber le banc que de
  1,11 à 0,86 coup/s : une part croissante de ses touches venait des **éclats de
  givre**, que la dispersion n'affecte pas. Quand un levier connu cesse de
  répondre, chercher ce qui a changé de *source*.
  **Deuxième instance, sur le Druide, et l'ablation a tranché en une minute.**
  Son guidage semblait être son levier évident : balayé de 3,4 à 0,4 rad/s, il
  ne l'a fait passer que de 22 à 16 victoires sur 24 — plat. Compter les dégâts
  **par source** (`opts.kind` dans `game.damage`) a montré que 73 % venaient
  des projectiles ; `orb.damage` s'est révélé raide au point de rupture (3 →
  20 victoires, 2 → 15, 1 → 0). Avant de balayer un paramètre, **mesurer d'où
  vient réellement le dégât** — c'est plus rapide qu'un balayage à l'aveugle,
  et ça dit *lequel* balayer.

- **Deux leviers qui marchent chacun ne s'additionnent pas.** Orbe à 2 **et**
  mêlée à 1 faisaient tomber le Druide de 20 à 8 victoires sur 24, alors que
  chacun seul le posait autour de 15. Près du seuil, un point de dégât bascule
  des courses déjà serrées. Régler **un** levier, remesurer, et seulement
  ensuite en toucher un autre.

  **L'inverse existe aussi : un levier plat seul peut en débloquer un autre.**
  Rééquilibrage du Golem (voir `docs/FICHES.md`) : `movement.speed` balayé
  seul (370 → 420 → 500) restait plat, 12 → 13 → 14 victoires sur 50, coincé à
  0/10 contre les deux tireurs rapides du roster à chaque palier — la vitesse
  le fait rattraper sa cible, mais sans plus de dégât au contact elle ne le
  fait pas gagner une fois arrivé. `weapon.melee.damage` seul, en revanche,
  suit une pente connue (4 → 20/50 à 6, cf. le banc de damage plus bas dans
  cette section) : 12 → 20/50. Les deux **combinés** (420 + 6) donnent
  24/50 — plus que la somme de leurs gains isolés (respectivement +1 et +8
  sur la base de 12, soit +9 attendu, contre +12 mesuré). Un levier qui ne
  bouge rien seul n'est pas forcément à écarter : il peut être la condition
  qui manque à un autre pour agir.

- **La matrice ne joue chaque paire qu'une fois, donc elle exagère les écarts.**
  Chacun y est toujours du même côté, et le camp A pèse lourd (invariant 3).
  Avant de remonter un « dernier », le remesurer sur **les deux camps** : Pistolero et le Ronin étaient à 3/12 et 3/12 à la matrice, mais à 10/24
  et 9/24 sur les deux camps — presque la moyenne. L'outillage doit servir la
  question posée : la matrice est un garde-fou de **non-régression** (elle doit
  rester identique), pas une mesure de force.

- **Chercher le levier là où l'ablation trouve la source ne suffit pas.** Le Pistolero tire 62 % de ses dégâts de ses balles, et pourtant grossir la
  balle (`radius` 8 → 14) ne bouge rien : 10 / 9 / 10 / 9 victoires. La source
  dit *quoi* regarder, pas *quelle poignée tourner* — ici c'est la dispersion
  qui décide si la balle part sur la ligne, pas sa taille une fois partie.

- **Le levier d'un combattant faible est parfois chez un autre.** Les leviers
  propres du Pistolero et du Ronin étaient morts ou coûtaient une mesure ;
  c'est **baisser les dégâts du Shinobi** qui les a remontés tous les deux,
  sans toucher à leur fiche, et qui a le plus resserré le roster. Quand un
  combattant plafonne, regarder aussi ce qui le bat.

- **Le pouvoir d'un combattant peut peser sur un troisième, et le total ne le
  dit pas.** Suite du précédent, dans l'autre sens. En faisant hériter les
  clones du Shinobi des PV restants de leur invocateur, son **total est resté
  le même** (22/48 → 23/48 sur les deux camps, réglage de recharge compris) —
  de quoi croire l'affaire neutre. Elle ne l'était pas : le total masquait une
  **redistribution**, il gagne contre le Pistolero (5/12 → 10/12) et perd contre
  le Druide (12/12 → 8/12). Et le perdant net est le Pistolero, qui n'a rien
  demandé : **15/48 → 10/48**, dernier et décroché. Le mécanisme est connu et
  documenté à l'envers dans `docs/FICHES.md` — un clone fragile meurt vite et
  gêne peu le canon asservi ; un clone à 100 PV absorbe le barillet entier.
  **Lire le banc ligne par ligne, pas seulement en total** : un total stable
  peut cacher un roster qui s'est creusé.

  **Suite, et confirmation par l'autre bout.** L'héritage des PV a été retiré
  (le clone naît à 25) en même temps que le clone devenait un combattant
  complet : le Pistolero remonte **2 → 5** à la matrice sans qu'on ait touché à
  sa fiche, et l'écart du roster se referme de **2–11 à 4–9**. Le levier du
  dernier était bien chez un autre — et il l'était dans les deux sens.

- **Un paramètre qui ne fait rien doit être documenté comme tel.** Le verrou de
  mêlée du Druide, balayé à 1,4 / 1,7 / 2,2 s, rend 15 / 12 / 14 victoires :
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
- **Une grosse barre de vie décide de la *forme* des affrontements, et aucun
  levier de la fiche ne la rattrape.** Le Golem naît avec 200 PV au lieu de 100
  (demandé) et gagne d'abord 89 duels sur 100. Le total se règle sans peine —
  8 dégâts de mêlée au lieu de 14 le ramènent à 54/100 — mais **la forme, non** :
  il reste à 18/20 contre le Ronin et 5/20 contre le Druide. La raison est
  arithmétique : contre un adversaire qui place 2 ou 3 dégâts par seconde,
  doubler la barre de vie double le temps qu'il faut pour tuer le Golem, et ce
  temps-là, le Golem le passe à frapper ; contre un gros DPS, les 200 PV ne
  changent presque rien. Chaque levier essayé remonte un camp *et* descend
  l'autre : baisser sa mêlée pénalise le Ronin (trop fort) comme le Shinobi
  (déjà trop faible), baisser son recul de 500 à 300 rend le Ronin jouable
  (18 → 14) et effondre le Shinobi (7 → 2). **Le levier d'un écart de forme est
  chez les autres fiches, pas dans celle qu'on tient** — c'est le rééquilibrage
  complet, pas un réglage de plus.
- **L'ablation par source dit quel levier existe, l'intuition dit le contraire.**
  Toujours sur le Golem : son Onde sismique *paraît* être son levier n° 1 (elle
  ne rate jamais, elle ralentit, elle repousse), et elle a été descendue de 6 à 3
  sur cette conviction. L'ablation (`opts.kind` dans `game.damage`, 100 duels)
  lui donne **9,7 %** des dégâts — contre 44 % au poing, 28 % aux éclats et 18 %
  au Séisme, dont personne ne se méfiait. Elle est remontée à 6. Mesurer d'où
  vient le dégât **avant** de balayer, pas après trois balayages plats.

- **Un combattant blanc sur une arène blanche demande trois compensations, pas
  une.** Le Mannequin est blanc pur (demandé) sur un fond blanc : le contour
  passe de 5 à 6 px, le chiffre de PV du crème au noir, et l'aura devient
  **permanente** pour poser un cerne gris autour du disque. La quatrième est la
  moins évidente : partout ailleurs le corps touché **blanchit** (`#e4e4e6`), ce
  qui sur un corps déjà blanc rendrait chaque coup invisible — le sien
  **rougit**. C'est la leçon des jaunes pâles du Lancier, prise à l'extrême.
- **Un combattant sans arme, et un combattant sans dégâts, sont deux cas limites
  du moteur.** Le Mannequin les a ouverts tous les deux. Sans `head.sprite`,
  `Fighter.drawWeapon` lisait `PIXEL_MAPS[undefined].h` et plantait au premier
  rendu (`ui/select.js`, lui, prévoyait déjà le repli d'icône : il n'avait
  jamais servi) — un garde d'une ligne suffit, et il doit rester **générique**,
  sans nom de combattant. Sans dégâts, le duel **ne se termine jamais** : le
  moteur n'a aucune limite de temps, une partie ne s'arrête que par un mort. La
  ligne `dummy vs dummy` de la matrice finit donc en `timeout` à 200 s. Ce n'est
  pas à corriger chez lui : ajouter une limite de temps changerait le déroulé de
  **tous** les duels.
- **Une cible qui ne riposte pas est un banc de DPS gratuit.** Les lignes
  `… vs dummy` de la matrice ne relèvent aucun équilibrage (le résultat est
  connu d'avance), mais 200 PV divisés par la durée donnent la production réelle
  de chacun : Shinobi 6,09, Ronin 5,79, Hoplite 5,48, Druide 5,23, Pistolero
  4,22, Golem 2,76 PV/s. C'est la mesure que `tools/probe.mjs` approchait par
  les touches, obtenue ici directement — et elle confirme le compromis du
  Golem, qui produit 2,2 fois moins que le Shinobi pour 2 fois plus de PV.

- **Un recul se règle en direction, pas en force — et sa force est un levier
  plat.** Le Pistolero « avait l'air de se propulser vers l'adversaire ». Trois
  mesures ont été nécessaires, dont deux lectures fausses de ma part, avant
  d'arriver au fond :
  1. mesurer la vitesse **à l'image du tir** ne dit rien : `Match` appelle
     `Fighter.step()` **avant** `mod.update()`, donc le déplacement de cette
     image-là est déjà intégré et le recul n'agit qu'à la suivante. Mesuré au
     mauvais endroit, le recul semblait pousser **vers** la cible ;
  2. mesuré à la bonne image, il pousse bien vers l'arrière, et fort :
     **+415 px/s**, et il recule effectivement après 70 % de ses tirs ;
  3. mais sur un **cycle de tir complet** il ne rapporte que **+2 px** de
     distance — et toujours +2 à ±8 px qu'on le règle à 200, 300 ou 420, ou
     qu'on ajoute un arrêt franc de 0,18 s après le tir. C'est le mur déjà
     rencontré sur le Tir enraciné du Druide : `v = cap × vitesse + impulsion`,
     donc l'impulsion se retranche d'un pilotage qui ne s'arrête jamais.

  Ce qui se réglait, c'était la **direction** : le recul suivait la balle
  *dispersée* (`spread` vaut 0,75 rad, soit **±43°**), donc il le poussait de
  côté aussi souvent que vers l'arrière. Aligné sur la **visée**, chaque coup
  le repousse franchement dans le dos de sa cible, et la balle garde toute sa
  dispersion — c'est elle qui porte la précision relevée.

### Déterminisme et ordre d'exécution

- **Une décoration qui tire dans `game.rng` transforme un levier en bruit.** Un
  balayage de recharge rendait des chiffres impossibles (un Champ de givre *plus rare*
  rendait le Pistolero *plus fort*) : la neige et la poussière du dôme
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
  pleine charge, cette valeur était zéro, et l’Hoplite touchait **gratuitement**
  à l'atterrissage : une touche garantie tous les ~8 s, invisible au relevé, qui
  portait à elle seule **dix victoires sur trente**. Toute chute de la Foudre tombante doit
  poser le verrou comme le ferait `resolveMelee`.
- **`offstage` ne doit pas expirer avant le module.** À l'égalité stricte l’Hoplite réapparaît une image **à son ancienne position** avant que `land()` ne
  le téléporte. D'où la marge de 0,1 s posée au décollage.
- **`Match` appelle `Fighter.step()` avant `mod.update()`.** Le module lit donc
  un cap déjà intégré et déjà réfléchi par les rebonds du pas courant : l'arme
  ne traîne jamais d'une image derrière le corps.

### Éditer les données

- **Un `re.sub` de calage qui déborde sur une autre fiche. Deux fois.** Une
  expression ancrée sur `hitbox: { from: …` a réécrit celle du Pistolero au
  lieu de l’Hoplite ; un `s.index('damage: (f) => Math.max(')` a pris la première
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
  démarre en arrière de la bille (talon de l’Hoplite à −44 ; sprite centré du
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
  **Il en restait une ligne, trouvée trois mois plus tard en ajoutant Druide** : la ligne « Projectile » de la fiche de sélection lisait `labelRef`
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
  `#0a0a0a` : noir sur noir. Piège payé une fois sur le Ronin, évité d'entrée
  ici. Vérifier à l'écran (`tools/shot.mjs`) après tout changement de `look.body`.
- **Une passe de couleur incomplète n'est pas une passe de couleur.** « Aura et
  traînée en noir » n'avait touché que `look.aura` et `look.trail`, en laissant
  le bloc `flair` — or c'est lui qui porte ce qu'on voit vraiment traîner
  (ruban, motes, gerbe d'impact, éclair d'incantation). Faire le tour du bloc
  `look` en entier.
- **La ruée du Ronin a un seul point de sortie**, `endRush()`. Vitesse,
  pilotage et ouverture de l'éventail y sont remis **ensemble** : dispersés, une
  fin de duel en pleine ruée laissait l'éventail large accroché derrière la
  lame. Même patron pour `endDash()` de l’Hoplite.
- **L'éventail vert est borné en angle, jamais en nombre d'images.** À 3 tours/s
  un compteur d'images donne trois tours complets de vert. Déjà fait, déjà
  corrigé — dans les deux moteurs.
- **Un pouvoir s'ajoute sur un troisième créneau, il ne remplace pas l'ultime.**
  Champ de givre, Aura de braise, Dôme de drain et Clone d'ombre passent par un bloc
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
  opaque — l’Orage de ronces du Druide — passait dessus sans recours, comme
  `weaponLateral` couvrait déjà le manche avant `look.hpOverWeapon`. Le chiffre
  est maintenant **repassé** après `drawOver`, pour tout le monde plutôt que
  pour la seule cible touchée (`Fighter.drawHpNumber()`, appelée deux fois :
  dans `draw()`, puis à nouveau à la fin de `Match.draw()`). Un second
  `fillText` opaque au même endroit est invisible à l'écran, donc les neuf
  combattants qu'aucun effet ne recouvre ne changent pas d'un pixel —
  `globalAlpha` est remis à 1 avant ce second passage, sinon un `drawOver` mal
  restauré aurait délavé le chiffre au lieu de le rendre net.

- **Un combattant à plusieurs corps ne se nomme qu'une fois.** Le Shinobi qui
  gagnait avec un clone debout affichait **« SHINOBI + SHINOBI WIN »** sur le
  bandeau de parade, et se retrouvait deux fois dans le classement de fin. Le
  HUD, lui, avait raison depuis toujours : il groupe les plaques de PV par
  `${f.team}\u0000${f.el.id}`. C'est la même clé qu'il fallait au bandeau
  (`match.js`, `drawWinnerBanner`) et au classement (`result()`).
  **Ce sont les *noms* qu'on dédoublonne, pas les vainqueurs** : `this.winners`
  reste complet, donc les deux billes paradent toujours au centre — il y a deux
  corps à l'écran, il n'y a qu'un personnage à nommer. Le pluriel légitime doit
  survivre, et c'est le cas à vérifier : un 2 contre 2 Shinobi + Golem avec un
  clone debout fait bien parader **trois** corps et écrit « SHINOBI + GOLEM ».
  Piège dans le piège : le test `this.fighters.length === 2` qui décide si le
  classement a un sens est lu **à la fin du duel**, clones compris — un duel à
  deux qui a vu naître un clone n'est donc plus « à deux » pour ce test, et
  c'est ce qui rendait le doublon visible jusqu'en 1 contre 1.

### Le son

Huit pièges, tous **muets** — c'est leur point commun et c'est ce qui les rend
coûteux : aucun ne plante, aucun ne se voit à l'écran, et une capture ne dit
rien. Les deux derniers sont pires encore, puisqu'ils ne se découvrent qu'après
publication. D'où deux bancs : `tools/sound-check.mjs`, qui joue des duels
entiers et compte les sons, et `tools/export-check.mjs`, qui filme un duel et
**redécode le fichier produit**.

- **Un son ne s'ouvre qu'à un geste.** Un `AudioContext` créé au chargement du
  module naît `suspended` et **le reste tout le duel** : pas d'erreur, pas de
  son, et rien dans la console. Il est donc créé au premier `pointerdown` ou
  `keydown` (`main.js`), et `unlock()` fait aussi le `resume()` — un contexte
  peut retomber en suspens quand l'onglet passe en arrière-plan. Conséquence
  heureuse : sans geste, `sfx.ctx` est `null` et **tous les appels sortent
  immédiatement**, donc `matrix.mjs` et `shot.mjs` ne paient rien.
- **Un plafond de voix qui se décrémente dans un rappel finit par ne plus
  redescendre.** La première version comptait les voix (`this.voices++` puis
  `src.onended = () => this.voices--`). Un seul `onended` manqué — un contexte
  fermé, un `stop()` avalé — et le compteur reste au plafond de `MIX.maxVoices` :
  **le jeu devient muet définitivement**, sans une erreur. Remplacé par une
  **liste d'échéances** (`busy`), purgée à chaque tir contre `ctx.currentTime` :
  l'horloge du contexte ne peut pas oublier de passer.
- **Le même bruitage joué deux fois en 50 ms ne s'entend pas deux fois**, il
  sature. La simulation tourne à 120 Hz : une balle qui touche pendant six pas
  déclenche six détonations en 50 ms, et l'oreille n'entend qu'un seul coup
  écrêté. `MIX.repeatGap` (45 ms, par recette) est à la sortie audio ce que
  `meleeCd` est au moteur. C'est aussi lui qui rend supportable un Shinobi à
  cinq clones : cinq corps qui frappent dans la même image font **un** son.
- **La synthèse vocale ne passe par aucun graphe audio.** `speechSynthesis`
  sort directement sur la carte son : elle ne peut ni se mixer, ni se couper
  autrement que par `cancel()`, ni **entrer dans la vidéo exportée**. Ce n'est
  pas un oubli de l'implémentation, c'est la spécification — il n'existe aucune
  API pour la router. La règle qui en sort : **ce que la voix dit, l'image doit
  le dire aussi**, et c'était déjà le cas (titre d'arène, bandeau de parade).
  Corollaire d'interface : `sfx.silence()` doit être appelé à chaque sortie
  d'écran et quand l'onglet se cache — c'est la seule chose du jeu qui survive à
  `loop.stop()`.
- **Une piste audio dans le flux ne fait pas un fichier sonore.** Trois
  conditions, et chacune manquante donne un fichier muet sans une erreur :
  1. le flux doit **porter** la piste (`stream.addTrack`), et l'ajouter après la
     création d'un `MediaRecorder` ne change rien pour celui-là — il en naît un
     neuf à chaque duel, c'est ce qui rattrape le cas ;
  2. le **MIME doit nommer le codec audio** : `video/webm;codecs=vp9` seul laisse
     le navigateur décider, quand il n'ignore pas la piste. D'où deux listes de
     candidats et un choix fait **à chaque `start()`** — le son peut n'être
     ouvert qu'au deuxième duel, puisqu'il faut un geste ;
  3. le contenu doit être **non silencieux** — et c'est le point que rien ne
     signale : un encodeur à débit constant produit à peu près autant d'octets
     pour du silence que pour un duel entier, donc `webkitAudioDecodedByteCount`
     ne distingue pas les deux. Seul un **redécodage en PCM** le fait, et c'est
     ce que mesure `tools/export-check.mjs` (relevé : 2 canaux, RMS 0,023,
     crête 0,34 sur un duel de 8,9 s).
  Mesure du navigateur du dépôt, à ne pas généraliser :
  `video/mp4;codecs=avc1.42E01E,mp4a.40.2` est **refusé** par le Chromium de
  Playwright (pas de H.264), et c'est `video/mp4` nu qui passe — et qui produit
  bien de l'AAC. Le repli de liste n'est donc pas théorique.
- **Le robinet de coupure se place après la dérivation d'enregistrement.** Le
  graphe est `master → compresseur ┬→ enceintes / └→ piste`. L'inverse — couper
  au master — livrerait une **vidéo muette** à qui a regardé son duel en
  silence, ce qui est exactement le geste de quelqu'un qui monte une vidéo. La
  coupure ne coupe donc que les enceintes (et la voix, qui n'est pas
  enregistrable de toute façon).

- **Une voix, c'est une couche — pas un bruitage.** `MIX.maxVoices` compte des
  couches, et `play()` refuse **le son entier** quand le plafond est atteint :
  enrichir une recette se paie donc sur **les autres sons**, jamais sur elle, et
  un son refusé ne plante pas — il manque. Donner son propre jeu au Pistolero
  (`gunshot` de 2 à 4 couches, `cylinder` et `knell` à 5) a fait passer les sons
  perdus de **0 % à 2,3 %** sur quinze duels : des rechargements et des impacts,
  exactement ce qu'on venait d'écrire. Le plafond est passé à 20, où il ne reste
  que 0,4 % — et ce qui saute encore n'est plus que `thud`, le rebond de mur, le
  son le plus fréquent et le moins porteur de sens.
  **Le banc se mesure sur l'horloge du duel, pas sur celle du contexte audio** :
  en simulation accélérée `ctx.currentTime` n'avance pas avec le duel, tous les
  sons se posent au même instant réel et le plafond crève artificiellement — la
  première mesure annonçait 90 % de pertes, ce qui n'aurait rien voulu dire. On
  enregistre l'instant *du duel* de chaque son, puis on rejoue l'algorithme de
  `play()` sur cette horloge-là. Le même relevé sert d'avant/après sans toucher
  au dépôt, puisque le son ne touche jamais la simulation : la chronologie des
  événements est identique des deux côtés, seules les recettes changent.
  **À remesurer à chaque combattant qu'on sonorise** — six jeux propres
  empileront six fois cette pression.
- **Un garde-fou de couverture ne voit que ce qu'il exerce.**
  `tools/sound-check.mjs` déclare morte toute recette qu'aucun duel ne joue.
  Le jour où le Pistolero a cessé d'emprunter `click` pour son rechargement, le
  banc a crié à la recette morte — alors que `click` est le son des écrans DOM,
  joué par `main.js`, hors de tout duel. Le réflexe (une liste d'exceptions dans
  l'outil) aurait survécu à la disparition de ce qu'elle excuse ; l'outil relit
  donc `src/` et considère vivante une recette **nommée en dur** quelque part.
  Un garde-fou qui crie à tort finit par ne plus être lu — c'est déjà la leçon
  de l'invariant 9, ici payée une seconde fois.

Deux points de conception qui ont bien tenu, notés pour ne pas les défaire :

- **Trois créneaux sur cinq n'ont demandé aucune ligne dans les sept modules**,
  parce que le moteur voyait déjà passer l'événement : le tir dans
  `Projectiles.spawn`, la touche dans `Match.damage`, l'ultime dans la bascule
  de `f.ult.active` que `flair.cast` détectait déjà. Le rebond de mur non plus :
  `f.wall` était posé pour les ondes de `flair.js`. **Chercher l'endroit où
  l'image lit déjà l'événement** avant d'ajouter un état.
- **Une arme qui n'existe pas pour le moteur doit le dire.** `Match.hitSound`
  ne reconnaît une touche d'arme qu'à `kind: 'melee'` ; une arme intégrée
  directement par son module (positions et dégâts gérés en dehors du bloc
  `weapon` de la fiche) sonnerait sinon comme un projectile perdu. Un mot dans
  les options de `damage` (`sound: 'hit'`) suffit — même forme que `opts.kind` :
  un module l'écrit, le moteur s'en sert, et il ne sait pas pourquoi.

**Le son d'un état, pas d'un instant** — la sonorisation des six combattants
restants, et la famille de recettes qu'elle a demandée (`LOOPS`) :

- **« Aucun instant à sonoriser » ne veut pas dire « rien à sonoriser ».** Le
  créneau `ability` du Ronin valait `null`, avec un commentaire qui le
  justifiait : la Danse d'acier est un passif, une rotation qui monte toute
  seule, et « un son sur une montée continue serait un son sans geste ». Le
  raisonnement est juste et la conclusion fausse. Le Ronin porte
  `Damage = Spin` : sa lame va de 0,80 à 3,00 tour/s, plafonne 1,8 s,
  s'effondre à −3,0/s et repart, et **ses dégâts suivent exactement cette
  courbe**. C'était la seule information vitale du roster qui ne s'entendait
  pas. Ce qui manquait n'était pas un événement, c'était une **continuité** —
  et un banc qui ne sait jouer que des événements ne peut pas en dire une. La
  bonne question n'est pas « quel instant sonoriser » mais « quel état le
  joueur doit-il entendre ».
- **Mesurer la grandeur, ne pas la lire dans la fiche.** `weapon.spin` ne porte
  que le **plancher** du Ronin (5,03 rad/s) ; tout ce qui fait l'intérêt du
  personnage — montée, palier, effondrement — est ajouté par son module. Une
  voix pilotée par la fiche aurait donc sonné **plat pendant tout le duel**,
  sans rien qui plante et sans rien qui se voie. Mesurer la variation réelle de
  `weaponAngle` donne en plus, sans une ligne : une lame ralentie par le givre
  qui siffle plus bas (`slowFactor` est déjà dans l'angle) et un ralenti de K.O.
  qui étire le sifflement avec l'image (le `dt` est celui de la simulation).
  Relevé par `sound-check`, passe 3 : régime **0,00 → 1,00** pour le Ronin,
  contre 0,35 constant pour le Shinobi et 0,60 pour le Golem, dont les armes
  tournent à vitesse fixe.
- **Une voix tenue n'a pas d'échéance : elle ne doit pas entrer dans le
  compteur de voix.** `busy` est une **liste d'échéances**, précisément pour ne
  pas dépendre d'un rappel `onended` (voir plus haut : un compteur qui ne
  redescend jamais rend le jeu muet sans une erreur). Y pousser une voix tenue
  serait pire encore — elle n'a aucune échéance, donc elle bloquerait une place
  du plafond **pour toujours**. Les voix tenues vivent dans leur propre `Map`,
  clé sur l'objet `Fighter` et non sur `el.id` : le Clone d'ombre met plusieurs
  corps du même identifiant sur le plateau, et une clé par identifiant les
  aurait fait se voler la voix l'un l'autre.
- **Une voix tenue démarre au silence, et s'arrête six constantes plus tard.**
  Au premier pas, la vitesse de référence est l'angle courant, donc le régime
  mesuré vaut 0 : partir de la vraie vitesse ouvrirait le gain en une image, ce
  qui s'entend comme un claquement. À l'autre bout, `setTargetAtTime`
  **n'atteint jamais sa cible** — c'est une exponentielle asymptotique — donc
  couper les sources à la constante de temps laisse un résidu audible ; six
  constantes plus tard il ne reste que −52 dB. Vérifié à l'analyseur : RMS
  0 → 0,0081 → 0,0170 aux régimes 0 / 0,5 / 1, et **exactement 0 après
  l'arrêt**.
- **Et tout paramètre tenu passe par `setTargetAtTime`**, jamais par une
  écriture directe : la consigne est renvoyée 120 fois par seconde, et l'écrire
  sec s'entend comme un escalier — d'autant plus fort que la valeur bouge vite,
  donc exactement pendant la montée en régime qu'on cherche à faire entendre.
  `MIX.swingGlide` vaut 0,05 s : en dessous l'escalier revient sur
  l'effondrement de surchauffe (−3,0 tour/s, la variation la plus raide du
  jeu) ; au-dessus la lame traîne derrière son ruban à l'image.

**Deux combattants qui partagent une recette se font taire l'un l'autre.** Le
garde-fou `MIX.repeatGap` est indexé **par recette**, pas par combattant : tant
que le Ronin, le Shinobi et le Druide frappaient tous les trois avec `blade`,
deux touches simultanées de deux personnages différents n'en produisaient
qu'une. Séparer leurs recettes (`blade` / `razor` / `bough`) a donc **augmenté**
le nombre de sons qui sortent, alors qu'on s'attendait à l'inverse : sur le banc
à quinze duels, 4393 → **4409** sons joués, à sons perdus constants (6, soit
0,1 % à `maxVoices: 20`). L'intuition disait « plus de matière = plus de
pression sur le plafond » ; la mesure dit que la pression n'a pas bougé, parce
que les couches ajoutées sont sur des **ultimes**, qui sont rares. Le plafond
n'a donc pas eu à changer — mais c'est la mesure qui le dit, pas le
raisonnement, et elle reste à refaire au prochain jeu de bruitages.

**Un ultime qui n'annonce que « quelque chose arrive » n'annonce rien.**
`riser`, un balayage large, a servi d'ultime à **quatre combattants sur sept** :
il disait qu'il se passait quelque chose, jamais *quoi*, et quatre ultimes qui
sonnent pareil ne s'annoncent pas, ils se confondent. Chacun a désormais le
sien (`whirl`, `vault`, `cyclone`, `thorns`), et `riser` a été **retiré du banc**
plutôt que laissé en repli — une recette que plus personne ne joue est du poids
mort, et `sound-check` la signale. Deux d'entre eux sont volontairement la
grande sœur d'un pouvoir du même combattant (`cyclone` de `gust`, `thorns` de
`bloom`) : un ultime se lit mieux quand il est la version large de ce que le
personnage fait déjà en petit.

**Un pouvoir qui emprunte le son d'un accident devient un accident.** L'onde
sismique du Golem jouait `thud` — c'est-à-dire le son de ses **propres rebonds
sur le mur**. Son pouvoir le plus régulier était donc indiscernable d'une
trajectoire ratée, et le commentaire de sa fiche assumait la confusion (« le
même tambour que ses rebonds, en plus gros »). Même erreur chez le Shinobi,
dont la Tornade jouait `whoosh`, le son de son propre lancer de shuriken. Avant
d'attribuer une recette à un créneau, **regarder ce que le combattant joue
déjà** : partager avec un autre personnage est un choix, partager avec son
propre bruit de fond en est rarement un.

**Ajouter un boss** — ce que l'arrivée du Soleil a appris, et qui ne valait pour
aucun des sept autres :

- **Un boss n'est pas un déséquilibre, c'est une spécification.** Les sept
  premiers combattants sont taillés pour s'affronter entre eux, et chaque
  rééquilibrage cherche à resserrer leur bande (4 à 13 victoires sur 21
  aujourd'hui). Le Soleil est demandé pour **gagner contre tous**, ce qui est
  l'intention inverse : sa ligne de matrice à 21/21 n'est pas à corriger. Le
  dépôt a maintenant **deux combattants hors barème, aux deux bouts** — le
  Mannequin ne peut pas gagner, le Soleil ne peut pas perdre — et il faut les
  écarter tous les deux avant de lire un écart entre les autres.
- **Généraliser une expression du moteur se prouve *avant* d'en avoir besoin.**
  Les huit rayons ont demandé une clé nouvelle (`weapon.spokes`) lue par
  `bladeSegment`, `weaponHit` et `drawWeapon` — donc une retouche au cœur du
  calcul de collision, celui-là même dont `bladeSegment` documente qu'un
  regroupement différent des mêmes produits a déjà déplacé deux affrontements.
  Le geste juste tient en deux temps : **poser la clé, la laisser absente de
  toutes les fiches, et exiger la matrice identique au caractère près** ; puis
  seulement ajouter le combattant qui s'en sert. En un seul temps, un vainqueur
  déplacé se serait imputé au nouveau venu et aurait été « corrigé » sur sa
  fiche, où le défaut n'était pas.
  Ce qui rend le chemin à une branche exactement l'ancien : `bladeSegment(0)`
  n'écrit **pas** `weaponAngle + 0` mais `weaponAngle` lui-même. Une addition
  flottante neutre en apparence suffit à changer un dernier bit.
- **Une arme à plusieurs branches touche dans toutes les directions**, et c'est
  l'« arme braquée qui touche en permanence » du dépôt, en pire : contourner un
  combattant est la parade normale contre une arme qui tourne, une couronne la
  supprime. Son garde-fou n'est pas la dispersion (elle ne vise pas) mais le
  **verrou de mêlée**, et il ne tient que parce que `weaponHit` le teste **une
  fois pour toutes, avant** d'essayer les branches. Le déplacer à l'intérieur de
  la boucle donnerait huit touches par pas sans qu'aucune valeur de fiche n'ait
  bougé.
- **`flair.js` ne sait suivre qu'une branche.** Le ruban de pointe d'arme et
  l'aura d'arme lisent `f.bladeSegment()` sans argument, donc la première. Sur
  une couronne, ils désigneraient un rayon au hasard et feraient croire que les
  sept autres ne comptent pas. Le Soleil n'en déclare donc aucun — ce n'est pas
  un manque, c'est le seul choix juste, et la couronne se lit très bien seule.
- **Un corps jaune demande trois des quatre compensations du corps blanc.**
  L'arène est blanche ; le personnage *est* le soleil, donc le rendre orange
  sombre pour esquiver le problème l'aurait dénaturé. Contour à 6 px, chiffre de
  PV en encre brûlée, aura permanente — seule la quatrième (le `bodyHit` qui
  rougit au lieu de blanchir) est inutile ici, le jaune saturé passant très
  visiblement au blanc.
- **Un trait clair seul n'existe pas sur fond blanc.** L'axe d'annonce du Rayon
  solaire est la seule information dont l'adversaire dispose pour esquiver : en
  crème simple, il était à peine visible sur la capture de contrôle. Il est
  doublé — un liseré orange large sous un cœur crème fin. C'est la leçon du
  corps clair, appliquée à une ligne.
- **Mesurer d'où vient le dégât, même quand on croit savoir.** Ablation par
  `opts.kind` sur 70 duels : couronne **67,3 %**, Rayon solaire 18,9 %,
  Réchauffement 13,7 % (dont 9,9 % de brûlure et 3,8 % de coup). La mécanique de
  base porte donc bien le personnage et les deux pouvoirs sont des appoints —
  ce qui est l'intention, mais qui ne se savait pas avant la mesure : le
  Séisme du Golem avait déjà démenti la même intuition en sens inverse.
- **Un pouvoir qui s'annonce doit s'annoncer *assez tôt et assez fort*.** Le
  Rayon solaire est le seul pouvoir du dépôt qui prévienne avant de frapper
  (1,1 s), et c'est ce qui autorise ses 42 PV potentiels — plus de huit fois le
  pic de dégâts du reste du roster. La visée **suit** la cible pendant la charge
  puis **se fige au tir** : figer dès le déclenchement rendait l'esquive
  triviale, suivre jusqu'au bout la rendait impossible.

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
  module du Druide **déléguait** sa tempête à `plant.js`, sa corolle *partageait*
  le tableau `rows` de celle de la Plante, et le Pistolero tirait l'éclat de
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



## Le détail des sections condensées de `CLAUDE.md`

### L'écart du roster, et ce que la matrice cache

Écart **3 à 11**, et il s'est **rouvert** au dernier relevé (il était de 4 à 9).
Toujours sans qu'aucune fiche d'adversaire ne bouge : le Clone d'ombre du
Shinobi peut maintenant s'invoquer lui-même, donc l'arène porte jusqu'à quatre
corps, et **c'est encore le Pistolero qui paie** — son barillet se vide sur des
leurres. Sur les **deux camps**, qui est la mesure moins caricaturale, l'écart
va de 14/48 (Pistolero) à 34/48 (Hoplite), contre 17–35 au relevé précédent.

**Le pouvoir d'un combattant décide du classement des autres**, et c'est la
troisième fois de suite que le Clone d'ombre le démontre — voir le piège du
même nom plus bas.

**D'où vient l'écart : du gel de l'attente d'avant-combat, pas d'un réglage.**
Les combattants se déplaçaient pendant la seconde d'ouverture — ce n'était donc
pas une attente mais un début de course, et aucun duel ne partait vraiment des
deux points de départ mesurés. Les figer était demandé, et c'est aussi plus
juste au regard du relevé ; mais partir des vrais points de départ **profite à
Hoplite** (9 → 11), dont la charge en ligne droite aime les longues lignes de
vue, et a coûté au Shinobi (6 → 4, remonté à 6 depuis).

C'est un déséquilibre connu et non corrigé : le corriger demanderait un
rééquilibrage complet, qui est un autre chantier que celui qui l'a produit.

**Attention à la convention de la matrice quand on juge un écart.** Elle ne
joue chaque paire qu'**une fois**, donc chacun est toujours du même côté, et le
camp A pèse lourd (invariant 3). Le banc des **deux camps** donne une image
sensiblement plus plate : avant ce réglage, Pistolero 10/24 et le Ronin 9/24
là où la matrice officielle disait 3/12 et 3/12. Un combattant « dernier » à la
matrice ne l'est pas forcément au jeu — vérifier sur les deux camps avant de
conclure qu'il faut le remonter.

**Et elle peut aussi *cacher* un écart, pas seulement l'exagérer.** Nouveau
cas, symétrique du précédent et plus dangereux : en passant les clones du
Shinobi au corps à corps, la matrice n'a bougé que d'**un duel** — le Shinobi
y était déjà du mauvais côté de presque toutes ses lignes, donc elle n'avait
plus grand-chose à perdre. Le banc des deux camps disait **23/48 → 4/48**, un
combattant rayé de la carte. Quand un changement touche un combattant que la
matrice montre déjà bas, elle ne peut plus le mesurer : ne pas conclure sans
repasser les deux camps.

---

### Formats — ce qui change à l'écran au-delà de deux

**Ce qui change à l'écran au-delà de deux :**

- **le HUD se sépare en deux bandeaux**. Les points de vie montent **en haut de
  l'écran** — une plaque par **groupe (camp, fiche)** dans la bande vide
  au-dessus du titre ; plusieurs corps d'un même combattant dans un même camp
  (les clones du Shinobi) tiennent **une seule plaque, points de vie cumulés** —
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

### Invariant 12 — corollaire pour les modules de pouvoirs

Le cas qui l'a éprouvé : la hitbox en disque du Shinobi. `hitbox.from` et `to`
à zéro **confondent les deux bouts du segment tranchant sur le pivot**, et
`segmentPointDistance` traite déjà ce cas dégénéré — la forme se dit donc
entièrement dans la fiche, sans une ligne de moteur. Second cas, le guidage des
orbes du Druide : `projectiles.orb.homing` décrit un virage borné que
`projectiles.js` applique en visant « le premier combattant en scène qui n'est
pas le tireur », exactement le test que fait déjà sa boucle de touche.


**Corollaire pour les modules de pouvoirs.** Un module qui code en dur une
clé de sprite se ferme à sa propre réutilisation : `plant.js` dessinait
`'flower'` en littéral, ce qui faisait voler des corolles **roses** dans la
tempête verte du Druide. Les deux littéraux concernés (la corolle, la gerbe
d'éclatement d'un bulbe) sont passés en clés de fiche **avec le littéral
d'origine en repli**, donc la Plante ne change pas d'un pixel — matrice
vérifiée identique.

### Invariant 13 — comment le moteur a cessé de compter jusqu'à deux

Cet invariant disait l'inverse (« deux combattants, et ce n'est pas près de
changer »). Il est tombé en ajoutant le 2 contre 2 et la bataille royale, et
la surprise est que ça a coûté peu : le couplage réputé « de bout en bout »
tenait en **vingt lignes de `match.js` et trois de `fighter.js`**.
`physics.js`, `projectiles.js`, `flair.js`, le HUD et le décor prenaient déjà
leurs arguments. **Recompter avant de croire un couplage sur parole** — le
dépôt a déjà payé la leçon inverse en cherchant une duplication qui n'était
pas là où on la disait.

**Et le duel garde ses expressions, littéralement.** Partout où la
généralisation aurait réécrit le chemin à deux — placement, collisions,
mêlée, index de stats, fin de partie — la branche `length === 2` reprend le
code d'origine mot pour mot. Ce n'est pas de la prudence de principe : la
multiplication flottante n'est pas associative, et regrouper autrement les
mêmes produits a déjà déplacé deux affrontements où le combattant modifié
n'était même pas. Preuve exigée à chaque étape : **matrice identique au
caractère près**.

C'est le Clone d'ombre du Shinobi qui s'en sert : ses doubles sont des
`Fighter` du tableau, dans son camp, avec leurs pouvoirs, leurs jauges et
leur place au classement. Le moteur ne sait toujours pas ce qu'est un
clone — il sait qu'un combattant est entré.

Tout le reste — collisions, mêlée, ciblage, HUD, condition de victoire,
classement — travaille déjà sur `this.fighters` et suit sans une ligne.

**L'entrée est différée d'un pas, et c'est le seul piège.** L'appelant est
un module, or `update()` itère `this.modules` quand il appelle `join()` :
une `Map` de JavaScript **visite les entrées ajoutées pendant l'itération**,
donc le nouveau venu verrait son `update()` tourner dans l'image de sa
naissance, avant son premier pas, et après les boucles de corps et de mêlée
du pas courant. D'où la file d'attente et `flushArrivals()` en fin de pas.

Trois versions du même pouvoir ont précédé celle-ci, et **chacune a rendu du
code au moteur** : un double confiné au module et coiffé du prototype
`Fighter` (`Object.setPrototypeOf`) pour hériter du rendu, puis le même
appelant `Fighter.step()`, `resolveBodies()` et `weaponHit()` telles
quelles, puis celui-ci qui n'a plus rien de propre du tout. À chaque étape
la question utile a été « qu'est-ce que le moteur sait déjà faire ? », et à
chaque fois la réponse était « plus que je ne croyais ».

