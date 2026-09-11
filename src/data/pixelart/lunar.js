/**
 * Cartes de pixel-art de LUNE.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 *
 * **Deux corps, pas un** — et c'est toute la particularité du personnage. LUNE
 * est le premier combattant du dépôt dont le corps est *composé* : la face
 * éclairée et la face dans l'ombre sont deux dessins, que son module fond l'un
 * dans l'autre selon un terminateur. Chacun a donc sa carte de repli.
 *
 * Les deux sont des **réductions mécaniques** des PNG (Lanczos vers 16 × 16
 * puis plus proche voisin dans la palette), comme la langue du Soleil — et
 * contrairement à sa sphère, elles passent : les deux maquettes de lune sont
 * organisées **en anneaux concentriques**, ce qui survit à une réduction, là où
 * le tourbillon du Soleil rendait du bruit. C'est la même règle que le dépôt
 * répète : *ça s'essaie et se regarde, ça ne se suppose pas.*
 *
 * @module data/pixelart/lunar
 */

import { deepFreeze } from '../freeze.js';

/** Les cinq teintes de `look.palette`, relevées sur les deux maquettes par
 *  bandes de luminance. Les trois sombres viennent de la face d'ombre, les deux
 *  claires de la face éclairée : c'est le seul combattant dont la palette est
 *  échantillonnée sur **deux** images, parce que son corps l'est aussi. */
const PALETTE = {
  K: '#0d0a1d', // encre, le noir bleuté de l'éclipse
  d: '#1e1837', // ombre
  v: '#604f9c', // violet — la signature, personne d'autre ne l'a
  b: '#b5d5e4', // corps, le gris-bleu des cratères éclairés
  w: '#e7fdff', // cœur, le blanc froid du limbe
};

/**
 * **La face dans l'ombre** — repli de `assets/sprites/lunar-dark.png`, et le
 * sprite de corps **par défaut** (`look.sprite`).
 *
 * C'est elle qui est déclarée comme corps, et non la face claire, pour une
 * raison de **mode de panne** : si le module ne dessinait plus rien par-dessus,
 * on verrait un disque sombre parfaitement lisible sur l'arène blanche plutôt
 * qu'une lune pâle à moitié invisible. Relevé sur les maquettes : la face
 * d'ombre tient un contraste médian de **6,5** contre l'arène, la face claire
 * **1,54**, avec 48 % de ses pixels sous le seuil de visibilité.
 *
 * On y lit l'anneau de lumière rasante qui cerne le disque éteint — le liseré
 * violet, qui reste visible à toutes les phases et signe le personnage.
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
    'bvvwbddddKddKvvb',
    'bvbwvKddddKKKdvb',
    'bvbwvKdddvddKdvb',
    'bvbwvKKddvvdKdvb',
    'bvvwvKKKdvddKdvb',
    'bvvbwdKddddKdvvb',
    '.bvvbbdKKKKdvvb.',
    '.bbvvbbvvvvbvbb.',
    '..bbvvbbbbvvbw..',
    '...wbvvvvvvbb...',
    '.....bbbbbb.....',
  ],
});

/**
 * **La face éclairée** — repli de `assets/sprites/lunar-lit.png`.
 *
 * Elle n'est jamais le corps : le module la peint **par-dessus** la face
 * d'ombre, découpée au terminateur. À illumination 1 elle la recouvre
 * entièrement, et c'est la pleine lune.
 *
 * **Carrée, et elle doit le rester**, comme la face d'ombre : les deux sont
 * dimensionnées sur le même diamètre (`radius × 2`), et un rapport différent
 * entre les deux ferait glisser le terminateur hors du disque.
 */
export const LUNAR_LIT = deepFreeze({
  w: 16,
  h: 16,
  palette: PALETTE,
  rows: [
    '.....wwwwww.....',
    '...wwwwbbwwww...',
    '..wwbbbbbbbbww..',
    '.wwbbbbbbbbwbww.',
    '.wbbbbbbbvbwbbw.',
    'wbbbbbbbbbbbbbbw',
    'wbbbbbbbbbbbbbbw',
    'wbvbbbbbbbbbbvbw',
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
 * Icône de sélection : le **croissant**, pas le disque.
 *
 * C'est le seul état qui dise « lune » sans ambiguïté à 16 px — un disque plein
 * pâle se confondrait avec n'importe quelle bille, et un disque éteint avec le
 * Shinobi. Elle est dessinée dans la palette du personnage, comme les deux
 * autres cartes : une icône coloriée à part finit par diverger de ce qu'elle
 * annonce, piège déjà payé sur la lance de l'Hoplite.
 */
export const ICON_LUNAR = deepFreeze({
  w: 16,
  h: 16,
  palette: PALETTE,
  rows: [
    '.....KKKKKK.....',
    '...KKvvvvddKK...',
    '..Kvvwwvddddd...',
    '.Kvwwwwvddddd...',
    '.Kvwwwvdddd.....',
    'Kvwwwvddd.......',
    'Kvwwwvdd........',
    'Kvwwwvd.........',
    'Kvwwwvd.........',
    'Kvwwwvdd........',
    'Kvwwwvddd.......',
    '.Kvwwwvdddd.....',
    '.Kvwwwwvddddd...',
    '..Kvvwwvddddd...',
    '...KKvvvvddKK...',
    '.....KKKKKK.....',
  ],
});
