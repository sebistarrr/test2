/**
 * ============================================================================
 *  FICHES D'ÉLÉMENTS — source de vérité unique
 * ============================================================================
 *
 *  Tout ce qui définit un combattant est ici : apparence, vitesse, arme,
 *  pouvoir, ultime, projectiles, HUD. Le moteur ne contient AUCUNE constante
 *  propre à un élément : il lit cette fiche.
 *
 *  Les objets sont gelés (deepFreeze) : un duel ne peut pas les modifier, donc
 *  Ombre se comporte exactement pareil au 1er et au 100e duel. Le runtime
 *  travaille sur une copie d'état (voir game/fighter.js).
 *
 *  Ajouter un élément = ajouter une entrée ici + éventuellement un module de
 *  pouvoirs dans game/abilities/. Rien d'autre à toucher.
 *
 *  Unités : px (référentiel 720x1280 de la vidéo), secondes, radians.
 *  « mesuré » = valeur relevée sur la vidéo de référence.
 *  « calé »   = valeur ajustée pour retrouver le rythme observé (~60 s de duel).
 *
 * @module data/elements
 */

import { deepFreeze } from './freeze.js';

/** Vitesse de rotation d'arme commune : 330 °/s ≈ 5,76 rad/s (mesurée). */
const SPIN = 5.76;

/* ==========================================================================
 *  OMBRE  (DARK)
 * ========================================================================== */
