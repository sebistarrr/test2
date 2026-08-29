/**
 * Cycle de vie du moteur dans React.
 *
 * Deux choses que ce hook existe pour garantir :
 *
 *  1. **le moteur n'est créé qu'une fois.** En `StrictMode`, React 18 monte,
 *     démonte puis remonte chaque effet en développement. Sans nettoyage
 *     complet, on se retrouve avec deux moteurs et deux boucles `rAF` qui
 *     dessinent dans le même canvas — la lance clignote et la physique va deux
 *     fois trop vite, ce qui se lit comme un bug de réglage plutôt que comme
 *     un double montage ;
 *  2. **le pas de simulation est fixe.** Matter est un intégrateur à pas fixe :
 *     lui passer le `dt` réel d'un `requestAnimationFrame` rend la simulation
 *     dépendante de la fréquence de l'écran, donc non reproductible entre un
 *     écran 60 Hz et un 144 Hz. On accumule le temps réel et on avance par pas
 *     de 1/60 s.
 *
 * @module hooks/useLanceStage
 */

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

import { ELECTRIC_LANCE } from '../weapons/electricLance';
import { createStage, FIGHTER_RADIUS } from '../physics/engine';
import { createLanceBody, lanceTip } from '../physics/lanceBody';
import { LanceController } from '../combat/attacks';
import { LightningField } from '../vfx/lightning';
import { createRng } from '../vfx/rng';
import { setupPixelView, loadTexture } from '../render/pixelCanvas';
import { drawLance, drawFighter, drawDebugBodies } from '../render/drawLance';

const { Engine, Composite } = Matter;

/** Pas de simulation, en secondes. Fixe — voir l'en-tête du module. */
const STEP = 1 / 60;
/** Garde-fou : au-delà, on laisse tomber le retard plutôt que de rattraper.
 *  Sans lui, un onglet remis au premier plan après une minute simule 3 600
 *  pas d'un coup et fige la page. */
const MAX_CATCHUP = 0.25;

export const WORLD = { width: 720, height: 720 } as const;

export interface StageHandle {
  thrust(): void;
  spin(): void;
}

export function useLanceStage(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  debug: boolean,
): StageHandle {
  const controls = useRef<StageHandle>({ thrust: () => {}, spin: () => {} });
  const [, force] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let disposed = false;

    const stage = createStage(WORLD.width, WORLD.height);
    // Un seul corps : la lance. La bille est dessinée à son pivot, pas
    // simulée — voir `FIGHTER_RADIUS` pour pourquoi les contraintes ont été
    // abandonnées.
    const lance = createLanceBody(ELECTRIC_LANCE, WORLD.width / 2, WORLD.height / 2);
    Composite.add(stage.engine.world, lance.body);

    const controller = new LanceController(ELECTRIC_LANCE, lance, lance.body);
    // Flux de rendu, séparé de la simulation : les éclairs ne peuvent pas
    // déplacer un corps.
    const viewRng = createRng(0xa17c);
    const bolts = new LightningField(ELECTRIC_LANCE.lightning, viewRng);

    controls.current = {
      thrust: () => controller.thrust(),
      spin: () => controller.spin(),
    };
    force((n) => n + 1);

    let texture: HTMLImageElement | null = null;
    void loadTexture(ELECTRIC_LANCE.sprite.texture).then((img) => {
      if (!disposed) texture = img;
    });

    let last = performance.now();
    let acc = 0;

    const frame = (now: number): void => {
      raf = requestAnimationFrame(frame);

      acc = Math.min(acc + (now - last) / 1000, MAX_CATCHUP);
      last = now;

      while (acc >= STEP) {
        controller.update(STEP);
        Engine.update(stage.engine, STEP * 1000);
        acc -= STEP;
      }

      const view = setupPixelView(canvas, WORLD.width, WORLD.height);
      if (!view) return;
      const { ctx } = view;

      ctx.fillStyle = '#1c1a26';
      ctx.fillRect(0, 0, WORLD.width, WORLD.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 8, WORLD.width - 16, WORLD.height - 16);

      const st = controller.state;
      const intensity = st.spinning ? 1 : st.thrustPhase === 'strike' ? 1 : st.thrustPhase === 'idle' ? 0 : 0.5;
      bolts.update(STEP, lance.body.position, lanceTip(lance), intensity);

      if (texture) drawLance(ctx, texture, lance);
      drawFighter(ctx, lance.body.position, FIGHTER_RADIUS);
      // Les éclairs passent **après** l'arme : ce sont eux qui doivent
      // rougeoyer par-dessus, pas l'inverse.
      bolts.draw(ctx, 1);

      if (debug) drawDebugBodies(ctx, Composite.allBodies(stage.engine.world));
    };
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      // Nettoyage complet : sans ça, le double montage de StrictMode laisse
      // un moteur orphelin vivant.
      Composite.clear(stage.engine.world, false);
      Engine.clear(stage.engine);
    };
  }, [canvasRef, debug]);

  return {
    thrust: () => controls.current.thrust(),
    spin: () => controls.current.spin(),
  };
}
