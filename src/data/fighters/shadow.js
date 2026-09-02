import { fiche, SPIN } from '../defaults.js';
import { formatSeconds } from '../format.js';

/* ==========================================================================
 *  OMBRE  (DARK)
 * ========================================================================== */
export const SHADOW = fiche({
  id: 'shadow',
  name: 'OMBRE',
  nameRef: 'DARK', // libellé de la vidéo de référence
  tagline: 'Assassin — se déplace par pas d’ombre et draine l’essence',
  taglineRef: 'Assassin — shadow-steps into the blind spot and drains the essence',
  icon: 'orbDark',

  /* ---------- APPARENCE ---------- */
  look: {
    body: '#870286', // pipette : rgb(132,6,132)
    bodyHit: '#ffffff', // flash blanc à l'encaissement (observé)
    outline: '#0a0a0a',
    hpColor: '#0a0a0a',
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
    head: { sprite: 'darkBlade', scale: 3.0 },
    /** Portion tranchante (fraction de la portée) + demi-épaisseur. */
    hitbox: { from: 0.42, radius: 13 },
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
  },
});
