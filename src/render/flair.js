/**
 * Couche de **mise en scène** : tout ce qui rend le duel spectaculaire sans
 * rien changer à ce qui se passe.
 *
 * Ruban d'arme, nappe de sol, ondes de mur, sillage de vitesse, nombres de
 * dégâts qui montent, éclat d'incantation, état critique : aucun de ces effets
 * ne touche aux PV, aux positions ni aux minuteurs.
 *
 * Règle de composition : **rien ne se pose entre le spectateur et les
 * combattants**. Ce qui remplit le cadre est soit au fond (nappe de sol), soit
 * sur les bords (ondes de mur), soit accroché au combattant et derrière lui
 * (ruban, sillage). Une nuée qui flotte au milieu de l'arène a été essayée puis
 * retirée : elle brouillait la lecture du duel. C'est ce qui autorise sa règle de fonctionnement
 * la plus importante :
 *
 * > **La mise en scène a son propre aléa** (`viewRng`), jamais celui de la
 * > simulation. Un `game.rng.next()` de plus dans un chemin de rendu décalerait
 * > tout le flux et changerait les vainqueurs — c'est arrivé deux fois.
 *
 * Elle a aussi son propre banc de particules : la nuée décorative ne peut donc
 * pas évincer les particules de jeu du pool partagé.
 *
 * @module render/flair
 */

import { ARENA } from '../data/tuning.js';
import { TAU, hash01 } from '../core/math.js';

const MAX_MOTES = 260;
const MAX_POPS = 24;
/** Longueur du ruban d'arme, en pas de simulation (120 Hz). */
const RIBBON = 26;
/** Longueur du fuseau de vitesse traîné derrière le corps, même unité. */
const SMEAR = 30;
/**
 * Nombre de **poses fantômes** gardées par combattant. Une pose = (x, y, cap
 * d'arme) : de quoi redessiner la silhouette entière, bille **et** lance, là où
 * elle était. Le fuseau et le ruban, eux, ne gardent qu'un point.
 */
const GHOSTS = 16;

export class Flair {
  /** @param {{range:Function, spread:Function, pick:Function, chance:Function}} rng viewRng */
  constructor(rng) {
    this.rng = rng;
    /** @type {Array<any>} */
    this.motes = [];
    for (let i = 0; i < MAX_MOTES; i++) this.motes.push({ alive: false });
    this.moteCursor = 0;
    /** @type {Array<any>} */
    this.pops = [];
    for (let i = 0; i < MAX_POPS; i++) this.pops.push({ alive: false });
    this.popCursor = 0;
    /** @type {Map<any, {pts:number[], head:number, n:number}>} */
    this.ribbons = new Map();
    /**
     * Fuseau de vitesse : les positions passées du **corps**, pas de la pointe
     * d'arme. C'est la traînée cramoisie du Dragoon, mesurée sur sa vidéo —
     * une écharpe large collée derrière la bille, qui s'affine et s'efface.
     * Opt-in par `look.flair.smear` : un combattant sans ce bloc n'en a pas.
     * @type {Map<any, {pts:number[], head:number, n:number}>}
     */
    this.smears = new Map();
    /**
     * **Images fantômes.** Des copies translucides de la silhouette entière —
     * bille et lance — laissées derrière un combattant tant que son compteur
     * `ghosting` tourne. C'est la traînée de la charge du Dragoon, relevée sur
     * sa vidéo : une bande cramoisie faite de billes qui se recouvrent, pas un
     * trait continu comme le fuseau.
     *
     * Opt-in par `look.flair.ghost` : un combattant sans ce bloc n'en sème pas.
     * Purement géométrique — aucun tirage d'aléa, pas même `viewRng`.
     * @type {Map<any, {pts:Float32Array, head:number, n:number, debt:number}>}
     */
    this.ghosts = new Map();
    /** Éclair blanc plein cadre, très bref (incantation d'ultime, K.O.). */
    this.flash = 0;
    this.flashMax = 1;
    this.flashColor = 'rgba(255,255,255,0.55)';
    this.moteDebt = new Map();
    /** @type {Array<any>} ondes le long des murs de l'arène */
    this.ripples = [];
  }

  attach(fighters) {
    for (const f of fighters) {
      this.ribbons.set(f, { pts: new Float32Array(RIBBON * 2), head: 0, n: 0 });
      this.smears.set(f, { pts: new Float32Array(SMEAR * 2), head: 0, n: 0 });
      this.ghosts.set(f, { pts: new Float32Array(GHOSTS * 3), head: 0, n: 0, debt: 0 });
      this.moteDebt.set(f, 0);
    }
  }

  _mote(props) {
    for (let i = 0; i < MAX_MOTES; i++) {
      const idx = (this.moteCursor + i) % MAX_MOTES;
      if (!this.motes[idx].alive) {
        this.moteCursor = (idx + 1) % MAX_MOTES;
        return Object.assign(this.motes[idx], {
          alive: true, x: 0, y: 0, vx: 0, vy: 0, life: 1, maxLife: 1,
          size: 4, color: '#fff', drag: 1.4, gravity: 0, shape: 'dot', spin: 0, angle: 0,
        }, props);
      }
    }
    return null;
  }

