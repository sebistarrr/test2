/**
 * Registre des modules de pouvoirs.
 *
 * Un module implémente : init / update / drawUnder / drawOver / barValue,
 * plus deux crochets optionnels :
 *   • `onDamage(f, amount, source, opts, game)` → dégâts restants après
 *     absorption (bouclier de la Lumière) ;
 *   • `onLand(f, target, hit, game)` → réaction à sa propre touche d'arme
 *     (la Foudre y plante une borne) ;
 *   • `drawWeapon(ctx, f)` → rendu d'arme sur mesure, à la place du couple
 *     manche + sprite (la liane courbe de la Plante).
 *
 * Ajouter un élément = ajouter sa fiche + son module ici.
 *
 * @module game/abilities
 */

import { shadowAbilities } from './shadow.js';
import { iceAbilities } from './ice.js';
import { fireAbilities } from './fire.js';
import { lightAbilities } from './light.js';
import { windAbilities } from './wind.js';
import { lightningAbilities } from './lightning.js';
import { waterAbilities } from './water.js';
import { plantAbilities } from './plant.js';
import { outlawAbilities } from './outlaw.js';
import { bladesmanAbilities } from './bladesman.js';
import { lancerAbilities } from './lancer.js';

const REGISTRY = {
  shadow: shadowAbilities,
  ice: iceAbilities,
  fire: fireAbilities,
  light: lightAbilities,
  wind: windAbilities,
  lightning: lightningAbilities,
  water: waterAbilities,
  plant: plantAbilities,
  outlaw: outlawAbilities,
  bladesman: bladesmanAbilities,
  lancer: lancerAbilities,
};

/** Module neutre : sert de repli pour un élément sans pouvoirs dédiés. */
const NOOP = {
  id: 'noop',
  init() {},
  update() {},
  drawUnder() {},
  drawOver() {},
  barValue: (f) => f.ult.charge / 100,
};

export function abilitiesFor(elementId) {
  return REGISTRY[elementId] ?? NOOP;
}
