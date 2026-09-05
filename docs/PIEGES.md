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
| **Méthode de relevé vidéo** | 35 |
| &nbsp;&nbsp;· Le repère de mesure n'est pas le même partout | 47 |
| **Écarts volontaires au relevé** | 64 |
| **Pièges déjà rencontrés** | 124 |
| &nbsp;&nbsp;· Mesurer | 126 |
| &nbsp;&nbsp;· Équilibrer | 161 |
| &nbsp;&nbsp;· Déterminisme et ordre d'exécution | 256 |
| &nbsp;&nbsp;· Éditer les données | 295 |
| &nbsp;&nbsp;· Interface et rendu | 328 |
| &nbsp;&nbsp;· Refactoriser | 398 |
| **Le détail des sections condensées de `CLAUDE.md`** | 439 |
| &nbsp;&nbsp;· L'écart du roster, et ce que la matrice cache | 441 |
| &nbsp;&nbsp;· Formats — ce qui change à l'écran au-delà de deux | 484 |
| &nbsp;&nbsp;· Invariant 12 — corollaire pour les modules de pouvoirs | 527 |
| &nbsp;&nbsp;· Invariant 13 — comment le moteur a cessé de compter jusqu'à deux | 546 |

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
- **LEAD HAIL ne teinte pas l'arène.** Sur sa vidéo, l'arène entière vire au
  crème pendant l'ultime du Pistolero. Ici le décor est rasterisé une fois et
  **ne bouge jamais** (invariant 4) : la lumière se pose donc au sol.
- Filigrane `@ElementalArmoryLeague` non reproduit — ni le « ballthing.com » /
  « @ballthingsim » des vidéos des trois invités.

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

