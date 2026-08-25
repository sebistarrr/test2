/**
 * Écran de sélection des combattants (DOM).
 *
 * Deux emplacements (gauche / droite) que l'on remplit avec les éléments du
 * roster. La fiche affichée sous les cartes est générée **depuis la fiche
 * gelée** : ce que l'on lit est exactement ce que le moteur applique.
 *
 * @module ui/select
 */

import { ELEMENTS, ROSTER } from '../data/elements.js';
import { PIXEL_MAPS } from '../data/pixelmaps.js';
import { compilePixelMap } from '../render/pixelart.js';

export function createSelectScreen({ root, onStart }) {
  const slots = {
    a: root.querySelector('#slot-a'),
    b: root.querySelector('#slot-b'),
  };
  const orbs = { a: root.querySelector('#orb-a'), b: root.querySelector('#orb-b') };
  const names = { a: root.querySelector('#name-a'), b: root.querySelector('#name-b') };
  const rosterEl = root.querySelector('#roster');
  const sheetEl = root.querySelector('#element-sheet');
  const startBtn = root.querySelector('#btn-start');

  /** @type {{a:string|null,b:string|null}} */
  const picks = { a: 'wolf', b: 'turtle' }; // duel par défaut : Traqueur contre Forteresse
  let active = 'a';

  // --- cartes du roster
  for (const id of ROSTER) {
    const el = ELEMENTS[id];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.style.setProperty('--accent', el.look.body);
    card.dataset.id = id;

    const cv = document.createElement('canvas');
    cv.width = 96;
    cv.height = 96;
    drawElementBadge(cv, el);

    const name = document.createElement('span');
    name.className = 'card-name';
    name.textContent = el.name;

    const role = document.createElement('span');
    role.className = 'card-role';
    role.textContent = el.tagline.split('—')[0].trim().toUpperCase();

    card.append(cv, name, role);
    card.setAttribute('aria-pressed', 'false');
    card.addEventListener('click', () => {
      picks[active] = id;
      active = active === 'a' ? 'b' : 'a';
      showSheet(id);
      refresh();
    });
    card.addEventListener('pointerenter', () => showSheet(id));
    card.addEventListener('focus', () => showSheet(id));
    rosterEl.append(card);
  }

  for (const key of ['a', 'b']) {
    slots[key].addEventListener('click', () => {
      active = key;
      refresh();
    });
  }

  startBtn.addEventListener('click', () => {
    if (!picks.a || !picks.b) return;
    onStart([picks.a, picks.b]);
  });

  function showSheet(id) {
    const el = ELEMENTS[id];
    const w = el.weapon;
    const melee = typeof w.melee.damage === 'function' ? 'pile courante' : `${w.melee.damage} PV`;
    sheetEl.hidden = false;
    sheetEl.style.setProperty('--accent', el.look.body);
    sheetEl.innerHTML = `
      <h3>${el.name}</h3>
      <dl>
        <dt>Rôle</dt><dd>${el.tagline}</dd>
        <dt>Vitesse</dt><dd>${el.movement.speed} px/s — virage ${el.movement.turnRate} rad/s</dd>
        <dt>Arme</dt><dd>${w.name} — portée ${w.reach} px, rotation ${(w.spin * 57.2958).toFixed(0)} °/s</dd>
        <dt>Corps à corps</dt><dd>${melee} toutes les ${w.melee.cooldown}s</dd>
        <dt>Pouvoir</dt><dd>${el.ability.name} — recharge ${el.ability.cooldown}s</dd>
        <dt>Ultime</dt><dd>${el.ultimate.name} — ${el.ultimate.duration}s</dd>
        <dt>Projectile</dt><dd>${projectileLine(el)}</dd>
      </dl>`;
  }

  function refresh() {
    for (const card of rosterEl.children) {
      const id = card.dataset.id;
      card.setAttribute('aria-pressed', String(id === picks.a || id === picks.b));
    }
    for (const key of ['a', 'b']) {
      const id = picks[key];
      const el = id ? ELEMENTS[id] : null;
      slots[key].setAttribute('aria-current', String(active === key));
      slots[key].style.setProperty('--accent', el ? el.look.body : '#000');
      // l'emplacement montre la bête choisie, plus de boule de couleur
      const octx = orbs[key].getContext('2d');
      octx.clearRect(0, 0, orbs[key].width, orbs[key].height);
      if (el) drawElementBadge(orbs[key], el);
      names[key].textContent = el ? el.name : '—';
    }
    startBtn.disabled = !picks.a || !picks.b;
  }

  refresh();
  showSheet(picks.a);

  return {
    show() { root.classList.remove('hidden'); refresh(); },
    hide() { root.classList.add('hidden'); },
    get picks() { return { ...picks }; },
  };
}

/** Ligne « Projectile » de la fiche — certains éléments n'en ont aucun. */
function projectileLine(el) {
  const list = Object.values(el.projectiles ?? {});
  if (!list.length) return 'aucun — tout passe par l’arme et les zones';
  return list.map((p) => `${p.label} — ${p.damage} PV, ${p.speed} px/s`).join(' · ');
}

/**
 * Sprite qui représente la bête. Le portrait 16×16 d'abord ; sans lui on
 * retombe sur son arme, son projectile, puis son icône — le Serpent n'a pas de
 * sprite d'arme (fouet courbe dessiné en tracé).
 */
function portraitKey(el) {
  return (
    el.portrait ?? el.weapon.head.sprite ?? Object.values(el.projectiles ?? {})[0]?.sprite ?? el.icon
  );
}

/**
 * Vignette d'une bête : **le portrait seul**, sans la boule de couleur.
 * L'identité colorée passe par le liseré de la carte (`--accent`), la
 * silhouette suffit à reconnaître l'animal.
 */
function drawElementBadge(canvas, el) {
  const ctx = canvas.getContext('2d');
  // lissé comme dans l'arène : la bête doit se reconnaître d'un écran à l'autre
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sprite = compilePixelMap(PIXEL_MAPS[portraitKey(el)], 2);
  // cadré dans la vignette avec une marge, ratio conservé
  const k = Math.min((canvas.width * 0.92) / sprite.width, (canvas.height * 0.92) / sprite.height);
  ctx.drawImage(
    sprite,
    (canvas.width - sprite.width * k) / 2,
    (canvas.height - sprite.height * k) / 2,
    sprite.width * k,
    sprite.height * k,
  );
}
