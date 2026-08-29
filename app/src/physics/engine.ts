/**
 * Moteur Matter.js et arène.
 *
 * @module physics/engine
 */

import Matter from 'matter-js';

const { Engine, Bodies, Composite } = Matter;

export interface Stage {
  readonly engine: Matter.Engine;
  readonly width: number;
  readonly height: number;
}

/**
 * Crée le moteur.
 *
 * **Gravité nulle** : le jeu est vu de dessus, comme les vidéos de référence —
 * les combattants sont des billes qui roulent dans une arène carrée, ils ne
 * tombent pas. C'est le premier réglage que le portage doit poser, parce que
 * la valeur par défaut de Matter (`gravity.y = 1`) donnerait un jeu de
 * plateforme, et le bug se lit comme « tout part vers le bas » plutôt que
 * comme un réglage oublié.
 */
export function createStage(width: number, height: number): Stage {
  const engine = Engine.create();
  engine.gravity.x = 0;
  engine.gravity.y = 0;

  const T = 200; // épaisseur des murs : large, pour qu'aucun corps rapide ne tunnelle
  const opts: Matter.IChamferableBodyDefinition = {
    isStatic: true,
    restitution: 1,
    friction: 0,
    label: 'wall',
  };
  Composite.add(engine.world, [
    Bodies.rectangle(width / 2, -T / 2, width + T * 2, T, opts),
    Bodies.rectangle(width / 2, height + T / 2, width + T * 2, T, opts),
    Bodies.rectangle(-T / 2, height / 2, T, height + T * 2, opts),
    Bodies.rectangle(width + T / 2, height / 2, T, height + T * 2, opts),
  ]);

  return { engine, width, height };
}

/**
 * La bille du Lancier — **décorative**.
 *
 * Elle n'est pas un corps physique : elle est dessinée au pivot de la lance.
 *
 * La première version l'attachait par deux contraintes rigides, et c'était une
 * erreur visible à l'image : une contrainte tire la lance en un point qui
 * n'est **pas** son centre de masse (puisqu'on vient justement de le déporter
 * sur le manche), ce qui crée un couple parasite — l'ensemble dérivait et
 * partait en rotation lente, tout seul, sans qu'aucune commande soit jouée.
 *
 * Un seul corps supprime le problème à la racine, et rend le déport de pivot
 * bien plus lisible : le moulinet fait tournoyer la lance **autour de sa
 * poignée**, ce qui est exactement ce que `Body.setCentre` sert à obtenir.
 */
export const FIGHTER_RADIUS = 41;
