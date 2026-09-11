/**
 * Pouvoirs de LUNE — **Météores** et **Éclipse**.
 *
 * Le module a été refait en même temps que la fiche, et il a changé de nature.
 * L'ancien **réécrivait trois grandeurs du combattant à chaque pas** (taille,
 * vitesse, dégâts) à partir d'un cycle de 12 s, et ne dessinait presque rien.
 * Celui-ci fait l'inverse : il ne touche à la taille que pendant l'Éclipse, et
 * **tout le reste de son travail est du dessin** — l'orbite des trois
 * satellites, les ombres des météores en chute, la nuit d'arène, la couronne.
 * C'était le reproche fait au personnage : il gagnait sans qu'on voie comment.
 *
 * **Aucun tirage, nulle part.** Ni `game.rng` ni `viewRng` : le semis de
 * météores est déduit de `f.ability.uses` par l'angle d'or, et tout le rendu est
 * une fonction de l'état et du temps. Deux duels à la même graine sèment les
 * mêmes cratères aux mêmes endroits (invariant 2).
 *
 * **Ce que le moteur en sait : rien** (invariant 12). La taille passe par
 * `f.sizeFactor`, la vitesse par `f.boost`/`f.boostFactor`, les dégâts de
 * contact par une fonction de fiche lisant `f.state.totality` — trois compteurs
 * génériques, aucun nom de combattant côté moteur.
 *
 * @module game/abilities/lunar
 */

import { TAU } from '../../core/math.js';
import { ARENA } from '../../data/tuning.js';
import { drawSpriteCentered } from '../../render/sprites.js';

/** `#rrggbb` → `rgba()`, pour ne jamais recopier une teinte de la palette.
 *  Ce module n'a **aucun littéral de couleur** : tout vient de `look.palette`,
 *  les cinq teintes relevées sur la maquette du corps. */
