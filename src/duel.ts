/* =====================================================================
   Simulation du duel.

   Ce module ne dessine RIEN. Il avance l'état à pas fixe et expose des
   tableaux que render.ts se contente de lire. La séparation supprime au
   passage le piège le plus coûteux de la version Phaser : là-bas
   `scene.update()` tournait AVANT le pas physique, si bien que lire
   `sprite.x` donnait la position de la frame précédente — près de 50 px
   d'écart à 1 380 px/s, et le chiffre de PV comme les armes semblaient se
   détacher du corps. Ici l'ordre est explicite : `stepWorld()` d'abord,
   logique ensuite, rendu après. Le décalage ne peut plus exister.
   ===================================================================== */

import { Events } from 'matter-js';
import {
  ARC_STEP,
  ARENA_CX,
  ARENA_CY,
  BALL_R,
  C,
  GUN_CELL,
  GUN_R0,
  GUN_W,
  IN_H,
  IN_W,
  IN_X,
  IN_Y,
  RULES,
  SLASH_SWEEP,
  SLASH_SWEEP_RUSH,
  SWORD_R0,
  SWORD_TIP,
} from './constants';
import {
  addBody,
  applyImpulse,
  Body,
  createWorld,
  headingOf,
  makeBall,
  makeBullet,
  removeBody,
  setSpeed,
  speedOf,
  STEP_MS,
  STEP_S,
  stepWorld,
  toStep,
  type World,
} from './physics';
import { makeRng } from './rng';
import type {
  ArcSample,
  Bladesman,
  Bullet,
  DuelSnapshot,
  Ghost,
  Outlaw,
  Particle,
  Side,
} from './types';

/** Ramène un angle dans [-pi, pi]. */
const wrap = (a: number): number => {
  let x = a % (Math.PI * 2);
  if (x > Math.PI) x -= Math.PI * 2;
  if (x < -Math.PI) x += Math.PI * 2;
  return x;
};

