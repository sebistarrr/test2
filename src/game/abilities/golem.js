/**
 * Pouvoirs du GOLEM.
 *
 *  • **Onde sismique** (`ability`) — horloge fixe, aucune visée : toutes les
 *    6 s le bloc frappe le sol et tout ennemi dans 170 px prend des dégâts, un
 *    recul et un ralentissement. C'est l'allonge que ses jambes ne lui donnent
 *    pas : 370 px/s de croisière et 100 px de portée d'arme ne rattrapent
 *    jamais un tireur à 655.
 *
 *  • **Éclats de roche** (`special`) — troisième créneau, sur sa propre
 *    minuterie (`f.state.spec*`), exactement comme le Champ de givre du
 *    Pistolero. **Huit éclats en anneau complet autour de lui**, pour qu'on ne
 *    puisse ni se contenter de reculer, ni le contourner tranquillement.
 *
 *  • **Séisme** (`ultimate`) — la secousse est **instantanée** ; ce que dure
 *    `ultimate.duration`, c'est le **bonus de vitesse** qui la suit. Sans lui,
 *    frapper fort une fois ne changerait rien : il retomberait aussitôt dans
 *    son problème de fond.
 *
 * **Les deux règles du dépôt qui pèsent le plus ici.**
 *
 * 1. *`alive` ≠ `onStage`* (invariant 8) : les trois effets de zone bouclent
 *    sur les combattants, et un adversaire en plein Bond de l'Hoplite est
 *    vivant mais **absent du plateau**. Les toucher à leur dernier point connu
 *    serait le bug documenté.
 * 2. *Le flux de simulation* (invariant 2) : seul l'angle de départ de l'anneau
 *    d'éclats tire dans `game.rng`, parce qu'il décide où partent huit
 *    projectiles — donc qui prend des dégâts. Tout le reste (anneaux de
 *    poussière, gerbes) passe par `game.fx`, jamais par une décision de duel.
 *
 * @module game/abilities/golem
 */

import { TAU } from '../../core/math.js';

