/**
 * Déroulement d'un duel : machine à états, mise à jour et rendu.
 *
 * **Deux combattants ou plus.** Le moteur a longtemps été écrit pour `a`/`b`
 * de bout en bout ; il accepte maintenant `n` combattants répartis en camps,
 * ce qui donne le 2 contre 2 et le chacun-pour-soi. Un camp par combattant
 * (le défaut) et deux combattants redonnent exactement le duel d'origine.
 *
 * **Et « exactement » est à prendre au pied de la lettre** : partout où la
 * généralisation aurait réécrit les expressions du duel, le chemin à deux est
 * conservé mot pour mot dans une branche à part — même discipline que la
 * pondération des masses ou `bladeSegment()`. La multiplication flottante n'est
 * pas associative, et regrouper autrement les mêmes produits a déjà déplacé
 * deux affrontements. Preuve : `tools/matrix.mjs` doit rester identique au
 * caractère près.
 *
 * Phases : intro → fight → ko → **victory** → over
 *
 * `victory` est le temps de gloire : les perdants ont disparu de l'arène, **le
 * ou les vainqueurs** y restent, glissent au centre, grandissent, et un bandeau
 * les nomme avant que l'écran de résultat ne se pose. Deux durées le règlent,
 * et il ne faut pas les confondre : `MATCH.victory.settle` est le temps de
 * **mise en place** (glissement, ressort, nappe) et `MATCH.victoryDuration` le
 * temps **total**. Allonger la seconde ne fait que tenir l'image plus
 * longtemps ; sans cette séparation, elle ralentissait toute l'animation.
 *
 * @module game/match
 */

import { ARENA, MATCH, PHYSICS } from '../data/tuning.js';
import { TAU, wrapAngle } from '../core/math.js';
import { assertFrozen } from '../data/freeze.js';
import { getElement } from '../data/elements.js';
import { Fighter } from './fighter.js';
import { Projectiles } from './projectiles.js';
import { abilitiesFor } from './abilities/index.js';
import { resolveBodies, weaponHit } from './physics.js';
import { Effects } from '../render/effects.js';
import { Flair } from '../render/flair.js';
import { createRng } from '../core/rng.js';
import { buildBackdrop, drawBackdrop } from '../render/scene.js';
import { drawFighterHud, drawRosterHp, drawRosterPowers } from '../render/hud.js';
import { UI, label } from '../ui/lang.js';

/**
 * Point de départ du combattant de rang `i` sur `n`.
 *
 * **À deux, les deux points relevés sur la vidéo, tels quels** — c'est la même
 * discipline que partout ailleurs ici : le duel ne doit pas passer par un
 * calcul, fût-il équivalent. Au-delà, un anneau centré, chacun tourné vers le
 * centre : c'est la seule disposition qui ne privilégie personne, alors qu'une
 * grille ou deux lignes donneraient à ceux du milieu deux voisins immédiats et
 * aux autres un seul.
 */
function spawnFor(i, n) {
  if (n === 2) return MATCH.spawn[i];
  const a = MATCH.ring.depart + (TAU * i) / n;
  return {
    x: 0.5 + Math.cos(a) * MATCH.ring.rayon * 0.5,
    y: 0.5 + Math.sin(a) * MATCH.ring.rayon * 0.5,
    // face au centre, plus le léger écart que le `rng` ajoutera
    heading: wrapAngle(a + Math.PI),
  };
}

