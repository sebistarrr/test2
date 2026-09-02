/**
 * Cartes de pixel-art du GLACE.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 * Les clés de ce registre sont ce que lisent les fiches (`head.sprite`,
 * `projectiles.*.sprite`, `icon`) et `assets/sprites/manifest.json`.
 *
 * @module data/pixelart/ice
 */

import { deepFreeze } from '../freeze.js';

/* ------------------------------------------------------------------
 * GLACE — tête de hache double en cristal
 * Relevé vidéo : ~42 px de large / 60 px de haut au bout d'un long manche.
 * ------------------------------------------------------------------ */
export const ICE_AXE_HEAD = deepFreeze({
  w: 12,
  h: 17,
  palette: {
    K: '#0d0d12',
    I: '#d8f2ff', // cristal clair
    b: '#67b6e0', // cristal profond
    w: '#ffffff', // éclat
  },
  rows: [
    '....KKKK....',
    '...KKIIKK...',
    '..KKIIIIKK..',
    '..KIIwIbIK..',
    '.KKIIwwIbKK.',
    '.KIIIwwIbIK.',
    'KKIbbIIIbIIK',
    'KIbbIIbbIbIK',
    'KIIIIIIIIbIK',
    'KIbbIIbbIbIK',
    'KKIbbIIIbIIK',
    '.KIIIwwIbIK.',
    '.KKIIwwIbKK.',
    '..KIIwIbIK..',
    '..KKIIIIKK..',
    '...KKIIKK...',
    '....KKKK....',
  ],
});

/* ------------------------------------------------------------------
 * Projectile de Glace — éclat en goutte, laisse une traînée pointillée
 * ------------------------------------------------------------------ */
export const ICE_SHARD = deepFreeze({
  w: 8,
  h: 11,
  palette: { K: '#0d2b3a', I: '#cfeffd', w: '#ffffff', b: '#7cc7ea' },
  rows: [
    '...KK...',
    '..KIIK..',
    '.KIIIIK.',
    '.KIwIIK.',
    'KIIwIIIK',
    'KIIwIIbK',
    'KIIIIIbK',
    '.KIIIbK.',
    '.KIIbK..',
    '..KIK...',
    '...K....',
  ],
});

export const SNOWFLAKE = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#2b6f95', I: '#8ecbee', w: '#ffffff' },
  rows: [
    '.......KK.......',
    '...I...II...I...',
    '....I..II..I....',
    '.I...I.II.I...I.',
    '..I...IIII...I..',
    '...I..IIII..I...',
    '....IIIIIIII....',
    'KIIIIIIwwIIIIIIK',
    'KIIIIIIwwIIIIIIK',
    '....IIIIIIII....',
    '...I..IIII..I...',
    '..I...IIII...I..',
    '.I...I.II.I...I.',
    '....I..II..I....',
    '...I...II...I...',
    '.......KK.......',
  ],
});
