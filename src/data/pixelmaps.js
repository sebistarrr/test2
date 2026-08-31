/**
 * Sprites pixel-art décrits en texte (1 caractère = 1 pixel).
 *
 * Aucun binaire dans le dépôt : les sprites sont « compilés » en canvas hors
 * écran au démarrage (voir render/pixelart.js). Chaque sprite reste
 * remplaçable par un PNG maison — voir assets/sprites/README.md.
 *
 * Convention : le sprite est dessiné **pointe vers la droite** (angle 0).
 *
 * @module data/pixelmaps
 */

import { deepFreeze } from './freeze.js';

/* ------------------------------------------------------------------
 * OMBRE — lame dentelée sombre à gemme violette
 * Relevé vidéo : lame ~63 px de long / 28 px de haut, gemme près de la garde.
 * ------------------------------------------------------------------ */
export const DARK_BLADE = deepFreeze({
  w: 20,
  h: 9,
  palette: {
    K: '#0b0710', // contour
    P: '#3b2350', // corps de lame
    L: '#4a2c66', // reflet haut
    G: '#8b5cf6', // gemme
  },
  rows: [
    '..KKKKKKKKKKKKKK....',
    '.KLLLLLLLLLLLLLLKK..',
    'KLLLLLLLLLLLLLLLLKK.',
    'KPGGPPPPPPPPPPPPPPKK',
    'KPGGPPPPPPPPPPPPPPPK',
    'KPGGPPPPPPPPPPPPPPKK',
    'KPPPPPPPPPPPPPPPPKK.',
    '.KPPPPPPPPPPPPPPKK..',
    '..KKKKKKKKKKKKKK....',
  ],
});

/* ------------------------------------------------------------------
 * GLACE — tête de hache double en cristal
 * Relevé vidéo : ~42 px de large / 60 px de haut au bout d'un long manche.
 * ------------------------------------------------------------------ */
export const ICE_AXE_HEAD = deepFreeze({
  w: 12,
  h: 17,
  palette: {
    K: '#0d0d12',
    I: '#d8f2ff', // cristal clair
    b: '#67b6e0', // cristal profond
    w: '#ffffff', // éclat
  },
  rows: [
    '....KKKK....',
    '...KKIIKK...',
    '..KKIIIIKK..',
    '..KIIwIbIK..',
    '.KKIIwwIbKK.',
    '.KIIIwwIbIK.',
    'KKIbbIIIbIIK',
    'KIbbIIbbIbIK',
    'KIIIIIIIIbIK',
    'KIbbIIbbIbIK',
    'KKIbbIIIbIIK',
    '.KIIIwwIbIK.',
    '.KKIIwwIbKK.',
    '..KIIwIbIK..',
    '..KKIIIIKK..',
    '...KKIIKK...',
    '....KKKK....',
  ],
});

/* ------------------------------------------------------------------
 * Projectile de Glace — éclat en goutte, laisse une traînée pointillée
 * ------------------------------------------------------------------ */
export const ICE_SHARD = deepFreeze({
  w: 8,
  h: 11,
  palette: { K: '#0d2b3a', I: '#cfeffd', w: '#ffffff', b: '#7cc7ea' },
  rows: [
    '...KK...',
    '..KIIK..',
    '.KIIIIK.',
    '.KIwIIK.',
    'KIIwIIIK',
    'KIIwIIbK',
    'KIIIIIbK',
    '.KIIIbK.',
    '.KIIbK..',
    '..KIK...',
    '...K....',
  ],
});

/* ------------------------------------------------------------------
 * Icônes du titre (16x16, style Minecraft comme sur la vidéo)
 * ------------------------------------------------------------------ */
export const ORB_DARK = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    K: '#0b0710',
    v: '#5b21a6', // anneau externe
    d: '#241a33', // matière sombre
    m: '#8b5cf6', // cœur violet
    w: '#c4b5fd',
  },
  rows: [
    '.....KKKKKK.....',
    '...KKvvvvvvKK...',
    '..KvvvvvvvvvvK..',
    '.KvvvvKKKKvvvvK.',
    '.KvvvKddddKvvvK.',
    'KvvvKddddddKvvvK',
    'KvvKdddmmdddKvvK',
    'KvvKddmwwmddKvvK',
    'KvvKddmwwmddKvvK',
    'KvvKdddmmdddKvvK',
    'KvvvKddddddKvvvK',
    '.KvvvKddddKvvvK.',
    '.KvvvvKKKKvvvvK.',
    '..KvvvvvvvvvvK..',
    '...KKvvvvvvKK...',
    '.....KKKKKK.....',
  ],
});

export const SNOWFLAKE = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#2b6f95', I: '#8ecbee', w: '#ffffff' },
  rows: [
    '.......KK.......',
    '...I...II...I...',
    '....I..II..I....',
    '.I...I.II.I...I.',
    '..I...IIII...I..',
    '...I..IIII..I...',
    '....IIIIIIII....',
    'KIIIIIIwwIIIIIIK',
    'KIIIIIIwwIIIIIIK',
    '....IIIIIIII....',
    '...I..IIII..I...',
    '..I...IIII...I..',
    '.I...I.II.I...I.',
    '....I..II..I....',
    '...I...II...I...',
    '.......KK.......',
  ],
});

/* ==================================================================
 *  ARMES DES CINQ NOUVEAUX ÉLÉMENTS
 *  (relevées sur les vidéos LIGHT vs FIRE, WIND vs PLANT,
 *   LIGHT vs LIGHTNING et FIRE vs WATER)
 * ================================================================== */

/**
 * FEU — **lame-flamme à garde noire**. Relevé sur FIRE vs WATER : au ras de la
 * boule, une petite garde en losange anthracite avec une **gemme rouge**, puis
 * une longue flamme effilée — bords orange, cœur jaune vif — au **contour noir
 * épais et ondulé**. Le tout mesure ~110 px de long pour 46 de haut.
 * Ce sprite contient donc la garde : le manche de la fiche reste invisible.
 */
export const FIRE_BLADE = deepFreeze({
  w: 28,
  h: 9,
  palette: {
    K: '#1a0d02', // contour noir
    g: '#3c3c42', // garde anthracite
    r: '#c81f1f', // gemme rouge
    o: '#f2760a', // bord orange (pipette : rgb(242,146,8))
    y: '#fbb603', // corps jaune (pipette : rgb(251,182,3))
    w: '#ffe15c', // cœur incandescent
  },
  rows: [
    '.......KKKK.................',
    '..KK...KooKKKK..............',
    '.KggK.KoyyyooKKKKK..........',
    'KggggKKoyywwyyyyyoKKKKK.....',
    'KgrrgKKoywwwwwwwyyyyyyyoKKK.',
    'KggggKKoyywwyyyyyoKKKKK.....',
    '.KggK.KoyyyooKKKKK..........',
    '..KK...KooKKKK..............',
    '.......KKKK.................',
  ],
});