export class Match {
  /**
   * @param {{elements:string[], teams?:number[], rng:object,
   *          lang:'ref'|'fr', debug?:boolean, onEnd:(result:object)=>void}} opts
   *
   * `teams` donne le camp de chaque combattant, dans l'ordre d'`elements`.
   * Omis, chacun a le sien — chacun pour soi, et le duel d'origine quand il y
   * en a deux. `[0, 0, 1, 1]` fait un 2 contre 2.
   *
   * **Les points de vie ne se règlent plus.** Chacun part des 100 du cahier
   * des charges ; seul un module peut en poser d'autres à un combattant qu'il
   * fait entrer (le Clone d'ombre du Shinobi naît à 25), et c'est le paramètre
   * `maxHp` du `Fighter`, pas une option de partie.
   */
  constructor({ elements, teams = null, rng, lang = 'ref', debug = false, onEnd }) {
    const els = elements.map((id) => getElement(id));
    if (els.length < 2) throw new Error('[match] il faut au moins deux combattants');
    for (const el of els) assertFrozen(el, el.id);
    const n = els.length;
    const elA = els[0];
    const elB = els[1];

    this.rng = rng;
    // Aléa réservé au rendu (tremblement de caméra) : il ne doit jamais
    // consommer le flux de la simulation, sinon deux exécutions d'un même
    // seed divergeraient selon le nombre d'images affichées.
    this.viewRng = createRng((rng.seed ?? 1) ^ 0x9e3779b9);
    this.lang = lang;
    this.debug = debug;
    this.onEnd = onEnd;

    this.fx = new Effects(rng, this.viewRng);
    // Mise en scène : banc de particules et aléa **séparés**, pilotés par
    // viewRng. Rien de ce qu'elle fait ne peut décaler la simulation.
    this.flair = new Flair(this.viewRng);
    this.projectiles = new Projectiles(this.fx);

    /**
     * Camps. Par défaut le rang de chacun : à deux, cela redonne 0 et 1, donc
     * le duel. `teams` n'est lu que pour former les camps — le moteur ne
     * connaît ensuite que « même camp » ou « camp adverse ».
     */
    this.teams = teams ? teams.slice(0, n) : els.map((_, i) => i);

    this.fighters = els.map((el, i) => new Fighter(el, i, rng, spawnFor(i, n)));
    this.fighters.forEach((f, i) => { f.team = this.teams[i]; });
    // `a` et `b` restent les deux premiers : le HUD du duel, la mise au point et
    // l'écran de fin les lisent, et ils n'ont de sens qu'à deux.
    this.a = this.fighters[0];
    this.b = this.fighters[1];
    if (n === 2) {
      this.a.opponent = this.b;
      this.b.opponent = this.a;
    } else {
      this.retarget();
    }

    this.modules = new Map(this.fighters.map((f) => [f, abilitiesFor(f.el.id)]));
    for (const [f, mod] of this.modules) mod.init(f, this);

    this.flair.attach(this.fighters);
    this.backdrop = buildBackdrop({ fighters: els, teams: this.teams, lang });

    this.phase = 'intro';
    this.time = 0;
    this.phaseTime = 0;
    this.shakeMag = 0;
    this.shakeTime = 0;
    /**
     * Départs et arrivées de la parade, **un par vainqueur** : un 2 contre 2
     * se gagne à deux, et les deux paradent.
     * @type {Array<{x:number,y:number}>|null}
     */
    this.victoryFrom = null;
    /** @type {Array<{x:number,y:number}>} */
    this.victoryTo = [];
    /** @type {Fighter[]|null} Le camp vainqueur, survivants seulement. */
    this.winners = null;
    this.victoryRing = 0;
    this.victorySpark = 0;
    this.stats = {
      hits: new Array(n).fill(0),
      damage: new Array(n).fill(0),
      duration: 0,
    };
    /** @type {Fighter|null} */
    this.winner = null;
    /** Ordre des chutes, pour le classement d'une partie à plusieurs. */
    this.fallen = [];
    /**
     * Combattants qui entrent au **prochain** pas — voir `join()`.
     * @type {Fighter[]}
     */
    this.arrivants = [];
  }

  /**
   * **Un combattant entre en cours de partie.**
   *
   * Le moteur savait déjà jouer *n* combattants répartis en camps (invariant
   * 13) ; il ne savait pas que ce *n* puisse changer une fois le duel commencé.
   * Il ne manquait que ceci : tenir à jour les cinq choses indexées par
   * combattant, et rien d'autre. Le reste — collisions, mêlée, ciblage, HUD,
   * condition de victoire, classement — travaille déjà sur `this.fighters` et
   * suit sans une ligne.
   *
   * **L'entrée est différée d'un pas, et c'est le point délicat.** L'appelant
   * est un module, or `update()` est en train d'itérer `this.modules` quand il
   * l'appelle : une `Map` de JavaScript **visite les entrées ajoutées pendant
   * l'itération**, donc le nouveau venu verrait son `update()` tourner dans
   * l'image même de sa naissance, avant d'avoir fait son premier pas. Les
   * boucles de corps et de mêlée de ce pas-là sont passées elles aussi. Il est
   * donc mis en file, et `flushArrivals()` l'inscrit à la fin du pas.
   *
   * Le moteur ne sait pas *ce* qui entre ni *pourquoi* — c'est le Clone d'ombre
   * du Shinobi aujourd'hui, ça pourrait être un renfort ou une invocation
   * demain. Même forme que les compteurs génériques du `Fighter`.
   *
   * @param {Fighter} fighter déjà construit, camp et teinte posés par le module
   */
  join(fighter) {
    this.arrivants.push(fighter);
    return fighter;
  }

  /** Inscrit les arrivants du pas. Voir `join()` pour le pourquoi du différé. */
  flushArrivals() {
    if (!this.arrivants.length) return;
    for (const f of this.arrivants) {
      this.fighters.push(f);
      this.teams.push(f.team);
      // les deux tableaux de statistiques sont indexés par rang dans
      // `fighters` : un rang de plus, une case de plus dans chacun
      this.stats.hits.push(0);
      this.stats.damage.push(0);
      const mod = abilitiesFor(f.el.id);
      this.modules.set(f, mod);
      mod.init(f, this);
      this.flair.attach([f]);
    }
    this.arrivants.length = 0;
    // il y a désormais plus de deux combattants : chacun vise le plus proche
    this.retarget();
  }

  /** Le sort du duel est scellé : plus aucun dégât ni soin ne compte. */
  get settled() {
    return this.phase === 'victory' || this.phase === 'over';
  }

  shake(mag, time) {
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeTime = Math.max(this.shakeTime, time);
  }

  /* ------------------------------------------------------------------ */
  /* Simulation                                                          */
  /* ------------------------------------------------------------------ */

