/**
 * Résolution des collisions.
 *
 *  - corps ⟷ corps : séparation + rebond élastique, pondérés par
 *    `movement.mass` — le léger encaisse ;
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
  const push = 130 * PHYSICS.bodyRestitution;

  const ma = a.el.movement.mass;
  const mb = b.el.movement.mass;

  /**
   * **À masses égales, le chemin d'origine mot pour mot.**
   *
   * `movement.mass` figurait dans toutes les fiches sans que personne ne le
   * lise : la séparation partageait le recouvrement 50/50 et poussait les deux
   * corps pareil. Le Colosse est le premier à ne pas peser 1, d'où cette
   * branche — mais la multiplication flottante **n'est pas associative**, et
   * regrouper autrement les mêmes produits a déjà déplacé deux affrontements
   * où le combattant modifié n'était même pas. Les combattants qui pèsent tous
   * 1 repassent donc exactement par les mêmes expressions qu'avant. Même
   * discipline que `bladeSegment()` avec `weaponTwirl` à zéro.
   */
  if (ma === mb) {
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;
    a.heading = wrapAngle(Math.atan2(-ny, -nx));
    b.heading = wrapAngle(Math.atan2(ny, nx));
    a.push(-nx, -ny, push);
    b.push(nx, ny, push);
    return true;
  }

  /**
   * Masses différentes : le **léger** encaisse la séparation et la poussée.
   *
   * Chacun cède la part de l'autre — `a` recule de `mb / (ma + mb)` du
   * recouvrement — et reçoit une poussée dans le même rapport, doublée pour
   * que la somme reste celle d'avant. Le lourd n'est donc pas immobile, il est
   * *dur à bouger* : à masse 3 contre 1, il prend un quart du recul et en rend
   * trois quarts.
   */
  const total = ma + mb;
  const shareA = mb / total;
  const shareB = ma / total;
  a.x -= nx * overlap * shareA;
  a.y -= ny * overlap * shareA;
  b.x += nx * overlap * shareB;
  b.y += ny * overlap * shareB;
  a.heading = wrapAngle(Math.atan2(-ny, -nx));
  b.heading = wrapAngle(Math.atan2(ny, nx));
  a.push(-nx, -ny, push * 2 * shareA);
  b.push(nx, ny, push * 2 * shareB);
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
