/**
 * ÉCLAIRS PROCÉDURAUX autour de la lance.
 *
 * Tracé par **déplacement de point milieu** : on part d'un segment, on casse
 * son milieu perpendiculairement d'une quantité aléatoire, et on recommence
 * sur les deux moitiés avec une amplitude divisée par deux. Cinq passes
 * donnent 32 segments — assez pour un tracé nerveux, assez peu pour rester
 * lisible à côté d'un pixel-art.
 *
 * Deux choix de rendu qui comptent :
 *
 *  1. **les sommets sont accrochés à la grille de pixels.** Un éclair tracé en
 *     coordonnées flottantes à côté d'un sprite pixel-art se voit
 *     immédiatement : il a des bords lisses là où tout le reste est carré. Ils
 *     sont donc quantifiés au même pas que le sprite ;
 *  2. **deux passes**, un halo large et sombre puis un cœur fin et clair. Une
 *     passe unique donne un trait plat ; c'est la superposition qui fait le
 *     rougeoiement.
 *
 * Le banc de particules est **séparé de la simulation** et tire sur `viewRng` :
 * ajouter ou retirer des arcs ne peut rien changer au duel.
 *
 * @module vfx/lightning
 */

import type { LightningSpec } from '../weapons/types';
import type { Rng } from './rng';

interface Point {
  x: number;
  y: number;
}

interface Arc {
  points: Point[];
  age: number;
  life: number;
}

/**
 * Casse un segment en une polyligne brisée.
 *
 * @param jitter amplitude du **premier** déplacement ; elle est divisée par
 *   deux à chaque subdivision, ce qui donne la texture caractéristique — de
 *   grandes cassures et beaucoup de petites.
 */
function fracture(
  from: Point,
  to: Point,
  subdivisions: number,
  jitter: number,
  rng: Rng,
): Point[] {
  let points: Point[] = [from, to];
  let amplitude = jitter;

  for (let pass = 0; pass < subdivisions; pass++) {
    const next: Point[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]!;
      const b = points[i + 1]!;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;

      // normale au segment : c'est perpendiculairement qu'on casse, sinon
      // l'éclair s'allonge au lieu de zigzaguer
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const offset = rng.spread(amplitude);

      next.push(a, { x: mx - (dy / len) * offset, y: my + (dx / len) * offset });
    }
    next.push(points[points.length - 1]!);
    points = next;
    amplitude /= 2;
  }
  return points;
}

export class LightningField {
  private arcs: Arc[] = [];

  constructor(
    private readonly spec: LightningSpec,
    private readonly rng: Rng,
  ) {}

  /**
   * Fait vivre le banc d'arcs.
   *
   * @param dt   secondes écoulées
   * @param base pivot de l'arme
   * @param tip  pointe de l'arme
   * @param intensity 0 = au repos, 1 = en pleine attaque. Multiplie le nombre
   *   d'arcs : c'est ce qui fait que l'arme « se charge » visiblement quand
   *   elle frappe, sans qu'aucune valeur d'attaque ne soit lue ici.
   */
  update(dt: number, base: Point, tip: Point, intensity: number): void {
    for (const arc of this.arcs) arc.age += dt;
    this.arcs = this.arcs.filter((a) => a.age < a.life);

    const wanted = Math.round(this.spec.arcs * (0.45 + 0.55 * intensity));
    while (this.arcs.length < wanted) {
      this.arcs.push(this.spawn(base, tip));
    }
  }

  private spawn(base: Point, tip: Point): Arc {
    const { rng, spec } = this;

    const dx = tip.x - base.x;
    const dy = tip.y - base.y;
    const reach = Math.hypot(dx, dy) || 1;

    // Point d'accrochage sur la lance, tiré vers la tête : c'est ce qui donne
    // la couronne serrée du fer, sans avoir à coder une couronne.
    const t = rng.range(spec.anchorMin, spec.anchorMax);
    const from = { x: base.x + dx * t, y: base.y + dy * t };

    // Direction **quelconque** : l'arc jaillit, il ne suit pas l'arme. S'il
    // suivait l'axe, on retomberait sur les tentacules du premier réglage.
    const angle = rng.range(0, Math.PI * 2);
    const span = reach * rng.range(spec.spanMin, spec.spanMax);
    const to = {
      x: from.x + Math.cos(angle) * span,
      y: from.y + Math.sin(angle) * span,
    };

    return {
      points: fracture(from, to, spec.subdivisions, span * spec.jitterRatio, rng),
      age: 0,
      life: spec.life * rng.range(0.6, 1.4),
    };
  }

  /**
   * Dessine les arcs.
   *
   * @param pixel taille du pixel logique. Les sommets y sont accrochés pour
   *   que les éclairs aient le même grain que le sprite — un tracé flottant à
   *   côté d'un pixel-art se repère au premier coup d'œil.
   */
  draw(ctx: CanvasRenderingContext2D, pixel: number): void {
    const { spec } = this;
    const snap = (v: number): number => Math.round(v / pixel) * pixel;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // **Pas de `lighter` ici.** Le mode additif ne fonctionne que sur fond
    // sombre : l'arène du jeu est blanche (c'est le relevé), et additionner
    // quoi que ce soit à du blanc redonne du blanc — les arcs étaient
    // purement invisibles au-dessus de l'arène, alors qu'ils s'affichaient
    // correctement sur le cadre sombre autour. Un effet qui « marche » sur la
    // moitié du cadre seulement est un effet faux.
    ctx.globalCompositeOperation = 'source-over';

    // Deux passes : halo large et sombre, puis cœur fin et clair.
    for (const pass of [0, 1] as const) {
      ctx.strokeStyle = pass === 0 ? spec.glow : spec.core;
      ctx.lineWidth = pass === 0 ? spec.glowWidth : spec.coreWidth;

      for (const arc of this.arcs) {
        // fondu en fin de vie : sans lui les arcs disparaissent d'un coup et
        // ça clignote
        ctx.globalAlpha = (1 - arc.age / arc.life) * (pass === 0 ? 0.55 : 1);
        ctx.beginPath();
        const first = arc.points[0]!;
        ctx.moveTo(snap(first.x), snap(first.y));
        for (let i = 1; i < arc.points.length; i++) {
          const p = arc.points[i]!;
          ctx.lineTo(snap(p.x), snap(p.y));
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