/**
 * LUMIÈRE — tête de marteau. Relevé sur LIGHT vs LIGHTNING : un bloc **plus
 * large que haut**, cerclé d'un **gros contour noir**, bordure dorée et
 * panneau intérieur très clair. ~37 × 34 px.
 */
export const LIGHT_HAMMER_HEAD = deepFreeze({
  w: 11,
  h: 10,
  palette: {
    K: '#0a0a0a', // contour noir franc, comme les boules
    g: '#e0b729', // bordure dorée (pipette : rgb(224,183,41))
    l: '#fcec97', // panneau clair
    w: '#fff3bf', // reflet
  },
  rows: [
    '..KKKKKKK..',
    '.KgggggggK.',
    'KglllllllgK',
    'KglwwwwwlgK',
    'KglwwwwwlgK',
    'KglwwwwwlgK',
    'KglwwwwwlgK',
    'KglllllllgK',
    '.KgggggggK.',
    '..KKKKKKK..',
  ],
});

/**
 * VENT — shuriken en **losange évidé**, collé au corps (aucun manche visible).
 *
 * Relevé image par image sur WIND vs PLANT : anneau en losange de ~74 px de
 * pointe à pointe, **double contour noir épais** (extérieur *et* intérieur du
 * trou), corps crème dégradé (clair côté intérieur, plus chaud côté extérieur)
 * et **quatre ergots gris** qui dépassent aux quatre pointes.
 */
export const WIND_SHURIKEN = deepFreeze({
  w: 17,
  h: 17,
  palette: {
    K: '#0c0a06', // contour, aussi noir que celui des boules
    t: '#e5d2a8', // crème (pipette : rgb(232,220,192))
    l: '#f8f2e0', // reflet, côté intérieur
    s: '#c5a97c', // ombre chaude, côté extérieur
    g: '#bdbcb2', // ergot gris aux pointes
  },
  // Compté bloc par bloc sur la vidéo, du bout de gauche vers le centre :
  // ergot, 2 blocs noirs, 2 blocs crème, 2 blocs noirs, puis le trou.
  rows: [
    '........g........',
    '........K........',
    '.......KKK.......',
    '......KKtKK......',
    '.....KKtltKK.....',
    '....KKtlKltKK....',
    '...KKtlKKKtsKK...',
    '..KKtlKK.KKtsKK..',
    'gKKtlKK...KKtsKKg',
    '..KKtlKK.KKtsKK..',
    '...KKttKKKtsKK...',
    '....KKstKtsKK....',
    '.....KKstsKK.....',
    '......KKsKK......',
    '.......KKK.......',
    '........K........',
    '........g........',
  ],
});

/**
 * FOUDRE — fer de lance en éclair. Relevé sur LIGHT vs LIGHTNING : un **fer de
 * flèche jaune trapu** au gros contour noir, monté au bout d'un long manche de
 * bois brun — pas un zigzag plat. ~50 × 34 px.
 */
export const BOLT_BLADE = deepFreeze({
  w: 14,
  h: 9,
  palette: {
    K: '#181004', // contour noir
    y: '#f5d21a', // corps jaune
    w: '#fdf6b0', // reflet
  },
  rows: [
    '........KK....',
    '.....KKKKyKK..',
    '..KKKKyyyyyyK.',
    '.KKyyyyyyyyyyK',
    'KKyyywwwyyyyyK',
    '.KKyyyyyyyyyyK',
    '..KKKKyyyyyyK.',
    '.....KKKKyKK..',
    '........KK....',
  ],
});

/**
 * EAU — tête de trident à trois dents. Relevé sur FIRE vs WATER : bleu clair
 * à **contour noir** (et non bleu nuit), monté sur une hampe acier-bleu.
 */
export const WATER_TRIDENT = deepFreeze({
  w: 12,
  h: 15,
  palette: {
    K: '#0a0f18', // contour noir, comme sur la vidéo
    b: '#6fa9ee', // bleu clair
    w: '#d6e9ff', // reflet
  },
  rows: [
    '.....KKKKKK.',
    '.....KbbbbK.',
    '.KKKKKbwbKK.',
    '.KbbbbbbbK..',
    '.KbbKKKKK...',
    '.KbbK.......',
    '.KbbKKKKKKK.',
    '.KbwbbbbbbbK',
    '.KbbKKKKKKK.',
    '.KbbK.......',
    '.KbbKKKKK...',
    '.KbbbbbbbK..',
    '.KKKKKbwbKK.',
    '.....KbbbbK.',
    '.....KKKKKK.',
  ],
});

/* ---------------- projectiles ---------------- */

/** FEU — braise. */
export const EMBER = deepFreeze({
  w: 7,
  h: 7,
  palette: { K: '#2a0d02', o: '#f2670c', y: '#fbbf24', w: '#fff4c4' },
  rows: ['..KKK..', '.KoyoK.', 'KoywyoK', 'KywwwyK', 'KoywyoK', '.KoyoK.', '..KKK..'],
});

/**
 * VENT — croissant de lame d'air : **aucun contour noir**, un vrai croissant
 * (deux cercles décalés) au dégradé doux. Relevé sur WIND vs PLANT : la corne
 * qui traîne est vert-olive sombre, le ventre qui mène est crème, et le dos
 * convexe porte un liseré clair.
 */
export const WIND_CRESCENT = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    d: '#8e7c52', // corne sombre
    t: '#b1a082', // corps
    w: '#c7b99a', // éclairci
    l: '#e6ddc4', // liseré du dos convexe
  },
  rows: [
    '.....ddwwww.....',
    '......ddttww....',
    '.......ddtttw...',
    '........dddttw..',
    '........ddddtww.',
    '.........tttwwl.',
    '.........ttttwl.',
    '.........ttttwl.',
    '.........ttttwl.',
    '.........ttttwl.',
    '.........tttwwl.',
    '........tttwwl..',
    '........ttwwll..',
    '.......twwwll...',
    '......ttwwll....',
    '.....ttlll......',
  ],
});

/** EAU — gouttelette projetée par les tourbillons. */
export const WATER_DROP = deepFreeze({
  w: 6,
  h: 8,
  palette: { K: '#0b2545', b: '#5a9bef', w: '#dbeafe' },
  rows: ['..KK..', '.KbbK.', '.KbbK.', 'KbwbbK', 'KbwbbK', 'KbbbbK', '.KbbK.', '..KK..'],
});

/**
 * FOUDRE — borne statique posée dans l'arène (relais des chaînes).
 *
 * Relevé sur LIGHT vs LIGHTNING : ce n'est pas un cristal, c'est une **petite
 * bobine** — une boule au sommet, deux disques à collerette empilés, deux
 * pieds. Blanc lavande à contour sombre, ~34 × 34 px, et la Foudre en sème une
 * douzaine au fil du duel.
 */
