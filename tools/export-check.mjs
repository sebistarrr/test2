/**
 * Banc de l'export : **le fichier téléchargé porte-t-il vraiment le son ?**
 *
 * Le piège que cet outil couvre est le pire de tous ceux du son, parce qu'il ne
 * se découvre qu'**après publication** : une piste audio peut être présente
 * dans le flux, le MIME peut la déclarer, et le fichier être muet quand même —
 * un conteneur dont le MIME ne nomme aucun codec audio en est l'exemple. Rien
 * ne le dit à l'écran, rien ne plante, et la vidéo est déjà en ligne.
 *
 * **Deux preuves, parce que la première ne suffit pas :**
 *
 *   1. le fichier est relu par un `<video>`, et on lit
 *      `webkitAudioDecodedByteCount` — zéro octet décodé = pas d'audio dans le
 *      conteneur, quoi qu'en disent le MIME et les pistes ;
 *   2. le fichier est **redécodé en PCM** et son niveau mesuré. Un encodeur à
 *      débit constant produit à peu près autant d'octets pour du silence que
 *      pour un duel entier : le compte d'octets prouve l'existence de la piste,
 *      **pas son contenu**. C'est le RMS qui distingue le son du silence.
 *
 * **Deux duels sont filmés**, et le second est le plus intéressant : son coupé.
 * Le graphe de `render/audio.js` prend la piste d'enregistrement **avant** le
 * robinet des enceintes, donc regarder en silence doit quand même produire une
 * vidéo sonore. C'est un comportement décidé, donc un comportement à mesurer.
 *
 *   node tools/export-check.mjs
 *
 * Prérequis : un serveur statique sur $URL (défaut http://127.0.0.1:8085).
 * Le navigateur est lancé sans la règle du geste d'ouverture : le clic de
 * Playwright en est un vrai, mais le contexte audio doit pouvoir démarrer sans
 * périphérique de sortie.
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const URL = process.env.URL ?? 'http://127.0.0.1:8085';
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

/** Filme un duel abrégé et rend tout ce qu'on sait du fichier produit. */
async function filmer({ muet }) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(`${URL}/index.html`, { waitUntil: 'networkidle' });

  // Couper le son **avant** le duel : c'est le cas qui doit quand même donner
  // une vidéo sonore.
  if (muet) await page.click('#btn-sound');

  // Le duel se lance au clic, comme un joueur le ferait : c'est ce geste qui
  // ouvre le contexte audio, donc lui qui décide si l'export aura du son.
  await page.click('#btn-start');
  await page.waitForTimeout(5000);

  // on abrège : un coup fatal, puis le K.O., la parade et l'assemblage du fichier
  await page.evaluate(() => {
    const m = globalThis.__match;
    m.damage(m.b, 9999, m.a, { kind: 'melee', x: m.b.x, y: m.b.y });
  });
  await page.waitForTimeout(6000);

  const rapport = await page.evaluate(async () => {
    const rec = globalThis.__recorder;
    const blob = rec.blob;
    if (!blob) return { erreur: 'aucun fichier produit' };

    const video = document.createElement('video');
    video.muted = true;
    video.src = URL.createObjectURL(blob);
    document.body.append(video);
    await new Promise((ok) => {
      video.onloadeddata = ok;
      video.onerror = ok;
      setTimeout(ok, 4000);
    });
    try {
      await video.play();
    } catch {
      /* la lecture n'est pas indispensable au décodage des premières images */
    }
    await new Promise((ok) => setTimeout(ok, 2500));

    const out = {
      mime: rec.mimeType,
      extension: rec.extension,
      pistesAudio: rec.hasAudio,
      taille: blob.size,
      duree: Number.isFinite(video.duration) ? +video.duration.toFixed(1) : null,
      octetsAudio: video.webkitAudioDecodedByteCount ?? null,
      octetsVideo: video.webkitVideoDecodedByteCount ?? null,
      note: document.querySelector('#result-export-note')?.textContent ?? '',
      coupe: globalThis.__sfx.muted,
    };
    video.remove();

    try {
      const ctx = new AudioContext();
      const pcm = await ctx.decodeAudioData(await blob.arrayBuffer());
      const d = pcm.getChannelData(0);
      let somme = 0;
      let crete = 0;
      for (let i = 0; i < d.length; i++) {
        somme += d[i] * d[i];
        if (Math.abs(d[i]) > crete) crete = Math.abs(d[i]);
      }
      out.canaux = pcm.numberOfChannels;
      out.rms = +Math.sqrt(somme / d.length).toFixed(5);
      out.crete = +crete.toFixed(4);
      ctx.close();
    } catch (e) {
      out.rms = null;
      out.decodage = String(e);
    }
    return out;
  });

  await page.close();
  return { rapport, errs };
}

const soucis = [];

for (const muet of [false, true]) {
  const titre = muet ? 'son coupé pendant le duel' : 'son actif';
  const { rapport, errs } = await filmer({ muet });
  console.log(`\n=== ${titre} ===`);
  for (const [k, v] of Object.entries(rapport)) console.log(`  ${k.padEnd(12)} ${v}`);

  const dit = (m) => soucis.push(`[${titre}] ${m}`);
  if (rapport.erreur) dit(rapport.erreur);
  if (!rapport.pistesAudio) dit("le flux filmé n'a pas de piste audio");
  if (!rapport.octetsAudio) dit('aucun octet audio décodé : le fichier est muet');
  if (rapport.rms === null) dit(`le fichier ne se redécode pas en PCM : ${rapport.decodage}`);
  else if (rapport.rms < 0.001) dit(`piste présente mais silencieuse (RMS ${rapport.rms})`);
  if (!rapport.octetsVideo) dit('aucun octet vidéo décodé : le fichier est illisible');
  if (muet && !rapport.coupe) dit("le bouton de coupure n'a pas pris");
  if (errs.length) dit(`erreurs page : ${errs.slice(0, 3).join(' | ')}`);
}

if (soucis.length) console.error('\n' + soucis.map((s) => `✗ ${s}`).join('\n'));
else console.log('\nOK — les deux exports sonnent, coupure des enceintes comprise');

await browser.close();
process.exit(soucis.length ? 1 : 0);
