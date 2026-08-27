import { useEffect, useRef, useState } from 'react';
import { Duel } from './duel';
import { render } from './render';
import { buildSprites, type SpriteSet } from './sprites';
import { STEP_MS } from './physics';
import { H, W } from './constants';
import { makeRng, readSeed } from './rng';

/**
 * Le canvas est piloté hors de React : un `useRef` et une boucle
 * `requestAnimationFrame`. React ne re-rend pas à 60 fps — il monte le
 * canvas une fois, et la boucle écrit dedans. Un état React par frame
 * ferait passer tout l'arbre dans le réconciliateur soixante fois par
 * seconde pour rien.
 */
export default function App(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fatal, setFatal] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setFatal('Canvas 2D indisponible sur ce navigateur.');
      return;
    }

    let sprites: SpriteSet;
    let duel: Duel;
    try {
      sprites = buildSprites();
      duel = new Duel(readSeed());
    } catch (e) {
      setFatal(String(e));
      return;
    }

    // Poignée de debug : __duel.snapshot() dans la console.
    (globalThis as Record<string, unknown>).__duel = duel;

    const jitterRng = makeRng(0x5eed);
    const jitter = () => jitterRng() * 2 - 1;

    let raf = 0;
    let last = performance.now();
    // Accumulateur : la physique avance à PAS FIXE quel que soit le
    // rafraîchissement de l'écran. Sans lui, un écran 144 Hz jouerait le
    // duel deux fois plus vite qu'un 60 Hz.
    let acc = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // Borne les à-coups (onglet inactif, GC) : au-delà on saute le
      // temps perdu au lieu de rattraper des centaines de pas d'un coup.
      acc += Math.min(now - last, 250);
      last = now;
      let steps = 0;
      while (acc >= STEP_MS && steps < 8) {
        duel.step();
        acc -= STEP_MS;
        steps += 1;
      }
      render(ctx, duel, sprites, jitter);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      delete (globalThis as Record<string, unknown>).__duel;
    };
  }, []);

  if (fatal) return <p className="fatal">{fatal}</p>;
  // Repère natif : 576 x 1024 unités logiques, identiques aux pixels de
  // la vidéo. Toute mesure du relevé s'utilise telle quelle. La mise à
  // l'échelle à l'écran est purement CSS.
  return <canvas ref={canvasRef} width={W} height={H} aria-label="Outlaw contre Bladesman" />;
}
