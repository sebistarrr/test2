/**
 * Complément aux types de `@types/matter-js`.
 *
 * `IBodyRenderOptionsSprite` ne déclare que `texture`, `xScale` et `yScale`,
 * alors que Matter.js gère bien `xOffset` / `yOffset` à l'exécution :
 * `Body.create` leur pose une valeur par défaut (matter.js:1667) et
 * `Body.setVertices` les recalcule (matter.js:1760). Les types sont en retard,
 * pas le moteur.
 *
 * On les déclare donc plutôt que de faire taire le compilateur par un `as`.
 * Un cast masquerait la même chose sans dire **pourquoi** il est là, et il
 * survivrait silencieusement à une version de types qui corrige le manque.
 *
 * @module types/matter-js-augment
 */

import 'matter-js';

declare module 'matter-js' {
  interface IBodyRenderOptionsSprite {
    /** Ancre horizontale du sprite, en **fraction** (0,5 = centré). */
    xOffset?: number;
    /** Ancre verticale du sprite, en fraction. */
    yOffset?: number;
  }
}
