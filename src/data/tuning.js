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
  // Lignes de statistique sous les jauges : glyphes 1005→1038.
  // Certains éléments en affichent deux (Lumière : dégâts + recul,
  // Eau : dégâts + taille) — interligne mesuré sur ces vidéos : 31 px.
  stat: {
    baseline: 1036,
    lineHeight: 31,
    fontSize: 30,
    leftX: 39,
    rightX: 681,
    strokeWidth: 5,
  },
  /**
   * **Jauges de pouvoir spécial**, sous les lignes de statistique.
   *
   * Rien de mesuré ici : la vidéo de référence n'a pas de troisième créneau de
   * pouvoir, donc pas de troisième jauge. La géométrie est **déduite** de
   * celle des jauges d'ultime — mêmes `x` et mêmes largeurs, pour que les deux
   * rangées s'alignent — et posée sous la deuxième ligne de stat (base 1067,
   * jambages jusqu'à ~1078), qui est le cas le plus chargé du roster.
   *
   * Elles sont plus basses et plus discrètes que celles de l'ultime : un
   * pouvoir greffé ne doit pas se lire comme l'ultime du personnage.
   */
  special: {
    y: 1104,
    height: 26,
    width: 268,
    leftX: 39,
    rightX: 412,
    border: 2,
    labelSize: 17,
    labelPad: 7,
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
  /** Petit temps mort avant l'engagement, le décor est déjà en place. */
  introDuration: 0.9,
  /** Ralenti + explosion au K.O. */
  koDuration: 1.8,
  koSlowmo: 0.25,
  /**
   * **Une seconde de gloire** : le perdant a disparu, le vainqueur reste seul
   * dans l'arène — il grossit d'un ressort, son arme s'emballe et il pousse des
   * anneaux à sa couleur — avant que l'écran de résultat ne se pose.
   */
  victoryDuration: 1,
  victory: {
    spin: 2.6, // × la vitesse de rotation d'arme nominale
    pop: 0.22, // amplitude du ressort d'échelle
    ringEvery: 0.26, // s entre deux anneaux
    ringTo: 300, // rayon final d'un anneau
    sparks: 34, // étincelles par seconde
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
