/**
 * Formatage des lignes de statistique du HUD.
 *
 * Extrait de `elements.js` lors de la découpe en un fichier par combattant :
 * plusieurs fiches s'en servent, il fallait donc un point commun plutôt qu'une
 * copie par fichier.
 *
 * @module data/format
 */

/** Formatage « 3s » / « 2.4s » identique à la vidéo. */
export function formatSeconds(v) {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? `${r}s` : `${r.toFixed(1)}s`;
}

/** Formatage « 4 » / « 4.5 » des stats à demi-pas. */
export function formatHalf(v) {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? `${r}` : r.toFixed(1);
}
