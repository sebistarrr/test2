/**
 * Chargement des polices avant le premier rendu Canvas.
 *
 * `ctx.fillText` ne déclenche pas le chargement d'une webfont : si on dessine
 * trop tôt, le HUD s'affiche avec la police de repli puis « saute ». On attend
 * donc explicitement les faces utilisées par la scène.
 *
 * @module core/fonts
 */

const FACES = [
  '900 34px "Archivo Black"',
  '400 58px "Archivo Black"',
  '700 30px "Oswald"',
  '600 22px "Oswald"',
];

/** @returns {Promise<boolean>} true si les polices sont prêtes */
export async function ensureFonts(timeoutMs = 3000) {
  if (!document.fonts) return false;
  try {
    await Promise.race([
      Promise.all(FACES.map((f) => document.fonts.load(f))),
      new Promise((r) => setTimeout(r, timeoutMs)),
    ]);
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, timeoutMs))]);
    return true;
  } catch {
    return false; // on dessine avec les polices de repli, le jeu reste jouable
  }
}
