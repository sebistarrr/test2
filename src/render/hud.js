/**
 * HUD bas d'écran : deux jauges d'ultime, la ligne de statistique de chaque
 * combattant, et — pour qui en porte un — une jauge de **pouvoir spécial**.
 * La géométrie des deux premiers est relevée au pixel sur la vidéo ; celle de
 * la troisième est déduite (voir `HUD.special` dans data/tuning.js).
 *
 * @module render/hud
 */

import { HUD, STAGE } from '../data/tuning.js';
import { clamp } from '../core/math.js';
import { drawFittedText } from './text.js';

const BAR_FONT = `700 ${HUD.bar.labelSize}px "Oswald", "Arial Narrow", sans-serif`;
const SPEC_FONT = `700 ${HUD.special.labelSize}px "Oswald", "Arial Narrow", sans-serif`;
const STAT_FONT = `700 ${HUD.stat.fontSize}px "Oswald", "Arial Narrow", sans-serif`;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/fighter.js').Fighter} f
 * @param {'left'|'right'} side
 * @param {number} value 0..1
 * @param {'ref'|'fr'} lang
 * @param {{value:number, active:boolean}|null} [spec] état du pouvoir spécial,
 *   ou rien du tout : les neuf combattants sans troisième créneau n'affichent
 *   pas de deuxième jauge, ils ne laissent pas un cadre vide.
 */
export function drawFighterHud(ctx, f, side, value, lang, spec) {
  drawBar(ctx, f, side, value, lang);
  drawStat(ctx, f, side, lang);
  if (spec) drawSpecialBar(ctx, f, side, spec, lang);
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
 * Jauge du pouvoir spécial.
 *
 * Elle dit **deux choses avec le même remplissage**, et c'est voulu : hors
 * activité elle se remplit vers la prochaine incantation, pendant l'activité
 * elle se vide sur la durée restante. C'est la convention des jauges d'ultime
 * du jeu (`barValue` fait exactement ça), donc rien de nouveau à apprendre.
 *
 * Ce qui distingue les deux régimes n'est pas la jauge mais le **libellé** :
 * inversé sur fond plein pendant l'activité, posé sur la plaque crème sinon.
 * Sans ça, une jauge à moitié pleine ne dit pas si le pouvoir arrive ou s'en
 * va.
 */
function drawSpecialBar(ctx, f, side, spec, lang) {
  const b = HUD.special;
  const sp = f.el.special;
  const x = side === 'left' ? b.leftX : b.rightX;
  const v = clamp(spec.value, 0, 1);

  ctx.fillStyle = STAGE.plate;
  ctx.fillRect(x, b.y, b.width, b.height);

  ctx.fillStyle = sp.barFill;
  ctx.fillRect(x, b.y, b.width * v, b.height);

  ctx.lineJoin = 'miter';
  ctx.lineWidth = b.border;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(x + b.border / 2, b.y + b.border / 2, b.width - b.border, b.height - b.border);

  ctx.font = SPEC_FONT;
  ctx.textBaseline = 'middle';
  ctx.textAlign = side === 'left' ? 'left' : 'right';
  const tx = side === 'left' ? x + b.labelPad : x + b.width - b.labelPad;
  const label = (lang === 'fr' && sp.barLabelFr) || sp.barLabel;
  drawFittedText(ctx, label, tx, b.y + b.height / 2 + 1, b.width - b.labelPad * 2, {
    fill: spec.active ? sp.barText : '#1c1a26',
    stroke: spec.active ? '#000000' : STAGE.plate,
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
