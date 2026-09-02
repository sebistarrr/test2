import { fiche, SPIN } from '../defaults.js';
import { formatHalf } from '../format.js';

/* ==========================================================================
 *  FOUDRE  (LIGHTNING)
 *  Relevé : vidéo « LIGHT vs LIGHTNING ».
 * ========================================================================== */
export const LIGHTNING = fiche({
  id: 'lightning',
  name: 'FOUDRE',
  nameRef: 'LIGHTNING',
  tagline: 'Zone — sème des bornes statiques et enchaîne les arcs',
  taglineRef: 'Zoner — plants static nodes and chains arcs between them',
  icon: 'iconBolt',

  look: {
    body: '#f2f003', // pipette : rgb(242,240,3)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    hpColor: '#0a0a0a',
    /**
     * Halo bleu **permanent**. Relevé sur LIGHT vs LIGHTNING : la boule jaune
     * de la Foudre porte son halo cyan du début à la fin du duel, y compris
     * quand aucune décharge n'est en cours — c'est sa signature à l'écran.
     */
    aura: {
      color: 'rgba(56,189,248,0.55)',
      radius: 2.4,
      pulse: 0.7, // respiration lente : sur la vidéo le halo ne clignote pas
      showWhen: 'always',
    },
    flair: {
      ribbon: { color: '#7dd3fc', width: 16, alpha: 0.65 },
      motes: { rate: 12, size: 8, drift: 40, rise: -10, colors: ['#38bdf8', '#0284c7', '#f5e60a'] },
      impact: ['#67e8f9', '#f5e60a', '#ffffff'],
      shape: 'streak',
      castFlash: 'rgba(103,232,249,0.65)',
    },
    trail: { color: 'rgba(125,211,252,0.28)', every: 0.045, life: 0.24 },
    accent: '#38bdf8',
  },

  movement: { speed: 500, turnRate: 2, seek: 0.42 },

  weapon: {
    name: 'Lame fulgurante',
    nameRef: 'Storm Blade',
    reach: 145,
    spin: SPIN,
    spinDir: -1,
    /** Long manche de **bois brun** au contour noir en pointillé (mesuré). */
    handle: { length: 88, width: 10, color: '#7a5c30', dark: '#48371c', outline: '#0f0a04', gem: null },
    /** mesuré : fer de lance de 56 × 36 px au bout du manche. */
    head: { sprite: 'boltBlade', scale: 4 },
    hitbox: { from: 0.52, radius: 17 },
    melee: {
      damage: 3,
      cooldown: 1,
      knockback: 230,
      selfRecoil: 80,
      onHit: {
        stackGain: 0.5, // « Chain Damage » : 1 → 4,5 mesuré
        stackMax: 14,
        /** Chaque touche plante une borne à l'impact (observé). */
        dropNode: true,
      },
    },
  },

  ability: {
    id: 'staticNode',
    name: 'Borne statique',
    nameRef: 'Static Node',
    cooldown: 3,
    cooldownStep: 0,
    cooldownFloor: 3,
    node: {
      max: 8, // au-delà, la plus ancienne disparaît
      life: 16,
      sprite: 'teslaNode',
      /** mesuré : petite bobine de 34 × 34 px (13 cellules × 2,6). */
      scale: 2.6,
    },
    chain: {
      interval: 1.6, // cadence des décharges hors ultime
      range: 270, // portée borne → cible
      color: 'rgba(103,232,249,0.95)',
      glow: 'rgba(56,189,248,0.45)',
      width: 5,
      jitter: 14,
      /**
       * Rémanence de l'arc à l'écran. Relevé sur LIGHT vs LIGHTNING : la toile
       * cyan reste lisible ~0,45 s après chaque décharge — c'est ce qui rend le
       * réseau de bornes visible en permanence pendant la Surcharge.
       */
      life: 0.45,
      slow: 0.18,
      slowDuration: 0.8,
    },
  },

  ultimate: {
    id: 'supercharge',
    name: 'Surcharge',
    nameRef: 'SUPERCHARGE',
    barLabel: 'SUPERCHARGE',
    barLabelFr: 'SURCHARGE',
    barFill: '#f5e60a',
    barText: '#3a2c05',
    chargeRate: 5.2,
    chargeOnHit: 2,
    duration: 5,
    chainInterval: 0.5, // le réseau crépite en continu
    rangeBonus: 1.5,
    speedBonus: 1.15,
  },

  projectiles: {},

  progression: { stack: 1, stack2: 0 },

  hud: {
    stats: [(f) => `Chain Damage: ${formatHalf(f.stacks)}`],
    statsFr: [(f) => `Dégâts de chaîne : ${formatHalf(f.stacks)}`],
    color: '#d4c800',
  },
});
