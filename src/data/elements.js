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
/**
 * **Réactivé et reskin, à la demande — le Vent devient le Shinobi.** Même
 * patron que le Bretteur (voir plus haut) : `id: 'wind'` ne bouge pas (URL
 * d'archive, module de pouvoirs, clés de sprite — rien de tout ça n'est
 * montré au joueur), seuls le nom, l'arme et les projectiles changent.
 * Stats, tornade et ultime restent le relevé vidéo d'origine, inchangé.
 */
const WIND = {
  id: 'wind',
  name: 'SHINOBI',
  nameRef: 'SHINOBI',
  tagline: 'Harcèlement — le plus rapide, tornades et shurikens',
  taglineRef: 'Harassment — the fastest of all, tornadoes and shurikens',
  icon: 'iconTornado',

  look: {
    radius: 41,
    /** **Écart assumé au relevé, demandé.** Corps crème-sable (or clair,
     *  220,196,98-ish) passé au noir — la couleur d'un shinobi. Le contour
     *  mesuré (`#0a0a0a`) collait déjà au noir, et le chiffre de PV aussi
     *  (`hpColor`) : les deux auraient disparu **noir sur noir** une fois le
     *  corps assombri (exactement le piège déjà payé sur le Bretteur — voir
     *  sa fiche). Contour repassé à l'orange de braise du shuriken (contraste
     *  net sur le noir du corps *et* sur le blanc de l'arène), chiffre de PV
     *  au crème mesuré ailleurs dans le roster (`#f5f2ea`) plutôt qu'assombri
     *  une deuxième fois. */
    body: '#141414',
    bodyHit: '#ffffff',
    outline: '#e8621b',
    outlineWidth: 5,
    hpColor: '#f5f2ea',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
    /** **Écart assumé, demandé.** Aura et traînée passent au noir, comme le
     *  corps : c'était le dernier khaki-crème (`#d6cdaa`-ish) qui restait sur
     *  un combattant devenu noir ailleurs. Le ruban de l'arme (`flair.ribbon`),
     *  les motes et l'éclair d'incantation ne sont pas touchés — non demandés,
     *  et ils restent lisibles tels quels sur le corps noir. */
    aura: {
      color: 'rgba(20,20,20,0.55)',
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
    trail: { color: 'rgba(20,20,20,0.3)', every: 0.035, life: 0.3 },
    accent: '#a89b6f',
  },

  // le plus rapide et le plus manœuvrant du roster (observé)
  movement: { speed: 500, turnRate: 2.2, seek: 0.4, mass: 1 },

  weapon: {
    /** **Écart assumé au relevé, demandé.** Le losange crème du Vent est
     *  remplacé par un shuriken de flamme transcrit d'une maquette fournie —
     *  huit branches de métal sombre cerclées de flamme continue, gemme de
     *  crâne de dragon au centre. `head.sprite` est servi par un **vrai
     *  PNG** (`assets/sprites/shinobi-shuriken.png`, déclaré dans
     *  `assets/sprites/manifest.json`), même technique que la lame du
     *  Bretteur — voir sa fiche pour l'écart à l'invariant « aucun binaire
     *  dans le dépôt » que ça implique. `BLADESMAN_FLAMEBLADE` avait besoin
     *  d'un recadrage soigné à l'extraction (la maquette isole mal l'objet
     *  du damier de transparence sur les zones sombres) ; `cv2.inpaint`
     *  (Telea) a rebouché les poches de damier prises dans l'ombre du métal
     *  sans toucher au reste — un simple retrait de fond ne suffisait pas
     *  ici, contrairement à la lame. */
    name: 'Shuriken de flamme',
    nameRef: 'Flame Shuriken',
    /**
     * **La bille EST le shuriken — demandé, écart assumé au relevé.**
     *
     * L'arme ne pend plus à côté du corps : le sprite est **centré sur la
     * bille**, qui joue le trou central du shuriken pendant que les lames
     * rayonnent autour d'elle. Trois valeurs suffisent à le dire, et elles
     * tiennent ensemble :
     *
     *  • `head.scale` porte la largeur dessinée à **150 px** (17 cellules du
     *    repli texte × 8,912656, corrigé du ratio 198/200 du PNG) ;
     *  • `handle.length` vaut **−75**, soit la moitié de cette largeur :
     *    `drawSpriteLeft` blitte à partir de là, donc le sprite démarre une
     *    demi-largeur *avant* le pivot et retombe exactement centré ;
     *  • `reach` vaut **75**, le rayon des pointes.
     *
     * L'invariant du dépôt tient toujours au caractère près :
     * `handle.length + largeur dessinée = −75 + 150 = 75 = reach`. La pointe
     * dessinée ne ment donc pas sur la portée, comme pour les dix autres.
     *
     * **Taille : 150 px pour une bille de 82.** Les lames dépassent de 34 px
     * tout autour — assez pour se lire comme un shuriken, pas assez pour
     * occuper un quart de l'arène. Caler la bille sur le vrai moyeu de la
     * maquette (30 % du rayon) aurait demandé 273 px, hors de question.
     * L'arme reste **sous** le corps (pas de `overBody`) : c'est ce qui fait
     * que la bille bouche le moyeu au lieu de passer derrière.
     */
    reach: 75, // déduit : rayon des pointes du shuriken dessiné
    spin: SPIN * 1.1, // tourne plus vite que les autres (observé) — ici, sur lui-même
    spinDir: 1,
    /**
     * **Aucun manche**, et `length` **négatif** : `width: 0` demande au moteur
     * de ne rien dessiner, et la longueur ne sert plus qu'à reculer le sprite
     * d'une demi-largeur pour le centrer sur la bille (même mécanique que le
     * talon de la lance du Lancier, poussée jusqu'au centrage complet).
     */
    handle: { length: -75, width: 0, color: '#6f6a55', dark: '#3f3b30', outline: '#201c12', gem: null },
    /** 17 cellules du repli texte × 8,912656 = 151,5 px de haut, soit
     *  150 px de large une fois le ratio 198/200 du PNG appliqué. */
    head: { sprite: 'windShuriken', scale: 8.912656, anchorY: 0.5 },
    /**
     * **Il blesse tout autour de lui — c'est la conséquence demandée.**
     *
     * `from` et `to` à zéro écrasent le segment tranchant sur le pivot :
     * `bladeSegment()` rend alors deux extrémités confondues au centre du
     * corps, et `segmentPointDistance` (qui traite déjà `len2 === 0`) mesure
     * la distance à ce point. Le test d'`weaponHit` devient donc
     * `distance ≤ rayon adverse + 75` : un **disque** centré sur la bille,
     * sans direction privilégiée. Aucune ligne de moteur n'a eu à bouger — la
     * forme de la hitbox se dit entièrement dans la fiche.
     *
     * `radius: 75` est le rayon des pointes, le même que `reach` : la lame
     * touche là où on la voit.
     */
    hitbox: { from: 0, to: 0, radius: 75 },
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

  /**
   * **CLONE D'OMBRE — pouvoir demandé, troisième créneau.**
   *
   * Même patron que le Blizzard/la Rage infernale/le Lien d'essence
   * (invariant 7) : greffé à côté d'`ability` (Tornade) et d'`ultimate`
   * (Salve de tempête), sur sa propre horloge (`f.state.cloneCd`), sans
   * toucher ni l'une ni l'autre.
   *
   * **Différence avec les trois autres greffes : celle-ci n'est pas reprise
   * d'un autre combattant, elle est conçue pour le Shinobi.** Un double de
   * 20 PV apparaît près de lui — vraiment hittable (arme adverse et
   * projectiles adverses le blessent, voir `abilities/wind.js`), vraiment
   * offensif (il jette lui aussi des shurikens), mais **stationnaire** et
   * **incorporel** (il ne bouscule personne) : donner au clone le pilotage,
   * la rotation d'arme et les collisions corporelles complètes d'un vrai
   * combattant aurait voulu toucher `match.js`/`physics.js`, qui ne
   * connaissent que deux combattants (`this.a`/`this.b`) dans tout le
   * moteur — voir l'invariant du moteur qui ne connaît aucun combattant.
   * Ce compromis garde l'ajout confiné au module du Shinobi.
   */
  special: {
    id: 'shadowClone',
    name: 'Clone d\'ombre',
    nameRef: 'Shadow Clone',
    barLabel: 'SHADOW CLONE',
    barLabelFr: 'CLONE D\'OMBRE',
    /** Reprend la couleur de la jauge d'ultime juste au-dessus — même
     *  convention que les trois autres pouvoirs greffés (sixième vague du
     *  Bretteur) : les deux jauges d'un même combattant se lisent comme une
     *  paire. */
    barFill: '#b9b295',
    barText: '#2a2518',
    hp: 20, // demandé
    /** Calé sur le même ordre de grandeur que le Blizzard (11 s) : les duels
     *  du roster réduit durent 10 à 30 s, une seule incantation par duel
     *  serait invisible, une en continu saturerait l'arène de deux corps. */
    cooldown: 12,
    first: 5, // calé : laisse le duel s'installer avant la première invocation
    // Permanent : demandé. Rien ne le fait expirer, seuls ses PV le peuvent.
    offset: 130, // calé : apparaît derrière le Shinobi, hors de son propre corps
    attack: { interval: 1.1, projectile: 'crescent' }, // riposte à la même cadence, à peu près, que la Tornade
  },

  /** **Écart assumé au relevé, demandé.** « Remplacer les projectiles par
   *  des shurikens de la même taille » : la clé `crescent` — toujours celle
   *  que lit `ultimate.volley` — pointe maintenant sur le même sprite que
   *  l'arme (`windShuriken`, servi par le même PNG) plutôt que sur
   *  `windCrescent`, et à la **même échelle** que l'arme (`scale: 4.35`,
   *  contre 3,6 pour l'ancien croissant) : le projectile lancé a exactement
   *  la taille dessinée du shuriken en main (~74 px), pas une taille propre.
   *  `radius` (rayon de collision) suit la même proportion (12 → 15) pour
   *  que la hitbox ne mente pas sur un projectile devenu plus grand — même
   *  discipline que la lame agrandie du Bretteur (invariant 5). */
  projectiles: {
    crescent: {
      label: 'Shuriken',
      labelRef: 'Shuriken',
      sprite: 'windShuriken',
      scale: 4.35,
      speed: 430,
      damage: 4,
      radius: 15,
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
  tagline: 'Pistolero de glace — vise, tire, et gèle sa cible balle après balle',
  taglineRef: 'Ice gunslinger — aims, fires, and freezes its mark with every bullet',
  icon: 'iconRevolver',

  look: {
    radius: 41, // mesuré : bille de rayon 32 sur la vidéo 576 → ×1,25 = 40
    /**
     * **Bleu de glace.** La pipette donne le brun `#8a5934` de la vidéo ; le
     * personnage est passé au type glace, et sa bille suit son arme, comme
     * celle du Lancier suit la sienne. Bleu **moyen** et non pâle : le chiffre
     * de PV est crème (mesuré), et un bleu clair le noierait — c'est la leçon
     * du cuivre clair du Lancier, qui avait forcé son chiffre en brun sombre.
     */
    body: '#3f97c9',
    bodyHit: '#e4e4e6', // mesuré frames 223/224/225 : le disque touché blanchit
    outline: '#181008', // pipette : (24,13,7), contour des billes
    outlineWidth: 5,
    /** Mesuré : le chiffre de PV est crème. Sur le brun sombre c'est le seul
     *  ton lisible — le noir du reste du roster y disparaîtrait. */
    hpColor: '#f5f2ea',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
    aura: {
      color: 'rgba(143,208,238,0.5)',
      radius: 1.58,
      pulse: 2.2,
      /** Le barillet se recharge toutes les secondes : un halo branché sur le
       *  pouvoir clignoterait sans arrêt. Il annonce donc HIGH NOON. */
      showWhen: 'ultimate-ready',
    },
    flair: {
      /**
       * Le revolver ne tourne pas (il est asservi à l'adversaire) : le ruban
       * de pointe d'arme trace donc sa ligne de visée, pas une spirale.
       *
       * **Même suite d'effets que le Lancier, en glace au lieu de foudre** :
       * ruban et fuseau `electric`, aura d'arme, arcs le long du canon. Le
       * code est partagé, seule la gamme change — c'est tout l'intérêt d'avoir
       * mis ces effets dans `render/flair.js`, ils ne peuvent rien changer au
       * duel.
       *
       * **La gamme est en bleus saturés, pas en bleus pâles.** L'arène est
       * blanche : `#dff2fb` y serait invisible, exactement comme les jaunes
       * clairs du Lancier l'étaient. Le halo porte le bleu franc, le cœur un
       * bleu clair *encore teinté* — jamais du blanc.
       */
      ribbon: {
        color: '#3f97c9',
        width: 15,
        /** Mêmes opacités que le Lancier (0,55 / 0,40) : c'est la **teinte**
         *  qui a dû descendre, pas l'alpha. Sur l'arène blanche un bleu porte
         *  moins qu'un ambre à luminosité égale — au premier réglage
         *  (`#bfeaff` sur `#2a7fae`) la traînée se lisait comme une volute
         *  grise. Les deux tons sont donc descendus d'un cran. */
        alpha: 0.72,
        /**
         * **Poudre de givre** plutôt qu'éclair de givre. Le tracé électrique
         * disait la foudre, ce qui n'est pas ce que dit ce personnage : il gèle,
         * il ne foudroie pas. Les grains sont serrés au ras du canon et
         * s'ouvrent vers l'arrière — une poudre se disperse en retombant.
         *
         * `rate` bas (6 contre 16 pour l'éclair) : la poudre doit **tenir en
         * place** assez longtemps pour se lire comme de la matière en
         * suspension. À 16 paliers par seconde elle sautillait et redonnait du
         * bruit, exactement ce que le tracé électrique cherchait, lui, à
         * produire.
         */
        powder: {
          color: '#2f8ec6',
          /** **Le cœur reste un bleu, pas un blanc.** Premier réglage :
           *  `#e8f7ff` sur `#7cc3e4`, invisible — l'arène est blanche, et un
           *  grain quasi blanc à 3 px n'y existe pas. C'est exactement la leçon
           *  déjà payée sur les jaunes clairs du Lancier, refaite à l'envers. */
          core: '#8fd0ee',
          haze: '#5fb0d8',
          hazeAlpha: 0.42,
          grains: 4,
          spread: 17,
          size: 4.4,
          rate: 6,
        },
      },
      /** Le fuseau derrière la bille : large et peu opaque là où le ruban est
       *  fin et vif. Cassure plus ample et plus lente que celle du ruban,
       *  sinon les deux tracés grésillent à l'identique et se lisent comme un
       *  seul trait épais (leçon payée sur le Lancier). */
      smear: {
        color: '#2a7fae',
        width: 34,
        alpha: 0.52,
        /** Le fuseau porte le corps du sillage : grains plus gros, plus
         *  nombreux et plus étalés que ceux du ruban, sur une nappe plus large.
         *  Graine de hachage différente (7.3), sinon les deux nuages se
         *  superposent exactement et l'on n'en voit qu'un. */
        powder: {
          color: '#1d78ad',
          core: '#5fb0d8',
          haze: '#4a9fd0',
          hazeAlpha: 0.34,
          grains: 5,
          spread: 29,
          size: 6.4,
          rate: 5,
        },
      },
      /** Aura le long du canon, tracée sur `bladeSegment()` — donc solidaire
       *  de la portée. `boostAlpha` la gonfle pendant HIGH NOON. */
      /** `powder` étale l'aura sur six passes très transparentes au lieu de
       *  trois larges : le bord net d'une gélule convient à une lame
       *  électrifiée, pas à du givre en suspension. */
      weaponAura: {
        color: '#5fb0d8',
        core: '#cfeeff',
        width: 8,
        alpha: 0.2,
        boostAlpha: 0.36,
        pulse: 3.2,
        powder: true,
      },
      /**
       * Arcs de givre le long du canon. Même règle que sur la lance :
       * l'amplitude doit **dépasser la demi-épaisseur du sprite**, sinon les
       * arcs restent dans la silhouette qui les recouvre. Le revolver fait
       * 46 px de haut dessiné (`map.h 46 × scale 1`), soit 23 de demi-
       * épaisseur — d'où 32, le même rapport que les 38 de la lance sur ses
       * 55 px.
       */
      /**
       * **Poussière de givre le long du canon**, à la place des arcs. Même
       * ancrage, même hachage, mais des grains isolés au lieu de polylignes.
       *
       * `jitter` garde la contrainte des arcs : il doit dépasser la
       * demi-épaisseur du sprite (23 px pour un revolver de 46 px de haut),
       * sinon les grains restent dans la silhouette, qui les recouvre.
       */
      weaponArc: {
        powder: true,
        count: 30,
        jitter: 30,
        size: 4.2,
        rate: 9,
        boost: 1.5,
        core: '#a8dcf2',
        glow: '#2f8ec6',
        alpha: 0.85,
      },
      /** Pas de `pierce` : l'onde de pénétration est conditionnée à
       *  `Fighter.boost`, que le Hors-la-loi allume pendant HIGH NOON — un
       *  coin de charge planté devant un pistolero qui recule à chaque tir se
       *  lirait comme un bug. C'est le seul effet de la suite du Lancier qui
       *  ne se transpose pas. */
      motes: { rate: 8, size: 8, drift: 30, rise: -8, colors: ['#3f97c9', '#8fd0ee', '#dff2fb'] },
      impact: ['#dff2fb', '#ffffff', '#3f97c9'],
      shape: 'streak',
      castFlash: 'rgba(253,247,237,0.65)', // mesuré : l'arène vire au crème sous HIGH NOON
    },
    trail: { color: 'rgba(63,151,201,0.26)', every: 0.04, life: 0.28 },
    accent: '#8fd0ee',
  },

  /** Mesuré 483 px/s (médiane de 57 segments rectilignes) → ×1,25 = 604.
   *  Calé à 455 (à 604 px/s dans cette arène le pistolero traverse le cadre
   *  plus vite qu'il ne recharge, et la matrice le fait gagner partout), puis
   *  **écart assumé, demandé** : ×1,2 supplémentaire → 546, sous le 604
   *  mesuré. Voir la matrice après ce changement dans les invariants. */
  movement: { speed: 546, turnRate: 1.9, seek: 0.44, mass: 1 },

  weapon: {
    name: 'Revolver de glace',
    nameRef: 'Ice Revolver',
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
    handle: { length: 37, width: 0, color: '#26566f', dark: '#153546', outline: '#0b1620', gem: null },
    // 37 + 85 × 1 = 122, la portée relevée — inchangée par le nouveau dessin
    head: { sprite: 'outlawRevolver', scale: 1, anchorY: 0.5 },
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
    /** Le rechargement est le trou observé entre `0/6` et `6/6` : 1,4 s
     *  mesuré. **Divisé par deux sur demande** — c'est donc un écart assumé au
     *  relevé, pas une nouvelle mesure. Le tour de vrille du pistolet suit
     *  automatiquement, son angle étant calculé depuis l'avancement. */
    reload: 0.7,
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
    /** **Écart assumé, demandé.** Reprend exactement la couleur de la jauge
     *  de Blizzard juste en dessous (`special.barFill`/`barText`) : les deux
     *  jauges d'un même combattant doivent se lire comme une paire — taille,
     *  police (déjà partagées via `HUD.bar`/`HUD.special`, voir `tuning.js`)
     *  et désormais couleur aussi. */
    barFill: '#3fbde0',
    barText: '#f2fdff',
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

  /**
   * **BLIZZARD — pouvoir spécial, repris tel quel de la Glace.**
   *
   * Troisième créneau de pouvoir, à côté d'`ability` (le barillet) et
   * d'`ultimate` (HIGH NOON), et **il ne les touche ni l'un ni l'autre** : il
   * porte sa propre minuterie et son propre état de module. C'était la seule
   * façon de l'*ajouter* sans remplacer HIGH NOON.
   *
   * Conséquence assumée : **il n'a pas de jauge**. Le HUD n'en porte qu'une,
   * et elle appartient à l'ultime. Le Blizzard s'annonce donc par son onde de
   * choc et par le disque de givre au sol, pas par un remplissage — ce qui,
   * pour un pouvoir sur horloge fixe, suffit à le lire.
   *
   * Le champ, l'onde et la neige sont **copiés de la fiche de la Glace** sans
   * retouche : c'est le même pouvoir, pas une variante. Seul le rythme est
   * `calé` ici, parce que la Glace le charge à la jauge et que le Hors-la-loi
   * le déclenche à l'horloge.
   */
  special: {
    id: 'blizzard',
    name: 'Blizzard',
    nameRef: 'Blizzard',
    /** Jauge propre, sous celle de l'ultime — voir `HUD.special`. Le pouvoir
     *  greffé n'en avait pas au départ ; c'est ce qui manquait pour qu'on voie
     *  venir son déclenchement au lieu de le subir. */
    barLabel: 'BLIZZARD',
    barLabelFr: 'BLIZZARD',
    /** Même traitement de libellé que les jauges d'ultime — texte clair cerné
     *  de noir — donc le fond doit être assez tenu pour le porter : `#67d6ec`
     *  était trop pâle une fois le libellé passé à la taille de l'ultime. */
    barFill: '#3fbde0',
    barText: '#f2fdff',
    /** Calé : les duels du roster réduit durent 10 à 20 s. À 14 s d'horloge
     *  le Blizzard ne partait presque jamais et ne se voyait qu'en duel long ;
     *  à 5 s il tourne en continu. 9 s laisse deux incantations dans un duel
     *  moyen. */
    cooldown: 11,
    /** Calé plus court que le cycle : le premier Blizzard doit tomber assez
     *  tôt pour peser sur un duel qui se décide en 12 s. */
    first: 4,
    duration: 5.2, // repris de la Glace, mesuré sur sa vidéo
    shockwave: {
      // onde cyan qui dépasse largement l'arène au déclenchement (observé)
      from: 40,
      to: 900,
      time: 0.95,
      color: 'rgba(103,214,236,0.85)',
      width: 6,
    },
    field: {
      radius: 130, // mesuré sur la Glace : disque cyan de ~130 px
      fill: 'rgba(224,247,255,0.55)',
      edge: 'rgba(103,214,236,0.75)',
      edgeWidth: 3,
      follows: true, // le champ suit le porteur
      slow: 0.35,
      tickInterval: 0.7,
      tickDamage: 1,
    },
    snow: { count: 90, fall: 46, drift: 22, color: 'rgba(186,230,253,0.9)' },
    /**
     * **Éclats de givre** — la mécanique `frostShards` de la Glace, greffée
     * sur le Blizzard. Chez la Glace c'est un pouvoir *permanent* que le
     * Blizzard accélère ; ici il n'existe **que** pendant le Blizzard, sinon
     * le Hors-la-loi aurait deux armes en permanence et cesserait d'être un
     * pistolero. Les chiffres sont ceux du `duringUltimate` de la Glace, qui
     * décrit précisément le régime « pendant Blizzard ».
     */
    shards: { count: 7, cooldown: 2.4, projectile: 'iceShard' },
  },

  projectiles: {
    /** Éclat repris tel quel de la fiche de la Glace : les projectiles sont
     *  lus dans la fiche du **porteur** (`owner.el.projectiles[key]`), donc un
     *  emprunt se recopie, il ne se référence pas. */
    iceShard: {
      label: 'Éclat de givre',
      labelRef: 'Frost Shard',
      sprite: 'iceShard',
      scale: 2.4,
      speed: 380,
      damage: 2,
      radius: 10,
      life: 3.4,
      bounces: 2, // les éclats ricochent sur les murs (observé sur la Glace)
      knockback: 45,
      onHit: { slow: 0.12, slowDuration: 1.6 },
      /** Les éclats vont moitié moins vite que la balle (380 contre 936) :
       *  bouffée plus étalée et plus lente, mais moins dense — sinon dix éclats
       *  simultanés saturent le banc de particules à eux seuls. */
      trail: {
        color: 'rgba(186,230,253,0.5)',
        every: 0.03,
        life: 0.55,
        dotted: true,
        puff: { count: 3, spread: 7, trailBack: 10, core: 'rgba(245,253,255,0.7)' },
      },
    },
    shot: {
      label: 'Balle de glace',
      labelRef: 'Ice Bullet',
      sprite: 'outlawShot',
      /** ×1,5 sur l'ancienne taille : carte 30 × 9 dessinée 45 × 13,5. La
       *  collision ne suit pas — `radius: 8` ne dépend pas du sprite — donc
       *  c'est un grossissement purement visuel. */
      scale: 1.5,
      /** Calé : à 30 fps la vidéo ne montre que le sillage, jamais la balle.
       *  720 px/s laissait à l'adversaire de quoi sortir de la ligne de tir —
       *  c'était l'autre moitié de la précision relevée, avec la dispersion.
       *  Porté à **936 (×1,3)** sur demande : la balle traverse donc plus vite
       *  et la dispersion redevient le seul garde-fou de la précision. */
      speed: 936,
      /** Mêmes dégâts que le coup à bout portant : c'est la même stat. */
      damage: (f) => Math.max(3, Math.round(f.stacks)),
      radius: 8, // calé avec la dispersion et la vitesse, pour 0,60 coup/s au banc
      life: 1.4,
      bounces: 0,
      knockback: 45,
      /** Mesuré frame 300 : un trait **pâle** de 2 px, (213,182,153) à
       *  (236,206,177) — pas un rond sombre. */
      /**
       * **Bouffée de poudre** plutôt qu'un point isolé. Un point toutes les
       * 30 ms à 936 px/s laisse 28 px entre deux marques : ça se lit comme un
       * chapelet de perles, pas comme un sillage. `puff` en sème cinq autour de
       * chaque marque, étalées perpendiculairement et traînant vers l'arrière.
       *
       * `every` descend en même temps (0,03 → 0,018), sinon les bouffées
       * restent séparées quelle que soit leur densité — c'est l'espacement des
       * émissions qui décide de la continuité, pas leur richesse.
       */
      trail: {
        color: 'rgba(160,214,240,0.55)',
        every: 0.018,
        life: 0.34,
        dotted: true,
        puff: { count: 5, spread: 6, trailBack: 16, core: 'rgba(240,252,255,0.75)' },
      },
      /**
       * **Gel.** `slow` et `slowDuration` sont lus par `Match.damage` et
       * passés à `Fighter.applySlow` : le moteur savait déjà le faire, c'est le
       * mécanisme de l'Ombre et de la Glace. Rien à écrire ailleurs.
       *
       * 0,30 pendant 1,6 s : assez pour se voir et pour compter, pas assez
       * pour immobiliser — `slowFactor` retient le pire ralentissement actif,
       * donc deux balles coup sur coup ne s'empilent pas, elles prolongent.
       *
       * `stackGain` reste **mesuré** : +0,10 par balle au but.
       */
      onHit: { stackGain: 0.1, stackMax: 8, slow: 0.5, slowDuration: 1.6 },
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
    color: '#6fc3e8', // bleu clair : la ligne de stat est posée sur l'encre sombre
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
    /** **Écart assumé au relevé.** L'or clair `#dcc462` (pipette vidéo,
     *  220,196,98) passe à un orange de braise — demandé avec la lame
     *  ardente qui remplace le sabre dentelé, voir `weapon` plus bas. */
    body: '#e8621b',
    bodyHit: '#e4e4e6', // mesuré : le disque touché blanchit une image entière
    outline: '#181008', // pipette : (24,13,7)
    outlineWidth: 5,
    /** **Écart assumé, demandé — deux passages.** D'abord posé sombre
     *  (`#2a0e05`) parce que le crème mesuré de la vidéo (`#F5F2EA`) se
     *  noyait sur l'orange clair du corps. Depuis que `overBody` (plus bas)
     *  fait passer la manche par-dessus la bille, c'est ce sombre qui se noie
     *  — noir sur les tons presque noirs de la manche. Le crème mesuré
     *  redevient donc le bon choix : la manche est sombre, pas le corps. */
    hpColor: '#f5f2ea',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
    /** **Demandé.** Sans ce drapeau, le chiffre se pose **avant** l'arme
     *  (l'ordre par défaut) et la manche — par-dessus la bille depuis
     *  `overBody` — le recouvrirait entièrement au centre. Voir la note dans
     *  `fighter.js` (`draw()`) pour l'ordre exact que ce drapeau inverse. */
    hpOverWeapon: true,
    /** **Écart assumé au relevé, poussé plus loin — demandé.** L'aura passive
     *  était vert-jaune (172,226,22), puis rouge-orangé pour suivre la lame de
     *  braise ; elle reprend maintenant la teinte exacte de l'aura du Feu
     *  (`#f97316`) pour que le reskin « lame de braise » se lise comme des
     *  flammes plutôt que comme un simple filtre de couleur. */
    aura: { color: 'rgba(249,115,22,0.5)', radius: 1.7, pulse: 3, showWhen: 'ultimate-ready' },
    flair: {
      /** **Écart assumé, demandé.** L'éventail balayé par la lame était vert
       *  mesuré (frame 643 : (211,219,109) sur l'arène crème, `#B1C404` posé
       *  à 55 %) ; il reprend désormais la palette flamme du Feu (`#f97316`,
       *  `#fbbf24`, `#ffffff` — voir `abilities/fire.js`), cohérente avec
       *  l'aura, le sillage et la Rage infernale greffée plus bas. */
      ribbon: { color: '#f97316', width: 26, alpha: 0.55 },
      motes: { rate: 7, size: 8, drift: 34, rise: -10, colors: ['#f97316', '#fbbf24', '#ffffff'] },
      impact: ['#fbbf24', '#ffffff', '#f97316'],
      shape: 'streak',
      castFlash: 'rgba(249,115,22,0.7)', // écart assumé : l'éventail virait au vert fluo sous BLADE RUSH, désormais à l'orange flamme
      /** **Cendres — écart assumé, demandé.** Poussière de braise le long de la
       *  lame, sur le même patron `powder` que le givre du Hors-la-loi et la
       *  foudre du Lancier (voir `render/flair.js`) : des grains isolés au lieu
       *  d'arcs continus, majoritairement gris cendre (`glow`), une minorité de
       *  braises qui rougeoient (`core`). `jitter: 30` dépasse la demi-épaisseur
       *  de la lame (35 × 1,448958 / 2 ≈ 25,4 après le passage ×1,3), sinon les
       *  grains restent dans la silhouette qui les recouvre. Purement décoratif
       *  (`render/flair.js`) : ne peut rien changer au duel. */
      weaponArc: {
        powder: true,
        count: 26,
        jitter: 30,
        size: 4.5,
        rate: 7,
        boost: 1.6,
        core: '#fbbf24',
        glow: '#3a332c',
        alpha: 0.8,
      },
      /** **Fuseau de cendre — écart assumé, demandé.** Le Bretteur n'avait
       *  aucun fuseau de vitesse (opt-in `smear`, absent jusqu'ici) ; il en
       *  gagne un, en cendre plutôt qu'en flamme franche, pour distinguer le
       *  panache qui suit le corps de la traînée de lame (`ribbon`, orange) et
       *  de la poussière d'arme (`weaponArc`, ci-dessus). Même patron `powder`
       *  que le fuseau de givre du Hors-la-loi. */
      smear: {
        color: '#3a332c',
        width: 30,
        alpha: 0.4,
        powder: {
          color: '#2b2620',
          core: '#f97316',
          haze: '#4a423a',
          hazeAlpha: 0.3,
          grains: 5,
          spread: 24,
          size: 5.6,
          rate: 6,
        },
      },
    },
    /** **Écart assumé, demandé.** Le sillage de vitesse était en or terne
     *  (220,196,98) ; il reprend la même teinte flamme que l'aura, cohérente
     *  avec `special.nova` plus bas. */
    trail: { color: 'rgba(249,115,22,0.32)', every: 0.035, life: 0.32 },
    accent: '#f97316',
  },

  /** Mesuré 605 px/s (médiane de 49 segments rectilignes) → ×1,25 = 756.
   *  Calé à 560 : c'est le combattant le plus rapide du roster, ce que dit le
   *  relevé, sans aller jusqu'aux 756 px/s qu'une lame de 152 px de portée
   *  rendrait intenable. À 470 il tombait à 9 victoires sur 27. */
  movement: { speed: 560, turnRate: 1.7, seek: 0.5, mass: 1 },

  weapon: {
    /** **Écart assumé au relevé, comme la lance du Lancier.** Le sabre
     *  dentelé de la vidéo est remplacé par une lame ardente transcrite
     *  d'une maquette fournie — garde ailée sombre à gemme rouge, lame en
     *  flamme continue du rouge sombre au jaune vif. Voir `pixelmaps.js`,
     *  `BLADESMAN_FLAMEBLADE`, pour la méthode de transcription (même
     *  principe que `LANCER_SPEAR` : réduction par blocs de l'artwork
     *  fourni, pas un dessin reconstruit). */
    name: 'Lame de braise',
    nameRef: 'Ember Blade',
    /** Mesuré : garde à r 36–45, lame à r 45–122 sur la vidéo 576 → ×1,25 :
     *  garde à 45–56, pointe à 152. **Écart assumé, demandé** : la lame
     *  passe ×1,3 (152 → 197,6) — `handle.length` et `head.scale` sont
     *  recalés dans la même proportion, donc la pointe dessinée retombe
     *  exactement sur cette nouvelle portée, comme avant le reskin. Un
     *  changement de reach déplace la matrice ; voir les invariants. */
    reach: 197.6,
    /** Mesuré : **plancher** de la courbe de rotation, 0,80 tour/s → 5,03 rad/s.
     *  Tout ce qui dépasse est ajouté par `abilities/bladesman.js` : la fiche
     *  décrit le plancher, le module décrit le cycle. */
    spin: 5.03,
    spinDir: 1,
    /** **Design revu, demandé — troisième passage.** Les deux essais de
     *  manche dessinée (rectangle plein, puis chevron modélisé en pixel-art
     *  texte) ne satisfaisaient pas la demande : « il ne faut pas modéliser
     *  l'arme ». `head.sprite` est maintenant servi par un **vrai PNG**
     *  (`assets/sprites/bladesman-flameblade.png`, déclaré dans
     *  `assets/sprites/manifest.json`) recadré directement dans la maquette
     *  fournie — lame, garde **et** manche/pommeau en un seul morceau, plus
     *  aucune part modélisée. `handle.width` reste à 0 : la manche est dans
     *  l'image, pas dans un rectangle. Voir `pixelmaps.js` pour l'écart à
     *  l'invariant « aucun binaire dans le dépôt » que ça implique.
     *
     *  **Écart assumé, demandé — quatrième passage.** La lame regrandit ×1,3
     *  (`head.scale` × 1,3, comme le premier agrandissement) et `handle.length`
     *  se retrouve négatif (−31,26) : au-delà de la valeur qui posait le
     *  pommeau pile au centre de la bille (0), un agrandissement supplémentaire
     *  ne peut que le faire déborder **derrière** le pivot, dans l'axe opposé à
     *  la lame — jamais au-delà du bord de la bille (rayon 41), donc le
     *  pommeau reste sur la silhouette de la bille, pas planté dedans. Sans
     *  incidence avant ce passage-ci : `overBody` (juste en dessous) rend
     *  maintenant toute l'arme visible par-dessus la bille, y compris cette
     *  portion. */
    handle: { length: -31.26, width: 0, color: '#8d7b62', dark: '#5c4f3c', outline: '#171009', gem: null },
    /** `scale` × 1,3 (1,448958 → 1,8836454) : seule la taille change,
     *  `handle.length` est recalé pour que la largeur réellement dessinée
     *  (`headH × ratio du PNG`, 486 × 140) retombe exactement sur `reach`
     *  (197,6, inchangé) — la pointe ne ment toujours pas sur la hitbox
     *  (invariant 5), même si `map.w`/`map.h` (dans `pixelmaps.js`) ne
     *  décrivent plus que le pixel-art de repli, jamais lus pour ce calcul. */
    head: { sprite: 'bladesmanFlameBlade', scale: 1.8836454, anchorY: 0.5 },
    /** **L'arme passe par-dessus la bille — demandé.** Même drapeau que le
     *  Lancier (voir sa fiche pour le détail d'ordre de dessin dans
     *  `fighter.js`) : la manche, jusqu'ici en grande partie masquée par la
     *  bille, devient entièrement visible. Purement visuel — `bladeSegment()`
     *  et la hitbox ne lisent pas ce drapeau, seul `Fighter.draw()` le fait. */
    overBody: true,
    /** La garde ne coupe pas : le tranchant commence après elle. Rayon de
     *  hitbox × 1,3 comme le reste de la lame. */
    hitbox: { from: 0.42, to: 1, radius: 22.1 },
    melee: {
      /** Mesuré, **exact et sans exception** : `damage = 2,00 × Spin Speed`.
       *  La valeur n'est jamais stockée, elle est dérivée de la pile. */
      damage: (f) => Math.max(2, Math.round(f.stacks * 2)),
      cooldown: 1, // mesuré : verrou de 1 000 ms entre deux touches
      knockback: 250,
      selfRecoil: 85,
      /** Mesuré : sauts discrets de +0,15 sur la courbe de rotation, un par
       *  coup d'épée porté, et jamais au-delà du plafond de 3,00.
       *
       *  **Brûlure à l'impact — demandé, pas mesuré.** Même mécanisme que le
       *  Feu (`applyDot`, lu par `Match.resolveMelee`) : chaque coup de lame
       *  marque la cible d'un tic de brûlure, dérivé de la pile courante de
       *  Spin Speed (0,8 à 3,00) plutôt que d'une valeur fixe.
       *
       *  `duration` est `calé` au banc (`tools/matrix.mjs`), pas choisi à
       *  l'estime : à 2 s (deux tics par coup) le Bretteur balayait les deux
       *  autres actifs (5/6, contre 0/6 avant cet ajout) — la brûlure
       *  s'ajoutait à des dégâts au contact déjà mesurés, sans que la cadence
       *  de touche n'ait bougé. Ramenée à **1 s (un seul tic)**, il gagne 2/6 :
       *  un vrai gain sur son relevé d'origine, sans en faire le plus fort du
       *  roster réduit. Voir aussi `special.aura.tickDamage`, qui n'a quasiment
       *  pas pesé dans ce banc — le levier est ici, pas là-bas. */
      onHit: {
        stackGain: 0.15,
        stackMax: 3,
        dot: {
          damage: (self) => Math.max(1, Math.round(self.stacks)),
          interval: 1,
          duration: 1,
          ring: '#e8621b',
          tint: { color: '#e8621b', alpha: 0.65 },
        },
      },
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
    /** **Écart assumé, demandé — deux passages.** D'abord passée à l'orange
     *  de l'aura (`#f97316`, texte assombri) pour suivre le reskin flamme.
     *  Reprend maintenant exactement la couleur de la jauge de Rage infernale
     *  juste en dessous : les deux jauges d'un combattant doivent se lire
     *  comme une paire — taille, police (déjà partagées via `HUD.bar`/
     *  `HUD.special`) et désormais couleur aussi. */
    barFill: '#ea580c',
    barText: '#fff1f0',
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
    /** Mesuré frame 643 : l'aire de l'éventail passe de ~3 500 px² à
     *  18 488 px² au pic, un facteur 5,3 — l'éventail **s'ouvre**, il ne fait
     *  pas que changer de teinte. Ouverture bornée en **angle**
     *  (1,6 rad → 3,0 rad), jamais en nombre d'images. **Couleur : écart
     *  assumé, demandé** — vert mesuré à l'origine, passé à la palette flamme
     *  comme le reste du reskin. */
    fan: { normal: 1.6, rush: 3, color: 'rgba(249,115,22,0.72)' },
  },

  /**
   * **Rage infernale — pouvoir greffé, demandé.** Troisième créneau, sur le
   * même patron que le Blizzard du Hors-la-loi et le Lien d'essence du
   * Lancier (invariant 7 du `CLAUDE.md`) : une horloge propre
   * (`f.state.spec`), sans rapport avec la jauge de BLADE RUSH, qui reste
   * intacte. Nova, ailes de flammes et aura brûlante sont repris de
   * `abilities/fire.js`, dont c'est l'ultime d'origine — voir ce module pour
   * le calcul du burst et des ailes, recopiés tels quels.
   *
   * Cadence et durée sont calées comme les deux pouvoirs greffés existants,
   * sur la durée des duels du roster réduit (10 à 20 s) — pas sur le cycle de
   * ~26 s du Feu, taillé pour un roster de onze où le Feu n'a que ça.
   */
  special: {
    id: 'infernalRage',
    name: 'Rage infernale',
    nameRef: 'Infernal Rage',
    barLabel: 'INFERNAL RAGE',
    barLabelFr: 'RAGE INFERNALE',
    /** **Écart assumé, demandé.** Rouge pur à l'origine, pour se distinguer de
     *  la jauge BLADE RUSH au-dessus ; passe à un orange plus sombre pour
     *  suivre le reskin flamme du bas d'écran tout en restant deux teintes
     *  différentes l'une de l'autre. */
    barFill: '#ea580c',
    barText: '#fff1f0',
    cooldown: 11,
    first: 5,
    duration: 5.2, // repris du Blizzard/Lien d'essence, mesuré sur la Glace/l'Ombre
    /** Nova de cubes orange à l'incantation — reprise du Feu, effectifs réduits
     *  de moitié : la Rage infernale s'ajoute ici à BLADE RUSH plutôt que
     *  d'être l'unique pouvoir du combattant. */
    nova: { count: 45, speed: 420, size: 11, life: 0.9, colors: ['#f97316', '#ea580c', '#fbbf24', '#dc2626'] },
    /** Ailes de flammes autour du corps pendant toute la durée — reprises du Feu. */
    wings: { color: '#f97316', core: '#fbbf24', span: 2.1, flap: 6 },
    /** Aura brûlante : tout adversaire trop près prend un tic de dégâts et un
     *  rafraîchissement de la brûlure ci-dessus. Calé au banc (`matrix.mjs`) :
     *  à 2 dégâts/0,6 s elle cumulait avec la brûlure au contact et balayait
     *  les deux autres actifs (5/6). */
    aura: { radius: 140, tickInterval: 0.6, tickDamage: 1 },
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
    /** **Écart assumé, demandé.** Or sombre à l'origine, seule ligne du bas
     *  d'écran encore hors du reskin flamme ; passe à l'orange de l'aura. */
    color: '#f97316',
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
 *  LANCER — Lancier  (invité)
 *
 *  Troisième combattant venu de la chaîne « ballthingsim », relevé sur
 *  « Dragoon vs Outlaw » (576 × 1024, 33,6 s) — la vidéo dont le Hors-la-loi
 *  est déjà tiré, vue depuis l'autre camp. Toutes les cotes `mesuré`
 *  ci-dessous sortent de cette vidéo, converties ×1,25 vers le repère
 *  720 × 1280.
 * ========================================================================== */
const LANCER = {
  id: 'lancer',
  name: 'LANCIER',
  nameRef: 'LANCER',
  tagline: 'Chargeur — pointe en avant, il frappe de plus en plus fort',
  taglineRef: 'Charger — spear first, and every hit lands harder',
  icon: 'iconLance',

  look: {
    radius: 41, // mesuré : bille de rayon 33 sur la vidéo 576 → ×1,25 = 41
    /**
     * **Cuivre, comme sa lance.** Écart volontaire au relevé : la vidéo montre
     * une bille indigo `#574a84`, mais l'arme a été refaite d'après la
     * maquette, et la bille reprend sa teinte dominante — `#975938`, pipettée
     * sur la hampe.
     *
     * **C'est le cuivre clair, pas le cuivre moyen, et c'est délibéré.** La
     * teinte dominante de la hampe est `#975938` — mais le Hors-la-loi est à
     * `#8a5934`, soit 13 unités de rouge d'écart : dans leur duel, les deux
     * billes et les deux titres devenaient indiscernables. `#c9905f` est le
     * cuivre de la facette éclairée du fer de lance, donc toujours « la
     * couleur de l'arme », et il s'en détache nettement (63, 55, 43 d'écart).
     */
    /**
     * Violet de la hampe de la lance électrique — la bille suit l'arme, comme
     * elle suivait le cuivre avant elle.
     *
     * Retour, de fait, tout près de l'indigo `#574a84` **mesuré** sur la
     * vidéo : c'est le détour par le cuivre qui était l'écart, pas celui-ci.
     * Et la teinte reste distincte de l'Ombre (`#870286`), qui est un magenta
     * — rouge dominant, là où celui-ci a le bleu dominant.
     */
    body: '#7046ac',
    bodyHit: '#e4e4e6', // mesuré : le disque touché blanchit, comme les deux autres invités
    outline: '#181008',
    outlineWidth: 5,
    /** Mesuré : PV en blanc cerné de noir. Ce moteur ne cerne pas le chiffre
     *  (voir le Bretteur) : sur le cuivre clair, le crème mesuré se noie, donc
     *  le chiffre passe en brun sombre. Même écart volontaire, même raison. */
    /** Retour au crème **mesuré**. Il avait dû passer en brun sombre parce que
     *  le cuivre clair de la bille le noyait ; sur ce violet profond, le crème
     *  d'origine repasse sans peine. */
    hpColor: '#f5f2ea',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
    aura: {
      /**
       * Halo de la bille, passé au **jaune de foudre**. Attention au fond :
       * l'arène est **blanche**, donc un jaune pâle y serait invisible — c'est
       * la même leçon que le mode additif, qui ne marchait que sur le cadre
       * sombre. On prend donc un ambre saturé, pas un jaune clair.
       */
      color: 'rgba(240,176,0,0.5)',
      radius: 1.66,
      pulse: 2.2,
      showWhen: 'ultimate-ready', // halo cuivre quand le Bond est chargé
    },
    /**
     * La traînée du Lancier est la signature la plus visible de sa vidéo : un
     * **fuseau cramoisi** derrière la bille indigo, mesuré `#a32b4a` au cœur et
     * `#df8692` sur les bords. C'est le seul rouge de sa palette, et il est
     * rendu ici par le ruban de pointe d'arme.
     */
    flair: {
      /**
       * Les boucles qui entourent la lance : c'est la **pointe d'arme** qui les
       * trace en tournant.
       *
       * Mesuré cramoisi `#c2385a` sur la vidéo. Passé au **violet électrique**
       * avec l'arme : une traînée cramoisie derrière une lance violette lisait
       * comme deux personnages superposés. C'est un écart volontaire, du même
       * lot que la bille et la jauge.
       */
      // Affiné depuis 18 : pendant une charge la pointe parcourt 224 px en
      // 0,16 s, donc deux points de ruban consécutifs sont très écartés et un
      // trait épais à bouts ronds se referme en **barres pâles** détachées du
      // combattant. À 13, la traînée redevient un trait.
      /**
       * `electric` : la traînée est **cassée** au lieu d'être lisse, et tracée
       * d'un seul trait continu en deux passes — halo ambre puis cœur clair.
       *
       * L'amplitude s'annule au point le plus récent, sinon la traînée se
       * décrocherait de la pointe de l'arme et flotterait à côté du
       * combattant. `rate` a le même rôle que sur les arcs de lame : à 60
       * paliers par seconde on obtient du grain, à 16 on lit un éclair.
       */
      ribbon: {
        color: '#f0b400',
        width: 13,
        alpha: 0.55,
        electric: { core: '#fff6c0', glow: '#e0a800', coreWidth: 2.4, jitter: 16, rate: 16 },
      },
      /** Le fuseau **derrière la bille**, l'autre moitié de sa signature, et
       *  ce que le premier portage avait oublié : le ruban ne suit que la
       *  pointe d'arme. Seul combattant du roster à en porter un. Mesuré
       *  `#a32b4a` au cœur, large au ras du corps et effilé vers l'arrière. */
      /**
       * Le fuseau devient lui aussi électrique. Il est **large et peu opaque**
       * là où le ruban est fin et vif : c'est lui qui donne le corps de la
       * traînée, le ruban qui donne le nerf. Sa cassure est plus ample et plus
       * lente, sinon les deux tracés grésillent à l'identique et se lisent
       * comme un seul trait épais.
       */
      smear: {
        color: '#c98a00',
        width: 30,
        alpha: 0.4,
        electric: { core: '#f0b400', glow: '#c98a00', coreWidth: 5, jitter: 34, rate: 11 },
      },
      /**
       * **Images fantômes de la charge.** Mesuré : pendant une charge, la
       * traînée n'est pas un trait mais une **bande de billes qui se
       * recouvrent**, cramoisie, avec la lance répétée dans chacune (visible
       * image par image entre 8,60 et 8,83 s). C'est ce que le fuseau seul ne
       * pouvait pas rendre : il ne garde qu'un point par pas, donc pas d'angle
       * d'arme. Le compteur `Fighter.ghosting` décide quand en semer ; c'est
       * `render/flair.js` qui les dessine, donc ils ne peuvent rien changer au
       * duel.
       */
      ghost: { color: '#e0a800', every: 0.03, alpha: 0.5, lance: 20 },
      /**
       * **Aura d'arme** — halo le long de la lame, tracé sur `bladeSegment()`,
       * donc solidaire de la portée *et* du décalage latéral de l'arme.
       *
       * `boostAlpha` est l'intensité pendant la charge : l'aura se gonfle quand
       * la lance part, ce qui annonce le coup sans qu'aucune valeur d'attaque
       * ne soit lue par le rendu. Le battement est un `sin` du temps, pas un
       * tirage — inutile de consommer `viewRng` pour ça.
       */
      weaponAura: {
        color: '#e0a800',
        core: '#fff3a8',
        /**
         * Calé au rendu, et resserré depuis 26 : à cette largeur, les trois
         * passes formaient une **gélule** opaque qui délavait la hampe au lieu
         * de la cerner — l'aura mangeait le sprite qu'elle est censée mettre
         * en valeur. À 14, elle le borde.
         */
        width: 14,
        alpha: 0.22,
        boostAlpha: 0.4,
        pulse: 5.5,
      },
      /**
       * **Arcs électriques le long de la lame.** Ils quittent la lame et y
       * reviennent — l'amplitude est modulée par un sinus qui s'annule aux deux
       * bouts — et grésillent au rythme de `rate` paliers par seconde.
       *
       * `rate` est le paramètre qui décide si c'est de l'électricité ou du
       * bruit : retiré à chaque image (60/s), le tracé donne du grain de
       * télévision. À 18 paliers par seconde, l'œil suit chaque arc assez
       * longtemps pour le lire comme un éclair.
       */
      weaponArc: {
        count: 7,
        steps: 6,
        span: 0.42,
        /**
         * Amplitude, en px. **Elle doit dépasser la demi-épaisseur du sprite**
         * — la lance fait ~55 px de haut dessinée, donc 27 de demi-épaisseur.
         * À 13, les arcs restaient entièrement dans la silhouette et on ne
         * voyait rien du tout : ils sont dessinés derrière l'arme, qui les
         * recouvrait intégralement.
         */
        jitter: 38,
        rate: 18,
        boost: 1.6,
        core: '#fff6c0',
        glow: '#f0b400',
        coreWidth: 2,
        glowWidth: 6.5,
        alpha: 0.85,
      },
      /**
       * **Onde de pénétration**, pendant la charge seulement (conditionnée à
       * `Fighter.boost`). Un sillage en coin ouvert **vers l'arrière** depuis la
       * pointe — ouvert vers l'avant, il se lirait comme un projectile — et un
       * arc de proue juste devant elle.
       */
      pierce: {
        color: 'rgba(240,176,0,0.5)',
        core: '#fff6c0',
        // Long et étroit : au premier réglage (60 × 26) le coin se lisait
        // comme une **boule** collée à la pointe. C'est l'élancement qui fait
        // lire « ça transperce ».
        length: 82,
        width: 12,
        alpha: 0.34,
        bow: 16,
        bowGap: 9,
        bowWidth: 2.5,
      },
      motes: { rate: 10, size: 9, drift: 24, rise: -18, colors: ['#ffd83d', '#c98a00', '#fff6c0'] },
      impact: ['#fff6c0', '#ffffff', '#e0a800'],
      shape: 'spark',
      castFlash: 'rgba(240,190,40,0.6)',
    },
    trail: { color: 'rgba(201,138,0,0.30)', every: 0.04, life: 0.32 },
    accent: '#f0b400',
  },

  /** Mesuré 432 px/s (médiane de 37 segments rectilignes, bille isolée par
   *  érosion pour ne pas suivre la lance) → ×1,25 = 540. **Gardé tel quel**,
   *  contrairement au Hors-la-loi et au Bretteur qui ont dû être ralentis :
   *  vérifié au banc, le Lancier fait 15 victoires sur 30 à 540 px/s contre 16
   *  à 470 — sa vitesse n'est pas ce qui le rend fort, c'est sa portée et ses
   *  dégâts. Aucune raison de toucher un `mesuré` qui ne casse rien.
   *  C'est le combattant le plus rapide du roster après le Bretteur. */
  /**
   * **`seek: 0` — le déplacement est rectiligne.** `Fighter.step` ne fait
   * tourner le corps vers l'adversaire que si `seek > 0` ; à zéro, le Lancier
   * file droit et ne change de direction qu'aux rebonds sur les murs et à ses
   * propres charges. C'est ce qui distingue ce personnage des dix autres, qui
   * pilotent tous vers leur cible.
   */
  movement: { speed: 430, turnRate: 1.85, seek: 0, mass: 1 },

  weapon: {
    name: 'Lance électrique',
    nameRef: 'Electric Lance',
    /** Mesuré : centre → pointe = 131 px sur la vidéo 576 → ×1,25 = 164.
     *  **La plus longue portée du roster.** Elle découle du sprite :
     *  −52 (talon) + 54 cellules × 4 = 164, pour que hitbox et dessin ne
     *  puissent pas diverger quand on retouche la carte. */
    reach: 164,
    /**
     * **La lance suit le cap de déplacement.** Elle ne tourne pas librement et
     * ne vise pas non plus : elle est *soudée à la vitesse*, et pointe là où le
     * Lancier va.
     *
     * Relevé sur 141 images réparties sur toute la vidéo, lance isolée par ACP
     * de son contour sombre (les fantômes translucides et la traînée cramoisie
     * sont écartés par seuil) : l'axe de la lance tient à **6,6° du cap de
     * déplacement** en médiane — 3,7° sur les images où elle est le mieux
     * isolée, et 94 % sous 15° — contre **37,9° du cap vers l'adversaire**.
     * Le résultat tient à tous les régimes : 10,6° en marche lente, 6,1° en
     * croisière, 4,8° à l'accélération, 6,1° en pleine charge.
     *
     * Les deux relevés précédents étaient faux, chacun à sa façon. Le premier
     * donnait 327 °/s de rotation libre : le détecteur suivait la **traînée**,
     * pas l'arme. Le second concluait « elle vise, à ±5° » — mesuré sur les
     * seules plages où le Lancier fonçait *sur* l'adversaire, où cap de
     * déplacement et cap adverse se confondent. Un sous-ensemble biaisé.
     *
     * Ce que ça explique, et que ni l'un ni l'autre ne rendait : l'angle reste
     * **figé une demi-seconde** quand il va tout droit (2,13 → 2,67 s, moins de
     * 10° d'écart), **saute de 85° en une image** au rebond mural
     * (2,667 → 2,700 s, là où `heading` est réfléchi), et tourne lentement le
     * reste du temps — |ω| médian **33 °/s**, 88 % des images sous 100 °/s.
     * Toutes ces valeurs tombent d'elles-mêmes si `weaponAngle = heading` :
     * c'est le pilotage qui les produit, pas une règle d'arme.
     *
     * D'où `spin: 0` — `Fighter.step` n'écrit pas l'angle — et c'est
     * `abilities/lancer.js` qui le recopie du cap à chaque pas.
     */
    spin: 0,
    spinDir: 1,
    /**
     * **Charge de lance.** Le Lancier accélère en ligne droite, pointe en
     * avant. Il n'y a plus ni visée ni verrouillage : la lance suivant le cap,
     * elle est *déjà* dans l'axe de la charge — il suffit de partir quand
     * l'adversaire s'y trouve.
     *
     * Mesuré : la charge porte la bille à ~1 400 px/s pendant ~0,15 s, contre
     * 540 en croisière (t = 8,70 → 8,84 s sur la vidéo).
     */
    lunge: {
      /**
       * **Vitesse de balayage de la lance**, en rad/s. C'est le seul mouvement
       * propre du personnage hors charge : le corps va tout droit, la lance
       * tourne, et la charge part quand l'axe croise l'adversaire.
       *
       * Calée sur la **fréquence de charge relevée** — une toutes les 1,0 à
       * 1,7 s sur les deux vidéos. Un demi-tour à 4 rad/s prend 0,79 s, et
       * comme l'adversaire bouge aussi, on croise un peu plus souvent que ça.
       */
      scanSpin: 5.5,
      /**
       * Tolérance de verrouillage, en radians. Le balayage avance de
       * `scanSpin × dt` = 0,067 rad par pas à 60 Hz : en dessous de ça,
       * l'axe pourrait enjamber l'adversaire sans jamais le « croiser ».
       */
      aim: 0.1,
      /**
       * **Temps de verrouillage avant la charge**, en secondes. Court : c'est
       * le battement qui rend l'intention lisible, pas une attente. Il valait
       * 0,05 plus un moulinet de 0,10 — soit 0,15 de pause cumulée, jugée trop
       * longue. Le moulinet a disparu : le balayage de `seek` le remplace,
       * l'arme tourne déjà en permanence.
       */
      brace: 0.18,
      /**
       * Garde-fou de durée de charge. La charge s'arrête normalement **au mur**
       * (`Fighter.wall`) ; ce plafond n'existe que pour qu'une charge lancée le
       * long d'une paroi ne puisse pas bloquer la machine d'états. À 540 × 3,6
       * = 1 944 px/s, 0,6 s couvre 1 166 px, soit près de deux fois la diagonale
       * de l'arène.
       */
      dashMax: 0.6,
      /** Mesuré **1 392 px/s vidéo sur A et 1 770 sur B** ; 3,6 × 540 = 1 944
       *  logiques, soit 1 555 en repère vidéo — dans la fourchette. */
      speed: 3.6,
      /** Temps mort après la charge. Court : la vidéo enchaîne. */
      recover: 0.08,
      /** Verrou de touche hors charge — voir le garde-fou dans le module. */
      guard: 0.05,
      /** Décalage latéral de l'ancrage, hors charge. */
      lateral: 36,
      /** Calé : le recul propre à la charge, ajouté à `melee.selfRecoil`. */
      recoil: 240,
      dashRing: 'rgba(240,176,0,0.55)',
      hitRing: { to: 96, time: 0.26, color: 'rgba(255,230,150,0.75)' },
    },
    /** `width: 0` : rien à tracer, toute la lance tient dans `lancerSpear`.
     *  `length` est **négatif** parce que le talon dépasse derrière le pivot
     *  (**42 px** remesurés en aplatissant la lance, arrondis à 44 pour tomber
     *  sur la grille du sprite) — le blit démarre donc en arrière de la bille,
     *  ce que ne fait aucune autre arme du roster. */
    handle: { length: -44, width: 0, color: '#4c2d80', dark: '#210f3e', outline: '#080211', gem: null },
    /** `scale` n'est plus rond parce que la carte fait la taille de l'artwork
     *  et non celle d'un cadre choisi : 201 × 1,03483 = 208,0 px logiques, donc
     *  la pointe tombe à −44 + 208 = **164**, la portée relevée. */
    head: { sprite: 'lancerSpear', scale: 1.03483, anchorY: 0.5 },
    /**
     * **L'arme passe par-dessus la bille.** Mesuré : sur la vidéo, la lance
     * recouvre franchement le disque, contour compris. C'est l'inverse des dix
     * autres combattants, dont l'arme passe dessous — d'où le drapeau, porté
     * par la fiche et non par le moteur.
     *
     * `fighter.js` la pose alors après le contour et les anneaux d'état mais
     * **avant le chiffre de PV** : dans un miroir Lancier contre Lancier, ce
     * chiffre est le seul repère qui distingue les deux camps, et une lance de
     * 164 px par-dessus le perdrait.
     */
    overBody: true,
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
       * **Mesuré, et c'est la charge qui l'a rendu au relevé.** Sur la vidéo
       * les touches de lance tombent à 13,63 / 14,77 / 16,37 s : le verrou réel
       * est d'environ **1,1 s**, comme le reste du roster.
       *
       * Il a longtemps valu 6 s, et c'était le seul écart au relevé qui
       * subsistait. La raison : une lance de 164 px qui **balaie en tournant**
       * accroche 0,34 fois par seconde là où la vidéo en compte 0,181, et seul
       * un verrou absurde ramenait la cadence. Le mécanisme était faux, pas le
       * chiffre — et le maquillage coûtait au personnage tout son relief, un
       * Lancier au métronome qui tuait en 43,2 s exactement quel que soit
       * l'adversaire.
       *
       * La charge (`weapon.lunge`) rend le mécanisme : le Lancier ne touche
       * plus par hasard en balayant, il touche quand sa charge aboutit. La
       * cadence est désormais portée par `lunge.recover`, et le verrou peut
       * reprendre sa valeur relevée.
       */
      cooldown: 1.1,
      /**
       * **Recul, des deux côtés.** Relevé à 300 / 95 ; monté à 460 / 200 pour
       * donner du poids à l'impact — écart volontaire de mise en scène.
       *
       * C'est l'**amplitude** qu'on augmente et pas l'amortissement, parce que
       * celui-ci est global (`PHYSICS.speedRecovery`, partagé par les onze) :
       * le rendre plus sec ici le rendrait plus sec pour tout le monde. Une
       * impulsion plus grande sous le même amortissement donne exactement le
       * coup sec cherché — départ franc, résorption inchangée.
       *
       * 460 est au-dessus de tout le roster en mêlée (205 à 300) ; c'est
       * assumé : le Lancier est le seul à frapper lancé à 1 400 px/s.
       */
      knockback: 460,
      /**
       * **Symétrique** : action et réaction. Il valait 200 contre 460 encaissés,
       * et un choc qui pousse deux fois plus fort d'un côté se lit comme un coup
       * absorbé, pas comme un impact.
       */
      selfRecoil: 460,
      /**
       * Mesuré : **+2,00 par touche portée**, relevé au PV près. La stat passe
       * 10 → 12 → 14 → 16 → 18 → 20 aux instants 12,53 / 13,63 / 14,77 /
       * 16,37 / 21,00 s, et l'Outlaw descend de 100 à 30 PV : 10+12+14+16+18
       * = 70, exactement les cinq touches placées.
       *
       * Le plafond, lui, est **déduit** : la vidéo n'en montre aucun, mais elle
       * s'arrête à 20 parce que le Lancier meurt, pas parce que la stat bute —
       * et *tous* les combattants à stat croissante du roster en ont un
       * (Araignée 14, Serpent 14, Hors-la-loi 8, Bretteur 3). Sans plafond la
       * montée est quadratique en durée de duel.
       *
       * Il valait 16 du temps de la visée, où le mécanisme donnait peu de
       * touches et où il fallait bien qu'elles pèsent. La charge sur cap en
       * donne davantage : à 16 le Lancier monte à **19 victoires sur 30**,
       * hors bande, et à 14 il tombe à 12. À **15**, il rend 2,43 PV/s et
       * tient 13 — c'est la valeur qui satisfait la bande sans s'éloigner du
       * budget relevé.
       */
      onHit: { stackGain: 2, stackMax: 16 },
    },
  },

  /**
   * Le Lancier n'a **aucun pouvoir actif** dans la vidéo : sa seule ligne de
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
    /** **Écart assumé, demandé.** La jauge suivait la teinte du corps
     *  (`#5d3d8e`, le violet sombre de la hampe). Reprend maintenant
     *  exactement la couleur de la jauge du Lien d'essence juste en dessous :
     *  les deux jauges d'un combattant doivent se lire comme une paire —
     *  taille, police (déjà partagées via `HUD.bar`/`HUD.special`) et
     *  désormais couleur aussi. */
    barFill: '#7c3aed',
    barText: '#f3e8ff',
    /** Mesuré : +0,10 de remplissage par seconde, donc jauge pleine en ~10 s. */
    chargeRate: 10,
    /** Mesuré : marches de ~8 % à chaque touche portée. */
    chargeOnHit: 8,
    /**
     * Durée totale pendant laquelle la jauge reste vide et le Bond occupe le
     * Lancier : 0,45 s d'élan puis 1,5 s hors de l'arène. Chronométré deux
     * fois : jauge vidée à 10,60 s / décollage 11,02 s / retour 12,53 s, puis
     * 19,03 / 19,50 / 21,00.
     */
    duration: 1.95,
    windup: 0.45, // mesuré : 0,42 s et 0,47 s entre la vidange et le décollage
    /**
     * Mesuré : **1,51 s et 1,50 s d'absence**, rechronométré image par image
     * sur le premier bond (dernière image du Lancier à 11,03 s, marqueur seul
     * jusqu'à 12,53 s). Un temps de vol court — de l'ordre d'une demi-seconde —
     * ne laisserait pas au marqueur le temps d'enfler puis de se resserrer,
     * qui est ce qui annonce la chute et rend le Bond lisible.
     */
    flight: 1.5,
    /**
     * **Onde de choc au décollage.** Le Lancier disparaît d'une image à
     * l'autre : sans une marque au point de départ, rien ne dit d'où il est
     * parti. Disque gris qui s'ouvre, comme le marqueur d'arrivée — les deux
     * bouts du bond se répondent.
     */
    liftoff: { to: 190, time: 0.4, color: 'rgba(120,116,124,0.6)', width: 7 },
    /**
     * Chute **collée à l'adversaire** : le décalage vaut cette fraction de la
     * somme des deux rayons. À 0, les deux billes se superposent et
     * `resolveBodies` les sépare aussitôt, ce qui fait sauter le Lancier d'une
     * image à l'autre au moment précis où on le regarde.
     */
    landOffset: 0.9,
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

  /**
   * **LIEN D'ESSENCE — pouvoir spécial, repris tel quel de l'Ombre.**
   *
   * Même montage que le Blizzard du Hors-la-loi : un troisième créneau, sa
   * propre minuterie, aucun contact avec `ability` ni avec le Bond. Pas de
   * jauge non plus, pour la même raison — le HUD n'en a qu'une.
   *
   * **Le dôme est figé à l'endroit de l'incantation** (`anchored`), et c'est
   * ce qui compte pour ce combattant-ci : le Lancier traverse l'arène en
   * charge, un dôme qui le suivrait balaierait tout le terrain. Ancré, il
   * marque le point d'où le lien part, et le lien s'étire quand le Lancier
   * charge — ce qui donne au drain une lecture que l'Ombre, immobile, n'a
   * jamais eue.
   *
   * Deux différences avec la fiche de l'Ombre, et seulement deux :
   *
   *   - le **rayon du dôme** tombe de 265 à 200. À 265 il couvrait plus de la
   *     moitié de l'arène (640 px de côté), donc les deux combattants
   *     restaient dedans en permanence et le dôme cessait d'être un lieu ;
   *   - le **drain** passe de 1 PV / 0,4 s à 1 PV / 0,5 s. Le Lancier gagnait
   *     déjà 29 duels sur 30 ; lui ajouter 2,5 PV/s gratuits n'aurait pas
   *     demandé de mesure pour savoir où ça allait.
   *
   * La teinte, elle, reste **celle de l'Ombre** : violet `#7c3aed`. C'est
   * fortuit mais commode — le Lancier est déjà violet, le lien se lit comme
   * le sien et non comme un emprunt.
   */
  special: {
    id: 'essenceTether',
    name: 'Lien d’essence',
    nameRef: 'Essence Tether',
    barLabel: 'ESSENCE TETHER',
    barLabelFr: 'LIEN D’ESSENCE',
    barFill: '#7c3aed',
    barText: '#f3e8ff',
    /** Calé, comme le Blizzard, sur la durée des duels du roster réduit. */
    cooldown: 11,
    first: 5,
    duration: 5.65, // repris de l'Ombre, mesuré deux fois sur sa vidéo
    dome: {
      radius: 200,
      /** Le dôme **déborde de l'arène** : dans la vidéo de l'Ombre il
       *  recouvre le HUD. Il est donc dessiné par `drawUnbounded`. */
      clipToArena: false,
      fill: 'rgba(30,24,45,0.88)', // pipette sur la vidéo de l'Ombre
      edge: 'rgba(76,29,149,0.95)',
      edgeWidth: 4,
      sparks: 90, // poussière violette qui dérive dans le dôme
      sparkColors: ['#a855f7', '#c4b5fd', '#ffffff', '#6d28d9'],
      anchored: true,
    },
    tether: {
      color: '#7c3aed',
      core: 'rgba(255,255,255,0.55)',
      width: 5,
      tickInterval: 0.5,
      tickDamage: 1,
      slow: 0.15, // ralentit la cible tant que le lien tient
      motes: 26,
    },
  },

  /** Le Lancier n'a aucun projectile : tout passe par la lance et le Bond. */
  projectiles: {},

  /** Mesuré : « Damage: 10.00 » à la première image du duel. */
  progression: { stack: 10, stack2: 0 },

  hud: {
    stats: [(f) => `Damage: ${formatHalf(f.stacks)}`],
    statsFr: [(f) => `Dégâts : ${formatHalf(f.stacks)}`],
    // Violet clair : sur l'encre sombre du chrome, le violet de la bille
    // manquerait de contraste.
    color: '#9d7bc8',
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
  lancer: LANCER,
});

/**
 * Ordre d'affichage dans l'écran de sélection — et, via `tools/matrix.mjs`,
 * ordre d'appariement de la matrice d'équilibrage.
 *
 * Le Hors-la-loi, le Bretteur et le Shinobi (`wind`) sont **ajoutés en
 * queue** et pas insérés : les paires sont formées en `[liste[i], liste[j]]`,
 * donc mettre un nouveau venu en tête changerait le camp A de dizaines
 * d'affrontements existants, et avec lui leur issue — sans qu'aucune valeur
 * de fiche n'ait bougé. `wind` occupait à l'origine sa place parmi les huit
 * éléments (avant `plant`) ; réactivé en Shinobi, il est **déplacé** ici en
 * queue de liste pour la même raison — sa position dans `ROSTER` d'origine
 * l'aurait fait passer devant `outlaw`/`bladesman`/`lancer` dans `PLAYABLE`,
 * ce qui aurait changé le camp A de leurs six duels existants.
 */
export const ROSTER = deepFreeze([
  'shadow',
  'ice',
  'fire',
  'water',
  'light',
  'lightning',
  'plant',
  'outlaw',
  'bladesman',
  'lancer',
  'wind',
]);

/**
 * Combattants **temporairement désactivés**.
 *
 * Rien n'est supprimé : `ELEMENTS` et `ROSTER` restent entiers. Cette liste ne
 * retire les combattants que de ce qui est **jouable** — écran de sélection et
 * duel par défaut. C'est volontaire, et c'est ce qui rend la manœuvre
 * réversible sans rien reconstruire.
 *
 * **L'outillage continue de lire `ROSTER` en entier**, et il le faut :
 * `tools/matrix.mjs` est le garde-fou d'équilibrage, et le laisser tomber à un
 * seul combattant reviendrait à perdre la matrice de référence des dix autres
 * — donc à devoir tout recaler à la réactivation. De même `lang-check.mjs`
 * vérifie les onze fiches, pour qu'une fiche désactivée ne pourrisse pas en
 * silence.
 *
 * **Pour réactiver :** retirer l'identifiant de cette liste. Pour tout
 * réactiver d'un coup, la vider — `export const DISABLED = deepFreeze([]);`.
 *
 * Les identifiants désactivés restent accessibles par URL (`?a=fire&b=ice`) :
 * la désactivation porte sur l'écran de sélection, pas sur le moteur, ce qui
 * permet de continuer à tester un combattant sans le remettre en vitrine.
 *
 * **`wind` en est sorti, à la demande — même exception que `bladesman`.**
 * Ce n'est pas une réactivation « telle quelle » d'un relevé vidéo qu'on
 * ranime sans y toucher : c'est un reskin demandé (Shinobi, arme et
 * projectiles en shuriken de flamme), qui compte donc désormais dans la
 * matrice de rééquilibrage comme `bladesman` avant lui — voir sa fiche.
 */
export const DISABLED = deepFreeze([
  'shadow',
  'ice',
  'fire',
  'water',
  'light',
  'lightning',
  'plant',
]);

/**
 * Le roster **jouable** : `ROSTER` moins `DISABLED`, dans le même ordre.
 *
 * Dérivé plutôt que recopié : deux listes tenues à la main finissent par
 * diverger, et l'écran de sélection afficherait alors une carte pour un
 * combattant que le moteur ne connaît plus.
 */
export const PLAYABLE = deepFreeze(ROSTER.filter((id) => !DISABLED.includes(id)));

if (PLAYABLE.length === 0) {
  // Un roster jouable vide donne un écran de sélection blanc et un plantage à
  // la première partie : mieux vaut le dire ici.
  throw new Error('DISABLED désactive tout le roster — il faut au moins un combattant.');
}

/** @param {string} id */
export function getElement(id) {
  const el = ELEMENTS[id];
  if (!el) throw new Error(`Élément inconnu : ${id}`);
  return el;
}
