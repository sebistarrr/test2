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
 * **Une langue de flamme** — repli texte du vrai PNG, et le combattant en porte
 * huit (`weapon.spokes`).
 *
 * Le rayon est servi par `assets/sprites/sun-ray.png`, **découpé dans la
 * maquette d'astre** : la balle en prend la sphère, l'arme prend une des
 * langues qui l'entourent (voir `weapon.head` dans la fiche pour la découpe, et
 * `pixelmaps.js` pour l'écart assumé à « aucun binaire »). Cette carte-ci ne se
 * dessine donc **que** si le PNG ne charge pas — mais elle n'est pas décorative
 * pour autant, et de deux façons :
 *
 *  • **`h` sert au calcul de la taille dessinée même avec l'override** :
 *    `drawSpriteLeft` prend la hauteur ici (13) et le rapport d'aspect sur
 *    l'image. En changer la valeur déplacerait la pointe de l'arme, donc
 *    `weapon.head.scale` avec ;
 *  • **`w` fixe le rapport du repli**, et il est calé sur celui du PNG
 *    (15 / 13 = 1,153846, contre 143 / 124 = 1,153226, soit **0,05 %** d'écart)
 *    : si le PNG manque, la couronne garde son envergure au lieu de se
 *    déformer. C'est ce qui a décidé de la taille de la carte — 15 × 13 est la
 *    première paire qui tombe aussi juste, là où l'ancienne (4 × 9) laissait
 *    2,5 % de dérive.
 *
 * Le dessin est une **réduction mécanique du PNG**, pas une copie à la main :
 * la flamme est la plus claire là où elle sort du corps et il ne lui reste que
 * son contour à l'extrémité, parce que c'est ce que fait la maquette — et le
 * talon est sans contour parce que la découpe part **à l'intérieur** de la
 * sphère, où la flamme n'a pas d'encre.
 */
export const SUN_RAY = deepFreeze({
  w: 15,
  h: 13,
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
   * **Large au talon (à gauche) et effilée vers la droite**, avec une pointe
   * qui file plus loin que le reste sur une seule rangée : c'est la langue
   * telle qu'elle est dessinée, pas une lame symétrique. L'irrégularité est
   * conservée exprès — c'est elle qui fait lire une flamme.
   */
  rows: [
    'od..KK.........',
    'yodddK.........',
    'wwyooodKK......',
    'wwooooodK......',
    '.oddoododK.....',
    '.odooyoddddKKKK',
    '.doooyyddddK...',
    'odoooyoddK.....',
    'oooooodddK.....',
    'ooddododdK.....',
    'oyyoodKKK......',
    '.wodddK........',
    '....KdKK.......',
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
