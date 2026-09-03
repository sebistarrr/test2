/**
 * Pouvoirs du VENT.
 *
 *  • Tornade — une **rafale tournoyante déclenchée autour de lui**, pas un
 *    vortex lancé au loin. Détection automatique sur trois vidéos : elle ne
 *    dure que 4 à 6 images (0,13 → 0,20 s) et son centre reste à moins de
 *    30 px du Vent. Elle projette violemment ce qu'elle attrape.
 *
 *    Elle part sur une recharge qui **se raccourcit de 4 s à 0,5 s**, et les
 *    deux compteurs du HUD avancent ensemble (+2 dégâts, −0,5 s) — mais
 *    seulement quand la rafale **touche** : on compte 17 déclenchements pour
 *    7 progressions sur un même duel, et les incantations qui ne rapportent
 *    rien sont précisément celles où l'adversaire était hors de portée.
 *
 *  • Salve de tempête (ultime) — décharge courte et dense de croissants
 *    d'air : sur la vidéo, la cible perd ~16 PV en une seconde et demie au
 *    moment où la jauge se vide.
 *
 * @module game/abilities/wind
 */

import { TAU, clamp, dist, segmentPointDistance, wrapAngle } from '../../core/math.js';
import { ARENA, PHYSICS } from '../../data/tuning.js';
import { Fighter } from '../fighter.js';

