/**
 * Cartes de pixel-art du SOLEIL.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 *
 * **Aucune de ces cartes n'est un relevé** : le Soleil est inventé, comme le
 * Golem et le Mannequin — il n'a pas de vidéo de référence. Elles sont donc
 * dessinées, et le piège du dépôt s'applique en plein : *générer un sprite par
 * une formule au lieu de transcrire une maquette interpole ce qu'on ne lui a
 * pas demandé*. Ici il n'y a **pas** de maquette à transcrire, donc la forme
 * est composée — et c'est dit, comme le veut la règle.
 *
 * @module data/pixelart/sun
 */

import { deepFreeze } from '../freeze.js';

/**
 * **Un rayon** — repli texte du vrai PNG, et le combattant en porte huit
 * (`weapon.spokes`).
 *
 * Le rayon est servi par `assets/sprites/sun-ray.png`, une maquette de flamme
 * fournie (voir `manifest.json` et l'écart assumé à « aucun binaire » décrit
 * dans `pixelmaps.js`). Cette carte-ci ne se dessine donc **que** si le PNG ne
 * charge pas — mais elle n'est pas décorative pour autant, et de deux façons :
 *
 *  • **`h` sert au calcul de la taille dessinée même avec l'override** :
 *    `drawSpriteLeft` prend la hauteur ici (9) et le rapport d'aspect sur
 *    l'image. En changer la valeur déplacerait la pointe de l'arme, donc
 *    `weapon.head.scale` avec ;
 *  • **`w` fixe le rapport du repli**, et il est calé sur celui du PNG
 *    (22 / 9 = 2,444, contre 1171 / 479 = 2,4447) : si le PNG manque, la
 *    couronne garde exactement la même envergure au lieu de se rétracter.
 *
 * Le dessin est volontairement grossier — c'est un repli, pas une
 * transcription. Il dit la bonne chose (une flamme élancée qui se dissipe en
 * pointe) sans prétendre reproduire la maquette : la reproduire à la main
 * serait exactement le geste que le dépôt s'interdit.
 *
 * Le dégradé va du cœur vers le bord **et** du talon vers la pointe, parce que
 * c'est ce que fait la maquette : la flamme est la plus claire là où elle sort
 * du corps, et il ne lui reste que son contour à l'extrémité.
 */
export const SUN_RAY = deepFreeze({
  w: 22,
  h: 9,
  /** Les cinq teintes sont **relevées sur le PNG**, par bandes de luminance :
   *  c'est ce qui garantit que le repli et la maquette ne divergent pas — et
   *  ce sont les mêmes cinq que le bloc `look` de la fiche. */
  palette: {
    K: '#6f1e12', // contour
    d: '#b43f22', // ombre
    o: '#de7f3a', // corps
    y: '#ebbd5b', // clair
    w: '#fcf697', // cœur
  },
  rows: [
    'KKK...................',
    'dooooKKK..............',
    'doooyyyooodKKK........',
    'doyyywwwyyyoooddKKK...',
    'dywwwwwwwwyyyoooddKKKK',
    'doyyywwwyyyoooddKKK...',
    'doooyyyooodKKK........',
    'dooooKKK..............',
    'KKK...................',
  ],
});

/**
 * **Le corps du Soleil** — repli texte du vrai PNG, et **le premier corps du
 * dépôt qui soit un sprite**.
 *
 * Les huit autres combattants sont des cercles vectoriels (couleur, contour,
 * rayon) ; `assets/sprites/README.md` décrivait depuis toujours comment servir
 * un corps en sprite sans que personne l'ait fait. C'est `look.sprite` qui
 * l'ouvre, lu par `Fighter.drawSpriteBody()`.
 *
 * **Carré, et il doit le rester** : `drawSpriteCentered` impose la hauteur et
 * déduit la largeur du rapport d'aspect. Un repli rectangulaire donnerait un
 * astre ovale le jour où le PNG manque, sans que rien ne le signale.
 *
 * Grossier par construction — c'est un repli, pas une transcription. Il dit la
 * bonne chose (un disque incandescent hérissé de pointes) dans les teintes
 * relevées sur la maquette.
 */
export const SUN_CORE = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    K: '#5d0100', // contour
    d: '#c00803', // ombre, le rouge profond du dessin
    o: '#f9993c', // corps
    y: '#fbcf55', // clair
    w: '#fdf17f', // cœur
  },
  rows: [
    '.......KK.......',
    '..K....dd....K..',
    '...Kd.KooK.dK...',
    '....KdoyyodK....',
    '..KdoyywwyyodK..',
    '.KdoywwwwwwyodK.',
    '.KdoywwwwwwyodK.',
    'KddoywwwwwwyoddK',
    'KddoywwwwwwyoddK',
    '.KdoywwwwwwyodK.',
    '.KdoywwwwwwyodK.',
    '..KdoyywwyyodK..',
    '....KdoyyodK....',
    '...Kd.KooK.dK...',
    '..K....dd....K..',
    '.......KK.......',
  ],
});

/**
 * Icône de sélection : le disque et ses huit rayons, **dans les positions
 * exactes du personnage** — un rayon tous les 45°, quatre dans les axes et
 * quatre dans les diagonales.
 *
 * Elle s'échantillonne sur la palette du rayon plutôt que d'être coloriée à
 * part : une icône redessinée à la main finit par diverger de son arme, piège
 * déjà payé sur le Lancier.
 */
export const ICON_SUN = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    K: '#6f1e12',
    o: '#de7f3a',
    y: '#ebbd5b',
    w: '#fcf697',
  },
  rows: [
    '.......KK.......',
    '.K.....oo.....K.',
    '..o....yy....o..',
    '...o...yy...o...',
    '....o.yyyy.o....',
    '.....oyyyyo.....',
    '....oyywwyyo....',
    'KoyyywwwwwwyyyoK',
    'KoyyywwwwwwyyyoK',
    '....oyywwyyo....',
    '.....oyyyyo.....',
    '....o.yyyy.o....',
    '...o...yy...o...',
    '..o....yy....o..',
    '.K.....oo.....K.',
    '.......KK.......',
  ],
});
