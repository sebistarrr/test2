// Captures d'écran du jeu, avec possibilité de déclencher un pouvoir.
//
//   node tools/shot.mjs "?a=wind&b=plant&seed=5" out/ 3,9,20
//   FORCE=plant:ult node tools/shot.mjs "?a=wind&b=plant" out/ 8
//
// FORCE accepte, séparés par des virgules :
//   <element>:ult      charge l'ultime à 100 %
//   <element>:power    remet le pouvoir courant à zéro (rafale, semis…)
// La capture suit 0,8 s après le déclenchement.
//
// Prérequis : un serveur statique sur $URL (defaut http://127.0.0.1:8085).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const URL = process.env.URL ?? 'http://127.0.0.1:8085';
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const query = process.argv[2] ?? '';
const outDir = process.argv[3] ?? 'shots';
const times = (process.argv[4] ?? '5').split(',').map(Number);
const force = (process.env.FORCE ?? '').split(',').filter(Boolean);

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 405, height: 720 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(`${URL}/index.html${query}`, { waitUntil: 'networkidle' });

let prev = 0;
for (const t of times) {
  await page.waitForTimeout(Math.max(0, t - prev) * 1000);
  prev = t;
  for (const spec of force) {
    const [id, what] = spec.split(':');
    await page.evaluate(
      ([id, what]) => {
        const f = globalThis.__match?.fighters.find((x) => x.el.id === id);
        if (!f) return;
        if (what === 'ult') f.ult.charge = 100;
        if (what === 'power') f.ability.timer = 0.02;
      },
      [id, what],
    );
    await page.waitForTimeout(800);
    prev += 0.8;
  }
  const name = `${outDir}/t${String(t).padStart(3, '0')}.png`;
  await page.screenshot({ path: name });
  console.log(name);
}
console.log(errors.length ? `ERREURS ${JSON.stringify(errors)}` : 'aucune erreur console');
await browser.close();
