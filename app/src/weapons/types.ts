/**
 * Types du domaine « arme ».
 *
 * Le moteur ne connaît aucune arme en particulier : il lit une `WeaponSpec`.
 * C'est la règle qui tenait déjà dans la version JS du jeu — `fighter.js`,
 * `physics.js` et `projectiles.js` lisaient la fiche — et elle est reprise
 * ici, en types, pour qu'ajouter une arme reste une entrée de données et pas
 * une branche dans le moteur.
 *
 * @module weapons/types
 */

/** Un point du sprite, exprimé en **fraction** de sa largeur/hauteur. */
export interface SpriteAnchor {
  /** 0 = bord gauche du sprite, 1 = bord droit. */
  readonly x: number;
  /** 0 = bord haut, 1 = bord bas. */
  readonly y: number;
}

/** Le sprite pixel-art et la façon dont il se pose sur le corps physique. */
export interface WeaponSprite {
  /** URL de la texture, résolue par Vite (voir `electricLance.ts`). */
  readonly texture: string;
  /** Dimensions natives du PNG, en pixels de la source. */
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  /**
   * Longueur dessinée dans le monde, en unités logiques. La hauteur s'en
   * déduit par le rapport d'aspect : elle n'est jamais donnée à la main, sans
   * quoi le sprite se déforme dès qu'on retouche la longueur.
   */
  readonly worldLength: number;
  /**
   * **Le pivot**, en fraction de la largeur du sprite. C'est lui qu'on passe
   * à `Matter.Body.setCentre` : l'arme tourne autour de son manche, pas de
   * son milieu géométrique.
   */
  readonly pivot: SpriteAnchor;
}

/** Le corps physique : une boîte allongée collée au sprite. */
export interface WeaponBodySpec {
  /**
   * Épaisseur du corps, en fraction de la hauteur du sprite. La lance est
   * dessinée avec une tête large et beaucoup de vide autour (les arcs) : une
   * boîte à la hauteur du PNG donnerait une hitbox très au-delà de la matière.
   */
  readonly thickness: number;
  readonly density: number;
  readonly frictionAir: number;
  /** Amortissement de la rotation, appliqué à la main (Matter n'en a pas). */
  readonly angularDamping: number;
}

/** L'estoc : une poussée vers l'avant, en trois temps. */
export interface ThrustSpec {
  /** Durée du recul d'élan, en secondes. */
  readonly windup: number;
  /** Durée de la poussée. */
  readonly strike: number;
  /** Temps mort après la poussée. */
  readonly recover: number;
  /** Recul d'élan, en unités de vitesse. */
  readonly windupSpeed: number;
  /**
   * Force de la poussée, **par unité de masse** : elle est multipliée par
   * `body.mass` au moment de l'appliquer. Sans ça, changer la densité du
   * corps changerait silencieusement la portée de l'estoc.
   */
  readonly force: number;
}

/** Le moulinet : une mise en rotation, puis un amortissement. */
export interface SpinSpec {
  /** Vitesse angulaire initiale, en radians par pas de simulation. */
  readonly angularVelocity: number;
  /** Durée pendant laquelle le moulinet est « actif » (fenêtre de dégâts). */
  readonly duration: number;
  // Pas de `decay` ici : l'amortissement de la rotation est une propriété du
  // **corps**, pas de l'attaque (`WeaponBodySpec.angularDamping`). Il avait
  // d'abord été dupliqué aux deux endroits, et celui-ci n'était lu par
  // personne — un champ de fiche que rien ne lit finit par mentir.
}

/** Les éclairs procéduraux dessinés autour de l'arme. */
export interface LightningSpec {
  /** Nombre d'arcs vivants au même instant. */
  readonly arcs: number;
  /** Durée de vie d'un arc, en secondes. */
  readonly life: number;
  /** Nombre de subdivisions du déplacement de point milieu. */
  readonly subdivisions: number;
  /**
   * Longueur d'un arc, en **fraction de la portée** de l'arme. Courte : un arc
   * qui court sur toute la lance devient une ligne ondulée molle, pas un
   * éclair. C'est la longueur, pas l'amplitude, qui décide du grésillement.
   */
  readonly spanMin: number;
  readonly spanMax: number;
  /** Où l'arc s'accroche sur la lance, en fraction de la portée. */
  readonly anchorMin: number;
  readonly anchorMax: number;
  /**
   * Amplitude du premier déplacement, en **fraction de la longueur de l'arc**.
   * Relative et non absolue : une amplitude en pixels donne des arcs mous
   * quand ils sont longs et des gribouillis quand ils sont courts.
   */
  readonly jitterRatio: number;
  /** Cœur de l'éclair (le trait fin, clair). */
  readonly core: string;
  /** Halo (le trait large, sombre, dessiné dessous). */
  readonly glow: string;
  /** Épaisseur du cœur, en unités logiques. */
  readonly coreWidth: number;
  /** Épaisseur du halo. */
  readonly glowWidth: number;
}

/** Fiche complète d'une arme. Gelée à l'exécution (voir `electricLance.ts`). */
export interface WeaponSpec {
  readonly id: string;
  /** Nom affiché — l'application est en anglais, comme la vidéo de référence. */
  readonly name: string;
  /** Nom français, pour la doc et un éventuel `?lang=fr`. */
  readonly nameFr: string;
  readonly sprite: WeaponSprite;
  readonly body: WeaponBodySpec;
  readonly thrust: ThrustSpec;
  readonly spin: SpinSpec;
  readonly lightning: LightningSpec;
}

/** Phases de l'estoc. Un seul point de sortie les remet toutes à plat. */
export type ThrustPhase = 'idle' | 'windup' | 'strike' | 'recover';
