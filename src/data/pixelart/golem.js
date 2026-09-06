/**
 * Cartes de pixel-art du GOLEM.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 * Les clés de ce registre sont ce que lisent les fiches (`head.sprite`,
 * `projectiles.*.sprite`, `icon`).
 *
 * **Aucune de ces cartes n'est un relevé** : le Golem est inventé, il n'a pas
 * de vidéo de référence. Elles sont donc dessinées, pas transcrites — et c'est
 * exactement pour ça qu'elles sont **anguleuses et non arrondies** : une roche
 * se lit à ses arêtes droites et à ses facettes plates. Le piège du dépôt est
 * ici l'inverse de d'habitude — pas « une formule interpole ce qu'on ne lui a
 * pas demandé », mais « un contour adouci fait un galet, pas un bloc ».
 *
 * @module data/pixelart/golem
 */

import { deepFreeze } from '../freeze.js';

/**
 * **Le poing de pierre** — un bloc taillé, pas une main.
 *
 * Facettes plates et arêtes franches : une face claire en haut à gauche
 * (`l`), le corps de la pierre au milieu (`s`), une face d'ombre en bas à
 * droite (`d`), le tout cerné de noir comme les armes du reste du roster.
 *
 * 12 × 10 cellules, dessinées à `scale: 5.333333` → **64 px de large**. Avec
 * `handle.length: 36`, la pointe retombe à 36 + 64 = **100**, la portée de la
 * fiche (invariant : `handle.length` + largeur dessinée = `reach`).
 */
export const GOLEM_FIST = deepFreeze({
  w: 12,
  h: 10,
  palette: {
    K: '#1c1712', // contour, la même encre sombre que le reste du roster
    l: '#a89c88', // facette éclairée (haut-gauche)
    s: '#7d7264', // corps de la pierre
    d: '#4e4639', // facette d'ombre (bas-droite)
    v: '#5f5748', // veine, une fêlure qui traverse le bloc
  },
  rows: [
    '..KKKKKKKK..',
    '.KllllllssK.',
    'KlllllvsssdK',
    'KllllvsssddK',
    'KlllvssssddK',
    'KllvsssssddK',
    'KlvssssssddK',
    'KvsssssssddK',
    '.KsssssdddK.',
    '..KKKKKKKK..',
  ],
});

/**
 * **Éclat de roche** — le projectile du pouvoir spécial.
 *
 * Un tesson à quatre arêtes, même palette que le poing pour qu'on lise « c'est
 * un morceau de lui qui part ». Volontairement petit (7 × 7) : c'est un
 * fragment, pas un rocher.
 */
export const GOLEM_SHARD = deepFreeze({
  w: 7,
  h: 7,
  palette: {
    K: '#1c1712',
    l: '#a89c88',
    s: '#7d7264',
    d: '#4e4639',
  },
  rows: [
    '..KKK..',
    '.KllsK.',
    'KllssdK',
    'KlsssdK',
    'KlssddK',
    '.KsddK.',
    '..KKK..',
  ],
});

/**
 * Icône de sélection. Elle **s'échantillonne sur le profil de l'arme** plutôt
 * que d'être redessinée à la main : même palette, mêmes facettes, sinon
 * l'icône et l'arme divergent (piège documenté sur le Lancier).
 */
export const ICON_GOLEM = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    K: '#1c1712',
    l: '#a89c88',
    s: '#7d7264',
    d: '#4e4639',
  },
  rows: [
    '................',
    '....KKKKKKKK....',
    '...KllllllssK...',
    '..KlllllsssdK...',
    '..KllllsssddK...',
    '.KlllssssssddK..',
    '.KllssssssdddK..',
    '.KlsssssssdddK..',
    '.KlssssssddddK..',
    '.KsssssssdddK...',
    '.KssssssdddK....',
    '..KsssdddddK....',
    '..KKsddddKK.....',
    '....KKKKK.......',
    '................',
    '................',
  ],
});
