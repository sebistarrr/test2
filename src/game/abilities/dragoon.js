/**
 * Pouvoirs du DRAGOON — relevés sur « Dragoon vs Outlaw ».
 *
 *  • Furie du lancier — passif : la stat « Damage » du HUD monte à chaque
 *    touche portée. Rien à faire ici, c'est `weapon.melee.onHit.stackGain`
 *    qui l'applique (comme les piles de l'Araignée).
 *
 *  • BOND (JUMP) — ultime. Le seul pouvoir du jeu qui **retire son porteur de
 *    l'arène** : le Dragoon prend son élan (0,45 s), disparaît une seconde et
 *    demie, puis retombe sur l'adversaire. Pendant le vol, un disque gris suit
 *    la cible : il enfle au sommet du bond puis se resserre — c'est le
 *    resserrement qui annonce la chute. L'impact frappe pour les dégâts
 *    courants de la lance et fait monter la stat comme une touche normale.
 *
 * Déterminisme : tout ce qui est ici tourne dans le fil de simulation, donc
 * l'aléa passe par `game.rng` (jamais `viewRng`), et le marqueur est purement
 * géométrique — il ne tire aucun nombre.
 *
 * @module game/abilities/dragoon
 */

import { TAU, clamp } from '../../core/math.js';
import { ARENA } from '../../data/tuning.js';

