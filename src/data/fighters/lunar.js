import { fiche, SPIN } from '../defaults.js';
import { formatSeconds } from '../format.js';

/* ==========================================================================
 *  LUNE  (MOON) — le **second boss**, entièrement redessiné
 *
 *  Quatrième combattant **inventé** du dépôt. Aucune vidéo de référence, donc
 *  **aucune valeur ne peut porter `mesuré`** : tout y est `calé` ou `déduit`.
 *
 *  ------------------------------------------------------------------------
 *  **Ce qu'elle était, et pourquoi plus rien n'en reste.** La première version
 *  tenait tout entière dans un nombre invisible : l'illumination, qui montait et
 *  redescendait sur 12 s et réécrivait son rayon (44 → 96), sa vitesse
 *  (600 → 250) et son contact (1 → 7). Sur le papier c'était le contraire du
 *  Soleil ; à l'écran c'était **un personnage sans silhouette** — une arme
 *  invisible (`head.sprite: null`), deux pouvoirs qui ne dessinaient qu'un
 *  anneau, et un corps composé de deux images dont la claire recouvrait la
 *  sombre exactement là où la maquette était la plus belle. Redemandée en
 *  entier (« j'aime pas trop moon, peux-tu le revoir complètement, conserve sa
 *  taille »), elle est refaite sur un principe inverse : **tout ce qui la fait
 *  gagner doit se voir**.
 *
 *  **Ce qu'elle est maintenant : un astre criblé, et son anneau.** Un corps
 *  presque noir de **rayon 88, fixe**, la face d'éclipse de la maquette avec son
 *  limbe qui brûle ; autour, **trois satellites** de 44 px en orbite lente, qui
 *  sont son arme (`weapon.spokes: 3`, et ils sont *dessinés*, eux). Tout le
 *  personnage est cette image-là, et ses deux pouvoirs n'en sortent pas :
 *
 *   • **Météores** — trois cailloux quittent l'anneau et tombent sur la cible,
 *     annoncés au sol pendant leur chute. C'est sa portée, celle qu'elle n'avait
 *     pas du tout ;
 *   • **Éclipse** — elle enfle jusqu'à 116 de rayon, l'arène passe à la nuit, et
 *     son anneau devient mortel pendant 3,5 s.
 *
 *  **Le partage avec le Soleil, qui est la raison d'être des deux.** Lui est
 *  planté (230 px/s) et ne produit que par *un* événement annoncé deux secondes
 *  à l'avance, sur une ligne qu'on peut quitter. Elle est **mobile** (430 px/s,
 *  presque le double), elle produit **en continu par le contact**, et son
 *  annonce à elle n'est pas une ligne mais **une zone au sol**. On fuit le
 *  Soleil sur le côté ; on ne fuit pas la Lune, on choisit seulement où être
 *  quand elle arrive.
 *
 *  **Les deux maquettes sont conservées, elles ont juste échangé leurs rôles** —
 *  demandé. `lunar-dark.png` est le corps, seul et entier (le terminateur qui le
 *  recouvrait a disparu avec le cycle) ; `lunar-lit.png` est le satellite, donc
 *  aussi le météore. Chacune est enfin dessinée à la taille où elle se lit.
 * ========================================================================== */
