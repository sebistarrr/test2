/**
 * Constantes de scène relevées **image par image** sur la vidéo de référence
 * (720x1280, 30 fps, 60,4 s). Chaque valeur porte la mesure d'origine.
 *
 * Ces valeurs décrivent le *décor* et la *mise en page* : elles ne changent
 * jamais, d'un duel à l'autre comme d'un élément à l'autre.
 *
 * @module data/tuning
 */

import { deepFreeze } from './freeze.js';

export const STAGE = deepFreeze({
  width: 720, // = résolution de la vidéo source
  height: 1280,
  /**
   * Fond hors-arène. La vidéo est sur papier crème `rgb(249,241,218)` ; le site
   * lui préfère une **encre sombre**. Seul ce pourtour change : l'arène reste
   * blanche, donc tout le pixel-art garde exactement ses contours noirs.
   */
  paper: '#1c1a26',
  /**
   * Contour du « chrome » posé **sur** ce fond sombre (titre, lignes de stat) :
   * un noir y disparaîtrait, on passe donc au crème du papier d'origine.
   */
  outline: '#f4eddc',
  /**
   * Fond des jauges d'ultime : la plaque crème est conservée pour que
   * l'intérieur des jauges reste identique à la vidéo, libellé noir compris.
   */
  plate: '#f9f1da',
});

export const ARENA = deepFreeze({
  // Bord extérieur noir mesuré : x 40→679, y 320→959 (soit 640x640)
  x: 40,
  y: 320,
  size: 640,
  border: 6, // épaisseur du trait noir (mesurée 6 px)
  fill: '#ffffff',
  stroke: '#000000',
  // surface de jeu réelle (intérieur du trait)
  get inner() {
    return {
      left: this.x + this.border,
      top: this.y + this.border,
      right: this.x + this.size - this.border,
      bottom: this.y + this.size - this.border,
    };
  },
});

export const TITLE = deepFreeze({
  // Titre mesuré : hauteur de casse 247→310 px, centré sur x = 361
  centerX: 361,
  baseline: 310,
  fontSize: 58,
  gap: 14, // espace entre les blocs texte/icône
  iconSize: 52,
  /** Sur fond sombre, le « VS » devient une lettre évidée à liseré clair. */
  vsColor: '#1c1a26',
  vsSize: 40,
  stroke: '#f4eddc', // crème (voir STAGE.outline)
  strokeWidth: 7,
});

