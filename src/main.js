/**
 * Point d'entrée : chargement des ressources, câblage des écrans, boucle.
 *
 * Paramètres d'URL utiles :
 *   ?a=wolf&b=turtle  duel direct, sans passer par la sélection
 *   ?seed=1234        rejoue exactement le même duel
 *   ?lang=fr          libellés du HUD en français (par défaut : ceux de la vidéo)
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
import { ELEMENTS } from './data/elements.js';
import { Match } from './game/match.js';
import { createSelectScreen } from './ui/select.js';
import { createResultScreen } from './ui/result.js';
import { createRecorder, createNullRecorder } from './render/recorder.js';

const params = new URLSearchParams(location.search);
const LANG = params.get('lang') === 'fr' ? 'fr' : 'ref';
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

const selectScreen = createSelectScreen({
  root: document.querySelector('#screen-select'),
  onStart: (pair) => startMatch(pair),
});

const resultScreen = createResultScreen({
  root: document.querySelector('#screen-result'),
  // revanche : même affiche, nouveau tirage
  onRematch: () => startMatch(lastPair),
  // revoir : même affiche ET même seed, donc exactement le même duel
  onReplay: () => startMatch(lastPair, lastSeed),
  onExport: () => recorder.download(`duel-${lastPair[0]}-vs-${lastPair[1]}-seed${lastSeed}`),
  onBack: () => {
    resultScreen.hide();
    loop.stop();
    recorder.reset();
    match = null;
    selectScreen.show();
  },
});

/** @type {[string,string]} */
let lastPair = ['wolf', 'turtle'];
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
      resultScreen.setExport('failed', 'Export vidéo indisponible sur ce navigateur.');
      return;
    }
    const mb = (blob.size / 1048576).toFixed(1);
    resultScreen.setExport('ready', `Vertical 1080 × 1920 · ${recorder.extension.toUpperCase()} · ${mb} Mo`);
  } catch (err) {
    console.warn('[export] échec :', err);
    resultScreen.setExport('failed', 'Export vidéo indisponible sur ce navigateur.');
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
