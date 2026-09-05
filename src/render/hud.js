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
 * **Ordre des plaques, commun aux deux bandeaux.**
 *
 * À deux camps, une colonne par camp : c'est la lecture qu'on attend d'un
 * 2 contre 2, et remplir par paires entrelaçait les équipes (gauche = un de
 * chaque). Au-delà de deux camps il n'y a plus de groupement à montrer, on
 * remplit donc colonne par colonne.
 *
 * Les deux bandeaux — points de vie en haut, pouvoirs en bas — partagent cet
 * ordre : un combattant est à la même place dans les deux, sinon l'œil doit
 * chercher deux fois.
 */
/**
 * **Pas de rangée, comprimé quand il le faut.**
 *
 * Les deux bandeaux étaient calés sur le pire cas connu au moment de leur
 * écriture : cinq combattants en bataille royale, donc trois rangées de deux.
 * Le Clone d'ombre a fait sauter cette borne — un clone peut en invoquer un
 * autre, donc **la colonne d'un camp peut porter quatre plaques ou plus**, et
 * personne ne sait combien à l'avance.
 *
 * Plutôt que de deviner un nouveau maximum, le pas se calcule : il vaut celui
 * de la fiche tant que la colonne tient, et se resserre juste assez au-delà.
 * Les dispositions déjà réglées (duel, 2 contre 2, royale à cinq) retombent
 * donc sur le pas d'origine **au pixel près** — c'est le `Math.min` qui le
 * garantit, pas une exception écrite à la main.
 *
 * @param {number} pas      pas nominal, celui de la fiche
 * @param {number} haut     ordonnée de la première rangée
 * @param {number} plancher ordonnée à ne pas dépasser
 * @param {number} bloc     hauteur occupée par une rangée
 * @param {number} rangs    nombre de rangées de la colonne la plus chargée
 */
function pasDeRangee(pas, haut, plancher, bloc, rangs) {
  if (rangs < 2) return pas;
  return Math.min(pas, (plancher - haut - bloc) / (rangs - 1));
}

/** Rangées de la colonne la plus chargée. */
function rangs(places) {
  return places.reduce((m, p) => Math.max(m, p.row + 1), 0);
}

function placer(fighters) {
  const camps = [...new Set(fighters.map((f) => f.team))];
  if (camps.length !== 2) {
    return fighters.map((f, i) => ({ f, col: i % 2, row: (i / 2) | 0 }));
  }
  const compte = [0, 0];
  return fighters.map((f) => {
    const col = camps.indexOf(f.team);
    return { f, col, row: compte[col]++ };
  });
}

/**
 * **Bandeau de points de vie, en haut de l'écran** — à plusieurs seulement.
 *
 * Une plaque par combattant : nom, barre de vie dans sa couleur, chiffre. Le
 * camp se lit au liseré de gauche ; en chacun-pour-soi chacun est son propre
 * camp, donc chaque liseré est unique et l'information est simplement neutre.
 * Un mort voit sa plaque barrée de noir : on voit d'un coup qui reste.
 *
 * En haut et non en bas parce que c'est ce qu'on surveille en continu, et que
 * le bas est pris par les pouvoirs.
 */
export function drawRosterHp(ctx, fighters, lang) {
  const g = HUD.hpTop;
  const places = placer(fighters);
  // le plancher est le haut de casse du titre d'arène, mesuré à 247
  const pas = pasDeRangee(g.rowHeight, g.y, g.bottom, g.height, rangs(places));
  ctx.save();
  ctx.lineJoin = 'miter';
  for (const { f, col, row } of places) {
    const x = col === 0 ? g.leftX : g.rightX;
    const y = g.y + row * pas;
    const v = clamp(f.hp / f.maxHp, 0, 1);

    ctx.fillStyle = STAGE.plate;
    ctx.fillRect(x, y, g.width, g.height);
    ctx.fillStyle = f.el.look.body;
    ctx.fillRect(x, y, g.width * v, g.height);
    if (!f.alive) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, g.width, g.height);
      ctx.globalAlpha = 1;
    }
    ctx.lineWidth = g.border;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(x + g.border / 2, y + g.border / 2, g.width - g.border, g.height - g.border);
    ctx.fillStyle = TEAM_COLORS[f.team % TEAM_COLORS.length];
    ctx.fillRect(x, y, 6, g.height);

    ctx.font = BAR_FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    drawFittedText(ctx, label(f.el, lang), x + g.labelPad + 6, y + g.height / 2 + 1, g.width - g.labelPad * 2 - 52, {
      fill: STAGE.plate, stroke: '#000000', strokeWidth: 3,
    });
    ctx.textAlign = 'right';
    drawFittedText(ctx, String(Math.max(0, Math.ceil(f.hp))), x + g.width - g.labelPad, y + g.height / 2 + 1, 48, {
      fill: STAGE.plate, stroke: '#000000', strokeWidth: 3,
    });
  }
  ctx.restore();
}

