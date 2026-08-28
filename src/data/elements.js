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
  taglineRef: 'Assassin — shadow-steps into the blind spot and drains the essence',
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
    nameRef: 'Void Blade',
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
      labelRef: 'Shadow Bolt',
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
  taglineRef: 'Control — stacks damage and slow with every hit',
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
  taglineRef: 'Attrition — brands the enemy with a burn that keeps growing',
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
  taglineRef: 'Fortress — a shield that strikes back and a hammer that throws',
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
  taglineRef: 'Harasser — the fastest of all, tornadoes and blades of air',
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
    nameRef: 'Gale Shuriken',
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
      labelRef: 'Air Blade',
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
  taglineRef: 'Zoner — plants static nodes and chains arcs between them',
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
    nameRef: 'Storm Blade',
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
  taglineRef: 'Terrain control — whirlpools that pull and keep growing',
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
    nameRef: 'Tidal Trident',
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
  taglineRef: 'Endurance — sows bulbs that wound one and heal the other',
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
    nameRef: 'Lashing Vine',
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
        spread: 0.75, // dispersion d'une grappe, en px
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
      labelRef: 'Flower',
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

/* ==========================================================================
 *  HORS-LA-LOI  (OUTLAW)
 *  Relevé : vidéo « Outlaw vs Bladesman » (576x1024, 30 fps, 1159 images).
 *
 *  Ce personnage et le Bretteur viennent d'un autre jeu, dont le relevé a été
 *  pris sur une vidéo 576x1024. **Toute mesure s'y convertit en ×1,25** vers
 *  le repère 720x1280 utilisé ici : c'est exactement le rapport entre les deux
 *  vidéos de référence. Chaque valeur convertie cite la mesure d'origine.
 *
 *  Les valeurs de *rythme* (vitesse, portée d'engagement, cadence) sont en
 *  revanche `calé` : le moteur d'origine était Matter.js à pas fixe, celui-ci
 *  intègre à la main et pilote au cap. Reporter les constantes telles quelles
 *  d'un moteur à l'autre est le piège documenté du portage précédent.
 * ========================================================================== */
