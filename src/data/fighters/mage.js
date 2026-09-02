import { fiche } from '../defaults.js';
import { formatHalf } from '../format.js';

/* ==========================================================================
 *  MAGE  (MAGE)  — invité
 *
 *  Quatrième personnage venu de la chaîne « ballthingsim », **construit sur la
 *  mécanique de Magia**, relevée sur « Dragoon vs Magia » (576 × 1024, 30 fps,
 *  24,4 s).
 *
 *  Attention au repère : cette vidéo-là n'est **pas** au même cadrage que les
 *  deux autres. Son arène mesure 502 px de bord extérieur contre 640 dans le
 *  jeu, donc la conversion est **×1,275** et non ×1,25. Vérifié par la bille :
 *  32 px de rayon mesurés × 1,275 = 40,8, soit les 41 px du roster.
 *
 *  Ce qui est repris de Magia : elle attaque **à distance**, son arme est une
 *  baguette **posée sur le côté** qui **vise** l'adversaire, et sa stat de HUD
 *  est une **cadence de tir qui monte toute seule** (« Attack Speed »).
 *
 *  Ce qui ne l'est pas : le personnage est **vert**, son arme est le sceptre de
 *  la maquette fournie, ses orbes sont **guidées**, et ses deux pouvoirs sont
 *  ceux de la Plante — demandés tels quels, et délégués à `abilities/plant.js`
 *  plutôt que recopiés.
 * ========================================================================== */
