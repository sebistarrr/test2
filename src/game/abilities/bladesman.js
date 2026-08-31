/**
 * Pouvoirs du BRETTEUR.
 *
 *  • Surchauffe — la lame accélère toute seule (+0,21 tour/s par seconde) et
 *    gagne +0,15 par coup porté, sans jamais franchir le plafond de 3,00 ni
 *    passer sous le plancher de 0,80. Une fois au plafond elle y tient un
 *    palier d'environ 1,8 s, puis s'effondre à −3,0/s jusqu'au plancher et le
 *    cycle repart. Quatre cycles complets sont visibles sur la vidéo :
 *    plafonds vers les images 231, 441, 681, 951.
 *
 *    **Ce qui déclenche l'effondrement n'est pas identifiable sur la vidéo** :
 *    il ne coïncide ni avec BLADE RUSH, ni avec le début ou la fin de HIGH
 *    NOON. La surchauffe après palier reproduit exactement la courbe relevée,
 *    mais c'est un `calé`, pas un `mesuré`.
 *
 *    La fiche ne porte que le **plancher** (`weapon.spin`), appliqué par
 *    `Fighter.step` comme pour tout le roster ; ce module n'ajoute que le
 *    surplus, au même facteur de ralentissement, pour que la lame réagisse
 *    aux contrôles adverses comme les autres armes.
 *
 *  • Ruée de lame / BLADE RUSH (ultime) — 1,5 s minutées. Le verrou entre deux
 *    touches tombe de 1 000 ms à 115 ms et l'éventail vert s'ouvre de 1,6 rad
 *    à 3,0 rad. Deux régimes séparés par la portée de lame : **loin**, cap
 *    asservi sur l'adversaire à pleine vitesse ; **à portée**, la lame
 *    **orbite** — foncer droit dessus traverse la zone utile en une centaine
 *    de millisecondes.
 *
 *    La ruée a **un seul point de sortie**, `endRush()`, qui remet ensemble la
 *    vitesse, le pilotage et l'ouverture de l'éventail. Tant que ces remises à
 *    zéro étaient dispersées, une fin de partie en pleine ruée laissait
 *    l'éventail large accroché derrière la lame.
 *
 *  • Rage infernale — pouvoir **greffé**, demandé, sur le même patron que le
 *    Blizzard du Hors-la-loi et le Lien d'essence du Lancier : une horloge
 *    propre (`f.state.spec`), sans rapport avec la jauge de BLADE RUSH, qui
 *    reste intacte. Nova, ailes de flammes et aura brûlante sont repris de
 *    `abilities/fire.js`, dont c'est l'ultime d'origine.
 *
 * @module game/abilities/bladesman
 */

import { TAU, clamp, wrapAngle } from '../../core/math.js';

