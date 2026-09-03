# Ajouter ou modifier un combattant

Marche à suivre. Les *raisons* sont dans `CLAUDE.md` (invariants, pièges) et
`docs/FICHES.md` (relevés, historique par personnage) — ne les lis que si tu en
as besoin.

---

## Modifier un combattant existant

**Un seul fichier à ouvrir dans la plupart des cas.**

| Ce que tu changes | Fichier |
| --- | --- |
| Couleur, portée, dégâts, cadence, libellés, jauges | `src/data/fighters/<id>.js` |
| Comportement du pouvoir, de l'ultime, d'un état | `src/game/abilities/<id>.js` |
| Dessin d'une arme, d'un projectile, d'une icône | `src/data/pixelart/<id>.js` |
| Override PNG d'un sprite | `assets/sprites/manifest.json` |

Rien à toucher ailleurs : `elements.js` et `pixelmaps.js` ne sont que des
registres, ils n'ont pas de valeur de combattant.

**`<id>` est l'identifiant interne, pas le nom affiché.** Le Shinobi est
`wind`, hérité du Vent dont il est le reskin. Un id ne se renomme pas : il
n'est montré à personne (URL d'archive, clés de module et de sprite), et le
changer touche `ROSTER`, `abilities/index.js` et les registres sans
rien apporter au joueur. Seuls `name`/`nameRef` changent.

---

## Ajouter un combattant

Quatre fichiers, dans cet ordre.

### 1. `src/data/pixelart/<id>.js` — les dessins

Une carte par arme, projectile et icône. `rows` = le dessin en lettres,
`palette` = lettre → couleur, `.` = transparent. Puis les inscrire dans
`PIXEL_MAPS` (`src/data/pixelmaps.js`) : **une clé absente du registre dessine
du vide, sans erreur** — `fiche-check` le détecte.

### 2. `src/data/fighters/<id>.js` — la fiche

```js
import { fiche, SPIN } from '../defaults.js';

export const CRYSTAL = fiche({
  id: 'crystal',
  name: 'CRISTAL',        nameRef: 'CRYSTAL',       // FR / EN
  tagline: '…',           taglineRef: '…',
  icon: 'iconCrystal',
  look: { body, hpColor, outline, accent, aura, flair, trail },
  movement: { speed, turnRate, seek },
  weapon: { name, nameRef, reach, spin: SPIN, spinDir, handle, head, hitbox, melee },
  ability: { id, name, nameRef, cooldown, … },
  ultimate: { id, name, nameRef, barLabel, barLabelFr, barFill, barText, … },
  projectiles: { … },
  hud: { stat, statFr, color },
});
```

`fiche()` pose huit valeurs universelles (rayon 41, contour, police et
décalage du chiffre de PV, masse, `head.anchorY`, `hitbox.to`, `hud.stroke`) —
inutile de les réécrire, il suffit de les surcharger si le combattant y déroge.

Trois règles qui coûtent cher à rattraper :

- **`handle.length` + largeur dessinée = `reach`.** La pointe du sprite doit
  retomber sur la portée, sinon le dessin ment sur la hitbox. La largeur
  dessinée vaut `map.w × head.scale` ; `handle.length` peut être négatif (talon
  derrière le pivot, ou sprite centré sur la bille — voir le Shinobi).
- **Les champs `Ref` sont obligatoires.** L'application est en anglais, le
  dépôt en français ; `label()` a un repli silencieux qui évite le plantage
  mais pas un écran à moitié traduit. `lang-check` les vérifie.
- **Chaque valeur porte `mesuré`, `calé` ou `déduit`** en commentaire. Une
  valeur `mesuré` ne se change pas sans nouveau relevé.

### 3. `src/game/abilities/<id>.js` — les pouvoirs

