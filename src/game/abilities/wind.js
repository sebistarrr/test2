/**
 * Pouvoirs du VENT.
 *
 *  • Tornade — une **rafale tournoyante déclenchée autour de lui**, pas un
 *    vortex lancé au loin. Détection automatique sur trois vidéos : elle ne
 *    dure que 4 à 6 images (0,13 → 0,20 s) et son centre reste à moins de
 *    30 px du Vent. Elle projette violemment ce qu'elle attrape.
 *
 *    Elle part sur une recharge qui **se raccourcit de 4 s à 0,5 s**, et les
 *    deux compteurs du HUD avancent ensemble (+2 dégâts, −0,5 s) — mais
 *    seulement quand la rafale **touche** : on compte 17 déclenchements pour
 *    7 progressions sur un même duel, et les incantations qui ne rapportent
 *    rien sont précisément celles où l'adversaire était hors de portée.
 *
 *  • Salve de tempête (ultime) — décharge courte et dense de croissants
 *    d'air : sur la vidéo, la cible perd ~16 PV en une seconde et demie au
 *    moment où la jauge se vide.
 *
 * @module game/abilities/wind
 */

import { TAU, clamp } from '../../core/math.js';
import { ARENA } from '../../data/tuning.js';
import { Fighter } from '../fighter.js';

