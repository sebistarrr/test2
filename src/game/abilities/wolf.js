/**
 * Pouvoirs de l'OMBRE.
 *
 *  • Pas d'ombre (Shadow Step) — téléportation courte + volée de 3 traits.
 *    Le cooldown affiché démarre à 3 s et se raccourcit de 0,2 s à chaque
 *    utilisation jusqu'à 0,7 s (exactement la progression lue sur la vidéo).
 *
 *  • Lien d'essence (Essence Tether) — ultime : dôme d'ombre figé sur place
 *    + rayon qui draine 1 PV toutes les ~0,3 s et ralentit la cible.
 *
 * @module game/abilities/shadow
 */

import { TAU, clamp } from '../../core/math.js';
import { ARENA } from '../../data/tuning.js';

export const wolfAbilities = {
  id: 'wolf',

  /** @param {import('../fighter.js').Fighter} f */
  init(f) {
    f.state.domeSparks = [];
    f.state.tetherTick = 0;
    f.state.dome = null;
  },

  /**
   * @param {import('../fighter.js').Fighter} f
   * @param {number} dt
   * @param {number} now
   * @param {import('../match.js').Match} game
   */
  update(f, dt, now, game) {
    const el = f.el;

    /* ---------- ultime : charge, activation, entretien ---------- */
    const ult = el.ultimate;
    if (f.ult.active > 0) {
      f.ult.active -= dt;
      this.tickTether(f, dt, now, game);
      if (f.ult.active <= 0) {
        f.ult.active = 0;
        f.state.dome = null;
        f.ult.charge = 0;
        f.ult.ready = false;
      }
    } else if (game.phase === 'fight') {
      f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castTether(f, game);
    }

    /* ---------- pouvoir : Pas d'ombre ---------- */
    if (game.phase !== 'fight') return;
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) this.castStep(f, game);
  },

  /* ------------------------------------------------------------------ */

  /** @param {import('../fighter.js').Fighter} f */
  castStep(f, game) {
    const a = f.el.ability;
    const fx = game.fx;
    const inner = ARENA.inner;

    const fromX = f.x;
    const fromY = f.y;
    // saut dans la direction de course, ramené dans l'arène
    const nx = clamp(f.x + Math.cos(f.heading) * a.blink.distance, inner.left + f.radius, inner.right - f.radius);
    const ny = clamp(f.y + Math.sin(f.heading) * a.blink.distance, inner.top + f.radius, inner.bottom - f.radius);

    // images fantômes le long de la trajectoire
    for (let i = 0; i <= a.blink.ghosts; i++) {
      const t = i / a.blink.ghosts;
      fx.ghost(
        fromX + (nx - fromX) * t,
        fromY + (ny - fromY) * t,
        f.radius * (1 - 0.25 * t),
        f.el.look.trail.color,
        f.el.look.trail.life + t * 0.1,
      );
    }
    fx.burst(fromX, fromY, 14, { color: [f.el.look.accent, '#2e1065', '#ffffff'], speed: 260, size: 5, life: 0.45 });

    f.x = nx;
    f.y = ny;
    f.invulnerable = a.blink.invulnerable;
    f.boost = a.blink.boostDuration;
    f.boostFactor = a.blink.speedBoost;

    // volée de traits dans l'axe du saut — comme sur la vidéo, les traits
    // partent tout droit et ne sont pas guidés sur l'adversaire
    const base = f.heading;
    const n = a.volley.count;
    for (let i = 0; i < n; i++) {
      const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * a.volley.spread * 2;
      game.projectiles.spawn(f, a.volley.projectile, base + off);
    }
    fx.burst(f.x, f.y, 10, { color: [f.el.look.accent, '#ffffff'], speed: 200, size: 4, life: 0.35, dir: base, spread: 1.2 });

    // le cooldown se raccourcit à chaque utilisation (progression mesurée)
    f.ability.uses++;
    f.ability.cooldown = Math.max(a.cooldownFloor, f.ability.cooldown - a.cooldownStep);
    f.ability.timer = f.ability.cooldown;
  },

  /** @param {import('../fighter.js').Fighter} f */
  castTether(f, game) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.state.tetherTick = 0;
    f.state.dome = { x: f.x, y: f.y, r: ult.dome.radius, born: game.time };

    // poussière violette en suspension dans le dôme
    f.state.domeSparks = [];
    for (let i = 0; i < ult.dome.sparks; i++) {
      const ang = game.rng.range(0, TAU);
      const rad = Math.sqrt(game.rng.next()) * ult.dome.radius;
      f.state.domeSparks.push({
        x: f.state.dome.x + Math.cos(ang) * rad,
        y: f.state.dome.y + Math.sin(ang) * rad,
        vx: game.rng.spread(16),
        vy: game.rng.spread(16),
        size: game.rng.range(2, 4),
        color: game.rng.pick(ult.dome.sparkColors),
      });
    }
    game.fx.ring(f.x, f.y, 10, ult.dome.radius, 0.45, ult.dome.edge, 8, true);
    game.shake(6, 0.35);
  },

  /** Entretien du lien pendant l'ultime. */
  tickTether(f, dt, now, game) {
    const t = f.el.ultimate.tether;
    const target = f.opponent;
    if (!target || !target.alive) return;

    // dérive de la poussière du dôme
    const dome = f.state.dome;
    if (dome) {
      for (const s of f.state.domeSparks) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const dx = s.x - dome.x;
        const dy = s.y - dome.y;
        if (dx * dx + dy * dy > dome.r * dome.r) {
          // ré-injection au centre pour garder une densité constante
          const ang = game.rng.range(0, TAU);
          const rad = Math.sqrt(game.rng.next()) * dome.r * 0.8;
          s.x = dome.x + Math.cos(ang) * rad;
          s.y = dome.y + Math.sin(ang) * rad;
        }
      }
    }

    target.applySlow(t.slow, 0.2, now);

    f.state.tetherTick -= dt;
    if (f.state.tetherTick <= 0) {
      f.state.tetherTick = t.tickInterval;
      game.damage(target, t.tickDamage, f, { kind: 'tether', silent: true });
      // particules qui remontent le lien vers l'Ombre
      const steps = 3;
      for (let i = 0; i < steps; i++) {
        const k = game.rng.next();
        game.fx.spawn({
          kind: 'dot',
          x: target.x + (f.x - target.x) * k,
          y: target.y + (f.y - target.y) * k,
          vx: (f.x - target.x) * 0.5,
          vy: (f.y - target.y) * 0.5,
          life: 0.35,
          size: 3,
          color: t.core,
          drag: 1.5,
        });
      }
    }
  },

  /* ---------- rendu ---------- */

  drawUnder() {},

  /**
   * Dôme : dessiné **hors du cadre de l'arène**, il la déborde largement —
   * dans la vidéo il recouvre le bas de l'écran jusqu'au HUD.
   */
  drawUnbounded(ctx, f, game) {
    const dome = f.state.dome;
    if (!dome || f.ult.active <= 0) return;
    const d = f.el.ultimate.dome;
    const fade = Math.min(1, f.ult.active / 0.5);

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.arc(dome.x, dome.y, dome.r, 0, TAU);
    ctx.fillStyle = d.fill;
    ctx.fill();
    ctx.lineWidth = d.edgeWidth;
    ctx.strokeStyle = d.edge;
    ctx.stroke();

    // poussière
    ctx.clip();
    for (const s of f.state.domeSparks) {
      ctx.fillStyle = s.color;
      ctx.globalAlpha = fade * 0.85;
      ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    }
    ctx.restore();
  },

  /** Rayon de drain : au-dessus des combattants. */
  drawOver(ctx, f, game, now) {
    if (f.ult.active <= 0) return;
    const t = f.el.ultimate.tether;
    const target = f.opponent;
    if (!target || !target.alive) return;

    const pulse = 0.75 + 0.25 * Math.sin(now * 18);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = t.color;
    ctx.lineWidth = t.width * pulse;
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.strokeStyle = t.core;
    ctx.lineWidth = Math.max(1, t.width * 0.25);
    ctx.stroke();
    ctx.restore();
  },

  /** Valeur de la jauge : remplissage puis vidange pendant l'ultime. */
  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },
};
