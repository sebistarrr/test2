/**
 * Registre des modules de pouvoirs.
 *
 * Un module implémente : init / update / drawUnder / drawOver / barValue,
 * plus deux crochets optionnels :
 *   • `onDamage(f, amount, source, opts, game)` → dégâts restants après
 *     absorption (carapace de la Tortue) ;
 *   • `onLand(f, target, hit, game)` → réaction à sa propre touche d'arme
 *     (le Tigre y laisse une marque) ;
 *   • `drawWeapon(ctx, f)` → rendu d'arme sur mesure, à la place du couple
 *     manche + sprite (le fouet courbe du Serpent).
 *
 * Ajouter une bête = ajouter sa fiche + son module ici.
 *
 * @module game/abilities
 */

import { wolfAbilities } from './wolf.js';
import { spiderAbilities } from './spider.js';
import { bearAbilities } from './bear.js';
import { turtleAbilities } from './turtle.js';
import { hawkAbilities } from './hawk.js';
import { tigerAbilities } from './tiger.js';
import { deerAbilities } from './deer.js';
import { snakeAbilities } from './snake.js';

const REGISTRY = {
  wolf: wolfAbilities,
  spider: spiderAbilities,
  bear: bearAbilities,
  turtle: turtleAbilities,
  hawk: hawkAbilities,
  tiger: tigerAbilities,
  deer: deerAbilities,
  snake: snakeAbilities,
};

/** Module neutre : sert de repli pour une bête sans pouvoirs dédiés. */
const NOOP = {
  id: 'noop',
  init() {},
  update() {},
  drawUnder() {},
  drawOver() {},
  barValue: (f) => f.ult.charge / 100,
};

export function abilitiesFor(beastId) {
  return REGISTRY[beastId] ?? NOOP;
}
