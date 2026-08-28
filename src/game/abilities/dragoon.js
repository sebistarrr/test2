/**
 * Pouvoirs du DRAGOON — relevés sur « Dragoon vs Outlaw » (576 × 1024, 30 fps).
 *
 *  • **Charge de lance** — le cœur du personnage, et ce que le premier portage
 *    avait manqué. Le Dragoon ne flotte pas en faisant tourner sa lance : il
 *    **vise, verrouille, puis fonce en ligne droite**, lance en avant, en
 *    laissant une traînée d'images fantômes cramoisies. Trois phases, plus une
 *    de récupération, décrites plus bas.
 *
 *  • Furie du lancier — passif : la stat « Damage » du HUD monte à chaque
 *    touche portée. Rien à faire ici, c'est `weapon.melee.onHit.stackGain`
 *    qui l'applique.
 *
 *  • BOND (JUMP) — ultime. Le seul pouvoir du jeu qui **retire son porteur de
 *    l'arène** : le Dragoon prend son élan (0,45 s), disparaît une seconde et
 *    demie, puis retombe sur l'adversaire. Pendant le vol, un disque gris suit
 *    la cible : il enfle au sommet du bond puis se resserre — c'est le
 *    resserrement qui annonce la chute.
 *
 * ## Le relevé de la charge
 *
 * Trois mesures, prises image par image sur la vidéo de référence :
 *
 *  1. **La lance vise l'adversaire.** L'axe principal du nuage de pixels
 *     indigo, comparé au cap bille → adversaire, tient dans **±5°** sur toutes
 *     les plages où la lance est isolable (t = 3,0–3,2 / 3,4–3,6 / 4,0–4,3 s),
 *     et **converge** après chaque décrochage (err −19,5° → −0,8° entre 4,43 et
 *     4,80 s). Elle ne tourne donc pas librement : la fiche porte
 *     `weapon.spin = 0`, comme le canon du Hors-la-loi, et c'est ce module qui
 *     écrit `weaponAngle`.
 *  2. **Le plafond de rotation est de ~230 °/s** : quand le cap de l'adversaire
 *     file, la lance le suit à 220 °/s (21,5° → −30,0° en 0,234 s) sans jamais
 *     aller plus vite. D'où `lunge.aimRate`.
 *  3. **La charge est trois fois la vitesse de croisière.** En croisière, la
 *     bille tient 400–450 px/s vidéo, soit 500–560 en repère jeu — la vitesse
 *     `mesuré` de 540 de la fiche. Pendant une charge (t = 8,70–8,84 s), elle
 *     monte à 1 125–1 160 px/s vidéo, soit **~1 400 en repère jeu**, sur
 *     ~0,15 s. D'où `lunge.speed` et `lunge.dash`.
 *
 * ## Ce que la charge répare
 *
 * L'ancien verrou de touche de **6 s** était le seul écart au relevé qui
 * subsistait, et il était assumé faute de mieux : une lance de 164 px qui
 * balaie en tournant accroche 0,34 fois par seconde là où la vidéo en compte
 * 0,181, et seul un verrou absurde ramenait la cadence. La charge rend le
 * mécanisme au lieu de le maquiller — le Dragoon ne touche plus par hasard en
 * balayant, il touche **quand sa charge aboutit** — ce qui rend au verrou sa
 * valeur relevée de 1,1 s. C'est la cadence du cycle qui porte désormais le
 * budget de dégâts, comme sur la vidéo.
 *
 * Déterminisme : tout ce qui est ici tourne dans le fil de simulation. La
 * décoration passe donc par `fx.ring`, qui **ne tire aucun aléa** — un
 * `fx.burst` de plus dans ce chemin décalerait `game.rng` et changerait des
 * vainqueurs. Les images fantômes, elles, sont dans `render/flair.js` : le
 * module ne fait qu'allumer le compteur `f.ghosting`.
 *
 * @module game/abilities/dragoon
 */

import { TAU, clamp, rotateToward, wrapAngle } from '../../core/math.js';
import { ARENA } from '../../data/tuning.js';

/**
 * Phase de la charge.
 *
 *  - `aim`     : la lance pivote vers le centre de l'adversaire ;
 *  - `lock`    : l'angle est **gelé**, la lance ne suit plus la cible ;
 *  - `dash`    : le corps file en ligne droite le long de l'angle verrouillé ;
 *  - `recover` : temps mort, puis la visée reprend.
 *
 * @typedef {'aim'|'lock'|'dash'|'recover'} LungePhase
 */

