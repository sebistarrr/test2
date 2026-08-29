/**
 * Corps physique de la lance, avec **pivot déporté sur le manche**.
 *
 * C'est le point le plus subtil du portage, et il tient à une conséquence de
 * `Matter.Body.setCentre` qu'il est facile de manquer :
 *
 * > après `setCentre`, `body.position` **est** le nouveau centre.
 *
 * Autrement dit, déplacer le pivot ne déplace pas seulement le centre de
 * masse : il change ce que veut dire `body.position`, donc **où le sprite doit
 * être blitté**. Si on garde le blit centré, l'arme se met à flotter à côté de
 * son corps, d'un décalage exactement égal au déport — et comme le décalage
 * tourne avec l'arme, ça ressemble à un bug de rotation, pas à un bug d'ancre.
 *
 * D'où `LanceBody`, qui expose ensemble le corps **et** l'ancre de dessin :
 * les deux sont calculés au même endroit, à partir de la même fraction de
 * pivot, et ne peuvent pas diverger.
 *
 * @module physics/lanceBody
 */

import Matter from 'matter-js';
import type { WeaponSpec } from '../weapons/types';

const { Bodies, Body } = Matter;

export interface LanceBody {
  /** Le corps Matter.js. `body.position` est le **manche**, pas le milieu. */
  readonly body: Matter.Body;
  /** Longueur dessinée, en unités logiques. */
  readonly width: number;
  /** Hauteur dessinée, déduite du rapport d'aspect du PNG. */
  readonly height: number;
  /**
   * Coin haut-gauche du sprite **dans le repère local du corps**, pivot à
   * l'origine. C'est exactement l'argument à passer à `drawImage` après
   * `translate(body.position)` + `rotate(body.angle)`.
   */
  readonly drawOffsetX: number;
  readonly drawOffsetY: number;
  /** Distance pivot → pointe. Sert aux VFX et à la portée. */
  readonly reach: number;
}

/**
 * Crée la lance à la position donnée.
 *
 * @param spec fiche de l'arme
 * @param x position initiale du **pivot** (pas du centre géométrique)
 * @param y idem
 */
export function createLanceBody(spec: WeaponSpec, x: number, y: number): LanceBody {
  const { sprite, body: bodySpec } = spec;

  const width = sprite.worldLength;
  // La hauteur n'est jamais donnée à la main : elle se déduit du PNG, sinon le
  // sprite se déforme dès qu'on retouche `worldLength`.
  const height = (width * sprite.sourceHeight) / sprite.sourceWidth;

  // Boîte allongée collée à la hampe et à la lame — pas au halo d'arcs.
  const collisionHeight = height * bodySpec.thickness;

  const body = Bodies.rectangle(x, y, width, collisionHeight, {
    density: bodySpec.density,
    frictionAir: bodySpec.frictionAir,
    label: `weapon:${spec.id}`,
    render: {
      /**
       * `render.sprite` n'est lu que par le renderer **intégré** de Matter
       * (`Matter.Render`), qu'on n'utilise ici que pour le debug : il ne
       * permet ni de couper le lissage, ni de superposer les éclairs. Le rendu
       * de jeu passe par `render/drawLance.ts`. On le renseigne quand même,
       * pour que `Render.create()` affiche la bonne arme si on l'active.
       */
      sprite: {
        texture: sprite.texture,
        xScale: width / sprite.sourceWidth,
        yScale: height / sprite.sourceHeight,
        // Matter exprime l'offset de sprite en **fraction**, 0,5 = centré.
        // On lui redonne donc la même fraction de pivot.
        xOffset: sprite.pivot.x,
        yOffset: sprite.pivot.y,
      },
    },
  });

  // --- le déport du pivot ------------------------------------------------
  // Écart, dans le repère local, entre le milieu géométrique (0,5) et le
  // manche. Négatif : le manche est **avant** le milieu.
  const dx = (sprite.pivot.x - 0.5) * width;
  const dy = (sprite.pivot.y - 0.5) * height;

  // `relative: true` → le centre est décalé de ce vecteur, et `body.position`
  // vaut désormais le manche.
  Body.setCentre(body, { x: dx, y: dy }, true);

  return {
    body,
    width,
    height,
    // Le coin haut-gauche du sprite vu depuis le pivot. C'est la contrepartie
    // exacte du déport ci-dessus : si l'un change, l'autre suit.
    drawOffsetX: -sprite.pivot.x * width,
    drawOffsetY: -sprite.pivot.y * height,
    reach: (1 - sprite.pivot.x) * width,
  };
}

/** Pointe de la lance, dans le repère du monde. Utilisée par les VFX. */
export function lanceTip(lance: LanceBody): Matter.Vector {
  const { body, reach } = lance;
  return {
    x: body.position.x + Math.cos(body.angle) * reach,
    y: body.position.y + Math.sin(body.angle) * reach,
  };
}
