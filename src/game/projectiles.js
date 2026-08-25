/**
 * Projectiles (crocs lancés, shurikens-toiles, traits de vent…).
 *
 * Le comportement (vitesse, dégâts, rebonds, traînée, rendu) est entièrement
 * décrit dans la fiche de la bête : ce module ne fait qu'appliquer la
 * description.
 *
 * **Rendu lisse.** Contrairement aux combattants et aux armes, qui restent en
 * pixel-art, les projectiles sont dessinés en tracés vectoriels : un halo et
 * une bille à dégradé, étirée dans le sens de la course. Une fiche qui décrit
 * un `glow` obtient ce rendu ; sans lui on retombe sur son sprite.
 *
 * @module game/projectiles
 */

import { ARENA } from '../data/tuning.js';
import { PIXEL_MAPS } from '../data/pixelmaps.js';
import { TAU, dist } from '../core/math.js';
import { drawSpriteCentered } from '../render/sprites.js';

export class Projectiles {
  /**
   * @param {import('../render/effects.js').Effects} fx
   */
  constructor(fx) {
    this.fx = fx;
    /** @type {Array<any>} */
    this.list = [];
  }

  clear() {
    this.list.length = 0;
  }

  /**
   * @param {import('./fighter.js').Fighter} owner
   * @param {string} key clé du projectile dans la fiche
   * @param {number} angle
   */
  spawn(owner, key, angle, offset = owner.radius + 6) {
    const def = owner.el.projectiles[key];
    if (!def) throw new Error(`[projectiles] « ${key} » absent de la fiche ${owner.el.id}`);
    this.list.push({
      def,
      owner,
      x: owner.x + Math.cos(angle) * offset,
      y: owner.y + Math.sin(angle) * offset,
      vx: Math.cos(angle) * def.speed,
      vy: Math.sin(angle) * def.speed,
      angle,
      life: def.life,
      bounces: def.bounces,
      trailTimer: 0,
    });
  }

  /**
   * @param {number} dt
   * @param {number} now
   * @param {import('./fighter.js').Fighter[]} fighters
   * @param {(target:any, amount:number, source:any, opts?:object)=>void} onHit
   */
  update(dt, now, fighters, onHit) {
    const inner = ARENA.inner;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle = Math.atan2(p.vy, p.vx);

      // traînée
      if (p.def.trail) {
        p.trailTimer -= dt;
        if (p.trailTimer <= 0) {
          p.trailTimer = p.def.trail.every;
          this.fx.dot(p.x, p.y, p.def.trail.color, p.def.trail.life, p.def.trail.dotted ? 2 : 3.5);
        }
      }

      // murs
      const r = p.def.radius;
      let hitWall = false;
      if (p.x - r < inner.left) { p.x = inner.left + r; p.vx = Math.abs(p.vx); hitWall = true; }
      if (p.x + r > inner.right) { p.x = inner.right - r; p.vx = -Math.abs(p.vx); hitWall = true; }
      if (p.y - r < inner.top) { p.y = inner.top + r; p.vy = Math.abs(p.vy); hitWall = true; }
      if (p.y + r > inner.bottom) { p.y = inner.bottom - r; p.vy = -Math.abs(p.vy); hitWall = true; }
      if (hitWall) {
        if (p.bounces <= 0) { this.kill(i, p); continue; }
        p.bounces--;
      }

      // cible
      for (const f of fighters) {
        if (f === p.owner || !f.alive) continue;
        if (dist(p.x, p.y, f.x, f.y) <= f.radius + r) {
          onHit(f, p.def.damage, p.owner, {
            kind: 'projectile',
            def: p.def,
            x: p.x,
            y: p.y,
            angle: p.angle,
          });
          this.kill(i, p);
          break;
        }
      }

      if (p.life <= 0) this.kill(i, p);
    }
  }

  kill(index, p) {
    this.fx.burst(p.x, p.y, 5, {
      color: p.def.trail ? p.def.trail.color : '#ffffff',
      speed: 90,
      size: 4,
      life: 0.3,
    });
    this.list.splice(index, 1);
  }

  /** @param {CanvasRenderingContext2D} ctx */
  draw(ctx) {
    for (const p of this.list) {
      if (p.def.glow) drawGlow(ctx, p);
      else drawPixelSprite(ctx, p); // repli : une fiche peut encore décrire un sprite
    }
  }

  drawDebug(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,0,0,.6)';
    for (const p of this.list) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.def.radius, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * `#rrggbb` → `rgba(r,g,b,a)`. Les dégradés ont besoin de la **même** couleur
 * à deux opacités : un halo qui s'éteint vers `transparent` virerait au gris
 * sur les navigateurs qui interpolent en passant par le noir.
 */
function withAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/**
 * Bille lisse : un halo diffus, puis un corps à dégradé dont le point clair
 * est décalé vers l'avant. L'ensemble est étiré le long de la course (`angle`
 * suit la vitesse à chaque frame, rebonds compris), ce qui donne la comète.
 *
 * @param {CanvasRenderingContext2D} ctx
 */
function drawGlow(ctx, p) {
  const g = p.def.glow;
  const r = g.radius;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);

  const halo = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 2.2);
  halo.addColorStop(0, withAlpha(g.edge, 0.5));
  halo.addColorStop(0.5, withAlpha(g.edge, 0.16));
  halo.addColorStop(1, withAlpha(g.edge, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.2, 0, TAU);
  ctx.fill();

  // le corps s'allonge dans le sens de la marche : une bille parfaitement
  // ronde ne dit pas qu'elle file
  ctx.scale(g.stretch ?? 1.35, 1);
  const body = ctx.createRadialGradient(r * 0.3, -r * 0.25, r * 0.08, 0, 0, r);
  body.addColorStop(0, g.core);
  body.addColorStop(0.45, g.edge);
  body.addColorStop(1, withAlpha(g.edge, 0.9));
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Repli pixel-art, conservé pour toute fiche sans `glow`. */
function drawPixelSprite(ctx, p) {
  const map = PIXEL_MAPS[p.def.sprite];
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  drawSpriteCentered(ctx, p.def.sprite, 0, 0, map.h * p.def.scale);
  ctx.restore();
}
