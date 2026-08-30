// Garde-fou : les clés d'une fiche et ce que son module lit doivent coïncider.
//
// Deux pannes réelles, à deux mois d'intervalle, toutes deux silencieuses :
//
//   1. en réécrivant le bloc `lunge` du Lancier, `recoil` et `hitRing` ont été
//      supprimés alors que le module les lisait encore. `push(..., undefined)`
//      donnait NaN, et la position du combattant partait en NaN dès la première
//      touche ;
//   2. en réécrivant sa machine à états, l'écriture de `weaponLateral` a été
//      perdue. `lunge.lateral` est resté dans la fiche sans que personne ne le
//      lise, et l'arme a cessé de se décaler sur le flanc — sans erreur, sans
//      test rouge, sans rien.
//
// Le premier cas plante bruyamment une fois sur deux ; le second ne plante
// jamais. C'est celui-là qui justifie cet outil.
//
//   node tools/fiche-check.mjs
//
// Prérequis : un serveur statique sur $URL (défaut http://127.0.0.1:8085).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';

const URL = process.env.URL ?? 'http://127.0.0.1:8085';
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/**
 * Blocs de fiche vérifiés, et le préfixe sous lequel le module les lit.
 *
 * **Seul `weapon.lunge` s'y prête, et c'est délibéré.** Le recoupement n'a de
 * sens que pour un bloc lu par **un seul** module : `ability` a été essayé et
 * produit du bruit — `id`, `name` et `nameRef` sont lus par l'interface,
 * `cooldownStep` par `match.js`, et `f.ability.timer` est de l'état
 * d'exécution qui n'a jamais eu de clé de fiche. Un garde-fou qui crie à tort
 * dix-neuf fois ne sera plus lu ; mieux vaut qu'il ne couvre qu'un bloc et
 * qu'on le croie.
 */
const BLOCKS = [
  { path: ['weapon', 'lunge'], reads: ['L', 'lunge'] },
];

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(`${URL}/index.html`, { waitUntil: 'networkidle' });
const fiches = await page.evaluate(async () => {
  const m = await import('/src/data/elements.js');
  const out = {};
  for (const id of m.ROSTER) out[id] = m.ELEMENTS[id];
  return JSON.parse(JSON.stringify(out, (k, v) => (typeof v === 'function' ? '[fn]' : v)));
});
await browser.close();

let problems = 0;
for (const [id, el] of Object.entries(fiches)) {
  let src;
  try {
    src = readFileSync(new global.URL(`../src/game/abilities/${id}.js`, import.meta.url), 'utf8');
  } catch {
    continue; // pas de module dédié : rien à recouper
  }

  for (const { path, reads } of BLOCKS) {
    let block = el;
    for (const key of path) block = block?.[key];
    if (!block || typeof block !== 'object') continue;

    // Ce que le module lit sous l'un des préfixes connus, plus les
    // déstructurations `const { a, b } = L;`
    const used = new Set();
    for (const p of reads) {
      for (const m of src.matchAll(new RegExp(`\\b${p}\\.([A-Za-z]\\w*)`, 'g'))) used.add(m[1]);
      for (const m of src.matchAll(new RegExp(`\\{([^}]*)\\}\\s*=\\s*${p}\\b`, 'g'))) {
        for (const name of m[1].split(',')) {
          const n = name.split(':')[0].trim();
          if (n) used.add(n);
        }
      }
    }
    if (used.size === 0) continue; // le module n'utilise pas ce préfixe

    const label = `${id}.${path.join('.')}`;
    const dead = Object.keys(block).filter((k) => !used.has(k));
    const missing = [...used].filter((k) => !(k in block));

    // `missing` est le cas qui plante : le module lit une clé absente, donc
    // `undefined`, donc NaN dès qu'elle sert à un calcul.
    if (missing.length) {
      console.log(`  ✗ ${label} — lu par le module mais ABSENT de la fiche : ${missing.join(', ')}`);
      problems++;
    }
    // `dead` est le cas silencieux : la fiche porte une valeur que plus
    // personne ne lit, donc un réglage qui ne fait plus rien.
    if (dead.length) {
      console.log(`  ! ${label} — présent dans la fiche mais JAMAIS LU : ${dead.join(', ')}`);
      problems++;
    }
  }
}

console.log(problems === 0
  ? 'OK — chaque clé de fiche vérifiée est lue, et chaque lecture a sa clé'
  : `${problems} écart(s) — voir ci-dessus`);
process.exit(problems === 0 ? 0 : 1);
