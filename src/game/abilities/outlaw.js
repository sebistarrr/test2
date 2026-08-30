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

import { TAU, clamp } from '../../core/math.js';
import { ARENA } from '../../data/tuning.js';

export const outlawAbilities = {
  id: 'outlaw',

  init(f) {
    f.state.reload = 0; // > 0 : barillet vide, on recharge
    f.state.reloadFrom = 0; // angle d'arme au debut du tour de rechargement
    // Blizzard : minuterie propre, sans rapport avec la jauge d'ultime
    f.state.spec = 0; // secondes restantes de Blizzard actif
    f.state.specCd = f.el.special.first;
    /** Longueur de la fenêtre d'attente en cours. La **première** vaut `first`
     *  et les suivantes `cooldown` : sans la retenir, la jauge se remplirait
     *  sur le mauvais dénominateur au premier cycle et démarrerait déjà aux
     *  deux tiers. */
    f.state.specSpan = f.el.special.first;
    f.state.fieldTick = 0;
    f.state.snowTimer = 0;
    f.state.shardTimer = 0;
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

    this.tickBlizzard(f, dt, now, game);

    if (f.state.reload > 0) {
      f.state.reload -= dt;
      /**
       * **Un tour complet pendant le rechargement — sur lui-même, pas autour
       * de la bille.**
       *
       * La première version faisait tourner `weaponAngle`, ce qui fait
       * **orbiter** l'arme autour du corps comme une aiguille d'horloge. Ce
       * n'est pas un pistolet qu'on recharge, c'est un pistolet qu'on fait
       * tournoyer au bout d'un bras. Le revolver garde donc sa direction
       * (`weaponAngle` gelé sur l'angle de départ) et c'est `weaponTwirl` qui
       * le fait pivoter **autour du milieu de sa propre carte**.
       *
       * Le sens est **antihoraire**, donc négatif : l'axe des y du canevas
       * descend, un angle positif y tourne dans le sens des aiguilles.
       *
       * L'angle est **calculé depuis l'avancement**, pas incrémenté image par
       * image : une accumulation dériverait au fil des pas et le tour ne
       * retomberait pas exactement sur zéro. Ici il s'y referme par
       * construction, et la visée reprend sans saut.
       */
      const done = 1 - Math.max(0, f.state.reload) / el.ability.reload;
      f.weaponAngle = f.state.reloadFrom;
      f.weaponTwirl = -TAU * done;
      if (f.state.reload <= 0) {
        f.state.reload = 0;
        f.weaponTwirl = 0; // le tour se referme exactement sur zéro
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

  /* ------------------------------------------------------------------ */
  /*  BLIZZARD — pouvoir spécial, sur horloge propre                     */
  /* ------------------------------------------------------------------ */

  /**
   * Horloge, incantation et entretien du Blizzard, en un seul point.
   *
   * Le compteur `f.state.spec` a **exactement la forme des compteurs
   * génériques du `Fighter`** (`offstage`, `boost`, `ghosting`) : un décompte
   * en secondes que le module allume et décrémente, et que personne d'autre
   * n'interprète. Il ne passe pas par `f.ult` — c'est ce qui garantit que
   * HIGH NOON n'est touché en rien.
   */
  tickBlizzard(f, dt, now, game) {
    const sp = f.el.special;

    if (f.state.spec > 0) {
      f.state.spec -= dt;
      this.tickField(f, dt, now, game);
      this.tickShards(f, dt, game);
      if (f.state.spec <= 0) {
        f.state.spec = 0;
        f.state.specCd = sp.cooldown;
        f.state.specSpan = sp.cooldown;
      }
      return;
    }

    f.state.specCd -= dt;
    if (f.state.specCd <= 0) this.castBlizzard(f, game);
  },

  /** Incantation : onde de choc qui déborde l'arène, puis le champ s'ouvre. */
  castBlizzard(f, game) {
    const sp = f.el.special;
    f.state.spec = sp.duration;
    f.state.fieldTick = 0;
    f.state.shardTimer = 0; // la première salve part avec l'onde de choc

    const s = sp.shockwave;
    game.fx.ring(f.x, f.y, s.from, s.to, s.time, s.color, s.width, false);
    game.fx.burst(f.x, f.y, 26, {
      color: ['#d8f2ff', '#ffffff', '#67b6e0'],
      speed: 380,
      size: 6,
      life: 0.7,
    });
    game.shake(5, 0.3);
  },

  /**
   * **Éclats de givre**, pendant le Blizzard seulement.
   *
   * C'est la mécanique `frostShards` de la Glace, à ceci près que chez elle
   * c'est un pouvoir permanent que le Blizzard *accélère*, alors qu'ici il
   * n'existe **que** pendant le Blizzard — un pistolero qui tire des éclats en
   * continu n'est plus un pistolero. Les chiffres sont donc ceux du
   * `duringUltimate` de la Glace, qui décrit exactement ce régime.
   *
   * L'angle de départ passe par `game.rng` et **doit** y passer : il décide où
   * partent dix projectiles, donc qui prend des dégâts. C'est de la
   * simulation, pas de la décoration — l'inverse exact de la neige.
   */
  tickShards(f, dt, game) {
    const sh = f.el.special.shards;
    f.state.shardTimer -= dt;
    if (f.state.shardTimer > 0) return;
    f.state.shardTimer = sh.cooldown;

    const base = game.rng.range(0, TAU);
    for (let i = 0; i < sh.count; i++) {
      game.projectiles.spawn(f, sh.projectile, base + (TAU * i) / sh.count);
    }
    game.fx.burst(f.x, f.y, 10, {
      color: ['#d8f2ff', '#67b6e0', '#ffffff'],
      speed: 180,
      size: 4,
      life: 0.4,
    });
  },

  /** Neige plein cadre, puis gel et dégâts périodiques sur qui entre. */
  tickField(f, dt, now, game) {
    const sp = f.el.special;
    const field = sp.field;
    const snow = sp.snow;

    /**
     * **La neige tire dans `viewRng`, pas dans `game.rng`.** À 90 flocons par
     * seconde et deux tirages chacun, c'est 180 appels par seconde injectés au
     * milieu du flux de simulation : tout ce qui suit se décale, et **chaque
     * valeur de `cooldown` rebat le tirage de tous les duels** au lieu de
     * changer la force du personnage. Mesuré au banc : à 18 s de recharge le
     * Hors-la-loi montait à 19 victoires, contre 17 à 13 s — un Blizzard *plus
     * rare* qui rend *plus fort*, ce qui n'est la forme d'aucune mécanique.
     *
     * C'est l'invariant de déterminisme, et il coûte cher à retrouver : la
     * décoration passe par `viewRng` ou par un hachage pur, jamais par le flux
     * du duel. La Glace fait encore l'inverse dans sa propre fiche ; le
     * corriger là-bas déplacerait sa matrice, c'est un autre chantier.
     */
    f.state.snowTimer -= dt;
    if (f.state.snowTimer <= 0) {
      f.state.snowTimer = 1 / snow.count;
      const i = ARENA.inner;
      game.fx.snow(
        game.viewRng.range(i.left, i.right),
        game.viewRng.range(i.top, i.top + (i.bottom - i.top) * 0.65),
        snow.fall,
        snow.drift,
        snow.color,
      );
    }

    // `onStage` et non `alive` : pendant un Bond, l'adversaire est vivant mais
    // absent du plateau — le champ ne doit pas le geler à son dernier point
    // connu (invariant 7).
    const target = f.opponent;
    if (!target || !target.onStage) return;
    const inside = Math.hypot(target.x - f.x, target.y - f.y) <= field.radius + target.radius;
    if (!inside) return;

    target.applySlow(field.slow, 0.25, now);
    f.state.fieldTick -= dt;
    if (f.state.fieldTick <= 0) {
      f.state.fieldTick = field.tickInterval;
      game.damage(target, field.tickDamage, f, { kind: 'field', silent: true });
      game.fx.burst(target.x, target.y, 4, { color: '#d8f2ff', speed: 90, size: 3, life: 0.3 });
    }
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
    this._drawField(ctx, f);
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

  /**
   * Champ de givre du Blizzard, au sol.
   *
   * Il est peint **avant** la lumière de HIGH NOON, dans le même `drawUnder` :
   * les deux peuvent être actifs en même temps, et c'est la lumière chaude qui
   * doit passer par-dessus le disque froid, jamais l'inverse.
   */
  _drawField(ctx, f) {
    if (f.state.spec <= 0 || !f.onStage) return;
    const field = f.el.special.field;
    const fade = Math.min(1, f.state.spec / 0.6);
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

  /**
   * Jauge du Blizzard : elle se **remplit** vers la prochaine incantation, puis
   * se **vide** sur la durée d'activité — la même convention que `barValue`.
   */
  specialBar(f) {
    const sp = f.el.special;
    if (f.state.spec > 0) return { value: f.state.spec / sp.duration, active: true };
    return { value: 1 - clamp(f.state.specCd / f.state.specSpan, 0, 1), active: false };
  },
};
