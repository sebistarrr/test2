/**
 * Système de particules & effets visuels.
 *
 * Un seul tableau poolé pour tout : étincelles de touche, neige du Blizzard,
 * poussière du dôme, images fantômes du Pas d'ombre, ondes de choc, traînées
 * de projectiles. Chaque particule porte son « kind » qui décide du rendu.
 *
 * @module render/effects
 */

import { ARENA } from '../data/tuning.js';
import { TAU } from '../core/math.js';
import { getTintedSprite } from './sprites.js';

const MAX = 900;

export class Effects {
  constructor(rng) {
    this.rng = rng;
    /** @type {Array<any>} */
    this.pool = [];
    for (let i = 0; i < MAX; i++) this.pool.push({ alive: false });
    this.cursor = 0;
  }

  clear() {
    for (const p of this.pool) p.alive = false;
  }

  /** Récupère un slot libre (écrase le plus ancien si le pool est plein). */
  _slot() {
    for (let i = 0; i < MAX; i++) {
      const idx = (this.cursor + i) % MAX;
      if (!this.pool[idx].alive) {
        this.cursor = (idx + 1) % MAX;
        return this.pool[idx];
      }
    }
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % MAX;
    return p;
  }

  spawn(props) {
    const p = this._slot();
    Object.assign(p, {
      alive: true,
      kind: 'spark',
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0.5, maxLife: 0.5,
      size: 4, color: '#fff', alpha: 1,
      drag: 0, gravity: 0, spin: 0, angle: 0,
      r0: 0, r1: 0, width: 3, clip: true,
      sprite: null, scale: 1,
    }, props);
    p.maxLife = p.life;
    return p;
  }

  /* ---------- générateurs prêts à l'emploi ---------- */

  burst(x, y, count, { color, speed = 220, size = 5, life = 0.5, spread = TAU, dir = 0 }) {
    for (let i = 0; i < count; i++) {
      const a = dir + this.rng.spread(spread / 2);
      const v = speed * this.rng.range(0.35, 1);
      this.spawn({
        kind: 'spark', x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: life * this.rng.range(0.6, 1.2),
        size: size * this.rng.range(0.6, 1.3),
        color: Array.isArray(color) ? this.rng.pick(color) : color,
        drag: 2.4,
      });
    }
  }

  /**
   * Image fantôme laissée derrière un combattant qui se téléporte.
   * `sprite` donne la silhouette de la bête ; sans lui on retombe sur le
   * disque d'origine.
   */
  ghost(x, y, radius, color, life = 0.28, sprite = null) {
    this.spawn({ kind: 'ghost', x, y, size: radius, color, life, sprite });
  }

  ring(x, y, r0, r1, time, color, width, clip = false) {
    this.spawn({ kind: 'ring', x, y, r0, r1, life: time, color, width, clip });
  }

  dot(x, y, color, life = 0.4, size = 3) {
    this.spawn({ kind: 'dot', x, y, color, life, size, drag: 1.2 });
  }

  snow(x, y, fall, drift, color) {
    this.spawn({
      kind: 'snow', x, y,
      vx: this.rng.spread(drift), vy: fall * this.rng.range(0.7, 1.4),
      life: this.rng.range(1.4, 3.2), size: this.rng.range(1.4, 3), color,
    });
  }

  /* ---------- simulation ---------- */

  update(dt) {
    const inner = ARENA.inner;
    for (const p of this.pool) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) { p.alive = false; continue; }

      if (p.drag) {
        const k = Math.exp(-p.drag * dt);
        p.vx *= k; p.vy *= k;
      }
      if (p.gravity) p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.spin) p.angle += p.spin * dt;

      if (p.kind === 'snow' && p.y > inner.bottom) p.alive = false;
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} clipped true = passe dessinée à l'intérieur de l'arène
   */
  draw(ctx, clipped) {
    ctx.save();
    if (clipped) {
      const i = ARENA.inner;
      ctx.beginPath();
      ctx.rect(i.left, i.top, i.right - i.left, i.bottom - i.top);
      ctx.clip();
    }
    for (const p of this.pool) {
      if (!p.alive || !!p.clip !== clipped) continue;
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, Math.min(1, t * p.alpha));
      switch (p.kind) {
        case 'ring': {
          const r = p.r0 + (p.r1 - p.r0) * (1 - t);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.width * t;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, r), 0, TAU);
          ctx.stroke();
          break;
        }
        case 'ghost': {
          const gr = p.size * (0.6 + 0.4 * t);
          if (p.sprite) {
            // silhouette de la bête : depuis que le corps est un portrait,
            // un disque plein derrière lui se lisait comme un projectile
            const s = getTintedSprite(p.sprite, p.color);
            const gw = gr * 2 * (s.width / s.height);
            ctx.drawImage(s, p.x - gw / 2, p.y - gr, gw, gr * 2);
          } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, gr, 0, TAU);
            ctx.fill();
          }
          break;
        }
        case 'snow':
        case 'dot': {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, TAU);
          ctx.fill();
          break;
        }
        default: {
          // étincelle carrée : cohérente avec le rendu pixel-art
          ctx.fillStyle = p.color;
          const s = p.size * (0.5 + 0.5 * t);
          ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