export const dragoonAbilities = {
  id: 'dragoon',

  /** @param {import('../fighter.js').Fighter} f */
  init(f) {
    /** @type {LungePhase} */
    f.state.phase = 'aim';
    f.state.phaseTimer = 0;
    /** Cap figé au verrouillage : la charge le suit sans le corriger. */
    f.state.dashAngle = f.weaponAngle;
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

    this.tickLunge(f, dt, now, game);

    f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
    f.ult.ready = f.ult.charge >= 100;
    if (f.ult.ready) this.castJump(f, game);
  },

  /* ------------------------------------------------------------------ */
  /* Charge de lance                                                     */
  /* ------------------------------------------------------------------ */

  /** @param {import('../fighter.js').Fighter} f @param {LungePhase} phase */
  setPhase(f, phase) {
    f.state.phase = phase;
    f.state.phaseTimer = 0;
  },

  /**
   * Machine d'états de la charge.
   *
   * Un seul `switch`, et **un seul endroit qui écrit `weaponAngle`** : la phase
   * `aim`. Les trois autres ne l'écrivent pas du tout, ce qui *est* le gel de
   * l'angle — la fiche porte `weapon.spin = 0`, donc `Fighter.step` n'y touche
   * pas non plus.
   */
  tickLunge(f, dt, now, game) {
    const L = f.el.weapon.lunge;
    const target = f.opponent;
    f.state.phaseTimer += dt;

    /**
     * **La lance ne blesse qu'en charge.** Hors charge elle est *portée*, pas
     * poussée : le verrou de touche est retenu à chaque pas, et seule la phase
     * `dash` le laisse courir.
     *
     * C'est la contrepartie obligée de la visée. Une lance de 164 px asservie
     * à la cible pointe sur elle en permanence, donc l'embroche en permanence :
     * au banc, sans ce verrou, le Dragoon montait à **0,42 coup/s** contre
     * 0,181 relevé, et gagnait ses 30 duels en 19 s. C'est exactement le piège
     * du Hors-la-loi, dont le canon asservi gagnait 27 duels sur 27 avant que
     * sa dispersion ne le ramène à sa précision relevée.
     */
    if (f.state.phase !== 'dash') f.meleeCd = Math.max(f.meleeCd, L.guard);

    switch (f.state.phase) {
      case 'aim': {
        if (!target || !target.onStage) return;
        const want = Math.atan2(target.y - f.y, target.x - f.x);
        // la visée est ralentie comme le reste : une lance givrée vise mal
        f.weaponAngle = rotateToward(f.weaponAngle, want, L.aimRate * f.slowFactor(now) * dt);
        const err = Math.abs(wrapAngle(f.weaponAngle - want));
        const d = Math.hypot(target.x - f.x, target.y - f.y);
        // **fenêtre d'engagement**, bornée des deux côtés : un lancier charge
        // de loin. Trop près, il embroche à coup sûr et la charge n'est plus
        // qu'une formalité ; trop loin, il n'arrive jamais au contact.
        if (err <= L.tolerance && d <= L.range && d >= L.minRange) this.lock(f, game);
        break;
      }

      case 'lock':
        // rien n'écrit l'angle : c'est le gel, et il est total
        if (f.state.phaseTimer >= L.lock) this.dash(f, game);
        break;

      case 'dash':
        // ligne droite : le cap est réécrit à chaque pas sur l'angle verrouillé,
        // sinon le pilotage automatique de `Fighter.step` incurverait la charge
        f.heading = f.state.dashAngle;
        if (f.state.phaseTimer >= L.dash) this.endDash(f);
        break;

      case 'recover':
        if (f.state.phaseTimer >= L.recover) this.setPhase(f, 'aim');
        break;

      default:
        this.setPhase(f, 'aim');
    }
  },

  /** Verrouillage : l'angle de charge est pris ici, et plus rien ne le bouge. */
  lock(f, game) {
    const L = f.el.weapon.lunge;
    f.state.dashAngle = f.weaponAngle;
    this.setPhase(f, 'lock');
    // un anneau serré, le temps du verrou : c'est le seul préavis que
    // l'adversaire reçoit. `fx.ring` ne tire aucun aléa.
    game.fx.ring(f.x, f.y, f.radius * 1.5, f.radius * 1.05, L.lock, L.lockRing, 3, true);
  },

  /** Départ de la charge : vitesse, cap et traînée sont allumés ensemble. */
  dash(f, game) {
    const L = f.el.weapon.lunge;
    this.setPhase(f, 'dash');
    f.heading = f.state.dashAngle;
    f.boost = L.dash;
    f.boostFactor = L.speed;
    // le compteur couvre exactement la charge ; passé zéro, `flair` vide la
    // file par le plus ancien, donc la traînée se résorbe derrière lui au lieu
    // de disparaître d'un coup
    f.ghosting = L.dash;
    game.fx.ring(f.x, f.y, f.radius * 0.9, f.radius * 2.6, 0.22, L.dashRing, 5, true);
  },

  /**
   * **Seul point de sortie de la charge.** Vitesse, facteur de vitesse et
   * traînée sont remis ensemble, et la phase passe à `recover`. Dispersées,
   * ces remises à zéro laissaient un bonus de vitesse accroché au Dragoon
   * quand la charge s'interrompait sur une touche — c'est le piège du Bretteur,
   * qui a déjà coûté une fin de duel en pleine ruée.
   */
  endDash(f) {
    f.boost = 0;
    f.boostFactor = 1;
    f.ghosting = 0;
    this.setPhase(f, 'recover');
  },

  /**
   * La pointe a touché. Le Dragoon est **repoussé en arrière** et repart au
   * début du cycle : c'est ce que montre la vidéo, où chaque touche de lance
   * est suivie d'un recul net avant la charge suivante.
   *
   * `Match.resolveMelee` a déjà appliqué `melee.selfRecoil` et posé le verrou
   * de touche ; on n'ajoute ici que le surplus propre à la charge, et
   * seulement si la touche est bien arrivée **pendant** une charge.
   */
  onLand(f, target, hit, game) {
    if (f.state.phase !== 'dash') return;
    const L = f.el.weapon.lunge;
    this.endDash(f);
    f.push(-hit.nx, -hit.ny, L.recoil);
    game.fx.ring(hit.x, hit.y, 6, L.hitRing.to, L.hitRing.time, L.hitRing.color, 6, true);
  },

  /* ------------------------------------------------------------------ */
  /* Bond                                                                */
  /* ------------------------------------------------------------------ */

  /** Élan : le Dragoon reste au sol, mais la jauge se vide déjà (mesuré). */
  castJump(f, game) {
    const ult = f.el.ultimate;
    // une charge en cours ne survit pas au Bond : sans ça, le bonus de vitesse
    // et la traînée repartiraient avec lui à l'atterrissage
    if (f.state.phase === 'dash') this.endDash(f);
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
    // **onde de choc au sol, au point de décollage** : le Dragoon disparaît
    // d'une image à l'autre, et sans elle rien ne dit d'où il est parti.
    const lift = ult.liftoff;
    game.fx.ring(f.x, f.y, f.radius * 0.8, lift.to, lift.time, lift.color, lift.width, true);
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

  /**
   * Chute : le Dragoon retombe **collé à l'adversaire** et frappe autour de
   * lui. Le décalage est pris le long du cap adversaire → marqueur pour que
   * les deux billes se touchent sans s'interpénétrer : posé pile sur la cible,
   * il serait aussitôt séparé par `resolveBodies`, ce qui rendait la chute
   * illisible d'une image à l'autre.
   */
  land(f, game) {
    const ult = f.el.ultimate;
    const imp = ult.impact;
    const inner = ARENA.inner;
    const mark = f.state.mark;
    const target = f.opponent;

    f.state.jump = 'ground';
    f.ult.active = 0;
    f.offstage = 0;
    f.state.mark = null;
    // il retombe lance en avant : la visée reprend au pas suivant
    this.setPhase(f, 'recover');

    if (mark) {
      let x = mark.x;
      let y = mark.y;
      if (target && target.alive) {
        // décalé le long de l'axe qui le sépare encore du marqueur, ou par
        // défaut vers le haut : la chute vient du ciel
        const dx = mark.x - f.x;
        const dy = mark.y - f.y;
        const len = Math.hypot(dx, dy) || 1;
        const ox = len > 1 ? dx / len : 0;
        const oy = len > 1 ? dy / len : -1;
        const gap = (f.radius + target.radius) * ult.landOffset;
        x = mark.x - ox * gap;
        y = mark.y - oy * gap;
        f.weaponAngle = Math.atan2(target.y - y, target.x - x);
      }
      f.x = clamp(x, inner.left + f.radius, inner.right - f.radius);
      f.y = clamp(y, inner.top + f.radius, inner.bottom - f.radius);
    }

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
        // même comptabilité que `Match.resolveMelee` : la chute est une touche,
        // donc elle fait monter la pile **et** pose le verrou. Sans le verrou,
        // la lance pouvait toucher une seconde fois dans la foulée : pendant le
        // vol, `Fighter.step` sort avant de décompter `meleeCd`, qui reste donc
        // figé à la valeur qu'il avait au décollage — zéro si le Bond a été
        // lancé en pleine charge, la seule phase où le garde-fou ne s'applique
        // pas.
        f.meleeCd = melee.cooldown;
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
