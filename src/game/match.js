/**
 * Déroulement d'un duel : machine à états, mise à jour et rendu.
 *
 * Phases : intro → fight → ko → **victory** → over
 *
 * `victory` est la seconde de gloire : le perdant a disparu de l'arène, le
 * vainqueur y reste seul et se met en scène avant que l'écran de résultat ne
 * se pose (voir `MATCH.victoryDuration`).
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
import { drawFighterHud } from '../render/hud.js';

export class Match {
  /**
   * @param {{elements:[string,string], rng:object, lang:'ref'|'fr', debug?:boolean,
   *          onEnd:(result:object)=>void}} opts
   */
  constructor({ elements, rng, lang = 'ref', debug = false, onEnd }) {
    const [idA, idB] = elements;
    const elA = getElement(idA);
    const elB = getElement(idB);
    assertFrozen(elA, elA.id);
    assertFrozen(elB, elB.id);

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

    this.a = new Fighter(elA, 0, rng);
    this.b = new Fighter(elB, 1, rng);
    this.a.opponent = this.b;
    this.b.opponent = this.a;
    this.fighters = [this.a, this.b];

    this.modules = new Map([
      [this.a, abilitiesFor(elA.id)],
      [this.b, abilitiesFor(elB.id)],
    ]);
    for (const [f, mod] of this.modules) mod.init(f, this);

    this.flair.attach(this.fighters);
    this.backdrop = buildBackdrop({ a: elA, b: elB, lang });

    this.phase = 'intro';
    this.time = 0;
    this.phaseTime = 0;
    this.shakeMag = 0;
    this.shakeTime = 0;
    /** @type {{x:number,y:number}|null} */
    this.victoryFrom = null;
    this.victoryTo = { x: 0, y: 0 };
    this.victoryRing = 0;
    this.victorySpark = 0;
    this.stats = { hits: [0, 0], damage: [0, 0], duration: 0 };
    /** @type {Fighter|null} */
    this.winner = null;
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

    // combattants — pendant la parade du vainqueur, plus personne ne se déplace
    if (this.phase !== 'victory') {
      for (const f of this.fighters) {
        if (this.phase === 'ko' && !f.alive) continue;
        f.step(dt, this.time);
      }
    }

    // corps à corps + collisions
    if (this.phase === 'fight') {
      resolveBodies(this.a, this.b);
      this.resolveMelee(this.a, this.b);
      this.resolveMelee(this.b, this.a);
    }

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

    const idx = source === this.a ? 0 : 1;
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
    target.hp = Math.min(MATCH.maxHp, target.hp + Math.max(0, amount));
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
    this.winner = winner ?? (loser === this.a ? this.b : this.a);
    this.setPhase('ko');
    this.fx.burst(loser.x, loser.y, 60, {
      color: [loser.el.look.body, '#ffffff', loser.el.look.accent],
      speed: 520,
      size: 7,
      life: 1.1,
    });
    this.fx.ring(loser.x, loser.y, 10, 260, 0.7, loser.el.look.body, 10, true);
    this.shake(12, 0.6);
  }

  /* ------------------------------------------------------------------ */
  /* Parade du vainqueur                                                 */
  /* ------------------------------------------------------------------ */

  /** Le perdant s'efface, le vainqueur reste seul et s'illumine. */
  startVictory() {
    this.setPhase('victory');
    this.victoryRing = 0;
    this.victorySpark = 0;
    // l'arène se vide : ni projectiles ni zones ne doivent survivre au duel
    this.projectiles.list.length = 0;
    const w = this.winner;
    if (!w) return;
    // il glisse vers le centre : bien cadré, il tient tout seul dans l'image
    // exportée en Short
    const i = ARENA.inner;
    this.victoryFrom = { x: w.x, y: w.y };
    this.victoryTo = { x: (i.left + i.right) / 2, y: (i.top + i.bottom) / 2 };
    w.impulseX = 0;
    w.impulseY = 0;
    // il se présente dans ses propres couleurs : plus de brûlure, plus de givre
    w.dots.length = 0;
    w.slows.length = 0;
    w.offstage = 0; // un vainqueur en plein bond redescend pour la parade
    w.tint = null;
    w.flash = 0;
    this.fx.ring(w.x, w.y, w.radius, MATCH.victory.ringTo, 0.55, w.el.look.accent, 14, true);
    this.fx.burst(w.x, w.y, 40, {
      color: [w.el.look.body, w.el.look.accent, '#ffffff'],
      speed: 340,
      size: 6,
      life: 0.8,
    });
    this.shake(5, 0.3);
  }

  /** Anneaux et étincelles pendant la seconde de gloire. */
  tickVictory(dt) {
    const w = this.winner;
    if (!w) return;
    const v = MATCH.victory;

    // il rejoint le centre de l'arène, en douceur (ease-out cubique)
    if (this.victoryFrom) {
      const t = Math.min(1, this.phaseTime / (MATCH.victoryDuration * 0.7));
      const k = 1 - (1 - t) ** 3;
      w.x = this.victoryFrom.x + (this.victoryTo.x - this.victoryFrom.x) * k;
      w.y = this.victoryFrom.y + (this.victoryTo.y - this.victoryFrom.y) * k;
    }

    // l'arme s'emballe (le reste du combattant est figé)
    w.weaponAngle = wrapAngle(w.weaponAngle + w.el.weapon.spin * w.spinDir * v.spin * dt);
    w.flash = Math.max(0, w.flash - dt);

    this.victoryRing -= dt;
    if (this.victoryRing <= 0) {
      this.victoryRing = v.ringEvery;
      this.fx.ring(w.x, w.y, w.radius * 0.9, v.ringTo, 0.6, w.el.look.accent, 12, true);
    }

    this.victorySpark += dt * v.sparks;
    while (this.victorySpark >= 1) {
      this.victorySpark -= 1;
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
    const t = Math.min(1, this.phaseTime / MATCH.victoryDuration);
    const pop = MATCH.victory.pop;
    const grow = 1 - (1 - t) ** 3; // ease-out cubique
    const wobble = 0.09 * Math.sin(t * 17) * Math.exp(-t * 3.4);
    return 1 + pop * grow + wobble;
  }

  result() {
    const winner = this.winner ?? this.a;
    const loser = winner === this.a ? this.b : this.a;
    return {
      winner: winner.el,
      loser: loser.el,
      winnerHp: Math.max(0, Math.ceil(winner.hp)),
      duration: this.stats.duration,
      hits: this.stats.hits,
      damage: this.stats.damage,
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
    // (le dôme du Lien d'essence recouvre jusqu'au HUD dans la vidéo)
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
    // dès la parade, le perdant a quitté l'arène
    const showDead = this.phase === 'fight' || this.phase === 'ko';
    if (this.phase === 'victory') this.drawVictoryGlow(ctx);
    for (const f of this.fighters) {
      if (!f.alive && !showDead) continue;
      // en l'air : il a quitté l'arène, on ne dessine que son marqueur au sol
      if (f.offstage > 0) continue;
      if (f === this.winner && this.phase === 'victory') this.drawWinner(ctx);
      else f.draw(ctx, this.time);
    }
    if (this.phase !== 'victory') {
      for (const [f, mod] of this.modules) mod.drawOver(ctx, f, this, this.time);
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
    // même forme d'accord que `drawUnbounded`. Les six actuels en ont tous un,
    // mais l'accord reste : c'est ce qui évite un cadre vide au prochain venu.
    const modA = this.modules.get(this.a);
    const modB = this.modules.get(this.b);
    drawFighterHud(ctx, this.a, 'left', modA.barValue(this.a), this.lang, modA.specialBar?.(this.a));
    drawFighterHud(ctx, this.b, 'right', modB.barValue(this.b), this.lang, modB.specialBar?.(this.b));

    if (this.phase === 'intro') this.drawIntro(ctx);
    if (this.debug) this.drawDebugOverlay(ctx);
  }

  /** Nappe de lumière à la couleur du vainqueur, sous lui. */
  drawVictoryGlow(ctx) {
    const w = this.winner;
    if (!w) return;
    const t = Math.min(1, this.phaseTime / MATCH.victoryDuration);
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

  /** Le vainqueur, agrandi par le ressort de la parade. */
  drawWinner(ctx) {
    const w = this.winner;
    const s = this.victoryScale();
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.scale(s, s);
    ctx.translate(-w.x, -w.y);
    w.draw(ctx, this.time);
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
      `A ${this.a.el.id} hp=${this.a.hp} spd=${Math.round(this.a.currentSpeed(this.time))} ult=${Math.round(this.a.ult.charge)}`,
      `B ${this.b.el.id} hp=${this.b.hp} spd=${Math.round(this.b.currentSpeed(this.time))} ult=${Math.round(this.b.ult.charge)}`,
      `projectiles ${this.projectiles.list.length}`,
    ];
    lines.forEach((l, i) => ctx.fillText(l, 12, 12 + i * 22));
    ctx.restore();
  }
}
