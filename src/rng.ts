/** Générateur déterministe (mulberry32). `?seed=1234` fixe tous les
 *  tirages — angles de départ, gerbes d'éclats. Ce n'est PAS un rejeu
 *  image par image de la vidéo : la graine d'origine n'est pas
 *  récupérable depuis un rendu, seul le jeu l'est. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function readSeed(): number {
  const q = new URLSearchParams(location.search).get('seed');
  const n = parseInt(q ?? '', 10);
  return Number.isFinite(n) ? n : Date.now() & 0x7fffffff;
}
