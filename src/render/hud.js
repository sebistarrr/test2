/**
 * HUD bas d'écran : par combattant, une jauge d'ultime, une jauge de **pouvoir
 * spécial** juste en dessous pour qui en porte un, puis ses lignes de
 * statistique.
 *
 * Les deux jauges passent par **le même tracé** (`drawGauge`) : elles ne se
 * ressemblent pas, elles sont identiques par construction. Seule leur
 * géométrie diffère, et encore : `HUD.special` recopie `HUD.bar` à l'ordonnée
 * près.
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
 * @param {{value:number, active:boolean}|null} [spec] état du pouvoir spécial,
 *   ou rien du tout : les neuf combattants sans troisième créneau n'affichent
 *   pas de deuxième jauge, ils ne laissent pas un cadre vide.
 */
export function drawFighterHud(ctx, f, side, value, lang, spec) {
  drawGauge(ctx, HUD.bar, side, value, {
    fill: f.el.ultimate.barFill,
    text: f.el.ultimate.barText,
    label: (lang === 'fr' && f.el.ultimate.barLabelFr) || f.el.ultimate.barLabel,
    anchorRight: (f.el.ultimate.barAnchor ?? 'left') === 'right',
  });
  if (spec) {
    drawGauge(ctx, HUD.special, side, spec.value, {
      fill: f.el.special.barFill,
      text: f.el.special.barText,
      label: (lang === 'fr' && f.el.special.barLabelFr) || f.el.special.barLabel,
    });
  }
  drawStat(ctx, f, side, lang);
}

/**
 * **Une jauge, et une seule fonction pour les deux rangées.**
 *
 * L'ultime et le pouvoir spécial partagent le même dessin : plaque crème,
 * remplissage, cadre noir, libellé cerné de noir. Les deux rangées n'ont donc
 * pas deux tracés qui se ressemblent — elles ont **le même**, appelé avec deux
 * géométries. C'est ce qui garantit qu'elles ne peuvent plus diverger : une
 * retouche de style les touche toutes les deux par construction.
 *
 * La première version en avait deux copies, dont l'une avait dérivé (libellé
 * plus petit, couleur inversée selon l'état). Retoucher l'une sans l'autre est
 * exactement le genre d'écart qui ne crie jamais.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{y:number,height:number,width:number,leftX:number,rightX:number,border:number,labelPad:number}} g géométrie
 * @param {'left'|'right'} side
 * @param {number} value 0..1
 * @param {{fill:string, text:string, label:string, anchorRight?:boolean}} style
 */
function drawGauge(ctx, g, side, value, style) {
  const x = side === 'left' ? g.leftX : g.rightX;
  const v = clamp(value, 0, 1);

  // plaque crème : l'intérieur de la jauge reste celui de la vidéo, même sur
  // le fond sombre — le libellé peut donc garder son contour noir
  ctx.fillStyle = STAGE.plate;
  ctx.fillRect(x, g.y, g.width, g.height);

  // remplissage
  const w = g.width * v;
  ctx.fillStyle = style.fill;
  ctx.fillRect(style.anchorRight ? x + g.width - w : x, g.y, w, g.height);

  // cadre
  ctx.lineJoin = 'miter';
  ctx.lineWidth = g.border;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(x + g.border / 2, g.y + g.border / 2, g.width - g.border, g.height - g.border);

  // libellé
  ctx.font = BAR_FONT;
  ctx.textBaseline = 'middle';
  ctx.textAlign = side === 'left' ? 'left' : 'right';
  const tx = side === 'left' ? x + g.labelPad : x + g.width - g.labelPad;
  drawFittedText(ctx, style.label, tx, g.y + g.height / 2 + 1, g.width - g.labelPad * 2, {
    fill: style.text,
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