export const MAGE = fiche({
  id: 'mage',
  name: 'MAGE',
  nameRef: 'MAGE',
  tagline: 'Distance — des orbes guidées, et une cadence qui monte sans fin',
  taglineRef: 'Ranged — homing orbs, and a fire rate that never stops climbing',
  icon: 'iconStaff',

  look: {
    /** Vert demandé. Distinct de la Plante (`#15c701`, un vert acide) : ce
     *  vert-ci est plus sombre et plus bleu, celui de la sève du sceptre. Il
     *  faut aussi qu'il tienne le chiffre de PV en crème sur fond blanc
     *  d'arène — d'où une valeur assez basse pour que le blanc tranche. */
    body: '#1f7a3d',
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    hpColor: '#f5f2ea',
    aura: {
      color: 'rgba(56,205,101,0.42)',
      radius: 1.6,
      pulse: 1.8,
      showWhen: 'ultimate-ready',
    },
    /** Toute la gamme sort du cristal du sceptre (`pixelart/mage.js`) : c'est
     *  ce qui tient l'ensemble — corps, orbes, aura et traînée — sur une seule
     *  couleur, et ce qui évite la passe de couleur incomplète déjà payée sur
     *  le Bretteur puis sur le Shinobi. */
    flair: {
      ribbon: { color: '#38cd65', width: 16, alpha: 0.5 },
      motes: { rate: 9, size: 9, drift: 28, rise: -16, colors: ['#1f964d', '#38cd65', '#97e0a0'] },
      impact: ['#38cd65', '#97e0a0', '#ffffff'],
      shape: 'dot',
      castFlash: 'rgba(56,205,101,0.55)',
    },
    trail: { color: 'rgba(31,150,77,0.26)', every: 0.045, life: 0.3 },
    accent: '#1f964d',
  },

  /**
   * **Le plus rapide du roster**, et c'est le relevé qui le dit : 548 px/s de
   * médiane sur 258 couples d'images (p25 507, p75 629), contre 521 pour le
   * Dragoon dans la **même** vidéo — dont on sait par ailleurs qu'il vaut
   * ~540 dans le jeu. La mesure se recale donc toute seule.
   *
   * `calé` malgré tout, comme toutes les vitesses du dépôt : le moteur d'ici
   * intègre à la main et pilote au cap, il ne reporte pas les constantes de
   * Matter.js. 520 est la valeur qui rend la cadence relevée sans que le Mage
   * devienne injoignable — voir la matrice dans `CLAUDE.md`.
   */
  movement: { speed: 520, turnRate: 2, seek: 0.34 },

  weapon: {
    name: 'Sceptre de sève',
    nameRef: 'Sapwood Scepter',
    /**
     * **Arme braquée** (`spin: 0`) : le sceptre pointe l'adversaire à chaque
     * image, c'est `abilities/mage.js` qui recopie l'angle. Troisième du
     * roster après le revolver du Hors-la-loi et la lance du Lancier — et
     * troisième fois qu'il faut lui poser **son propre garde-fou**, une arme
     * braquée touchant sinon en permanence.
     *
     * Ici le garde-fou est double, et il tient tout entier dans la géométrie :
     * la hitbox ne couvre que le **cristal** (`from: 0.87`), et l'arme est
     * **décalée sur le flanc** (`weaponLateral`, posé par le module), donc le
     * segment tranchant ne passe pas par l'axe qui vise. Le Mage ne peut
     * toucher au contact qu'en frôlant vraiment — ce qui est le propre d'un
     * combattant à distance.
     */
    spin: 0,
    spinDir: 1,
    /**
     * **Portée 128 px**, mesurée sur la baguette de Magia : 100 px vidéo entre
     * les deux bouts, ×1,275. La carte fait 70 cellules de large dessinées à
     * `scale: 2`, soit 140 px, donc le manche démarre **12 px derrière le
     * pivot** pour que la somme retombe sur la portée — invariant du dépôt :
     * `handle.length` + largeur dessinée = `reach`, sinon la pointe ment sur
     * la hitbox.
     *
     * `width: 0` : le sceptre est un sprite entier, du talon au cristal. Il
     * n'y a pas de manche à tracer par-dessus, seulement un décalage.
     */
    reach: 128,
    handle: { length: -12, width: 0, color: '#483b33', dark: '#2d2a27', outline: '#1b1a1d', gem: null },
    /** `scale: 2` : la carte est la maquette réduite de moitié (70 × 17), donc
     *  chaque pixel d'art fait 2 px à l'écran. À l'échelle 1 la hampe se
     *  réduisait à un trait — voir `pixelart/mage.js`. */
    head: { sprite: 'mageStaff', scale: 2 },
    /** Seul le cristal blesse : de 0,87 à 1 de la portée, soit les 17 derniers
     *  pixels. Rayon 15, la demi-hauteur de la couronne de bois. */
    hitbox: { from: 0.87, radius: 15 },
    melee: {
      /**
       * Coup de sceptre volontairement faible : le Mage est un tireur, la
       * mêlée n'est là que pour qu'il ne soit pas sans défense au contact.
       *
       * **Le verrou n'est pas un levier ici, contrairement au Hors-la-loi.**
       * Balayé à 1,4 / 1,7 / 2,2 s, il rend 15 / 12 / 14 victoires sur 24 :
       * non monotone, donc du bruit. C'est que le sceptre n'est pas saturé —
       * ses touches de contact sont rares, elles ne sont pas bornées par la
       * recharge. Il reste à 1,7 s par principe (une arme braquée mérite le
       * verrou long) et parce que c'est la configuration sur laquelle la
       * matrice de référence a été relevée, pas parce qu'il équilibre.
       *
       * Baisser ces dégâts à 1 fait en revanche tomber le Mage à 8 duels sur
       * 24 — mais seulement **en plus** de l'orbe à 2. Les deux leviers ne se
       * cumulent pas : près du seuil, un point de dégât bascule des courses
       * déjà serrées.
       */
      damage: 2,
      cooldown: 1.7,
      knockback: 260,
      selfRecoil: 120,
    },
  },

  /* ---------- POUVOIR — celui de la Plante, demandé tel quel ---------- */
  /**
   * **Semis, repris de la Plante.** Même bloc `bulb`, donc
   * `abilities/plant.js` le pilote sans une ligne de code en double — le
   * module du Mage lui délègue.
   *
   * Deux écarts, tous deux volontaires :
   *  • dégâts et soin **constants** au lieu de suivre `self.stacks`. Chez la
   *    Plante la pile est « Bulb Damage/Heal » ; ici elle est la cadence de
   *    tir, et la faire piloter aussi les bulbes empilerait deux montées sur
   *    une seule stat ;
   *  • `max: 3` au lieu de 4 : le Mage sème en tirant, il ne se replie pas
   *    sur ses bulbes comme la Plante.
   */
  ability: {
    id: 'bulb',
    name: 'Semis',
    nameRef: 'Bulb',
    cooldown: 5.5,
    cooldownStep: 0,
    cooldownFloor: 5.5,
    bulb: {
      max: 3,
      life: 18,
      sprite: 'plantBulb',
      scale: 2.5,
      radius: 36,
      armDelay: 0.9,
      shootInterval: 2.4,
      shootRange: 460,
      projectile: 'flower',
      damage: () => 3,
      heal: () => 2,
      slow: 0.25,
      slowDuration: 1.6,
      /** Gerbe à l'éclatement. Sans elle, `plant.js` retombe sur ses teintes,
       *  dont un rose qui n'a rien à faire chez le Mage. */
      burstColors: ['#38cd65', '#97e0a0', '#1f964d'],
    },
  },

  /* ---------- ULTIME — celui de la Plante, reteinté ---------- */
  /**
   * **Tempête de fleurs, reprise de la Plante**, à la couleur près : la nuée
   * rose de la vidéo d'origine passe au vert du sceptre, sans quoi le Mage
   * aurait un ultime d'une autre famille que tout le reste de sa fiche.
   * `tickDamage` est constant, pour la même raison que les bulbes.
   */
  ultimate: {
    id: 'flowerStorm',
    name: 'Tempête de sève',
    nameRef: 'SAPWOOD STORM',
    barLabel: 'SAPWOOD STORM',
    barLabelFr: 'TEMPÊTE DE SÈVE',
    barFill: '#1f7a3d',
    barText: '#dcfce7',
    chargeRate: 3.6,
    chargeOnHit: 2,
    duration: 5,
    storm: {
      petals: { rate: 60, size: 13, speed: 210, life: 1, colors: ['#38cd65', '#1f964d', '#97e0a0'] },
      swarm: {
        clusters: 17,
        perCluster: 6,
        radius: 2.6,
        spread: 0.75,
        size: 17,
        sizeVar: 0.5,
        churn: 1.9,
        color: '#38cd65',
        flowers: 4,
        flowerSize: 42,
        /** La corolle rose de la Plante volait dans une nuée verte. */
        flowerSprite: 'mageFlower',
      },
      root: 0.7,
      tickInterval: 0.7,
      tickDamage: () => 1,
      healInterval: 1,
      healAmount: 1,
    },
  },

  projectiles: {
    /**
     * **L'orbe guidée** — ce que le sceptre envoie, et tout le personnage.
     *
     * `homing` est lu par `game/projectiles.js`, qui borne le virage à
     * `turnRate`. C'est **le** paramètre d'équilibrage du Mage : sans borne
     * l'orbe est une touche garantie, et le personnage devient la version
     * projectile du piège de l'arme braquée. À 2,6 rad/s elle rattrape un
     * adversaire qui court tout droit et rate celui qui coupe sec — donc le
     * déplacement garde le dernier mot.
     *
     * `delay` laisse l'orbe sortir du sceptre avant de virer : sans lui, une
     * orbe tirée vers l'arrière pivoterait dans l'arme même.
     *
     * `speed` 470 : nettement sous les 600 du trait d'ombre, parce qu'une
     * orbe qui suit n'a pas besoin d'être rapide, et parce que sa vitesse est
     * ce qui décide si on peut la semer.
     *
     * **`damage` est le seul vrai levier du personnage, et il est raide.**
     * Sur les 24 duels du banc (les deux camps × 4 adversaires × 3 seeds) :
     * 3 → 20 victoires, 2 → 15, 1 → 0. Le guidage, lui, **plafonne** :
     * `turnRate` balayé de 3,4 à 0,4 rad/s ne fait passer le Mage que de 22 à
     * 16 victoires. Un banc qui plafonne dit que le levier n'est pas le bon —
     * l'ablation a tranché : 68 % des dégâts du Mage sont des projectiles,
     * et c'est leur valeur, pas leur trajectoire, qui décide.
     */
    orb: {
      label: 'Orbe de sève',
      labelRef: 'Sap Orb',
      sprite: 'mageOrb',
      scale: 2.2, // carte de 11 px -> orbe de 24 px, la taille du cristal
      speed: 470,
      damage: 2,
      radius: 11,
      life: 2.6,
      bounces: 1,
      knockback: 70,
      homing: { turnRate: 2.6, delay: 0.1 },
      trail: { color: 'rgba(56,205,101,0.4)', every: 0.035, life: 0.32 },
    },
    /** Tiré par les bulbes, pas par le Mage — voir `ability.bulb.projectile`.
     *  Reteinté en vert comme le reste, la corolle rose de la Plante jurerait. */
    flower: {
      label: 'Fleur',
      labelRef: 'Flower',
      sprite: 'mageFlower',
      scale: 3.6,
      speed: 340,
      damage: 2,
      radius: 12,
      life: 2.4,
      bounces: 0,
      knockback: 60,
      trail: { color: 'rgba(56,205,101,0.45)', every: 0.04, life: 0.4 },
    },
  },

  /**
   * `stack` = **cadence de tir**, en orbes par seconde. C'est la stat de Magia,
   * et la seule mécanique propre du Mage.
   *
   * Relevé sur la vidéo, filigrane TikTok effacé en ne gardant que les pixels
   * roses du texte : 1,00 au départ, 1,10 à t≈1,2 s, 1,15 à 2,2 s, 1,25 à
   * 3,2 s, 1,30 à 3,8 s, puis le passage à 2,00 à t≈13 s et ~3,7 en fin de
   * duel. Tous les paliers sont des multiples de **0,05**, et les six premiers
   * tombent en 4,5 s pour une cadence moyenne de 1,15/s : **+0,05 par orbe
   * tirée**, ce qui rend une montée exponentielle `e^(0,05 t)` — 1,92 à 13 s,
   * 2,72 à 20 s, du bon ordre.
   *
   * Le pas de 0,05 est `mesuré`. Le plafond, lui, est `calé` : la vidéo ne
   * dure pas assez pour le montrer, et sans plafond un duel long rendrait la
   * cadence absurde.
   */
  progression: { stack: 1, stack2: 0 },

  hud: {
    stat: (f) => `Attack Speed: ${formatHalf(f.stacks)}`,
    statFr: (f) => `Cadence de tir : ${formatHalf(f.stacks)}`,
    color: '#1f7a3d',
  },
});