Implémente `init / update / drawUnder / drawOver / barValue`, plus les crochets
optionnels `onLand`, `drawUnbounded` (effets qui débordent de l'arène) et
`specialBar` (deuxième rangée de jauge, pour un troisième créneau de pouvoir).
L'inscrire dans `abilities/index.js` : **un module oublié retombe sur le module
neutre**, donc le combattant se joue sans pouvoir ni ultime, sans erreur —
`fiche-check` le détecte.

Cette liste est celle que le moteur appelle **vraiment** : la vérifier plutôt
que la recopier. Elle a déjà porté `onDamage` et `drawWeapon` longtemps après
leur suppression, et un crochet fantôme dans une doc coûte une implémentation
qui ne sera jamais appelée. Il reste par ailleurs un crochet **par entité** et
non par module, `customWeapon`, posé sur l'objet lui-même pour remplacer le
tracé de son arme (les clones du Shinobi, qui n'en portent pas).

Tout aléa de simulation passe par `game.rng`, **tout aléa décoratif par
`game.viewRng`** : une décoration qui tire dans le flux de simulation décale
tous les duels (invariant 2).

### 4. `src/data/elements.js` — trois lignes

L'`import`, l'entrée dans `ELEMENTS`, et l'identifiant **en queue de
`ROSTER`**. En queue et pas ailleurs : les paires de la matrice sont formées en
`[liste[i], liste[j]]`, donc insérer au milieu déplacerait le camp A
d'affrontements existants et changerait leur issue sans qu'aucune valeur n'ait
bougé. Preuve à vérifier : le diff de `tools/matrix-reference.txt` ne doit
contenir **que des ajouts**.

---

## Vérifier

```bash
python3 -m http.server 8085 &          # requis par les outils Playwright

node tools/fiche-snapshot.mjs > /tmp/avant.txt   # AVANT de toucher aux données
node tools/fiche-check.mjs             # câblage, sprites, fiche ↔ module
node tools/lang-check.mjs              # les deux moitiés de chaque libellé
node tools/matrix.mjs > /tmp/a.txt && diff tools/matrix-reference.txt /tmp/a.txt
node tools/shot.mjs "?a=<id>&b=outlaw&seed=11" /tmp/s 4,10
```

- **Changement visuel** → la matrice doit être **identique au caractère près**.
  Si elle bouge, le changement n'était pas visuel.
- **Réorganisation de `src/data/`** (découpe, défauts, réécriture de
  commentaires) → `fiche-snapshot` doit être identique. C'est plus fort que la
  matrice, qui ne couvre que ce qu'un duel exerce et laisserait passer une
  régression sur une valeur qu'aucun combat ne lit.
- **Changement de jeu** → régénérer `tools/matrix-reference.txt` et
  **justifier** le nouvel équilibre dans `CLAUDE.md` et `docs/FICHES.md`.

---

## Ce que ça coûte, en pratique

| | Avant la découpe | Après |
| --- | --- | --- |
| Modifier un combattant | `elements.js`, 2 995 lignes | `fighters/<id>.js`, 130 à 590 |
| Retoucher un sprite | `pixelmaps.js`, 1 301 lignes | `pixelart/<id>.js`, 40 à 300 |
| Registre à relire | 2 995 + 1 301 lignes | ~160 + ~90 |

Éprouvé sur l'ajout du Mage : quatre fichiers créés, neuf lignes ajoutées dans
les trois registres, **zéro ligne modifiée** dans une fiche existante —
`fiche-snapshot` le confirme, et le diff de la matrice ne contient que des
ajouts.

Réédité sur le **Colosse**, sous la consigne explicite de ne modifier aucun
combattant existant — avec une difficulté en plus : il fallait donner un
lecteur à `movement.mass`, donc **toucher au moteur**. Preuve tenue quand même,
par une branche rapide à masses égales qui reprend les expressions d'origine
mot pour mot (`physics.js`). Quand un ajout demande de généraliser le moteur,
la question n'est pas « le cas courant rend-il les mêmes valeurs » mais
« passe-t-il par les mêmes expressions » : la multiplication flottante n'est pas
associative, et regrouper autrement les mêmes produits a déjà déplacé deux
affrontements.

---

## Réutiliser les pouvoirs d'un autre combattant

Ça se fait, et ça ne se recopie pas. Le Mage porte les deux pouvoirs de la
Plante : sa fiche déclare les **mêmes blocs** (`ability.bulb`,
`ultimate.storm`) et son module **délègue** —
`plantAbilities.update(f, dt, now, game)`, idem pour `init`, `drawUnder`,
`drawOver` et `barValue`. Aucune ligne en double, donc rien qui puisse diverger
au premier réglage.

Deux points à vérifier quand on fait ça :

- **les valeurs dérivées de `f.stacks`.** Chez la Plante, les dégâts du bulbe
  suivent la pile ; chez le Mage la pile est la cadence de tir. Les fonctions
  de sa fiche rendent donc des constantes — sinon une seule stat piloterait
  deux montées ;
- **les littéraux du module d'origine.** `plant.js` codait en dur la clé de
  sprite `'flower'` et une couleur rose : la tempête verte du Mage faisait
  voler des corolles roses. Les passer en clés de fiche **avec le littéral
  d'origine en repli** laisse le combattant d'origine strictement inchangé —
  la matrice le vérifie.
