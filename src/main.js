/**
 * Point d'entrée : chargement des ressources, câblage des écrans, boucle.
 *
 * Paramètres d'URL utiles :
 *   ?a=shadow&b=ice   duel direct, sans passer par la sélection
 *   ?seed=1234        rejoue exactement le même duel
 *   ?lang=fr          toute l'application en français — HUD, titre d'arène et
 *                     écrans DOM (par défaut : l'anglais de la vidéo)
 *   ?debug=1          hitboxes + compteurs
 *   ?rec=0            n'enregistre pas le duel (pas d'export, mais zéro coût)
 *
 * @module main
 */

import { createStage } from './render/canvas.js';
import { createLoop } from './core/loop.js';
import { loadSprites } from './render/sprites.js';
import { ensureFonts } from './core/fonts.js';
import { createRng, seedFromLocation } from './core/rng.js';
import { ELEMENTS, PLAYABLE } from './data/elements.js';
import { Match } from './game/match.js';
import { createSelectScreen } from './ui/select.js';
import { createResultScreen } from './ui/result.js';
import { createRecorder, createNullRecorder } from './render/recorder.js';
import { UI, applyStaticLabels } from './ui/lang.js';

const params = new URLSearchParams(location.search);
const LANG = params.get('lang') === 'fr' ? 'fr' : 'ref';
/** Libellés de l'interface dans la langue choisie (voir ui/lang.js). */
const T = UI[LANG];
const DEBUG = params.get('debug') === '1';
/** Le film du duel coûte un peu de fil principal : `?rec=0` le coupe net. */
const RECORD = params.get('rec') !== '0';

const canvas = document.querySelector('#stage');
const stage = createStage(canvas);
const recorder = RECORD ? createRecorder(canvas) : createNullRecorder();

/** @type {Match|null} */
let match = null;

const loop = createLoop({
  update: (dt) => match?.update(dt),
  render: () => {
    stage.begin();
    if (match) match.draw(stage.ctx);
    // le duel est filmé au fil de l'eau : l'export de fin ne coûte rien de plus
    recorder.capture();
  },
});

// libellés statiques d'index.html : appliqués même en anglais, pour que le
// HTML et la table de ui/lang.js ne puissent pas diverger en silence
applyStaticLabels(document, LANG);

const selectScreen = createSelectScreen({
  root: document.querySelector('#screen-select'),
  onStart: (pair) => startMatch(pair),
  lang: LANG,
});

const resultScreen = createResultScreen({
  root: document.querySelector('#screen-result'),
  // revanche : même affiche, nouveau tirage
  onRematch: () => startMatch(lastPair),
  // revoir : même affiche ET même seed, donc exactement le même duel
  onReplay: () => startMatch(lastPair, lastSeed),
  onExport: () => recorder.download(`duel-${lastPair[0]}-vs-${lastPair[1]}-seed${lastSeed}`),
  lang: LANG,
  onBack: () => {
    resultScreen.hide();
    loop.stop();
    recorder.reset();
    match = null;
    selectScreen.show();
  },
});

/** @type {[string,string]} */
// Pris dans `PLAYABLE` : codé en dur, il pointerait sur un combattant
// désactivé et le premier duel partirait hors du roster affiché.
let lastPair = [PLAYABLE[0], PLAYABLE[1] ?? PLAYABLE[0]];
let lastSeed = 0;

/**
 * @param {[string,string]} pair
 * @param {number} [seed] fournie = duel rejoué à l'identique, sinon nouveau tirage
 */
function startMatch(pair, seed) {
  lastPair = pair;
  lastSeed = seed ?? seedFromLocation();
  selectScreen.hide();
  resultScreen.hide();
  resultScreen.setExport(recorder.supported ? 'pending' : 'off');

  match = new Match({
    elements: pair,
    rng: createRng(lastSeed),
    lang: LANG,
    debug: DEBUG,
    onEnd: (result) => {
      loop.stop();
      resultScreen.show({ ...result, seed: lastSeed });
      finishRecording();
    },
  });
  recorder.start();
  loop.start();
  // poignée de debug : utile pour inspecter un duel depuis la console
  // (et pour les captures automatisées du dépôt)
  globalThis.__match = match;
}

/** Clôt le film du duel et ouvre l'export quand le fichier est prêt. */
async function finishRecording() {
  if (!recorder.supported) return;
  try {
    const blob = await recorder.stop();
    if (!blob) {
      resultScreen.setExport('failed', T.exportUnsupported);
      return;
    }
    const mb = (blob.size / 1048576).toFixed(1);
    resultScreen.setExport('ready', T.exportReady(recorder.extension.toUpperCase(), mb));
  } catch (err) {
    console.warn('[export] échec :', err);
    resultScreen.setExport('failed', T.exportUnsupported);
  }
}

/* --------------------------------------------------------------- */

async function boot() {
  await Promise.all([loadSprites(), ensureFonts()]);

  const a = params.get('a');
  const b = params.get('b');
  if (a && b && ELEMENTS[a] && ELEMENTS[b]) {
    startMatch([a, b]);
  } else {
    selectScreen.show();
    // une frame « à vide » pour que le décor soit déjà là derrière l'overlay
    stage.begin();
  }
}

// Met la boucle en pause quand l'onglet passe en arrière-plan — et le film
// avec elle, sinon la vidéo exportée contiendrait une longue image figée.
document.addEventListener('visibilitychange', () => {
  if (!match || match.phase === 'over') return;
  if (document.hidden) {
    loop.stop();
    recorder.pause();
  } else {
    recorder.resume();
    loop.start();
  }
});

boot();
