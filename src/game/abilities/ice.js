/**
 * Pouvoirs de la GLACE.
 *
 *  • Éclats de givre (Frost Shards) — salve radiale d'éclats qui ricochent
 *    sur les murs et laissent une traînée pointillée (observé).
 *
 *  • Blizzard — ultime : onde de choc cyan qui dépasse l'arène, puis champ
 *    de givre qui suit la Glace (ralentissement + dégâts périodiques) et
 *    salves d'éclats accélérées pendant toute la durée.
 *
 * La statistique « Damage/Slow: N » du HUD est la pile de la Glace : elle
 * monte de 1 à chaque coup d'arme porté et sert directement de dégâts.
 *
 * @module game/abilities/ice
 */

import { TAU, clamp } from '../../core/math.js';
import { ARENA } from '../../data/tuning.js';

export const iceAbilities = {
  id: 'ice',

  init(f) {
    f.state.fieldTick = 0;
    f.state.snowTimer = 0;
  },

  update(f, dt, now, game) {
    const el = f.el;
    const ult = el.ultimate;

    /* ---------- ultime ---------- */
    if (f.ult.active > 0) {
      f.ult.active -= dt;
      this.tickField(f, dt, now, game);
      if (f.ult.active <= 0) {
        f.ult.active = 0;
        f.ult.charge = 0;
        f.ult.ready = false;
      }
    } else if (game.phase === 'fight') {
      f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castBlizzard(f, game);
    }

    /* ---------- salves d'éclats ---------- */
    if (game.phase !== 'fight') return;
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) this.castShards(f, game);
  },

  castShards(f, game) {
    const a = f.el.ability;
    const boosted = f.ult.active > 0;
    const count = boosted ? a.duringUltimate.count : a.burst.count;
    const cd = boosted ? a.duringUltimate.cooldown : a.cooldown;

    const base = game.rng.range(0, TAU);
    for (let i = 0; i < count; i++) {
      game.projectiles.spawn(f, a.burst.projectile, base + (TAU * i) / count);
    }
    game.fx.burst(f.x, f.y, 10, {
      color: ['#d8f2ff', '#67b6e0', '#ffffff'],
      speed: 180,
      size: 4,
      life: 0.4,
    });
    f.ability.timer = cd;
  },

  castBlizzard(f, game) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.state.fieldTick = 0;

    // onde de choc : elle déborde volontairement de l'arène (comme la vidéo)
    const s = ult.shockwave;
    game.fx.ring(f.x, f.y, s.from, s.to, s.time, s.color, s.width, false);
    game.fx.burst(f.x, f.y, 26, {
      color: ['#d8f2ff', '#ffffff', '#67b6e0'],
      speed: 380,
      size: 6,
      life: 0.7,
    });
    game.shake(5, 0.3);
  },

  tickField(f, dt, now, game) {
    const field = f.el.ultimate.field;
    const snow = f.el.ultimate.snow;
    const target = f.opponent;

    // chute de neige sur toute l'arène pendant l'ultime
    f.state.snowTimer -= dt;
    if (f.state.snowTimer <= 0) {
      f.state.snowTimer = 1 / snow.count;
      const i = ARENA.inner;
      game.fx.snow(
        game.rng.range(i.left, i.right),
        game.rng.range(i.top, i.top + (i.bottom - i.top) * 0.65),
        snow.fall,
        snow.drift,
        snow.color,
      );
    }

    if (!target || !target.alive) return;
    const cx = field.follows ? f.x : f.state.fieldX ?? f.x;
    const cy = field.follows ? f.y : f.state.fieldY ?? f.y;
    const inside = Math.hypot(target.x - cx, target.y - cy) <= field.radius + target.radius;
    if (!inside) return;

    target.applySlow(field.slow, 0.25, now);
    f.state.fieldTick -= dt;
    if (f.state.fieldTick <= 0) {
      f.state.fieldTick = field.tickInterval;
      game.damage(target, field.tickDamage, f, { kind: 'field', silent: true });
      game.fx.burst(target.x, target.y, 4, { color: '#d8f2ff', speed: 90, size: 3, life: 0.3 });
    }
  },

  /** Champ de givre, sous les combattants. */
  drawUnder(ctx, f) {
    if (f.ult.active <= 0) return;
    const field = f.el.ultimate.field;
    const fade = Math.min(1, f.ult.active / 0.6);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.arc(f.x, f.y, field.radius, 0, TAU);
    ctx.fillStyle = field.fill;
    ctx.fill();
    ctx.lineWidth = field.edgeWidth;
    ctx.strokeStyle = field.edge;
    ctx.stroke();
    ctx.restore();
  },

  drawOver() {},

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },
};