export const bladesmanAbilities = {
  id: 'bladesman',

  init(f) {
    f.state.plateau = 0; // temps passé au plafond
    f.state.overheat = false; // true = la lame s'effondre vers le plancher
    f.state.rush = false;
    // Rage infernale : minuterie propre, sans rapport avec la jauge d'ultime
    f.state.spec = 0; // secondes restantes de Rage infernale active
    f.state.specCd = f.el.special.first;
    /** Longueur de la fenêtre d'attente en cours — voir `outlaw.js`, même
     *  champ pour la même raison : la **première** vaut `first`, pas
     *  `cooldown`, sinon la jauge démarre déjà aux deux tiers. */
    f.state.specSpan = f.el.special.first;
    f.state.rageAuraTick = 0;
  },

  update(f, dt, now, game) {
    const el = f.el;
    this.tickSpin(f, dt, now);

    /* ---------- ultime --------------------------------------------------- */
    const ult = el.ultimate;
    if (f.ult.active > 0) {
      f.ult.active -= dt;
      this.steerRush(f, dt);
      if (f.ult.active <= 0) this.endRush(f);
    } else if (game.phase === 'fight') {
      // mesuré : cycles de 273, 214 et 333 images — une horloge de 9 s seule
      // ne les explique pas, la charge suit aussi les coups portés
      f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castRush(f, game);
    }

    if (game.phase === 'fight') this.tickInfernalRage(f, dt, now, game);
  },

  /**
   * Courbe de rotation : montée passive, palier au plafond, effondrement.
   * `f.stacks` est la vitesse en tours/s — c'est la stat `Spin Speed` du HUD,
   * et la seule source des dégâts (`Damage = 2 × Spin`, jamais stocké).
   */
  tickSpin(f, dt, now) {
    const s = f.el.ability.spin;

    if (f.state.overheat) {
      f.stacks -= s.collapse * dt;
      if (f.stacks <= s.floor) {
        f.stacks = s.floor;
        f.state.overheat = false;
        f.state.plateau = 0;
      }
    } else {
      f.stacks = Math.min(s.ceiling, f.stacks + s.rise * dt);
      if (f.stacks >= s.ceiling) {
        f.state.plateau += dt;
        if (f.state.plateau >= f.el.ability.cooldown) f.state.overheat = true;
      } else {
        f.state.plateau = 0;
      }
    }

    // `Fighter.step` a déjà appliqué le plancher ; on n'ajoute que le surplus,
    // au même facteur de ralentissement, sens de rotation compris.
    const extra = (f.stacks - s.floor) * TAU;
    if (extra > 0) {
      f.weaponAngle = wrapAngle(f.weaponAngle + extra * f.spinDir * f.slowFactor(now) * dt);
    }
  },

  castRush(f, game) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.state.rush = true;
    f.boost = ult.duration;
    f.boostFactor = ult.speedBonus;
    game.fx.ring(f.x, f.y, 20, 300, 0.45, 'rgba(172,226,22,0.9)', 8, true);
    game.shake(5, 0.3);
  },

  /**
   * Deux régimes, séparés par la portée de lame : loin il fonce, à portée il
   * orbite. Le pilotage automatique de `Fighter.step` reprend la main dès que
   * la ruée est finie.
   */
  steerRush(f, dt) {
    const target = f.opponent;
    if (!target || !target.alive) return;
    const dx = target.x - f.x;
    const dy = target.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    const toTarget = Math.atan2(dy, dx);
    f.heading =
      d > f.el.ultimate.orbit
        ? toTarget
        : wrapAngle(toTarget + (Math.PI / 2) * f.spinDir); // tangente : la lame reste dans la zone utile
  },

  /**
   * **Seul point de sortie de la ruée.** Vitesse, pilotage et éventail sont
   * remis ensemble : dispersés, ils laissaient l'éventail large accroché
   * derrière la lame quand le duel s'achevait en pleine ruée.
   */
  endRush(f) {
    f.ult.active = 0;
    f.ult.charge = 0;
    f.ult.ready = false;
    f.state.rush = false;
    f.boost = 0;
    f.boostFactor = 1;
  },

  /**
   * Le verrou de touche tombe à 115 ms pendant la ruée (mesuré). `Match` vient
   * juste d'y écrire le verrou nominal de la fiche : on le corrige ici, au
   * seul endroit qui sait qu'un coup a effectivement porté.
   */
  onLand(f) {
    if (f.ult.active > 0) f.meleeCd = Math.min(f.meleeCd, f.el.ultimate.hitLock);
  },

  /* ------------------------------------------------------------------ */
  /*  RAGE INFERNALE — pouvoir greffé, sur horloge propre                */
  /* ------------------------------------------------------------------ */

  /**
   * Horloge, incantation et entretien de la Rage infernale — même charpente
   * que `tickBlizzard` dans `outlaw.js`. Ne touche ni `f.boost` ni
   * `f.boostFactor` : BLADE RUSH les utilise déjà pour son propre sprint, et
   * les deux pouvoirs peuvent être actifs en même temps (l'un sur `f.ult`,
   * l'autre sur `f.state.spec`) sans se marcher dessus.
   */
  tickInfernalRage(f, dt, now, game) {
    const sp = f.el.special;

    if (f.state.spec > 0) {
      f.state.spec -= dt;
      this.tickRageAura(f, dt, now, game);
      if (f.state.spec <= 0) {
        f.state.spec = 0;
        f.state.specCd = sp.cooldown;
        f.state.specSpan = sp.cooldown;
      }
      return;
    }

    f.state.specCd -= dt;
    if (f.state.specCd <= 0) this.castInfernalRage(f, game);
  },

  /** Incantation : nova de cubes orange, reprise de `fire.js` (`castRage`). */
  castInfernalRage(f, game) {
    const sp = f.el.special;
    f.state.spec = sp.duration;
    f.state.rageAuraTick = 0;

    const n = sp.nova;
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
    game.fx.ring(f.x, f.y, 20, sp.aura.radius, 0.5, 'rgba(220,80,20,0.85)', 8, true);
    game.shake(5, 0.3);
  },

  /**
   * Braises qui montent du corps + aura brûlante : reprise du `tickRage` de
   * `fire.js`, sans la partie qui ne concerne que l'ultime du Feu (pas de
   * bonus de vitesse ici, voir `tickInfernalRage`). `onStage` et non `alive` :
   * pendant le Bond du Lancier, l'adversaire est vivant mais absent du
   * plateau, l'aura ne doit pas le mordre à son dernier point connu
   * (invariant 8).
   */
  tickRageAura(f, dt, now, game) {
    const sp = f.el.special;

    if (game.rng.chance(dt * 22)) {
      game.fx.spawn({
        kind: 'spark',
        x: f.x + game.rng.spread(f.radius),
        y: f.y + game.rng.spread(f.radius),
        vx: game.rng.spread(40),
        vy: -game.rng.range(40, 110),
        life: game.rng.range(0.3, 0.7),
        size: game.rng.range(4, 9),
        color: game.rng.pick(sp.nova.colors),
        drag: 1.4,
      });
    }

    const target = f.opponent;
    if (!target || !target.onStage) return;
    const inside = Math.hypot(target.x - f.x, target.y - f.y) <= sp.aura.radius + target.radius;
    if (!inside) return;

    f.state.rageAuraTick -= dt;
    if (f.state.rageAuraTick <= 0) {
      f.state.rageAuraTick = sp.aura.tickInterval;
      game.damage(target, sp.aura.tickDamage, f, { kind: 'aura', silent: true });
      target.applyDot(
        {
          damage: Math.max(1, Math.round(f.stacks)),
          interval: 1,
          duration: 2,
          source: f,
          tint: { color: '#f97316', alpha: 0.72 },
        },
        now,
      );
    }
  },

  /**
   * Éventail vert de BLADE RUSH.
   *
   * Il est borné **en angle**, jamais en nombre d'images : un compteur
   * d'images donne trois tours complets de vert à 3 tours/s. Le secteur est
   * tracé d'un seul arc plutôt que reconstruit par relevés successifs, ce qui
   * supprime au passage les grosses facettes triangulaires qu'un
   * échantillonnage par image donnait à haute vitesse.
   *
   * En régime normal, l'éventail est déjà rendu par le ruban de pointe d'arme
   * (`look.flair.ribbon`) : on ne dessine ici que le surcroît d'ouverture.
   */
  drawUnder(ctx, f, game, now) {
    this._drawRageAura(ctx, f, now);

    if (f.ult.active <= 0) return;
    const ult = f.el.ultimate;
    const w = f.el.weapon;
    const r0 = w.reach * w.hitbox.from;
    const r1 = w.reach;
    // le secteur s'ouvre derrière la lame, du côté d'où elle vient
    const a1 = f.weaponAngle;
    const a0 = a1 - ult.fan.rush * f.spinDir;

    ctx.save();
    ctx.globalAlpha = Math.min(1, f.ult.active / 0.35);
    ctx.fillStyle = ult.fan.color;
    ctx.beginPath();
    ctx.arc(f.x, f.y, r1, Math.min(a0, a1), Math.max(a0, a1));
    ctx.arc(f.x, f.y, r0, Math.max(a0, a1), Math.min(a0, a1), true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  /**
   * Cercle brûlant au sol pendant la Rage infernale — repris de `fire.js`
   * (`drawUnder`), dessiné **avant** l'éventail de BLADE RUSH : les deux
   * peuvent être actifs ensemble, et l'éventail vert doit rester lisible
   * par-dessus la nappe orange, jamais l'inverse.
   */
  _drawRageAura(ctx, f, now) {
    if (f.state.spec <= 0 || !f.onStage) return;
    const sp = f.el.special;
    const fade = Math.min(1, f.state.spec / 0.6);
    const g = ctx.createRadialGradient(f.x, f.y, f.radius, f.x, f.y, sp.aura.radius);
    g.addColorStop(0, `rgba(220,80,20,${0.3 * fade})`);
    g.addColorStop(1, 'rgba(220,80,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, sp.aura.radius, 0, TAU);
    ctx.fill();
    this._drawRageWings(ctx, f, now);
  },

  /** Ailes de flammes : reprises telles quelles de `fire.js` (`drawWings`). */
  _drawRageWings(ctx, f, now) {
    const w = f.el.special.wings;
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

  /**
   * Jauge de la Rage infernale : se **remplit** vers la prochaine incantation,
   * puis se **vide** sur la durée d'activité — même convention que `barValue`
   * et que `specialBar` dans `outlaw.js`.
   */
  specialBar(f) {
    const sp = f.el.special;
    if (f.state.spec > 0) return { value: f.state.spec / sp.duration, active: true };
    return { value: 1 - clamp(f.state.specCd / f.state.specSpan, 0, 1), active: false };
  },
};
