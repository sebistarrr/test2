/**
 * ============================================================================
 *  FICHES DES BÊTES SPIRITUELLES — source de vérité unique
 * ============================================================================
 *
 *  Tout ce qui définit un combattant est ici : apparence, vitesse, arme,
 *  pouvoir, ultime, projectiles, HUD. Le moteur ne contient AUCUNE constante
 *  propre à une bête : il lit cette fiche.
 *
 *  Les objets sont gelés (deepFreeze) : un duel ne peut pas les modifier, donc
 *  le Loup se comporte exactement pareil au 1er et au 100e duel. Le runtime
 *  travaille sur une copie d'état (voir game/fighter.js).
 *
 *  Ajouter une bête = ajouter une entrée ici + éventuellement un module de
 *  pouvoirs dans game/abilities/. Rien d'autre à toucher.
 *
 *  Unités : px (référentiel 720x1280 de la vidéo), secondes, radians.
 *  « mesuré » = valeur relevée sur la vidéo de référence. Le roster « Bêtes
 *              Spirituelles » rhabille les huit combattants d'origine sans
 *              toucher à leur mécanique : ces relevés restent donc valables,
 *              et les noms de vidéos cités plus bas disent d'où vient le
 *              chiffre, pas qui le porte aujourd'hui.
 *  « calé »   = valeur ajustée pour retrouver le rythme observé (~60 s de duel).
 *
 * @module data/elements
 */

import { deepFreeze } from './freeze.js';

/** Vitesse de rotation d'arme commune : 330 °/s ≈ 5,76 rad/s (mesurée). */
const SPIN = 5.76;

/* ==========================================================================
 *  LOUP  (WOLF) — Traqueur
 * ========================================================================== */