const OUTLAW = {
  id: 'outlaw',
  name: 'HORS-LA-LOI',
  nameRef: 'OUTLAW',
  tagline: 'Pistolero — vise, tire, recule, et affûte ses dégâts balle après balle',
  taglineRef: 'Gunslinger — aims, fires, kicks back, and sharpens every bullet',
  icon: 'iconRevolver',

  look: {
    radius: 41, // mesuré : bille de rayon 32 sur la vidéo 576 → ×1,25 = 40
    body: '#8a5934', // pipette : (138,89,52), médiane érodée titre + bille + jauge
    bodyHit: '#e4e4e6', // mesuré frames 223/224/225 : le disque touché blanchit
    outline: '#181008', // pipette : (24,13,7), contour des billes
    outlineWidth: 5,
    /** Mesuré : le chiffre de PV est crème. Sur le brun sombre c'est le seul
     *  ton lisible — le noir du reste du roster y disparaîtrait. */
    hpColor: '#f5f2ea',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
    aura: {
      color: 'rgba(232,201,138,0.45)',
      radius: 1.58,
      pulse: 2.2,
      /** Le barillet se recharge toutes les secondes : un halo branché sur le
       *  pouvoir clignoterait sans arrêt. Il annonce donc HIGH NOON. */
      showWhen: 'ultimate-ready',
    },
    flair: {
      /** Le revolver ne tourne pas (il est asservi à l'adversaire) : le ruban
       *  de pointe d'arme trace donc sa ligne de visée, pas une spirale. */
      ribbon: { color: '#c98a4b', width: 13, alpha: 0.42 },
      motes: { rate: 8, size: 8, drift: 30, rise: -8, colors: ['#8a5934', '#c98a4b', '#e8c98a'] },
      impact: ['#e8c98a', '#ffffff', '#8a5934'],
      shape: 'streak',
      castFlash: 'rgba(253,247,237,0.65)', // mesuré : l'arène vire au crème sous HIGH NOON
    },
    trail: { color: 'rgba(138,89,52,0.26)', every: 0.04, life: 0.28 },
    accent: '#d2a15e',
  },

  /** Mesuré 483 px/s (médiane de 57 segments rectilignes) → ×1,25 = 604.
   *  Calé à 455 : à 604 px/s dans cette arène le pistolero traverse le cadre
   *  plus vite qu'il ne recharge, et la matrice le fait gagner partout. */
  movement: { speed: 455, turnRate: 1.9, seek: 0.44, mass: 1 },

  weapon: {
    name: 'Revolver',
    nameRef: 'Revolver',
    /** Mesuré : pointe du canon à 97 px du centre sur la vidéo 576 → ×1,25.
     *  Elle **découle** du sprite : 37 (garde) + 34 cellules × 2,5. */
    reach: 122,
    /** **Zéro, et ce n'est pas un oubli.** Mesuré : « le canon est asservi à
     *  l'adversaire à chaque image, sans lissage ». C'est le module
     *  `abilities/outlaw.js` qui écrit `weaponAngle`, pas la rotation
     *  commune du roster. */
    spin: 0,
    spinDir: 1,
    /** Le sprite porte sa propre crosse : `width: 0` demande au moteur de ne
     *  rien dessiner, `length` ne sert plus qu'à décoller le sprite du centre
     *  (37 px, soit 4 px sous le bord de la bille). */
    handle: { length: 37, width: 0, color: '#5d3a20', dark: '#3a2413', outline: '#100b16', gem: null },
    head: { sprite: 'outlawRevolver', scale: 2.5, anchorY: 0.5 },
    /** Seul le bout du canon frappe : à bout portant, c'est un tir. */
    hitbox: { from: 0.62, to: 1, radius: 12 },
    melee: {
      /** Mesuré : la stat « Damage » part de 3,00 et monte de 0,10 par coup
       *  au but. Elle sert **à la fois** au tir et au coup à bout portant. */
      damage: (f) => Math.max(3, Math.round(f.stacks)),
      /** Calé, et c'est le verrou le plus long du roster : le canon étant
       *  asservi à l'adversaire, il est **toujours** aligné, donc ce verrou est
       *  la seule chose qui limite le coup à bout portant. À 1,5 s, le
       *  pistolero gagnait 27 duels sur 27. */
      cooldown: 3,
      knockback: 240,
      selfRecoil: 119, // mesuré : recul de 95 px/s hors ultime → ×1,25
      onHit: { stackGain: 0.1, stackMax: 8 }, // mesuré : +0,10 par coup au but
    },
  },

  /** Barillet : six coups, puis le trou du rechargement. */
  ability: {
    id: 'sixShooter',
    name: 'Barillet',
    nameRef: 'Six-Shooter',
    /** Mesuré : ~18 images entre deux décréments d'`Ammo` à 30 fps. */
    cooldown: 0.6,
    magazine: 6, // mesuré : le HUD affiche « Ammo: n/6 »
    reload: 1.4, // calé : le rechargement est le trou observé entre 0/6 et 6/6
    projectile: 'shot',
    recoil: 119, // mesuré : 95 px/s → ×1,25, appliqué à chaque tir
    /**
     * Dispersion, en radians de part et d'autre de la ligne de visée.
     *
     * **Déduit d'une mesure, pas inventé.** La vidéo montre la stat `Damage`
     * gagner 25 paliers de 0,10 en 38,6 s pour ~50 tirs : le pistolero touche
     * une fois sur deux, soit 0,65 coup/s. Sans dispersion, une visée réécrite
     * à chaque image touche **toujours** — le banc `tools/probe.mjs` donnait
     * 1,30 coup/s, exactement le double, et 27 victoires sur 27.
     *
     * 0,75 rad ramène le banc à **0,60 coup/s**, soit la précision relevée.
     * La valeur est raide : 0,72 donne 10 victoires sur 27, 0,80 en donne 9,
     * 0,75 en donne 15. Elle se règle au banc, pas à l'estime.
     */
    spread: 0.75,
  },

  ultimate: {
    id: 'highNoon',
    name: 'Plein soleil',
    nameRef: 'HIGH NOON',
    barLabel: 'HIGH NOON',
    barLabelFr: 'PLEIN SOLEIL',
    barFill: '#8a5934',
    barText: '#fdf7ed',
    /** Mesuré : charge linéaire de 1,13 px/image sur 238 px utiles → 7,0 s.
     *  C'est une **horloge pure** : la jauge gauche ne réagit pas aux coups. */
    chargeRate: 100 / 7,
    chargeOnHit: 0,
    duration: 6.2, // mesuré : la jauge se vide à 1,28 px/image → 6,2 s
    fireRateBonus: 2, // mesuré : la cadence de tir double
    speedBonus: 1.22, // mesuré : les deux camps gagnent ~22 % pendant HIGH NOON
    /** Mesuré : 790 px/s de recul par coup → ×1,25. Pic relevé à l'image
     *  1011 : 1 380 px/s, chaque coup de la rafale le propulse violemment. */
    recoil: 988,
    /** L'arène de la vidéo vire au crème sous HIGH NOON. Ici le décor est
     *  rasterisé une fois et ne bouge jamais (cahier des charges) : la lumière
     *  se pose donc **au sol, sous le pistolero** (voir abilities/outlaw.js). */
    glow: { radius: 250, color: 'rgba(253,247,237,0.34)', edge: 'rgba(232,201,138,0.5)' },
  },

  projectiles: {
    shot: {
      label: 'Balle',
      labelRef: 'Bullet',
      sprite: 'outlawShot',
      scale: 3.2,
      /** Calé : à 30 fps la vidéo ne montre que le sillage, jamais la balle.
       *  720 px/s laisse à l'adversaire de quoi sortir de la ligne de tir —
       *  c'est l'autre moitié de la précision relevée, avec la dispersion. */
      speed: 720,
      /** Mêmes dégâts que le coup à bout portant : c'est la même stat. */
      damage: (f) => Math.max(3, Math.round(f.stacks)),
      radius: 8, // calé avec la dispersion et la vitesse, pour 0,60 coup/s au banc
      life: 1.4,
      bounces: 0,
      knockback: 45,
      /** Mesuré frame 300 : un trait **pâle** de 2 px, (213,182,153) à
       *  (236,206,177) — pas un rond sombre. */
      trail: { color: 'rgba(206,174,142,0.55)', every: 0.03, life: 0.2, dotted: true },
      onHit: { stackGain: 0.1, stackMax: 8 }, // mesuré : +0,10 par balle AU BUT
    },
  },

  /** Mesuré : « Damage: 3.00 » et « Ammo: 6/6 » sur la première image. */
  progression: { stack: 3, stack2: 6 },

  hud: {
    stats: [
      (f) => `Damage: ${formatHalf(f.stacks)}`,
      (f) => `Ammo: ${Math.round(f.stacks2)}/6`,
    ],
    statsFr: [
      (f) => `Dégâts : ${formatHalf(f.stacks)}`,
      (f) => `Balles : ${Math.round(f.stacks2)}/6`,
    ],
    color: '#8a5934',
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  BRETTEUR  (BLADESMAN)
 *  Relevé : même vidéo. Voir l'en-tête du Hors-la-loi pour la conversion
 *  ×1,25 et pour ce qui est reporté tel quel ou recalé.
 * ========================================================================== */
const BLADESMAN = {
  id: 'bladesman',
  name: 'BRETTEUR',
  nameRef: 'BLADESMAN',
  tagline: 'Duelliste — sa lame accélère jusqu’à la surchauffe, puis fond sur sa cible',
  taglineRef: 'Duellist — his blade winds up to overheat, then rushes his target',
  icon: 'iconSabre',

  look: {
    radius: 41, // mesuré : rayon 32 sur la vidéo 576 → ×1,25 = 40
    body: '#dcc462', // pipette : (220,196,98)
    bodyHit: '#e4e4e6', // mesuré : le disque touché blanchit une image entière
    outline: '#181008', // pipette : (24,13,7)
    outlineWidth: 5,
    /** **Écart assumé au relevé.** La vidéo écrit les PV en crème `#F5F2EA`
     *  avec un contour sombre ; ce moteur ne pose aucun contour sur le
     *  chiffre, et le crème sur l'or clair devient illisible. */
    hpColor: '#2a2007',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
    aura: { color: 'rgba(172,226,22,0.42)', radius: 1.6, pulse: 2.8, showWhen: 'ultimate-ready' },
    flair: {
      /** **C'est l'éventail vert.** Mesuré frame 643 : le cœur rend
       *  (211,219,109) sur l'arène crème, soit `#B1C404` posé à 55 %. Ici il
       *  est rendu par le ruban de pointe d'arme, qui est exactement le
       *  secteur balayé par la lame. */
      ribbon: { color: '#b1c404', width: 26, alpha: 0.55 },
      motes: { rate: 7, size: 8, drift: 34, rise: -10, colors: ['#b1c404', '#dcc462', '#8d7b62'] },
      impact: ['#dcc462', '#ffffff', '#b1c404'],
      shape: 'streak',
      castFlash: 'rgba(172,226,22,0.7)', // mesuré : l'éventail vire au vert fluo sous BLADE RUSH
    },
    trail: { color: 'rgba(220,196,98,0.3)', every: 0.035, life: 0.3 },
    accent: '#b1c404',
  },

  /** Mesuré 605 px/s (médiane de 49 segments rectilignes) → ×1,25 = 756.
   *  Calé à 560 : c'est le combattant le plus rapide du roster, ce que dit le
   *  relevé, sans aller jusqu'aux 756 px/s qu'une lame de 152 px de portée
   *  rendrait intenable. À 470 il tombait à 9 victoires sur 27. */
  movement: { speed: 560, turnRate: 1.7, seek: 0.5, mass: 1 },

  weapon: {
    name: 'Sabre dentelé',
    nameRef: 'Serrated Sabre',
    /** Mesuré : garde à r 36–45, lame à r 45–122 sur la vidéo 576 → ×1,25 :
     *  garde à 45–56, pointe à 152. La portée **découle** du sprite —
     *  45 (garde) + 40 cellules × 2,68 — pour que hitbox et dessin ne
     *  puissent pas diverger quand on retouche la carte. */
    reach: 152,
    /** Mesuré : **plancher** de la courbe de rotation, 0,80 tour/s → 5,03 rad/s.
     *  Tout ce qui dépasse est ajouté par `abilities/bladesman.js` : la fiche
     *  décrit le plancher, le module décrit le cycle. */
    spin: 5.03,
    spinDir: 1,
    /** La garde est déjà dans le sprite ; `length` la pose à r 45, soit 4 px
     *  au-delà du bord de la bille, comme sur la vidéo. */
    handle: { length: 45, width: 0, color: '#8d7b62', dark: '#5c4f3c', outline: '#171009', gem: null },
    head: { sprite: 'bladesmanSabre', scale: 2.68, anchorY: 0.5 },
    /** La garde ne coupe pas : le tranchant commence après elle. */
    hitbox: { from: 0.42, to: 1, radius: 17 },
    melee: {
      /** Mesuré, **exact et sans exception** : `damage = 2,00 × Spin Speed`.
       *  La valeur n'est jamais stockée, elle est dérivée de la pile. */
      damage: (f) => Math.max(2, Math.round(f.stacks * 2)),
      cooldown: 1, // mesuré : verrou de 1 000 ms entre deux touches
      knockback: 250,
      selfRecoil: 85,
      /** Mesuré : sauts discrets de +0,15 sur la courbe de rotation, un par
       *  coup d'épée porté, et jamais au-delà du plafond de 3,00. */
      onHit: { stackGain: 0.15, stackMax: 3 },
    },
  },

  /** Surchauffe : la lame monte au plafond, y tient un palier, puis lâche. */
  ability: {
    id: 'overheat',
    name: 'Surchauffe',
    nameRef: 'Overheat',
    /** Mesuré : une fois à 3,00 tours/s, palier d'environ 55 images à 30 fps.
     *  Ce qui déclenche l'effondrement n'est **pas** identifiable sur la
     *  vidéo — il ne coïncide ni avec BLADE RUSH ni avec HIGH NOON. Le modèle
     *  de surchauffe reproduit la courbe : c'est un `calé`, pas un `mesuré`. */
    cooldown: 1.8,
    spin: {
      floor: 0.8, // mesuré : plancher jamais franchi
      ceiling: 3, // mesuré : plafond jamais franchi
      rise: 0.21, // mesuré : montée passive de +0,07 toutes les 10 images
      collapse: 3, // mesuré : effondrement à −1,00 toutes les 10 images
    },
  },

  ultimate: {
    id: 'bladeRush',
    name: 'Ruée de lame',
    nameRef: 'BLADE RUSH',
    barLabel: 'BLADE RUSH',
    barLabelFr: 'RUÉE DE LAME',
    barFill: '#dcc462',
    barText: '#2a2007',
    /** Mesuré : cycles de 273, 214 et 333 images — donc **pas une simple
     *  horloge**. Modèle retenu : horloge de 9 s + 6 % par coup d'épée. */
    chargeRate: 100 / 9,
    chargeOnHit: 6,
    duration: 1.5, // mesuré : la ruée dure 1,5 s, minutée
    /** Mesuré : 939 px/s pendant la ruée contre 605 en croisière, soit ×1,55. */
    speedBonus: 1.55,
    /** Mesuré : le verrou entre deux touches tombe de 1 000 ms à 115 ms. */
    hitLock: 0.115,
    /** Calé : au-delà de cette distance la lame fonce, en deçà elle **orbite**.
     *  Foncer droit dessus ne marche pas — à pleine vitesse la zone utile est
     *  franchie en une centaine de millisecondes, et au banc d'origine la lame
     *  n'y était alignée que 15 images sur 149, pour un seul coup porté. */
    orbit: 120,
    /** Mesuré frame 643 : l'aire verte passe de ~3 500 px² à 18 488 px² au
     *  pic, un facteur 5,3 — l'éventail **s'ouvre**, il ne fait pas que
     *  changer de teinte. Ouverture bornée en **angle** (1,6 rad → 3,0 rad),
     *  jamais en nombre d'images : un compteur d'images donne trois tours
     *  complets de vert. Déjà fait, déjà corrigé. */
    fan: { normal: 1.6, rush: 3, color: 'rgba(172,226,22,0.72)' },
  },

  /** Le Bretteur n'a aucun projectile : tout passe par la lame. */
  projectiles: {},

  /** Mesuré : la courbe de rotation démarre au plancher, 0,80 tour/s. */
  progression: { stack: 0.8, stack2: 0 },

  hud: {
    stats: [
      (f) => `Spin Speed: ${formatHalf(f.stacks)}`,
      /** Dérivé de la pile, **jamais stocké** : deux valeurs séparées
       *  finissent toujours par diverger. */
      (f) => `Damage: ${formatHalf(f.stacks * 2)}`,
    ],
    statsFr: [
      (f) => `Rotation : ${formatHalf(f.stacks)} tr/s`,
      (f) => `Dégâts : ${formatHalf(f.stacks * 2)}`,
    ],
    color: '#a8912f',
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

/* ==========================================================================
 *  DRAGOON — Lancier  (invité)
 *
 *  Troisième combattant venu de la chaîne « ballthingsim », relevé sur
 *  « Dragoon vs Outlaw » (576 × 1024, 33,6 s) — la vidéo dont le Hors-la-loi
 *  est déjà tiré, vue depuis l'autre camp. Toutes les cotes `mesuré`
 *  ci-dessous sortent de cette vidéo, converties ×1,25 vers le repère
 *  720 × 1280.
 * ========================================================================== */
const DRAGOON = {
  id: 'dragoon',
  name: 'DRAGOON',
  nameRef: 'DRAGOON',
  tagline: 'Lancier — frappe de plus en plus fort, et tombe du ciel',
  taglineRef: 'Lancer — hits harder with every strike, and falls from the sky',
  icon: 'iconLance',

  look: {
    radius: 41, // mesuré : bille de rayon 33 sur la vidéo 576 → ×1,25 = 41
    body: '#574a84', // pipette : (87,74,132), médiane érodée titre + bille + jauge
    bodyHit: '#e4e4e6', // mesuré : le disque touché blanchit, comme les deux autres invités
    outline: '#181008',
    outlineWidth: 5,
    /** Mesuré : PV en blanc cerné de noir. Ce moteur ne cerne pas le chiffre ;
     *  sur l'indigo sombre, seul un ton clair reste lisible. */
    hpColor: '#f5f2ea',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
    aura: {
      color: 'rgba(87,74,132,0.5)',
      radius: 1.66,
      pulse: 2.2,
      showWhen: 'ultimate-ready', // halo indigo quand le Bond est chargé
    },
    /**
     * La traînée du Dragoon est la signature la plus visible de sa vidéo : un
     * **fuseau cramoisi** derrière la bille indigo, mesuré `#a32b4a` au cœur et
     * `#df8692` sur les bords. C'est le seul rouge de sa palette, et il est
     * rendu ici par le ruban de pointe d'arme.
     */
    flair: {
      /** Les boucles roses qui entourent la lance : c'est la **pointe d'arme**
       *  qui les trace en tournant. Mesuré `#c2385a`. */
      ribbon: { color: '#c2385a', width: 18, alpha: 0.55 },
      /** Le fuseau **derrière la bille**, l'autre moitié de sa signature, et
       *  ce que le premier portage avait oublié : le ruban ne suit que la
       *  pointe d'arme. Seul combattant du roster à en porter un. Mesuré
       *  `#a32b4a` au cœur, large au ras du corps et effilé vers l'arrière. */
      smear: { color: '#a32b4a', width: 46, alpha: 0.42 },
      motes: { rate: 10, size: 9, drift: 24, rise: -18, colors: ['#574a84', '#a32b4a', '#cfc2f0'] },
      impact: ['#cfc2f0', '#ffffff', '#a32b4a'],
      shape: 'spark',
      castFlash: 'rgba(207,194,240,0.6)',
    },
    trail: { color: 'rgba(163,43,74,0.30)', every: 0.04, life: 0.32 },
    accent: '#c2385a',
  },

  /** Mesuré 432 px/s (médiane de 37 segments rectilignes, bille isolée par
   *  érosion pour ne pas suivre la lance) → ×1,25 = 540. **Gardé tel quel**,
   *  contrairement au Hors-la-loi et au Bretteur qui ont dû être ralentis :
   *  vérifié au banc, le Dragoon fait 15 victoires sur 30 à 540 px/s contre 16
   *  à 470 — sa vitesse n'est pas ce qui le rend fort, c'est sa portée et ses
   *  dégâts. Aucune raison de toucher un `mesuré` qui ne casse rien.
   *  C'est le combattant le plus rapide du roster après le Bretteur. */
  movement: { speed: 540, turnRate: 1.85, seek: 0.4, mass: 1 },

  weapon: {
    name: 'Lance de dragon',
    nameRef: 'Dragon Lance',
    /** Mesuré : centre → pointe = 131 px sur la vidéo 576 → ×1,25 = 164.
     *  **La plus longue portée du roster.** Elle découle du sprite :
     *  −52 (talon) + 54 cellules × 4 = 164, pour que hitbox et dessin ne
     *  puissent pas diverger quand on retouche la carte. */
    reach: 164,
    spin: SPIN, // mesuré : 327 °/s sur la première seconde, soit le SPIN commun
    spinDir: 1,
    /** `width: 0` : rien à tracer, toute la lance tient dans `dragoonLance`.
     *  `length` est **négatif** parce que le talon dépasse derrière le pivot
     *  (**42 px** remesurés en aplatissant la lance, arrondis à 44 pour tomber
     *  sur la grille du sprite) — le blit démarre donc en arrière de la bille,
     *  ce que ne fait aucune autre arme du roster. */
    handle: { length: -44, width: 0, color: '#2f2636', dark: '#17111f', outline: '#0d0a14', gem: null },
    head: { sprite: 'dragoonLance', scale: 4, anchorY: 0.5 }, // −44 + 52 × 4 = 164
    /** Seule la lame tranche : elle commence à 52 px du centre (fraction 0,32),
     *  le talon et le manche ne comptent pas. Rayon volontairement fin — une
     *  arme aussi longue touche sans arrêt avec un gros rayon. */
    hitbox: { from: 0.32, to: 1, radius: 12 },
    melee: {
      /** Mesuré : la stat « Damage » part de 10,00 et monte de 2,00 par touche
       *  portée — 10 → 12 → 14 → 16 → 18 → 20 sur la vidéo, avec des chutes de
       *  PV de l'Outlaw exactement égales (100 → 90 → 78 → 64 → 48 → 30).
       *  Six touches ont suffi. Aucun plafond n'est visible sur 33,6 s. */
      damage: (f) => Math.max(10, Math.round(f.stacks)),
      /**
       * **Calé, et c'est le seul écart au relevé qui subsiste.** Sur la vidéo
       * les touches de lance tombent à 13,63 / 14,77 / 16,37 s : le verrou réel
       * est donc d'environ **1,1 s**, comme le reste du roster. Mais à 1 s, la
       * lance de 164 px accroche ici **0,34 fois par seconde** là où la vidéo
       * en compte 0,181 — deux fois trop.
       *
       * Le verrou est ce qui restitue les deux chiffres que la vidéo *montre* :
       * à 6 s il donne 0,195 coup/s et 2,55 PV/s, contre 0,181 et 2,54 relevés.
       * Ce que la vidéo montre est donc exact ; seul le mécanisme diffère — un
       * verrou long ici, des coups manqués là-bas. Même arbitrage que pour les
       * vitesses des deux autres invités : « recaler l'équilibrage après tout
       * changement de moteur, jamais reporter les constantes telles quelles ».
       */
      cooldown: 6,
      knockback: 300,
      selfRecoil: 95,
      /**
       * Mesuré : **+2,00 par touche portée**, relevé au PV près. La stat passe
       * 10 → 12 → 14 → 16 → 18 → 20 aux instants 12,53 / 13,63 / 14,77 /
       * 16,37 / 21,00 s, et l'Outlaw descend de 100 à 30 PV : 10+12+14+16+18
       * = 70, exactement les cinq touches placées.
       *
       * Le plafond, lui, est **déduit** : la vidéo n'en montre aucun, mais elle
       * s'arrête à 20 parce que le Dragoon meurt, pas parce que la stat bute —
       * et *tous* les combattants à stat croissante du roster en ont un
       * (Araignée 14, Serpent 14, Hors-la-loi 8, Bretteur 3). Sans plafond la
       * montée est quadratique en durée de duel. À 16, le budget de dégâts
       * tombe pile sur celui de la vidéo : 2,55 PV/s contre 2,54.
       */
      onHit: { stackGain: 2, stackMax: 14 },
    },
  },

  /**
   * Le Dragoon n'a **aucun pouvoir actif** dans la vidéo : sa seule ligne de
   * stat est « Damage », et elle ne bouge qu'aux touches. La montée en dégâts
   * *est* son pouvoir ; elle est décrite dans `weapon.melee.onHit`.
   * Ce cooldown n'est jamais consommé (le module n'arme aucune minuterie),
   * mais la fiche doit en porter un : le moteur le lit à la construction.
   */
  ability: {
    id: 'lancersFury',
    name: 'Furie du lancier',
    nameRef: 'Lancer’s Fury',
    cooldown: Infinity,
    cooldownStep: 0,
    cooldownFloor: Infinity,
  },

  ultimate: {
    id: 'jump',
    name: 'Bond',
    nameRef: 'JUMP',
    barLabel: 'JUMP',
    barLabelFr: 'BOND',
    barFill: '#594984', // pipette : remplissage de la jauge
    barText: '#ffffff',
    /** Mesuré : +0,10 de remplissage par seconde, donc jauge pleine en ~10 s. */
    chargeRate: 10,
    /** Mesuré : marches de ~8 % à chaque touche portée. */
    chargeOnHit: 8,
    /**
     * Durée totale pendant laquelle la jauge reste vide et le Bond occupe le
     * Dragoon : 0,45 s d'élan puis 1,5 s hors de l'arène. Chronométré deux
     * fois : jauge vidée à 10,60 s / décollage 11,02 s / retour 12,53 s, puis
     * 19,03 / 19,50 / 21,00.
     */
    duration: 1.95,
    windup: 0.45, // mesuré : 0,42 s et 0,47 s entre la vidange et le décollage
    flight: 1.5, // mesuré : 1,51 s et 1,50 s d'absence
    /**
     * Marqueur au sol : un disque gris qui **suit l'adversaire** pendant tout
     * le vol. Il enfle pendant la montée puis se resserre jusqu'au corps —
     * c'est ce resserrement qui annonce l'impact (mesuré : ~100 px de rayon à
     * mi-vol, ~55 px juste avant la chute).
     */
    marker: {
      grow: 2.5, // × rayon de la bille, au sommet du bond
      land: 1.35, // × rayon de la bille, à l'instant de la chute
      fill: 'rgba(120,116,124,0.30)',
      edge: 'rgba(90,86,96,0.55)',
      edgeWidth: 3,
    },
    /**
     * Chute. Les dégâts sont ceux de la lance au moment de l'impact : sur la
     * vidéo l'Outlaw passe de 100 à 90 PV alors que le HUD affiche
     * « Damage: 10.00 », et la stat monte ensuite comme après une touche.
     */
    impact: {
      radius: 110, // mesuré : disque rose de ~106 px
      knockback: 520,
      ring: { to: 225, time: 0.35, color: 'rgba(150,146,156,0.8)', width: 6 }, // mesuré
      flash: 'rgba(255,255,255,0.55)', // l'arène blanchit d'un coup à la chute
      shake: 14,
      sparks: 34,
    },
  },

  /** Le Dragoon n'a aucun projectile : tout passe par la lance et le Bond. */
  projectiles: {},

  /** Mesuré : « Damage: 10.00 » à la première image du duel. */
  progression: { stack: 10, stack2: 0 },

  hud: {
    stats: [(f) => `Damage: ${formatHalf(f.stacks)}`],
    statsFr: [(f) => `Dégâts : ${formatHalf(f.stacks)}`],
    color: '#8c7ec4',
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

export const ELEMENTS = deepFreeze({
  shadow: SHADOW,
  ice: ICE,
  fire: FIRE,
  light: LIGHT,
  wind: WIND,
  lightning: LIGHTNING,
  water: WATER,
  plant: PLANT,
  outlaw: OUTLAW,
  bladesman: BLADESMAN,
  dragoon: DRAGOON,
});

/**
 * Ordre d'affichage dans l'écran de sélection — et, via `tools/matrix.mjs`,
 * ordre d'appariement de la matrice d'équilibrage.
 *
 * Le Hors-la-loi et le Bretteur sont **ajoutés en queue** et pas insérés : les
 * paires sont formées en `[liste[i], liste[j]]`, donc mettre un nouveau venu
 * en tête changerait le camp A de dizaines d'affrontements existants, et avec
 * lui leur issue — sans qu'aucune valeur de fiche n'ait bougé.
 */
export const ROSTER = deepFreeze([
  'shadow',
  'ice',
  'fire',
  'water',
  'light',
  'lightning',
  'wind',
  'plant',
  'outlaw',
  'bladesman',
  'dragoon',
]);

/** @param {string} id */
export function getElement(id) {
  const el = ELEMENTS[id];
  if (!el) throw new Error(`Élément inconnu : ${id}`);
  return el;
}
