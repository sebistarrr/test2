/* =====================================================================
   Sprites.

   Les armes de la vidéo sont des rasters pixellisés. On les rejoue comme
   des pixelmaps — un tableau de chaînes, une lettre par couleur — peintes
   dans un canvas hors écran, puis tirées avec `imageSmoothingEnabled =
   false`. C'est le seul moyen de garder les marches d'escalier d'origine ;
   un tracé vectoriel lissé les effacerait.

   Le corps des billes est le SEUL élément lissé du rendu : cercle tracé
   avec l'anticrénelage du navigateur. Tout le reste garde ses marches.
   ===================================================================== */

import {
  BALL_LINE,
  BALL_R,
  C,
  GUN_CELL,
  GUN_H,
  GUN_W,
  SWORD_CELL,
  SWORD_H,
  SWORD_W,
} from './constants';
import type { Weapon } from './types';
import { GUN_R0, SWORD_R0 } from './constants';

type Palette = Record<string, string>;

// Les longues séries sont générées : compter les caractères à la main est
// la première source de bug sur ce genre de carte.
const rep = (ch: string, n: number): string => ch.repeat(Math.max(0, n));
// Denture : un pixel sur deux le long de l'arête, pas un liseré continu.
const serr = (n: number): string => rep('Kb', Math.ceil(n / 2)).slice(0, n);

/* --- Revolver -------------------------------------------------------- */
// Relevé frame 300 (zoom x12) : crosse brune côté bille, carcasse et
// barillet en acier bleuté-violine, puis un canon FIN — 6 cellules de haut
// sur les 15 de l'emprise. C'est le contraste corps épais / canon fin qui
// identifie le revolver.
const PAL_GUN: Palette = {
  K: '#141420', // contour
  d: '#3C3C52', // acier sombre
  m: '#5E5E7A', // acier moyen
  l: '#8E8EA8', // acier clair
  h: '#CACADB', // reflet
  g: '#6B4A2F', // crosse, ombre
  G: '#A9744B', // crosse, lumière
  v: '#4A3350', // barillet, violine mesurée sur la vidéo
};

const MAP_GUN: string[] = [
  /*  0 */ '',
  /*  1 */ '.....KKKK',
  /*  2 */ '....KdmmdK', // chien
  /*  3 */ '....KmllmK',
  /*  4 */ '...KKmllmK' + rep('K', 24), // dessus du canon
  /*  5 */ '...KdmhlmK' + rep('h', 23) + 'K', // reflet du canon
  /*  6 */ '..KKdmhlmK' + rep('l', 23) + 'K',
  /*  7 */ '..KGdmvvmK' + rep('m', 23) + 'K', // axe du barillet
  /*  8 */ '..KGGdvvmK' + rep('d', 23) + 'K',
  /*  9 */ '..KGGdddmK' + rep('K', 24), // dessous du canon
  /* 10 */ '.KGGGdKKKK', // pontet
  /* 11 */ '.KGGGgK',
  /* 12 */ '..KGGgK',
  /* 13 */ '..KGggK',
  /* 14 */ '...KKK',
];

/* --- Épée ------------------------------------------------------------ */
// Relevé frame 300 (zoom x9) : la lame n'est pas symétrique. Le DESSUS
// porte une bande gris-brun sombre, le DESSOUS un corps ivoire, et les deux
// arêtes sont dentées — d'où l'aspect « scie » de la vidéo.
// Cotes : garde r 36..45 (petite croix trapue, ~9 px de long sur ~30 de
// haut), lame r 45..122 (74 px de long, 18 px d'épaisseur).
const PAL_SWORD: Palette = {
  K: '#1E1408', // contour et dents
  O: '#E8A028', // garde, orange vif (mesuré : (232,160,40))
  o: '#B87418', // garde, ombre
  y: '#F5C558', // garde, lumière
  N: '#6E5F4B', // lame, bande sombre du DESSUS
  n: '#AA9678', // lame, transition
  b: '#EDE4C8', // lame, corps crème du DESSOUS
  g: '#4A3320', // fusée, ombre
  G: '#7A5430', // fusée, lumière
};

