/**
 * Cartes de pixel-art du MANNEQUIN.
 *
 * **Une seule carte, et c'est une icône** : ce combattant n'a pas d'arme, donc
 * pas de sprite d'arme, et pas de projectile. C'est le premier du dépôt dans ce
 * cas — `ui/select.js` prévoyait déjà le repli (`head.sprite ?? projectile ??
 * icon`), il n'avait simplement jamais servi.
 *
 * @module data/pixelart/dummy
 */

import { deepFreeze } from '../freeze.js';

/**
 * Icône de sélection : une **cible**, pas un personnage. Anneaux concentriques
 * sombres sur fond blanc — le seul dessin qui dise « frappe ici » sans montrer
 * une arme.
 *
 * Le contour est noir et épais pour la même raison que celui de la bille :
 * **l'arène et la carte de sélection sont claires**, donc un disque blanc sans
 * cerne n'y existe pas (la leçon déjà payée sur les jaunes pâles du Lancier et
 * la poudre du Pistolero, prise ici à l'extrême).
 */
export const ICON_DUMMY = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    K: '#1a1a1a', // contour et anneaux
    w: '#ffffff', // le corps, blanc pur
    g: '#c8c8cc', // gris de report, entre deux anneaux
  },
  rows: [
    '.....KKKKKK.....',
    '...KKwwwwwwKK...',
    '..KwwwwwwwwwwK..',
    '.KwwwwgggggwwwK.',
    '.KwwwgKKKKKgwwK.',
    'KwwwgKKwwwKKgwwK',
    'KwwgKKwwwwwKKgwK',
    'KwwgKwwwKwwwKgwK',
    'KwwgKwwKKKwwKgwK',
    'KwwgKwwwKwwwKgwK',
    'KwwgKKwwwwwKKgwK',
    'KwwwgKKwwwKKgwwK',
    '.KwwwgKKKKKgwwK.',
    '.KwwwwgggggwwwK.',
    '..KwwwwwwwwwwK..',
    '...KKKwwwwKKK...',
  ],
});
