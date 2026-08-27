/* =====================================================================
   Monde Matter.js.

   Matter ne fait QUE la physique : hitboxes circulaires, collisions,
   rebonds sur les murs, forces de recul, vélocité. `Matter.Render` n'est
   jamais instancié — tout le visuel passe par l'API Canvas dans render.ts.

   Deux pièges d'unités, isolés ici pour que le relevé reste lisible en
   px/s dans constants.ts :

   1. La vélocité de Matter est en px par PAS, pas par seconde. À 60 Hz,
      px/s = velocity * 60. Les helpers ci-dessous font la conversion.

   2. Matter intègre en Verlet : `velocity` est dérivée de la position
      précédente. On ne l'écrit donc jamais à la main, on passe par
      `Body.setVelocity`, qui replace aussi `positionPrev`.

   Le pas est FIXE (1000/60 ms). Avec un pas variable, le facteur de
   correction interne de Matter cesse de valoir 1 et les rebonds dérivent
   d'une machine à l'autre — la simulation ne serait plus la même à 60 et
   à 144 Hz.
   ===================================================================== */

import { Bodies, Body, Composite, Engine, Vector } from 'matter-js';
import { BALL_R, IN_H, IN_W, IN_X, IN_Y } from './constants';

/** Pas de simulation fixe, en millisecondes. */
export const STEP_MS = 1000 / 60;
/** Pas fixe, en secondes — l'unité de la logique de jeu. */
export const STEP_S = STEP_MS / 1000;

/** px/s -> px/pas Matter. */
export const toStep = (pxPerSecond: number): number => pxPerSecond * STEP_S;
/** px/pas Matter -> px/s. */
export const toSec = (pxPerStep: number): number => pxPerStep / STEP_S;

/** Norme de la vitesse d'un corps, en px/s. */
export function speedOf(body: Body): number {
  return toSec(Math.hypot(body.velocity.x, body.velocity.y));
}

/** Cap d'un corps, en radians. */
export function headingOf(body: Body): number {
  return Math.atan2(body.velocity.y, body.velocity.x);
}

/** Impose une vitesse en px/s, direction et norme. */
export function setSpeed(body: Body, angle: number, pxPerSecond: number): void {
  const v = toStep(pxPerSecond);
  Body.setVelocity(body, { x: Math.cos(angle) * v, y: Math.sin(angle) * v });
}

/**
 * Recul. Le relevé donne un delta de vitesse en px/s ; Matter veut une
 * force. Son intégrateur fait `v_pas += (force / masse) * dt_ms²`, donc
 * pour obtenir `dv` px/s il faut `force = masse * dv / (60 * dt_ms²)`.
 *
 * On passe bien par `Body.applyForce` — la force est remise à zéro après
 * chaque pas, l'impulsion est donc appliquée une fois et une seule.
 */
export function applyImpulse(body: Body, dvx: number, dvy: number): void {
  const k = body.mass / (60 * STEP_MS * STEP_MS);
  Body.applyForce(body, body.position, { x: dvx * k, y: dvy * k });
}

/** Corps d'un combattant : disque plein, rebond parfait, aucune friction. */
export function makeBall(x: number, y: number, label: string): Body {
  return Bodies.circle(x, y, BALL_R, {
    label,
    restitution: 1, // rebond : norme conservée, composante normale inversée
    friction: 0,
    frictionAir: 0, // sinon la bille freine et le relevé ne tient plus
    frictionStatic: 0,
    // Rotation bloquée : le sprite de l'arme est orienté par le jeu, pas
    // par la physique. Sans ça la bille roule et l'arme part en vrille.
    inertia: Infinity,
    slop: 0.02,
  });
}

/** Projectile : capteur, il traverse les murs et ne pousse personne. */
export function makeBullet(x: number, y: number): Body {
  return Bodies.circle(x, y, 3, {
    label: 'bullet',
    isSensor: true,
    frictionAir: 0,
  });
}

export interface World {
  engine: Engine;
  walls: Body[];
}

export function createWorld(): World {
  const engine = Engine.create();
  // Duel vu du dessus : aucune gravité.
  engine.gravity.x = 0;
  engine.gravity.y = 0;
  // Le relevé montre des rebonds nets ; deux passes de résolution
  // suffisent et gardent le pas rapide.
  engine.positionIterations = 8;
  engine.velocityIterations = 8;

  // Murs statiques calés sur l'INTÉRIEUR du trait d'arène. Bornes de
  // position relevées : x 70,5..504,0 et y 298,5..724,5, cohérentes avec
  // un rayon de collision de 32 px contre cet intérieur.
  const t = 200;
  const opts = { isStatic: true, restitution: 1, friction: 0, frictionStatic: 0 };
  const walls = [
    Bodies.rectangle(IN_X + IN_W / 2, IN_Y - t / 2, IN_W + t * 2, t, opts),
    Bodies.rectangle(IN_X + IN_W / 2, IN_Y + IN_H + t / 2, IN_W + t * 2, t, opts),
    Bodies.rectangle(IN_X - t / 2, IN_Y + IN_H / 2, t, IN_H + t * 2, opts),
    Bodies.rectangle(IN_X + IN_W + t / 2, IN_Y + IN_H / 2, t, IN_H + t * 2, opts),
  ];
  Composite.add(engine.world, walls);
  return { engine, walls };
}

export function addBody(world: World, body: Body): void {
  Composite.add(world.engine.world, body);
}

export function removeBody(world: World, body: Body): void {
  Composite.remove(world.engine.world, body);
}

/** Avance la simulation d'un pas fixe. */
export function stepWorld(world: World): void {
  Engine.update(world.engine, STEP_MS);
}

export { Body, Vector };
