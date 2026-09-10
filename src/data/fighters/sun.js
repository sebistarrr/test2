import { fiche, SPIN } from '../defaults.js';
import { formatSeconds } from '../format.js';

/* ==========================================================================
 *  SOLEIL  (SUN) — le premier **boss** du roster
 *
 *  Troisième combattant **inventé** du dépôt, après le Golem et le Mannequin :
 *  il n'a pas de vidéo de référence, donc **aucune de ses valeurs ne peut
 *  porter `mesuré`**. Tout y est `calé` (posé puis vérifié au banc) ou `déduit`
 *  (calculé d'une autre).
 *
 *  **Ce qu'il est, et ce qu'il n'est pas.** Les sept autres sont taillés pour
 *  s'affronter entre eux : la matrice les tient dans une bande de 4 à 13
 *  victoires sur 18, et chaque rééquilibrage cherche à la resserrer. Celui-ci
 *  est demandé pour **gagner contre tout le monde en 1 contre 1**, ce qui est
 *  une intention opposée. Il ne fait donc pas partie du même barème, et sa
 *  ligne de matrice n'est pas un défaut d'équilibrage à corriger — c'est la
 *  spécification.
 *
 *  **Trois choses le rendent boss, et elles se lisent toutes dans cette
 *  fiche :**
 *
 *   1. **Deux fois plus grand** (rayon 82 contre 41) et **500 PV** contre 100.
 *      Comme pour le Golem, la taille est un vrai coût — un corps plus large
 *      est plus facile à toucher — et c'est la barre de vie qui le paie.
 *   2. **Huit rayons au lieu d'une arme.** `weapon.spokes: 8` : la même arme
 *      répétée tous les 45°, donc une couronne tranchante qui ne laisse aucun
 *      angle mort. C'est ce qui remplace, chez lui, le fait de savoir viser.
 *   3. **Il est lent** (300 px/s, le plus lent du roster), et c'est la
 *      contrepartie. Il ne rattrape personne ; c'est à l'adversaire de venir,
 *      ou de se faire chercher par le Rayon solaire.
 *
 *  **Le piège de conception à ne pas rouvrir.** Une couronne de huit rayons
 *  touche dans toutes les directions : c'est exactement l'« arme braquée qui
 *  touche en permanence » que le dépôt documente, en pire. Son garde-fou est
 *  `weapon.melee.cooldown` — `weaponHit` teste le verrou **une fois pour
 *  toutes** avant d'essayer les branches, donc huit rayons ne font pas huit
 *  touches par pas. Baisser ce verrou est le levier le plus dangereux de la
 *  fiche.
 * ========================================================================== */
