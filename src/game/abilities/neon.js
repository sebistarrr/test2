/**
 * Pouvoirs de NEON SHADOW.
 *
 *  • **La dague braquée** — `weapon.spin = 0`, ce module recopie l'angle vers
 *    la cible à chaque image. Même mécanique que le revolver du Pistolero.
 *
 *  • **La dague libre** — un pendule amorti que ce module intègre lui-même, et
 *    dont il applique les dégâts par `game.damage`. Le moteur ne connaît qu'une
 *    hitbox d'arme par combattant ; plutôt que de lui en apprendre une seconde
 *    pour un seul personnage, tout tient ici (invariant 12).
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
    // --- dague libre : position et vitesse propres, en coordonnées monde
    f.state.bx = f.x;
    f.state.by = f.y;
    f.state.bvx = 0;
    f.state.bvy = 0;
    f.state.chainCd = 0;

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
    this.tickBlade(f, dt, now, game);

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

  /** Le pommeau de la dague principale : le point d'attache de la chaîne. */
  anchor(f) {
    const h = f.el.weapon.handle.length;
    return {
      x: f.x + Math.cos(f.weaponAngle) * h,
      y: f.y + Math.sin(f.weaponAngle) * h,
    };
  },

  /**
   * **Ressort + amortissement + laisse.** Trois lignes de physique, et les deux
   * comportements demandés en sortent sans être codés : en ligne droite la lame
   * traîne derrière, en virage sec elle part sur le côté. C'est le propre d'un
   * pendule — le coder « en orbite » aurait donné un satellite, pas une lame au
   * bout d'une chaîne.
   */
  tickBlade(f, dt, now, game) {
    const ch = f.el.weapon.chain;
    const s = f.state;
    const anc = this.anchor(f);

    /**
     * **Le ressort ne vise pas le pommeau, il vise un point *derrière* lui.**
     *
     * Premier essai : rappel vers le point d'attache. La lame s'y écrasait dès
     * que le porteur ralentissait — au repos, une chaîne tendue vers son propre
     * pommeau a pour seule position d'équilibre le pommeau lui-même. On ne
     * voyait plus qu'une dague collée à la bille.
     *
     * La cible est donc à `length` **dans le dos du cap** : au repos la lame
     * flotte là où on l'attend, en ligne droite elle traîne derrière, et en
     * virage sec la cible pivote plus vite que la lame ne peut suivre — d'où
     * le déport latéral demandé. Aucun de ces trois comportements n'est écrit :
     * ils sortent tous du même pendule.
     */
    const cx = anc.x - Math.cos(f.heading) * ch.length;
    const cy = anc.y - Math.sin(f.heading) * ch.length;
    s.bvx += (cx - s.bx) * ch.pull * dt;
    s.bvy += (cy - s.by) * ch.pull * dt;
    const k = Math.exp(-ch.damp * dt);
    s.bvx *= k;
    s.bvy *= k;
    s.bx += s.bvx * dt;
    s.by += s.bvy * dt;

    // la laisse : jamais plus loin que `length` du pommeau
    let dx = s.bx - anc.x;
    let dy = s.by - anc.y;
    const d = Math.hypot(dx, dy);
    if (d > ch.length) {
      const r = ch.length / d;
      s.bx = anc.x + dx * r;
      s.by = anc.y + dy * r;
      dx *= r;
      dy *= r;
    }

    /* --- ce qu'elle blesse ------------------------------------------------
     * `onStage` et pas `alive` : un adversaire hors arène (le Bond de
     * l'Hoplite, le Pas du vide d'un autre Neon) ne doit pas être touché à son
     * dernier point connu (invariant 8). */
    s.chainCd = Math.max(0, s.chainCd - dt);
    if (s.chainCd > 0) return;
    for (const g of game.fighters) {
      if (g === f || g.team === f.team || !g.onStage) continue;
      if (Math.hypot(g.x - s.bx, g.y - s.by) > ch.radius + g.radius) continue;
      s.chainCd = ch.cooldown;
      game.damage(g, ch.damage, f, {
        kind: 'chain',
        x: s.bx,
        y: s.by,
        nx: g.x - s.bx,
        ny: g.y - s.by,
        knockback: 90,
      });
      break;
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
    // la lame libre le suit dans le pas : sans ça elle traverserait l'arène en
    // ligne droite pour le rattraper, et la chaîne se lirait comme un bug
    const anc = this.anchor(f);
    f.state.bx = anc.x;
    f.state.by = anc.y;
    f.state.bvx = 0;
    f.state.bvy = 0;
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
   * Le lien spectral et la lame au bout. Les maillons sont posés par un
   * **hachage pur** du rang (`hash01`), donc sans aucun tirage : la chaîne ne
   * peut pas décaler le duel, quelle que soit sa densité.
   */
  drawChain(ctx, f, now) {
    const spec = f.el.look.flair.chain;
    const anc = this.anchor(f);
    const s = f.state;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.globalAlpha = spec.alpha;
    ctx.beginPath();
    ctx.moveTo(anc.x, anc.y);
    ctx.lineTo(s.bx, s.by);
    ctx.lineWidth = spec.width;
    ctx.strokeStyle = spec.color;
    ctx.stroke();
    ctx.lineWidth = spec.coreWidth;
    ctx.strokeStyle = spec.core;
    ctx.stroke();

    for (let i = 1; i < spec.links; i++) {
      const t = i / spec.links;
      const jitter = (hash01(i * 7.31) - 0.5) * 4;
      const x = anc.x + (s.bx - anc.x) * t - (s.by - anc.y) * 0.02 * jitter;
      const y = anc.y + (s.by - anc.y) * t + (s.bx - anc.x) * 0.02 * jitter;
      ctx.beginPath();
      ctx.arc(x, y, spec.linkSize * (0.7 + 0.3 * Math.sin(now * 4 + i)), 0, TAU);
      ctx.fillStyle = spec.core;
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    /**
     * **La lame libre est la même dague, pas un losange.** Premier essai : un
     * quadrilatère tracé à la main, parce qu'il était plus court à écrire. À
     * l'écran, la maquette montre **deux dagues jumelles** et on en voyait une
     * belle et un caillou — l'asymétrie ne venait plus de la chaîne mais de la
     * qualité du dessin.
     *
     * `drawSpriteCentered` blitte donc le même PNG, à la même hauteur dessinée
     * que la dague principale, orienté selon **son propre déplacement** : c'est
     * ce qui la fait virevolter au lieu de glisser à plat.
     */
    const map = PIXEL_MAPS[f.el.weapon.head.sprite];
    const hauteur = map.h * f.el.weapon.head.scale;
    const a = Math.atan2(s.bvy, s.bvx) || 0;
    ctx.save();
    ctx.translate(s.bx, s.by);
    ctx.rotate(a);
    drawSpriteCentered(ctx, f.el.weapon.head.sprite, 0, 0, hauteur);
    ctx.restore();
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
