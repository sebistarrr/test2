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
import { TAU } from '../core/math.js';

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
  const picks = { a: 'shadow', b: 'ice' }; // duel par défaut : celui de la vidéo
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
        <dt>Arme</dt><dd>${w.name} — portée ${w.reach} px, ${spinLine(w)}</dd>
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
      orbs[key].style.background = el ? el.look.body : '#e6e6e6';
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

/**
 * Ligne « rotation » de la fiche.
 * Une arme à `spin: 0` n'est pas une arme immobile : elle est braquée par son
 * module de pouvoirs (le revolver du Hors-la-loi suit sa cible à chaque image).
 * Afficher « rotation 0 °/s » se lisait comme un bug.
 */
function spinLine(w) {
  if (!w.spin) return 'arme braquée, sans rotation propre';
  return `rotation ${(w.spin * 57.2958).toFixed(0)} °/s`;
}

/**
 * Ligne « Projectile » de la fiche — certains éléments n'en ont aucun, et les
 * dégâts peuvent être une fonction de la pile courante (la balle du
 * Hors-la-loi porte sa stat « Damage », comme son coup à bout portant).
 */
function projectileLine(el) {
  const list = Object.values(el.projectiles ?? {});
  if (!list.length) return 'aucun — tout passe par l’arme et les zones';
  return list
    .map((p) => {
      const dmg = typeof p.damage === 'function' ? 'pile courante' : `${p.damage} PV`;
      return `${p.label} — ${dmg}, ${p.speed} px/s`;
    })
    .join(' · ');
}

/** Vignette : la boule de l'élément + la tête de son arme. */
function drawElementBadge(canvas, el) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const cx = canvas.width * 0.42;
  const cy = canvas.height / 2;
  const r = canvas.width * 0.3;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fillStyle = el.look.body;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = el.look.outline;
  ctx.stroke();

  // certaines armes n'ont pas de sprite (liane courbe dessinée en tracé) :
  // on retombe alors sur le projectile, puis sur l'icône de l'élément
  const key =
    el.weapon.head.sprite ?? Object.values(el.projectiles ?? {})[0]?.sprite ?? el.icon;
  const sprite = compilePixelMap(PIXEL_MAPS[key], 3);
  // la tête d'arme est cadrée dans la place restante, ratio conservé
  const availW = canvas.width - (cx + r * 0.6);
  const availH = canvas.height * 0.62;
  const k = Math.min(availW / sprite.width, availH / sprite.height);
  ctx.drawImage(sprite, cx + r * 0.6, cy - (sprite.height * k) / 2, sprite.width * k, sprite.height * k);
}
