/**
 * Projectiles : balles, éclats de givre, shurikens, orbes guidées.
 *
 * Le comportement (vitesse, dégâts, rebonds, guidage, traînée, sprite) est
 * entièrement décrit dans la fiche du combattant : ce module ne fait
 * qu'appliquer la description.
 *
 * @module game/projectiles
 */

import { ARENA } from '../data/tuning.js';
import { hash01 } from '../core/math.js';
import { PIXEL_MAPS } from '../data/pixelmaps.js';
import { TAU, dist, clamp, wrapAngle } from '../core/math.js';
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
      /** Compteur d'émissions, seule entrée du hachage de dispersion : il
       *  avance d'un pas fixe, donc la poudre est identique à graine égale. */
      trailSeed: 0,
      /** Sursis avant que le guidage prenne — voir `def.homing` dans `update`. */
      homingDelay: def.homing ? def.homing.delay : 0,
    });
  }

  /**
   * Une émission de traînée.
   *
   * Par défaut, un point unique sur la trajectoire — c'est le comportement
   * historique, et celui de tous les projectiles sauf la balle du
   * Hors-la-loi.
   *
   * Avec `trail.puff`, l'émission devient une **bouffée** : plusieurs grains
   * dispersés autour du point, décalés perpendiculairement à la vitesse et
   * étalés le long d'elle. Un projectile ne laissait qu'un chapelet de points
   * isolés, ce qui se lit comme des perles plutôt que comme un sillage.
   *
   * **Ceci est du code de simulation**, appelé depuis `update` : la dispersion
   * vient donc d'un **hachage pur** de (compteur d'émission, indice de grain),
   * jamais d'un tirage. `fx.dot` ne consomme aucun aléa non plus — c'est ce qui
   * rend l'enrichissement gratuit du point de vue du déterminisme.
   *
   * @param {*} p projectile
   */
  _emitTrail(p) {
    const t = p.def.trail;
    const base = t.dotted ? 2 : 3.5;
    if (!t.puff) {
      this.fx.dot(p.x, p.y, t.color, t.life, base);
      return;
    }
    const sp = Math.hypot(p.vx, p.vy) || 1;
    const nx = -p.vy / sp;
    const ny = p.vx / sp;
    const k = p.trailSeed++;
    for (let g = 0; g < t.puff.count; g++) {
      const h1 = hash01(k * 7.31 + g * 41.7);
      const h2 = hash01(k * 19.7 + g * 3.19);
      const h3 = hash01(k * 2.53 + g * 61.3);
      const off = (h1 - 0.5) * 2 * t.puff.spread;
      const back = -h2 * t.puff.trailBack;
      this.fx.dot(
        p.x + nx * off + (p.vx / sp) * back,
        p.y + ny * off + (p.vy / sp) * back,
        h3 > 0.7 && t.puff.core ? t.puff.core : t.color,
        t.life * (0.6 + 0.8 * h3),
        base * (0.5 + 0.9 * h3),
      );
    }
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

      /**
       * **Guidage** (`def.homing`) — l'orbe du Mage, seule à le déclarer.
       *
       * Le moteur ne nomme personne : la cible est le premier combattant en
       * scène qui n'est pas le tireur, exactement le test que fait déjà la
       * boucle de touche plus bas. Toute la forme du guidage se dit dans la
       * fiche, donc un autre combattant peut en hériter sans une ligne ici.
       *
       * **Le virage est borné** (`turnRate`, rad/s) et c'est tout le
       * garde-fou : une orbe qui virerait sans limite serait une touche
       * garantie, la version projectile du piège de l'arme braquée. Bornée,
       * elle dépasse la cible qui coupe assez sec, revient, et finit par
       * expirer — ce qui laisse au déplacement le dernier mot.
       *
       * `delay` laisse l'orbe sortir en ligne droite avant de virer, sans quoi
       * elle pivoterait dans le sceptre même et partirait de travers.
       */
      const hm = p.def.homing;
      if (hm) {
        p.homingDelay -= dt;
        if (p.homingDelay <= 0) {
          for (const f of fighters) {
            if (f === p.owner || !f.onStage || !f.alive) continue;
            const want = Math.atan2(f.y - p.y, f.x - p.x);
            const cur = Math.atan2(p.vy, p.vx);
            const step = clamp(wrapAngle(want - cur), -hm.turnRate * dt, hm.turnRate * dt);
            const a = cur + step;
            const sp = Math.hypot(p.vx, p.vy);
            p.vx = Math.cos(a) * sp;
            p.vy = Math.sin(a) * sp;
            break;
          }
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle = Math.atan2(p.vy, p.vx);

      // traînée
      if (p.def.trail) {
        p.trailTimer -= dt;
        if (p.trailTimer <= 0) {
          p.trailTimer = p.def.trail.every;
          this._emitTrail(p);
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
        // `onStage` : un combattant en l'air laisse passer les projectiles
        if (f === p.owner || !f.onStage) continue;
        if (dist(p.x, p.y, f.x, f.y) <= f.radius + r) {
          // les dégâts peuvent dépendre des stats évolutives du tireur, comme
          // ceux de l'arme : la balle du Hors-la-loi porte la même stat
          // « Damage » que son coup à bout portant
          const dmg = typeof p.def.damage === 'function' ? p.def.damage(p.owner) : p.def.damage;
          onHit(f, dmg, p.owner, {
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
      const map = PIXEL_MAPS[p.def.sprite];
      const h = map.h * p.def.scale;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      drawSpriteCentered(ctx, p.def.sprite, 0, 0, h);
      ctx.restore();
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
