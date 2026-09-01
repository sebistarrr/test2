# CLAUDE.md — mémoire du projet

Clone haute fidélité des duels d'éléments *Elemental Armory League*, **plus les
trois personnages venus de la chaîne « ballthingsim »** — le Hors-la-loi, le
Bretteur et le Lancier — portés sur le même moteur.
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
| Overrides de sprites en vrai PNG (écart assumé à « aucun binaire ») | `assets/sprites/` + `manifest.json` |
| Déroulé du duel, dégâts, rendu global | `src/game/match.js` |
| Entité combattant (état + dessin) | `src/game/fighter.js` |
| Pouvoirs d'un combattant | `src/game/abilities/<id>.js` |
| Pouvoir **spécial** greffé (3<sup>e</sup> créneau) | bloc `special` de la fiche + `f.state.spec` dans le module |
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

Trois personnages : `outlaw bladesman lancer`, relevés sur deux vidéos de la
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
| `outlaw` Hors-la-loi | Pistolero de **glace** | **revolver de givre** transcrit d'une maquette, canon **asservi à la cible** (`weapon.spin = 0`), barillet de 6, balles qui **gèlent** (−30 % de vitesse, 1,6 s), et, au rechargement, **un tour complet du pistolet sur lui-même** (`Fighter.weaponTwirl`, antihoraire — l'arme ne quitte pas sa place, elle vrille). Porte en plus le **Blizzard** de la Glace, greffé | `abilities/outlaw.js` |
| `bladesman` Bretteur | Duelliste | rotation 0,80 → 3,00 tour/s puis surchauffe, `Damage = 2 × Spin`, brûlure au contact. Porte en plus la **Rage infernale** du Feu, greffée | `abilities/bladesman.js` |
| `lancer` Lancier | Chargeur | **la lance suit le cap** (`weapon.spin = 0`), **charge** en ligne droite avec la lance de **164 px, la plus longue portée du jeu**, dégâts +2 par touche, et le **Bond** qui le sort de l'arène. Porte en plus le **Lien d'essence** de l'Ombre, greffé | `abilities/lancer.js` |

### Le Lancier en détail

Anciennement « Dragoon ». Renommé, redessiné d'après la maquette d'arme, et
**remécanisé** : c'est le troisième relevé de son angle d'arme, et le premier
qui tienne sur toute la vidéo.

| Ce qu'il porte | Relevé | Ce qui est dans la fiche |
| --- | --- | --- |
| Corps | **violet `#7046ac`**, la teinte de la hampe — proche, de fait, de l'indigo `#574a84` mesuré | `look.body`, `radius: 41` |
| Arme | **lance électrique violette** — pommeau doré, hampe parcourue de fissures blanches, garde, tête hérissée à gemme centrale — transcrite de la maquette, pas de la vidéo | `lancerSpear`, carte 208 × 43 à `scale: 1` |
| Portée | centre → pointe = **164 px**, la plus longue du roster | `weapon.reach: 164` |
| Talon | dépasse de 42 px **derrière** le pivot | `handle.length: -44` — −44 + 104 × 2 = 164 |
| **Angle d'arme** | **la lance suit le cap de déplacement** : 6,6° d'écart médian sur 141 images, contre 37,9° du cap vers l'adversaire | `weapon.spin: 0`, et `abilities/lancer.js` recopie `heading` |
| Traînée | six effets, **en jaune de foudre** : boucles de pointe, fuseau, images fantômes pendant la charge, aura d'arme, **arcs électriques le long de la lame** et onde de pénétration | `look.flair.ribbon`, `.smear`, `.ghost`, `.weaponAura`, `.weaponArc`, `.pierce` |
| Charge | **~1 400 px/s pendant ~0,15 s**, contre 540 en croisière | `weapon.lunge.speed: 2.6`, `.dash: 0.16` |
| Cadence relevée | **5 touches en 27,6 s = 0,181 coup/s**, budget 2,54 PV/s | le moteur rend 0,195 et **2,52** |
| Dégâts | 10, **+2 par touche portée** | `stack: 10`, `stackGain: 2`, plafond `déduit` à 15 |
| Vitesse | 432 px/s vidéo → **540** | gardée telle quelle |
| Bond | 0,45 s d'élan, **1,5 s hors de l'arène**, marqueur gris, chute dans 110 px | `ultimate.windup / flight / marker / impact` |

#### Le mécanisme, et pourquoi l'angle d'arme était immesurable

**Le corps va tout droit, seule la lance tourne.** `movement.seek: 0` — le
Lancier est le seul du roster à ne pas piloter vers sa cible : il file droit et
ne change de direction qu'aux rebonds de mur et à ses propres charges. Pendant
ce temps la lance **balaie** à 5,5 rad/s, indépendamment du déplacement. Dès
que son axe croise l'adversaire (à 0,1 rad près), elle se verrouille, marque un
battement de 0,04 s, et le corps part **en ligne droite jusqu'au bord du
terrain**. Puis ça recommence.

**C'est ce mécanisme qui explique trois relevés d'angle contradictoires.** Les
deux hypothèses testées — « la lance suit le cap » et « la lance vise » —
étaient fausses **toutes les deux**, donc aucune ne pouvait ressortir, et les
verdicts s'inversaient d'une bande de vitesse à l'autre. Une lance qui balaie
n'est corrélée ni au cap de déplacement ni au cap adverse : elle n'est corrélée
qu'à elle-même. Aucune quantité de mesure n'aurait tranché entre deux mauvaises
réponses ; c'est la description du comportement qui l'a fait.

#### Ce que valaient les mesures d'angle

**Cette section a affirmé trois choses différentes. La quatrième mesure, faite
sur les *deux* vidéos avec un détecteur corrigé, ne tranche pas — et c'est le
résultat honnête.**

Ce qui a été trouvé en reprenant la mesure sur les deux enregistrements :

| Méthode | A (vs Magia) | B (vs Outlaw) |
| --- | --- | --- |
| ACP, composante connexe, > 300 px/s | cap 31,7° / adversaire 12,4° | cap 26,6° / adversaire 12,9° |
| Vecteur bille → pointe | cap 44,7° / adversaire 27,6° | cap 41,4° / adversaire 38,1° |
| Corrélation des variations | r = +0,06 / −0,09 | r = −0,04 / +0,26 |

Aucune des deux hypothèses ne descend sous 25° avec la méthode du vecteur
pointe ; les corrélations sont nulles ; et les verdicts par bande de vitesse
s'inversent d'une bande à l'autre. **Une mécanique ne fait pas ça, une mesure
polluée si.**

**Le chiffre « 6,6° au cap contre 37,9° à l'adversaire » qui figurait ici est
retiré.** Il venait d'un détecteur qui prenait tous les pixels sombres dans un
rayon de 130 px, sans exclure le **cadre noir de l'arène** — une droite
parfaite, que l'ACP privilégie précisément parce qu'elle cherche la direction
la plus allongée, et que le test d'allongement *sélectionnait* au lieu de
filtrer. Il tournait en outre sur le sous-ensemble d'images où un détecteur
global retrouvait la bille, soit 490 sur 747 dans la vidéo B.

L'implémentation garde `weaponAngle = heading` **par défaut**, faute de mieux
établi — mais ce n'est plus présenté comme un relevé. Pour trancher il faudrait
une lecture image par image sur un jeu d'images choisies à la main, ou une
source de meilleure définition.

#### Ce qui, lui, est mesuré — et concorde sur les deux vidéos

| Mesure | A (vs Magia) | B (vs Outlaw) | Le jeu |
| --- | --- | --- | --- |
| Vitesse de croisière | 423 px/s | 413 px/s | **432** |
| Une charge toutes les | 1,7 s | 0,9 s | **2,3 s** |
| Distance parcourue par charge | 137 px logiques | (bruitée) | **136** |
| Pic de vitesse en charge | 1392 px/s | 1770 px/s | **1555** |
| Cadence de touche | 0,181 coup/s | — | **0,184** |

Ces cinq-là sont pris avec le **même code** des deux côtés, la conversion
×1,25 appliquée, et un suivi temporel de la bille — pas une détection par
image, qui perdait la bille 257 fois sur 747 pendant les charges.

**Mesurer contre le bon adversaire.** `tools/probe.mjs` fait affronter au
Lancier les dix autres, qui **pilotent vers lui** et entrent donc d'eux-mêmes
dans le couloir de charge : il y rend 0,506 coup/s. Dans le **miroir** — le
seul duel jouable aujourd'hui, et le plus proche de la vidéo, où l'adversaire
se déplace de son côté — il rend **0,202 coup/s pour 2,43 PV/s**, contre 0,181
et 2,54 relevés. Le même personnage, deux chiffres qui diffèrent d'un facteur
2,5 : la cadence d'un combattant n'a de sens qu'en nommant l'adversaire.

**Ce que la comparaison a révélé, et qui était le vrai défaut :** le Dragoon
**charge souvent et rate souvent** — une charge toutes les 1 à 1,7 s, dont
environ une sur trois porte. Le Lancier chargeait toutes les 4,3 secondes et
touchait presque à chaque fois. Les deux rendaient la **même cadence de
touche**, ce qui masquait complètement l'écart, mais rien à voir à l'œil.

**L'arrêt avant la charge n'est pas mesuré non plus.** Le « 163 px/s une image
avant le déclenchement » venait d'un détecteur qui ne retenait un déclenchement
que si `v[i-1] < 0,35 × v[i]` — il *sélectionnait* les images précédées d'un
creux, puis rapportait qu'il y avait un creux. Avec un seuil neutre, la vitesse
avant charge vaut 732 px/s (A) et 413 (B) : pas d'arrêt. La phase `brace` est
conservée parce qu'elle a été **demandée** comme effet de jeu, pas parce qu'elle
est relevée.

#### Les trois relevés précédents de l'angle

C'est **la** mécanique du personnage, et elle a demandé trois relevés.

| Relevé | Conclusion | Ce qui clochait |
| --- | --- | --- |
| 1 | rotation libre à 327 °/s | le détecteur prenait le barycentre des pixels lointains — pendant une charge, ce sont les **images fantômes**, pas la lance |
| 2 | « elle vise l'adversaire, à ±5° » | mesuré sur les seules plages où il **fonçait sur** l'adversaire, où cap de déplacement et cap adverse se confondent : un sous-ensemble biaisé |
| 3 | **elle suit le cap de déplacement** | tient sur 141 images réparties sur toute la vidéo, et à tous les régimes de vitesse |