export const dragoonAbilities = {
  id: 'dragoon',

  /** @param {import('../fighter.js').Fighter} f */
  init(f) {
    // 'ground' | 'windup' | 'flight' — le vol est le seul état où le Dragoon
    // quitte le plateau (voir Fighter.offstage)
    f.state.jump = 'ground';
    f.state.jumpTimer = 0;
    /** Position du marqueur (suit l'adversaire) + son rayon courant. */
    f.state.mark = null;
  },

  /**
   * @param {import('../fighter.js').Fighter} f
   * @param {number} dt
   * @param {number} now
   * @param {import('../match.js').Match} game
   */
  update(f, dt, now, game) {
    const ult = f.el.ultimate;

    if (f.ult.active > 0) {
      f.ult.active -= dt;
      f.state.jumpTimer += dt;
      if (f.state.jump === 'windup' && f.state.jumpTimer >= ult.windup) this.takeOff(f, game);
      if (f.state.jump === 'flight') {
        this.trackMark(f, ult);
        if (f.ult.active <= 0) this.land(f, game);
      }
      return;
    }

    if (game.phase !== 'fight') return;
    f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
    f.ult.ready = f.ult.charge >= 100;
    if (f.ult.ready) this.castJump(f, game);
  },

  /* ------------------------------------------------------------------ */

  /** Élan : le Dragoon reste au sol, mais la jauge se vide déjà (mesuré). */
  castJump(f, game) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.ult.charge = 0;
    f.state.jump = 'windup';
    f.state.jumpTimer = 0;
    game.fx.burst(f.x, f.y, 16, {
      color: [f.el.look.accent, f.el.look.body, '#ffffff'],
      speed: 240,
      size: 5,
      life: 0.4,
    });
  },

  /** Décollage : le Dragoon quitte le plateau pour toute la durée du vol. */
  takeOff(f, game) {
    const ult = f.el.ultimate;
    f.state.jump = 'flight';
    f.state.jumpTimer = 0;
    // marge de sécurité : c'est `land()` qui remet le Dragoon sur le plateau,
    // le décompte de `offstage` ne doit surtout pas l'y ramener avant
    f.offstage = ult.flight + 0.1;
    // il ne peut plus être touché : il n'est plus là
    f.invulnerable = Math.max(f.invulnerable, ult.flight + 0.1);
    f.impulseX = 0;
    f.impulseY = 0;
    const target = f.opponent;
    f.state.mark = { x: target?.x ?? f.x, y: target?.y ?? f.y, r: f.radius };
    // gerbe de poussière au point de décollage
    game.fx.burst(f.x, f.y, 20, {
      color: [f.el.look.body, '#cfc2f0', '#ffffff'],
      speed: 380,
      size: 6,
      life: 0.5,
    });
    game.shake(5, 0.25);
  },

  /**
   * Le marqueur colle à l'adversaire et respire : il enfle sur la première
   * moitié du vol, se resserre sur la seconde jusqu'au rayon d'atterrissage.
   */
  trackMark(f, ult) {
    const target = f.opponent;
    const mark = f.state.mark;
    if (!mark) return;
    if (target && target.alive) {
      mark.x = target.x;
      mark.y = target.y;
    }
    const t = clamp(f.state.jumpTimer / ult.flight, 0, 1);
    const m = ult.marker;
    // montée : rayon → grow ; descente : grow → land
    const k = t < 0.5 ? t / 0.5 : 1;
    const up = f.radius + (m.grow * f.radius - f.radius) * k;
    mark.r = t < 0.5 ? up : up + (m.land * f.radius - up) * ((t - 0.5) / 0.5);
  },

  /** Chute : le Dragoon retombe sur le marqueur et frappe autour de lui. */
  land(f, game) {
    const ult = f.el.ultimate;
    const imp = ult.impact;
    const inner = ARENA.inner;
    const mark = f.state.mark;

    f.state.jump = 'ground';
    f.ult.active = 0;
    f.offstage = 0;
    f.state.mark = null;

    if (mark) {
      f.x = clamp(mark.x, inner.left + f.radius, inner.right - f.radius);
      f.y = clamp(mark.y, inner.top + f.radius, inner.bottom - f.radius);
    }

    const target = f.opponent;
    if (target && target.alive) {
      const dx = target.x - f.x;
      const dy = target.y - f.y;
      const d = Math.hypot(dx, dy);
      if (d <= imp.radius + target.radius) {
        const len = d || 1;
        // mêmes dégâts que la lance à cet instant, et la stat monte comme
        // après une touche normale (mesuré : 100 → 90 PV puis « Damage: 12 »)
        const melee = f.el.weapon.melee;
        const dmg = typeof melee.damage === 'function' ? melee.damage(f) : melee.damage;
        game.damage(target, dmg, f, {
          kind: 'melee',
          x: target.x,
          y: target.y,
          nx: dx / len,
          ny: dy / len,
          knockback: imp.knockback,
        });
        // même comptabilité que `Match.resolveMelee` : la chute est une touche
        f.stacks += melee.onHit?.stackGain ?? 0;
        if (melee.onHit?.stackMax) f.stacks = Math.min(f.stacks, melee.onHit.stackMax);
      }
    }

    // mise en scène de l'impact : onde grise, éclat blanc, éclats indigo
    game.fx.ring(f.x, f.y, f.radius, imp.ring.to, imp.ring.time, imp.ring.color, imp.ring.width, true);
    game.fx.ring(f.x, f.y, f.radius * 0.5, imp.radius, 0.22, 'rgba(212,150,168,0.75)', 14, true);
    game.fx.burst(f.x, f.y, imp.sparks, {
      color: [f.el.look.body, f.el.look.accent, '#cfc2f0', '#ffffff'],
      speed: 520,
      size: 7,
      life: 0.7,
    });
    game.flair.flash = 0.18;
    game.flair.flashMax = 0.18;
    game.flair.flashColor = imp.flash;
    game.shake(imp.shake, 0.4);
  },

  /* ---------- rendu ---------- */

  /** Marqueur au sol : sous les combattants, jamais devant. */
  drawUnder(ctx, f) {
    const mark = f.state.mark;
    if (!mark || f.state.jump !== 'flight') return;
    const m = f.el.ultimate.marker;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mark.x, mark.y, mark.r, 0, TAU);
    ctx.fillStyle = m.fill;
    ctx.fill();
    ctx.lineWidth = m.edgeWidth;
    ctx.strokeStyle = m.edge;
    ctx.stroke();
    ctx.restore();
  },

  drawOver() {},

  /**
   * Jauge : elle se vide d'un coup à l'élan et reste à zéro tout le bond,
   * exactement comme sur la vidéo (vidée à 10,60 s, immobile jusqu'à 13,03 s).
   */
  barValue(f) {
    if (f.ult.active > 0) return 0;
    return f.ult.charge / 100;
  },
};
