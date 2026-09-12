// Les écrans DOM tiennent-ils dans la scène ?
//
//   node tools/layout-check.mjs
//
// Prérequis : un serveur statique sur $URL (défaut http://127.0.0.1:8085).
//
// **Pourquoi un outil et pas un œil.** L'écran de sélection a débordé sa boîte
// pendant toute la vie du dépôt sans qu'aucune capture ne le dise : `#app` garde
// le ratio 720/1280 et toutes les tailles sont en `cqw`, donc le débordement est
// **proportionnel** — il est le même sur un iPhone 16 Pro (boîte 402 × 715) que
// sur un 1280 × 800 (450 × 800), et il ne se voyait qu'à moitié, le titre
// passant *au-dessus* du bord haut (`justify-content: center` déborde des deux
// côtés) pendant que le bouton de départ passait sous le bord bas.
//
// On mesure donc la **pile réelle** — haut du premier bloc visible, bas du
// dernier, `padding` compris — et non `scrollHeight`, qui ne compte pas le
// dépassement par le haut. Le balayage couvre ce qui fait varier la hauteur :
// les quatre formats, les tailles réglables, et la **fiche affichée**, dont le
// nombre de lignes dépend du combattant survolé.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const URL = process.env.URL ?? 'http://127.0.0.1:8085';
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// Marge de sécurité : une police de repli un peu plus haute ne doit pas suffire
// à refaire déborder la pile.
const MARGE = Number(process.env.MARGE ?? 12);

// L'iPhone 16 Pro en portrait — la contrainte la plus serrée des appareils
// visés, et celle qui a motivé la passe de compacité. Le ratio de `#app` étant
// fixe, un seul viewport suffit à conclure pour tous : il est ici le témoin.
const VIEWPORT = { width: 402, height: 874 };

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });
const erreurs = [];
page.on('pageerror', (e) => erreurs.push(String(e)));

await page.goto(`${URL}/index.html`, { waitUntil: 'networkidle' });
// les polices décident de la hauteur des blocs : mesurer avant leur chargement
// rendrait une pile plus courte que la vraie
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);

/** Hauteur de la pile d'un écran, `padding` compris. */
const pile = (sel) =>
  page.evaluate((s) => {
    const ecran = document.querySelector(s);
    const blocs = [...ecran.children].filter((e) => e.getBoundingClientRect().height > 0);
    const st = getComputedStyle(ecran);
    const pad = parseFloat(st.paddingTop) + parseFloat(st.paddingBottom);
    const haut = blocs[0].getBoundingClientRect().top;
    const bas = blocs.at(-1).getBoundingClientRect().bottom;
    return { h: bas - haut + pad, boite: ecran.clientHeight };
  }, sel);

const lignes = [];
let pireGlobal = 0;

// --- écran de sélection : formats × tailles × fiche affichée
const clic = (sel) => page.$eval(sel, (b) => b.click());
for (const mode of ['duel', 'teams', 'solo', 'royale']) {
  await clic(`[data-mode="${mode}"]`);
  const reglable = await page.$eval('#fighter-count', (e) => !e.hidden);
  const tailles = reglable ? [3, 4, 5] : [0];
  for (const n of tailles) {
    if (n) {
      // on redescend au plancher avant de remonter : les bornes sont dans
      // `select.js`, l'outil n'a pas à les connaître
      for (let i = 0; i < 5; i++) await clic('#size-less');
      for (let i = 3; i < n; i++) await clic('#size-more');
    }
    let pire = { h: 0, id: '' };
    for (const carte of await page.$$('.card')) {
      await carte.dispatchEvent('pointerenter');
      const { h, boite } = await pile('#screen-select');
      if (h > pire.h) pire = { h, boite, id: await carte.evaluate((c) => c.dataset.id) };
    }
    pireGlobal = Math.max(pireGlobal, pire.h);
    lignes.push([`select ${mode}${n ? ` × ${n}` : ''}`, pire, pire.id]);
  }
}

// --- écran de fin : le classement le plus long, l'export affiché
await page.evaluate(() => {
  document.getElementById('screen-select').classList.add('hidden');
  const r = document.getElementById('screen-result');
  r.classList.remove('hidden');
  const ol = document.getElementById('result-standings');
  ol.hidden = false;
  ol.innerHTML = '<li></li>'.repeat(5);
  document.getElementById('btn-export').hidden = false;
  const note = document.getElementById('result-export-note');
  note.hidden = false;
  note.textContent = 'x'.repeat(80);
});
lignes.push(['result (5 au classement)', await pile('#screen-result'), '']);

let ko = 0;
for (const [quoi, { h, boite }, fiche] of lignes) {
  const reste = boite - h;
  const etat = reste < 0 ? 'DÉBORDE' : reste < MARGE ? 'JUSTE' : 'ok';
  if (reste < MARGE) ko++;
  const suffixe = fiche ? `  (pire fiche : ${fiche})` : '';
  console.log(`${etat.padEnd(8)} ${quoi.padEnd(26)} ${h.toFixed(1)} / ${boite} px — reste ${reste.toFixed(1)}${suffixe}`);
}
if (erreurs.length) console.log(`\nErreurs de page :\n  ${erreurs.join('\n  ')}`);

await browser.close();
if (ko || erreurs.length) {
  console.error(`\n${ko} écran(s) sans les ${MARGE} px de marge attendus.`);
  process.exit(1);
}
console.log(`\nTout tient : pile la plus haute ${pireGlobal.toFixed(1)} px.`);
