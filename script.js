/* =====================================================================
   Outlaw vs Bladesman — reproduction pixel-perfect
   ---------------------------------------------------------------------
   Toutes les constantes marquées « mesuré » viennent d'un relevé fait
   image par image sur la vidéo de référence (576 x 1024, 30 fps, 1159
   frames). Celles marquées « calé » ont été ajustées pour retomber sur
   le comportement observé quand la vidéo ne révèle pas la règle exacte.
   Ne jamais changer une valeur « mesuré » sans refaire le relevé :
   la méthode complète est dans CLAUDE.md.
   ===================================================================== */

'use strict';

/* ---------------------------------------------------------------------
   1. GÉOMÉTRIE  (toutes les valeurs en unités logiques = pixels vidéo)
   ------------------------------------------------------------------ */

const W = 576;   // mesuré : largeur native de la vidéo
const H = 1024;  // mesuré : hauteur native

// Arène : tracé du rect stroké, relevé au sous-pixel sur les bords.
// Bords sombres mesurés aux colonnes 37..40 / 535..538 et aux lignes
// 261..264 / 759..762 => chemin (39,263,498,498), trait 3,5 px.
const ARENA = {
  x: 39, y: 263, w: 498, h: 498,
  line: 3.5,                       // mesuré : couverture 3,46 px
  get cx() { return this.x + this.w / 2; },   // = 288, centre exact du canvas
  get cy() { return this.y + this.h / 2; },   // = 512, centre exact du canvas
  // Aire de jeu = intérieur du trait
  get inX() { return this.x + this.line / 2; },
  get inY() { return this.y + this.line / 2; },
  get inW() { return this.w - this.line; },
  get inH() { return this.h - this.line; }
};

// Jauges d'ultime : alignées exactement sur les bords de l'arène.
// Runs sombres mesurés : 38..282 et 293..538 sur la ligne 777.
// Le trait fait la même épaisseur que celui de l'arène : sans ça les bords
// du cadre ne noircissent que deux lignes au lieu des trois du relevé
// (776..778 et 805..807).
const BAR = {
  y: 777.5, h: 29, line: 3.5,
  left:  { x: 39,  w: 242 },
  right: { x: 295, w: 242 }
};

const BALL_R = 32;        // mesuré : profil radial, anneau sombre centré sur r=32,2
const BALL_LINE = 3;      // mesuré : le trait couvre r 30,5..33,5

/* ---------------------------------------------------------------------
   2. PALETTE  (médianes sur plaque temporelle débruitée)
   ------------------------------------------------------------------ */

const C = {
  page:      '#D4CED5',   // mesuré : (212,206,213), fond hors arène
  arena:     '#FFFFFF',   // mesuré : (255,255,255) hors HIGH NOON
  arenaNoon: '#FDF7ED',   // mesuré : (253,247,237) pendant HIGH NOON
  ink:       '#000000',   // mesuré : bordure d'arène et de jauges
  ballLine:  '#181008',   // mesuré : (24,13,7), contour des billes

  outlaw:    '#8A5934',   // mesuré : (138,89,52) — titre, bille, jauge, stats
  blade:     '#DCC462',   // mesuré : (220,196,98) — idem côté Bladesman

  hp:        '#F5F2EA',   // mesuré : chiffre de PV, crème très clair
  label:     '#FFFFFF',   // mesuré : « HIGH NOON » / « BLADE RUSH »
  watermark: 'rgba(120,116,110,0.42)',  // mesuré : rendu (167,163,157) sur blanc
  dead:      '#8E8A92',   // mesuré : le camp mort passe en gris

  // Traînée de lame. Mesuré : le coeur rend (187,200,79) sur blanc, ce qui
  // correspond à #A0B414 posé à 75 % d'alpha.
  slash:     [160, 180, 20],
  slashA:    0.62,

  // Sillage du projectile. Mesuré frame 224 : cinq taches alignées de
  // (285,568) à (274,660), espacées de 10 à 20 px — c'est UNE balle rendue
  // en tirets, pas cinq balles. Le sillage fait donc ~90 px de long.
  trail:     [122, 96, 66],
  trailLen:  90,
  trailSeg:  5
};

/* ---------------------------------------------------------------------
   3. TYPOGRAPHIE
   Hauteurs de capitale mesurées sur la plaque débruitée ; la taille de
   police en découle (capHeight / em = 0,716 pour un grotesque très gras).
   ------------------------------------------------------------------ */

const FONT = '"Arial Black","Archivo Black","Helvetica Neue",Impact,sans-serif';

const TYPE = {
  title: { size: 31, stroke: 6, capTop: 219, capBot: 240 },  // mesuré : cap 22 px
  stat:  { size: 19, stroke: 5 },                            // mesuré : cap ~13,5 px
  label: { size: 15, stroke: 4 },                            // mesuré : cap ~11 px
  hp:    { size: 32, stroke: 5 },                            // mesuré : cap 23 px
  mark:  { size: 19 }                                        // filigrane
};