export const TESLA_NODE = deepFreeze({
  w: 13,
  h: 13,
  palette: {
    K: '#2f3242', // contour bleu-nuit (pipette : rgb(110,113,130))
    b: '#9c9db2', // ombre des disques
    w: '#e2e5f6', // blanc lavande
  },
  rows: [
    '.....KKK.....',
    '....KwwwK....',
    '....KwwwK....',
    '.....KKK.....',
    '..KKKKKKKKK..',
    '.KwwwwwwwwwK.',
    '.KwwwbbbwwwK.',
    '..KKKKKKKKK..',
    '..KwwwwwwwK..',
    '..KwwbbbwwK..',
    '..KKKKKKKKK..',
    '...K.....K...',
    '..KK.....KK..',
  ],
});

/**
 * EAU — **tourbillon** : la vidéo ne montre pas un dégradé tournoyant mais une
 * vraie **spirale en pixels** — disque bleu opaque, bras bleu nuit enroulé sur
 * environ deux tours et demi, éclats clairs sur le bord gauche, gros contour.
 * Le sprite est étiré au diamètre courant (« Size » du HUD, 70 → 150 px).
 */
export const WATER_WHIRLPOOL = deepFreeze({
  w: 21,
  h: 21,
  palette: {
    K: '#14304f', // bras et contour, bleu nuit (pipette : rgb(54,105,148))
    b: '#5b93da', // disque (pipette : rgb(102,151,217))
    w: '#a9d2ff', // éclats clairs (pipette : rgb(115,181,255))
  },
  rows: [
    '.........KKK.........',
    '......KKbbbbbKK......',
    '....KKbbbbbbbbbKK....',
    '...KKbwbbbbbbbbbbK...',
    '..KKbwbbKKKKKKKbbbK..',
    '..KbbbKKbbbbbbKKbbK..',
    '.KKwbKKbbbbbbbbKKbbK.',
    '.KwbbKbbbbKKKbbbKKbK.',
    '.KwbbKbbKKbbKKbbbKbb.',
    'KKbbKKbbKbbbbKbbbKbbK',
    'KKbbKKbbKbKbbbKbbKbbK',
    'KKwbbKbbbKKbbbKbbKbbK',
    '.KwbbKbbbbbbbKKbbKbb.',
    '.KKwbbKbbbbbKKbbbKbK.',
    '.KKbbbbKKKKKKbbbKKbK.',
    '..KKwbbbbKKbbbbbKbK..',
    '..KKKbbbbbbbbbbKbbK..',
    '...KbKKbbbbbbKKbbK...',
    '....KKKKKKKKKKbKK....',
    '......KKbbbbbKK......',
    '.........KKK.........',
  ],
});

/* ---------------- icônes de titre ---------------- */

export const ICON_FLAME = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#2a0d02', o: '#f2670c', y: '#fbbf24', w: '#fff4c4' },
  rows: [
    '.......KK.......',
    '......KooK......',
    '.....KoyyoK.....',
    '....KoyyyyoK....',
    '....KoyywyoK....',
    '...KooywwwyoK...',
    '...KoyywwwyyoK..',
    '..KooywwwwwyooK.',
    '..KoyywwwwwyyoK.',
    '.KooywwwwwwwyoK.',
    '.KoyywwwwwwwyoK.',
    '.KoyywwwwwwwyoK.',
    '.KooyywwwwwyyoK.',
    '..KooyywwwyyooK.',
    '...KKooyyyyooK..',
    '.....KKKKKKKK...',
  ],
});

export const ICON_SHIELD = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#2a2007', g: '#e0bd1e', l: '#fdf6b8', w: '#ffffff' },
  rows: [
    '..KKKKKKKKKKKK..',
    '.KggggggggggggK.',
    '.KgllllllllllgK.',
    '.KgllwwwwwwllgK.',
    '.KgllwwwwwwllgK.',
    '.KgllllwwllllgK.',
    '.KgllllwwllllgK.',
    '.KgllllwwllllgK.',
    '..KgllllllllgK..',
    '..KgllllllllgK..',
    '...KgllllllgK...',
    '....KgllllgK....',
    '.....KgllgK.....',
    '......KggK......',
    '.......KK.......',
    '................',
  ],
});

export const ICON_TORNADO = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#3a3016', t: '#d9c89a' },
  rows: [
    '..KKKKKKKKKKKK..',
    '.KttttttttttttK.',
    '..KKttttttttKK..',
    '...KttttttttK...',
    '....KKtttttK....',
    '.....KtttttK....',
    '.....KKtttKK....',
    '......KtttK.....',
    '......KKtKK.....',
    '.......KtK......',
    '.......KtK......',
    '........K.......',
    '................',
    '................',
    '................',
    '................',
  ],
});

export const ICON_BOLT = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#3a2c05', y: '#f5e60a', w: '#fffbb0' },
  rows: [
    '.........KKKK...',
    '........KyyyK...',
    '.......KyyyK....',
    '......KyyyK.....',
    '.....KyyyKKKKK..',
    '....KyyyyyyyyK..',
    '...KyywwwwyyyK..',
    '..KKyywwwwyyKK..',
    '..KyyywwwyyK....',
    '..KKKyyyyyK.....',
    '....KyyyyK......',
    '...KyyyyK.......',
    '..KyyyK.........',
    '..KyyK..........',
    '..KKK...........',
    '................',
  ],
});

/**
 * EAU — icône du titre. Sur la vidéo, ce n'est pas une goutte mais la
 * **spirale du tourbillon**, en bleu, à côté du mot « WATER ».
 */
export const ICON_DROPLET = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#14304f', b: '#5b93da' },
  rows: [
    '.....KKKKKK.....',
    '...KKbbbbbbKK...',
    '..KbbbbbbbbbbK..',
    '.KbbbKKKKKKbbbK.',
    '.KbbKKbbbbKKbbK.',
    'KbbKKbbbbbbKbbbK',
    'KbbKbbKKKKbbKbbK',
    'KbbKbKKbbKKbKbbK',
    'KbbKbKbbbKbKbbbK',
    'KbbKbbKKKKbKbbbK',
    'KbbbKbbbbbbKbbbK',
    '.KbbKKbbbbbKbbK.',
    '.KbbbKKKKKKbbbK.',
    '..KbbbbbbbbbbK..',
    '...KKbbbbbbKK...',
    '.....KKKKKK.....',
  ],
});

/* ------------------------------------------------------------------
 * PLANTE — bulbe semé dans l'arène, fleur projectile, icône du titre
 * Relevé : vidéos PLANT vs FIRE / ICE vs PLANT / DARK vs PLANT.
 * (La liane, elle, est dessinée en courbe par game/abilities/plant.js.)
 * ------------------------------------------------------------------ */
/**
 * PLANTE — bulbe semé : une **cosse verte bombée** au gros contour noir,
 * surmontée d'un pédoncule noir et de deux feuilles sombres, avec deux petites
 * pattes noires en dessous. Relevé : ~29 × 34 px dans l'arène.
 */
