/**
 * Compilation des sprites texte → canvas hors écran.
 *
 * On dessine chaque pixel une seule fois au démarrage, puis on blitte le
 * canvas résultant (rapide, et zéro interpolation grâce à
 * `imageSmoothingEnabled = false`).
 *
 * @module render/pixelart
 */

/**
 * @typedef {{w:number,h:number,palette:Record<string,string>,rows:string[]}} PixelMap
 */

/**
 * @param {PixelMap} map
 * @param {number} scale taille d'un pixel logique
 * @returns {HTMLCanvasElement}
 */
export function compilePixelMap(map, scale = 1) {
  validate(map);
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(map.w * scale));
  cv.height = Math.max(1, Math.round(map.h * scale));
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < map.h; y++) {
    const row = map.rows[y];
    for (let x = 0; x < map.w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const color = map.palette[ch];
      if (!color) throw new Error(`[pixelart] caractère « ${ch} » absent de la palette`);
      ctx.fillStyle = color;
      // +0.5 px de recouvrement : évite les coutures sur les écrans HiDPI
      ctx.fillRect(
        Math.round(x * scale),
        Math.round(y * scale),
        Math.ceil(scale),
        Math.ceil(scale),
      );
    }
  }
  return cv;
}

/** Version teintée (utilisée pour les fantômes de téléportation). */
export function tintCanvas(source, color, alpha = 1) {
  const cv = document.createElement('canvas');
  cv.width = source.width;
  cv.height = source.height;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.drawImage(source, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

function validate(map) {
  if (!map || !Array.isArray(map.rows)) throw new Error('[pixelart] sprite invalide');
  if (map.rows.length !== map.h) {
    throw new Error(`[pixelart] ${map.rows.length} lignes pour h=${map.h}`);
  }
  map.rows.forEach((row, i) => {
    if (row.length !== map.w) {
      throw new Error(`[pixelart] ligne ${i} : ${row.length} caractères au lieu de ${map.w}`);
    }
  });
}