// Lignes de base mesurées (bas des capitales) :
const Y_TITLE = 240;      // mesuré : remplissage du titre lignes 219..240
const Y_STAT1 = 839;      // mesuré : « Damage: » cap 825..838
const Y_STAT2 = 864;      // mesuré : « Ammo: » / « Spin Speed: » cap 850..863
const Y_LABEL = 792;      // mesuré : libellés de jauge, cap 782..792
const Y_MARK  = 736;      // mesuré : filigrane centré sur x=288

const X_LEFT  = 42;       // mesuré : bord gauche du remplissage des textes
const X_RIGHT = 534;      // mesuré : bord droit du remplissage des textes

/* ---------------------------------------------------------------------
   4. RÈGLES DU DUEL
   ------------------------------------------------------------------ */

const RULES = {
  hp: 100,                       // mesuré : les deux billes démarrent à 100

  // Vitesses : médianes des segments rectilignes entre deux rebonds.
  // 16,1 px/frame et 20,2 px/frame à 30 fps.
  speedOutlaw: 483,              // mesuré : px/s
  speedBlade:  605,              // mesuré : px/s
  noonSpeedUp: 1.22,             // mesuré : +22 % de vitesse pendant HIGH NOON

  // Outlaw --------------------------------------------------------------
  dmgOutlaw0:   3.00,            // mesuré : valeur affichée à la frame 1
  dmgOutlawStep: 0.10,           // mesuré : la stat monte par paliers de 0,10
  dmgOutlawMax:  6.00,           // calé : la vidéo s'arrête à 5,50, jamais plus haut
  magazine:      6,              // mesuré : « Ammo: n/6 »
  fireDelay:     600,            // mesuré : ~18 frames entre deux décréments d'Ammo
  fireDelayNoon: 300,            // mesuré : la cadence double pendant HIGH NOON
  reloadTime:    1600,           // calé : durée du trou entre 0/6 et 6/6
  bulletSpeed:   840,            // mesuré : ~28 px/frame à 30 fps
  recoil:        95,             // mesuré : recul appliqué à la bille à chaque tir

  // Bladesman -----------------------------------------------------------
  spinMin:      0.80,            // mesuré : plancher, jamais franchi
  spinMax:      3.00,            // mesuré : plafond, tenu en palier
  spinRamp:     0.20,            // mesuré : +0,07 toutes les 10 frames = 0,21/s
  spinPerHit:   0.15,            // mesuré : sauts discrets de +0,15 sur la courbe
  spinHold:     2000,            // mesuré : ~55 frames de palier à 3,00
  spinDecay:    3.0,             // mesuré : -1,00 toutes les 10 frames = -3,0/s
  dmgPerSpin:   2.0,             // mesuré : Damage = 2 x Spin Speed, sans exception
  swordCooldown: 420,            // calé : empêche la lame de toucher deux fois par passe

  // Ultimes --------------------------------------------------------------
  // Jauge gauche : pente de charge 1,13 px/frame sur 238 px utiles, puis
  // vidange à 1,28 px/frame pendant que l'arène est crème.
  noonCharge:   7.0,             // mesuré : 238/1,13/30 = 7,0 s de charge
  noonDuration: 6.2,             // mesuré : 238/1,28/30 = 6,2 s d'effet
  // Jauge droite : cycles mesurés de 273 / 214 / 333 frames -> charge liée
  // aux coups portés, pas à une simple horloge.
  rushCharge:   9.0,             // calé : moyenne des trois cycles observés
  rushPerHit:   0.06,            // calé : chaque coup d'épée avance la jauge
  rushDuration: 2.0              // mesuré : ~60 frames de jauge vide après le tir
};

/* ---------------------------------------------------------------------
   5. SPRITES PIXEL-ART
   Les armes du relevé sont des rasters pixellisés. On les rejoue comme
   des pixelmaps rendues en NEAREST : c'est le seul moyen de garder les
   marches d'escalier d'origine. Le corps des billes, lui, reste lissé.
   ------------------------------------------------------------------ */

const PAL_GUN = {
  K: '#141420',   // contour
  d: '#3C3C52',   // acier sombre
  m: '#5E5E7A',   // acier moyen
  l: '#8E8EA8',   // acier clair
  h: '#CACADB',   // reflet
  g: '#6B4A2F',   // crosse, ombre
  G: '#A9744B',   // crosse, lumière
  v: '#4A3350'    // barillet, violine mesurée sur la vidéo
};

// 34 x 15 cellules, rendues x2 => 68 x 30 px (mesuré : le revolver occupe
// r 30..97 et y -15..+14 autour du centre de la bille).
// Les longues séries sont générées : compter les caractères à la main est
// la première source d'erreur sur ce genre de carte.
const rep = (ch, n) => ch.repeat(Math.max(0, n));