  update(dtRaw) {
    const dt = this.phase === 'ko' ? dtRaw * MATCH.koSlowmo : dtRaw;
    this.time += dt;
    this.phaseTime += dtRaw;

    if (this.shakeTime > 0) {
      this.shakeTime -= dtRaw;
      if (this.shakeTime <= 0) this.shakeMag = 0;
    }

    switch (this.phase) {
      case 'intro':
        if (this.phaseTime >= MATCH.introDuration) this.setPhase('fight');
        break;
      case 'ko':
        if (this.phaseTime >= MATCH.koDuration) this.startVictory();
        break;
      case 'victory':
        this.tickVictory(dtRaw);
        if (this.phaseTime >= MATCH.victoryDuration) {
          this.setPhase('over');
          this.onEnd?.(this.result());
        }
        break;
      default:
        break;
    }

    // combattants — pendant la parade du vainqueur, plus personne ne se déplace,
    // et pendant l'attente d'avant-combat personne n'avance encore
    if (this.phase !== 'victory') {
      const attente = this.phase === 'intro';
      for (const f of this.fighters) {
        if (this.phase === 'ko' && !f.alive) continue;
        f.step(dt, this.time, attente);
      }
    }

    // corps à corps + collisions
    if (this.phase === 'fight') {
      if (this.fighters.length === 2) {
        // **Le chemin du duel, mot pour mot.** Les boucles ci-dessous rendent
        // les mêmes appels dans le même ordre pour deux combattants, mais
        // « les mêmes appels » ne suffit pas ici : c'est « les mêmes
        // expressions » qui est exigé (invariant 3).
        resolveBodies(this.a, this.b);
        this.resolveMelee(this.a, this.b);
        this.resolveMelee(this.b, this.a);
      } else {
        const fs = this.fighters;
        // Les corps se bousculent **entre tous**, alliés compris : un coéquipier
        // reste un obstacle, et c'est ce qui rend le 2 contre 2 lisible.
        for (let i = 0; i < fs.length; i++) {
          for (let j = i + 1; j < fs.length; j++) resolveBodies(fs[i], fs[j]);
        }
        // Les armes, elles, ne touchent que le camp adverse.
        for (let i = 0; i < fs.length; i++) {
          for (let j = 0; j < fs.length; j++) {
            if (i !== j && fs[i].team !== fs[j].team) this.resolveMelee(fs[i], fs[j]);
          }
        }
      }
    }

    // À plusieurs, chacun vise l'ennemi vivant le plus proche, et il peut
    // changer d'un pas à l'autre. En duel, `opponent` est posé une fois pour
    // toutes à la construction : ne pas y toucher, les modules le lisent sans
    // jamais le tester.
    if (this.fighters.length > 2) this.retarget();

    // pouvoirs (arrêtés dès le K.O. : la parade doit rester lisible)
    if (this.phase !== 'victory') {
      for (const [f, mod] of this.modules) {
        if (!f.alive) continue;
        mod.update(f, dt, this.time, this);
      }
    }

    // dégâts sur la durée (brûlure…) : tout passe par damage()
    for (const f of this.fighters) this.tickDots(f, dt);

    this.projectiles.update(dt, this.time, this.fighters, (target, amount, source, opts) => {
      this.damage(target, amount, source, opts);
      // effets décrits par le projectile lui-même (brûlure d'une braise…)
      const onHit = opts.def?.onHit;
      if (!onHit) return;
      // Même grammaire que `melee.onHit` : la pile du tireur avance au coup
      // AU BUT. Elle avance aussi quand le coup est fatal — c'est bien un coup
      // au but, et c'est ce que compte le relevé du Hors-la-loi.
      if (onHit.stackGain) {
        source.stacks = Math.min(onHit.stackMax ?? Infinity, source.stacks + onHit.stackGain);
      }
      if (!target.alive) return;
      if (onHit.slow) target.applySlow(onHit.slow, onHit.slowDuration ?? 1.5, this.time);
      if (onHit.dot) target.applyDot({ ...onHit.dot, source }, this.time);
    });
    this.fx.update(dt);
    // incantation d'ultime : détectée ici plutôt que dans les huit modules —
    // le moteur n'a pas besoin de savoir ce que fait l'ultime pour l'annoncer
    for (const f of this.fighters) {
      const on = f.ult.active > 0;
      if (on && !f.wasUlting) this.flair.cast(f, f.el.look.flair?.castFlash);
      f.wasUlting = on;
    }
    this.flair.update(dtRaw, this.fighters, this.phase === 'fight');

    // les arrivants du pas entrent ici, une fois toutes les boucles passées
    this.flushArrivals();

    if (this.phase === 'fight') this.stats.duration = this.time;
  }

  setPhase(next) {
    this.phase = next;
    this.phaseTime = 0;
  }

  /** @param {Fighter} f */
  tickDots(f, dt) {
    if (!f.alive || !f.dots.length) return;
    for (const d of f.dots) {
      if (d.until <= this.time) continue;
      d.timer -= dt;
      if (d.timer > 0) continue;
      d.timer = d.interval;
      this.damage(f, d.damage, d.source, { kind: 'dot', silent: true });
      // Pas d'étincelles au tic : sur la vidéo, un dégât sur la durée ne se
      // signale que par l'anneau et la teinte du corps. (En tirer une gerbe
      // consommerait en plus le RNG de simulation et casserait `?seed=`.)
    }
  }

