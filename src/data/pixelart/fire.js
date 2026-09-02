/**
 * Cartes de pixel-art du FEU.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 * Les clés de ce registre sont ce que lisent les fiches (`head.sprite`,
 * `projectiles.*.sprite`, `icon`) et `assets/sprites/manifest.json`.
 *
 * @module data/pixelart/fire
 */

import { deepFreeze } from '../freeze.js';

/**
 * FEU — **lame-flamme à garde noire**. Relevé sur FIRE vs WATER : au ras de la
 * boule, une petite garde en losange anthracite avec une **gemme rouge**, puis
 * une longue flamme effilée — bords orange, cœur jaune vif — au **contour noir
 * épais et ondulé**. Le tout mesure ~110 px de long pour 46 de haut.
 * Ce sprite contient donc la garde : le manche de la fiche reste invisible.
 */
export const FIRE_BLADE = deepFreeze({
  w: 28,
  h: 9,
  palette: {
    K: '#1a0d02', // contour noir
    g: '#3c3c42', // garde anthracite
    r: '#c81f1f', // gemme rouge
    o: '#f2760a', // bord orange (pipette : rgb(242,146,8))
    y: '#fbb603', // corps jaune (pipette : rgb(251,182,3))
    w: '#ffe15c', // cœur incandescent
  },
  rows: [
    '.......KKKK.................',
    '..KK...KooKKKK..............',
    '.KggK.KoyyyooKKKKK..........',
    'KggggKKoyywwyyyyyoKKKKK.....',
    'KgrrgKKoywwwwwwwyyyyyyyoKKK.',
    'KggggKKoyywwyyyyyoKKKKK.....',
    '.KggK.KoyyyooKKKKK..........',
    '..KK...KooKKKK..............',
    '.......KKKK.................',
  ],
});

/** FEU — braise. */
export const EMBER = deepFreeze({
  w: 7,
  h: 7,
  palette: { K: '#2a0d02', o: '#f2670c', y: '#fbbf24', w: '#fff4c4' },
  rows: ['..KKK..', '.KoyoK.', 'KoywyoK', 'KywwwyK', 'KoywyoK', '.KoyoK.', '..KKK..'],
});

export const ICON_FLAME = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#2a0d02', o: '#f2670c', y: '#fbbf24', w: '#fff4c4' },
  rows: [
    '.......KK.......',
    '......KooK......',
    '.....KoyyoK.....',
    '....KoyyyyoK....',
    '....KoyywyoK....',
    '...KooywwwyoK...',
    '...KoyywwwyyoK..',
    '..KooywwwwwyooK.',
    '..KoyywwwwwyyoK.',
    '.KooywwwwwwwyoK.',
    '.KoyywwwwwwwyoK.',
    '.KoyywwwwwwwyoK.',
    '.KooyywwwwwyyoK.',
    '..KooyywwwyyooK.',
    '...KKooyyyyooK..',
    '.....KKKKKKKK...',
  ],
});
