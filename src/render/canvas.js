/**
 * Mise en place du canvas : résolution logique fixe 720x1280 (celle de la
 * vidéo de référence) + adaptation au devicePixelRatio pour un rendu net.
 *
 * Toute la scène est dessinée dans ce repère : les coordonnées du code sont
 * exactement les pixels mesurés sur la vidéo.
 *
 * @module render/canvas
 */

import { STAGE } from '../data/tuning.js';

export function createStage(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let dpr = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(globalThis.devicePixelRatio || 1, 3);
    // On garde la résolution logique constante et on augmente seulement la
    // taille du buffer : aucune coordonnée du jeu ne change.
    const targetW = Math.round(Math.max(rect.width, 1) * dpr);
    const targetH = Math.round(Math.max(rect.height, 1) * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
  }

  /** À appeler en début de frame : remet le repère logique 720x1280. */
  function begin() {
    const sx = canvas.width / STAGE.width;
    const sy = canvas.height / STAGE.height;
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  }

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  globalThis.addEventListener('orientationchange', resize);

  return { ctx, resize, begin, get dpr() { return dpr; } };
}
