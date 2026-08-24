/**
 * Utilitaires de texte Canvas.
 *
 * La mise en page du HUD est mesurée au pixel sur la vidéo : si une chaîne
 * dépasse (traduction plus longue, police de repli, valeur à 3 chiffres), on
 * la comprime horizontalement plutôt que de la laisser déborder sur l'autre
 * moitié du HUD.
 *
 * @module render/text
 */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{fill:string, stroke?:string, strokeWidth?:number}} style
 */
export function drawFittedText(ctx, text, x, y, maxWidth, style) {
  const w = ctx.measureText(text).width;
  const k = w > maxWidth && maxWidth > 0 ? maxWidth / w : 1;

  ctx.save();
  ctx.translate(x, y);
  if (k !== 1) ctx.scale(k, 1);
  if (style.stroke) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = (style.strokeWidth ?? 4) / k; // le contour garde son épaisseur visuelle
    ctx.strokeStyle = style.stroke;
    ctx.strokeText(text, 0, 0);
  }
  ctx.fillStyle = style.fill;
  ctx.fillText(text, 0, 0);
  ctx.restore();
  return k;
}
