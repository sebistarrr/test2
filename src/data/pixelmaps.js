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

/* ==================================================================
 *  ROSTER « BÊTES SPIRITUELLES / ANIMAUX TOTEMS »
 *
 *  Huit combattants décrits d'un bloc : palette, sprite 16×16 (vue 3/4,
 *  **face à droite** comme le veut la convention d'angle 0), projectile 8×8
 *  et icône 8×8 pour l'écran de sélection.
 *
 *  Convention de palette, identique pour les huit — une lettre garde le même
 *  rôle d'une bête à l'autre, c'est ce qui rend le fichier relisible :
 *
 *    K  contour sombre (teinté de la bête, jamais du noir pur sauf l'Araignée)
 *    r  liseré clair — **le** pixel qui décolle la silhouette du fond #1c1a26 ;
 *       posé sur l'arête haut-gauche, source de lumière commune au roster
 *    p  couleur primaire        s  son ombre
 *    w  point de lumière        e  œil
 *    + une ou deux lettres propres à l'archétype (y or, g acide, d rouge…)
 *
 *  Pourquoi un liseré et pas un simple contour noir : les fiches d'origine
 *  sont relevées sur une arène blanche, où le noir suffit. Ici les sprites
 *  vivent aussi sur l'encre sombre du fond (voir « Écarts volontaires » dans
 *  CLAUDE.md) ; sans `r`, l'Araignée et le Loup s'y dissolvent.
 *
 *  Planche de contrôle : `node tools/beasts-preview.mjs` — rend les 24 maps
 *  sur fond sombre *et* sur fond clair, et vérifie dimensions et palettes.
 * ================================================================== */
