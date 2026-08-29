/**
 * Aléa déterministe (mulberry32).
 *
 * La version JS du jeu tenait un invariant fort : `?seed=` doit rejouer un
 * duel à l'identique, et **deux flux séparés** garantissaient qu'ajouter du
 * spectacle ne pouvait pas changer un vainqueur — `game.rng` pour la
 * simulation, `game.viewRng` pour le rendu seul. Tout appel au premier
 * consomme le flux et décale tout ce qui suit ; ça s'est produit deux fois.
 *
 * Le portage garde la séparation. Les éclairs tirent sur `viewRng` : les
 * ajouter, les enlever ou en changer le nombre ne peut pas déplacer la
 * physique d'un pouce.
 *
 * @module vfx/rng
 */

export interface Rng {
  /** Flottant dans [0, 1). */
  next(): number;
  /** Flottant dans [min, max). */
  range(min: number, max: number): number;
  /** Flottant dans [-spread, +spread). */
  spread(spread: number): number;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    spread: (s) => (next() * 2 - 1) * s,
  };
}
