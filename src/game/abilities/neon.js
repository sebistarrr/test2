/**
 * Pouvoirs de NEON SHADOW.
 *
 *  • **Les deux lames** — deux pendules amortis que ce module intègre lui-même,
 *    reliés par la chaîne et dont il applique les dégâts par `game.damage`.
 *    Aucune n'est accrochée au corps : le bloc `weapon` de la fiche est
 *    neutralisé (portée 0, dégâts 0) et `f.customWeapon` empêche le moteur de
 *    peindre quoi que ce soit. Le moteur ne connaît qu'une hitbox d'arme par
 *    combattant ; ici il n'en a aucune, et tout tient dans ce module.
 *
 *  • **Les images fantômes** — `Fighter.ghosting` est un compteur générique que
 *    l'Hoplite allume le temps d'une charge ; ici il est **réarmé à chaque
 *    pas**, donc la traînée ne s'arrête jamais.
 *
 *  • **Void Step** — absence par `Fighter.offstage`, réapparition dans le dos
 *    de la cible.
 *
 *  • **Void Rift** — un orbe posé au sol, armé jusqu'à ce qu'un adversaire le
 *    touche.
 *
 *  • **TOTAL ECLIPSE** — deux secondes de frappes depuis des angles tirés au
 *    hasard, l'arène peinte en noir dans `drawOver`.
 *
 * **Le flux de simulation (invariant 2).** Trois choses seulement tirent dans
 * `game.rng`, et toutes les trois décident de dégâts : les angles de frappe de
 * l'éclipse, et les gerbes de `game.fx.burst` (dont le dépôt sait qu'elles
 * consomment le flux — chantier commun à tout le roster). Le pendule, la
 * chaîne et le voile noir sont de l'intégration ou du tracé pur.
 *
 * @module game/abilities/neon
 */

import { TAU, clamp, wrapAngle, hash01 } from '../../core/math.js';
import { ARENA } from '../../data/tuning.js';
import { PIXEL_MAPS } from '../../data/pixelmaps.js';
import { drawSpriteCentered } from '../../render/sprites.js';

