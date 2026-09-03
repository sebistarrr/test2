import { fiche } from '../defaults.js';
import { formatHalf } from '../format.js';

/* ==========================================================================
 *  COLOSSE  (JUGGERNAUT)  — conçu, pas relevé
 *
 *  Premier combattant du dépôt qui ne vienne d'aucune vidéo : il n'y a rien à
 *  mesurer chez lui, **tout est `calé` ou `déduit`**, et sa fiche le dit à
 *  chaque valeur. C'est aussi ce qui le rend facile à régler — aucune de ses
 *  valeurs n'est sanctuarisée par un relevé.
 *
 *  Il occupe trois places vides du roster :
 *   • **il pèse**. `movement.mass` figurait dans les cinq fiches sans que
 *     personne ne le lise ; il est le premier à ne pas valoir 1, et c'est lui
 *     qui a donné un lecteur à cette clé (`physics.js`) ;
 *   • **son corps est son arme.** Personne d'autre ne blesse par la collision
 *     des corps. Le pavois n'est qu'un bélier : il pousse, il ne tranche pas ;
 *   • **sa stat dépend de la géométrie de l'arène**, pas du temps ni des
 *     touches. Lancé en ligne droite il devient un train ; acculé dans un coin
 *     il ne vaut rien.
 * ========================================================================== */