export const SPIRIT_BEASTS = deepFreeze({
  /* ---- 1. LE LOUP — traqueur, dagues-crocs, bleu argenté ---- */
  wolf: {
    label: 'Le Loup',
    archetype: 'Traqueur',
    palette: {
      K: '#0a0f1a', // contour bleu-nuit
      r: '#dbe9fb', // liseré argenté
      p: '#8fa6c8', // fourrure
      s: '#4f6488', // fourrure à l'ombre
      w: '#ffffff', // crocs, lame
      e: '#ffc94a', // œil ambré
      h: '#2c3550', // manche de la dague
    },
    // museau à droite, dague-croc levée le long du flanc, queue à gauche
    sprite: [
      '..KK....KK......',
      '.KrrK..KrrK.....',
      '.KpppppppppK....',
      '.KrpppppppsK.KK.',
      '.KrpepppepsKKwwK',
      '.KrpppwwppsKKwrK',
      '.KrpswKwspsKKwrK',
      '..KsswwwssK.KwrK',
      '...KsssssK..KwrK',
      '..KrpppppsKKhhhK',
      'KsKrppwppsK.KhK.',
      'KsKrpppppsK.KKK.',
      '.KKspppppsK.....',
      '...KsssssK......',
      '...KsK.KsK......',
      '...KKK.KKK......',
    ],
    // croc effilé : le liseré et l'ombre donnent le volume, sinon c'est un pâté
    projectile: [
      '.KKKK...',
      'KwwwrK..',
      'KwwwwrK.',
      'KwwwwrrK',
      '.KwwwrsK',
      '..KwwrsK',
      '...KKrsK',
      '.....KK.',
    ],
    icon: [
      'KK....KK',
      'KrKKKKrK',
      'KrpppprK',
      'KpeppepK',
      '.KppppK.',
      '.KpwwpK.',
      '..KwwK..',
      '...KK...',
    ],
  },

  /* ---- 2. LA TORTUE — forteresse, bouclier lourd, jade et or ---- */
  turtle: {
    label: 'La Tortue',
    archetype: 'Forteresse',
    palette: {
      K: '#0c1a12', // contour vert-nuit
      r: '#a9ecc6', // liseré jade clair
      p: '#3f9e6b', // jade
      s: '#22603f', // coutures des écailles
      y: '#e8c04a', // cerclage doré
      w: '#f2fff8', // éclat
      e: '#12210f', // œil
    },
    // la carapace cerclée d'or *est* le bouclier lourd ; la tête sort à droite
    // sans contour propre, pour qu'elle se lise comme une excroissance du corps
    sprite: [
      '................',
      '...KKKKKK.......',
      '.KKyyyyyyKK.....',
      'KKyyrrrryyKK....',
      'KyyrpppppryK....',
      'KyrpsppspryKKKKK',
      'KyrpsppspryKpppK',
      'KyrsppppsryKppeK',
      'KyrpsppspryKpppK',
      'KyyrpppppryKKKKK',
      'KyyrpppppryK....',
      'KKyyrrrryyKK....',
      '.KKyyyyyyKK.....',
      '...KKKKKK.......',
      '..KppK..KppK....',
      '..KKKK..KKKK....',
    ],
    projectile: [
      '..KKKK..',
      '.KyyyyK.',
      'KyrppryK',
      'KyppwpyK',
      'KypwppyK',
      'KyrppryK',
      '.KyyyyK.',
      '..KKKK..',
    ],
    // carapace hexagonale : le cerclage d'or fait office de silhouette,
    // les coutures `s` restent à l'intérieur où elles se lisent encore
    icon: [
      '..yyyy..',
      '.yppppy.',
      'yprsspry',
      'ypsppspy',
      'ypsppspy',
      'yprsspry',
      '.yppppy.',
      '..yyyy..',
    ],
  },

  /* ---- 3. LE FAUCON — zoner, arc de vent, cyan et blanc ---- */
  hawk: {
    label: 'Le Faucon',
    archetype: 'Zoner',
    palette: {
      K: '#0b1a22', // contour bleu-nuit
      r: '#eafcff', // liseré glacé
      p: '#5fd0e8', // plumage cyan
      s: '#2a7590', // rémiges à l'ombre
      w: '#ffffff', // plumes claires
      y: '#f4a83a', // bec et serres
      e: '#12222b', // œil
    },
    // aile gauche déployée en arc — c'est l'arc de vent ; bec doré à droite
    sprite: [
      '.KK.............',
      '.KwK.......KKK..',
      '.KwwK....KKrrpK.',
      'KKwwwK..KKrppppK',
      'KwwwwwKKKrpepyyK',
      'KwwwwwKrpppKyyK.',
      'KwwwwKrppppKK...',
      '.KwwwKrpppsK....',
      '..KwwKrpppsK....',
      '...KKKrppsK.....',
      '...KKsrppsK.....',
      '..KssKrppsK.....',
      '.KssKKrppsK.....',
      '.KsK..KyKyK.....',
      '.KK...KyKyK.....',
      '......KKKKK.....',
    ],
    projectile: [
      '...K....',
      '..KwK...',
      '.KwrwK..',
      'KwrppwK.',
      '.KwrppwK',
      '..KwrpK.',
      '...KwK..',
      '....K...',
    ],
    icon: [
      '..KKK...',
      '.KrppK..',
      'KrpepK..',
      'KrpppKyy',
      'KrpppKy.',
      '.KrppK..',
      '..KKK...',
      '.KyKyK..',
    ],
  },

  /* ---- 4. LE SERPENT — embuscade, fouet toxique, violet et vert acide ---- */
  snake: {
    label: 'Le Serpent',
    archetype: 'Embuscade',
    palette: {
      K: '#140a1c', // contour prune
      r: '#e0c4ff', // liseré lilas
      p: '#7b3fb5', // écailles violettes
      s: '#48206e', // ventre à l'ombre
      g: '#b6f03a', // venin, crochets
      w: '#f6ecff', // éclat
      e: '#d8ff4a', // œil acide
    },
    // corps lové en S, tête dressée en haut à droite, crochets acides
    sprite: [
      '.......KKKK.....',
      '......KrppKK....',
      '.....KrpepppK...',
      '.....KrpppKggK..',
      '....KKrpppKgK...',
      '...KKrpppKK.....',
      '..KKrppsK.......',
      '.KKrppsKK.......',
      'KKrppsKK........',
      'KrppsKK.KKKK....',
      'KrppsK.KKrppK...',
      'KKrppK.KrppsKK..',
      '.KKrppKKrppsKK..',
      '..KKrpppppssK...',
      '...KKrppppssK...',
      '....KKKKKKKK....',
    ],
    projectile: [
      '...KK...',
      '..KggK..',
      '.KggggK.',
      'KgwggggK',
      'KgwgggsK',
      'KgggggsK',
      '.KgggsK.',
      '..KKKK..',
    ],
    icon: [
      '.KKKK...',
      'KrpppK..',
      'KpepeK..',
      'KppppKK.',
      'KppppppK',
      'KsppppKg',
      '.KsppKgg',
      '..KKKK..',
    ],
  },

  /* ---- 5. L'OURS — berserker, gantelets griffus, brun et rouge ---- */
  bear: {
    label: "L'Ours",
    archetype: 'Berserker',
    palette: {
      K: '#150c08', // contour terre brûlée
      r: '#e0bd97', // liseré fauve
      p: '#8a5a34', // pelage
      s: '#54341c', // pelage à l'ombre
      d: '#c8302a', // gantelets, rage
      w: '#ffe9cf', // museau, griffes
      e: '#f2d34a', // œil
    },
    // masse trapue, gantelets rouges de part et d'autre, griffes sorties
    sprite: [
      '..KKK.....KKK...',
      '.KrrrK...KrrrK..',
      '.KrppK...KrppK..',
      '..KppKKKKKppK...',
      '.KrpppppppppK...',
      '.KrppepppepsK...',
      '.KrpppppppppK...',
      '.KrppKwwwKppsK..',
      '..KppKwKwKppK...',
      '..KKrpppppprKK..',
      '.KdKrppppppKdK..',
      'KdddKrppppKdddK.',
      'KdwdKrppppKdwdK.',
      'KdddKKrppKKdddK.',
      'KwKwK.KppK.KwKwK',
      '.K.K...KKK...K.K',
    ],
    projectile: [
      '..K...K.',
      '.KdK.KdK',
      '.KdwKdwK',
      'KdwdKdwK',
      'KdwdKdwK',
      'KdwdKdwK',
      '.KddKddK',
      '..KK.KK.',
    ],
    // empreinte griffue. Aucun `K` porteur : sur le fond sombre un contour noir
    // ne dessine rien, l'icône doit tenir par ses seules valeurs claires.
    icon: [
      'rr.rr.rr',
      'pp.pp.pp',
      '.rrrrrr.',
      'rpddddpr',
      'rddddddr',
      'rddddddr',
      '.pddddp.',
      '..rrrr..',
    ],
  },

  /* ---- 6. LE TIGRE — combo, katars, orange, noir et blanc ---- */
  tiger: {
    label: 'Le Tigre',
    archetype: 'Combo',
    palette: {
      K: '#1a0d04', // contour ET rayures : même encre, comme sur un vrai pelage
      r: '#ffd9a8', // liseré chaud
      p: '#f0871f', // orange
      s: '#b3560c', // orange à l'ombre
      w: '#fff6e8', // masque et poitrail blancs
      e: '#f5e14a', // œil
      a: '#aebbcd', // acier des katars — assez froid pour ne pas se fondre
    }, //            dans le blanc `w` du masque, sinon les lames disparaissent
    // katars tenus des deux poings — la double lame dit le combo
    sprite: [
      '..KKK.....KKK...',
      '.KrpK.....KprK..',
      '.KppKKKKKKKppK..',
      '.KrpppKpppKppsK.',
      'KrppKpppppKppsK.',
      'KrpepppppppepsK.',
      'KrpppKwwwKpppsK.',
      '.KrppKwKwKppsK..',
      '.KKrpKwwwKpsKK..',
      '..KKrppKppprKK..',
      '.KaKrpKpppKrKaK.',
      'KaaKrppppppKaaK.',
      'KawKKrpKpppKKawK',
      'KaaK.KrppppK.KaK',
      '.KK..KrppKpK.KK.',
      '.....KKKK.KK....',
    ],
    // les deux lames à la fois : c'est le combo qui identifie l'archétype,
    // les poings orange les rattachent au tigre plutôt qu'à un acier générique
    projectile: [
      '.K...K..',
      'KaK.KaK.',
      'KawKKawK',
      'KawKKawK',
      'KawKKawK',
      'KaaKKaaK',
      'KppKKppK',
      '.KK..KK.',
    ],
    // masque du tigre : orange plein et museau blanc portent la forme,
    // le `K` ne sert plus qu'aux rayures, à l'intérieur de la masse claire
    icon: [
      'pp....pp',
      'pKp..pKp',
      'pppppppp',
      'peppppep',
      'pKpwwpKp',
      '.pwwwwp.',
      '.pKwwKp.',
      '..pppp..',
    ],
  },

  /* ---- 7. L'ARAIGNÉE — contrôle, shurikens-toiles, noir profond et rouge ---- */
  spider: {
    label: "L'Araignée",
    archetype: 'Contrôle',
    palette: {
      K: '#000000', // seul noir pur du roster : c'est le thème de la bête
      r: '#8f8aa4', // liseré gris — sans lui la silhouette disparaît sur #1c1a26
      p: '#2b2733', // carapace
      s: '#151219', // creux
      d: '#e01f3a', // sablier rouge
      w: '#ffd7dc', // reflet du sablier
      e: '#ff5566', // yeux
    },
    // vue de dessus : les huit pattes sont tracées en liseré, seule couleur
    // qui tienne sur le fond sombre — le corps noir se lit alors en négatif.
    // Chaque patte est coudée et **touche le corps** : en pointillé elle se
    // lisait comme du bruit autour d'un disque, pas comme une araignée.
    sprite: [
      '................',
      '..r..........r..',
      '.r............r.',
      '.r............r.',
      '..r...KKKK...r..',
      'r..r.KeppeK.r..r',
      '.rrrKrpppprKrrr.',
      '....KrdwwdrK....',
      '....KrddddrK....',
      '.rrrKrpppprKrrr.',
      'r..r.KppppK.r..r',
      '..r...KKKK...r..',
      '.r............r.',
      '.r............r.',
      '..r..........r..',
      '................',
    ],
    projectile: [
      '...rr...',
      '.r.dd.r.',
      '.rddddr.',
      'rddKKddr',
      'rddKKddr',
      '.rddddr.',
      '.r.dd.r.',
      '...rr...',
    ],
    icon: [
      'r..rr..r',
      '.r.pp.r.',
      '.rppppr.',
      'rpeddepr',
      'rppddppr',
      '.rppppr.',
      '.r.pp.r.',
      'r..rr..r',
    ],
  },

  /* ---- 8. LE CERF — mystique, lance lumineuse, vert émeraude ---- */
  deer: {
    label: 'Le Cerf',
    archetype: 'Mystique',
    palette: {
      K: '#07190f', // contour sous-bois
      r: '#b9f5d8', // liseré menthe
      p: '#12a06b', // émeraude
      s: '#0a6344', // émeraude à l'ombre
      w: '#eafff5', // chanfrein clair
      y: '#f3e7b0', // bois et hampe
      l: '#9dffd6', // halo de la pointe
      e: '#062b1a', // œil
    },
    // bois ramifiés, lance lumineuse tenue à droite, pointe en halo
    sprite: [
      '...y.y..y.y.....',
      '...yyy..yyy.....',
      '.....y..y.......',
      '....KKKKKKKKK...',
      '....KrppppppK...',
      '....KrpepppeK.K.',
      '....KrppppppKKlK',
      '.....KrpwwpK.KwK',
      '......KwwwK..KlK',
      '.....KKrppKK.KyK',
      '...KrppppppK.KyK',
      '...KrppppppK.KyK',
      '...KrppppppK.KyK',
      '...KKrppppKK.KyK',
      '....KsK.KsK..KyK',
      '....KKK.KKK..KKK',
    ],
    projectile: [
      '...K....',
      '..KlK...',
      '.KlwlK..',
      'KlwwwlK.',
      '.KlwwwlK',
      '..KlwlK.',
      '...KlK..',
      '....K...',
    ],
    icon: [
      'y.y..y.y',
      '.yy..yy.',
      '..y..y..',
      '..yyyy..',
      '.KppppK.',
      'KpeppepK',
      '.KpwwpK.',
      '..KKKK..',
    ],
  },
});

