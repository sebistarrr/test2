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
import { MATCH } from '../data/tuning.js';
import { UI, label } from './lang.js';
import { PIXEL_MAPS } from '../data/pixelmaps.js';
import { compilePixelMap } from '../render/pixelart.js';
import { TAU } from '../core/math.js';

export function createSelectScreen({ root, onStart, lang = 'ref' }) {
  const t = UI[lang] ?? UI.ref;
  const slotsEl = root.querySelector('#slots');
  const modesEl = root.querySelector('#modes');
  const sizeEl = root.querySelector('#royale-size');
  const sizeLabel = root.querySelector('#size-label');
  const rosterEl = root.querySelector('#roster');
  const sheetEl = root.querySelector('#element-sheet');
  const startBtn = root.querySelector('#btn-start');

  /**
   * **Formats.** `duel` est le duel d'origine ; `teams` forme deux camps de
   * deux ; `royale` met 3 à 5 combattants chacun pour soi. Le nombre
   * d'emplacements et leur groupement en découlent — c'est la seule chose que
   * le format décide ici, le moteur ne connaissant, lui, que des camps.
   */
  const FORMATS = {
    duel: { taille: 2, camps: () => [0, 1] },
    teams: { taille: 4, camps: () => [0, 0, 1, 1] },
    royale: { taille: 4, min: 3, max: Math.min(5, ROSTER.length), camps: (n) => ROSTER.slice(0, n).map((_, i) => i) },
  };
  let mode = 'duel';
  let taille = FORMATS.duel.taille;

  /**
   * Choix courants, un par emplacement. Ils se prennent dans `ROSTER` et non en
   * dur : avec un roster réduit, un défaut codé en dur pointerait sur une carte
   * absente de la grille, et l'écran s'ouvrirait sur une sélection impossible à
   * défaire. Le tableau garde 5 entrées quel que soit le format, pour qu'un
   * aller-retour entre formats ne perde pas les choix.
   * @type {string[]}
   */
  const picks = Array.from({ length: 5 }, (_, i) => ROSTER[i % ROSTER.length]);
  /**
   * Points de vie de chaque emplacement. 100 pour tous par défaut — la valeur
   * du cahier des charges — et gardés d'un format à l'autre, comme les choix de
   * combattants.
   */
  const vies = Array.from({ length: 5 }, () => MATCH.maxHp);
  let active = 0;

  /** Les emplacements du DOM, reconstruits à chaque changement de format. */
  let slotBtns = [];

  // --- cartes du roster
  for (const id of ROSTER) {
    const el = ELEMENTS[id];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.style.setProperty('--accent', el.look.body);
    card.dataset.id = id;

    const cv = document.createElement('canvas');
    // Format **large et bas**, comme ce qu'elle dessine : un combattant est une
    // bille de 82 px suivie d'une arme qui va jusqu'à 208. Dans un carré, la
    // largeur bornait seule l'échelle et la moitié de la hauteur restait vide.
    cv.width = 144;
    cv.height = 72;
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
      // on avance d'un emplacement, en bouclant : cliquer trois cartes de suite
      // remplit trois emplacements, ce qui est le geste attendu
      active = (active + 1) % taille;
      showSheet(id);
      refresh();
    });
    card.addEventListener('pointerenter', () => showSheet(id));
    card.addEventListener('focus', () => showSheet(id));
    rosterEl.append(card);
  }

  // --- barre de format
  modesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mode]');
    if (!btn || !FORMATS[btn.dataset.mode]) return;
    mode = btn.dataset.mode;
    taille = FORMATS[mode].taille;
    active = 0;
    buildSlots();
    refresh();
  });

  // --- nombre de combattants, en bataille royale seulement
  root.querySelector('#size-less').addEventListener('click', () => setSize(taille - 1));
  root.querySelector('#size-more').addEventListener('click', () => setSize(taille + 1));

  function setSize(n) {
    const f = FORMATS.royale;
    const clamped = Math.max(f.min, Math.min(f.max, n));
    if (clamped === taille) return;
    taille = clamped;
    f.taille = clamped; // retenu pour le prochain passage en bataille royale
    if (active >= taille) active = taille - 1;
    buildSlots();
    refresh();
  }

  /**
   * (Re)construit les emplacements. Ils ne sont pas dans `index.html` parce que
   * leur nombre dépend du format : les figer à deux obligerait à en cacher ou
   * à en inventer, et le « VS » du duel n'a pas de place en bataille royale.
   */
  function buildSlots() {
    slotsEl.replaceChildren();
    slotBtns = [];
    const camps = FORMATS[mode].camps(taille);
    // Le nombre pilote la taille des cartes en CSS : à quatre ou cinq, les
    // cartes du duel débordent.
    slotsEl.dataset.count = String(taille);

    /**
     * Chaque camp va dans **son propre bloc**, et le « VS » entre les blocs.
     * Posés à plat, les emplacements et le « VS » passaient à la ligne au fil
     * du texte : le « VS » se retrouvait en bout de première ligne et le
     * groupement ne se lisait plus.
     */
    // Le « VS » ne sépare que **deux** camps. En chacun-pour-soi chacun est son
    // propre camp : un séparateur entre chaque carte ne dirait rien et
    // encombrerait la ligne.
    const duelDeCamps = new Set(camps).size === 2;
    let groupe = null;
    for (let i = 0; i < taille; i++) {
      if (i === 0 || camps[i] !== camps[i - 1]) {
        if (i > 0 && duelDeCamps) {
          const vs = document.createElement('span');
          vs.className = 'slot-vs';
          vs.textContent = 'VS';
          slotsEl.append(vs);
        }
        groupe = document.createElement('div');
        groupe.className = 'slot-team';
        slotsEl.append(groupe);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot';
      btn.dataset.slot = String(i);

      const tag = document.createElement('span');
      tag.className = 'slot-tag';
      tag.textContent =
        mode === 'duel' ? (i === 0 ? t.slotLeft : t.slotRight)
          : mode === 'teams' ? (camps[i] === 0 ? t.teamA : t.teamB)
            : t.slotN(i + 1);

      const orb = document.createElement('span');
      orb.className = 'slot-orb';
      const name = document.createElement('span');
      name.className = 'slot-name';

      btn.append(tag, orb, name);
      btn.addEventListener('click', () => { active = i; refresh(); });

      /**
       * Le champ de points de vie est **à côté** du bouton, pas dedans : un
       * `<input>` à l'intérieur d'un `<button>` est invalide, et le clic dans le
       * champ déclencherait la sélection de l'emplacement.
       */
      const boite = document.createElement('div');
      boite.className = 'slot-wrap';
      const champ = document.createElement('label');
      champ.className = 'slot-hp';
      const tagHp = document.createElement('span');
      tagHp.textContent = t.hpLabel;
      const input = document.createElement('input');
      input.type = 'number';
      input.min = String(MATCH.hpRange.min);
      input.max = String(MATCH.hpRange.max);
      input.step = '10';
      input.value = String(vies[i]);
      input.addEventListener('input', () => {
        const v = Math.round(Number(input.value));
        // On ne réécrit pas le champ pendant la frappe : borner à chaque touche
        // empêcherait de taper « 250 » (le « 2 » deviendrait le minimum).
        if (Number.isFinite(v) && v >= MATCH.hpRange.min && v <= MATCH.hpRange.max) vies[i] = v;
      });
      input.addEventListener('blur', () => {
        vies[i] = Math.max(MATCH.hpRange.min, Math.min(MATCH.hpRange.max, Math.round(Number(input.value)) || MATCH.maxHp));
        input.value = String(vies[i]);
      });
      champ.append(tagHp, input);

      boite.append(btn, champ);
      groupe.append(boite);
      slotBtns.push({ btn, orb, name, input });
    }
    sizeEl.hidden = mode !== 'royale';
    sizeLabel.textContent = String(taille);
    for (const b of modesEl.querySelectorAll('[data-mode]')) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
    }
  }

  startBtn.addEventListener('click', () => {
    const ids = picks.slice(0, taille);
    if (ids.some((id) => !id)) return;
    onStart(ids, FORMATS[mode].camps(taille), vies.slice(0, taille));
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
    const retenus = picks.slice(0, taille);
    for (const card of rosterEl.children) {
      card.setAttribute('aria-pressed', String(retenus.includes(card.dataset.id)));
    }
    slotBtns.forEach(({ btn, orb, name, input }, i) => {
      if (input) input.value = String(vies[i]);
      const el = picks[i] ? ELEMENTS[picks[i]] : null;
      btn.setAttribute('aria-current', String(active === i));
      btn.style.setProperty('--accent', el ? el.look.body : '#000');
      orb.style.background = el ? el.look.body : '#e6e6e6';
      name.textContent = el ? label(el, lang) : '—';
    });
    startBtn.textContent = mode === 'royale' ? t.startRoyale : t.start;
    startBtn.disabled = retenus.some((id) => !id);
  }

  buildSlots();
  refresh();
  showSheet(picks[0]);

  return {
    show() { root.classList.remove('hidden'); refresh(); },
    hide() { root.classList.add('hidden'); },
    get picks() { return picks.slice(0, taille); },
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

/**
 * Vignette : la boule du combattant et son arme, **placées comme en jeu**.
 *
 * La version précédente posait toujours l'arme *à droite* de la bille, à une
 * distance arbitraire. C'est juste pour une arme portée sur le flanc, et faux
 * pour une arme **centrée sur la bille** : le Shinobi, dont le corps *est* le
 * shuriken, s'affichait en boule noire avec un petit shuriken flottant à côté —
 * ce qu'on ne voit jamais en jeu.
 *
 * La vignette lit donc la géométrie de la fiche, exactement celle dont se sert
 * `Fighter.drawWeapon()` : le sprite occupe `[handle.length, reach]` autour du
 * centre du corps, et `weapon.overBody` décide s'il passe devant ou derrière.
 * Rien n'est codé par combattant — un futur venu s'affichera juste.
 */
function drawElementBadge(canvas, el) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const w = el.weapon;
  const key = w.head.sprite ?? Object.values(el.projectiles ?? {})[0]?.sprite ?? el.icon;
  const map = PIXEL_MAPS[key];
  const drawnW = map.w * w.head.scale;
  const drawnH = map.h * w.head.scale;

  // encombrement en unités de jeu, corps et arme réunis
  const left = Math.min(-el.look.radius, w.handle.length);
  const right = Math.max(el.look.radius, w.handle.length + drawnW);
  const halfH = Math.max(el.look.radius, drawnH / 2);
  const k = Math.min((canvas.width * 0.94) / (right - left), (canvas.height * 0.94) / (halfH * 2));

  // le tout est centré sur l'encombrement, pas sur la bille : une arme longue
  // ne doit pas pousser le combattant hors du cadre
  const ox = canvas.width / 2 - ((left + right) / 2) * k;
  const oy = canvas.height / 2;

  const ball = () => {
    ctx.beginPath();
    ctx.arc(ox, oy, el.look.radius * k, 0, TAU);
    ctx.fillStyle = el.look.body;
    ctx.fill();
    ctx.lineWidth = Math.max(2, el.look.outlineWidth * k);
    ctx.strokeStyle = el.look.outline;
    ctx.stroke();
  };
  const weapon = () => {
    const sprite = compilePixelMap(map, 3);
    ctx.drawImage(sprite, ox + w.handle.length * k, oy - (drawnH / 2) * k, drawnW * k, drawnH * k);
  };

  if (w.overBody) { ball(); weapon(); } else { weapon(); ball(); }
}
