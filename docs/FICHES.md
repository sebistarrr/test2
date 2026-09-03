# Fiches des combattants

**Cinq combattants** repris de la chaîne « ballthingsim » — **Hors-la-loi** et
**Bretteur** du duel *Outlaw vs Bladesman*, **Lancier** de *Dragoon vs Outlaw*,
**Mage** construit sur la mécanique de Magia dans *Dragoon vs Magia*, et
**Shinobi**, reskin du Vent des vidéos *Elemental Armory League*.

Ces fiches sont la **transcription lisible** de `src/data/fighters/`. Le code
est la source de vérité : toute valeur ci-dessous existe telle quelle dans la
fiche gelée correspondante.

Les huit éléments d'origine ont été supprimés ; ce qui en subsiste est
rassemblé dans l'**archive** en tête de document, juste après ces règles.

## Comment lire une valeur

- `mesuré` = relevé sur les vidéos de référence, par échantillonnage d'images
  et analyse des pixels :

  | Vidéo | Combattants observés | Format |
  | --- | --- | --- |
  | `Outlaw vs Bladesman` | Hors-la-loi, Bretteur | 576 × 1024, 30 fps, 1159 images, 38,6 s |
  | `Dragoon vs Outlaw` | Lancier, Hors-la-loi | 576 × 1024, 30 fps, 33,6 s |
  | `Dragoon vs Magia` | Mage (d'après Magia) | 576 × 1024, 30 fps, 24,4 s |
  | *Elemental Armory League* (18 vidéos) | les huit éléments, dont le Vent devenu Shinobi | 720 × 1280 pour la première, 576 × 1024 pour les autres |

  **Le facteur de conversion n'est pas le même partout.** Les vidéos 576 se
  convertissent ×1,25 vers le repère 720 × 1280 du jeu — **sauf celle de
  Magia, ×1,275** : son arène mesure 502 px de bord extérieur contre 640 dans
  le jeu, et la bille le confirme (32 px de rayon × 1,275 = 40,8 ≈ 41). Ne pas
  supposer le facteur : le mesurer sur l'arène, le vérifier sur la bille.

- `calé` = ajusté par simulation pour retrouver le rythme observé (durée de
  duel, progression des compteurs du HUD).
- `déduit` = calculé à partir d'une autre valeur, sans relevé propre.

Les fiches sont **immuables** : `deepFreeze` les gèle au chargement du module et
`assertFrozen()` le revérifie au lancement de chaque duel. Un duel ne peut donc
pas déteindre sur le suivant.

**Un seul écart volontaire au relevé de scène** : le fond hors-arène. La vidéo
est sur papier crème `rgb(249,241,218)`, le site l'a remplacé par une encre
sombre `#1c1a26` (`STAGE.paper`), et le filigrane de la chaîne n'est pas
reproduit. L'arène, elle, reste blanche : tout le pixel-art garde donc
exactement ses contours noirs mesurés. Seul le « chrome » posé sur le fond
sombre change de liseré — titre et lignes de stat passent au crème
`STAGE.outline`, et les jauges d'ultime gardent une **plaque crème** pour que
leur intérieur reste celui de la vidéo, libellé noir compris.

---

## 📦 Archive — les huit éléments supprimés

Le dépôt a longtemps porté huit **éléments** relevés sur les vidéos *Elemental
Armory League* : Ombre, Glace, Feu, Eau, Lumière, Foudre, Vent, Plante. Sept
ont été gelés puis **supprimés** — fiche, module et sprites. Le huitième, le
Vent, survit sous les traits du **Shinobi** et garde sa section complète
ci-dessous.

Leurs relevés complets sont dans l'historique git. Ce qui suit est ce qui
**sert encore** : les mesures d'origine des pouvoirs greffés sur les
survivants, qui restent la justification des valeurs de leurs fiches.

### Blizzard (Glace) → Hors-la-loi

| Propriété          | Valeur                                                 | Source |
| ------------------ | ------------------------------------------------------ | ------ |
| Durée              | 5,2 s                                                  | mesuré |
| Onde de choc       | anneau cyan 40 → 900 px en 0,95 s, déborde de l'arène   | mesuré |
| Champ              | rayon 130 px, **suit le porteur**                      | mesuré |
| Effet du champ     | −35 % de vitesse, 1 PV toutes les 0,7 s                | calé   |
| Neige              | 90 flocons/s sur toute l'arène                         | mesuré |
| Salve d'éclats     | 7 en étoile (360°) ; 10 par salve toutes les 1,2 s pendant le Blizzard | mesuré |

**Éclat de givre** (`iceShard`, carte rapatriée dans `pixelart/outlaw.js`) :
sprite ×2,4, 380 px/s, 2 PV (`calé`), rayon 10 px (`déduit`), 3,4 s et
**2 rebonds** sur les murs, −12 % de vitesse pendant 1,6 s, traînée en
pointillé bleu pâle toutes les 35 ms.

### Rage infernale (Feu) → Bretteur

6 s : nova de **90 cubes orange**, ailes de flammes battantes, aura brûlante de
150 px (2 PV / 0,6 s + brûlure), vitesse ×1,2. Cycle de jauge mesuré à **25-27 s**.

**La brûlure fait les deux à la fois** : elle **colore** la victime *et* la
**cercle d'un gros anneau orange**. Vérifié au zoom sur FIRE vs WATER — c'est ce
que reproduisent `statusTint` et `statusRing` dans `fighter.js`.

### Lien d'essence (Ombre) → Lancier

| Propriété          | Valeur                                             | Source |
| ------------------ | -------------------------------------------------- | ------ |
| Durée              | **5,65 s** — chronométrée deux fois : 5,66 et 5,63  | mesuré |
| Dôme               | rayon 265 px, **figé** au point d'incantation, `rgba(30,24,45,.88)` | mesuré |
| Débordement        | le dôme **n'est pas clippé à l'arène** : il recouvre le bas de l'écran jusqu'au HUD | mesuré |
| Poussière          | 120 particules en dérive dans le dôme              | mesuré |
| Drain              | **1 PV toutes les 0,4 s** — 10 PV en 4,5 s, soit 2,2 PV/s | mesuré |
| Ralentissement     | −15 % sur la cible tant que le lien tient          | déduit |

Le suivi automatique confirme qu'il est bien **ancré** : sur ses 5,6 s, la
distance entre son centre et son lanceur passe de 71 px à 324 px.

### Tempête de fleurs (Plante) → Mage

5 s : la cible est clouée sur place (−70 %) et battue par une nuée de pétales,
pendant que le lanceur regagne 1 PV/s.

**Aspect** : des grappes de **carrés plats et opaques**, toujours alignés sur
les axes, sans contour ni dégradé, denses au point de masquer la cible, mêlées
de quelques corolles. **Aucun cerceau** sur les vidéos. Le rose d'origine
(`rgb(248,120,184)`) est passé au vert chez le Mage.

**Corolle** : 11 × 11 ×3,6 (≈ 40 px), contour noir épais et cœur clair.

### Ce qui est parti avec eux

Le **Semis** de la Plante (bulbes posés au sol) avait été greffé sur le Mage
puis retiré à sa demande. L'Égide de la Lumière, les tourbillons de l'Eau et
les bornes de la Foudre n'ont été greffés nulle part : leur code a disparu avec
leur fiche, y compris le crochet `onDamage` du moteur qui n'existait que pour
le bouclier.

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

### Reskin — Shinobi

**Réactivé et redessiné à la demande, comme le Bretteur avant lui.** Le Vent
était gelé ; il est réactivé, déplacé en queue de `ROSTER` (après
le Lancier, pas à sa place d'origine) pour ne pas déplacer le camp A des six
duels déjà établis entre Hors-la-loi, Bretteur et Lancier — voir `CLAUDE.md`
pour le détail. `id: 'wind'` ne change pas ; seuls `name`/`nameRef`
(`VENT`/`WIND` → `SHINOBI`/`SHINOBI`), l'arme et les projectiles bougent.

| Ce qui change | Détail | Source |
| --- | --- | --- |
| Arme | *Shuriken de bourrasque* → *Shuriken de flamme* (`Flame Shuriken`) — huit branches de métal sombre cerclées de flamme continue, crâne de dragon au centre | maquette |
| Projectile | `crescent` (lancé par `ultimate.volley`) : sprite `windCrescent` → `windShuriken`, `scale` 3,6 → 4,35, `radius` 12 → 15 | demandé, calé |

**L'arme et le projectile partagent maintenant le même sprite, à la même
échelle (4,35).** « Des shurikens de la même taille » : le projectile lancé a
exactement la taille dessinée de l'arme en main (~74 px), pas une taille
propre — contrairement à l'ancien croissant (58 px). Le rayon de collision du
projectile suit la même proportion (12 → 15) pour que la hitbox ne mente pas
sur un projectile devenu plus grand.

**Un vrai PNG, directement — pas de pixel-art texte intermédiaire.**
`head.sprite: 'windShuriken'` est servi par
`assets/sprites/shinobi-shuriken.png` (déclaré dans
`assets/sprites/manifest.json`), un recadrage de la maquette fournie sur sa
plus grande composante connexe — même méthode que la lame du Bretteur.
Différence notable : cette maquette isolait mal l'objet du damier de
transparence sur ses zones sombres (le disque derrière le crâne, les creux
entre les branches) — un simple retrait de fond y laissait des poches de
damier visibles, contrairement à la lame dont le fond se retirait proprement.
`cv2.inpaint` (méthode Telea) a rebouché ces poches à partir des pixels
voisins, sans toucher au reste de l'image.

**Reach et hitbox de l'arme inchangés : c'est un reskin, pas un
rééquilibrage.** Le PNG recadré (198 × 200) est quasi carré, comme l'était
déjà `WIND_SHURIKEN` (17 × 17, resté en repli texte) : `handle.length` et
`head.scale` retombent donc sur la même taille dessinée (~74 px) sans le
moindre recalcul.

**Corps passé au noir, à la demande.** `look.body` `#bcbf9e` → `#141414`.
Le contour (`outline`) et le chiffre de PV (`hpColor`) étaient déjà proches du
noir (`#0a0a0a`) : laissés tels quels, ils auraient disparu **noir sur noir**
sur le nouveau corps — le même piège déjà payé sur le Bretteur (voir sa
section, « HP au-dessus de la manche »). Contour repassé à l'orange de braise
du shuriken (`#e8621b`), chiffre de PV au crème mesuré du reste du roster
(`#f5f2ea`). Vérifié à l'écran (`tools/shot.mjs`), lisible dans toutes les
configurations testées. Purement visuel, matrice inchangée.

**Relevé de matrice initial : 0/9 contre les trois autres actifs, 3/3 en
miroir.** Aucune valeur de combat n'avait été retouchée à la hausse ou à la
baisse (le rayon de collision du projectile avait même légèrement augmenté) :
c'était le relevé du Vent d'origine, sous la moyenne dans l'historique à onze
combattants (12/30), confronté aux trois invités les plus agressifs du roster
réduit plutôt qu'à dix adversaires variés. Ce résultat a changé depuis — voir
« Corps au noir et Clone d'ombre » ci-dessous.

### Corps au noir, et Clone d'ombre

**Aura et traînée passent au noir, à la demande.** `look.aura.color`
(`rgba(214,205,170,…)` → `rgba(20,20,20,…)`) et `look.trail.color`
(`rgba(207,198,168,…)` → même noir) : dernier vestige khaki-crème du reskin
d'avant le corps noir. `look.flair` (ruban, motes, éclair d'incantation)
n'est pas touché, non demandé. Purement visuel.

**Nouveau pouvoir demandé : un clone de lui-même, 20 PV.** Troisième
créneau greffé (même patron que le Blizzard/la Rage infernale/le Lien
d'essence), mais **conçu** pour le Shinobi plutôt que repris d'un autre
combattant — voir `CLAUDE.md` pour le détail technique (pourquoi il est
stationnaire et incorporel, comment il réutilise `Fighter.prototype` et
`weaponHit()`). En résumé :

| Trait | Valeur |
| --- | --- |
| PV | 20 (demandé) |
| Apparition | 5 s puis toutes les 12 s **sans condition**, à 130 px derrière le Shinobi — plusieurs clones coexistent |
| Durée | **permanente** — demandé ; seuls ses PV le font disparaître |
| Riposte | shuriken vers l'adversaire toutes les 1,1 s, attribué au vrai Shinobi (charge son ultime) |
| Rendu | identique au vrai combattant (même prototype `Fighter`), **sans arme**, 88 % d'opacité |
| Corps | **solide** — bouscule l'adversaire et le vrai Shinobi, personne ne le traverse |
| Jauge | `SHADOW CLONE`, sous `TEMPEST VOLLEY`, mêmes couleurs |

**Relevé de matrice après ajout : 3/9 contre les trois autres actifs
(1/3 Hors-la-loi, 2/3 Bretteur, 0/3 Lancier), 3/3 en miroir inchangé.**
Toutes les lignes n'impliquant pas `wind` restent identiques au caractère
près. `tools/matrix-reference.txt` régénérée.

**Rendu permanent, second relevé : 4/9** (0/3 Hors-la-loi, **3/3** Bretteur,
1/3 Lancier). Le plafond de 6 s (`sp.duration`) est retiré de la fiche — plus
rien n'expire le clone, seuls ses PV le peuvent. Toujours confiné aux seules
lignes `wind` ; `tools/matrix-reference.txt` régénérée une seconde fois.

**Rendu solide, troisième relevé : 5/9** (**1/3** Hors-la-loi, 3/3 Bretteur
inchangé, 1/3 Lancier inchangé). Réutilise la géométrie de `resolveBodies()`
(`physics.js`) à sens unique — le clone ne bouge jamais, l'autre corps
encaisse tout l'écartement — écrite dans `wind.js` pour rester confinée au
module. Le blocage joue dans les deux sens : le vrai Shinobi peut aussi se
faire bloquer par son propre clone, sans que ça n'ait posé de problème au
banc. `tools/matrix-reference.txt` régénérée une troisième fois.

**Arme retirée du clone, purement visuel.** Il continue de jeter des
shurikens (`throwFromClone`, inchangé) mais n'en porte plus sur lui :
`customWeapon` passe de `null` à un no-op, ce qui coupe `drawWeapon()` sans
toucher au reste du rendu hérité de `Fighter.prototype`. Matrice inchangée
au fichier près.

**Plusieurs clones à la fois, à la demande.** `f.state.clone` devient
`f.state.clones` (tableau) : la minuterie de réapparition tourne en continu
et pose un nouveau clone toutes les 12 s sans attendre la mort des
précédents. Chaque clone garde ses PV et son horloge de riposte propres.
Une même arme ou un même projectile ne peut jamais toucher deux corps au
même pas — `weaponHit()` pose `target.meleeCd` dès le premier clone touché,
et un projectile est retiré de la liste dès qu'il touche — donc aucun
verrou supplémentaire n'a été nécessaire pour garder cette règle avec
plusieurs clones. **Relevé de matrice : 7/9**, contre 5/9 avec un seul
clone à la fois — 3/3 contre le Hors-la-loi (contre 1/3), 3/3 contre le
Bretteur (inchangé, déjà maximal), 1/3 contre le Lancier (inchangé, sa
charge traverse l'écart sans ralentir). `tools/matrix-reference.txt`
régénérée une quatrième fois.

### La bille devient le shuriken

**Demandé : la bille joue le trou du shuriken, les lames rayonnent autour.**
L'arme n'est plus tenue à côté du corps, elle est **centrée dessus** — même
PNG, nouvelle géométrie.

| Bloc | Avant | Après | Source |
| --- | --- | --- | --- |
| `head.scale` | 4,35 (74 px de large) | **8,912656** (**150 px**) | demandé, calé à l'œil |
| `handle.length` | 34 | **−75** | déduit : une demi-largeur, pour centrer |
| `reach` | 105 | **75** | déduit : rayon des pointes dessinées |
| `hitbox` | `from 0,45 → to 1`, `radius 18` | **`from 0` / `to 0`, `radius 75`** | demandé : dégâts tout autour |

`handle.length + largeur dessinée = −75 + 150 = 75 = reach` : l'invariant
« la pointe dessinée retombe sur la portée » tient toujours, en symétrique.

**La hitbox omnidirectionnelle se dit dans la fiche seule.** `from`/`to` à
zéro confondent les deux bouts du segment tranchant sur le pivot ;
`segmentPointDistance` gère déjà ce cas dégénéré, donc `weaponHit()` teste
`distance ≤ rayon adverse + 75`, soit un disque centré sur la bille. Aucune
ligne de `fighter.js` ni de `physics.js` n'a bougé.

**Taille : compromis assumé.** Le vrai moyeu de la maquette fait 30 % du
rayon ; y caler une bille de 82 px aurait demandé un shuriken de 273 px,
presque la moitié de l'arène. À 150 px les lames dépassent de 34 px — la
bille couvre le moyeu et la naissance des lames, ce qui dépasse est la
partie flamme. L'arme reste **sous** le corps, sinon la bille ne boucherait
plus le trou.

**Deux conséquences gratuites.** Le ruban de `flair.js` suit `reach` le long
de `weaponAngle` : il trace désormais un cercle de 75 px autour du
combattant. Et les projectiles (`crescent`, resté à `scale: 4,35`) ne
suivent **pas** la nouvelle taille : la règle « des shurikens de la même
taille que l'arme » valait pour l'arme tenue, un projectile de 150 px serait
illisible.

**Relevé de matrice : 8/9** (3/3 Hors-la-loi, 3/3 Bretteur, **2/3** Lancier
contre 1/3 avant). Une hitbox qui ne dépend plus de l'orientation de l'arme
punit la charge du Lancier, qui passait jusque-là entre deux tours de lame.
Les durées se raccourcissent partout — signature d'une cadence de touche en
hausse. **Le Shinobi devient l'anomalie du roster réduit**, conséquence
directe de la demande, documentée telle quelle. Leviers pour le ramener si
besoin : `hitbox.radius` (75), `melee.damage` (3), `melee.cooldown` (1 s).

### Style sombre ninja

**Demandé, purement visuel.** Matrice **identique au caractère près**.

| Bloc | Avant | Après |
| --- | --- | --- |
| Arme (PNG) | flammes orange/rouge | **`shinobi-shuriken-dark.png`** — même image, luminance remappée en gris (p50 61 → 51, p95 197 → 136), alpha conservé |
| Nom de l'arme | *Shuriken de flamme* | ***Shuriken d'ombre*** (`Shadow Shuriken`) — « de flamme » aurait menti sur ce qu'on voit |
| `look.accent` | `#a89b6f` | **`#1f1f24`** — c'est lui qui remplit le nombre de dégâts, la marque au sol et le sillage |
| `look.aura` / `look.trail` | noir plat | gris-noir (`rgba(38,38,44,…)` / `rgba(42,42,50,…)`) |
| `flair.ribbon` | `#d6cdaa` | `#33333c` |
| `flair.motes` | khaki | `['#3f3f46', '#71717a', '#18181b']` |
| `flair.impact` | crème/blanc/khaki | `['#52525b', '#27272a', '#8b8b93']` |
| `flair.castFlash` | crème | `rgba(30,30,36,0.55)` — l'écran s'assombrit au lieu de blanchir |
| Traînée du projectile | `rgba(207,198,168,…)` | `rgba(58,58,68,…)` |
| `weapon.spin` | `SPIN × 1,1` | **`SPIN × 1,43`** (×1,3 demandé) |

**Deux points de méthode.** La rampe de gris est plafonnée à **168/255** :
l'arène étant blanche, un gris pâle n'y existe pas, mais il faut assez de
clair pour que le dessin des lames reste lisible. Et `accent` vaut `#1f1f24`
plutôt que du noir pur parce que le moteur pose déjà un contour `#0a0a0a`
autour du chiffre de dégâts — un remplissage identique effacerait le relief
du glyphe.

**La rotation est bien sans effet sur le duel** : depuis que la hitbox est un
disque centré, `weaponAngle` ne décide plus d'aucune collision. La matrice
inchangée en est la preuve, pas la relecture du code.

**Restaient chauds à cette étape** : le contour orange de la bille (gris
depuis, voir ci-dessous), le disque de sable de la Tornade (relevé vidéo,
0,2 s) et les jauges du bas d'écran.

### Contour gris, dégâts gris, renommages

| Bloc | Avant | Après |
| --- | --- | --- |
| `look.outline` | `#e8621b` (orange de braise) | **`#8f8f99`** |
| `look.accent` (nombre de dégâts) | `#1f1f24` (noir) | **`#8f8f99`** |
| `hud.stats[0]` | `Tornado Damage` | **`Shuriken Damage`** |
| `ultimate` | `TEMPEST VOLLEY` / *Salve de tempête* | **`SHURIKEN TORNADO`** / *Tornade de shurikens* |

Le gris est choisi entre deux bornes : plus clair que le corps (`#141414`),
plus sombre que le blanc de l'arène, et un cran sous le point le plus clair
du shuriken (168/255) pour que l'anneau reste lisible **par-dessus** les
lames. Le noir des dégâts de l'étape précédente était une erreur : le moteur
pose déjà un contour `#0a0a0a` autour du chiffre, un remplissage noir s'y
noyait. Les `id` internes (`tempestVolley`, `tornado`) ne bougent pas.

### Correctif : le clone n'encaissait jamais un coup de mêlée

Banc instrumenté, pas par pas, sur les instants où un clone est
**géométriquement** dans la portée de l'arme adverse :

| Adversaire | pas à portée | bloqués par `meleeCd` | PV perdus (avant → après) | morts (avant → après) |
| --- | --- | --- | --- | --- |
| Hors-la-loi | 15 | **15 (100 %)** | 22 → **36** | 1 → 1 |
| Bretteur | 49 | **49 (100 %)** | 14 → **21** | 0 → **1** |
| Lancier | 34 | **34 (100 %)** | 14 → **30** | 0 → **2** |

**Cause : un ordre d'exécution.** `weaponHit()` refuse la touche quand
`attacker.meleeCd > 0`, et `Match.resolveMelee` tourne avant les modules :
elle pose ce verrou dès que l'arme atteint le vrai Shinobi, à 130 px du clone
donc à portée aux mêmes instants. La « mutuelle exclusion » documentée
n'était pas une course équitable — le clone la perdait toujours.

**Correctif :** `cloneWeaponHit()` reprend la géométrie de `weaponHit()` mot
pour mot (même `bladeSegment()`, même `segmentPointDistance`) mais la garde
par `clone.hitCd`, propre à chaque clone. Une touche sur un clone ne pose
jamais `opponent.meleeCd` : ça rendrait le vrai Shinobi intouchable dès qu'un
clone traîne à côté, soit une famine remplacée par l'autre.

**Matrice : 8/9 → 7/9**, le Lancier reprend son affrontement (2/3 contre
1/3). C'est un correctif de bug, et il va dans le bon sens pour l'anomalie
signalée à l'étape précédente.

### Second correctif : chaque clone portait un shuriken

Trouvé en relisant les crochets du moteur — pas en regardant le Shinobi, où
rien ne signalait quoi que ce soit.

`paintWeapon()` consultait un crochet facultatif `customWeapon` avant de tracer
l'arme, et le clone posait `customWeapon: () => {}` pour n'en porter aucune —
c'est ce que demandait la consigne d'origine : *le clone riposte par ses propres
shurikens, sans en porter un sur lui*. Le crochet a disparu du moteur dans une
réécriture ; le no-op est resté dans `wind.js`, **sans lecteur**.

Résultat : chaque clone dessinait un `windShuriken` grandeur nature centré sur
lui. Compté plutôt que jugé à l'œil, sur un clone réel en cours de duel :

| | appels à `drawWeapon()` |
| --- | --- |
| Clone, crochet en place | **0** |
| Clone, sans le crochet (l'état livré) | **1** |
| Le vrai Shinobi | 1 (inchangé) |

**C'est l'invariant 9 dans sa forme silencieuse.** Perdre une *clé* que le
module lit encore plante bruyamment (`lunge.recoil` → NaN). Perdre le *lecteur*
d'une clé ne fait rien du tout : l'arme cesse simplement de ne pas se dessiner.
Et la matrice ne pouvait pas l'attraper — elle ne tourne jamais `draw()`.
`tools/fiche-check.mjs` non plus : il recoupe `weapon.lunge` et `special`, pas
les crochets de prototype.

**Matrice inchangée**, vérifiée : le correctif est purement visuel. Deux clés
mortes sont parties avec (`shield`/`shieldMax` sur le clone, dont le lecteur
était le bouclier de l'Égide, supprimé avec les sept éléments).

### Couleur des pouvoirs au gris

**Demandé, purement visuel.** Derniers restes khaki-crème du Vent d'origine :

| Bloc | Avant | Après |
| --- | --- | --- |
| Jauges (`ability`/`special` `barFill`/`barText`) | `#b9b295` / `#2a2518` | **`#71717a`** / **`#e0e0e5`** |
| Disque de sable de la Tornade | sable | gris ardoise |
| `hud.color` / `hud.stroke` | `#8a8163` / `#f4eddc` | `#71717a` / `#d0d0d5` |

Aucune de ces clés n'est lue ailleurs que par le rendu — matrice inchangée.

### Rotation ×1,2 de plus, clone allégé à 15 PV

**Rotation :** `SPIN * 1,43` → **`SPIN * 1,716`** (encore ×1,2). Toujours sans
effet de collision (la hitbox reste un disque centré) — matrice identique au
caractère près.

**PV du clone : 20 → 15**, demandé, gameplay assumé. Une seule ligne bouge :

| Duel | Avant | Après |
| --- | --- | --- |
| `outlaw vs wind` | wind 3/3 | **wind 2/3, outlaw 1/3** |
| `bladesman vs wind` | wind 3/3 | inchangé |
| `lancer vs wind` | wind 1/3 | inchangé |

Cohérent avec l'observation déjà faite sur les clones multiples face au
canon asservi du Hors-la-loi : des clones plus fragiles meurent plus vite,
donc gênent son tir moins longtemps. Bretteur et Lancier ne s'appuyaient pas
sur la durée de vie du clone. **Total Shinobi : 6/9**, contre 7/9 avant.
Lignes sans `wind` identiques au caractère près.

### Dégâts de mêlée 3 → 2 : le Shinobi paie le resserrement du roster

Il n'y avait rien à reprocher au Shinobi — le réglage vient d'ailleurs. Le
Hors-la-loi et le Bretteur étaient derniers ex æquo (3/12 chacun), et la
question posée était de **les** remonter. Leurs leviers propres n'ont rien
donné :

| Levier essayé | Balayage | Résultat |
| --- | --- | --- |
| Hors-la-loi, `projectiles.shot.radius` | 8 / 10 / 12 / 14 | 10 / 9 / 10 / 9 — **plat et non monotone** |
| Hors-la-loi, `ability.spread` | 0,75 / 0,55 / 0,35 / 0,2 / 0,1 | 10 / 14 / 21 / 22 / 24 — **vrai levier, mais** |
| Bretteur, `ability.cooldown` (palier de surchauffe) | 1,8 / 2,6 / 3,5 / 5 | 9 / 7 / 9 / 9 — **plat** |
| Bretteur, `movement.speed` | 560 / 600 / 620 / 660 | 11 / 13 / 12 / 10 — **bruit** une fois le Shinobi corrigé |

*(24 duels par combattant, les deux camps.)*

La dispersion du Hors-la-loi marche — c'est le seul levier vivant des deux —
mais elle est **déduite d'une mesure** : 0,75 rad reproduit les 0,60 coup/s
relevés sur sa vidéo, elle-même déduite des 25 paliers de `Damage` en 38,6 s.
La baisser rendrait le pistolero plus précis que le pistolero filmé. Écarté.

**Le levier qui restait était chez le Shinobi**, l'écart d'en haut :
`melee.damage` de 3 à 2 remonte le Hors-la-loi **et** le Bretteur de 3/12 à
4/12 chacun, sans toucher une ligne de leur fiche.

| | Avant | Après |
| --- | --- | --- |
| Lancier | 9/12 | 9/12 |
| Mage | 6/12 | 7/12 |
| **Shinobi** | **9/12** | **6/12** |
| Hors-la-loi | 3/12 | 4/12 |
| Bretteur | 3/12 | 4/12 |
| **Écart** | **3–9** | **4–9** |

**Écarté : réduire `hitbox.radius` (75).** C'est le levier que `CLAUDE.md`
citait en premier, et au banc il resserre encore mieux (à 50 : écart 9–15 sur
les deux camps). Mais ce rayon est **déduit du shuriken dessiné** — c'est la
demi-largeur du sprite. Le rétrécir ferait mentir le dessin sur l'endroit où il
touche, exactement ce que le dépôt s'interdit depuis `handle.length`. Les
dégâts, eux, ne sont écrits nulle part sur le sprite.

**Un mot sur le chiffre de départ.** À la matrice, le Hors-la-loi et le
Bretteur étaient à 3/12 — mais sur **les deux camps** ils étaient à 10/24 et
9/24, soit presque la moyenne. La matrice ne joue chaque paire qu'une fois,
donc chacun y reste du même côté et le camp A pèse lourd : elle exagère les
écarts. Elle reste le garde-fou de non-régression, pas la mesure de force.

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
| Déplacement | 546 px/s. Calé à 455 (relevé 483 → 604 après conversion), sinon il traverse le cadre plus vite qu'il ne recharge ; **écart assumé, demandé** ensuite : ×1,2 → 546, toujours sous le 604 mesuré | mesuré + calé + demandé |
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
| Corps à corps | `Damage = 2,00 × Spin Speed`, **exact et sans exception**, soit 2 à 6 PV. Verrou de 1 000 ms entre deux touches. **Ajout demandé** : brûlure d'un tic à l'impact — voir « Brûlure et Rage infernale » | mesuré + demandé |
| Ultime | *Ruée de lame* (`BLADE RUSH`) — horloge de 9 s **+ 6 % par coup porté** : les cycles relevés font 273, 214 et 333 images, donc pas une simple horloge. Ruée de 1,5 s minutée, vitesse ×1,55 (939 px/s contre 605), verrou de touche à **115 ms** | mesuré |
| Deux régimes de la ruée | **loin**, cap asservi sur l'adversaire à pleine vitesse ; **à portée** (120 px), la lame **orbite**. Foncer droit dessus traverse la zone utile en une centaine de millisecondes — au banc d'origine la lame n'y restait que 57 % de la ruée pour un seul coup porté | mesuré + calé |
| **Éventail vert** | `#B1C404` à 55 % — mesuré image 643 : le cœur rend (211,219,109) sur l'arène crème. Ouverture bornée **en angle** : 1,6 rad en régime normal, 3,0 rad pendant la ruée, où il vire au vert fluo. L'aire verte passe de ~3 500 px² à 18 488 px² au pic, un facteur 5,3 : l'éventail **s'ouvre**, il ne fait pas que changer de teinte | mesuré |
| Rendu de l'éventail | en régime normal c'est le **ruban de pointe d'arme** (`look.flair.ribbon`), qui est exactement le secteur balayé par la lame ; le surcroît d'ouverture de la ruée est un secteur plein tracé par le module | — |
| Projectile | aucun — tout passe par la lame | mesuré |
| HUD | `Spin Speed: 0.80 → 3.00` et `Damage: 1.6 → 6.0`, ce dernier **jamais stocké** : il est dérivé de la pile à l'affichage, deux valeurs séparées finissant toujours par diverger | mesuré |

### Reskin — lame de braise

**Réactivé et redessiné, à la demande.** Le Bretteur était gelé ; il est
réactivé, entre le Hors-la-loi et le Lancier (queue de
`ROSTER`, comme l'exige `tools/matrix.mjs`). Trois écarts assumés au relevé,
tous purement visuels — aucune valeur `mesuré`, `calé` ou `déduit` de gameplay
n'a bougé :

| Ce qui change | Détail | Source |
| --- | --- | --- |
| Corps | `#dcc462` (or clair) → `#e8621b` (orange de braise) | écart assumé |
| Aura passive | `rgba(172,226,22,0.42)` (vert-jaune) → `rgba(255,69,0,0.45)` (rouge flamme) | écart assumé |
| Arme | *Sabre dentelé* → *Lame de braise* (`Ember Blade`), transcrite d'une maquette fournie — garde ailée sombre à gemme rouge, lame en flamme continue. `BLADESMAN_FLAMEBLADE` dans `pixelmaps.js`, méthode identique à `LANCER_SPEAR` (réduction par blocs, quantification, pas un dessin reconstruit) | maquette |

**La portée ne bougeait pas, à ce stade.** `head.scale` est recalculé pour le
nouveau sprite (96 cellules contre 40) afin que `handle.length + sprite ×
scale` retombe exactement sur les 152 px relevés — un reskin ne change pas la
hitbox. (Elle bouge en revanche à la vague suivante, où l'agrandissement de la
lame *est* la demande — voir « Lame agrandie, cendres et bas d'écran orange ».)

**L'éventail vert de BLADE RUSH n'a pas été touché.** Il reste `#B1C404`,
mesuré image 643 : c'est un effet vidéo, pas une couleur de thème, et rien
dans la demande ne portait dessus. Le combattant affiche donc un corps et une
aura en rouge-orangé avec un swing d'ultime resté vert — assumé, pas oublié.

**Bilan de matrice, au moment du reskin.** Rejoindre le roster jouable fait
passer `tools/matrix.mjs` de 3 à 6 affrontements (3 combattants, paires
`i ≤ j`, 3 seeds — 18 duels). Le Bretteur perdait alors ses six duels contre le
Hors-la-loi et le Lancier (0/6) — le relevé de sa fiche d'origine (9/30 dans
l'historique à onze combattants), inchangé par ce reskin purement visuel.
Aucun paramètre `calé` n'avait été retouché pour le remonter : ce n'était pas
demandé, et le toucher aurait signifié s'écarter du relevé sans nouvelle
mesure. **Ce qui suit — brûlure au contact et Rage infernale — est un ajout
ultérieur, distinct du reskin, qui touche cette fois au gameplay : voir
« Brûlure et Rage infernale » ci-dessous.**

### Brûlure et Rage infernale

**Deux ajouts demandés, après le reskin — cette fois du gameplay, pas
seulement du visuel.** Contrairement au reskin ci-dessus, dont le bilan de
matrice était resté à l'identique, ces deux-là déplacent la matrice — c'est
attendu et documenté, pas une dérive.

| Ajout | Détail | Source |
| --- | --- | --- |
| Brûlure au contact | `weapon.melee.onHit.dot` — chaque coup de lame marque la cible d'un tic de brûlure, `Math.max(1, round(Spin Speed))`, sur 1 s | demandé, calé |
| Rage infernale | pouvoir **greffé** en troisième créneau (`special.infernalRage`), même patron que le Blizzard et le Lien d'essence — voir la section suivante | demandé |
| Aura et sillage | `look.aura` et `look.trail` passent du vert-jaune/or terne aux teintes exactes de l'aura du Feu (`#f97316`) | écart assumé |

**La brûlure est le vrai levier, la Rage infernale presque pas.** Premier
essai à 2 s de durée (deux tics par coup porté) : le Bretteur balayait les
deux autres actifs, 5/6 contre 0/6 avant l'ajout — la brûlure s'additionnait à
des dégâts au contact déjà mesurés (`Damage = 2 × Spin`) sans que sa cadence de
touche n'ait bougé. Isoler la Rage infernale seule (brûlure quasi neutralisée,
`duration: 0.01`) reproduisait quasi exactement la matrice d'avant l'ajout —
la preuve que l'aura de la Rage infernale (`tickDamage: 1` toutes les 0,6 s)
ne pesait presque rien à côté. Ramener la brûlure à **1 s (un seul tic)**
donne 2/6 : le Bretteur gagne un vrai avantage sur son relevé d'origine, sans
en devenir le plus fort du roster réduit.

**La Rage infernale n'utilise ni `f.boost` ni `f.boostFactor`.** BLADE RUSH
s'en sert déjà pour son propre sprint (vitesse ×1,55 pendant la ruée) ; lui
faire partager le même compteur générique aurait fait qu'une ruée qui se
termine coupe une Rage infernale encore active, ou l'inverse. Les deux
horloges (`f.ult.active` et `f.state.spec`) tournent donc indépendamment, et
peuvent être actives en même temps — l'aura brûlante se dessine alors
**avant** l'éventail de BLADE RUSH dans `drawUnder`, comme la lumière de HIGH
NOON passe par-dessus le champ de givre du Blizzard chez le Hors-la-loi.

**Relevé de matrice, après ces deux ajouts :** le Bretteur perd toujours 0/3
contre le Hors-la-loi (le duel par défaut reste donc à l'image de son relevé
d'origine), mais gagne 2/3 contre le Lancier — soit **2/6**, contre 0/6 avant.
`tools/matrix-reference.txt` a été régénérée ; seules les quatre lignes qui
impliquent le Bretteur ont bougé.

### Lame agrandie, cendres et bas d'écran orange

**Quatrième vague, demandée.** Trois ajouts sur le Bretteur, un sur le
Hors-la-loi (vitesse, voir sa fiche plus haut) :

| Ajout | Détail | Source |
| --- | --- | --- |
| Lame ×1,3 | `weapon.reach` 152 → 197,6 ; `handle.length` 45 → 58,5 ; `head.scale` 1,114583 → 1,448958 ; `hitbox.radius` 17 → 22,1. Les quatre bougent dans la même proportion : la pointe dessinée retombe exactement sur la nouvelle portée (invariant 5), ce n'est pas un agrandissement visuel seul | demandé, calé |
| Cendres sur l'arme | `look.flair.weaponArc` (absent jusqu'ici), en mode `powder` — grains gris (`glow: '#3a332c'`) et braises ponctuelles (`core: '#fbbf24'`) le long de la lame, `jitter: 30` pour dépasser la demi-épaisseur du sprite agrandi (≈25,4 px) | demandé, écart assumé |
| Cendres en traînée | `look.flair.smear` (absent jusqu'ici) : le Bretteur n'avait aucun fuseau de vitesse ; il en gagne un en cendre, distinct du ruban de lame (orange) | demandé, écart assumé |
| Bas d'écran orange | `ultimate.barFill` (or `#dcc462` → orange `#f97316`), `special.barFill` (rouge `#dc2626` → orange sombre `#ea580c`), `hud.color` (or sombre `#a8912f` → orange `#f97316`) | écart assumé, demandé |

Les deux effets de cendre passent par `render/flair.js` (`weaponArc.powder`,
`smear.powder`, même mécanisme que le givre du Hors-la-loi) : purement
décoratifs, aucun tirage dans `game.rng`, ne peuvent rien changer au duel.
L'agrandissement de la lame, en revanche, est un vrai changement de gameplay :
une lame plus longue touche de plus loin.

**Relevé de matrice, après l'agrandissement de la lame et la vitesse du
Hors-la-loi :** le total du Bretteur reste **2/6**, mais la répartition
s'inverse — il gagne désormais 1/3 contre le Hors-la-loi (contre 0/3 avant) et
seulement 1/3 contre le Lancier (contre 2/3 avant). Le Lancier, déjà l'écart le
plus marqué du roster réduit, monte de 4/6 à 5/6 ; le Hors-la-loi descend de
3/6 à 2/6 contre le Bretteur mais reste imbattu en mirroir et contre le
Lancier. `tools/matrix-reference.txt` a été régénérée en conséquence.

### Manche : du rectangle au PNG

**Trois passages avant d'aboutir, chacun corrigeant le précédent.**

| Passage | Approche | Ce qui clochait |
| --- | --- | --- |
| 1 | Rectangle plein (`handle.width: 9`), tons de la garde | Comblait le vide (17,5 px entre le bord de bille et le sprite) mais ne rendait aucun motif : la maquette montre une manche tressée noire à pommeau doré et gemme rouge |
| 2 | Manche dessinée en pixel-art texte, 40 colonnes ajoutées devant la garde dans `BLADESMAN_FLAMEBLADE` (`w: 96 → 136`) | Motif d'abord en bandes diagonales — un tressage plausible mais **pas** celui de la maquette, qui est un **chevron** (chaque bande forme un « V » vers le pommeau). Corrigé une fois (`u = colonne + 0,9 × \|ligne − centre\|`, replié en chevron), mais restait une **modélisation** — demande explicite : « il ne faut pas modéliser l'arme » |
| 3 | **PNG réel**, recadré directement dans la maquette | Retenu |

**Le troisième passage remplace tout le sprite, pas seulement la manche.**
Un sprite ne peut avoir qu'une seule source (texte *ou* image, jamais les
deux mélangées), et la maquette montre l'arme entière — lame, garde, manche,
pommeau — comme un seul dessin. `weapon.head.sprite` de `bladesman` est donc
servi par `assets/sprites/bladesman-flameblade.png`, un recadrage direct de
la maquette (composante connexe la plus grande de l'image, pour exclure les
braises détachées du fond ; fond rendu transparent ; rotation pour que la
pointe regarde vers la droite, la convention du dépôt), déclaré dans
`assets/sprites/manifest.json`. `BLADESMAN_FLAMEBLADE` (`pixelmaps.js`) reste
en place comme **repli automatique** si le PNG venait à manquer — le
mécanisme existait déjà dans `render/sprites.js`, aucune arme ne s'en servait
jusqu'ici.

**Écart assumé à l'invariant « aucun binaire dans le dépôt ».** C'est le
premier — et seul — sprite du roster à en sortir. Demandé explicitement,
documenté dans `CLAUDE.md`.

**Le pommeau à gemme est maintenant dans l'image, mais reste en grande
partie derrière la bille.** Rayon de bille 41 ; le PNG est dessiné de
`handle.length` (18,71) à `reach` (197,6), donc son extrémité pommeau
(la plus proche du pivot) est hors champ jusqu'à x = 41 — environ 22 px de
l'image sur 179 dessinés, soit la manche jusqu'à un peu avant la bague
dorée. C'est le pommeau doré à gemme lui-même qui ne dépasse jamais ; la
manche tressée, elle, se voit sur une longueur un peu plus généreuse
qu'avec les deux passages précédents, sans qu'aucun réglage ne l'ait visé
— c'est la conséquence directe d'utiliser l'image entière plutôt qu'un
segment découpé à la main.

**`handle.length` recalé, `reach` et la hitbox inchangés.** `head.scale`
fixe toujours la hauteur dessinée (`35 × scale`, `35` venant du repli texte) ;
la largeur dessinée suit le **ratio réel du fichier PNG** (486 × 140, mesuré
sur le fichier final) plutôt que celui du pixel-art texte. `handle.length`
est recalé pour que largeur dessinée + `handle.length` retombe exactement sur
197,6 — la pointe ne ment toujours pas sur la hitbox (invariant 5). Purement
visuel : `reach`, `hitbox` et toutes les valeurs de gameplay sont inchangées,
`tools/matrix.mjs` rend une matrice identique au caractère près.

### Lame regrandie, manche par-dessus la bille, roue de flamme

**Trois demandes supplémentaires, toutes en écart visuel assumé — aucune ne
touche `reach`, la hitbox ou une valeur de dégâts.**

**Lame ×1,3 de plus.** `head.scale` repasse ×1,3 (1,448958 → 1,8836454, le
même facteur que le premier agrandissement). `handle.length` est recalé avec
le ratio exact du PNG (486 × 140) pour que la largeur dessinée retombe sur
`reach` (197,6, inchangé) : il devient négatif (−31,26). Au-delà de la valeur
qui posait le pommeau pile au centre de la bille (0), grandir encore ne peut
que le faire déborder **derrière** le pivot — jamais au-delà du bord de la
bille (rayon 41 > 31,26), donc le pommeau reste sur la silhouette de la
bille, il ne la transperce pas.

**`weapon.overBody: true` — même drapeau que le Lancier.** La manche, jusque
là en grande partie masquée par la bille (`Fighter.draw()` peint l'arme
**avant** le corps par défaut), passe désormais par-dessus : bille, contour,
anneaux d'état et chiffre de PV compris, comme documenté dans `fighter.js`
pour le Lancier. C'est ce qui rend le `handle.length` négatif ci-dessus sans
conséquence : la portion qui déborde derrière le pivot se voit maintenant
**sur** la bille au lieu d'être coupée par elle. Purement visuel — ni
`bladeSegment()` ni la hitbox ne lisent ce drapeau, seul l'ordre de dessin
en dépend.

**Roue de flamme au déclenchement de BLADE RUSH.** Remplace l'anneau plein
(`game.fx.ring`) par un sprite pixel-art dédié, `BLADESMAN_FLAMEWHEEL`
(`pixelmaps.js`, 48 × 48) : un moyeu à rayons et gemme centrale, cerné de
treize langues de flamme irrégulières et de grains de cendre. **Conçu, pas
transcrit** — il n'y a pas de maquette pour cet effet, contrairement à
l'arme — mais dessiné sur la même grille de pixels que le reste du roster.
L'irrégularité des langues vient d'une graine fixe au moment de la
conception (treize angles, longueurs et largeurs tirés une fois), pas d'un
tirage en jeu : la carte ne change jamais, seules l'échelle et l'opacité
l'animent (`abilities/bladesman.js`, `_drawRushWheel`) — 0,5 s, montée
franche puis fondu.

Les cendres qui l'accompagnent (`_spawnRushAsh`) sont posées via
`game.viewRng`, jamais `game.rng` : `Effects.burst()` aurait tiré dans le
flux de simulation (voir sa note dans `render/effects.js`, un piège déjà payé
sur le Blizzard) — `_spawnRushAsh` appelle `game.fx.spawn()` directement avec
des valeurs déjà tirées côté rendu, donc rien n'est consommé côté simulation.

Purement décoratif : `render/flair.js` et ce nouvel effet passent tous deux
par `viewRng`, `tools/matrix.mjs` rend une matrice identique au caractère
près.

### Chiffre de PV au-dessus de la manche

**La manche, désormais par-dessus la bille (`overBody`), recouvrait le
chiffre de PV — resté, lui, sur l'ordre de dessin par défaut (avant l'arme).**
Le chiffre disparaissait sous elle, en plus d'être sombre (`#2a0e05`) sur une
manche elle-même sombre — noir sur noir, illisible dans les deux cas à la
fois.

**Nouveau drapeau `look.hpOverWeapon`, opt-in.** `fighter.js` (`draw()`) pose
le chiffre de PV **après** l'arme quand ce drapeau est vrai, au lieu
d'avant — l'ordre par défaut, gardé pour les dix autres combattants. Le
Lancier (qui a aussi `overBody`) ne le porte pas : sa lance ne recouvre le
centre qu'en charge, et `CLAUDE.md` documente déjà ce compromis comme voulu ;
le poser sur les onze aurait défait un choix qui n'était pas remis en cause.

**`hpColor` revient au crème mesuré (`#f5f2ea`).** Il avait été assombri
uniquement parce que la manche était alors masquée par la bille et que le
chiffre se lisait sur l'orange du corps — un crème mesuré s'y noyait. Avec
`overBody`, c'est l'inverse : le chiffre se lit maintenant sur la manche,
sombre, donc c'est le crème mesuré qui redevient le bon choix.

Purement visuel — aucune valeur de gameplay ne bouge, matrice inchangée.

### Jauges d'ultime et de pouvoir spécial, même couleur

**Demandé pour les trois combattants qui portent les deux jauges** (Hors-la-loi,
Bretteur, Lancier) : la jauge d'ultime (la première) reprend désormais
exactement la couleur de la jauge de pouvoir spécial (la seconde) juste en
dessous.

| Combattant | Jauge d'ultime | Couleur reprise de |
| --- | --- | --- |
| Hors-la-loi | HIGH NOON : `#3f97c9` → `#3fbde0` / texte `#fdf7ed` → `#f2fdff` | Blizzard |
| Bretteur | BLADE RUSH : `#f97316` → `#ea580c` / texte `#2a0e05` → `#fff1f0` | Rage infernale |
| Lancier | BOND : `#5d3d8e` → `#7c3aed` / texte `#ffffff` → `#f3e8ff` | Lien d'essence |

**Taille et police l'étaient déjà.** `HUD.special` (`tuning.js`) recopie
`HUD.bar` à l'ordonnée près, et les deux passent par la **même fonction**
(`drawGauge` dans `render/hud.js`) : seule la couleur restait propre à
chaque jauge, par choix — pour qu'on les distingue au premier coup d'œil.
C'est ce choix qui est renversé ici, sur demande explicite.

Purement visuel — aucune valeur de gameplay ne bouge, matrice inchangée.

---

## 🐲 DRAGOON — `lancer` (affiché « DRAGOON »)

### Le Hors-la-loi passe au type glace

| Ce qui change | Détail |
| --- | --- |
| Arme et munitions | même dessin, **teinte de glace** : chaque couleur des deux cartes est convertie à teinte fixe (~199°) en **conservant sa luminosité**, qui porte tout le modelé. Le revolver reste celui de la maquette, seule sa gamme bouge |
| Bille et chrome | `#3f97c9`, un bleu **moyen** et non pâle : le chiffre de PV est crème (mesuré), et un bleu clair le noierait — c'est la leçon du cuivre clair du Lancier, qui avait forcé son chiffre en brun sombre |
| Gel à la touche | `onHit.slow: 0.30` pendant 1,6 s. Le moteur savait déjà le faire : `Match.damage` lit `slow`/`slowDuration` et appelle `Fighter.applySlow`, comme pour l'Ombre et la Glace. `slowFactor` retient le **pire** ralentissement actif et le plafonne à 0,75, donc deux balles coup sur coup prolongent au lieu de s'empiler |
| Rechargement | le pistolet **reste où il est** et fait **un tour complet sur lui-même**, en sens antihoraire, sur les 1,4 s de recharge. L'angle est calculé depuis l'avancement et non incrémenté image par image : une accumulation dériverait et le tour ne se refermerait pas exactement sur zéro |
| Tir | **déjà linéaire, déjà détruit au contact et au mur** — rien à écrire. `projectiles.js` intègre `vx`/`vy` sans pilotage, `bounces: 0` tue la balle au mur, et le contact d'un combattant la tue aussi |

**Ce que le tour de rechargement coûte, et ce n'est pas le gel.** Le Hors-la-loi
passe de 15 à **9 victoires sur 30**. Pendant 1,4 s l'arme n'est plus asservie à
la cible, or le bout du canon porte la hitbox de mêlée (`hitbox.from: 0,62`) :
il balaie au lieu de pointer, et perd ses touches de contact sur toute la
recharge. Cinq affrontements ont basculé, aucun dans l'autre sens — le
ralentissement ne compense pas. C'est le coût assumé d'un effet demandé ; les
leviers pour le rattraper sont `onHit.slow` et `ability.reload`.

#### Vriller n'est pas orbiter

![Le rechargement du Hors-la-loi](capture-recharge.png)

*Trois instants d'un même rechargement. Le revolver garde sa place par rapport
à la bille — qui traverse pourtant l'arène de x = 162 à x = 509 — et seule son
orientation propre change : −64°, −163°, −261°.*

Le moteur porte maintenant **deux** rotations d'arme, et les confondre donne
deux animations très différentes :

| | `weaponAngle` | `weaponTwirl` |
| --- | --- | --- |
| Ce que c'est | la direction dans laquelle l'arme **pointe depuis le corps** | la rotation **propre** de l'arme, autour du milieu de sa carte |
| Ce que ça donne en tournant | l'arme **orbite** autour de la bille, comme une aiguille d'horloge | l'arme **vrille sur place** |
| Qui l'écrit | `Fighter.step` (rotation de fiche), ou un module pour une arme braquée | un module seulement |

La première version du tour de rechargement utilisait `weaponAngle` : ce
n'était pas un pistolet qu'on recharge, c'était un pistolet qu'on fait
tournoyer au bout d'un bras. `weaponTwirl` est un compteur générique de plus —
le module l'écrit, `drawWeapon()` et `bladeSegment()` s'en servent, le moteur
ne sait pas pourquoi, et à zéro les dix autres combattants ne changent pas.

**Le centre de vrille est déduit, pas mesuré.** La règle du dépôt veut que
`handle.length + carte dessinée = reach` ; le milieu de la carte tombe donc à
`(handle.length + reach) / 2`, soit 79,5 px pour le revolver. `bladeSegment()`
le calcule ainsi sans jamais lire `PIXEL_MAPS` — et si la somme cessait un jour
de retomber sur la portée, le centre serait faux **en même temps** que la
pointe, donc l'erreur resterait cohérente.

**La hitbox vrille avec le sprite**, sinon le dessin mentirait sur l'endroit où
l'arme porte — même discipline que `weaponLateral`. Conséquence de jeu : le
canon balaie désormais un petit cercle de 42,5 px autour de l'arme au lieu d'un
grand cercle de 122 px autour de la bille. Cinq affrontements changent de
score, **tous avec le Hors-la-loi**, et il passe de 15 à 16 victoires sur 30.

### Les pouvoirs greffés — Blizzard et Lien d'essence

Deux pouvoirs **repris tels quels** d'autres fiches et posés sur les deux
invités : le **Blizzard** de la Glace sur le Hors-la-loi, le **Lien d'essence**
de l'Ombre sur le Lancier. Ni relevés ni mesurés — ce sont des ajouts demandés.

**Ils s'ajoutent, ils ne remplacent pas.** Les deux combattants avaient déjà un
ultime (HIGH NOON, Bond) ; il fallait donc un **troisième créneau**. Chaque
fiche porte un bloc `special`, et chaque module un compteur `f.state.spec` qui a
exactement la forme des compteurs génériques du `Fighter` (`offstage`, `boost`,
`ghosting`) : le module l'allume et le décompte, personne d'autre ne
l'interprète. Rien ne passe par `f.ult`, donc ni la jauge, ni la charge, ni la
durée des deux ultimes existants ne sont touchées.

**Ils ont leur propre jauge, collée sous celle de l'ultime.**

![Les deux rangées de jauges](capture-jauges.png)

`HUD.special` recopie `HUD.bar` **à l'ordonnée près** : mêmes largeur, hauteur,
abscisses, cadre, taille et retrait de libellé. Les deux rangées doivent se
lire comme une paire, pas comme une jauge et son petit frère.

Et l'égalité n'est pas une copie de constantes : `render/hud.js` trace les deux
avec **la même fonction** (`drawGauge`), appelée avec deux géométries. Une
retouche de style les touche donc toutes les deux par construction. La première
version en avait deux tracés séparés, et l'un avait déjà dérivé — libellé plus
petit, couleur du texte inversée selon l'état. Retoucher l'un sans l'autre est
exactement le genre d'écart qui ne crie jamais.

**Les lignes de statistique descendent de 1036 à 1076.** C'est un écart assumé
au relevé : la seconde jauge occupe la bande où les glyphes tombaient. Le
décalage vaut exactement la hauteur de la jauge plus son écart (35 + 5), donc
les proportions relevées entre jauge et texte sont conservées — c'est le bloc
entier qui glisse, pas l'espacement qui change.

La jauge dit **deux choses avec le même remplissage**, comme celles d'ultime :
elle se remplit vers la prochaine incantation, puis se vide sur la durée
d'activité. C'est la convention du jeu (`barValue` fait exactement ça), donc
rien de nouveau à apprendre.

Le module l'alimente par `specialBar(f)`, méthode **optionnelle** de la même
forme que `drawUnbounded` : les neuf combattants sans troisième créneau ne
l'implémentent pas, et n'affichent donc pas un cadre vide. L'écran de sélection
les liste en plus sur une ligne « Special ».

| | Blizzard (Hors-la-loi) | Lien d'essence (Lancier) |
| --- | --- | --- |
| Origine | ultime de la Glace | ultime de l'Ombre |
| Durée | 5,2 s (mesuré sur la Glace) | 5,65 s (mesuré sur l'Ombre) |
| Horloge | première à 4 s, puis toutes les **11 s** — `calé` | première à 5 s, puis toutes les **11 s** — `calé` |
| Effet | champ de givre de 130 px **qui suit** le porteur : ralentit de 35 % et retire 1 PV toutes les 0,7 s, **plus une salve de 7 éclats toutes les 2,4 s** | dôme de 200 px **figé** au point d'incantation + rayon qui ralentit de 15 % et draine 1 PV toutes les 0,5 s |
| Retouches | aucune | rayon 265 → **200** et drain 0,4 → **0,5 s** |

Les deux retouches du Lien ont la même cause. À 265 px le dôme couvrait plus de
la moitié d'une arène de 640 px de côté : les deux combattants y restaient en
permanence et il cessait d'être un lieu. Et le Lancier gagnait déjà 29 duels sur
30 — lui ajouter 2,5 PV/s gratuits n'avait pas besoin d'être mesuré pour qu'on
sache où ça allait.

#### Le piège : une décoration qui tirait dans le flux de simulation

**Le premier balayage de recharge a rendu des chiffres impossibles.** Un
Blizzard *plus rare* rendait le Hors-la-loi *plus fort* — 19 victoires à 18 s de
recharge contre 17 à 13 s — et la recharge du Lien ne changeait strictement
rien. Aucune mécanique n'a cette forme.

La cause : la **neige** du Blizzard (90 flocons/s × 2 tirages) et la
**poussière** du dôme (90 grains × 6 tirages, plus une ré-injection continue)
tiraient dans `game.rng`, le flux de **simulation**. Chaque valeur de recharge
décalait donc tout le tirage de tous les duels au lieu de changer la force du
personnage : le balayage mesurait du bruit, pas un levier.

Les deux sont passés à `game.viewRng`. Rien ne lit ces positions à part le
dessin — c'est de la décoration, et la décoration passe par `viewRng` ou par un
hachage pur, jamais par le flux du duel. Après correction, la recharge du
Blizzard redevient monotone (9 s → 17 victoires, 11 s → 15, 18 s → 14), et
celle du Lien se révèle n'être **pas un levier du tout** : à 15 s et à 24 s les
matrices ne diffèrent que par des **durées**, jamais par un vainqueur — le
Lancier gagne ses trente duels de toute façon.

> **Cette correction était incomplète, et la suite le prouve.** Seules les
> **positions** passées en argument avaient changé de flux. `Effects.snow`, lui,
> continuait de tirer **quatre** fois dans `game.rng` par flocon — 360 tirages
> par seconde de Blizzard. La monotonie observée avait fait croire l'affaire
> réglée : elle ne prouvait rien, elle était seulement moins erratique qu'avant.
>
> `Effects` reçoit maintenant un second flux à la construction
> (`new Effects(rng, viewRng)`), dont les générateurs purement décoratifs se
> servent. Corriger cela a déplacé **cinq affrontements**, dont trois de la
> **Glace** — son propre Blizzard sème la même neige. Le Hors-la-loi passe de 26
> à 25, la Glace de 13 à 15.
>
> La leçon : **vérifier une correction à la source, pas au symptôme.** Un
> balayage redevenu monotone n'est pas une preuve que le flux est propre.
>
> Reste au tableau : `fx.burst` tire encore 4 fois par particule dans le flux de
> simulation, et cela vaut pour tout le roster. Le corriger déplacerait
> toutes leurs matrices d'un coup — c'est un chantier à part, pas un oubli.

*La Glace et l'Ombre font encore l'inverse dans leurs propres modules. Le
corriger là-bas déplacerait leur matrice ; c'est un autre chantier.*

#### Les éclats de givre, et ce que l'ablation a montré

Les **éclats de givre** (`frostShards` de la Glace) sont greffés sur le
Blizzard — avec une différence : chez la Glace c'est un pouvoir *permanent* que
le Blizzard accélère, ici il n'existe **que** pendant le Blizzard. Un pistolero
qui tire des éclats en continu n'est plus un pistolero.

Les projectiles étant lus dans la fiche du **porteur**
(`owner.el.projectiles[key]`), l'`iceShard` est **recopié** dans la fiche du
Hors-la-loi, pas référencé.

Trois changements sont arrivés ensemble — rechargement ×2 plus rapide, vitesse
de balle ×1,3, éclats — et le Hors-la-loi est passé de 16 à 26 victoires sur
30. Une ablation, un changement à la fois, dit lequel pèse :

| Configuration | Hors-la-loi |
| --- | --- |
| référence du tour précédent | 16 / 30 |
| rechargement ×2 seul | **23 / 30** |
| vitesse de balle ×1,3 seule | 14 / 30 |
| éclats seuls | 28 / 30 |
| les trois ensemble | 28 / 30 |

Deux enseignements. D'abord, **la vitesse de balle n'apporte rien de mesurable**
— 14 contre 16, soit deux victoires sur trente réparties sur dix
affrontements à trois graines : c'est dans le bruit du banc, pas un effet.
Ensuite, **le rechargement est le vrai moteur**, et c'est cohérent avec
l'historique du personnage : le tour de rechargement lui coûtait ses touches de
mêlée (le bout du canon porte la hitbox de contact, et pendant la recharge
l'arme n'est plus asservie), ce qui l'avait fait tomber de 15 à 9. Diviser la
recharge par deux lui rend l'essentiel de ce qu'elle lui coûtait.

**Aucun levier ne ramène la bande sans défaire ce qui a été demandé.** Ce qui a
été essayé, mesuré :

| Levier | Résultat |
| --- | --- |
| cadence du Blizzard, 11 → 26 s | **plate** : 25–26 quel que soit le réglage |
| cadence des éclats, 10×1,2 s → 5×5 s | 28 → 23, jamais en dessous |
| dispersion, 0,75 → 1,35 rad | 26 → 16, mais 1,35 rad = un cône de 77° |
| `ability.cooldown`, `magazine` | **mesurés** — hors d'atteinte (invariant 5) |

La dispersion plafonne parce qu'une part croissante des touches vient des
**éclats**, qu'elle n'affecte pas : le banc tombe de 1,11 à 0,86 coup/s et pas
plus bas, contre 0,65 relevé. Et à 1,35 rad le canon asservi à la cible cesse
de se lire comme une visée — le personnage devient un fusil à pompe. C'est un
prix de conception payé pour masquer un changement demandé ; il n'a pas été
payé, et le 26 / 30 est **documenté plutôt que caché**, comme le 30 / 30 du
Lancier.

Pour le rentrer dans la bande si on le souhaite : `ability.spread` à **1,35** et
`special.shards` à **5 éclats toutes les 5 s** donnent 16 / 30.

#### De l'éclair de glace à la poudre de glace

![Poudre de glace](capture-poudre.png)

*Les deux balles laissent une bouffée granuleuse au lieu d'un chapelet de
points ; le Hors-la-loi (à droite) traîne son propre sillage de poudre, et le
canon porte une poussière au lieu d'arcs.*

Le Hors-la-loi avait la suite d'effets du Lancier **recolorée** en bleu : un
tracé électrique, des arcs le long du canon. Le dessin disait donc la foudre là
où le personnage gèle. Un mode `powder` remplace le mode `electric`, et chacune
de ses règles est **l'inverse** d'une règle du tracé électrique :

| | `electric` | `powder` |
| --- | --- | --- |
| Forme | un **trait** continu, cassé | des **grains isolés**, non reliés |
| Écart | s'annule au point le plus récent | **s'ouvre en s'éloignant** du combattant |
| `rate` | 11–16 paliers/s : ça doit grésiller | 5–6 : ça doit **tenir en place** |
| Liant | aucun | une **nappe** large et très transparente sous les grains |

Relier des points écartés était l'exigence du tracé électrique — un chemin dont
les points sont espacés de 200 px se referme en chapelet de perles s'il est
dessiné segment par segment. Pour la poudre, c'est exactement l'inverse : les
grains **doivent** être séparés. Et une poudre se disperse en retombant, donc
l'écart s'ouvre vers l'arrière au lieu de s'annuler au combattant.

La nappe n'est pas un ornement : sans elle les grains se lisent comme des taches
détachées, et c'est elle qui les rassemble en sillage.

Le long du canon, les arcs deviennent une **poussière** (`weaponArc.powder`) —
même ancrage sur `bladeSegment()`, même hachage pur, mais des grains isolés au
lieu de polylignes, dont le panache s'ouvre vers la pointe.

**Deux erreurs commises, et toutes deux déjà au tableau.**

D'abord l'aura : la largeur des passes était calculée en `1/k`, donc la
**dernière** passe — celle qui porte le cœur à pleine opacité — faisait 54 px au
lieu de 8. Elle délavait tout autour de l'arme au lieu de la cerner, ce qui est
mot pour mot le défaut de « gélule » déjà corrigé sur la lance. La passe la plus
large vient en premier, le noyau étroit en dernier.

Ensuite la gamme : premier réglage en `#e8f7ff` sur `#7cc3e4`, **invisible**.
L'arène est blanche, et un grain quasi blanc de 3 px n'y existe pas. C'est la
leçon des jaunes clairs du Lancier, refaite à l'envers — « poudre » avait
suggéré « pâle », alors que la contrainte de fond n'a pas changé. La gamme est
en bleus **tenus** (`#2f8ec6`, `#1d78ad`), le cœur en `#8fd0ee` et non en blanc.

#### La traînée des projectiles

Un projectile n'émettait qu'un point isolé toutes les 30 ms. À 936 px/s, cela
laisse 28 px entre deux marques : un chapelet de perles, pas un sillage.

`trail.puff` transforme chaque émission en **bouffée** — plusieurs grains
dispersés perpendiculairement à la vitesse et traînant vers l'arrière — et
`every` descend en même temps (0,03 → 0,018). Les deux comptent : c'est
l'espacement des émissions qui décide de la continuité, pas leur richesse.

**Ce code est dans le chemin de simulation** (`projectiles.update`), donc la
dispersion vient d'un **hachage pur** de (compteur d'émission, indice de grain),
jamais d'un tirage — et `fx.dot` ne consomme aucun aléa non plus. C'est ce qui
rend l'enrichissement gratuit : la matrice est **identique au fichier près**
après l'ajout, ce qui a été vérifié.

À cette occasion `hash01` est remonté de `render/flair.js` vers `core/math.js`,
d'où `flair.js` et `projectiles.js` l'importent tous deux — plutôt qu'une
troisième copie de la même fonction.

#### La traînée de glace du Hors-la-loi

Le Hors-la-loi reprend **la suite d'effets du Lancier en mode glace** : ruban et
fuseau `electric`, aura d'arme, arcs le long du canon. Le code est partagé —
c'est tout l'intérêt de `render/flair.js` : seule la gamme change, et la matrice
reste identique au fichier près.

Deux réglages appris à l'image :

- **l'amplitude des arcs doit dépasser la demi-épaisseur du sprite.** Le
  revolver fait 46 px de haut dessiné, soit 23 de demi-épaisseur — d'où 32,
  le même rapport que les 38 de la lance sur ses 55 px ;
- **c'est la teinte qui descend, pas l'opacité.** Les alphas sont ceux du
  Lancier (0,55 / 0,40) ; au premier réglage (`#bfeaff` sur `#2a7fae`) la
  traînée se lisait comme une volute grise, parce que sur l'arène blanche un
  bleu porte moins qu'un ambre à luminosité égale. Les deux tons sont
  descendus d'un cran.

**Pas de `pierce`.** L'onde de pénétration est conditionnée à `Fighter.boost`,
que le Hors-la-loi allume pendant HIGH NOON : un coin de charge planté devant un
pistolero qui recule à chaque tir se lirait comme un bug. C'est le seul effet de
la suite qui ne se transpose pas.

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
| **Orientation de la lance** | `weapon.spin: 0`, et `abilities/lancer.js` recopie `heading` — **par défaut, faute de mieux établi.** Le chiffre « 6,6° au cap contre 37,9° à l'adversaire » qui figurait ici est **retiré** : voir la rétractation ci-dessous | non tranché |
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
| 4 | **rien** — les deux hypothèses tombent ensemble | voir la rétractation ci-dessous |

**Rétractation du relevé n° 3.** Une quatrième mesure, faite sur les *deux*
vidéos avec un détecteur corrigé, ne tranche pas — et c'est le résultat
honnête :

| Méthode | A (vs Magia) | B (vs Outlaw) |
| --- | --- | --- |
| ACP, composante connexe, > 300 px/s | cap 31,7° / adversaire 12,4° | cap 26,6° / adversaire 12,9° |
| Vecteur bille → pointe | cap 44,7° / adversaire 27,6° | cap 41,4° / adversaire 38,1° |
| Corrélation des variations | r = +0,06 / −0,09 | r = −0,04 / +0,26 |

Aucune des deux hypothèses ne descend sous 25° avec la méthode du vecteur
pointe, les corrélations sont nulles, et les verdicts par bande de vitesse
s'inversent d'une bande à l'autre. **Une mécanique ne fait pas ça, une mesure
polluée si.** Le détecteur du relevé n° 3 prenait tous les pixels sombres dans
un rayon de 130 px **sans exclure le cadre noir de l'arène** — une droite
parfaite, que l'ACP privilégie précisément parce qu'elle cherche la direction
la plus allongée, et que le test d'allongement *sélectionnait* au lieu de
filtrer. Il ne tournait en outre que sur les images où un détecteur global
retrouvait la bille : 490 sur 747 dans la vidéo B.

Pour trancher il faudrait une lecture image par image sur un jeu d'images
choisies à la main, ou une source de meilleure définition. En attendant,
`weaponAngle = heading` reste en place **par défaut**, pas comme un relevé.

**Ce qui, lui, est mesuré — et concorde sur les deux vidéos.**

| Mesure | A (vs Magia) | B (vs Outlaw) | Le jeu |
| --- | --- | --- | --- |
| Vitesse de croisière | 423 px/s | 413 px/s | **432** |
| Une charge toutes les | 1,7 s | 0,9 s | **2,3 s** |
| Distance parcourue par charge | 137 px logiques | (bruitée) | **136** |
| Pic de vitesse en charge | 1 392 px/s | 1 770 px/s | **1 555** |
| Cadence de touche | 0,181 coup/s | — | **0,184** |

Ces cinq-là sont pris avec le **même code** des deux côtés, la conversion ×1,25
appliquée, et un **suivi temporel** de la bille — pas une détection image par
image, qui la perdait 257 fois sur 747 pendant les charges.

**Mesurer contre le bon adversaire.** `tools/probe.mjs` fait affronter au
Lancier les dix autres, qui **pilotent vers lui** et entrent donc d'eux-mêmes
dans le couloir de charge : il y rend 0,506 coup/s. Dans le **miroir** — le
duel le plus proche de la vidéo, où l'adversaire se déplace de son côté — il
rend **0,202 coup/s pour 2,43 PV/s**, contre 0,181 et 2,54 relevés. Le même
personnage, deux chiffres qui diffèrent d'un facteur 2,5 : **la cadence d'un
combattant n'a de sens qu'en nommant l'adversaire.**

Ce que la comparaison a révélé, et qui était le vrai défaut : le Dragoon de la
vidéo **charge souvent et rate souvent** — une charge toutes les 1 à 1,7 s,
dont environ une sur trois porte. Le portage chargeait toutes les 4,3 s et
touchait presque à chaque fois. Les deux rendaient la **même cadence de
touche**, ce qui masquait l'écart au chiffre, mais rien à voir à l'œil.

**L'arrêt avant la charge n'est pas mesuré non plus.** Le « 163 px/s une image
avant le déclenchement » venait d'un détecteur qui ne retenait un déclenchement
que si `v[i-1] < 0,35 × v[i]` — il *sélectionnait* les images précédées d'un
creux, puis rapportait qu'il y avait un creux. Avec un seuil neutre, la vitesse
avant charge vaut 732 px/s (A) et 413 (B) : pas d'arrêt. La phase `brace` est
conservée parce qu'elle a été **demandée** comme effet de jeu, pas parce
qu'elle est relevée.

**Ce qui suit était l'argument du relevé n° 3.** Il garde sa valeur de méthode
— un mécanisme juste rend des chiffres qu'on n'a pas eu à caler — même si la
mesure qui l'accompagnait est retirée. Ce qui l'établissait n'était pas
seulement la statistique
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
| `windup` | **moulinet d'élan** : le corps continue, seule l'arme tourne, à 26 rad/s |
| `brace` | **le corps se cloue sur place**, cap gelé, l'arme est verrouillée d'autorité sur le cap et **saute** du flanc vers l'axe — sans interpolation |
| `dash` | le corps file à 2,6 × sa vitesse en ligne droite, cap gelé — donc angle d'arme gelé aussi, sans avoir à le geler |
| `recover` | temps mort ; l'arme se replace sur le flanc |

**Trois ajouts de mise en scène, distincts du relevé.** Le **moulinet** (0,10 s
à 14 rad/s, soit ~80°) est le seul moment où l'arme ne suit pas le cap ; la
vidéo n'en montre aucun, et le garde-fou « la lance ne blesse qu'en charge » le
couvre gratuitement. Le **recul** passe de 300/95 relevés à 460/200 : c'est
l'amplitude qui monte et non l'amortissement, celui-ci étant global
(`PHYSICS.speedRecovery`) et donc partagé par les onze. Et la **charge est
strictement linéaire** — l'impulsion est remise à zéro au départ, sans quoi un
recul encaissé juste avant l'incurverait sans que rien dans le module ne
l'explique.

Le moulinet coûte de la cadence, et pour la même raison que l'arrêt : pendant
qu'il tourne, l'adversaire dérive. 0,18 s → 2,02 PV/s, 0,14 → 2,15, **0,10 →
2,31**. À 0,10 s le moteur rend **0,180 coup/s** contre 0,181 relevés — la
cadence tombe juste, et c'est le budget de dégâts (2,39 avec `stackMax` 16) qui
reste 6 % sous la vidéo.

**Le mécanisme, tel qu'il est décrit et implémenté.** Le corps va **tout
droit** (`movement.seek: 0`, seul du roster) ; la **lance balaie** à 5,5 rad/s,
indépendamment du déplacement ; dès que son axe croise l'adversaire elle se
verrouille, marque 0,04 s, et le corps part en ligne droite **jusqu'au bord du
terrain**. Puis ça recommence.

C'est ce mécanisme qui rend compte des trois relevés d'angle contradictoires :
les deux hypothèses testées — « suit le cap », « vise » — étaient fausses toutes
les deux, donc aucune ne pouvait ressortir d'une mesure, si soignée soit-elle.
Une lance qui balaie n'est corrélée qu'à elle-même.

**Le sprite est 1,5 fois plus épais**, sans être plus long : la maquette est
ré-échantillonnée en blocs 3 × **2** au lieu de 3 × 3, donc 208 × 64 au lieu de
208 × 43. La largeur dessinée vaut `map.w × scale` et ne bouge pas ; la hauteur
vaut `map.h × scale`. On ne dilate pas un sprite existant, on retourne à la
source et on l'échantillonne plus fin en vertical — ce qui ajoute du détail au
lieu d'en étirer.

**Le rythme de charge, mesuré sur les deux vidéos.** Une charge toutes les
**1,0 à 1,7 s**, parcourant **137 px logiques**, à un pic de **1 392 à
1 770 px/s vidéo**, pour une cadence de touche de 0,181 coup/s. Autrement dit
le Dragoon **charge souvent et rate souvent** : environ une charge sur trois
porte. Le Lancier chargeait toutes les 4,3 s et touchait presque à chaque fois —
même cadence de touche, comportement sans rapport. C'est cet écart-là qui
faisait « mou et désynchronisé », et il était invisible tant qu'on ne comparait
que la cadence.

**L'arrêt avant la charge n'est pas relevé — cette mesure est retirée.** Le
« 163 px/s une image avant le déclenchement » venait d'un détecteur qui ne
retenait un déclenchement que si la vitesse précédente valait moins de 35 % de
la suivante : il sélectionnait les images précédées d'un creux, puis rapportait
qu'il y avait un creux. Avec un seuil neutre, la vitesse avant charge vaut
732 px/s (A) et 413 (B). La phase est gardée parce qu'elle a été demandée comme
effet de jeu.

**Ce que disait l'ancienne version :** La vitesse tombe à **163 px/s une image
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

**L'ancrage est binaire.** Il était d'abord rapproché à vitesse bornée
(420 px/s) pour éviter un saut — une erreur de lecture : une interpolation, si
rapide soit-elle, fait *glisser* l'arme pendant la charge, donc elle court après
la bille au lieu de former un bloc avec elle. Le saut est exactement ce qu'on
veut voir, et il tombe dans l'image même où la phase change.

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

**Cinq effets de traînée, tous dans `render/flair.js`.** Les trois d'origine —
boucles de pointe, fuseau, images fantômes — passent du cramoisi mesuré au
**violet électrique**, pour ne pas lire comme deux personnages superposés
derrière une lance violette. S'y ajoutent une **aura d'arme** tracée sur
`bladeSegment()`, donc solidaire de la portée et du décalage latéral, et une
**onde de pénétration** conditionnée à `Fighter.boost` : un sillage en coin
ouvert vers l'arrière depuis la pointe — ouvert vers l'avant il se lirait comme
un projectile — plus un arc de proue devant elle.

Aucun des deux ne touche la simulation : `flair.js` a son propre aléa et son
propre banc de particules, et la matrice est vérifiée **identique** après
l'ajout. C'est précisément ce que cette porte d'entrée sert à garantir.

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

## 🌿 MAGE — `mage` (affiché « MAGE »)

Quatrième invité, **demandé** : un mage vert, armé du sceptre d'une maquette
fournie, qui **attaque à distance** avec des **orbes guidées**, dont l'arme est
**posée sur le côté** et **vise** l'adversaire, sans mécanique propre par
ailleurs, **construit sur la mécanique de Magia**, et **portant les pouvoirs de
la Plante**.

### Le repère de mesure n'est pas celui des autres

Piège d'entrée, et il aurait faussé toutes les cotes. *Dragoon vs Magia* est en
576 × 1024 comme les deux autres vidéos ballthingsim, **mais son cadrage
diffère** : l'arène y mesure **502 px de bord extérieur** contre 640 dans le
jeu, soit **×1,275** et non ×1,25.

Vérifié par un objet dont on connaît déjà la taille : la bille fait 32 px de
rayon (29,5 mesurés sur le masque de couleur, plus la moitié du contour sombre
que le masque exclut), et 32 × 1,275 = **40,8**, soit les 41 px du roster. Deux
mesures indépendantes qui tombent sur le même facteur : c'est ce qui l'établit.

**Règle qui en sort :** ne pas supposer le facteur de conversion d'après le
format de la vidéo. Le mesurer sur l'arène, le vérifier sur un objet connu.

### Ce que Magia rend, et comment

| Mesure | Valeur | Comment |
| --- | --- | --- |
| **Stat de HUD** | **« Attack Speed »**, une cadence de tir qui **monte toute seule** | lue image par image sur la bande de stat |
| Départ | **1,00** | t = 0 |
| Paliers | **1,10** à t≈1,2 s · **1,15** à 2,2 s · **1,25** à 3,2 s · **1,30** à 3,8 s | tous multiples de **0,05** |
| Plus tard | **2,00** à t≈13 s, **~3,7** en fin de duel | premier chiffre lisible malgré le filigrane |
| Loi déduite | **+0,05 par orbe tirée**, à la cadence courante | six paliers en 4,5 s pour une cadence moyenne de 1,15/s ; donne `e^(0,05 t)`, soit 1,92 à 13 s |
| Ultime | **HEARTBREAK FINALE** | non porté : le Mage prend celui de la Plante, demandé |
| Déplacement | **548 px/s** de médiane (p25 507, p75 629) | 258 couples d'images |
| Arme | baguette **posée sur le flanc**, ~100 px vidéo entre les deux bouts | soit **128 px** en repère jeu |
| Projectiles | des cœurs roses, à trajectoire **courbe** | ~600-780 px/s en repère jeu selon la portion de vol |

**Le filigrane TikTok couvrait la stat à partir de t = 5 s.** Le dépôt le
savait déjà (« binariser la zone de texte avant de hacher une bande de
stats ») ; ici la solution est plus simple et plus sûre : **ne garder que les
pixels roses** du texte (`R − G > 45`). Le filigrane est blanc-gris neutre,
donc il disparaît entièrement, et les chiffres restent lisibles là où il ne les
recouvre pas.

**La vitesse se recale toute seule.** Le Dragoon est dans la même vidéo, et on
sait par ailleurs qu'il vaut ~540 px/s dans le jeu : il y mesure 521 avec le
même code. L'écart de 4 % dit que le facteur ×1,275 est bon, et que les 548 de
Magia valent bien ~550 en repère jeu. **Mesurer un personnage connu dans la
même vidéo est le meilleur étalon disponible.**

### Le sceptre

Transcrit de la maquette fournie, pas dessiné.

| | |
| --- | --- |
| Résolution de la maquette | **6,5 px par pixel d'art** — le damier de transparence fait 13 px, soit exactement deux pixels d'art. Confirmé par un balayage : l'erreur de reconstruction a un minimum net à 6,5 (15,2) contre 17-21 aux valeurs voisines |
| Grille native | 72 × 158 pour l'image entière, **33 × 139** pour le sceptre seul |
| Carte livrée | **70 × 17**, la native réduite de moitié, dessinée à `scale: 2` |
| Portée | **128 px**, `handle.length` = −12, largeur dessinée 140 → la somme retombe sur la portée |
| Hitbox | **0,87 → 1** de la portée, rayon 15 : **seul le cristal blesse** |

**Pourquoi la moitié de la résolution.** Livré à `scale: 1`, le sceptre faisait
139 px d'écran avec **un pixel d'art par pixel d'écran** : la hampe se
réduisait à un trait et le cristal à une tache, là où tout le roster dessine
ses armes à 2 ou 3 et y gagne son grain. La réduction est un **vote majoritaire
par bloc 2 × 2**, le cristal l'emportant sur le bois — sans cette priorité ses
quelques cellules brillantes disparaissaient sous la majorité de brun.

**L'icône et l'orbe ne sont pas redessinées.** L'icône échantillonne la carte
du sceptre (même vote majoritaire, même priorité au cristal) et l'orbe est
composée des seules teintes de ce cristal. C'est la leçon d'`ICON_LANCE`, qui
avait divergé deux fois de l'arme qu'elle annonçait. La corolle verte, elle,
**partage le tableau `rows` de celle de la Plante** et n'en change que la
palette : le dessin ne peut pas diverger puisqu'il n'existe qu'une fois.

### L'arme braquée, troisième fois

`weapon.spin: 0`, et `abilities/mage.js` recopie l'angle vers l'adversaire à
chaque image. Le dépôt avait déjà payé deux fois « une arme braquée touche en
permanence » — Hors-la-loi puis Lancier. Ici le garde-fou est **géométrique**
et tient tout entier dans la fiche :

- la hitbox ne couvre que les 17 derniers pixels (`hitbox.from: 0.87`) ;
- l'arme est **décalée de 34 px sur le flanc** via `weaponLateral`, le compteur
  générique du `Fighter` — donc le segment tranchant **ne passe pas par l'axe
  qui vise**.

34 px est réglé à l'image : à 20 le sceptre chevauche la bille et ne se lit
plus, à 50 il flotte à côté sans lien avec le corps.

Ça n'a pas suffi à le rendre inoffensif au contact — la mêlée pèse encore 17,8
PV par duel, soit 20 % de ses dégâts — mais ça l'a rendu **rare**, ce qui est
le point : ses touches de contact ne sont pas bornées par la recharge (voir
plus bas).

### Le guidage

`projectiles.orb.homing = { turnRate: 2.6, delay: 0.1 }`, lu par
`game/projectiles.js`. Le moteur ne nomme personne : il vise « le premier
combattant en scène qui n'est pas le tireur », exactement le test que fait déjà
sa boucle de touche. La branche n'existe pas pour les projectiles qui ne
déclarent pas `homing`, et les dix affrontements d'avant sont restés
**identiques au caractère près**.

Le `delay` de 0,1 s laisse l'orbe sortir du sceptre avant de virer : sans lui,
une orbe tirée vers l'arrière pivote dans l'arme même.

### L'équilibrage : le levier évident n'était pas le bon

Livré tel quel, le Mage gagnait **11 duels sur 12**. Le guidage semblait être
son levier :

| `turnRate` | 3,4 | 2,6 | 1,8 | 1,2 | 0,8 | 0,4 |
| --- | --- | --- | --- | --- | --- | --- |
| victoires / 24 | 22 | 20 | 22 | 19 | 18 | 16 |

**Plat.** Un banc qui plafonne dit que le levier n'est pas le bon — le dépôt
l'avait déjà appris sur la dispersion du Hors-la-loi. L'ablation a tranché en
comptant les dégâts **par source** (`opts.kind` dans `game.damage`) :

| Source | PV par duel | Part |
| --- | --- | --- |
| projectiles | 61,1 | **68 %** |
| mêlée | 17,8 | 20 % |
| tempête | 7,2 | 8 % |
| bulbes | 3,8 | 4 % |

C'est donc la **valeur** des orbes, pas leur trajectoire. Et elle est raide :

| `orb.damage` | 3 | 2 | 1 |
| --- | --- | --- | --- |
| victoires / 24 | 20 | 15 | **0** |

Deux choses apprises au passage :

- **Deux leviers qui marchent chacun ne s'additionnent pas.** Orbe à 2 **et**
  mêlée à 1 faisaient tomber le Mage à **8/24**, alors que chacun seul le
  posait vers 15. Près du seuil, un point de dégât bascule des courses déjà
  serrées.
- **Le verrou de mêlée n'est pas un levier ici**, contrairement au
  Hors-la-loi : balayé à 1,4 / 1,7 / 2,2 s il rend 15 / 12 / 14 victoires,
  non monotone, donc du bruit. Il reste à 1,7 s parce que c'est la
  configuration sur laquelle la matrice a été relevée, et son commentaire le
  dit — pas parce qu'il équilibre.

**Réglage retenu :** `orb.damage: 2`, mêlée 2 PV / 1,7 s → **12 victoires sur
24** au banc des deux camps, **5 sur 12** dans la matrice d'alors — avec le
Semis encore en place (voir la section suivante pour son retrait, qui a depuis
changé ce chiffre à 6/12).

Profil obtenu à ce stade, et il était cohérent : le Mage **bat les deux
combattants à portée courte** (Hors-la-loi 3-0, Bretteur 2-1) et **perd contre
les deux qui referment vite** (Lancier 0-3, Shinobi 0-3). Un tireur se fait
battre par qui arrive au contact — ça reste vrai après le retrait du Semis,
seul le score contre le Bretteur et le Shinobi a un peu bougé.

### Les pouvoirs de la Plante — délégués, pas recopiés

**Historique : à la sortie, deux pouvoirs.** La fiche du Mage portait les
**mêmes blocs** `ability.bulb` et `ultimate.storm`, et `abilities/mage.js`
appelait `plantAbilities.update`, `.init`, `.drawUnder`, `.drawOver` et
`.barValue`. Aucune ligne en double : une copie aurait divergé au premier
réglage, exactement la duplication que le dépôt a déjà payée sur `drawGauge`.

Trois écarts, tous volontaires :

- **dégâts et soin constants** au lieu de suivre `self.stacks`. Chez la Plante
  la pile est « Bulb Damage/Heal » ; ici elle est la cadence de tir, et la
  faire piloter aussi les bulbes empilerait deux montées sur une seule stat ;
- **`bulb.max: 3`** au lieu de 4 : le Mage sème en tirant, il ne se replie pas
  sur ses bulbes ;
- **tout est reteinté en vert**, corolle comprise.

**Ce dernier point a demandé une correction dans `plant.js`, conservée après
le retrait du Semis** (section suivante) parce que la Tempête de sève en a
toujours besoin. Le module codait `'flower'` en dur dans `drawSwarm`, et la
couleur rose de la gerbe d'un bulbe qui éclate en littéral : la tempête verte
du Mage faisait donc voler des corolles **roses**. Les deux littéraux sont
passés en clés de fiche (`swarm.flowerSprite`, `bulb.burstColors`) **avec le
littéral d'origine en repli** — la Plante ne change pas d'un pixel, et la
matrice le confirme.

### Le Semis retiré, et le sceptre par-dessus la bille

Deux demandes, purement indépendantes l'une de l'autre.

**Le Semis (les bulbes posés au sol) a été retiré.** Un tireur qui vise et
guide ses orbes n'a pas besoin d'une mine plantée par terre — c'était le seul
morceau du Mage qui se jouait **au sol** plutôt qu'en l'air, et il tranchait
avec le reste de sa fiche.

Retrait propre, pas un simple masquage visuel : `ability.bulb` a disparu de la
fiche, `ability.cooldown` passe à `Infinity` (même patron que la Furie du
Lancier — un cooldown jamais décompté, que `ui/select.js` affiche « passif »),
et `abilities/mage.js` ne délègue plus que `updateStorm` / `drawOver` /
`barValue`, jamais `updateBulbs` / `updateSemis` / `drawUnder`.

**Ça a demandé de scinder `plantAbilities.update()` et `.init()`**, qui
enchaînaient jusque-là bulbes, tempête et minuterie de semis dans une seule
méthode. Découpés en `updateBulbs` / `updateStorm` / `updateSemis` (et
`initBulbs` / `initStorm`), appelés dans le même ordre par `update()` — la
Plante ne perd donc pas un pas de simulation, c'est une réorganisation pure.

Le `projectile.flower` de la fiche du Mage a suivi : il n'était tiré que par
les bulbes (`ability.bulb.projectile`), donc il ne sert plus à rien — et une
clé de fiche que plus personne ne lit ne crie pas (invariant 9), y compris
dans `ui/select.js`, qui l'aurait affichée dans la ligne « Projectile » de la
carte sans qu'elle corresponde à quoi que ce soit en jeu. Retiré. La corolle de
la Tempête, elle, ne dépend pas de ce registre : `flowerSprite: 'mageFlower'`
est lue directement dans `PIXEL_MAPS` par `drawSwarm`.

**C'est un changement de jeu**, pas un simple nettoyage : le Semis pesait des
dégâts, du soin et un ralentissement. Seules les lignes du Mage bougent dans la
matrice, le reste au caractère près :

| | Avant (avec Semis) | Après |
| --- | --- | --- |
| vs Hors-la-loi | 3-0 | 3-0 |
| vs Bretteur | 2-1 | 1-2 |
| vs Lancier | 0-3 | 0-3 |
| vs Shinobi | 0-3 | 2-1 |
| **Total** | **5/12** | **6/12** |

*(Correction : une première version de ce tableau inversait le score « après »
contre le Shinobi — 1-2 au lieu de 2-1. La ligne ci-dessus est la bonne, et
c'est elle que confirme `tools/matrix-reference.txt`.)*

Le Mage bat toujours le Hors-la-loi et perd toujours contre le Lancier ; ce qui
bouge nettement, c'est le Shinobi — une défaite sèche (0-3) devient une victoire
nette (2-1). C'est plus que ce que le retrait des bulbes explique à lui seul :
retirer toute une mécanique retire aussi ses propres décorations (gerbes de
plantation, de touche, anneau de soin), et celles-ci **consomment `game.rng`**
comme le reste des particules du dépôt — un chantier connu et non résolu (voir
« Déterminisme et ordre d'exécution » dans `CLAUDE.md`). Une part de ce
basculement est donc probablement un remaniement du tirage plutôt qu'un effet
mécanique direct du Semis sur ce duel précis ; sans ablation dédiée, impossible
de trancher la part de chaque cause. Aucun levier n'a été retouché pour
autant : le retrait suffit à rester dans la bande, sans nouveau réglage.

**Le sceptre se dessine maintenant par-dessus la bille**, `weapon.overBody:
true` — même drapeau que le Lancier et le Bretteur, purement visuel : il ne
pèse sur aucune hitbox (`bladeSegment()` ne le consulte pas), seul l'ordre de
peinture dans `fighter.js` en dépend. Vérifié en isolant les deux changements :
`overBody` seul laisse la matrice **identique au caractère près**, c'est le
retrait du Semis qui la fait bouger.

### Le sceptre centré sur le pivot — une demande visuelle qui a coûté de la portée

**Demandé : la même longueur devant et derrière le point d'attache.** À la
sortie du personnage, le sceptre ne l'était pas du tout — `handle.length: -12`
pour une carte dessinée sur 140 px (70 cellules × `scale: 2`), donc **128 px
devant** le pivot (jusqu'au cristal) contre **12 px derrière**. Le sceptre
tenait presque tout entier en avant de la bille, un talon microscopique dans
son dos.

Recentré à largeur dessinée inchangée : `handle.length: -70`, donc 70 px de
chaque côté. C'est un simple partage en deux de la largeur du sprite (140 / 2
= 70), aucun redessin.

**Mais l'invariant du dépôt ne laisse pas ce choix gratuit.** `handle.length` +
largeur dessinée doit toujours valoir `reach` — sinon la pointe du sprite ment
sur la hitbox. Avec `handle.length: -70` et 140 px dessinés, la pointe tombe à
70, donc `reach` **doit** passer de 128 à 70 : centrer le sceptre sans le
redessiner plus grand réduit mécaniquement sa portée de près de moitié. Il n'y
avait pas de troisième voie à largeur de sprite inchangée — grossir la carte
pour garder `reach: 128` en symétrique (donc 256 px dessinés) aurait demandé un
`scale` non entier (~3,66) et un sceptre visuellement disproportionné par
rapport à la bille.

**Même patron que le Shinobi**, seul autre combattant à porter une arme
centrée sur son pivot : `handle.length: -75, reach: 75`, sa portée mesurée
elle aussi ramenée par la symétrie et jamais recalée depuis. Le Mage suit le
même choix — la portée `reach: 70` n'est plus la baguette mesurée sur Magia
(128 px), elle est **déduite** de la symétrie demandée.

`fireOrb()` (`abilities/mage.js`) n'a pas eu besoin d'être touché : il lit
`f.el.weapon.reach` pour placer le point de tir, donc l'orbe part toujours du
cristal — mécaniquement plus proche de la bille qu'avant, puisque le cristal
lui-même l'est. `hitbox.from: 0,87` n'a pas bougé non plus : le cristal reste
les 13 % derniers de l'arme, seule l'arme entière a raccourci.

**C'est un changement de jeu, pas seulement un ajustement visuel**, et il a été
accepté comme tel plutôt que compensé par un autre réglage. Seules les lignes
du Mage bougent dans la matrice :

| | Avant (reach 128, asymétrique) | Après (reach 70, centré) |
| --- | --- | --- |
| vs Hors-la-loi | 3-0 | 2-1 |
| vs Bretteur | 1-2 | 1-2 |
| vs Lancier | 0-3 | 0-3 |
| vs Shinobi | 2-1 | 1-2 |
| **Total** | **6/12** | **4/12** |

Deux victoires perdues, une contre le Hors-la-loi et une contre le Shinobi —
ses deux adversaires les plus rapides à revenir au contact une fois la portée
raccourcie. Le score contre le Bretteur et le Lancier ne bouge pas. Le Mage
descend dans la bande basse du roster réduit, aux côtés du Hors-la-loi et du
Bretteur (4/12 chacun), sans tomber en dessous. Rien
d'autre n'a été retouché pour compenser : la demande portait sur l'apparence,
pas sur l'équilibre, et le nouvel équilibre est *le* résultat de la demande,
pas un accident à corriger. Si la portée doit revenir, les deux leviers
disponibles sont d'agrandir le sprite (en acceptant un sceptre plus grand pour
retrouver `reach: 128` en symétrique) ou de renoncer au centrage.

### Le chiffre de PV repassé par-dessus la Tempête de sève

**Signalé : pendant l'ultime, on ne voit plus combien de PV il reste à la
cible.** La nuée de cubes verts (`drawSwarm`, dessinée par `drawOver`) est
opaque et recouvre toute la bille — chiffre de PV compris, puisque
`Match.draw()` trace les combattants (`f.draw()`, chiffre inclus) **avant**
d'appeler `drawOver` sur les modules de pouvoirs. Le Mage n'invente rien de
nouveau ici : c'est un trou générique du pipeline, juste jamais remarqué avant
qu'un pouvoir ne pose quelque chose d'aussi opaque et aussi grand sur sa cible.

Corrigé au niveau du moteur, pas de la fiche : `Fighter.drawHpNumber()`
factorise le tracé du chiffre (jusque-là un closure local à `draw()`), et
`Match.draw()` le rappelle pour tous les combattants en scène, juste après la
boucle `drawOver` — `globalAlpha` remis à 1 d'abord, pour ne pas hériter d'un
fondu mal restauré par un module. Un second `fillText` opaque au même endroit
ne change rien à l'écran pour les neuf combattants qu'aucun `drawOver` ne
recouvre : vérifié sur le Bretteur (Rage infernale) et le Hors-la-loi
(HIGH NOON) sans aucun artefact de double-tracé, et la matrice reste
**identique au caractère près** — c'est un second passage de rendu, rien qui
touche à `game.rng` ou à l'état d'un combattant.

### Tir enraciné — le troisième créneau, et le seul pouvoir original du Mage

**Demandé : un pouvoir spécial à lui.** Le Mage était le seul des cinq
combattants actifs sans troisième créneau. Les quatre autres en portent un
**emprunté** à un élément gelé — Blizzard (Glace) pour le Hors-la-loi, Rage
infernale (Feu) pour le Bretteur, Lien d'essence (Ombre) pour le Lancier — sauf
le Clone d'ombre du Shinobi, conçu pour lui. Celui-ci est du second type :
original, rien ne le porte ailleurs.

**Le marché : il s'immobilise pour frapper fort.**

| | |
| --- | --- |
| Cycle | premier à **3,5 s**, puis toutes les **7 s** — trois enracinements dans un duel moyen de 20 à 25 s |
| Ancrage | **1 s** à l'arrêt complet (`f.boost` / `f.boostFactor: 0`, le compteur générique, exactement la phase `brace` du Lancier) |
| Pendant la charge | les orbes ordinaires **s'interrompent** — c'est ce qui fait *attendre* le grand coup au lieu de l'ajouter par-dessus le reste |
| Récompense | une **orbe majeure** : 6 PV contre 2, 44 px contre 24, 620 px/s contre 470, guidage 3,4 rad/s contre 2,6 |

C'est la seule dimension de risque de tout son jeu : partout ailleurs le Mage
tire en fuyant, sans jamais rien exposer. Enraciné, il ne peut plus esquiver.
La contrepartie devait donc être franche — une orbe à peine meilleure n'aurait
jamais valu le risque, et le pouvoir n'aurait servi qu'à se faire toucher.

**Pas de zone posée au sol.** Les racines sont accrochées à lui et disparaissent
avec le tir : c'est délibérément l'inverse du Semis, retiré précisément parce
qu'il laissait des bulbes plantés dans l'arène.

#### Ce que le rendu a demandé

- **Les racines partent du bord de la bille, pas de son centre.** Première
  version : 58 px mesurés depuis le centre, or le corps en fait 41 de rayon —
  elles restaient donc invisibles sous lui pendant les deux premiers tiers de
  la charge, et on ne voyait rien venir. Elles sortent maintenant du corps dès
  la première image.
- **La jauge se remplit, elle ne se vide pas.** Reprise telle quelle du
  Blizzard, elle décomptait le temps restant — donc elle partait pleine et
  tombait à zéro au moment du tir, ce qui se lit comme un pouvoir qui se
  termine à l'instant où il commence. Un tir qu'on charge veut l'inverse.
- **Les racines sont en bois, pas en vert.** En vert uni (`#1f964d`) elles se
  lisaient comme un astérisque, sept piques identiques plantées autour de la
  bille. Passées au brun de la hampe (`#4a3b2f`) avec la pointe verte, elles se
  rattachent au sceptre et se lisent comme des racines.
- **`duration`, pas `charge`.** La clé portait d'abord le nom qui décrit ce
  qu'elle fait ; mais `ui/select.js` lit `special.duration` pour la ligne
  « Special » de la carte, comme pour les quatre autres pouvoirs greffés, et la
  carte affichait donc « Rooted Shot — **undefineds**, every 7s ». Le nom
  générique gagne : c'est celui que le reste du dépôt attend.

#### Un piège évité de justesse

`Projectiles` garde son `owner` **par identité** pour savoir qui ne pas
toucher. La première version du tir passait une **copie** du combattant
(`{ ...f, x: tip.x, y: tip.y }`) pour placer l'orbe au bout du sceptre — l'orbe
majeure aurait alors frappé son propre tireur. Le tir emprunte donc la position
du cristal le temps du `spawn` puis la rend, exactement comme `plant.js` le
fait pour tirer depuis un bulbe.

#### Équilibrage

Aucun réglage n'a été nécessaire : les valeurs de départ tombent juste.

| | Avant | Après |
| --- | --- | --- |
| vs Hors-la-loi | 2-1 | 3-0 |
| vs Bretteur | 1-2 | 2-1 |
| vs Lancier | 0-3 | 1-2 |
| vs Shinobi | 1-2 | 0-3 |
| **Total** | **4/12** | **6/12** |

Le Mage revient exactement à la médiane, et **le roster entier se resserre** :
9/9/6/3/3 contre 10/8/4/4/4, le relevé le plus serré depuis la réduction à cinq
combattants.

Deux résultats se lisent tout seuls dans la mécanique :

- **il prend une victoire au Lancier** (0-3 → 1-2), alors qu'il ne lui en avait
  jamais pris une seule. Le Lancier charge en ligne droite ; une orbe guidée à
  6 PV est exactement ce qui punit une trajectoire prévisible ;
- **il en perd une contre le Shinobi** (1-2 → 0-3). L'immobilité d'une seconde
  est précisément ce que le combattant le plus rapide du roster sait punir.
  C'est le risque du pouvoir qui se voit dans la matrice, pas un défaut de
  réglage.

Curseurs si l'équilibre doit bouger : `special.duration` (le temps
d'immobilité, donc le risque), `projectiles.greatOrb.damage` (la récompense) ou
`special.cooldown` (la fréquence).

### Ce qui n'a pas été repris de Magia

- **Sa couleur** — le personnage est vert, demandé. Vert `#1f7a3d`, plus sombre
  et plus bleu que celui de la Plante (`#15c701`, un vert acide), pris sur la
  sève du sceptre. Le chiffre de PV est en crème : sur un vert de cette
  luminance il tranche mieux qu'un noir.
- **Son arme** — remplacée par le sceptre de la maquette.
- **Son ultime** *HEARTBREAK FINALE* — remplacé par la Tempête de sève.
- **Ses cœurs** — remplacés par les orbes de sève.
- **Sa vitesse** telle quelle : 548 mesurés, **520 retenus**, `calé` comme
  toutes les vitesses du dépôt.

### Comme le Shinobi : le chiffre de PV disparaît pendant le flash

`bodyHit` est blanc et `hpColor` est crème : à l'image où le Mage encaisse, son
chiffre de PV s'efface. Trait partagé avec le Shinobi (`hpColor: '#f5f2ea'`,
`bodyHit: '#ffffff'`), connu et assumé — le flash dure une ou deux images.
Le corriger demanderait un `hpColor` sombre, qui se lirait moins bien le reste
du temps sur un corps de cette luminance.

---

## Équilibrage du roster

Vérifié par simulation sans rendu sur les **15 affrontements** du roster
(5 × 5 avec miroirs), 3 seeds chacun — c'est `tools/matrix.mjs`, et sa sortie
est figée dans `tools/matrix-reference.txt`.

**Relevé courant**, sur les 12 duels hors miroir de chacun :

| | victoires |
| --- | --- |
| Lancier | 9/12 |
| Mage | 7/12 |
| Shinobi | 6/12 |
| Hors-la-loi | 4/12 |
| Bretteur | 4/12 |

Écart **4 à 9**, le plus resserré depuis la réduction du roster.

- **mort subite** : au-delà de 55 s, tous les dégâts sont multipliés par
  `1 + (t − 55) / 18` (plafond ×4). Aucun duel ne peut s'éterniser ;
- garde-fou du Hors-la-loi : `tools/probe.mjs outlaw` mesure ~0,60 coup/s
  contre les 0,65 relevés sur la vidéo, et sa stat `Damage` finit autour de 5,0
  contre 5,50 mesurés.

**Deux conventions à garder en tête avant de juger un écart :**

1. **La matrice ne joue chaque paire qu'une fois**, donc chacun y reste
   toujours du même côté et le camp A pèse lourd. Elle **exagère les écarts** :
   le Hors-la-loi et le Bretteur y étaient à 3/12 quand le banc des deux camps
   les donnait à 10/24 et 9/24, presque la moyenne. C'est un garde-fou de
   **non-régression**, pas une mesure de force.
2. **Le levier d'un combattant faible est parfois chez un autre.** Les leviers
   propres du Hors-la-loi (rayon de balle) et du Bretteur (palier de surchauffe)
   sont plats ; c'est baisser les dégâts de mêlée du Shinobi qui les a remontés
   tous les deux. Le relevé complet de ces balayages est dans la section du
   Shinobi.

Le banc est reproductible : chaque duel se rejoue à l'identique avec
`index.html?a=…&b=…&seed=…`.

### Dernier relevé à onze combattants (historique)

Le roster est réduit à cinq depuis, et les sept éléments gelés ont été
supprimés : ce relevé n'est plus régénérable. Il est gardé parce qu'il porte
des **leviers**, qui eux restent vrais — trois d'entre eux ont resservi
depuis.

Lancier 30, **Hors-la-loi 25**, Ombre 15, Lumière 15, Glace 15, Feu 13,
Vent 12, Plante 11, Foudre 10, Eau 10, Bretteur 9 — sept hors de la bande
13–17. Ce qu'il faut en retenir :

- **Le Lancier à 30/30 gagnait tous ses duels.** C'est le piège de l'arme
  braquée dans sa forme la plus pure : une charge qui traverse l'arène contre
  dix adversaires qui **pilotent vers lui** et entrent donc dans le couloir. Le
  rayon de hitbox n'est pas le levier (de 12 à 3 px il ne descend que de 0,506
  à 0,439 coup/s — les charges ne frôlent pas, elles traversent) : les leviers
  sont `lunge.scanSpin` et le retour à une charge de longueur bornée. **À
  traiter avant toute réactivation du roster complet.**
- **Le Hors-la-loi à 25–26 est un écart assumé**, conséquence directe de trois
  demandes (rechargement ×2 plus rapide, balle ×1,3, éclats de givre).
  L'ablation dit lequel pèse : rechargement seul **23**, éclats seuls **28**,
  vitesse de balle seule 14 — soit rien de mesurable. Aucun levier disponible
  ne le ramène dans la bande sans défaire la demande : la cadence du Blizzard
  est plate (25–26 de 11 s à 26 s), celle des éclats ne descend pas sous 23, et
  `ability.cooldown` comme `magazine` sont `mesuré`. La dispersion y arrive
  (1,35 rad → 16) mais un cône de 77° fait cesser le canon asservi de se lire
  comme une visée.
- **La Lumière à 21/30 puis 15** : son Égide grandit quand elle **encaisse**,
  et les trois invités frappent rarement pour beaucoup — le profil exact que le
  bouclier absorbe. Elle les bat 9-0. Couplage de fiches, pas dérive ; aucune
  valeur de la Lumière n'a jamais été touchée.
- **L'Eau tenait la bande de justesse, à 13**, en perdant 0-3 contre l'Ombre,
  la Lumière et le Lancier. C'est elle que la moindre retouche du Lancier
  faisait sortir : à `lunge.minRange` 220 il la balayait 3-0 (12), à 240 elle
  revenait. Ces 20 px coûtaient 0,13 PV/s de fidélité (2,53 contre 2,40) — la
  bande passe avant.
- **Le tour de rechargement du Hors-la-loi lui coûtait ses touches de mêlée.**
  Pendant 1,4 s l'arme n'est plus asservie, or le bout du canon porte la
  hitbox de contact (`hitbox.from: 0,62`) : il balaie au lieu de pointer. Il
  était tombé de 15 à **9/30**. Porter le gel de 0,30 à **0,50** l'a ramené à
  **16/30** — plus que compensé. Levier à retenir :
  `projectiles.shot.onHit.slow`.
- **Les deux pouvoirs greffés** (Blizzard, Lien d'essence) ont déplacé sept
  affrontements sur 66 et n'ont fait sortir personne de la bande.
- **Le recul symétrique a ramené le Lancier de 19 à 17 tout seul**, sans
  qu'aucun levier d'équilibrage ne soit touché : un attaquant repoussé aussi
  fort que sa cible met plus longtemps à revenir au contact. Un réglage de mise
  en scène qui rend un équilibre — l'inverse arrive plus souvent.

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