export const PLANT_BULB = deepFreeze({
  w: 11,
  h: 15,
  palette: {
    K: '#0a0a0a', // contour noir franc (comme la vidéo)
    v: '#2e7a44', // feuilles, plus sombres que la cosse
    g: '#5aa832', // cosse
    l: '#79c94f', // éclairci
    w: '#a8de7c', // reflet en haut à gauche
    s: '#3b7d1e', // ombre à droite
  },
  rows: [
    '..K.....K..',
    '..KvK.KvK..',
    '..KvvKvvK..',
    '...KvvvK...',
    '....KKK....',
    '...KKKKK...',
    '..KwwlllK..',
    '.KwwlllggK.',
    'KwlllgggggK',
    'KwlllgggssK',
    'KlllgggsssK',
    '.KllgggssK.',
    '..KKgggKK..',
    '...KKKKK...',
    '..KK...KK..',
  ],
});

/**
 * PLANTE — fleur projectile : corolle rose à **contour noir épais** et **cœur
 * doré**, ~40 px, tirée par les bulbes mûrs et emportée par la tempête.
 */
export const FLOWER = deepFreeze({
  w: 11,
  h: 11,
  palette: {
    K: '#100309', // contour noir
    p: '#e878b0', // pétale (pipette : rgb(232,120,176))
    P: '#c9518f', // pétale à l'ombre
    y: '#f0b53c', // cœur doré
    w: '#fbe9b8', // point de lumière au cœur
  },
  rows: [
    '...KK.KK...',
    '..KppKppK..',
    '.KpppppppK.',
    'KpppPPPpppK',
    'KppPPywPppK',
    'KppPyyyPppK',
    'KppPPyyPppK',
    'KpppPPPpppK',
    '.KpppppppK.',
    '..KppKppK..',
    '...KK.KK...',
  ],
});

export const ICON_LEAF = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#14532d', l: '#4ade80', g: '#22c55e' },
  rows: [
    '.........KKK....',
    '.......KKlllK...',
    '......KlllllK...',
    '.....KllllllK...',
    '..KKKllllllKK...',
    '.KlllllllKK.....',
    'KlllllKK..g.....',
    '.KlllKK...g.....',
    '..KKK.....g.....',
    '..........g.....',
    '.......KKgggKK..',
    '......KgggggggK.',
    '......KgggggggK.',
    '.......KKgggKK..',
    '.........KKK....',
    '................',
  ],
});

/* ==========================================================================
 *  HORS-LA-LOI & BRETTEUR — les deux personnages repris du duel
 *  « Outlaw vs Bladesman ». Leurs relevés ont été pris sur une vidéo 576x1024
 *  et se convertissent en x1,25 vers le repère 720x1280 de ce jeu.
 * ========================================================================== */

/* ------------------------------------------------------------------
 * HORS-LA-LOI — **revolver de cristal**, transcrit de la maquette fournie.
 *
 * Même méthode que la lance électrique : le fichier est en RGB, le damier de
 * transparence est cuit dans les pixels, donc le premier plan est défini
 * **positivement** — violet/magenta saturé, contour très sombre, éclats très
 * clairs — et non par soustraction du damier, qui laisserait passer les traits
 * de séparation des cases.
 *
 * **La portée ne bouge pas.** `reach: 122` découle de
 * `handle.length + map.w × scale` = 37 + 85 × 1. La carte passe de 34 × 15 à
 * `scale: 2,5` (85 × 37,5 px dessinés) à **85 × 46 à `scale: 1`** : même
 * largeur dessinée, deux fois et demie plus de détail, et un rapport d'aspect
 * qui suit enfin celui de l'artwork (1,84 contre 2,27 pour l'ancienne carte).
 *
 * La réduction passe par une moyenne d'aire avec **alpha prémultiplié** : sans
 * ça, elle mélangerait le RGB des pixels transparents — du noir — à celui de
 * l'arme, et toute la silhouette ressortirait assombrie.
 * ------------------------------------------------------------------ */
export const OUTLAW_REVOLVER = deepFreeze({
  w: 85,
  h: 46,
  palette: {
    0: '#0c1a20',
    1: '#142b36',
    2: '#1e3b49',
    3: '#264b5c',
    4: '#2f5a6d',
    5: '#376b82',
    6: '#417e9a',
    7: '#4f94b3',
    8: '#71a2b9',
    9: '#68b0d1',
    a: '#8abcd2',
    b: '#92cce6',
    c: '#b5dff2',
    d: '#cfebf7',
    e: '#f2f9fd',
    f: '#f7f8f8',
  },
  rows: [
    '..................450..................................................22............',
    '..................34433.......................................7.......0cd............',
    '..................1111110...........................9...7a9..bc......48573...........',
    '.................47777bcca8abccaaaaaa661..........9cb..9ccc.ac6..214764353...........',
    '.......178a5...005a4455555555555555666531452233217cb625b952796233222222232...........',
    '........257a865537644100001111111108777428a156666b96559964677778888b8aaaa8...........',
    '..........3556536843111514457797760ecca51321342699634454444444222222433223..97.......',
    '...........46425a642162726768888860c888511244565646778aaaaab852355554445564967b79....',
    '...........5525763414c3.268bcaacd41656552488735736999999bbcdef955abba46eeb255979eebb.',
    '..........25158643415c3a38844444451333317999bc74859999abbcccddee46aaaabbb925649d..ecb',
    '.........015863334405737377467b9971222214799973534556677bb779ba45777757977367b69babb.',
    '......12777534444421452524688888a50222230257525159aaaaaa999aba4466774533773755.7.....',
    '.....378556434444231331313445555530387422220032311111111111111111111422202..65.......',
    '.....34444355422672313131344456654034425213133334434444444444444444444442............',
    '.....03313444536764330031224667666026635201100000000000000000000000000001............',
    '......0011234347d9633322222222222223333312322346320460271162150312323460.............',
    '.........1223267db544333333333333454332133365697217812822a4151323424650..............',
    '.........0132356b96444444444445546433213379679825553144152151000111110...............',
    '.........01323266643443211111112443231316b77b911111001001001.........................',
    '.........013225344343311252....014421598793761.......................................',
    '.........113235534444113470.....033139b832...........................................',
    '........012326676544410258......034139b4.............................................',
    '........02218720044440..57......03403b7..............................................',
    '.......022351224212441..048....1261.02...............................................',
    '......01327134333214331...2...12650..................................................',
    '......14267343332243334444444575520..................................................',
    '.....03252433231242111245445553210...................................................',
    '....03244344822142101.2000000000.....................................................',
    '...0123524487222410..................................................................',
    '...03253445d5104310..................................................................',
    '..02343444bd111310...................................................................',
    '..14361437c6222310...................................................................',
    '.02343434bb221531....................................................................',
    '.15262339b7121410....................................................................',
    '.2542326b93122310....................................................................',
    '.264221a99321430.....................................................................',
    '0433128966121410.....................................................................',
    '1613168b76111520.....................................................................',
    '1634266995112420.....................................................................',
    '0673455851123310.....................................................................',
    '0478443451022310.....................................................................',
    '.145776444201310.....................................................................',
    '..12457787533210.....................................................................',
    '...00022456766520....................................................................',
    '........001345420....................................................................',
    '...........00000.....................................................................',
  ],
});