const MAP_GUN = [
  /*  0 */ '',
  /*  1 */ '.....KKK',
  /*  2 */ '....KdddK',                                    // chien
  /*  3 */ '...KKdmmK' + rep('K', 25),                     // dessus du canon
  /*  4 */ '..KdvvmmK' + rep('h', 24) + 'K',               // reflet haut
  /*  5 */ '..KvhvvmK' + rep('l', 24) + 'K',
  /*  6 */ '.KdvhvvmK' + rep('l', 24) + 'K',
  /*  7 */ '.KdvvvvmK' + rep('m', 24) + 'K',
  /*  8 */ '.KdvvvmmK' + rep('d', 24) + 'K',
  /*  9 */ 'KGdvvmmdK' + rep('K', 25),                     // dessous du canon
  /* 10 */ 'KGGdKmmdK',                                    // pontet
  /* 11 */ '.KGGgKKKK',
  /* 12 */ '..KGgggK',
  /* 13 */ '..KggggK',
  /* 14 */ '...KKKK'
];

const PAL_SWORD = {
  K: '#1E1408',   // contour
  O: '#E8B037',   // garde, or (mesuré : (232,176,55))
  o: '#B8801F',   // garde, ombre
  y: '#F5CF63',   // garde, lumière
  b: '#EFE2C2',   // lame, tranchant clair (mesuré : bande haute crème)
  n: '#B08F63',   // lame, corps
  N: '#634526',   // lame, gorge sombre (mesuré : bande brune centrale)
  g: '#5A3D24',   // fusée, ombre
  G: '#8A6038'    // fusée, lumière
};

// 46 x 21 cellules, rendues x2 => 92 x 42 px (mesuré : garde à r 36..45,
// hauteur 43 px ; lame de r 45 à r 122, épaisseur 24 px).
// Le tranchant est denté : le relevé montre des tirets sombres réguliers
// le long des deux arêtes, pas un liseré continu.
const serr = n => rep('Kb', Math.ceil(n / 2)).slice(0, n);

const MAP_SWORD = [
  /*  0 */ '...KKKKKK',
  /*  1 */ '...KyOOoK',
  /*  2 */ '...KyOOoK',
  /*  3 */ '...KyOOoK',
  /*  4 */ '...KyOOoK',
  /*  5 */ '...KyOOoK' + serr(31) + 'K',           // arête haute dentée
  /*  6 */ '...KyOOoK' + rep('b', 31) + 'KK',
  /*  7 */ '.KGKyOOoK' + rep('b', 33) + 'K',
  /*  8 */ 'KgGKyOOoK' + rep('n', 34) + 'K',
  /*  9 */ 'KggKyOOoK' + rep('N', 35) + 'K',
  /* 10 */ 'KggKyOOoK' + rep('N', 36) + 'K',       // ligne la plus longue = pointe
  /* 11 */ 'KggKyOOoK' + rep('N', 35) + 'K',
  /* 12 */ 'KgGKyOOoK' + rep('n', 34) + 'K',
  /* 13 */ '.KGKyOOoK' + rep('b', 33) + 'K',
  /* 14 */ '...KyOOoK' + rep('b', 31) + 'KK',
  /* 15 */ '...KyOOoK' + serr(31) + 'K',           // arête basse dentée
  /* 16 */ '...KyOOoK',
  /* 17 */ '...KyOOoK',
  /* 18 */ '...KyOOoK',
  /* 19 */ '...KyOOoK',
  /* 20 */ '...KKKKKK'
];

const GUN_CELL = 2, GUN_W = 34, GUN_H = 15;      // -> 68 x 30
const SWORD_CELL = 2, SWORD_W = 46, SWORD_H = 21; // -> 92 x 42
const GUN_R0 = 30;      // mesuré : le sprite démarre à r=30 du centre
const SWORD_R0 = 30;    // mesuré : la garde démarre au bord de la bille

// Ouverture de l'éventail vert derrière la lame (mesuré : ~110 degrés).
const SLASH_SWEEP = 1.6;

/* ---------------------------------------------------------------------
   6. OUTILS
   ------------------------------------------------------------------ */

