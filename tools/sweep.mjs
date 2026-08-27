import { chromium } from 'playwright';
const port = process.argv[2] || '8086';
const seeds = (process.argv[3] || '3,7,12,21,42,55,88,101').split(',');
const secs = Number(process.argv[4] || 60);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const rows = [];
for (const seed of seeds) {
  const p = await b.newPage({ viewport: { width: 576, height: 1024 }, deviceScaleFactor: 1 });
  await p.route('**fonts.googleapis.com**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  p.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await p.goto(`http://localhost:${port}/index.html?seed=${seed}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  await p.evaluate(() => {
    const d = globalThis.__duel;
    globalThis.__S = { end: null, rushes: [], cur: null, shots: 0, hits: 0, oMax: 0 };
    const S = globalThis.__S;
    const origFire = d.fire.bind(d);
    d.fire = () => { if (!S.end) S.shots++; return origFire(); };
    const origHit = d.onBulletHit.bind(d);
    d.onBulletHit = (bd) => { const before = d.blade.hp; origHit(bd); if (!S.end && d.blade.hp < before) S.hits++; };
    const orig = d.step.bind(d);
    d.step = () => {
      orig();
      const sp = Math.hypot(d.outlaw.body.velocity.x, d.outlaw.body.velocity.y) * 60;
      S.oMax = Math.max(S.oMax, sp);
      if (S.end) return;
      if (d.rushOn && !S.cur) S.cur = { hp0: d.outlaw.hp, t0: d.time };
      if (!d.rushOn && S.cur) { S.rushes.push(+(S.cur.hp0 - d.outlaw.hp).toFixed(0)); S.cur = null; }
      if (d.over && !S.end) S.end = { t: +(d.time / 1000).toFixed(1), w: d.winner, dmg: +d.outlaw.dmg.toFixed(2) };
    };
  });
  await p.waitForTimeout(secs * 1000);
  rows.push({ seed, ...(await p.evaluate(() => {
    const S = globalThis.__S;
    return { fin: S.end, rushes: S.rushes.filter(x => x >= 0), shots: S.shots, hits: S.hits, oMax: Math.round(S.oMax) };
  })) });
  await p.close();
}
const done = rows.filter(r => r.fin);
const win = {};
for (const r of done) win[r.fin.w] = (win[r.fin.w] || 0) + 1;
for (const r of rows) {
  const f = r.fin;
  console.log(`seed ${String(r.seed).padEnd(4)} ${f ? (f.t + 's').padEnd(7) : '>' + secs + 's  '} ${(f ? f.w : '-').padEnd(10)} ruees ${JSON.stringify(r.rushes)} | tirs ${r.shots} touches ${r.hits} Damage ${f ? f.dmg : '-'} | pic ${r.oMax}px/s`);
}
const ts = done.map(r => r.fin.t).sort((a, b) => a - b);
const med = ts.length ? ts[Math.floor(ts.length / 2)] : NaN;
const accs = done.map(r => r.hits / r.fin.t);
console.log(`\nbilan ${JSON.stringify(win)} | duree mediane ${med}s (video 38,6 s)`);
console.log(`precision ${accs.map(a => a.toFixed(2)).join(' ')} coups/s (video 0,65)`);
await b.close();