export const HUD = deepFreeze({
  /**
   * **Bandeau de points de vie, en haut de l'écran** — à plusieurs seulement.
   *
   * La bande y = 0 → 240 est vide : l'arène commence à 320 et le titre a sa
   * hauteur de casse entre 247 et 310. Les plaques s'y accrochent par le haut,
   * sur les mêmes abscisses et la même largeur que les jauges du bas, pour que
   * les deux bandeaux se lisent comme un seul système.
   *
   * En duel, rien ici : le chiffre de PV sur la bille est la lecture relevée
   * sur la vidéo, et deux plaques en haut la doubleraient sans rien apprendre.
   */
  hpTop: { y: 100, rowHeight: 40, height: 34, leftX: 39, rightX: 412, width: 268, border: 2, labelPad: 8 },

  /**
   * **Bloc de pouvoirs par combattant, en bas** — à plusieurs seulement.
   *
   * Un bloc = jauge d'ultime, jauge de pouvoir spécial dessous, puis la ligne
   * de stat. C'est ce que le duel affiche déjà, en plus petit et répété : à
   * cinq combattants il faut trois rangées de deux, soit 970 → 1210, ce qui
   * tient sous les 1280 de la scène.
   */
  powers: {
    y: 970,
    rowHeight: 80,
    barHeight: 23,
    gap: 3,
    statSize: 17,
    leftX: 39,
    rightX: 412,
    width: 268,
    border: 2,
    labelSize: 16,
    labelPad: 7,
  },

  // Deux jauges d'ultime, mesurées : x 39→307 et 412→680, y 965→1000
  bar: {
    y: 965,
    height: 35,
    width: 268,
    leftX: 39,
    rightX: 412,
    border: 2,
    labelSize: 22,
    labelPad: 8,
  },
  /**
   * **Jauge de pouvoir spécial, collée sous celle de l'ultime.**
   *
   * Tout est recopié de `bar` sauf `y` : mêmes largeur, hauteur, abscisses,
   * cadre et libellé. C'est voulu — les deux rangées doivent se lire comme une
   * paire, pas comme une jauge et son petit frère. `render/hud.js` les trace
   * d'ailleurs avec **la même fonction**, donc l'égalité ne peut pas se perdre
   * dans une retouche.
   *
   * `y` vaut 1005 : le bas de la jauge d'ultime (965 + 35) plus les 5 px
   * d'écart que la vidéo laisse entre cette jauge et la ligne de stat.
   */
  special: {
    y: 1005,
    height: 35,
    width: 268,
    leftX: 39,
    rightX: 412,
    border: 2,
    labelSize: 22,
    labelPad: 8,
  },
  /**
   * Lignes de statistique. Glyphes mesurés 1005→1038, soit une base à 1036 ;
   * interligne mesuré 31 px sur les vidéos à deux lignes (Lumière, Eau).
   *
   * **La base descend de 1036 à 1076**, écart assumé au relevé : la seconde
   * jauge occupe désormais la bande où les glyphes tombaient. Le décalage vaut
   * exactement la hauteur de cette jauge plus son écart (35 + 5), donc les
   * proportions relevées entre jauge et texte sont conservées — c'est le bloc
   * entier qui glisse, pas l'espacement qui change.
   */
  stat: {
    baseline: 1076,
    lineHeight: 31,
    fontSize: 30,
    leftX: 39,
    rightX: 681,
    strokeWidth: 5,
  },
});

/** Physique commune à tous les éléments (le « moteur »). */
export const PHYSICS = deepFreeze({
  /** Restitution des rebonds sur les murs (1 = parfaitement élastique). */
  wallRestitution: 1,
  /** Restitution du choc corps à corps. */
  bodyRestitution: 1,
  /** Vitesse de retour à la vitesse nominale après un recul (1/s). */
  speedRecovery: 3.2,
  /** Impulsion minimale de séparation quand deux corps s'interpénètrent. */
  separationBias: 0.6,
  /** Durée du flash blanc encaissé (mesurée ~6 images à 30 fps). */
  hitFlash: 0.2,
  /** Le sens de rotation de l'arme s'inverse aux rebonds (observé). */
  spinFlipsOnBounce: true,
});

