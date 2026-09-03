/**
 * COLOSSE — la masse comme arme.
 *
 *  • **Le pavois suit le cap.** La fiche porte `weapon.spin = 0` et ce module
 *    recopie `heading` — comme la lance du Lancier. Un bouclier ne vise pas, il
 *    se met devant ; c'est aussi ce qui l'exempte du piège de l'arme braquée,
 *    puisqu'il ne pointe jamais volontairement l'adversaire.
 *
 *  • **Élan** (`f.stacks`) — monte tant qu'il avance droit, retombe dès qu'il
 *    tourne sec, touche un mur ou percute un corps. Première stat du dépôt qui
 *    dépende de la **géométrie de l'arène**.
 *
 *  • **Charge d'épaule** — le contact des corps blesse, proportionnellement à
 *    l'élan. Seul combattant qui inflige des dégâts sans arme. Il porte son
 *    propre verrou, exactement comme `weaponHit` en pose un pour les armes :
 *    sans lui un contact prolongé blesserait 120 fois par seconde.
 *
 *  • **Ruée** (`special`) — vitesse ×1,8 et l'élan ne retombe plus, murs
 *    compris. **Séisme** (ultime) — il se plante et envoie une onde qui
 *    traverse l'arène et ralentit longuement.
 *
 * @module game/abilities/colossus
 */

import { clamp, dist, wrapAngle } from '../../core/math.js';

