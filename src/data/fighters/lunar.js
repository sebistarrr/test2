import { fiche, SPIN } from '../defaults.js';
import { formatSeconds } from '../format.js';

/* ==========================================================================
 *  LUNE  (MOON) — le **second boss**, et l'inverse du premier
 *
 *  Quatrième combattant **inventé** du dépôt. Aucune vidéo de référence, donc
 *  **aucune valeur ne peut porter `mesuré`** : tout y est `calé` ou `déduit`.
 *
 *  **Ce qu'elle est.** Le Soleil est *un* événement qu'il faut savoir éviter :
 *  deux secondes d'annonce, un faisceau, et le duel se joue sur le moment.
 *  LUNE est l'inverse — **aucune annonce, mais un personnage qui n'est jamais
 *  le même deux secondes de suite.** Le Soleil te punit si tu es au mauvais
 *  endroit au mauvais instant ; LUNE te force à réapprendre le combat en
 *  permanence.
 *
 *  **Un seul nombre porte tout le personnage.** `f.state.ill`, l'illumination,
 *  va de 0 à 1 et revient, sur un cycle de 12 s. Il est **continu et sans
 *  aucun tirage** — donc déterministe, comme l'animation de charge du Soleil.
 *  Tout en découle, et rien d'autre ne le décide :
 *
 *  | | 🌑 nouvelle (0) | 🌓 (0,5) | 🌕 pleine (1) |
 *  | --- | --- | --- | --- |
 *  | rayon du corps | **44** | 70 | **96** |
 *  | vitesse | **600 px/s** | 425 | **250 px/s** |
 *  | dégâts de contact | 1 | 4 | **7** |
 *  | force de Marée | 0 | 100 | **200** |
 *
 *  Le roster va de 230 (Soleil) à 655 px/s (Pistolero) et de 41 à 96 de rayon :
 *  **LUNE traverse toute l'amplitude du jeu à elle seule, en douze secondes.**
 *
 *  **Sa défense n'est pas une réduction de dégâts** — le dépôt n'en a jamais
 *  mis et le répète. Elle est **géométrique** : à la nouvelle lune elle est 4,7
 *  fois plus petite en surface et 2,4 fois plus rapide. On ne la touche pas
 *  parce qu'elle est minuscule et vive, pas parce qu'un chiffre annule les
 *  dégâts.
 *
 *  **Le couple à connaître avant d'y toucher.** Toute la production du Soleil
 *  passe par un faisceau dont l'axe **se fige au tir**, et son horloge fait
 *  **7 s** quand le cycle de LUNE en fait **12**. Les deux ne retombent en
 *  phase que toutes les 84 s : l'instant du tir se promène donc dans le cycle
 *  lunaire, et le duel des deux boss est une **course d'horloges** plutôt qu'un
 *  échange de dégâts. C'est voulu, et c'est la seule ligne de matrice que les
 *  deux boss se disputent.
 * ========================================================================== */