export const MATCH = deepFreeze({
  maxHp: 100,

  /**
   * Bornes des points de vie réglables. 100 reste le défaut et la valeur du
   * cahier des charges ; les bornes ne sont là que pour qu'une saisie libre —
   * champ de l'écran de sélection, `?hp=` dans l'URL — ne puisse pas produire
   * un duel absurde. Le plancher est à 1 : à 0 le combattant serait mort avant
   * la première image.
   */
  hpRange: { min: 1, max: 999 },
  /** Petit temps mort avant l'engagement, le décor est déjà en place. */
  /**
   * Temps d'attente avant que le combat ne commence. **Les combattants y sont
   * immobiles** : ils bougeaient pendant cette seconde, ce qui n'était pas une
   * attente mais un début de course, et faisait qu'aucun duel ne partait
   * vraiment des points de départ mesurés. Ils tournent leur arme, l'arène
   * s'éclaircit, mais personne n'avance.
   */
  introDuration: 1,
  /** Ralenti + explosion au K.O. */
  koDuration: 1.8,
  koSlowmo: 0.25,
  /**
   * **Une seconde de gloire** : le perdant a disparu, le vainqueur reste seul
   * dans l'arène — il grossit d'un ressort, son arme s'emballe et il pousse des
   * anneaux à sa couleur — avant que l'écran de résultat ne se pose.
   */
  /**
   * Parade du vainqueur, et **temps d'affichage du ou des gagnants**. Une
   * seconde de plus qu'à l'origine : c'est la dernière image du duel et de la
   * vidéo exportée, et une seconde ne suffisait pas à lire un bandeau de noms —
   * surtout à deux vainqueurs.
   */
  victoryDuration: 2,
  victory: {
    /**
     * **Temps de mise en place**, distinct de `victoryDuration`.
     *
     * Glissement vers le centre, ressort d'échelle et nappe de lumière se
     * jouent sur cette seconde-là ; la durée totale ne fait que **tenir**
     * l'image plus longtemps. Sans cette séparation, allonger la parade
     * ralentissait toute l'animation au lieu de laisser le temps de lire le
     * bandeau — ce qui est l'inverse de ce qu'on veut.
     */
    settle: 1,
    spin: 2.6, // × la vitesse de rotation d'arme nominale
    pop: 0.22, // amplitude du ressort d'échelle
    ringEvery: 0.26, // s entre deux anneaux
    ringTo: 300, // rayon final d'un anneau
    sparks: 34, // étincelles par seconde
    /**
     * Écart entre deux vainqueurs paradant ensemble (2 contre 2). 78 les
     * faisait se chevaucher : une bille fait 82 px de diamètre et le ressort de
     * parade l'agrandit encore d'un quart. 150 les sépare franchement tout en
     * les gardant dans le cadre.
     */
    pairGap: 150,
    /** Bandeau de noms : ordonnée dans l'arène, et hauteur de casse. */
    bannerY: 0.24,
    bannerSize: 62,
  },
  /**
   * Mort subite : au-delà de `after`, tous les dégâts sont amplifiés
   * progressivement. Garantit qu'aucun duel ne s'éternise, y compris entre
   * deux combattants très défensifs (miroir Lumière contre Lumière).
   */
  suddenDeath: { after: 55, ramp: 18, max: 4 },
  /** Positions de départ mesurées sur la première image (fractions d'arène). */
  spawn: [
    { x: 0.29, y: 0.5, heading: -0.35 },
    { x: 0.71, y: 0.5, heading: Math.PI + 0.35 },
  ],

  /**
   * **Placement au-delà de deux combattants.** Les deux points ci-dessus sont
   * relevés sur la vidéo et ne servent qu'au duel ; à trois et plus, on répartit
   * les combattants sur un cercle centré dans l'arène, chacun tourné vers le
   * centre. `rayon` est en fraction du demi-côté : 0,62 laisse une bonne
   * seconde de course avant le premier contact, et personne ne démarre collé à
   * un mur.
   *
   * `depart` décale le premier combattant pour que l'anneau ne soit pas aligné
   * sur les axes — à 4, un anneau non décalé posait deux paires exactement
   * face à face et le duel s'ouvrait par deux chocs simultanés.
   */
  ring: { rayon: 0.62, depart: -Math.PI / 2 + 0.4 },
});

/**
 * Export vidéo du duel qu'on vient de regarder, au **format YouTube Shorts** :
 * vertical 9:16 en 1080 × 1920, ce que YouTube attend pour un Short. Un duel
 * dure 20 à 80 s, donc très en dessous des 3 minutes autorisées.
 *
 * L'enregistrement se fait pendant la partie, depuis un canvas dédié à cette
 * définition : le fichier ne dépend donc pas de la taille de la fenêtre ni du
 * `devicePixelRatio` de la machine.
 */
export const EXPORT = deepFreeze({
  width: 1080,
  height: 1920,
  fps: 30,
  /**
   * 6 Mbit/s : les aplats du pixel-art n'en consomment qu'environ 4, et
   * demander moins au codeur allège d'autant le fil principal. YouTube
   * réencode de toute façon à l'envoi.
   */
  bitrate: 6_000_000,
});
