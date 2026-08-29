# Fiches des combattants

Huit éléments : **Ombre**, **Glace**, **Feu**, **Eau**, **Lumière**, **Foudre**,
**Vent**, **Plante**, plus trois personnages invités repris de la chaîne
« ballthingsim » — **Hors-la-loi** et **Bretteur** du duel *Outlaw vs
Bladesman*, et **Lancier** de *Dragoon vs Outlaw*.
Ces fiches sont la **transcription lisible** de `src/data/elements.js`. Le code
est la source de vérité : toute valeur ci-dessous existe telle quelle dans la
fiche gelée correspondante.

- `mesuré` = relevé sur les vidéos de référence, par échantillonnage d'images
  et analyse des pixels :
  | Vidéo | Éléments observés | Format |
  | --- | --- | --- |
  | `DARK vs ICE` | Ombre, Glace | 720 × 1280, 60,4 s |
  | `LIGHT vs FIRE` | Lumière, Feu | 576 × 1024, 42,5 s |
  | `LIGHT vs DARK` | Lumière, Ombre | 576 × 1024, 73,0 s |
  | `LIGHT vs LIGHTNING` | Lumière, Foudre | 576 × 1024, 61,2 s |
  | `ICE vs LIGHT` | Lumière | 576 × 1024, 121,4 s |
  | `LIGHT vs PLANT` | Lumière, Plante | 576 × 1024, 114,6 s |
  | `FIRE vs WATER` | Feu, Eau | 576 × 1024, 64,3 s |
  | `WIND vs PLANT` | Vent, Plante | 576 × 1024, 80,6 s |
  | `WIND vs LIGHT` | Vent | 576 × 1024, 68,7 s |
  | `WIND vs LIGHTNING` | Vent | 576 × 1024, 46,9 s |
  | `WIND vs WATER` | Vent | 576 × 1024, 63,1 s |
  | `PLANT vs FIRE` | Plante, Feu | 576 × 1024, 62,2 s |
  | `FIRE vs LIGHTNING` | Feu | 576 × 1024, 40,3 s |
  | `FIRE vs LIGHT` (long) | Feu | 576 × 1024, 68,5 s |
  | `ICE vs PLANT` | Plante | 576 × 1024, 93,7 s |
  | `DARK vs PLANT` | Plante, Ombre | 576 × 1024, 99,0 s |
  | `DARK vs LIGHTNING` | Ombre | 576 × 1024, 48,1 s |
  | `DARK vs FIRE` | Ombre | 576 × 1024, 54,8 s |
  | `Outlaw vs Bladesman` | Hors-la-loi, Bretteur | 576 × 1024, 30 fps, 1159 images, 38,6 s |

  Toutes sauf la première sont en 576 × 1024, soit exactement 0,8 × son format :
  mêmes proportions d'arène, valeurs converties par ×1,25.
- `calé` = ajusté par simulation pour retrouver le rythme observé
  (durée de duel, progression des deux compteurs du HUD).

Les fiches sont **immuables** : `deepFreeze` les gèle au chargement du module et
`assertFrozen()` le revérifie au lancement de chaque duel. Un duel ne peut donc
pas déteindre sur le suivant.

**Un seul écart volontaire au relevé** : le fond hors-arène. La vidéo est sur
papier crème `rgb(249,241,218)`, le site l'a remplacé par une encre sombre
`#1c1a26` (`STAGE.paper`), et le filigrane de la chaîne n'est pas reproduit.
L'arène, elle, reste blanche : tout le pixel-art garde donc exactement ses
contours noirs mesurés. Seul le « chrome » posé sur le fond sombre change de
liseré — titre et lignes de stat passent au crème `STAGE.outline`, et les jauges
d'ultime gardent une **plaque crème** pour que leur intérieur reste celui de la
vidéo, libellé noir compris.

---

## ⬤ OMBRE — `shadow` (affiché « DARK »)

> Assassin — se déplace par pas d'ombre et draine l'essence.

### Apparence

| Propriété          | Valeur                                  | Source  |
| ------------------ | --------------------------------------- | ------- |
| Rayon du corps     | 41 px                                   | mesuré  |
| Couleur du corps   | `#870286`                               | mesuré  |
| Contour            | `#0a0a0a`, 5 px                         | mesuré  |
| PV                 | Archivo Black 34 px, noir, centré       | mesuré  |
| Flash d'encaissement | corps blanc pendant 0,2 s             | mesuré  |
| Halo               | violet `rgba(124,58,237,.42)`, 1,62 × rayon, pulsation 2,4 Hz | mesuré |
| Condition du halo  | Pas d'ombre rechargé                    | déduit  |
| Traînée            | `rgba(88,28,135,.30)`, image toutes les 45 ms | mesuré |
| Icône du titre     | orbe violette 16 × 16 px                | mesuré  |

### Déplacement

| Propriété               | Valeur     | Source |
| ----------------------- | ---------- | ------ |
| Vitesse nominale        | 440 px/s   | mesuré |
| Vitesse de virage       | 1,75 rad/s | mesuré |
| Poids du pilotage (`seek`) | 0,42    | calé   |
| Rebonds                 | élastiques sur les 4 murs, le sens de rotation de l'arme s'inverse | mesuré |

### Arme — Lame du Néant

| Propriété              | Valeur                                | Source |
| ---------------------- | ------------------------------------- | ------ |
| Portée (centre → pointe) | 77 px                              | mesuré |
| Manche                 | 17 px, largement masqué par le corps  | mesuré |
| Tête                   | sprite `darkBlade`, ×3 (60 × 27 px)   | mesuré |
| Rotation               | 5,76 rad/s (330 °/s), sens initial anti-horaire | mesuré |
| Zone tranchante        | 42 % → 100 % de la portée, épaisseur 13 px | déduit |
| Dégâts                 | 5 PV                                  | calé   |
| Cadence                | 1 touche / 1,05 s maximum             | calé   |
| Recul infligé / subi   | 300 / 90                              | calé   |

### Pouvoir — Pas d'ombre (`Shadow Step`)

| Propriété              | Valeur                                            | Source |
| ---------------------- | ------------------------------------------------- | ------ |
| Recharge initiale      | 3 s                                               | mesuré |
| Réduction par usage    | −0,2 s, plancher 0,7 s                            | mesuré |
| Téléportation          | 190 px dans l'axe de course, 7 images fantômes    | mesuré |
| Invulnérabilité        | 0,25 s                                            | déduit |
| Accélération           | ×1,5 pendant 0,45 s                               | déduit |
| Volée                  | 3 traits d'ombre, dispersion ±0,38 rad, dans l'axe du saut | mesuré |
| Affichage HUD          | `Shadow Step Cooldown: X.Xs`                      | mesuré |

### Ultime — Lien d'essence (`ESSENCE TETHER`)

| Propriété          | Valeur                                             | Source |
| ------------------ | -------------------------------------------------- | ------ |
| Jauge              | +5,5 %/s, +3 % par touche portée                   | calé   |
| Durée              | **5,65 s** — chronométrée deux fois : 5,66 s et 5,63 s | mesuré |
| Dôme               | rayon 265 px (largeur médiane stable à 209 px ×1,25), **figé** au point d'incantation, `rgba(30,24,45,.88)` | mesuré |
| Débordement        | le dôme **n'est pas clippé à l'arène** : dans la vidéo il recouvre le bas de l'écran jusqu'au HUD | mesuré |
| Poussière          | 120 particules violettes en dérive dans le dôme    | mesuré |
| Rayon de drain     | trait violet + cœur blanc, relié en permanence     | mesuré |
| Drain              | **1 PV toutes les 0,4 s** — 10 PV en 4,5 s sur un dôme entier, soit 2,2 PV/s | mesuré |
| Ralentissement     | −15 % sur la cible tant que le lien tient          | déduit |