// Le fuselage : chaque ligne s'arrête deux cellules avant la précédente en
// s'éloignant de l'axe, ce qui taille la pointe en losange. À longueurs
// égales on obtient une lame à bout carré que le relevé n'a pas.
const MAP_SWORD: string[] = [
  /*  0 */ '',
  /*  1 */ '',
  /*  2 */ '',
  /*  3 */ '....KKKK',
  /*  4 */ '....KyOoK',
  /*  5 */ '....KyOoK',
  /*  6 */ '....KyOoK' + serr(29) + 'K', // arête haute dentée
  /*  7 */ '....KyOoK' + rep('N', 30) + 'K', // bande sombre du dessus
  /*  8 */ '.KGKKyOoK' + rep('N', 32) + 'K',
  /*  9 */ 'KgGKKyOoK' + rep('n', 34) + 'K', // transition
  /* 10 */ 'KggKKyOoK' + rep('b', 36) + 'K', // axe : la pointe
  /* 11 */ 'KgGKKyOoK' + rep('b', 34) + 'K',
  /* 12 */ '.KGKKyOoK' + rep('b', 32) + 'K', // corps ivoire du dessous
  /* 13 */ '....KyOoK' + rep('n', 30) + 'K',
  /* 14 */ '....KyOoK' + serr(29) + 'K', // arête basse dentée
  /* 15 */ '....KyOoK',
  /* 16 */ '....KyOoK',
  /* 17 */ '....KKKK',
  /* 18 */ '',
  /* 19 */ '',
  /* 20 */ '',
];

/* --- Fabrication ----------------------------------------------------- */

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('contexte 2D indisponible');
  return [cv, ctx];
}

/** Peint une pixelmap. Les lignes plus courtes que la largeur sont
 *  complétées en transparent, ce qui autorise les cartes en escalier. */
function paintMap(
  ctx: CanvasRenderingContext2D,
  map: string[],
  pal: Palette,
  cell: number,
  cols: number,
  rows: number
): void {
  for (let r = 0; r < rows; r++) {
    const line = map[r] ?? '';
    for (let c = 0; c < cols; c++) {
      const key = line[c];
      if (!key || key === '.') continue;
      const color = pal[key];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
}

function buildWeapon(
  map: string[],
  pal: Palette,
  cell: number,
  cols: number,
  rows: number,
  r0: number
): Weapon {
  const [cv, ctx] = makeCanvas(cols * cell, rows * cell);
  ctx.imageSmoothingEnabled = false;
  paintMap(ctx, map, pal, cell, cols, rows);
  // La portée est DÉRIVÉE de la carte : sprite et hitbox ne peuvent pas
  // diverger quand on retouche la pixelmap.
  return { sprite: cv, r0, tip: r0 + cols * cell };
}

/** Corps de bille : le seul élément lissé du rendu. */
function buildBall(fill: string): HTMLCanvasElement {
  const s = BALL_R * 2 + BALL_LINE + 4; // marge pour le trait
  const [cv, ctx] = makeCanvas(s, s);
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = BALL_LINE;
  ctx.strokeStyle = C.ballLine;
  ctx.stroke();
  return cv;
}

export interface SpriteSet {
  gun: Weapon;
  sword: Weapon;
  ballOutlaw: HTMLCanvasElement;
  ballBlade: HTMLCanvasElement;
  /** Variantes « touché » : le disque blanchit une frame entière, le
   *  contour reste sombre (mesuré frames 223/224/225). */
  ballOutlawHit: HTMLCanvasElement;
  ballBladeHit: HTMLCanvasElement;
}

export function buildSprites(): SpriteSet {
  return {
    gun: buildWeapon(MAP_GUN, PAL_GUN, GUN_CELL, GUN_W, GUN_H, GUN_R0),
    sword: buildWeapon(MAP_SWORD, PAL_SWORD, SWORD_CELL, SWORD_W, SWORD_H, SWORD_R0),
    ballOutlaw: buildBall(C.outlaw),
    ballBlade: buildBall(C.blade),
    ballOutlawHit: buildBall(C.hit),
    ballBladeHit: buildBall(C.hit),
  };
}