export const windAbilities = {
  id: 'wind',

  init(f) {
    /** @type {Array<{x:number,y:number,r:number,life:number,max:number,angle:number}>} */
    f.state.gusts = [];
    f.state.volleyTimer = 0;

    // Clone d'ombre : minuterie propre, sans rapport avec la Tornade ni
    // l'ultime — même forme que `f.state.spec` du Pistolero.
    //
    // `init` tourne aussi sur les clones eux-mêmes : `Match.flushArrivals` leur
    // attache le module comme à n'importe quel combattant. La minuterie est
    // donc posée chez eux aussi, mais `tickClone` sort avant de la lire — un
    // clone est un Shinobi, il porte l'état d'un Shinobi, il n'en utilise
    // simplement pas cette part.
    const sp = f.el.special;
    f.state.cloneCd = sp.first;
    f.state.cloneSpan = sp.first;
  },

  update(f, dt, now, game) {
    const el = f.el;

    // les rafales ne vivent qu'une fraction de seconde
    for (let i = f.state.gusts.length - 1; i >= 0; i--) {
      const g = f.state.gusts[i];
      g.life -= dt;
      g.angle += 14 * dt;
      if (g.life <= 0) f.state.gusts.splice(i, 1);
    }

    /* ---------- ultime ---------- */
    const ult = el.ultimate;
    if (f.ult.active > 0) {
      f.ult.active -= dt;
      f.state.volleyTimer -= dt;
      if (f.state.volleyTimer <= 0) {
        f.state.volleyTimer = ult.volley.interval;
        this.fireVolley(f, game);
      }
      if (f.ult.active <= 0) {
        f.ult.active = 0;
        f.ult.charge = 0;
        f.ult.ready = false;
        f.boost = 0;
      }
    } else if (game.phase === 'fight') {
      f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castVolley(f, game);
    }

    /* ---------- tornade ---------- */
    if (game.phase !== 'fight') return;
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) this.castTornado(f, now, game);

    /* ---------- clone d'ombre ---------- */
    this.tickClone(f, dt, now, game);
  },

  castTornado(f, now, game) {
    const a = f.el.ability;
    const t = a.tornado;
    const target = f.opponent;

    f.state.gusts.push({ x: f.x, y: f.y, r: t.radius, life: t.duration, max: t.duration, angle: 0 });
    game.fx.ring(f.x, f.y, 20, t.radius, 0.3, t.edge, 6, true);
    for (let i = 0; i < 14; i++) {
      const ang = game.rng.range(0, TAU);
      game.fx.spawn({
        kind: 'dot',
        x: f.x + Math.cos(ang) * t.radius * 0.7,
        y: f.y + Math.sin(ang) * t.radius * 0.7,
        vx: -Math.sin(ang) * 260,
        vy: Math.cos(ang) * 260,
        life: 0.35,
        size: 3,
        color: '#cfc6a8',
        drag: 1.6,
      });
    }

    // la rafale ne blesse que si l'adversaire est pris dedans
    let landed = false;
    if (target && target.alive) {
      const dx = target.x - f.x;
      const dy = target.y - f.y;
      const d = Math.hypot(dx, dy);
      if (d <= t.radius + target.radius) {
        landed = true;
        game.damage(target, t.damage(f), f, {
          kind: 'tornado',
          x: target.x,
          y: target.y,
          nx: dx / (d || 1),
          ny: dy / (d || 1),
          knockback: t.knockback,
        });
      }
    }

    // la cadence s'accélère à chaque rafale…
    let cd = f.ability.cooldown - a.cooldownStepOnCast;
    // …et une rafale qui touche fait avancer le couple affiché d'un cran
    if (landed) {
      f.stacks = Math.min(t.damageMax, f.stacks + t.damageGain);
      cd -= a.cooldownStep;
    }
    f.ability.cooldown = Math.max(a.cooldownFloor, cd);
    f.ability.timer = f.ability.cooldown;
  },

  castVolley(f, game) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.state.volleyTimer = 0;
    f.boost = ult.duration;
    f.boostFactor = ult.speedBonus;
    game.fx.ring(f.x, f.y, 20, 320, 0.5, 'rgba(214,205,170,0.9)', 7, true);
    game.shake(4, 0.25);
  },

  fireVolley(f, game) {
    const v = f.el.ultimate.volley;
    const target = f.opponent;
    const base = target && target.alive ? Math.atan2(target.y - f.y, target.x - f.x) : f.heading;
    for (let i = 0; i < v.count; i++) {
      const off = v.count === 1 ? 0 : (i / (v.count - 1) - 0.5) * v.spread;
      game.projectiles.spawn(f, v.projectile, base + off);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  CLONE D'OMBRE — pouvoir spécial, sur horloge propre                */
  /* ------------------------------------------------------------------ */

  /**
   * Horloge du pouvoir. **Il ne reste que ça** — et c'est tout le changement.
   *
   * Le clone est désormais **un combattant du tableau**, inscrit dans
   * `game.fighters` par `Match.join()`, dans le camp du Shinobi. Il n'est plus
   * un objet confiné au module coiffé du prototype `Fighter` : c'en est un,
   * construit par le même constructeur, joué par les mêmes boucles.
   *
   * Ce que ça supprime d'ici, en une fois : le pas de déplacement recopié, les
   * collisions corporelles, la frappe, le verrou de touche subie
   * (`cloneWeaponHit` et la famine de `meleeCd` qu'il contournait), l'encaisse
   * des projectiles adverses, la disparition à zéro PV, et le tracé dans
   * `drawOver`. Six mécanismes réécrits à la main que le moteur servait déjà.
   *
   * Ce que ça lui **donne**, sans une ligne de plus : ses propres pouvoirs
   * (`Match` lui attache son module et l'appelle comme les autres), sa plaque
   * de points de vie et ses jauges dans le HUD, sa place dans les statistiques
   * et dans le classement de fin, et le fait que la partie **continue si le
   * vrai Shinobi tombe pendant qu'un clone tient** — le camp n'est vide que
   * lorsque le dernier est mort. C'est le 2 contre 1 demandé, et il sort
   * entièrement de la notion de camp que le moteur avait déjà.
   *
   * **Un clone n'invoque pas de clone.** C'est la seule limite posée, et elle
   * est délibérée : le pouvoir se déclencherait chez lui comme chez l'original,
   * donc le nombre de doubles doublerait toutes les `cooldown` secondes. Un
   * duel de 25 s finirait à huit corps. Le marqueur `f.estClone` est posé par
   * `castClone` et lu ici seulement ; l'enlever suffirait à ouvrir la récursion.
   */
  tickClone(f, dt, now, game) {
    if (f.estClone) return;
    const sp = f.el.special;
    f.state.cloneCd -= dt;
    if (f.state.cloneCd <= 0) {
      f.state.cloneCd = sp.cooldown;
      f.state.cloneSpan = sp.cooldown;
      this.castClone(f, game);
    }
  },

  /**
   * Incantation : **un Shinobi de plus entre dans l'arène**, derrière le
   * premier et dans son camp.
   *
   * Il est construit par `new Fighter(...)`, le constructeur des vrais
   * combattants — donc son état d'exécution est complet par construction. La
   * version d'avant énumérait vingt champs à la main et devait les tenir à jour
   * à chaque évolution du `Fighter` ; un seul oubli rendait `NaN` sur la
   * position au premier pas.
   *
   * Le constructeur prend le point de départ **en fractions d'arène** : c'est
   * lui qui les convertit, et repasser par cette conversion plutôt que de poser
   * `x`/`y` directement garde le clone sur le chemin exact d'un combattant
   * ordinaire, bornes de mur comprises.
   *
   * **Trois choses seulement sont reprises de l'original**, et elles disent
   * « mêmes pouvoirs, même recharge » :
   *
   *  • `ability.cooldown` — la recharge **courante** de la Tornade, pas celle
   *    de la fiche. Elle se raccourcit à l'usage (4 s → 0,5 s) : un clone parti
   *    du chiffre de la fiche aurait été plus lent que celui qui l'invoque, et
   *    « le même cooldown » aurait été faux ;
   *  • `stacks` — les dégâts de Tornade acquis, pour la même raison ;
   *  • l'angle d'arme, pour que les deux shurikens tournent en phase à la
   *    naissance. Ils divergent ensuite d'eux-mêmes, aux rebonds.
   *
   * La jauge d'ultime, elle, part de **zéro** : c'est une charge, pas une
   * recharge, et la recopier laisserait un clone lâcher sa Salve à la seconde
   * où il apparaît.
   *
   * **Le tirage aléatoire du constructeur est assumé.** Un `Fighter` écarte son
   * cap de départ de `rng.spread(0.35)`, donc l'incantation consomme le flux de
   * simulation. C'était précisément ce qu'évitait la version d'avant — mais
   * elle n'inscrivait rien dans le tableau. Un combattant qui entre en jeu est
   * un événement de simulation, pas une décoration : il tire dans `game.rng`
   * comme les autres, et le duel reste rejouable à seed égale.
   */
  castClone(f, game) {
    const sp = f.el.special;
    const behind = f.heading + Math.PI;
    const inner = ARENA.inner;
    const r = f.el.look.radius;
    const x = clamp(f.x + Math.cos(behind) * sp.offset, inner.left + r, inner.right - r);
    const y = clamp(f.y + Math.sin(behind) * sp.offset, inner.top + r, inner.bottom - r);
    const target = f.opponent;

    const clone = new Fighter(
      f.el,
      f.slot,
      game.rng,
      {
        x: (x - inner.left) / (inner.right - inner.left),
        y: (y - inner.top) / (inner.bottom - inner.top),
        // braqué sur l'ennemi : il naît dans le dos du Shinobi, donc repartir
        // sur le cap de celui-ci l'enverrait droit au mur
        heading: target ? Math.atan2(target.y - y, target.x - x) : f.heading,
      },
      sp.hp,
    );

    clone.team = f.team;
    clone.estClone = true; // marqueur du module, jamais lu par le moteur
    clone.ability.cooldown = f.ability.cooldown;
    clone.ability.timer = f.ability.cooldown;
    clone.stacks = f.stacks;
    clone.stacks2 = f.stacks2;
    clone.weaponAngle = f.weaponAngle;

    /**
     * **La teinte qui le distingue de l'original.** Le corps du Shinobi est un
     * noir plein (`#141414`), et les deux portent maintenant la même arme, les
     * mêmes pouvoirs et la même silhouette : il ne reste que le ton pour dire
     * lequel est lequel. `tint`/`tintAlpha` sont les compteurs génériques que
     * `Fighter.draw()` lit déjà pour le givre du Pistolero — ils **mélangent**
     * une couleur au corps au lieu de la remplacer, donc le clone reste le même
     * personnage, un ton plus clair.
     *
     * `tintUntil` à l'infini : `step()` efface la teinte dès que le temps de
     * duel la dépasse, et celle-ci ne doit jamais s'effacer.
     */
    clone.tint = sp.tint;
    clone.tintUntil = Infinity;
    clone.tintAlpha = sp.tintAlpha;

    game.join(clone);
    game.fx.ring(x, y, 10, 90, 0.4, 'rgba(20,20,20,0.7)', 6, true);
    game.fx.burst(x, y, 16, { color: ['#141414', '#e8621b', '#3a3a3a'], speed: 220, size: 5, life: 0.4 });
  },

  /**
   * Rafale : un **disque flou couleur sable** fait de larges pales en éventail
   * qui rayonnent du centre — c'est le motif relevé image par image, et non
   * des cercles concentriques. Chaque pale est un fuseau incurvé, dessiné sans
   * aucun contour, et le cœur reste plus dense et plus chaud.
   */
  drawUnder(ctx, f) {
    const t = f.el.ability.tornado;
    for (const g of f.state.gusts) {
      const k = g.life / g.max; // 1 → 0
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);

      const r = g.r * (0.72 + 0.28 * (1 - k)); // le tourbillon s'ouvre

      // halo de fond : le disque entier, très dilué sur le bord
      const grad = ctx.createRadialGradient(0, 0, r * 0.06, 0, 0, r);
      grad.addColorStop(0, t.core);
      grad.addColorStop(0.55, t.color);
      grad.addColorStop(1, t.edge);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();

      // pales en éventail : larges fuseaux qui partent du cœur et s'évasent,
      // volontairement en recouvrement pour retrouver le flou de la vidéo
      ctx.fillStyle = t.color;
      const span = TAU / t.blades;
      for (let i = 0; i < t.blades; i++) {
        const a0 = span * i;
        const a1 = a0 + span * 1.45; // > span : les pales se chevauchent
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
          Math.cos(a0 + span * 0.2) * r * 0.62,
          Math.sin(a0 + span * 0.2) * r * 0.62,
          Math.cos(a0 + span * 0.55) * r,
          Math.sin(a0 + span * 0.55) * r,
        );
        ctx.arc(0, 0, r, a0 + span * 0.55, a1 - span * 0.55);
        ctx.quadraticCurveTo(
          Math.cos(a1 - span * 0.2) * r * 0.62,
          Math.sin(a1 - span * 0.2) * r * 0.62,
          0,
          0,
        );
        ctx.fill();
      }

      // cœur plus dense, légèrement décentré comme sur la vidéo
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.42);
      core.addColorStop(0, t.core);
      core.addColorStop(1, 'rgba(168,152,124,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.42, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  },

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },

  /**
   * Jauge du clone : se remplit vers la prochaine incantation.
   *
   * **Rien pour un clone** — il n'a pas ce pouvoir, et le HUD sait déjà ne pas
   * dessiner une seconde rangée quand `specialBar` ne rend rien (c'est ce qui
   * évite un cadre vide aux combattants sans troisième créneau). Ses points de
   * vie et sa jauge d'ultime, eux, s'affichent comme ceux de n'importe qui : il
   * a sa propre plaque dans le bandeau du haut et son propre bloc en bas.
   */
  specialBar(f) {
    if (f.estClone) return null;
    return { value: 1 - clamp(f.state.cloneCd / f.state.cloneSpan, 0, 1) };
  },
};
