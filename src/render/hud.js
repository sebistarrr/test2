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
import { label } from '../ui/lang.js';

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
 * **HUD à plusieurs combattants.** Les deux grandes jauges d'ultime n'ont de
 * sens qu'en duel : elles sont mesurées à gauche et à droite, et il n'y a pas
 * de troisième bord. Au-delà de deux, on passe donc à des **plaques compactes**
 * — une par combattant, nom dans sa couleur et barre de points de vie — sur la
 * même grille que les jauges du duel (deux colonnes, les mêmes abscisses et la
 * même hauteur de rangée), pour que les deux HUD se ressemblent.
 *
 * Ce qui disparaît, et c'est assumé : la jauge d'ultime, celle du pouvoir
 * spécial et la ligne de stat. À six plaques il n'y a plus la place, et le
 * chiffre de points de vie reste lisible **sur la bille** — c'est lui qu'on
 * regarde. Une barre par combattant dit l'essentiel : qui est en train de
 * perdre.
 *
 * Le camp se lit au liseré : un trait de la couleur du camp le long du bord
 * gauche de la plaque. En chacun-pour-soi chaque combattant est son propre
 * camp, donc chaque liseré est unique et l'information est simplement neutre.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} fighters
 * @param {string} lang
 */
export function drawRosterHud(ctx, fighters, lang) {
  const g = HUD.bar;
  const n = fighters.length;
  const rows = Math.ceil(n / 2);
  const rowH = HUD.special.y - g.y; // 40 : le pas des deux rangées du duel
  const barH = Math.min(g.height, rowH - 5);

  /**
   * **Ordre des plaques.** À deux camps, une colonne par camp : c'est la
   * lecture qu'on attend d'un 2 contre 2, et remplir par paires entrelaçait les
   * équipes (gauche = un de chaque). Au-delà de deux camps il n'y a plus de
   * groupement à montrer, on remplit donc colonne par colonne.
   */
  const camps = [...new Set(fighters.map((f) => f.team))];
  const places = camps.length === 2
    ? fighters
        .map((f, i) => ({ f, col: camps.indexOf(f.team) }))
        .map((p, _, tous) => ({
          ...p,
          row: tous.filter((q) => q.col === p.col).indexOf(p),
        }))
    : fighters.map((f, i) => ({ f, col: i % 2, row: (i / 2) | 0 }));

  ctx.save();
  ctx.lineJoin = 'miter';
  for (let i = 0; i < n; i++) {
    const { f, col, row } = places[i];
    const x = col === 0 ? g.leftX : g.rightX;
    const y = g.y + row * rowH;
    const v = clamp(f.hp / f.maxHp, 0, 1);

    // plaque crème, comme les jauges du duel
    ctx.fillStyle = STAGE.plate;
    ctx.fillRect(x, y, g.width, barH);
    // points de vie, dans la couleur du combattant
    ctx.fillStyle = f.el.look.body;
    ctx.fillRect(x, y, g.width * v, barH);
    // mort : la plaque se barre, pour qu'on voie d'un coup qui reste
    if (!f.alive) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, g.width, barH);
      ctx.globalAlpha = 1;
    }
    // cadre
    ctx.lineWidth = g.border;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(x + g.border / 2, y + g.border / 2, g.width - g.border, barH - g.border);
    // liseré de camp
    ctx.fillStyle = TEAM_COLORS[f.team % TEAM_COLORS.length];
    ctx.fillRect(x, y, 6, barH);

    ctx.font = BAR_FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    drawFittedText(ctx, label(f.el, lang), x + g.labelPad + 6, y + barH / 2 + 1, g.width - g.labelPad * 2 - 44, {
      fill: STAGE.plate,
      stroke: '#000000',
      strokeWidth: 3,
    });
    ctx.textAlign = 'right';
    drawFittedText(ctx, String(Math.max(0, Math.ceil(f.hp))), x + g.width - g.labelPad, y + barH / 2 + 1, 40, {
      fill: STAGE.plate,
      stroke: '#000000',
      strokeWidth: 3,
    });
  }
  ctx.restore();
}

/**
 * Couleurs de camp. Elles ne servent qu'au liseré du HUD et au titre d'arène :
 * les combattants gardent leurs propres couleurs, qui sont leur identité.
 */
export const TEAM_COLORS = ['#3fa7d6', '#e8621b', '#7046ac', '#4ade80', '#d9a441', '#c2410c'];

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
