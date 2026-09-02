/**
 * Cartes de pixel-art du PLANTE.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 * Les clés de ce registre sont ce que lisent les fiches (`head.sprite`,
 * `projectiles.*.sprite`, `icon`) et `assets/sprites/manifest.json`.
 *
 * @module data/pixelart/plant
 */

import { deepFreeze } from '../freeze.js';

/* ------------------------------------------------------------------
 * PLANTE — bulbe semé dans l'arène, fleur projectile, icône du titre
 * Relevé : vidéos PLANT vs FIRE / ICE vs PLANT / DARK vs PLANT.
 * (La liane, elle, est dessinée en courbe par game/abilities/plant.js.)
 * ------------------------------------------------------------------ */
/**
 * PLANTE — bulbe semé : une **cosse verte bombée** au gros contour noir,
 * surmontée d'un pédoncule noir et de deux feuilles sombres, avec deux petites
 * pattes noires en dessous. Relevé : ~29 × 34 px dans l'arène.
 */
export const PLANT_BULB = deepFreeze({
  w: 11,
  h: 15,
  palette: {
    K: '#0a0a0a', // contour noir franc (comme la vidéo)
    v: '#2e7a44', // feuilles, plus sombres que la cosse
    g: '#5aa832', // cosse
    l: '#79c94f', // éclairci
    w: '#a8de7c', // reflet en haut à gauche
    s: '#3b7d1e', // ombre à droite
  },
  rows: [
    '..K.....K..',
    '..KvK.KvK..',
    '..KvvKvvK..',
    '...KvvvK...',
    '....KKK....',
    '...KKKKK...',
    '..KwwlllK..',
    '.KwwlllggK.',
    'KwlllgggggK',
    'KwlllgggssK',
    'KlllgggsssK',
    '.KllgggssK.',
    '..KKgggKK..',
    '...KKKKK...',
    '..KK...KK..',
  ],
});

/**
 * PLANTE — fleur projectile : corolle rose à **contour noir épais** et **cœur
 * doré**, ~40 px, tirée par les bulbes mûrs et emportée par la tempête.
 */
export const FLOWER = deepFreeze({
  w: 11,
  h: 11,
  palette: {
    K: '#100309', // contour noir
    p: '#e878b0', // pétale (pipette : rgb(232,120,176))
    P: '#c9518f', // pétale à l'ombre
    y: '#f0b53c', // cœur doré
    w: '#fbe9b8', // point de lumière au cœur
  },
  rows: [
    '...KK.KK...',
    '..KppKppK..',
    '.KpppppppK.',
    'KpppPPPpppK',
    'KppPPywPppK',
    'KppPyyyPppK',
    'KppPPyyPppK',
    'KpppPPPpppK',
    '.KpppppppK.',
    '..KppKppK..',
    '...KK.KK...',
  ],
});

export const ICON_LEAF = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#14532d', l: '#4ade80', g: '#22c55e' },
  rows: [
    '.........KKK....',
    '.......KKlllK...',
    '......KlllllK...',
    '.....KllllllK...',
    '..KKKllllllKK...',
    '.KlllllllKK.....',
    'KlllllKK..g.....',
    '.KlllKK...g.....',
    '..KKK.....g.....',
    '..........g.....',
    '.......KKgggKK..',
    '......KgggggggK.',
    '......KgggggggK.',
    '.......KKgggKK..',
    '.........KKK....',
    '................',
  ],
});
