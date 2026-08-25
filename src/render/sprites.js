/**
 * Banque de sprites.
 *
 * Deux sources possibles, dans cet ordre :
 *   1. `assets/sprites/<clé>.png` s'il existe (override utilisateur) ;
 *   2. sinon, le pixel-art embarqué dans data/pixelmaps.js.
 *
 * Le manifeste `assets/sprites/manifest.json` liste les overrides à charger.
 * Il est optionnel : sans lui (ou en cas d'erreur réseau) on retombe sur le
 * pixel-art intégré, le jeu démarre toujours.
 *
 * @module render/sprites
 */

import { PIXEL_MAPS } from '../data/pixelmaps.js';
import { compilePixelMap, tintCanvas } from './pixelart.js';

const MANIFEST_URL = new URL('../../assets/sprites/manifest.json', import.meta.url);

/** @type {Map<string, HTMLCanvasElement|HTMLImageElement>} */
const bank = new Map();

/** Échelle interne du pixel-art : 1 pixel logique = SUPERSAMPLE px de canvas. */
const SUPERSAMPLE = 4;

/** Taille d'un « pixel » du sprite, en px de scène, pour un sprite donné. */
export function pixelUnit(key) {
  const map = PIXEL_MAPS[key];
  return map ? SUPERSAMPLE : 1;
}

/**
 * Charge les sprites. À appeler une fois avant la première frame.
 * @returns {Promise<void>}
 */
export async function loadSprites() {
  // 1. pixel-art intégré (toujours disponible)
  for (const [key, map] of Object.entries(PIXEL_MAPS)) {
    bank.set(key, compilePixelMap(map, SUPERSAMPLE));
  }

  // 2. overrides PNG éventuels
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (!res.ok) return;
    /** @type {{sprites?: Record<string,string>}} */
    const manifest = await res.json();
    const entries = Object.entries(manifest.sprites ?? {});
    await Promise.all(
      entries.map(async ([key, file]) => {
        try {
          const img = await loadImage(new URL(`../../assets/sprites/${file}`, import.meta.url));
          bank.set(key, img);
        } catch {
          console.warn(`[sprites] override « ${key} » introuvable, pixel-art conservé`);
        }
      }),
    );
  } catch {
    /* pas de manifeste → pixel-art intégré, c'est le cas nominal */
  }
}

/** @param {string} key */
export function getSprite(key) {
  const s = bank.get(key);
  if (!s) throw new Error(`[sprites] sprite « ${key} » inconnu`);
  return s;
}

export function hasSprite(key) {
  return bank.has(key);
}

/** @type {Map<string, HTMLCanvasElement>} */
const tinted = new Map();

/**
 * Silhouette pleine d'un sprite, dans une couleur donnée — le corps d'un
 * combattant s'en sert pour le flash blanc d'encaissement et pour les teintes
 * d'état (soie, saignement).
 *
 * Le résultat est **mis en cache** : ces teintes repassent à chaque frame et
 * `tintCanvas` alloue un canvas à chaque appel. Le nombre de couples
 * (sprite, couleur) est borné par les fiches, la table ne peut pas enfler.
 */
export function getTintedSprite(key, color) {
  const id = `${key}|${color}`;
  let cv = tinted.get(id);
  if (!cv) {
    cv = tintCanvas(getSprite(key), color);
    tinted.set(id, cv);
  }
  return cv;
}

/**
 * Dessine un sprite centré verticalement, aligné à gauche sur (x,y),
 * avec une hauteur cible en px de scène.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawSpriteLeft(ctx, key, x, y, heightPx, anchorY = 0.5) {
  const s = getSprite(key);
  const ratio = s.width / s.height;
  const h = heightPx;
  const w = h * ratio;
  ctx.drawImage(s, x, y - h * anchorY, w, h);
  return { w, h };
}

/** Dessine un sprite centré sur (x,y) avec une hauteur cible. */
export function drawSpriteCentered(ctx, key, x, y, heightPx) {
  const s = getSprite(key);
  const ratio = s.width / s.height;
  const h = heightPx;
  const w = h * ratio;
  ctx.drawImage(s, x - w / 2, y - h / 2, w, h);
  return { w, h };
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url.toString();
  });
}
