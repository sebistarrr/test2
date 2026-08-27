# CLAUDE.md — mémoire du projet

**Outlaw vs Bladesman** — simulation d'auto-battler 2D, duel de deux billes
dans une arène carrée. Reproduction d'une vidéo de référence
(576 × 1024, 30 fps, 1159 frames, 38,6 s).

Phaser 3 via CDN + Arcade Physics. Trois fichiers statiques, aucun backend,
aucun build. Publié sur GitHub Pages à chaque push sur `main`.

**Lis ce fichier avant d'ouvrir quoi que ce soit d'autre.** Il contient la
totalité du relevé vidéo : les chiffres sont ici, pas à redécouvrir.

---

## Carte des fichiers

| Besoin | Fichier |
| --- | --- |
| Géométrie, palette, typographie, règles | `script.js` §1 à §4 |
| Pixelmaps des armes | `script.js` §5 (`MAP_GUN`, `MAP_SWORD`) |
| Génération des textures | `Duel.preload()` |
| Décor fixe (arène, titres, cadres, filigrane) | `Duel.drawChrome()` |
| Jauges + stats, redessinées par frame | `Duel.drawHud()` |
| Boucle de duel | `Duel.update()` et les `step*()` |
| Page et centrage | `index.html`, `style.css` |
| Déploiement | `.github/workflows/deploy.yml` |

---

## Ce qui est mesuré, ce qui ne l'est pas

Chaque constante de `script.js` porte l'une des deux annotations suivantes.
**Ne jamais changer une valeur `mesuré` sans refaire le relevé.**

- `mesuré` — relevé directement sur la vidéo (position, couleur, durée,
  valeur affichée). Vérifiable, reproductible.
- `calé` — la vidéo ne révèle pas la règle ; la valeur a été choisie pour
  retomber sur le comportement observé.

**Limite honnête du procédé.** Une vidéo ne rend pas le code source. Sont
reproduits à l'identique : la mise en page, les couleurs, les dimensions, la
typographie, les durées d'ultime, les formules de dégâts, les vitesses. Ne
sont **pas** récupérables : la graine aléatoire d'origine, le pas de temps
exact du moteur, et donc la suite précise des trajectoires. Deux exécutions
ne rejoueront pas le duel de la vidéo coup pour coup — elles rejoueront le
même jeu.

---

## Relevé — géométrie

Repère : pixels de la vidéo native, 576 × 1024. Le canvas du jeu utilise
exactement ce repère, ce qui évite toute conversion.

| Élément | Valeur | Méthode |
| --- | --- | --- |
| Fond hors arène | `#D4CED5` — (212, 206, 213) | mode des couleurs, bande y < 200 |
| Arène, chemin du rect | `x=39, y=263, w=498, h=498` | bords sombres cols 37–40 / 535–538, lignes 261–264 / 759–762 |
| Arène, épaisseur du trait | 3,5 px | couverture sous-pixel : 3,46 |
| Centre de l'arène | (288, 512) | = centre exact du canvas |
| Arène, remplissage | `#FFFFFF`, `#FDF7ED` sous HIGH NOON | échantillons aux quatre coins intérieurs |
| Bille, rayon | 32 px, trait 3 px | profil radial : anneau sombre centré sur r = 32,2 |
| Bille, contour | `#181008` — (24, 13, 7) | scan horizontal au centre |
| Outlaw | `#8A5934` — (138, 89, 52) | médiane érodée, titre + bille + jauge |
| Bladesman | `#DCC462` — (220, 196, 98) | idem |
| Jauges | `y=777,5 h=29`, gauche `x=39 w=242`, droite `x=295 w=242`, trait 3,5 | runs sombres ligne 777 : (38, 282) et (293, 538) |
| Filigrane | « ballthing.com », centré x = 288, ligne de base 736, gris ~42 % | médiane (167, 163, 157) sur blanc |

Les jauges sont alignées **exactement** sur les bords de l'arène :
39 + 242 + 14 (gouttière) + 242 = 537.

### Typographie

