/**
 * ============================================================================
 *  BANC DE SONS — chaque bruitage décrit comme une recette, pas un fichier
 * ============================================================================
 *
 *  **Aucun fichier audio dans le dépôt.** Le cahier des charges dit « aucune
 *  dépendance, aucun build » et le dépôt n'a jamais porté de binaire, à une
 *  exception documentée près (les PNG d'`assets/sprites`). Un banc de bruitages
 *  en WAV ou en MP3 aurait pesé quelques mégaoctets, se serait chargé en
 *  asynchrone — donc aurait pu manquer à la première touche — et n'aurait pas
 *  pu se transposer par combattant.
 *
 *  Tout est donc **synthétisé** par `render/audio.js` : oscillateurs, bruit
 *  blanc filtré, enveloppes. Ce fichier ne contient que les **recettes**, comme
 *  `pixelart/` ne contient que des cartes de pixels et `fighters/` que des
 *  valeurs. Il ne connaît ni l'`AudioContext`, ni le navigateur.
 *
 *  **Une recette = une liste de couches.** Un bruitage crédible est presque
 *  toujours deux choses superposées : un *corps* (un oscillateur qui donne la
 *  hauteur) et un *transitoire* (du bruit filtré qui donne la matière). Une
 *  couche seule sonne comme un test de tonalité ; c'est la superposition qui
 *  fait entendre un métal, une pierre ou une détonation.
 *
 *  Champs d'une couche — tous facultatifs sauf `dur` :
 *
 *  | Clé | Rôle |
 *  | --- | --- |
 *  | `wave` | `sine`, `square`, `sawtooth`, `triangle`, ou `noise` (bruit blanc) |
 *  | `f0` / `f1` | fréquence de départ et d'arrivée (glissando exponentiel) |
 *  | `dur` | durée de la couche, en secondes |
 *  | `gain` | volume relatif dans la recette (0 à 1) |
 *  | `delay` | retard au démarrage, pour empiler les couches d'un arpège |
 *  | `attack` | montée, en secondes (0,003 par défaut : une attaque sèche) |
 *  | `filter` | `lowpass`, `highpass` ou `bandpass` — n'a de sens que sur `noise` |
 *  | `cut0` / `cut1` | coupure du filtre, début → fin (balayage exponentiel) |
 *  | `q` | résonance du filtre |
 *
 *  **Ce qui décide de la hauteur, c'est la fiche.** Chaque combattant porte un
 *  bloc `sound` qui nomme ses recettes et sa transposition (`pitch`), de la
 *  même façon qu'il nomme ses sprites et ses couleurs : le moteur ne connaît
 *  toujours aucun combattant (invariant 12), il lit. Le Golem sonne une octave
 *  plus bas que Neon Shadow sans une ligne de code propre à lui.
 *
 * @module data/sound
 */

import { deepFreeze } from './freeze.js';

/**
 * Réglages communs à tout le mixage.
 *
 * `master` est bas (0,32) et suivi d'un compresseur : un duel empile
 * facilement six ou sept voix — deux billes qui rebondissent, une rafale, une
 * brûlure, un ultime — et sans réduction la somme sature en un craquement.
 */
export const MIX = deepFreeze({
  /** Volume général avant compression. */
  master: 0.32,
  /**
   * **Le même bruitage ne se rejoue pas plus vite que ça**, en secondes.
   *
   * La cadence de simulation est de 120 Hz : une balle qui touche pendant six
   * pas de suite déclencherait six détonations en 50 ms, ce qui ne s'entend pas
   * comme six coups mais comme un seul, saturé. C'est le même garde-fou que le
   * `meleeCd` du moteur, appliqué à l'oreille.
   */
  repeatGap: 0.045,
  /**
   * Voix simultanées. Au-delà, un son est simplement abandonné : mieux vaut
   * perdre le huitième impact d'une mêlée que faire tousser le mixage.
   */
  maxVoices: 14,
  /**
   * Largeur du panoramique. À 1, un combattant collé au mur gauche serait
   * **entièrement** dans l'oreille gauche, ce qui est fatigant au casque et
   * faux à l'écran — l'arène ne fait qu'un tiers de la largeur de la scène.
   */
  panWidth: 0.65,
  /** Voix de l'annonceur : débit et hauteur (1 = réglage du navigateur). */
  voice: { rate: 1.02, pitch: 0.85, volume: 1 },
});

/**
 * Les recettes. Les clés sont des **noms de matière**, pas des noms de
 * combattants : `crunch` est le fracas d'une pierre, et c'est la fiche du Golem
 * qui décide que c'est son corps à corps. Deux combattants peuvent partager une
 * recette et la jouer à des hauteurs différentes.
 */
