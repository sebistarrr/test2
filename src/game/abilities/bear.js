/**
 * Pouvoirs du FEU.
 *
 *  • Gerbe de braises — trois braises qui embrasent ce qu'elles touchent.
 *
 *  • Rage infernale (ultime) — nova de cubes orange (le motif le plus
 *    reconnaissable de la vidéo), ailes de flammes autour du corps pendant
 *    toute la durée, et aura brûlante qui marque quiconque s'approche.
 *
 * La statistique « Burn Damage/Duration » est la pile du Feu : chaque coup
 * d'arme l'augmente de 0,5, et elle sert **à la fois** de dégâts par tic et de
 * durée de la brûlure — exactement ce que dit son libellé.
 *
 * @module game/abilities/fire
 */

import { TAU, clamp } from '../../core/math.js';

export const bearAbilities = {
  id: 'bear',

  init(f) {
    f.state.auraTick = 0;
  },

  update(f, dt, now, game) {
    const ult = f.el.ultimate;

    if (f.ult.active > 0) {
      f.ult.active -= dt;
      this.tickRage(f, dt, now, game);
      if (f.ult.active <= 0) {
        f.ult.active = 0;
        f.ult.charge = 0;
        f.ult.ready = false;
        f.boost = 0;
      }
    } else if (game.phase === 'fight') {
      f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castRage(f, game);
    }

    if (game.phase !== 'fight') return;
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) this.castEmbers(f, game);
  },

  castEmbers(f, game) {
    const a = f.el.ability;
    const base = f.heading;
    for (let i = 0; i < a.burst.count; i++) {
      const off = a.burst.count === 1 ? 0 : (i / (a.burst.count - 1) - 0.5) * a.burst.spread * 2;
      game.projectiles.spawn(f, a.burst.projectile, base + off);
    }
    game.fx.burst(f.x, f.y, 8, {
      color: ['#f97316', '#fbbf24', '#ffffff'],
      speed: 210,
      size: 5,
      life: 0.4,
      dir: base,
      spread: 1.1,
    });
    f.ability.timer = a.cooldown;
  },

  castRage(f, game) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.state.auraTick = 0;
    f.boost = ult.duration;
    f.boostFactor = ult.speedBonus;

    // nova de cubes orange (particules carrées, comme dans la vidéo)
    const n = ult.nova;
    for (let i = 0; i < n.count; i++) {
      const ang = game.rng.range(0, TAU);
      const v = n.speed * game.rng.range(0.25, 1);
      game.fx.spawn({
        kind: 'spark',
        x: f.x,
        y: f.y,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v,
        life: n.life * game.rng.range(0.6, 1.25),
        size: n.size * game.rng.range(0.45, 1.15),
        color: game.rng.pick(n.colors),
        drag: 2.1,
      });
    }
    game.fx.ring(f.x, f.y, 20, ult.aura.radius, 0.5, 'rgba(249,115,22,0.85)', 9, true);
    game.shake(7, 0.4);
  },

  tickRage(f, dt, now, game) {
    const ult = f.el.ultimate;
    const target = f.opponent;

    // braises qui montent du corps pendant la rage
    if (game.rng.chance(dt * 26)) {
      game.fx.spawn({
        kind: 'spark',
        x: f.x + game.rng.spread(f.radius),
        y: f.y + game.rng.spread(f.radius),
        vx: game.rng.spread(40),
        vy: -game.rng.range(40, 110),
        life: game.rng.range(0.3, 0.7),
        size: game.rng.range(4, 9),
        color: game.rng.pick(ult.nova.colors),
        drag: 1.4,
      });
    }

    if (!target || !target.alive) return;
    const inside = Math.hypot(target.x - f.x, target.y - f.y) <= ult.aura.radius + target.radius;
    if (!inside) return;

    f.state.auraTick -= dt;
    if (f.state.auraTick <= 0) {
      f.state.auraTick = ult.aura.tickInterval;
      game.damage(target, ult.aura.tickDamage, f, { kind: 'aura', silent: true });
      target.applyDot(
        {
          damage: Math.max(1, Math.round(f.stacks / 2.4)),
          interval: 1,
          duration: f.stacks,
          source: f,
          tint: { color: '#f97316', alpha: 0.72 },
        },
        now,
      );
    }
  },

  /** Cercle brûlant au sol + ailes de flammes, derrière le corps. */
  drawUnder(ctx, f, game, now) {
    if (f.ult.active <= 0) return;
    const aura = f.el.ultimate.aura;
    const fade = Math.min(1, f.ult.active / 0.6);
    const g = ctx.createRadialGradient(f.x, f.y, f.radius, f.x, f.y, aura.radius);
    g.addColorStop(0, `rgba(249,115,22,${0.3 * fade})`);
    g.addColorStop(1, 'rgba(249,115,22,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, aura.radius, 0, TAU);
    ctx.fill();
    this.drawWings(ctx, f, now);
  },

  /** Ailes de flammes : deux éventails qui battent de part et d'autre. */
  drawWings(ctx, f, now) {
    const w = f.el.ultimate.wings;
    const flap = 0.22 * Math.sin(now * w.flap);
    const r = f.radius;

    ctx.save();
    ctx.translate(f.x, f.y);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(1, side);
      ctx.rotate(flap);
      for (let i = 0; i < 4; i++) {
        const t = i / 3;
        const len = r * w.span * (1 - 0.18 * i);
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, 0);
        ctx.quadraticCurveTo(-r * 0.9, -len * 0.55 - t * 8, -r * 0.15 - len, -len * 0.28 - t * 6);
        ctx.quadraticCurveTo(-r * 0.5, -len * 0.2, -r * 0.2, 0);
        ctx.fillStyle = i % 2 ? w.core : w.color;
        ctx.globalAlpha = 0.85 - i * 0.15;
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  },

  drawOver() {},

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },
};
