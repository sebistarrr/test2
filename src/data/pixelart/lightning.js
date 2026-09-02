/**
 * Cartes de pixel-art du FOUDRE.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 * Les clés de ce registre sont ce que lisent les fiches (`head.sprite`,
 * `projectiles.*.sprite`, `icon`) et `assets/sprites/manifest.json`.
 *
 * @module data/pixelart/lightning
 */

import { deepFreeze } from '../freeze.js';

/**
 * FOUDRE — fer de lance en éclair. Relevé sur LIGHT vs LIGHTNING : un **fer de
 * flèche jaune trapu** au gros contour noir, monté au bout d'un long manche de
 * bois brun — pas un zigzag plat. ~50 × 34 px.
 */
export const BOLT_BLADE = deepFreeze({
  w: 14,
  h: 9,
  palette: {
    K: '#181004', // contour noir
    y: '#f5d21a', // corps jaune
    w: '#fdf6b0', // reflet
  },
  rows: [
    '........KK....',
    '.....KKKKyKK..',
    '..KKKKyyyyyyK.',
    '.KKyyyyyyyyyyK',
    'KKyyywwwyyyyyK',
    '.KKyyyyyyyyyyK',
    '..KKKKyyyyyyK.',
    '.....KKKKyKK..',
    '........KK....',
  ],
});

/**
 * FOUDRE — borne statique posée dans l'arène (relais des chaînes).
 *
 * Relevé sur LIGHT vs LIGHTNING : ce n'est pas un cristal, c'est une **petite
 * bobine** — une boule au sommet, deux disques à collerette empilés, deux
 * pieds. Blanc lavande à contour sombre, ~34 × 34 px, et la Foudre en sème une
 * douzaine au fil du duel.
 */
export const TESLA_NODE = deepFreeze({
  w: 13,
  h: 13,
  palette: {
    K: '#2f3242', // contour bleu-nuit (pipette : rgb(110,113,130))
    b: '#9c9db2', // ombre des disques
    w: '#e2e5f6', // blanc lavande
  },
  rows: [
    '.....KKK.....',
    '....KwwwK....',
    '....KwwwK....',
    '.....KKK.....',
    '..KKKKKKKKK..',
    '.KwwwwwwwwwK.',
    '.KwwwbbbwwwK.',
    '..KKKKKKKKK..',
    '..KwwwwwwwK..',
    '..KwwbbbwwK..',
    '..KKKKKKKKK..',
    '...K.....K...',
    '..KK.....KK..',
  ],
});

export const ICON_BOLT = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#3a2c05', y: '#f5e60a', w: '#fffbb0' },
  rows: [
    '.........KKKK...',
    '........KyyyK...',
    '.......KyyyK....',
    '......KyyyK.....',
    '.....KyyyKKKKK..',
    '....KyyyyyyyyK..',
    '...KyywwwwyyyK..',
    '..KKyywwwwyyKK..',
    '..KyyywwwyyK....',
    '..KKKyyyyyK.....',
    '....KyyyyK......',
    '...KyyyyK.......',
    '..KyyyK.........',
    '..KyyK..........',
    '..KKK...........',
    '................',
  ],
});