export const LUNAR = fiche({
  id: 'lunar',
  /** Archétype traduit, comme SOLEIL/SUN et DRUIDE/DRUID. */
  name: 'LUNE',
  nameRef: 'MOON',
  tagline: 'Astre changeant — elle attire, elle écrase, et elle n’annonce rien',
  taglineRef: 'Changing star — it pulls, it crushes, and it warns of nothing',
  icon: 'iconLunar',
  /** **Rangée de l'écran de sélection**, et rien d'autre.
   *  Boss, comme le Soleil, et regroupé avec lui à l'écran de sélection. Clé lue
   *  par `ui/select.js` seul : le moteur ne la connaît pas. */
  tier: 'boss',

  /**
   * **480 PV**, contre 500 au Soleil et 100 à la norme — et ce chiffre est
   * **le seul de la fiche qui ait été calé au banc plutôt que posé**.
   *
   * Il valait 360 à l'écriture, sur un raisonnement qui paraissait bon : une
   * partie de la survie de LUNE est géométrique (4,7 fois moins de surface à
   * toucher à la nouvelle lune), donc lui donner *aussi* la barre du Soleil
   * cumulerait deux défenses. **Le banc l'a démenti, et pour une raison qui ne
   * se devinait pas** : le duel des deux boss dure 92 à 104 s, or
   * `MATCH.suddenDeath` multiplie les dégâts par 4 à partir de 55 s. Il se
   * joue donc **entièrement dans la rampe**, où chaque touche est fatale et où
   * esquiver longtemps ne sert plus à rien. En mort subite, la géométrie ne
   * défend pas — la barre, si.
   *
   * Le balayage est **monotone**, donc c'est un vrai levier et non du bruit :
   * 360 → 3/24, 420 → 3/24, 480 → **12/24**, 540 → 13/24, 600 → 16/24. À 480 le
   * duel des boss est à **22/50** sur 25 graines × les deux camps, et LUNE
   * reste à 20/20 contre les sept autres — la valeur ne touche qu'une ligne de
   * la matrice, celle qu'on cherchait à équilibrer.
   *
   * Aucune réduction de dégâts, comme tous les autres : un seul chiffre porte
   * sa résistance, donc le banc n'a qu'un levier à tourner.
   */
  maxHp: 480,

  look: {
    /**
     * **Le rayon de *référence*, pas le rayon vu.** C'est le premier combattant
     * du dépôt dont le corps change de taille : son module écrit
     * `f.sizeFactor`, que `Fighter.radius` multiplie (compteur générique,
     * invariant 7).
     *
     * 70 est la **mi-course** : × 0,629 à la nouvelle lune (44, entre la norme
     * 41 et le Golem 50), × 1,371 à la pleine (96, le plus gros corps du jeu,
     * devant les 82 du Soleil). Poser ici la valeur médiane plutôt qu'un des
     * deux bouts évite qu'un lecteur de la fiche croie voir la taille réelle.
     *
     * Et **un seul getter fait tout suivre** : murs, séparation des corps,
     * aura, contour, chiffre de PV et le sprite de corps lui-même. Elle grossit
     * d'un bloc, sans une ligne de plus.
     */
    radius: 70,
    /**
     * **Cinq teintes relevées sur les *deux* maquettes** — le seul combattant
     * dans ce cas, parce que son corps l'est aussi : les trois sombres viennent
     * de la face d'éclipse, les deux claires de la face éclairée (bandes de
     * luminance, 3ᵉ · 20ᵉ · 50ᵉ · 80ᵉ · 97ᵉ centile des pixels opaques).
     *
     * Le violet `#604f9c` est posé en `body` — donc c'est lui qui teinte la
     * carte de sélection et les gerbes de dégâts — parce que c'est **la
     * signature** : personne d'autre du roster n'a de violet depuis la
     * suppression de Neon Shadow.
     *
     * Source unique, comme pour le Soleil : le module n'a **aucun littéral de
     * couleur**, et les trois cartes de `pixelart/lunar.js` recopient ces cinq
     * lignes. C'est ce qui empêche le faisceau, l'icône et le repli de dériver
     * du dessin qu'ils prolongent.
     */
    palette: {
      edge: '#0d0a1d', // encre, le noir bleuté de l'éclipse
      shadow: '#1e1837', // ombre
      body: '#604f9c', // violet — la signature
      light: '#b5d5e4', // gris-bleu des cratères éclairés
      core: '#e7fdff', // blanc froid du limbe
    },
    /**
     * **Le corps est un sprite, et c'est le second du roster** — mais le
     * premier à en être **deux** : `lunarDark` est la face d'ombre, déclarée
     * ici, et le module peint `lunarLit` par-dessus, découpée au terminateur.
     *
     * **C'est la face sombre qui est déclarée, pas la claire**, et c'est un
     * choix de mode de panne : si l'overlay ne se dessinait plus, on verrait un
     * disque parfaitement lisible plutôt qu'une lune pâle à moitié invisible.
     * Relevé sur les maquettes, contraste médian contre l'arène blanche :
     * **6,5** pour la face d'ombre, **1,54** pour la face claire — dont 48 %
     * des pixels sous le seuil de visibilité.
     *
     * Pas de `spriteScale` : les deux PNG sont coupés à leur disque, ils
     * remplissent exactement leur cadre, la correction vaudrait 1 — et une clé
     * qui recopie son défaut est une occasion de divergence silencieuse.
     */
    sprite: 'lunarDark',
    /** Le voile d'encaissement se **pose par-dessus** le dessin au lieu de le
     *  remplacer (sinon chaque coup effacerait la lune). Un peu plus discret
     *  que celui du Soleil : le corps est sombre, un voile clair y ressort
     *  davantage. */
    spriteFlash: 0.55,
    body: '#604f9c',
    /** **Il éclaircit au lieu d'assombrir** — l'inverse du roster. Sur un corps
     *  presque noir, un flash sombre ne se verrait pas ; c'est la même
     *  compensation que le Mannequin, qui rougit au lieu de blanchir. */
    bodyHit: '#e7fdff',
    outline: '#0d0a1d',
    outlineWidth: 6,
    /**
     * **Chiffre de PV cerné — et ici ce n'est pas un confort, c'est la seule
     * solution.** Sous l'empreinte des digits, la proportion clair/sombre
     * **traverse tout le cycle** : 6 % / 91 % à la nouvelle lune, **44 % / 44 %
     * à mi-course**, 89 % / 0 % à la pleine. Aucune encre unique ne tient — pire
     * que le Soleil (53/40), qui avait déjà forcé l'apparition de `hpStroke`.
     * Le contour isole le chiffre au lieu d'essayer de composer.
     */
    hpColor: '#f2f7ff',
    hpStroke: '#0d0a1d',
    /**
     * **L'anneau de poussière de glace, rendu au jeu plutôt que cuit dans
     * l'image.** Les maquettes en portent un ; il a été coupé au détourage,
     * parce qu'un halo cuit serait figé alors que celui-ci **bat**. Même
     * raisonnement que pour le halo pêche du Soleil.
     */
    aura: { color: 'rgba(96,79,156,0.40)', radius: 1.22, pulse: 0.55, showWhen: 'always' },
    flair: {
      motes: { rate: 12, size: 8, drift: 18, rise: -14, colors: ['#e7fdff', '#b5d5e4', '#604f9c'] },
      impact: ['#e7fdff', '#ffffff', '#604f9c'],
      shape: 'spark',
      castFlash: 'rgba(231,253,255,0.5)',
    },
    trail: { color: 'rgba(96,79,156,0.24)', every: 0.05, life: 0.4 },
    accent: '#b5d5e4',
  },

  sound: {
    pitch: 0.62,
    shot: null, // aucun projectile
    hit: 'knell',
    impact: 'impact',
    bounce: 'thud',
    ability: 'swell',
    special: null,
    ultimate: 'umbra',
  },

  /**
   * **250 px/s — et c'est son *plancher*, pas sa vitesse.**
   *
   * `movement.speed` est la vitesse de **pleine lune**, la plus lente ; le
   * module la remonte jusqu'à 600 à la nouvelle en écrivant `f.boostFactor`,
   * le compteur générique qui existait déjà. Aucune clé de moteur n'a été
   * ajoutée pour ça.
   *
   * Le plancher est posé juste au-dessus du Soleil (230) : à la pleine lune
   * elle est le deuxième combattant le plus lent du jeu, et c'est le moment où
   * son corps est le plus gros. Les deux vont ensemble — un astre plein est une
   * cible, et c'est ce qui paie sa Marée.
   */
  movement: { speed: 250, turnRate: 1.4, seek: 0.36 },

  weapon: {
    name: 'Puits de gravité',
    nameRef: 'Gravity Well',
    /**
     * **110 px, et l'arme est *invisible*** — pas de `head.sprite`, donc
     * `drawWeapon` ne peint rien (le garde posé pour le Mannequin). Ce n'est
     * pas un oubli : LUNE ne tient rien, elle **écrase par proximité**. Ce
     * qu'on voit d'elle, c'est son corps qui enfle ; la coquille qui blesse se
     * déduit de ce corps, elle n'a pas à être dessinée par-dessus.
     *
     * La discipline `handle.length + largeur dessinée = reach` ne s'applique
     * donc pas : il n'y a pas de dessin à faire mentir. En revanche 110 est
     * **déduit du corps** — à peine plus que les 96 de la pleine lune, pour que
     * la coquille affleure la silhouette au lieu de piquer dans le vide.
     */
    reach: 110,
    spin: SPIN * 0.4,
    spinDir: -1,
    /**
     * **Six branches, et aucune ne se voit.** Le même mécanisme que la couronne
     * du Soleil (`weapon.spokes`, lu par `bladeSegment(k)`, `weaponHit` et
     * `drawWeapon`), mais employé à l'envers : chez lui il *dessine* une
     * couronne, ici il **ferme les angles morts d'une coquille** que personne
     * ne voit. Six suffisent parce que `hitbox.radius` vaut 22 : six capsules
     * de 22 px sur un cercle de 110 se recouvrent.
     *
     * Le verrou de mêlée est testé **une fois pour toutes** avant la boucle des
     * branches — sinon six branches feraient six touches par pas.
     */
    spokes: 6,
    handle: { length: 0, width: 0, color: '#604f9c', dark: '#1e1837', outline: '#0d0a1d', gem: null },
    /** Aucune tête : c'est ce qui rend l'arme invisible, et `drawWeapon` sait
     *  déjà s'en passer (le Mannequin). La chaîne de repli de l'écran de
     *  sélection retombe alors sur l'icône. */
    head: { sprite: null, scale: 1 },
    overBody: false,
    hpOverWeapon: false,
    /** Le tranchant commence à 30 % de la portée, soit 33 px du centre : sous
     *  le corps même à la nouvelle lune (44). La coquille part donc toujours de
     *  l'intérieur de l'astre et sort avec lui. */
    hitbox: { from: 0.3, radius: 22 },
    melee: {
      /**
       * **`1 + 6 × illumination` — la seule valeur du dépôt qui respire.**
       *
       * Le Ronin a déjà des dégâts en fonction (`Damage = Spin`), mais ils
       * suivent une stat que *lui* fait monter. Ici, ils suivent une horloge
       * que **personne ne pilote** : ni LUNE, ni son adversaire. On ne choisit
       * pas d'être fort, on attend de l'être.
       *
       * 1 à la nouvelle lune (négligeable, c'est assumé — c'est la phase où
       * elle esquive, pas où elle frappe) et **7 à la pleine**, le plus gros
       * contact du roster devant le Golem (7 aussi, mais lui ne change jamais).
       * Le `?? 0` couvre l'image de naissance, avant le premier `update`.
       */
      damage: (f) => 1 + 6 * (f.state.ill ?? 0),
      cooldown: 0.9,
      knockback: 140,
      /** **Presque nul, et c'est une intention** : les sept autres reculent en
       *  frappant, la Lune non. Elle pèse trop. `resolveMelee` l'applique hors
       *  de `damage`, donc la valeur est bien lue. */
      selfRecoil: 10,
    },
  },

  /* ---------- POUVOIR — Marée ---------- */
  /**
   * **Elle ne poursuit pas, elle *attire*.**
   *
   * Toutes les 2,2 s, une onde part du corps et **tire chaque ennemi vers
   * elle**, d'une force qui suit l'illumination : nulle à la nouvelle lune,
   * 200 à la pleine. Ceux que l'onde trouve **à l'intérieur du corps** sont
   * écrasés au passage.
   *
   * Conséquence de jeu, et c'est tout le personnage : **ce n'est plus
   * l'adversaire qui choisit la distance**, c'est l'horloge de LUNE. Et comme
   * la Marée est maximale exactement quand le contact fait 7, elle ne se
   * contente pas de rapprocher — elle livre l'adversaire au moment précis où
   * être près coûte le plus cher.
   */
  ability: {
    id: 'tide',
    name: 'Marée',
    nameRef: 'Tide',
    cooldown: 2.2,
    /** Plus de la moitié de la largeur utile de l'arène (628 px) : on ne sort
     *  pas de sa portée, on choisit seulement d'être tiré fort ou peu. */
    radius: 330,
    /** Force maximale, à la pleine lune. Multipliée par l'illumination, donc
     *  nulle à la nouvelle : la Marée **respire avec le corps**. */
    pull: 200,
    /** Écrasement de ceux que l'onde trouve dans le puits. Suit l'illumination
     *  comme le reste. */
    crush: 4,
    /**
     * **Marge du puits, en px au-delà du contact — et elle est obligatoire.**
     *
     * Écrite d'abord sans marge (« ceux qui sont *dans* le corps »), la
     * condition n'a été vraie **aucune fois sur 45 pulsations** : deux corps ne
     * se chevauchent jamais ici, `resolveBodies` les sépare à chaque pas. Le
     * pouvoir infligeait 0 PV sur 24 duels, sans que rien ne crie.
     */
    crushMargin: 40,
    ring: { to: 330, time: 0.7, color: 'rgba(96,79,156,0.8)', width: 7 },
  },

  /* ---------- ULTIME — Éclipse ---------- */
  /**
   * **Le contraire exact du Rayon solaire.**
   *
   * Le Soleil se **cloue sur place** 4,5 s pour tirer, après 2 s d'annonce
   * lisible à l'écran. LUNE se **décloue** : l'Éclipse force son illumination à
   * 0 et l'y tient 4 s — minuscule, la plus rapide du jeu, et **sans la moindre
   * annonce**. Il n'y a rien à esquiver, il n'y a qu'à survivre.
   *
   * Et comme à illumination 0 son contact ne fait plus que 1, l'Éclipse le
   * **remplace** par un drain : elle prend les PV qu'elle inflige. C'est la
   * seule phase où elle se soigne, et la seule où elle peut coller quelqu'un.
   */
  ultimate: {
    id: 'eclipse',
    name: 'Éclipse',
    nameRef: 'ECLIPSE',
    barLabel: 'ECLIPSE',
    barLabelFr: 'ÉCLIPSE',
    barFill: '#604f9c',
    barText: '#e7fdff',
    /** Horloge de 9 s, contre 7 au Soleil. Plus lente, parce que l'Éclipse n'a
     *  **aucun temps d'annonce** : le Soleil paie sa puissance en visibilité,
     *  LUNE la paie en fréquence. */
    chargeRate: 100 / 9,
    chargeOnHit: 2,
    /** **Zéro — et c'est la signature du personnage.** Le seul ultime du dépôt
     *  sans temps de chargement. Toute la tension du Soleil tient dans ses deux
     *  secondes d'annonce ; celui-ci est déjà en cours quand on le voit. */
    windup: 0,
    duration: 4,
    /** Elle n'est pas bridée pendant son ultime — au contraire. `channelSpeed`
     *  reste à 1 et c'est `boostFactor` qui l'emporte à 600 px/s. */
    channelSpeed: 1,
    drain: {
      /** Par touche, toutes les 0,4 s tant que le contact tient. */
      damage: 5,
      interval: 0.4,
      /** Ce qu'elle récupère : **la totalité**. À contact parfait, 4 s rendent
       *  50 PV — un septième de sa barre. Elle ne peut pas s'en sortir avec ça
       *  seule, mais elle peut renverser une fin de duel. */
      heal: 1,
      reach: 26,
    },
  },

  projectiles: {},
  progression: { stack: 0, stack2: 0 },

  hud: {
    stats: [
      /** La phase, et son **sens** : sans la flèche, 60 % ne dit pas si le
       *  danger monte ou retombe — or c'est toute l'information utile. */
      (f) => `Phase: ${Math.round((f.state.ill ?? 0) * 100)}% ${f.state.waxing ? '↑' : '↓'}`,
      (f) => `Tide: ${formatSeconds(Math.max(0, f.ability.timer))}`,
    ],
    statsFr: [
      (f) => `Phase : ${Math.round((f.state.ill ?? 0) * 100)} % ${f.state.waxing ? '↑' : '↓'}`,
      (f) => `Marée : ${formatSeconds(Math.max(0, f.ability.timer))}`,
    ],
    color: '#b5d5e4',
  },

  /**
   * **Le cycle, et c'est la seule horloge qui compte chez elle.**
   *
   * Bloc lu par le **seul module de LUNE** — le moteur ne le voit jamais, comme
   * le créneau `strike` de l'Hoplite. 12 s : six de croissance, six de
   * décroissance.
   *
   * **Pourquoi 12 et pas 10 ou 8.** Le Soleil tire toutes les 7 s. 7 et 12 sont
   * premiers entre eux, donc les deux horloges ne retombent en phase que toutes
   * les **84 s** — plus long qu'un duel. L'instant du faisceau se promène donc
   * dans le cycle lunaire, et deux duels des mêmes boss ne se ressemblent
   * jamais. Un cycle de 14 (= 2 × 7) aurait figé le couple.
   */
  moon: {
    period: 12,
    /** Bornes de `sizeFactor`, appliquées à `look.radius` (70) : 44 → 96. */
    size: { min: 0.629, max: 1.371 },
    /** Bornes de `boostFactor`, appliquées à `movement.speed` (250) : 600 → 250. */
    speed: { min: 1, max: 2.4 },
  },
});