Le suivi automatique du dôme confirme aussi qu'il est bien **ancré** : sur ses
5,6 s d'existence, la distance entre son centre et l'Ombre passe de 71 px à
324 px — le combattant s'en éloigne, le dôme ne le suit pas.

### Projectile — Trait d'ombre

| Propriété | Valeur                       | Source |
| --------- | ---------------------------- | ------ |
| Sprite    | `darkBlade` ×2,2 (≈ 44 px)   | mesuré |
| Vitesse   | 600 px/s                     | calé   |
| Dégâts    | 5 PV                         | calé   |
| Rayon     | 11 px                        | déduit |
| Durée     | 1,5 s, **aucun rebond**      | mesuré |
| Traînée   | violette, tous les 50 ms     | mesuré |

---

## ❄ GLACE — `ice` (affiché « ICE »)

> Contrôle — empile les dégâts et le ralentissement.

### Apparence

| Propriété          | Valeur                                   | Source |
| ------------------ | ---------------------------------------- | ------ |
| Rayon du corps     | 41 px                                    | mesuré |
| Couleur du corps   | `#00eff0`                                | mesuré |
| Contour            | `#0a0a0a`, 5 px                          | mesuré |
| Halo               | cyan `rgba(34,211,238,.42)`, pulsation 2 Hz | mesuré |
| Condition du halo  | Blizzard chargé ou actif                 | déduit |
| Traînée            | `rgba(125,211,252,.28)`                  | mesuré |
| Icône du titre     | flocon 16 × 16 px                        | mesuré |

### Déplacement

| Propriété               | Valeur    | Source |
| ----------------------- | --------- | ------ |
| Vitesse nominale        | 470 px/s  | mesuré |
| Vitesse de virage       | 1,9 rad/s | mesuré |
| Poids du pilotage       | 0,42      | calé   |

### Arme — Hache de givre

| Propriété               | Valeur                                    | Source |
| ----------------------- | ----------------------------------------- | ------ |
| Portée                  | 132 px                                    | mesuré |
| Manche                  | 90 px, gris, gemme cyan à 52 %            | mesuré |
| Tête                    | sprite `iceAxeHead`, ×3,5 (42 × 60 px)    | mesuré |
| Rotation                | 5,76 rad/s, sens initial horaire          | mesuré |
| Zone tranchante         | 62 % → 100 % (seule la tête coupe), épaisseur 20 px | déduit |
| **Dégâts**              | **= pile courante** (`Damage/Slow`)       | mesuré |
| Cadence                 | 1 touche / 1 s maximum                    | calé   |
| Effet à la touche       | +1 pile ; ralentit de 3 %/pile (max 45 %) pendant 2,6 s | mesuré |
| Recul infligé / subi    | 260 / 80                                  | calé   |

La pile démarre à **1** et monte de **1 à chaque coup d'arme porté** : c'est le
compteur `Damage/Slow: N` du HUD, qui atteint 13 en fin de duel sur la vidéo.
C'est la mécanique de montée en puissance de la Glace — elle est faible au
début et létale à la fin.

### Pouvoir — Éclats de givre (`Frost Shards`)

| Propriété             | Valeur                                | Source |
| --------------------- | ------------------------------------- | ------ |
| Cadence               | 1 salve / 5 s                         | calé   |
| Salve                 | 7 éclats en étoile (360°)             | mesuré |
| Pendant le Blizzard   | 1 salve / 1,2 s, 10 éclats            | mesuré |

### Ultime — Blizzard (`BLIZZARD`)

| Propriété          | Valeur                                                 | Source |
| ------------------ | ------------------------------------------------------ | ------ |
| Jauge              | +5,4 %/s, +2 % par touche portée, remplissage **par la droite** | mesuré |
| Durée              | 5,2 s                                                  | mesuré |
| Onde de choc       | anneau cyan 40 → 900 px en 0,95 s, déborde de l'arène   | mesuré |
| Champ              | rayon 130 px, **suit la Glace**                        | mesuré |
| Effet du champ     | −35 % de vitesse, 1 PV toutes les 0,7 s                | calé   |
| Neige              | 90 flocons/s sur toute l'arène                         | mesuré |

### Projectile — Éclat de givre

| Propriété | Valeur                                  | Source |
| --------- | --------------------------------------- | ------ |
| Sprite    | `iceShard` ×2,4                         | mesuré |
| Vitesse   | 380 px/s                                | mesuré |
| Dégâts    | 2 PV                                    | calé   |
| Rayon     | 10 px                                   | déduit |
| Durée     | 3,4 s, **2 rebonds** sur les murs       | mesuré |
| Effet     | −12 % de vitesse pendant 1,6 s          | déduit |
| Traînée   | pointillé bleu pâle, tous les 35 ms     | mesuré |

---

## 🔥 FEU — `fire` (affiché « FIRE »)

> Attrition — marque l'adversaire d'une brûlure qui s'aggrave.

| Bloc | Valeur | Source |
| --- | --- | --- |
| Corps | rayon 41 px, `#fb0a0a`, contour noir 5 px | mesuré |
| Halo | orange, visible quand la Rage est chargée | mesuré |
| Déplacement | 480 px/s, virage 1,95 rad/s, pilotage 0,42 | calé |
| Arme | *Lame ardente* — portée 150 px, **aucun manche visible** : la garde anthracite à **gemme rouge** est posée au ras de la boule et fait partie du sprite `fireBlade` 28 × 9 ×4 (**112 × 36 px**) | mesuré |
| Détail de la lame | longue flamme effilée au **contour noir ondulé** : bord orange `rgb(242,146,8)`, corps jaune `rgb(251,182,3)`, cœur incandescent | mesuré |
| Corps à corps | 5 PV / 1,15 s, recul 240 | calé |
| **Effet à la touche** | **brûlure** : la pile monte de 0,5 (1 → 5,5 mesuré) ; le DoT inflige `pile/2,4` PV par seconde pendant `pile` secondes | mesuré |
| **Marquage visuel** | la brûlure fait **les deux à la fois** : elle **colore** la victime (la boule bleue de l'Eau vire au violet, la jaune de la Foudre à l'orange) **et** la **cercle d'un gros anneau orange**. Vérifié au zoom sur FIRE vs WATER | mesuré |
| Pouvoir | *Gerbe de braises* — 3 braises, dispersion ±0,55 rad, toutes les 3,6 s | calé |
| Cycle de l'ultime | jauge pleine toutes les **25 à 27 s** (mesuré sur la jauge) | mesuré |
| Ultime | *Rage infernale* (`INFERNAL RAGE`), 6 s : nova de **90 cubes orange**, ailes de flammes battantes, aura brûlante de 150 px (2 PV / 0,6 s + brûlure), vitesse ×1,2 | mesuré |
| Projectile | *Braise* — `ember` ×3, 520 px/s, 4 PV, embrase 2 s | calé |
| Jauge | +3,8 %/s, +1 % par touche portée — calé sur le cycle de 26 s | calé |
| HUD | `Burn Damage/Duration: N` — progression relevée sur 68 s : 1 → 1,5 → 2,5 → 3 → 3,5 → 4 → 4,5 → 5,5 → 6 → 6,5 → 7, par pas de 0,5 | mesuré |

La statistique fait **à la fois** les dégâts et la durée du DoT — c'est
littéralement ce qu'annonce son libellé dans la vidéo.

