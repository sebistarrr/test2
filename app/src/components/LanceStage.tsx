/**
 * Le composant Canvas.
 *
 * Il ne fait que porter le canvas et les commandes : toute la mécanique est
 * dans `useLanceStage`, pour que le rendu React (qui peut se déclencher à tout
 * moment) ne touche jamais à la boucle de simulation.
 *
 * @module components/LanceStage
 */

import { useEffect, useRef } from 'react';
import { useLanceStage, WORLD } from '../hooks/useLanceStage';

export interface LanceStageProps {
  /** Affiche les silhouettes de collision et le pivot. */
  readonly debug?: boolean;
}

export function LanceStage({ debug = false }: LanceStageProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stage = useLanceStage(canvasRef, debug);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.repeat) return;
      if (e.code === 'Space') {
        e.preventDefault();
        stage.thrust();
      }
      if (e.code === 'KeyR') stage.spin();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage]);

  return (
    <div className="stage">
      <div className="stage__canvas">
        <canvas ref={canvasRef} width={WORLD.width} height={WORLD.height} />
      </div>
      <div className="stage__controls">
        <button type="button" onClick={() => stage.thrust()}>
          Thrust <kbd>Space</kbd>
        </button>
        <button type="button" onClick={() => stage.spin()}>
          Spin <kbd>R</kbd>
        </button>
      </div>
    </div>
  );
}
