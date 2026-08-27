/**
 * Pouvoirs de la FOUDRE.
 *
 *  • Bornes statiques — la Foudre sème des relais dans l'arène (à intervalle
 *    fixe, et à chaque coup d'arme porté). Ils persistent et s'accumulent,
 *    exactement comme sur la vidéo où l'arène finit couverte de bornes.
 *
 *  • Chaînes — périodiquement, un arc part de la Foudre, rebondit de borne en
 *    borne et frappe l'adversaire s'il est à portée d'une borne. Les dégâts
 *    sont la statistique « Chain Damage » (1 → 4,5 mesuré, +0,5 par touche).
 *
 *  • Surcharge (ultime) — le réseau crépite en continu, plus loin et plus vite.
 *
 * @module game/abilities/lightning
 */

import { clamp, dist } from '../../core/math.js';
import { drawSpriteCentered } from '../../render/sprites.js';
import { PIXEL_MAPS } from '../../data/pixelmaps.js';

export const lightningAbilities = {
  id: 'lightning',

  init(f) {
    /** @type {Array<{x:number,y:number,life:number,born:number}>} */
    f.state.nodes = [];
    /** @type {Array<{points:number[][], life:number, maxLife:number}>} */
    f.state.arcs = [];
    f.state.chainTimer = 1;
  },

  update(f, dt, now, game) {
    const el = f.el;

    // vieillissement des bornes et des arcs
    for (let i = f.state.nodes.length - 1; i >= 0; i--) {
      f.state.nodes[i].life -= dt;
      if (f.state.nodes[i].life <= 0) f.state.nodes.splice(i, 1);
    }
    for (let i = f.state.arcs.length - 1; i >= 0; i--) {
      f.state.arcs[i].life -= dt;
      if (f.state.arcs[i].life <= 0) f.state.arcs.splice(i, 1);
    }

    /* ---------- ultime ---------- */
    const ult = el.ultimate;
    if (f.ult.active > 0) {
      f.ult.active -= dt;
      if (f.ult.active <= 0) {
        f.ult.active = 0;
        f.ult.charge = 0;
        f.ult.ready = false;
        f.boost = 0;
      }
    } else if (game.phase === 'fight') {
      f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castSupercharge(f, game);
    }

    if (game.phase !== 'fight') return;

    /* ---------- pose de bornes ---------- */
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) {
      this.dropNode(f, f.x, f.y, game);
      f.ability.timer = el.ability.cooldown;
    }

    /* ---------- décharges ---------- */
    f.state.chainTimer -= dt;
    if (f.state.chainTimer <= 0) {
      f.state.chainTimer = f.ult.active > 0 ? ult.chainInterval : el.ability.chain.interval;
      this.discharge(f, now, game);
    }
  },

  dropNode(f, x, y, game) {
    const node = f.el.ability.node;
    f.state.nodes.push({ x, y, life: node.life, born: game.time });
    if (f.state.nodes.length > node.max) f.state.nodes.shift();
    game.fx.burst(x, y, 6, { color: ['#7dd3fc', '#ffffff'], speed: 130, size: 4, life: 0.35 });
  },

  /** Chaque coup d'arme plante une borne à l'impact (fiche : onHit.dropNode). */
  onLand(f, target, hit, game) {
    if (f.el.weapon.melee.onHit?.dropNode) this.dropNode(f, hit.x, hit.y, game);
  },

  /**
   * Construit la chaîne : Foudre → bornes proches → adversaire.
   * Les dégâts ne partent que si la cible est à portée d'un maillon.
   */
  discharge(f, now, game) {
    const chain = f.el.ability.chain;
    const target = f.opponent;
    if (!target || !target.alive || !f.state.nodes.length) return;

    const range = chain.range * (f.ult.active > 0 ? f.el.ultimate.rangeBonus : 1);

    // parcours glouton : on saute vers la borne la plus proche non visitée
    const remaining = [...f.state.nodes];
    const path = [[f.x, f.y]];
    let cx = f.x;
    let cy = f.y;
    for (let hop = 0; hop < 4 && remaining.length; hop++) {
      let best = -1;
      let bestD = Infinity;
      remaining.forEach((n, i) => {
        const d = dist(cx, cy, n.x, n.y);
        if (d < bestD && d <= range) {
          bestD = d;
          best = i;
        }
      });
      if (best < 0) break;
      const n = remaining.splice(best, 1)[0];
      path.push([n.x, n.y]);
      cx = n.x;
      cy = n.y;
    }

    // la cible n'est touchée que si le dernier maillon l'atteint
    const reached = dist(cx, cy, target.x, target.y) <= range;
    if (reached) path.push([target.x, target.y]);
    if (path.length < 2) return;

    f.state.arcs.push({ points: path, life: chain.life, maxLife: chain.life });

    if (!reached) return;
    game.damage(target, Math.max(1, Math.round(f.stacks)), f, {
      kind: 'chain',
      x: target.x,
      y: target.y,
    });
    target.applySlow(chain.slow, chain.slowDuration, now);
    game.fx.burst(target.x, target.y, 8, {
      color: ['#67e8f9', '#ffffff', '#38bdf8'],
      speed: 200,
      size: 5,
      life: 0.35,
    });
  },

  castSupercharge(f, game) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.boost = ult.duration;
    f.boostFactor = ult.speedBonus;
    // toutes les bornes s'allument d'un coup
    for (const n of f.state.nodes) {
      game.fx.burst(n.x, n.y, 10, { color: ['#67e8f9', '#ffffff'], speed: 220, size: 5, life: 0.5 });
    }
    game.fx.ring(f.x, f.y, 20, 340, 0.55, 'rgba(103,232,249,0.9)', 8, true);
    game.shake(6, 0.35);
  },

  /** Bornes posées au sol. */
  drawUnder(ctx, f, game, now) {
    const node = f.el.ability.node;
    const map = PIXEL_MAPS[node.sprite];
    const h = map.h * node.scale;
    for (const n of f.state.nodes) {
      const fade = Math.min(1, n.life / 1.5);
      ctx.save();
      ctx.globalAlpha = fade;
      if (f.ult.active > 0) {
        const pulse = 0.5 + 0.5 * Math.sin(now * 14 + n.born * 7);
        ctx.globalAlpha = fade * (0.75 + 0.25 * pulse);
      }
      drawSpriteCentered(ctx, node.sprite, n.x, n.y, h);
      ctx.restore();
    }
  },

  /** Arcs électriques : polylignes cyan bruitées, halo dessous. */
  drawOver(ctx, f, game) {
    const chain = f.el.ability.chain;
    for (const arc of f.state.arcs) {
      const t = arc.life / arc.maxLife;
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.globalAlpha = Math.max(0, t);
      for (const pass of [0, 1]) {
        ctx.strokeStyle = pass === 0 ? chain.glow : chain.color;
        ctx.lineWidth = pass === 0 ? chain.width * 3 : chain.width;
        ctx.beginPath();
        for (let i = 0; i < arc.points.length - 1; i++) {
          const [x0, y0] = arc.points[i];
          const [x1, y1] = arc.points[i + 1];
          ctx.moveTo(x0, y0);
          // trois segments bruités pour l'aspect « éclair »
          const steps = 3;
          for (let s = 1; s <= steps; s++) {
            const k = s / steps;
            const jx = s === steps ? 0 : game.viewRng.spread(chain.jitter);
            const jy = s === steps ? 0 : game.viewRng.spread(chain.jitter);
            ctx.lineTo(x0 + (x1 - x0) * k + jx, y0 + (y1 - y0) * k + jy);
          }
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },
};
