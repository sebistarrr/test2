/**
 * Les deux manipulations physiques de la lance : **estoc** et **moulinet**.
 *
 * Elles partagent un contrôleur, parce qu'elles se marchent dessus : lancer un
 * moulinet en plein estoc doit annuler l'estoc, sinon la force de poussée
 * continue de s'appliquer pendant que l'arme tourne et la lance part en
 * diagonale. Un seul objet tient l'état, et un seul point de sortie le remet
 * à plat — `reset()`.
 *
 * C'est la leçon de la ruée du Bretteur dans la version JS : vitesse, pilotage
 * et ouverture de l'éventail y étaient remis à zéro à trois endroits
 * différents, et une fin de duel en pleine ruée laissait l'éventail large
 * accroché derrière la lame.
 *
 * @module combat/attacks
 */

import Matter from 'matter-js';
import type { WeaponSpec, ThrustPhase } from '../weapons/types';
import type { LanceBody } from '../physics/lanceBody';

const { Body, Vector } = Matter;

export interface AttackState {
  readonly thrustPhase: ThrustPhase;
  readonly spinning: boolean;
}

export class LanceController {
  private phase: ThrustPhase = 'idle';
  private timer = 0;
  private spinTimer = 0;

  constructor(
    private readonly spec: WeaponSpec,
    private readonly lance: LanceBody,
    /** Le corps porteur : c'est lui qu'on pousse, la lance suit par contrainte. */
    private readonly carrier: Matter.Body,
  ) {}

  get state(): AttackState {
    return { thrustPhase: this.phase, spinning: this.spinTimer > 0 };
  }

  /** Vecteur unitaire dans l'axe de la lance, pointe en avant. */
  private axis(): Matter.Vector {
    return { x: Math.cos(this.lance.body.angle), y: Math.sin(this.lance.body.angle) };
  }

  /**
   * **Coup d'estoc.** Trois temps : recul d'élan, poussée, temps mort.
   *
   * Sans le recul, la poussée démarre à vitesse nulle et l'œil ne lit pas
   * l'intention — c'est ce qui fait la différence entre « l'arme avance » et
   * « le personnage porte un coup ».
   */
  thrust(): boolean {
    if (this.phase !== 'idle') return false; // déjà engagé
    this.phase = 'windup';
    this.timer = this.spec.thrust.windup;
    const back = Vector.mult(this.axis(), -this.spec.thrust.windupSpeed);
    Body.setVelocity(this.carrier, back);
    return true;
  }

  /**
   * **Moulinet.** Une mise en rotation franche, puis un amortissement
   * exponentiel appliqué à la main dans `update` — Matter.js n'amortit pas la
   * vitesse angulaire, donc sans ça la lance tourne pour l'éternité.
   */
  spin(): boolean {
    if (this.spinTimer > 0) return false;
    // Un moulinet interrompt un estoc : les deux forces se contrarient.
    this.reset();
    this.spinTimer = this.spec.spin.duration;
    Body.setAngularVelocity(this.carrier, this.spec.spin.angularVelocity);
    return true;
  }

  /**
   * **Le point de sortie unique.** Tout ce qu'un estoc a mis en route est
   * remis ici, ensemble.
   */
  private reset(): void {
    this.phase = 'idle';
    this.timer = 0;
  }

  /** À appeler une fois par pas de simulation, avec le `dt` en secondes. */
  update(dt: number): void {
    const { thrust, body } = this.spec;

    if (this.spinTimer > 0) {
      this.spinTimer = Math.max(0, this.spinTimer - dt);
    } else {
      // amortissement de la rotation, hors moulinet actif
      Body.setAngularVelocity(this.carrier, this.carrier.angularVelocity * body.angularDamping);
    }

    if (this.phase === 'idle') return;

    this.timer -= dt;

    if (this.phase === 'strike') {
      // `applyForce` produit une **accélération** = force / masse. On
      // multiplie donc par la masse pour raisonner en distance parcourue :
      // sans ça, retoucher `body.density` changerait la portée de l'estoc
      // sans qu'aucune valeur d'attaque n'ait bougé.
      const f = Vector.mult(this.axis(), thrust.force * this.carrier.mass * dt);
      Body.applyForce(this.carrier, this.carrier.position, f);
    }

    if (this.timer > 0) return;

    switch (this.phase) {
      case 'windup':
        this.phase = 'strike';
        this.timer = thrust.strike;
        break;
      case 'strike':
        this.phase = 'recover';
        this.timer = thrust.recover;
        break;
      case 'recover':
        this.reset();
        break;
    }
  }
}
