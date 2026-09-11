/**
 * Cartes de pixel-art de LUNE.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 *
 * **Deux dessins, deux rôles — et ce n'est plus le même partage qu'avant.** Les
 * deux maquettes de lune sont conservées (demandé), mais elles ne composent plus
 * un corps unique : `lunarDark` **est** le corps, seul et en entier, et
 * `lunarLit` est devenu le **satellite** — les trois cailloux de l'anneau de
 * débris, et les météores quand ils tombent. Chacun est donc dessiné à sa vraie
 * taille au lieu d'être découpé dans l'autre.
 *
 * Les deux sont des **réductions mécaniques** des PNG (Lanczos vers 16 × 16 puis
 * plus proche voisin dans la palette), comme la langue du Soleil — et
 * contrairement à sa sphère, elles passent : les deux maquettes sont organisées
 * **en anneaux concentriques**, ce qui survit à une réduction, là où le
 * tourbillon du Soleil rendait du bruit. C'est la même règle que le dépôt
 * répète : *ça s'essaie et se regarde, ça ne se suppose pas.*
 *
 * @module data/pixelart/lunar
 */

import { deepFreeze } from '../freeze.js';

/**
 * **Les cinq teintes, et elles sont maintenant relevées sur *une seule*
 * maquette** — la face d'éclipse, qui est le corps.
 *
 * Elles venaient des deux images, trois de l'éclipse et deux de la pleine lune,
 * du temps où le corps était composé des deux. Ce n'est plus vrai : la pleine
 * lune n'est plus le corps, elle est un satellite de 44 px. Laisser sa teinte
 * décider du personnage reviendrait à colorier la lune d'après ses cailloux.
 *
 * Même méthode que le Soleil : bandes de luminance sur les pixels opaques,
 * 3ᵉ · 20ᵉ · 50ᵉ · 80ᵉ · 97ᵉ centile de `assets/sprites/lunar-dark.png`. Le
 * déplacement est petit mais il va dans le bon sens — `light` passe du cyan
 * `#b5d5e4` (qui venait de l'autre image) au gris-lavande `#bfc0de` qui est
 * réellement dans le corps.
 */
const PALETTE = {
  K: '#0d0a21', // encre, le noir bleuté du disque éteint
  d: '#1d1738', // ombre
  v: '#604ea1', // violet — la couronne d'éclipse, et la signature
  b: '#bfc0de', // gris-lavande des poussières éclairées
  w: '#f9fdfd', // blanc froid du limbe
};

/**
 * **Le corps, et il est seul** — repli de `assets/sprites/lunar-dark.png`.
 *
 * Il était déjà `look.sprite`, mais le module peignait la face claire par-dessus
 * au terminateur, selon la phase. **Ce n'est plus le cas**, et c'est le premier
 * geste du redessin : le terminateur recouvrait précisément ce que la maquette a
 * de meilleur — l'anneau de lumière rasante, violet puis blanc, qui cerne le
 * disque éteint. À pleine lune il n'en restait rien, et le personnage passait
 * douze secondes sur deux à n'être qu'un disque pâle sur une arène blanche
 * (contraste médian relevé : **1,54**, contre **6,5** pour ce dessin-ci).
 *
 * On y lit donc en permanence ce qui fait sa silhouette : un corps presque noir,
 * un limbe qui brûle, et le champ de grains de glace autour.
 */
export const LUNAR_DARK = deepFreeze({
  w: 16,
  h: 16,
  palette: PALETTE,
  rows: [
    '.....bbbbbb.....',
    '...wbvvvvvvbw...',
    '..bbvvbbbbvvbw..',
    '.bbvbwbvddvvvbb.',
    '.bvbwvddddddvvb.',
    'bvvbbddddKddKvbb',
    'bvbwvKddddKKKdvb',
    'bvbwvKdddvddKdvb',
    'bvbwvKKddvvdKdvb',
    'bvbwvKKKddddKdvb',
    'bvvbwdKddddKdvvb',
    '.bvvbbdKKKKdvvb.',
    '.bbvvbbvvvvbvbb.',
    '..bbvvbbbbbvbw..',
    '...wbvvvvvvbb...',
    '.....bbbbbb.....',
  ],
});

