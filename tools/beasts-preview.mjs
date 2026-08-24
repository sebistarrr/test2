/**
 * Planche de contrôle du roster « Bêtes Spirituelles ».
 *
 * Valide chaque pixelmap (dimensions, caractères couverts par la palette) puis
 * rend une planche PNG sur le fond réel du jeu (#1c1a26) — le seul moyen de
 * vérifier que les liserés détachent bien les silhouettes sombres du fond.
 *
 * Encodeur PNG maison : le dépôt n'a aucune dépendance, `zlib` suffit.
 *
 *   node tools/beasts-preview.mjs [sortie.png]
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { SPIRIT_BEASTS } from '../src/data/pixelmaps.js';

const BG = [0x1c, 0x1a, 0x26]; // fond de scène
const BG_LIGHT = [0xf4, 0xf0, 0xe4]; // arène claire : contrôle du contraste inverse

/* ---------------- encodeur PNG ---------------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgb) {
  const raw = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0; // filtre « None »
    rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits par canal
  ihdr[9] = 2; // truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------------- toile ---------------- */

function hex(c) {
  const m = /^#([0-9a-f]{6})$/i.exec(c);
  if (!m) throw new Error(`couleur invalide : ${c}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function makeCanvas(w, h) {
  const buf = Buffer.alloc(w * h * 3);
  return {
    w,
    h,
    buf,
    fill(x0, y0, x1, y1, [r, g, b]) {
      for (let y = Math.max(0, y0); y < Math.min(h, y1); y++) {
        for (let x = Math.max(0, x0); x < Math.min(w, x1); x++) {
          const i = (y * w + x) * 3;
          buf[i] = r;
          buf[i + 1] = g;
          buf[i + 2] = b;
        }
      }
    },
  };
}

/** Dessine une pixelmap texte, un caractère = `scale` px. */
function blit(cv, rows, palette, ox, oy, scale) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      cv.fill(ox + x * scale, oy + y * scale, ox + (x + 1) * scale, oy + (y + 1) * scale, hex(palette[ch]));
    }
  });
}

/* ---------------- validation ---------------- */

let erreurs = 0;

function valider(nom, rows, palette, attendu) {
  const h = rows.length;
  const w = rows[0].length;
  if (attendu && (w !== attendu || h !== attendu)) {
    console.error(`✗ ${nom} : ${w}×${h}, attendu ${attendu}×${attendu}`);
    erreurs++;
  }
  rows.forEach((row, i) => {
    if (row.length !== w) {
      console.error(`✗ ${nom} ligne ${i} : ${row.length} caractères au lieu de ${w}`);
      erreurs++;
    }
    for (const ch of row) {
      if (ch !== '.' && ch !== ' ' && !palette[ch]) {
        console.error(`✗ ${nom} ligne ${i} : caractère « ${ch} » absent de la palette`);
        erreurs++;
      }
    }
  });
  // toute lettre déclarée doit servir : une palette morte cache une faute de frappe
  for (const ch of Object.keys(palette)) {
    if (!rows.some((r) => r.includes(ch))) return { w, h, unused: ch };
  }
  return { w, h };
}

/* ---------------- planche ---------------- */

const beasts = Object.entries(SPIRIT_BEASTS);
const SCALE = 7;
const PAD = 10;
const CELL = 16 * SCALE + PAD * 2; // gabarit sur le plus grand sprite (16×16)
const COLS = 4; // sprite sombre | sprite clair | projectile | icône
const W = CELL * COLS;
const H = CELL * beasts.length;

const cv = makeCanvas(W, H);
cv.fill(0, 0, W, H, BG);

beasts.forEach(([cle, bete], i) => {
  const y = i * CELL;
  // colonne 2 : même sprite sur l'arène claire (le contour noir doit tenir aussi)
  cv.fill(CELL, y, CELL * 2, y + CELL, BG_LIGHT);
  // séparateur discret entre bêtes
  cv.fill(0, y, W, y + 1, [0x2e, 0x2b, 0x3a]);

  const centre = (rows) => Math.round((CELL - rows[0].length * SCALE) / 2);
  const centreV = (rows) => Math.round((CELL - rows.length * SCALE) / 2);

  blit(cv, bete.sprite, bete.palette, centre(bete.sprite), y + centreV(bete.sprite), SCALE);
  blit(cv, bete.sprite, bete.palette, CELL + centre(bete.sprite), y + centreV(bete.sprite), SCALE);
  blit(cv, bete.projectile, bete.palette, CELL * 2 + centre(bete.projectile), y + centreV(bete.projectile), SCALE);
  blit(cv, bete.icon, bete.palette, CELL * 3 + centre(bete.icon), y + centreV(bete.icon), SCALE);

  const s = valider(`${cle}.sprite`, bete.sprite, bete.palette, 16);
  const p = valider(`${cle}.projectile`, bete.projectile, bete.palette, 8);
  const ic = valider(`${cle}.icon`, bete.icon, bete.palette, 8);
  console.log(`  ${cle.padEnd(8)} sprite ${s.w}×${s.h}  projectile ${p.w}×${p.h}  icône ${ic.w}×${ic.h}`);
});

const out = process.argv[2] ?? 'docs/roster-beasts.png';
writeFileSync(out, encodePng(W, H, cv.buf));
console.log(erreurs ? `\n${erreurs} erreur(s)` : `\nOK — planche écrite dans ${out}`);
process.exit(erreurs ? 1 : 0);
