/**
 * Banc du son : **quelle action fait quel bruit, et combien de fois**.
 *
 * Le son n'a pas de garde-fou naturel — un bruitage qui ne part jamais ne
 * plante pas, ne s'affiche pas, et ne se voit pas dans une capture. C'est
 * exactement la forme de panne que `fiche-check` traque côté données ; ici, on
 * la traque en **jouant des duels entiers** et en comptant.
 *
 * Le compteur remplace `sfx.play` : il attrape donc aussi bien les appels
 * directs du moteur (`play`) que ceux qui passent par une fiche (`cast`), et il
 * mesure l'**intention**, pas la sortie audio — un navigateur sans geste
 * d'ouverture est muet, ce qui rendrait la mesure impossible autrement.
 *
 * **Deux passes**, parce que ce sont deux pannes différentes :
 *
 *   1. *l'intention* — des duels entiers, et le compte de ce qui part. Une
 *      action muette se voit ici, et nulle part ailleurs ;
 *   2. *la synthèse* — chaque recette du banc réellement montée dans un vrai
 *      `AudioContext`. Une valeur interdite (`exponentialRampToValueAtTime(0)`,
 *      une fréquence négative) **lève**, et ne lève que là : la première passe
 *      la laisserait passer sans rien voir.
 *
 *   node tools/sound-check.mjs
 *
 * Prérequis : un serveur statique sur $URL (défaut http://127.0.0.1:8085).
 * Le navigateur est lancé sans la règle du geste d'ouverture, sans quoi la
 * seconde passe n'aurait aucun contexte audio à instrumenter.
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const URL = process.env.URL ?? 'http://127.0.0.1:8085';
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(`${URL}/index.html`, { waitUntil: 'networkidle' });

const out = await page.evaluate(async () => {
  const { Match } = await import('/src/game/match.js');
  const { createRng } = await import('/src/core/rng.js');
  const { ROSTER, ELEMENTS } = await import('/src/data/elements.js');
  const { sfx } = await import('/src/render/audio.js');
  const { SOUNDS } = await import('/src/data/sound.js');

  /** @type {Map<string, number>} */
  const total = new Map();
  /** @type {Map<string, Set<string>>} par combattant, les recettes entendues */
  const parCombattant = new Map();
  const dits = [];
  let courant = null;

  sfx.play = (name, opts = {}) => {
    if (!name) return;
    total.set(name, (total.get(name) ?? 0) + 1);
    if (courant) {
      if (!parCombattant.has(courant)) parCombattant.set(courant, new Set());
      parCombattant.get(courant).add(name);
    }
    void opts;
  };
  sfx.say = (t) => { if (dits.length < 6) dits.push(t); };

  const dt = 1 / 120;
  const jouer = (a, b, limite) => {
    const m = new Match({ elements: [a, b], rng: createRng(7), lang: 'ref', onEnd() {} });
    let t = 0;
    while (m.phase !== 'over' && t < limite) { m.update(dt); t += dt; }
  };

  for (const id of ROSTER) {
    /**
     * **Chacun face au Mannequin, et c'est ce qui rend le relevé lisible.**
     * Le compteur ne sait pas *qui* joue une recette — il ne voit passer qu'un
     * nom — donc le seul moyen d'attribuer un son à un combattant est de le
     * mettre en face de quelqu'un qui n'en produit presque aucun. C'est
     * exactement le rôle du Mannequin à l'image, appliqué à l'oreille.
     *
     * Reste sa part à lui dans chaque ligne : `thud` (ses rebonds), `bump`
     * (les chocs de corps), `gong`, `ko` et `fanfare` (la ponctuation du duel).
     */
    courant = id;
    // le duel Mannequin contre Mannequin ne finit jamais (aucun des deux ne
    // fait de dégât) : 40 s suffisent à entendre tout ce qu'il sait faire
    jouer(id, 'dummy', id === 'dummy' ? 40 : 200);
  }
  courant = null;

  // puis tout le monde contre tout le monde, sans attribution : c'est le
  // total qui compte ici, et notamment ce qui ne sort jamais
  for (let i = 0; i < ROSTER.length; i++) {
    for (let j = i + 1; j < ROSTER.length; j++) jouer(ROSTER[i], ROSTER[j], 200);
  }

  // couverture : une recette du banc que personne ne joue est du poids mort
  const jamais = Object.keys(SOUNDS).filter((k) => !total.has(k));
  // et un combattant qui n'aurait aucun son serait muet sans que rien ne crie
  const muets = ROSTER.filter((id) => !(parCombattant.get(id)?.size));

  return {
    total: [...total.entries()].sort((a, b) => b[1] - a[1]),
    parCombattant: ROSTER.map((id) => [id, [...(parCombattant.get(id) ?? [])].sort()]),
    fiches: ROSTER.map((id) => [id, ELEMENTS[id].sound ? 'ok' : 'PAS DE BLOC sound']),
    jamais,
    muets,
    dits,
  };
});

