/**
 * Empreinte des fiches — le garde-fou des refactorisations.
 *
 * Sérialise les **onze** fiches résolues (désactivées comprises, que la matrice
 * n'exerce pas) en un texte trié et stable : chaque feuille devient une ligne
 * `chemin = valeur`, les fonctions étant réduites à leur source normalisée.
 *
 * Une réorganisation de `src/data/` — découpe en fichiers, couche de valeurs
 * par défaut, réécriture de commentaires — doit laisser cette sortie
 * **identique au caractère près**. C'est une preuve plus forte que la matrice,
 * qui ne joue que les combattants de `PLAYABLE`.
 *
 *   node tools/fiche-snapshot.mjs > /tmp/avant.txt
 *   ... refactorisation ...
 *   node tools/fiche-snapshot.mjs > /tmp/apres.txt && diff /tmp/avant.txt /tmp/apres.txt
 *
 * Ne demande **aucun serveur** ni navigateur : import direct des modules.
 */
import { ELEMENTS, ROSTER, DISABLED, PLAYABLE } from '../src/data/elements.js';
import { PIXEL_MAPS } from '../src/data/pixelmaps.js';

/** Source d'une fonction, blancs écrasés : robuste à une réindentation. */
const fnSource = (f) => `fn(${String(f).replace(/\s+/g, ' ').trim()})`;

const lines = [];

/** Parcours trié : l'ordre des clés d'un objet ne doit pas peser sur l'empreinte. */
function walk(value, path) {
  if (typeof value === 'function') return lines.push(`${path} = ${fnSource(value)}`);
  if (Array.isArray(value)) return lines.push(`${path} = [${value.map((v) => JSON.stringify(v)).join(',')}]`);
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value).sort()) walk(value[key], `${path}.${key}`);
    return;
  }
  lines.push(`${path} = ${JSON.stringify(value)}`);
}

lines.push(`ROSTER = [${ROSTER.join(',')}]`);
lines.push(`DISABLED = [${[...DISABLED].sort().join(',')}]`);
lines.push(`PLAYABLE = [${PLAYABLE.join(',')}]`);

// Les onze fiches, y compris les sept gelées : c'est justement là qu'une
// régression passerait inaperçue, aucun outil ne les jouant.
for (const id of [...ROSTER].sort()) walk(ELEMENTS[id], id);

// Les cartes de pixel-art : une découpe par combattant ne doit ni en perdre
// une, ni en changer une cellule.
for (const key of Object.keys(PIXEL_MAPS).sort()) walk(PIXEL_MAPS[key], `pixelmap.${key}`);

console.log(lines.join('\n'));