/* ------------------------------------------------------------------
 * HORS-LA-LOI — **balle de cristal**, composée d'après la maquette.
 *
 * **Composée et non transcrite, contrairement au revolver**, et c'est la
 * maquette qui l'impose : elle montre les munitions en **paquet**, six rounds
 * dont les pointes se chevauchent et forment une seule masse connexe. Aucun
 * recadrage rectangulaire n'en isole un, et une composante connexe en attrape
 * deux — les deux ont été essayés. Le projectile, lui, a besoin d'un round
 * seul.
 *
 * Le sprite est donc construit avec les **couleurs pipettées sur la maquette**
 * et son profil : culot, étui violet parcouru d'un cœur magenta, gorges
 * d'extraction, col, puis pointe de cristal effilée à arête claire. Les arêtes
 * de la pointe sont posées **explicitement** et non tracées par une formule —
 * c'est la leçon de la première lance de cuivre, où un exposant convexe avait
 * rendu une feuille arrondie là où il fallait une pointe.
 *
 * Encombrement : 30 × 9 à `scale: 1`. L'ancienne carte faisait 9 × 3 à
 * `scale: 3,2`, soit 28,8 × 9,6 : le projectile garde sa taille à l'écran. Sa
 * collision, elle, ne dépend pas du sprite — `projectiles.shot.radius: 8`.
 * ------------------------------------------------------------------ */
export const OUTLAW_SHOT = deepFreeze({
  w: 30,
  h: 9,
  palette: {
    K: '#071e29',
    d: '#0d3142',
    e: '#1c475b',
    m: '#3d96be',
    p: '#28779b',
    c: '#77b6d3',
    C: '#d4edf8',
    W: '#f2f9fd',
  },
  rows: [
    'KKKKKKKKKKKKKKKKKKKK..........',
    'ddeKeeeeeeeeeKepppCCKKKK......',
    'ddeKeeeeeeeeeKepppWWWWCCKKKK..',
    'ddpKmmmmmmmmmKppppccccWWWWWWKK',
    'ddmKmmmmmmmmmKmpppcccccccccccc',
    'dddKdddddddddKdeeeppppppppppKK',
    'dddKdddddddddKdeeeppppppKKKK..',
    'dddKdddddddddKdeeeppKKKK......',
    'KKKKKKKKKKKKKKKKKKKK..........',
  ],
});

/* ------------------------------------------------------------------
 * BRETTEUR — lame de braise, transcrite d'une maquette fournie
 *
 * Remplace le sabre dentelé mesuré sur la vidéo — écart demandé, comme la
 * lance électrique du Lancier. **Transcrite, pas redessinée** : la maquette
 * montre l'arme verticale, pointe de flamme en haut, garde ailée à gemme
 * rouge et poignée enroulée en bas. Méthode :
 *
 *   1. Détourage du fond en damier (la maquette n'a pas de vrai canal
 *      alpha) par seuil de gris, composante connexe la plus grande
 *      retenue — ça élimine les étincelles détachées de la flamme, qui
 *      auraient donné des pixels flottants sans lien avec la lame.
 *   2. Recadrage sur la garde + la lame seules : la poignée enroulée et le
 *      pommeau à gemme, tout en bas de la maquette, restent **hors carte**
 *      — exactement comme sur le sabre d'origine, où `handle.length: 45`
 *      ne dessine rien et laisse cette partie derrière la boule.
 *   3. Rotation 90° pour ramener la pointe **à droite**, la convention du
 *      dépôt (voir l'en-tête du fichier) — la maquette la montre vers le
 *      haut.
 *   4. Réduction par blocs (moyenne, comme `LANCER_SPEAR`) vers une grille
 *      96 × 35, puis quantification à 22 couleurs.
 *
 * La garde ailée sombre occupe les ~10 premières colonnes ; le reste est la
 * flamme, du rouge sombre à la base au jaune vif en pointe.
 * ------------------------------------------------------------------ */