---

## 🛡 LUMIÈRE — `light` (affiché « LIGHT »)

> Contre-attaquant — ne commence pas fort, le devient en encaissant.

| Bloc | Valeur | Source |
| --- | --- | --- |
| Corps | rayon 41 px, `#fbf7a3`, contour noir 5 px | mesuré |
| Déplacement | 415 px/s (le plus lent), virage 1,6 rad/s | calé |
| Arme | *Marteau d'aube* — portée 155 px, hampe d'acier courte (31 px visibles) + sprite `lightHammerHead` 11 × 10 ×5,7 (**63 × 57 px**), tête **plus large que haute** au gros contour noir | mesuré |
| Halo | **doré**, allumé dès que le Piège radiant est chargé et pendant tout le trait — c'est **la Lumière** qui s'illumine, jamais sa cible | mesuré |
| Égide (aspect) | aucune bulle grise sur la vidéo : le bouclier se lit sur un **liseré doré** collé au corps, d'autant plus épais qu'il est plein | mesuré |
| **Dégâts du marteau** | **= stat « Shield Damage »**, donc **1 PV au premier coup** | mesuré |
| Cadence | 1 coup / 1,5 s — la plus lente du roster | calé |
| **Recul** | **= stat « Knockback »** : 1500 au départ, traduit en impulsion `210 + stat × 0,05` | mesuré |
| **Montée en puissance** | les deux stats montent de **+1 / +300 quand la Lumière ENCAISSE un coup franc**, jamais quand elle en porte | mesuré |
| Plafonds | 14 et 5400 (= 1500 + 13 × 300) — les valeurs maximales vues sur le duel le plus long | mesuré |
| Délai de conversion | 1,5 s entre deux gains (la vidéo monte d'environ un cran toutes les 3 s) | calé |
| **Dégâts de zone** | blizzard, brûlure, tourbillon : **ne font monter aucun compteur** — vérifié sur un blizzard qui coûte 30 PV à la Lumière sans bouger la stat | mesuré |
| **Bouclier** | capacité `9 + stat × 0,4`, régénération 2/s après 2,4 s de répit, rechargé à bloc toutes les 9 s ; absorbe avant les PV — la Lumière tient 11 s à 100 PV sous les coups | mesuré |
| **Riposte** | 1 PV rendu à l'attaquant à chaque coup encaissé | mesuré |
| Incantation | **aucune** — l'Égide est purement passive, aucune onde de choc n'apparaît dans les quatre vidéos | mesuré |
| Ultime | *Piège radiant* (`RADIANT SNARE`), 5 s : **double trait doré**, la cible est **teintée en jaune pâle**, ralentie de 55 %, tirée vers la Lumière et drainée d'**1 PV par seconde** | mesuré |
| Projectile | aucun — tout passe par le marteau et le piège | mesuré |
| HUD | `Shield Damage: N` **et** `Knockback: M` (deux lignes) | mesuré |

### Comment la mécanique a été établie

Trois relevés image par image, à 0,1 s d'intervalle, sur `LIGHT vs LIGHTNING`,
`LIGHT vs PLANT` et `ICE vs LIGHT` :

1. **t = 3,37 s** — la Lumière clignote en blanc (elle encaisse), ses PV
   **ne bougent pas** (100 → 100), la stat passe de 2 à 3, le recul de 1800 à
   2100, et l'adversaire perd 1 PV dans la foulée : c'est la riposte.
2. **t ≈ 5,0 s** — l'adversaire perd **3 PV** d'un coup alors que la stat vaut
   3, et la stat **ne bouge pas** : le marteau frappe pour la valeur affichée.
3. **t = 36 → 41 s** — pendant un blizzard, la Lumière perd 30 PV et ses deux
   compteurs restent figés : les dégâts de zone ne nourrissent pas l'Égide.

Le duel `ICE vs LIGHT` montre aussi la cible du piège **prendre la couleur
pâle de la Lumière**, et la Lumière **verdir** quand elle est givrée — un voile
bleuté posé sur son jaune. Cette teinte d'état est désormais générique :
`onHit.tint` dans la fiche, avec un alpha de mélange.

---

## 🌪 VENT — `wind` (affiché « WIND »)

> Harcèlement — le plus rapide, tornades et lames d'air.

| Bloc | Valeur | Source |
| --- | --- | --- |
| Corps | rayon 41 px, `#bcbf9e`, contour noir 5 px | mesuré |
| Déplacement | **500 px/s**, virage 2,2 rad/s — le plus mobile du roster | mesuré |
| Arme | *Shuriken de bourrasque* — portée 105 px, **aucun manche** (le losange est posé à même la boule), sprite `windShuriken` 17 × 17 ×4,35 soit **74 × 74 px** | mesuré |
| Détail du shuriken | anneau en losange évidé : **double contour noir** (extérieur *et* pourtour du trou), corps crème dégradé — clair côté intérieur, chaud côté extérieur — et **quatre ergots gris** qui dépassent aux pointes | mesuré |
| Rotation d'arme | 6,34 rad/s (× 1,1 par rapport au reste du roster) | mesuré |
| Corps à corps | 3 PV / 1 s (la cadence la plus rapide), ralentit de 12 % | calé |
| **Tornade** | **rafale de 0,2 s, rayon 125 px, centrée sur le Vent lui-même** — pas un vortex lancé au loin ni une zone qui dure | mesuré |
| Aspect de la rafale | **disque flou couleur sable** fait de 9 larges pales en éventail qui rayonnent du centre et se chevauchent, cœur plus dense (`rgb(168,152,124)`), bord franc — pas des cercles concentriques | mesuré |
| Effet de la rafale | `stat / 2` PV et une projection de 430 à qui se trouve dedans | calé |
| Cadence | part sur 4 s et **s'accélère à chaque rafale** (−0,15 s), jusqu'à un plancher de 0,5 s | mesuré |
| **Double progression** | une rafale **qui touche** : dégâts +2 (10 → 24, plafond) **et** recharge −0,5 s de plus | mesuré |
| Ultime | *Salve de tempête* (`TEMPEST VOLLEY`) : jauge pleine toutes les ~9 s, puis décharge **courte et dense** de 1,5 s (2 croissants toutes les 0,3 s) + vitesse ×1,25 | mesuré |
| Projectile | *Lame d'air* — `windCrescent` 16 × 16 ×3,6 (≈ 58 px), 430 px/s, 3 PV, 1 rebond. **Vrai croissant sans contour** (deux cercles décalés), corne sombre côté traînée, ventre crème, liseré clair sur le dos convexe | mesuré |
| HUD | `Tornado Damage: N` **et** `Cooldown: X.Xs` (deux lignes) | mesuré |

### Comment la tornade a été établie

Détection automatique image par image sur trois duels (`WIND vs LIGHT`,
`WIND vs LIGHTNING`, `WIND vs PLANT`), en isolant les pixels bruns du
tourbillon puis en comparant son centre à celui des deux combattants :

1. **Durée** — 4 à 6 images à chaque fois, soit 0,13 à 0,20 s. Ce n'est pas
   une zone qui persiste : c'est une rafale.
2. **Position** — sur 18 déclenchements, le centre du tourbillon est à moins
   de 30 px du Vent (souvent moins de 10). Il l'invoque autour de lui.
3. **Cadence** — les intervalles mesurés descendent régulièrement :
   4,8 · 4,1 · 4,2 · 3,4 · 2,7 · 2,4 · 2,1 · 1,9 · 2,2 · 2,1 · 1,9 · 1,7 ·
   1,3 · 1,4 · 1,4 · 1,5 s. Deux vidéos donnent la même courbe.
4. **Progression** — 17 rafales pour seulement 7 avancées du couple affiché
   (10/4 s → 24/0,5 s, par pas de +2 / −0,5). Les incantations qui ne
   rapportent rien sont celles où l'adversaire était loin : ce sont donc les
   rafales **qui touchent** qui font progresser.

Ces deux rythmes distincts — la cadence qui s'accélère à chaque rafale, le
couple affiché qui n'avance qu'aux rafales réussies — sont reproduits par deux
décréments séparés dans la fiche (`cooldownStepOnCast` et `cooldownStep`).

---

## ⚡ FOUDRE — `lightning` (affiché « LIGHTNING »)

> Zone — sème des bornes statiques et enchaîne les arcs.

| Bloc | Valeur | Source |
| --- | --- | --- |
| Corps | rayon 41 px, `#f2f003`, contour noir 5 px | mesuré |
| Halo | **cyan et permanent** : sur LIGHT vs LIGHTNING, la boule jaune porte son halo bleu du début à la fin du duel, décharge ou pas — c'est sa signature à l'écran | mesuré |
| Déplacement | 500 px/s, virage 2 rad/s | calé |
| Arme | *Lame fulgurante* — portée 145 px, **long manche de bois brun** (88 px) surmonté d'un **fer de lance jaune** trapu au gros contour noir : sprite `boltBlade` 14 × 9 ×4 (**56 × 36 px**), pas un zigzag plat | mesuré |
| Corps à corps | 3 PV / 1 s ; **plante une borne à l'impact** ; pile +0,5 | mesuré |
| **Bornes** | sprite `teslaNode` ×2,6 (**34 × 34 px**), 8 au maximum (la plus ancienne disparaît), durée 16 s, une posée toutes les 3 s | mesuré |
| Aspect des bornes | ce n'est pas un cristal mais une **petite bobine** : boule au sommet, deux disques à collerette empilés, deux pieds, blanc lavande à contour bleu nuit | mesuré |
| **Chaîne** | toutes les 1,6 s : arc Foudre → jusqu'à 4 bornes → adversaire s'il est à ≤ 270 px du dernier maillon ; inflige la pile et ralentit de 18 % | mesuré |
| Ultime | *Surcharge* (`SUPERCHARGE`), 5 s : chaîne toutes les 0,5 s, portée ×1,5, vitesse ×1,15. Sur la vidéo, la jauge se vide à 13 s, 32 s et 55 s, et chaque vidage déclenche **la grande toile cyan** qui relie toutes les bornes | mesuré |
| Projectile | aucun — les bornes et les arcs tiennent ce rôle | mesuré |
| HUD | `Chain Damage: N` (1 → 4,5 mesuré) | mesuré |

---

## 🌀 EAU — `water` (affiché « WATER »)

> Contrôle de terrain — des tourbillons qui aspirent et grandissent.

| Bloc | Valeur | Source |
| --- | --- | --- |
| Corps | rayon 41 px, `#4a86f7`, contour noir 5 px | mesuré |
| Déplacement | 455 px/s, virage 1,8 rad/s | calé |
| Arme | *Trident des marées* — portée 150 px, hampe acier-bleu 102 px + sprite `waterTrident` ×4 (48 × 60 px), **contour noir** et non bleu nuit | mesuré |
| Corps à corps | 3 PV / 1,1 s ; pile +1 **et** taille +5 | mesuré |
| **Tourbillon** | posé toutes les 6 s à l'endroit courant, 2 simultanés au plus, 7,5 s ; **rayon = stat « Size » × 0,9** ; aspiration 60 ; `pile × 0,6` PV toutes les 1,2 s | mesuré |
| **Aspect du tourbillon** | pas un dégradé tournoyant : une **vraie spirale en pixels, opaque** — disque bleu `rgb(102,151,217)`, bras bleu nuit enroulé sur ~2,5 tours, éclats clairs sur un bord, gros contour. Sprite `waterWhirlpool` 21 × 21 étiré au diamètre courant et tourné lentement (1,1 rad/s) | mesuré |
| Gouttes | chaque tourbillon crache 1 goutte toutes les 1,8 s | calé |
| Ultime | *Maelström* (`MAELSTROM`), 5,5 s : **la même spirale**, deux fois plus grande (200 px), au centre de l'arène, aspiration 170, `pile` PV toutes les 0,8 s | calé |
| Projectile | *Goutte* — `waterDrop` ×3, 330 px/s, 1 PV, 1 rebond | calé |
| HUD | `Whirlpool Damage: N` **et** `Size: M` (deux lignes). Le duel FIRE vs WATER pousse plus loin que le relevé initial — 1 → 17 et 70 → 150 — et la **valeur affichée est littéralement le diamètre du tourbillon en pixels**. La progression du jeu reste calée sur 1 → 7 / 70 → 100 : ce point d'équilibrage n'a pas été retouché ici. | mesuré |

---

## 🌱 PLANTE — `plant` (affiché « PLANT »)

> Endurance — sème des bulbes qui blessent l'un et soignent l'autre.

| Bloc | Valeur | Source |
| --- | --- | --- |
| Corps | rayon 41 px, `#15c701`, contour noir 5 px | mesuré |
| Déplacement | 445 px/s, virage 1,7 rad/s | calé |
| **Arme** | *Liane fouettante* — portée 160 px. **Seule arme courbe du roster** : pédoncule brun de 30 px visibles, puis un **crochet** — arc de rayon 46,7 px balayé sur 151°, épaisseur 20 px au plus large | mesuré |
| Rendu de la liane | pas un tracé lisse : l'arc est **rasterisé en escalier de blocs de 4 px** (contour noir, corps vert, reflet clair côté concave), compilé une fois en sprite puis tourné en plus-proche-voisin — exactement le rendu de la vidéo | mesuré |
| Corps à corps | 3 PV / 1,15 s, recul 235 ; pile +1 | calé |
| **Bulbes** | semés toutes les 5 s à l'endroit courant, 4 au plus, durée 18 s, rayon 36 px, **amorçage 0,9 s** (sinon la Plante ramasserait le sien aussitôt posé) | mesuré + calé |
| **Mine** | l'adversaire qui frôle un bulbe prend la stat en PV et est ralenti de 25 % pendant 1,6 s | mesuré |
| **Soin** | la Plante qui récupère son bulbe **regagne `stat × 0,6` PV** — le seul élément du roster capable de remonter ses PV | mesuré |
| Tir des bulbes | un bulbe mûr tire une fleur sur l'adversaire toutes les 2,2 s, portée 460 px | mesuré |
| Ultime | *Tempête de fleurs* (`FLOWER STORM`), 5 s : la cible est clouée sur place (−70 %) et battue par une nuée de pétales (`stat/4` PV toutes les 0,7 s), pendant que la Plante regagne 1 PV/s | mesuré |
| Aspect de la tempête | **nuée de cubes roses** : des grappes de carrés plats et opaques (`rgb(248,120,184)`), toujours alignés sur les axes, sans contour ni dégradé, denses au point de masquer complètement la cible, mêlées de quelques corolles. **Aucun cerceau de lianes** sur les vidéos | mesuré |
| Bulbe | cosse verte bombée au **gros contour noir**, pédoncule et deux feuilles sombres au-dessus, deux pattes noires en dessous — `plantBulb` 11 × 15 ×2,5 (≈ 29 × 37 px) | mesuré |
| Projectile | *Fleur* — `flower` 11 × 11 ×3,6 (≈ 40 px), corolle rose à contour noir épais et **cœur doré**, 340 px/s, 2 PV, traînée rose | mesuré |
| HUD | `Bulb Damage/Heal: N` (1 → 8 mesuré) | mesuré |

Le libellé du HUD dit tout : la **même** statistique sert de dégâts à
l'adversaire et de soin à la Plante.

---

## 🤠 HORS-LA-LOI — `outlaw` (affiché « OUTLAW »)

> Pistolero — vise, tire, recule, et affûte ses dégâts balle après balle.

Relevé sur *Outlaw vs Bladesman*, en 576 × 1024 : **toute mesure ci-dessous est
convertie ×1,25** vers le repère 720 × 1280 du jeu, et la valeur d'origine est
citée entre parenthèses.

| Bloc | Valeur | Source |
| --- | --- | --- |
| Corps | rayon 41 px (32), `#8a5934` — pipette (138,89,52), médiane érodée sur titre + bille + jauge | mesuré |
| Flash d'encaissement | `#e4e4e6` — mesuré aux images 223/224/225 : le disque touché blanchit **une image entière**, contour compris | mesuré |
| Chiffre de PV | crème `#f5f2ea` : le seul ton lisible sur le brun sombre | mesuré |
| Déplacement | 455 px/s (relevé 483 → 604 après conversion) — calé, sinon il traverse le cadre plus vite qu'il ne recharge | mesuré + calé |
| **Arme** | *Revolver* — portée 122 px (pointe du canon à 97). **Seule arme du roster qui ne tourne pas** : `weapon.spin = 0`, et le module écrit `weaponAngle` à chaque image. Le relevé est explicite — « le canon est asservi à l'adversaire à chaque image, sans lissage » | mesuré |
| Sprite | 34 × 15 cellules ×2,5 : crosse brune côté bille, carcasse et barillet en acier bleuté-violine, puis un **canon fin** de 6 cellules sur 15. C'est le contraste corps épais / canon fin qui identifie l'arme | mesuré |
| Corps à corps | pile courante en PV, toutes les **3 s** — le verrou le plus long du roster, parce que le canon est **toujours** aligné. À 1,5 s le pistolero gagnait 27 duels sur 27 | calé |
| **Barillet** | 6 coups, ~0,6 s entre deux (≈ 18 images à 30 fps), puis un rechargement de 1,4 s — le trou observé entre `0/6` et `6/6` | mesuré + calé |
| **Recul** | 119 px/s par coup (95), **988 px/s (790) sous HIGH NOON**. C'est lui qui produit le pic de 1 380 px/s relevé à l'image 1011 : chaque coup de la rafale le propulse violemment | mesuré |
| **Dispersion** | ±0,75 rad. **Déduite d'une mesure** : la vidéo montre 25 paliers de +0,10 en 38,6 s pour ~50 tirs, soit une balle sur deux et **0,65 coup/s**. Sans dispersion, une visée réécrite à chaque image touche toujours — le banc donnait 1,30 coup/s, exactement le double | déduit |
| Ultime | *Plein soleil* (`HIGH NOON`) — horloge **pure** de 7,0 s (charge de 1,13 px/image sur 238 px utiles), effet 6,2 s (vidage à 1,28 px/image) : cadence doublée, +22 % de vitesse, recul ×8,3 | mesuré |
| Rendu de l'ultime | la vidéo fait virer **toute l'arène** au crème `#FDF7ED`. Ici le décor ne bouge jamais : la lumière se pose **au sol, sous le pistolero** | écart assumé |
| Projectile | *Balle* — `outlawShot` 9 × 3 ×3,2, 720 px/s, dégâts = la pile courante. Sillage **pâle** de 2 px, (213,182,153) à (236,206,177) : les cinq taches alignées de l'image 224 sont ce sillage en tirets, pas cinq projectiles | mesuré + calé |
| HUD | `Damage: 3.00 → 5.50` (+0,10 **au coup au but**, pas au coup tiré) et `Ammo: n/6` | mesuré |

---

## ⚔ BRETTEUR — `bladesman` (affiché « BLADESMAN »)

> Duelliste — sa lame accélère jusqu'à la surchauffe, puis fond sur sa cible.

| Bloc | Valeur | Source |
| --- | --- | --- |
| Corps | rayon 41 px (32), `#dcc462` — pipette (220,196,98) | mesuré |
| Chiffre de PV | encre sombre `#2a2007`. **Écart assumé** : la vidéo l'écrit en crème avec un contour, ce moteur ne pose aucun contour et le crème sur l'or clair est illisible | écart assumé |
| Déplacement | 560 px/s (relevé 605 → 756 après conversion) — le plus rapide du roster, ce que dit le relevé, sans aller jusqu'aux 756 qu'une lame de 152 px rendrait intenable | mesuré + calé |
| **Arme** | *Sabre dentelé* — portée 152 px : garde à 45–56 (36–45), lame à 56–152 (45–122). La portée **découle** du sprite, jamais écrite en dur | mesuré |
| Sprite | 40 × 16 cellules ×2,68. Garde **orange vif** (232,160,40), petite croix trapue. Lame **asymétrique** — bande gris-brun sur l'arête haute, corps ivoire en bas — et **fuselée** : une lame à côtés parallèles donne un bout carré que le relevé n'a pas. Les deux arêtes sont dentées, d'où l'aspect scie | mesuré |
| **Rotation** | plancher **0,80** tour/s, plafond **3,00**, jamais franchis. Montée passive **+0,21/s**, sauts discrets de **+0,15** — un par coup porté. Au plafond : palier d'environ **1,8 s** (55 images), puis effondrement à **−3,0/s** jusqu'au plancher, et le cycle repart. Quatre cycles visibles : plafonds aux images 231, 441, 681, 951 | mesuré |
| Ce qui déclenche l'effondrement | **non identifiable sur la vidéo** : il ne coïncide ni avec BLADE RUSH, ni avec HIGH NOON. Le modèle de surchauffe après palier reproduit exactement la courbe — c'est un `calé`, pas un `mesuré` | calé |
| Corps à corps | `Damage = 2,00 × Spin Speed`, **exact et sans exception**, soit 2 à 6 PV. Verrou de 1 000 ms entre deux touches | mesuré |
| Ultime | *Ruée de lame* (`BLADE RUSH`) — horloge de 9 s **+ 6 % par coup porté** : les cycles relevés font 273, 214 et 333 images, donc pas une simple horloge. Ruée de 1,5 s minutée, vitesse ×1,55 (939 px/s contre 605), verrou de touche à **115 ms** | mesuré |
| Deux régimes de la ruée | **loin**, cap asservi sur l'adversaire à pleine vitesse ; **à portée** (120 px), la lame **orbite**. Foncer droit dessus traverse la zone utile en une centaine de millisecondes — au banc d'origine la lame n'y restait que 57 % de la ruée pour un seul coup porté | mesuré + calé |
| **Éventail vert** | `#B1C404` à 55 % — mesuré image 643 : le cœur rend (211,219,109) sur l'arène crème. Ouverture bornée **en angle** : 1,6 rad en régime normal, 3,0 rad pendant la ruée, où il vire au vert fluo. L'aire verte passe de ~3 500 px² à 18 488 px² au pic, un facteur 5,3 : l'éventail **s'ouvre**, il ne fait pas que changer de teinte | mesuré |
| Rendu de l'éventail | en régime normal c'est le **ruban de pointe d'arme** (`look.flair.ribbon`), qui est exactement le secteur balayé par la lame ; le surcroît d'ouverture de la ruée est un secteur plein tracé par le module | — |
| Projectile | aucun — tout passe par la lame | mesuré |
| HUD | `Spin Speed: 0.80 → 3.00` et `Damage: 1.6 → 6.0`, ce dernier **jamais stocké** : il est dérivé de la pile à l'affichage, deux valeurs séparées finissant toujours par diverger | mesuré |

---

## 🐲 DRAGOON — `lancer` (affiché « DRAGOON »)

> Chargeur — pointe en avant, frappe de plus en plus fort, et tombe du ciel.
>
> *Anciennement « Dragoon ». Renommé, redessiné d'après une maquette d'arme,
> et remécanisé — voir « L'angle d'arme » plus bas.*

Relevé sur `Dragoon vs Outlaw` (576 × 1024, 33,6 s) — la vidéo dont le
Hors-la-loi est déjà tiré, vue depuis l'autre camp. Toutes les cotes `mesuré`
sont converties ×1,25 vers le repère 720 × 1280.

| Bloc | Valeur | Source |
| --- | --- | --- |
| Corps | rayon 41 px, contour `#181008` 5 px. La pipette donne l'indigo `#574a84` ; le jeu met la bille en **violet `#7046ac`**, la teinte de la hampe de la lance électrique — la bille suit l'arme, comme elle suivait le cuivre avant elle. C'est donc un retour tout près du relevé : le détour par le cuivre était l'écart, pas celui-ci. Corollaire, le crème `#f5f2ea` **mesuré** du chiffre de PV revient, après avoir dû passer en brun sombre le temps où le cuivre clair le noyait | mesuré, écart réduit |
| Traînée | **trois effets distincts** : les boucles roses autour de la lance, tracées par la **pointe d'arme** (`flair.ribbon`) ; le **fuseau cramoisi derrière la bille** (`flair.smear`) ; et les **images fantômes de la charge** (`flair.ghost`) — une bande de billes qui se recouvrent, lance comprise, visible image par image entre 8,60 et 8,83 s. Les deux derniers ont dû être ajoutés à `render/flair.js`. Mesuré `#a32b4a` au cœur, `#df8692` sur les bords | mesuré |
| Déplacement | **540 px/s**, virage 1,85 rad/s. Mesuré 432 px/s sur la vidéo 576 et **gardé tel quel**, contrairement aux deux autres invités : au banc il fait 15 victoires sur 30 à 540 contre 16 à 470 — sa vitesse n'est pas ce qui le rend fort | mesuré |
| **Arme** | *Lance de dragon* — **portée 164 px, la plus longue du jeu**. Talon qui dépasse de **42 px derrière le pivot**, longueur totale 206 px | mesuré |
| Forme de la lame | **en feuille** : plus large au milieu qu'à ses deux bouts. Relevé en aplatissant la lance sur trois images nettes (t = 0 / 4,5 / 7,8 s) — la bille est localisée au sous-pixel, l'image tournée pour mettre la lance à l'horizontale, puis la demi-épaisseur mesurée colonne par colonne. Les trois profils concordent : **24 px de large à la bille, 32 au ventre, 21 près de la pointe**. Le premier portage l'affinait de façon monotone, ce que la vidéo dément | mesuré |
| Silhouette de la lame | **c'est ici que le relevé cède la place à une maquette.** La vidéo montre une lame *en feuille* crantée ; l'arme retenue est la **lance électrique** d'une maquette fournie — pommeau doré, hampe violette parcourue de fissures blanches, garde, tête hérissée à gemme centrale et barbelures. Elle n'est pas *dessinée d'après* la maquette : elle **est** la maquette, transcrite (voir la ligne suivante) | maquette |
| Rendu de la lance | une seule carte de **208 × 43 à `scale: 1`**, obtenue par réduction de la maquette en blocs **3 × 3 exacts** (624/208 = 3, 129/43 = 3) : aucun rééchantillonnage, donc rapport d'aspect conservé au pixel près, et la médiane par bloc rend les aplats que le JPEG source avait bruités. **La portée ne bouge pas** : 208 × 1 = 208 px logiques comme 104 × 2 auparavant, donc la pointe reste à −44 + 208 = 164. C'est aussi pourquoi la carte est préférée à l'override PNG que le dépôt propose pourtant : `headH = map.h × scale` se lit sur la **carte** et `w = headH × img.w / img.h` sur l'**image**, si bien qu'un PNG d'un autre rapport d'aspect décale la largeur dessinée sans toucher la hitbox — le 624 × 129 posait la pointe à 168,8 px, une arme qui ment de 5 px sur son allonge | maquette, encombrement mesuré |
| **Orientation de la lance** | **elle suit le cap de déplacement.** Ni rotation libre, ni visée : elle est soudée à la vitesse. Mesuré sur 141 images réparties sur toute la vidéo, lance isolée par ACP de son contour sombre — **6,6° d'écart médian au cap de déplacement** (3,7° sur les images les mieux isolées, 94 % sous 15°) contre **37,9° au cap vers l'adversaire**. Vrai à tous les régimes : 10,6° en marche lente, 6,1° en croisière, 4,8° à l'accélération, 6,1° en pleine charge. La fiche porte `weapon.spin: 0` et c'est `abilities/lancer.js` qui recopie `heading` | mesuré |
| **Charge** | viser → verrouiller → foncer. En croisière la bille tient 400–450 px/s vidéo (soit les 540 de la fiche) ; pendant une charge (t = 8,70 → 8,84 s) elle monte à 1 125–1 160 px/s vidéo, soit **~1 400 en repère jeu**, sur **~0,15 s** | mesuré |
| Garde | **aucune**. Ce qui ressemblait à un losange de garde sur les premières captures est derrière la bille, donc invisible en jeu : au-delà du bord de la bille le profil ne montre aucun renflement | mesuré |
| Hitbox | de 0,32 à 1 de la portée (la lame commence à 52 px du centre), rayon 12 px | déduit du sprite |
| **Corps à corps** | la stat « Damage » du HUD, **+2 à chaque touche portée**. Relevé image par image sur la bande de stat : elle passe 10 → 12 → 14 → 16 → 18 → 20 aux instants **12,53 / 13,63 / 14,77 / 16,37 / 21,00 s**, et l'Outlaw descend de 100 à 30 PV. 10+12+14+16+18 = 70 : le compte tombe au PV près sur **cinq touches** | mesuré |
| Ce que le duel donne | **5 touches en 27,6 s = 0,181 coup/s**, pour un budget de **2,54 PV/s**. Deux de ces cinq touches sont des chutes du Bond (12,53 et 21,00) ; les trois touches de lance tombent à 13,63 / 14,77 / 16,37 s | mesuré |
| Cadence | **1,1 s entre deux touches**, la valeur que donnent les trois touches de lance consécutives. Elle a longtemps valu 6 s, et c'était alors le seul écart au relevé qui subsistait : une lance de 164 px qui *balaie en tournant* accroche 0,34 fois par seconde contre 0,181 relevé. Le mécanisme était faux, pas le chiffre — la charge l'a rendu, et le verrou avec | mesuré |
| Fenêtre d'engagement | la charge ne part qu'entre **265 et 470 px** de l'adversaire, et seulement si l'adversaire est à moins de **0,15 rad du cap courant** (donc dans l'axe de la lance). C'est le paramètre de cadence du personnage, et il a remplacé une rustine : allonger la pause entre deux charges ramenait bien la cadence à 0,181 coup/s, mais à 2,5 s de temps mort, là où la vidéo montre *une charge par seconde environ dont une sur cinq porte*. La géométrie tranche — la charge couvre 224 px et la lance en ajoute 164, donc engagée sous ~250 px elle touche presque à coup sûr, et au-delà de ~430 elle n'arrive jamais | calé |
| Garde-fou | **la lance ne blesse qu'en charge.** Hors charge elle est *portée*, pas poussée. Sans cette règle, une arme de 164 px braquée dans l'axe du déplacement, chez un combattant qui se déplace *vers* son adversaire, l'embroche en permanence : au banc, **0,42 coup/s** et 30 duels gagnés en 19 s. C'est le piège du Hors-la-loi, dont le canon asservi gagnait 27 duels sur 27 avant sa dispersion | calé |
| Plafond de pile | **15**, déduit. La vidéo n'en montre aucun : elle s'arrête à 20 parce que le Lancier meurt, pas parce que la stat bute. Mais *tous* les combattants à stat croissante du roster en ont un (Araignée 14, Serpent 14, Hors-la-loi 8, Bretteur 3), et sans plafond la montée est quadratique en durée de duel. Il valait 16 du temps de la visée, où le mécanisme donnait peu de touches ; la charge sur cap en donne davantage — à 16 le Lancier monte à 19 victoires sur 30, à 14 il tombe à 12, à **15** il rend 2,43 PV/s et tient 13 | déduit |
| Pouvoir | *Furie du lancier* — **passif**. Le Lancier n'a aucun pouvoir actif dans la vidéo : sa seule ligne de stat est « Damage », et elle ne bouge qu'aux touches | mesuré |
| **Ultime** | *Bond* (`JUMP`). Jauge pleine en ~10 s (+0,10 de remplissage par seconde), marches de ~8 % à chaque touche | mesuré |
| Déroulé du Bond | jauge vidée → **0,45 s d'élan** au sol → **1,5 s hors de l'arène** → chute. Chronométré deux fois : 10,60 / 11,02 / 12,53 s, puis 19,03 / 19,50 / 21,00 s | mesuré |
| Pendant le vol | le Lancier **n'est plus dans l'arène** : ni touché, ni touchant, ni dessiné. Un disque gris suit l'adversaire, enfle jusqu'à 2,5 × le rayon au sommet du bond puis se resserre à 1,35 × — c'est le resserrement qui annonce la chute | mesuré |
| Impact | il retombe **collé à l'adversaire** — le marqueur, décalé de 0,9 × la somme des deux rayons pour que les billes se touchent sans s'interpénétrer : posé pile dessus, `resolveBodies` le séparait aussitôt et la chute devenait illisible. Il frappe dans un rayon de 110 px pour les dégâts courants de la lance, recul 520. L'arène blanchit d'un coup, une onde grise part jusqu'à 225 px en 0,35 s | mesuré |
| Décollage | une **onde de choc grise au sol** part du point de départ, jusqu'à 190 px en 0,4 s. Le Lancier disparaît d'une image à l'autre : sans elle, rien ne dit d'où il est parti. Les deux bouts du bond se répondent — même disque gris au départ qu'à l'arrivée | déduit |
| Comptabilité de l'impact | la chute compte comme une touche : sur la vidéo l'Outlaw passe de 100 à 90 PV alors que le HUD affiche « Damage: 10.00 », et la stat monte ensuite à 12 | mesuré |
| Projectile | aucun — tout passe par la lance et le Bond | mesuré |
| HUD | `Damage: 10` | mesuré |

**L'angle d'arme, et les trois relevés qu'il a fallu.** C'est la mécanique
centrale du personnage, et les deux premiers portages l'avaient manquée chacun
à sa façon.

| Relevé | Conclusion | Ce qui clochait |
| --- | --- | --- |
| 1 | rotation libre à 327 °/s | le détecteur prenait le barycentre des pixels indigo les plus lointains ; pendant une charge, ce sont les **images fantômes**, pas la lance |
| 2 | « elle vise l'adversaire, à ±5° » | mesuré sur les seules plages où le Lancier fonçait *sur* l'adversaire, là où cap de déplacement et cap adverse se confondent — un sous-ensemble biaisé |
| 3 | **elle suit le cap de déplacement** | tient sur 141 images réparties sur toute la vidéo, et à tous les régimes de vitesse |

Le troisième est le bon, et ce qui l'établit n'est pas seulement la statistique
mais **ce qu'il explique gratuitement**. `weaponAngle = heading` produit tout
seul les trois comportements visibles image par image :

- l'angle **figé une demi-seconde** quand il va tout droit (2,13 → 2,67 s,
  moins de 10° d'écart) — c'est une trajectoire rectiligne ;
- un **saut de 85° en une image** au rebond mural (2,667 → 2,700 s) — c'est
  `Fighter.step` qui réfléchit `heading` sur les murs, et l'arme suit ;
- une rotation lente le reste du temps, |ω| médian **33 °/s**, 88 % des images
  sous 100 °/s — c'est le pilotage, à 1,85 × 0,4 = 0,74 rad/s.

Aucun de ces trois nombres n'est écrit dans la fiche. Une hypothèse qui demande
un paramètre par comportement observé est fausse ; celle-ci n'en demande aucun.

**La charge, en quatre phases.** Toujours ni visée ni verrouillage : la lance
suivant le cap, elle est *déjà* dans l'axe de la charge.

| Phase | Ce qui s'y passe |
| --- | --- |
| `seek` | déplacement normal ; s'engage si l'adversaire est dans la fenêtre de distance **et** dans le cône du cap |
| `brace` | **le corps se cloue sur place**, cap gelé, et l'arme se recentre du flanc vers l'axe |
| `dash` | le corps file à 2,6 × sa vitesse, cap gelé — donc angle d'arme gelé aussi, sans avoir à le geler |
| `recover` | temps mort après la charge ou la touche |

**L'arrêt avant la charge est relevé.** La vitesse tombe à **163 px/s une image
avant le déclenchement**, contre ~1 700 juste avant et ~3 100 juste après : le
Lancier se plante, puis part. L'échantillon est mince — deux déclenchements
nets sur la vidéo — et c'est la lecture du mouvement qui le corrobore plutôt
que la statistique seule.

Il se paie sur le **taux de réussite**, pas sur le temps mort : il coûtait
0,52 PV/s en arrivant, et retoucher `recover` n'y changeait rien (2,00 → 2,07
de 0,55 à 0,40). Pendant l'arrêt l'adversaire continue d'avancer, donc la
charge part vers où il **était**. Le seul levier est la durée de l'arrêt —
0,10 s → 2,00 PV/s, 0,05 → 2,25, 0,033 → 2,29 — et à la valeur relevée
(0,033 s) le moteur rend 0,181 coup/s, exactement la cadence mesurée. L'arrêt
est réglé à 0,05 s, dans l'incertitude d'un échantillonnage à 30 fps et plus
lisible à l'œil.

**L'arme est ancrée sur le flanc, et se recentre pour charger.** Mesuré :
distance signée du centre de la bille à l'axe de la lance (rayon 33 px vidéo) —
**+20 px au repos**, **+38 en croisière**, **+1 en pleine charge**, c'est-à-dire
pile au centre ; 74 % des images du même côté. Le décalage est un compteur
générique de plus, `Fighter.weaponLateral`, et `weaponPivot()` est lu par le
dessin **et** par la hitbox : décaler seulement le dessin ferait mentir le
sprite sur l'endroit où il coupe.

**L'arme passe au-dessus du corps** (`weapon.overBody`), et **sous le chiffre de
PV** — dans un miroir Lancier contre Lancier ce chiffre est le seul repère qui
distingue les deux camps.

La charge a **un seul point de sortie**, `endDash()`, qui remet ensemble
vitesse, facteur de vitesse et traînée — c'est le piège du Bretteur, dont la
ruée avait déjà laissé un éventail large accroché derrière la lame pour les
avoir dispersés.

**Les deux paramètres de cadence se règlent à contre-intuition.** `lunge.cone`
(0,15) : **le serrer améliore la cadence** — 0,15 → 0,157 coup/s, 0,30 →
0,149, 0,60 → 0,120 — parce qu'un cône large laisse partir des charges mal
alignées, qui manquent, et le temps mort qui suit est perdu. `lunge.minRange`
(265) : rouvert depuis 320, la charge sur cône étroit s'engageant moins souvent
que l'ancienne charge sur angle corrigé — 320 → 2,04 PV/s, 300 → 2,26, 280 →
2,35, **265 → 2,52**, 200 → 3,29. Dans les deux cas le levier est le **taux de
réussite** des charges, jamais leur fréquence.

**Ce que le moteur rend.** **0,195 coup/s** et **2,52 PV/s**, contre 0,181 et
2,54 relevés : le budget de dégâts — ce qui décide les duels — tombe à 0,02
près.

**Le piège du verrou figé pendant le vol.** Pendant le Bond, `Fighter.step`
sort avant de décompter `meleeCd` : le verrou de touche est donc **figé** pour
toute la durée du vol, à la valeur qu'il avait au décollage. Si le Bond partait
en pleine charge — la seule phase où le garde-fou ne s'applique pas — cette
valeur était zéro, et le Lancier touchait gratuitement à l'atterrissage, lance
pointée sur une cible à 74 px. Une touche garantie tous les ~8 s, invisible au
relevé, qui portait à elle seule dix victoires sur trente. `land()` pose
maintenant le verrou comme le ferait `resolveMelee`.

Le Bond est le seul pouvoir du jeu qui **retire son porteur du plateau**. Côté
moteur c'est `Fighter.offstage` : générique comme `invulnerable`, il ne dit pas
*pourquoi* le combattant est parti. Toute boucle qui teste `f.alive` pour
décider de le *voir* doit tester `f.onStage` — sinon il reste un ruban, une
nappe de sol ou une hitbox au dernier point connu.

---

## Équilibrage du roster

Vérifié par simulation sans rendu sur les **66 affrontements** possibles
(11 × 11 avec miroirs), 3 seeds chacun :

- durée : **17 à 72 s**, moyenne **38 s** — soit exactement la durée de la vidéo
  de référence du Hors-la-loi ; les profils défensifs allongent la partie
  (miroir Lumière ~78 s) ;
- **mort subite** : au-delà de 55 s, tous les dégâts sont multipliés par
  `1 + (t − 55) / 18` (plafond ×4). Aucun duel ne peut s'éterniser, quels que
  soient les deux combattants choisis — aucun des 66 affrontements n'atteint la
  limite de simulation ;
- répartition des victoires sur les **30 duels hors miroir** de chaque
  combattant : Lumière 21, Feu 17, Ombre 16, Plante 15, Hors-la-loi 15,
  Glace 14, Bretteur 14, Eau 14, Foudre 13, Vent 13, **Lancier 13**. Dix
  combattants sur onze tiennent dans la bande ;
- **la refonte de l'arme du Lancier a rebattu ses 30 duels**, donc jusqu'à 3
  victoires chez chacun de ses dix adversaires — c'est un changement de jeu, pas
  un changement visuel, et la matrice ne pouvait pas rester identique. Le
  réglage a été mené sur deux paramètres `calé` (`lunge.cone`, `lunge.minRange`)
  plus le plafond de pile `déduit`, jamais sur un `mesuré` ;
- **le seul écart restant est la Lumière**, à 21. Elle bat les trois invités
  9-0 : son Égide grandit quand elle **encaisse**, et les trois frappent
  rarement pour beaucoup — le profil exact que le bouclier absorbe. Aucune
  valeur de la Lumière n'a jamais été touchée ;
- **le Vent tient la bande de justesse**, à 13, en perdant 0-3 contre le
  Lancier, l'Eau et le Hors-la-loi. C'est le combattant que la moindre retouche
  du Lancier fait sortir, et donc le premier à surveiller après tout réglage de
  ce dernier ;
- garde-fou du Hors-la-loi : `tools/probe.mjs outlaw` mesure **0,60 coup/s**
  contre les 0,65 relevés sur la vidéo, et sa stat `Damage` finit autour de 5,0
  contre 5,50 mesurés.

Le classement bouge à chaque retouche : le banc d'essai (`matrix`) sert
justement à le vérifier après chaque changement de fiche.

Le banc d'essai est reproductible : chaque duel se rejoue à l'identique avec
`index.html?a=…&b=…&seed=…`.

---

## Règles communes (moteur)

| Règle                     | Valeur                                                    |
| ------------------------- | --------------------------------------------------------- |
| Points de vie             | 100, le premier à 0 perd                                   |
| Pas de simulation         | 1/120 s, boucle à accumulateur                             |
| Collision corps/corps     | élastique, séparation 50/50, impulsion 130                 |
| Collision arme/corps      | segment tranchant contre cercle + recharge d'arme          |
| Murs                      | rebond parfait, l'arme change de sens de rotation          |
| Flash d'encaissement      | 0,2 s en blanc                                             |
| Intro / K.O.              | 0,9 s d'ouverture ; K.O. au ralenti (×0,25) pendant 1,8 s  |
| Mort subite               | dégâts ×`1 + (t − 55)/18`, plafonné à ×4                   |
| Dégâts sur la durée       | un DoT par source, rafraîchi à chaque nouvelle application |
| Absorption                | le module de la cible peut absorber avant les PV (bouclier) |
| Soin                      | `Match.heal()`, plafonné aux 100 PV de départ              |
| Absorption totale         | un coup entièrement absorbé fait clignoter sans coûter de PV |
| Teinte d'état             | `onHit.tint` avec alpha de mélange (givre, piège, brûlure) |
| Rendu d'arme              | un module peut fournir son propre `drawWeapon` (liane)     |
| Arme sans manche          | `handle.width: 0` → seul le sprite est tracé (shuriken, lame ardente) |
| Bouclier                  | `look.shield` : liseré et halo aux couleurs de l'élément    |
| Rendu hors cadre          | passe `drawUnbounded` pour les effets qui débordent (dôme) |
| Parade du vainqueur       | phase `victory` : 1 s, arène vidée, le vainqueur au centre |
| Export vidéo              | `render/recorder.js` : canvas 1080 × 1920 + MediaRecorder  |

## Comment les mesures ont été prises

1. Décodage de la vidéo image par image (PyAV) ;
2. relevé des couleurs à la pipette sur les images fixes (fond, corps, dôme) ;
3. détection des bords noirs pour la géométrie exacte de l'arène et du HUD ;
4. suivi des corps par fenêtre glissante sur masque colorimétrique → vitesses ;
5. suivi du centroïde de la tête de hache → vitesse de rotation
   (≈ 11,5 °/image à 30 fps, soit 330 °/s, avec inversions de sens) ;
6. lecture des compteurs du HUD au fil de chaque duel pour caler les
   progressions : `3 s → 0,7 s` et `1 → 13` (Ombre/Glace), `1 → 5,5` (Feu),
   `1 → 14` et `1500 → 5400` (Lumière), `10 → 22` et `4 s → 1 s` (Vent),
   `1 → 4,5` (Foudre), `1 → 7` et `70 → 100` (Eau), `1 → 8` (Plante).

Pour rejouer une mesure : `index.html?seed=6&debug=1` affiche vitesses, charges
et hitboxes en direct.