Le troisième relevé, chiffré : l'axe de la lance est à **6,6° du cap de
déplacement** en médiane — 3,7° sur les images où elle est le mieux isolée,
94 % sous 15° — contre **37,9° du cap vers l'adversaire**. Et ça ne dépend pas
du régime : 10,6° en marche lente, 6,1° en croisière, 4,8° à l'accélération,
6,1° en pleine charge.

**Ce qui le prouve mieux que la statistique, c'est ce que ça explique
gratuitement.** `weaponAngle = heading` produit tout seul les trois
comportements visibles à l'image :

- l'angle **figé une demi-seconde** quand il va tout droit (2,13 → 2,67 s,
  moins de 10° d'écart) — c'est une trajectoire rectiligne ;
- un **saut de 85° en une image** au rebond mural (2,667 → 2,700 s) — c'est
  `Fighter.step` qui réfléchit `heading` sur les murs ;
- une rotation lente le reste du temps, |ω| médian **33 °/s**, 88 % des images
  sous 100 °/s — c'est le pilotage à 1,85 × 0,4 = 0,74 rad/s.

Aucune de ces trois valeurs n'est réglée nulle part. Un mécanisme juste rend
des chiffres qu'on n'a pas eu à caler ; c'est le meilleur test disponible.

**Ordre d'exécution.** `Match` appelle `Fighter.step()` **avant**
`mod.update()`. Le module lit donc un cap déjà intégré et déjà réfléchi par les
rebonds du pas courant : l'arme ne traîne jamais d'une image derrière le corps.

#### La charge

Quatre phases, typées `LungePhase` — il n'y a toujours ni visée ni
verrouillage, puisque la lance est **déjà** dans l'axe du déplacement :

| Phase | Ce qui s'y passe |
| --- | --- |
| `seek` | déplacement normal ; s'engage si l'adversaire est dans la fenêtre de distance **et** dans le cône du cap |
| `windup` | **moulinet d'élan** : le corps continue, seule l'arme tourne (26 rad/s pendant 0,10 s ≈ 150°). Écart volontaire — voir plus bas |
| `brace` | **le corps se cloue sur place**, cap gelé, l'arme est **verrouillée d'autorité** sur le cap et **saute** au centre. Mesuré : la vitesse tombe à 163 px/s une image avant le déclenchement, contre ~1 700 juste avant et ~3 100 juste après |
| `dash` | le corps file à 2,6 × sa vitesse en **ligne droite** : cap réécrit à chaque pas, vitesse constante, et l'impulsion est remise à zéro au départ pour qu'un recul encaissé juste avant n'incurve pas la charge |
| `recover` | temps mort après la charge ou la touche ; l'arme se replace sur le flanc |

**Le moulinet est le seul moment où l'arme ne suit pas le cap**, et c'est
assumé : la vidéo ne montre aucune rotation propre (9,6° d'écart médian au cap
sur 294 images). C'est de la mise en scène demandée, bornée à cette phase. Le
garde-fou « la lance ne blesse qu'en charge » la couvre gratuitement — sans
lui, une lance de 164 px qui balaie un tour complet serait l'arme la plus
meurtrière du jeu.

**L'arrêt se paie sur le taux de réussite, pas sur le temps mort.** Il coûtait
0,52 PV/s en arrivant, et retoucher `recover` n'y changeait rien (2,00 → 2,07
en passant de 0,55 à 0,40). La cause est mécanique : pendant l'arrêt
l'adversaire continue d'avancer, donc la charge part vers où il **était**. Le
seul levier qui compte est la durée de l'arrêt — 0,10 s → 2,00 PV/s, 0,05 →
2,25, 0,033 → 2,29 — et à la valeur relevée (0,033 s, une image à 30 fps) le
moteur rend **0,181 coup/s**, exactement la cadence mesurée. Encore un chiffre
qu'on n'a pas eu à caler.

Un seul point de sortie, `endDash()`, qui remet ensemble vitesse, facteur de
vitesse et traînée — c'est le piège du Bretteur.

**Le garde-fou reste obligatoire.** « La lance ne blesse qu'en charge » : une
arme de 164 px braquée dans l'axe du déplacement, chez un combattant qui se
déplace *vers* son adversaire, l'embroche en continu. Sans le verrou, 0,42
coup/s contre 0,181 relevé et 30 duels gagnés en 19 s — le piège du Hors-la-loi,
repayé une troisième fois.

**Deux paramètres de cadence, et tous deux se règlent à contre-intuition.**

- `lunge.cone` (0,15) — **le serrer améliore la cadence**. Banc : 0,15 → 0,157
  coup/s, 0,30 → 0,149, 0,60 → 0,120. Un cône large laisse partir des charges
  mal alignées, qui manquent, et le temps mort qui suit est perdu.
- `lunge.minRange` (265) — rouvert depuis 320, parce que la charge sur cône
  étroit s'engage moins souvent que l'ancienne charge sur angle corrigé.
  Banc : 320 → 2,04 PV/s, 300 → 2,26, 280 → 2,35, **265 → 2,52**, 200 → 3,29.

Dans les deux cas, le levier est le **taux de réussite** des charges, jamais
leur fréquence.

**Le relevé est rendu.** Le moteur donne **0,195 coup/s** et **2,52 PV/s**,
contre 0,181 et 2,54 mesurés : le budget de dégâts — ce qui décide les duels —
tombe à 0,02 près.

**Le plafond de pile est passé de 16 à 15.** Il valait 16 du temps de la visée,
où le mécanisme donnait peu de touches et où il fallait bien qu'elles pèsent.
La charge sur cap en donne davantage : à 16 le Lancier monte à 19 victoires sur
30, à 14 il tombe à 12, à **15** il rend 2,43 PV/s et tient 13.

**Le moteur ne connaît aucun combattant** : `fighter.js`, `physics.js` et
`projectiles.js` lisent la fiche. En ajouter un = une entrée dans
`elements.js` + un module dans `abilities/` + une ligne dans `ROSTER`.

---

## Roster actif — Les autres sont obsolètes

**Le Lancier, le Hors-la-loi, le Bretteur et le Shinobi sont les combattants
actifs.** Les sept éléments restants (`shadow`, `ice`, `fire`, `water`,
`light`, `lightning`, `plant`) restent **obsolètes et gelés** dans
`elements.js` via `DISABLED`. Le Bretteur et le Shinobi ont tous deux été
**réactivés et redessinés à la demande** — le Bretteur en lame de braise
(corps orange, aura rouge flamme — voir `docs/FICHES.md`, section « Reskin —
lame de braise »), le Shinobi en shuriken de flamme (voir sa section) : ce
sont des guest characters retravaillés, pas des relevés vidéo qu'on ranime
sans y toucher — voir la nuance ci-dessous.

```js
// src/data/elements.js
export const DISABLED = deepFreeze(['shadow', 'ice', 'fire', 'water', 'light', 'lightning', 'plant']);
export const PLAYABLE = deepFreeze(ROSTER.filter((id) => !DISABLED.includes(id)));
```

**Les sept éléments désactivés ne sont pas temporaires ni réactivables.**
Ce sont des relevés de vidéos qui ne sont plus maintenus :
- Pas de rééquilibrage si leurs valeurs changent
- Pas de rééquilibrage en fonction d'eux
- Pas de validation d'équilibre (matrice)
- Pas de vérification de langue pour leurs fiches

Le Bretteur et le Shinobi n'entrent pas dans cette règle : leur réactivation
était une demande explicite, leur fiche passe `tools/fiche-check.mjs` et
`tools/lang-check.mjs` comme n'importe quel combattant actif, et ils comptent
désormais dans la matrice de rééquilibrage ci-dessous.

Ce que la désactivation touche, et ce qu'elle ne touche pas :

| Touché | Raison |
| --- | --- |
| écran de sélection (`ui/select.js` lit `PLAYABLE`) | Seuls les actifs sont jouables |
| duel par défaut (`main.js`) | Hors-la-loi vs Bretteur (`PLAYABLE[0]` et `PLAYABLE[1]`) — le Bretteur a rejoint `ROSTER` juste après le Hors-la-loi, en queue et avant le Lancier ; le Shinobi (`wind`) a été **déplacé** en queue de `ROSTER`, après le Lancier, pour la même raison (voir sa section) |
| `tools/matrix.mjs` — mesure seulement `PLAYABLE` | Rééquilibrage : 10 affrontements × 3 seeds (30 duels) |
| Sortie de la matrice | `tools/matrix-reference.txt` régénérée : 10 lignes |

**L'accès par URL reste disponible** (`?a=fire&b=ice`) pour la consultation
archivistique, mais sans validation ni équilibre.

Le duel par défaut est **Hors-la-loi contre Bretteur**.

