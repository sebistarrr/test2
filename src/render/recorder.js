/**
 * Enregistreur vidéo du duel, au **format YouTube Shorts**.
 *
 * Le duel est filmé pendant qu'on le regarde : à chaque image, le canvas de
 * jeu est recopié dans un canvas dédié en 1080 × 1920 (voir `EXPORT`), dont le
 * flux `captureStream()` alimente un `MediaRecorder`. Le fichier obtenu est
 * donc toujours vertical 9:16 en 1080p, quelle que soit la taille de la fenêtre
 * ou le `devicePixelRatio` de la machine.
 *
 * Tout est optionnel : si `MediaRecorder` ou `captureStream` manquent (vieux
 * navigateur), l'enregistreur se déclare `supported: false` et l'interface
 * masque simplement le bouton d'export.
 *
 * @module render/recorder
 */

import { EXPORT } from '../data/tuning.js';

/**
 * Par ordre de préférence. Le MP4/H.264 est le seul conteneur que YouTube
 * ingère sans réencodage ; les navigateurs qui ne savent pas l'écrire
 * retombent sur WebM, que YouTube accepte aussi.
 */
const MIME_CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

const NOOP_RECORDER = {
  supported: false,
  mimeType: null,
  extension: '',
  start() {},
  capture() {},
  pause() {},
  resume() {},
  async stop() {
    return null;
  },
  reset() {},
  get blob() {
    return null;
  },
  download() {},
};

/** Enregistreur inerte : sert de repli, et de mode `?rec=0`. */
export function createNullRecorder() {
  return NOOP_RECORDER;
}

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  if (typeof HTMLCanvasElement === 'undefined') return null;
  if (typeof HTMLCanvasElement.prototype.captureStream !== 'function') return null;
  return MIME_CANDIDATES.find((m) => {
    try {
      return MediaRecorder.isTypeSupported(m);
    } catch {
      return false;
    }
  }) ?? null;
}

/**
 * @param {HTMLCanvasElement} source le canvas de jeu
 */
export function createRecorder(source) {
  const mimeType = pickMime();
  if (!mimeType) return NOOP_RECORDER;

  const cv = document.createElement('canvas');
  cv.width = EXPORT.width;
  cv.height = EXPORT.height;
  const ctx = cv.getContext('2d', { alpha: false });

  // marge de 2 ms : sur un écran 60 Hz, une image sur deux tombe pile dans la
  // fenêtre, sinon l'arrondi en fait perdre une de temps en temps
  const frameGap = 1000 / EXPORT.fps - 2;
  const extension = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';

  /**
   * **Un seul flux pour toute la session.** Le canvas d'export ne change
   * jamais : rappeler `captureStream()` à chaque duel ouvrirait un nouveau
   * pipeline de capture sans fermer le précédent, et le jeu ralentirait un peu
   * plus à chaque revanche. On le crée donc une fois et on lui accroche un
   * `MediaRecorder` neuf par duel.
   * @type {MediaStream|null}
   */
  let stream = null;
  /** @type {MediaStreamTrack|null} */
  let track = null;
  /** @type {MediaRecorder|null} */
  let rec = null;
  /** @type {Blob[]} */
  let chunks = [];
  /** @type {Blob|null} */
  let blob = null;
  let lastFrame = 0;

  function ensureStream() {
    if (stream) return stream;
    // `captureStream(0)` = flux piloté à la main : une image dans la vidéo par
    // appel à `requestFrame()`, donc une cadence exacte. Les moteurs qui ne
    // l'exposent pas retombent sur l'échantillonnage automatique.
    stream = cv.captureStream(0);
    track = stream.getVideoTracks()[0] ?? null;
    if (typeof track?.requestFrame !== 'function') {
      for (const t of stream.getTracks()) t.stop();
      track = null;
      stream = cv.captureStream(EXPORT.fps);
    }
    return stream;
  }

  function reset() {
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop();
      } catch {
        /* déjà arrêté */
      }
    }
    rec = null;
    chunks = [];
    blob = null;
    lastFrame = 0;
  }

  return {
    supported: true,
    mimeType,
    extension,

    /** Démarre un nouvel enregistrement (le précédent est jeté). */
    start() {
      reset();
      try {
        rec = new MediaRecorder(ensureStream(), {
          mimeType,
          videoBitsPerSecond: EXPORT.bitrate,
        });
        rec.ondataavailable = (e) => {
          if (e.data && e.data.size) chunks.push(e.data);
        };
        rec.start();
      } catch (err) {
        console.warn('[recorder] enregistrement impossible :', err);
        rec = null;
      }
    },

    /**
     * Recopie l'image courante du jeu dans le canvas d'export. Appelée à chaque
     * frame de rendu, mais limitée à la cadence d'export : inutile de payer une
     * recopie 1080p soixante fois par seconde pour une vidéo à 30 images.
     */
    capture(now = performance.now()) {
      if (!rec || rec.state !== 'recording') return;
      if (now - lastFrame < frameGap) return;
      lastFrame = now;
      if (!source.width || !source.height) return;
      // Agrandissement → plus proche voisin (le jeu est en pixel-art).
      // Réduction → interpolation, mais en qualité **basse** : mesuré au
      // navigateur sur un canvas 1688 × 3000, `high` coûte 2,17 ms par image
      // contre 0,35 ms en `low`, soit 65 ms de fil principal par seconde de
      // duel — c'est ce qui rendait les duels poussifs. La différence visible
      // sur des aplats de pixel-art est, elle, négligeable.
      ctx.imageSmoothingEnabled = source.width > EXPORT.width;
      ctx.imageSmoothingQuality = 'low';
      ctx.drawImage(source, 0, 0, EXPORT.width, EXPORT.height);
      track?.requestFrame();
    },

    /** L'onglet passe en arrière-plan : on ne veut pas filmer une image figée. */
    pause() {
      if (rec && rec.state === 'recording') rec.pause();
    },

    resume() {
      if (rec && rec.state === 'paused') {
        rec.resume();
        lastFrame = 0;
      }
    },

    /** Clôt l'enregistrement et assemble le fichier. */
    async stop() {
      if (!rec) return null;
      if (rec.state === 'inactive') return blob;
      const current = rec;
      const done = new Promise((resolve) => {
        current.onstop = () => resolve();
      });
      current.stop();
      await done;
      blob = chunks.length ? new Blob(chunks, { type: mimeType }) : null;
      return blob;
    },

    reset,

    get blob() {
      return blob;
    },

    /** Déclenche le téléchargement du fichier assemblé. */
    download(basename) {
      if (!blob) return false;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${basename}.${extension}`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return true;
    },
  };
}
