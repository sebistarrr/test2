/**
 * @module App
 */

import { LanceStage } from './components/LanceStage';

export function App(): JSX.Element {
  const debug = new URLSearchParams(window.location.search).has('debug');
  return (
    <main className="app">
      <h1>Electric Lance</h1>
      <p className="app__sub">Lancer — spear first, and every hit lands harder.</p>
      <LanceStage debug={debug} />
    </main>
  );
}
