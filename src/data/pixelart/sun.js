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
 * **Un rayon**, et le combattant en porte huit (`weapon.spokes`).
 *
 * L'axe d'une arme est **l'horizontale** dans ce moteur, la pointe vers la
 * droite : le rayon est donc large au talon (contre le corps) et se referme en
 * pointe vers l'extérieur. C'est l'inverse du sabre du Ronin, fuselé mais de
 * largeur à peu près constante — un rayon doit se **dissiper**, sinon il se lit
 * comme une lame.
 *
 * Le dégradé va du cœur vers le bord et non du talon vers la pointe : blanc
 * incandescent au centre, jaune, orange, encre brûlée en contour. Un rayon qui
 * s'assombrirait vers la pointe ressemblerait à une braise qui meurt ; celui-ci
 * doit rester chaud jusqu'au bout, et ne perdre que son épaisseur.
 *
 * **13 × 9, et les deux chiffres comptent** : la largeur dessinée vaut
 * `w × head.scale` = 13 × 6 = 78, qui s'ajoute au talon de 82 pour retomber
 * exactement sur `reach: 160`. Changer `w` déplacerait la pointe sans rien dire
 * — c'est le piège documenté sur la lance de l'Hoplite.
 */
export const SUN_RAY = deepFreeze({
  w: 13,
  h: 9,
  palette: {
    K: '#7c2d12', // encre brûlée : le contour, comme partout dans le roster
    o: '#f97316', // orange de bord
    y: '#fbbf24', // jaune
    w: '#fff7cc', // cœur incandescent
  },
  rows: [
    'KK...........',
    'oooKK........',
    'ooooooKK.....',
    'yyyyyooooKK..',
    'wwwwwwyyyyooK',
    'yyyyyooooKK..',
    'ooooooKK.....',
    'oooKK........',
    'KK...........',
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
    K: '#7c2d12',
    o: '#f97316',
    y: '#fbbf24',
    w: '#fff7cc',
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