  /** @param {Fighter} attacker @param {Fighter} target */
  resolveMelee(attacker, target) {
    const hit = weaponHit(attacker, target);
    if (!hit) return;

    const melee = attacker.el.weapon.melee;
    // dégâts et recul peuvent dépendre des stats évolutives du combattant
    const dmg = typeof melee.damage === 'function' ? melee.damage(attacker) : melee.damage;
    const kb = typeof melee.knockback === 'function' ? melee.knockback(attacker) : melee.knockback;

    attacker.meleeCd = melee.cooldown;
    this.damage(target, dmg, attacker, {
      kind: 'melee',
      x: hit.x,
      y: hit.y,
      nx: hit.nx,
      ny: hit.ny,
      knockback: kb,
    });

    // recul de l'attaquant (il repart en arrière, observé sur la vidéo)
    attacker.push(-hit.nx, -hit.ny, melee.selfRecoil);

    /**
     * **Décollement à l'impact.** Le recul est une impulsion : elle décide de
     * la vitesse, pas de la position, donc à bout portant les deux corps
     * restent imbriqués le temps que l'impulsion les sépare — et le coup se lit
     * comme spongieux plutôt que sec.
     *
     * On les écarte donc franchement, dans l'image même de la touche, jusqu'à
     * ce qu'ils ne se chevauchent plus. `resolveBodies` fait le même calcul au
     * pas suivant ; le faire ici évite l'image d'interpénétration entre les
     * deux, qui est justement celle où l'œil juge le choc.
     */
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const d = Math.hypot(dx, dy);
    const min = attacker.radius + target.radius;
    if (d > 0 && d < min) {
      const k = (min - d) / 2 / d;
      attacker.x -= dx * k;
      attacker.y -= dy * k;
      target.x += dx * k;
      target.y += dy * k;
    }

    // effets à la touche décrits dans la fiche (piles, brûlure, marquage…)
    const onHit = melee.onHit;
    if (onHit) {
      if (onHit.stackGain) attacker.stacks += onHit.stackGain;
      if (onHit.stack2Gain) attacker.stacks2 += onHit.stack2Gain;
      if (onHit.stackMax) attacker.stacks = Math.min(attacker.stacks, onHit.stackMax);
      if (onHit.stack2Max) attacker.stacks2 = Math.min(attacker.stacks2, onHit.stack2Max);
      if (onHit.slowPerStack) {
        const slow = Math.min(onHit.slowMax, attacker.stacks * onHit.slowPerStack);
        target.applySlow(slow, onHit.slowDuration, this.time);
      }
      if (onHit.slow) target.applySlow(onHit.slow, onHit.slowDuration ?? 1.5, this.time);
      if (onHit.tint) {
        target.applyTint(onHit.tint.color, onHit.tint.duration, this.time, onHit.tint.alpha ?? 1);
      }
      if (onHit.dot) {
        target.applyDot(
          {
            damage: typeof onHit.dot.damage === 'function' ? onHit.dot.damage(attacker) : onHit.dot.damage,
            interval: onHit.dot.interval,
            duration:
              typeof onHit.dot.duration === 'function' ? onHit.dot.duration(attacker) : onHit.dot.duration,
            source: attacker,
            ring: onHit.dot.ring ?? null,
            tint: onHit.dot.tint ?? null,
          },
          this.time,
        );
      }
    }

    // le module de pouvoirs de l'attaquant peut réagir à sa propre touche
    this.modules.get(attacker)?.onLand?.(attacker, target, hit, this);
  }

  /**
   * Point d'entrée unique des dégâts : PV, flash, recul, particules, charge
   * d'ultime, détection du K.O.
   */
  damage(target, amount, source, opts = {}) {
    if (!target.alive || this.settled) return;
    if (target.invulnerable > 0 && opts.kind !== 'tether') return;

    let amt = Math.max(0, Math.round(amount * this.damageScale()));

    // un coup à zéro reste un coup : la cible clignote quand même
    if (amt === 0) return;

    target.hp = Math.max(0, target.hp - amt);
    target.flash = PHYSICS.hitFlash;

    /**
     * En duel, l'expression d'origine : un dégât venu d'ailleurs que du camp A
     * (un clone du Shinobi, par exemple) est porté au compte du camp B, ce qui
     * est le comportement historique. À plusieurs, le vrai rang — et `-1`
     * ramené à 0 pour une source qui n'est pas un combattant du tableau.
     */
    const idx =
      this.fighters.length === 2
        ? (source === this.a ? 0 : 1)
        : Math.max(0, this.fighters.indexOf(source));
    this.stats.damage[idx] += amt;
    if (opts.kind === 'melee' || opts.kind === 'projectile') this.stats.hits[idx]++;

    if (opts.knockback) target.push(opts.nx ?? 0, opts.ny ?? 0, opts.knockback);

    // charge d'ultime gagnée par l'attaquant
    if (!opts.silent && source?.el?.ultimate) {
      source.ult.charge = Math.min(100, source.ult.charge + (source.el.ultimate.chargeOnHit ?? 0));
    }

    // gerbe d'étincelles aux couleurs de l'attaquant
    if (!opts.silent) {
      const x = opts.x ?? target.x;
      const y = opts.y ?? target.y;
      this.fx.burst(x, y, opts.kind === 'melee' ? 14 : 8, {
        color: [source.el.look.accent, '#ffffff', target.el.look.body],
        speed: opts.kind === 'melee' ? 300 : 180,
        size: 5,
        life: 0.4,
      });
      this.shake(opts.kind === 'melee' ? 4 : 2, 0.18);
    }
    // mise en scène : le nombre s'envole et la gerbe part aux couleurs de
    // l'attaquant, quel que soit le canal de dégâts (y compris les silencieux)
    this.flair.hit(opts.x ?? target.x, opts.y ?? target.y, amt, source, target);

    if (target.hp <= 0) this.knockout(target, source);
  }

