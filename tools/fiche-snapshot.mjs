/**
 * Empreinte des fiches — le garde-fou des refactorisations.
 *
 * Sérialise les fiches résolues du roster en un texte trié et stable : chaque feuille devient une ligne
 * `chemin = valeur`, les fonctions étant réduites à leur source normalisée.
 *
 * Une réorganisation de `src/data/` — découpe en fichiers, couche de valeurs
 * par défaut, réécriture de commentaires — doit laisser cette sortie
 * **identique au caractère près**. C'est une preuve complémentaire de la
 * matrice : celle-ci couvre le comportement, l'empreinte couvre les valeurs —
 * y compris celles qu'aucun duel n'exerce.
 *
 *   node tools/fiche-snapshot.mjs > /tmp/avant.txt
 *   ... refactorisation ...
 *   node tools/fiche-snapshot.mjs > /tmp/apres.txt && diff /tmp/avant.txt /tmp/apres.txt
 *
 * Ne demande **aucun serveur** ni navigateur : import direct des modules.
 */
import { ELEMENTS, ROSTER } from '../src/data/elements.js';
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

for (const id of [...ROSTER].sort()) walk(ELEMENTS[id], id);

// Les cartes de pixel-art : une réorganisation ne doit ni en perdre une, ni
// en changer une cellule.
for (const key of Object.keys(PIXEL_MAPS).sort()) walk(PIXEL_MAPS[key], `pixelmap.${key}`);

console.log(lines.join('\n'));
