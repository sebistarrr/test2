/**
 * Décor **statique** : fond sombre, bandeau de titre, cadre d'arène. Rien ne
 * bouge ici — conformément au cahier des charges, le fond ne change jamais
 * pendant le duel.
 *
 * Le décor est rasterisé une fois dans un canvas hors écran, puis blitté en
 * une seule opération à chaque frame.
 *
 * @module render/scene
 */

import { ARENA, STAGE, TITLE } from '../data/tuning.js';
import { drawSpriteCentered } from './sprites.js';

/** @type {HTMLCanvasElement|null} */
let cache = null;
let cacheKey = '';

/**
 * Construit (ou réutilise) le décor pour un duel donné.
 * @param {{a:object,b:object,lang:'ref'|'fr'}} opts
 */
export function buildBackdrop({ a, b, lang }) {
  const key = `${a.id}|${b.id}|${lang}`;
  if (cache && cacheKey === key) return cache;

  const cv = document.createElement('canvas');
  cv.width = STAGE.width;
  cv.height = STAGE.height;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // fond
  ctx.fillStyle = STAGE.paper;
  ctx.fillRect(0, 0, STAGE.width, STAGE.height);

  drawTitle(ctx, a, b, lang);
  drawArena(ctx);

  cache = cv;
  cacheKey = key;
  return cv;
}

export function drawBackdrop(ctx, backdrop) {
  ctx.drawImage(backdrop, 0, 0);
}

/* ------------------------------------------------------------------ */

function drawArena(ctx) {
  const { x, y, size, border, fill, stroke } = ARENA;
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = border;
  ctx.lineJoin = 'miter';
  ctx.strokeRect(x + border / 2, y + border / 2, size - border, size - border);
}

/**
 * Bandeau « DARK ⬤ VS ❄ ICE » : deux noms colorés à contour noir encadrant
 * un « VS » blanc, chaque nom accolé à son icône pixel.
 */
function drawTitle(ctx, a, b, lang) {
  const nameA = lang === 'fr' ? a.name : a.nameRef;
  const nameB = lang === 'fr' ? b.name : b.nameRef;
  // le bandeau ne doit jamais dépasser la largeur de l'arène : on réduit la
  // taille de casse si les noms sont longs (ex. « TEMPÊTE » au lieu de « ICE »)
  const maxWidth = ARENA.size - 8;
  let size = TITLE.fontSize;
  for (let i = 0; i < 8; i++) {
    ctx.font = `400 ${size}px "Archivo Black", "Arial Black", sans-serif`;
    const wNames = ctx.measureText(nameA).width + ctx.measureText(nameB).width;
    ctx.font = `400 ${size * (TITLE.vsSize / TITLE.fontSize)}px "Archivo Black", "Arial Black", sans-serif`;
    const total =
      wNames + ctx.measureText('VS').width + TITLE.gap * 4 + TITLE.iconSize * 2;
    if (total <= maxWidth) break;
    size *= maxWidth / total;
  }
  const font = `400 ${size}px "Archivo Black", "Arial Black", sans-serif`;
  const vsFont = `400 ${size * (TITLE.vsSize / TITLE.fontSize)}px "Archivo Black", "Arial Black", sans-serif`;

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';

  ctx.font = font;
  const wA = ctx.measureText(nameA).width;
  const wB = ctx.measureText(nameB).width;
  ctx.font = vsFont;
  const wVs = ctx.measureText('VS').width;

  const g = TITLE.gap;
  const icon = TITLE.iconSize;
  const total = wA + g + icon + g + wVs + g + icon + g + wB;
  let x = TITLE.centerX - total / 2;
  const base = TITLE.baseline;

  ctx.font = font;
  strokeFill(ctx, nameA, x, base, a.look.body, TITLE.stroke, TITLE.strokeWidth);
  x += wA + g;

  drawSpriteCentered(ctx, a.icon, x + icon / 2, base - size * 0.36, icon);
  x += icon + g;

  ctx.font = vsFont;
  strokeFill(ctx, 'VS', x, base - 4, TITLE.vsColor, TITLE.stroke, 6);
  x += wVs + g;

  drawSpriteCentered(ctx, b.icon, x + icon / 2, base - size * 0.36, icon);
  x += icon + g;

  ctx.font = font;
  strokeFill(ctx, nameB, x, base, b.look.body, TITLE.stroke, TITLE.strokeWidth);

  ctx.restore();
}

/** Texte plein avec contour noir (le contour est dessiné d'abord). */
export function strokeFill(ctx, text, x, y, fill, stroke, width) {
  ctx.lineWidth = width;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}
