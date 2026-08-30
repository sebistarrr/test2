/**
 * Pouvoirs du HORS-LA-LOI.
 *
 *  • Visée — le canon est **asservi à l'adversaire à chaque image, sans
 *    lissage**. C'est le seul combattant du roster dont l'arme ne tourne pas :
 *    sa fiche porte `weapon.spin = 0` et c'est ce module qui écrit
 *    `weaponAngle`. Conséquence de jeu : à portée, le canon est toujours
 *    aligné, donc le coup à bout portant part à chaque fenêtre de recharge —
 *    d'où un verrou plus long que le reste du roster.
 *
 *  • Barillet — six coups puis un rechargement. Mesuré : ~18 images entre deux
 *    décréments d'`Ammo` à 30 fps, moitié moins pendant HIGH NOON ; le
 *    rechargement est le trou observé entre `0/6` et `6/6`.
 *
 *  • Plein soleil / HIGH NOON (ultime) — horloge de 7 s, puis 6,2 s pendant
 *    lesquelles la cadence double, la vitesse gagne 22 % et **chaque coup le
 *    propulse** : 790 px/s de recul contre 95 hors ultime, d'où le pic de
 *    1 380 px/s relevé à l'image 1011.
 *
 * Sur 1103 images la stat `Damage` passe de 3,00 à 5,50, soit 25 paliers de
 * 0,10 pour ~50 tirs : la progression suit le coup **au but**, pas le coup
 * tiré. Elle est donc décrite par `onHit.stackGain` dans la fiche, côté arme
 * comme côté projectile, et non gérée ici.
 *
 * @module game/abilities/outlaw
 */

import { TAU, clamp, wrapAngle } from '../../core/math.js';

export const outlawAbilities = {
  id: 'outlaw',

  init(f) {
    f.state.reload = 0; // > 0 : barillet vide, on recharge
    f.state.reloadFrom = 0; // angle d'arme au debut du tour de rechargement
  },

  update(f, dt, now, game) {
    const el = f.el;

    // --- visée : le canon suit l'adversaire, sans lissage (mesuré)
    // Pendant le rechargement l'arme fait un tour complet et n'est donc plus
    // asservie : on n'écrit pas l'angle deux fois pour le même pas.
    const target = f.opponent;
    if (target && target.alive && f.state.reload <= 0) {
      f.weaponAngle = Math.atan2(target.y - f.y, target.x - f.x);
    }

    /* ---------- ultime : horloge pure, la jauge ne réagit pas aux coups ---- */
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
      if (f.ult.ready) this.castHighNoon(f, game);
    }

    /* ---------- barillet ------------------------------------------------- */
    if (game.phase !== 'fight') return;
    if (f.state.reload > 0) {
      f.state.reload -= dt;
      /**
       * **Un tour complet pendant le rechargement.** L'arme quitte sa cible et
       * pivote de 360° sur toute la durée : c'est ce qui rend le rechargement
       * lisible, là où le barillet vide ne se voyait que dans le HUD.
       *
       * L'angle est **calculé depuis l'avancement**, pas incrémenté image par
       * image : une accumulation dériverait au fil des pas et le tour ne
       * retomberait pas exactement sur l'angle de départ. Ici il s'y referme
       * par construction, et la visée reprend sans saut.
       */
      const done = 1 - Math.max(0, f.state.reload) / el.ability.reload;
      f.weaponAngle = wrapAngle(f.state.reloadFrom + TAU * done);
      if (f.state.reload <= 0) {
        f.state.reload = 0;
        f.stacks2 = el.ability.magazine; // le HUD repasse de 0/6 à 6/6
        f.ability.timer = el.ability.cooldown;
      }
      return;
    }

    f.ability.timer -= dt;
    if (f.ability.timer <= 0) this.fire(f, game);
  },

  castHighNoon(f, game) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.boost = ult.duration;
    f.boostFactor = ult.speedBonus;
    game.fx.ring(f.x, f.y, 20, ult.glow.radius, 0.5, ult.glow.edge, 8, true);
    game.shake(6, 0.35);
  },

  /** Un coup : une balle vers l'adversaire, et le recul qui va avec. */
  fire(f, game) {
    const a = f.el.ability;
    const ult = f.el.ultimate;
    const target = f.opponent;
    const aim = target && target.alive ? Math.atan2(target.y - f.y, target.x - f.x) : f.weaponAngle;
    // la dispersion est ce qui ramène le pistolero à sa précision relevée :
    // une visée réécrite à chaque image touche sinon à tous les coups
    const angle = aim + game.rng.spread(a.spread);

    // la balle part de la bouche du canon, pas du centre de la bille
    game.projectiles.spawn(f, a.projectile, angle, f.el.weapon.reach * 0.9);

    // recul : c'est lui qui fait tout le déplacement erratique de la vidéo
    const recoil = f.ult.active > 0 ? ult.recoil : a.recoil;
    f.push(-Math.cos(angle), -Math.sin(angle), recoil);

    game.fx.burst(
      f.x + Math.cos(angle) * f.el.weapon.reach * 0.9,
      f.y + Math.sin(angle) * f.el.weapon.reach * 0.9,
      6,
      { color: ['#fff6e0', '#e8c98a', '#c98a4b'], speed: 200, size: 4, life: 0.22, dir: angle, spread: 0.8 },
    );

    f.stacks2 -= 1;
    if (f.stacks2 <= 0) {
      f.stacks2 = 0;
      f.state.reload = a.reload;
      // l'angle de depart du tour : il s'y referme exactement
      f.state.reloadFrom = f.weaponAngle;
      return;
    }
    // pendant HIGH NOON la cadence double (mesuré)
    f.ability.timer = a.cooldown / (f.ult.active > 0 ? ult.fireRateBonus : 1);
  },

  /**
   * Lumière de HIGH NOON.
   *
   * Sur la vidéo, l'arène entière vire au crème `#FDF7ED` pendant l'ultime.
   * Ici le décor est rasterisé une fois et **ne bouge jamais** (cahier des
   * charges) : la lumière se pose donc au sol, sous le pistolero, ce qui la
   * laisse en outre derrière les combattants.
   */
  drawUnder(ctx, f) {
    if (f.ult.active <= 0) return;
    const glow = f.el.ultimate.glow;
    const fade = Math.min(1, f.ult.active / 0.6);
    const g = ctx.createRadialGradient(f.x, f.y, f.radius * 0.5, f.x, f.y, glow.radius);
    g.addColorStop(0, glow.color);
    g.addColorStop(1, 'rgba(253,247,237,0)');
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, glow.radius, 0, TAU);
    ctx.fill();
    ctx.restore();
  },

  drawOver() {},

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },
};