  /* ------------------------------------------------------------------ */
  /* Événements                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Une touche : le nombre de dégâts s'envole et une gerbe part à la couleur
   * de l'attaquant.
   */
  hit(x, y, amount, source, target) {
    const flair = source?.el?.look?.flair;
    const accent = source?.el?.look?.accent ?? '#ffffff';
    const pop = this.pops[this.popCursor];
    this.popCursor = (this.popCursor + 1) % MAX_POPS;
    Object.assign(pop, {
      alive: true,
      // décalé au-dessus et sur le côté : le nombre ne doit jamais recouvrir
      // les PV inscrits dans la boule
      x: x + this.rng.spread(18),
      y: y - 52,
      vy: -70,
      life: 1,
      maxLife: 1,
      text: String(amount),
      color: accent,
      big: amount >= 8,
    });

    const colors = flair?.impact ?? [accent, '#ffffff'];
    const n = 6 + Math.min(10, amount);
    for (let i = 0; i < n; i++) {
      const a = this.rng.range(0, TAU);
      const v = this.rng.range(90, 340);
      this._mote({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: this.rng.range(0.25, 0.6),
        size: this.rng.range(3, 8),
        color: this.rng.pick(colors),
        shape: flair?.shape ?? 'spark',
        drag: 3.2,
        spin: this.rng.spread(14),
      });
    }
    // onde de choc au point d'impact, aux couleurs de la victime
    this._mote({
      x, y, life: 0.28, maxLife: 0.28, size: 12 + amount * 2.2,
      color: target?.el?.look?.body ?? accent, shape: 'shock', drag: 0, vx: 0, vy: 0,
    });
    // et une marque au sol qui s'efface : le combat laisse une trace
    this._mote({
      x, y, life: 1.3, maxLife: 1.3, size: 10 + amount * 1.6,
      color: accent, shape: 'scar', drag: 0, vx: 0, vy: 0,
    });
  }

  /** Incantation d'ultime : éclat plein cadre + couronne de traits. */
  cast(f, color) {
    this.flash = 0.16;
    this.flashMax = 0.16;
    this.flashColor = color ?? 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 22; i++) {
      const a = (TAU * i) / 22 + this.rng.spread(0.1);
      this._mote({
        x: f.x + Math.cos(a) * f.radius,
        y: f.y + Math.sin(a) * f.radius,
        vx: Math.cos(a) * 420,
        vy: Math.sin(a) * 420,
        life: this.rng.range(0.3, 0.55),
        size: this.rng.range(5, 11),
        color: this.rng.pick([f.el.look.body, f.el.look.accent, '#ffffff']),
        shape: 'streak',
        drag: 3,
        angle: a,
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Pas fixe                                                            */
  /* ------------------------------------------------------------------ */

  update(dt, fighters, live) {
    this.flash = Math.max(0, this.flash - dt);

    for (const f of fighters) {
      // `onStage` partout dans la mise en scène : un combattant en l'air (le
      // Bond du Dragoon) n'a ni ruban, ni nappe, ni sillage, ni poussière.
      if (!f.onStage) continue;
      this._trackRibbon(f);
      this._trackSmear(f);
      this._trackGhosts(f, dt);
      if (live) this._emitMotes(f, dt);
    }
    if (live) this._walls(dt, fighters);

    const inner = ARENA.inner;
    for (const m of this.motes) {
      if (!m.alive) continue;
      m.life -= dt;
      if (m.life <= 0) { m.alive = false; continue; }
      if (m.drag) {
        const k = Math.exp(-m.drag * dt);
        m.vx *= k; m.vy *= k;
      }
      if (m.gravity) m.vy += m.gravity * dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.spin) m.angle += m.spin * dt;
      if (m.x < inner.left - 40 || m.x > inner.right + 40) m.alive = false;
    }

    for (const p of this.pops) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) { p.alive = false; continue; }
      p.y += p.vy * dt;
      p.vy *= Math.exp(-2.6 * dt);
    }
  }

