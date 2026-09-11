/**
 * Cartes de pixel-art du SOLEIL.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 *
 * **Aucune de ces cartes n'est un relevé vidéo** : le Soleil est inventé, comme
 * le Golem et le Mannequin. Mais il a désormais une **maquette fournie**, et le
 * piège du dépôt dit quoi en faire : *transcrire quand c'est possible, composer
 * sinon, et le dire en commentaire*. Les deux cas sont ici, et le choix est
 * **mesuré**, pas supposé :
 *
 *  • `SUN_RAY` est une **réduction mécanique** du PNG (Lanczos vers la taille
 *    de la carte, puis plus proche voisin dans la palette). Ce n'est ni une
 *    formule ni une copie à la main : la silhouette réelle survit, y compris ce
 *    qu'elle a d'irrégulier ;
 *  • `SUN_CORE` est **composé**, parce que la même réduction a été essayée et
 *    **échoue** : à 16 px, la sphère de la maquette est un tourbillon de feu,
 *    pas un dégradé radial — la réduction rend du bruit rouge sans lecture
 *    d'astre. La leçon est dans `docs/PIEGES.md` ; la version composée dit la
 *    bonne chose (une sphère incandescente) et c'est tout ce qu'un repli doit.
 *
 * @module data/pixelart/sun
 */

import { deepFreeze } from '../freeze.js';

/**
 * **Un huitième de couronne** — repli texte du vrai PNG, et le combattant en
 * porte huit (`weapon.spokes`), donc les huit copies **pavent l'anneau**.
 *
 * Ce n'est plus *une* langue : c'est le **secteur de 45°** de la couronne de la
 * maquette, celui de 225° à 270°, qui en contient deux (une longue, une courte)
 * — voir `weapon.head` dans la fiche pour la découpe et pourquoi elle tombe là,
 * et `pixelmaps.js` pour l'écart assumé à « aucun binaire ». Cette carte-ci ne
 * se dessine donc **que** si le PNG ne charge pas — mais elle n'est pas
 * décorative pour autant, et de deux façons :
 *
 *  • **`h` sert au calcul de la taille dessinée même avec l'override** :
 *    `drawSpriteLeft` prend la hauteur ici (17) et le rapport d'aspect sur
 *    l'image. En changer la valeur déplacerait la pointe de l'arme, donc
 *    `weapon.head.scale` avec ;
 *  • **`w` fixe le rapport du repli**, et il est calé sur celui du PNG
 *    (15 / 17 = 0,882353, contre 112 / 127 = 0,881890, soit **0,05 %** d'écart)
 *    : si le PNG manque, la couronne garde son envergure au lieu de se
 *    déformer. C'est ce qui décide de la taille de la carte — on cherche la
 *    plus petite paire d'entiers qui tombe à moins de 0,1 % du rapport du PNG.
 *
 * Le dessin est une **réduction mécanique du PNG**, pas une copie à la main :
 * on y lit l'éventail, sa longue langue vers la droite et sa courte en bas,
 * avec le bord intérieur concave qui vient épouser la bille. Le talon est sans
 * contour parce que la découpe part **à l'intérieur** de la sphère, où la
 * flamme n'a pas d'encre.
 */
export const SUN_RAY = deepFreeze({
  w: 15,
  h: 17,
  /** Les cinq teintes de `look.palette`, relevées sur la maquette : c'est ce
   *  qui garantit que le repli, le sprite et le reste du personnage ne
   *  divergent pas. */
  palette: {
    K: '#5d0100', // contour
    d: '#c00803', // ombre
    o: '#f9993c', // corps
    y: '#fbcf55', // clair
    w: '#fdf17f', // cœur
  },
  /**
   * **Un éventail, pas une lame** : le bord gauche est l'arc intérieur qui se
   * pose sur la bille, la longue langue file vers la droite en haut, la courte
   * redescend en bas. L'asymétrie est conservée exprès — c'est elle qui fait
   * lire une couronne quand les huit copies se referment.
   */
  rows: [
    'dK.............',
    'oddKKKdKK......',
    'oodddddddKKKKKK',
    '.yooooodddddKK.',
    '.yyyoddKKdKK...',
    '.wyodK.........',
    '.oodK..........',
    '.ddK...........',
    '.KK............',
    '.K.............',
    '.KK............',
    '.dK............',
    '.odK...........',
    '.yodK..........',
    '.ooddK.........',
    'ddKK...........',
    'K..............',
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
 * déduit la largeur du rapport d'aspect. Le PNG est carré lui aussi (344 × 344,
 * soit deux fois le rayon de sphère relevé) ; un repli rectangulaire donnerait
 * un astre ovale le jour où le PNG manque, sans que rien ne le signale.
 *
 * **Composé, et pas réduit du PNG comme la langue l'est** — la réduction a été
 * essayée : à 16 px elle rend du bruit rouge, parce que la sphère de la
 * maquette est un **tourbillon** et non un dégradé radial. Ce repli-ci est donc
 * un dégradé radial franc dans les teintes relevées : plus de pointes autour
 * (elles sont l'arme depuis que la balle ne contient que la sphère), juste un
 * astre plein qui remplit son cadre.
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
    '.....KKKKKK.....',
    '...KKKddddKKK...',
    '..KKdddoodddKK..',
    '.KKddooooooddKK.',
    '.KddooyyyyooddK.',
    'KKdooyyyyyyoodKK',
    'KddoyywwwwyyoddK',
    'KdooyywwwwyyoodK',
    'KdooyywwwwyyoodK',
    'KddoyywwwwyyoddK',
    'KKdooyyyyyyoodKK',
    '.KddooyyyyooddK.',
    '.KKddooooooddKK.',
    '..KKdddoodddKK..',
    '...KKKddddKKK...',
    '.....KKKKKK.....',
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
  /** Les teintes de `look.palette`, comme les deux autres cartes : l'icône
   *  portait encore l'échantillonnage précédent (`#6f1e12`…) et dérivait donc
   *  du personnage depuis que sa palette a été relevée sur la maquette. */
  palette: {
    K: '#5d0100',
    o: '#f9993c',
    y: '#fbcf55',
    w: '#fdf17f',
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
