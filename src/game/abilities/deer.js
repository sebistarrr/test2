/**
 * Pouvoirs de l'EAU.
 *
 *  • Tourbillon — l'Eau laisse derrière elle des vortex qui aspirent
 *    l'adversaire et le blessent. Leur rayon suit la statistique « Size »
 *    (70 → 100 mesuré) et leurs dégâts la statistique « Whirlpool Damage »
 *    (1 → 7 mesuré) : les deux montent à chaque coup de trident porté.
 *
 *  • Maelström (ultime) — un vortex géant au centre de l'arène, aspiration
 *    massive et dégâts soutenus.
 *
 * @module game/abilities/water
 */

import { TAU, clamp } from '../../core/math.js';
import { ARENA } from '../../data/tuning.js';
import { tickZones } from './zone.js';
import { drawSpriteCentered } from '../../render/sprites.js';

export const deerAbilities = {
  id: 'deer',

  init(f) {
    /** @type {Array<any>} */
    f.state.pools = [];
    f.state.sprayTimer = 0;
    /** @type {null|{x:number,y:number,r:number,angle:number,tick:number}} */
    f.state.maelstrom = null;
  },

  update(f, dt, now, game) {
    const el = f.el;
    const w = el.ability.whirlpool;

    // tourbillons en cours
    tickZones(f.state.pools, f, dt, now, game, {
      pull: w.pull,
      tickInterval: w.tickInterval,
      tickDamage: w.tickDamage(f),
      kind: 'whirlpool',
      sparkColor: '#93c5fd',
      spin: w.spin,
    });

    // gouttes crachées par les tourbillons
    if (f.state.pools.length && game.phase === 'fight') {
      f.state.sprayTimer -= dt;
      if (f.state.sprayTimer <= 0) {
        f.state.sprayTimer = el.ability.spray.interval;
        const pool = f.state.pools[0];
        const target = f.opponent;
        const base =
          target && target.alive
            ? Math.atan2(target.y - pool.y, target.x - pool.x)
            : game.rng.range(0, TAU);
        for (let i = 0; i < el.ability.spray.count; i++) {
          this.spawnMoteFrom(f, pool, base + game.rng.spread(0.5), game);
        }
      }
    }

    /* ---------- ultime ---------- */
    const ult = el.ultimate;
    if (f.ult.active > 0) {
      f.ult.active -= dt;
      this.tickMaelstrom(f, dt, now, game);
      if (f.ult.active <= 0) {
        f.ult.active = 0;
        f.ult.charge = 0;
        f.ult.ready = false;
        f.state.maelstrom = null;
      }
    } else if (game.phase === 'fight') {
      f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castMaelstrom(f, game);
    }

    /* ---------- pose de tourbillons ---------- */
    if (game.phase !== 'fight') return;
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) this.castWhirlpool(f, game);
  },

  castWhirlpool(f, game) {
    const a = f.el.ability;
    const w = a.whirlpool;
    const r = w.radius(f);
    f.state.pools.push({ x: f.x, y: f.y, r, life: w.life, angle: 0, tick: 0 });
    if (f.state.pools.length > w.max) f.state.pools.shift();

    game.fx.ring(f.x, f.y, 12, r, 0.5, w.edge, 6, true);
    game.fx.burst(f.x, f.y, 12, { color: ['#93c5fd', '#ffffff'], speed: 190, size: 5, life: 0.45 });
    f.ability.timer = a.cooldown;
  },

  spawnMoteFrom(f, pool, angle, game) {
    // on décale la sortie sur le bord du cercle
    const sx = f.x;
    const sy = f.y;
    f.x = pool.x;
    f.y = pool.y;
    // le nom du projectile vient de la fiche : le moteur ne connaît aucune bête
    game.projectiles.spawn(f, f.el.ability.spray.projectile, angle, pool.r * 0.5);
    f.x = sx;
    f.y = sy;
  },

  castMaelstrom(f, game) {
    const m = f.el.ultimate.maelstrom;
    const i = ARENA.inner;
    f.ult.active = f.el.ultimate.duration;
    f.ult.ready = false;
    f.state.maelstrom = {
      x: (i.left + i.right) / 2,
      y: (i.top + i.bottom) / 2,
      r: m.radius,
      angle: 0,
      tick: 0,
    };
    game.fx.ring(f.state.maelstrom.x, f.state.maelstrom.y, 20, m.radius, 0.7, m.edge, 10, true);
    game.shake(7, 0.45);
  },

  tickMaelstrom(f, dt, now, game) {
    const m = f.el.ultimate.maelstrom;
    const z = f.state.maelstrom;
    if (!z) return;
    z.angle += m.spin * dt;

    const target = f.opponent;
    if (!target || !target.alive) return;
    const dx = z.x - target.x;
    const dy = z.y - target.y;
    const d = Math.hypot(dx, dy);
    if (d > z.r + target.radius) return;

    const grip = 1 - Math.min(1, d / Math.max(1, z.r));
    target.push(dx, dy, m.pull * grip * dt * 60);
    z.tick -= dt;
    if (z.tick <= 0) {
      z.tick = m.tickInterval;
      game.damage(target, m.tickDamage(f), f, { kind: 'maelstrom', silent: true });
      game.fx.burst(target.x, target.y, 5, { color: '#bfdbfe', speed: 140, size: 4, life: 0.35 });
    }
  },

  /**
   * Cercles sacrés et grand rite, sous les combattants.
   *
   * Ce n'est pas un dégradé tournoyant mais une **vraie spirale en pixels,
   * opaque** : disque émeraude, bras sous-bois enroulé sur deux tours et demi,
   * éclats clairs sur un bord, gros contour. On blitte donc le sprite
   * `sacredCircle` étiré au diamètre courant et tourné lentement — le rendu
   * plus-proche-voisin conserve les blocs comme à l'écran.
   */
  drawUnder(ctx, f) {
    for (const z of f.state.pools) {
      this.drawVortex(ctx, z, Math.min(1, z.life / 0.6));
    }
    const z = f.state.maelstrom;
    if (!z || f.ult.active <= 0) return;
    this.drawVortex(ctx, z, Math.min(1, f.ult.active / 0.6));
  },

  /** @param {CanvasRenderingContext2D} ctx */
  drawVortex(ctx, z, fade) {
    const d = z.r * 2;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(z.x, z.y);
    ctx.rotate(z.angle);
    drawSpriteCentered(ctx, 'sacredCircle', 0, 0, d);
    ctx.restore();
  },

  drawOver() {},

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },
};