/**
 * **Bandeau de pouvoirs, en bas de l'écran** — à plusieurs seulement.
 *
 * Un bloc par combattant : jauge d'ultime, jauge de pouvoir spécial dessous
 * quand il en porte un, puis sa ligne de stat. C'est exactement ce que montre
 * le duel, en plus petit et répété — pas une autre lecture à apprendre.
 *
 * La jauge passe par le **même tracé** que celles du duel (`drawGauge`), avec
 * une géométrie plus serrée : c'est ce qui garantit qu'une retouche de style
 * les touche toutes.
 */
export function drawRosterPowers(ctx, fighters, modules, lang) {
  const g = HUD.powers;
  const places = placer(fighters);
  // un bloc = deux jauges, leur écart, et la ligne de stat sous elles
  const bloc = 2 * (g.barHeight + g.gap) + g.statSize + 4;
  const pas = pasDeRangee(g.rowHeight, g.y, STAGE.height, bloc, rangs(places));
  ctx.save();
  for (const { f, col, row } of places) {
    const x = col === 0 ? g.leftX : g.rightX;
    const y = g.y + row * pas;
    const mod = modules.get(f);
    // Un mort ne charge plus rien : son bloc s'estompe plutôt que de mentir.
    ctx.globalAlpha = f.alive ? 1 : 0.4;

    const geo = (yy) => ({
      y: yy, height: g.barHeight, width: g.width, leftX: x, rightX: x,
      border: g.border, labelSize: g.labelSize, labelPad: g.labelPad,
    });

    ctx.font = `700 ${g.labelSize}px "Oswald", "Arial Narrow", sans-serif`;
    drawGauge(ctx, geo(y), 'left', mod.barValue(f), {
      fill: f.el.ultimate.barFill,
      text: f.el.ultimate.barText,
      label: (lang === 'fr' && f.el.ultimate.barLabelFr) || f.el.ultimate.barLabel,
      anchorRight: (f.el.ultimate.barAnchor ?? 'left') === 'right',
    });

    const spec = mod.specialBar?.(f);
    if (spec) {
      ctx.font = `700 ${g.labelSize}px "Oswald", "Arial Narrow", sans-serif`;
      drawGauge(ctx, geo(y + g.barHeight + g.gap), 'left', spec.value, {
        fill: f.el.special.barFill,
        text: f.el.special.barText,
        label: (lang === 'fr' && f.el.special.barLabelFr) || f.el.special.barLabel,
      });
    }

    // ligne de stat : la même que celle du duel, lue dans la fiche
    const hud = f.el.hud;
    const fns = lang === 'fr' ? hud.statsFr ?? hud.stats : hud.stats;
    const lignes = fns ? fns.map((fn) => fn(f)) : [lang === 'fr' ? hud.statFr(f) : hud.stat(f)];
    ctx.font = `700 ${g.statSize}px "Oswald", "Arial Narrow", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const ys = y + (spec ? 2 * (g.barHeight + g.gap) : g.barHeight + g.gap) + g.statSize;
    drawFittedText(ctx, lignes.join(' · '), x + 2, ys, g.width - 4, {
      fill: hud.color,
      stroke: hud.stroke,
      strokeWidth: 4,
    });
  }
  ctx.globalAlpha = 1;
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
