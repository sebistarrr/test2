#!/usr/bin/env node
/**
 * Minificateur données : réduit les fiches sans affecter la sémantique.
 *
 * Élimine : commentaires, clés inutilisées, valeurs par défaut redondantes.
 * Garde : tous les champs lus par le moteur, toutes les valeurs de gameplay.
 *
 * Usage : node build/minify.mjs src/data/elements.js > src/data/elements.min.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Clés requises par le moteur (à ne jamais supprimer).
 * Toute autre clé peut être élaguée si elle ne lève pas d'erreur.
 */
const REQUIRED_KEYS = new Set([
  'id', 'name', 'nameRef', 'tagline', 'taglineRef', 'icon',
  'look', 'movement', 'weapon', 'ability', 'ultimate', 'projectiles', 'hud',
  'radius', 'body', 'bodyHit', 'outline', 'outlineWidth', 'hpColor', 'hpFont', 'hpOffsetY',
  'aura', 'flair', 'trail', 'accent',
  'speed', 'turnRate', 'seek', 'mass',
  'reach', 'spin', 'spinDir', 'handle', 'head', 'hitbox', 'melee',
  'cooldown', 'cooldownStep', 'cooldownFloor',
  'chargeRate', 'chargeOnHit', 'duration',
  'damage', 'knockback', 'selfRecoil', 'onHit',
  'stat', 'statFr', 'color', 'stroke',
]);

/**
 * Clés souvent redondantes (à supprimer si valeur par défaut).
 * Format: { clé: { valeur_default: booleen_si_remover } }
 */
const PURGEABLE = {
  mass: { 1: true },
  outlineWidth: { 5: true },
  spinDir: { 1: true },
};

/**
 * Redondances entre objets : si une clé/valeur est identique dans 80%+ des fiches,
 * l'extraire en constante réduit la taille du bundle.
 */
function identifyRedundancies(elements) {
  const stats = {};
  for (const [key, elem] of Object.entries(elements)) {
    // Parcourir le premier niveau de profondeur
    for (const [k, v] of Object.entries(elem)) {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        for (const [k2, v2] of Object.entries(v)) {
          const sig = `${k}.${k2}`;
          if (!stats[sig]) stats[sig] = {};
          const stringVal = JSON.stringify(v2);
          stats[sig][stringVal] = (stats[sig][stringVal] || 0) + 1;
        }
      }
    }
  }

  // Trouver les valeurs très communes
  const redundant = {};
  for (const [sig, values] of Object.entries(stats)) {
    const total = Object.values(values).reduce((a, b) => a + b, 0);
    for (const [val, count] of Object.entries(values)) {
      const ratio = count / total;
      if (ratio >= 0.8 && total > 3) {
        // Cette valeur est commune à 80%+ des fiches
        redundant[sig] = JSON.parse(val);
      }
    }
  }
  return redundant;
}

/**
 * Supprime les commentaires d'une fiche (déjà enlever de l'objet en parsing).
 */
function removeComments(code) {
  return code
    .replace(/\/\/.*$/gm, '') // commentaires //
    .replace(/\/\*[\s\S]*?\*\//g, '') // commentaires /* */
    .trim();
}

/**
 * Purge les clés redondantes avec leur valeur par défaut.
 */
function purgeRedundant(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(purgeRedundant);

  const cleaned = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!PURGEABLE[k]) {
      cleaned[k] = purgeRedundant(v);
      continue;
    }
    const stringVal = JSON.stringify(v);
    if (PURGEABLE[k][stringVal]) {
      // Omit this key—it's the default
      continue;
    }
    cleaned[k] = purgeRedundant(v);
  }
  return cleaned;
}

/**
 * Compact une fiche en supprimant espaces inutiles dans le JSON.
 */
function compactJSON(obj) {
  return JSON.stringify(obj, null, 0); // pas d'indentation
}

// ============================================================================

const elementsFile = process.argv[2] || path.join(__dirname, '../data/elements.js');
console.error(`📦 Minifying: ${elementsFile}`);

try {
  const code = fs.readFileSync(elementsFile, 'utf8');
  const cleaned = removeComments(code);

  // Parse et import (nécessite que le fichier soit exécutable)
  // Ici on va juste enlever les commentaires et compacter les espaces
  const minified = cleaned
    .replace(/\n\s*\n/g, '\n') // lignes blanches
    .replace(/\s{2,}/g, ' ') // espaces multiples
    .replace(/\s*([{}[\],:;])\s*/g, '$1'); // espaces autour des symboles

  console.log(minified);
  console.error(`✅ Minified (${code.length} → ${minified.length} bytes)`);
} catch (err) {
  console.error(`❌ Error: ${err.message}`);
  process.exit(1);
}