export const SUN = fiche({
  id: 'sun',
  /** Archétype traduit, comme DRUIDE/DRUID : « soleil » et « sun » sont le même
   *  mot d'usage dans les deux langues, et le champ reste obligatoire. */
  name: 'SOLEIL',
  nameRef: 'SUN',
  tagline: 'Astre-roi — huit rayons, cinq cents points de vie, et tout son temps',
  taglineRef: 'King star — eight rays, five hundred hit points, and all the time',
  icon: 'iconSun',

  /**
   * **500 PV, cinq fois la norme et deux fois et demie le Golem.**
   *
   * Calé, et calé haut exprès : c'est le chiffre qui porte la demande « il doit
   * gagner contre tous les autres ». Il n'a **aucune réduction de dégâts**,
   * comme le Golem — un seul chiffre porte toute sa résistance, donc le banc
   * n'a qu'un levier à tourner si la demande change.
   *
   * Lu par `Match` en une ligne (`el.maxHp ?? MATCH.maxHp`), et tout ce qui
   * affiche une proportion de vie divise par `Fighter.maxHp`, jamais par une
   * constante : il n'y a rien d'autre à toucher pour qu'un combattant sorte de
   * la norme.
   */
  maxHp: 500,

  look: {
    /**
     * **Exactement le double de la norme — demandé.** 82 contre 41, là où le
     * Golem, jusqu'ici le plus gros, est à 50.
     *
     * `look.radius` est déjà lu génériquement (`Fighter.radius`, cadrage de la
     * carte de sélection, séparation des corps) : aucune ligne de moteur ne
     * suppose 41. Deux conséquences de jeu, toutes deux assumées :
     *  • il est **beaucoup plus facile à toucher** — c'est le prix de ses PV ;
     *  • il occupe 1/8 de la largeur de l'arène (628 px utiles), donc il ne
     *    peut pas se cacher, et l'adversaire ne peut pas non plus le contourner
     *    de loin.
     */
    radius: 82,
    /**
     * **Jaune solaire, et c'est frontalement le piège du corps clair sur arène
     * blanche** — celui que le Mannequin a payé en premier. Le personnage étant
     * *le soleil*, l'éviter en le rendant orange sombre l'aurait dénaturé : il
     * est donc jaune, et les compensations documentées sont appliquées, une par
     * une :
     *  • **contour à 6 px** d'encre brûlée (5 partout ailleurs) ;
     *  • **chiffre de PV en encre sombre**, jamais en crème ;
     *  • **aura permanente**, comme le Mannequin.
     * Il reste franchement distinct des sept autres corps, y compris de
     * l'orange du Ronin (`#e8621b`), qui est rouge là où celui-ci est jaune.
     */
    body: '#fbbf24',
    /** Il **blanchit** comme le reste du roster : sur un corps jaune saturé, le
     *  passage au blanc se voit — c'était l'inverse chez le Mannequin, déjà
     *  blanc, qui a dû rougir. */
    bodyHit: '#ffffff',
    outline: '#7c2d12',
    /** 6 au lieu des 5 universels : sur un corps clair, c'est le trait qui
     *  dessine la silhouette. Même dérogation que le Mannequin. */
    outlineWidth: 6,
    /** Encre brûlée : le crème du reste du roster disparaîtrait sur le jaune —
     *  correction déjà faite en sens inverse sur le cuivre clair de l'Hoplite. */
    hpColor: '#7c2d12',
    /**
     * **Halo permanent**, deuxième cas du roster après le Mannequin et pour une
     * raison inverse : lui *a* des pouvoirs, mais un astre sans halo n'est pas
     * un astre. `radius: 1.25` seulement — sur un corps de 82 px de rayon, un
     * halo à 1,5 comme celui du Golem mangerait un quart de l'arène.
     */
    aura: { color: 'rgba(251,191,36,0.4)', radius: 1.25, pulse: 0.7, showWhen: 'always' },
    /**
     * **Pas de ruban de pointe d'arme, et c'est un choix, pas un oubli.**
     * `flair.js` trace le ruban sur `f.bladeSegment()`, qui rend **une** branche
     * — la première. Sur une couronne de huit, un ruban unique désignerait un
     * rayon au hasard et donnerait l'impression que les sept autres ne comptent
     * pas. La couronne se lit d'elle-même, elle n'a pas besoin d'être soulignée.
     *
     * Restent les braises qui **montent** (`rise` négatif, l'inverse de la
     * poussière du Golem qui retombe) : c'est de la chaleur, ça ne pèse rien.
     */
    flair: {
      motes: { rate: 14, size: 9, drift: 22, rise: -26, colors: ['#fff7cc', '#fbbf24', '#f97316'] },
      impact: ['#fff7cc', '#ffffff', '#f97316'],
      shape: 'spark',
      castFlash: 'rgba(255,214,120,0.55)',
    },
    trail: { color: 'rgba(251,191,36,0.26)', every: 0.05, life: 0.36 },
    accent: '#fff7cc',
  },

  /**
   * **Bruitages.** `pitch: 0.78` — presque aussi grave que le Golem (0,72),
   * parce qu'il est encore plus gros que lui, mais **pas** au même endroit : la
   * pierre du Golem est mate et sourde, le feu est large et soufflé. C'est la
   * matière des recettes qui les sépare, pas seulement la transposition — et
   * c'est pour ça qu'aucune des siennes n'est empruntée.
   */
  sound: {
    pitch: 0.78,
    shot: null, // il n'a aucun projectile
    /** Le rayon qui **marque** au lieu de trancher : une brûlure, pas un choc. */
    hit: 'scorch',
    impact: 'impact',
    bounce: 'thud',
    /** Le Réchauffement, une nappe qui enfle — l'inverse d'un coup. */
    ability: 'blaze',
    /**
     * **La couronne tourne en permanence**, donc elle a une voix tenue, comme
     * la lame du Ronin et le bloc du Golem. Ses bornes sont les siennes : il
     * tourne à SPIN × 0,55, soit 3,17 rad/s, et son régime est **constant** —
     * la voix dit donc *où il est* et *qu'il est là*, pas une courbe. D'où un
     * `gain` tenu : le Rayon solaire et le Réchauffement doivent rester
     * au-dessus.
     */
    swing: { loop: 'furnace', from: 0.5, to: 5, gain: 0.6 },
    special: null, // il n'a pas de troisième créneau
    /** Le Rayon solaire : la seule recette du banc qui **tienne** une seconde
     *  entière sur une note qui monte, parce que le pouvoir se charge à vue. */
    ultimate: 'flare',
  },

  /**
   * **Le plus lent du roster, et de loin** : 300 px/s contre 420 (Golem, le
   * précédent détenteur), 430 (Hoplite et Mannequin), 500 (Shinobi), 560
   * (Ronin), 624 (Druide) et 655 (Pistolero).
   *
   * C'est **la** contrepartie de tout le reste, et elle est volontairement
   * raide : il ne rattrape personne. `turnRate: 1` est également le plus bas du
   * roster (1,3 pour le Golem) — un astre ne pivote pas, il dérive. `seek`
   * moyen : il va vers sa cible sans jamais la coincer.
   */
  movement: { speed: 300, turnRate: 1, seek: 0.32 },

  weapon: {
    name: 'Couronne de rayons',
    nameRef: 'Ray Crown',
    /**
     * **160 px, la deuxième portée du roster** derrière le sabre du Ronin
     * (197,6) et devant la lance de l'Hoplite (164)… mais elle ne se compare
     * pas aux leurs, parce qu'elle est répétée huit fois.
     *
     * Déduite du sprite, comme partout : `handle.length` 82 + largeur dessinée
     * 78 = 160. La largeur dessinée vaut `map.w × head.scale` = 13 × 6 = 78 (la
     * carte est du texte, pas un PNG : pas de rapport d'aspect à corriger,
     * contrairement à l'arme du Golem).
     *
     * Son corps faisant 82 px de rayon, **chaque rayon ne dépasse que de 78 px
     * du bord** — soit à peine plus que le poing du Golem (50). Un boss à
     * grande allonge *et* à couronne complète n'aurait laissé aucun jeu.
     */
    reach: 160,
    /**
     * **SPIN × 0,55**, soit 3,17 rad/s : entre le Golem (0,45) et le reste du
     * roster (1,0). Calé, et calé bas pour la raison documentée sur la lance de
     * l'Hoplite — *une arme qui balaie vite touche souvent* — qui vaut ici au
     * carré, puisque huit branches balaient huit fois le même tour.
     */
    spin: SPIN * 0.55,
    spinDir: 1,
    /**
     * **Huit rayons, un tous les 45° — c'est la mécanique de base du
     * personnage.**
     *
     * `weapon.spokes` est lu par `Fighter.bladeSegment(k)`, `weaponHit` et
     * `drawWeapon` : la même arme répétée à intervalle régulier sur le tour.
     * Le moteur ne connaît aucun combattant (invariant 12) — un autre pourrait
     * déclarer 3 ou 12 sans qu'une ligne de moteur bouge, et les sept qui ne
     * déclarent rien retombent sur 1, donc sur le chemin exact d'avant (la
     * matrice le vérifie au caractère près).
     *
     * **Ce que ça change au jeu :** il n'a plus d'angle mort. Contourner un
     * combattant est la parade normale contre une arme qui tourne ; contre
     * lui, elle n'existe pas. C'est ce qui remplace, chez un personnage lent et
     * sans visée, le fait de savoir placer un coup.
     */
    spokes: 8,
    /**
     * `width: 0` : le rayon est tout entier dans le sprite, il n'y a pas de
     * manche à tracer. `length: 82` — exactement le rayon du corps, donc le
     * rayon **part du bord de la bille** et pas de son centre : sans ça, la
     * moitié de chaque rayon serait peinte à l'intérieur du disque.
     */
    handle: { length: 82, width: 0, color: '#f97316', dark: '#c2410c', outline: '#7c2d12', gem: null },
    head: { sprite: 'sunRay', scale: 6 },
    /** Les rayons passent **par-dessus** la bille — ils en sortent, ils ne s'y
     *  cachent pas. Purement visuel : `bladeSegment()` ne lit pas ce drapeau. */
    overBody: true,
    /** Le chiffre de PV repasse au-dessus des rayons, sans quoi « 500 » serait
     *  barré par les deux rayons horizontaux à chaque demi-tour. */
    hpOverWeapon: true,
    /**
     * **Le tranchant commence exactement au bord du corps** : 0,5125 × 160 = 82,
     * le rayon de la bille. Déduit, pas choisi — c'est la même valeur que
     * `handle.length`, et les deux doivent bouger ensemble.
     *
     * Rayon 15 : plus fin que le bloc du Golem (24), parce qu'un rayon est
     * effilé et qu'il y en a huit. L'épaissir multiplierait la surface
     * couverte par huit, pas par un.
     */
    hitbox: { from: 0.5125, radius: 15 },
    melee: {
      /**
       * **Dégâts fixes**, comme le Golem : un astre ne s'échauffe pas au fil du
       * duel. 5 par touche, calé entre le poing du Golem (7, mais qui ne porte
       * que sur 100 px et dans une seule direction) et la lame du Ronin
       * (1 à 3).
       */
      damage: 5,
      /**
       * **Le garde-fou du personnage, et le levier le plus dangereux de la
       * fiche.**
       *
       * `weaponHit` teste `meleeCd` **une fois pour toutes** avant d'essayer les
       * huit branches : le verrou est donc ce qui empêche une couronne complète
       * de blesser en permanence — huit rayons ne font pas huit touches par pas,
       * ils font une touche toutes les 0,8 s au mieux. C'est le pendant de la
       * dispersion pour une arme braquée, piège documenté du dépôt.
       *
       * 0,8 s : plus court que le Golem (1,6) parce qu'il frappe moins fort,
       * plus long que le Ronin et le Shinobi (1) parce que lui n'a jamais
       * besoin de se placer.
       */
      cooldown: 0.8,
      /**
       * Fort (400) sans atteindre le Golem (500) : un rayon **repousse**, il ne
       * projette pas. C'est aussi ce qui l'empêche d'enchaîner deux touches sur
       * la même cible sans qu'elle ait eu l'occasion de s'écarter.
       */
      knockback: 400,
      /**
       * **Presque nul (30), et c'est là que pèse sa masse.** Même asymétrie que
       * le Golem (60 contre 500) : le moteur n'a aucune notion de masse —
       * `Fighter.push` applique la même impulsion à tout le monde — donc le
       * poids se dit **par ce rapport-là**, sans toucher une ligne de physique.
       * Un astre ne recule pas quand on le frôle.
       */
      selfRecoil: 30,
    },
  },

  /* ---------- POUVOIR — Réchauffement solaire ---------- */
  /**
   * **Il brûle tout ce qui reste à côté de lui — demandé.**
   *
   * Horloge fixe, aucune visée : toutes les 5 s, tout ennemi dans 240 px prend
   * un coup sec **et se met à brûler**. C'est la réponse au seul plan qui
   * marche contre un personnage lent — rester à distance moyenne et attendre —
   * et c'est aussi ce qui punit un corps à corps qui s'accroche.
   *
   * **La brûlure compte plus que le coup**, et c'est voulu : 2 à l'impact, mais
   * 2 par seconde pendant 4 s si l'adversaire ne s'éloigne pas. Le pouvoir ne
   * tue pas, il **impose de bouger** — sur un combattant qui, lui, n'a aucun
   * mal à rester où il est.
   */
  ability: {
    id: 'solarWarming',
    name: 'Réchauffement solaire',
    nameRef: 'Solar Warming',
    /** Calé : à 5 s, il tombe 5 à 7 fois dans un duel de 30 s. */
    cooldown: 5,
    /**
     * 240 px : trois fois son rayon de corps, et une portée de plus que le
     * Golem (170). Sur une arène de 628 px de côté, c'est **plus du tiers de la
     * largeur** — assez pour qu'on ne puisse pas l'ignorer en tournant autour,
     * pas assez pour couvrir le plateau.
     */
    radius: 240,
    /** Bas devant les 5 du rayon : le coup n'est que l'amorce, la brûlure fait
     *  le travail. */
    damage: 2,
    /** Il repousse peu : le but est de **maintenir** la pression, pas de
     *  décoller l'adversaire — ce que fait déjà la couronne. */
    knockback: 120,
    /** La brûlure, et c'est le vrai contenu du pouvoir. Rafraîchie à chaque
     *  cycle : rester dans la zone, c'est brûler sans interruption. */
    burn: { damage: 2, interval: 1, duration: 4 },
    /** Anneau de chaleur au sol, tracé par `Effects.ring`. */
    ring: { to: 240, time: 0.55, color: 'rgba(251,191,36,0.85)', width: 9 },
  },

  /* ---------- ULTIME — Rayon solaire ---------- */
  /**
   * **Il se charge à vue, puis il libère — demandé.**
   *
   * Le seul pouvoir du dépôt qui **s'annonce avant de frapper**, et c'est tout
   * son intérêt : pendant `windup` secondes, une bille de lumière grossit
   * devant lui et le rayon est **déjà visé**, mais rien ne part encore.
   * L'adversaire voit exactement ce qui arrive et d'où — il a une seconde pour
   * sortir de l'axe. C'est la seule fenêtre du duel où *lui* est prévisible.
   *
   * **Il s'immobilise pendant toute la manœuvre** (`channelSpeed`), et c'est la
   * contrepartie : un personnage qui pourrait charger en marchant n'aurait
   * aucune raison de ne pas le faire en permanence.
   *
   * **La visée se fige au tir**, pas au déclenchement : pendant la charge, le
   * rayon suit sa cible à `trackRate` rad/s — assez pour qu'esquiver demande un
   * vrai déplacement, trop peu pour qu'un adversaire rapide soit condamné.
   */
  ultimate: {
    id: 'solarBeam',
    name: 'Rayon solaire',
    nameRef: 'SOLAR BEAM',
    barLabel: 'SOLAR BEAM',
    barLabelFr: 'RAYON SOLAIRE',
    barFill: '#f97316',
    barText: '#fff7cc',
    /** Horloge de 13 s : entre le Golem (12) et rien d'autre — il ne tombe que
     *  deux fois dans un duel, donc chaque tir doit peser. */
    chargeRate: 100 / 13,
    chargeOnHit: 3,
    /** Charge **puis** tir : 1,1 s d'annonce, 1 s de rayon. `duration` porte le
     *  total, comme partout, et le module lit `windup` pour savoir où il en est. */
    windup: 1.1,
    duration: 2.1,
    /** Il tombe à 25 % de sa vitesse pendant toute la manœuvre. Pas zéro : un
     *  combattant totalement figé se lit comme un bug, pas comme une incantation. */
    channelSpeed: 0.25,
    /** Vitesse de suivi pendant la charge, en rad/s. Calé : à 1,2 il ne rate
     *  jamais personne, à 0,4 il ne touche que les lents. */
    trackRate: 0.8,
    beam: {
      /** Assez long pour traverser l'arène en diagonale (628 × √2 ≈ 888) depuis
       *  n'importe quel point : le rayon ne s'arrête jamais avant le mur. */
      length: 900,
      /** Demi-largeur. 34 px de part et d'autre, soit un faisceau de 68 —
       *  presque la largeur d'un combattant de la norme (82). */
      halfWidth: 34,
      /**
       * **6 par tic, un tic toutes les 0,15 s** : jusqu'à 42 PV si l'adversaire
       * reste dans l'axe pendant toute la seconde de tir, soit **plus de deux
       * fois** le pic de dégâts du roster (le Séisme du Golem, 5). C'est
       * l'attaque la plus lourde du dépôt, et c'est assumé — elle s'annonce
       * 1,1 s à l'avance et elle ne part que deux fois par duel.
       */
      damage: 6,
      interval: 0.15,
      knockback: 90,
      /** Secousse de caméra au départ du tir, entre l'Onde sismique du Golem
       *  (5) et son Séisme (16). */
      shake: 11,
    },
  },

  /** Ni projectile, ni troisième créneau. */
  projectiles: {},

  /** Aucune stat évolutive : ses dégâts sont fixes (voir `weapon.melee`). */
  progression: { stack: 0, stack2: 0 },

  hud: {
    /**
     * **Ses deux horloges**, même choix que le Golem : il n'a pas de stat qui
     * monte, et ce qu'un spectateur a besoin de savoir, c'est *quand ça
     * chauffe* et *où en est le rayon*. L'état du rayon prime sur son compte à
     * rebours pendant la manœuvre — c'est le seul moment du duel où il faut
     * regarder ailleurs que la barre de vie.
     */
    stats: [
      (f) => `Warming: ${formatSeconds(Math.max(0, f.ability.timer))}`,
      (f) => `Solar Beam: ${f.ult.active > 0 ? (f.state.firing ? 'FIRING' : 'charging') : `${Math.floor(f.ult.charge)}%`}`,
    ],
    statsFr: [
      (f) => `Réchauffement : ${formatSeconds(Math.max(0, f.ability.timer))}`,
      (f) => `Rayon : ${f.ult.active > 0 ? (f.state.firing ? 'TIR' : 'charge') : `${Math.floor(f.ult.charge)} %`}`,
    ],
    color: '#fbbf24',
  },
});