/* ------------------------------------------------------------------ */
/*  Passe 2 : la synthèse elle-même                                     */
/* ------------------------------------------------------------------ */

const synthese = await page.evaluate(async () => {
  // page neuve : `sfx.play` n'est plus remplacé par le compteur
  const { sfx } = await import('/src/render/audio.js?passe2');
  const { SOUNDS } = await import('/src/data/sound.js');
  if (!sfx.unlock()) return { ouvert: false, pannes: [], voix: 0 };

  const pannes = [];
  let voix = 0;
  for (const nom of Object.keys(SOUNDS)) {
    /**
     * **La liste des voix est vidée à chaque recette.** Rien ici n'attend la
     * fin d'un son et l'horloge du contexte n'avance pas pendant une boucle
     * synchrone : aucune échéance ne passe, donc le plafond de `MIX.maxVoices`
     * serait atteint dès la sixième recette et le banc dirait « aucune voix
     * montée » sur des recettes parfaitement saines. Ce plafond est un
     * garde-fou de mixage, pas ce qu'on mesure ici.
     */
    sfx.busy.length = 0;
    try {
      // `repeatGap` refuserait la même recette deux fois de suite, jamais deux
      // recettes différentes : une passe suffit
      sfx.play(nom, { x: 300 + Math.random() * 100, pitch: 0.72 });
      if (sfx.voices === 0) pannes.push(`${nom} : aucune voix montée`);
      voix += sfx.voices;
    } catch (e) {
      pannes.push(`${nom} : ${e.message}`);
    }
  }
  // et la transposition extrême de l'autre bout du roster. Le garde-fou de
  // répétition refuserait ce second tour (les mêmes noms, la même poignée de
  // millisecondes) : on l'oublie explicitement, c'est un banc, pas un duel.
  sfx.last.clear();
  for (const nom of Object.keys(SOUNDS)) {
    sfx.busy.length = 0;
    try {
      sfx.play(nom, { pitch: 1.2 });
    } catch (e) {
      pannes.push(`${nom} (pitch 1,2) : ${e.message}`);
    }
  }
  return { ouvert: true, pannes, voix, etat: sfx.ctx.state, taux: sfx.ctx.sampleRate };
});

console.log('recettes jouées (chacun contre le Mannequin, puis toutes les paires) :');
for (const [nom, n] of out.total) console.log(`  ${nom.padEnd(10)} ${String(n).padStart(5)}`);

console.log('\npar combattant :');
for (const [id, sons] of out.parCombattant) console.log(`  ${id.padEnd(10)} ${sons.join(', ') || '—'}`);

console.log('\nblocs `sound` des fiches :');
for (const [id, etat] of out.fiches) console.log(`  ${id.padEnd(10)} ${etat}`);

console.log('\nannonces parlées (échantillon) :');
for (const d of out.dits) console.log(`  « ${d} »`);

console.log('\nsynthèse (vrai AudioContext) :');
if (!synthese.ouvert) {
  console.log('  aucun contexte audio disponible dans ce navigateur');
} else {
  console.log(`  contexte ${synthese.etat}, ${synthese.taux} Hz — ${synthese.voix} voix montées`);
  for (const p of synthese.pannes) console.log(`  ✗ ${p}`);
}

const soucis = [];
if (out.muets.length) soucis.push(`combattants muets : ${out.muets.join(', ')}`);
if (!synthese.ouvert) soucis.push("aucun contexte audio : la passe de synthèse n'a rien vérifié");
if (synthese.pannes?.length) soucis.push(`recettes en panne : ${synthese.pannes.join(' | ')}`);
if (out.jamais.length) soucis.push(`recettes jamais jouées : ${out.jamais.join(', ')}`);
if (errs.length) soucis.push(`erreurs page : ${errs.slice(0, 5).join(' | ')}`);

if (soucis.length) {
  console.error('\n' + soucis.map((s) => `✗ ${s}`).join('\n'));
} else {
  console.log('\nOK — aucun combattant muet, aucune recette morte, aucune erreur de page');
}

await browser.close();
process.exit(soucis.length ? 1 : 0);