**Le Bretteur porte désormais trois ajouts demandés, distincts du reskin
visuel : une brûlure au contact, et la Rage infernale du Feu greffée en
troisième créneau (`special`, même patron que le Blizzard et le Lien
d'essence — invariant 7).** Contrairement au reskin « lame de braise », qui
n'avait rien touché à l'équilibre, ce sont des ajouts de **gameplay**, donc la
matrice a bougé — et c'est voulu :

- **Brûlure au contact** (`weapon.melee.onHit.dot`) : chaque coup de lame
  marque la cible d'un tic de brûlure dérivé de la pile de Spin Speed. `calé`
  au banc, pas à l'estime — à 2 s de durée (deux tics par coup), le Bretteur
  balayait les deux autres actifs (5/6, contre 0/6 avant l'ajout) : la
  brûlure s'ajoutait à des dégâts au contact déjà mesurés sans que sa cadence
  de touche n'ait bougé. Ramenée à **1 s (un seul tic)**, il gagne 2/6 — un
  vrai gain sur son relevé d'origine sans en faire le plus fort du roster.
- **Rage infernale** (`special.infernalRage`) : nova, ailes de flammes et
  aura brûlante repris de `abilities/fire.js`, sur l'horloge des pouvoirs
  greffés (cooldown 11 s, durée 5,2 s, comme le Blizzard et le Lien
  d'essence — calée sur la durée des duels du roster réduit, pas sur le cycle
  de ~26 s du Feu). N'utilise ni `f.boost` ni `f.boostFactor` : BLADE RUSH
  s'en sert déjà pour son propre sprint, et les deux horloges (`f.ult` et
  `f.state.spec`) tournent indépendamment. Au banc, ce levier a peu pesé —
  c'est la brûlure au contact qui a fait presque tout l'écart.
- **Aura et sillage passent aux flammes** (`look.aura`, `look.trail`) :
  écart visuel assumé, comme le reste du reskin — voir `docs/FICHES.md`.

**Relevé courant : le Bretteur perd toujours 0/3 contre le Hors-la-loi, mais
gagne 2/3 contre le Lancier — soit 2/6, contre 0/6 avant ces trois ajouts.**
Le duel par défaut (Hors-la-loi vs Bretteur) reste donc à l'image de son
relevé d'origine (9/30 dans l'historique à onze combattants) ; c'est contre
le Lancier que l'écart se voit. `tools/matrix-reference.txt` a été régénérée
en conséquence — seules les quatre lignes qui impliquent le Bretteur ont
bougé, jamais `outlaw vs outlaw`, `outlaw vs lancer` ni `lancer vs lancer`.

**Quatrième vague — demandée, gameplay assumé.** Trois retouches en plus sur
le Bretteur, et une sur le Hors-la-loi, toutes en écart assumé au relevé :

- **Lame agrandie ×1,3** (`weapon.reach`, `handle.length`, `head.scale`,
  `hitbox.radius` recalés dans la même proportion : 152 → 197,6). Un reskin
  ne change normalement pas la hitbox (voir plus haut), mais ici la taille
  elle-même était la demande — la pointe dessinée retombe donc exactement sur
  la nouvelle portée (invariant 5), et le rayon de la hitbox suit la même
  échelle.
- **Cendres, en plus des flammes** (`look.flair.weaponArc`, `powder: true`) :
  poussière grise le long de la lame, quelques braises qui rougeoient (`core`),
  sur le même patron `powder` que le givre du Hors-la-loi. Purement décoratif
  (`render/flair.js`), ne peut rien changer au duel.
- **Fuseau de cendre** (`look.flair.smear`) : le Bretteur n'en avait aucun ;
  il gagne un panache de cendre qui suit le corps, distinct du ruban de lame
  (orange) et de la poussière d'arme ci-dessus.
- **Bas d'écran en orange** : les deux jauges (`ultimate.barFill`,
  `special.barFill`) et la couleur des lignes de stat (`hud.color`) suivent
  désormais le reskin flamme — c'était la dernière zone du bas d'écran encore
  en or/rouge d'origine.
- **Vitesse du Hors-la-loi ×1,2** (455 → 546, sous le 604 mesuré) : le calage
  à 455 datait d'avant le roster réduit et le rendait trop lent face au
  Bretteur agrandi.

**La lame agrandie et la vitesse du Hors-la-loi sont deux vrais leviers de
jeu, pas des retouches cosmétiques : la matrice a bougé et a été régénérée.**
Le total du Bretteur reste 2/6, mais la répartition s'inverse — 1/3 contre le
Hors-la-loi (contre 0/3 avant), 1/3 contre le Lancier (contre 2/3 avant) — et
le Lancier, déjà l'écart le plus marqué du roster réduit, monte de 4/6 à 5/6
pendant que le Hors-la-loi descend de 3/6 à 2/6 face au Bretteur. Aucun des
deux changements demandés ne visait l'équilibre ; ce déplacement est la
conséquence assumée, pas une dérive à corriger.

**Cinquième vague — demandée, purement visuelle cette fois.** Trois ajouts,
aucun ne déplace la matrice :

- **Lame ×1,3 de plus** (`head.scale` 1,448958 → 1,8836454). `handle.length`
  recalé au ratio exact du PNG devient négatif (−31,26) — au-delà du point où
  le pommeau se pose au centre de la bille, grandir encore ne peut que le
  faire déborder derrière le pivot, jamais au-delà de son bord (rayon 41).
- **`weapon.overBody: true`** — même drapeau que le Lancier. La manche, en
  grande partie masquée par la bille jusqu'ici, passe désormais par-dessus :
  bille, anneaux d'état et chiffre de PV compris. C'est ce qui rend le
  `handle.length` négatif sans conséquence visuelle fâcheuse.
- **Roue de flamme au déclenchement de BLADE RUSH**, remplace l'anneau plein
  (`game.fx.ring`). Nouveau sprite pixel-art, `BLADESMAN_FLAMEWHEEL`
  (`pixelmaps.js`) : moyeu à rayons et gemme, cerné de langues de feu et de
  grains de cendre. Conçu (il n'y a pas de maquette pour cet effet), pas
  transcrit — voir `docs/FICHES.md` pour le détail. Les cendres qui
  l'accompagnent passent par `game.viewRng`, jamais `game.rng` : `Effects.
  burst()` aurait tiré dans le flux de simulation.

**Sixième vague — corrige un effet de bord de la cinquième, plus une demande
transverse aux trois combattants greffés.**

- **`look.hpOverWeapon` — nouveau drapeau opt-in, `fighter.js`.** La manche
  par-dessus la bille (vague précédente) recouvrait le chiffre de PV, resté
  sur l'ordre par défaut (chiffre avant l'arme) : il disparaissait dessous,
  en plus d'être sombre sur une manche sombre. Le drapeau pose le chiffre
  **après** l'arme quand il est vrai ; faux par défaut, donc les dix autres
  combattants — Lancier compris, dont la lance ne recouvre le centre qu'en
  charge — gardent leur ordre. Seul le Bretteur le porte.
- **`hpColor` du Bretteur revient au crème mesuré** (`#f5f2ea`, assombri à
  `#2a0e05` du temps où le chiffre se lisait sur l'orange du corps, pas sur
  la manche).
- **Les jauges d'ultime et de pouvoir spécial partagent maintenant leur
  couleur**, pour les trois combattants qui portent les deux (Hors-la-loi,
  Bretteur, Lancier) : la jauge d'ultime reprend exactement `barFill`/
  `barText` de la jauge de pouvoir spécial juste en dessous. Taille et police
  étaient déjà partagées (`HUD.special` recopie `HUD.bar`, `render/hud.js` les
  trace avec la même fonction) ; seule la couleur restait volontairement
  distincte, pour qu'on reconnaisse les deux jauges au premier coup d'œil —
  c'est ce choix qui est renversé ici, sur demande explicite.

Les trois changements sont purement visuels ; matrice inchangée au caractère
près.

---

## Le Vent devient le Shinobi

**Réactivé et reskin, à la demande — même patron que le Bretteur.** Le Vent
était `DISABLED` depuis la réduction du roster ; il en sort sous un nouveau
nom, une nouvelle arme et de nouveaux projectiles, tout le reste (stats,
Tornade, SALVE DE TEMPÊTE) restant le relevé vidéo d'origine, inchangé.

| Ce qui change | Détail |
| --- | --- |
| Nom | `VENT`/`WIND` → `SHINOBI`/`SHINOBI` (`id: 'wind'` ne bouge pas — voir plus bas) |
| Tagline | « lames d'air » → « shurikens », pour rester exact : le projectile n'est plus une lame d'air |
| Arme | shuriken crème → **shuriken de flamme**, vrai PNG (`assets/sprites/shinobi-shuriken.png`), même technique que la lame du Bretteur |
| Projectiles | `crescent` (le seul, lancé par `ultimate.volley`) → même sprite que l'arme, **même taille** |

**`id: 'wind'` ne change pas.** Comme pour le Bretteur, l'identifiant interne
n'est montré à personne (URL d'archive, clé du module de pouvoirs, clés de
sprite) : le renommer aurait touché `ROSTER`, `DISABLED`, `abilities/index.js`
et les deux `PIXEL_MAPS` sans rien apporter au joueur. Seuls `name`/`nameRef`
changent.

**L'arme est un vrai PNG, directement — pas de passage par un pixel-art
texte intermédiaire.** Contrairement au Bretteur (trois passages : rectangle,
pixel-art modélisé, puis PNG), la demande donnait d'emblée la maquette et la
technique à utiliser. `head.sprite: 'windShuriken'` est servi par
`assets/sprites/shinobi-shuriken.png` (déclaré dans
`assets/sprites/manifest.json`) — la maquette recadrée sur sa plus grande
composante connexe, comme la lame du Bretteur. Une différence : cette
maquette isolait mal l'objet du damier de transparence sur les zones sombres
(le disque du crâne de dragon central, les creux entre les branches) — un
simple retrait de fond y laissait des poches de damier visibles. `cv2.inpaint`
(méthode Telea) a rebouché ces poches à partir des pixels voisins, sans
toucher au reste de l'image. Deuxième écart à l'invariant « aucun binaire
dans le dépôt », après la lame du Bretteur.

**Reach, hitbox et gabarit de l'arme sont inchangés — au moment du reskin.**
Le PNG recadré (198 × 200) est quasi carré, comme l'était déjà
`WIND_SHURIKEN` (17 × 17, le pixel-art de repli) : `handle.length` et
`head.scale` retombaient donc sur la même taille dessinée (~74 px) sans
recalcul — contrairement à la lame du Bretteur, dont le nouveau ratio (bien
plus allongé que son pixel-art de repli) avait forcé à recalculer
`handle.length`. Pur reskin, aucune valeur de gameplay de l'arme ne bougeait.
**Cette géométrie a été refaite depuis** — voir « La bille devient le
shuriken » plus bas.

**Les projectiles reprennent le même sprite que l'arme, à la même échelle.**
« Remplacer les projectiles par des shurikens de la même taille » : la clé
`crescent` (toujours celle que lit `ultimate.volley`) pointe désormais sur
`windShuriken` au lieu de `windCrescent`, à `scale: 4.35` (contre 3,6) — soit
la taille dessinée de l'arme en main, ~74 px, pas une taille propre au
projectile. Le rayon de collision suit la même proportion (12 → 15) pour que
la hitbox ne mente pas sur un projectile devenu plus grand — même discipline
que la lame agrandie du Bretteur (invariant 5).

