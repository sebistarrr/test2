/**
 * Cartes de pixel-art de NEON SHADOW.
 *
 * L'arme est servie par un **vrai PNG** (`assets/sprites/neon-dagger.png`,
 * déclaré dans `manifest.json`) découpé dans la maquette fournie : même montage
 * que la lame du Ronin, le shuriken du Shinobi et l'amas du Golem. Les cartes
 * ci-dessous sont donc le **repli** — et, pour la dague, la carte dont `map.h`
 * sert au calcul de la taille dessinée même sous override (voir sa fiche).
 *
 * @module data/pixelart/neon
 */

import { deepFreeze } from '../freeze.js';

/**
 * **La dague du vide** — repli texte du PNG.
 *
 * Une lame effilée pointe à droite, garde marquée, pommeau à gauche : c'est
 * l'orientation que le moteur attend (l'axe d'une arme est l'horizontale, et
 * `drawSpriteLeft` blitte depuis `handle.length`).
 *
 * 14 × 8, hauteur choisie pour que l'échelle du PNG tombe juste — voir
 * `weapon.head.scale` dans la fiche.
 */
export const NEON_DAGGER = deepFreeze({
  w: 14,
  h: 8,
  palette: {
    K: '#0a0410', // contour, presque noir
    l: '#f0abfc', // arête néon rose, le liseré lumineux de la maquette
    v: '#a855f7', // violet néon
    b: '#2a1740', // corps de lame, obsidienne violacée
    g: '#4c1d95', // garde
  },
  rows: [
    '..............',
    'K.KgvgK.......',
    'KvKgbgKlllll..',
    'KvvgbbgKblllll',
    'KvvgbbgKblllll',
    'KvKgbgKlllll..',
    'K.KgvgK.......',
    '..............',
  ],
});

/**
 * Icône de sélection : la dague, son liseré néon et un fragment de chaîne —
 * les trois choses qui distinguent le personnage sur la carte.
 */
export const ICON_NEON = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    K: '#0a0410',
    l: '#f0abfc',
    v: '#a855f7',
    b: '#2a1740',
    g: '#4c1d95',
  },
  rows: [
    '.............vv.',
    '............vggv',
    '...........vgbgv',
    '..........vgbbg.',
    '.........Kgbbg..',
    '........Klbbg...',
    '.......Kllbbg...',
    '......Klllbbg...',
    '.....Klllbbg....',
    '....Klllbbg.....',
    '...Klllbbg......',
    '..Klllbbg.......',
    '..Kllbg.........',
    '.Klbg...........',
    '.Kbg............',
    'K...............',
  ],
});
