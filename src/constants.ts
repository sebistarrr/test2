/* =====================================================================
   Constantes du relevé vidéo.

   Toute valeur « mesuré » vient du relevé image par image décrit dans
   CLAUDE.md (576 x 1024, 30 fps, 1159 frames). Toute valeur « calé » a été
   ajustée pour retomber sur le comportement observé quand la vidéo ne
   révèle pas la règle. Ne jamais changer un « mesuré » sans refaire le
   relevé : le tableau entier est solidaire.

   Les vitesses sont en px/s dans ce fichier. La conversion vers les
   px/pas de Matter.js est isolée dans physics.ts, pour que le relevé reste
   lisible tel qu'il a été pris.
   ===================================================================== */

/* --- 1. Géométrie ---------------------------------------------------- */

export const W = 576; // mesuré : largeur native de la vidéo
export const H = 1024; // mesuré : hauteur native

// Bords sombres mesurés aux colonnes 37..40 / 535..538 et aux lignes
// 261..264 / 759..762 => chemin (39,263,498,498), trait 3,5 px.
export const ARENA = {
  x: 39,
  y: 263,
  w: 498,
  h: 498,
  line: 3.5, // mesuré : couverture sous-pixel 3,46 px
} as const;

export const ARENA_CX = ARENA.x + ARENA.w / 2; // = 288, centre du canvas
export const ARENA_CY = ARENA.y + ARENA.h / 2; // = 512, centre du canvas
// Aire de jeu = intérieur du trait.
export const IN_X = ARENA.x + ARENA.line / 2;
export const IN_Y = ARENA.y + ARENA.line / 2;
export const IN_W = ARENA.w - ARENA.line;
export const IN_H = ARENA.h - ARENA.line;

// Jauges : alignées exactement sur les bords de l'arène (39 + 242 + 14 +
// 242 = 537). Le trait fait la même épaisseur que celui de l'arène — à 3 px
// les bords ne noircissent que deux lignes au lieu des trois du relevé.
export const BAR = {
  y: 777.5,
  h: 29,
  line: 3.5,
  left: { x: 39, w: 242 },
  right: { x: 295, w: 242 },
} as const;

export const BALL_R = 32; // mesuré : anneau sombre centré sur r = 32,2
export const BALL_LINE = 3; // mesuré : le trait couvre r 30,5..33,5

/* --- 2. Palette (médianes sur plaque temporelle débruitée) ------------ */

export const C = {
  page: '#D4CED5', // mesuré : (212,206,213), fond hors arène
  arena: '#FFFFFF', // mesuré : (255,255,255) hors HIGH NOON
  arenaNoon: '#FDF7ED', // mesuré : (253,247,237) pendant HIGH NOON
  ink: '#000000', // mesuré : bordure d'arène et de jauges
  ballLine: '#181008', // mesuré : (24,13,7), contour des billes

  outlaw: '#8A5934', // mesuré : (138,89,52) — titre, bille, jauge, stats
  blade: '#DCC462', // mesuré : (220,196,98) — idem côté Bladesman

  hp: '#F5F2EA', // mesuré : chiffre de PV, crème très clair
  label: '#FFFFFF', // mesuré : « HIGH NOON » / « BLADE RUSH »
  watermark: 'rgba(120,116,110,0.42)', // mesuré : rendu (167,163,157)
  dead: '#8E8A92', // mesuré : le camp mort passe en gris

  // Mesuré frames 223/224/225 : le disque touché passe de (135,89,61) à
  // (216,216,217) puis revient au marron. UNE frame à 30 fps, contour inclus.
  hit: '#E4E4E6',

  // Mesuré frame 643 : le coeur du vert rend (211,219,109) sur l'arène
  // crème (253,247,237), soit #B1C404 posé à 55 %.
  slash: [177, 196, 4] as const,
  slashA: 0.55,
  // Pendant BLADE RUSH l'aire verte passe de ~3 500 px à 18 488 px (5,3x).
  slashRush: [172, 226, 22] as const,
  slashRushA: 0.72,

  // Mesuré frame 300 : le sillage fait 2 px et rend (213,182,153) à
  // (236,206,177) sur l'arène crème — un trait pâle, pas un trait sombre.
  trail: [206, 174, 142] as const,
  trailLen: 74,
  trailSeg: 4,

  ghostA: 0.3, // mesuré frame 643 : 4 à 5 disques pâles derrière la bille
} as const;

/* --- 3. Typographie -------------------------------------------------- */

// Hauteurs de capitale mesurées sur la plaque débruitée, puis
// taille = hauteur_capitale / 0,716 (ratio d'un grotesque très gras).
export const FONT = '"Arial Black","Archivo Black","Helvetica Neue",Impact,sans-serif';

export const TYPE = {
  title: { size: 31, stroke: 6 }, // mesuré : cap 22 px, lignes 219..240
  stat: { size: 19, stroke: 5 }, // mesuré : cap ~13,5 px
  label: { size: 15, stroke: 4 }, // mesuré : cap ~11 px
  hp: { size: 32, stroke: 5 }, // mesuré : cap 23 px, lignes 515..537
  mark: { size: 19 },
} as const;

export const Y_TITLE = 240; // mesuré : bas des capitales du titre
export const Y_STAT1 = 839; // mesuré : « Damage: » cap 825..838
export const Y_STAT2 = 864; // mesuré : « Ammo: » / « Spin Speed: »
export const Y_LABEL = 792; // mesuré : libellés de jauge, cap 782..792
export const Y_MARK = 736; // mesuré : filigrane centré sur x = 288
export const X_LEFT = 42; // mesuré : bord gauche du remplissage
export const X_RIGHT = 534; // mesuré : bord droit du remplissage

/* --- 4. Règles du duel ----------------------------------------------- */