**`ROSTER` : le Shinobi est déplacé en queue, pas seulement retiré de
`DISABLED`.** `wind` occupait sa place d'origine parmi les huit éléments
(juste avant `plant`), en tête de `PLAYABLE` une fois `DISABLED` filtré —
donc **avant** `outlaw`/`bladesman`/`lancer`. Le laisser là aurait changé le
camp A de leurs six duels existants (invariant : « un nouveau venu s'ajoute
en queue »). `wind` est donc retiré de sa position d'origine dans `ROSTER` et
réinséré tout à la fin, après `lancer` — le duel par défaut
(`PLAYABLE[0]`/`PLAYABLE[1]`, Hors-la-loi vs Bretteur) et les six duels
existants entre les trois invités restent identiques au caractère près ;
seules les quatre nouvelles lignes impliquant `wind` s'ajoutent.

**Corps passé au noir, à la demande.** `look.body` était crème-sable
(`#bcbf9e`) ; il est maintenant `#141414` — la couleur d'un shinobi. Piège
déjà payé sur le Bretteur et évité ici d'entrée : le contour mesuré
(`#0a0a0a`) et le chiffre de PV (`hpColor`, aussi `#0a0a0a`) collaient déjà au
noir, et seraient devenus illisibles **noir sur noir** une fois le corps
assombri. Le contour est donc repassé à l'orange de braise du shuriken
(`#e8621b` — reprend la teinte de l'arme, contraste net sur le corps *et* sur
le blanc de l'arène), et le chiffre de PV au crème mesuré ailleurs dans le
roster (`#f5f2ea`) plutôt qu'assombri une deuxième fois. Vérifié à l'écran
(`tools/shot.mjs`) : lisible dans toutes les configurations, y compris à
faible PV où le chiffre se détache sur le corps noir. Purement visuel — aucune
valeur de combat touchée, matrice inchangée au fichier près.

**Relevé de matrice initial : le Shinobi perdait tout, sauf son propre
miroir.** 0/3 contre le Hors-la-loi, le Bretteur et le Lancier, 3/3 en
mirroir — soit 0/9 contre les trois autres actifs. Aucune valeur de combat
n'avait été retouchée (seul le rayon de collision du projectile avait
**légèrement augmenté**, 12 → 15, ce qui aide plutôt que ça ne nuit) : c'est
le relevé du Vent d'origine, dont l'historique à onze combattants le situait
déjà sous la moyenne (12/30), mis face aux trois invités les plus agressifs
du roster plutôt qu'à un panel de onze. Aucun rééquilibrage n'avait été
demandé, ce résultat était resté documenté tel quel. Il a changé depuis — voir
le Clone d'ombre ci-dessous.

### Aura et traînée, au noir