export const golemAbilities = {
  id: 'golem',

  init(f) {
    /**
     * Éclats de roche : minuterie propre, sans rapport avec la jauge d'ultime.
     *
     * Pas de `f.state.spec` ici, contrairement aux trois autres pouvoirs
     * greffés du dépôt : leur compteur porte la **durée d'activité** d'un
     * pouvoir qui dure (champ, aura, dôme), et la salve d'éclats est
     * instantanée. Un compteur toujours à zéro serait un état que personne ne
     * lit.
     */
    f.state.specCd = f.el.special.first;
    /** Longueur de la fenêtre d'attente en cours : la **première** vaut
     *  `first`, les suivantes `cooldown`. Sans la retenir, la jauge se
     *  remplirait sur le mauvais dénominateur au premier cycle et démarrerait
     *  déjà aux deux tiers — même correction que chez le Pistolero. */
    f.state.specSpan = f.el.special.first;
  },

  update(f, dt, now, game) {
    const el = f.el;

    /* ---------- ultime : horloge + marches aux touches ------------------- */
    const ult = el.ultimate;
    if (f.ult.active > 0) {
      // la secousse est déjà passée : ce qui court ici, c'est le bonus de vitesse
      f.ult.active -= dt;
      if (f.ult.active <= 0) {
        f.ult.active = 0;
        f.ult.charge = 0;
        f.ult.ready = false;
        f.boost = 0;
      }
    } else if (game.phase === 'fight') {
      f.ult.charge = Math.min(100, f.ult.charge + ult.chargeRate * dt);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castEarthquake(f, now, game);
    }

    if (game.phase !== 'fight') return;

    /* ---------- onde sismique : horloge fixe, aucune visée --------------- */
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) {
      f.ability.timer = el.ability.cooldown;
      f.ability.uses += 1;
      this.castShockwave(f, now, game);
    }

    /* ---------- éclats de roche ----------------------------------------- */
    f.state.specCd -= dt;
    if (f.state.specCd <= 0) {
      f.state.specCd = el.special.cooldown;
      f.state.specSpan = el.special.cooldown;
      this.castShards(f, game);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Onde sismique                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Frappe au sol : anneau de poussière, puis dégâts, recul et ralentissement
   * sur **tout** ennemi dans le rayon.
   *
   * La boucle passe par `enemiesInRange`, qui teste `onStage` et non `alive` :
   * un adversaire hors arène ne doit pas être secoué à son dernier point connu.
   */
  castShockwave(f, now, game) {
    const a = f.el.ability;
    game.fx.ring(f.x, f.y, f.radius, a.ring.to, a.ring.time, a.ring.color, a.ring.width, false);
    game.shake(5, 0.25);

    for (const g of this.enemiesInRange(f, a.radius, game)) {
      const dx = g.x - f.x;
      const dy = g.y - f.y;
      game.damage(g, a.damage, f, { kind: 'quake', nx: dx, ny: dy, knockback: a.knockback });
      g.applySlow(a.slow, a.slowDuration, now);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Éclats de roche — troisième créneau                                */
  /* ------------------------------------------------------------------ */

  /**
   * **Un anneau complet d'éclats autour du Golem — demandé.**
   *
   * Ils partaient en éventail vers l'adversaire ; ils partent maintenant tout
   * autour, un tous les `TAU / count` radians. Même géométrie que les éclats de
   * givre du Blizzard du Pistolero, et pour la même raison : un pouvoir qui
   * couvre les 360° n'a pas à viser, donc il **menace aussi qui le contourne** —
   * ce qui, pour le combattant le plus lent du roster, est le seul recours
   * contre un adversaire qui tourne autour de lui.
   *
   * L'angle de départ de l'anneau passe par `game.rng`, et **doit** y passer :
   * il décide où partent huit projectiles, donc qui prend des dégâts. C'est de
   * la simulation, pas de la décoration. Il fait aussi que deux anneaux
   * successifs ne se superposent pas — sans lui, tous les éclats de tous les
   * cycles suivraient exactement les mêmes huit rayons.
   */
  castShards(f, game) {
    const sp = f.el.special;
    const base = game.rng.range(0, TAU);

    for (let i = 0; i < sp.count; i++) {
      game.projectiles.spawn(f, sp.projectile, base + (TAU * i) / sp.count, f.radius);
    }
    game.fx.burst(f.x, f.y, 8, {
      color: ['#a89c88', '#7d7264', '#4e4639'],
      speed: 150,
      size: 5,
      life: 0.35,
    });
  },

  /* ------------------------------------------------------------------ */
  /*  Séisme — l'ultime                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * **Deux choses en une, et la seconde compte autant que la première** : la
   * secousse (instantanée) et le bonus de vitesse (qui court sur
   * `ultimate.duration`). C'est `f.ult.active > 0` qui porte le second, donc
   * c'est aussi lui qui déclenche le voile de `look.flair.castFlash`, posé
   * automatiquement par `match.js`.
   */
  castEarthquake(f, now, game) {
    const ult = f.el.ultimate;
    const im = ult.impact;

    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.boost = ult.duration;
    f.boostFactor = ult.speedBonus;

    game.fx.ring(f.x, f.y, f.radius, im.ring.to, im.ring.time, im.ring.color, im.ring.width, false);
    game.fx.burst(f.x, f.y, im.dust, {
      color: ['#c9bda8', '#a89c88', '#4e4639'],
      speed: 320,
      size: 7,
      life: 0.8,
    });
    game.shake(im.shake, 0.5);

    for (const g of this.enemiesInRange(f, im.radius, game)) {
      const dx = g.x - f.x;
      const dy = g.y - f.y;
      game.damage(g, im.damage, f, { kind: 'earthquake', nx: dx, ny: dy, knockback: im.knockback });
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Outils                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Les ennemis **présents sur le plateau** à moins de `radius` du Golem.
   *
   * Trois précautions, chacune payée ailleurs dans le dépôt :
   *  • `g.team !== f.team` — le moteur ne connaît que « même camp » ou « camp
   *    adverse », donc une zone ne doit jamais toucher un allié (invariant 13) ;
   *  • `g.onStage` et non `g.alive` — sinon un adversaire hors arène est frappé
   *    à son dernier point connu (invariant 8) ;
   *  • la distance est mesurée **de bord à bord** (`+ g.radius`), comme le
   *    champ de givre du Pistolero : sinon une bille de 50 px de rayon posée
   *    juste au bord de la zone passe pour dehors.
   */
  enemiesInRange(f, radius, game) {
    const out = [];
    for (const g of game.fighters) {
      if (g === f || g.team === f.team || !g.onStage) continue;
      if (Math.hypot(g.x - f.x, g.y - f.y) <= radius + g.radius) out.push(g);
    }
    return out;
  },

  /**
   * Poussière au sol pendant le Séisme : un disque qui s'estompe sous lui,
   * tracé **sans aucun tirage** (un simple rapport de durée), donc sans effet
   * possible sur l'équilibrage.
   */
  drawUnder(ctx, f) {
    if (f.ult.active <= 0 || !f.onStage) return;
    const ult = f.el.ultimate;
    const fade = f.ult.active / ult.duration;
    ctx.save();
    ctx.globalAlpha = 0.35 * fade;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius * 2.2, 0, TAU);
    ctx.fillStyle = 'rgba(168,156,136,0.9)';
    ctx.fill();
    ctx.restore();
  },

  drawOver() {},

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },

  /**
   * Jauge des Éclats de roche. La salve étant **instantanée**, il n'y a pas de
   * phase « active » à vider : la jauge ne fait que se remplir vers la
   * prochaine, puis retombe. C'est la seule des quatre jauges spéciales du
   * dépôt dans ce cas — les trois autres portent un pouvoir qui dure.
   */
  specialBar(f) {
    const span = f.state.specSpan || f.el.special.cooldown;
    return { value: 1 - Math.max(0, Math.min(1, f.state.specCd / span)), active: false };
  },
};
