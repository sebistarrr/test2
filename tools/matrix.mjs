// Matrice d'équilibrage : 36 affrontements x 3 seeds, simulés SANS rendu.
// La sortie doit rester identique après tout changement purement visuel :
//   node tools/matrix.mjs > /tmp/apres.txt && diff /tmp/avant.txt /tmp/apres.txt
// Prérequis : un serveur statique sur $URL (defaut http://127.0.0.1:8085).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const URL = process.env.URL ?? "http://127.0.0.1:8085";
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await page.goto(`${URL}/index.html?a=shadow&b=ice`, { waitUntil: 'networkidle' });
const out = await page.evaluate(async () => {
  const { Match } = await import('/src/game/match.js');
  const { createRng } = await import('/src/core/rng.js');
  const { ROSTER } = await import('/src/data/elements.js');
  const res = [];
  const dt = 1/120;
  for (let i = 0; i < ROSTER.length; i++) {
    for (let j = i; j < ROSTER.length; j++) {
      const pair = [ROSTER[i], ROSTER[j]];
      const durations = []; const wins = {};
      for (const seed of [11, 22, 33]) {
        let m;
        try { m = new Match({ elements: pair, rng: createRng(seed), lang:'ref', onEnd(){} }); }
        catch (e) { res.push({ pair: pair.join(' vs '), error: String(e) }); continue; }
        let t = 0;
        try {
          while (m.phase !== 'over' && t < 200) { m.update(dt); t += dt; }
        } catch (e) { res.push({ pair: pair.join(' vs '), error: 'update: ' + String(e) }); break; }
        const w = m.winner ? m.winner.el.id : 'timeout';
        wins[w] = (wins[w] ?? 0) + 1;
        durations.push(+m.stats.duration.toFixed(1));
      }
      if (durations.length) res.push({ pair: pair.join(' vs '), durations, wins });
    }
  }
  return res;
});
for (const r of out) {
  if (r.error) console.log('ERREUR', r.pair, r.error);
  else console.log(r.pair.padEnd(26), 'durées', String(r.durations).padEnd(22), JSON.stringify(r.wins));
}
console.log('erreurs page:', errs.slice(0,5));
await browser.close();
