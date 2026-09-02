import { fiche, SPIN } from '../defaults.js';
import { formatHalf } from '../format.js';

/* ==========================================================================
 *  FEU  (FIRE)
 *  Relevé : vidéos « LIGHT vs FIRE » et « FIRE vs WATER ».
 * ========================================================================== */
export const FIRE = fiche({
  id: 'fire',
  name: 'FEU',
  nameRef: 'FIRE',
  tagline: 'Attrition — marque l’adversaire d’une brûlure qui s’aggrave',
  taglineRef: 'Attrition — brands the enemy with a burn that keeps growing',
  icon: 'iconFlame',

  look: {
    body: '#fb0a0a', // pipette : rgb(254,0,0)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    hpColor: '#0a0a0a',
    aura: {
      color: 'rgba(249,115,22,0.45)',
      radius: 1.7,
      pulse: 3.2,
      showWhen: 'ultimate-ready',
    },
    flair: {
      ribbon: { color: '#f97316', width: 18, alpha: 0.6 },
      motes: { rate: 13, size: 10, drift: 30, rise: -70, colors: ['#f97316', '#ea580c', '#dc2626'] },
      impact: ['#fbbf24', '#f97316', '#ffffff'],
      shape: 'spark',
      castFlash: 'rgba(249,115,22,0.6)',
    },
    trail: { color: 'rgba(249,115,22,0.28)', every: 0.05, life: 0.3 },
    accent: '#f2670c',
  },

  movement: { speed: 480, turnRate: 1.95, seek: 0.42 },

  weapon: {
    name: 'Lame ardente',
    nameRef: 'Ember Blade',
    reach: 150, // mesuré : ~166 px, ramené à l'échelle du roster
    spin: SPIN,
    spinDir: -1,
    /**
     * **Aucun manche visible.** Sur FIRE vs WATER, la garde anthracite à gemme
     * rouge est posée au ras de la boule et la flamme part directement — la
     * garde fait partie du sprite. `width: 0` demande au moteur de ne rien
     * tracer, `length` place le sprite juste au bord du corps.
     */
    handle: {
      length: 38,
      width: 0,
      color: '#3f2a20',
      dark: '#211410',
      outline: '#0a0502',
      gem: null,
    },
    /** mesuré : garde + flamme = 112 × 36 px, la pointe tombe sur la portée. */
    head: { sprite: 'fireBlade', scale: 4 },
    hitbox: { from: 0.5, radius: 16 },
    melee: {
      damage: 5,
      cooldown: 1.15,
      knockback: 240,
      selfRecoil: 85,
      onHit: {
        // « Burn Damage/Duration » monte de 0,5 par touche (1 → 5,5 mesuré)
        stackGain: 0.5,
        stackMax: 12,
        dot: {
          damage: (self) => Math.max(1, Math.round(self.stacks / 2.4)),
          interval: 1,
          duration: (self) => self.stacks, // la stat sert aussi de durée
          /**
           * La brûlure fait **les deux à la fois** : elle colore la victime
           * *et* la cercle d'orange. Au zoom sur FIRE vs WATER, la boule bleue
           * de l'Eau vire au violet (bleu + orange à 0,72) **et** porte un gros
           * anneau orange vif tout autour, pendant toute la durée.
           */
          ring: '#f97316',
          tint: { color: '#f97316', alpha: 0.72 },
        },
      },
    },
  },

  ability: {
    id: 'emberBurst',
    name: 'Gerbe de braises',
    nameRef: 'Ember Burst',
    cooldown: 3.6,
    cooldownStep: 0,
    cooldownFloor: 3.6,
    burst: { count: 3, spread: 0.55, projectile: 'ember' },
  },

  ultimate: {
    id: 'infernalRage',
    name: 'Rage infernale',
    nameRef: 'INFERNAL RAGE',
    barLabel: 'INFERNAL RAGE',
    barLabelFr: 'RAGE INFERNALE',
    barFill: '#dc2626',
    barText: '#fff1f0',
    /** Cycle de jauge mesuré : la Rage revient toutes les 25 à 27 s. */
    chargeRate: 3.8,
    chargeOnHit: 1,
    duration: 6,
    /** Nova de cubes orange à l'incantation (observée image par image). */
    nova: { count: 90, speed: 460, size: 13, life: 1.1, colors: ['#f97316', '#ea580c', '#fbbf24', '#dc2626'] },
    /** Ailes de flammes autour du corps pendant toute la durée. */
    wings: { color: '#f97316', core: '#fbbf24', span: 2.3, flap: 6 },
    /** Aura brûlante : tout adversaire trop près prend la brûlure. */
    aura: { radius: 150, tickInterval: 0.6, tickDamage: 2 },
    speedBonus: 1.2,
  },

  projectiles: {
    ember: {
      label: 'Braise',
      labelRef: 'Ember',
      sprite: 'ember',
      scale: 3,
      speed: 520,
      damage: 4,
      radius: 11,
      life: 1.3,
      bounces: 0,
      knockback: 90,
      onHit: {
        dot: { damage: 1, interval: 1, duration: 2, ring: '#f97316', tint: { color: '#f97316', alpha: 0.72 } },
      },
      trail: { color: 'rgba(249,115,22,0.45)', every: 0.03, life: 0.3 },
    },
  },

  progression: { stack: 1, stack2: 0 },

  hud: {
    stats: [(f) => `Burn Damage/Duration: ${formatHalf(f.stacks)}`],
    statsFr: [(f) => `Brûlure — dégâts/durée : ${formatHalf(f.stacks)}`],
    color: '#e11d1d',
  },
});
