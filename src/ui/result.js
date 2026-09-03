/**
 * Écran de fin de duel (DOM).
 *
 * Trois façons de repartir :
 *   • **Revanche** — même affiche, nouveau tirage ;
 *   • **Revoir ce duel** — même affiche *et* même seed : la simulation étant
 *     déterministe, le duel se rejoue coup pour coup ;
 *   • **Exporter en Short** — télécharge la vidéo verticale du duel qu'on
 *     vient de regarder (voir render/recorder.js).
 *
 * @module ui/result
 */

import { UI, label } from './lang.js';

export function createResultScreen({ root, onRematch, onReplay, onBack, onExport, lang = 'ref' }) {
  const t = UI[lang] ?? UI.ref;
  const winnerEl = root.querySelector('#result-winner');
  const standingsEl = root.querySelector('#result-standings');
  const detailEl = root.querySelector('#result-detail');
  const exportBtn = root.querySelector('#btn-export');
  const exportNote = root.querySelector('#result-export-note');

  root.querySelector('#btn-rematch').addEventListener('click', () => onRematch());
  root.querySelector('#btn-replay').addEventListener('click', () => onReplay());
  root.querySelector('#btn-back').addEventListener('click', () => onBack());
  exportBtn.addEventListener('click', () => {
    if (exportBtn.disabled) return;
    onExport();
    exportNote.textContent = t.exportDone;
  });

  /** @param {'off'|'pending'|'ready'|'failed'} state */
  function setExport(state, note = '') {
    const off = state === 'off';
    exportBtn.hidden = off;
    exportNote.hidden = off && !note;
    exportBtn.disabled = state !== 'ready';
    exportBtn.textContent = state === 'pending' ? t.exportPending : t.exportShort;
    exportNote.textContent = note;
  }

  return {
    /**
     * @param {{winner:object, loser:object, winnerHp:number, duration:number,
     *          hits:number[], seed:number}} r
     */
    show(r) {
      root.classList.remove('hidden');
      root.style.setProperty('--accent', r.winner.look.body);
      winnerEl.textContent = t.winner(label(r.winner, lang));
      detailEl.textContent = t.resultDetail(
        r.winnerHp,
        r.duration.toFixed(1),
        // **Tous** les combattants, pas les deux premiers : à cinq, additionner
        // `hits[0] + hits[1]` ne comptait que le premier tiers des touches.
        r.hits.reduce((s, n) => s + n, 0),
        r.seed,
      );

      /**
       * Classement, du vainqueur au premier tombé. Il n'a de sens qu'à plus de
       * deux : en duel il dirait « le vainqueur, puis le perdant », ce que la
       * ligne au-dessus dit déjà.
       */
      const rang = r.standings ?? [];
      standingsEl.hidden = rang.length === 0;
      standingsEl.replaceChildren(
        ...rang.map((el, i) => {
          const li = document.createElement('li');
          li.textContent = label(el, lang);
          li.style.setProperty('--accent', el.look.body);
          if (i === 0) li.classList.add('is-winner');
          return li;
        }),
      );
    },
    setExport,
    hide() {
      root.classList.add('hidden');
    },
  };
}
