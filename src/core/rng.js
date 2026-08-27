/**
 * Générateur pseudo-aléatoire déterministe (mulberry32).
 *
 * Pourquoi : les *paramètres* des éléments sont figés (voir data/elements.js),
 * mais un duel a besoin d'aléa (dispersion des projectiles, particules…).
 * En passant par une seed on garde la possibilité de rejouer exactement
 * le même duel : `index.html?seed=1234`.
 *
 * @module core/rng
 */

/** @param {number} seed entier 32 bits */
export function createRng(seed) {
  let a = seed >>> 0;
  /** Flottant dans [0,1[ */
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    /** Flottant dans [min,max[ */
    range: (min, max) => min + next() * (max - min),
    /** Entier dans [min,max] */
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    /** Flottant dans [-v,+v[ */
    spread: (v) => (next() * 2 - 1) * v,
    /** Choix uniforme dans un tableau. */
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    /** Vrai avec la probabilité p. */
    chance: (p) => next() < p,
    seed: a,
  };
}

/** Seed lisible depuis l'URL, sinon aléatoire. */
export function seedFromLocation(search = globalThis.location?.search ?? '') {
  const param = new URLSearchParams(search).get('seed');
  if (param !== null && param !== '' && Number.isFinite(Number(param))) return Number(param) >>> 0;
  return (Math.random() * 0xffffffff) >>> 0;
}
