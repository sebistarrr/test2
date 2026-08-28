/**
 * Résolution des collisions.
 *
 *  - corps ⟷ corps : séparation + rebond élastique (masses égales) ;
 *  - arme ⟷ corps  : segment (partie tranchante) contre cercle, avec un
 *    temps de recharge par arme pour éviter 120 touches/seconde.
 *
 * Les murs sont traités dans Fighter.step (rebond + inversion du sens de
 * rotation de l'arme, comportement observé sur la vidéo).
 *
 * @module game/physics
 */

import { PHYSICS } from '../data/tuning.js';
import { segmentPointDistance, wrapAngle } from '../core/math.js';

/**
 * @param {import('./fighter.js').Fighter} a
 * @param {import('./fighter.js').Fighter} b
 */
export function resolveBodies(a, b) {
  // un combattant hors du plateau ne bouscule personne
  if (!a.onStage || !b.onStage) return false;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  const min = a.radius + b.radius;
  if (d === 0 || d >= min) return false;

  const nx = dx / d;
  const ny = dy / d;
  const overlap = min - d;

  // séparation
  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;

  // rebond : chacun repart à l'opposé de la normale de contact
  a.heading = wrapAngle(Math.atan2(-ny, -nx));
  b.heading = wrapAngle(Math.atan2(ny, nx));
  const push = 130 * PHYSICS.bodyRestitution;
  a.push(-nx, -ny, push);
  b.push(nx, ny, push);
  return true;
}

/**
 * Teste si l'arme de `attacker` touche le corps de `target`.
 * @returns {null|{x:number,y:number,nx:number,ny:number}}
 */
export function weaponHit(attacker, target) {
  // `onStage` et pas `alive` : un combattant en l'air (le Bond du Dragoon) ne
  // touche pas et ne se fait pas toucher
  if (attacker.meleeCd > 0 || !attacker.onStage || !target.onStage) return null;
  if (target.invulnerable > 0) return null;

  const b = attacker.bladeSegment();
  const { d, x, y } = segmentPointDistance(b.ax, b.ay, b.bx, b.by, target.x, target.y);
  if (d > target.radius + b.r) return null;

  const dx = target.x - x;
  const dy = target.y - y;
  const len = Math.hypot(dx, dy) || 1;
  return { x, y, nx: dx / len, ny: dy / len };
}