  /** Facteur de mort subite (1 avant le seuil, croissant ensuite). */
  damageScale() {
    const sd = MATCH.suddenDeath;
    if (this.time <= sd.after) return 1;
    return Math.min(sd.max, 1 + (this.time - sd.after) / sd.ramp);
  }

  /**
   * Soin — pendant du point d'entrée unique des dégâts. Plafonné aux PV de
   * départ, et sans effet une fois le duel terminé.
   */
  heal(target, amount, source) {
    if (!target.alive || this.settled) return 0;
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + Math.max(0, amount));
    const healed = target.hp - before;
    if (healed > 0) {
      this.fx.burst(target.x, target.y, 8, {
        color: [source?.el?.accent ?? '#4ade80', '#bbf7d0', '#ffffff'],
        speed: 150,
        size: 5,
        life: 0.55,
      });
    }
    return healed;
  }

  knockout(loser, winner) {
    if (this.settled || this.phase === 'ko') return;
    this.fallen.push(loser);

    if (this.fighters.length > 2) {
      /**
       * **À plusieurs, une mort n'arrête pas le duel** : elle ne l'arrête que
       * s'il ne reste qu'un camp debout. C'est la seule règle qui sépare le 2
       * contre 2 du chacun-pour-soi — dans le second, chacun est son propre
       * camp, donc « un seul camp debout » veut dire « un seul survivant ».
       */
      this.deathFx(loser);
      const debout = new Set(this.fighters.filter((f) => f.alive).map((f) => f.team));
      if (debout.size > 1) return;
      // Le vainqueur affiché est le survivant ; à égalité stricte (deux morts
      // dans la même image) on retombe sur l'auteur du coup.
      this.winner = this.fighters.find((f) => f.alive) ?? winner ?? loser;
      this.setPhase('ko');
      return;
    }

    this.winner = winner ?? (loser === this.a ? this.b : this.a);
    this.setPhase('ko');
    this.deathFx(loser);
  }

  /** Gerbe, anneau et secousse d'une mort. Extrait pour servir aux deux cas. */
  deathFx(loser) {
    this.fx.burst(loser.x, loser.y, 60, {
      color: [loser.el.look.body, '#ffffff', loser.el.look.accent],
      speed: 520,
      size: 7,
      life: 1.1,
    });
    this.fx.ring(loser.x, loser.y, 10, 260, 0.7, loser.el.look.body, 10, true);
    this.shake(12, 0.6);
  }

  /**
   * Recalcule la cible de chacun : l'**ennemi vivant et en scène le plus
   * proche**. Appelé une fois par pas, avant les modules, uniquement à plus de
   * deux combattants.
   *
   * Le repli garde la cible précédente plutôt que de rendre `null` : les
   * modules lisent `f.opponent` sans le tester, parce qu'en duel il ne peut pas
   * manquer. Leur imposer un test partout pour un cas de fin de partie aurait
   * coûté une ligne dans chacun, avec une chance de l'oublier.
   */
  retarget() {
    for (const f of this.fighters) {
      let best = null;
      let bestD = Infinity;
      for (const g of this.fighters) {
        if (g === f || g.team === f.team || !g.alive || !g.onStage) continue;
        const d = (g.x - f.x) ** 2 + (g.y - f.y) ** 2;
        if (d < bestD) { bestD = d; best = g; }
      }
      if (best) f.opponent = best;
      else if (!f.opponent) f.opponent = this.fighters.find((g) => g !== f) ?? null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Parade du vainqueur                                                 */
  /* ------------------------------------------------------------------ */

  /**
   * Les perdants s'effacent, **le ou les vainqueurs** restent et s'illuminent.
   *
   * Au pluriel parce qu'un 2 contre 2 se gagne à deux : ne mettre en scène que
   * `this.winner` laissait son coéquipier figé là où il se trouvait, ce qui se
   * lisait comme un bug. Ils glissent donc tous vers le centre, écartés de
   * `pairGap`, et un bandeau les nomme.
   */
  startVictory() {
    this.setPhase('victory');
    this.victoryRing = 0;
    this.victorySpark = 0;
    // l'arène se vide : ni projectiles ni zones ne doivent survivre au duel
    this.projectiles.list.length = 0;
    const w = this.winner;
    if (!w) return;

    /**
     * Le camp vainqueur au complet, survivants seulement. En duel c'est
     * `[this.winner]` — l'expression d'origine, un seul paradant au centre.
     */
    this.winners =
      this.fighters.length === 2
        ? [w]
        : this.fighters.filter((f) => f.alive && f.team === w.team);
    if (!this.winners.length) this.winners = [w];

    const i = ARENA.inner;
    const cx = (i.left + i.right) / 2;
    const cy = (i.top + i.bottom) / 2;
    const n = this.winners.length;
    const gap = MATCH.victory.pairGap;

    this.victoryFrom = this.winners.map((f) => ({ x: f.x, y: f.y }));
    this.victoryTo = this.winners.map((_, k) => ({
      x: cx + (k - (n - 1) / 2) * gap,
      y: cy,
    }));

    for (const f of this.winners) {
      f.impulseX = 0;
      f.impulseY = 0;
      // il se présente dans ses propres couleurs : plus de brûlure, plus de givre
      f.dots.length = 0;
      f.slows.length = 0;
      f.offstage = 0; // un vainqueur en plein bond redescend pour la parade
      f.tint = null;
      f.flash = 0;
      this.fx.ring(f.x, f.y, f.radius, MATCH.victory.ringTo, 0.55, f.el.look.accent, 14, true);
      this.fx.burst(f.x, f.y, 40, {
        color: [f.el.look.body, f.el.look.accent, '#ffffff'],
        speed: 340,
        size: 6,
        life: 0.8,
      });
    }
    this.shake(5, 0.3);
  }

  /** Anneaux et étincelles pendant les secondes de gloire. */
  tickVictory(dt) {
    const gagnants = this.winners ?? (this.winner ? [this.winner] : []);
    if (!gagnants.length) return;
    const v = MATCH.victory;

    // ils rejoignent le centre de l'arène, en douceur (ease-out cubique)
    if (this.victoryFrom) {
      const t = Math.min(1, this.phaseTime / (v.settle * 0.7));
      const k = 1 - (1 - t) ** 3;
      gagnants.forEach((f, i) => {
        const de = this.victoryFrom[i];
        const vers = this.victoryTo[i];
        if (!de || !vers) return;
        f.x = de.x + (vers.x - de.x) * k;
        f.y = de.y + (vers.y - de.y) * k;
      });
    }

    for (const f of gagnants) {
      // l'arme s'emballe (le reste du combattant est figé)
      f.weaponAngle = wrapAngle(f.weaponAngle + f.el.weapon.spin * f.spinDir * v.spin * dt);
      f.flash = Math.max(0, f.flash - dt);
    }

    // Un seul minuteur d'anneau pour tout le monde : à deux vainqueurs, deux
    // horloges indépendantes battraient en désordre.
    this.victoryRing -= dt;
    if (this.victoryRing <= 0) {
      this.victoryRing = v.ringEvery;
      for (const f of gagnants) {
        this.fx.ring(f.x, f.y, f.radius * 0.9, v.ringTo, 0.6, f.el.look.accent, 12, true);
      }
    }

    this.victorySpark += dt * v.sparks;
    while (this.victorySpark >= 1) {
      this.victorySpark -= 1;
      // Les étincelles se répartissent entre les vainqueurs plutôt que de
      // doubler : le débit à l'écran reste celui du duel.
      const w = gagnants[(this.victorySpark * gagnants.length | 0) % gagnants.length];
      const a = this.viewRng.range(0, TAU);
      const r = w.radius * this.viewRng.range(0.8, 1.5);
      this.fx.spawn({
        kind: 'spark',
        x: w.x + Math.cos(a) * r,
        y: w.y + Math.sin(a) * r,
        vx: this.viewRng.spread(60),
        vy: -this.viewRng.range(80, 260),
        life: this.viewRng.range(0.5, 1),
        size: this.viewRng.range(5, 11),
        color: this.viewRng.pick([w.el.look.body, w.el.look.accent, '#ffffff']),
        drag: 1.2,
      });
    }
  }

  /**
   * Ressort d'échelle : le vainqueur enfle vers sa taille de gloire, avec une
   * petite oscillation amortie au démarrage — et il **reste** plus grand, pour
   * que la dernière image du duel soit une vraie pose de vainqueur.
   */
  victoryScale() {
    const t = Math.min(1, this.phaseTime / MATCH.victory.settle);
    const pop = MATCH.victory.pop;
    const grow = 1 - (1 - t) ** 3; // ease-out cubique
    const wobble = 0.09 * Math.sin(t * 17) * Math.exp(-t * 3.4);
    return 1 + pop * grow + wobble;
  }

  result() {
    const winner = this.winner ?? this.a;
    /**
     * `loser` n'a de sens qu'en duel. À plusieurs on rend **le dernier tombé**
     * — celui qui a tenu le plus longtemps face au vainqueur, donc le seul
     * second qui veuille dire quelque chose. `ui/result.js` s'en sert pour la
     * ligne « X bat Y » et affiche en plus le classement quand il y en a un.
     */
    const loser =
      this.fighters.length === 2
        ? (winner === this.a ? this.b : this.a)
        : (this.fallen[this.fallen.length - 1] ?? this.fighters.find((f) => f !== winner));
    return {
      winner: winner.el,
      loser: loser.el,
      winnerHp: Math.max(0, Math.ceil(winner.hp)),
      duration: this.stats.duration,
      hits: this.stats.hits,
      damage: this.stats.damage,
      /** Classement du dernier au premier tombé, vainqueur en tête. Vide en duel. */
      standings:
        this.fighters.length === 2
          ? []
          : [winner, ...this.fallen.slice().reverse().filter((f) => f !== winner)].map((f) => f.el),
      teams: this.teams,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Rendu                                                               */
  /* ------------------------------------------------------------------ */

  /** @param {CanvasRenderingContext2D} ctx */
  draw(ctx) {
    // 1. décor statique (jamais modifié)
    drawBackdrop(ctx, this.backdrop);

    // 2. contenu de l'arène (seul élément soumis au tremblement)
    ctx.save();
    if (this.shakeMag > 0) {
      const k = this.shakeTime > 0 ? this.shakeMag : 0;
      ctx.translate(this.viewRng.spread(k), this.viewRng.spread(k));
    }

    const inner = ARENA.inner;
    ctx.save();
    ctx.beginPath();
    ctx.rect(inner.left, inner.top, inner.right - inner.left, inner.bottom - inner.top);
    ctx.clip();

    // tout au fond : la nappe de sol et les ondes de mur, qui ne passent
    // jamais devant les combattants
    this.flair.drawFloor(ctx, this.fighters);
    this.flair.drawWalls(ctx);

    // pendant la parade, l'arène est nettoyée : plus une zone, plus un pouvoir
    if (this.phase !== 'victory') {
      for (const [f, mod] of this.modules) mod.drawUnder(ctx, f, this, this.time);
    }
    ctx.restore();

    // passe **hors arène** : certains effets débordent volontairement du cadre
    // (le dôme du Dôme de drain recouvre jusqu'au HUD dans la vidéo)
    if (this.phase !== 'victory') {
      for (const [f, mod] of this.modules) mod.drawUnbounded?.(ctx, f, this, this.time);
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(inner.left, inner.top, inner.right - inner.left, inner.bottom - inner.top);
    ctx.clip();
    this.flair.drawWake(ctx, this.fighters, this.time);
    this.flair.drawUnder(ctx, this.fighters, this.time);
    this.fx.draw(ctx, true);
    this.projectiles.draw(ctx);
    /**
     * **Qui reste visible une fois mort.**
     *
     * En duel, le comportement d'origine : le perdant reste en place pendant le
     * K.O. au ralenti, qui est la belle image du duel, et disparaît à la parade.
     *
     * À plusieurs, un mort **quitte le terrain immédiatement** : le duel
     * continue sans lui, et le laisser gisant encombrait l'arène pour tout le
     * reste de la partie. Seul le dernier tombé reste, le temps du K.O. final,
     * pour que la fin garde la même image que le duel.
     */
    const showDead = this.phase === 'fight' || this.phase === 'ko';
    const dernierTombe = this.fallen[this.fallen.length - 1];
    if (this.phase === 'victory') this.drawVictoryGlow(ctx);
    for (const f of this.fighters) {
      if (!f.alive) {
        if (this.fighters.length === 2) {
          if (!showDead) continue;
        } else if (this.phase !== 'ko' || f !== dernierTombe) {
          continue;
        }
      }
      // en l'air : il a quitté l'arène, on ne dessine que son marqueur au sol
      if (f.offstage > 0) continue;
      if (this.phase === 'victory' && (this.winners ?? []).includes(f)) this.drawWinner(ctx, f);
      else f.draw(ctx, this.time);
    }
    if (this.phase !== 'victory') {
      // `drawOver` est **facultatif**, comme `drawUnbounded` et `specialBar` :
      // un module qui n'a rien à poser par-dessus les combattants ne déclare
      // pas une méthode vide. Le Shinobi y dessinait ses clones ; ce sont des
      // combattants du tableau désormais, donc la boucle de rendu s'en charge.
      for (const [f, mod] of this.modules) mod.drawOver?.(ctx, f, this, this.time);
      /**
       * Un pouvoir dessiné dans `drawOver` peut recouvrir sa cible — la
       * Tempête de sève du Mage, entre autres, qui masquait le chiffre de PV
       * de l'adversaire sous sa nuée. Repassé pour tous plutôt que pour la
       * seule cible touchée : le moteur ne sait toujours pas lequel a un
       * pouvoir qui recouvre, et un second `fillText` opaque au même endroit
       * ne change rien à l'écran pour qui n'est recouvert par rien.
       *
       * `globalAlpha` remis à 1 d'abord : un `drawOver` qui l'aurait laissé
       * en cours de fondu (mal restauré derrière son propre `ctx.save()`)
       * délaverait sinon le chiffre au lieu de le rendre net.
       */
      ctx.globalAlpha = 1;
      for (const f of this.fighters) {
        if (!f.alive && !showDead) continue;
        if (f.offstage > 0) continue;
        f.drawHpNumber(ctx);
      }
    }
    if (this.phase === 'fight') this.flair.drawDanger(ctx, this.fighters, this.time);
    if (this.debug) {
      for (const f of this.fighters) f.drawDebug(ctx);
      this.projectiles.drawDebug(ctx);
    }
    this.flair.drawFlash(ctx);
    this.flair.drawPops(ctx);
    ctx.restore();

    // effets non clippés (onde de choc du Blizzard qui déborde de l'arène)
    this.fx.draw(ctx, false);
    ctx.restore();

    // 3. HUD
    // `specialBar` est optionnel : un combattant sans troisième créneau de
    // pouvoir ne l'implémente pas et n'affiche donc pas de deuxième jauge —
    // même forme d'accord que `drawUnbounded`.
    if (this.fighters.length === 2) {
      const modA = this.modules.get(this.a);
      const modB = this.modules.get(this.b);
      drawFighterHud(ctx, this.a, 'left', modA.barValue(this.a), this.lang, modA.specialBar?.(this.a));
      drawFighterHud(ctx, this.b, 'right', modB.barValue(this.b), this.lang, modB.specialBar?.(this.b));
    } else {
      // Points de vie en haut, pouvoirs et stat en bas : les deux bandeaux
      // partagent le même ordre de placement, donc un combattant est à la même
      // colonne et à la même rangée dans les deux.
      drawRosterHp(ctx, this.fighters, this.lang);
      drawRosterPowers(ctx, this.fighters, this.modules, this.lang);
    }

    if (this.phase === 'intro') this.drawIntro(ctx);
    if (this.phase === 'victory') this.drawWinnerBanner(ctx);
    if (this.debug) this.drawDebugOverlay(ctx);
  }

  /** Nappe de lumière à la couleur de chaque vainqueur, sous lui. */
  drawVictoryGlow(ctx) {
    const gagnants = this.winners ?? (this.winner ? [this.winner] : []);
    const t = Math.min(1, this.phaseTime / MATCH.victory.settle);
    for (const w of gagnants) {
      const r = w.radius * (2.4 + 1.6 * t);
      const g = ctx.createRadialGradient(w.x, w.y, w.radius * 0.5, w.x, w.y, r);
      g.addColorStop(0, w.el.look.aura.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.globalAlpha = 0.9 * (1 - t * 0.35);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(w.x, w.y, r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Un vainqueur, agrandi par le ressort de la parade. */
  drawWinner(ctx, w) {
    const s = this.victoryScale();
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.scale(s, s);
    ctx.translate(-w.x, -w.y);
    w.draw(ctx, this.time);
    ctx.restore();
  }

  /**
   * **Bandeau des vainqueurs**, pendant la parade.
   *
   * C'est la dernière image du duel et de la vidéo exportée, et jusqu'ici rien
   * n'y nommait le gagnant : le nom n'apparaissait qu'à l'écran de résultat,
   * qui n'est pas filmé. Il est donc écrit dans l'arène, au-dessus des
   * vainqueurs, dans la couleur du premier d'entre eux.
   *
   * Il entre par un fondu court plutôt que d'apparaître d'un coup : sur deux
   * secondes, une apparition sèche se lit comme un défaut d'affichage.
   */
  drawWinnerBanner(ctx) {
    const gagnants = this.winners ?? (this.winner ? [this.winner] : []);
    if (!gagnants.length) return;
    const v = MATCH.victory;
    const T = UI[this.lang] ?? UI.ref;
    const noms = gagnants.map((f) => label(f.el, this.lang));
    const texte = noms.length > 1 ? T.winners(noms.join(' + ')) : T.winner(noms[0]);

    const i = ARENA.inner;
    const x = (i.left + i.right) / 2;
    const y = i.top + (i.bottom - i.top) * v.bannerY;
    const entree = Math.min(1, this.phaseTime / 0.35);

    ctx.save();
    ctx.globalAlpha = entree;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    // la casse se réduit si les deux noms ne tiennent pas dans l'arène
    let taille = v.bannerSize;
    for (let k = 0; k < 8; k++) {
      ctx.font = `400 ${taille}px "Archivo Black", "Arial Black", sans-serif`;
      if (ctx.measureText(texte).width <= i.right - i.left - 24) break;
      taille *= (i.right - i.left - 24) / ctx.measureText(texte).width;
    }
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#0a0a0a';
    ctx.strokeText(texte, x, y);
    ctx.fillStyle = gagnants[0].el.look.body;
    ctx.fillText(texte, x, y);
    ctx.restore();
  }

  drawIntro(ctx) {
    const t = 1 - this.phaseTime / MATCH.introDuration;
    ctx.save();
    ctx.globalAlpha = Math.max(0, t);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const i = ARENA.inner;
    ctx.fillRect(i.left, i.top, i.right - i.left, i.bottom - i.top);
    ctx.restore();
  }

  drawDebugOverlay(ctx) {
    ctx.save();
    ctx.font = '600 20px "Oswald", sans-serif';
    ctx.fillStyle = '#111';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines = [
      `phase ${this.phase}  t=${this.time.toFixed(1)}s  seed=${this.rng.seed}`,
      ...this.fighters.map(
        (f, i) =>
          `${i} ${f.el.id} camp=${f.team} hp=${f.hp} spd=${Math.round(f.currentSpeed(this.time))} ult=${Math.round(f.ult.charge)}`,
      ),
      `projectiles ${this.projectiles.list.length}`,
    ];
    lines.forEach((l, i) => ctx.fillText(l, 12, 12 + i * 22));
    ctx.restore();
  }
}