/**
 * CERF — cercle sacré. La spirale du Cerf reprend **exactement la géométrie**
 * de `WATER_WHIRLPOOL` (relevée image par image sur FIRE vs WATER, deux tours
 * et demi de bras) sous une palette émeraude : la mécanique du tourbillon est
 * inchangée, seule l'identité change. Réutiliser les `rows` plutôt que les
 * recopier garantit que les deux ne divergeront jamais.
 */
export const SACRED_CIRCLE = deepFreeze({
  w: WATER_WHIRLPOOL.w,
  h: WATER_WHIRLPOOL.h,
  palette: {
    K: '#07190f', // bras et contour, vert sous-bois
    b: '#19b98a', // disque émeraude
    w: '#9dffd6', // éclats de lumière
  },
  rows: WATER_WHIRLPOOL.rows,
});

/**
 * Adapte une entrée du roster au contrat de `render/pixelart.js`
 * (`{w, h, palette, rows}`) : le moteur ne connaît que cette forme-là.
 */
function toPixelMap(palette, rows) {
  return { w: rows[0].length, h: rows.length, palette, rows };
}

/**
 * Sprites du roster aplatis en clés de la banque : `wolfSprite`,
 * `wolfProjectile`, `wolfIcon`, … C'est ce que citent `elements.js`
 * (`head.sprite`, `projectiles.*.sprite`, `icon`) et les overrides PNG.
 */
export const BEAST_MAPS = deepFreeze(
  Object.fromEntries(
    Object.entries(SPIRIT_BEASTS).flatMap(([cle, bete]) => [
      [`${cle}Sprite`, toPixelMap(bete.palette, bete.sprite)],
      [`${cle}Projectile`, toPixelMap(bete.palette, bete.projectile)],
      [`${cle}Icon`, toPixelMap(bete.palette, bete.icon)],
    ]),
  ),
);

/** Table des sprites : clé → description. Les clés servent aux overrides PNG. */
export const PIXEL_MAPS = deepFreeze({
  ...BEAST_MAPS,
  sacredCircle: SACRED_CIRCLE,
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
});