  /**
   * **Ondes de mur.** À chaque rebond, une onde court le long du mur touché,
   * à la couleur du combattant. C'est le remplaçant de la poussière d'arène :
   * ça remplit le cadre au rythme du duel, mais **sur les bords** — jamais
   * entre le spectateur et les combattants.
   */
  _walls(dt, fighters) {
    for (const f of fighters) {
      if (!f.onStage || !f.wall) continue;
      this.ripples.push({
        side: f.wall,
        at: f.wall === 'left' || f.wall === 'right' ? f.y : f.x,
        life: 0.55,
        maxLife: 0.55,
        color: f.el.look.accent,
      });
      if (this.ripples.length > 14) this.ripples.shift();
    }
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      this.ripples[i].life -= dt;
      if (this.ripples[i].life <= 0) this.ripples.splice(i, 1);
    }
  }

  /**
   * Ondes de mur : un trait qui s'étale le long du bord touché, puis s'efface.
   * Dessiné **sous** tout le reste.
   */
  drawWalls(ctx) {
    const i = ARENA.inner;
    ctx.save();
    ctx.lineCap = 'round';
    for (const r of this.ripples) {
      const t = r.life / r.maxLife;
      const spread = 40 + 210 * (1 - t);
      ctx.globalAlpha = t * t * 0.75;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3 + 9 * t;
      ctx.beginPath();
      if (r.side === 'left' || r.side === 'right') {
        const x = r.side === 'left' ? i.left + 3 : i.right - 3;
        ctx.moveTo(x, Math.max(i.top, r.at - spread));
        ctx.lineTo(x, Math.min(i.bottom, r.at + spread));
      } else {
        const y = r.side === 'top' ? i.top + 3 : i.bottom - 3;
        ctx.moveTo(Math.max(i.left, r.at - spread), y);
        ctx.lineTo(Math.min(i.right, r.at + spread), y);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /**
   * **Nappe de sol.** Une teinte diffuse sous chaque combattant, dessinée tout
   * au fond : l'arène cesse d'être un vide blanc sans qu'aucun pixel ne vienne
   * se poser devant l'action.
   */
  drawFloor(ctx, fighters) {
    ctx.save();
    for (const f of fighters) {
      if (!f.onStage) continue;
      const r = f.radius * 3.6;
      const g = ctx.createRadialGradient(f.x, f.y, f.radius * 0.4, f.x, f.y, r);
      g.addColorStop(0, f.el.look.aura.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /**
   * **Sillage de vitesse.** Quelques traits derrière la boule quand elle file :
   * ils sont *derrière* elle, donc ils soulignent la lecture au lieu de la
   * gêner, et ils disent d'où elle vient.
   */
  drawWake(ctx, fighters, now) {
    ctx.save();
    for (const f of fighters) {
      if (!f.onStage) continue;
      // le sillage n'apparaît qu'à vitesse **anormale** : projeté par un coup,
      // ou lancé par un bonus. En croisière, rien — sinon c'est du bruit.
      const speed = Math.hypot(f.impulseX, f.impulseY) + f.currentSpeed(now);
      const boost = Math.min(1, (speed - 520) / 380);
      if (boost <= 0.06) continue;
      const back = f.heading + Math.PI;
      ctx.strokeStyle = f.el.look.accent;
      ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const off = (k - 1) * f.radius * 0.55;
        const wob = Math.sin(now * 22 + k * 2) * 3;
        const len = f.radius * (1.1 + 1.9 * boost) * (1 - Math.abs(k - 1) * 0.28);
        const nx = Math.cos(back + Math.PI / 2) * (off + wob);
        const ny = Math.sin(back + Math.PI / 2) * (off + wob);
        ctx.globalAlpha = 0.45 * boost;
        ctx.lineWidth = 6 - Math.abs(k - 1) * 2;
        ctx.beginPath();
        ctx.moveTo(f.x + nx + Math.cos(back) * f.radius * 0.8, f.y + ny + Math.sin(back) * f.radius * 0.8);
        ctx.lineTo(f.x + nx + Math.cos(back) * (f.radius * 0.8 + len), f.y + ny + Math.sin(back) * (f.radius * 0.8 + len));
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /** Mémorise la pointe de l'arme pour en faire un ruban. */
  _trackRibbon(f) {
    const r = this.ribbons.get(f);
    if (!r) return;
    const reach = f.el.weapon.reach;
    r.pts[r.head * 2] = f.x + Math.cos(f.weaponAngle) * reach;
    r.pts[r.head * 2 + 1] = f.y + Math.sin(f.weaponAngle) * reach;
    r.head = (r.head + 1) % RIBBON;
    if (r.n < RIBBON) r.n++;
  }

  /** Fuseau de vitesse : on enregistre la position du corps, pas de l'arme. */
  _trackSmear(f) {
    if (!f.el.look.flair?.smear) return;
    const r = this.smears.get(f);
    if (!r) return;
    r.pts[r.head * 2] = f.x;
    r.pts[r.head * 2 + 1] = f.y;
    r.head = (r.head + 1) % SMEAR;
    if (r.n < SMEAR) r.n++;
  }

  /**
   * Poses fantômes : on en dépose une toutes les `every` secondes tant que le
   * compteur `ghosting` du combattant tourne, puis la file se **vide par le
   * plus ancien** au même rythme. Sans cette vidange, la traînée resterait
   * plantée en l'air à la fin de la charge au lieu de se résorber derrière lui.
   */
  _trackGhosts(f, dt) {
    const spec = f.el.look.flair?.ghost;
    const g = this.ghosts.get(f);
    if (!spec || !g) return;

    if (f.ghosting <= 0) {
      g.debt += dt;
      while (g.debt >= spec.every) {
        g.debt -= spec.every;
        if (g.n > 0) g.n--;
      }
      return;
    }

    g.debt += dt;
    while (g.debt >= spec.every) {
      g.debt -= spec.every;
      g.pts[g.head * 3] = f.x;
      g.pts[g.head * 3 + 1] = f.y;
      g.pts[g.head * 3 + 2] = f.weaponAngle;
      g.head = (g.head + 1) % GHOSTS;
      if (g.n < GHOSTS) g.n++;
    }
  }

  /**
   * **Images fantômes**, dessinées sous le combattant : la silhouette entière
   * répétée le long de la charge, du plus effacé (le plus ancien) au plus franc
   * (le plus récent). Bille **et** lance : sans la lance, la traînée d'une arme
   * de 164 px ne veut rien dire.
   */
  _drawGhosts(ctx, f) {
    const spec = f.el.look.flair?.ghost;
    const g = this.ghosts.get(f);
    if (!spec || !g || g.n < 1) return;
    const w = f.el.weapon;
    const back = w.handle.length;

    ctx.save();
    ctx.lineCap = 'butt';
    ctx.fillStyle = spec.color;
    ctx.strokeStyle = spec.color;
    for (let i = 0; i < g.n; i++) {
      const idx = (g.head - g.n + i + GHOSTS * 2) % GHOSTS;
      const x = g.pts[idx * 3];
      const y = g.pts[idx * 3 + 1];
      const a = g.pts[idx * 3 + 2];
      const k = (i + 1) / g.n; // 0 = le plus ancien
      ctx.globalAlpha = spec.alpha * k * k;
      ctx.beginPath();
      ctx.arc(x, y, f.radius * (0.55 + 0.45 * k), 0, TAU);
      ctx.fill();
      ctx.lineWidth = spec.lance * (0.4 + 0.6 * k);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * back, y + Math.sin(a) * back);
      ctx.lineTo(x + Math.cos(a) * w.reach, y + Math.sin(a) * w.reach);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /**
   * Fuseau de vitesse, dessiné **sous** le combattant : large et opaque au ras
   * du corps, effilé et transparent vers l'arrière. C'est une écharpe, pas un
   * trait — d'où le trapèze plutôt qu'un `lineTo`.
   */
  _drawSmear(ctx, f, now = 0) {
    const spec = f.el.look.flair?.smear;
    const r = this.smears.get(f);
    if (!spec || !r || r.n < 4) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // décalé d'une graine dans les deux cas : sans ça le fuseau et le ruban
    // grésillent exactement de la même façon et se lisent comme un seul trait
    if (spec.powder) {
      this._drawPowderTrail(ctx, this._trailPoints(r, SMEAR), spec, spec.powder, now, 7.3);
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    if (spec.electric) {
      this._drawElectricTrail(ctx, this._trailPoints(r, SMEAR), spec, spec.electric, now, 7.3);
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    ctx.strokeStyle = spec.color;
    for (let i = 1; i < r.n; i++) {
      const a = (r.head - r.n + i - 1 + SMEAR * 2) % SMEAR;
      const b = (r.head - r.n + i + SMEAR * 2) % SMEAR;
      const k = i / r.n;
      ctx.globalAlpha = spec.alpha * k * k;
      ctx.lineWidth = spec.width * k;
      ctx.beginPath();
      ctx.moveTo(r.pts[a * 2], r.pts[a * 2 + 1]);
      ctx.lineTo(r.pts[b * 2], r.pts[b * 2 + 1]);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /** Poussière d'ambiance : le combattant n'est jamais inerte. */
  _emitMotes(f, dt) {
    const spec = f.el.look.flair?.motes;
    if (!spec) return;

    // **Annonce d'ultime** : passé 85 % de jauge, la matière converge vers lui.
    // C'est l'effet qui fait attendre la suite au lieu de la subir.
    if (f.ult.charge >= 85 && !f.ult.active) {
      const heat = (f.ult.charge - 85) / 15;
      if (this.rng.chance(dt * (16 + 42 * heat))) {
        const a = this.rng.range(0, TAU);
        const d = f.radius * this.rng.range(2.6, 4.4);
        this._mote({
          x: f.x + Math.cos(a) * d,
          y: f.y + Math.sin(a) * d,
          vx: -Math.cos(a) * d * 2.4,
          vy: -Math.sin(a) * d * 2.4,
          life: 0.42,
          size: this.rng.range(5, 10),
          color: this.rng.pick(spec.colors),
          shape: 'streak',
          drag: 0.4,
          angle: a,
        });
      }
    }
    // sous 25 PV, le combattant « fuit » deux fois plus de matière
    const hurt = f.hp <= 25 ? 2 : 1;
    let debt = this.moteDebt.get(f) + dt * spec.rate * hurt;
    while (debt >= 1) {
      debt -= 1;
      const a = this.rng.range(0, TAU);
      const rad = f.radius * this.rng.range(0.75, 1.05);
      this._mote({
        x: f.x + Math.cos(a) * rad,
        y: f.y + Math.sin(a) * rad,
        vx: this.rng.spread(spec.drift) - f.impulseX * 0.04,
        vy: this.rng.spread(spec.drift) + (spec.rise ?? 0),
        life: this.rng.range(0.22, 0.5),
        size: this.rng.range(spec.size * 0.5, spec.size),
        color: this.rng.pick(spec.colors),
        shape: f.el.look.flair.shape ?? 'dot',
        drag: 1.1,
        spin: this.rng.spread(9),
      });
    }
    this.moteDebt.set(f, debt);
  }

  /* ------------------------------------------------------------------ */
  /* Rendu                                                               */
  /* ------------------------------------------------------------------ */

  /** Rubans d'arme + poussière : sous les combattants. */
  drawUnder(ctx, fighters, now = 0) {
    for (const f of fighters) {
      if (!f.onStage) continue;
      // les fantômes tout au fond, puis le fuseau, puis le ruban d'arme,
      // puis l'onde de pénétration et l'aura d'arme au plus près du sprite
      this._drawGhosts(ctx, f);
      this._drawSmear(ctx, f, now);
      this._drawRibbon(ctx, f, now);
      this._drawPierce(ctx, f);
      this._drawWeaponAura(ctx, f, now);
      this._drawWeaponArcs(ctx, f, now);
    }
    for (const m of this.motes) {
      if (!m.alive) continue;
      const t = m.life / m.maxLife;
      ctx.globalAlpha = Math.max(0, Math.min(1, t * 1.3));
      ctx.fillStyle = m.color;
      switch (m.shape) {
        case 'scar': {
          ctx.globalAlpha = t * t * 0.22;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size * (1.9 - t * 0.9), 0, TAU);
          ctx.fill();
          break;
        }
        case 'shock': {
          ctx.globalAlpha = t * 0.8;
          ctx.strokeStyle = m.color;
          ctx.lineWidth = 4 * t + 1;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size * (1.6 - t), 0, TAU);
          ctx.stroke();
          break;
        }
        case 'streak': {
          const len = m.size * 3.4 * t;
          ctx.save();
          ctx.translate(m.x, m.y);
          ctx.rotate(m.angle);
          ctx.fillRect(-len / 2, -m.size * 0.28, len, m.size * 0.56);
          ctx.restore();
          break;
        }
        case 'spark': {
          const s = m.size * (0.5 + 0.5 * t);
          ctx.save();
          ctx.translate(m.x, m.y);
          ctx.rotate(m.angle);
          ctx.fillRect(-s / 2, -s / 2, s, s);
          ctx.restore();
          break;
        }
        default: {
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size * (0.45 + 0.55 * t), 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Lit un tampon circulaire de traînée, du plus ancien au plus récent.
   * @returns {number[][]} liste de points [x, y]
   */
  _trailPoints(r, size) {
    const pts = [];
    for (let i = 0; i < r.n; i++) {
      const idx = (r.head - r.n + i + size * 2) % size;
      pts.push([r.pts[idx * 2], r.pts[idx * 2 + 1]]);
    }
    return pts;
  }

  /**
   * **Tracé électrique d'une traînée** — partagé par le ruban de pointe et le
   * fuseau, qui ne diffèrent que par leurs réglages.
   *
   * Trois choses le distinguent d'un trait ordinaire :
   *
   *  1. **un seul trait continu**, pas segment par segment. Dessinés
   *     séparément avec des bouts ronds, des points très écartés — pendant une
   *     charge, la pointe parcourt plus de 200 px en une fraction de seconde —
   *     se referment en chapelet de perles ;
   *  2. **la cassure est perpendiculaire** à la trajectoire locale, sinon le
   *     trait s'allonge au lieu de zigzaguer ;
   *  3. **l'amplitude s'annule au point le plus récent**, sinon la traînée se
   *     décroche du combattant et flotte à côté de lui.
   *
   * Le décalage vient d'un **hachage pur** de (indice, temps quantifié), comme
   * les arcs de lame : aucun tirage consommé dans une méthode de dessin, donc
   * le rendu ne dépend pas du nombre d'images affichées.
   */
  _drawElectricTrail(ctx, pts, spec, e, now, seed) {
    const tick = Math.floor(now * e.rate);
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass === 0 ? e.glow ?? spec.color : e.core;
      ctx.lineWidth = pass === 0 ? spec.width : e.coreWidth;
      ctx.globalAlpha = spec.alpha * (pass === 0 ? 0.5 : 1);
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const [px, py] = pts[i];
        const [qx, qy] = pts[Math.min(i + 1, pts.length - 1)];
        const dx = qx - px;
        const dy = qy - py;
        const len = Math.hypot(dx, dy) || 1;
        const age = i / Math.max(1, pts.length - 1); // 0 = ancien, 1 = récent
        const j = (hash01(i * 17.13 + tick * 0.719 + seed) - 0.5) * 2 * e.jitter * age;
        const x = px - (dy / len) * j;
        const y = py + (dx / len) * j;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  /**
   * **Tracé de poudre** — l'alternative « givre » au tracé électrique, partagée
   * elle aussi par le ruban de pointe et le fuseau.
   *
   * Là où l'électricité est un **trait** cassé, la poudre est un **nuage de
   * grains**. Trois règles la font tenir, et chacune est l'inverse d'une règle
   * du tracé électrique :
   *
   *  1. **l'écart s'ouvre en s'éloignant du combattant**, au lieu de s'annuler
   *     au point le plus récent. Une poudre se disperse en retombant ; la
   *     garder serrée sur toute la longueur donne un ruban granuleux, pas un
   *     sillage ;
   *  2. **les grains ne sont pas reliés.** C'est le point : relier des points
   *     écartés était l'exigence du tracé électrique, la casser est l'exigence
   *     de celui-ci. Chaque grain est un disque isolé ;
   *  3. **le palier de temps est lent** (`rate` bas). Vite, les grains
   *     sautillent et donnent du bruit ; lentement, ils tiennent en place assez
   *     longtemps pour se lire comme de la matière en suspension.
   *
   * Une **nappe** large et très transparente passe d'abord sous les grains :
   * seuls, ils se lisent comme des taches détachées, et c'est elle qui les
   * rassemble en un sillage.
   *
   * Comme le tracé électrique, tout vient d'un **hachage pur** de (indice,
   * temps quantifié) : aucun tirage consommé au dessin, donc deux machines à la
   * même graine voient la même poudre.
   */
  _drawPowderTrail(ctx, pts, spec, p, now, seed) {
    const n = pts.length;
    if (n < 2) return;
    const tick = Math.floor(now * p.rate);

    // nappe : le liant, sans lequel les grains flottent séparément
    ctx.globalAlpha = spec.alpha * p.hazeAlpha;
    ctx.strokeStyle = p.haze ?? spec.color;
    ctx.lineWidth = spec.width;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const [x, y] = pts[i];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // grains
    for (let i = 0; i < n; i++) {
      const [px, py] = pts[i];
      const [qx, qy] = pts[Math.min(i + 1, n - 1)];
      const dx = qx - px;
      const dy = qy - py;
      const len = Math.hypot(dx, dy) || 1;
      const age = i / (n - 1); // 0 = le plus ancien, 1 = collé au combattant
      const away = 1 - age; // la dispersion s'ouvre en s'éloignant
      for (let g = 0; g < p.grains; g++) {
        const h1 = hash01(i * 7.31 + g * 41.7 + tick * 0.53 + seed);
        const h2 = hash01(i * 19.7 + g * 3.19 + tick * 0.91 + seed);
        const h3 = hash01(i * 2.53 + g * 61.3 + seed);
        // perpendiculaire à la trajectoire : c'est ce qui étale le sillage
        // plutôt que de l'allonger
        const off = (h1 - 0.5) * 2 * p.spread * away;
        const along = (h2 - 0.5) * p.spread * 0.5 * away;
        const x = px - (dy / len) * off + (dx / len) * along;
        const y = py + (dx / len) * off + (dy / len) * along;
        ctx.globalAlpha = spec.alpha * (0.25 + 0.75 * age) * (0.4 + 0.6 * h3);
        ctx.fillStyle = h3 > 0.72 ? p.core : p.color ?? spec.color;
        const rad = p.size * (0.35 + 0.65 * h3) * (0.45 + 0.55 * age);
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, TAU);
        ctx.fill();
      }
    }
  }

  /**
   * **Traînée de pointe.** Deux tracés au choix de la fiche.
   *
   * Par défaut, un trait lisse segment par segment : c'est le relevé des
   * « boucles » que la pointe d'arme dessine en tournant.
   *
   * Avec `ribbon.electric`, le même chemin est **cassé** — chaque point est
   * décalé perpendiculairement à la trajectoire, et le tout est tracé d'un
   * seul trait continu en deux passes. Le trait continu compte autant que la
   * cassure : dessiné segment par segment avec des bouts ronds, un chemin dont
   * les points sont très écartés — pendant une charge la pointe parcourt plus
   * de 200 px en une fraction de seconde — se referme en chapelet de perles.
   *
   * Le décalage vient d'un **hachage pur** de (indice, temps quantifié), comme
   * les arcs de lame : aucun tirage consommé dans une méthode de dessin, donc
   * le rendu ne dépend pas du nombre d'images affichées.
   */
  _drawRibbon(ctx, f, now = 0) {
    const r = this.ribbons.get(f);
    const spec = f.el.look.flair?.ribbon;
    if (!r || r.n < 3 || !spec) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (spec.powder) {
      this._drawPowderTrail(ctx, this._trailPoints(r, RIBBON), spec, spec.powder, now, 0);
    } else if (spec.electric) {
      this._drawElectricTrail(ctx, this._trailPoints(r, RIBBON), spec, spec.electric, now, 0);
    } else {
      // du plus ancien au plus récent : le trait s'épaissit et s'opacifie
      for (let i = 1; i < r.n; i++) {
        const a = (r.head - r.n + i - 1 + RIBBON * 2) % RIBBON;
        const b = (r.head - r.n + i + RIBBON * 2) % RIBBON;
        const k = i / r.n;
        ctx.globalAlpha = spec.alpha * k * k;
        ctx.strokeStyle = spec.color;
        ctx.lineWidth = spec.width * k;
        ctx.beginPath();
        ctx.moveTo(r.pts[a * 2], r.pts[a * 2 + 1]);
        ctx.lineTo(r.pts[b * 2], r.pts[b * 2 + 1]);
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /**
   * **Aura d'arme** — un halo le long de la lame.
   *
   * Opt-in par `look.flair.weaponAura` : un combattant sans ce bloc n'en a pas.
   * Le tracé suit `f.bladeSegment()`, donc l'aura ne peut pas se désaccorder de
   * la portée ni du décalage latéral de l'arme — c'est le même segment qui
   * décide où l'arme coupe.
   *
   * Trois passes de largeur décroissante plutôt qu'un dégradé : sur une ligne,
   * Canvas ne sait pas dégrader perpendiculairement au tracé, et empiler des
   * traits est ce qui donne le noyau clair cerné d'un halo.
   *
   * Le battement est une fonction **pure** du temps, pas un tirage : la
   * décoration a droit à `viewRng`, mais s'en passer quand un `sin` suffit
   * garde le flux intact pour ce qui en a vraiment besoin.
   */
  _drawWeaponAura(ctx, f, now) {
    const spec = f.el.look.flair?.weaponAura;
    if (!spec) return;
    const b = f.bladeSegment();
    // la charge fait monter l'aura : c'est `Fighter.boost`, un compteur
    // générique, donc rien ici ne sait ce qu'est une charge
    const hot = f.boost > 0 ? 1 : 0;
    const beat = 0.82 + 0.18 * Math.sin(now * spec.pulse);
    const alpha = (spec.alpha + (spec.boostAlpha - spec.alpha) * hot) * beat;

    ctx.save();
    ctx.lineCap = 'round';
    /**
     * `powder` : la même aura, mais **étalée**. Trois passes larges donnent un
     * bord net — une gélule — qui convient à une lame électrifiée ; du givre en
     * suspension demande l'inverse, beaucoup de passes très transparentes qui
     * s'élargissent, ce qui approche un dégradé perpendiculaire que Canvas ne
     * sait pas tracer sur une ligne.
     */
    const passes = spec.powder ? 6 : 3;
    for (let pass = 0; pass < passes; pass++) {
      const last = pass === passes - 1;
      /**
       * Dans les deux modes la passe **la plus large vient en premier** et la
       * dernière est le noyau étroit. Un premier réglage de `powder` inversait
       * l'ordre (largeur en `1/k`) : la dernière passe, celle qui porte le
       * cœur à pleine opacité, faisait alors 54 px et délavait tout autour de
       * l'arme au lieu de la cerner.
       */
      const k = spec.powder
        ? 1 + (passes - 1 - pass) * 0.75 // 4,75 → 1, du halo au noyau
        : 1 - pass / passes;
      ctx.globalAlpha = spec.powder
        ? alpha * (last ? 1 : 0.2)
        : alpha * (last ? 1 : 0.4);
      ctx.lineWidth = spec.width * k * (1 + 0.35 * hot);
      ctx.strokeStyle = last ? spec.core : spec.color;
      ctx.beginPath();
      ctx.moveTo(b.ax, b.ay);
      ctx.lineTo(b.bx, b.by);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /**
   * **Arcs électriques le long de la lame.**
   *
   * Opt-in par `look.flair.weaponArc`. Chaque arc part de la lame et y revient :
   * son amplitude est modulée par un sinus qui s'annule aux deux bouts, donc il
   * décolle et se recolle au lieu de flotter à côté.
   *
   * Le tracé est **entièrement déterminé par un hachage** de (indice, temps
   * quantifié) : aucun tirage n'est consommé, et le grésillement vient du saut
   * de `tick` d'un palier à l'autre. Quantifier est ce qui fait la différence
   * entre de l'électricité et du bruit — à 60 images par seconde, un tracé
   * retiré à chaque image donne du grain de télévision.
   *
   * Comme l'aura, l'intensité monte pendant la charge via `Fighter.boost`, un
   * compteur générique : le rendu ne sait pas ce qu'est une charge.
   */
  _drawWeaponArcs(ctx, f, now) {
    const spec = f.el.look.flair?.weaponArc;
    if (!spec) return;
    if (spec.powder) {
      this._drawWeaponDust(ctx, f, now, spec);
      return;
    }
    const b = f.bladeSegment();
    const dx = b.bx - b.ax;
    const dy = b.by - b.ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const tick = Math.floor(now * spec.rate);
    const hot = f.boost > 0 ? spec.boost : 1;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass === 0 ? spec.glow : spec.core;
      ctx.lineWidth = (pass === 0 ? spec.glowWidth : spec.coreWidth) * hot;
      ctx.globalAlpha = spec.alpha * (pass === 0 ? 0.5 : 1) * hot;
      for (let i = 0; i < spec.count; i++) {
        const t0 = hash01(i * 12.9898 + tick * 0.317) * (1 - spec.span);
        const t1 = t0 + spec.span * (0.4 + 0.6 * hash01(i * 78.233 + tick * 0.911));
        ctx.beginPath();
        for (let k = 0; k <= spec.steps; k++) {
          const u = k / spec.steps;
          const t = t0 + (t1 - t0) * u;
          // enveloppe en sinus : l'arc quitte la lame et y revient
          const env = Math.sin(u * Math.PI);
          const j = (hash01(i * 3.71 + k * 91.7 + tick * 1.13) - 0.5) * 2 * spec.jitter * env;
          const px = b.ax + dx * t + nx * j;
          const py = b.ay + dy * t + ny * j;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /**
   * **Poussière de givre le long de l'arme** — la variante « poudre » des arcs.
   *
   * Même ancrage qu'eux (`f.bladeSegment()`, donc solidaire de la portée et du
   * décalage latéral), même hachage pur, mais des **grains isolés** au lieu de
   * polylignes. Ils dérivent perpendiculairement à l'arme, plus loin et plus
   * pâles vers la pointe : c'est ce qui donne le panache, alors qu'une nuée
   * uniforme se lit comme du bruit posé sur le sprite.
   *
   * La leçon des arcs vaut ici telle quelle : **l'écart doit dépasser la
   * demi-épaisseur du sprite**, sinon les grains restent dans la silhouette,
   * qui les recouvre — ils sont dessinés derrière l'arme.
   */
  _drawWeaponDust(ctx, f, now, spec) {
    const b = f.bladeSegment();
    const dx = b.bx - b.ax;
    const dy = b.by - b.ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const tick = Math.floor(now * spec.rate);
    const hot = f.boost > 0 ? spec.boost : 1;

    ctx.save();
    for (let i = 0; i < spec.count; i++) {
      const h1 = hash01(i * 12.99 + tick * 0.317);
      const h2 = hash01(i * 78.23 + tick * 0.911);
      const h3 = hash01(i * 3.71 + tick * 1.13);
      const t = h1; // position le long de l'arme
      // le panache s'ouvre vers la pointe
      const j = (h2 - 0.5) * 2 * spec.jitter * (0.3 + 0.7 * t) * hot;
      const x = b.ax + dx * t + nx * j;
      const y = b.ay + dy * t + ny * j;
      ctx.globalAlpha = spec.alpha * (0.3 + 0.7 * h3) * (1 - 0.45 * t);
      ctx.fillStyle = h3 > 0.7 ? spec.core : spec.glow;
      ctx.beginPath();
      ctx.arc(x, y, spec.size * (0.4 + 0.6 * h3), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /**
   * **Onde de pénétration** — ce que la pointe écarte pendant la charge.
   *
   * Opt-in par `look.flair.pierce`, et **seulement pendant la charge** :
   * l'effet est conditionné à `f.boost`, encore un compteur générique. Le
   * module allume, le rendu lit, et le rendu ne sait pas ce qu'est une charge.
   *
   * Deux morceaux : un **sillage en coin** qui part de la pointe vers
   * l'arrière — c'est lui qui donne la lecture « ça transperce » plutôt que
   * « ça pousse » — et un **arc de proue** juste devant la pointe. Le coin
   * s'ouvre vers l'arrière parce qu'un coin ouvert vers l'avant se lit comme
   * un projectile, pas comme une pénétration.
   */
  _drawPierce(ctx, f) {
    const spec = f.el.look.flair?.pierce;
    if (!spec || f.boost <= 0) return;
    const b = f.bladeSegment();
    const c = Math.cos(f.weaponAngle);
    const s = Math.sin(f.weaponAngle);
    const nx = -s;
    const ny = c;

    ctx.save();

    // sillage en coin, de la pointe vers l'arrière
    ctx.globalAlpha = spec.alpha;
    ctx.fillStyle = spec.color;
    ctx.beginPath();
    ctx.moveTo(b.bx, b.by);
    ctx.lineTo(b.bx - c * spec.length + nx * spec.width, b.by - s * spec.length + ny * spec.width);
    ctx.lineTo(b.bx - c * spec.length * 0.55, b.by - s * spec.length * 0.55);
    ctx.lineTo(b.bx - c * spec.length - nx * spec.width, b.by - s * spec.length - ny * spec.width);
    ctx.closePath();
    ctx.fill();

    // arc de proue, devant la pointe
    ctx.globalAlpha = spec.alpha * 1.5;
    ctx.strokeStyle = spec.core;
    ctx.lineWidth = spec.bowWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(b.bx + c * spec.bowGap, b.by + s * spec.bowGap, spec.bow,
      f.weaponAngle - 1.15, f.weaponAngle + 1.15);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /** État critique : au-dessus des combattants, sous les nombres. */
  drawDanger(ctx, fighters, now) {
    for (const f of fighters) {
      if (!f.onStage || f.hp > 25) continue;
      const urgency = 1 - f.hp / 25;
      const beat = 0.5 + 0.5 * Math.sin(now * (7 + urgency * 9));
      ctx.save();
      ctx.globalAlpha = (0.28 + 0.42 * urgency) * beat;
      ctx.strokeStyle = '#ff2d2d';
      ctx.lineWidth = 3 + 4 * urgency;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius + 9 + 4 * beat, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  /** Nombres de dégâts : toujours au-dessus de tout. */
  drawPops(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const p of this.pops) {
      if (!p.alive) continue;
      const t = p.life / p.maxLife;
      const size = (p.big ? 44 : 34) * (1.25 - 0.25 * t);
      ctx.globalAlpha = Math.min(1, t * 2.2);
      ctx.font = `900 ${size}px "Archivo Black", "Arial Black", sans-serif`;
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#0a0a0a';
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /** Éclat plein cadre, hors arène compris. */
  drawFlash(ctx) {
    if (this.flash <= 0) return;
    ctx.save();
    ctx.globalAlpha = (this.flash / this.flashMax) * 0.9;
    ctx.fillStyle = this.flashColor;
    const i = ARENA.inner;
    ctx.fillRect(i.left, i.top, i.right - i.left, i.bottom - i.top);
    ctx.restore();
  }

}
