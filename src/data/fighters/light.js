import { fiche, SPIN } from '../defaults.js';

/* ==========================================================================
 *  LUMIÈRE  (LIGHT)
 *  Relevé : vidéos « LIGHT vs FIRE », « LIGHT vs DARK », « LIGHT vs LIGHTNING ».
 * ========================================================================== */
export const LIGHT = fiche({
  id: 'light',
  name: 'LUMIÈRE',
  nameRef: 'LIGHT',
  tagline: 'Forteresse — bouclier qui riposte et marteau qui projette',
  taglineRef: 'Fortress — a shield that strikes back and a hammer that throws',
  icon: 'iconShield',

  look: {
    body: '#fbf7a3', // pipette : rgb(252,251,168)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    hpColor: '#0a0a0a',
    /**
     * Halo doré. Relevé sur LIGHT vs LIGHTNING : dès que le Piège radiant est
     * chargé, **c'est la Lumière elle-même** qui s'entoure d'un grand halo d'or
     * — et il reste allumé pendant tout le trait. La cible, elle, n'est pas
     * teintée.
     */
    aura: {
      color: 'rgba(253,224,71,0.62)',
      radius: 2.3,
      pulse: 1.2,
      showWhen: 'ultimate-ready',
    },
    /**
     * L'Égide ne se voit pas comme une bulle grise sur la vidéo : elle se lit
     * sur le **liseré doré** de la boule, qui s'épaissit avec le pool.
     */
    shield: { color: 'rgba(253,224,71,0.6)', glow: 'rgba(250,204,21,0.12)' },
    flair: {
      ribbon: { color: '#fde047', width: 19, alpha: 0.6 },
      motes: { rate: 10, size: 9, drift: 22, rise: -20, colors: ['#eab308', '#facc15', '#ca8a04'] },
      impact: ['#fef9c3', '#fde047', '#ffffff'],
      shape: 'streak',
      castFlash: 'rgba(253,224,71,0.7)',
    },
    trail: { color: 'rgba(250,220,60,0.25)', every: 0.05, life: 0.26 },
    accent: '#eab308',
  },

  // marteau lourd : la Lumière est le combattant le plus lent du roster
  movement: { speed: 415, turnRate: 1.6, seek: 0.46 },

  weapon: {
    name: 'Marteau d’aube',
    nameRef: 'Dawn Hammer',
    reach: 155, // mesuré : ~159 px
    spin: SPIN,
    spinDir: 1,
    /** Hampe d'acier courte : ~31 px visibles au-delà de la boule (mesuré). */
    handle: {
      length: 78,
      width: 11,
      color: '#8b8b8b',
      dark: '#4f4f4f',
      outline: '#0a0a0a',
      gem: { at: 0.62, size: 9, color: '#f5d020' },
    },
    /** mesuré : tête de 63 × 57 px, plus large que haute, gros contour noir. */
    head: { sprite: 'lightHammerHead', scale: 5.7 },
    hitbox: { from: 0.58, radius: 22 },
    melee: {
      /**
       * **Les dégâts du marteau SONT la stat « Shield Damage ».**
       * Vérifié image par image : à `Shield Damage: 3` la cible perd 3 PV,
       * à 4-5 elle en perd 5. La Lumière commence donc à 1 dégât par coup et
       * ne devient dangereuse qu'après avoir encaissé.
       */
      damage: (self) => Math.max(1, Math.round(self.stacks)),
      cooldown: 1.5, // arme lourde : la cadence la plus lente du roster
      /** Le recul suit la stat « Knockback » du HUD (1500 → 5400 mesuré). */
      knockback: (self) => 210 + self.stacks2 * 0.05,
      selfRecoil: 60,
      // aucune progression ici : les deux stats montent quand la Lumière
      // ENCAISSE, pas quand elle frappe (voir ability.shield ci-dessous)
    },
  },

  /**
   * Égide — bouclier **permanent et passif** : il absorbe, riposte, et
   * surtout **convertit ce qu'il encaisse en puissance**.
   *
   * Mesuré : la Lumière reste à 100 PV pendant 11 s sous les coups, et à
   * chaque coup encaissé ses deux compteurs montent d'un cran (+1 dégât,
   * +300 de recul) pendant que l'attaquant perd 1 PV. Aucune onde de choc
   * périodique n'apparaît dans les vidéos : l'Égide n'a pas d'incantation.
   */
  ability: {
    id: 'aegis',
    name: 'Égide',
    nameRef: 'Aegis',
    /** Rythme de rechargement du pool (le « sort » ne fait que le remplir). */
    cooldown: 9,
    cooldownStep: 0,
    cooldownFloor: 9,
    shield: {
      /** Capacité = base + « Shield Damage » : le bouclier grossit avec la stat. */
      capacity: (self) => 9 + self.stacks * 0.4,
      /** Régénération après un répit sans encaisser. */
      regen: 2,
      regenDelay: 2.4,
      /** Riposte fixe : 1 PV rendu à l'attaquant (mesuré). */
      reflect: 1,
      reflectCooldown: 0.35,
      /**
       * Gain par coup encaissé — mesuré : +1 et +300, y compris quand une
       * partie des dégâts passe. Seuls les coups **francs** comptent : les
       * dégâts de zone ou sur la durée (blizzard, brûlure) ne font pas monter
       * les compteurs, ce qui a été vérifié pendant un blizzard de 30 PV.
       */
      gainOnHit: { stack: 1, stackMax: 14, stack2: 300, stack2Max: 5400 },
      /**
       * Plafonds **mesurés** : la stat culmine à 14 et le recul à 5400
       * (= 1500 + 13 × 300) sur le duel le plus long. Un court délai de
       * conversion évite qu'une rafale de coups fasse exploser le compteur,
       * qui monte d'environ un cran toutes les trois secondes sur les vidéos.
       */
      gainCooldown: 1.5,
      countedKinds: ['melee', 'projectile', 'bulb', 'chain'],
    },
  },

  ultimate: {
    id: 'radiantSnare',
    name: 'Piège radiant',
    nameRef: 'RADIANT SNARE',
    barLabel: 'RADIANT SNARE',
    barLabelFr: 'PIÈGE RADIANT',
    barFill: '#f2e04a',
    barText: '#3f3000',
    chargeRate: 3.2,
    chargeOnHit: 3,
    duration: 5,
    snare: {
      color: '#f7d34a',
      glow: 'rgba(250,220,60,0.55)',
      width: 7,
      gap: 5, // double trait doré (observé)
      /**
       * **La cible n'est pas teintée.** Au zoom sur LIGHT vs LIGHTNING, la
       * Foudre piégée garde son jaune saturé et son halo bleu : c'est la
       * Lumière qui s'allume (voir `look.aura`). Le trait doré est le seul
       * effet posé sur l'adversaire.
       */
      tint: null,
      tintAlpha: 0,
      slow: 0.55,
      /** Drain mesuré : 1 PV par seconde, pas davantage. */
      tickInterval: 1,
      tickDamage: 1,
      /** Le piège tire la cible vers la Lumière. */
      pull: 90,
    },
  },

  projectiles: {},

  progression: { stack: 1, stack2: 1500 },

  hud: {
    stats: [
      (f) => `Shield Damage: ${Math.round(f.stacks)}`,
      (f) => `Knockback: ${Math.round(f.stacks2)}`,
    ],
    statsFr: [
      (f) => `Dégâts du bouclier : ${Math.round(f.stacks)}`,
      (f) => `Recul : ${Math.round(f.stacks2)}`,
    ],
    color: '#d9b800',
  },
});
