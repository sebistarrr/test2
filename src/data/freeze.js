/**
 * Gel récursif des fiches d'éléments.
 *
 * Contrat du projet : « les paramètres et le design de chaque élément ne
 * varient pas entre deux duels ». On le garantit à l'exécution — toute
 * tentative d'écriture dans une fiche lève une erreur en mode strict
 * (les modules ES sont toujours en mode strict).
 *
 * @module data/freeze
 */

/**
 * @template T
 * @param {T} obj
 * @returns {Readonly<T>}
 */
export function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) return obj;
  for (const key of Object.getOwnPropertyNames(obj)) {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (desc && 'value' in desc) deepFreeze(desc.value); // ignore les getters
  }
  return Object.freeze(obj);
}

/** Garde-fou appelé au lancement d'un duel. */
export function assertFrozen(obj, label) {
  if (!Object.isFrozen(obj)) throw new Error(`[fiche] ${label} doit être gelée (deepFreeze)`);
}