export const BLADESMAN_FLAMEBLADE = deepFreeze({
  /**
   * **Manche ajoutée, demandée, reprise sur la maquette au second passage.**
   * Le premier essai (tressage en bandes diagonales) ne reproduisait pas le
   * motif de la maquette — un **chevron** (chaque « V » pointe vers le
   * pommeau), pas une diagonale. Les 40 premières colonnes redessinent ce
   * chevron : toujours dessiné, pas transcrit pixel à pixel (la maquette est
   * une image bruitée — JPEG sur damier de transparence — bien plus fine que
   * la trame de ce sprite), mais la **forme** du motif suit maintenant la
   * maquette, pas une approximation. Couleurs reprises par percentile sur la
   * zone de manche de la maquette (la médiane JPEG bruite, voir la méthode de
   * relevé documentée dans `CLAUDE.md`). Le pommeau doré à gemme de la
   * maquette n'est pas dessiné : il tomberait entièrement derrière la bille
   * (rayon 41), les ~28 premières colonnes de la manche le sont déjà.
   */
  w: 136,
  h: 35,
  palette: {
    1: '#fada34', // jaune vif : pointe de flamme
    2: '#f6c224',
    3: '#f19c15',
    4: '#f88108',
    5: '#f67107',
    6: '#ac743e', // braise/fumée
    7: '#f55f07',
    8: '#f14c05',
    9: '#d24e15',
    A: '#89523c', // garde, bois/cuir sombre
    B: '#614f45',
    C: '#e02f04', // rouge sombre : base de la flamme
    D: '#cb1403',
    E: '#923121',
    F: '#ac0a05',
    G: '#960206', // gemme de la garde
    H: '#4a2824',
    I: '#281f22', // garde, presque noir
    J: '#500a15',
    K: '#12080a', // contour (partagé avec la manche)
    L: '#64000a',
    M: '#000000', // creux entre les langues de flamme
    N: '#1c1a24', // manche : cuir du chevron, ton de base — médiane de la maquette
    O: '#0a0910', // manche : creux du chevron — 5e percentile de la maquette
    P: '#3a3948', // manche : arête claire du chevron — 80e percentile de la maquette
  },
  rows: [
    '..................................................KK....................................................................................',
    '.................................................KKI..............B.....................................................................',
    '................................................IKB..............69A6A..................................................................',
    '............................................KKKLJIM.............6359AA6.................................................................',
    '...........................................KKLEJIA..............BABBA...................................................................',
    '.......................................KMMIEJJLJKI..............96EDCE..................................................................',
    '.....................................KKNMHELJJJKII.........BE6HA137EA96.AB..............................................................',
    '...................................KKOON.IHJIIKIBM........BE5E98439BBA9AA.............................BAB...............................',
    '.................................KKNNPOOKJIKKHAIH.........H9D5D73E59EABB66.......BBAB....BA..........B97EAAA............................',
    '...............................KKPONNNPOLJIKHIIIH.....HHI.ADFGC4H.BEEA.AE6....IA95334BBAA9AAA........A1379EA............................',
    '.............................KKNNNPONNNPJJKHIHBB....HDFL.KDFGGC5K..........II5458822BAJB66..........A33AAA..............................',
    '...........................KKNPONNNPONNNIIIIIBBIKMKGFLFEHDFGGLDC8HHK....KH958C4CD22K.............IAE31213AB..............AAB............',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKKKNNNPONNNPONNKMHIHIKIJJGGLLLFFGLLGGDDC8777545448DD9FF8421K........KK323733721HAB.............A559A...........',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKNPONNNPONNNPONMIIAIKKHLLGGLGGLLLGGFFDCFFC87778CCCDDCCCDC4311HMMMMB2234885C731K........IIIIH..63234EEEA........',
    'NNNPONNNPONNNPONNNPONNNPONNNPONNNPONNNPOKIAIIKIIJJLLLLLGGLLGGLGDCFFDFFFFFCDD77558CC74322334478C844888416M....BA11111112AAABA9EBB........',
    'ONNNPONNNPONNNPONNNPONNNPONNNPONNNPONNNPIB6IIIHIIHJJIIJLJJLLGFFFFFCFDFDCCDFCCCCCC88D8877778C87424457C84211HH11433333222116HB....AAAA....',
    'PONNNPONNNPONNNPONNNPONNNPONNNPONNNPONNNJJJABK37FIIIHHHHHHBBAGFCFFFFFDCFFC858CCC788CD87DD8875337534458854333333444444432211AHJJE9557EB..',
    'POONNPOONNPOONNPOONNPOONNPOONNPOONNPOONNJJEFJ1B27DF999FFGGJHBA66DFFCFFFFCCCCCC8CC8888DDD77887788C8743358775434555453221222222444424779A.',
    'PONNNPONNNPONNNPONNNPONNNPONNNPONNNPONNNJJLH6K3DFLIIJJIIHHHBBEFFDDDFDCCCCCCCCFFD88888887888C8CCCCCC7545733345773336MMMM3112111125AEBAAEB',
    'ONNNPONNNPONNNPONNNPONNNPONNNPONNNPONNNPIAAIIHEJIHIJIIHLJHGFDDDDDFDCFFDCCCCDFC77888844888D85C5433378845555754412B..........IKKKKA.....AB',
    'NNNPONNNPONNNPONNNPONNNPONNNPONNNPONNNPOKIAIIKBIJJLLLJLGGDDDFCCDDFFFDDDD8CDFC8887CC85854775C422223223532232211A.........................',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKNPONNNPONNNPONMII6IIIJLLLGLLLGFFGLLLLFCDFGFDFFFF8444444458CC834CC41BI...II11122211B...........................',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKKKNNNPONNNPONNKKHIAIIBJLLLGGLGGLLDCCCGFDFDFFDC854433HHH6234CCC45832...JAA...IIIHII............................',
    '..........................KKKNPONNNPONNNIKHIMBHIIMJGGLLDGGD88778DDDDCCF854AM.......KA33555C823363E3A....................................',
    '...........................KKKKNNNPONNNPKJKHIBBB...IFGLFFD9BBBBA5C75FDCC43B..A........MA22244116BBEEB...................................',
    '.............................KKKKPONNNPOJJIHHKIIK...KEGGDCBBBBBBBB9445CC81AHA9A..6A......A934AAAEAA.....................................',
    '...............................KKKKNNPOOKLIMIBBHH....HEFGD9HEABBBBB4EBB775215ABBAAA.......A13559E6A.....................................',
    '.................................KKKKOON.IIIKIKIBM.....IEDC8756BBBBA6B.EE5239AE9EE.........A329A........................................',
    '...................................KKKKNKBLJIHHKHK.......JA6ABJB36BBBLA..B92259AABB.........AAA.........................................',
    '.....................................KKKKKEEJHJIII..............A19EA.....AE9EA.............69AE........................................',
    '.......................................K...KILEJIB..............AEEA.........................AAB........................................',
    '............................................KJHLJHK.....................................................................................',
    '................................................IKH.....................................................................................',
    '.................................................KHI....................................................................................',
    '..................................................MI....................................................................................',
  ],
});

/* ------------------------------------------------------------------
 * Icônes de titre du Hors-la-loi et du Bretteur.
 * Elles sont posées sur le fond sombre `#1c1a26` : elles doivent tenir par
 * leurs **valeurs claires**, un contour noir n'y dessine rien.
 * ------------------------------------------------------------------ */
export const ICON_REVOLVER = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#13262f', S: '#94afbb', l: '#e6eff3', s: '#6c8d9d', W: '#5eadd1', w: '#377d9d' },
  rows: [
    '................',
    '................',
    '....KKKKKK......',
    '...KSSSSSSKKKKK.',
    '..KSllllllSSSSSK',
    '..KSllllllllllsK',
    '..KSllllllSSSSSK',
    '..KSSllllSSKKKKK',
    '..KSSSSSSSSK....',
    '.KWWWWWWSSSK....',
    '.KWWWWWWWWK.....',
    '.KWwwwwwWK......',
    '..KWwwwwWK......',
    '..KWwwwWK.......',
    '...KKKKK........',
    '................',
  ],
});

/** Icône du Bretteur, **dérivée de `BLADESMAN_FLAMEBLADE`** et non redessinée
 *  — même précaution que `ICON_LANCE` (voir sa note), qui avait divergé de
 *  l'arme trois fois de suite pour avoir été retouchée à la main. La grille
 *  96 × 35 est tournée à 40° puis réduite au plus proche voisin (pas de
 *  lissage : un dégradé ferait fuiter les couleurs du fond transparent), en
 *  réutilisant exactement les teintes de la lame. */
export const ICON_SABRE = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    a: '#fada34',
    b: '#89523c',
    c: '#f19c15',
    d: '#614f45',
    e: '#f6c224',
    f: '#d24e15',
    g: '#923121',
    h: '#f88108',
    i: '#ac743e',
    j: '#f55f07',
    k: '#e02f04',
    l: '#cb1403',
    m: '#f14c05',
    n: '#500a15',
    o: '#ac0a05',
    p: '#f67107',
    q: '#281f22',
    r: '#4a2824',
    s: '#960206',
    t: '#000000',
  },
  rows: [
    '................',
    '..............ab',
    '.............cd.',
    '............ceb.',
    '........fgacb...',
    '........h.hi....',
    '......g.jjhcd...',
    '.....e.klc......',
    '....hmlmhn......',
    '...gllolp.......',
    '.qrsloj.........',
    'gdnrdl.i........',
    'nqnqolbf........',
    '.bdn............',
    '..tqq...........',
    '...q............',
  ],
});

