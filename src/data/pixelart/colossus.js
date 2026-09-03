/**
 * Cartes de pixel-art du Colosse.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 *
 * @module data/pixelart/colossus
 */

import { deepFreeze } from '../freeze.js';


/* Pavois — composé, pas transcrit : il n'existe pas de maquette pour lui.

 * **Vu du dessus**, comme toutes les armes du jeu : l'axe de l'arme est l'axe
 * des x, donc le pavois est étroit en x (son épaisseur : planche de bois au dos,
 * plaque de fer devant) et haut en y (sa hauteur). L'umbo de bronze **dépasse
 * vers la droite**, côté adversaire — c'est lui qui touche en premier. */
export const COLOSSUS_SHIELD = deepFreeze({
  w: 15,
  h: 34,
  palette: {
    K: '#141118',
    b: '#5a4632',
    i: '#39404e',
    I: '#5b6473',
    L: '#8b96a7',
    r: '#b9c2d0',
    o: '#a8762f',
    O: '#d9a441',
  },
  rows: [
    '.KKKKKKKKKK....',
    'KKbbiiIILIKK...',
    'KbbbiiILIIIK...',
    'KbbbiiILIIIK...',
    'KbbbiiILIIIKK..',
    'bbbbiiLrIIIIK..',
    'bbbbiiLIIIIIK..',
    'bbbbiiLIIIIIK..',
    'bbbbiiLIIIIIK..',
    'bbbbiiLIIIIIK..',
    'bbbbiiLIIIIIK..',
    'bbbbiiLrIoooKK.',
    'bbbbiiLIIooooKK',
    'bbbbiiLIIoooooK',
    'bbbbiiLIIoooooK',
    'bbbbiiLIIOOOOOo',
    'bbbbiiLIIOOOOOo',
    'bbbbiiLIIOOOOOo',
    'bbbbiiLIIOOOOOo',
    'bbbbiiLIIoooooK',
    'bbbbiiLIIoooooK',
    'bbbbiiLIIooooKK',
    'bbbbiiLrIoooKK.',
    'bbbbiiLIIIIIK..',
    'bbbbiiLIIIIIK..',
    'bbbbiiLIIIIIK..',
    'bbbbiiLIIIIIK..',
    'bbbbiiLIIIIIK..',
    'bbbbiiLrIIIIK..',
    'KbbbiiILIIIKK..',
    'KbbbiiILIIIK...',
    'KbbbiiILIIIK...',
    'KKbbiiIILIKK...',
    '.KKKKKKKKKK....',
  ],
});

/* Icône du titre — **échantillonnée sur `COLOSSUS_SHIELD`**, jamais redessinée.

 * Simple rééchantillonnage au plus proche voisin, 15 x 34 vers 16 x 16 : le
 * pavois y est tassé, mais il garde ses trois bandes — bois, fer, umbo de
 * bronze — et se lit. Une première version le *miroitait* pour le montrer de
 * face : ça n'en faisait pas un bouclier vu de face, juste un papillon. */
export const ICON_PAVISE = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    K: '#141118',
    b: '#5a4632',
    i: '#39404e',
    I: '#5b6473',
    L: '#8b96a7',
    o: '#a8762f',
    O: '#d9a441',
  },
  rows: [
    '..KKKKKKKKKK....',
    'KKbbbiiILIIIK...',
    'KKbbbiiILIIIKK..',
    'bbbbbiiLIIIIIK..',
    'bbbbbiiLIIIIIK..',
    'bbbbbiiLIIIIIK..',
    'bbbbbiiLIIooooKK',
    'bbbbbiiLIIoooooK',
    'bbbbbiiLIIOOOOOo',
    'bbbbbiiLIIoooooK',
    'bbbbbiiLIIooooKK',
    'bbbbbiiLIIIIIK..',
    'bbbbbiiLIIIIIK..',
    'bbbbbiiLIIIIIK..',
    'KKbbbiiILIIIKK..',
    'KKbbbiiILIIIK...',
  ],
});
