/**
 * Pouvoirs de la LUMIÈRE.
 *
 * Le kit est celui d'un **contre-attaquant** : la Lumière ne commence pas
 * forte, elle le devient en encaissant.
 *
 *  • Égide (passif) — un bouclier permanent absorbe les coups, riposte 1 PV,
 *    et surtout **convertit chaque coup encaissé en puissance** : +1 aux
 *    dégâts du marteau (« Shield Damage ») et +300 à son recul
 *    (« Knockback »). Les deux compteurs du HUD sont donc un compteur de
 *    coups encaissés, pas de coups portés.
 *
 *  • Piège radiant (ultime) — le double trait doré de la vidéo : il relie la
 *    Lumière à sa cible, la teinte de sa propre couleur, la ralentit
 *    fortement, la tire vers elle et la draine d'1 PV par seconde.
 *
 * Relevé image par image (voir docs/FICHES.md) : la Lumière tient 11 s à
 * 100 PV sous les coups pendant que ses compteurs montent, ses dégâts d'arme
 * valent exactement la stat affichée, et les dégâts de zone (blizzard) ne
 * font monter aucun compteur.
 *
 * @module game/abilities/light
 */

import { clamp } from '../../core/math.js';

export const turtleAbilities = {
  id: 'turtle',

  init(f) {
    const shield = f.el.ability.shield;
    f.shieldMax = shield.capacity(f);
    f.shield = f.shieldMax;
    f.state.regenDelay = 0;
    f.state.reflectCd = 0;
    f.state.gainCd = 0;
    f.state.snareTick = 0;
  },

  update(f, dt, now, game) {
    const el = f.el;
    const shield = el.ability.shield;

    /* ---------- bouclier ---------- */
    f.shieldMax = shield.capacity(f);
    f.state.regenDelay = Math.max(0, f.state.regenDelay - dt);
    f.state.reflectCd = Math.max(0, f.state.reflectCd - dt);
    f.state.gainCd = Math.max(0, f.state.gainCd - dt);
    if (f.state.regenDelay <= 0 && f.shield < f.shieldMax) {
      f.shield = Math.min(f.shieldMax, f.shield + shield.regen * dt);
    }

    /* ---------- ultime ---------- */
    const ult = el.ultimate;
    if (f.ult.active > 0) {
      f.ult.active -= dt;
      this.tickSnare(f, dt, now, game);
      if (f.ult.active <= 0) {
        f.ult.active = 0;
        f.ult.charge = 0;
        f.ult.ready = false;
      }
    } else if (game.phase === 'fight') {
      f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castSnare(f, game);
    }

    /* ---------- rechargement complet périodique de l'Égide ----------
       L'Égide n'a pas d'incantation visible dans les vidéos : ce « sort »
       ne fait que remplir le pool d'un coup, avec un bref éclat doré. */
    if (game.phase !== 'fight') return;
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) {
      f.shield = f.shieldMax;
      f.state.regenDelay = 0;
      game.fx.ring(f.x, f.y, f.radius, f.radius * 1.8, 0.4, 'rgba(250,220,60,0.75)', 5, true);
      f.ability.timer = el.ability.cooldown;
    }
  },

  /**
   * Absorption, riposte et **montée en puissance**. Appelé par Match avant
   * que les PV ne bougent.
   * @returns {number} dégâts restants après absorption
   */
  onDamage(f, amount, source, opts, game) {
    const shield = f.el.ability.shield;
    f.state.regenDelay = shield.regenDelay;
    if (amount <= 0) return amount;

    // Un coup franc (arme, projectile, mine, chaîne) nourrit les compteurs.
    // Les dégâts de zone ou sur la durée n'y changent rien — vérifié sur un
    // blizzard qui a coûté 30 PV à la Lumière sans faire bouger la stat.
    const counted = shield.countedKinds.includes(opts.kind ?? '') && f.state.gainCd <= 0;
    if (counted) {
      f.state.gainCd = shield.gainCooldown;
      const g = shield.gainOnHit;
      f.stacks = Math.min(g.stackMax, f.stacks + g.stack);
      f.stacks2 = Math.min(g.stack2Max, f.stacks2 + g.stack2);
      game.fx.burst(f.x, f.y, 6, { color: ['#facc15', '#ffffff'], speed: 150, size: 4, life: 0.35 });

      // riposte : 1 PV rendu à l'attaquant
      if (source && source !== f && source.alive && opts.kind !== 'reflect' && f.state.reflectCd <= 0) {
        f.state.reflectCd = shield.reflectCooldown;
        game.damage(source, shield.reflect, f, { kind: 'reflect', x: source.x, y: source.y });
      }
    }

    if (f.shield <= 0) return amount;
    const absorbed = Math.min(f.shield, amount);
    f.shield -= absorbed;
    game.fx.ring(f.x, f.y, f.radius, f.radius * 1.5, 0.25, 'rgba(255,255,255,0.85)', 5, true);
    return amount - absorbed;
  },

  castSnare(f, game) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.state.snareTick = 0;
    game.fx.ring(f.x, f.y, 20, 240, 0.5, 'rgba(250,220,60,0.9)', 8, true);
    game.shake(5, 0.3);
  },

  tickSnare(f, dt, now, game) {
    const s = f.el.ultimate.snare;
    const target = f.opponent;
    if (!target || !target.alive) return;

    target.applySlow(s.slow, 0.2, now);
    // pas de teinte sur la cible : sur la vidéo, c'est la Lumière qui s'allume
    if (s.tint) target.applyTint(s.tint, 0.2, now, s.tintAlpha ?? 1);

    // le trait tire la cible vers la Lumière
    const dx = f.x - target.x;
    const dy = f.y - target.y;
    target.push(dx, dy, s.pull * dt * 60);

    f.state.snareTick -= dt;
    if (f.state.snareTick <= 0) {
      f.state.snareTick = s.tickInterval;
      game.damage(target, s.tickDamage, f, { kind: 'snare', silent: true });
      game.fx.burst(target.x, target.y, 4, { color: '#facc15', speed: 120, size: 4, life: 0.3 });
    }
  },

  drawUnder() {},

  /** Double trait doré, dessiné au-dessus des combattants. */
  drawOver(ctx, f, game, now) {
    if (f.ult.active <= 0) return;
    const s = f.el.ultimate.snare;
    const target = f.opponent;
    if (!target || !target.alive) return;

    const dx = target.x - f.x;
    const dy = target.y - f.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const pulse = 0.85 + 0.15 * Math.sin(now * 12);

    ctx.save();
    ctx.lineCap = 'butt';
    // halo
    ctx.strokeStyle = s.glow;
    ctx.lineWidth = (s.width + s.gap) * 2.1 * pulse;
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    // deux rails dorés
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width * 0.5;
    for (const side of [-1, 1]) {
      const ox = nx * s.gap * side;
      const oy = ny * s.gap * side;
      ctx.beginPath();
      ctx.moveTo(f.x + ox, f.y + oy);
      ctx.lineTo(target.x + ox, target.y + oy);
      ctx.stroke();
    }
    ctx.restore();
  },

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },
};
