/**
 * Modèles de valeurs par défaut pour les combattants.
 * Utilise les valeurs les plus communes mesurées pour éviter les répétitions.
 * @module data/templates
 */

/** Vitesse de rotation d'arme commune : 330 °/s ≈ 5,76 rad/s (mesurée) */
export const SPIN = 5.76;

/** Apparence standard : dimensions et polices communes à tous */
export const DEFAULT_LOOK = {
  radius: 41, // mesuré : boule de 83 px de diamètre
  bodyHit: '#ffffff', // flash blanc à l'encaissement (observé)
  outline: '#0a0a0a',
  outlineWidth: 5,
  hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
  hpOffsetY: 12, // décalage pour centrer les chiffres
  // body, hpColor, aura, flair, trail, accent : à définir par combattant
};

/** Déplacement standard : valeurs mesurées communes */
export const DEFAULT_MOVEMENT = {
  speed: 440, // px/s (médiane observée)
  turnRate: 1.9, // rad/s
  seek: 0.42, // coefficient de pilotage vers adversaire
  mass: 1,
};

/** Arme standard : dimensions et timing mesurés */
export const DEFAULT_WEAPON = {
  spin: SPIN,
  handle: { width: 11, outline: '#0d0d12' },
  hitbox: { from: 0.42, to: 1 },
  melee: {
    cooldown: 1.05, // s entre deux touches
    knockback: 300,
    selfRecoil: 90,
  },
};

/** Traînée standard : styles courants */
export const TRAIL_POWDER = {
  type: 'powder', // poudre/givre (grains isolés)
};

export const TRAIL_ELECTRIC = {
  type: 'electric', // électricité (trait cassé)
};

/** Helper pour fusionner configuration et défaults */
export const defaults = (config, defaults_) => ({
  ...defaults_,
  ...config,
  // Merges imbriquées pour les objets
  look: { ...DEFAULT_LOOK, ...config.look },
  movement: { ...DEFAULT_MOVEMENT, ...config.movement },
  weapon: {
    ...DEFAULT_WEAPON,
    ...config.weapon,
    handle: { ...DEFAULT_WEAPON.handle, ...config.weapon?.handle },
    hitbox: { ...DEFAULT_WEAPON.hitbox, ...config.weapon?.hitbox },
    melee: { ...DEFAULT_WEAPON.melee, ...config.weapon?.melee },
  },
});

/**
 * Couleurs prédéfinies pour accélérer l'ajout de combattants
 * Format: { body, accent, hpColor (optionnel, défaut noir) }
 */
export const PALETTES = {
  dark: { body: '#870286', accent: '#a855f7', hpColor: '#0a0a0a' },
  ice: { body: '#00eff0', accent: '#06b6d4', hpColor: '#0a0a0a' },
  fire: { body: '#fb0a0a', accent: '#f2670c', hpColor: '#0a0a0a' },
  water: { body: '#0099ff', accent: '#0084d1', hpColor: '#0a0a0a' },
  light: { body: '#ffd700', accent: '#ffa500', hpColor: '#664400' },
  lightning: { body: '#ffff00', accent: '#ffaa00', hpColor: '#664400' },
  wind: { body: '#00cc88', accent: '#009966', hpColor: '#0a0a0a' },
  plant: { body: '#88cc00', accent: '#669900', hpColor: '#0a0a0a' },
  outlaw: { body: '#7b68a6', accent: '#9d84b7', hpColor: '#0a0a0a' },
  bladesman: { body: '#c4461c', accent: '#e67e22', hpColor: '#0a0a0a' },
  lancer: { body: '#7046ac', accent: '#a855f7', hpColor: '#0a0a0a' },
};

/**
 * Aura standard par thème (style visuel courant)
 * Format: { color, radius, pulse, showWhen }
 */
export const AURAS = {
  ability: (color) => ({ color, radius: 1.62, pulse: 2.4, showWhen: 'ability-ready' }),
  ultimate: (color) => ({ color, radius: 1.62, pulse: 2.0, showWhen: 'ultimate-ready' }),
};

/**
 * Traînée standard (ribbon = ligne d'arme)
 * Format: { color, width, alpha }
 */
export const RIBBONS = {
  normal: (color) => ({ color, width: 16, alpha: 0.5 }),
  thick: (color) => ({ color, width: 18, alpha: 0.6 }),
  thin: (color) => ({ color, width: 13, alpha: 0.5 }),
};

/**
 * Particules standards (motes = frémissement autour du corps)
 * Format: { rate, size, drift, rise, colors }
 */
export const MOTES = {
  subtle: (colors) => ({ rate: 9, size: 9, drift: 20, rise: 0, colors }),
  rising: (colors) => ({ rate: 9, size: 9, drift: 20, rise: 14, colors }),
  falling: (colors) => ({ rate: 13, size: 10, drift: 30, rise: -70, colors }),
};

/**
 * Impacts standards (gerbe à la touche)
 */
export const IMPACTS = {
  normal: (primary, secondary) => [secondary, primary, '#ffffff'],
};

/**
 * Flair standards (mise en scène des effets)
 */
export const FLAIRS = {
  dark: {
    ribbon: RIBBONS.normal('#a855f7'),
    motes: MOTES.subtle(['#7c3aed', '#a855f7', '#2e1065']),
    impact: IMPACTS.normal('#a855f7', '#c4b5fd'),
    shape: 'dot',
    castFlash: 'rgba(124,58,237,0.55)',
  },
  ice: {
    ribbon: RIBBONS.thick('#67e8f9'),
    motes: MOTES.rising(['#22d3ee', '#0891b2', '#67e8f9']),
    impact: IMPACTS.normal('#a5f3fc', '#0891b2'),
    shape: 'spark',
    castFlash: 'rgba(165,243,252,0.6)',
  },
  fire: {
    ribbon: RIBBONS.thick('#f97316'),
    motes: MOTES.falling(['#f97316', '#ea580c', '#dc2626']),
    impact: IMPACTS.normal('#fbbf24', '#f97316'),
    shape: 'spark',
    castFlash: 'rgba(249,115,22,0.6)',
  },
};

/**
 * Format standard pour une ligne de HUD avec stat dynamique
 * Usage: HUD_STAT('dégâts/ralent.', f => f.stacks)
 */
export const HUD_STAT = (labelFr, labelRef, getter) => ({
  stat: (f) => `${labelRef}: ${getter(f)}`,
  statFr: (f) => `${labelFr} : ${getter(f)}`,
  // color, stroke : à définir par combattant
});
