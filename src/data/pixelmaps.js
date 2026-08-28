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
 * HORS-LA-LOI — revolver
 * Relevé (frame 300, la plus nette du lot) : 34 x 15 cellules, crosse brune
 * côté bille, carcasse et barillet en acier bleuté-violine, puis un canon
 * **fin** — 6 cellules de haut sur les 15 de l'emprise. C'est le contraste
 * corps épais / canon fin qui identifie l'arme, pas sa silhouette générale.
 * ------------------------------------------------------------------ */
export const OUTLAW_REVOLVER = deepFreeze({
  w: 34,
  h: 15,
  palette: {
    K: '#100b16', // contour
    S: '#4f4a63', // acier bleuté-violine
    l: '#8b85a6', // reflet du canon et chambres du barillet
    W: '#8a5934', // crosse brune : pipette (138,89,52), la couleur d'identité
    w: '#5d3a20', // ombre de la crosse
  },
  rows: [
    '......KKKKKKK.....................',
    '......KSSSSSK.....................',
    '...KKKSSSSSSSKKKKKK...............',
    '...KSSSSSSSSSSSSSSK...............',
    '...KSSlllSSSSSSSSSSKKKKKKKKKKKKKKK',
    '...KSSlllSSSSSSSSSSSlllllllllllllK',
    '...KSSlllSSSSSSSSSSSlllllllllllllK',
    '...KSSlllSSSSSSSSSSSSSSSSSSSSSSSSK',
    '...KSSSSSSSSSSSSSSSSSSSSSSSSSSSSSK',
    '..KWWWWWWWWWWSSSSSSKKKKKKKKKKKKKKK',
    '..KWWWWWWWWWWKKKKKK...............',
    '..KwwwwwwwwWK.....................',
    '..KwwwwwwwwWK.....................',
    '..KwwwwwwwwWK.....................',
    '..KKKKKKKKKKK.....................',
  ],
});

/* ------------------------------------------------------------------
 * HORS-LA-LOI — balle
 * Relevé frame 300 : le sillage fait 2 px et rend (213,182,153) à
 * (236,206,177) sur l'arène — un trait **pâle**, pas un rond sombre. Les
 * cinq taches alignées de la frame 224 sont ce sillage en tirets, pas cinq
 * projectiles.
 * ------------------------------------------------------------------ */
export const OUTLAW_SHOT = deepFreeze({
  w: 9,
  h: 3,
  palette: { K: '#3a2a14', y: '#e8c98a', W: '#fff6e0' },
  rows: ['..KKKKKK.', '.KyWWWWyK', '..KKKKKK.'],
});

/* ------------------------------------------------------------------
 * BRETTEUR — sabre dentelé
 * Relevé : garde **orange vif** (232,160,40), petite croix trapue. La lame
 * n'est pas symétrique — bande gris-brun sur l'arête **haute**, corps ivoire
 * en **bas** — et elle est **fuselée** : une lame à côtés parallèles donne un
 * bout carré que le relevé n'a pas. Les deux arêtes sont dentées, d'où
 * l'aspect scie.
 * ------------------------------------------------------------------ */
