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

export function createResultScreen({ root, onRematch, onReplay, onBack, onExport }) {
  const winnerEl = root.querySelector('#result-winner');
  const detailEl = root.querySelector('#result-detail');
  const exportBtn = root.querySelector('#btn-export');
  const exportNote = root.querySelector('#result-export-note');

  root.querySelector('#btn-rematch').addEventListener('click', () => onRematch());
  root.querySelector('#btn-replay').addEventListener('click', () => onReplay());
  root.querySelector('#btn-back').addEventListener('click', () => onBack());
  exportBtn.addEventListener('click', () => {
    if (exportBtn.disabled) return;
    onExport();
    exportNote.textContent = 'Vidéo téléchargée — prête pour YouTube Shorts.';
  });

  /** @param {'off'|'pending'|'ready'|'failed'} state */
  function setExport(state, note = '') {
    const off = state === 'off';
    exportBtn.hidden = off;
    exportNote.hidden = off && !note;
    exportBtn.disabled = state !== 'ready';
    exportBtn.textContent = state === 'pending' ? 'PRÉPARATION…' : 'EXPORTER EN SHORT';
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
      winnerEl.textContent = `${r.winner.name} L'EMPORTE`;
      detailEl.textContent =
        `${r.winnerHp} PV restants · duel de ${r.duration.toFixed(1)} s · ` +
        `${r.hits[0] + r.hits[1]} touches · seed ${r.seed}`;
    },
    setExport,
    hide() {
      root.classList.add('hidden');
    },
  };
}