**Demandé, purement visuel.** `look.aura.color` et `look.trail.color`
passent du khaki-crème (`rgba(214,205,170,…)` / `rgba(207,198,168,…)`) au
noir (`rgba(20,20,20,…)`) — c'était le dernier vestige de la palette
crème-sable d'avant le reskin en noir. `look.flair.ribbon`/`.motes`/
`.impact`/`.castFlash` ne sont **pas** touchés : non demandés, et ils restent
lisibles sur le corps noir. Matrice inchangée — ni `aura` ni `trail` ne sont
lus par un module de pouvoirs (`fiche-check.mjs` ne les couvre d'ailleurs pas,
ce ne sont pas des blocs de fiche au sens de l'outil).

### Clone d'ombre — nouveau pouvoir, troisième créneau

**Demandé : « ajoute un nouveau pouvoir supplémentaire qui crée un clone de
lui-même avec 20 PV ».** Troisième créneau greffé, même patron que le
Blizzard/la Rage infernale/le Lien d'essence (invariant 7) — sauf que celui-ci
n'est pas repris d'un autre combattant, il est conçu pour le Shinobi.

| Ce que fait le clone | Comment |
| --- | --- |
| Apparaît | 130 px derrière le Shinobi (calé dans l'arène), 5 s après le début du duel, puis toutes les 12 s — **sans attendre la mort du précédent** : plusieurs clones peuvent coexister |
| PV | 20 (demandé), affichés comme ceux d'un vrai combattant |
| Rendu | **identique au vrai Shinobi, sans l'arme** — voir plus bas — à 88 % d'opacité, seul indice visuel de qui porte les PV du duel |
| Se fait toucher | par l'arme adverse (mêlée) et par les projectiles adverses, comme un vrai combattant |
| Riposte | jette des shurikens vers l'adversaire, toutes les 1,1 s |
| Disparaît | **uniquement à 0 PV** (demandé, permanent sinon) — une gerbe |
| Jauge | seconde rangée du HUD, `SHADOW CLONE`, sous `TEMPEST VOLLEY` — mêmes couleurs (convention de la sixième vague du Bretteur) |

**Le moteur ne connaît que deux combattants, et ce n'est pas près de
changer.** `match.js`, `physics.js` et `projectiles.js` sont écrits pour
`this.a`/`this.b` de bout en bout — HUD, statistiques, séquence de victoire.
Inscrire le clone comme un troisième `Fighter` dans `game.fighters` aurait
fait déborder l'ajout dans les trois fichiers du moteur, très loin du seul
module du Shinobi. Le clone est donc un objet ordinaire, **coiffé du
prototype `Fighter`** (`Object.setPrototypeOf(clone, Fighter.prototype)`) :
il hérite `draw()`, `radius`, `onStage`, `weaponPivot()`… sans dupliquer une
ligne de rendu, et reste visuellement identique au vrai combattant par
construction plutôt que par copie. Contrepartie assumée : le clone reste
**stationnaire**, mais depuis la demande « corps solide » il n'est plus
incorporel — voir `resolveCloneBody` plus bas. Un clone qui pilote et percute
*en se déplaçant* aurait exigé les mêmes trois fichiers moteur qu'un clone
inscrit dans `game.fighters` ; un clone qui bloque sans bouger, non.

**Corps solide, à la demande.** Le clone bouscule désormais l'adversaire
*et* le vrai Shinobi — personne ne le traverse. Même geste que
`resolveBodies()` de `physics.js` (séparation puis recul), mais à sens
unique : le clone ne bougeant jamais, c'est toujours l'autre corps qui
encaisse tout l'écartement. Écrite dans `wind.js` plutôt que dans
`physics.js` — qui ne connaît que `this.a`/`this.b` — pour rester confinée au
module du Shinobi, comme le reste du pouvoir.

**Deux réutilisations, une conséquence.** Le corps à corps adverse touche le
clone en rappelant **`weaponHit()` telle quelle** depuis `physics.js` — elle
ne demande que position, rayon et statut, qu'un plain object coiffé du
prototype fournit tous. Les tirs adverses, eux, ne passent jamais par
`Projectiles.update()` (qui ne teste que `game.fighters`) : `wind.js` referme
la boucle lui-même sur `game.projectiles.list`, déjà manipulé directement
ailleurs (`Match.startVictory` le vide de la même façon). Conséquence
mesurée : ce second test tourne **un pas de simulation derrière** celui des
deux vrais combattants (les pouvoirs sont mis à jour avant les projectiles
dans `Match.update()`) — à la cadence du jeu, invisible ; documenté plutôt que
corrigé, pour ne pas toucher l'ordre de `match.js` pour ce seul besoin.

**Les shurikens du clone restent attribués au vrai Shinobi.** Le tir part de
la position du clone mais garde `owner: f` — c'est ce qui fait qu'un coup au
but charge l'ultime du vrai Shinobi et compte dans ses statistiques
(`Match.damage()` lit `source.ult`/`source.el`, absents d'un simple point
d'origine). Un même verrou que `Match.resolveMelee` (`opponent.meleeCd`)
empêche une même frappe adverse de toucher le clone et le vrai Shinobi au
même pas.

**Relevé de matrice après ajout : le Shinobi gagne enfin des duels.** 1/3
contre le Hors-la-loi (contre 0/3), 2/3 contre le Bretteur (contre 0/3),
toujours 0/3 contre le Lancier — soit **3/9** contre les trois autres actifs,
contre 0/9 avant. Toutes les lignes n'impliquant pas `wind` sont
**identiques au caractère près** : le changement reste confiné à ses propres
affrontements (invariant de la matrice). `tools/matrix-reference.txt`
régénérée en conséquence.

**Clone rendu permanent, à la demande.** Le plafond de 6 s (`sp.duration`,
`c.life`) est retiré : plus rien ne fait expirer le clone, seuls ses PV le
peuvent. La clé `duration` disparaît de la fiche (elle n'était plus lue par
personne, `fiche-check.mjs` l'aurait signalée comme morte). Nouveau relevé :
0/3 contre le Hors-la-loi (contre 1/3 — le clone traîne plus longtemps mais
se fait détruire avant de peser), **3/3** contre le Bretteur (contre 2/3),
1/3 contre le Lancier (contre 0/3) — soit **4/9**, contre 3/9 avec le clone
minuté. Toujours confiné aux seules lignes impliquant `wind` ;
`tools/matrix-reference.txt` régénérée une seconde fois.

**Clone rendu solide, troisième relevé : 5/9.** 1/3 contre le Hors-la-loi
(contre 0/3 — un corps de plus dans l'arène gêne son canon asservi),
toujours **3/3** contre le Bretteur, 1/3 contre le Lancier inchangé. Le
blocage joue dans les deux sens (le vrai Shinobi peut lui-même se faire
bloquer par son propre clone) : aucune règle ne l'empêche, et aucun banc n'en
a montré le besoin. Toujours confiné aux seules lignes `wind` ;
`tools/matrix-reference.txt` régénérée une troisième fois.

**Arme retirée du clone, purement visuel.** Demandé : le clone ne porte plus
de shuriken sur lui, alors qu'il continue d'en *jeter* (`throwFromClone` est
inchangé — c'est un tir, pas une arme tenue). `customWeapon` passe de `null`
à un no-op (`() => {}`) : `paintWeapon()` appelle `this.customWeapon(ctx)` au
lieu de `this.drawWeapon()`, donc rien ne se dessine. Les champs
`weaponAngle`/`weaponTwirl`/`weaponLateral`, qui ne servaient qu'à ce rendu,
disparaissent avec lui — plus rien ne les lit. Matrice inchangée au fichier
près : `paintWeapon` n'est jamais lu par `weaponHit()` ni par la collision de
corps, seulement par le rendu.

**Plusieurs clones à la fois, à la demande.** `f.state.clone` (singulier)
devient `f.state.clones` (tableau) : la minuterie de réapparition
(`f.state.cloneCd`) ne se réarme plus à la mort d'un clone, elle tourne en
continu et en pose un nouveau toutes les 12 s, qu'il en reste ou non des
précédents. Chaque clone garde ses PV et son horloge de riposte propres — ce
sont des objets distincts dans le tableau, jamais un état partagé. La
mutuelle exclusion des touches (une même arme ou un même projectile ne peut
toucher deux corps au même pas) tient **gratuitement** : `weaponHit()` pose
`target.meleeCd` dès le premier clone touché, ce qui fait échouer le test
sur tous les suivants dans la même boucle ; un projectile est retiré de
`game.projectiles.list` dès qu'il touche, donc invisible aux clones testés
après lui. La jauge `SHADOW CLONE` ne peut plus annoncer « les PV du clone
actif » (il peut y en avoir plusieurs, à des PV différents) : elle annonce
désormais uniquement la prochaine apparition, tout le temps.

**Relevé de matrice : 7/9**, contre 5/9 avec un clone à la fois. Le
Hors-la-loi passe de 1/3 à **3/3** — un canon asservi qui doit choisir entre
plusieurs cibles perd l'essentiel de son avantage de précision. Le Bretteur
reste à 3/3 (déjà maximal), le Lancier à 1/3 inchangé : sa charge traverse
tout l'écart entre deux corps sans ralentir, plusieurs clones ne lui coûtent
pas plus qu'un seul. Toutes les lignes n'impliquant pas `wind` restent
identiques au caractère près. `tools/matrix-reference.txt` régénérée une
quatrième fois.

### La bille devient le shuriken

**Demandé : « au lieu du shuriken rattaché à la balle, je veux que la balle
devienne le shuriken — la balle représentant le trou et les lames autour ».**
L'arme ne pend plus à côté du corps : le même PNG est **centré sur la bille**,
qui bouche le moyeu pendant que les lames rayonnent tout autour.

| Valeur | Avant | Après | Pourquoi |
| --- | --- | --- | --- |
| `head.scale` | 4,35 | **8,912656** | largeur dessinée 74 → **150 px** |
| `handle.length` | 34 | **−75** | une demi-largeur *avant* le pivot : le sprite retombe centré |
| `reach` | 105 | **75** | le rayon des pointes, pas une portée devant soi |
| `hitbox` | `from 0,45 → to 1`, `radius 18` | **`from 0` / `to 0`, `radius 75`** | segment écrasé sur le centre = **disque** |

**L'invariant du dépôt tient toujours** : `handle.length + largeur dessinée
= −75 + 150 = 75 = reach`. La pointe dessinée ne ment pas sur la portée,
exactement comme pour les dix autres armes — le calcul est juste devenu
symétrique.

**La hitbox tout autour ne coûte pas une ligne de moteur.** `from` et `to` à
zéro confondent les deux extrémités du segment tranchant sur le pivot ;
`segmentPointDistance` traite déjà le cas dégénéré (`len2 === 0`), donc
`weaponHit()` teste `distance ≤ rayon adverse + 75` — un disque centré sur la
bille, sans direction privilégiée. **La forme de la hitbox se dit entièrement
dans la fiche**, ce qui est exactement ce que l'invariant « le moteur ne
connaît aucun combattant » promettait sans qu'on ait eu à l'éprouver jusque-là.

**La taille est un compromis assumé.** Caler la bille (82 px de diamètre) sur
le vrai moyeu de la maquette — 30 % du rayon, mesuré sur le PNG — aurait
demandé un shuriken de **273 px**, soit près de la moitié de la largeur de
l'arène. À 150 px les lames dépassent de 34 px tout autour : assez pour se
lire comme un shuriken, pas assez pour manger le cadre. La bille couvre donc
le moyeu *et* la naissance des lames, et ce qui dépasse est précisément la
partie flamme de la maquette.

**L'arme reste sous le corps** (pas de `overBody`) : c'est ce qui fait que la
bille bouche le trou au lieu de passer derrière. Et le ruban de
`render/flair.js` suit `reach` le long de `weaponAngle` : il trace maintenant
un **cercle** de 75 px autour du combattant au lieu d'un arc devant lui —
gratuit, et raccord avec un shuriken qui tourne sur lui-même.

**Les projectiles ne suivent pas.** `projectiles.crescent` reste à
`scale: 4,35` (~74 px) : la règle « des shurikens de la même taille que
l'arme » datait de l'arme tenue en main ; un projectile de 150 px serait
devenu illisible. C'est l'écart assumé de cette étape.

**Le clone reste une bille nue.** « Supprime l'arme rattachée au clone »
avait été demandé à l'étape précédente, et `customWeapon` reste un no-op :
les clones n'ont donc pas de lames, ce qui les distingue au premier coup
d'œil du vrai Shinobi — et dit juste, puisqu'eux ne blessent qu'au shuriken
lancé.

**Relevé de matrice : 8/9**, contre 7/9 avec l'arme tenue. Le seul
déplacement est **le Lancier, qui passe de 2/3 à 1/3** : une hitbox qui ne
dépend plus de l'orientation de l'arme punit la charge, qui traversait
jusqu'ici entre deux passages de lame. Le Hors-la-loi et le Bretteur étaient
déjà à 0/3, ils y restent. Les durées se raccourcissent partout (les duels
contre le Shinobi passent de ~20-26 s à ~16-24 s), ce qui est la signature
d'une cadence de touche en hausse. **À 8 victoires sur 9, le Shinobi est
désormais l'anomalie du roster réduit**, à la place qu'occupait le Lancier :
c'est la conséquence directe d'une demande, documentée telle quelle et non
corrigée d'office. Les leviers, si l'on veut le ramener : `hitbox.radius`
(75), `melee.damage` (3) et `melee.cooldown` (1 s).

### Style sombre ninja

**Demandé, purement visuel — et la matrice le prouve.** Le shuriken passe en
nuances de gris, les nombres de dégâts en noir, aura et traînée en gris-noir,
et la rotation d'arme monte de ×1,3.

**L'arme est repeinte, pas redessinée.** `shinobi-shuriken-dark.png` est le
même PNG dont la **luminance est remappée** sur une rampe de gris : le métal
sombre reste quasi noir, les anciennes flammes deviennent un gris moyen
(p50 61 → 51, p95 197 → 136), avec une pointe de bleu acier et **l'alpha
conservé au pixel près**. Le `manifest.json` bascule dessus ; l'original en
flammes reste dans le dossier, et c'est très exactement le rôle de cette
couche d'indirection — revenir en arrière est une ligne de JSON.

**La borne haute de la rampe est le vrai réglage.** L'arène est blanche : un
gris pâle n'y existe pas (leçon déjà payée sur la poudre de givre du
Hors-la-loi). Les anciennes flammes sont donc plafonnées à **168/255**, assez
clair pour garder le dessin des lames lisible, assez tenu pour que l'objet
entier se lise comme une silhouette sombre.

**« Les dégâts en noir » se règle par `look.accent`.** C'est lui que
`Flair.hit()` met dans le nombre qui s'envole — et aussi dans la marque au
sol, les traits de sillage et la gerbe d'impact. Il passe à `#1f1f24`, pas à
`#000` : le moteur pose déjà un **contour `#0a0a0a`** autour du chiffre, et un
remplissage strictement identique effacerait le relief du glyphe.

**La première passe « aura et traînée en noir » était incomplète.** Elle
n'avait touché que `look.aura` et `look.trail`, en laissant le bloc `flair`
— or c'est lui qui porte ce qu'on voit vraiment traîner : le ruban de 75 px,
les motes, la gerbe d'impact, l'éclair d'incantation. Tous passent en gris
ardoise ici, ainsi que la traînée du projectile. `castFlash` devient sombre :
l'écran **s'assombrit** un huitième de seconde au lieu de blanchir.

**La rotation ×1,3 (`SPIN * 1,1` → `SPIN * 1,43`) est vérifiable, pas
seulement annoncée.** Depuis que la hitbox est un disque centré, `weaponAngle`
ne décide plus d'aucune collision : il ne reste que le sprite qui tourne et le
ruban qui suit `reach`. La matrice est **identique au caractère près**, ce qui
est la preuve attendue pour un changement déclaré visuel.

**Ce qui reste chaud, et pourquoi.** Trois choses n'ont pas été touchées faute
d'avoir été demandées, et chacune se défend : le **contour orange de la
bille** (`#e8621b`), qui est ce qui détache le moyeu des lames grises et dont
la lisibilité a été validée à l'écran ; le **disque de sable de la Tornade**,
qui est un relevé vidéo et ne dure que 0,2 s ; et les **jauges + la ligne de
stat** du bas d'écran, encore en khaki. Les trois sont des lignes de fiche à
changer si l'on veut pousser le noir jusqu'au bout.

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
   - **Un seul écart connu subsiste.** La **Lumière à 21/30** : son Égide
     grandit quand elle **encaisse**, et les trois invités frappent rarement
     pour beaucoup — exactement le profil que le bouclier absorbe. Elle les bat
     9-0. Ce n'est pas une dérive, c'est un couplage de fiches ; aucune valeur
     de la Lumière n'a jamais été touchée.
     L'**Eau tient la bande de justesse à 13**, en perdant 0-3 contre l'Ombre,
     la Lumière et le Lancier. C'est elle que la moindre retouche du Lancier
     fait sortir, donc la première à surveiller : à `lunge.minRange` 220 il la
     balaie 3-0 et elle tombe à 12, à 240 il n'en prend que deux et elle
     revient. Ces 20 px de fenêtre coûtent 0,13 PV/s de fidélité (2,53 contre
     2,40) — la bande passe avant, c'est un invariant.
   - **Le tour de rechargement du Hors-la-loi lui coûte ses touches de mêlée.**
     Pendant 1,4 s l'arme n'est plus asservie, or le bout du canon porte la
     hitbox de contact (`hitbox.from: 0,62`) : il balaie au lieu de pointer. Le
     personnage était tombé de 15 à **9/30** en gagnant l'effet. Porter le gel
     de 0,30 à **0,50** l'a ramené à **16/30** — plus que compensé, donc, et
     c'est le levier à retenir : `projectiles.shot.onHit.slow`.
   - **Le Lancier est à 30/30 — il gagne tous ses duels.** C'est le piège de
     l'arme braquée dans sa forme la plus pure : une charge qui traverse toute
     l'arène, contre dix adversaires qui pilotent vers lui et entrent donc dans
     le couloir. Le roster étant réduit à lui seul et le duel par défaut étant
     un miroir, ça ne se voit pas en jouant — mais **il faudra le traiter avant
     toute réactivation**.
     Le rayon de hitbox n'est pas le levier : de 12 à 3 il ne descend que de
     0,506 à 0,439 coup/s. Les charges ne frôlent pas, elles traversent. Les
     vrais leviers sont la fréquence de balayage (`lunge.scanSpin`) et le
     retour à une charge de longueur bornée au lieu d'une traversée.
   - Relevé courant : Lancier 30, **Hors-la-loi 25**, Ombre 15, Lumière 15,
     Glace 15, Feu 13, Vent 12, Plante 11, Foudre 10, Eau 10, Bretteur 9.
     **Sept hors bande.** La Glace remonte de 13 à 15 en même temps que le
     Hors-la-loi descend de 26 à 25 : c'est la correction du flux de la neige,
     que leurs deux Blizzards sèment.
   - **Le Hors-la-loi à 26/30 est un écart assumé, pas une dérive.** Il est la
     conséquence directe de trois changements demandés — rechargement ×2 plus
     rapide, balle ×1,3, éclats de givre — et l'ablation dit lequel pèse :
     rechargement seul **23**, éclats seuls **28**, vitesse de balle seule 14
     (soit **rien de mesurable**, deux victoires sur trente sont dans le bruit
     du banc). C'est cohérent avec l'historique : le tour de rechargement lui
     coûtait ses touches de mêlée, le diviser par deux les lui rend.
     Aucun levier disponible ne ramène la bande sans défaire la demande — la
     cadence du Blizzard est **plate** (25–26 de 11 s à 26 s), celle des éclats
     ne descend pas sous 23, et `ability.cooldown` comme `magazine` sont
     `mesuré`. La dispersion y arrive (1,35 rad → 16) mais un cône de 77° fait
     cesser le canon asservi de se lire comme une visée. Le réglage est
     documenté dans `docs/FICHES.md` pour qui voudra le rentrer dans la bande.
   - **Les deux pouvoirs greffés ont déplacé sept affrontements sur 66, et
     n'ont fait sortir personne de la bande.** Six sont ceux du Blizzard, un
     celui du Lien. Le Hors-la-loi passe de 16 à 15 — au centre de la bande —
     une fois la recharge calée à 11 s. Le nombre de combattants hors bande
     est le même qu'avant (six), et les deux plus gros écarts, Lancier 30 et
     Lumière 18, sont les deux anomalies déjà documentées : elles sont
     inchangées.
   - **Le recul symétrique a ramené le Lancier dans la bande tout seul**, de 19
     à 17, sans qu'aucun levier d'équilibrage ne soit touché : un attaquant
     repoussé aussi fort que sa cible met plus longtemps à revenir au contact.
     C'est un réglage de mise en scène qui a rendu un équilibre — l'inverse
     arrive plus souvent.
   - **`ROSTER` décide qui est le camp A.** Les paires sont formées en
     `[liste[i], liste[j]]`, et le camp A pèse lourd. Un nouveau venu s'ajoute
     donc **en queue** : inséré ailleurs, il déplacerait le camp A
     d'affrontements existants et changerait leur issue sans qu'aucune valeur
     de fiche n'ait bougé.
4. **Le décor ne bouge jamais** (cahier des charges) — rasterisé une fois dans
   `scene.js`, blitté en un `drawImage`.
5. **Deux rotations d'arme, à ne jamais confondre.** `weaponAngle` est la
   direction dans laquelle l'arme **pointe depuis le corps** : la faire tourner
   fait *orbiter* l'arme autour de la bille, comme une aiguille d'horloge.
   `weaponTwirl` est la rotation **propre** de l'arme autour du milieu de sa
   carte : elle la fait *vriller sur place*. Le rechargement du Hors-la-loi a
   été écrit avec la première avant d'être repris avec la seconde — c'est
   `weaponTwirl` qui donne un pistolet qu'on recharge plutôt qu'un pistolet
   qu'on fait tournoyer au bout d'un bras. Le centre de vrille est **déduit de
   la portée** (`(handle.length + reach) / 2`), pas mesuré sur le sprite, ce
   qui le garde cohérent avec la pointe.
6. **Convention de commentaire dans les fiches** : chaque valeur porte
   `mesuré` (relevé vidéo), `calé` (ajusté par simulation) ou `déduit`.
   Ne jamais changer une valeur `mesuré` sans nouveau relevé. Et ne pas caler
   par réflexe : la vitesse du Lancier a été mesurée à 540 px/s et **gardée**,
   parce que le banc a montré qu'elle ne cassait rien (15/30 contre 16/30 à
   470). Un `calé` doit être justifié par une mesure, pas par une intuition.
7. **Les compteurs génériques du `Fighter`.** `offstage`, `invulnerable`,
   `boost`, `ghosting`, `weaponLateral` et `weaponTwirl` ont tous la même forme : un module les allume, le
   moteur les décompte, et le moteur **ne sait pas pourquoi**. `ghosting` est
   le plus récent — il dit « sème des images fantômes », il n'est lu que par
   `render/flair.js`, donc l'allumer ne peut rien changer au duel. C'est la
   forme à reprendre pour tout nouvel effet accroché à un état de module.
8. **`alive` ≠ `onStage`.** Un combattant peut être vivant *et absent* :
   `Fighter.offstage` (secondes restantes hors du plateau) le retire du
   déplacement, des collisions, des touches, des projectiles, du rendu et de
   toute la mise en scène. Le moteur ne sait pas *pourquoi* il est parti — seul
   son module le sait (le Bond du Lancier). **Toute boucle sur les combattants
   qui teste `f.alive` pour décider de le *voir* doit tester `f.onStage`** :
   `render/flair.js` (six boucles), `physics.js`, `projectiles.js` et le rendu
   de `match.js`. Un oubli laisse un ruban, une nappe ou une hitbox fantôme au
   dernier point connu.
9. **Une clé de fiche que plus personne ne lit ne crie pas.** Deux régressions
   du même type, toutes deux silencieuses : `lunge.recoil` et `lunge.hitRing`
   supprimés alors que le module les lisait encore — `push(..., undefined)`
   donnait NaN et la position partait en NaN dès la première touche ; puis
   l'écriture de `weaponLateral` perdue dans une réécriture de la machine
   d'états, `lunge.lateral` restant dans la fiche sans lecteur. Le premier cas
   plante bruyamment, **le second jamais** : l'arme cesse simplement de se
   décaler, sans erreur ni test rouge. `tools/fiche-check.mjs` recoupe
   désormais les deux sens. Il ne couvre que `weapon.lunge`, et c'est
   délibéré — `ability` a été essayé et criait à tort dix-neuf fois, or un
   garde-fou qui crie à tort n'est plus lu.
10. **Un ancrage d'arme se pose, il ne s'interpole pas.** `weaponLateral`
   bascule entre `lunge.lateral` et zéro **dans l'image même** où la phase
   change. La première version le rapprochait à vitesse bornée (420 px/s) pour
   éviter un saut : c'était une erreur de lecture, parce qu'une interpolation,
   si rapide soit-elle, fait *glisser* l'arme pendant la charge — donc elle
   court après la bille au lieu de former un bloc avec elle. Le saut est
   exactement ce qu'on veut voir.
11. **Un décalage de dessin doit passer par le pivot, jamais par le seul
   `translate`.** L'arme du Lancier est ancrée **sur le flanc** du corps
   (`Fighter.weaponLateral`, écrit par son module — encore un compteur
   générique : à zéro, les dix autres ne changent pas). `weaponPivot()` est lu
   par `drawWeapon()` **et** par `bladeSegment()` : décaler seulement le dessin
   ferait mentir le sprite sur l'endroit où il coupe. C'est la même discipline
   que `handle.length`, dont la somme avec la carte doit retomber sur la portée.

## Écarts volontaires au relevé

- **L'arme du Bretteur est un vrai PNG, pas du pixel-art texte** — seule
  exception à « aucun binaire dans le dépôt ». `weapon.head.sprite` de
  `bladesman` (`bladesmanFlameBlade`) est servi par
  `assets/sprites/bladesman-flameblade.png` (déclaré dans
  `assets/sprites/manifest.json`), un recadrage direct de la maquette fournie
  pour ce combattant — lame, garde et manche/pommeau en un seul morceau, fond
  transparent. Deux tentatives de manche **dessinée** en pixel-art texte
  (rectangle plein, puis chevron modélisé) avaient précédé ce choix ; la
  demande explicite était de ne rien modéliser et de reprendre l'image
  partagée telle quelle. `BLADESMAN_FLAMEBLADE` reste dans `pixelmaps.js`
  comme **repli automatique** si le PNG venait à manquer (le mécanisme existe
  déjà dans `render/sprites.js`, prévu pour ce cas) — c'est la seule arme du
  roster à s'en servir. `weapon.handle.length` (18,71) est calé pour que la
  largeur réellement dessinée (hauteur × ratio du PNG) retombe exactement sur
  `reach` (197,6, inchangé) : la pointe ne ment pas sur la hitbox, comme pour
  toutes les autres armes.
- **Le moulinet d'élan du Lancier** (`lunge.windup` / `windupSpin`) et son
  **recul renforcé et symétrique** (460 / 460 contre 300 / 95 relevés) sont
  deux ajouts de mise en scène, pas des mesures. Le recul de l'attaquant valait
  200 contre 460 encaissés, et un choc qui pousse deux fois plus fort d'un côté
  se lit comme un coup absorbé plutôt que comme un impact. Une **séparation
  franche** est en outre appliquée dans l'image même de la touche : une
  impulsion décide de la vitesse, pas de la position, donc à bout portant les
  deux corps restaient imbriqués le temps qu'elle les écarte — et c'est
  précisément l'image où l'œil juge le choc. Pour l'amplitude, c'est elle qui
  est montée et non l'amortissement : celui-ci est global
  (`PHYSICS.speedRecovery`), le rendre plus sec pour le Lancier le rendrait
  plus sec pour les onze.
- **L'arme du Lancier passe au-dessus du corps** (`weapon.overBody`) — c'est
  son relevé, la vidéo montre la lance qui recouvre franchement la bille. Elle
  est peinte **en dernier**, après le chiffre de PV compris : elle passait
  auparavant juste avant, pour garder le chiffre lisible, mais les digits
  traversaient alors la lance et **un demi-dessus se lit comme un dessous**.
  Contrepartie assumée : pendant une charge, la lance peut masquer une partie du
  chiffre. Les dix autres gardent l'arme sous le corps, qui est leur relevé.
- Fond hors-arène : la vidéo est sur papier crème, le site est en **encre
  sombre `#1c1a26`**. L'arène reste blanche → le pixel-art garde ses contours
  noirs mesurés. Le « chrome » posé sur le fond sombre (titre, lignes de stat)
  passe à un liseré crème `STAGE.outline` ; les jauges gardent une plaque crème.
- **La traînée du Lancier est jaune de foudre.** Le cramoisi `#c2385a` /
  `#a32b4a` est **mesuré** ; il est passé au violet avec l'arme, puis au jaune
  pour dire la foudre. Contrainte de fond à ne pas oublier : **l'arène est
  blanche**, donc un jaune pâle y serait invisible — la gamme est en ambres
  saturés (`#f0b400`, `#c98a00`), pas en jaunes clairs. C'est la même leçon que
  le mode additif, qui ne fonctionnait que sur le cadre sombre.
- **Deux modes de traînée, `electric` et `powder`, et chaque règle de l'un est
  l'inverse de l'autre.** L'électrique est un **trait** continu et cassé, dont
  l'écart s'annule au point le plus récent, à `rate` élevé pour grésiller. La
  poudre est un nuage de **grains isolés**, dont l'écart **s'ouvre** en
  s'éloignant du combattant (une poudre se disperse en retombant), à `rate` bas
  pour tenir en place, posée sur une **nappe** large et transparente sans
  laquelle les grains se lisent comme des taches détachées. Le Lancier porte le
  premier (foudre), le Hors-la-loi le second (givre). Deux erreurs à ne pas
  refaire, toutes deux déjà au tableau ailleurs : la largeur des passes d'aura
  calculée en `1/k` mettait la passe **la plus large en dernier**, donc le cœur
  opaque délavait l'arme au lieu de la cerner (le défaut de « gélule ») ; et
  « poudre » avait suggéré « pâle », alors que **l'arène est blanche** — un
  grain quasi blanc de 3 px n'y existe pas, la gamme doit rester en bleus tenus.
- **La traînée est électrique** : `ribbon.electric` et `smear.electric`
  remplacent le trait lisse par un tracé **cassé**, en un seul trait continu et
  en deux passes. Trois choses le font tenir, et chacune a été payée : le trait
  doit être **continu** (dessinés segment par segment avec des bouts ronds, des
  points très écartés — pendant une charge la pointe parcourt plus de 200 px en
  une fraction de seconde — se referment en chapelet de perles) ; la cassure
  doit être **perpendiculaire** à la trajectoire, sinon le trait s'allonge au
  lieu de zigzaguer ; et son amplitude doit **s'annuler au point le plus
  récent**, sinon la traînée se décroche du combattant et flotte à côté. Les
  deux tracés partagent le même code mais pas la même graine : à graine égale
  ils grésillent à l'identique et se lisent comme un seul trait épais. Le
  fuseau est large et peu opaque (le corps), le ruban fin et vif (le nerf).
  **Les onze combattants passent par ce code** ; seul celui qui déclare
  `electric` prend la branche, les dix autres gardent leur trait lisse.
- **Les arcs électriques le long de la lame** (`look.flair.weaponArc`) sont
  tracés par un **hachage pur** de (indice, temps quantifié), pas par un tirage :
  un aléa consommé dans une méthode de *dessin* dépendrait du nombre d'images
  affichées, qui n'est pas le nombre de pas de simulation, et deux machines au
  même `?seed=` verraient des décorations différentes. Deux réglages appris à
  l'image : `rate` décide si c'est de l'électricité ou du bruit (retiré à chaque
  image, le tracé donne du grain de télévision ; à 18 paliers par seconde l'œil
  suit chaque arc), et l'amplitude doit **dépasser la demi-épaisseur du sprite**
  — à 13 px sur une lance de 55 px de haut, les arcs restaient entièrement dans
  la silhouette, qui les recouvrait, et on ne voyait rien.
- **L'aura d'arme et l'onde de pénétration sont des ajouts**, pas des relevés.
  Tous deux vivent dans `render/flair.js`, donc ils ne peuvent rien changer au
  duel — c'est exactement ce que cette porte d'entrée sert à garantir, et la
  matrice le vérifie. Deux réglages appris à l'image : l'aura à 26 px de large
  formait une **gélule** qui délavait la hampe au lieu de la cerner (14 la
  borde), et le coin de pénétration à 60 × 26 se lisait comme une **boule**
  collée à la pointe (82 × 12 le rend élancé). Le ruban, lui, est passé de 18 à
  13 px : pendant une charge la pointe parcourt 224 px en 0,16 s, donc deux
  points consécutifs sont très écartés et un trait épais à bouts ronds se
  referme en barres pâles détachées du combattant.
- **Le Lancier ne ressemble plus à sa vidéo, et c'est demandé.** Son **arme**
  est la **lance électrique** d'une maquette fournie — pommeau doré, hampe
  violette parcourue de fissures blanches, tête hérissée à gemme — là où la
  vidéo montre une lame en feuille indigo. Sa **bille**, sa **jauge** et sa
  **ligne de stat** suivent la gamme violette de l'arme. Tout le reste —
  portée, cadence, dégâts, vitesse, Bond — reste au relevé.
- **Le violet retombe près du relevé, le cuivre en était l'écart.** La bille
  porte `#7046ac`, la hampe de la lance ; la vidéo donne `#574a84`. C'est donc
  le détour par le cuivre (`#c9905f`, du temps de la lance de bronze) qui
  s'éloignait du relevé, pas ce retour. Corollaire : le crème `#f5f2ea`
  **mesuré** du chiffre de PV revient, après avoir dû passer en brun sombre le
  temps où le cuivre clair de la bille le noyait. Et la teinte reste distincte
  de l'Ombre (`#870286`), qui est un magenta à rouge dominant.
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

node tools/fiche-check.mjs               # garde-fou des fiches : chaque clé de
                                         # `weapon.lunge` doit être lue par son
                                         # module, et chaque lecture avoir sa clé

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
  balayant des cadences pour le Lancier, une expression ancrée sur
  `hitbox: { from: …` a réécrit celle du **Hors-la-loi** (0,62 → 0,32) : cinq
  affrontements de la matrice ont bougé, dont un vainqueur. La seconde fois,
  un `re.sub` sur `onHit: { stackGain: …` a réécrit ceux du Hors-la-loi **et**
  du Bretteur, et un `s.index('damage: (f) => Math.max(')` a pris la première
  fiche du fichier au lieu de la bonne : **tout un balayage de mesures était
  faux sans que rien ne plante**. Règle : un setter de balayage doit
  `assert` que son ancre est **unique**, et il faut relire
  `git diff src/data/elements.js` avant de croire un chiffre.
- **Mesurer un angle contre la mauvaise référence donne une conclusion vraie
  et fausse à la fois.** Le deuxième relevé de la lance concluait « elle vise
  l'adversaire, à ±5° ». C'était exact **sur les images mesurées** — mais elles
  avaient toutes été prises pendant que le Lancier fonçait *sur* l'adversaire,
  là où cap de déplacement et cap adverse se confondent. La vraie loi est
  `weaponAngle = heading` : sur l'ensemble de la vidéo, 6,6° d'écart au
  déplacement contre 37,9° à l'adversaire. Deux gardes-fous en sortent :
  échantillonner **toute** la vidéo et pas les plages où le détecteur marche
  bien ; et mettre les hypothèses **en concurrence** dans le même script plutôt
  que d'en vérifier une seule — c'est ce qui a fait tomber celle-ci en une
  exécution.
- **Un mécanisme juste rend des chiffres qu'on n'a pas calés.** C'est le
  meilleur test disponible, et il a départagé les trois relevés de la lance :
  `weaponAngle = heading` produit tout seul l'angle figé une demi-seconde en
  ligne droite, le saut de 85° au rebond mural, et les 33 °/s médians de
  rotation. Aucun de ces trois nombres n'est écrit nulle part dans la fiche.
  Quand une hypothèse demande un paramètre par comportement observé, c'est
  qu'elle est fausse.
- **Une arme braquée touche en permanence.** C'est le piège du Hors-la-loi,
  repayé à l'identique sur le Lancier. Dès qu'une arme cesse de tourner pour
  **viser**, elle pointe sur la cible à chaque image, donc elle la touche à
  chaque fenêtre de recharge : le Lancier est monté à **0,42 coup/s** contre
  0,181 relevé, et gagnait ses 30 duels en 19 s. Chaque arme braquée doit donc
  porter son propre garde-fou — une dispersion pour le canon, une règle « la
  lance ne blesse qu'en charge » pour la lance. Le garde-fou n'est pas un
  ornement : c'est ce qui rend la précision relevée.
- **Un détecteur qui suit la traînée, pas l'arme.** Le premier portage donnait
  au Lancier une rotation d'arme de 327 °/s « mesurée ». Elle ne l'était pas :
  le relevé prenait le barycentre des pixels indigo les plus lointains, et
  pendant une charge ce sont les **images fantômes**, pas la lance. Sur les
  plages sans charge, l'axe principal du nuage (ACP) tient dans ±5° du cap vers
  l'adversaire — l'arme vise, elle ne tourne pas. Mesurer une orientation
  demande une ACP, jamais un barycentre : un barycentre bascule d'un bout à
  l'autre d'un objet symétrique, et se laisse tirer par tout ce qui traîne.
- **Caler une cadence par le temps mort donne un personnage planté.** Ramener
  la cadence de touche du Lancier à sa valeur relevée en allongeant la pause
  entre deux charges marchait — à 2,5 s de temps mort. La vidéo montre l'exact
  contraire : *beaucoup* de charges, dont *peu* portent. Quand une cadence est
  trop haute, se demander d'abord si c'est la fréquence de l'action ou son taux
  de réussite qui est faux ; ici c'était le second, et le bon levier était la
  distance minimale d'engagement.
- **Un pouvoir sans recharge finie.** Le Lancier n'a pas de pouvoir actif : sa
  fiche porte `ability.cooldown: Infinity` et l'écran de sélection affichait
  « recharge Infinitys ». `select.js` teste maintenant `Number.isFinite` et
  écrit « passif ». Le moteur, lui, s'en moque : le module n'arme aucune
  minuterie.
- **Une maquette ne contient pas toujours ce qu'on vient y chercher.** Celle
  du Hors-la-loi montre ses munitions en **paquet** : six rounds dont les
  pointes se chevauchent et forment une seule masse connexe. Aucun recadrage
  rectangulaire n'en isole un, et une composante connexe en attrape deux — les
  deux ont été essayés. Le revolver est donc **transcrit** (85 × 46, réduction
  par moyenne d'aire à alpha prémultiplié) et la balle **composée** avec les
  couleurs pipettées et le profil de la maquette. Transcrire quand c'est
  possible, composer quand la source ne s'y prête pas, et le dire dans le
  commentaire de la carte.
- **Générer un sprite par une formule au lieu de transcrire la maquette.** La
  première lance livrée était une **feuille arrondie** là où la maquette montre
  une **pointe de flèche à bords droits**. Deux causes, et aucune n'était un
  choix : le profil était tracé en `half = 7.2 * (1 - u) ** 1.3`, et l'exposant
  1,3 rend la courbe **convexe** — des bords droits demandent un exposant de 1 ;
  et la carte faisait 16 cellules de haut pour une tête à `half = 7.2` sur un
  axe à 7,5, donc **le contour tombait hors carte** et il ne restait aucune
  place pour les barbelures. Une formule interpole ce qu'on ne lui a pas
  demandé ; quand un dessin est fourni, les arêtes qui font la silhouette se
  posent **explicitement**.
- **La hauteur d'une carte d'arme ne coûte rien.** `fighter.js` pose
  `headH = map.h × scale` et `drawSpriteLeft` en tire `w = headH × map.w/map.h`
  — la hauteur **s'annule**, la largeur dessinée vaut toujours `map.w × scale`.
  Grandir une carte en hauteur ne change donc ni la portée, ni la hitbox, ni la
  taille du pixel : seulement la place disponible. La lance est passée de 16 à
  22 cellules pour loger sa tête, sans qu'aucune valeur de la fiche ne bouge.
  Grandir en **largeur**, en revanche, déplacerait la pointe.
- **Une icône redessinée à la main diverge de son arme.** `ICON_LANCE` avait
  déjà lâché deux fois : restée indigo quand l'arme est passée au cuivre, puis
  restée une lame fine quand la tête est devenue une pointe de flèche. Elle
  **échantillonne maintenant le profil de `LANCER_SPEAR`** sur un axe à 45° —
  hampe, virole, tête — donc elle ne peut plus mentir sur l'arme qu'elle
  annonce.
- **Le talon de la lance passe derrière le pivot.** `drawSpriteLeft` blitte le
  sprite à partir de `handle.length` : une valeur **négative** le fait démarrer
  en arrière de la bille. Corollaire : `handle.length + map.w × scale` doit
  toujours valoir la portée (−52 + 54 × 4 = 164), sinon la pointe ment sur la
  hitbox.
- **Les minuteurs sont *figés* pendant `offstage`, pas seulement suspendus.**
  `Fighter.step` sort avant de décompter `meleeCd` : le verrou de touche garde
  donc, pour toute la durée du Bond, la valeur qu'il avait au décollage. Quand
  le Bond partait en pleine charge — la seule phase où le garde-fou « la lance
  ne blesse qu'en charge » ne s'applique pas — cette valeur était zéro, et le
  Lancier touchait **gratuitement** à l'atterrissage, lance pointée sur une
  cible à 74 px. Une touche garantie tous les ~8 s, invisible au relevé, qui
  portait à elle seule **dix victoires sur trente** : la corriger l'a fait
  tomber de 15 à 5, et il a fallu remonter le plafond de pile pour le ramener.
  Toute chute du Bond doit poser le verrou comme le ferait `resolveMelee`.
- **`offstage` ne doit pas expirer avant le module.** Le décompte de
  `Fighter.offstage` et celui de `f.ult.active` avancent du même `dt` : à
  l'égalité stricte le Lancier réapparaît une image **à son ancienne position**
  avant que `land()` ne le téléporte. D'où la marge de 0,1 s posée au décollage,
  et c'est bien `land()` qui remet `offstage` à zéro.

- **Seuil d'arrondi.** `Math.round(stat/18)` → `stat/15` a doublé des dégâts
  (round(1,33)=1 vs round(1,6)=2) et fait passer le Vent de 5 à 19 victoires.
  Toujours repasser la matrice après un changement de formule.
- **Une décoration qui tire dans `game.rng` transforme un levier en bruit.** Le
  premier balayage de la recharge du Blizzard rendait des chiffres impossibles :
  un Blizzard *plus rare* rendait le Hors-la-loi *plus fort* (19 victoires à
  18 s contre 17 à 13 s), et la recharge du Lien ne changeait rien. Cause : la
  **neige** (90 flocons/s × 2 tirages) et la **poussière du dôme** (90 grains
  × 6, plus ré-injection continue) tiraient dans le flux de **simulation**, donc
  chaque valeur de recharge rebattait le tirage de tous les duels au lieu de
  changer la force du personnage. Passées à `viewRng`, la recharge du Blizzard
  redevient monotone (9 s → 17, 11 s → 15, 18 s → 14) et celle du Lien se révèle
  n'être **pas un levier** : à 15 s et 24 s les matrices ne diffèrent que par des
  durées, jamais par un vainqueur. C'est l'invariant 2, et il ne se manifeste pas
  par un plantage mais par un balayage qui ment.
- **Une décoration se corrige jusqu'au bout, sinon elle n'est pas corrigée.**
  Suite directe du piège ci-dessus, et la correction elle-même était fausse.
  Seules les **positions** passées en argument avaient été déplacées vers
  `viewRng` ; `Effects.snow` continuait de tirer **quatre** fois dans le flux de
  simulation par flocon, soit 360 tirages par seconde de Blizzard. La monotonie
  observée après coup avait fait croire l'affaire réglée — elle ne prouvait
  rien, elle était seulement moins erratique. `Effects` reçoit désormais un
  second flux (`new Effects(rng, viewRng)`) dont les générateurs purement
  décoratifs se servent. **Vérifier la correction à la source, pas au symptôme.**
  Note pour la suite : `fx.burst` tire encore 4 fois par particule dans le flux
  de simulation, pour les onze combattants. Le corriger déplacerait toutes leurs
  matrices d'un coup — c'est un chantier à part, pas un oubli.
- **Un banc qui plafonne dit que le levier n'est pas le bon.** La dispersion du
  Hors-la-loi est *le* paramètre de sa précision, et pourtant la pousser de 0,75
  à 1,35 rad ne faisait tomber le banc que de 1,11 à 0,86 coup/s, jamais aux
  0,65 relevés. Cause : une part croissante de ses touches venait des **éclats
  de givre**, que la dispersion n'affecte pas du tout. Quand un levier connu
  cesse de répondre, chercher ce qui a changé de *source* plutôt que pousser le
  levier plus loin.
- **Un pouvoir s'ajoute sur un troisième créneau, il ne remplace pas l'ultime.**
  Le Blizzard et le Lien d'essence sont greffés via un bloc `special` et un
  compteur `f.state.spec` de la forme des compteurs génériques du `Fighter` —
  rien ne passe par `f.ult`, donc HIGH NOON et le Bond sont intacts. La
  contrepartie était qu'il **n'avait pas de jauge**, le HUD n'en portant qu'une.
  Il en porte maintenant **deux rangées** : `HUD.special` ajoute une seconde
  barre **collée sous celle de l'ultime**, et **identique** à elle — mêmes
  largeur, hauteur, abscisses, cadre et taille de libellé. Les deux passent par
  le **même tracé** (`drawGauge` dans `render/hud.js`), donc elles ne peuvent
  pas diverger : la première version en avait deux copies, dont l'une avait
  déjà dérivé. Les lignes de statistique descendent d'autant (base 1036 → 1076,
  soit exactement la hauteur de la jauge plus son écart) — écart assumé au
  relevé, c'est le bloc entier qui glisse. Un module alimente la jauge par
  `specialBar(f)`, méthode **optionnelle** : les neuf combattants sans
  troisième créneau ne l'implémentent pas, et n'affichent donc pas un cadre
  vide.
- **Regrouper autrement les mêmes produits change le résultat.** En réécrivant
  `bladeSegment()` pour y loger la vrille, `c * reach * hitbox.from` est devenu
  `c * (reach * hitbox.from)`. La multiplication flottante **n'est pas
  associative** : un bit d'écart sur une coordonnée de hitbox a suffi à faire
  basculer `fire vs bladesman` et `light vs wind` — deux affrontements où le
  Hors-la-loi, seul concerné par le changement, n'est même pas. Le garde-fou
  n'est pas la relecture du code mais la **matrice** : un changement confiné à
  un combattant ne doit déplacer que **ses** affrontements, et une ligne
  déplacée ailleurs est un bug, pas un effet de bord acceptable. La méthode
  garde donc l'expression d'origine mot pour mot sur le chemin sans vrille.
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