export const RULES = {
  hp: 100, // mesuré : les deux billes démarrent à 100

  // Médianes des segments rectilignes entre deux rebonds :
  // 16,1 px/frame et 20,2 px/frame à 30 fps.
  speedOutlaw: 483, // mesuré, px/s
  speedBlade: 605, // mesuré, px/s
  noonSpeedUp: 1.22, // mesuré : +22 % pendant HIGH NOON
  // Rappel de la norme de vitesse vers sa cible. Sans lui, chocs et recul
  // font dériver la norme alors que le relevé montre des trajets
  // rectilignes à vitesse constante — et deux billes finissent collées.
  speedRecall: 3.5, // par seconde

  // Outlaw ------------------------------------------------------------
  dmgOutlaw0: 3.0, // mesuré : valeur affichée à la frame 1
  dmgOutlawStep: 0.1, // mesuré : paliers de 0,10
  dmgOutlawMax: 6.0, // calé : la vidéo s'arrête à 5,50
  magazine: 6, // mesuré : « Ammo: n/6 »
  fireDelay: 600, // mesuré : ~18 frames entre deux décréments
  fireDelayNoon: 300, // mesuré : la cadence double pendant HIGH NOON
  reloadTime: 1600, // calé : durée du trou entre 0/6 et 6/6
  bulletSpeed: 840, // mesuré : ~28 px/frame à 30 fps
  recoil: 95, // mesuré : recul ordinaire, hors ultime
  // Mesuré : hors HIGH NOON la bille plafonne à 27,1 px/frame ; pendant
  // l'ultime elle atteint 46,0 px/frame (frame 1011) = 1 380 px/s.
  recoilNoon: 600,

  // Bladesman ---------------------------------------------------------
  spinMin: 0.8, // mesuré : plancher, jamais franchi
  spinMax: 3.0, // mesuré : plafond, tenu en palier
  spinRamp: 0.2, // mesuré : +0,07 toutes les 10 frames = 0,21/s
  spinPerHit: 0.15, // mesuré : sauts discrets de +0,15
  spinHold: 2000, // mesuré : ~55 frames de palier à 3,00
  spinDecay: 3.0, // mesuré : -1,00 toutes les 10 frames = -3,0/s
  dmgPerSpin: 2.0, // mesuré : Damage = 2 x Spin Speed, sans exception
  // Calé sur le banc à pas FIXE. Le portage Phaser tournait à ~20 fps au
  // banc et manquait des passes ; à 60 Hz garantis le test de balayage les
  // attrape toutes, et les mêmes verrous tuaient l'Outlaw en 26 s au lieu
  // des 38,6 s du relevé. Les valeurs sont donc plus hautes qu'en Phaser.
  swordCooldown: 1650, // calé : une seule touche par passe de lame
  // Pendant la ruée la lame tourne à 3 tours/s : chaque arête passe toutes
  // les ~167 ms. Un verrou long en avalerait deux sur trois.
  swordCooldownRush: 245,

  // Ultimes -----------------------------------------------------------
  noonCharge: 7.0, // mesuré : 238 px / 1,13 px-frame / 30 = 7,0 s
  noonDuration: 6.2, // mesuré : 238 / 1,28 / 30 = 6,2 s
  rushCharge: 9.0, // calé : moyenne des cycles 273/214/333 frames
  rushPerHit: 0.06, // calé : chaque coup d'épée avance la jauge
  rushDuration: 1.5, // durée stricte de la ruée, minutée
  rushSpeed: 939, // mesuré : 31,3 px/frame au pic
  rushHoming: 20.0, // calé : rappel de cap vers l'Outlaw, rad/s
  rushOrbit: 110, // calé : rayon d'engagement tenu pendant la ruée

  flashTime: 70, // mesuré : une frame à 30 fps, deux à 60
  shakeMin: 5.0, // calé : seuil de secousse d'écran
} as const;

/* --- 5. Sprites : cotes --------------------------------------------- */

export const GUN_CELL = 2;
export const GUN_W = 34;
export const GUN_H = 15; // -> 68 x 30 px, mesuré r 30..97, y -15..+14
export const SWORD_CELL = 2;
export const SWORD_W = 46;
export const SWORD_H = 21; // -> 92 x 42 px
export const GUN_R0 = 30; // mesuré : le sprite démarre au bord de la bille
export const SWORD_R0 = 30; // mesuré : la garde démarre au bord de la bille

// Portée de la lame. DÉRIVÉE de la carte, jamais écrite en dur : sinon le
// sprite et la hitbox divergent dès qu'on retouche la pixelmap.
export const SWORD_TIP = SWORD_R0 + SWORD_W * SWORD_CELL; // = 122

// Ouverture de l'éventail vert, bornée en ANGLE et jamais en nombre de
// frames — un compteur de frames donne trois tours complets de vert à
// 3,00 tours/s.
export const SLASH_SWEEP = 1.6; // mesuré : ~92 degrés en régime normal
export const SLASH_SWEEP_RUSH = 3.0; // mesuré : ~172 degrés au pic (frame 643)
// Pas angulaire d'échantillonnage. Sans lui le rendu suit le frame rate :
// à 3 tours/s et 30 fps la lame avance de 0,6 rad entre deux frames et
// l'éventail se rend en sept grosses facettes triangulaires.
export const ARC_STEP = 0.09;

/* --- 6. Profondeurs -------------------------------------------------- */
// Rien ne passe devant les billes : c'est la règle de composition du
// relevé. L'ordre de tracé du Canvas rejoue cette pile.
export const DEPTH = {
  chrome: 0,
  fan: 10,
  ghost: 12,
  trail: 14,
  ball: 20,
  weapon: 30,
  spark: 40,
} as const;
