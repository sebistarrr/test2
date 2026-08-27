// Banc de mesure d'un combattant, sans rendu : durée, touches et touches par
// seconde de chaque camp sur tout le roster.
//
// C'est le garde-fou chiffré du Hors-la-loi. La vidéo de référence montre sa
// stat « Damage » passer de 3,00 à 5,50 en 38,6 s, soit 25 coups au but,
// soit **0,65 coup/s** : c'est la seule mesure qui donne un budget de dégâts
// absolu, et elle dit de quel côté vient un déséquilibre.
//
//   node tools/probe.mjs outlaw
//
// Prérequis : un serveur statique sur $URL (defaut http://127.0.0.1:8085).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const URL = process.env.URL ?? 'http://127.0.0.1:8085';
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const who = process.argv[2] ?? 'outlaw';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(`${URL}/index.html?a=shadow&b=ice`, { waitUntil: 'networkidle' });
const out = await page.evaluate(async (who) => {
  const { Match } = await import('/src/game/match.js');
  const { createRng } = await import('/src/core/rng.js');
  const { ROSTER } = await import('/src/data/elements.js');
  const res = [];
  const dt = 1 / 120;
  for (const foe of ROSTER) {
    if (foe === who) continue;
    for (const seed of [11, 22, 33]) {
      const m = new Match({ elements: [who, foe], rng: createRng(seed), lang: 'ref', onEnd() {} });
      let t = 0;
      while (m.phase !== 'over' && t < 200) { m.update(dt); t += dt; }
      res.push({
        foe,
        seed,
        d: +m.stats.duration.toFixed(1),
        hits: m.stats.hits[0],
        dmg: m.stats.damage[0],
        stat: +m.a.stacks.toFixed(2),
        win: m.winner ? m.winner.el.id : 'timeout',
      });
    }
  }
  return res;
}, who);
let hits = 0, secs = 0;
for (const r of out) {
  console.log(
    String(r.foe).padEnd(11), 'seed', r.seed, 'durée', String(r.d).padStart(5),
    'touches', String(r.hits).padStart(3), `(${(r.hits / r.d).toFixed(2)}/s)`,
    'dégâts', String(r.dmg).padStart(4), 'stat', String(r.stat).padStart(5), r.win,
  );
  hits += r.hits; secs += r.d;
}
console.log(`\n${who} : ${(hits / secs).toFixed(2)} coup/s en moyenne sur ${out.length} duels`);
await browser.close();
