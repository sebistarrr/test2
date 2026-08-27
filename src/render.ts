/* =====================================================================
   Rendu Canvas.

   Ce module ne modifie JAMAIS l'état du duel : il lit et dessine. L'ordre
   de tracé rejoue la pile de profondeurs du relevé — rien ne passe devant
   les billes :

     décor < éventail < fantômes < sillage < billes < armes < éclats

   Tout ce qui peut déborder (éventail, fantômes, sillage, éclats) est
   découpé au bord intérieur du trait d'arène : dans la vidéo, aucun de
   ces effets ne franchit le cadre.
   ===================================================================== */

import {
  ARENA,
  ARENA_CX,
  BALL_R,
  BAR,
  C,
  FONT,
  H,
  IN_H,
  IN_W,
  IN_X,
  IN_Y,
  RULES,
  SWORD_R0,
  SWORD_TIP,
  TYPE,
  W,
  X_LEFT,
  X_RIGHT,
  Y_LABEL,
  Y_MARK,
  Y_STAT1,
  Y_STAT2,
  Y_TITLE,
} from './constants';
import type { Duel } from './duel';
import type { SpriteSet } from './sprites';

type Ctx = CanvasRenderingContext2D;

/** Texte du relevé : très gras, contour noir. */
function inkText(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  strokeW: number,
  align: CanvasTextAlign
): void {
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  if (strokeW > 0) {
    ctx.lineWidth = strokeW;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

/** Découpe au bord intérieur du trait d'arène. */
function clipArena(ctx: Ctx): void {
  ctx.beginPath();
  ctx.rect(IN_X, IN_Y, IN_W, IN_H);
  ctx.clip();
}

function rgba(c: readonly [number, number, number] | readonly number[], a: number): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/* --- Décor ------------------------------------------------------------ */

function drawChrome(ctx: Ctx, duel: Duel): void {
  ctx.fillStyle = C.page;
  ctx.fillRect(0, 0, W, H);

  // Arène : le remplissage passe en crème pendant HIGH NOON (mesuré).
  ctx.fillStyle = duel.noonOn ? C.arenaNoon : C.arena;
  ctx.fillRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);
  ctx.lineWidth = ARENA.line;
  ctx.strokeStyle = C.ink;
  ctx.strokeRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);

  // Titres. Le camp mort passe en gris (mesuré).
  const oDead = duel.over && duel.winner === 'Bladesman';
  const bDead = duel.over && duel.winner === 'Outlaw';
  inkText(ctx, 'Outlaw', X_LEFT, Y_TITLE, TYPE.title.size, oDead ? C.dead : C.outlaw, TYPE.title.stroke, 'left');
  inkText(ctx, 'Bladesman', X_RIGHT, Y_TITLE, TYPE.title.size, bDead ? C.dead : C.blade, TYPE.title.stroke, 'right');

  // Filigrane. Marque d'un tiers présente dans la vidéo de référence,
  // isolée sur cette seule ligne pour pouvoir être retirée d'un geste.
  ctx.font = `900 ${TYPE.mark.size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = C.watermark;
  ctx.fillText('ballthing.com', ARENA_CX, Y_MARK);
}

/* --- Jauges et stats -------------------------------------------------- */

function drawBar(
  ctx: Ctx,
  box: { x: number; w: number },
  fill: number,
  color: string,
  label: string,
  labelX: number,
  labelAlign: CanvasTextAlign
): void {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(box.x, BAR.y, box.w, BAR.h);
  const inner = BAR.line / 2;
  ctx.fillStyle = color;
  ctx.fillRect(
    box.x + inner,
    BAR.y + inner,
    Math.max(0, (box.w - BAR.line) * fill),
    BAR.h - BAR.line
  );
  // Le trait des jauges vaut celui de l'arène : à 3 px les bords ne
  // noircissent que deux lignes au lieu des trois du relevé.
  ctx.lineWidth = BAR.line;
  ctx.strokeStyle = C.ink;
  ctx.strokeRect(box.x, BAR.y, box.w, BAR.h);
  inkText(ctx, label, labelX, Y_LABEL, TYPE.label.size, C.label, TYPE.label.stroke, labelAlign);
}

function drawHud(ctx: Ctx, duel: Duel): void {
  drawBar(ctx, BAR.left, duel.noon, C.outlaw, 'HIGH NOON', X_LEFT + 4, 'left');
  drawBar(ctx, BAR.right, duel.rush, C.blade, 'BLADE RUSH', X_RIGHT - 4, 'right');

  const o = duel.outlaw;
  const b = duel.blade;
  const s = TYPE.stat;
  inkText(ctx, `Damage: ${o.dmg.toFixed(2)}`, X_LEFT, Y_STAT1, s.size, C.outlaw, s.stroke, 'left');
  inkText(ctx, `Ammo: ${o.ammo}/${RULES.magazine}`, X_LEFT, Y_STAT2, s.size, C.outlaw, s.stroke, 'left');
  // Damage du Bladesman n'est JAMAIS stocké : il est dérivé de spin ici.
  // Le stocker séparément fait diverger les deux valeurs.
  const bDmg = b.spin * RULES.dmgPerSpin;
  inkText(ctx, `Damage: ${bDmg.toFixed(2)}`, X_RIGHT, Y_STAT1, s.size, C.blade, s.stroke, 'right');
  inkText(ctx, `Spin Speed: ${b.spin.toFixed(2)}`, X_RIGHT, Y_STAT2, s.size, C.blade, s.stroke, 'right');
}

/* --- Effets dans l'arène ---------------------------------------------- */

function drawFan(ctx: Ctx, duel: Duel): void {
  const arcs = duel.arcs;
  if (arcs.length < 2) return;
  // Pendant BLADE RUSH l'éventail vire au vert fluo et devient plus dense
  // (mesuré : l'aire verte est multipliée par 5,3 au pic).
  const col = duel.rushOn ? C.slashRush : C.slash;
  const alpha = duel.rushOn ? C.slashRushA : C.slashA;
  const inner = SWORD_R0 + 8;
  const n = arcs.length;
  for (let i = 1; i < n; i++) {
    const p = arcs[i - 1];
    const q = arcs[i];
    const t = i / (n - 1); // 1 = collé à la lame
    ctx.fillStyle = rgba(col, alpha * t * t);
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.a) * inner, p.y + Math.sin(p.a) * inner);
    ctx.lineTo(p.x + Math.cos(p.a) * SWORD_TIP, p.y + Math.sin(p.a) * SWORD_TIP);
    ctx.lineTo(q.x + Math.cos(q.a) * SWORD_TIP, q.y + Math.sin(q.a) * SWORD_TIP);
    ctx.lineTo(q.x + Math.cos(q.a) * inner, q.y + Math.sin(q.a) * inner);
    ctx.closePath();
    ctx.fill();
  }
}

function drawGhosts(ctx: Ctx, duel: Duel): void {
  for (const g of duel.ghosts) {
    const k = 1 - g.age / g.life;
    ctx.globalAlpha = C.ghostA * k;
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(g.x, g.y, BALL_R * (0.88 + 0.12 * k), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTrails(ctx: Ctx, duel: Duel): void {
  // Un TRAIT, pas un rond : 2 px d'épaisseur, pâle, plus dense à l'avant.
  ctx.lineCap = 'butt';
  ctx.lineWidth = 2;
  const seg = C.trailLen / C.trailSeg;
  for (const b of duel.bullets) {
    const { x, y } = b.body.position;
    const ux = -Math.cos(b.ang);
    const uy = -Math.sin(b.ang);
    for (let k = 0; k < C.trailSeg; k++) {
      const a0 = k * seg + 2;
      const a1 = (k + 1) * seg - 2;
      ctx.strokeStyle = rgba(C.trail, 0.65 * (1 - k / C.trailSeg));
      ctx.beginPath();
      ctx.moveTo(x + ux * a0, y + uy * a0);
      ctx.lineTo(x + ux * a1, y + uy * a1);
      ctx.stroke();
    }
    // Tête du projectile, plus dense.
    ctx.strokeStyle = rgba(C.trail, 0.95);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + ux * 10, y + uy * 10);
    ctx.stroke();
  }
}

function drawParticles(ctx: Ctx, duel: Duel): void {
  for (const p of duel.particles) {
    const k = 1 - p.age / p.life;
    ctx.globalAlpha = k * k;
    ctx.fillStyle = p.color;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.ang);
    // Fragment allongé, pas un rond flou.
    ctx.fillRect(-3 * p.sx, -1 * p.sy, 6 * p.sx, 2 * p.sy);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/* --- Combattants ------------------------------------------------------ */

function drawFighters(ctx: Ctx, duel: Duel, sprites: SpriteSet): void {
  const o = duel.outlaw;
  const b = duel.blade;

  const oBall = duel.time < o.flash ? sprites.ballOutlawHit : sprites.ballOutlaw;
  const bBall = duel.time < b.flash ? sprites.ballBladeHit : sprites.ballBlade;
  for (const [f, img] of [
    [o, oBall],
    [b, bBall],
  ] as const) {
    ctx.drawImage(img, f.body.position.x - img.width / 2, f.body.position.y - img.height / 2);
  }

  // Chiffres de PV : ancrés au centre EXACT du corps Matter, à chaque
  // frame. Le sursaut d'échelle part du même centre, il ne déplace donc
  // rien — c'est le disque qui blanchit, pas le chiffre qui tremble.
  ctx.textBaseline = 'middle';
  for (const f of [o, b]) {
    const scale = 1 + f.pop * 0.22;
    ctx.save();
    ctx.translate(f.body.position.x, f.body.position.y);
    ctx.scale(scale, scale);
    inkText(ctx, String(Math.ceil(f.hp)), 0, 0, TYPE.hp.size, C.hp, TYPE.hp.stroke, 'center');
    ctx.restore();
  }
  ctx.textBaseline = 'alphabetic';

  // Armes : pixel-art, tiré sans lissage pour garder les marches.
  ctx.imageSmoothingEnabled = false;
  const t = b.body.position;
  const aim = Math.atan2(t.y - o.body.position.y, t.x - o.body.position.x);
  drawWeapon(ctx, sprites.gun.sprite, o.body.position.x, o.body.position.y, aim, sprites.gun.r0 - o.pop * 5);
  drawWeapon(ctx, sprites.sword.sprite, t.x, t.y, b.ang, sprites.sword.r0);
  ctx.imageSmoothingEnabled = true;
}

/** Pose un sprite d'arme à `r0` du centre, ancré à mi-hauteur, tourné
 *  avec la bille. C'est ce qui le fait orbiter autour du centre exact. */
function drawWeapon(
  ctx: Ctx,
  img: HTMLCanvasElement,
  cx: number,
  cy: number,
  ang: number,
  r0: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.drawImage(img, r0, -img.height / 2);
  ctx.restore();
}

/* --- Entrée ----------------------------------------------------------- */

export function render(ctx: Ctx, duel: Duel, sprites: SpriteSet, jitter: () => number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // Secousse d'écran sur les gros impacts : elle déplace le décor ET
  // l'arène, comme une caméra, jamais les éléments les uns par rapport
  // aux autres.
  if (duel.shake > 0.05) {
    ctx.translate(jitter() * duel.shake, jitter() * duel.shake);
  }

  drawChrome(ctx, duel);

  ctx.save();
  clipArena(ctx);
  drawFan(ctx, duel);
  drawGhosts(ctx, duel);
  drawTrails(ctx, duel);
  ctx.restore();

  drawFighters(ctx, duel, sprites);

  ctx.save();
  clipArena(ctx);
  drawParticles(ctx, duel);
  ctx.restore();

  drawHud(ctx, duel);

  if (duel.over && duel.winner) {
    inkText(ctx, `${duel.winner} wins!`, ARENA_CX, 512, 34, '#1C1A26', 6, 'center');
  }
}