export const COLOSSUS = fiche({
  id: 'colossus',
  name: 'COLOSSE',
  nameRef: 'JUGGERNAUT',
  tagline: 'Masse — écrase par la charge, s’effondre dans un coin',
  taglineRef: 'Mass — crushes on the charge, worthless in a corner',
  icon: 'iconPavise',

  look: {
    /** Ardoise froide. Il fallait un corps **sombre et mat** : c'est le seul
     *  du roster qui n'a ni feu, ni givre, ni sève — rien qui brille. Assez
     *  foncé pour porter un chiffre de PV en crème sur l'arène blanche. */
    body: '#3d4657',
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    hpColor: '#f5f2ea',
    aura: {
      color: 'rgba(169,180,199,0.4)',
      radius: 1.55,
      pulse: 1.2, // lente : rien chez lui ne va vite
      showWhen: 'ultimate-ready',
    },
    /** Gamme prise sur le pavois : fer, reflet clair, bronze de l'umbo. Une
     *  seule couleur chaude, celle de l'umbo, et elle ne sert qu'aux impacts —
     *  c'est là que le métal cogne. */
    flair: {
      ribbon: { color: '#5b6473', width: 22, alpha: 0.45 },
      motes: { rate: 7, size: 11, drift: 18, rise: -8, colors: ['#39404e', '#5b6473', '#8b96a7'] },
      impact: ['#d9a441', '#8b96a7', '#ffffff'],
      shape: 'dot',
      castFlash: 'rgba(139,150,167,0.55)',
    },
    trail: { color: 'rgba(61,70,87,0.3)', every: 0.05, life: 0.34 },
    accent: '#5b6473',
  },

  /**
   * **Le plus lent et le plus lourd.** 330 px/s contre 430 à 560 pour les
   * autres, virage 1,1 rad/s contre 1,7 à 2,2 : il ne rattrape personne et ne
   * corrige pas sa trajectoire. En échange `seek: 0.65` — quand il choisit une
   * direction, il y va tout droit, ce qui est exactement ce que son élan
   * demande.
   *
   * **`mass: 3` est la première dérogation du dépôt à `mass: 1`.**
   * `physics.js` répartit la séparation et la poussée au prorata : contre un
   * corps de masse 1 il prend un quart du recul et en rend trois quarts. Il ne
   * traverse pas l'adversaire, il le **pousse**.
   */
  movement: { speed: 330, turnRate: 1.1, seek: 0.65, mass: 3 },

  weapon: {
    name: 'Pavois',
    nameRef: 'Tower Shield',
    /**
     * **L'arme suit le cap**, comme la lance du Lancier : `spin: 0` et c'est
     * `abilities/colossus.js` qui recopie `heading`. Un bouclier ne vise pas,
     * il se met **devant** — c'est le même geste que la charge, et ça évite le
     * piège de l'arme braquée, puisqu'il ne pointe jamais volontairement.
     */
    spin: 0,
    spinDir: 1,
    /**
     * Portée **86 px, la plus courte du roster** (le Shinobi est à 70 mais son
     * arme fait le tour de sa bille). La carte fait 15 cellules × `scale: 3`,
     * soit 45 px dessinés, donc le manche démarre à 41 : le pavois est tenu à
     * bout de bras, la plaque est loin du corps.
     *
     * `width: 0` : il n'y a pas de manche à tracer, le sprite est la totalité
     * de l'arme.
     */
    reach: 86,
    handle: { length: 41, width: 0, color: '#5a4632', dark: '#39404e', outline: '#141118', gem: null },
    /** `scale: 3` : 15 × 34 cellules deviennent 45 × 102 px. Le pavois est plus
     *  **haut** que long, seul du roster — c'est un mur, pas une pointe. */
    head: { sprite: 'colossusShield', scale: 3 },
    /**
     * **La hitbox la plus large du jeu** : rayon 44, soit la demi-hauteur de la
     * plaque. Elle ne couvre que la plaque elle-même (`from: 0.48`, les 45 px
     * dessinés), pas le bras.
     *
     * Un bouclier qui touche large **doit** frapper faible, sinon il devient
     * une faux. D'où des dégâts de mêlée bas et un verrou long : l'essentiel de
     * ses dégâts passe par la charge, pas par le pavois.
     */
    hitbox: { from: 0.48, radius: 44 },
    melee: {
      damage: 3,
      cooldown: 1.5,
      /** Recul énorme, le double du roster : c'est un bouclier de choc. */
      knockback: 420,
      /** Recul **sur lui-même quasi nul** : la masse, encore. Il encaisse le
       *  choc sans reculer, ce que `selfRecoil` dit à sa façon. */
      selfRecoil: 25,
    },
  },

  /* ---------- POUVOIR — passif : l'Élan ---------- */
  /**
   * **Élan** — la stat du HUD, et toute son identité.
   *
   * Elle monte tant qu'il **avance en ligne droite** et retombe à zéro dès
   * qu'il tourne sec, touche un mur ou percute un corps. C'est la première
   * stat du dépôt qui dépende de la **géométrie de l'arène** plutôt que du
   * temps (Mage), des touches portées (Lancier, Hors-la-loi) ou d'un cycle
   * interne (Bretteur).
   *
   * Passif, donc `cooldown: Infinity` — même patron que la Furie du Lancier :
   * le moteur lit ce cooldown à la construction, le module ne l'arme jamais,
   * et `ui/select.js` l'affiche « passif ».
   */
  ability: {
    id: 'momentum',
    name: 'Élan',
    nameRef: 'Momentum',
    cooldown: Infinity,
    cooldownStep: 0,
    cooldownFloor: Infinity,
    momentum: {
      /** Gagné par seconde en ligne droite. Calé pour qu'il faille ~2,5 s de
       *  course franche pour atteindre le plafond — la largeur de l'arène. */
      rise: 1.6,
      /** Plafond. Au-delà, une arène de 628 px ne suffirait plus à l'atteindre. */
      max: 4,
      /** Au-delà de cet écart de cap par seconde, il « tourne » : l'élan
       *  retombe. Calé juste au-dessus de son pilotage nominal
       *  (`turnRate × seek` = 0,715 rad/s), pour qu'une poursuite normale ne
       *  le casse pas mais qu'un virage serré, si. */
      turnTolerance: 0.9,
      /** Ce qu'il reste de l'élan après un virage, un mur ou un choc. Pas zéro
       *  sec : à zéro franc il ne redémarrait jamais dans une arène où l'on
       *  rebondit sans cesse. */
      keepOnBreak: 0.25,
    },
    /**
     * **La charge d'épaule** : le contact des corps blesse, proportionnellement
     * à l'élan. C'est le seul combattant qui inflige des dégâts sans arme.
     */
    slam: {
      /** Élan minimum pour que le choc blesse. En dessous, il bouscule sans
       *  faire mal — ce qui rend l'accélération lisible. */
      min: 1.2,
      /** Dégâts = `élan × damagePer`, arrondis. À élan plein : 4 × 2 = 8. */
      damagePer: 2,
      /** Verrou entre deux chocs, sans quoi un contact prolongé blesserait
       *  120 fois par seconde — c'est exactement ce que `weaponHit` évite pour
       *  les armes, et il n'y a aucune raison que le corps y échappe. */
      cooldown: 0.9,
      /** Projection, en plus de celle que la physique applique déjà. */
      knockback: 300,
    },
  },

  /* ---------- ULTIME ---------- */
  /**
   * **Séisme** — il plante le pavois dans le sol et envoie une onde.
   *
   * L'ultime d'un personnage d'élan ne pouvait pas être une course de plus :
   * c'est le seul moment où il **s'arrête volontairement**. L'onde part de lui,
   * traverse l'arène, et ce qu'elle touche est ralenti longuement — de quoi
   * rattraper, lui qui ne rattrape jamais.
   */
  ultimate: {
    id: 'earthshaker',
    name: 'Séisme',
    nameRef: 'EARTHSHAKER',
    barLabel: 'EARTHSHAKER',
    barLabelFr: 'SÉISME',
    barFill: '#5b6473',
    barText: '#eef1f6',
    chargeRate: 3.4,
    chargeOnHit: 3,
    /** Le temps de l'onde, pas d'un état : elle part, elle passe, c'est fini. */
    duration: 1.1,
    quake: {
      /** Anneau qui s'ouvre du corps jusqu'au-delà de l'arène. */
      from: 60,
      to: 720,
      color: 'rgba(217,164,65,0.85)',
      width: 9,
      /** Dégâts au passage de l'onde, une seule fois par incantation. */
      damage: 7,
      /** Et surtout : un ralentissement long, sa seule façon de rattraper. */
      slow: 0.5,
      slowDuration: 2.6,
      /** Il reste planté pendant l'onde — `boostFactor: 0`, comme la phase
       *  `brace` du Lancier et le Tir enraciné du Mage. */
      rootSelf: true,
      shake: 9,
    },
  },

  /* ---------- POUVOIR SPÉCIAL — troisième créneau ---------- */
  /**
   * **Ruée** — quelques secondes où il devient un train fou : vitesse ×1,8 et
   * **l'élan ne retombe plus**, murs compris.
   *
   * C'est l'inverse exact de son problème : hors Ruée, l'arène le casse à
   * chaque rebond. Pendant, elle ne peut plus rien contre lui.
   */
  special: {
    id: 'stampede',
    name: 'Ruée',
    nameRef: 'Stampede',
    barLabel: 'STAMPEDE',
    barLabelFr: 'RUÉE',
    barFill: '#a8762f',
    barText: '#fff6e2',
    cooldown: 9,
    first: 4,
    duration: 3.2,
    /** Multiplicateur de vitesse pendant la Ruée. Il passe de 330 à 594 px/s,
     *  soit devant tout le roster — c'est le seul moment où il rattrape. */
    speedBonus: 1.8,
  },

  /**
   * **Aucun projectile.** Premier du roster dans ce cas : tout ce qu'il fait
   * demande d'être au contact. `ui/select.js` écrit « aucun » sur la ligne
   * « Projectile » plutôt que de la trouer.
   */
  projectiles: {},

  /** `stack` = l'Élan, qui démarre à zéro : il faut courir pour l'avoir. */
  progression: { stack: 0, stack2: 0 },

  hud: {
    stat: (f) => `Momentum: ${formatHalf(f.stacks)}`,
    statFr: (f) => `Élan : ${formatHalf(f.stacks)}`,
    color: '#3d4657',
  },
});