// Générateur déterministe. ?seed=1234 fixe tous les tirages du duel
// (angles de départ, gerbes d'étincelles). Attention : ce n'est pas un
// rejeu image par image — Phaser avance sur le temps réel, donc deux
// exécutions sur des machines différentes divergent au bout d'un moment.
// Pour un rejeu strict il faudrait un pas de temps fixe.
function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return function () {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

const params = new URLSearchParams(location.search);
const SEED = parseInt(params.get('seed') || '', 10) || (Date.now() & 0x7fffffff);
let rng = makeRng(SEED);

function rnd(a, b) { return a + rng() * (b - a); }

// Peint une pixelmap dans un contexte 2D. Les lignes plus courtes que la
// largeur sont complétées en transparent : ça évite de compter les points
// à la main dans les cartes ci-dessus.
function paintMap(ctx, map, pal, cell, cols, rows) {
  for (let r = 0; r < rows; r++) {
    const line = map[r] || '';
    for (let c = 0; c < cols; c++) {
      const ch = line[c];
      if (!ch || ch === '.') continue;
      const col = pal[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
}

// Texte tracé au pixel près : ligne de base explicite, contour puis
// remplissage, joints arrondis comme sur le relevé.
function inkText(ctx, text, x, y, size, fill, strokeW, align) {
  ctx.font = '900 ' + size + 'px ' + FONT;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  if (strokeW) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = strokeW;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

/* ---------------------------------------------------------------------
   7. SCÈNE
   ------------------------------------------------------------------ */

class Duel extends Phaser.Scene {
  constructor() { super('duel'); }

  /* --- textures générées ------------------------------------------- */
  preload() {
    this.buildBallTexture('ball-outlaw', C.outlaw);
    this.buildBallTexture('ball-blade', C.blade);
    this.buildWeaponTexture('gun', MAP_GUN, PAL_GUN, GUN_CELL, GUN_W, GUN_H);
    this.buildWeaponTexture('sword', MAP_SWORD, PAL_SWORD, SWORD_CELL, SWORD_W, SWORD_H);
    this.buildBulletTexture();
    this.buildSparkTexture();
  }

  buildBallTexture(key, fill) {
    const S = BALL_R * 2 + BALL_LINE + 4;          // marge pour le trait
    const t = this.textures.createCanvas(key, S, S);
    const ctx = t.getContext();
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = BALL_LINE;
    ctx.strokeStyle = C.ballLine;
    ctx.stroke();
    t.refresh();
  }

  buildWeaponTexture(key, map, pal, cell, cols, rows) {
    const t = this.textures.createCanvas(key, cols * cell, rows * cell);
    const ctx = t.getContext();
    ctx.imageSmoothingEnabled = false;
    paintMap(ctx, map, pal, cell, cols, rows);
    t.refresh();
    // Le pixel-art doit rester dur : sans NEAREST la lame redevient floue.
    t.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  // Projectile : le relevé montre une marque sombre allongée, pas un point.
  // Elle est plus dense à l'avant et s'effiloche à l'arrière.
  buildBulletTexture() {
    const t = this.textures.createCanvas('bullet', 18, 4);
    const ctx = t.getContext();
    const g = ctx.createLinearGradient(0, 0, 18, 0);
    g.addColorStop(0, 'rgba(70,58,44,0)');
    g.addColorStop(0.55, 'rgba(58,46,34,0.75)');
    g.addColorStop(1, 'rgba(30,22,14,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 1, 18, 2);
    t.refresh();
    t.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  buildSparkTexture() {
    const t = this.textures.createCanvas('spark', 8, 8);
    const ctx = t.getContext();
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,236,170,1)');
    g.addColorStop(1, 'rgba(255,190,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 8);
    t.refresh();
  }

  /* --- mise en place ------------------------------------------------ */
  create() {
    this.chrome = this.textures.createCanvas('chrome', W, H);
    this.chromeImg = this.add.image(0, 0, 'chrome').setOrigin(0, 0).setDepth(0);

    this.hud = this.textures.createCanvas('hud', W, 130);
    this.hudImg = this.add.image(0, 770, 'hud').setOrigin(0, 0).setDepth(60);

    // Traînées de lame : dessinées sous les combattants. La règle de
    // composition du relevé est que rien ne passe devant les billes.
    this.arcGfx = this.add.graphics().setDepth(10);
    this.trailGfx = this.add.graphics().setDepth(14);   // sous les billes

    this.physics.world.setBounds(ARENA.inX, ARENA.inY, ARENA.inW, ARENA.inH);

    this.startMatch();
    this.drawChrome();
  }

  startMatch() {
    rng = makeRng(SEED + (this.round || 0) * 7919);
    this.round = (this.round || 0) + 1;
    this.over = false;
    this.arcs = [];
    this.noonOn = false;

    if (this.outlaw) { this.outlaw.destroy(); this.blade.destroy(); }
    if (this.bullets) this.bullets.clear(true, true);
    if (this.hpTexts) this.hpTexts.forEach(t => t.destroy());
    if (this.gun) { this.gun.destroy(); this.sword.destroy(); }
    if (this.endText) { this.endText.destroy(); this.endText = null; }
    if (this.arcGfx) this.arcGfx.clear();

    this.bullets = this.physics.add.group();

    this.outlaw = this.spawn('ball-outlaw', ARENA.cx - 120, ARENA.cy + 40, RULES.speedOutlaw);
    this.blade = this.spawn('ball-blade', ARENA.cx + 120, ARENA.cy - 40, RULES.speedBlade);

    this.O = {
      s: this.outlaw, hp: RULES.hp, dmg: RULES.dmgOutlaw0,
      ammo: RULES.magazine, nextShot: 0, reloading: false, reloadEnd: 0,
      base: RULES.speedOutlaw, shake: 0, pop: 0
    };
    this.B = {
      s: this.blade, hp: RULES.hp, spin: RULES.spinMin, ang: 0,
      atCapSince: 0, burning: false, lastHit: 0,
      base: RULES.speedBlade, shake: 0, pop: 0
    };

    this.noon = 0; this.noonUntil = 0;
    this.rush = 0; this.rushUntil = 0;

    this.gun = this.add.image(0, 0, 'gun').setDepth(30);
    this.gun.setOrigin(0, 0.5);                    // pivot au bord de la bille
    this.sword = this.add.image(0, 0, 'sword').setDepth(30);
    this.sword.setOrigin(0, 0.5);

    this.hpTexts = [this.makeHpText(C.hp), this.makeHpText(C.hp)];

    this.physics.add.collider(this.outlaw, this.blade, () => this.onBallClash());
    // Arcade n'garantit pas l'ordre des deux arguments quand un groupe est
    // en jeu : il faut retrouver la balle explicitement, sinon on détruit
    // le Bladesman à la place du projectile. Déjà arrivé.
    this.physics.add.overlap(this.bullets, this.blade, (a, b) => {
      this.onBulletHit(this.bullets.contains(a) ? a : b);
    });
  }

  spawn(key, x, y, speed) {
    const s = this.physics.add.image(x, y, key).setDepth(20);
    const off = (s.width - BALL_R * 2) / 2;
    s.body.setCircle(BALL_R, off, off);
    s.setBounce(1).setCollideWorldBounds(true);
    s.body.useDamping = false;
    const a = rnd(0, Math.PI * 2);
    s.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
    return s;
  }

  makeHpText(color) {
    return this.add.text(0, 0, '100', {
      fontFamily: FONT, fontSize: TYPE.hp.size + 'px', fontStyle: '900',
      color: color, stroke: '#180F06', strokeThickness: TYPE.hp.stroke
    }).setOrigin(0.5, 0.5).setDepth(31);
  }

  /* --- décor fixe ---------------------------------------------------- */
  drawChrome() {
    const ctx = this.chrome.getContext();
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = C.page;
    ctx.fillRect(0, 0, W, H);

    // Arène : remplissage puis trait centré sur le chemin mesuré.
    ctx.fillStyle = this.noonOn ? C.arenaNoon : C.arena;
    ctx.fillRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = ARENA.line;
    ctx.strokeRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);

    // Filigrane, dans l'arène et sous les combattants.
    ctx.save();
    ctx.font = '900 ' + TYPE.mark.size + 'px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.watermark;
    ctx.fillText('ballthing.com', ARENA.cx, Y_MARK);
    ctx.restore();

    // Titres : bord gauche du texte aligné sur le bord gauche de l'arène,
    // bord droit du second aligné sur le bord droit (mesuré).
    const dead = this.over ? this.loser : null;
    ctx.save();
    ctx.shadowColor = 'rgba(20,16,24,0.55)';
    ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3; ctx.shadowBlur = 0;
    inkText(ctx, 'Outlaw', X_LEFT, Y_TITLE, TYPE.title.size,
            dead === 'O' ? C.dead : C.outlaw, TYPE.title.stroke, 'left');
    inkText(ctx, 'Bladesman', X_RIGHT, Y_TITLE, TYPE.title.size,
            dead === 'B' ? C.dead : C.blade, TYPE.title.stroke, 'right');
    ctx.restore();

    // Cadres de jauges + libellés (le remplissage est dans la couche HUD).
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = BAR.line;
    ctx.strokeRect(BAR.left.x, BAR.y, BAR.left.w, BAR.h);
    ctx.strokeRect(BAR.right.x, BAR.y, BAR.right.w, BAR.h);

    this.chrome.refresh();
  }

  /* --- couche HUD redessinée à chaque frame -------------------------- */
  drawHud() {
    const ctx = this.hud.getContext();
    const OY = 770;                       // décalage de la couche
    ctx.clearRect(0, 0, W, 130);

    // Remplissages, dessinés à l'intérieur du trait des cadres.
    const inset = BAR.line / 2;
    const fillBar = (bar, frac, color) => {
      const w = (bar.w - BAR.line) * Phaser.Math.Clamp(frac, 0, 1);
      if (w <= 0) return;
      ctx.fillStyle = color;
      ctx.fillRect(bar.x + inset, BAR.y - OY + inset, w, BAR.h - BAR.line);
    };
    fillBar(BAR.left, this.noon, C.outlaw);
    fillBar(BAR.right, this.rush, C.blade);

    // Libellés : « HIGH NOON » collé à gauche, « BLADE RUSH » collé à droite.
    inkText(ctx, 'HIGH NOON', 46, Y_LABEL - OY, TYPE.label.size,
            C.label, TYPE.label.stroke, 'left');
    inkText(ctx, 'BLADE RUSH', 530, Y_LABEL - OY, TYPE.label.size,
            C.label, TYPE.label.stroke, 'right');

    // Stats. Damage = 2 x Spin Speed côté Bladesman : la valeur n'est
    // jamais stockée séparément, elle est dérivée (relevé : sans exception).
    const oc = this.over && this.loser === 'O' ? C.dead : C.outlaw;
    const bc = this.over && this.loser === 'B' ? C.dead : C.blade;
    const ammo = this.O.reloading ? 0 : this.O.ammo;

    inkText(ctx, 'Damage: ' + this.O.dmg.toFixed(2), X_LEFT, Y_STAT1 - OY,
            TYPE.stat.size, oc, TYPE.stat.stroke, 'left');
    inkText(ctx, 'Ammo: ' + ammo + '/' + RULES.magazine, X_LEFT, Y_STAT2 - OY,
            TYPE.stat.size, oc, TYPE.stat.stroke, 'left');

    const bdmg = this.B.spin * RULES.dmgPerSpin;
    inkText(ctx, 'Damage: ' + bdmg.toFixed(2), X_RIGHT, Y_STAT1 - OY,
            TYPE.stat.size, bc, TYPE.stat.stroke, 'right');
    inkText(ctx, 'Spin Speed: ' + this.B.spin.toFixed(2), X_RIGHT, Y_STAT2 - OY,
            TYPE.stat.size, bc, TYPE.stat.stroke, 'right');

    this.hud.refresh();
  }

  /* --- boucle -------------------------------------------------------- */
  update(time, dt) {
    const d = Math.min(dt, 50) / 1000;      // borne les à-coups d'onglet inactif

    if (!this.over) {
      // Les chocs bille contre bille et le recul font dériver la norme de la
      // vitesse ; le relevé montre au contraire des trajets à vitesse quasi
      // constante entre deux rebonds. On rappelle donc doucement vers la
      // vitesse cible : le recul reste visible une demi-seconde puis s'efface.
      this.keepSpeed(this.O, d);
      this.keepSpeed(this.B, d);

      this.stepNoon(time, d);
      this.stepRush(time, d);
      this.stepOutlaw(time, d);
      this.stepBlade(time, d);
      this.stepBullets();
    }

    this.stepVisuals(time, d);
    this.drawHud();
  }

  /* HIGH NOON : la jauge se charge, puis se vide pendant que l'arène
     passe en crème et que la cadence de tir triple (mesuré). */
  stepNoon(time, d) {
    const was = this.noonOn;
    if (this.noonOn) {
      this.noon -= d / RULES.noonDuration;
      if (this.noon <= 0) { this.noon = 0; this.noonOn = false; }
    } else {
      this.noon += d / RULES.noonCharge;
      if (this.noon >= 1) { this.noon = 1; this.noonOn = true; }
    }
    if (was !== this.noonOn) {
      this.drawChrome();                       // la teinte de l'arène change
      this.retarget(this.O, this.noonOn ? RULES.noonSpeedUp : 1 / RULES.noonSpeedUp);
      this.retarget(this.B, this.noonOn ? RULES.noonSpeedUp : 1 / RULES.noonSpeedUp);
    }
  }

  /* BLADE RUSH : jauge alimentée par le temps et par les coups portés.
     Une fois pleine, la lame part en survitesse puis la jauge repart de zéro. */
  stepRush(time, d) {
    if (time < this.rushUntil) return;
    this.rush += d / RULES.rushCharge;
    if (this.rush >= 1) {
      this.rush = 0;
      this.rushUntil = time + RULES.rushDuration * 1000;
      this.B.spin = RULES.spinMax;
      this.B.atCapSince = time;
      this.burst(this.blade.x, this.blade.y, 18, 0xC8DE55);
    }
  }

  stepOutlaw(time, d) {
    const o = this.O;
    if (o.reloading) {
      if (time >= o.reloadEnd) { o.reloading = false; o.ammo = RULES.magazine; }
      return;
    }
    if (time < o.nextShot) return;
    if (o.ammo <= 0) {
      o.reloading = true;
      o.reloadEnd = time + RULES.reloadTime;
      return;
    }
    this.fire(time);
  }

  fire(time) {
    const o = this.O;
    const ang = Phaser.Math.Angle.Between(
      this.outlaw.x, this.outlaw.y, this.blade.x, this.blade.y);

    const muzzle = GUN_W * GUN_CELL + GUN_R0 - 6;   // bout du canon
    const b = this.bullets.create(
      this.outlaw.x + Math.cos(ang) * muzzle,
      this.outlaw.y + Math.sin(ang) * muzzle, 'bullet');
    b.setDepth(15).setOrigin(1, 0.5);      // la pointe mène, la traîne suit
    b.rotation = ang;
    b.body.setAllowGravity(false);
    b.setVelocity(Math.cos(ang) * RULES.bulletSpeed, Math.sin(ang) * RULES.bulletSpeed);

    // Recul : la bille est repoussée dans l'axe opposé au tir (mesuré).
    this.outlaw.body.velocity.x -= Math.cos(ang) * RULES.recoil;
    this.outlaw.body.velocity.y -= Math.sin(ang) * RULES.recoil;

    o.ammo--;
    o.nextShot = time + (this.noonOn ? RULES.fireDelayNoon : RULES.fireDelay);
    o.pop = 1;
    this.burst(b.x, b.y, 4, 0xE8D9A8);
  }

  stepBlade(time, d) {
    const b = this.B;

    // Montée passive + plafond + palier + effondrement (courbe mesurée).
    if (b.burning) {
      b.spin -= RULES.spinDecay * d;
      if (b.spin <= RULES.spinMin) { b.spin = RULES.spinMin; b.burning = false; }
    } else {
      b.spin += RULES.spinRamp * d;
      if (b.spin >= RULES.spinMax) {
        b.spin = RULES.spinMax;
        if (!b.atCapSince) b.atCapSince = time;
        if (time - b.atCapSince > RULES.spinHold) { b.burning = true; b.atCapSince = 0; }
      } else {
        b.atCapSince = 0;
      }
    }

    // Rotation : « Spin Speed » est en tours par seconde.
    b.ang += b.spin * Math.PI * 2 * d;

    // Portée de la lame : segment tournant, testé contre le disque adverse.
    const tip = SWORD_R0 + SWORD_W * SWORD_CELL;
    if (time - b.lastHit > RULES.swordCooldown && !this.over) {
      const dx = this.outlaw.x - this.blade.x;
      const dy = this.outlaw.y - this.blade.y;
      const dist = Math.hypot(dx, dy);
      if (dist < tip + BALL_R) {
        // distance point-segment entre le centre de l'Outlaw et la lame
        const ux = Math.cos(b.ang), uy = Math.sin(b.ang);
        const proj = Phaser.Math.Clamp(dx * ux + dy * uy, SWORD_R0, tip);
        const px = dx - ux * proj, py = dy - uy * proj;
        if (Math.hypot(px, py) < BALL_R + 10) {
          b.lastHit = time;
          this.damage('O', b.spin * RULES.dmgPerSpin);
          b.spin = Math.min(RULES.spinMax, b.spin + RULES.spinPerHit);
          this.rush = Math.min(1, this.rush + RULES.rushPerHit);
          this.burst(this.outlaw.x, this.outlaw.y, 12, 0xC8DE55);
        }
      }
    }

    // Traînée : l'éventail est borné en ANGLE, pas en nombre de frames.
    // Mesuré : il couvre ~110 degrés derrière la lame quelle que soit la
    // vitesse de rotation — à 3,00 tours/s un compteur de frames donnerait
    // trois tours complets de vert.
    this.arcs.push({ x: this.blade.x, y: this.blade.y, a: b.ang });
    while (this.arcs.length > 2 && b.ang - this.arcs[0].a > SLASH_SWEEP) this.arcs.shift();
    if (this.arcs.length > 90) this.arcs.shift();
  }

  stepBullets() {
    const pad = 6;
    this.bullets.children.each(b => {
      if (!b.active) return;
      if (b.x < ARENA.inX - pad || b.x > ARENA.inX + ARENA.inW + pad ||
          b.y < ARENA.inY - pad || b.y > ARENA.inY + ARENA.inH + pad) {
        this.burst(b.x, b.y, 3, 0xBDB4A4);
        b.destroy();
      }
    });
  }

  onBulletHit(bullet) {
    if (!bullet.active || this.over) return;
    this.burst(bullet.x, bullet.y, 10, 0xFFD27A);
    bullet.destroy();
    this.damage('B', this.O.dmg);
    // La stat monte au COUP AU BUT, pas au coup tiré : sur la vidéo elle
    // gagne 25 paliers pour ~50 tirs, soit un palier une fois sur deux.
    this.O.dmg = Math.min(RULES.dmgOutlawMax, this.O.dmg + RULES.dmgOutlawStep);
  }

  onBallClash() {
    this.burst((this.outlaw.x + this.blade.x) / 2,
               (this.outlaw.y + this.blade.y) / 2, 8, 0xE6D7B0);
  }

  damage(who, amount) {
    const t = who === 'O' ? this.O : this.B;
    t.hp = Math.max(0, t.hp - amount);
    t.shake = 1;       // tremblement du chiffre (mesuré à l'impact)
    t.pop = 1;         // sursaut d'échelle
    if (t.hp <= 0 && !this.over) this.finish(who);
  }

  finish(loser) {
    this.over = true;
    this.loser = loser;
    this.drawChrome();

    const winner = loser === 'O' ? 'Bladesman' : 'Outlaw';
    this.endText = this.add.text(ARENA.cx, ARENA.cy, winner + ' wins!', {
      fontFamily: FONT, fontSize: '34px', fontStyle: '900',
      color: '#1C1A26', stroke: '#FFFFFF', strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5).setDepth(70);

    this.time.delayedCall(2600, () => { this.startMatch(); this.drawChrome(); });
  }

  burst(x, y, n, tint) {
    for (let i = 0; i < n; i++) {
      const p = this.add.image(x, y, 'spark').setDepth(40).setTint(tint);
      const a = rnd(0, Math.PI * 2), sp = rnd(40, 220);
      p.setScale(rnd(0.6, 1.8));
      this.tweens.add({
        targets: p,
        x: x + Math.cos(a) * sp * 0.35,
        y: y + Math.sin(a) * sp * 0.35,
        alpha: 0, scale: 0,
        duration: rnd(180, 420),
        onComplete: () => p.destroy()
      });
    }
  }

  /* --- rendu par frame ------------------------------------------------ */
  stepVisuals(time, d) {
    // Revolver : le canon pointe en permanence vers le centre du Bladesman.
    const aim = Phaser.Math.Angle.Between(
      this.outlaw.x, this.outlaw.y, this.blade.x, this.blade.y);
    const kick = this.O.pop * 5;            // le sprite recule à chaque coup
    this.gun.setPosition(
      this.outlaw.x + Math.cos(aim) * (GUN_R0 - kick),
      this.outlaw.y + Math.sin(aim) * (GUN_R0 - kick));
    this.gun.rotation = aim;

    // Épée : rotation propre, indépendante du déplacement.
    this.sword.setPosition(
      this.blade.x + Math.cos(this.B.ang) * SWORD_R0,
      this.blade.y + Math.sin(this.B.ang) * SWORD_R0);
    this.sword.rotation = this.B.ang;

    // Sillage des balles : cinq tirets alignés derrière chaque projectile,
    // de plus en plus pâles vers l'arrière (relevé frame 224).
    const tg = this.trailGfx;
    tg.clear();
    const tcol = Phaser.Display.Color.GetColor(C.trail[0], C.trail[1], C.trail[2]);
    this.bullets.children.each(b => {
      if (!b.active) return;
      const v = b.body.velocity;
      const sp = Math.hypot(v.x, v.y) || 1;
      const ux = -v.x / sp, uy = -v.y / sp;      // vers l'arrière
      const seg = C.trailLen / C.trailSeg;
      for (let k = 0; k < C.trailSeg; k++) {
        const a0 = k * seg + 2, a1 = (k + 1) * seg - 2;
        tg.lineStyle(2, tcol, 0.5 * (1 - k / C.trailSeg));
        tg.beginPath();
        tg.moveTo(b.x + ux * a0, b.y + uy * a0);
        tg.lineTo(b.x + ux * a1, b.y + uy * a1);
        tg.strokePath();
      }
    });

    // Traînée verte : secteur annulaire plein, reconstruit par quadrilatères
    // entre deux relevés successifs. Le dégradé se fait par l'alpha, qui
    // s'éteint vers la queue de l'éventail.
    const g = this.arcGfx;
    g.clear();
    const tip = SWORD_R0 + SWORD_W * SWORD_CELL;
    const inner = SWORD_R0 + 8;
    const green = Phaser.Display.Color.GetColor(C.slash[0], C.slash[1], C.slash[2]);
    const n = this.arcs.length;
    for (let i = 1; i < n; i++) {
      const p = this.arcs[i - 1], q = this.arcs[i];
      const t = i / (n - 1);                       // 1 = collé à la lame
      g.fillStyle(green, C.slashA * t * t);
      g.fillPoints([
        { x: p.x + Math.cos(p.a) * inner, y: p.y + Math.sin(p.a) * inner },
        { x: p.x + Math.cos(p.a) * tip,   y: p.y + Math.sin(p.a) * tip },
        { x: q.x + Math.cos(q.a) * tip,   y: q.y + Math.sin(q.a) * tip },
        { x: q.x + Math.cos(q.a) * inner, y: q.y + Math.sin(q.a) * inner }
      ], true);
    }

    // Chiffres de PV : tremblement + sursaut à l'impact (mesuré).
    const put = (fig, sprite, txt) => {
      fig.shake = Math.max(0, fig.shake - d * 6);
      fig.pop = Math.max(0, fig.pop - d * 5);
      const sx = fig.shake ? rnd(-3, 3) : 0;
      const sy = fig.shake ? rnd(-3, 3) : 0;
      txt.setText(String(Math.ceil(fig.hp)));
      txt.setPosition(sprite.x + sx, sprite.y + sy - 1);
      txt.setScale(1 + fig.pop * 0.28);
    };
    put(this.O, this.outlaw, this.hpTexts[0]);
    put(this.B, this.blade, this.hpTexts[1]);
  }

  // Rappel progressif vers la vitesse cible, direction inchangée. Sert
  // aussi de garde-fou : une bille ne peut pas rester collée à l'autre.
  keepSpeed(fig, d) {
    const v = fig.s.body.velocity;
    const sp = Math.hypot(v.x, v.y);
    if (sp < 1) {                       // décollage d'urgence
      const a = rnd(0, Math.PI * 2);
      fig.s.setVelocity(Math.cos(a) * fig.base, Math.sin(a) * fig.base);
      return;
    }
    const k = Math.min(1, d * 3.5);
    const want = sp + (fig.base - sp) * k;
    fig.s.setVelocity(v.x / sp * want, v.y / sp * want);
  }

  // Renormalise la vitesse en gardant la direction : sert aux bascules
  // d'ultime, pour que la bille accélère sans partir en biais.
  retarget(fig, mul) {
    const v = fig.s.body.velocity;
    const sp = Math.hypot(v.x, v.y) || 1;
    fig.base *= mul;
    fig.s.setVelocity(v.x / sp * fig.base, v.y / sp * fig.base);
  }
}

/* ---------------------------------------------------------------------
   8. DÉMARRAGE
   ------------------------------------------------------------------ */

globalThis.__game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game',
  backgroundColor: C.page,
  // antialias reste actif : le corps des billes et la bordure d'arène sont
  // lissés dans le relevé. Le pixel-art des armes est protégé par le filtre
  // NEAREST posé texture par texture.
  antialias: true,
  roundPixels: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: [Duel]
});

// Poignée de debug. La scène vivante est __game.scene.scenes[0] ; __seed
// rappelle la graine tirée quand l'URL n'en fournit pas.
globalThis.__seed = SEED;
