/**
 * Petites fonctions mathématiques partagées.
 * Aucune dépendance : tout est pur et testable.
 * @module core/math
 */

export const TAU = Math.PI * 2;

/** @param {number} v @param {number} min @param {number} max */
export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

/** Interpolation linéaire. */
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Lissage exponentiel indépendant du pas de temps.
 * `rate` = vitesse de convergence (1/s).
 */
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));

/** Normalise un angle dans ]-PI, PI]. */
export function wrapAngle(a) {
  while (a > Math.PI) a -= TAU;
  while (a <= -Math.PI) a += TAU;
  return a;
}

/**
 * Fait tourner `from` vers `to` d'au plus `maxStep` radians.
 * Sert au pilotage (steering) des combattants.
 */
export function rotateToward(from, to, maxStep) {
  const d = wrapAngle(to - from);
  if (Math.abs(d) <= maxStep) return to;
  return from + Math.sign(d) * maxStep;
}

/** Distance au carré entre deux points. */
export const dist2 = (ax, ay, bx, by) => {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
};

export const dist = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by));

/**
 * Distance d'un point au segment [a,b].
 * Utilisée pour la collision « arme (segment) vs corps (cercle) ».
 * @returns {{d:number, t:number, x:number, y:number}} distance, abscisse curviligne et point le plus proche
 */
export function segmentPointDistance(ax, ay, bx, by, px, py) {
  const vx = bx - ax;
  const vy = by - ay;
  const len2 = vx * vx + vy * vy;
  let t = len2 === 0 ? 0 : ((px - ax) * vx + (py - ay) * vy) / len2;
  t = clamp(t, 0, 1);
  const x = ax + vx * t;
  const y = ay + vy * t;
  return { d: Math.hypot(px - x, py - y), t, x, y };
}

/** Arrondi « propre » pour l'affichage des dixièmes de seconde. */
export const round1 = (v) => Math.round(v * 10) / 10;
