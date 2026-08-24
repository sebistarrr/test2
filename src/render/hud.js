/**
 * HUD bas d'écran : deux jauges d'ultime + la ligne de statistique de chaque
 * combattant. Géométrie relevée au pixel sur la vidéo (voir data/tuning.js).
 *
 * @module render/hud
 */

import { HUD, STAGE } from '../data/tuning.js';
import { clamp } from '../core/math.js';
import { drawFittedText } from './text.js';

const BAR_FONT = `700 ${HUD.bar.labelSize}px "Oswald", "Arial Narrow", sans-serif`;
const STAT_FONT = `700 ${HUD.stat.fontSize}px "Oswald", "Arial Narrow", sans-serif`;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/fighter.js').Fighter} f
 * @param {'left'|'right'} side
 * @param {number} value 0..1
 * @param {'ref'|'fr'} lang
 */
export function drawFighterHud(ctx, f, side, value, lang) {
  drawBar(ctx, f, side, value, lang);
  drawStat(ctx, f, side, lang);
}

function drawBar(ctx, f, side, value, lang) {
  const b = HUD.bar;
  const ult = f.el.ultimate;
  const x = side === 'left' ? b.leftX : b.rightX;
  const v = clamp(value, 0, 1);
  const anchorRight = (ult.barAnchor ?? 'left') === 'right';

  // plaque crème : l'intérieur de la jauge reste celui de la vidéo, même sur
  // le fond sombre — le libellé peut donc garder son contour noir
  ctx.fillStyle = STAGE.plate;
  ctx.fillRect(x, b.y, b.width, b.height);

  // remplissage
  const w = b.width * v;
  ctx.fillStyle = ult.barFill;
  ctx.fillRect(anchorRight ? x + b.width - w : x, b.y, w, b.height);

  // cadre
  ctx.lineJoin = 'miter';
  ctx.lineWidth = b.border;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(x + b.border / 2, b.y + b.border / 2, b.width - b.border, b.height - b.border);

  // libellé
  ctx.font = BAR_FONT;
  ctx.textBaseline = 'middle';
  ctx.textAlign = side === 'left' ? 'left' : 'right';
  const tx = side === 'left' ? x + b.labelPad : x + b.width - b.labelPad;
  const label = (lang === 'fr' && ult.barLabelFr) || ult.barLabel;
  drawFittedText(ctx, label, tx, b.y + b.height / 2 + 1, b.width - b.labelPad * 2, {
    fill: ult.barText,
    stroke: '#000000',
    strokeWidth: 3,
  });
}

/**
 * Une ou deux lignes de statistiques selon l'élément.
 * La fiche expose `stat`/`statFr` (une ligne) ou `stats`/`statsFr`
 * (tableau de fonctions), sans que le HUD ait à connaître les éléments.
 */
function drawStat(ctx, f, side, lang) {
  const s = HUD.stat;
  const hud = f.el.hud;
  const fns = lang === 'fr' ? hud.statsFr ?? hud.stats : hud.stats;
  const lines = fns
    ? fns.map((fn) => fn(f))
    : [lang === 'fr' ? hud.statFr(f) : hud.stat(f)];

  ctx.font = STAT_FONT;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = side === 'left' ? 'left' : 'right';
  // chaque colonne dispose d'une moitié du bandeau, avec une gouttière centrale
  const maxWidth = (s.rightX - s.leftX) / 2 - 12;
  lines.forEach((text, i) => {
    drawFittedText(
      ctx,
      text,
      side === 'left' ? s.leftX : s.rightX,
      s.baseline + i * s.lineHeight,
      maxWidth,
      { fill: hud.color, stroke: hud.stroke, strokeWidth: s.strokeWidth },
    );
  });
}
