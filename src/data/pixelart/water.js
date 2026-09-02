/**
 * Cartes de pixel-art du EAU.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 * Les clés de ce registre sont ce que lisent les fiches (`head.sprite`,
 * `projectiles.*.sprite`, `icon`) et `assets/sprites/manifest.json`.
 *
 * @module data/pixelart/water
 */

import { deepFreeze } from '../freeze.js';

/**
 * EAU — tête de trident à trois dents. Relevé sur FIRE vs WATER : bleu clair
 * à **contour noir** (et non bleu nuit), monté sur une hampe acier-bleu.
 */
export const WATER_TRIDENT = deepFreeze({
  w: 12,
  h: 15,
  palette: {
    K: '#0a0f18', // contour noir, comme sur la vidéo
    b: '#6fa9ee', // bleu clair
    w: '#d6e9ff', // reflet
  },
  rows: [
    '.....KKKKKK.',
    '.....KbbbbK.',
    '.KKKKKbwbKK.',
    '.KbbbbbbbK..',
    '.KbbKKKKK...',
    '.KbbK.......',
    '.KbbKKKKKKK.',
    '.KbwbbbbbbbK',
    '.KbbKKKKKKK.',
    '.KbbK.......',
    '.KbbKKKKK...',
    '.KbbbbbbbK..',
    '.KKKKKbwbKK.',
    '.....KbbbbK.',
    '.....KKKKKK.',
  ],
});

/** EAU — gouttelette projetée par les tourbillons. */
export const WATER_DROP = deepFreeze({
  w: 6,
  h: 8,
  palette: { K: '#0b2545', b: '#5a9bef', w: '#dbeafe' },
  rows: ['..KK..', '.KbbK.', '.KbbK.', 'KbwbbK', 'KbwbbK', 'KbbbbK', '.KbbK.', '..KK..'],
});

/**
 * EAU — **tourbillon** : la vidéo ne montre pas un dégradé tournoyant mais une
 * vraie **spirale en pixels** — disque bleu opaque, bras bleu nuit enroulé sur
 * environ deux tours et demi, éclats clairs sur le bord gauche, gros contour.
 * Le sprite est étiré au diamètre courant (« Size » du HUD, 70 → 150 px).
 */
export const WATER_WHIRLPOOL = deepFreeze({
  w: 21,
  h: 21,
  palette: {
    K: '#14304f', // bras et contour, bleu nuit (pipette : rgb(54,105,148))
    b: '#5b93da', // disque (pipette : rgb(102,151,217))
    w: '#a9d2ff', // éclats clairs (pipette : rgb(115,181,255))
  },
  rows: [
    '.........KKK.........',
    '......KKbbbbbKK......',
    '....KKbbbbbbbbbKK....',
    '...KKbwbbbbbbbbbbK...',
    '..KKbwbbKKKKKKKbbbK..',
    '..KbbbKKbbbbbbKKbbK..',
    '.KKwbKKbbbbbbbbKKbbK.',
    '.KwbbKbbbbKKKbbbKKbK.',
    '.KwbbKbbKKbbKKbbbKbb.',
    'KKbbKKbbKbbbbKbbbKbbK',
    'KKbbKKbbKbKbbbKbbKbbK',
    'KKwbbKbbbKKbbbKbbKbbK',
    '.KwbbKbbbbbbbKKbbKbb.',
    '.KKwbbKbbbbbKKbbbKbK.',
    '.KKbbbbKKKKKKbbbKKbK.',
    '..KKwbbbbKKbbbbbKbK..',
    '..KKKbbbbbbbbbbKbbK..',
    '...KbKKbbbbbbKKbbK...',
    '....KKKKKKKKKKbKK....',
    '......KKbbbbbKK......',
    '.........KKK.........',
  ],
});

/**
 * EAU — icône du titre. Sur la vidéo, ce n'est pas une goutte mais la
 * **spirale du tourbillon**, en bleu, à côté du mot « WATER ».
 */
export const ICON_DROPLET = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#14304f', b: '#5b93da' },
  rows: [
    '.....KKKKKK.....',
    '...KKbbbbbbKK...',
    '..KbbbbbbbbbbK..',
    '.KbbbKKKKKKbbbK.',
    '.KbbKKbbbbKKbbK.',
    'KbbKKbbbbbbKbbbK',
    'KbbKbbKKKKbbKbbK',
    'KbbKbKKbbKKbKbbK',
    'KbbKbKbbbKbKbbbK',
    'KbbKbbKKKKbKbbbK',
    'KbbbKbbbbbbKbbbK',
    '.KbbKKbbbbbKbbK.',
    '.KbbbKKKKKKbbbK.',
    '..KbbbbbbbbbbK..',
    '...KKbbbbbbKK...',
    '.....KKKKKK.....',
  ],
});