export const neonAbilities = {
  id: 'neon',

  init(f) {
    /**
     * **Les deux lames**, chacune avec sa position, sa vitesse et son verrou.
     * Aucune n'est accrochée au corps : ce sont deux pendules indépendants,
     * reliés visuellement par la chaîne.
     */
    f.state.blades = [
      { x: f.x, y: f.y, vx: 0, vy: 0, cd: 0, side: +1 },
      { x: f.x, y: f.y, vx: 0, vy: 0, cd: 0, side: -1 },
    ];

    /**
     * **Le moteur ne peint plus d'arme.** `Fighter.paintWeapon` cède la main dès
     * qu'un `customWeapon` est posé — c'est le crochet par lequel les clones du
     * Shinobi n'en portent aucune. Ici les deux lames sont dessinées par le
     * module, par-dessus les combattants, avec la chaîne : les laisser aussi au
     * moteur en aurait dessiné une troisième, rigide, au centre.
     */
    f.customWeapon = () => {};

    // --- Void Step : phase du module, indépendante de `offstage`
    f.state.step = 0;

    // --- Void Rift
    f.state.riftLive = false; // un orbe est-il posé et armé ?
    f.state.riftX = 0;
    f.state.riftY = 0;
    f.state.specCd = f.el.special.first;
    /** Fenêtre d'attente en cours : la première vaut `first`, les suivantes
     *  `cooldown`. Sans la retenir, la jauge se remplirait sur le mauvais
     *  dénominateur au premier cycle — correction déjà faite chez le Pistolero. */
    f.state.specSpan = f.el.special.first;

    // --- éclipse
    f.state.strikeCd = 0;

    // --- détection des dégâts subis, pour la gerbe de pixels d'ombre
    f.state.hp = f.hp;
  },

  update(f, dt, now, game) {
    const el = f.el;
    const target = f.opponent;

    /* ---------- il éclate en pixels d'ombre quand il encaisse ------------ */
    if (f.hp < f.state.hp) {
      this.shatter(f, game);
      f.state.hp = f.hp;
    } else if (f.hp > f.state.hp) {
      f.state.hp = f.hp; // soin : on resynchronise sans gerbe
    }

    /* ---------- il glisse : la traînée fantôme ne s'arrête jamais -------- */
    // `ghosting` est décompté par le moteur ; le réarmer chaque pas suffit à le
    // garder allumé, sans rien ajouter à `Fighter`.
    f.ghosting = Math.max(f.ghosting, dt * 2);

    /* ---------- la dague braquée ---------------------------------------- */
    if (target && target.alive) {
      f.weaponAngle = Math.atan2(target.y - f.y, target.x - f.x);
    }

    /* ---------- Void Step : l'absence, puis la réapparition -------------- */
    if (f.state.step > 0) {
      f.state.step -= dt;
      if (f.state.step <= 0) {
        f.state.step = 0;
        this.landStep(f, game);
      }
      // pendant l'absence, tout le reste est gelé : il n'est pas sur le plateau
      return;
    }

    if (game.phase !== 'fight') return;

    /* ---------- la dague libre ------------------------------------------ */
    this.tickBlades(f, dt, now, game);

    /* ---------- l'éclipse ------------------------------------------------ */
    const ult = el.ultimate;
    if (f.ult.active > 0) {
      f.ult.active -= dt;
      this.tickEclipse(f, dt, game);
      if (f.ult.active <= 0) {
        f.ult.active = 0;
        f.ult.charge = 0;
        f.ult.ready = false;
      }
    } else {
      f.ult.charge = Math.min(100, f.ult.charge + ult.chargeRate * dt);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castEclipse(f, game);
    }

    /* ---------- Void Step : l'horloge ------------------------------------ */
    f.ability.timer -= dt;
    if (f.ability.timer <= 0 && target && target.onStage) {
      f.ability.timer = el.ability.cooldown;
      f.ability.uses += 1;
      this.castStep(f, game);
      return; // il vient de quitter le plateau : le reste attend son retour
    }

    /* ---------- Void Rift ------------------------------------------------ */
    this.tickRift(f, dt, now, game);
  },

  /* ------------------------------------------------------------------ */
  /*  La dague libre — un pendule, pas une orbite                        */
  /* ------------------------------------------------------------------ */

  /**
   * **Deux pendules, un par lame.** Ressort vers un point de repos,
   * amortissement, et une laisse qui borne la distance au corps.
   *
   * **Le point de repos n'est pas le corps** : un ressort qui vise son propre
   * point d'attache s'y écrase, et au repos les lames se colleraient à la
   * bille. Il est donc posé à `length` **dans le dos du cap**, écarté de
   * `±spread` — l'écart étant ce qui empêche les deux lames de partager la même
   * trajectoire et de se superposer.
   *
   * Rien ici ne tire dans `game.rng` : c'est de l'intégration pure.
   */
  tickBlades(f, dt, now, game) {
    const b = f.el.weapon.blades;
    const k = Math.exp(-b.damp * dt);

    for (const lame of f.state.blades) {
      const a = f.heading + Math.PI + lame.side * b.spread;
      const cx = f.x + Math.cos(a) * b.length;
      const cy = f.y + Math.sin(a) * b.length;

      lame.vx += (cx - lame.x) * b.pull * dt;
      lame.vy += (cy - lame.y) * b.pull * dt;
      lame.vx *= k;
      lame.vy *= k;
      lame.x += lame.vx * dt;
      lame.y += lame.vy * dt;

      // la laisse : jamais plus loin que `length` du corps
      const dx = lame.x - f.x;
      const dy = lame.y - f.y;
      const d = Math.hypot(dx, dy);
      if (d > b.length) {
        const r = b.length / d;
        lame.x = f.x + dx * r;
        lame.y = f.y + dy * r;
      }

      /* --- ce qu'elle blesse ---------------------------------------------
       * `onStage` et pas `alive` : un adversaire hors arène ne doit pas être
       * touché à son dernier point connu (invariant 8). Chaque lame a son
       * propre verrou, donc les deux peuvent toucher dans le même pas — c'est
       * voulu, c'est ce qui rend l'encerclement dangereux. */
      lame.cd = Math.max(0, lame.cd - dt);
      if (lame.cd > 0) continue;
      for (const g of game.fighters) {
        if (g === f || g.team === f.team || !g.onStage) continue;
        if (Math.hypot(g.x - lame.x, g.y - lame.y) > b.radius + g.radius) continue;
        lame.cd = b.cooldown;
        game.damage(g, b.damage, f, {
          kind: 'blade',
          x: lame.x,
          y: lame.y,
          nx: g.x - lame.x,
          ny: g.y - lame.y,
          knockback: b.knockback,
        });
        break;
      }
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Void Step                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Il s'efface. `offstage` porte l'absence — le moteur cesse de le dessiner,
   * de le toucher et d'être touché par lui — et il est armé **0,1 s plus long**
   * que la phase du module : la règle du dépôt est qu'`offstage` ne doit jamais
   * expirer avant le module qui le pilote.
   */
  castStep(f, game) {
    const a = f.el.ability;
    f.state.step = a.duration;
    f.offstage = a.duration + 0.1;
    f.invulnerable = Math.max(f.invulnerable, a.duration);
    this.smoke(f, f.x, f.y, game);
    game.shake(3, 0.18);
  },

  /**
   * Il repose **dans le dos de la cible**, au sens propre : le point d'arrivée
   * se calcule depuis le *cap* de l'adversaire (`heading`), pas depuis la
   * position du Neon — sinon « derrière » voudrait seulement dire « de l'autre
   * côté », ce qui n'est pas la même chose et se voit.
   *
   * La position est bornée à l'arène, comme la naissance d'un clone du Shinobi :
   * un point calculé peut tomber hors du cadre, et le moteur n'y remettrait le
   * combattant qu'au premier rebond.
   */
  landStep(f, game) {
    const a = f.el.ability;
    const t = f.opponent;
    const i = ARENA.inner;
    if (t) {
      const dos = t.heading + Math.PI;
      f.x = clamp(t.x + Math.cos(dos) * a.offset, i.left + f.radius, i.right - f.radius);
      f.y = clamp(t.y + Math.sin(dos) * a.offset, i.top + f.radius, i.bottom - f.radius);
      f.heading = wrapAngle(Math.atan2(t.y - f.y, t.x - f.x));
      f.weaponAngle = f.heading;
    }
    /**
     * **Les deux lames le suivent dans le pas.** Sans ça elles traverseraient
     * l'arène en ligne droite pour le rattraper, et la chaîne — qui les relie
     * l'une à l'autre — barrerait l'écran pendant une demi-seconde. Elles sont
     * reposées sur leur point de repos, vitesse remise à zéro.
     */
    const b = f.el.weapon.blades;
    for (const lame of f.state.blades) {
      const a2 = f.heading + Math.PI + lame.side * b.spread;
      lame.x = f.x + Math.cos(a2) * b.length;
      lame.y = f.y + Math.sin(a2) * b.length;
      lame.vx = 0;
      lame.vy = 0;
    }
    this.smoke(f, f.x, f.y, game);
  },

  /** La fumée noire, au départ comme à l'arrivée. */
  smoke(f, x, y, game) {
    const s = f.el.ability.smoke;
    game.fx.burst(x, y, s.count, {
      color: s.colors,
      speed: s.speed,
      size: s.size,
      life: s.life,
    });
  },

  /* ------------------------------------------------------------------ */
  /*  Void Rift                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * L'orbe est posé, puis **attend**. Il ne s'use pas avec le temps : sa
   * recharge ne repart qu'une fois qu'il a servi — c'est ce qui en fait un
   * piège et pas une zone périodique de plus.
   */
  tickRift(f, dt, now, game) {
    const sp = f.el.special;

    if (!f.state.riftLive) {
      f.state.specCd -= dt;
      if (f.state.specCd <= 0) {
        f.state.riftLive = true;
        f.state.riftX = f.x;
        f.state.riftY = f.y;
      }
      return;
    }

    for (const g of game.fighters) {
      if (g === f || g.team === f.team || !g.onStage) continue;
      if (Math.hypot(g.x - f.state.riftX, g.y - f.state.riftY) > sp.radius + g.radius) continue;
      this.springRift(f, g, now, game);
      break;
    }
  },

  /** Déclenchement : dégâts, chaînes de fumée, flash violet. */
  springRift(f, cible, now, game) {
    const sp = f.el.special;
    game.damage(cible, sp.damage, f, {
      kind: 'rift',
      x: f.state.riftX,
      y: f.state.riftY,
    });
    /**
     * Les chaînes tiennent la cible. `applySlow` est **borné à 0,75** par
     * `Fighter.slowFactor`, pour tout le roster : c'est donc un quasi-arrêt de
     * 0,5 s et non un arrêt franc, et c'est la borne du moteur qu'on respecte
     * plutôt qu'un privilège qu'on s'accorde.
     */
    cible.applySlow(sp.slow, sp.hold, now);
    cible.tint = sp.chains.color;
    cible.tintUntil = now + sp.hold;
    cible.tintAlpha = 0.5;

    const b = sp.burst;
    game.fx.ring(f.state.riftX, f.state.riftY, sp.orb.radius, b.to, b.time, b.color, b.width, false);
    game.shake(4, 0.22);

    f.state.riftLive = false;
    f.state.specCd = sp.cooldown;
    f.state.specSpan = sp.cooldown;
  },

  /* ------------------------------------------------------------------ */
  /*  TOTAL ECLIPSE                                                      */
  /* ------------------------------------------------------------------ */

  castEclipse(f, game) {
    f.ult.active = f.el.ultimate.duration;
    f.ult.ready = false;
    f.state.strikeCd = 0; // la première frappe part avec le noir
    game.shake(7, 0.4);
  },

  /**
   * Les frappes. L'angle est **tiré dans `game.rng`** et doit l'être : il
   * décide d'où il frappe, donc de la position des deux corps à la fin de
   * l'ultime. C'est de la simulation, pas de la décoration.
   */
  tickEclipse(f, dt, game) {
    const st = f.el.ultimate.strike;
    const t = f.opponent;
    f.state.strikeCd -= dt;
    if (f.state.strikeCd > 0 || !t || !t.onStage) return;
    f.state.strikeCd = st.interval;

    const a = game.rng.range(0, TAU);
    const i = ARENA.inner;
    f.x = clamp(t.x + Math.cos(a) * st.offset, i.left + f.radius, i.right - f.radius);
    f.y = clamp(t.y + Math.sin(a) * st.offset, i.top + f.radius, i.bottom - f.radius);
    f.weaponAngle = Math.atan2(t.y - f.y, t.x - f.x);
    f.heading = f.weaponAngle;

    game.damage(t, st.damage, f, {
      kind: 'eclipse',
      x: t.x,
      y: t.y,
      nx: t.x - f.x,
      ny: t.y - f.y,
      knockback: st.knockback,
    });
  },

  /* ------------------------------------------------------------------ */
  /*  Rendu                                                              */
  /* ------------------------------------------------------------------ */

  /** L'orbe du piège, au sol, sous tout le monde. */
  drawUnder(ctx, f, game, now) {
    if (!f.state.riftLive) return;
    const o = f.el.special.orb;
    const pulse = 0.85 + 0.15 * Math.sin(now * o.pulse);
    ctx.save();
    ctx.beginPath();
    ctx.arc(f.state.riftX, f.state.riftY, o.radius * pulse, 0, TAU);
    ctx.fillStyle = o.fill;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = o.edge;
    ctx.stroke();
    ctx.restore();
  },

  /**
   * Par-dessus les combattants : la chaîne et la dague libre, puis — pendant
   * l'ultime — le voile noir et les contours néon.
   */
  drawOver(ctx, f, game, now) {
    if (f.onStage) this.drawChain(ctx, f, now);
    if (f.ult.active > 0) this.drawEclipse(ctx, f, game);
  },

  /**
   * **La chaîne relie les deux lames l'une à l'autre**, et non une lame au
   * corps : c'est ce que montre la maquette, et c'est ce qui rend la silhouette
   * lisible — la bille reste nue, les deux dagues tournent autour, le lien
   * passe derrière elle.
   *
   * Les maillons sont posés par un **hachage pur** du rang (`hash01`), donc
   * sans aucun tirage : la chaîne ne peut pas décaler le duel, quelle que soit
   * sa densité.
   */
  drawChain(ctx, f, now) {
    const spec = f.el.look.flair.chain;
    const [a, b] = f.state.blades;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.globalAlpha = spec.alpha;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineWidth = spec.width;
    ctx.strokeStyle = spec.color;
    ctx.stroke();
    ctx.lineWidth = spec.coreWidth;
    ctx.strokeStyle = spec.core;
    ctx.stroke();

    for (let i = 1; i < spec.links; i++) {
      const t = i / spec.links;
      const jitter = (hash01(i * 7.31) - 0.5) * 4;
      const x = a.x + (b.x - a.x) * t - (b.y - a.y) * 0.02 * jitter;
      const y = a.y + (b.y - a.y) * t + (b.x - a.x) * 0.02 * jitter;
      ctx.beginPath();
      ctx.arc(x, y, spec.linkSize * (0.7 + 0.3 * Math.sin(now * 4 + i)), 0, TAU);
      ctx.fillStyle = spec.core;
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    /**
     * **Les deux lames sont le même sprite**, blitté deux fois : la maquette
     * montre des dagues jumelles. Chacune est orientée selon **son propre
     * déplacement**, ce qui les fait virevoltiger indépendamment — c'est ce qui
     * donne l'asymétrie qu'on cherche, sans qu'aucune des deux ne soit
     * privilégiée dans le code.
     */
    const map = PIXEL_MAPS[f.el.weapon.head.sprite];
    const hauteur = map.h * f.el.weapon.head.scale;
    for (const lame of f.state.blades) {
      ctx.save();
      ctx.translate(lame.x, lame.y);
      ctx.rotate(Math.atan2(lame.vy, lame.vx) || 0);
      drawSpriteCentered(ctx, f.el.weapon.head.sprite, 0, 0, hauteur);
      ctx.restore();
    }
  },

  /**
   * **L'éclipse.** Le voile noir couvre l'arène entière ; `drawOver` est appelé
   * à l'intérieur du découpage de l'arène, donc le HUD n'est pas touché.
   *
   * Ne restent visibles que les contours néon des combattants **présents sur
   * le plateau** — et les chiffres de PV, que `match.js` repasse
   * systématiquement après `drawOver`. C'est une règle posée exprès pour qu'un
   * pouvoir ne puisse jamais masquer une barre de vie : on la subit ici plutôt
   * que de la contourner.
   */
  drawEclipse(ctx, f, game) {
    const e = f.el.ultimate.eclipse;
    const i = ARENA.inner;
    const reste = f.ult.active / f.el.ultimate.duration;

    ctx.save();
    // le voile monte vite et redescend sur la fin
    ctx.globalAlpha = Math.min(1, reste * 6, 1);
    ctx.fillStyle = e.veil;
    ctx.fillRect(i.left, i.top, i.right - i.left, i.bottom - i.top);
    ctx.globalAlpha = 1;

    for (const g of game.fighters) {
      if (!g.onStage || !g.alive) continue;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, TAU);
      ctx.shadowColor = g.el.look.outline;
      ctx.shadowBlur = e.rimGlow;
      ctx.lineWidth = e.rimWidth;
      ctx.strokeStyle = g.el.look.outline;
      ctx.stroke();
      ctx.stroke(); // deux passes : le halo se cumule et la ligne tient sur le noir
      ctx.shadowBlur = 0;
    }

    // flash blanc final, qui rend l'arène
    if (reste < e.flash) {
      ctx.globalAlpha = 1 - reste / e.flash;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(i.left, i.top, i.right - i.left, i.bottom - i.top);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  },

  /** Gerbe de pixels d'ombre quand il encaisse — demandé. */
  shatter(f, game) {
    game.fx.burst(f.x, f.y, 14, {
      color: ['#0b0714', '#a855f7', '#f0abfc'],
      speed: 300,
      size: 6,
      life: 0.4,
    });
  },

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },

  /**
   * Jauge du piège. Elle se remplit vers la pose de l'orbe, puis reste
   * **pleine** tant que l'orbe attend sa victime : c'est la seule des jauges
   * spéciales du dépôt qui indique un état (« armé ») plutôt qu'une durée.
   */
  specialBar(f) {
    if (f.state.riftLive) return { value: 1, active: true };
    const span = f.state.specSpan || f.el.special.cooldown;
    return { value: 1 - clamp(f.state.specCd / span, 0, 1), active: false };
  },
};
