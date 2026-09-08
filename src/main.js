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
 *   ?sound=0          duel muet — bruitages **et** annonces
 *
 * @module main
 */

import { createStage } from './render/canvas.js';
import { createLoop } from './core/loop.js';
import { loadSprites } from './render/sprites.js';
import { ensureFonts } from './core/fonts.js';
import { createRng, seedFromLocation } from './core/rng.js';
import { ELEMENTS, ROSTER } from './data/elements.js';
import { Match } from './game/match.js';
import { createSelectScreen } from './ui/select.js';
import { createResultScreen } from './ui/result.js';
import { createRecorder, createNullRecorder } from './render/recorder.js';
import { UI, applyStaticLabels } from './ui/lang.js';
import { MATCH } from './data/tuning.js';
import { sfx } from './render/audio.js';

const params = new URLSearchParams(location.search);
const LANG = params.get('lang') === 'fr' ? 'fr' : 'ref';
/** Libellés de l'interface dans la langue choisie (voir ui/lang.js). */
const T = UI[LANG];
const DEBUG = params.get('debug') === '1';
/** Le film du duel coûte un peu de fil principal : `?rec=0` le coupe net. */
const RECORD = params.get('rec') !== '0';
/** `?sound=0` : duel muet d'emblée, bruitages **et** annonces. */
const SOUND = params.get('sound') !== '0';

const canvas = document.querySelector('#stage');
const stage = createStage(canvas);
const recorder = RECORD ? createRecorder(canvas) : createNullRecorder();

/** @type {Match|null} */
let match = null;

const loop = createLoop({
  // le ralenti se pose ici, sur le temps consommé — voir `core/loop.js`
  timeScale: MATCH.timeScale,
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

/* --------------------------------------------------------------- */
/*  Son                                                             */
/* --------------------------------------------------------------- */

// L'annonceur parle la langue de l'écran : une voix anglaise sur une interface
// française serait exactement la moitié d'écran que `ui/lang.js` interdit.
sfx.setLang(LANG);
sfx.setMuted(!SOUND);

// poignée de debug, posée dès le chargement et non au premier duel : le son
// s'ouvre et se coupe depuis l'écran de sélection, donc bien avant qu'il y ait
// un `__match` à inspecter. `tools/sound-check.mjs` s'en sert.
globalThis.__sfx = sfx;

/**
 * **Le son ne s'ouvre qu'à un vrai geste.** Les navigateurs refusent de faire
 * sonner une page que personne n'a touchée ; un `AudioContext` créé au
 * chargement naît suspendu et reste muet **même une fois le duel lancé**, sans
 * la moindre erreur en console. On le crée donc au premier clic ou à la
 * première touche.
 *
 * L'écoute n'est pas `once` : le contexte peut retomber en suspens quand
 * l'onglet passe en arrière-plan, et `unlock()` le réveille aussi. C'est deux
 * comparaisons par clic.
 */
const ouvrirLeSon = () => sfx.unlock();
document.addEventListener('pointerdown', ouvrirLeSon, { passive: true });
document.addEventListener('keydown', ouvrirLeSon, { passive: true });

const soundBtn = document.querySelector('#btn-sound');
/** Icône, état ARIA et libellé du bouton — les trois vont ensemble. */
function refreshSoundBtn() {
  if (!soundBtn) return;
  soundBtn.textContent = sfx.muted ? '🔇' : '🔊';
  soundBtn.setAttribute('aria-pressed', String(sfx.muted));
  soundBtn.setAttribute('aria-label', sfx.muted ? T.soundUnmute : T.soundMute);
}
soundBtn?.addEventListener('click', () => {
  sfx.setMuted(!sfx.muted);
  refreshSoundBtn();
  // un clic pour dire que le son est revenu : sans lui, remettre le son au
  // milieu d'une seconde calme ne produit rien et se lit comme une panne
  if (!sfx.muted) sfx.play('click');
});
refreshSoundBtn();

const selectScreen = createSelectScreen({
  root: document.querySelector('#screen-select'),
  onStart: (ids, teams) => startMatch(ids, undefined, teams),
  lang: LANG,
});

const resultScreen = createResultScreen({
  root: document.querySelector('#screen-result'),
  // revanche : même affiche, nouveau tirage
  onRematch: () => startMatch(lastPair, undefined, lastTeams),
  // revoir : même affiche ET même seed, donc exactement le même duel
  onReplay: () => startMatch(lastPair, lastSeed, lastTeams),
  onExport: () => recorder.download(`duel-${lastPair.join('-')}-seed${lastSeed}`),
  lang: LANG,
  onBack: () => {
    // une annonce de victoire ne doit pas suivre le joueur sur l'écran de
    // sélection : la voix est la seule chose du jeu qui survivrait à `stop()`
    sfx.silence();
    resultScreen.hide();
    loop.stop();
    recorder.reset();
    match = null;
    selectScreen.show();
  },
});

/** @type {[string,string]} */
// Pris dans `ROSTER` : codé en dur, il pointerait sur un combattant
// désactivé et le premier duel partirait hors du roster affiché.
let lastPair = [ROSTER[0], ROSTER[1] ?? ROSTER[0]];
/** Camps de la dernière partie : la revanche et le replay doivent les garder. */
let lastTeams;
/** Points de vie de la dernière partie, gardés pour les mêmes raisons. */
let lastSeed = 0;

/**
 * @param {string[]} pair identifiants des combattants, dans l'ordre d'entrée
 * @param {number} [seed] fournie = duel rejoué à l'identique, sinon nouveau tirage
 * @param {number[]} [teams] camp de chacun. Omis, chacun le sien — ce qui donne
 *   le duel à deux et la bataille royale au-delà.
 */
function startMatch(pair, seed, teams) {
  lastPair = pair;
  lastTeams = teams;
  lastSeed = seed ?? seedFromLocation();
  selectScreen.hide();
  resultScreen.hide();
  resultScreen.setExport(recorder.supported ? 'pending' : 'off');

  match = new Match({
    elements: pair,
    teams: lastTeams,
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

  /**
   * `?f=` lance directement une partie à plusieurs : une liste d'identifiants,
   * et `?teams=` les camps dans le même ordre. Sans `teams`, chacun le sien —
   * donc bataille royale. `?a=&b=` reste la forme courte du duel.
   */
  const liste = (params.get('f') ?? '').split(',').filter(Boolean);
  const camps = (params.get('teams') ?? '').split(',').filter((s) => s !== '').map(Number);
  const a = params.get('a');
  const b = params.get('b');
  if (liste.length >= 2 && liste.every((id) => ELEMENTS[id])) {
    startMatch(liste, undefined, camps.length === liste.length ? camps : undefined);
  } else if (a && b && ELEMENTS[a] && ELEMENTS[b]) {
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
    // le duel s'arrête, l'annonceur aussi — la synthèse vocale, elle, continue
    // de parler dans un onglet caché
    sfx.silence();
  } else {
    recorder.resume();
    loop.start();
  }
});

boot();
