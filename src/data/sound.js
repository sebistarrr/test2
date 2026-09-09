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
 *  plus bas que le Shinobi sans une ligne de code propre à lui.
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
   *
   * **14 → 20, et c'est une mesure, pas un confort.** Une voix est une
   * *couche*, pas un bruitage : enrichir une recette la fait peser plus lourd
   * sur ce plafond, et le prix se paie sur **les autres sons**, pas sur elle.
   * Donner son propre jeu au Pistolero (`gunshot` passé de 2 à 4 couches,
   * `cylinder` et `knell` à 5) a fait passer les sons perdus de **0 % à 2,3 %**
   * sur quinze duels — rechargements et impacts compris. Le banc, en rejouant
   * l'algorithme de `play()` sur l'horloge du duel :
   *
   * | plafond | 14 | 16 | 18 | 20 | 24 |
   * | --- | --- | --- | --- | --- | --- |
   * | sons perdus | 2,3 % | 1,4 % | 0,5 % | **0,4 %** | 0 % |
   *
   * 20 est le coude : ce qui saute encore n'est plus que `thud`, le rebond de
   * mur — le son le plus fréquent du jeu et le moins porteur de sens. Aller à
   * 24 ne rachèterait que lui.
   *
   * **À remesurer à chaque combattant qu'on sonorise** : six jeux propres
   * empileront six fois cette pression, et rien ne criera — un son perdu ne
   * plante pas, il manque.
   */
  maxVoices: 20,
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

  /**
   * Détonation : un claquement de bruit large, un corps grave très court.
   *
   * **Gain relevé, demandé** — une vidéo de référence (le duel Outlaw vs
   * Bladesman d'origine) montre des impacts nettement plus francs que le banc
   * ne les rendait : crête proche de la saturation (0,7 à 1,0 en amplitude
   * normalisée sur l'audio de la vidéo), et une énergie qui déborde largement
   * dans le médium-aigu plutôt que de rester grave. Le compresseur de
   * `render/audio.js` (seuil −18 dB, ratio 8:1) absorbe la crête : monter le
   * gain d'une couche la pousse dans le compresseur, ce qui *est* le son
   * « punchy, à la limite de la saturation » de la référence — ce n'est pas
   * un défaut à corriger, c'est le levier à tirer.
   */
  gunshot: [
    /**
     * **Le claquement, et c'est lui qu'on reconnaît.** Moins de 50 ms, très
     * haut, attaque à 1 ms : un coup de feu s'identifie à son transitoire, pas
     * à son grave. Sans cette couche la recette sonnait « souffle », pas
     * « détonation ».
     */
    { wave: 'noise', filter: 'highpass', cut0: 3200, cut1: 1100, q: 0.7, dur: 0.045, gain: 0.9, attack: 0.001 },
    /** Le souffle de la charge, plus grave et plus long que le claquement. */
    { wave: 'noise', filter: 'lowpass', cut0: 5200, cut1: 420, q: 1, dur: 0.17, gain: 0.78 },
    /** Le corps : c'est cette couche qui donne le **calibre**. */
    { wave: 'square', f0: 240, f1: 60, dur: 0.09, gain: 0.5 },
    /**
     * **La queue, en retard sur le claquement** : le renvoi de la rue déserte.
     * Le `delay` de 55 ms est ce qui la fait entendre comme un *écho* et non
     * comme une deuxième couche du même coup — en dessous de ~40 ms l'oreille
     * les fond en un seul événement.
     */
    { wave: 'noise', filter: 'bandpass', cut0: 1300, cut1: 520, q: 2.2, dur: 0.33, gain: 0.17, delay: 0.055, attack: 0.02 },
  ],
  /**
   * **Le barillet qu'on réarme** : trois crans, la roue qui tourne, le verrou.
   *
   * Le rechargement dure 0,7 s sur la fiche du Pistolero et le pistolet vrille
   * pendant tout ce temps ; un clic unique ne remplissait pas ce geste — il
   * empruntait même littéralement `click`, le son de l'interface. Les trois
   * crans à 85 ms d'intervalle donnent la **mécanique**, le souffle passe-bande
   * la roue, et le dernier transitoire le moment où ça se referme.
   */
  cylinder: [
    { wave: 'noise', filter: 'bandpass', cut0: 2600, cut1: 4300, q: 3.4, dur: 0.26, gain: 0.13, attack: 0.05 },
    { wave: 'square', f0: 1500, f1: 1150, dur: 0.02, gain: 0.2 },
    { wave: 'square', f0: 1660, f1: 1250, dur: 0.02, gain: 0.2, delay: 0.085 },
    { wave: 'square', f0: 1840, f1: 1360, dur: 0.02, gain: 0.2, delay: 0.17 },
    { wave: 'noise', filter: 'highpass', cut0: 1900, cut1: 3400, q: 1, dur: 0.05, gain: 0.34, delay: 0.255 },
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

  /**
   * Tranchant : un sifflement métallique bref sur un corps médium.
   *
   * **Gain relevé et bande élargie, demandé** — même geste que `gunshot`
   * ci-dessus : la vidéo de référence rend ses touches plus fortes et plus
   * larges en spectre (moins « sifflement fin », plus « claquement large »).
   * `q` baissé (2,2 → 1,5) élargit le bandpass au lieu de le resserrer.
   */
  blade: [
    { wave: 'noise', filter: 'bandpass', cut0: 4200, cut1: 1100, q: 1.5, dur: 0.13, gain: 0.6 },
    { wave: 'triangle', f0: 700, f1: 220, dur: 0.11, gain: 0.34 },
  ],
  /**
   * Pointe : plus étroit et plus haut que `blade`, il pique au lieu de
   * trancher. **Gain relevé et bande élargie, demandé** — même geste que
   * `blade`.
   */
  pierce: [
    { wave: 'noise', filter: 'bandpass', cut0: 5200, cut1: 2200, q: 2.5, dur: 0.1, gain: 0.48 },
    { wave: 'square', f0: 900, f1: 380, dur: 0.08, gain: 0.24 },
  ],
  /**
   * Pierre contre pierre : grave, mat, avec une queue de gravats. **Gain
   * relevé, demandé** — même geste que `blade`.
   */
  crunch: [
    { wave: 'noise', filter: 'lowpass', cut0: 1100, cut1: 160, q: 1.1, dur: 0.28, gain: 0.68 },
    { wave: 'square', f0: 110, f1: 48, dur: 0.16, gain: 0.4 },
  ],
  /**
   * Impact de projectile : plus petit qu'une touche d'arme, il ne doit pas la
   * couvrir — ce rapport-là est gardé. **Gain relevé, demandé** — même geste
   * que `blade`, à l'échelle du projectile.
   */
  impact: [
    { wave: 'noise', filter: 'lowpass', cut0: 2600, cut1: 500, q: 1, dur: 0.11, gain: 0.46 },
    { wave: 'sine', f0: 320, f1: 120, dur: 0.1, gain: 0.28 },
  ],
  /**
   * **Coup de crosse** : le Peacemaker frappe avec sa masse, pas avec un fil.
   *
   * Là où `blade` siffle haut (bandpass à 4200 Hz, c'est une lame qui tranche),
   * celui-ci est **mat et médium** : la même famille de recette, une octave et
   * demie plus bas, sans queue métallique. C'est ce qui sépare à l'oreille un
   * duelliste d'un homme qui cogne avec son arme.
   */
  pistolwhip: [
    { wave: 'noise', filter: 'bandpass', cut0: 1900, cut1: 480, q: 1.2, dur: 0.1, gain: 0.5 },
    { wave: 'square', f0: 300, f1: 110, dur: 0.08, gain: 0.32 },
  ],
  /**
   * **La balle gelante qui mord** : un impact qui *prend* au lieu de retomber.
   *
   * La seule recette du banc dont la couche de corps **monte** (1760 → 2640 Hz)
   * : partout ailleurs un impact descend, parce qu'un choc perd son énergie.
   * Ici le gel continue après la balle — c'est exactement ce que fait la fiche
   * (`onHit.slow`, −30 % de vitesse pendant 1,6 s), et l'oreille doit
   * l'entendre continuer.
   */
  frostbite: [
    { wave: 'noise', filter: 'highpass', cut0: 2800, cut1: 6400, q: 0.8, dur: 0.09, gain: 0.34 },
    { wave: 'triangle', f0: 1760, f1: 2640, dur: 0.12, gain: 0.2, attack: 0.006 },
    { wave: 'sine', f0: 300, f1: 120, dur: 0.09, gain: 0.22 },
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
  /**
   * **Givre** : le claquement de l'onde, puis la tenue vitreuse.
   *
   * La fiche du Pistolero décrit un Champ de givre qui part en **onde de 40 à
   * 900 px en 0,95 s** avant de se poser en disque : le son ne disait que le
   * disque. Les deux couches d'ouverture sont l'onde — un grave sec qui claque
   * au déclenchement, et un balayage passe-haut qui **s'ouvre** de 600 à
   * 7000 Hz, la traduction à l'oreille d'un anneau qui gagne le bord de
   * l'écran. Les deux couches d'origine, elles, ne bougent pas : c'est le
   * champ lui-même, et il était juste.
   */
  frost: [
    { wave: 'sine', f0: 180, f1: 58, dur: 0.3, gain: 0.34 },
    { wave: 'noise', filter: 'highpass', cut0: 600, cut1: 7000, q: 0.8, dur: 0.55, gain: 0.34, attack: 0.012 },
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
  /**
   * **Le glas** : une cloche, son octave grave, et la rue qui se vide derrière.
   *
   * `riser` annonce « quelque chose arrive » et convient à quatre combattants ;
   * il ne dit pas *quoi*. MAIN DU MORT est un duel à midi — ce qui l'ouvre
   * n'est pas une montée de synthé mais **une cloche qu'on frappe**, avec ce
   * qui va avec : le battant sur le bronze (le transitoire passe-bande), puis
   * la tension et le vent, tous deux **en retard de 120 ms** pour que la cloche
   * arrive seule et se fasse entendre avant d'être accompagnée.
   *
   * Ré♯ grave et son octave (311 / 622 Hz) : deux couches accordées à l'octave
   * sonnent comme *une* cloche, deux couches accordées autrement sonnent comme
   * deux notes — c'est la même raison qui fait que `play()` transpose toutes
   * les couches d'un coup par le même facteur.
   */
  knell: [
    { wave: 'triangle', f0: 622, f1: 616, dur: 1.05, gain: 0.3, attack: 0.004 },
    { wave: 'sine', f0: 311, f1: 308, dur: 1.2, gain: 0.28, attack: 0.004 },
    { wave: 'noise', filter: 'bandpass', cut0: 3000, cut1: 1100, q: 2.4, dur: 0.3, gain: 0.2 },
    { wave: 'sawtooth', f0: 110, f1: 466, dur: 0.75, gain: 0.16, attack: 0.07, delay: 0.12 },
    { wave: 'noise', filter: 'bandpass', cut0: 500, cut1: 2600, q: 2, dur: 0.8, gain: 0.13, attack: 0.1, delay: 0.12 },
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