Grotesque très gras à contour noir et ombre portée. Hauteurs de capitale
mesurées sur une plaque temporelle débruitée, puis
`taille = hauteur_capitale / 0,716` (ratio d'un grotesque très gras).

| Texte | Cap. mesurée | Taille | Ligne de base | Alignement |
| --- | --- | --- | --- | --- |
| Titres | 22 px (lignes 219–240) | 31 px | y = 240 | x = 42 à gauche, x = 534 à droite |
| Stats | ~13,5 px | 19 px | y = 839 et 864 | idem |
| Libellés de jauge | ~11 px | 15 px | y = 792 | x = 46 / x = 530 |
| Points de vie | 23 px (lignes 515–537) | 32 px | centré sur la bille | centré |

La police exacte de la vidéo n'est pas identifiable avec certitude. La pile
retenue est `"Arial Black", "Archivo Black", …` : Arial Black est présente
sur la quasi-totalité des postes Windows et macOS et correspond au relevé ;
Archivo Black est chargée depuis Google Fonts comme repli de même graisse.

---

## Relevé — mécanique

### Formules

```
Visée      angle = atan2(blade.y - outlaw.y, blade.x - outlaw.x)
           le canon y est asservi à chaque frame, sans lissage.

Recul      v -= (cos angle, sin angle) × 95 px/s   à chaque tir

Rebond     mur : composante normale inversée, norme conservée (bounce = 1)
           bille/bille : séparation Arcade sur corps circulaires

Vitesse    rappel doux vers la vitesse cible :
           |v| ← |v| + (base - |v|) × min(1, dt × 3,5)
           sans ce rappel, chocs et recul font dériver la norme, alors que
           le relevé montre des trajets rectilignes à vitesse constante.

Rotation   angle += spin × 2π × dt          (spin en tours/seconde)

Portée     tip = 30 + 46 × 2 = 122 px depuis le centre de la bille
           toucher = distance(centre_outlaw, segment[30, 122]) < 42

Dégâts     Bladesman : damage = 2,00 × spin       (exact, sans exception)
           Outlaw    : damage += 0,10 par coup AU BUT, départ 3,00
```

### Vitesses

Médianes des segments rectilignes entre deux rebonds (57 et 49 segments
d'au moins 6 frames) :

- Outlaw : 16,1 px/frame → **483 px/s**
- Bladesman : 20,2 px/frame → **605 px/s**
- Pendant HIGH NOON les deux gagnent ~22 % (18,4 vs 14,7 et 21,4 vs 18,3)

Bornes de position relevées : x 70,5–504,0 et y 298,5–724,5, cohérentes
avec un rayon de collision de 32 px contre l'intérieur du trait d'arène.

### Spin du Bladesman

Courbe relevée toutes les 10 frames sur les 1159 frames :

- plancher **0,80**, plafond **3,00**, jamais franchis
- montée passive **+0,21/s** (+0,07 toutes les 10 frames)
- sauts discrets de **+0,15** — un par coup d'épée porté
- une fois à 3,00 : palier d'environ **55 frames** (1,8 s)
- puis effondrement à **−3,0/s** (−1,00 toutes les 10 frames) jusqu'au
  plancher, et le cycle repart

Quatre cycles complets sont visibles : plafonds vers les frames 231, 441,
681, 951 ; effondrements vers 285–311, 500–521, 740–761, 1060–1081.

**Ce qui déclenche l'effondrement n'est pas identifiable sur la vidéo.**
Il ne coïncide ni avec BLADE RUSH, ni avec le début ou la fin de HIGH NOON.
Le modèle retenu — surchauffe après un palier au plafond — reproduit
exactement la courbe observée. C'est un `calé`, pas un `mesuré`.

### Ultimes

**HIGH NOON** (jauge gauche, brune). Charge linéaire à 1,13 px/frame sur
238 px utiles → **7,0 s**. À plein, l'arène passe en `#FDF7ED`, la cadence
de tir double, et la jauge se vide à 1,28 px/frame → **6,2 s** d'effet.
Fenêtres actives relevées : frames 166–366, 519–720, 899–1099.

**BLADE RUSH** (jauge droite, dorée). Se remplit puis retombe d'un coup à
zéro et reste vide ~60 frames. Cycles mesurés : 273, 214 et 333 frames —
donc **pas une simple horloge** : la charge dépend aussi des coups portés.
Modèle retenu : horloge de 9 s + 6 % par coup d'épée.

### Munitions

`Ammo: n/6`. Chargeur de 6, environ 18 frames entre deux décréments
(0,6 s), moitié moins pendant HIGH NOON. Le rechargement est le trou entre
`0/6` et `6/6`.

Sur 1103 frames la stat de dégâts de l'Outlaw passe de 3,00 à 5,50, soit
**25 paliers de 0,10**, pour un nombre de tirs estimé à ~50. D'où le choix
d'incrémenter **au coup au but** et non au coup tiré.

---

## Sprites

Les armes de la vidéo sont des rasters pixellisés. Elles sont rejouées
comme des **pixelmaps** (tableaux de chaînes, une lettre par couleur)
peintes dans une `CanvasTexture`, puis filtrées en `NEAREST`.

| Arme | Cellules | Échelle | Taille rendue | Emprise mesurée |
| --- | --- | --- | --- | --- |
| Revolver | 34 × 15 | ×2 | 68 × 30 px | r 30 → 97, y −15 → +14 |
| Épée | 46 × 21 | ×2 | 92 × 42 px | garde r 36–45 (h 43), lame r 45–122 (ép. 24) |

Les longues séries sont générées par `rep(ch, n)` : compter les caractères
à la main est la première source de bug sur ce genre de carte. Les lignes
plus courtes que la largeur sont complétées en transparent.

**Le corps des billes est le seul élément lissé.** Cercle tracé dans une
`CanvasTexture` avec l'anticrénelage du navigateur. Tout le reste garde ses
marches d'escalier. `antialias: true` reste actif dans la config Phaser :
le mode `pixelArt` global crénèlerait la bordure de l'arène.

### Effets

- **Éventail vert** derrière la lame : secteur annulaire plein, reconstruit
  par quadrilatères entre relevés d'angle successifs. Couleur `#A0B414` à
  62 % — mesuré : le cœur rend (187, 200, 79) sur blanc. Ouverture bornée
  en **angle** (1,6 rad, ~92°), jamais en nombre de frames.
- **Sillage de balle** : cinq tirets alignés sur ~90 px derrière le
  projectile, alpha décroissant.
- **Impact** : gerbe d'étincelles, tremblement (±3 px) et sursaut d'échelle
  (×1,28) du chiffre de points de vie.

---

## Invariants — à ne jamais casser

1. **Repère natif.** Le canvas fait 576 × 1024 unités logiques, identiques
   aux pixels de la vidéo. Toute mesure du relevé s'utilise telle quelle.
   Changer la taille du canvas invalide l'ensemble du tableau de constantes.

2. **Le trait des jauges vaut celui de l'arène (3,5 px).** À 3 px les bords
   ne noircissent que deux lignes au lieu des trois du relevé (776–778 et
   805–807). Vérifié au pixel.

3. **L'éventail vert est borné en angle.** Un compteur de frames donne
   trois tours complets de vert à 3,00 tours/s. Déjà fait, déjà corrigé.

4. **`Damage` du Bladesman n'est jamais stocké.** Il est dérivé de `spin`
   à l'affichage. Le stocker séparément fait diverger les deux valeurs.

5. **Rien ne passe devant les billes.** L'éventail est en profondeur 10, le
   sillage en 14, les billes en 20, les armes en 30. Le filigrane est dans
   le décor, donc sous tout le monde.

6. **La vitesse est rappelée vers sa cible à chaque frame.** Sans ce
   rappel, les chocs bille contre bille finissent par immobiliser un
   combattant, et le duel se fige.

---

## Pièges déjà rencontrés

- **`physics.add.overlap(groupe, sprite, cb)` ne garantit pas l'ordre des
  deux arguments de la callback.** En détruisant aveuglément le premier, on
  détruit le Bladesman au lieu de la balle : la bille disparaît, mais son
  chiffre de PV et son épée continuent de suivre le corps détruit, ce qui
  rend le symptôme confus. Toujours retrouver le projectile par
  `groupe.contains(a) ? a : b`.

- **Les cinq taches alignées de la frame 224 sont une seule balle.** Elles
  se lisent comme cinq projectiles dans un détecteur de blobs. L'espacement
  (10 à 20 px) est incompatible avec la cadence de tir : c'est le sillage
  en tirets.

- **Les libellés de jauge recouvrent le remplissage.** Mesurer le taux de
  charge en comptant les colonnes colorées donne un maximum de 157 px au
  lieu de 238. Lire sur les lignes 798–803, sous le texte.

- **Le filigrane TikTok dérive sur toute la vidéo** et traverse les zones
  utiles. La médiane temporelle sur une frame sur sept l'élimine et
  débruite au passage le h264 — c'est la plaque à utiliser pour toute
  mesure de couleur ou de position d'élément fixe.

- **Une couleur relevée sur une vidéo h264 est bruitée de ±8.** Prendre la
  médiane après érosion du masque, jamais la moyenne, jamais un pixel isolé.

- **Chromium en local ne passe pas par le proxy sortant.** Pour tester la
  page hors ligne, intercepter la requête CDN avec `page.route()` et servir
  une copie locale de `phaser.min.js` — ne pas modifier `index.html`.

---

## Ajouter un personnage sans casser le standard

Le moteur ne connaît que deux camps nommés (`O` et `B`) parce que la vidéo
n'en montre que deux. Pour en ajouter un, procéder dans cet ordre.

**1. Palette.** Une couleur d'identité unique, réutilisée pour le titre, la
bille, la jauge et les stats — c'est la règle du relevé, les quatre sont
toujours du même ton. Vérifier le contraste du chiffre de PV (`#F5F2EA`
avec contour sombre) sur le corps : une bille très claire demande un
contour de chiffre plus épais.

**2. Pixelmap de l'arme.** Grille en cellules, rendue ×2. Deux contraintes :

- La cellule 0 se pose à `R0 = 30` du centre, soit le bord de la bille.
  Une arme qui démarre plus loin flotte ; plus près, elle disparaît sous
  le corps.
- La hauteur en cellules × 2 doit valoir l'emprise verticale voulue, et le
  sprite est centré sur l'axe de la bille (`origin(0, 0.5)`).

Palette limitée à 6–9 tons : contour, deux tons sombres, deux moyens, un
reflet. Toujours un contour fermé — sans lui le sprite se dissout sur le
blanc de l'arène.

**3. Portée.** `tip = R0 + cellules × 2`. La portée de collision **doit**
être dérivée de cette formule, jamais écrite en dur : sinon le sprite et la
hitbox divergent dès qu'on retouche la carte.

**4. Mécanique.** Une jauge d'ultime, une stat visible, une formule qui lie
les deux. C'est la grammaire de la vidéo : `Damage = 2 × Spin Speed` côté
Bladesman, `Ammo` + palier de dégâts côté Outlaw. Documenter la formule
ici, dans la section « Relevé — mécanique ».

**5. Contrôle.** Après toute retouche visuelle : capture d'écran comparée
au relevé, et vérification que la géométrie n'a pas bougé (voir Outils).
Après toute retouche de gameplay : durée de duel plausible (la vidéo dure
38,6 s) et aucun des deux camps ne gagne systématiquement.

---

## Outils

```bash
python3 -m http.server 8085 &        # requis pour les captures

# Extraction du relevé (nécessite ffmpeg, numpy, pillow, scipy)
ffmpeg -i reference.mp4 -vsync 0 frames/f%04d.png

# Vérification géométrique : compare bords d'arène et de jauges
# entre une capture du jeu et une frame de la vidéo.
python3 tools/geom.py frames/f0001.png shot.png
```

Poignée de debug exposée en page : `globalThis.__game.scene.scenes[0]`.
`?seed=1234` fixe tous les tirages (angles de départ, gerbes). Ce n'est pas
un rejeu image par image : Phaser avance sur le temps réel.

Vérification syntaxique : `node --check script.js`.

---

## Habitudes attendues

- **Français** dans le code, les commentaires, la doc et les réponses.
- Les commentaires expliquent **pourquoi**, et citent la mesure.
- Chaque constante porte `mesuré` ou `calé`. Pas d'exception.
- Après un changement visuel : capture de contrôle + géométrie inchangée.
- Commits en français, corps détaillé.

---

## Note sur le filigrane

Le texte « ballthing.com » est reproduit parce qu'il figure dans la vidéo de
référence et qu'il a été explicitement demandé. C'est la marque d'un tiers,
pas celle de ce dépôt : elle est isolée dans `drawChrome()` (une seule
ligne) pour pouvoir être retirée ou remplacée en un geste.

De même, l'écran de fin de la vidéo affiche l'appel à l'action de son auteur
(« Play the game :) link in bio »). Il a été remplacé par l'annonce du
vainqueur, dans la même mise en page : recopier l'appel à l'action d'un
tiers sur un autre site n'aurait pas de sens.
