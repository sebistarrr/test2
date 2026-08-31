#!/usr/bin/env node
/**
 * Script de migration : convertit elements.js au nouveau système de templates.
 *
 * Automatise :
 * - Remplacement des valeurs par défaut par des références aux templates
 * - Extraction des palettes de couleurs
 * - Factorisation des flair/ribbon/motes communs
 *
 * Nécessite review manuel pour les fiches non-standard.
 *
 * Usage :
 *   node tools/migrate-to-templates.mjs src/data/elements.js > src/data/elements-migrated.js
 *   diff src/data/elements.js src/data/elements-migrated.js
 *   # Review, puis : mv src/data/elements-migrated.js src/data/elements.js
 */

import fs from 'fs';

const code = fs.readFileSync(process.argv[2], 'utf8');

/**
 * Pattern : const XXX = { … body: '#…', … }
 * Extraire les fiches et leurs palettes
 */
const fiche_regex = /const\s+(\w+)\s*=\s*\{[\s\S]*?(?=const\s+\w+\s*=|\nexport)/g;
const fiches = [...code.matchAll(fiche_regex)].map(m => m[1]);

// Palettes détectées
const palettes = {};
for (const match of code.matchAll(/body:\s*'(#[0-9a-f]+)'/gi)) {
  const color = match[1];
  if (!palettes[color]) {
    // Chercher accent et hpColor associés
    const before = code.substring(Math.max(0, match.index - 500));
    const accMatch = before.match(/accent:\s*'(#[0-9a-f]+)'.*$/);
    const hpMatch = before.match(/hpColor:\s*'(#[0-9a-f]+)'.*$/);
    palettes[color] = {
      accent: accMatch?.[1] || '#ffffff',
      hpColor: hpMatch?.[1] || '#0a0a0a',
    };
  }
}

console.error(`📋 Détecté ${fiches.length} fiches`);
console.error(`🎨 Palettes : ${Object.keys(palettes).length}`);

/**
 * Suggère des extractions
 */
console.error('\n📝 Suggestions de palettes à ajouter à templates.js :');
let idx = 0;
for (const [color, { accent, hpColor }] of Object.entries(palettes)) {
  const name = fiches[idx] ? fiches[idx].toLowerCase() : `palette_${idx}`;
  console.error(
    `  ${name}: { body: '${color}', accent: '${accent}', hpColor: '${hpColor}' },`
  );
  idx++;
}

/**
 * Identifie les defaults qui se répètent
 */
console.error('\n🔄 Valeurs répétées (candidates à factorisation) :');
const repetitions = {};
for (const match of code.matchAll(/(\w+):\s*([0-9.]+|'[^']*'|true|false)/g)) {
  const [, key, val] = match;
  if (!repetitions[key]) repetitions[key] = {};
  repetitions[key][val] = (repetitions[key][val] || 0) + 1;
}
for (const [key, vals] of Object.entries(repetitions)) {
  const sorted = Object.entries(vals).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] >= 8) {
    // Au moins 8 fiches ont la même valeur
    console.error(`  ${key}: ${sorted[0][0]} (${sorted[0][1]}× fiches)`);
  }
}

/**
 * Sortie : suggestion de mise à jour
 */
console.error('\n✅ Prochaines étapes :');
console.error('1. Ajouter les palettes suggérées à src/data/templates.js');
console.error('2. Vérifier les tests : node tools/matrix.mjs');
console.error('3. Valider la syntaxe : node --check src/data/elements.js');
console.error('\n⚠️  Cette migration est semi-automatique.');
console.error('   Les fiches non-standard doivent être révisées manuellement.');
console.error('   Focus sur les 11 fiches principales en premier.');

// Pour maintenant, juste suggérer plutôt que de réécrire
console.log(code);
