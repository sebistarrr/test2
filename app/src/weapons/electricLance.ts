/**
 * LANCE ÉLECTRIQUE — l'arme du Lancier.
 *
 * Elle **remplace** la lance de cuivre. Les valeurs de géométrie sont reprises
 * du relevé vidéo qui servait déjà à l'ancienne arme, pour que le portage ne
 * change pas l'allonge du personnage :
 *
 *   - portée centre → pointe = **164 px** (mesuré) ;
 *   - talon dépassant de 44 px **derrière** le pivot (mesuré).
 *
 * D'où `worldLength = 208` et `pivot.x = 44 / 208 = 0,2115` : la pointe tombe
 * à (1 − 0,2115) × 208 = **164,0**. Les deux chiffres du relevé sont donc
 * encodés dans un seul couple, et ils ne peuvent pas diverger.
 *
 * Convention de commentaire, héritée du dépôt : chaque valeur porte `mesuré`
 * (relevé vidéo), `calé` (ajusté par simulation) ou `déduit`.
 *
 * @module weapons/electricLance
 */

import type { WeaponSpec } from './types';
import textureUrl from '../../public/sprites/electric-lance.png?url';

/** Gèle en profondeur, comme les fiches de la version JS : un duel ne peut
 *  pas déteindre sur le suivant. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const key of Object.getOwnPropertyNames(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

export const ELECTRIC_LANCE: WeaponSpec = deepFreeze({
  id: 'electricLance',
  name: 'Electric Lance',
  nameFr: 'Lance électrique',

  sprite: {
    texture: textureUrl,
    // Dimensions du PNG détouré depuis la maquette (le damier de transparence
    // a été retiré en définissant le premier plan positivement : violet
    // saturé, blanc des éclairs, noir du contour).
    sourceWidth: 624,
    sourceHeight: 129,
    // mesuré : 44 px de talon + 164 px de portée.
    worldLength: 208,
    // déduit : 44 / 208. Le pivot tombe sur la poignée, juste devant le
    // pommeau doré — pas au milieu géométrique.
    pivot: { x: 44 / 208, y: 0.5 },
  },

  body: {
    /**
     * calé : le PNG fait 129 px de haut, mais l'essentiel est constitué des
     * **arcs électriques** autour de la tête, qui ne sont pas de la matière.
     * Une boîte à la hauteur du sprite donnerait une hitbox trois fois trop
     * épaisse. 0,30 colle à la hampe et à la lame, pas au halo.
     */
    thickness: 0.3,
    density: 0.0016,
    frictionAir: 0.02,
    /** calé : sans amortissement, un moulinet tourne indéfiniment — Matter
     *  n'amortit pas la rotation tout seul. */
    angularDamping: 0.985,
  },

  thrust: {
    windup: 0.12, // calé
    strike: 0.16, // mesuré : la charge de l'ancienne lance durait ~0,15 s
    recover: 0.34, // calé
    windupSpeed: 2.2, // calé
    /**
     * calé, **par unité de masse**. Multipliée par `body.mass` à
     * l'application : la portée de l'estoc ne bouge donc pas quand on retouche
     * `body.density`. C'est le piège classique de `applyForce`, dont l'effet
     * dépend de la masse alors qu'on raisonne en distance parcourue.
     */
    force: 0.085,
  },

  spin: {
    /** calé : ~0,42 rad par pas à 60 Hz ≈ 4 tours/s au départ. */
    angularVelocity: 0.42,
    duration: 0.55, // calé
  },

  lightning: {
    arcs: 7, // calé : au-delà, la tête devient une bouillie blanche
    life: 0.09, // calé : plus long, les arcs « collent » et perdent le grésillement
    subdivisions: 4, // déduit : 2^4 = 16 segments, assez sur un arc court
    /**
     * calé : des arcs **courts**, accrochés près de la tête. Le premier
     * réglage les faisait courir sur toute la lance (0,15 → 1,12 de la
     * portée) : ils sortaient en longues tentacules molles qui pendaient
     * sous l'arme au lieu de grésiller autour. La maquette montre une
     * couronne d'arcs serrée sur le fer, pas une chevelure.
     */
    spanMin: 0.1,
    spanMax: 0.26,
    anchorMin: 0.5,
    anchorMax: 1.02,
    jitterRatio: 0.34, // calé
    /**
     * Sur fond **blanc** (l'arène est blanche, c'est le relevé), le halo est
     * la teinte *claire* et le cœur la teinte *saturée* — l'inverse de ce
     * qu'on écrit pour un fond sombre. Un cœur quasi blanc, choisi d'abord,
     * disparaissait purement et simplement.
     */
    core: '#7c3aed',
    glow: '#c4b5fd',
    coreWidth: 2,
    glowWidth: 7,
  },
} satisfies WeaponSpec);
