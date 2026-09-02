/**
 * ============================================================================
 *  FICHES D'ÉLÉMENTS — registre du roster
 * ============================================================================
 *
 *  Ce fichier n'est plus qu'un **assemblage** : chaque combattant vit dans
 *  `fighters/<id>.js`, un fichier par fiche, du même nom que son module de
 *  pouvoirs `game/abilities/<id>.js`.
 *
 *  C'est la découpe qui compte : modifier le Shinobi demandait d'ouvrir un
 *  fichier de 3 000 lignes pour en toucher 350. Aujourd'hui on ouvre
 *  `fighters/wind.js` et rien d'autre.
 *
 *  Ce qui reste ici, et rien de plus : le registre `ELEMENTS`, l'ordre
 *  `ROSTER` (qui décide du camp A de la matrice), la liste `DISABLED` et
 *  l'accès `getElement`. Aucune valeur de combattant.
 *
 *  Ce qui définit un combattant est dans sa fiche : apparence, vitesse, arme,
 *  pouvoir, ultime, projectiles, HUD. Le moteur ne contient AUCUNE constante
 *  propre à un élément : il lit la fiche.
 *
 *  Les objets sont gelés (deepFreeze) : un duel ne peut pas les modifier, donc
 *  Ombre se comporte exactement pareil au 1er et au 100e duel. Le runtime
 *  travaille sur une copie d'état (voir game/fighter.js).
 *
 *  **Ajouter un combattant** = `fighters/<id>.js` + `game/abilities/<id>.js` +
 *  trois lignes ici (import, entrée `ELEMENTS`, queue de `ROSTER`).
 *  Marche à suivre complète : `docs/AJOUTER-UN-COMBATTANT.md`.
 *
 *  Unités : px (référentiel 720x1280 de la vidéo), secondes, radians.
 *  « mesuré » = valeur relevée sur la vidéo de référence.
 *  « calé »   = valeur ajustée pour retrouver le rythme observé (~60 s de duel).
 *  « déduit » = valeur calculée à partir d'une autre.
 *
 * @module data/elements
 */

import { deepFreeze } from './freeze.js';

import { SHADOW } from './fighters/shadow.js';
import { ICE } from './fighters/ice.js';
import { FIRE } from './fighters/fire.js';
import { LIGHT } from './fighters/light.js';
import { WIND } from './fighters/wind.js';
import { LIGHTNING } from './fighters/lightning.js';
import { WATER } from './fighters/water.js';
import { PLANT } from './fighters/plant.js';
import { OUTLAW } from './fighters/outlaw.js';
import { BLADESMAN } from './fighters/bladesman.js';
import { LANCER } from './fighters/lancer.js';
import { MAGE } from './fighters/mage.js';

export const ELEMENTS = deepFreeze({
  shadow: SHADOW,
  ice: ICE,
  fire: FIRE,
  light: LIGHT,
  wind: WIND,
  lightning: LIGHTNING,
  water: WATER,
  plant: PLANT,
  outlaw: OUTLAW,
  bladesman: BLADESMAN,
  lancer: LANCER,
  mage: MAGE,
});

/**
 * Ordre d'affichage dans l'écran de sélection — et, via `tools/matrix.mjs`,
 * ordre d'appariement de la matrice d'équilibrage.
 *
 * Le Hors-la-loi, le Bretteur et le Shinobi (`wind`) sont **ajoutés en
 * queue** et pas insérés : les paires sont formées en `[liste[i], liste[j]]`,
 * donc mettre un nouveau venu en tête changerait le camp A de dizaines
 * d'affrontements existants, et avec lui leur issue — sans qu'aucune valeur
 * de fiche n'ait bougé. `wind` occupait à l'origine sa place parmi les huit
 * éléments (avant `plant`) ; réactivé en Shinobi, il est **déplacé** ici en
 * queue de liste pour la même raison — sa position dans `ROSTER` d'origine
 * l'aurait fait passer devant `outlaw`/`bladesman`/`lancer` dans `PLAYABLE`,
 * ce qui aurait changé le camp A de leurs six duels existants.
 */
export const ROSTER = deepFreeze([
  'shadow',
  'ice',
  'fire',
  'water',
  'light',
  'lightning',
  'plant',
  'outlaw',
  'bladesman',
  'lancer',
  'wind',
  'mage',
]);

/**
 * Combattants **temporairement désactivés**.
 *
 * Rien n'est supprimé : `ELEMENTS` et `ROSTER` restent entiers. Cette liste ne
 * retire les combattants que de ce qui est **jouable** — écran de sélection et
 * duel par défaut. C'est volontaire, et c'est ce qui rend la manœuvre
 * réversible sans rien reconstruire.
 *
 * **L'outillage continue de lire `ROSTER` en entier**, et il le faut :
 * `tools/matrix.mjs` est le garde-fou d'équilibrage, et le laisser tomber à un
 * seul combattant reviendrait à perdre la matrice de référence des dix autres
 * — donc à devoir tout recaler à la réactivation. De même `lang-check.mjs`
 * vérifie les onze fiches, pour qu'une fiche désactivée ne pourrisse pas en
 * silence.
 *
 * **Pour réactiver :** retirer l'identifiant de cette liste. Pour tout
 * réactiver d'un coup, la vider — `export const DISABLED = deepFreeze([]);`.
 *
 * Les identifiants désactivés restent accessibles par URL (`?a=fire&b=ice`) :
 * la désactivation porte sur l'écran de sélection, pas sur le moteur, ce qui
 * permet de continuer à tester un combattant sans le remettre en vitrine.
 *
 * **`wind` en est sorti, à la demande — même exception que `bladesman`.**
 * Ce n'est pas une réactivation « telle quelle » d'un relevé vidéo qu'on
 * ranime sans y toucher : c'est un reskin demandé (Shinobi, arme et
 * projectiles en shuriken de flamme), qui compte donc désormais dans la
 * matrice de rééquilibrage comme `bladesman` avant lui — voir sa fiche.
 */
export const DISABLED = deepFreeze([
  'shadow',
  'ice',
  'fire',
  'water',
  'light',
  'lightning',
  'plant',
]);

/**
 * Le roster **jouable** : `ROSTER` moins `DISABLED`, dans le même ordre.
 *
 * Dérivé plutôt que recopié : deux listes tenues à la main finissent par
 * diverger, et l'écran de sélection afficherait alors une carte pour un
 * combattant que le moteur ne connaît plus.
 */
export const PLAYABLE = deepFreeze(ROSTER.filter((id) => !DISABLED.includes(id)));

if (PLAYABLE.length === 0) {
  // Un roster jouable vide donne un écran de sélection blanc et un plantage à
  // la première partie : mieux vaut le dire ici.
  throw new Error('DISABLED désactive tout le roster — il faut au moins un combattant.');
}

/** @param {string} id */
export function getElement(id) {
  const el = ELEMENTS[id];
  if (!el) throw new Error(`Élément inconnu : ${id}`);
  return el;
}