export const windAbilities = {
  id: 'wind',

  init(f) {
    /** @type {Array<{x:number,y:number,r:number,life:number,max:number,angle:number}>} */
    f.state.gusts = [];
    f.state.volleyTimer = 0;

    // Clone d'ombre : minuterie propre, sans rapport avec la Tornade ni
    // l'ultime — même forme que `f.state.spec` du Hors-la-loi.
    const sp = f.el.special;
    /** @type {object[]} plusieurs clones peuvent coexister */
    f.state.clones = [];
    f.state.cloneCd = sp.first;
    f.state.cloneSpan = sp.first;
  },

  update(f, dt, now, game) {
    const el = f.el;

    // les rafales ne vivent qu'une fraction de seconde
    for (let i = f.state.gusts.length - 1; i >= 0; i--) {
      const g = f.state.gusts[i];
      g.life -= dt;
      g.angle += 14 * dt;
      if (g.life <= 0) f.state.gusts.splice(i, 1);
    }

    /* ---------- ultime ---------- */
    const ult = el.ultimate;
    if (f.ult.active > 0) {
      f.ult.active -= dt;
      f.state.volleyTimer -= dt;
      if (f.state.volleyTimer <= 0) {
        f.state.volleyTimer = ult.volley.interval;
        this.fireVolley(f, game);
      }
      if (f.ult.active <= 0) {
        f.ult.active = 0;
        f.ult.charge = 0;
        f.ult.ready = false;
        f.boost = 0;
      }
    } else if (game.phase === 'fight') {
      f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castVolley(f, game);
    }

    /* ---------- tornade ---------- */
    if (game.phase !== 'fight') return;
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) this.castTornado(f, now, game);

    /* ---------- clone d'ombre ---------- */
    this.tickClone(f, dt, now, game);
  },

  castTornado(f, now, game) {
    const a = f.el.ability;
    const t = a.tornado;
    const target = f.opponent;

    f.state.gusts.push({ x: f.x, y: f.y, r: t.radius, life: t.duration, max: t.duration, angle: 0 });
    game.fx.ring(f.x, f.y, 20, t.radius, 0.3, t.edge, 6, true);
    for (let i = 0; i < 14; i++) {
      const ang = game.rng.range(0, TAU);
      game.fx.spawn({
        kind: 'dot',
        x: f.x + Math.cos(ang) * t.radius * 0.7,
        y: f.y + Math.sin(ang) * t.radius * 0.7,
        vx: -Math.sin(ang) * 260,
        vy: Math.cos(ang) * 260,
        life: 0.35,
        size: 3,
        color: '#cfc6a8',
        drag: 1.6,
      });
    }

    // la rafale ne blesse que si l'adversaire est pris dedans
    let landed = false;
    if (target && target.alive) {
      const dx = target.x - f.x;
      const dy = target.y - f.y;
      const d = Math.hypot(dx, dy);
      if (d <= t.radius + target.radius) {
        landed = true;
        game.damage(target, t.damage(f), f, {
          kind: 'tornado',
          x: target.x,
          y: target.y,
          nx: dx / (d || 1),
          ny: dy / (d || 1),
          knockback: t.knockback,
        });
      }
    }

    // la cadence s'accélère à chaque rafale…
    let cd = f.ability.cooldown - a.cooldownStepOnCast;
    // …et une rafale qui touche fait avancer le couple affiché d'un cran
    if (landed) {
      f.stacks = Math.min(t.damageMax, f.stacks + t.damageGain);
      cd -= a.cooldownStep;
    }
    f.ability.cooldown = Math.max(a.cooldownFloor, cd);
    f.ability.timer = f.ability.cooldown;
  },

  castVolley(f, game) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.state.volleyTimer = 0;
    f.boost = ult.duration;
    f.boostFactor = ult.speedBonus;
    game.fx.ring(f.x, f.y, 20, 320, 0.5, 'rgba(214,205,170,0.9)', 7, true);
    game.shake(4, 0.25);
  },

  fireVolley(f, game) {
    const v = f.el.ultimate.volley;
    const target = f.opponent;
    const base = target && target.alive ? Math.atan2(target.y - f.y, target.x - f.x) : f.heading;
    for (let i = 0; i < v.count; i++) {
      const off = v.count === 1 ? 0 : (i / (v.count - 1) - 0.5) * v.spread;
      game.projectiles.spawn(f, v.projectile, base + off);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  CLONE D'OMBRE — pouvoir spécial, sur horloge propre                */
  /* ------------------------------------------------------------------ */

  /**
   * Horloge, entretien et combat du clone, en un seul point — même forme que
   * `tickBlizzard` du Hors-la-loi (invariant 7).
   *
   * Le clone n'est **pas** un `Fighter` inscrit dans `game.fighters` : le
   * moteur (`match.js`, `physics.js`, `projectiles.js`) n'en connaît que deux,
   * `this.a`/`this.b`, et c'est vrai de bout en bout (HUD, stats, victoire).
   * L'y ajouter aurait fait déborder l'ajout hors du module. Le clone est
   * donc un objet ordinaire, coiffé du **prototype `Fighter`**
   * (`Object.setPrototypeOf`) : il hérite `draw()`, `radius`, `onStage`,
   * `weaponPivot()`… gratuitement, et reste identique au vrai Shinobi sans
   * dupliquer son rendu. Le corps à corps adverse le touche en **réutilisant
   * `weaponHit()`** telle quelle (elle ne demande que position, rayon et
   * statut — un plain object coiffé du prototype les fournit tous) ; les
   * projectiles adverses, eux, ne passent jamais par `Projectiles.update()`
   * (qui ne teste que `game.fighters`) — `tickCloneProjectiles` referme la
   * boucle ici, sur `game.projectiles.list` directement, déjà manipulé sans
   * détour ailleurs (`Match.startVictory` le vide de la même façon).
   *
   * **Plusieurs clones peuvent coexister**, à la demande : la minuterie de
   * réapparition (`f.state.cloneCd`) tourne **indépendamment** de la vie des
   * clones déjà posés — elle ne se réarme plus à la mort de l'un d'eux, mais
   * à chaque incantation. Chaque clone reste un objet **distinct** dans
   * `f.state.clones`, donc chacun porte ses propres PV et n'en perd que sur
   * ses propres touches — pas de pile ni d'état partagé entre eux.
   */
  tickClone(f, dt, now, game) {
    const sp = f.el.special;
    const target = f.opponent;

    for (let i = f.state.clones.length - 1; i >= 0; i--) {
      const c = f.state.clones[i];
      c.flash = Math.max(0, c.flash - dt);
      c.hitCd = Math.max(0, c.hitCd - dt);

      // corps solide : personne ne le traverse, ni l'adversaire ni le vrai
      // Shinobi — le clone est immobile, donc tout l'écartement retombe sur
      // le corps qui le percute (voir `resolveCloneBody`)
      this.resolveCloneBody(c, f);
      this.resolveCloneBody(c, target);

      // riposte : le clone jette lui aussi des shurikens
      c.attackTimer -= dt;
      if (c.attackTimer <= 0 && target && target.onStage) {
        c.attackTimer = sp.attack.interval;
        this.throwFromClone(f, c, target, game);
      }

      // touché par l'arme adverse — verrou **propre au clone**, voir
      // `cloneWeaponHit` pour pourquoi il ne peut pas être celui du moteur
      if (target && target.onStage) {
        const hit = this.cloneWeaponHit(target, c);
        if (hit) this.hitClone(c, target, game, hit);
      }

      // touché par un projectile adverse — chaque clone teste la même liste,
      // mais un projectile est retiré dès qu'il touche, donc il ne peut
      // jamais blesser deux clones (ni un clone et le vrai Shinobi)
      this.tickCloneProjectiles(f, c, game);

      // permanent : seuls ses propres PV le font disparaître, pas une horloge
      if (c.hp <= 0) this.despawnClone(f, game, i);
    }

    f.state.cloneCd -= dt;
    if (f.state.cloneCd <= 0) {
      f.state.cloneCd = sp.cooldown;
      f.state.cloneSpan = sp.cooldown;
      this.castClone(f, game);
    }
  },

  /**
   * **Corps solide, à la demande.** Même géométrie que `resolveBodies()` de
   * `physics.js` (séparation + rebond), mais à sens unique : le clone ne
   * bouge jamais, donc c'est toujours l'autre corps qui encaisse tout
   * l'écartement et tout le recul. Écrite ici plutôt que dans `physics.js` —
   * qui ne connaît que `this.a`/`this.b` — pour la même raison que le reste
   * du pouvoir : le rester confiné au module du Shinobi.
   */
  resolveCloneBody(clone, other) {
    if (!other || !other.onStage) return;
    const dx = other.x - clone.x;
    const dy = other.y - clone.y;
    const d = Math.hypot(dx, dy);
    const min = clone.radius + other.radius;
    if (d === 0 || d >= min) return;

    const nx = dx / d;
    const ny = dy / d;
    other.x += nx * (min - d);
    other.y += ny * (min - d);
    other.heading = wrapAngle(Math.atan2(ny, nx));
    other.push(nx, ny, 130 * PHYSICS.bodyRestitution);
  },

  /** Incantation : un double apparaît derrière le Shinobi, dans l'arène. */
  castClone(f, game) {
    const sp = f.el.special;
    const behind = f.heading + Math.PI;
    const inner = ARENA.inner;
    const r = f.el.look.radius;
    const x = clamp(f.x + Math.cos(behind) * sp.offset, inner.left + r, inner.right - r);
    const y = clamp(f.y + Math.sin(behind) * sp.offset, inner.top + r, inner.bottom - r);

    const clone = {
      el: f.el,
      x,
      y,
      hp: sp.hp,
      maxHp: sp.hp,
      flash: 0,
      tint: null,
      tintAlpha: 1,
      dots: [],
      offstage: 0,
      invulnerable: 0,
      // l'aura ne doit jamais s'allumer sur le clone : un minuteur de pouvoir
      // toujours haut la maintient éteinte (`auraVisible()` la lit telle quelle)
      ability: { timer: 999 },
      ult: { ready: false, active: 0 },
      // pas d'arme rattachée au corps — demandé : le clone riposte par ses
      // propres shurikens (`throwFromClone`), sans en porter un sur lui.
      // `paintWeapon()` appelle `customWeapon` s'il est défini au lieu de
      // `drawWeapon()`, donc un no-op suffit à ne rien dessiner.
      customWeapon: () => {},
      attackTimer: sp.attack.interval * 0.5, // première riposte plus rapide qu'un cycle complet
      hitCd: 0, // verrou de touche propre au clone — voir `cloneWeaponHit`
    };
    Object.setPrototypeOf(clone, Fighter.prototype);
    f.state.clones.push(clone);

    game.fx.ring(x, y, 10, 90, 0.4, 'rgba(20,20,20,0.7)', 6, true);
    game.fx.burst(x, y, 16, { color: ['#141414', '#e8621b', '#3a3a3a'], speed: 220, size: 5, life: 0.4 });
  },

  /** Le clone jette un shuriken vers l'adversaire — même projectile que le vrai. */
  throwFromClone(f, clone, target, game) {
    const def = f.el.projectiles[f.el.special.attack.projectile];
    const angle = Math.atan2(target.y - clone.y, target.x - clone.x);
    /**
     * Émission manuelle plutôt que `Projectiles.spawn(owner, key, angle)` :
     * celle-ci part toujours de la position de `owner`, or le tir doit partir
     * du **clone**, tout en restant attribué à `f` — c'est ce qui fait que le
     * coup au but charge l'ultime du vrai Shinobi et compte dans ses
     * statistiques (`Match.damage()` lit `source.ult`/`source.el`, absents
     * d'un simple point d'origine).
     */
    game.projectiles.list.push({
      def,
      owner: f,
      x: clone.x + Math.cos(angle) * (clone.radius + 6),
      y: clone.y + Math.sin(angle) * (clone.radius + 6),
      vx: Math.cos(angle) * def.speed,
      vy: Math.sin(angle) * def.speed,
      angle,
      life: def.life,
      bounces: def.bounces,
      trailTimer: 0,
      trailSeed: 0,
    });
  },

  /**
   * **Le clone porte son propre verrou de touche, pas celui du moteur.**
   *
   * `weaponHit()` refuse la touche quand `attacker.meleeCd > 0`. Le clone ne
   * pouvait donc être touché que dans les fenêtres où l'arme adverse était
   * *déjà* disponible — or `Match.resolveMelee` tourne **avant** les modules
   * et pose ce verrou dès qu'elle atteint le vrai Shinobi, qui se trouve à
   * 130 px du clone, donc à portée aux mêmes instants. Ce n'était pas une
   * course équitable, c'était une famine : au banc, **100 % des pas où un
   * clone était géométriquement à portée étaient bloqués par `meleeCd`**
   * (15/15, 49/49, 34/34 contre les trois adversaires) — aucune touche de
   * mêlée n'atteignait jamais un clone, tous ses PV perdus venaient des
   * projectiles.
   *
   * D'où ce test : **la géométrie de `weaponHit()` mot pour mot** — le même
   * `bladeSegment()` du moteur et la même `segmentPointDistance`, donc la
   * hitbox ne peut pas diverger de celle des vrais combattants — mais gardé
   * par `clone.hitCd`, propre à chaque clone. Chaque corps encaisse alors au
   * plus une touche par cycle d'arme, indépendamment des autres : une lame qui
   * balaie une grappe de corps les mord tous, ce qui est aussi ce qu'on voit.
   */
  cloneWeaponHit(attacker, clone) {
    if (!attacker.onStage || clone.hitCd > 0) return null;
    const b = attacker.bladeSegment();
    const { d, x, y } = segmentPointDistance(b.ax, b.ay, b.bx, b.by, clone.x, clone.y);
    if (d > clone.radius + b.r) return null;
    const dx = clone.x - x;
    const dy = clone.y - y;
    const len = Math.hypot(dx, dy) || 1;
    return { x, y, nx: dx / len, ny: dy / len };
  },

  /** Le clone encaisse un coup de mêlée adverse. */
  hitClone(clone, opponent, game, hit) {
    const melee = opponent.el.weapon.melee;
    const dmg = typeof melee.damage === 'function' ? melee.damage(opponent) : melee.damage;
    clone.hp = Math.max(0, clone.hp - dmg);
    clone.flash = PHYSICS.hitFlash;
    // le verrou est posé **sur le clone**, jamais sur `opponent.meleeCd` : y
    // toucher rendrait le vrai Shinobi intouchable dès qu'un clone traîne à
    // côté de lui, ce qui remplacerait une famine par l'autre
    clone.hitCd = melee.cooldown;
    opponent.push(-hit.nx, -hit.ny, melee.selfRecoil);
    game.fx.burst(hit.x, hit.y, 8, {
      color: [opponent.el.look.accent, '#ffffff', '#141414'],
      speed: 220,
      size: 4,
      life: 0.3,
    });
  },

  /**
   * Le clone encaisse les projectiles adverses en vol.
   *
   * Tourne **avant** `Match.projectiles.update()` dans le pas de simulation
   * (les pouvoirs sont mis à jour avant les projectiles) : ce test porte donc
   * sur la position que les projectiles avaient à la fin du pas précédent, un
   * cran derrière celle testée contre les deux vrais combattants. À la cadence
   * de simulation du jeu, l'écart ne se voit pas ; documenté ici plutôt que
   * corrigé, pour ne pas toucher l'ordre de `match.js` pour ce seul besoin.
   */
  tickCloneProjectiles(f, clone, game) {
    const list = game.projectiles.list;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      if (p.owner === f) continue; // les propres shurikens du clone ne le touchent pas
      if (dist(p.x, p.y, clone.x, clone.y) > clone.radius + p.def.radius) continue;
      const dmg = typeof p.def.damage === 'function' ? p.def.damage(p.owner) : p.def.damage;
      clone.hp = Math.max(0, clone.hp - dmg);
      clone.flash = PHYSICS.hitFlash;
      game.projectiles.kill(i, p);
    }
  },

  /**
   * Fin de vie d'**un** clone, uniquement à 0 PV — il est permanent sinon.
   * `index` cible celui-là précisément dans `f.state.clones` : la minuterie
   * de réapparition n'est plus touchée ici, elle tourne indépendamment de la
   * vie de chaque clone (voir `tickClone`).
   */
  despawnClone(f, game, index) {
    const c = f.state.clones[index];
    game.fx.burst(c.x, c.y, 22, { color: ['#141414', '#e8621b', '#3a3a3a'], speed: 260, size: 5, life: 0.4 });
    f.state.clones.splice(index, 1);
  },

  /**
   * Rafale : un **disque flou couleur sable** fait de larges pales en éventail
   * qui rayonnent du centre — c'est le motif relevé image par image, et non
   * des cercles concentriques. Chaque pale est un fuseau incurvé, dessiné sans
   * aucun contour, et le cœur reste plus dense et plus chaud.
   */
  drawUnder(ctx, f) {
    const t = f.el.ability.tornado;
    for (const g of f.state.gusts) {
      const k = g.life / g.max; // 1 → 0
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);

      const r = g.r * (0.72 + 0.28 * (1 - k)); // le tourbillon s'ouvre

      // halo de fond : le disque entier, très dilué sur le bord
      const grad = ctx.createRadialGradient(0, 0, r * 0.06, 0, 0, r);
      grad.addColorStop(0, t.core);
      grad.addColorStop(0.55, t.color);
      grad.addColorStop(1, t.edge);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();

      // pales en éventail : larges fuseaux qui partent du cœur et s'évasent,
      // volontairement en recouvrement pour retrouver le flou de la vidéo
      ctx.fillStyle = t.color;
      const span = TAU / t.blades;
      for (let i = 0; i < t.blades; i++) {
        const a0 = span * i;
        const a1 = a0 + span * 1.45; // > span : les pales se chevauchent
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
          Math.cos(a0 + span * 0.2) * r * 0.62,
          Math.sin(a0 + span * 0.2) * r * 0.62,
          Math.cos(a0 + span * 0.55) * r,
          Math.sin(a0 + span * 0.55) * r,
        );
        ctx.arc(0, 0, r, a0 + span * 0.55, a1 - span * 0.55);
        ctx.quadraticCurveTo(
          Math.cos(a1 - span * 0.2) * r * 0.62,
          Math.sin(a1 - span * 0.2) * r * 0.62,
          0,
          0,
        );
        ctx.fill();
      }

      // cœur plus dense, légèrement décentré comme sur la vidéo
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.42);
      core.addColorStop(0, t.core);
      core.addColorStop(1, 'rgba(168,152,124,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.42, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  },

  /** Les clones, dessinés par-dessus tout le reste — même rendu que le vrai
   *  Shinobi (`Object.setPrototypeOf` lui a donné `Fighter.prototype.draw`),
   *  à une légère transparence près : c'est ce qui dit lequel porte les PV
   *  du duel. Masqués dès que le Shinobi meurt, pour ne pas les laisser
   *  figés à l'écran pendant le ralenti du K.O. */
  drawOver(ctx, f, game, now) {
    if (!f.alive) return;
    for (const c of f.state.clones) {
      ctx.save();
      ctx.globalAlpha = 0.88;
      c.draw(ctx, now);
      ctx.restore();
    }
  },

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },

  /**
   * Jauge du clone : se remplit vers la prochaine incantation.
   *
   * Plusieurs clones pouvant coexister à des PV différents, une seule barre
   * ne peut plus dire « les PV du clone actif » comme du temps d'un clone
   * unique — elle annonce donc uniquement la **prochaine** apparition,
   * qu'il y ait déjà des clones en jeu ou non.
   */
  specialBar(f) {
    return {
      value: 1 - clamp(f.state.cloneCd / f.state.cloneSpan, 0, 1),
      active: f.state.clones.length > 0,
    };
  },
};
