/**
 * Contexte Canvas **pixel perfect**.
 *
 * Couper `imageSmoothingEnabled` ne suffit pas : trois choses floutent un
 * pixel-art, et il faut les traiter toutes les trois.
 *
 *  1. **le lissage de `drawImage`** — c'est `imageSmoothingEnabled = false`,
 *     et il faut le reposer **après chaque `resize`**, parce que redimensionner
 *     le canvas réinitialise tout l'état du contexte, ce drapeau compris.
 *     C'est le piège classique : ça marche à l'ouverture, puis ça reflouté au
 *     premier redimensionnement de fenêtre ;
 *  2. **le facteur d'échelle** — sur un écran à `devicePixelRatio` 1,5, une
 *     échelle fractionnaire replace chaque pixel du sprite entre deux pixels
 *     de l'écran, et le navigateur les mélange même sans lissage. On arrondit
 *     donc l'échelle à l'entier ;
 *  3. **le filtrage CSS** à l'affichage final, réglé par `image-rendering`.
 *
 * @module render/pixelCanvas
 */

export interface PixelView {
  readonly ctx: CanvasRenderingContext2D;
  /** Taille d'un pixel logique en pixels physiques. Toujours un entier ≥ 1. */
  readonly scale: number;
  /** Dimensions du monde, en unités logiques. */
  readonly worldWidth: number;
  readonly worldHeight: number;
}

/**
 * Ajuste le canvas à son conteneur et rend un contexte prêt à dessiner en
 * coordonnées **logiques** (la transformation d'échelle est déjà posée).
 */
export function setupPixelView(
  canvas: HTMLCanvasElement,
  worldWidth: number,
  worldHeight: number,
): PixelView | null {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  const parent = canvas.parentElement;
  const availW = parent?.clientWidth ?? worldWidth;
  const availH = parent?.clientHeight ?? worldHeight;

  const dpr = window.devicePixelRatio || 1;
  // Échelle **entière** : une échelle fractionnaire remet les pixels du sprite
  // à cheval sur deux pixels physiques, et l'image est molle même avec le
  // lissage coupé.
  const scale = Math.max(1, Math.floor(Math.min(availW / worldWidth, availH / worldHeight) * dpr));

  canvas.width = worldWidth * scale;
  canvas.height = worldHeight * scale;
  canvas.style.width = `${(worldWidth * scale) / dpr}px`;
  canvas.style.height = `${(worldHeight * scale) / dpr}px`;
  canvas.style.imageRendering = 'pixelated';

  // À reposer ici, et pas une fois pour toutes à la création : affecter
  // `canvas.width` réinitialise l'état du contexte.
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  return { ctx, scale, worldWidth, worldHeight };
}

/** Charge une texture et garantit qu'elle est décodée avant le premier blit. */
export async function loadTexture(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}