const SHADOW = {
  id: 'shadow',
  name: 'OMBRE',
  nameRef: 'DARK', // libellé de la vidéo de référence
  tagline: 'Assassin — se déplace par pas d’ombre et draine l’essence',
  icon: 'orbDark',

  /* ---------- APPARENCE ---------- */
  look: {
    radius: 41, // mesuré : boule de 83 px de diamètre, contour compris
    body: '#870286', // pipette : rgb(132,6,132)
    bodyHit: '#ffffff', // flash blanc à l'encaissement (observé)
    outline: '#0a0a0a',
    outlineWidth: 5,
    hpColor: '#0a0a0a',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12, // décalage de la ligne de base pour centrer les chiffres
    aura: {
      color: 'rgba(124,58,237,0.42)',
      radius: 1.62, // × rayon du corps
      pulse: 2.4, // Hz
      showWhen: 'ability-ready', // halo violet quand le Pas d’ombre est prêt
    },
    /**
     * Mise en scène (rendu seul, aucun effet sur le duel) : `ribbon` = traînée
     * de la pointe d'arme, `motes` = frémissement **collé au corps** (il
     * souligne la silhouette, il ne l'enveloppe pas), `impact` = gerbe à la
     * touche, `shape` = forme des particules.
     *
     * Le remplissage du cadre, lui, ne passe plus par des particules qui
     * flottent devant l'action : c'est la nappe de sol sous chaque combattant
     * et les ondes le long des murs qui s'en chargent (`render/flair.js`).
     */
    flair: {
      ribbon: { color: '#a855f7', width: 16, alpha: 0.5 },
      motes: { rate: 9, size: 9, drift: 26, rise: -14, colors: ['#7c3aed', '#a855f7', '#2e1065'] },
      impact: ['#a855f7', '#c4b5fd', '#ffffff'],
      shape: 'dot',
      castFlash: 'rgba(124,58,237,0.55)',
    },
    trail: {
      color: 'rgba(88,28,135,0.22)',
      every: 0.045, // s entre deux images fantômes
      life: 0.28,
    },
    accent: '#a855f7',
  },

  /* ---------- DÉPLACEMENT ---------- */
  movement: {
    speed: 440, // px/s (mesuré : 400→500 px/s hors ralentissement)
    turnRate: 1.75, // rad/s — pilotage vers l'adversaire (mesuré ~1,9)
    /** Poids du pilotage : 1 = fonce sur l'adversaire, 0 = billard pur.
     *  Calé pour retrouver le rythme de la vidéo : ~13 touches d'arme par
     *  combattant sur un duel d'une minute. */
    seek: 0.42,
    mass: 1,
  },

  /* ---------- ARME ---------- */
  weapon: {
    name: 'Lame du Néant',
    reach: 77, // mesuré : centre → pointe = 77 px
    spin: SPIN,
    spinDir: -1, // sens initial (s'inverse aux rebonds)
    handle: {
      length: 17, // partie manche, en grande partie masquée par le corps
      width: 11,
      color: '#2b2130',
      dark: '#171021',
      outline: '#0b0710',
      gem: null,
    },
    head: { sprite: 'darkBlade', scale: 3.0, anchorY: 0.5 },
    /** Portion tranchante (fraction de la portée) + demi-épaisseur. */
    hitbox: { from: 0.42, to: 1, radius: 13 },
    melee: {
      damage: 5, // calé : chutes de PV observées de ~4-5 côté Glace
      cooldown: 1.05, // s entre deux touches de la même arme
      knockback: 300,
      selfRecoil: 90,
    },
  },

  /* ---------- POUVOIR (touche active, automatique) ---------- */
  ability: {
    id: 'shadowStep',
    name: 'Pas d’ombre',
    nameRef: 'Shadow Step',
    /** Cooldown initial affiché « Shadow Step Cooldown: 3s » (mesuré). */
    cooldown: 3,
    /** Chaque utilisation raccourcit le cooldown (3 → 2,8 → 2,6 … mesuré). */
    cooldownStep: 0.2,
    cooldownFloor: 0.7, // plancher observé en fin de duel
    /** Téléportation courte dans la direction de course. */
    blink: {
      distance: 190,
      ghosts: 7, // images fantômes laissées derrière
      invulnerable: 0.25, // déduit : la fenêtre d'esquive du saut
      speedBoost: 1.5, // pendant 0,45 s après le saut
      boostDuration: 0.45,
    },
    /** Volée tirée à l'arrivée (3 traits observés dans la vidéo). */
    volley: { count: 3, spread: 0.38, projectile: 'shadowBolt' },
  },

  /* ---------- ULTIME (jauge du HUD) ---------- */
  ultimate: {
    id: 'essenceTether',
    name: 'Lien d’essence',
    nameRef: 'ESSENCE TETHER',
    barLabel: 'ESSENCE TETHER',
    barLabelFr: 'LIEN D’ESSENCE',
    barFill: '#870286',
    barText: '#f3e8ff',
    /** Charge : +chargeRate/s et +chargeOnHit par touche portée. */
    chargeRate: 5.5, // calé : ~3 incantations, pour compenser le drain plus lent
    chargeOnHit: 3,
    duration: 5.65, // mesuré deux fois : 5,66 s et 5,63 s
    dome: {
      radius: 265, // mesuré : largeur médiane stable à 209 px ×1,25
      /** Le dôme **déborde de l'arène** : dans la vidéo il recouvre le HUD. */
      clipToArena: false,
      fill: 'rgba(30,24,45,0.88)', // pipette : rgb(52,46,70) sur blanc
      edge: 'rgba(76,29,149,0.95)',
      edgeWidth: 4,
      sparks: 120, // poussière violette qui dérive dans le dôme
      sparkColors: ['#a855f7', '#c4b5fd', '#ffffff', '#6d28d9'],
      /** Le dôme est figé à l'endroit de l'incantation. */
      anchored: true,
    },
    tether: {
      color: '#7c3aed',
      core: 'rgba(255,255,255,0.55)',
      width: 5,
      /** Drain mesuré sur un dôme entier : 10 PV en 4,5 s, soit 2,2 PV/s. */
      tickInterval: 0.4,
      tickDamage: 1,
      slow: 0.15, // ralentit la cible tant que le lien tient
      motes: 26, // particules qui remontent le lien vers l'Ombre
    },
  },

  /* ---------- PROJECTILES ---------- */
  projectiles: {
    shadowBolt: {
      label: 'Trait d’ombre',
      sprite: 'darkBlade', // mini version de la lame (observé)
      scale: 2.2, // mesuré : trait d'ombre d'environ 44 px de long
      speed: 600,
      damage: 5,
      radius: 11,
      life: 1.5,
      bounces: 0,
      knockback: 70,
      trail: { color: 'rgba(59,35,80,0.35)', every: 0.05, life: 0.22 },
    },
  },

  /* ---------- LIGNE DE STAT DU HUD ---------- */
  hud: {
    /** @param {import('../game/fighter.js').Fighter} f */
    stat: (f) => `Shadow Step Cooldown: ${formatSeconds(f.ability.cooldown)}`,
    statFr: (f) => `Pas d’ombre — recharge : ${formatSeconds(f.ability.cooldown)}`,
    color: '#870286',
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  GLACE  (ICE)
 * ========================================================================== */
const ICE = {
  id: 'ice',
  name: 'GLACE',
  nameRef: 'ICE',
  tagline: 'Contrôle — empile les stacks de dégâts/ralentissement',
  icon: 'snowflake',

  look: {
    radius: 41,
    body: '#00eff0', // pipette : rgb(0,239,240)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    hpColor: '#0a0a0a',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
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
    mass: 1,
  },

  weapon: {
    name: 'Hache de givre',
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
    head: { sprite: 'iceAxeHead', scale: 3.5, anchorY: 0.5 },
    hitbox: { from: 0.62, to: 1, radius: 20 }, // seule la tête tranche
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
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  FEU  (FIRE)
 *  Relevé : vidéos « LIGHT vs FIRE » et « FIRE vs WATER ».
 * ========================================================================== */
const FIRE = {
  id: 'fire',
  name: 'FEU',
  nameRef: 'FIRE',
  tagline: 'Attrition — marque l’adversaire d’une brûlure qui s’aggrave',
  icon: 'iconFlame',

  look: {
    radius: 41,
    body: '#fb0a0a', // pipette : rgb(254,0,0)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    hpColor: '#0a0a0a',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
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

  movement: { speed: 480, turnRate: 1.95, seek: 0.42, mass: 1 },

  weapon: {
    name: 'Lame ardente',
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
    head: { sprite: 'fireBlade', scale: 4, anchorY: 0.5 },
    hitbox: { from: 0.5, to: 1, radius: 16 },
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
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  LUMIÈRE  (LIGHT)
 *  Relevé : vidéos « LIGHT vs FIRE », « LIGHT vs DARK », « LIGHT vs LIGHTNING ».
 * ========================================================================== */
const LIGHT = {
  id: 'light',
  name: 'LUMIÈRE',
  nameRef: 'LIGHT',
  tagline: 'Forteresse — bouclier qui riposte et marteau qui projette',
  icon: 'iconShield',

  look: {
    radius: 41,
    body: '#fbf7a3', // pipette : rgb(252,251,168)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    hpColor: '#0a0a0a',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
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
  movement: { speed: 415, turnRate: 1.6, seek: 0.46, mass: 1 },

  weapon: {
    name: 'Marteau d’aube',
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
    head: { sprite: 'lightHammerHead', scale: 5.7, anchorY: 0.5 },
    hitbox: { from: 0.58, to: 1, radius: 22 },
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
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  VENT  (WIND)
 *  Relevé : vidéo « WIND vs PLANT ».
 * ========================================================================== */
const WIND = {
  id: 'wind',
  name: 'VENT',
  nameRef: 'WIND',
  tagline: 'Harcèlement — le plus rapide, tornades et lames d’air',
  icon: 'iconTornado',

  look: {
    radius: 41,
    body: '#bcbf9e', // pipette : rgb(187,190,158)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    hpColor: '#0a0a0a',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
    aura: {
      color: 'rgba(214,205,170,0.55)',
      radius: 1.6,
      pulse: 2.6,
      showWhen: 'ability-ready',
    },
    flair: {
      ribbon: { color: '#d6cdaa', width: 20, alpha: 0.5 },
      motes: { rate: 11, size: 9, drift: 46, rise: -6, colors: ['#b9a878', '#8a7f5c', '#d6cdaa'] },
      impact: ['#e8dcc0', '#ffffff', '#a89b6f'],
      shape: 'streak',
      castFlash: 'rgba(232,220,192,0.6)',
    },
    trail: { color: 'rgba(207,198,168,0.3)', every: 0.035, life: 0.3 },
    accent: '#a89b6f',
  },

  // le plus rapide et le plus manœuvrant du roster (observé)
  movement: { speed: 500, turnRate: 2.2, seek: 0.4, mass: 1 },

  weapon: {
    name: 'Shuriken de bourrasque',
    reach: 105, // mesuré : ~120 px, arme collée au corps
    spin: SPIN * 1.1, // tourne plus vite que les autres (observé)
    spinDir: 1,
    /**
     * **Aucun manche.** Sur la vidéo le losange est posé à même la boule :
     * `width: 0` demande au moteur de ne rien dessiner et `length` ne sert
     * plus qu'à décoller le sprite du centre (34 px → pointe interne cachée
     * sous le corps, pointe externe à 108 px, soit la portée relevée).
     */
    handle: { length: 34, width: 0, color: '#6f6a55', dark: '#3f3b30', outline: '#201c12', gem: null },
    /** mesuré : 74 px de pointe à pointe → 17 cellules × 4,35 px. */
    head: { sprite: 'windShuriken', scale: 4.35, anchorY: 0.5 },
    hitbox: { from: 0.45, to: 1, radius: 18 },
    melee: {
      damage: 3,
      cooldown: 1, // cadence la plus rapide du roster
      knockback: 205,
      selfRecoil: 70,
      onHit: { slow: 0.12, slowDuration: 1.2 },
    },
  },

  /** Tornade : la stat monte et la recharge descend à chaque incantation. */
  ability: {
    id: 'tornado',
    name: 'Tornade',
    nameRef: 'Tornado',
    cooldown: 4, // mesuré : 4 s au départ
    /**
     * Deux mesures à concilier, toutes deux relevées automatiquement :
     *  • la **cadence réelle** des rafales passe de 4,8 s à 1,4 s en
     *    17 déclenchements → elle se raccourcit un peu à chaque incantation ;
     *  • le **couple affiché** avance par pas de +2 dégâts / −0,5 s, et sept
     *    fois seulement sur le même duel → ces pas-là suivent les rafales qui
     *    touchent (7 progressions pour 10 → 24 de dégâts, pile).
     * D'où deux décréments distincts.
     */
    cooldownStepOnCast: 0.15,
    cooldownStep: 0.5, // mesuré, apparié aux +2 dégâts, quand la rafale touche
    cooldownFloor: 0.5, // mesuré : le HUD descend jusqu'à 0,5 s
    tornado: {
      /**
       * **Rafale, pas une zone.** Détection automatique sur trois vidéos :
       * la tornade n'existe que 4 à 6 images (0,13 → 0,20 s) et son centre
       * est toujours à moins de 30 px du Vent — c'est un tourbillon qu'il
       * déclenche *autour de lui*, pas un vortex lancé sur l'adversaire.
       */
      radius: 125, // mesuré : ~120-130 px de diamètre visible
      duration: 0.2,
      knockback: 430, // la rafale projette au lieu d'aspirer
      /** « Tornado Damage » du HUD, ramené à l'échelle des PV. */
      damage: (self) => Math.max(2, Math.round(self.stacks / 2)),
      damageGain: 2, // mesuré : 10 → 24 par pas de 2
      damageMax: 24, // plafond mesuré, apparié au plancher de 0,5 s
      /**
       * Aspect relevé : un **disque flou couleur sable** composé de larges
       * pales en éventail qui rayonnent du centre, sans le moindre contour —
       * pas des cercles concentriques. Le cœur est plus dense et plus chaud.
       */
      color: 'rgba(201,190,168,0.46)', // pipette du bord : rgb(201,190,168)
      edge: 'rgba(178,168,146,0.42)', // le disque garde un bord net sur la vidéo
      core: 'rgba(168,152,124,0.6)', // pipette du cœur : rgb(168,152,124)
      blades: 9, // pales de l'éventail (comptées sur la vidéo)
    },
  },

  ultimate: {
    id: 'tempestVolley',
    name: 'Salve de tempête',
    nameRef: 'TEMPEST VOLLEY',
    barLabel: 'TEMPEST VOLLEY',
    barLabelFr: 'SALVE DE TEMPÊTE',
    barFill: '#b9b295',
    barText: '#2a2518',
    /** Cycle de jauge mesuré : ~8 à 10 s entre deux décharges. */
    chargeRate: 11,
    chargeOnHit: 2,
    /**
     * Décharge **courte et dense** : sur la vidéo, la cible perd ~16 PV en
     * une seconde et demie au moment où la jauge se vide.
     */
    duration: 1.5,
    volley: { interval: 0.3, count: 2, spread: 1.1, projectile: 'crescent' },
    speedBonus: 1.25,
  },

  projectiles: {
    crescent: {
      label: 'Lame d’air',
      sprite: 'windCrescent',
      scale: 3.6, // mesuré : croissants de 43 à 57 px selon l'orientation
      speed: 430,
      damage: 4,
      radius: 12,
      life: 2.2,
      bounces: 1,
      knockback: 80,
      trail: { color: 'rgba(207,198,168,0.4)', every: 0.04, life: 0.32 },
    },
  },

  progression: { stack: 10, stack2: 0 },

  hud: {
    stats: [
      (f) => `Tornado Damage: ${Math.round(f.stacks)}`,
      (f) => `Cooldown: ${formatSeconds(f.ability.cooldown)}`,
    ],
    statsFr: [
      (f) => `Dégâts de tornade : ${Math.round(f.stacks)}`,
      (f) => `Recharge : ${formatSeconds(f.ability.cooldown)}`,
    ],
    color: '#8a8163',
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  FOUDRE  (LIGHTNING)
 *  Relevé : vidéo « LIGHT vs LIGHTNING ».
 * ========================================================================== */
const LIGHTNING = {
  id: 'lightning',
  name: 'FOUDRE',
  nameRef: 'LIGHTNING',
  tagline: 'Zone — sème des bornes statiques et enchaîne les arcs',
  icon: 'iconBolt',

  look: {
    radius: 41,
    body: '#f2f003', // pipette : rgb(242,240,3)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    hpColor: '#0a0a0a',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
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

  movement: { speed: 500, turnRate: 2, seek: 0.42, mass: 1 },

  weapon: {
    name: 'Lame fulgurante',
    reach: 145,
    spin: SPIN,
    spinDir: -1,
    /** Long manche de **bois brun** au contour noir en pointillé (mesuré). */
    handle: { length: 88, width: 10, color: '#7a5c30', dark: '#48371c', outline: '#0f0a04', gem: null },
    /** mesuré : fer de lance de 56 × 36 px au bout du manche. */
    head: { sprite: 'boltBlade', scale: 4, anchorY: 0.5 },
    hitbox: { from: 0.52, to: 1, radius: 17 },
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
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  EAU  (WATER)
 *  Relevé : vidéo « FIRE vs WATER ».
 * ========================================================================== */
const WATER = {
  id: 'water',
  name: 'EAU',
  nameRef: 'WATER',
  tagline: 'Contrôle de terrain — des tourbillons qui aspirent et grandissent',
  icon: 'iconDroplet',

  look: {
    radius: 41,
    body: '#4a86f7', // pipette : rgb(67,132,255)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    hpColor: '#0a0a0a',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
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

  movement: { speed: 455, turnRate: 1.8, seek: 0.45, mass: 1 },

  weapon: {
    name: 'Trident des marées',
    reach: 150,
    spin: SPIN,
    spinDir: 1,
    handle: { length: 102, width: 11, color: '#3f6fa8', dark: '#254365', outline: '#0b2545', gem: { at: 0.5, size: 8, color: '#93c5fd' } },
    head: { sprite: 'waterTrident', scale: 4, anchorY: 0.5 },
    hitbox: { from: 0.6, to: 1, radius: 19 },
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
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  PLANTE  (PLANT)
 *  Relevé : vidéos « PLANT vs FIRE », « ICE vs PLANT », « DARK vs PLANT »
 *  et « WIND vs PLANT ».
 * ========================================================================== */
const PLANT = {
  id: 'plant',
  name: 'PLANTE',
  nameRef: 'PLANT',
  tagline: 'Endurance — sème des bulbes qui blessent l’un et soignent l’autre',
  icon: 'iconLeaf',

  look: {
    radius: 41,
    body: '#15c701', // pipette : rgb(21,199,1)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    hpColor: '#0a0a0a',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
    aura: {
      color: 'rgba(34,197,94,0.45)',
      radius: 1.65,
      pulse: 1.5,
      showWhen: 'ultimate-ready',
    },
    flair: {
      ribbon: { color: '#4ade80', width: 19, alpha: 0.55 },
      motes: { rate: 9, size: 10, drift: 26, rise: -18, colors: ['#16a34a', '#4ade80', '#ec4899'] },
      impact: ['#4ade80', '#bbf7d0', '#f472b6'],
      shape: 'dot',
      castFlash: 'rgba(74,222,128,0.6)',
    },
    trail: { color: 'rgba(74,222,128,0.26)', every: 0.05, life: 0.28 },
    accent: '#22c55e',
  },

  movement: { speed: 445, turnRate: 1.7, seek: 0.45, mass: 1 },

  /**
   * La liane est **courbe** : elle n'est pas un sprite mais un tracé, dessiné
   * par game/abilities/plant.js (`drawWeapon`). Le reste de la fiche décrit
   * quand même sa géométrie, dont se sert la détection de touche.
   */
  weapon: {
    name: 'Liane fouettante',
    reach: 160, // mesuré : ~164 px
    spin: SPIN,
    spinDir: 1,
    /** Pédoncule brun : ~30 px visibles au-delà de la boule (mesuré). */
    handle: { length: 73, width: 13, color: '#6a513a', dark: '#4b351f', outline: '#0a0a0a', gem: null },
    head: { sprite: null, scale: 1, anchorY: 0.5 },
    /**
     * Tracé de la liane, **rasterisé en escalier de pixels** par
     * game/abilities/plant.js : la vidéo ne montre pas une courbe lisse mais
     * une suite de blocs, exactement comme les autres armes.
     *
     * Géométrie obtenue en faisant passer un cercle par trois points relevés
     * sur la liane de la vidéo (départ, crête, extrémité droite) : centre à
     * 41 px devant le pédoncule, **rayon 46,7 px**, balayage de 207° à 358°.
     * La liane monte, passe la crête et redescend en crochet ; sa pointe tombe
     * pile sur la portée mesurée (160 px), crête 38 px au-dessus de l'axe et
     * crochet 34 px en dessous — les trois cotes de la vidéo.
     */
    vine: {
      radius: 46, // mesuré (ajustement de cercle : 46,7)
      start: 3.62, // rad (≈207°)
      sweep: 2.64, // rad (≈151°) : montée + crête + crochet
      width: 20, // épaisseur du corps au plus large (mesuré ~20 px)
      /**
       * Taille d'un « pixel » de l'escalier (mesuré ~4,2 px). Le contour doit
       * dépasser d'au moins **un bloc et quart**, sinon la quantification
       * l'avale par endroits et la liane perd son liseré noir.
       */
      block: 4,
      outlineWidth: 5.2,
      outline: '#050d04',
      body: '#3fa848', // pipette : rgb(70,161,76)
      light: '#6ec46a', // pipette : rgb(98,189,115)
      shine: '#96de84', // pipette : rgb(149,207,118)
    },
    hitbox: { from: 0.42, to: 1, radius: 22 },
    melee: {
      damage: 3,
      cooldown: 1.15,
      knockback: 235,
      selfRecoil: 80,
      onHit: {
        stackGain: 1, // « Bulb Damage/Heal » : 1 → 8 mesuré
        stackMax: 14,
      },
    },
  },

  /** Bulbes semés dans l'arène : mine pour l'adversaire, soin pour la Plante. */
  ability: {
    id: 'bulb',
    name: 'Semis',
    nameRef: 'Bulb',
    cooldown: 5,
    cooldownStep: 0,
    cooldownFloor: 5,
    bulb: {
      max: 4,
      life: 18,
      sprite: 'plantBulb',
      scale: 2.5, // mesuré : cosse de ~29 × 37 px, pattes comprises
      /** Rayon de déclenchement (pour les deux camps). */
      radius: 36,
      /**
       * Délai d'amorçage : sans lui, la Plante ramasserait son propre bulbe
       * à l'instant où elle le pose. Le temps qu'il germe, elle est repartie.
       */
      armDelay: 0.9,
      /** Une fois mûr, le bulbe tire une fleur sur l'adversaire. */
      shootInterval: 2.2,
      shootRange: 460,
      projectile: 'flower',
      /** Dégâts à l'adversaire et soin à la Plante : la stat du HUD. */
      damage: (self) => Math.max(1, Math.round(self.stacks)),
      heal: (self) => Math.max(1, Math.round(self.stacks * 0.8)),
      slow: 0.25,
      slowDuration: 1.6,
    },
  },

  ultimate: {
    id: 'flowerStorm',
    name: 'Tempête de fleurs',
    nameRef: 'FLOWER STORM',
    barLabel: 'FLOWER STORM',
    barLabelFr: 'TEMPÊTE DE FLEURS',
    barFill: '#22c55e',
    barText: '#052e16',
    chargeRate: 4,
    chargeOnHit: 3,
    duration: 5,
    storm: {
      /**
       * **Nuée de cubes roses opaques.** Relevé sur WIND vs PLANT, confirmé sur
       * DARK vs PLANT : des carrés plats parfaitement alignés sur les axes,
       * d'un rose unique (pipette rgb(248,120,184)), sans contour ni dégradé,
       * assez serrés pour masquer complètement la cible. Longueur des segments :
       * 9 à 21 px vidéo, soit 11 à 26 px de scène.
       *
       * Aucun cerceau de lianes n'apparaît sur ces vidéos : la tempête **est**
       * la nuée, à laquelle s'ajoutent quelques corolles qui volent avec elle.
       */
      petals: { rate: 60, size: 13, speed: 210, life: 1, colors: ['#f87ab8', '#f06aae', '#fb8fc4'] },
      /**
       * Amas dessiné par-dessus les particules (rendu pur, sans aléa simulé) :
       * des **grappes** de cubes, comme sur la vidéo, plus quelques fleurs.
       */
      swarm: {
        clusters: 17, // grappes qui tournent autour de la cible
        perCluster: 6, // cubes par grappe
        radius: 2.6, // portée, en rayons de la cible
        spread: 18, // dispersion d'une grappe, en px
        size: 17,
        sizeVar: 0.5,
        churn: 1.9,
        color: '#f87ab8',
        flowers: 4, // corolles emportées par la tempête
        flowerSize: 42,
      },
      root: 0.7, // la cible est quasiment clouée sur place
      tickInterval: 0.7,
      tickDamage: (self) => Math.max(1, Math.round(self.stacks / 4)),
      /** La Plante se régénère pendant sa tempête. */
      healInterval: 1,
      healAmount: 1,
    },
  },

  projectiles: {
    flower: {
      label: 'Fleur',
      sprite: 'flower',
      scale: 3.6, // mesuré : corolle de ~40 px
      speed: 340,
      damage: 2,
      radius: 12,
      life: 2.4,
      bounces: 0,
      knockback: 60,
      trail: { color: 'rgba(244,114,182,0.45)', every: 0.04, life: 0.4 },
    },
  },

  progression: { stack: 1, stack2: 0 },

  hud: {
    stats: [(f) => `Bulb Damage/Heal: ${Math.round(f.stacks)}`],
    statsFr: [(f) => `Bulbe — dégâts/soin : ${Math.round(f.stacks)}`],
    color: '#16a02c',
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/** Formatage « 3s » / « 2.4s » identique à la vidéo. */
function formatSeconds(v) {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? `${r}s` : `${r.toFixed(1)}s`;
}

/** Formatage « 4 » / « 4.5 » des stats à demi-pas. */
function formatHalf(v) {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? `${r}` : r.toFixed(1);
}

export const ELEMENTS = deepFreeze({
  shadow: SHADOW,
  ice: ICE,
  fire: FIRE,
  light: LIGHT,
  wind: WIND,
  lightning: LIGHTNING,
  water: WATER,
  plant: PLANT,
});

/** Ordre d'affichage dans l'écran de sélection. */
export const ROSTER = deepFreeze([
  'shadow',
  'ice',
  'fire',
  'water',
  'light',
  'lightning',
  'wind',
  'plant',
]);

/** @param {string} id */
export function getElement(id) {
  const el = ELEMENTS[id];
  if (!el) throw new Error(`Élément inconnu : ${id}`);
  return el;
}
