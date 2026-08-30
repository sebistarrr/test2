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
 * LANCIER — **lance électrique**, transcrite de la maquette fournie.
 *
 * Elle remplace la lance de cuivre. Ce n'est pas un dessin d'après la
 * maquette : c'est la maquette elle-même, réduite par blocs **3 × 3 exacts**.
 *
 *     624 / 208 = 3 (horizontal)      129 / 64 = 2 (vertical)
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
  w: 208,
  h: 64,
  palette: {
    0: '#07050a',
    1: '#0f0421',
    2: '#21103d',
    3: '#331f5a',
    4: '#402771',
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
    '.......................................................................................................................00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    '................................................................................................................................................................................................................',
    '................................................................................................................................................................................................................',
    '................................................................................................................................................................................................................',
    '................................................................................................................................................................................................................',
    '................................................................................................................................................................................................................',
    '................................................................................................................................................................................................................',
    '................................................................................................................................................................................................................',
    '................................................................................................................................................................................................................',
    '................................................................................................................................................................................................................',
    '................................................................................................................................................................................................................',
    '..................................................................................................................................................7.............................................................',
    '.................................................................................................................................................f75............................................................',
    '..........................................................................................................................677..................77fa65...........................................................',
    '.........................................................................................................................76775..........77a96667999e65..........................................................',
    '..........................................................................................................................99d7..........59de969ef99f66..........................................................',
    '............................................................................................................................cd6775......6669ddfffcaee66.......75................................................',
    '............................................................................................................................6e9887a676...669c77779affd6......6666...............................................',
    '............................................................................................................................6cfd89eec99..57789c..77cff66.....6695...............................................',
    '.............................................................................................................................6efc67eff56..7677c...79fff6......6e4...............................................',
    '.............................................................................................................................37ff665.fc65.59ec9...79dff96.....6d7...............................................',
    '............................................................................................................................724eff7.63e67..9de76...667fe67....7ce7..............................................',
    '...........................................................................................................................16635ff...3f79...7df7....599f79....79f66....ca56.....................................',
    '...........................................................................................................................16866efe..3fd7.....fc9...677ed9.....6f76....ce955....................................',
    '......................................................................................................................01.....8869ff..59f49....ce5....77ef7.....7fd5....99d95....................................',
    '......................................................................................................................01....16886af.787f66....7ed2.112ffc9.....7df7.....5ae9...........e........................',
    '.....................................................................................................................0133....48988cf787fd5.....ec23333fc49.....77fe.....77ff7..........fc.......................',
    '.....................................................................................................................13552111488984dea8ff9.111113579999422.....55ffa.....7eff7..........fa7.....................',
    '.....................................................................................................................136661014598886e7aff9211116699aa988821....3.ff7......7cf67.....1...fd6.....................',
    '........21...........................................................................................................136865444598886577.f91244668a59399885210127ffd5......58fd6....622...e6.....................',
    '.......100000...........................................................................................0000000000000136a666544888886435f92566899a1111aa8861111ffa952111..38ef4....392...d77....................',
    '.......1221210......................................................................................22210111110111011146a59a944666638887ff568699712d21279886667ffc952211128a9f6....3a7....ee....................',
    '...00006655421...............................................................................000000111017a6544ac3.733136a568855668856888df988894134d321.988888dfc9888aca24aaafe111299a2...ffe...................',
    '..007007888665001100001000001100000011100000000010110000001100000000000010111101000000011111112d333345237c66756847d43136a5468866688888888fc88891246e65317a8888dd8888accc9a9aacd852489a921136f7212...............',
    '..0bbb0799998810111111111111111111111112111111111111111111111111111111111111111111111111111117cd86668c959866d55689c64136a5456988888868888dea8971456e8832196888aa8888989888899999998889855457e93223..............',
    '00bbbb0566866811.555554446dac444444447ca5555444455ad654544456cc6544445456dc555544445cd6555567aa866888cc89566e555aa864136a5455aaaa88ada888899972356dfc855137d669888888888888888888888888899fff9aaa2222...........',
    '00bbb705666686135666666586ac966666665dd9666666656adc866666668ee8866666668ed666666666dd99998cc896566666cdd666655456543136a54456aaa8afffe88dc6971369edd885217cec568888688888888688888888888effff999aaa9111........',
    '00bbbb1565566613556666556cda855555569ea666666668cc886666666666e96666666668ec966666668dda88dc856556656666dc555aaaa554313595345556688eceffc866771489f7dc95317cadda86558a888888aaea66668888cf79cffffcaace..7.......',
    '00bbbb1555554412345555589cc555555546e9455555445ccc555445655556a955555555559dc864444559acaca6555556556668acc55caac85431259534444455de66feea567.1feff9cfaa727989ff9558eea8666688adcaa86a9afe88aeffffedffffc.......',
    '00bbbb14555544123344554ccc444444468da44445559aa95554444ac644444d944444544549cca544445555c9555445566556cc55a558345a643125953344444de5559aa9966.1edfe9cfdc.179667ee67ee5df66666668efffffefd888899acaaaaade........',
    '00bbb7145444441223444ad644444444accc334448a98954444439cc84444445ed4444444444454cc4444455a54444444a54cca5556996334aa43125953344444e54445556a569136cc9cca421785559fffe655f5555655566effff98688888a86886212........',
    '00bbb7145444441223445aa433333348644333334ac4443333335ccd44433333766544443344444888444445a64434445856d554445aa53345a84134953344443e54445558a564146699c9542178555699955556edda6656668aacc98668866664333...........',
    '02bbb7045444441122345a4333333349433333333c9333333333ccd43333333333aa333333333334573333444a333445a6597444455993334aaa812595335459c754445566e567126568c85312765566666886549fd95559a8666668999663323221............',
    '..07b704544444100011111111111111111111111111110110111111111111111111111111111111111111111111134c63aa33344555444a96444139953de65fe55555556eaa8a92456dd5411765556c545554545568955dd665884489e95211................',
    '..000014444443000000000000000000000000000000000000000000000000000000000000000000000000000000033732972233455554564443613668a8668655555555cff88971235ea5203765555a655544445566aad22356662222ff5...................',
    '....000.333331................................................2.............................11110011111133396433333221388665545445554444fd35587.122e32127544445e955432224566cce2212666232.ff7...................',
    '.......1111110...............................................................................0000110000001223311111111398544443445543335f5233457312721175533335fd64211111226dfa7.11665..7eff7...................',
    '.......000000...........................................................................................00011100000000388433323455552112d3223346711111773331113cf6422...0125ff47..1.21...ff.....................',
    '.....................................................................................................................0366433323455421e.ca3122224674333443222.114df45......44fc6....111...f......................',
    '.....................................................................................................................034521112345542.ede9311112334455544211...126fd59.....97f55....1....f.......................',
    '.....................................................................................................................03422001234542..eae....112333456c3332......2df99.....7fc55........ff.......................',
    '.....................................................................................................................0131....34662...f7e.....7.f22346f3467......6cfe9...77fe65.........ff.......................',
    '.....................................................................................................................112.....45632..6dec......fe21112ff567......6ffc7..67effc6.........e........................',
    '......................................................................................................................00.....4557..d69f5....7cf...001ffef.......6ff77.77ddc.....................................',
    '............................................................................................................................2433efee66e5....7ee.......dfff.....76fc7..7fe75.....................................',
    '............................................................................................................................2423dfff66e5...def9......667ff.....67f65..79........................................',
    '............................................................................................................................1334ffd766e697.ee7.......67df......5fc5.............................................',
    '.............................................................................................................................23cfd9c96c67ce9665......5eff7.....6f56.............................................',
    '.............................................................................................................................76fe77e7756ad9766......56efc7.....6d7..............................................',
    '.............................................................................................................................cff.......6767........ecfc77......5e...............................................',
    '.............................................................................................................................fd7.......966.......fffffc6.......6c...............................................',
    '...........................................................................................................................99d7..................ece7767.......66...............................................',
    '..........................................................................................................................5d96..................c667cc6........44...............................................',
    '..........................................................................................................................545...................556ec76........4................................................',
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
    0: '#3f1d58',
    1: '#4c2690',
    2: '#6637ae',
    3: '#8758b2',
    4: '#9c6dd9',
    5: '#bb8afc',
    6: '#e1a8ff',
    7: '#ffbaff',
  },
  rows: [
    '................',
    '................',
    '................',
    '.............73.',
    '............42..',
    '..........5326..',
    '.........4324...',
    '.........117....',
    '........22......',
    '.......2........',
    '......1.........',
    '.....1..........',
    '...32...........',
    '..23............',
    '.1..............',
    '32..............',
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
  lancerSpear: LANCER_SPEAR,
  iconLance: ICON_LANCE,
});
