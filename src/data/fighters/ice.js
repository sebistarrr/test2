import { fiche, SPIN } from '../defaults.js';

/* ==========================================================================
 *  GLACE  (ICE)
 * ========================================================================== */
export const ICE = fiche({
  id: 'ice',
  name: 'GLACE',
  nameRef: 'ICE',
  tagline: 'Contrôle — empile les stacks de dégâts/ralentissement',
  taglineRef: 'Control — stacks damage and slow with every hit',
  icon: 'snowflake',

  look: {
    body: '#00eff0', // pipette : rgb(0,239,240)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    hpColor: '#0a0a0a',
    aura: {
      color: 'rgba(34,211,238,0.42)',
      radius: 1.62,
      pulse: 2.0,
      showWhen: 'ultimate-ready', // halo cyan quand le Blizzard est chargé
    },
    flair: {
      ribbon: { color: '#67e8f9', width: 17, alpha: 0.5 },
      motes: { rate: 9, size: 9, drift: 20, rise: 14, colors: ['#22d3ee', '#0891b2', '#67e8f9'] },
      impact: ['#a5f3fc', '#ffffff', '#0891b2'],
      shape: 'spark',
      castFlash: 'rgba(165,243,252,0.6)',
    },
    trail: { color: 'rgba(125,211,252,0.28)', every: 0.05, life: 0.26 },
    accent: '#06b6d4',
  },

  movement: {
    speed: 470, // mesuré : médiane ~470 px/s hors ralentissement
    turnRate: 1.9,
    seek: 0.42,
  },

  weapon: {
    name: 'Hache de givre',
    nameRef: 'Frost Axe',
    reach: 132, // mesuré : centre → pointe de hache = 132 px
    spin: SPIN,
    spinDir: 1,
    handle: {
      length: 90, // long manche gris (mesuré : 90 px + 42 px de tête = 132)
      width: 11,
      color: '#7d838c',
      dark: '#3f444b',
      outline: '#0d0d12',
      gem: { at: 0.52, size: 8, color: '#37d7f0' }, // pierre cyan au milieu
    },
    head: { sprite: 'iceAxeHead', scale: 3.5 },
    hitbox: { from: 0.62, radius: 20 }, // seule la tête tranche
    melee: {
      /**
       * Dégâts = nombre de stacks affiché « Damage/Slow: N » (mesuré : la
       * valeur démarre à 1 et monte de 1 à chaque touche portée).
       * @param {import('../game/fighter.js').Fighter} self
       */
      damage: (self) => self.stacks,
      cooldown: 1,
      knockback: 260,
      selfRecoil: 80,
      /** Chaque touche empile un ralentissement sur la cible. */
      onHit: {
        stackGain: 1,
        slowPerStack: 0.03,
        slowMax: 0.45,
        slowDuration: 2.6,
        /** Givre visible : la victime prend un voile bleuté (observé — sur
         *  le jaune de la Lumière, cela donne le vert pâle de la vidéo). */
        tint: { color: '#7fe3ff', alpha: 0.42, duration: 2.6 },
      },
    },
  },

  /** Pouvoir passif : salve d'éclats radiale à intervalle fixe. */
  ability: {
    id: 'frostShards',
    name: 'Éclats de givre',
    nameRef: 'Frost Shards',
    cooldown: 5, // s entre deux salves hors Blizzard
    cooldownStep: 0, // pas d'accélération : c'est la stat « Damage/Slow » qui monte
    cooldownFloor: 5,
    burst: { count: 7, spread: Math.PI * 2, projectile: 'iceShard' },
    /** Pendant le Blizzard, salves plus rapides et plus fournies (observé). */
    duringUltimate: { cooldown: 1.2, count: 10 },
  },

  ultimate: {
    id: 'blizzard',
    name: 'Blizzard',
    nameRef: 'BLIZZARD',
    barLabel: 'BLIZZARD',
    barLabelFr: 'BLIZZARD',
    barFill: '#00eff0',
    barText: '#083344',
    barAnchor: 'right', // la jauge se remplit depuis la droite (observé)
    chargeRate: 5.4, // calé : Blizzard toutes les ~18 s comme dans la vidéo
    chargeOnHit: 2,
    duration: 5.2,
    shockwave: {
      // onde cyan qui dépasse largement l'arène au déclenchement (observé)
      from: 40,
      to: 900,
      time: 0.95,
      color: 'rgba(103,214,236,0.85)',
      width: 6,
    },
    field: {
      radius: 130, // mesuré : disque cyan de ~130 px autour de la Glace
      fill: 'rgba(224,247,255,0.55)',
      edge: 'rgba(103,214,236,0.75)',
      edgeWidth: 3,
      follows: true, // le champ suit la Glace
      slow: 0.35,
      tickInterval: 0.7,
      tickDamage: 1,
    },
    snow: { count: 90, fall: 46, drift: 22, color: 'rgba(186,230,253,0.9)' },
  },

  projectiles: {
    iceShard: {
      label: 'Éclat de givre',
      labelRef: 'Frost Shard',
      sprite: 'iceShard',
      scale: 2.4,
      speed: 380,
      damage: 2,
      radius: 10,
      life: 3.4,
      bounces: 2, // les éclats ricochent sur les murs (observé)
      knockback: 45,
      onHit: { slow: 0.12, slowDuration: 1.6 },
      trail: { color: 'rgba(186,230,253,0.55)', every: 0.035, life: 0.5, dotted: true },
    },
  },

  hud: {
    stat: (f) => `Damage/Slow: ${f.stacks}`,
    statFr: (f) => `Dégâts/Ralent. : ${f.stacks}`,
    color: '#00d5e6',
  },
});
