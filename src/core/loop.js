/**
 * Boucle de jeu à pas fixe (fixed timestep).
 *
 * La simulation tourne à 120 Hz quelle que soit la fréquence de l'écran :
 * les collisions arme/corps restent stables et un duel se déroule
 * exactement de la même façon sur un écran 60 Hz ou 144 Hz.
 * Le rendu, lui, se cale sur requestAnimationFrame.
 *
 * @module core/loop
 */

export const SIM_HZ = 120;
export const SIM_DT = 1 / SIM_HZ;
const MAX_STEPS = 6; // anti « spirale de la mort » après un onglet en arrière-plan

export function createLoop({ update, render }) {
  let raf = 0;
  let last = 0;
  let acc = 0;
  let running = false;

  const frame = (now) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);

    const elapsed = Math.min((now - last) / 1000, 0.25);
    last = now;
    acc += elapsed;

    let steps = 0;
    while (acc >= SIM_DT && steps < MAX_STEPS) {
      update(SIM_DT);
      acc -= SIM_DT;
      steps++;
    }
    if (steps === MAX_STEPS) acc = 0;

    render(acc / SIM_DT); // alpha d'interpolation (dispo si besoin)
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    get running() {
      return running;
    },
  };
}