export const colossusAbilities = {
  id: 'colossus',

  init(f) {
    /** Cap de l'image précédente : c'est la comparaison avec lui qui dit s'il
     *  va droit. Initialisé au cap de départ, sinon la première image compte
     *  un virage qui n'a pas eu lieu. */
    f.state.lastHeading = f.heading;
    f.state.slamCd = 0;
    /** Rayon courant de l'onde de Séisme ; 0 = pas d'onde. */
    f.state.quakeR = 0;
    f.state.quakeHit = false;
    /** Compteur du troisième créneau, même forme que le Blizzard. */
    f.state.spec = 0;
    f.state.specCd = f.el.special.first;
    f.state.specSpan = f.el.special.first;
  },

  update(f, dt, now, game) {
    const el = f.el;
    const sp = el.special;
    const target = f.opponent;

    /* ---------- le pavois se met devant ---------- */
    f.weaponAngle = f.heading;

    if (game.phase !== 'fight' || !f.onStage) return;

    /* ---------- Ruée ---------- */
    const stampeding = f.state.spec > 0;
    if (stampeding) {
      f.state.spec -= dt;
      if (f.state.spec <= 0) {
        f.state.spec = 0;
        f.state.specCd = sp.cooldown;
        f.state.specSpan = sp.cooldown;
      }
    } else {
      f.state.specCd -= dt;
      if (f.state.specCd <= 0) f.state.spec = sp.duration;
    }

    /* ---------- Séisme ---------- */
    this.updateQuake(f, dt, now, game);
    const rooted = f.ult.active > 0;

    /**
     * `boost` est **réécrit à chaque image** : le moteur le décompte, donc il
     * faut le retenir tant que l'état dure. Le Séisme l'emporte sur la Ruée —
     * il se plante, et rien ne le fait courir pendant qu'il frappe le sol.
     */
    if (rooted) {
      f.boost = Math.max(f.boost, dt * 2);
      f.boostFactor = 0;
    } else if (stampeding) {
      f.boost = Math.max(f.boost, dt * 2);
      f.boostFactor = sp.speedBonus;
    }

    /* ---------- Élan ---------- */
    this.updateMomentum(f, dt, stampeding);

    /* ---------- charge d'épaule ---------- */
    f.state.slamCd = Math.max(0, f.state.slamCd - dt);
    if (target && target.onStage && !rooted) this.trySlam(f, target, now, game);
  },

  /**
   * L'élan monte en ligne droite et retombe autrement.
   *
   * Le cap est comparé **d'une image à l'autre** puis ramené à la seconde :
   * comparer des écarts bruts ferait dépendre le seuil du pas de simulation,
   * et le pas n'est pas le même à l'export vidéo qu'à l'écran.
   */
  updateMomentum(f, dt, stampeding) {
    const m = f.el.ability.momentum;
    const turned = Math.abs(wrapAngle(f.heading - f.state.lastHeading)) / dt;
    f.state.lastHeading = f.heading;

    // Pendant la Ruée, ni les murs ni les virages ne cassent l'élan : c'est
    // exactement ce que le pouvoir achète.
    const broke = !stampeding && (turned > m.turnTolerance || f.wall !== null);
    if (broke) {
      f.stacks = Math.min(f.stacks, m.max * m.keepOnBreak);
      return;
    }
    f.stacks = clamp(f.stacks + m.rise * dt, 0, m.max);
  },

  /**
   * Le contact des corps blesse. `resolveBodies` a déjà séparé et poussé les
   * deux corps au prorata des masses ; ici on ne fait qu'ajouter le dégât et
   * la projection, et **casser son propre élan** — un choc l'arrête aussi.
   */
  trySlam(f, target, now, game) {
    if (f.state.slamCd > 0) return;
    const s = f.el.ability.slam;
    if (f.stacks < s.min) return;
    if (dist(f.x, f.y, target.x, target.y) > f.radius + target.radius) return;

    const dmg = Math.max(1, Math.round(f.stacks * s.damagePer));
    game.damage(target, dmg, f, { kind: 'slam', x: target.x, y: target.y });
    const nx = (target.x - f.x) || 1;
    const ny = target.y - f.y;
    target.push(nx, ny, s.knockback);
    f.state.slamCd = s.cooldown;
    f.stacks = f.el.ability.momentum.max * f.el.ability.momentum.keepOnBreak;

    game.fx.burst(target.x, target.y, 14, {
      color: ['#d9a441', '#8b96a7', '#ffffff'],
      speed: 260,
      size: 5,
      life: 0.45,
    });
    game.shake(4, 0.22);
  },

  /**
   * L'onde du Séisme **voyage** : son rayon s'ouvre pendant toute la durée de
   * l'ultime, et elle ne blesse qu'à l'instant où elle dépasse l'adversaire.
   * C'est ce qui la distingue d'une explosion — un adversaire loin est touché
   * plus tard, ou pas du tout s'il sort du duel entre-temps.
   */
  updateQuake(f, dt, now, game) {
    const ult = f.el.ultimate;
    const q = ult.quake;

    if (f.ult.active > 0) {
      f.ult.active -= dt;
      const k = clamp(1 - f.ult.active / ult.duration, 0, 1);
      const prev = f.state.quakeR;
      f.state.quakeR = q.from + (q.to - q.from) * k;

      const target = f.opponent;
      if (!f.state.quakeHit && target && target.onStage) {
        const d = dist(f.x, f.y, target.x, target.y);
        if (prev < d && f.state.quakeR >= d) {
          f.state.quakeHit = true;
          game.damage(target, q.damage, f, { kind: 'quake', x: target.x, y: target.y });
          target.applySlow(q.slow, q.slowDuration, now);
        }
      }

      if (f.ult.active <= 0) {
        f.ult.active = 0;
        f.ult.charge = 0;
        f.ult.ready = false;
        f.state.quakeR = 0;
      }
      return;
    }

    if (game.phase !== 'fight') return;
    f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
    f.ult.ready = f.ult.charge >= 100;
    if (f.ult.ready) this.castQuake(f, game);
  },

  castQuake(f, game) {
    const ult = f.el.ultimate;
    const q = ult.quake;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.state.quakeR = q.from;
    f.state.quakeHit = false;
    // L'élan part avec le coup : il s'arrête pour frapper le sol.
    f.stacks = 0;
    game.fx.ring(f.x, f.y, q.from, q.to, ult.duration, q.color, q.width, false);
    game.shake(q.shake, 0.5);
  },

  /**
   * Traces au sol : deux bandes derrière lui, d'autant plus marquées que
   * l'élan est haut. C'est la seule lecture de l'élan en dehors du HUD.
   *
   * Rendu pur — aucun tirage, la position vient du cap courant.
   */
  drawUnder(ctx, f) {
    if (!f.onStage) return;
    const m = f.el.ability.momentum;
    const k = clamp(f.stacks / m.max, 0, 1);
    if (k <= 0.05) return;

    const back = f.heading + Math.PI;
    const bx = Math.cos(back);
    const by = Math.sin(back);
    const nx = -by;
    const ny = bx;
    const len = f.radius * (1.2 + 2.4 * k);

    ctx.save();
    ctx.globalAlpha = 0.1 + 0.35 * k;
    ctx.strokeStyle = f.el.look.accent;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      const ox = nx * side * f.radius * 0.55;
      const oy = ny * side * f.radius * 0.55;
      ctx.beginPath();
      ctx.moveTo(f.x + ox, f.y + oy);
      ctx.lineTo(f.x + ox + bx * len, f.y + oy + by * len);
      ctx.stroke();
    }
    ctx.restore();
  },

  /** L'onde du Séisme, par-dessus tout le reste : c'est elle qu'on doit voir. */
  drawOver(ctx, f) {
    if (f.ult.active <= 0 || f.state.quakeR <= 0) return;
    const q = f.el.ultimate.quake;
    const k = clamp(1 - f.ult.active / f.el.ultimate.duration, 0, 1);
    ctx.save();
    ctx.globalAlpha = 1 - k * 0.8;
    ctx.strokeStyle = q.color;
    ctx.lineWidth = q.width * (1 - k * 0.5);
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.state.quakeR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },

  specialBar(f) {
    const sp = f.el.special;
    if (f.state.spec > 0) return { value: f.state.spec / sp.duration, active: true };
    return { value: 1 - clamp(f.state.specCd / f.state.specSpan, 0, 1), active: false };
  },
};
