import { fiche, SPIN } from '../defaults.js';

/* ==========================================================================
 *  EAU  (WATER)
 *  Relevé : vidéo « FIRE vs WATER ».
 * ========================================================================== */
export const WATER = fiche({
  id: 'water',
  name: 'EAU',
  nameRef: 'WATER',
  tagline: 'Contrôle de terrain — des tourbillons qui aspirent et grandissent',
  taglineRef: 'Terrain control — whirlpools that pull and keep growing',
  icon: 'iconDroplet',

  look: {
    body: '#4a86f7', // pipette : rgb(67,132,255)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    hpColor: '#0a0a0a',
    aura: {
      color: 'rgba(59,130,246,0.45)',
      radius: 1.65,
      pulse: 1.6,
      showWhen: 'ultimate-ready',
    },
    flair: {
      ribbon: { color: '#60a5fa', width: 18, alpha: 0.55 },
      motes: { rate: 9, size: 9, drift: 24, rise: 22, colors: ['#2563eb', '#60a5fa', '#1d4ed8'] },
      impact: ['#93c5fd', '#ffffff', '#1d4ed8'],
      shape: 'dot',
      castFlash: 'rgba(96,165,250,0.6)',
    },
    trail: { color: 'rgba(96,165,250,0.3)', every: 0.045, life: 0.3 },
    accent: '#2563eb',
  },

  movement: { speed: 455, turnRate: 1.8, seek: 0.45 },

  weapon: {
    name: 'Trident des marées',
    nameRef: 'Tidal Trident',
    reach: 150,
    spin: SPIN,
    spinDir: 1,
    handle: { length: 102, width: 11, color: '#3f6fa8', dark: '#254365', outline: '#0b2545', gem: { at: 0.5, size: 8, color: '#93c5fd' } },
    head: { sprite: 'waterTrident', scale: 4 },
    hitbox: { from: 0.6, radius: 19 },
    melee: {
      damage: 3,
      cooldown: 1.1,
      knockback: 250,
      selfRecoil: 80,
      onHit: {
        stackGain: 1, // « Whirlpool Damage » : 1 → 7 mesuré
        stackMax: 14,
        stack2Gain: 5, // « Size » : 70 → 100 mesuré
        stack2Max: 100,
      },
    },
  },

  ability: {
    id: 'whirlpool',
    name: 'Tourbillon',
    nameRef: 'Whirlpool',
    cooldown: 6,
    cooldownStep: 0,
    cooldownFloor: 6,
    whirlpool: {
      max: 2, // deux tourbillons simultanés au plus
      life: 7.5,
      /** Rayon piloté par la stat « Size » du HUD. */
      radius: (self) => self.stacks2 * 0.9,
      pull: 60,
      tickInterval: 1.2,
      tickDamage: (self) => Math.max(1, Math.round(self.stacks * 0.6)),
      /**
       * Aspect relevé sur FIRE vs WATER : une **spirale en pixels opaque**
       * (sprite `waterWhirlpool`), pas un dégradé — disque bleu, bras bleu nuit
       * sur deux tours et demi, gros contour. Elle tourne lentement sur place.
       */
      edge: 'rgba(20,48,79,0.75)', // onde d'apparition, au ton du contour
      spin: 1.1, // rotation lente, mesurée sur la spirale de la vidéo
    },
    /** Chaque tourbillon crache des gouttes. */
    spray: { interval: 1.8, count: 1, projectile: 'droplet' },
  },

  ultimate: {
    id: 'maelstrom',
    name: 'Maelström',
    nameRef: 'MAELSTROM',
    barLabel: 'MAELSTROM',
    barLabelFr: 'MAELSTRÖM',
    barFill: '#4a86f7',
    barText: '#eff6ff',
    chargeRate: 4.2,
    chargeOnHit: 3,
    duration: 5.5,
    maelstrom: {
      radius: 200,
      pull: 170,
      tickInterval: 0.8,
      tickDamage: (self) => Math.max(2, Math.round(self.stacks)),
      spin: 1.7, // même spirale, deux fois plus grande et un peu plus vive
      edge: 'rgba(20,48,79,0.85)',
    },
  },

  projectiles: {
    droplet: {
      label: 'Goutte',
      labelRef: 'Droplet',
      sprite: 'waterDrop',
      scale: 3,
      speed: 330,
      damage: 1,
      radius: 9,
      life: 2,
      bounces: 1,
      knockback: 45,
      trail: { color: 'rgba(147,197,253,0.5)', every: 0.04, life: 0.35, dotted: true },
    },
  },

  progression: { stack: 1, stack2: 70 },

  hud: {
    stats: [
      (f) => `Whirlpool Damage: ${Math.round(f.stacks)}`,
      (f) => `Size: ${Math.round(f.stacks2)}`,
    ],
    statsFr: [
      (f) => `Dégâts du tourbillon : ${Math.round(f.stacks)}`,
      (f) => `Taille : ${Math.round(f.stacks2)}`,
    ],
    color: '#2f6fe0',
  },
});