function teinte(hex, alpha = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** **L'angle d'or**, en radians. Il sert à orienter chaque salve de météores
 *  sans consommer un tirage : deux salves successives sont tournées de 137,5°,
 *  donc elles ne se superposent jamais et le semis n'a pas l'air réglé. */
const OR = Math.PI * (3 - Math.sqrt(5));

export const lunarAbilities = {
  id: 'lunar',

  init(f) {
    /** Les météores en vol. Chacun porte son point de chute, son horloge et
     *  l'angle de sa traînée — rien qui dépende d'un flux d'aléa. */
    f.state.rocks = [];
    /** Cratères creusés. Affiché au HUD : une salve qui n'a rien touché a quand
     *  même frappé le sol, et c'est cette production-là qu'on veut lire. */
    f.state.impacts = 0;
    /**
     * **Vrai pendant la seconde moitié de l'ultime**, la totalité. Lu par le
     * rendu, par le HUD **et par la fiche** — `weapon.melee.damage` est une
     * fonction qui bascule dessus (5 → 11). Même forme que `f.state.firing` du
     * Soleil : un seul drapeau dit où en est la manœuvre.
     */
    f.state.totality = false;
  },

  update(f, dt, now, game) {
    const el = f.el;

    /** Les pierres en vol retombent quoi qu'il arrive : suspendre leur horloge
     *  à la fin du combat les laisserait suspendues en l'air pendant la parade. */
    this.tickRocks(f, dt, game);

    /* ---------- Éclipse : annonce, totalité, retour ---------------------- */
    if (f.ult.active > 0) {
      this.tickEclipse(f, dt, game);
    } else if (game.phase === 'fight') {
      f.ult.charge = Math.min(100, f.ult.charge + el.ultimate.chargeRate * dt);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castEclipse(f);
    }

    if (game.phase !== 'fight') return;

    /* ---------- Météores : horloge fixe, semis sur la cible --------------- */
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) {
      f.ability.timer = el.ability.cooldown;
      f.ability.uses += 1;
      this.castMeteors(f, game);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Météores                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * **Trois cailloux quittent l'anneau et partent sur l'adversaire.**
   *
   * Le premier tombe sur sa position **à l'instant du tir**, les deux autres à
   * `spread` de là. Viser la position courante et non une position anticipée est
   * délibéré : le pouvoir n'est pas censé toucher un adversaire qui bouge, il
   * est censé lui **interdire de s'arrêter**. C'est la même intention que le
   * Réchauffement du Soleil, par l'autre bout — lui punit celui qui reste loin,
   * elle punit celui qui reste immobile.
   *
   * **Sans cible, rien ne part**, et l'horloge est quand même consommée : une
   * salve tirée dans le vide creuserait trois cratères que personne n'a
   * provoqués.
   */
  castMeteors(f, game) {
    const a = f.el.ability;
    const cible = f.opponent;
    if (!cible || !cible.onStage) return;

    game.sfx.cast(f, 'ability');

    const i = ARENA.inner;
    for (let k = 0; k < a.count; k++) {
      // angle d'or par salve + répartition régulière dans la salve : aucun
      // tirage, et deux salves consécutives ne se recouvrent pas
      const ang = f.ability.uses * OR + (k * TAU) / a.count;
      const d = k === 0 ? 0 : a.spread;
      f.state.rocks.push({
        x: Math.max(i.left + a.blast, Math.min(i.right - a.blast, cible.x + Math.cos(ang) * d)),
        y: Math.max(i.top + a.blast, Math.min(i.bottom - a.blast, cible.y + Math.sin(ang) * d)),
        // décalés, sinon les trois touchent dans le même pas : un seul fracas
        // (`MIX.repeatGap`) et une gerbe unique, donc une salve qui se lit
        // comme un unique gros coup
        t: a.fall + k * a.stagger,
      });
    }
  },

  /** Décompte des chutes ; à zéro, la pierre touche et sort de la liste. */
  tickRocks(f, dt, game) {
    const rocks = f.state.rocks;
    for (let k = rocks.length - 1; k >= 0; k--) {
      rocks[k].t -= dt;
      if (rocks[k].t > 0) continue;
      const r = rocks[k];
      rocks.splice(k, 1);
      this.impact(f, r, game);
    }
  },

  /**
   * L'arrivée au sol : un cratère, une onde, et ce qui traînait dans la zone.
   *
   * Le créneau joué est `impact` — le bruitage générique du projectile, qu'elle
   * n'utilisait plus depuis qu'elle n'a pas de projectile. C'est exactement le
   * mécanisme prévu : le module nomme un **créneau**, la fiche dit la matière.
   */
  impact(f, r, game) {
    const a = f.el.ability;
    f.state.impacts += 1;
    game.sfx.cast(f, 'impact');
    game.fx.ring(r.x, r.y, a.blast * 0.35, a.blast, a.ring.time, a.ring.color, a.ring.width, false);
    game.shake(a.shake, 0.15);

    for (const g of game.fighters) {
      if (g === f || g.team === f.team || !g.onStage) continue;
      const dx = g.x - r.x;
      const dy = g.y - r.y;
      // de bord à bord, comme toutes les zones du dépôt : une bille posée juste
      // au bord du cratère ne doit pas passer pour dehors
      if (Math.hypot(dx, dy) > a.blast + g.radius) continue;
      game.damage(g, a.damage, f, { kind: 'meteor', nx: dx, ny: dy, knockback: a.knockback });
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Éclipse                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Déclenchement. Elle se bride tout de suite — `f.boost` / `f.boostFactor`
   * sont les compteurs génériques du `Fighter` (invariant 7) : un module les
   * allume, le moteur les décompte et **ne sait pas pourquoi**.
   *
   * Pas de `game.sfx.cast` ici : `match.js` détecte la bascule de `f.ult.active`
   * et joue la recette que la fiche nomme, pour tout ultime du dépôt.
   */
  castEclipse(f) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.state.totality = false;
    f.boost = ult.duration;
    f.boostFactor = ult.channelSpeed;
  },

  /**
   * Les deux temps de la manœuvre, et la taille qui les suit.
   *
   * **Pendant l'annonce** (`windup`), le corps enfle en `t²` : lent d'abord,
   * franc à la fin — c'est ce qui donne à l'adversaire le temps de décoller
   * avant d'être poussé par un corps qui grossit. **Pendant la totalité**, il
   * tient sa taille, puis redescend sur `settle` : un dégonflage d'un pas à
   * l'autre se lirait comme une téléportation.
   *
   * `resolveBodies` sépare les corps à chaque pas, donc un astre qui grossit
   * **repousse tout seul** ce qui le touche. C'est gratuit, c'est juste, et
   * c'est exactement pourquoi la taille passe par `sizeFactor` plutôt que par
   * un dessin plus grand.
   */
  tickEclipse(f, dt, game) {
    const ult = f.el.ultimate;
    f.ult.active -= dt;
    const ecoule = ult.duration - f.ult.active;

    let t = Math.min(1, Math.max(0, ecoule / ult.windup));
    t *= t;
    if (f.ult.active < ult.settle) t = Math.min(t, Math.max(0, f.ult.active) / ult.settle);
    f.sizeFactor = 1 + (ult.swell - 1) * t;

    if (ecoule >= ult.windup && !f.state.totality) {
      f.state.totality = true;
      this.totality(f, game);
    }

    if (f.ult.active <= 0) this.endEclipse(f);
  },

  /**
   * **Le contact d'ombre**, au premier pas de la totalité.
   *
   * Une seule onde, une seule fois : elle dit que l'annonce est finie, et elle
   * **écarte** au lieu de retenir. Ça paraît à l'envers pour un pouvoir de corps
   * à corps, et ça ne l'est pas — elle a 3,5 s pour rattraper tout le monde avec
   * un anneau qui fait 11 par coup, et elle ne veut pas d'un adversaire collé
   * contre elle **au moment où elle enfle**, où il serait poussé de toute façon
   * par `resolveBodies`, sans dégât et sans lisibilité.
   */
  totality(f, game) {
    const ult = f.el.ultimate;
    const b = ult.burst;
    const pal = f.el.look.palette;
    game.shake(ult.shake, 0.4);
    game.fx.ring(f.x, f.y, f.radius, ult.ring.to, ult.ring.time,
      teinte(pal.core, 0.85), ult.ring.width, true);

    for (const g of this.enemiesInRange(f, b.radius, game)) {
      const dx = g.x - f.x;
      const dy = g.y - f.y;
      // `sound: 'hit'` — c'est un coup d'elle, pas un projectile perdu
      game.damage(g, b.damage, f, { kind: 'eclipse', nx: dx, ny: dy, knockback: b.knockback, sound: 'hit' });
    }
  },

  /**
   * **Seul point de sortie de l'ultime**, comme les ruées du dépôt : jauge,
   * drapeau, taille et bridage de vitesse sont remis **ensemble**. Dispersés,
   * une fin de duel en pleine totalité laisserait la Lune à 116 de rayon et à
   * 62 % de sa vitesse pour la parade — exactement la régression que la Ruée du
   * Ronin a déjà payée une fois.
   */
  endEclipse(f) {
    f.ult.active = 0;
    f.ult.charge = 0;
    f.ult.ready = false;
    f.state.totality = false;
    f.sizeFactor = 1;
    f.boost = 0;
    f.boostFactor = 1;
  },

  /* ------------------------------------------------------------------ */

  /**
   * Ennemis à portée. Repris tel quel du Soleil et du Golem, pour les trois
   * mêmes raisons : camp adverse seulement (invariant 13), `onStage` et non
   * `alive` (invariant 8), et distance mesurée **de bord à bord** — ce qui, ici,
   * suit la taille courante de l'astre sans une ligne de plus.
   */
  enemiesInRange(f, radius, game) {
    const out = [];
    for (const g of game.fighters) {
      if (g === f || g.team === f.team || !g.onStage) continue;
      if (Math.hypot(g.x - f.x, g.y - f.y) <= radius + g.radius) out.push(g);
    }
    return out;
  },

  /* ------------------------------------------------------------------ */
  /*  Rendu                                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Tout ce qui est **au sol** : la nuit, l'orbite, les points de chute.
   *
   * Les trois sont sous les combattants, ce qui est la règle de composition de
   * `flair.js` — *rien entre le spectateur et les combattants*. C'est aussi ce
   * qui fait qu'on peut les rendre francs : une ombre à 60 % sous un satellite
   * ne gêne personne, la même posée devant l'aurait masqué.
   */
  drawUnder(ctx, f, game, now) {
    if (!f.onStage) return;
    this.drawNight(ctx, f);
    this.drawOrbit(ctx, f);
    this.drawTargets(ctx, f, now);
  },

  /**
   * **L'orbite et l'ombre des trois satellites.**
   *
   * C'est la moitié de la réponse au « pas de silhouette » : l'arme est
   * dessinée par le moteur (`weapon.head.sprite`), mais posée telle quelle sur
   * l'arène blanche, la pleine lune pâle ne tiendrait aucun contraste — 1,54
   * relevé sur la maquette. Un lavis d'encre sous chaque caillou lui rend son
   * bord, et l'anneau ténu qui les relie dit que ce sont **trois objets d'un
   * même système** et non trois décorations.
   *
   * Le rayon est lu sur la fiche (`reach × hitbox.from`), donc l'ombre suit
   * exactement là où l'arme porte : le dessin ne peut pas mentir sur la
   * géométrie, même ici.
   */
  drawOrbit(ctx, f) {
    const w = f.el.weapon;
    const pal = f.el.look.palette;
    const r = w.reach * w.hitbox.from;
    const n = f.spokes;

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = teinte(pal.shadow, 1);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(f.x, f.y, r, 0, TAU);
    ctx.stroke();

    ctx.globalAlpha = 0.42;
    ctx.fillStyle = teinte(pal.edge, 1);
    for (let k = 0; k < n; k++) {
      const ang = f.weaponAngle + (TAU * k) / n;
      ctx.beginPath();
      ctx.arc(f.x + Math.cos(ang) * r, f.y + Math.sin(ang) * r, w.hitbox.radius + 5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  },

  /**
   * **Les points de chute** : une ombre qui grossit et un cercle qui se
   * resserre, par météore en vol.
   *
   * Les deux disent deux choses différentes, et il faut les deux. Le **cercle
   * extérieur** se resserre sur `blast` : c'est l'horloge, on lit combien de
   * temps il reste. Le **disque d'ombre** grossit : c'est l'altitude, on lit que
   * quelque chose descend. Un seul des deux et le pouvoir devient soit une
   * surprise, soit un décor.
   *
   * Le cercle **finit exactement sur le rayon d'explosion** : la zone annoncée
   * est la zone qui blesse, au pixel près. C'est la même discipline que
   * `handle.length + largeur = reach` pour une arme.
   */
  drawTargets(ctx, f) {
    const a = f.el.ability;
    const pal = f.el.look.palette;
    if (!f.state.rocks.length) return;

    ctx.save();
    for (const r of f.state.rocks) {
      const u = Math.max(0, Math.min(1, r.t / a.fall)); // 1 au départ → 0 à l'impact
      const v = 1 - u;

      ctx.globalAlpha = 0.14 + 0.4 * v;
      ctx.fillStyle = teinte(pal.edge, 1);
      ctx.beginPath();
      ctx.arc(r.x, r.y, (a.size / 2) * (0.35 + 0.65 * v), 0, TAU);
      ctx.fill();

      ctx.globalAlpha = 0.3 + 0.5 * v;
      ctx.strokeStyle = teinte(pal.body, 1);
      ctx.lineWidth = 2 + 2 * v;
      ctx.beginPath();
      ctx.arc(r.x, r.y, a.blast * (1 + 0.9 * u), 0, TAU);
      ctx.stroke();

      ctx.globalAlpha = 0.22 + 0.3 * v;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, a.blast, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  },

  /**
   * **La nuit d'arène**, et c'est la mécanique de la chaleur du Soleil, en
   * miroir : deux couches dans `drawUnder`, un lavis au sol et un bord qui
   * s'assombrit.
   *
   * Le décor, lui, n'a pas bougé (invariant 4) : il reste rasterisé une fois
   * dans `scene.js` et blitté en un `drawImage`. On peint **par-dessus**, ce qui
   * ne coûte que deux remplissages et se retire en changeant deux nombres de la
   * fiche.
   *
   * **La montée suit l'annonce, pas la totalité** : la nuit est *l'annonce*, et
   * elle est complète à l'instant où l'ombre frappe. Elle se retire sur
   * `settle`, en même temps que le corps redescend — les deux disent la même
   * chose, elles doivent finir ensemble.
   *
   * En miroir (deux Lunes), les deux nuits s'additionnent : l'arène est deux
   * fois plus noire, ce qui est exactement ce qu'on veut voir, et les opacités
   * sont assez basses pour que la somme ne sature pas.
   */
  drawNight(ctx, f) {
    const ult = f.el.ultimate;
    const amb = ult.ambience;
    if (!amb || f.ult.active <= 0) return;

    const ecoule = ult.duration - f.ult.active;
    let k = Math.min(1, Math.max(0, ecoule / ult.windup));
    if (f.ult.active < ult.settle) k = Math.min(k, Math.max(0, f.ult.active) / ult.settle);
    k *= k; // carré, comme l'ambiance solaire : discrète longtemps, franche à la fin

    const pal = f.el.look.palette;
    const i = ARENA.inner;
    const w = i.right - i.left;
    const h = i.bottom - i.top;

    ctx.save();
    ctx.globalAlpha = amb.tint * k;
    ctx.fillStyle = teinte(pal.shadow, 1);
    ctx.fillRect(i.left, i.top, w, h);

    ctx.globalAlpha = amb.vignette * k;
    const cx = i.left + w / 2;
    const cy = i.top + h / 2;
    const g = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.18, cx, cy, Math.max(w, h) * 0.72);
    g.addColorStop(0, teinte(pal.shadow, 0));
    g.addColorStop(0.55, teinte(pal.edge, 0.3));
    g.addColorStop(1, teinte(pal.edge, 0.96));
    ctx.fillStyle = g;
    ctx.fillRect(i.left, i.top, w, h);
    ctx.restore();
  },

  /**
   * Ce qui est **en l'air** : les pierres en chute et la couronne d'éclipse.
   *
   * `match.js` repasse le chiffre de PV après cette boucle, donc recouvrir un
   * adversaire ici ne le rend pas illisible — piège documenté.
   */
  drawOver(ctx, f, game, now) {
    if (!f.onStage) return;
    this.drawRocks(ctx, f);
    this.drawCorona(ctx, f, now);
  },

  /**
   * **Les pierres, dessinées au-dessus de leur ombre.**
   *
   * Le jeu est vu de dessus et n'a aucune notion d'altitude : elle se fabrique
   * avec deux dessins au même `x` — l'ombre au point de chute (dans
   * `drawTargets`) et la pierre `height` pixels plus haut, qui comble l'écart.
   * C'est le seul endroit du dépôt où une hauteur est simulée, et ça tient à
   * une condition : la **chute doit accélérer**. `1 − (1 − u)²` couvre 25 % de
   * la distance dans la première moitié du temps et 75 % dans la seconde, ce
   * qu'on lit comme une chute libre ; une rampe droite se lirait comme un
   * ascenseur.
   *
   * La traînée est tracée **derrière** la pierre, donc vers le haut : c'est elle
   * qui dit d'où ça vient quand le point de chute est près du bord haut de
   * l'arène et que la pierre entre déjà dans le cadre.
   */
  drawRocks(ctx, f) {
    const a = f.el.ability;
    const pal = f.el.look.palette;
    if (!f.state.rocks.length) return;

    for (const r of f.state.rocks) {
      const u = Math.max(0, Math.min(1, r.t / a.fall));
      const h = a.height * (1 - (1 - u) * (1 - u));
      const y = r.y - h;

      ctx.save();
      ctx.globalAlpha = 0.3 * u;
      ctx.strokeStyle = teinte(pal.light, 1);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r.x, y);
      ctx.lineTo(r.x, y - Math.min(90, h * 0.45));
      ctx.stroke();
      ctx.restore();

      drawSpriteCentered(ctx, 'lunarLit', r.x, y, a.size);
    }
  },

  /**
   * **La couronne d'éclipse** — deux traits sur le limbe, plus les anneaux qui
   * se referment pendant l'annonce.
   *
   * Deux traits et pas un, pour la raison que le dépôt a déjà écrite à propos de
   * l'axe du Rayon solaire : *un trait clair seul n'existe pas sur l'arène
   * blanche*. Le violet porte la lisibilité, le blanc dit que c'est de la
   * lumière. C'est aussi, littéralement, ce que montre la maquette — un anneau
   * violet doublé d'un liseré blanc.
   *
   * Les anneaux **se referment** au lieu de s'ouvrir, comme la charge du Soleil
   * et pour le même motif : un anneau qui s'ouvre dit qu'une onde part, un
   * anneau qui se referme dit que quelque chose se ramasse. Ils s'arrêtent net à
   * la totalité — à ce moment-là, c'est l'onde qui part.
   */
  drawCorona(ctx, f, now) {
    if (f.ult.active <= 0) return;
    const ult = f.el.ultimate;
    const pal = f.el.look.palette;
    const ecoule = ult.duration - f.ult.active;
    const t = Math.min(1, Math.max(0, ecoule / ult.windup));
    const R = f.radius + 3;

    ctx.save();
    ctx.globalAlpha = 0.35 + 0.6 * t;
    ctx.strokeStyle = teinte(pal.body, 1);
    ctx.lineWidth = 6 + 6 * t;
    ctx.beginPath();
    ctx.arc(f.x, f.y, R, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = teinte(pal.core, 1);
    ctx.lineWidth = 2 + 3 * t;
    ctx.beginPath();
    ctx.arc(f.x, f.y, R, 0, TAU);
    ctx.stroke();

    if (!f.state.totality) {
      ctx.strokeStyle = teinte(pal.core, 0.9);
      for (let k = 0; k < 3; k++) {
        const phase = (now * (1.2 + 1.4 * t) + k / 3) % 1; // 0 → 1, l'anneau se referme
        const rr = R * (2.6 - 1.6 * phase);
        const alpha = Math.min(1, phase * 3) * (1 - phase) * (0.3 + 0.5 * t);
        if (alpha <= 0.01) continue;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 2 + 4 * phase * t;
        ctx.beginPath();
        ctx.arc(f.x, f.y, rr, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  },

  /**
   * **Deux jauges en une, et c'est assumé.** La barre porte la charge
   * d'Éclipse ; pendant l'ultime elle se **vide** au lieu de rester pleine, pour
   * dire le temps qu'il reste — l'annonce et la totalité y passent d'un bloc,
   * comme chez le Soleil.
   */
  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },
};
