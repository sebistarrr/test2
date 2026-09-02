/**
 * Cartes de pixel-art du LUMIÈRE.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 * Les clés de ce registre sont ce que lisent les fiches (`head.sprite`,
 * `projectiles.*.sprite`, `icon`) et `assets/sprites/manifest.json`.
 *
 * @module data/pixelart/light
 */

import { deepFreeze } from '../freeze.js';

/**
 * LUMIÈRE — tête de marteau. Relevé sur LIGHT vs LIGHTNING : un bloc **plus
 * large que haut**, cerclé d'un **gros contour noir**, bordure dorée et
 * panneau intérieur très clair. ~37 × 34 px.
 */
export const LIGHT_HAMMER_HEAD = deepFreeze({
  w: 11,
  h: 10,
  palette: {
    K: '#0a0a0a', // contour noir franc, comme les boules
    g: '#e0b729', // bordure dorée (pipette : rgb(224,183,41))
    l: '#fcec97', // panneau clair
    w: '#fff3bf', // reflet
  },
  rows: [
    '..KKKKKKK..',
    '.KgggggggK.',
    'KglllllllgK',
    'KglwwwwwlgK',
    'KglwwwwwlgK',
    'KglwwwwwlgK',
    'KglwwwwwlgK',
    'KglllllllgK',
    '.KgggggggK.',
    '..KKKKKKK..',
  ],
});

export const ICON_SHIELD = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#2a2007', g: '#e0bd1e', l: '#fdf6b8', w: '#ffffff' },
  rows: [
    '..KKKKKKKKKKKK..',
    '.KggggggggggggK.',
    '.KgllllllllllgK.',
    '.KgllwwwwwwllgK.',
    '.KgllwwwwwwllgK.',
    '.KgllllwwllllgK.',
    '.KgllllwwllllgK.',
    '.KgllllwwllllgK.',
    '..KgllllllllgK..',
    '..KgllllllllgK..',
    '...KgllllllgK...',
    '....KgllllgK....',
    '.....KgllgK.....',
    '......KggK......',
    '.......KK.......',
    '................',
  ],
});