/**
 * **Le satellite** — repli de `assets/sprites/lunar-lit.png`, et c'est son
 * nouveau métier.
 *
 * La pleine lune n'est plus un corps de 176 px qu'on découpe : c'est un caillou
 * de **44 px**, dessiné trois fois sur l'anneau de débris (`weapon.head.sprite`)
 * et une fois par météore qui tombe. Le dessin y gagne — à 44 px on lit une
 * petite lune criblée, là où à 176 px sur fond blanc on ne lisait rien.
 *
 * **Carrée, et elle doit le rester** : `drawSpriteLeft` impose la hauteur et
 * déduit la largeur du rapport d'aspect, et la fiche fait retomber
 * `handle.length + largeur dessinée` sur `reach`. Un repli rectangulaire
 * déplacerait la pointe de l'arme le jour où le PNG manque — 472 × 472 pour
 * l'image, 16 × 16 ici, les deux à 1,0.
 */
export const LUNAR_LIT = deepFreeze({
  w: 16,
  h: 16,
  palette: PALETTE,
  rows: [
    '.....wwwwww.....',
    '...wwwwbbwwbw...',
    '..wwbbbbbbbbww..',
    '.wwbbbbbbbbwbww.',
    '.wbbbbbbbbbwbbw.',
    'wbbbbbbbbbbbbbbw',
    'wbbbbbbbbbbbbbbw',
    'wbbbbbbbbbbbbvbw',
    'wbvbbbbbwwbbbbbw',
    'wbvvbbbbbwwbbbbw',
    'wwbbbbbbbbbbbbbw',
    '.wbbvbbbwbbbbbw.',
    '.wwbbbbwwbbbbww.',
    '..wwbbbbbbbbww..',
    '...wwbbbbbbww...',
    '.....wwwwww.....',
  ],
});

/**
 * Icône de sélection : **le disque éteint et ses trois satellites**.
 *
 * Elle montrait un croissant, ce qui disait « lune » mais ne disait pas *ce
 * combattant-là* : le croissant était l'état intermédiaire d'un cycle de phases
 * qui n'existe plus. Ce qui le distingue maintenant à l'écran est sa
 * **silhouette** — un corps presque noir, un limbe qui brûle à l'ouest, et trois
 * cailloux en orbite. C'est exactement ce qu'on voit en jeu, à 16 px près.
 *
 * **Composée, pas réduite**, et le dire est la règle : une réduction de la
 * maquette rendrait le corps seul, sans l'anneau, qui est pourtant l'arme. Elle
 * est en revanche **échantillonnée sur la palette du personnage**, comme les
 * deux autres cartes — une icône coloriée à part finit par diverger de ce
 * qu'elle annonce, piège déjà payé sur la lance de l'Hoplite.
 *
 * **Elle doit remplir son cadre, et ça se voit à la carte de sélection.** La
 * vignette dimensionne le sprite sur la **hauteur de sa carte** (16), pas sur sa
 * matière : une composition qui n'occupe que dix pixels sur seize paraît deux
 * fois plus petite que celle du Soleil, dont les rayons touchent les quatre
 * bords. Première version mesurée à 57 % de son voisin ; les satellites ont été
 * poussés jusqu'au bord pour la rattraper.
 */
export const ICON_LUNAR = deepFreeze({
  w: 16,
  h: 16,
  palette: PALETTE,
  rows: [
    '.......bb.......',
    '......bwwb......',
    '......bwwb......',
    '.......bb.......',
    '.......wv.......',
    '.....wwvdvv.....',
    '....wvvKKKdv....',
    '....wvKKKKKv....',
    '....wKKKKKKv....',
    '....wKKKKKKv....',
    '....wvKKKKdv....',
    '.wwbwwvKKdvvbww.',
    'bwwb.wwwvvv.bwwb',
    '.bb..........bb.',
    '................',
    '................',
  ],
});
