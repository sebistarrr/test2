/**
 * Garde-fou de l'invariant de langue (voir « Langue » dans CLAUDE.md).
 *
 * Vérifie deux choses qu'aucun `node --check` ne voit :
 *   1. `UI.ref` et `UI.fr` portent **exactement les mêmes clés** — une clé
 *      ajoutée d'un seul côté rend un libellé `undefined` à l'écran ;
 *   2. chaque fiche **active** (PLAYABLE) porte **tous ses champs anglais**.
 *      Le repli de `label()` (`nameRef ?? name`) évite le plantage, pas
 *      l'incohérence : un champ oublié fait apparaître une ligne française
 *      au milieu d'un écran anglais, et ça ne se voit qu'en survolant la bonne carte.
 *
 *   node tools/lang-check.mjs
 *
 * Prérequis : un serveur statique sur $URL (defaut http://127.0.0.1:8085).
 * Note : les combattants désactivés (DISABLED) ne sont pas vérifiés.
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const URL = process.env.URL ?? 'http://127.0.0.1:8085';
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(`${URL}/index.html`, { waitUntil: 'networkidle' });

const rapport = await page.evaluate(async () => {
  const { UI } = await import('/src/ui/lang.js');
  const { ELEMENTS, PLAYABLE } = await import('/src/data/elements.js');

  const cles = Object.keys(UI.ref);
  const clesFr = Object.keys(UI.fr);
  const erreurs = [];
  for (const k of cles) if (!(k in UI.fr)) erreurs.push(`UI.fr.${k} manquant`);
  for (const k of clesFr) if (!(k in UI.ref)) erreurs.push(`UI.ref.${k} manquant`);

  const requis = (el) => [
    ['nameRef', el.nameRef],
    ['taglineRef', el.taglineRef],
    ['weapon.nameRef', el.weapon.nameRef],
    ['ability.nameRef', el.ability.nameRef],
    ['ultimate.nameRef', el.ultimate.nameRef],
    ['ultimate.barLabel', el.ultimate.barLabel],
    ['hud.stats', el.hud.stats ?? el.hud.stat],
  ];

  const lignes = [];
  for (const id of PLAYABLE) {
    const el = ELEMENTS[id];
    const trous = requis(el).filter(([, v]) => !v).map(([k]) => k);
    // `special` est facultatif — seuls les deux invités en portent un — mais
    // dès qu'une fiche en a un, il doit venir avec sa moitié anglaise, sinon
    // l'écran de sélection retombe en français au milieu d'une liste anglaise.
    if (el.special && !el.special.nameRef) trous.push('special.nameRef');
    for (const [k, p] of Object.entries(el.projectiles ?? {})) {
      if (!p.labelRef) trous.push(`projectiles.${k}.labelRef`);
    }
    if (trous.length) erreurs.push(`${id} : ${trous.join(', ')}`);
    lignes.push(`  ${id.padEnd(10)} ${trous.length ? '✗ ' + trous.join(', ') : '✓'}`);
  }
  return { nbCles: cles.length, nbFiches: PLAYABLE.length, lignes, erreurs };
});

console.log(`libellés d'interface : ${rapport.nbCles} clés dans chaque langue`);
console.log(`combattants actifs vérifiés : ${rapport.nbFiches}`);
console.log(rapport.lignes.join('\n'));
if (rapport.erreurs.length) {
  console.error('\n' + rapport.erreurs.map((e) => `✗ ${e}`).join('\n'));
} else {
  console.log(`\nOK — les deux tables concordent, les ${rapport.nbFiches} fiches actives sont complètes`);
}

await browser.close();
process.exit(rapport.erreurs.length ? 1 : 0);