/* ------------------------------------------------------------------
 * LANCIER — **lance électrique**, transcrite de la maquette fournie.
 *
 * Elle remplace la lance de cuivre. Ce n'est pas un dessin d'après la
 * maquette : c'est la maquette elle-même, réduite par blocs **3 × 3 exacts**.
 *
 *     603 / 201 = 3 (horizontal)      107 / 53 = 2 (vertical)
 *
 * **Le recadrage se fait sur le contenu, pas sur le fichier.** La version
 * précédente réduisait 624 × 129 — mais l'artwork ne fait que 603 × 107 : la
 * boîte englobante était gonflée par un reste du titre « Electric Lance », une
 * bande de 269 px de noir pur en ligne 0. Deux conséquences, et la seconde est
 * restée invisible longtemps : la carte portait un **trait noir sur toute la
 * longueur** de la lance, et la pointe tombait **avant** les 164 px annoncés,
 * puisque le contenu n'occupait que 603/624 de la largeur dessinée.
 *
 * Le trait n'est apparu qu'au passage à la réduction 3 × 2. À 3 × 3, ces pixels
 * pesaient 3 sur 9 dans leur bloc et tombaient sous le seuil de majorité ; à
 * 3 × 2 ils pèsent 3 sur 6 et le passent. Un défaut présent depuis le début,
 * que seul un changement de grille a rendu visible.
 *
 * **La réduction verticale est deux fois plus fine que l'horizontale, et c'est
 * volontaire : c'est ce qui épaissit la lance de 1,5 sans l'allonger.** La
 * largeur dessinée vaut `map.w × scale` et ne bouge pas ; la hauteur vaut
 * `map.h × scale` et passe de 43 à 64. On ne dilate donc pas un sprite existant
 * — on retourne à la source et on l'échantillonne plus fin en vertical, ce qui
 * ajoute du détail au lieu d'en étirer.
 *
 * La médiane par bloc rend en prime les aplats que le JPEG source avait bruités
 * (écart-type ~20 sur des zones unies).
 *
 * **Pourquoi une carte texte et pas l'override PNG**, qui existe pourtant
 * (`assets/sprites/manifest.json`) : `fighter.js` prend
 * `headH = map.h × scale` sur la **carte**, et `drawSpriteLeft` en tire
 * `w = headH × img.w / img.h` sur l'**image**. Un PNG dont le rapport d'aspect
 * diffère de celui de la carte décale donc la largeur dessinée sans toucher la
 * hitbox — le PNG en 624 × 129 posait la pointe à 168,8 px au lieu de 164,
 * soit une arme qui ment de 5 px sur son allonge. La transcription évite le
 * problème au lieu de le contourner.
 *
 * **La portée ne bouge pas** : 208 cellules à `scale: 1` font 208 px logiques,
 * et avec `handle.length: -44` la pointe reste à −44 + 208 = **164**, la
 * portée relevée. La carte de cuivre faisait 104 à `scale: 2` — même produit,
 * deux fois plus de détail, et c'est ce qu'il fallait pour loger les
 * filaments d'éclair de la maquette.
 *
 * Conséquence de cadrage, inchangée : la bille (rayon 41) couvre les cellules
 * 0 à ~85. Le pommeau doré et le premier tiers de hampe sont donc derrière
 * elle, et ne se voient que quand la lance dépasse par l'arrière.
 * ------------------------------------------------------------------ */
export const LANCER_SPEAR = deepFreeze({
  w: 201,
  h: 53,
  palette: {
    0: '#09050e',
    1: '#100422',
    2: '#21103e',
    3: '#331f5b',
    4: '#412771',
    5: '#4e2f82',
    6: '#5d3c8f',
    7: '#73588b',
    8: '#7046ab',
    9: '#8563b0',
    a: '#9b76c7',
    b: '#ddc55c',
    c: '#b596d7',
    d: '#ceb2ea',
    e: '#e5cdf8',
    f: '#f8e5fe',
  },
  rows: [
    '..................................................................................................................................................7......................................................',
    '.................................................................................................................................................f75.....................................................',
    '..........................................................................................................................677..................77fa65....................................................',
    '.........................................................................................................................76775..........77a96667999e65...................................................',
    '..........................................................................................................................99d7..........59de969ef99f66...................................................',
    '............................................................................................................................cd6775......6669ddfffcaee66.......75.........................................',
    '............................................................................................................................6e9887a676...669c77779affd6......6666........................................',
    '............................................................................................................................6cfd89eec99..57789c..77cff66.....6695........................................',
    '.............................................................................................................................6efc67eff56..7677c...79fff6......6e4........................................',
    '.............................................................................................................................37ff665.fc65.59ec9...79dff96.....6d7........................................',
    '............................................................................................................................724eff7.63e67..9de76...667fe67....7ce7.......................................',
    '...........................................................................................................................16635ff...3f79...7df7....599f79....79f66....ca56..............................',
    '...........................................................................................................................16866efe..3fd7.....fc9...677ed9.....6f76....ce955.............................',
    '......................................................................................................................01.....8869ff..59f49....ce5....77ef7.....7fd5....99d95.............................',
    '......................................................................................................................01....16886af.787f66....7ed2.111ffc9.....7df7.....5ae9...........e.................',
    '.....................................................................................................................0133....48988cf787fd5.....ec23333fc49.....77fe.....77ff7..........fc................',
    '.....................................................................................................................03552111488984dea8ff9.111113579999422.....55ffa.....7eff7..........fa7..............',
    '.....................................................................................................................136661013598886e7aff9211116699aa988821....3.ff7......7cf67.....1...fd6..............',
    '........21...........................................................................................................136864444598886577.f91244668a59399885210127ffd5......58fd6....622...e6..............',
    '.......000000...........................................................................................0000000000000136a666544888886435f92566899a1111aa8861111ffa951111..38ef4....292...d77.............',
    '.......1221210......................................................................................22210111010111000146a59a944666638887ff568699712d21279886667ffc952211128a9f6....3a7....ee.............',
    '...00006655421...............................................................................000000011017a6544ac3.733136a568855668856888df988894134d321.988888dfc9888aca24aaafe111299a2...ffe............',
    '..007007888665000000000000001100000000000000000000010000001000000000000000000000000000000110112d333345237c66756847d43136a5468866688888888fc88891246e65317a8888dd8888accc9a9aacd852489a921136f7212........',
    '..0bbb0799998800111111111111111111111112111111111111111111111111111111111111111111111111111117cd86668c959866d55689c64136a5456988888868888dea8971456e8832196888aa8888989888899999998889855457e93223.......',
    '00bbbb0566866811.555554446dac444444447ca5555444455ad654544456cc6544445456dc555544445cd6555567aa866888cc89566e555aa864136a5455aaaa88ada888899971356dfc854137d669888888888888888888888888899fff9aaa2222....',
    '00bbb705666686135666666586ac966666665dd9666666656adc866666668ee8866666668ed666666666dd99998cc896566666cdd666655456543136a54456aaa8afffe88dc6971369edd885217cec568888688888888688888888888effff999aaa9111.',
    '00bbbb1565566613556666556cda855555569ea666666668cc886666666666e96666666668ec966666668dda88dc856556656666dc555aaaa554313595345556688eceffc866771489f7dc95317cadda86558a888888aaea66668888cf79cffffcaace..7',
    '00bbbb1555554412345555589cc555555446e9455555445ccc555445655556a955555555559dc864444559acaca6555556556668acc55caac85431259534444455de66feea567.1feff9cfaa727989ff9558eea8666688adcaa86a9afe88aeffffedffffc',
    '00bbbb14555544123344544ccc444444468da44445559aa95554444ac644444d944444544549cca544445555c9555445566556cc55a558335a643125953344444de5559aa9966.1edfe9cfdc.179667ee67ee5df66666668efffffefd888899acaaaaade.',
    '00bbb7045444441223444ad644444444accc334448a98954444439cc84444445ed4444444444454cc4444455a54444444a54cca5556996333aa43125953344444e54445556a569136cc9cca421785559fffe655f5555655566effff98688888a86886211.',
    '00bbb7045444441223445aa433333348644333334ac4443333335ccd44333333766543443334444888444445a64434445856d554445aa53335a84134953344443e54445558a564146699c9542178555699955556edda6656668aacc98668866664333....',
    '02bbb7045444441122345a4333333349433333333c9333333333ccd43333333333aa333333333334573333444a333445a6597444455993334aaa812595335459c754445566e567126568c85312765566666886549fd95559a8666668999663323221.....',
    '..07b704544444000011111111111111111101111111100100001111111111111111111111111111111111111111134c63aa33344555444a96444139953de65fe55555556eaa8a92356dd5411765556c545554545568955dd665884389e95211.........',
    '..000014444442000000000000000000000000000000000000000000000000000000000000000000000000000000033732972233455554564443613668a8668655555555cff88971235ea5203765555a655544445566aad22356662222ff5............',
    '....000.333331................................................2.............................10110001001133396433333221388665545445554444fd35587.122e32127544445e955432224566cce2212666232.ff7............',
    '.......1111100...............................................................................0000110000001223311111111398444443445543335f5233457312721175533335fd64211111226dfa7.11665..7eff7............',
    '.......000000...........................................................................................00001100000000388433323455552112d3223346711111773331113cf6422...0115ff47..1.21...ff..............',
    '.....................................................................................................................0366433323455421e.ca3122224674333443222.114df45......44fc6....111...f...............',
    '.....................................................................................................................034521112345542.ede9311112334455544210...126fd59.....97f55....1....f................',
    '.....................................................................................................................03421000234542..eae....112333456c3332......2df99.....7fc55........ff................',
    '.....................................................................................................................0131....34662...f7e.....7.f22346f3467......6cfe9...77fe65.........ff................',
    '.....................................................................................................................112.....45632..6dec......fe21112ff567......6ffc7..67effc6.........e.................',
    '......................................................................................................................00.....4557..d69f5....7cf...001ffef.......6ff77.77ddc..............................',
    '............................................................................................................................2433efee66e5....7ee.......dfff.....76fc7..7fe75..............................',
    '............................................................................................................................2423dfff66e5...def9......667ff.....67f65..79.................................',
    '............................................................................................................................1334ffd766e697.ee7.......67df......5fc5......................................',
    '.............................................................................................................................23cfd9c96c67ce9665......5eff7.....6f56......................................',
    '.............................................................................................................................76fe77e7756ad9766......56efc7.....6d7.......................................',
    '.............................................................................................................................cff.......6767........ecfc77......5e........................................',
    '.............................................................................................................................fd7.......966.......fffffc6.......6c........................................',
    '...........................................................................................................................99d7..................ece7767.......66........................................',
    '..........................................................................................................................5d96..................c667cc6........44........................................',
    '..........................................................................................................................545...................556ec76........4.........................................',
  ],
});

