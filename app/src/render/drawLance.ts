/**
 * Blit du sprite sur le corps physique (point 3 du brief).
 *
 * Le sprite est posé à partir du **pivot**, pas du centre géométrique :
 * `LanceBody` expose `drawOffsetX/Y` calculés au même endroit que le déport
 * passé à `Body.setCentre`, ce qui interdit aux deux de diverger.
 *
 * @module render/drawLance
 */

import Matter from 'matter-js';
import type { LanceBody } from '../physics/lanceBody';

export function drawLance(
  ctx: CanvasRenderingContext2D,
  texture: HTMLImageElement,
  lance: LanceBody,
): void {
  const { body, width, height, drawOffsetX, drawOffsetY } = lance;

  ctx.save();
  // `body.position` **est** le manche depuis `Body.setCentre` : on translate
  // dessus, on tourne, et le sprite se pose par son offset.
  ctx.translate(body.position.x, body.position.y);
  ctx.rotate(body.angle);
  ctx.drawImage(texture, drawOffsetX, drawOffsetY, width, height);
  ctx.restore();
}

/**
 * La bille du combattant, dessinée **au pivot de la lance**.
 *
 * Elle est cuivre : la teinte avait été choisie à 63 unités de rouge du
 * Hors-la-loi pour qu'on distingue les deux billes en duel, et ce raisonnement
 * ne dépend pas de l'arme portée — elle survit donc au passage à la lance
 * électrique.
 */
export function drawFighter(
  ctx: CanvasRenderingContext2D,
  at: Matter.Vector,
  radius: number,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(at.x, at.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#c9905f';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#181008';
  ctx.stroke();
  ctx.restore();
}

/**
 * Silhouette de collision, sous `?debug=1`.
 *
 * Elle sert surtout à vérifier d'un coup d'œil que la boîte de la lance colle
 * à la hampe et non au halo d'arcs, et que le pivot est bien sur le manche.
 */
export function drawDebugBodies(ctx: CanvasRenderingContext2D, bodies: Matter.Body[]): void {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#39ff88';
  for (const body of bodies) {
    if (body.label === 'wall') continue;
    ctx.beginPath();
    const v0 = body.vertices[0]!;
    ctx.moveTo(v0.x, v0.y);
    for (let i = 1; i < body.vertices.length; i++) {
      const v = body.vertices[i]!;
      ctx.lineTo(v.x, v.y);
    }
    ctx.closePath();
    ctx.stroke();

    // le pivot, en rouge : c'est ce qu'on veut voir sur le manche
    ctx.fillStyle = '#ff3b6b';
    ctx.fillRect(body.position.x - 2, body.position.y - 2, 4, 4);
  }
  ctx.restore();
}
