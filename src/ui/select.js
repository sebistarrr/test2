/**
 * Écran de sélection des combattants (DOM).
 *
 * Deux emplacements (gauche / droite) que l'on remplit avec les éléments du
 * roster. La fiche affichée sous les cartes est générée **depuis la fiche
 * gelée** : ce que l'on lit est exactement ce que le moteur applique.
 *
 * @module ui/select
 */

import { ELEMENTS, PLAYABLE } from '../data/elements.js';
import { UI, label } from './lang.js';
import { PIXEL_MAPS } from '../data/pixelmaps.js';
import { compilePixelMap } from '../render/pixelart.js';
import { TAU } from '../core/math.js';

export function createSelectScreen({ root, onStart, lang = 'ref' }) {
  const t = UI[lang] ?? UI.ref;
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
  // Duel par défaut. Il se prend dans `PLAYABLE` et non en dur : avec un
  // roster réduit, un défaut codé en dur pointerait sur une carte absente de
  // la grille, et l'écran s'ouvrirait sur une sélection impossible à défaire.
  const picks = { a: PLAYABLE[0], b: PLAYABLE[1] ?? PLAYABLE[0] };
  let active = 'a';

  // --- cartes du roster
  for (const id of PLAYABLE) {
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
    name.textContent = label(el, lang);

    const role = document.createElement('span');
    role.className = 'card-role';
    role.textContent = tagline(el, lang).split('—')[0].trim().toUpperCase();

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
    // les dégâts peuvent être une fonction de la pile courante : affichés tels
    // quels, ils imprimaient le code source dans la fiche
    const dmg = typeof w.melee.damage === 'function' ? t.meleeStack : t.meleeHp(w.melee.damage);
    // un pouvoir sans recharge finie est un passif (la Furie du lancier du
    // Dragoon : elle ne se déclenche pas, elle monte à chaque touche)
    const ability = Number.isFinite(el.ability.cooldown)
      ? t.abilityLine(label(el.ability, lang), el.ability.cooldown)
      : t.abilityPassive(label(el.ability, lang));
    // troisième créneau de pouvoir, porté par les deux invités seulement :
    // une fiche sans `special` ne doit pas trouer la liste
    const special = el.special
      ? t.specialLine(label(el.special, lang), el.special.duration, el.special.cooldown)
      : t.specialNone;
    sheetEl.hidden = false;
    sheetEl.style.setProperty('--accent', el.look.body);
    sheetEl.innerHTML = `
      <h3>${label(el, lang)}</h3>
      <dl>
        <dt>${t.sheetRole}</dt><dd>${tagline(el, lang)}</dd>
        <dt>${t.sheetSpeed}</dt><dd>${t.speedLine(el.movement.speed, el.movement.turnRate)}</dd>
        <dt>${t.sheetWeapon}</dt><dd>${t.weaponLine(label(w, lang), w.reach, spinLine(w, t))}</dd>
        <dt>${t.sheetMelee}</dt><dd>${t.meleeLine(dmg, w.melee.cooldown)}</dd>
        <dt>${t.sheetAbility}</dt><dd>${ability}</dd>
        <dt>${t.sheetUltimate}</dt><dd>${t.ultimateLine(label(el.ultimate, lang), el.ultimate.duration)}</dd>
        <dt>${t.sheetSpecial}</dt><dd>${special}</dd>
        <dt>${t.sheetProjectile}</dt><dd>${projectileLine(el, t, lang)}</dd>
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
      names[key].textContent = el ? label(el, lang) : '—';
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
 * Rôle du combattant, dans la langue de l'écran. Les fiches portent les deux :
 * `tagline` en français, `taglineRef` en anglais.
 */
function tagline(el, lang) {
  return lang === 'fr' ? el.tagline : el.taglineRef ?? el.tagline;
}

/**
 * Ligne « rotation » de la fiche.
 * Une arme à `spin: 0` n'est pas une arme immobile : son angle est piloté par
 * son module de pouvoirs. Afficher « rotation 0 °/s » se lisait comme un bug.
 *
 * Le libellé dit « son angle est piloté » et **pas** « braquée sur la cible » :
 * les deux armes à `spin: 0` ne visent pas la même chose. Le revolver du
 * Hors-la-loi suit son adversaire à chaque image, la lance du Lancier suit son
 * **cap de déplacement** — c'est tout le relevé du personnage. L'ancien libellé
 * était donc devenu faux pour la moitié des armes concernées, et ça ne s'est vu
 * qu'en réduisant le roster au seul Lancier, où sa fiche passe au premier plan.
 */
function spinLine(w, t) {
  if (!w.spin) return t.spinNone;
  return t.spinLine((w.spin * 57.2958).toFixed(0));
}

/**
 * Ligne « Projectile » de la fiche — certains éléments n'en ont aucun, et les
 * dégâts peuvent être une fonction de la pile courante (la balle du
 * Hors-la-loi porte sa stat « Damage », comme son coup à bout portant).
 *
 * **Cette ligne restait en anglais en mode français, pour les onze
 * combattants** : elle lisait `labelRef` sans regarder la langue. Dernier
 * reste de la demi-traduction déjà corrigée ailleurs, et le seul endroit du
 * dépôt où le couple des deux langues s'appelle `label`/`labelRef` au lieu de
 * `name`/`nameRef` — d'où l'aide `label()` qui ne pouvait pas le voir.
 */
function projectileLine(el, t, lang) {
  const list = Object.values(el.projectiles ?? {});
  if (!list.length) return t.projectileNone;
  return list
    .map((p) => {
      const dmg = typeof p.damage === 'function' ? t.meleeStack : t.meleeHp(p.damage);
      const name = lang === 'fr' ? p.label ?? p.labelRef : p.labelRef ?? p.label;
      return t.projectileLine(name, dmg, p.speed);
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