export const SOUNDS = deepFreeze({
  /* ---------------------------------------------------------------- */
  /*  Tirs et lancers                                                   */
  /* ---------------------------------------------------------------- */

  /** Détonation : un claquement de bruit large, un corps grave très court. */
  gunshot: [
    { wave: 'noise', filter: 'lowpass', cut0: 5200, cut1: 420, q: 1, dur: 0.17, gain: 0.55 },
    { wave: 'square', f0: 240, f1: 60, dur: 0.09, gain: 0.35 },
  ],
  /** Lame ou shuriken qui fend l'air : du bruit passe-bande qui descend. */
  whoosh: [
    { wave: 'noise', filter: 'bandpass', cut0: 1700, cut1: 420, q: 1.4, dur: 0.24, gain: 0.4, attack: 0.03 },
  ],
  /** Projectile magique : une montée claire, sans transitoire — rien ne frappe. */
  orb: [
    { wave: 'sine', f0: 620, f1: 1180, dur: 0.18, gain: 0.3, attack: 0.02 },
    { wave: 'triangle', f0: 310, f1: 590, dur: 0.18, gain: 0.16, attack: 0.02 },
  ],
  /** Caillou jeté : sec, aigu, sans queue. */
  pebble: [
    { wave: 'noise', filter: 'highpass', cut0: 900, cut1: 2600, q: 0.8, dur: 0.09, gain: 0.3 },
    { wave: 'square', f0: 420, f1: 190, dur: 0.07, gain: 0.18 },
  ],

  /* ---------------------------------------------------------------- */
  /*  Touches                                                           */
  /* ---------------------------------------------------------------- */

  /** Tranchant : un sifflement métallique bref sur un corps médium. */
  blade: [
    { wave: 'noise', filter: 'bandpass', cut0: 4200, cut1: 1100, q: 2.2, dur: 0.13, gain: 0.42 },
    { wave: 'triangle', f0: 700, f1: 220, dur: 0.11, gain: 0.24 },
  ],
  /** Pointe : plus étroit et plus haut que `blade`, il pique au lieu de trancher. */
  pierce: [
    { wave: 'noise', filter: 'bandpass', cut0: 5200, cut1: 2200, q: 4, dur: 0.1, gain: 0.34 },
    { wave: 'square', f0: 900, f1: 380, dur: 0.08, gain: 0.16 },
  ],
  /** Pierre contre pierre : grave, mat, avec une queue de gravats. */
  crunch: [
    { wave: 'noise', filter: 'lowpass', cut0: 1100, cut1: 160, q: 1.1, dur: 0.28, gain: 0.5 },
    { wave: 'square', f0: 110, f1: 48, dur: 0.16, gain: 0.3 },
  ],
  /** Impact de projectile : plus petit qu'une touche d'arme, il ne doit pas la couvrir. */
  impact: [
    { wave: 'noise', filter: 'lowpass', cut0: 2600, cut1: 500, q: 1, dur: 0.11, gain: 0.32 },
    { wave: 'sine', f0: 320, f1: 120, dur: 0.1, gain: 0.2 },
  ],
  /** Tic d'un dégât sur la durée (brûlure, givre) : presque un souffle. */
  ember: [
    { wave: 'noise', filter: 'bandpass', cut0: 1400, cut1: 700, q: 1.6, dur: 0.16, gain: 0.16, attack: 0.04 },
  ],

  /* ---------------------------------------------------------------- */
  /*  Le corps dans l'arène                                             */
  /* ---------------------------------------------------------------- */

  /** Rebond sur un mur : un tambour mat, sans hauteur nette. */
  thud: [
    { wave: 'sine', f0: 190, f1: 62, dur: 0.19, gain: 0.34 },
    { wave: 'noise', filter: 'lowpass', cut0: 900, cut1: 220, q: 1, dur: 0.1, gain: 0.18 },
  ],
  /** Deux billes qui se percutent : plus haut et plus court qu'un mur. */
  bump: [
    { wave: 'sine', f0: 380, f1: 140, dur: 0.12, gain: 0.26 },
  ],

  /* ---------------------------------------------------------------- */
  /*  Pouvoirs — matières                                               */
  /* ---------------------------------------------------------------- */

  /** Ruée, charge, glissade : un souffle qui monte puis retombe. */
  dash: [
    { wave: 'noise', filter: 'bandpass', cut0: 700, cut1: 2400, q: 1.1, dur: 0.3, gain: 0.34, attack: 0.06 },
    { wave: 'sawtooth', f0: 120, f1: 300, dur: 0.28, gain: 0.12, attack: 0.06 },
  ],
  /** Givre : une tenue vitreuse, très haute, sans grave du tout. */
  frost: [
    { wave: 'sine', f0: 2600, f1: 1500, dur: 0.5, gain: 0.16, attack: 0.05 },
    { wave: 'noise', filter: 'highpass', cut0: 2400, cut1: 5200, q: 0.7, dur: 0.5, gain: 0.14, attack: 0.08 },
  ],
  /** Braise : un souffle grave et lent, l'inverse exact du givre. */
  fire: [
    { wave: 'noise', filter: 'lowpass', cut0: 1500, cut1: 380, q: 1, dur: 0.55, gain: 0.3, attack: 0.09 },
  ],
  /** Foudre : une décharge qui s'écrase en un cinquième de seconde. */
  zap: [
    { wave: 'square', f0: 2100, f1: 260, dur: 0.13, gain: 0.3 },
    { wave: 'noise', filter: 'highpass', cut0: 3000, cut1: 900, q: 1, dur: 0.22, gain: 0.28 },
  ],
  /** Nappe entretenue (dôme, champ) : un bourdon doux, il ne doit pas fatiguer. */
  hum: [
    { wave: 'sine', f0: 160, f1: 150, dur: 0.7, gain: 0.2, attack: 0.12 },
    { wave: 'triangle', f0: 320, f1: 300, dur: 0.7, gain: 0.1, attack: 0.12 },
  ],
  /** Végétal : deux notes courtes qui poussent l'une sur l'autre. */
  bloom: [
    { wave: 'triangle', f0: 330, f1: 520, dur: 0.22, gain: 0.24, attack: 0.03 },
    { wave: 'sine', f0: 660, f1: 990, dur: 0.26, gain: 0.16, delay: 0.08, attack: 0.03 },
  ],
  /** Pas du vide, téléportation : un balayage qui part vers le haut et disparaît. */
  warp: [
    { wave: 'sine', f0: 220, f1: 1900, dur: 0.22, gain: 0.24 },
    { wave: 'noise', filter: 'bandpass', cut0: 600, cut1: 4000, q: 3, dur: 0.22, gain: 0.2 },
  ],
  /** Invocation : deux quintes qui montent, franches, on doit entendre « quelqu'un arrive ». */
  summon: [
    { wave: 'square', f0: 180, f1: 270, dur: 0.16, gain: 0.2, attack: 0.02 },
    { wave: 'square', f0: 270, f1: 405, dur: 0.24, gain: 0.2, delay: 0.1, attack: 0.02 },
  ],
  /** Séisme : le seul son vraiment long du banc, et le seul sous les 40 Hz. */
  quake: [
    { wave: 'sine', f0: 62, f1: 28, dur: 1.1, gain: 0.5, attack: 0.05 },
    { wave: 'noise', filter: 'lowpass', cut0: 320, cut1: 90, q: 1, dur: 0.9, gain: 0.3, attack: 0.05 },
  ],
  /** Soin : la seule recette qui **monte** en gardant sa douceur. */
  heal: [
    { wave: 'sine', f0: 660, f1: 990, dur: 0.32, gain: 0.2, attack: 0.05 },
  ],
  /** Montée d'ultime : un balayage large qui annonce que quelque chose arrive. */
  riser: [
    { wave: 'sawtooth', f0: 90, f1: 880, dur: 0.6, gain: 0.24, attack: 0.05 },
    { wave: 'noise', filter: 'bandpass', cut0: 400, cut1: 5000, q: 2, dur: 0.6, gain: 0.26, attack: 0.05 },
  ],
  /** Éclipse : la même montée, mais **descendante** — la lumière s'en va. */
  eclipse: [
    { wave: 'sawtooth', f0: 700, f1: 70, dur: 0.9, gain: 0.26, attack: 0.04 },
    { wave: 'noise', filter: 'lowpass', cut0: 4000, cut1: 220, q: 1.4, dur: 0.9, gain: 0.24 },
  ],

  /* ---------------------------------------------------------------- */
  /*  Ponctuation du duel                                               */
  /* ---------------------------------------------------------------- */

  /** Gong d'engagement, à la fin de l'attente d'avant-combat. */
  gong: [
    { wave: 'triangle', f0: 330, f1: 300, dur: 1.3, gain: 0.3, attack: 0.005 },
    { wave: 'sine', f0: 165, f1: 150, dur: 1.4, gain: 0.26, attack: 0.005 },
    { wave: 'noise', filter: 'bandpass', cut0: 2600, cut1: 900, q: 2, dur: 0.35, gain: 0.18 },
  ],
  /** K.O. : la plus grosse dépense du banc, et la seule qui vaille une seconde. */
  ko: [
    { wave: 'noise', filter: 'lowpass', cut0: 2600, cut1: 90, q: 1.2, dur: 0.95, gain: 0.6 },
    { wave: 'sine', f0: 150, f1: 34, dur: 0.85, gain: 0.45 },
    { wave: 'square', f0: 90, f1: 30, dur: 0.4, gain: 0.2 },
  ],
  /** Fanfare de victoire : un arpège majeur, une note toutes les 110 ms. */
  fanfare: [
    { wave: 'square', f0: 523, f1: 523, dur: 0.16, gain: 0.2, attack: 0.01 },
    { wave: 'square', f0: 659, f1: 659, dur: 0.16, gain: 0.2, delay: 0.11, attack: 0.01 },
    { wave: 'square', f0: 784, f1: 784, dur: 0.16, gain: 0.2, delay: 0.22, attack: 0.01 },
    { wave: 'square', f0: 1046, f1: 1046, dur: 0.5, gain: 0.24, delay: 0.33, attack: 0.01 },
    { wave: 'triangle', f0: 261, f1: 261, dur: 0.7, gain: 0.16, delay: 0.33, attack: 0.02 },
  ],
  /** Clic d'interface : les écrans DOM ne sont pas muets non plus. */
  click: [
    { wave: 'square', f0: 900, f1: 600, dur: 0.045, gain: 0.16 },
  ],
});