/** Icône du Dragoon : la pointe de lance, seule chose que l'adversaire voit venir. */
export const ICON_LANCE = deepFreeze({
  /**
   * Icône de titre et de carte du Lancier, **dérivée de l'artwork lui-même** :
   * la lance est tournée de 45° et réduite au cadre, elle n'est ni redessinée
   * ni reconstruite à partir d'un profil. C'est la seule façon qu'elle ne
   * mente pas sur l'arme qu'elle annonce — elle avait déjà divergé trois fois
   * (restée indigo quand l'arme est passée au cuivre, restée une lame fine
   * quand la tête est devenue une pointe de flèche, puis restée cuivre quand
   * l'arme est passée à l'électrique).
   *
   * Deux pièges de réduction, payés puis corrigés : cadrer la **tête seule**
   * donne une tache illisible à 16 px — c'est la silhouette longue terminée
   * par une masse qui se lit comme une arme ; et il faut **prémultiplier
   * l'alpha** avant de réduire, sans quoi la moyenne d'aire mélange le noir
   * des pixels transparents au violet de l'arme et toute la silhouette ressort
   * presque noire.
   */
  w: 16,
  h: 16,
  palette: {
    0: '#391a46',
    1: '#4e2a8e',
    2: '#6c3eac',
    3: '#ae8b46',
    4: '#9262d1',
    5: '#ce8cff',
    6: '#f2bfff',
    7: '#ffecff',
  },
  rows: [
    '...............6',
    '..............4.',
    '............525.',
    '..........6224..',
    '.........7422...',
    '.........2247...',
    '.........117....',
    '........22......',
    '.......2........',
    '......1.........',
    '.....1..........',
    '....1...........',
    '...1............',
    '..1.............',
    '.1..............',
    '3...............',
  ],
});

/** Table des sprites : clé → description. Les clés servent aux overrides PNG. */
export const PIXEL_MAPS = deepFreeze({
  // Ombre & Glace
  darkBlade: DARK_BLADE,
  iceAxeHead: ICE_AXE_HEAD,
  iceShard: ICE_SHARD,
  orbDark: ORB_DARK,
  snowflake: SNOWFLAKE,
  // armes
  fireBlade: FIRE_BLADE,
  lightHammerHead: LIGHT_HAMMER_HEAD,
  windShuriken: WIND_SHURIKEN,
  boltBlade: BOLT_BLADE,
  waterTrident: WATER_TRIDENT,
  // projectiles & entités
  ember: EMBER,
  windCrescent: WIND_CRESCENT,
  waterDrop: WATER_DROP,
  teslaNode: TESLA_NODE,
  waterWhirlpool: WATER_WHIRLPOOL,
  // plante
  plantBulb: PLANT_BULB,
  flower: FLOWER,
  // icônes
  iconFlame: ICON_FLAME,
  iconShield: ICON_SHIELD,
  iconTornado: ICON_TORNADO,
  iconBolt: ICON_BOLT,
  iconDroplet: ICON_DROPLET,
  iconLeaf: ICON_LEAF,
  // Hors-la-loi & Bretteur
  outlawRevolver: OUTLAW_REVOLVER,
  outlawShot: OUTLAW_SHOT,
  bladesmanFlameBlade: BLADESMAN_FLAMEBLADE,
  iconRevolver: ICON_REVOLVER,
  iconSabre: ICON_SABRE,
  // Dragoon
  lancerSpear: LANCER_SPEAR,
  iconLance: ICON_LANCE,
});