const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export class Duel {
  readonly world: World;
  private rng: () => number;
  private readonly seed: number;
  private round = 0;

  outlaw!: Outlaw;
  blade!: Bladesman;

  bullets: Bullet[] = [];
  particles: Particle[] = [];
  ghosts: Ghost[] = [];
  arcs: ArcSample[] = [];

  /** Horloge de simulation, en ms. Indépendante de l'horloge murale :
   *  deux exécutions au même pas donnent la même partie. */
  time = 0;

  noon = 0;
  noonOn = false;
  rush = 0;
  rushOn = false;
  private rushUntil = 0;
  private orbitDir = 1;

  over = false;
  winner: string | null = null;
  private endAt = 0;

  /** Amplitude de la secousse d'écran, en px. Décroît toute seule. */
  shake = 0;

  constructor(seed: number) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.world = createWorld();
    this.bindCollisions();
    this.reset();
  }

  private rnd(a: number, b: number): number {
    return a + this.rng() * (b - a);
  }

  /* --- Collisions ---------------------------------------------------
     Matter ne garantit pas l'ordre de bodyA / bodyB dans une paire. On
     identifie donc TOUJOURS par label. Détruire aveuglément le premier
     corps revenait, dans la version précédente, à supprimer le Bladesman
     à la place de la balle — la bille disparaissait mais son chiffre de
     PV et son épée continuaient de suivre le corps détruit.
  ------------------------------------------------------------------- */
  private bindCollisions(): void {
    Events.on(this.world.engine, 'collisionStart', (evt) => {
      for (const pair of evt.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (labels.includes('bullet') && labels.includes('blade')) {
          const bulletBody = pair.bodyA.label === 'bullet' ? pair.bodyA : pair.bodyB;
          this.onBulletHit(bulletBody);
        } else if (labels.includes('outlaw') && labels.includes('blade')) {
          this.onBallClash();
        }
      }
    });
  }

  /* --- Mise en place ------------------------------------------------- */

  reset(): void {
    // Graine dérivée du numéro de manche : les revanches ne rejouent pas
    // la même partie, mais la séquence reste reproductible.
    this.rng = makeRng(this.seed + this.round * 7919);
    this.round += 1;

    for (const b of this.bullets) removeBody(this.world, b.body);
    if (this.outlaw) removeBody(this.world, this.outlaw.body);
    if (this.blade) removeBody(this.world, this.blade.body);

    this.bullets = [];
    this.particles = [];
    this.ghosts = [];
    this.arcs = [];
    this.over = false;
    this.winner = null;
    this.noon = 0;
    this.noonOn = false;
    this.rush = 0;
    this.rushOn = false;
    this.rushUntil = 0;
    this.shake = 0;

    const ob = makeBall(ARENA_CX - 120, ARENA_CY + 40, 'outlaw');
    const bb = makeBall(ARENA_CX + 120, ARENA_CY - 40, 'blade');
    addBody(this.world, ob);
    addBody(this.world, bb);
    setSpeed(ob, this.rnd(0, Math.PI * 2), RULES.speedOutlaw);
    setSpeed(bb, this.rnd(0, Math.PI * 2), RULES.speedBlade);

    this.outlaw = {
      side: 'O',
      body: ob,
      hp: RULES.hp,
      base: RULES.speedOutlaw,
      flash: 0,
      pop: 0,
      nextGhost: 0,
      dmg: RULES.dmgOutlaw0,
      ammo: RULES.magazine,
      nextShot: 0,
      reloading: false,
      reloadEnd: 0,
    };
    this.blade = {
      side: 'B',
      body: bb,
      hp: RULES.hp,
      base: RULES.speedBlade,
      flash: 0,
      pop: 0,
      nextGhost: 0,
      spin: RULES.spinMin,
      ang: 0,
      atCapSince: 0,
      burning: false,
      lastHit: 0,
    };
  }

  /* --- Boucle -------------------------------------------------------- */

  /** Un pas fixe : physique, puis logique. */
  step(): void {
    stepWorld(this.world);
    this.time += STEP_MS;
    const d = STEP_S;

    if (!this.over) {
      this.recallSpeed(this.outlaw);
      this.recallSpeed(this.blade);
      this.stepNoon(d);
      this.stepRush(d);
      this.stepOutlaw();
      this.stepBlade(d);
      this.stepBullets();
    } else {
      // Partie finie : stepBlade ne tourne plus, donc l'éventail n'est
      // plus alimenté. Sans ce drainage il resterait figé à l'écran
      // pendant tout l'écran de fin.
      if (this.arcs.length > 2) {
        this.arcs.splice(0, Math.max(1, Math.ceil(this.arcs.length * d * 6)));
      }
      if (this.time >= this.endAt) this.reset();
    }

    this.stepGhosts(this.outlaw, C.outlaw);
    this.stepGhosts(this.blade, C.blade);
    this.stepParticles(d);
    this.outlaw.pop = Math.max(0, this.outlaw.pop - d * 5);
    this.blade.pop = Math.max(0, this.blade.pop - d * 5);
    this.shake = Math.max(0, this.shake - d * 22);
  }

  /**
   * Rappel doux de la norme vers la vitesse cible, direction inchangée.
   * Le relevé montre des trajets rectilignes à vitesse constante entre
   * deux rebonds, alors que chocs et recul font dériver la norme. Sert
   * aussi de garde-fou : sans lui, deux billes finissent collées et le
   * duel se fige.
   */
  private recallSpeed(f: Outlaw | Bladesman): void {
    const sp = speedOf(f.body);
    if (sp < 1) {
      setSpeed(f.body, this.rnd(0, Math.PI * 2), f.base); // décollage d'urgence
      return;
    }
    const k = Math.min(1, STEP_S * RULES.speedRecall);
    setSpeed(f.body, headingOf(f.body), sp + (f.base - sp) * k);
  }

  /** Renormalise en gardant la direction : sert aux bascules d'ultime. */
  private retarget(f: Outlaw | Bladesman, mul: number): void {
    f.base *= mul;
    setSpeed(f.body, headingOf(f.body), f.base);
  }

  /* --- HIGH NOON ------------------------------------------------------
     Charge 7,0 s, effet 6,2 s. À plein, l'arène passe en crème, la
     cadence de tir double et les deux gagnent 22 % de vitesse.
  ------------------------------------------------------------------- */
  private stepNoon(d: number): void {
    const was = this.noonOn;
    if (this.noonOn) {
      this.noon -= d / RULES.noonDuration;
      if (this.noon <= 0) {
        this.noon = 0;
        this.noonOn = false;
      }
    } else {
      this.noon += d / RULES.noonCharge;
      if (this.noon >= 1) {
        this.noon = 1;
        this.noonOn = true;
      }
    }
    if (was !== this.noonOn) {
      const mul = this.noonOn ? RULES.noonSpeedUp : 1 / RULES.noonSpeedUp;
      this.retarget(this.outlaw, mul);
      // Pendant une ruée, la vitesse du Bladesman est pilotée par
      // stepRush ; endRush() la recalculera proprement à la sortie.
      if (!this.rushOn) this.retarget(this.blade, mul);
    }
  }

  /* --- BLADE RUSH ----------------------------------------------------
     Jauge alimentée par le temps ET par les coups portés : les cycles
     mesurés valent 273 / 214 / 333 frames, donc pas une simple horloge.
  ------------------------------------------------------------------- */
  private stepRush(d: number): void {
    // Un seul point de sortie, piloté par le minuteur. Tant que l'état
    // dépendait de plusieurs branches, une fin de partie en pleine ruée
    // laissait `rushOn` à vrai et l'éventail large bloqué à l'écran.
    if (this.rushOn && this.time >= this.rushUntil) this.endRush();

    if (this.rushOn) {
      // Deux régimes, séparés par la portée de lame.
      const ox = this.outlaw.body.position.x;
      const oy = this.outlaw.body.position.y;
      const bx = this.blade.body.position.x;
      const by = this.blade.body.position.y;
      const toFoe = Math.atan2(oy - by, ox - bx);
      const dist = Math.hypot(ox - bx, oy - by);
      const reach = SWORD_TIP + BALL_R;

      let want: number;
      if (dist > reach) {
        want = toFoe; // loin : on fonce, cap asservi sur l'Outlaw
      } else {
        // À portée : on ORBITE. Foncer droit dessus à 939 px/s traverse
        // la zone utile en une centaine de millisecondes — au banc, la
        // lame n'y restait que 57 % de la ruée pour un seul coup porté.
        const err = clamp((dist - RULES.rushOrbit) / RULES.rushOrbit, -1, 1);
        const tangent = toFoe + this.orbitDir * (Math.PI / 2);
        const radial = err > 0 ? toFoe : toFoe + Math.PI;
        want = tangent + wrap(radial - tangent) * Math.abs(err);
      }
      // La vitesse reste celle de la ruée dans les deux régimes : la
      // baisser à portée faisait décrocher la lame, l'Outlaw courant à
      // 589 px/s pendant HIGH NOON.
      const cur = headingOf(this.blade.body);
      const a = cur + wrap(want - cur) * Math.min(1, d * RULES.rushHoming);
      setSpeed(this.blade.body, a, speedOf(this.blade.body));
      this.blade.base = RULES.rushSpeed;
      return;
    }

    this.rush += d / RULES.rushCharge;
    if (this.rush >= 1) {
      this.rush = 0;
      this.rushOn = true;
      this.rushUntil = this.time + RULES.rushDuration * 1000;
      // Sens d'orbite figé au déclenchement : celui vers lequel la lame
      // tourne déjà, pour qu'elle ne fasse pas demi-tour en arrivant.
      const toFoe = Math.atan2(
        this.outlaw.body.position.y - this.blade.body.position.y,
        this.outlaw.body.position.x - this.blade.body.position.x
      );
      this.orbitDir = wrap(headingOf(this.blade.body) - toFoe) > 0 ? 1 : -1;
      this.blade.base = RULES.rushSpeed;
      this.blade.spin = RULES.spinMax;
      this.blade.atCapSince = this.time;
      this.burst(this.blade.body.position.x, this.blade.body.position.y, 18, '#C8DE55');
    }
  }

  /**
   * Sortie de ruée. Vitesse de déplacement, plafond de rotation et
   * ouverture de l'éventail reviennent à leur valeur de base AU MÊME
   * ENDROIT : c'est la dispersion de ces trois remises à zéro qui
   * laissait du vert large accroché derrière la lame.
   */
  private endRush(): void {
    this.rushOn = false;
    this.rushUntil = 0;
    this.blade.base = RULES.speedBlade * (this.noonOn ? RULES.noonSpeedUp : 1);
    this.blade.spin = Math.min(this.blade.spin, RULES.spinMax);
    this.blade.atCapSince = 0;
    // Purge immédiate de ce qui dépasse la nouvelle ouverture, sinon la
    // queue large reste visible le temps que la lame ait tourné de 3 rad.
    this.trimArcs(SLASH_SWEEP);
  }

  private trimArcs(sweep: number): void {
    const a = this.arcs;
    while (a.length > 2 && a[a.length - 1].a - a[0].a > sweep) a.shift();
  }

  /* --- Outlaw -------------------------------------------------------- */

  private stepOutlaw(): void {
    const o = this.outlaw;
    if (o.reloading) {
      if (this.time >= o.reloadEnd) {
        o.reloading = false;
        o.ammo = RULES.magazine;
      }
      return;
    }
    if (this.time < o.nextShot) return;
    if (o.ammo <= 0) {
      o.reloading = true;
      o.reloadEnd = this.time + RULES.reloadTime;
      return;
    }
    this.fire();
  }

  private fire(): void {
    const o = this.outlaw;
    const p = o.body.position;
    const t = this.blade.body.position;
    // Visée : le canon est asservi au centre du Bladesman à chaque frame,
    // sans lissage et sans anticipation (mesuré).
    const ang = Math.atan2(t.y - p.y, t.x - p.x);

    // Bout du canon, DÉRIVÉ de la carte du revolver comme la portée de la
    // lame l'est de la sienne : une valeur en dur divergerait du sprite
    // à la première retouche de pixelmap.
    const muzzle = GUN_R0 + GUN_W * GUN_CELL - 6;
    const body = makeBullet(p.x + Math.cos(ang) * muzzle, p.y + Math.sin(ang) * muzzle);
    addBody(this.world, body);
    Body.setVelocity(body, {
      x: toStep(Math.cos(ang) * RULES.bulletSpeed),
      y: toStep(Math.sin(ang) * RULES.bulletSpeed),
    });
    this.bullets.push({ body, ang, alive: true });

    // Recul, via applyForce dans l'axe opposé au tir. Hors ultime il
    // reste discret ; pendant HIGH NOON chaque coup de la rafale propulse
    // la bille (mesuré : 46,0 px/frame au pic, contre 27,1 maximum sinon).
    const kick = this.noonOn ? RULES.recoilNoon : RULES.recoil;
    applyImpulse(o.body, -Math.cos(ang) * kick, -Math.sin(ang) * kick);

    o.ammo -= 1;
    o.nextShot = this.time + (this.noonOn ? RULES.fireDelayNoon : RULES.fireDelay);
    o.pop = 1;
    this.burst(body.position.x, body.position.y, this.noonOn ? 7 : 4, '#E8D9A8', ang);
  }

  private onBulletHit(bulletBody: Body): void {
    const b = this.bullets.find((x) => x.body === bulletBody);
    if (!b || !b.alive || this.over) return;
    b.alive = false;
    // Les éclats repartent vers le tireur, à contresens de la balle, et
    // prennent le ton du camp touché.
    this.burst(bulletBody.position.x, bulletBody.position.y, 11, C.blade, b.ang + Math.PI);
    this.damage('B', this.outlaw.dmg);
    // La stat monte au COUP AU BUT, pas au coup tiré : sur la vidéo elle
    // gagne 25 paliers pour ~50 tirs, soit un palier une fois sur deux.
    this.outlaw.dmg = Math.min(RULES.dmgOutlawMax, this.outlaw.dmg + RULES.dmgOutlawStep);
  }

  private onBallClash(): void {
    const a = this.outlaw.body.position;
    const b = this.blade.body.position;
    this.burst((a.x + b.x) / 2, (a.y + b.y) / 2, 8, '#E6D7B0');
  }

  private stepBullets(): void {
    const pad = 6;
    for (const b of this.bullets) {
      if (!b.alive) continue;
      const { x, y } = b.body.position;
      if (x < IN_X - pad || x > IN_X + IN_W + pad || y < IN_Y - pad || y > IN_Y + IN_H + pad) {
        b.alive = false;
        this.burst(x, y, 3, '#BDB4A4');
      }
    }
    for (const b of this.bullets) if (!b.alive) removeBody(this.world, b.body);
    this.bullets = this.bullets.filter((b) => b.alive);
  }

  /* --- Bladesman ------------------------------------------------------ */

  private stepBlade(d: number): void {
    const b = this.blade;

    // Courbe de spin mesurée : montée passive, plafond, palier, puis
    // effondrement. Ce qui déclenche l'effondrement n'est pas
    // identifiable sur la vidéo — le modèle « surchauffe après un palier
    // au plafond » reproduit la courbe observée. C'est un calé.
    if (b.burning) {
      b.spin -= RULES.spinDecay * d;
      if (b.spin <= RULES.spinMin) {
        b.spin = RULES.spinMin;
        b.burning = false;
      }
    } else {
      b.spin += RULES.spinRamp * d;
      if (b.spin >= RULES.spinMax) {
        b.spin = RULES.spinMax;
        if (!b.atCapSince) b.atCapSince = this.time;
        if (this.time - b.atCapSince > RULES.spinHold) {
          b.burning = true;
          b.atCapSince = 0;
        }
      } else {
        b.atCapSince = 0;
      }
    }

    const angBefore = b.ang;
    const px = b.body.position.x;
    const py = b.body.position.y;
    // « Spin Speed » est en tours par seconde.
    b.ang += b.spin * Math.PI * 2 * d;

    const lock = this.rushOn ? RULES.swordCooldownRush : RULES.swordCooldown;
    if (this.time - b.lastHit > lock && !this.over) {
      const dx = this.outlaw.body.position.x - px;
      const dy = this.outlaw.body.position.y - py;
      const dist = Math.hypot(dx, dy);
      if (dist > SWORD_R0 - BALL_R && dist < SWORD_TIP + BALL_R) {
        // Test de BALAYAGE, pas d'échantillon ponctuel. À 3 tours/s la
        // lame n'est alignée sur l'adversaire que 41 ms par tour : à
        // 30 fps une seule frame tombe dans la fenêtre, souvent aucune,
        // et la lame traverse sans rien toucher. On regarde donc si
        // l'arc parcouru pendant le pas a franchi le cap de l'adversaire.
        const toFoe = Math.atan2(dy, dx);
        // Demi-ouverture sous laquelle le disque adverse est vu.
        const tol = Math.asin(Math.min(1, (BALL_R + 10) / Math.max(dist, 1)));
        const rel = wrap(toFoe - angBefore);
        const swept = b.ang - angBefore;
        if (rel + tol >= 0 && rel - tol <= swept) {
          b.lastHit = this.time;
          this.damage('O', b.spin * RULES.dmgPerSpin);
          b.spin = Math.min(RULES.spinMax, b.spin + RULES.spinPerHit);
          this.rush = Math.min(1, this.rush + RULES.rushPerHit);
          this.burst(
            this.outlaw.body.position.x,
            this.outlaw.body.position.y,
            14,
            '#C8DE55',
            toFoe
          );
        }
      }
    }

    // Éventail : borné en ANGLE, et échantillonné à pas angulaire fixe.
    const steps = Math.max(1, Math.ceil((b.ang - angBefore) / ARC_STEP));
    for (let i = 1; i <= steps; i++) {
      const k = i / steps;
      this.arcs.push({
        x: px + (b.body.position.x - px) * k,
        y: py + (b.body.position.y - py) * k,
        a: angBefore + (b.ang - angBefore) * k,
      });
    }
    this.trimArcs(this.rushOn ? SLASH_SWEEP_RUSH : SLASH_SWEEP);
    if (this.arcs.length > 400) this.arcs.shift();
  }

  /* --- Dégâts et fin -------------------------------------------------- */

  private damage(who: Side, amount: number): void {
    const t = who === 'O' ? this.outlaw : this.blade;
    t.hp = Math.max(0, t.hp - amount);
    // Le disque touché blanchit une frame entière (mesuré). C'est CE
    // flash que montre la vidéo, pas un tremblement du chiffre : le
    // nombre ne quitte jamais le centre de la bille.
    t.flash = this.time + RULES.flashTime;
    t.pop = 1;
    if (amount >= RULES.shakeMin) {
      this.shake = Math.min(6, 2 + amount * 0.35);
    }
    if (t.hp <= 0 && !this.over) this.finish(who);
  }

  private finish(loser: Side): void {
    this.over = true;
    this.winner = loser === 'O' ? 'Bladesman' : 'Outlaw';
    this.endAt = this.time + 2600;
    // Sortie de ruée forcée : une mort en pleine ruée laisserait sinon
    // l'état actif jusqu'à la manche suivante.
    if (this.rushOn) this.endRush();
  }

  /* --- Effets ---------------------------------------------------------- */

  /**
   * Gerbe d'éclats. Les fragments giclent dans un cône centré sur `away`
   * — la direction opposée au coup — puis retombent sous une gravité
   * douce. `away` absent = gerbe omnidirectionnelle (choc bille/bille).
   */
  private burst(x: number, y: number, n: number, color: string, away?: number): void {
    const spread = away === undefined ? Math.PI : 0.9;
    const base = away ?? 0;
    for (let i = 0; i < n; i++) {
      const a = base + this.rnd(-spread, spread);
      const sp = this.rnd(90, 340);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        age: 0,
        life: this.rnd(0.26, 0.52),
        ang: a,
        sx: this.rnd(0.7, 1.9),
        sy: this.rnd(0.7, 1.4),
        color,
      });
    }
  }

  private stepParticles(d: number): void {
    for (const p of this.particles) {
      p.age += d;
      p.x += p.vx * d;
      p.y += p.vy * d;
      p.vy += 520 * d; // gravité douce : la parabole du relevé
      p.ang = Math.atan2(p.vy, p.vx); // le fragment s'aligne sur sa course
    }
    this.particles = this.particles.filter((p) => p.age < p.life);

    for (const g of this.ghosts) g.age += d;
    this.ghosts = this.ghosts.filter((g) => g.age < g.life);
  }

  /**
   * Trace de vitesse. Le relevé (frame 643) ne montre de fantômes que sur
   * les billes LANCÉES — après un recul de rafale ou pendant la ruée —
   * jamais en déplacement de croisière. D'où le seuil de vitesse.
   */
  private stepGhosts(f: Outlaw | Bladesman, color: string): void {
    if (this.over) return;
    if (speedOf(f.body) < f.base * 1.45) return;
    if (this.time < f.nextGhost) return;
    f.nextGhost = this.time + 34;
    this.ghosts.push({
      x: f.body.position.x,
      y: f.body.position.y,
      age: 0,
      life: 0.15,
      color,
    });
  }

  /* --- Lecture -------------------------------------------------------- */

  snapshot(): DuelSnapshot {
    return {
      outlawHp: this.outlaw.hp,
      bladeHp: this.blade.hp,
      outlawDmg: this.outlaw.dmg,
      ammo: this.outlaw.ammo,
      spin: this.blade.spin,
      noon: this.noon,
      rush: this.rush,
      over: this.over,
      winner: this.winner,
    };
  }
}