const WOLF = {
  id: 'wolf',
  name: 'LOUP',
  nameRef: 'WOLF',
  tagline: 'Traqueur — bondit dans l’angle mort et saigne sa proie',
  icon: 'wolfIcon',
  portrait: 'wolfSprite', // corps dans l'arène + vignette de sélection

  /* ---------- APPARENCE ---------- */
  look: {
    radius: 41, // mesuré : boule de 83 px de diamètre. Le corps est désormais
    //             dessiné avec le portrait ; ce rayon ne sert plus qu'aux collisions
    body: '#8fa6c8', // bleu argenté du roster
    bodyHit: '#ffffff', // flash blanc à l'encaissement (observé)
    outline: '#0a0a0a',
    outlineWidth: 5,
    aura: {
      color: 'rgba(143,166,200,0.45)',
      radius: 1.62, // × rayon du corps
      pulse: 2.4, // Hz
      showWhen: 'ability-ready', // halo argenté quand le Bond est prêt
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
      ribbon: { color: '#cfe0f5', width: 16, alpha: 0.5 },
      motes: { rate: 9, size: 9, drift: 26, rise: -14, colors: ['#8fa6c8', '#4f6488', '#dbe9fb'] },
      impact: ['#dbe9fb', '#ffffff', '#4f6488'],
      shape: 'dot',
      castFlash: 'rgba(219,233,251,0.55)',
    },
    trail: {
      color: 'rgba(79,100,136,0.24)',
      every: 0.045, // s entre deux images fantômes
      life: 0.28,
    },
    accent: '#dbe9fb',
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
    name: 'Dagues-crocs',
    reach: 77, // mesuré : centre → pointe = 77 px
    spin: SPIN,
    spinDir: -1, // sens initial (s'inverse aux rebonds)
    handle: {
      length: 29, // amorce masquée par le corps ; la lame occupe 29 → 77
      width: 11,
      color: '#2c3550',
      dark: '#171d2e',
      outline: '#0a0f1a',
      gem: null,
    },
    head: { sprite: 'wolfProjectile', scale: 6, anchorY: 0.5 }, // 8 × 6 = 48 px
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
    id: 'huntersLeap',
    name: 'Bond du traqueur',
    nameRef: 'Hunter’s Leap',
    /** Cooldown initial affiché « Hunter’s Leap Cooldown: 3s » (mesuré). */
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
    volley: { count: 3, spread: 0.38, projectile: 'fangDart' },
  },

  /* ---------- ULTIME (jauge du HUD) ---------- */
  ultimate: {
    id: 'bloodBond',
    name: 'Lien de sang',
    nameRef: 'BLOOD BOND',
    barLabel: 'BLOOD BOND',
    barLabelFr: 'LIEN DE SANG',
    barFill: '#8fa6c8',
    barText: '#0a0f1a',
    /** Charge : +chargeRate/s et +chargeOnHit par touche portée. */
    chargeRate: 5.5, // calé : ~3 incantations, pour compenser le drain plus lent
    chargeOnHit: 3,
    duration: 5.65, // mesuré deux fois : 5,66 s et 5,63 s
    dome: {
      radius: 265, // mesuré : largeur médiane stable à 209 px ×1,25
      /** Le dôme **déborde de l'arène** : dans la vidéo il recouvre le HUD. */
      clipToArena: false,
      fill: 'rgba(20,26,40,0.88)', // nuit bleutée : la traque se fait dans le noir
      edge: 'rgba(143,166,200,0.95)',
      edgeWidth: 4,
      sparks: 120, // poussière argentée qui dérive dans le dôme
      sparkColors: ['#8fa6c8', '#dbe9fb', '#ffffff', '#4f6488'],
      /** Le dôme est figé à l'endroit de l'incantation. */
      anchored: true,
    },
    tether: {
      color: '#8fa6c8',
      core: 'rgba(255,255,255,0.55)',
      width: 5,
      /** Drain mesuré sur un dôme entier : 10 PV en 4,5 s, soit 2,2 PV/s. */
      tickInterval: 0.4,
      tickDamage: 1,
      slow: 0.15, // ralentit la cible tant que le lien tient
      motes: 26, // particules qui remontent le lien vers le Loup
    },
  },

  /* ---------- PROJECTILES ---------- */
  projectiles: {
    fangDart: {
      label: 'Croc lancé',
      // rendu lisse : bille claire à cœur blanc, cerclée du bleu argenté
      glow: { radius: 10, core: '#ffffff', edge: '#8fa6c8' },
      speed: 600,
      damage: 5,
      radius: 11,
      life: 1.5,
      bounces: 0,
      knockback: 70,
      trail: { color: 'rgba(79,100,136,0.35)', every: 0.05, life: 0.22 },
    },
  },

  /* ---------- LIGNE DE STAT DU HUD ---------- */
  hud: {
    /** @param {import('../game/fighter.js').Fighter} f */
    stat: (f) => `Hunter’s Leap Cooldown: ${formatSeconds(f.ability.cooldown)}`,
    statFr: (f) => `Bond du traqueur — recharge : ${formatSeconds(f.ability.cooldown)}`,
    color: '#7d94b8',
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  ARAIGNÉE  (SPIDER) — Contrôle
 * ========================================================================== */
const SPIDER = {
  id: 'spider',
  name: 'ARAIGNÉE',
  nameRef: 'SPIDER',
  tagline: 'Contrôle — empile les toiles qui blessent et engluent',
  icon: 'spiderIcon',
  portrait: 'spiderSprite',

  look: {
    radius: 41,
    body: '#2b2733', // noir profond du roster
    bodyHit: '#ffffff',
    /**
     * Seule bête à dissocier la couleur de sa barre de vie de celle de son
     * corps : posé sur le fond sombre `#1c1a26`, son noir profond ne se
     * distinguait pas de la plaque vide et la barre semblait ne jamais
     * descendre. On reprend son rouge, celui de sa jauge d'ultime.
     */
    hpFill: '#e01f3a',
    outline: '#0a0a0a',
    outlineWidth: 5,
    // seule bête du roster à porter ses PV en clair : le noir profond du corps
    // avalerait des chiffres noirs, alors que l'arène blanche les rend partout
    // ailleurs plus lisibles
    aura: {
      color: 'rgba(224,31,58,0.45)',
      radius: 1.62,
      pulse: 2.0,
      showWhen: 'ultimate-ready', // halo rouge quand la Toile mère est chargée
    },
    flair: {
      ribbon: { color: '#e01f3a', width: 17, alpha: 0.5 },
      motes: { rate: 9, size: 9, drift: 20, rise: 14, colors: ['#e01f3a', '#8f8aa4', '#ff5566'] },
      impact: ['#ff5566', '#ffd7dc', '#8f8aa4'],
      shape: 'spark',
      castFlash: 'rgba(224,31,58,0.6)',
    },
    trail: { color: 'rgba(143,138,164,0.28)', every: 0.05, life: 0.26 },
    accent: '#e01f3a',
  },

  movement: {
    speed: 470, // mesuré : médiane ~470 px/s hors ralentissement
    turnRate: 1.9,
    seek: 0.42,
    mass: 1,
  },

  weapon: {
    name: 'Shurikens-toiles',
    reach: 132, // mesuré : centre → pointe de hache = 132 px
    spin: SPIN,
    spinDir: 1,
    handle: {
      length: 84, // long fil de soie (84 px + 48 px de shuriken = 132)
      width: 11,
      color: '#6d6879',
      dark: '#3a3644',
      outline: '#000000',
      gem: { at: 0.52, size: 8, color: '#e01f3a' }, // perle rouge au milieu
    },
    head: { sprite: 'spiderProjectile', scale: 6, anchorY: 0.5 }, // 8 × 6 = 48 px
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
        /** Soie visible : la victime prend un voile gris perle qui dit
         *  l'entrave, sans masquer sa couleur propre. */
        tint: { color: '#c9c4d6', alpha: 0.42, duration: 2.6 },
      },
    },
  },

  /** Pouvoir passif : salve de shurikens radiale à intervalle fixe. */
  ability: {
    id: 'webBurst',
    name: 'Salve de toiles',
    nameRef: 'Web Burst',
    cooldown: 5, // s entre deux salves hors Toile mère
    cooldownStep: 0, // pas d'accélération : c'est la stat « Damage/Slow » qui monte
    cooldownFloor: 5,
    burst: { count: 7, spread: Math.PI * 2, projectile: 'webShuriken' },
    /** Pendant la Toile mère, salves plus rapides et plus fournies (observé). */
    duringUltimate: { cooldown: 1.2, count: 10 },
  },

  ultimate: {
    id: 'broodweb',
    name: 'Toile mère',
    nameRef: 'BROODWEB',
    barLabel: 'BROODWEB',
    barLabelFr: 'TOILE MÈRE',
    barFill: '#e01f3a',
    barText: '#ffd7dc',
    barAnchor: 'right', // la jauge se remplit depuis la droite (observé)
    chargeRate: 5.4, // calé : Toile mère toutes les ~18 s comme dans la vidéo
    chargeOnHit: 2,
    duration: 5.2,
    shockwave: {
      // onde rouge qui dépasse largement l'arène au déclenchement (observé)
      from: 40,
      to: 900,
      time: 0.95,
      color: 'rgba(224,31,58,0.85)',
      width: 6,
    },
    field: {
      radius: 130, // mesuré : disque de ~130 px autour de l'Araignée
      fill: 'rgba(200,196,214,0.5)',
      edge: 'rgba(224,31,58,0.75)',
      edgeWidth: 3,
      follows: true, // la nappe de soie suit l'Araignée
      slow: 0.35,
      tickInterval: 0.7,
      tickDamage: 1,
    },
    /** `snow` côté moteur : ici ce sont les fils de soie qui dérivent. */
    snow: { count: 90, fall: 46, drift: 22, color: 'rgba(190,186,204,0.9)' },
  },

  projectiles: {
    webShuriken: {
      label: 'Shuriken-toile',
      glow: { radius: 10, core: '#ffd7dc', edge: '#e01f3a' },
      speed: 380,
      damage: 2,
      radius: 10,
      life: 3.4,
      bounces: 2, // les shurikens ricochent sur les murs (observé)
      knockback: 45,
      onHit: { slow: 0.12, slowDuration: 1.6 },
      trail: { color: 'rgba(190,186,204,0.55)', every: 0.035, life: 0.5, dotted: true },
    },
  },

  hud: {
    stat: (f) => `Web Damage/Slow: ${f.stacks}`,
    statFr: (f) => `Toile — dégâts/entrave : ${f.stacks}`,
    color: '#e01f3a',
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  OURS  (BEAR) — Berserker
 *  Chiffres relevés sur : vidéos « LIGHT vs FIRE » et « FIRE vs WATER ».
 * ========================================================================== */
const BEAR = {
  id: 'bear',
  name: 'OURS',
  nameRef: 'BEAR',
  tagline: 'Berserker — chaque morsure creuse une plaie qui saigne',
  icon: 'bearIcon',
  portrait: 'bearSprite',

  look: {
    radius: 41,
    body: '#a9713f', // brun du roster, éclairci pour rester lisible
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    aura: {
      color: 'rgba(200,48,42,0.48)',
      radius: 1.7,
      pulse: 3.2,
      showWhen: 'ultimate-ready',
    },
    flair: {
      ribbon: { color: '#c8302a', width: 18, alpha: 0.6 },
      motes: { rate: 13, size: 10, drift: 30, rise: -70, colors: ['#c8302a', '#8a5a34', '#54341c'] },
      impact: ['#e0bd97', '#c8302a', '#ffffff'],
      shape: 'spark',
      castFlash: 'rgba(200,48,42,0.6)',
    },
    trail: { color: 'rgba(138,90,52,0.3)', every: 0.05, life: 0.3 },
    accent: '#c8302a',
  },

  movement: { speed: 480, turnRate: 1.95, seek: 0.42, mass: 1 },

  weapon: {
    name: 'Gantelets griffus',
    reach: 150, // mesuré : ~166 px, ramené à l'échelle du roster
    spin: SPIN,
    spinDir: -1,
    /**
     * **Aucun manche visible** : le gantelet est chaussé à même la patte, il
     * part au ras de la boule. `width: 0` demande au moteur de ne rien tracer,
     * `length` place le sprite juste au bord du corps.
     */
    handle: {
      length: 98,
      width: 12,
      color: '#54341c',
      dark: '#2e1c0e',
      outline: '#150c08',
      gem: null,
    },
    head: { sprite: 'bearProjectile', scale: 6.5, anchorY: 0.5 }, // 8 × 6,5 = 52 px
    hitbox: { from: 0.5, to: 1, radius: 16 },
    melee: {
      damage: 5,
      cooldown: 1.15,
      knockback: 240,
      selfRecoil: 85,
      onHit: {
        // « Bleed Damage/Duration » monte de 0,5 par touche (1 → 5,5 mesuré)
        stackGain: 0.5,
        stackMax: 12,
        dot: {
          damage: (self) => Math.max(1, Math.round(self.stacks / 2.4)),
          interval: 1,
          duration: (self) => self.stacks, // la stat sert aussi de durée
          /**
           * Le saignement fait **les deux à la fois** : il colore la victime
           * *et* la cercle de rouge, pendant toute la durée. Reprend le double
           * effet relevé sur la brûlure d'origine (teinte à 0,72 + gros anneau).
           */
          ring: '#c8302a',
          tint: { color: '#c8302a', alpha: 0.72 },
        },
      },
    },
  },

  ability: {
    id: 'clawSweep',
    name: 'Revers de griffes',
    nameRef: 'Claw Sweep',
    cooldown: 3.6,
    cooldownStep: 0,
    cooldownFloor: 3.6,
    burst: { count: 3, spread: 0.55, projectile: 'clawRip' },
  },

  ultimate: {
    id: 'feralRage',
    name: 'Rage sauvage',
    nameRef: 'FERAL RAGE',
    barLabel: 'FERAL RAGE',
    barLabelFr: 'RAGE SAUVAGE',
    barFill: '#c8302a',
    barText: '#ffe9cf',
    /** Cycle de jauge mesuré : la Rage revient toutes les 25 à 27 s. */
    chargeRate: 3.8,
    chargeOnHit: 1,
    duration: 6,
    /** Nova de cubes à l'incantation (observée image par image). */
    nova: { count: 90, speed: 460, size: 13, life: 1.1, colors: ['#c8302a', '#8a5a34', '#e0bd97', '#54341c'] },
    /** `wings` côté moteur : ici la crinière hérissée du berserker. */
    wings: { color: '#c8302a', core: '#e0bd97', span: 2.3, flap: 6 },
    /** Aura de rage : tout adversaire trop près se met à saigner. */
    aura: { radius: 150, tickInterval: 0.6, tickDamage: 2 },
    speedBonus: 1.2,
  },

  projectiles: {
    clawRip: {
      label: 'Lacération',
      glow: { radius: 12, core: '#ffe9cf', edge: '#c8302a' },
      speed: 520,
      damage: 4,
      radius: 11,
      life: 1.3,
      bounces: 0,
      knockback: 90,
      onHit: {
        dot: { damage: 1, interval: 1, duration: 2, ring: '#c8302a', tint: { color: '#c8302a', alpha: 0.72 } },
      },
      trail: { color: 'rgba(200,48,42,0.45)', every: 0.03, life: 0.3 },
    },
  },

  progression: { stack: 1, stack2: 0 },

  hud: {
    stats: [(f) => `Bleed Damage/Duration: ${formatHalf(f.stacks)}`],
    statsFr: [(f) => `Saignement — dégâts/durée : ${formatHalf(f.stacks)}`],
    color: '#c8302a',
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  TORTUE  (TURTLE) — Forteresse
 *  Chiffres relevés sur : vidéos « LIGHT vs FIRE », « LIGHT vs DARK », « LIGHT vs LIGHTNING ».
 * ========================================================================== */
const TURTLE = {
  id: 'turtle',
  name: 'TORTUE',
  nameRef: 'TURTLE',
  tagline: 'Forteresse — carapace qui riposte et masse qui projette',
  icon: 'turtleIcon',
  portrait: 'turtleSprite',

  look: {
    radius: 41,
    body: '#3f9e6b', // jade du roster
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    /**
     * Halo doré : dès que la Chaîne de jade est chargée, **c'est la Tortue
     * elle-même** qui s'entoure d'or, et il reste allumé pendant tout le trait.
     * La cible, elle, n'est pas teintée.
     */
    aura: {
      color: 'rgba(232,192,74,0.62)',
      radius: 2.3,
      pulse: 1.2,
      showWhen: 'ultimate-ready',
    },
    /**
     * La Carapace ne se voit pas comme une bulle grise : elle se lit sur le
     * **liseré doré** de la boule, qui s'épaissit avec le pool.
     */
    shield: { color: 'rgba(232,192,74,0.6)', glow: 'rgba(232,192,74,0.12)' },
    flair: {
      ribbon: { color: '#e8c04a', width: 19, alpha: 0.6 },
      motes: { rate: 10, size: 9, drift: 22, rise: -20, colors: ['#e8c04a', '#3f9e6b', '#9a7418'] },
      impact: ['#a9ecc6', '#e8c04a', '#ffffff'],
      shape: 'streak',
      castFlash: 'rgba(232,192,74,0.7)',
    },
    trail: { color: 'rgba(63,158,107,0.28)', every: 0.05, life: 0.26 },
    accent: '#e8c04a',
  },

  // bouclier lourd : la Tortue est la combattante la plus lente du roster
  movement: { speed: 415, turnRate: 1.6, seek: 0.46, mass: 1 },

  weapon: {
    name: 'Bouclier lourd',
    reach: 155, // mesuré : ~159 px
    spin: SPIN,
    spinDir: 1,
    /** Bras court : ~31 px visibles au-delà de la boule (mesuré). */
    handle: {
      length: 93,
      width: 11,
      color: '#5c7a63',
      dark: '#2f4235',
      outline: '#0c1a12',
      gem: { at: 0.62, size: 9, color: '#e8c04a' },
    },
    head: { sprite: 'turtleProjectile', scale: 7.75, anchorY: 0.5 }, // 8 × 7,75 = 62 px
    hitbox: { from: 0.58, to: 1, radius: 22 },
    melee: {
      /**
       * **Les dégâts du bouclier SONT la stat « Shell Damage ».**
       * Vérifié image par image : à `Shell Damage: 3` la cible perd 3 PV,
       * à 4-5 elle en perd 5. La Tortue commence donc à 1 dégât par coup et
       * ne devient dangereuse qu'après avoir encaissé.
       */
      damage: (self) => Math.max(1, Math.round(self.stacks)),
      cooldown: 1.5, // arme lourde : la cadence la plus lente du roster
      /** Le recul suit la stat « Knockback » du HUD (1500 → 5400 mesuré). */
      knockback: (self) => 210 + self.stacks2 * 0.05,
      selfRecoil: 60,
      // aucune progression ici : les deux stats montent quand la Tortue
      // ENCAISSE, pas quand elle frappe (voir ability.shield ci-dessous)
    },
  },

  /**
   * Carapace — bouclier **permanent et passif** : elle absorbe, riposte, et
   * surtout **convertit ce qu'elle encaisse en puissance**.
   *
   * Mesuré : la Tortue reste à 100 PV pendant 11 s sous les coups, et à
   * chaque coup encaissé ses deux compteurs montent d'un cran (+1 dégât,
   * +300 de recul) pendant que l'attaquant perd 1 PV. Aucune onde de choc
   * périodique : la Carapace n'a pas d'incantation.
   */
  ability: {
    id: 'carapace',
    name: 'Carapace',
    nameRef: 'Carapace',
    /** Rythme de rechargement du pool (le « sort » ne fait que le remplir). */
    cooldown: 9,
    cooldownStep: 0,
    cooldownFloor: 9,
    shield: {
      /** Capacité = base + « Shell Damage » : la carapace grossit avec la stat. */
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
       * dégâts de zone ou sur la durée (toile, saignement) ne font pas monter
       * les compteurs, ce qui a été vérifié pendant une nappe de 30 PV.
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
    id: 'jadeChain',
    name: 'Chaîne de jade',
    nameRef: 'JADE CHAIN',
    barLabel: 'JADE CHAIN',
    barLabelFr: 'CHAÎNE DE JADE',
    barFill: '#e8c04a',
    barText: '#22603f',
    chargeRate: 3.2,
    chargeOnHit: 3,
    duration: 5,
    snare: {
      color: '#e8c04a',
      glow: 'rgba(232,192,74,0.55)',
      width: 7,
      gap: 5, // double trait doré (observé)
      /**
       * **La cible n'est pas teintée.** La proie enchaînée garde sa couleur
       * propre et son halo : c'est la Tortue qui s'allume (voir `look.aura`).
       * Le trait doré est le seul effet posé sur l'adversaire.
       */
      tint: null,
      tintAlpha: 0,
      slow: 0.55,
      /** Drain mesuré : 1 PV par seconde, pas davantage. */
      tickInterval: 1,
      tickDamage: 1,
      /** La chaîne tire la cible vers la Tortue. */
      pull: 90,
    },
  },

  projectiles: {},

  progression: { stack: 1, stack2: 1500 },

  hud: {
    stats: [
      (f) => `Shell Damage: ${Math.round(f.stacks)}`,
      (f) => `Knockback: ${Math.round(f.stacks2)}`,
    ],
    statsFr: [
      (f) => `Dégâts de carapace : ${Math.round(f.stacks)}`,
      (f) => `Recul : ${Math.round(f.stacks2)}`,
    ],
    color: '#c9a227',
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  FAUCON  (HAWK) — Zoner
 *  Chiffres relevés sur : vidéo « WIND vs PLANT ».
 * ========================================================================== */
const HAWK = {
  id: 'hawk',
  name: 'FAUCON',
  nameRef: 'HAWK',
  tagline: 'Zoner — le plus rapide, rafales et traits de vent',
  icon: 'hawkIcon',
  portrait: 'hawkSprite',

  look: {
    radius: 41,
    body: '#5fd0e8', // cyan du roster
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    aura: {
      color: 'rgba(95,208,232,0.55)',
      radius: 1.6,
      pulse: 2.6,
      showWhen: 'ability-ready',
    },
    flair: {
      ribbon: { color: '#eafcff', width: 20, alpha: 0.5 },
      motes: { rate: 11, size: 9, drift: 46, rise: -6, colors: ['#5fd0e8', '#2a7590', '#eafcff'] },
      impact: ['#eafcff', '#ffffff', '#2a7590'],
      shape: 'streak',
      castFlash: 'rgba(234,252,255,0.6)',
    },
    trail: { color: 'rgba(95,208,232,0.32)', every: 0.035, life: 0.3 },
    accent: '#eafcff',
  },

  // le plus rapide et le plus manœuvrant du roster (observé)
  movement: { speed: 500, turnRate: 2.2, seek: 0.4, mass: 1 },

  weapon: {
    name: 'Arc de vent',
    reach: 105, // mesuré : ~120 px, arme collée au corps
    spin: SPIN * 1.1, // tourne plus vite que les autres (observé)
    spinDir: 1,
    /**
     * **Aucun manche.** L'arc est tenu à même la serre : `width: 0` demande au
     * moteur de ne rien dessiner et `length` ne sert plus qu'à décoller le
     * sprite du centre (34 px → extrémité interne cachée sous le corps,
     * extrémité externe à 108 px, soit la portée relevée).
     */
    handle: { length: 45, width: 0, color: '#2a7590', dark: '#123a49', outline: '#0b1a22', gem: null },
    head: { sprite: 'hawkProjectile', scale: 7.5, anchorY: 0.5 }, // 8 × 7,5 = 60 px
    hitbox: { from: 0.45, to: 1, radius: 18 },
    melee: {
      damage: 3,
      cooldown: 1, // cadence la plus rapide du roster
      knockback: 205,
      selfRecoil: 70,
      onHit: { slow: 0.12, slowDuration: 1.2 },
    },
  },

  /** Bourrasque : la stat monte et la recharge descend à chaque incantation. */
  ability: {
    id: 'gale',
    name: 'Bourrasque',
    nameRef: 'Gale',
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
    // clé `tornado` côté moteur (game/abilities/hawk.js) : c'est le coup
    // d'aile du Faucon, gardé sous son nom d'origine pour ne pas toucher au
    // module — seule l'identité change, pas la mécanique
    tornado: {
      /**
       * **Rafale, pas une zone.** Détection automatique sur trois vidéos :
       * la bourrasque n'existe que 4 à 6 images (0,13 → 0,20 s) et son centre
       * est toujours à moins de 30 px du Faucon — c'est un tourbillon qu'il
       * déclenche *autour de lui*, pas un vortex lancé sur l'adversaire.
       */
      radius: 125, // mesuré : ~120-130 px de diamètre visible
      duration: 0.2,
      knockback: 430, // la rafale projette au lieu d'aspirer
      /** « Gale Damage » du HUD, ramené à l'échelle des PV. */
      damage: (self) => Math.max(2, Math.round(self.stacks / 2)),
      damageGain: 2, // mesuré : 10 → 24 par pas de 2
      damageMax: 24, // plafond mesuré, apparié au plancher de 0,5 s
      /**
       * Aspect relevé : un **disque flou** composé de larges pales en éventail
       * qui rayonnent du centre, sans le moindre contour — pas des cercles
       * concentriques. Le cœur est plus dense et plus clair.
       */
      color: 'rgba(95,208,232,0.42)',
      edge: 'rgba(42,117,144,0.42)', // le disque garde un bord net sur la vidéo
      core: 'rgba(234,252,255,0.6)',
      blades: 9, // pales de l'éventail (comptées sur la vidéo)
    },
  },

  ultimate: {
    id: 'skyVolley',
    name: 'Salve céleste',
    nameRef: 'SKY VOLLEY',
    barLabel: 'SKY VOLLEY',
    barLabelFr: 'SALVE CÉLESTE',
    barFill: '#5fd0e8',
    barText: '#0b1a22',
    /** Cycle de jauge mesuré : ~8 à 10 s entre deux décharges. */
    chargeRate: 11,
    chargeOnHit: 2,
    /**
     * Décharge **courte et dense** : sur la vidéo, la cible perd ~16 PV en
     * une seconde et demie au moment où la jauge se vide.
     */
    duration: 1.5,
    volley: { interval: 0.3, count: 2, spread: 1.1, projectile: 'windArrow' },
    speedBonus: 1.25,
  },

  projectiles: {
    windArrow: {
      label: 'Trait de vent',
      // le plus effilé du roster : c'est un trait, pas une bille
      glow: { radius: 12, core: '#ffffff', edge: '#5fd0e8', stretch: 1.9 },
      speed: 430,
      damage: 4,
      radius: 12,
      life: 2.2,
      bounces: 1,
      knockback: 80,
      trail: { color: 'rgba(95,208,232,0.4)', every: 0.04, life: 0.32 },
    },
  },

  progression: { stack: 10, stack2: 0 },

  hud: {
    stats: [
      (f) => `Gale Damage: ${Math.round(f.stacks)}`,
      (f) => `Cooldown: ${formatSeconds(f.ability.cooldown)}`,
    ],
    statsFr: [
      (f) => `Dégâts de bourrasque : ${Math.round(f.stacks)}`,
      (f) => `Recharge : ${formatSeconds(f.ability.cooldown)}`,
    ],
    color: '#2a7590',
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  TIGRE  (TIGER) — Combo
 *  Chiffres relevés sur : vidéo « LIGHT vs LIGHTNING ».
 * ========================================================================== */
const TIGER = {
  id: 'tiger',
  name: 'TIGRE',
  nameRef: 'TIGER',
  tagline: 'Combo — marque ses proies et enchaîne les frappes',
  icon: 'tigerIcon',
  portrait: 'tigerSprite',

  look: {
    radius: 41,
    body: '#f0871f', // orange du roster
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    /**
     * Halo blanc **permanent** : la boule orange du Tigre le porte du début à
     * la fin du duel, y compris quand aucun combo n'est en cours — c'est sa
     * signature à l'écran.
     */
    aura: {
      color: 'rgba(255,246,232,0.55)',
      radius: 2.4,
      pulse: 0.7, // respiration lente : le halo ne clignote pas
      showWhen: 'always',
    },
    flair: {
      ribbon: { color: '#ffd9a8', width: 16, alpha: 0.65 },
      motes: { rate: 12, size: 8, drift: 40, rise: -10, colors: ['#f0871f', '#b3560c', '#fff6e8'] },
      impact: ['#fff6e8', '#f0871f', '#ffffff'],
      shape: 'streak',
      castFlash: 'rgba(255,246,232,0.65)',
    },
    trail: { color: 'rgba(240,135,31,0.3)', every: 0.045, life: 0.24 },
    accent: '#fff6e8',
  },

  movement: { speed: 500, turnRate: 2, seek: 0.42, mass: 1 },

  weapon: {
    name: 'Katars jumeaux',
    reach: 145,
    spin: SPIN,
    spinDir: -1,
    /** Longue poignée de **cuir fauve** au contour noir (mesuré). */
    handle: { length: 89, width: 10, color: '#5a3a1c', dark: '#2f1e0c', outline: '#1a0d04', gem: null },
    head: { sprite: 'tigerProjectile', scale: 7, anchorY: 0.5 }, // 8 × 7 = 56 px
    hitbox: { from: 0.52, to: 1, radius: 17 },
    melee: {
      damage: 3,
      cooldown: 1,
      knockback: 230,
      selfRecoil: 80,
      onHit: {
        stackGain: 0.5, // « Combo Damage » : 1 → 4,5 mesuré
        stackMax: 14,
        /** Chaque touche laisse une marque à l'impact (observé). */
        dropNode: true,
      },
    },
  },

  ability: {
    id: 'scentMark',
    name: 'Marque de sang',
    nameRef: 'Scent Mark',
    cooldown: 3,
    cooldownStep: 0,
    cooldownFloor: 3,
    node: {
      max: 8, // au-delà, la plus ancienne disparaît
      life: 16,
      // le masque du tigre, pas ses lames : au sol, un katar se lisait comme
      // une arme tombée là plutôt que comme une marque laissée par la bête
      sprite: 'tigerIcon',
      /** mesuré : marque de 34 × 34 px (8 cellules × 4,2). */
      scale: 4.2,
    },
    chain: {
      interval: 1.6, // cadence des relances hors ultime
      range: 270, // portée marque → cible
      color: 'rgba(255,246,232,0.95)',
      glow: 'rgba(240,135,31,0.45)',
      width: 5,
      jitter: 14,
      /**
       * Rémanence du trait à l'écran : la toile reste lisible ~0,45 s après
       * chaque relance — c'est ce qui rend le réseau de marques visible en
       * permanence pendant la Frénésie.
       */
      life: 0.45,
      slow: 0.18,
      slowDuration: 0.8,
    },
  },

  ultimate: {
    id: 'frenzy',
    name: 'Frénésie',
    nameRef: 'FRENZY',
    barLabel: 'FRENZY',
    barLabelFr: 'FRÉNÉSIE',
    barFill: '#f0871f',
    barText: '#1a0d04',
    chargeRate: 5.2,
    chargeOnHit: 2,
    duration: 5,
    chainInterval: 0.5, // le réseau claque en continu
    rangeBonus: 1.5,
    speedBonus: 1.15,
  },

  projectiles: {},

  progression: { stack: 1, stack2: 0 },

  hud: {
    stats: [(f) => `Combo Damage: ${formatHalf(f.stacks)}`],
    statsFr: [(f) => `Dégâts de combo : ${formatHalf(f.stacks)}`],
    color: '#d4700f',
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  CERF  (DEER) — Mystique
 *  Chiffres relevés sur : vidéo « FIRE vs WATER ».
 * ========================================================================== */
const DEER = {
  id: 'deer',
  name: 'CERF',
  nameRef: 'DEER',
  tagline: 'Mystique — ouvre des cercles sacrés qui aspirent et grandissent',
  icon: 'deerIcon',
  portrait: 'deerSprite',

  look: {
    radius: 41,
    body: '#19b98a', // émeraude du roster
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    aura: {
      color: 'rgba(25,185,138,0.5)',
      radius: 1.65,
      pulse: 1.6,
      showWhen: 'ultimate-ready',
    },
    flair: {
      ribbon: { color: '#9dffd6', width: 18, alpha: 0.55 },
      motes: { rate: 9, size: 9, drift: 24, rise: 22, colors: ['#12a06b', '#9dffd6', '#0a6344'] },
      impact: ['#eafff5', '#9dffd6', '#0a6344'],
      shape: 'dot',
      castFlash: 'rgba(157,255,214,0.6)',
    },
    trail: { color: 'rgba(25,185,138,0.32)', every: 0.045, life: 0.3 },
    accent: '#9dffd6',
  },

  movement: { speed: 455, turnRate: 1.8, seek: 0.45, mass: 1 },

  weapon: {
    name: 'Lance lumineuse',
    reach: 150,
    spin: SPIN,
    spinDir: 1,
    handle: { length: 102, width: 11, color: '#4a7a5f', dark: '#25453a', outline: '#07190f', gem: { at: 0.5, size: 8, color: '#9dffd6' } },
    head: { sprite: 'deerProjectile', scale: 6, anchorY: 0.5 }, // 8 × 6 = 48 px
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
    id: 'sacredCircle',
    name: 'Cercle sacré',
    nameRef: 'Sacred Circle',
    cooldown: 6,
    cooldownStep: 0,
    cooldownFloor: 6,
    // clés `whirlpool` / `maelstrom` côté moteur (abilities/deer.js) : gardées
    // sous leur nom d'origine, la mécanique du tourbillon étant reprise telle
    // quelle — seule l'identité change
    whirlpool: {
      max: 2, // deux cercles simultanés au plus
      life: 7.5,
      /** Rayon piloté par la stat « Size » du HUD. */
      radius: (self) => self.stacks2 * 0.9,
      pull: 60,
      tickInterval: 1.2,
      tickDamage: (self) => Math.max(1, Math.round(self.stacks * 0.6)),
      /**
       * Aspect : une **spirale en pixels opaque** (sprite `sacredCircle`), pas
       * un dégradé — disque émeraude, bras sous-bois sur deux tours et demi,
       * gros contour. Elle tourne lentement sur place.
       */
      edge: 'rgba(7,25,15,0.75)', // onde d'apparition, au ton du contour
      spin: 1.1, // rotation lente, mesurée sur la spirale de la vidéo
    },
    /** Chaque cercle essaime des lucioles. */
    spray: { interval: 1.8, count: 1, projectile: 'lightMote' },
  },

  ultimate: {
    id: 'greatRite',
    name: 'Grand rite',
    nameRef: 'GREAT RITE',
    barLabel: 'GREAT RITE',
    barLabelFr: 'GRAND RITE',
    barFill: '#19b98a',
    barText: '#eafff5',
    chargeRate: 4.2,
    chargeOnHit: 3,
    duration: 5.5,
    maelstrom: {
      radius: 200,
      pull: 170,
      tickInterval: 0.8,
      tickDamage: (self) => Math.max(2, Math.round(self.stacks)),
      spin: 1.7, // même spirale, deux fois plus grande et un peu plus vive
      edge: 'rgba(7,25,15,0.85)',
    },
  },

  projectiles: {
    lightMote: {
      label: 'Luciole',
      glow: { radius: 11, core: '#eafff5', edge: '#19b98a' },
      speed: 330,
      damage: 1,
      radius: 9,
      life: 2,
      bounces: 1,
      knockback: 45,
      trail: { color: 'rgba(157,255,214,0.5)', every: 0.04, life: 0.35, dotted: true },
    },
  },

  progression: { stack: 1, stack2: 70 },

  hud: {
    stats: [
      (f) => `Circle Damage: ${Math.round(f.stacks)}`,
      (f) => `Size: ${Math.round(f.stacks2)}`,
    ],
    statsFr: [
      (f) => `Dégâts du cercle : ${Math.round(f.stacks)}`,
      (f) => `Taille : ${Math.round(f.stacks2)}`,
    ],
    color: '#12a06b',
    stroke: '#f4eddc', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
};

/* ==========================================================================
 *  SERPENT  (SNAKE) — Embuscade
 *  Chiffres relevés sur : vidéos « PLANT vs FIRE », « ICE vs PLANT », « DARK vs PLANT »
 *  et « WIND vs PLANT ».
 * ========================================================================== */
const SNAKE = {
  id: 'snake',
  name: 'SERPENT',
  nameRef: 'SNAKE',
  tagline: 'Embuscade — pond des œufs qui blessent l’un et soignent l’autre',
  icon: 'snakeIcon',
  portrait: 'snakeSprite',

  look: {
    radius: 41,
    body: '#7b3fb5', // violet du roster
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    aura: {
      color: 'rgba(182,240,58,0.5)',
      radius: 1.65,
      pulse: 1.5,
      showWhen: 'ultimate-ready',
    },
    flair: {
      ribbon: { color: '#b6f03a', width: 19, alpha: 0.55 },
      motes: { rate: 9, size: 10, drift: 26, rise: -18, colors: ['#7b3fb5', '#b6f03a', '#48206e'] },
      impact: ['#b6f03a', '#e0c4ff', '#f6ecff'],
      shape: 'dot',
      castFlash: 'rgba(182,240,58,0.6)',
    },
    trail: { color: 'rgba(123,63,181,0.28)', every: 0.05, life: 0.28 },
    accent: '#b6f03a',
  },

  movement: { speed: 445, turnRate: 1.7, seek: 0.45, mass: 1 },

  /**
   * Le fouet est **courbe** : ce n'est pas un sprite mais un tracé, dessiné
   * par game/abilities/snake.js (`drawWeapon`). Le reste de la fiche décrit
   * quand même sa géométrie, dont se sert la détection de touche.
   */
  weapon: {
    name: 'Fouet toxique',
    reach: 160, // mesuré : ~164 px
    spin: SPIN,
    spinDir: 1,
    /** Amorce du fouet : ~30 px visibles au-delà de la boule (mesuré). */
    handle: { length: 73, width: 13, color: '#5a3a6a', dark: '#38204a', outline: '#140a1c', gem: null },
    head: { sprite: null, scale: 1, anchorY: 0.5 },
    /**
     * Tracé du fouet, **rasterisé en escalier de pixels** par
     * game/abilities/snake.js : pas une courbe lisse mais une suite de blocs,
     * exactement comme les autres armes.
     *
     * Géométrie obtenue en faisant passer un cercle par trois points relevés
     * (départ, crête, extrémité droite) : centre à 41 px devant l'amorce,
     * **rayon 46,7 px**, balayage de 207° à 358°. Le fouet monte, passe la
     * crête et redescend en crochet ; sa pointe tombe pile sur la portée
     * mesurée (160 px), crête 38 px au-dessus de l'axe et crochet 34 px en
     * dessous — les trois cotes de la vidéo.
     *
     * Clé `vine` côté moteur : conservée telle quelle, seul le tracé change
     * de couleur.
     */
    vine: {
      radius: 46, // mesuré (ajustement de cercle : 46,7)
      start: 3.62, // rad (≈207°)
      sweep: 2.64, // rad (≈151°) : montée + crête + crochet
      width: 20, // épaisseur du corps au plus large (mesuré ~20 px)
      /**
       * Taille d'un « pixel » de l'escalier (mesuré ~4,2 px). Le contour doit
       * dépasser d'au moins **un bloc et quart**, sinon la quantification
       * l'avale par endroits et le fouet perd son liseré noir.
       */
      block: 4,
      outlineWidth: 5.2,
      outline: '#140a1c',
      body: '#7b3fb5', // corps violet
      light: '#9d63d4', // écailles éclairées
      shine: '#b6f03a', // venin qui perle le long du fouet
    },
    hitbox: { from: 0.42, to: 1, radius: 22 },
    melee: {
      damage: 3,
      cooldown: 1.15,
      knockback: 235,
      selfRecoil: 80,
      onHit: {
        stackGain: 1, // « Egg Damage/Heal » : 1 → 8 mesuré
        stackMax: 14,
      },
    },
  },

  /** Œufs pondus dans l'arène : mine pour l'adversaire, soin pour le Serpent. */
  ability: {
    id: 'clutch',
    name: 'Ponte',
    nameRef: 'Clutch',
    cooldown: 5,
    cooldownStep: 0,
    cooldownFloor: 5,
    // clé `bulb` côté moteur (abilities/snake.js) : mécanique reprise telle
    // quelle, l'œuf remplace le bulbe
    bulb: {
      max: 4,
      life: 18,
      // œuf et crachat sont la même matière : un seul sprite, deux échelles
      sprite: 'snakeProjectile',
      scale: 3.4, // mesuré : cosse de ~29 × 37 px → 8 cellules
      /** Rayon de déclenchement (pour les deux camps). */
      radius: 36,
      /**
       * Délai d'amorçage : sans lui, le Serpent ramasserait son propre œuf
       * à l'instant où il le pond. Le temps qu'il éclose, il est reparti.
       */
      armDelay: 0.9,
      /** Une fois éclos, l'œuf crache du venin sur l'adversaire. */
      shootInterval: 2.2,
      shootRange: 460,
      projectile: 'venomSpit',
      /** Dégâts à l'adversaire et soin au Serpent : la stat du HUD. */
      damage: (self) => Math.max(1, Math.round(self.stacks)),
      heal: (self) => Math.max(1, Math.round(self.stacks * 0.8)),
      slow: 0.25,
      slowDuration: 1.6,
    },
  },

  ultimate: {
    id: 'venomStorm',
    name: 'Nuée de venin',
    nameRef: 'VENOM STORM',
    barLabel: 'VENOM STORM',
    barLabelFr: 'NUÉE DE VENIN',
    barFill: '#7b3fb5',
    barText: '#eaffc4',
    chargeRate: 4,
    chargeOnHit: 3,
    duration: 5,
    storm: {
      /**
       * **Nuée de cubes acides opaques.** Reprend la géométrie relevée sur la
       * tempête d'origine : des carrés plats parfaitement alignés sur les axes,
       * sans contour ni dégradé, assez serrés pour masquer complètement la
       * cible. Longueur des segments : 9 à 21 px vidéo, soit 11 à 26 px de
       * scène. La nuée **est** la tempête, à laquelle s'ajoutent quelques
       * gouttes plus grosses qui volent avec elle.
       */
      petals: { rate: 60, size: 13, speed: 210, life: 1, colors: ['#b6f03a', '#9ad424', '#cdf76a'] },
      /**
       * Amas dessiné par-dessus les particules (rendu pur, sans aléa simulé) :
       * des **grappes** de cubes, plus quelques gouttes de venin.
       */
      swarm: {
        clusters: 17, // grappes qui tournent autour de la cible
        perCluster: 6, // cubes par grappe
        radius: 2.6, // portée, en rayons de la cible
        spread: 18, // dispersion d'une grappe, en px
        size: 17,
        sizeVar: 0.5,
        churn: 1.9,
        color: '#b6f03a',
        flowers: 4, // grosses gouttes emportées par la nuée
        flowerSize: 42,
      },
      root: 0.7, // la cible est quasiment clouée sur place
      tickInterval: 0.7,
      tickDamage: (self) => Math.max(1, Math.round(self.stacks / 4)),
      /** Le Serpent se régénère pendant sa nuée. */
      healInterval: 1,
      healAmount: 1,
    },
  },

  projectiles: {
    venomSpit: {
      label: 'Crachat de venin',
      glow: { radius: 13, core: '#eaffc4', edge: '#b6f03a' },
      speed: 340,
      damage: 2,
      radius: 12,
      life: 2.4,
      bounces: 0,
      knockback: 60,
      trail: { color: 'rgba(182,240,58,0.45)', every: 0.04, life: 0.4 },
    },
  },

  progression: { stack: 1, stack2: 0 },

  hud: {
    stats: [(f) => `Egg Damage/Heal: ${Math.round(f.stacks)}`],
    statsFr: [(f) => `Œuf — dégâts/soin : ${Math.round(f.stacks)}`],
    color: '#9d5bd8',
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
  wolf: WOLF,
  turtle: TURTLE,
  hawk: HAWK,
  snake: SNAKE,
  bear: BEAR,
  tiger: TIGER,
  spider: SPIDER,
  deer: DEER,
});

/** Ordre d'affichage dans l'écran de sélection. */
export const ROSTER = deepFreeze([
  'wolf',
  'turtle',
  'hawk',
  'snake',
  'bear',
  'tiger',
  'spider',
  'deer',
]);

/** @param {string} id */
export function getElement(id) {
  const el = ELEMENTS[id];
  if (!el) throw new Error(`Bête inconnue : ${id}`);
  return el;
}
