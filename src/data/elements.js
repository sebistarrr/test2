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
 *  `ROSTER` (qui décide du camp A de la matrice) et l'accès `getElement`.
 *  Aucune valeur de combattant.
 *
 *  Ce qui définit un combattant est dans sa fiche : apparence, vitesse, arme,
 *  pouvoir, ultime, projectiles, HUD. Le moteur ne contient AUCUNE constante
 *  propre à un élément : il lit la fiche.
 *
 *  Les objets sont gelés (deepFreeze) : un duel ne peut pas les modifier, donc
 *  le Hors-la-loi se comporte exactement pareil au 1er et au 100e duel. Le runtime
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

import { WIND } from './fighters/wind.js';
import { OUTLAW } from './fighters/outlaw.js';
import { BLADESMAN } from './fighters/bladesman.js';
import { LANCER } from './fighters/lancer.js';
import { MAGE } from './fighters/mage.js';
import { COLOSSUS } from './fighters/colossus.js';

export const ELEMENTS = deepFreeze({
  wind: WIND,
  outlaw: OUTLAW,
  bladesman: BLADESMAN,
  lancer: LANCER,
  mage: MAGE,
  colossus: COLOSSUS,
});

/**
 * Le roster : ordre d'affichage dans l'écran de sélection, et — via
 * `tools/matrix.mjs` — ordre d'appariement de la matrice d'équilibrage.
 *
 * **Un nouveau venu s'ajoute en queue.** Les paires sont formées en
 * `[liste[i], liste[j]]`, donc l'insérer ailleurs déplacerait le camp A
 * d'affrontements existants et changerait leur issue sans qu'aucune valeur de
 * fiche n'ait bougé. Preuve à vérifier : le diff de la matrice ne doit
 * contenir que des ajouts.
 *
 * Il n'y a plus de liste `DISABLED` : les sept éléments gelés ont été
 * **supprimés** du dépôt, pas masqués. Tout ce qui est ici se joue.
 */
export const ROSTER = deepFreeze([
  'outlaw',
  'bladesman',
  'lancer',
  'wind',
  'mage',
  'colossus',
]);

/** @param {string} id */
export function getElement(id) {
  const el = ELEMENTS[id];
  if (!el) throw new Error(`Élément inconnu : ${id}`);
  return el;
}