export const BLADESMAN_SABRE = deepFreeze({
  w: 40,
  h: 16,
  palette: {
    K: '#171009', // contour
    O: '#e8a028', // garde orange vif : pipette (232,160,40)
    D: '#6b5c4a', // bande gris-brun de l'arête haute
    I: '#efe6d2', // corps ivoire, en bas de la lame
  },
  rows: [
    '........................................',
    '.KKKK...................................',
    '.KOOK...................................',
    '.KOOK...................................',
    '.KOOK...................................',
    '.KOOK.KK.KK.KK..........................',
    '.KOOOKDDKDDKDK.KK.KK.KK.KK.KK.K.........',
    '.KOOODIIDIIDIIKDDKDDKDDKDDKDDKDK.KKKKKKK',
    '.KOOOIIIIIIIIIDIIDIIDIIDIIDIIDIDKDDDDDDK',
    '.KOOOIIIIIIIIIIIIIIIIIIIIIIIIIIKKKKKKKKK',
    '.KOOOIIIIIIIIIKKKKKKKKKKKKKKKKK.........',
    '.KOOOKKKKKKKKK..........................',
    '.KOOK...................................',
    '.KOOK...................................',
    '.KKKK...................................',
    '........................................',
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
  palette: { K: '#241a10', S: '#8f8aa8', l: '#d5cfe6', s: '#6f6a86', W: '#c98a4b', w: '#8a5934' },
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

export const ICON_SABRE = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#171009', I: '#efe6d2', D: '#8d7b62', O: '#e8a028' },
  rows: [
    '............KKK.',
    '...........KIIK.',
    '..........KIIDK.',
    '.........KIIDKK.',
    '........KIIDKK..',
    '.......KIIDKK...',
    '......KIIDKK....',
    '.....KIIDKK.....',
    '....KIIDKK......',
    '...KIIDKK.......',
    '..KKIIKK........',
    '.KOKKKKOK.......',
    '.KOOOKOOOK......',
    '..KKOKKKK.......',
    '....KOOK........',
    '.....KK.........',
  ],
});

/* ------------------------------------------------------------------
 * DRAGOON — la lance, arme la plus longue du jeu
 *
 * Relevé en aplatissant la lance : pour trois images nettes (t = 0 / 4,5 /
 * 7,8 s), la bille est localisée au sous-pixel, l'image est tournée pour
 * mettre la lance à l'horizontale, puis on mesure la demi-épaisseur colonne
 * par colonne. Les trois profils concordent.
 *
 *   • talon                       = −34 px vidéo → −42 px logiques
 *   • pointe                      = 128 / 132 / 136 px vidéo → **164 px**
 *   • demi-épaisseur, à la bille  =   9,7 px vidéo → 24 px logiques de large
 *   • demi-épaisseur, au ventre   =  12,8 px vidéo → **32 px** de large
 *   • demi-épaisseur, près pointe =   8,4 px vidéo → 21 px de large
 *
 * **La lame est en feuille** : plus large au milieu qu'à ses deux bouts. Le
 * premier portage l'affinait de façon monotone, ce que la vidéo dément.
 * Aucune garde n'est visible : ce qui ressemblait à un losange de garde est
 * derrière la bille, donc invisible en jeu.
 *
 * **La silhouette est crantée, pas lisse.** C'est le second relevé, pris sur
 * l'image 4,267 s où la lance passe à 1,2° de l'horizontale : le contour noir
 * monte et descend d'une dent toutes les ~8 px logiques sur les deux bords, du
 * talon à la pointe. La carte lisse d'origine lissait précisément ce qui fait
 * lire l'arme comme une pique et non comme une épée. Les demi-épaisseurs
 * ci-dessus, elles, ne bougent pas : elles restent `mesuré`, le crantage se
 * pose dessus.
 *
 * D'où une carte de 104 × 16 rendue à `scale: 2` : toujours 208 × 32 px
 * logiques, avec `handle.length: -44` pour que le talon dépasse derrière le
 * pivot et que la pointe tombe pile sur la portée (−44 + 104 × 2 = 164).
 * ------------------------------------------------------------------ */
export const DRAGOON_LANCE = deepFreeze({
  /**
   * **104 x 16 à `scale: 2`**, là où la carte précédente faisait 52 x 8 à
   * `scale: 4`. Même encombrement (208 x 32 px logiques), donc même portée
   * (−44 + 208 = 164) et même profil en feuille — mais **deux fois plus de
   * résolution en longueur**, ce qui est exactement ce qu'il faut pour des
   * crans de 2 px. À 52 cellules, le plus petit cran possible en faisait 4.
   */
  w: 104,
  h: 16,
  palette: {
    K: '#0d0a14', // contour
    l: '#9a8ab4', // arête haute, éclairée (p80 de la lame relevée)
    p: '#6b5484', // corps de lame (médiane relevée)
    s: '#4a3a63', // arête basse, à l'ombre (p20 relevée)
    m: '#2f2636', // manche
    d: '#17111f', // manche à l'ombre
  },
  rows: [
    '...............................KKKKKKKKKKKKKKKKKllKKllKKllKKllKKKKKKKKKKKKKKKK..........................',
    '.......................KKKKKKKKKllKKllKKllKKllKllllllllllllllllKllKKllKKllKKlKKKKKKKKKKKKKK.............',
    '.....................KKKllKKllKlllllllllllllllllppllppllppllppllllllllllllllllKKllKKllKKllKKKKKKKK......',
    '..............KKKKKKKKllllllllllppllppllppllpplpppppppppppppppplppllppllppllplllllllllllllllllKKlKK.....',
    '.........KKKKKKmKKmmKKllppllpplpppppppppppppppppppppppppppppppppppppppppppppppllppllppllppllllllllKKKK..',
    '.KKKKKKKKKmmKKmmmmmmmmppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppllpllKlKK.',
    'KKmmKKmmmmmmmmmmmmmmmmppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppllllKK',
    'KmmmmmmmmmmmmmmmmmmmmmppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppplpllK',
    'KmddmmddddmmddmmmmmmmmpppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppspslK',
    'KKddKKdddddddddmddmmddppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppssssKK',
    '.KKKKKKKKKddKKddddddddppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppsspssKsKK.',
    '.........KKKKKKdKKddKKssppssppspppppppppppppppppppppppppppppppppppppppppppppppssppssppssppssssssssKKKK..',
    '..............KKKKKKKKssssssssssppssppssppssppsppppppppppppppppsppssppssppsspsssssssssssssssssKKsKK.....',
    '.....................KKKssKKssKsssssssssssssssssppssppssppssppssssssssssssssssKKssKKssKKssKKKKKKKK......',
    '.......................KKKKKKKKKssKKssKKssKKssKssssssssssssssssKssKKssKKssKKsKKKKKKKKKKKKKK.............',
    '...............................KKKKKKKKKKKKKKKKKssKKssKKssKKssKKKKKKKKKKKKKKKK..........................',
  ],
});

/** Icône du Dragoon : la pointe de lance, seule chose que l'adversaire voit venir. */
export const ICON_LANCE = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#06040a', l: '#b9a9e0', p: '#7a5ea4', s: '#4a3468', m: '#2f2636' },
  rows: [
    '.............KK.',
    '............KlK.',
    '...........KlpK.',
    '..........KlppK.',
    '.........KlppsK.',
    '........KlppsKK.',
    '.......KlppsKK..',
    '......KlppsKK...',
    '.....KlppsKK....',
    '....KKlpsKK.....',
    '...KKKlsKK......',
    '..KmmKKKK.......',
    '.KmmmK..........',
    'KmmmK...........',
    'KmmK............',
    'KKK.............',
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
  bladesmanSabre: BLADESMAN_SABRE,
  iconRevolver: ICON_REVOLVER,
  iconSabre: ICON_SABRE,
  // Dragoon
  dragoonLance: DRAGOON_LANCE,
  iconLance: ICON_LANCE,
});
