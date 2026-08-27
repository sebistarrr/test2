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
 * @module game/abilities/bladesman
 */

import { TAU, clamp, wrapAngle } from '../../core/math.js';

export const bladesmanAbilities = {
  id: 'bladesman',

  init(f) {
    f.state.plateau = 0; // temps passé au plafond
    f.state.overheat = false; // true = la lame s'effondre vers le plancher
    f.state.rush = false;
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
  drawUnder(ctx, f) {
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

  drawOver() {},

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },
};