export const LUNAR = fiche({
  id: 'lunar',
  /** Archétype traduit, comme SOLEIL/SUN et DRUIDE/DRUID. */
  name: 'LUNE',
  nameRef: 'MOON',
  tagline: 'Astre criblé — son anneau tourne, et par moments il tombe',
  taglineRef: 'Cratered star — its ring turns, and now and then it falls',
  icon: 'iconLunar',
  /** **Rangée de l'écran de sélection**, et rien d'autre.
   *  Boss, comme le Soleil, et regroupé avec lui à l'écran de sélection. Clé lue
   *  par `ui/select.js` seul : le moteur ne la connaît pas. */
  tier: 'boss',

  /**
   * **480 PV**, contre 500 au Soleil et 100 à la norme.
   *
   * Le chiffre survit au redessin, et il n'a pas été repris par habitude : il a
   * été **rebalayé après coup**, parce que tout ce qui le justifiait a changé.
   * Le raisonnement, lui, tient toujours — le duel des deux boss dure une
   * minute et demie, or `MATCH.suddenDeath` multiplie les dégâts par 4 à partir
   * de 55 s, donc il se joue **entièrement dans la rampe**, où esquiver
   * longtemps ne sert plus à rien et où la barre est le seul levier qui reste.
   *
   * Le balayage reste **monotone**, donc c'est un vrai levier et non du bruit —
   * voir `docs/FICHES.md` pour le relevé après redessin.
   *
   * Aucune réduction de dégâts, comme tous les autres : un seul chiffre porte
   * sa résistance, donc le banc n'a qu'un levier à tourner.
   */
  maxHp: 460,

  look: {
    /**
     * **88, et c'est une vraie constante maintenant — demandé** (« conserve sa
     * taille », précisé en « juste un gros corps, taille fixe »).
     *
     * C'était le *rayon de référence* d'un corps qui respirait entre 44 et 96 ;
     * c'est désormais le rayon, point. 88 est pris **au-dessus du Soleil** (82)
     * et sous l'ancien maximum (96) : elle est le plus gros corps du jeu, ce qui
     * est la moitié de sa présence à l'écran, et la seule chose qui l'agrandisse
     * encore est son ultime.
     *
     * `f.sizeFactor` (compteur générique, invariant 7) n'a pas disparu pour
     * autant — l'Éclipse l'écrit pour porter le corps à 116 le temps de la
     * totalité. Il a changé de nature : il était un **cycle**, il est devenu un
     * **moment**.
     */
    radius: 88,
    /**
     * **Cinq teintes relevées sur *une* maquette**, et c'est un changement :
     * elles venaient des deux, trois de l'éclipse et deux de la pleine lune, du
     * temps où le corps était composé des deux images. La pleine lune n'est plus
     * le corps — elle est un satellite de 44 px —, donc la laisser décider de la
     * couleur du personnage reviendrait à colorier la lune d'après ses cailloux.
     *
     * Bandes de luminance sur les pixels opaques de `lunar-dark.png`, 3ᵉ · 20ᵉ ·
     * 50ᵉ · 80ᵉ · 97ᵉ centile — la méthode du Soleil. Le déplacement est petit
     * (`light` passe du cyan `#b5d5e4` au gris-lavande `#bfc0de`) mais il ferme
     * la seule porte par laquelle la palette pouvait dériver du dessin.
     *
     * Le violet `#604ea1` reste en `body` — donc c'est lui qui teinte la carte
     * de sélection et les gerbes de dégâts — parce que c'est **la signature** :
     * c'est la couleur de la couronne d'éclipse, la chose la plus voyante du
     * dessin, et personne d'autre du roster n'a de violet.
     *
     * Source unique, comme pour le Soleil : le module n'a **aucun littéral de
     * couleur**, et les trois cartes de `pixelart/lunar.js` recopient ces cinq
     * lignes.
     */
    palette: {
      edge: '#0d0a21', // encre, le noir bleuté du disque éteint
      shadow: '#1d1738', // ombre
      body: '#604ea1', // violet — la couronne d'éclipse, et la signature
      light: '#bfc0de', // gris-lavande des poussières éclairées
      core: '#f9fdfd', // blanc froid du limbe
    },
    /**
     * **Le corps est un sprite, et il est enfin *un seul*.**
     *
     * Le module peignait `lunarLit` par-dessus, découpée au terminateur, selon
     * la phase. C'est parti avec le cycle, et c'est le geste qui change le plus
     * l'écran : le terminateur recouvrait exactement ce que la maquette a de
     * meilleur — l'anneau de lumière rasante qui cerne le disque éteint — et à
     * pleine lune il n'en restait rien. Contraste médian contre l'arène
     * blanche : **6,5** pour ce dessin-ci, **1,54** pour celui qui le
     * recouvrait, dont 48 % des pixels sous le seuil de visibilité. Le
     * personnage passait donc la moitié de son temps à être presque invisible.
     *
     * Pas de `spriteScale` : le PNG est coupé à son disque, il remplit
     * exactement son cadre, la correction vaudrait 1 — et une clé qui recopie
     * son défaut est une occasion de divergence silencieuse.
     */
    sprite: 'lunarDark',
    /** Le voile d'encaissement se **pose par-dessus** le dessin au lieu de le
     *  remplacer (sinon chaque coup effacerait la lune). Un peu plus discret
     *  que celui du Soleil : le corps est sombre, un voile clair y ressort
     *  davantage. */
    spriteFlash: 0.55,
    body: '#604ea1',
    /** **Il éclaircit au lieu d'assombrir** — l'inverse du roster. Sur un corps
     *  presque noir, un flash sombre ne se verrait pas ; c'est la même
     *  compensation que le Mannequin, qui rougit au lieu de blanchir. */
    bodyHit: '#f9fdfd',
    outline: '#0d0a21',
    outlineWidth: 6,
    /**
     * **Chiffre de PV cerné.** Le corps n'est plus qu'une image, mais c'est une
     * image **contrastée** : sous l'empreinte des digits cohabitent l'encre du
     * disque et le blanc du limbe. Aucune encre unique ne tient sur les deux —
     * même situation que le Soleil (53 % clair / 40 % sombre), qui avait déjà
     * forcé l'apparition de `hpStroke`. Le contour isole le chiffre au lieu
     * d'essayer de composer.
     */
    hpColor: '#f9fdfd',
    hpStroke: '#0d0a21',
    /**
     * **L'anneau de poussière de glace, rendu au jeu plutôt que cuit dans
     * l'image.** La maquette en porte un ; il a été coupé au détourage, parce
     * qu'un halo cuit serait figé alors que celui-ci **bat**. Même raisonnement
     * que pour le halo pêche du Soleil. Resserré depuis le redessin (1,22 →
     * 1,12) : le corps a grossi, et l'orbite des satellites occupe désormais
     * l'espace que le halo prenait.
     */
    aura: { color: 'rgba(96,78,161,0.38)', radius: 1.12, pulse: 0.5, showWhen: 'always' },
    flair: {
      motes: { rate: 12, size: 8, drift: 18, rise: -14, colors: ['#f9fdfd', '#bfc0de', '#604ea1'] },
      impact: ['#f9fdfd', '#ffffff', '#604ea1'],
      shape: 'spark',
      castFlash: 'rgba(249,253,253,0.5)',
    },
    trail: { color: 'rgba(96,78,161,0.24)', every: 0.05, life: 0.4 },
    accent: '#bfc0de',
  },

  sound: {
    pitch: 0.62,
    shot: null, // aucun projectile : les météores sont tenus par son module
    hit: 'knell',
    /** **Le fracas des météores qui touchent le sol.** Le créneau générique du
     *  projectile perdu, rebranché sur l'atterrissage — elle n'a pas de
     *  projectile, il serait mort sans ça (piège « une recette meurt quand le
     *  créneau qui la nommait cesse d'être joué »). */
    impact: 'impact',
    bounce: 'thud',
    /** `hail` remplace `swell`, qui disait une houle qui enfle : la Marée n'existe
     *  plus, et un caillou qui tombe ne monte pas. Voir `data/sound.js`. */
    ability: 'hail',
    special: null,
    ultimate: 'umbra',
  },

  /**
   * **430 px/s — et c'est le chiffre qui la sépare le plus du Soleil.**
   *
   * Il valait 250 (plancher d'un cycle qui montait à 600). Le cycle parti, il
   * fallait trancher, et le banc n'a pas eu à départager : le Soleil est
   * **planté** (230, le plus lent du roster de très loin) parce que toute sa
   * production passe par un faisceau qu'il tire à l'arrêt. Un second boss qui
   * produirait par le **contact** ne peut pas être lent : il ne toucherait
   * jamais. 430 la met au niveau du Golem et de l'Hoplite — au milieu du roster,
   * avec le plus gros corps du jeu.
   *
   * `turnRate` 1,5 : au-dessus du Soleil (1,0), sous les tireurs (1,9 · 2,0).
   * Elle vire mal pour un mobile, ce qui est la contrepartie de sa masse.
   */
  movement: { speed: 430, turnRate: 1.5, seek: 0.38 },

  weapon: {
    name: 'Anneau de débris',
    nameRef: 'Debris Ring',
    /**
     * **176 px, et pour la première fois chez elle l'arme se *voit*.**
     *
     * L'ancienne était invisible (`head.sprite: null`, comme le Mannequin) : une
     * coquille de six branches qu'on ne pouvait ni lire ni anticiper. C'était le
     * premier reproche, et c'est le premier corrigé — trois satellites dessinés,
     * en orbite lente, à 154 px du centre.
     *
     * La discipline du dépôt s'applique de nouveau, puisqu'il y a un dessin :
     * `handle.length` **132** + largeur dessinée **44** = `reach` **176**. Et
     * comme la carte est carrée (472 × 472 pour le PNG, 16 × 16 pour le repli),
     * la largeur dessinée vaut exactement `map.h × head.scale`, sans correction
     * de rapport d'aspect.
     *
     * **Pourquoi 176 et pas moins.** L'Éclipse porte le corps à 116 de rayon.
     * Deux corps ne se chevauchent jamais (`resolveBodies` les sépare à chaque
     * pas), donc un adversaire de rayon 41 est alors à **157 px au minimum** :
     * une orbite plus courte enfermerait les satellites *dans* le corps pendant
     * la totalité, et l'arme deviendrait muette au moment précis où elle doit
     * frapper le plus fort. La capsule porte de 91 à 217 px du centre, l'astre
     * enflé tient dedans. C'est le même piège que la Marée d'avant, vu venir
     * cette fois.
     */
    reach: 176,
    /**
     * **SPIN × 0,5**, soit 2,88 rad/s — une orbite en 2,2 s. Entre le Golem
     * (0,45) et le Soleil (0,55), et calé bas pour la raison que le dépôt
     * répète : *une arme qui balaie vite touche souvent*, ce qui vaut au cube
     * avec trois branches. Et à l'œil, une orbite qui tourne vite ne se lit plus
     * comme une orbite.
     */
    spin: SPIN * 0.5,
    /** Rétrograde, contre le sens du Soleil : les deux boss ne tournent pas du
     *  même côté, ce qui suffit à les distinguer d'un coup d'œil. */
    spinDir: -1,
    /**
     * **Trois satellites.** Même mécanisme que la couronne du Soleil
     * (`weapon.spokes`, lu par `Fighter.bladeSegment(k)`, `weaponHit` et
     * `drawWeapon`), mais employé pour ce qu'il montre et non pour ce qu'il
     * ferme : six branches invisibles bouchaient des angles morts, trois
     * cailloux dessinent une orbite.
     *
     * **Trois et pas plus**, parce qu'il en reste des trous : contourner l'astre
     * redevient une parade, ce que la couronne à huit du Soleil interdit. Les
     * deux boss ne se défendent donc pas de la même façon.
     *
     * Le verrou de mêlée est testé **une fois pour toutes** avant la boucle des
     * branches — sinon trois branches feraient trois touches par pas.
     */
    spokes: 3,
    /** `width: 0` : il n'y a pas de manche, les satellites flottent. `length`
     *  ne sert qu'à les décaler jusqu'à leur orbite. */
    handle: { length: 132, width: 0, color: '#604ea1', dark: '#1d1738', outline: '#0d0a21', gem: null },
    /**
     * **Le satellite est la maquette de pleine lune**, à 44 px.
     *
     * C'est le second emploi des deux images fournies, et le seul qui les rende
     * toutes les deux lisibles : à 176 px sur l'arène blanche, `lunar-lit.png`
     * ne tenait aucun contraste (1,54 relevé) ; à 44 px, cerclée par le lavis
     * sombre que le module pose dessous, elle se lit comme un caillou criblé.
     *
     * `scale = 44 / 16 = 2,75` : `drawSpriteLeft` dimensionne par la **hauteur**
     * (`map.h × scale`, prise sur la carte texte) puis applique le rapport
     * d'aspect du PNG — qui vaut 1, l'image étant carrée. La largeur dessinée
     * vaut donc 44, et `132 + 44 = 176` retombe sur `reach`.
     */
    head: { sprite: 'lunarLit', scale: 2.75 },
    /** Les satellites passent **par-dessus** le corps quand leur orbite le
     *  croise : ils tournent autour de l'astre, ils ne se cachent pas derrière.
     *  Purement visuel — `bladeSegment()` ne lit pas ce drapeau. */
    overBody: true,
    /** Le chiffre de PV repasse après l'arme : une orbite qui traverse le centre
     *  masquerait autrement les digits une fois par tour. */
    hpOverWeapon: true,
    /**
     * **Un disque, pas un segment**, et c'est le satellite lui-même :
     * `from = to = 154 / 176 = 0,875`, soit le centre du caillou, et
     * `radius: 22` soit sa moitié. Le dessin ne ment donc pas d'un pixel sur
     * l'endroit où l'arme porte — la même exigence que la lance de l'Hoplite,
     * ici gratuite puisque la carte est ronde. C'est la forme du Shinobi
     * (`from: 0, to: 0`) déplacée sur l'orbite.
     */
    hitbox: { from: 0.875, to: 0.875, radius: 22 },
    melee: {
      /**
       * **Le contact est redevenu sa source principale, et il est *constant*.**
       *
       * Il valait `1 + 6 × illumination` — la seule valeur du dépôt qui
       * respirait, et aussi la seule que personne ne pouvait lire à l'écran :
       * rien ne disait si le prochain coup ferait 1 ou 7. Il en reste deux
       * régimes, et ils se voient tous les deux : **5** en temps normal,
       * **11 pendant la totalité de l'Éclipse**, quand l'arène est noire et
       * qu'elle a doublé de volume. On sait donc toujours ce qu'on encaisse.
       *
       * Écrit en fonction, comme `Damage = Spin` du Ronin — mais lu sur un état
       * que le module pose (`f.state.totality`), pas sur une stat du moteur.
       * Les deux régimes sont nommés juste au-dessus pour qu'un balayage les
       * trouve ; `?? false` couvre l'image de naissance, avant le premier
       * `update`.
       */
      base: 5,
      totality: 11,
      damage: (f) => (f.state.totality ?? false
        ? f.el.weapon.melee.totality
        : f.el.weapon.melee.base),
      /** Calé : trois satellites, mais `weaponHit` teste le verrou **une fois**
       *  avant la boucle des branches, donc c'est bien un coup toutes les
       *  0,85 s au mieux — 5,9 PV/s au contact, 12,9 en totalité. */
      cooldown: 0.85,
      /** Elle repousse franchement : un adversaire collé ne doit pas rester
       *  entre deux satellites, il doit être renvoyé sur le suivant. */
      knockback: 150,
      /** **Presque nul, et c'est une intention** : les sept autres reculent en
       *  frappant, la Lune non. Elle pèse trop. `resolveMelee` l'applique hors
       *  de `damage`, donc la valeur est bien lue. */
      selfRecoil: 8,
    },
  },

  /* ---------- POUVOIR — Météores ---------- */
  /**
   * **Trois cailloux quittent l'anneau et tombent sur la cible.**
   *
   * C'est sa portée, et elle n'en avait **aucune** : l'ancienne Marée attirait
   * l'adversaire au lieu de l'atteindre, ce qui punissait surtout les
   * combattants lents et ne se voyait qu'à un anneau. Ici, trois ombres
   * apparaissent au sol autour de l'adversaire, grossissent pendant 0,8 s, et
   * trois pierres arrivent dessus.
   *
   * **Annoncé, et c'est la différence avec le Soleil.** Lui trace *une ligne* et
   * fige son axe : on s'en sort en sortant de la ligne. Elle sème **des zones**
   * autour d'une cible mobile : on s'en sort en continuant de bouger. Aucun des
   * deux ne se dodge de la même façon, et c'est tout l'intérêt d'avoir deux boss.
   *
   * **Aucun tirage** — invariant 2. Le semis est déduit de `ability.uses` par
   * l'angle d'or, donc deux salves ne se superposent jamais et deux duels à la
   * même graine tombent au même endroit.
   */
  ability: {
    id: 'meteors',
    name: 'Météores',
    nameRef: 'Meteors',
    /** Calé : à 3,2 s, la salve tombe 8 à 12 fois dans un duel de boss, et il
     *  reste toujours plus de deux secondes de sol propre entre deux. */
    cooldown: 3.2,
    /** Trois, comme les trois satellites : ce sont eux qui tombent. */
    count: 3,
    /** Rayon du semis autour de la cible. Le premier caillou tombe **sur** elle,
     *  les deux autres à 96 px — assez pour que reculer droit devant n'en évite
     *  pas deux d'un coup. */
    spread: 96,
    /** Temps de chute, donc temps d'esquive. 0,8 s : un tiers de moins que
     *  l'annonce du Soleil (1,1 s de charge), parce que la zone est petite et
     *  qu'il suffit d'en sortir. */
    fall: 0.8,
    /** Décalage entre deux cailloux d'une même salve. Sans lui les trois
     *  touchent **dans le même pas**, donc un seul fracas au lieu de trois
     *  (`MIX.repeatGap`) et une gerbe unique : la salve se lisait comme un
     *  unique gros coup. */
    stagger: 0.16,
    /** Hauteur apparente du départ, en px de scène : le caillou est dessiné
     *  au-dessus de son ombre, et la comble en chute libre (`(1-u)²`). */
    height: 300,
    /** Diamètre dessiné du météore. Un peu moins que le satellite (44) : il
     *  vient d'arriver de haut, il doit se lire comme plus petit que l'anneau. */
    size: 40,
    /** Par caillou. Trois par salve, mais on n'en prend normalement qu'un. */
    damage: 6,
    /** Rayon de l'explosion, mesuré **de bord à bord** comme toutes les zones du
     *  dépôt. 58 px : à peine plus que le corps d'un combattant normal (41), donc
     *  la zone annoncée au sol est bien celle qui blesse. */
    blast: 58,
    knockback: 170,
    /**
     * **Secousse d'impact, et elle est volontairement petite.** Trois cailloux
     * décalés de 0,16 s font une secousse **continue** d'une demi-seconde, trois
     * fois par salve ; or le décor ne tremble pas (invariant 4, voulu) alors que
     * son contenu tremble sous le clip, donc une secousse franche découvre un
     * liseré d'arène nue au bord — visible sur toute ambiance de plein cadre,
     * celle du Soleil comprise. 2,2 la laisse sous le pixel, et la touche
     * elle-même en ajoute déjà une (`Match.damage`, 2 hors mêlée).
     */
    shake: 2.2,
    /** Anneau d'impact, tracé par `Effects.ring`. */
    ring: { time: 0.42, color: 'rgba(96,78,161,0.85)', width: 6 },
  },

  /* ---------- ULTIME — Éclipse ---------- */
  /**
   * **Elle passe devant la lumière, et l'arène perd le jour.**
   *
   * Le nom reste, le pouvoir ne partage plus rien avec l'ancien. Celui-là
   * *rapetissait* — 4 s de nouvelle lune forcée, minuscule et rapide, avec un
   * drain au contact — et n'avait **aucune annonce**, ce qui le rendait
   * illisible : on encaissait sans avoir rien vu venir.
   *
   * Il fait maintenant l'inverse, et il s'annonce :
   *  • **0,9 s** pendant lesquelles l'arène s'assombrit et le corps enfle ;
   *  • **3,5 s de totalité** : rayon 116 (le plus gros objet que le jeu ait
   *    dessiné), nuit pleine, une onde de choc au moment du contact d'ombre, et
   *    l'anneau de débris qui passe de 5 à 11 par coup.
   *
   * **Pourquoi une annonce alors que l'ancienne n'en avait pas.** Le Rayon
   * solaire s'annonce parce qu'il est **imparable de près** ; l'Éclipse
   * s'annonce parce qu'elle **déplace le décor**, et qu'un décor qui bascule
   * sans prévenir se lit comme un bug d'affichage. C'est l'annonce qui en fait
   * un événement plutôt qu'un accident.
   *
   * Elle est **ralentie** pendant toute la manœuvre (`channelSpeed`) : un astre
   * deux fois plus gros qui garde sa vitesse serait impossible à quitter. C'est
   * la contrepartie, et c'est la même que celle du Soleil, en moins brutale — il
   * est cloué, elle rampe.
   */
  ultimate: {
    id: 'eclipse',
    name: 'Éclipse',
    nameRef: 'ECLIPSE',
    barLabel: 'ECLIPSE',
    barLabelFr: 'ÉCLIPSE',
    barFill: '#604ea1',
    barText: '#f9fdfd',
    /** Horloge de 9 s, contre 7 au Soleil. 7 et 9 sont premiers entre eux : les
     *  deux ultimes ne retombent en phase que toutes les 63 s, donc deux duels
     *  de boss ne se ressemblent jamais tout à fait. */
    chargeRate: 100 / 9,
    chargeOnHit: 2,
    /** L'annonce. Voir plus haut : c'est le temps que met la nuit à tomber. */
    windup: 0.9,
    /** **Total, annonce comprise** — 0,9 + 3,5. Le module lit `windup` pour
     *  savoir où il en est, exactement comme celui du Soleil. */
    duration: 4.4,
    /** Dernière fraction de la totalité pendant laquelle le corps **redescend**
     *  à sa taille. Sans elle il se dégonflerait d'un pas à l'autre, ce qui se
     *  lit comme une téléportation. */
    settle: 0.5,
    /** Elle rampe : 62 % de sa vitesse, soit 267 px/s — au niveau du Soleil, et
     *  seulement pendant ces 4,4 s. */
    channelSpeed: 0.62,
    /** **Facteur de `sizeFactor` à la totalité** : 88 × 1,32 = 116,2 de rayon,
     *  et 46 % de surface en plus. C'est le seul lecteur du compteur générique
     *  depuis que le cycle a disparu — il est passé d'un cycle à un moment. */
    swell: 1.32,
    /** **L'onde de contact d'ombre**, au premier pas de la totalité : elle dit
     *  que l'annonce est finie. Repousse franchement, ce qui est voulu — elle a
     *  3,5 s pour les rattraper, et elle veut de l'élan, pas un corps collé
     *  contre elle au moment où elle enfle. */
    burst: { damage: 14, radius: 250, knockback: 200 },
    /** Une fois par ultime, contre trois fois par salve pour les météores : elle
     *  peut donc être franche. Sous le Rayon solaire (11) et le Séisme (16). */
    shake: 9,
    ring: { to: 250, time: 0.6, width: 10 },
    /**
     * **La nuit, et c'est la même mécanique que la chaleur du Soleil.**
     *
     * Deux couches dans `drawUnder`, donc **sous** les combattants : un lavis au
     * sol et une nuit qui monte des quatre bords. La règle de composition de
     * `flair.js` est explicite — *rien entre le spectateur et les combattants* —
     * et une nuit d'arène est exactement le cas prévu : on remplit par le fond
     * et par les bords.
     *
     * **Plus fort que l'ambiance solaire** (0,44 / 0,72 contre 0,38 / 0,64),
     * parce qu'elle dure 4,4 s au lieu de monter lentement sur cinq secondes :
     * elle doit être arrivée avant qu'on ait fini de la remarquer. Et parce
     * qu'assombrir coûte moins de lisibilité qu'éclaircir sur une arène blanche
     * — les deux combattants et leurs deux chiffres de PV restent lisibles à
     * nuit pleine, le contour du chiffre s'en charge.
     */
    ambience: { tint: 0.44, vignette: 0.72 },
  },

  projectiles: {},
  progression: { stack: 0, stack2: 0 },

  hud: {
    stats: [
      (f) => `Meteors: ${formatSeconds(Math.max(0, f.ability.timer))}`,
      /** **Les cailloux tombés**, pas les salves tirées : une salve qui n'a rien
       *  touché a quand même creusé trois cratères, et c'est cette production-là
       *  qu'on veut lire. Même esprit que la ligne du Mannequin. */
      (f) => `Craters: ${f.state.impacts ?? 0}`,
    ],
    statsFr: [
      (f) => `Météores : ${formatSeconds(Math.max(0, f.ability.timer))}`,
      (f) => `Cratères : ${f.state.impacts ?? 0}`,
    ],
    color: '#bfc0de',
  },
});
