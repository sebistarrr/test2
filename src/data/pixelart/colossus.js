/**
 * Cartes de pixel-art du Colosse.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 *
 * **Les deux cartes de ce fichier sont réduites du même PNG**,
 * `assets/sprites/colossus-pavise.png` — celui que `manifest.json` fait passer
 * devant `colossusShield`. Aucune n'est dessinée à la main : c'est ce qui
 * interdit à l'icône de diverger de l'arme qu'elle annonce, panne déjà payée
 * deux fois sur le Lancier.
 *
 * @module data/pixelart/colossus
 */

import { deepFreeze } from '../freeze.js';


/* Pavois — **repli** du PNG, et référence de géométrie.

 * `head.scale` multiplie sa hauteur (34 x 3 = 102 px dessinés) et son ratio
 * 15/34 décide de la largeur (45 px) : `handle.length` 41 + 45 = 86, la portée.
 * Un PNG d'override doit donc garder ce ratio, sinon la pointe ment sur la
 * hitbox.
 *
 * **Vu de dessus** : le moteur pose l'image avec sa largeur le long de l'axe de
 * l'arme et sa hauteur en travers, donc ce pavois dessiné debout apparaît en
 * travers de la trajectoire, face à l'adversaire — tenu comme un mur. Il est
 * symétrique haut/bas pour la même raison : en vue de dessus il n'y a pas de
 * haut, et une pointe d'un seul côté désignerait une direction au hasard. */
export const COLOSSUS_SHIELD = deepFreeze({
  w: 15,
  h: 34,
  palette: {
    K: '#141118',
    d: '#252b36',
    e: '#39404e',
    f: '#5b6473',
    g: '#8b96a7',
    b: '#5a4632',
    o: '#8a5f26',
    O: '#a8762f',
    P: '#d9a441',
  },
  rows: [
    '....KKdefeK....',
    '...KKdeefgfd...',
    '..Kdddeeefgfd..',
    '..Kdeeeefffgf..',
    '.KKdeeeefffgfd.',
    '.KKddeeeffffge.',
    '.KKdddeeefffff.',
    '.Kddeeeeffffff.',
    'ddKdeeeeffffffd',
    'Kdddeeeeffffffe',
    'Kddeeeeefffffge',
    'KKdeeeeeffffffe',
    'KKdddeeebbbfffe',
    'KKdddebbooobffe',
    'KKddebboooOOofe',
    'KKddbbbooOOOOfe',
    'KKddbbbooPOOOoe',
    'KKddbbbobOOOOoe',
    'KKddfbboooOOofe',
    'KKddefbbooooofe',
    'KKdddeobooooffe',
    'KKdeeeebbfffffe',
    'Kddeeeeeeffffge',
    'Kdddeedeeffeffe',
    'Kdddeeeeefffefe',
    'KKddeeeeefffffd',
    '.Kddeeeeffffff.',
    '.KKdeeeeeffffe.',
    '.KKddefeeffffe.',
    '.KKdeeeefffffd.',
    '..Kdddeeefffe..',
    '..KKddeefffed..',
    '...KKdeeffed...',
    '....KKddedK....',
  ],
});

/* Icône du titre — **réduite du même PNG** que le pavois, jamais redessinée.

 * Elle ne peut donc pas dériver de l'arme : toute retouche du PNG se propage
 * aux deux par le même script.
 *
 * Carrée 16 x 16 comme les cinq autres icônes, parce que `scene.js` les pose
 * avec `drawSpriteCentered(..., icon)` en supposant la largeur égale à la
 * hauteur. Le pavois y est donc **centré** (9 x 16) plutôt qu'étiré au
 * carré : étiré il ne se lisait plus, et à son ratio exact (7 x 16) il ne
 * restait qu'une barre grise et un point de bronze. */
export const ICON_PAVISE = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    K: '#141118',
    d: '#252b36',
    e: '#39404e',
    f: '#5b6473',
    g: '#8b96a7',
    b: '#5a4632',
    o: '#8a5f26',
    O: '#a8762f',
  },
  rows: [
    '.....Kdefe......',
    '....Kdeefge.....',
    '....Kdeefff.....',
    '...Kddeefffe....',
    '...ddeeeffff....',
    '...Kdeeeffff....',
    '...Kddbbooff....',
    '...KdeboOOOf....',
    '...KdebboOOf....',
    '...Kdebbooff....',
    '...Kdeeeffff....',
    '...Kdeeefffe....',
    '...Kddeefffe....',
    '....Kdeefff.....',
    '....Kddeffe.....',
    '.....Kdefd......',
  ],
});
