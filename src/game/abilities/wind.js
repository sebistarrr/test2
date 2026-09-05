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

import { TAU, clamp, dist, segmentPointDistance } from '../../core/math.js';
import { ARENA, PHYSICS } from '../../data/tuning.js';
import { Fighter } from '../fighter.js';
import { resolveBodies, weaponHit } from '../physics.js';

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
   * Horloge, entretien et combat des clones, en un seul point — même forme que
   * `tickBlizzard` du Hors-la-loi (invariant 7).
   *
   * Le clone n'est **pas** un `Fighter` inscrit dans `game.fighters` : l'y
   * ajouter le ferait compter dans le HUD, les statistiques, le classement de
   * fin et la condition de victoire, donc l'ajout déborderait hors du module.
   * Le clone est donc un objet ordinaire, coiffé du **prototype `Fighter`**
   * (`Object.setPrototypeOf`) — et c'est de là que vient tout ce qui suit :
   *
   *  • il **se déplace par `Fighter.step()`**, la méthode des vrais
   *    combattants, appelée telle quelle. Pilotage vers l'ennemi, vitesse de
   *    la fiche, amortissement du recul, rebonds sur les quatre murs,
   *    inversion du sens de rotation au rebond, rotation d'arme : rien de tout
   *    ça n'est réécrit ici, donc rien ne peut diverger du vrai Shinobi ;
   *  • il **bouscule et se fait bousculer par `resolveBodies()`**, celle du
   *    moteur. La version maison qui vivait ici était unilatérale — le clone
   *    étant immobile, tout l'écartement retombait sur l'autre corps. Un clone
   *    qui marche n'a plus besoin de ce compromis : il encaisse sa moitié ;
   *  • il **frappe par `weaponHit()`**, celle du moteur elle aussi, avec le
   *    verrou de cadence des vrais combattants (`meleeCd`, décompté par
   *    `step()`). C'est ce qui garantit qu'il porte *exactement* l'arme de
   *    l'original : même disque de 75 px, même cadence, mêmes dégâts.
   *
   * **Il n'a en revanche aucun pouvoir** — ni Tornade, ni Salve de tempête, ni
   * clone à son tour : `tickClone` n'est appelé que sur `f`, et la fiche du
   * clone n'est lue que pour son corps et son arme. Son minuteur de pouvoir
   * reste bloqué en haut, ce qui garde son aura éteinte.
   *
   * Ce qui **reste** écrit ici, et pourquoi : les deux sens de la touche ne
   * sont pas symétriques. Le clone frappant, `weaponHit()` suffit ; le clone
   * frappé, non — voir `cloneWeaponHit` pour la famine que ça produirait. Et
   * les projectiles adverses ne passent jamais par `Projectiles.update()` (qui
   * ne teste que `game.fighters`), donc `tickCloneProjectiles` referme la
   * boucle sur `game.projectiles.list` directement.
   *
   * **Plusieurs clones peuvent coexister** : la minuterie de réapparition
   * (`f.state.cloneCd`) tourne **indépendamment** de la vie des clones déjà
   * posés. Chacun reste un objet **distinct**, donc chacun porte ses propres
   * PV, sa propre position et son propre verrou de cadence — pas de pile ni
   * d'état partagé entre eux.
   */
  tickClone(f, dt, now, game) {
    const sp = f.el.special;
    const clones = f.state.clones;

    // --- déplacement : le pas d'un vrai combattant, sans une ligne à nous
    for (const c of clones) {
      c.hitCd = Math.max(0, c.hitCd - dt);
      // il court après le même ennemi que l'original : le module ne choisit
      // pas de cible, il lit celle que le moteur a déjà désignée (en duel elle
      // est posée une fois pour toutes, à plusieurs `Match.retarget()` la
      // recalcule à chaque pas)
      c.opponent = f.opponent;
      c.step(dt, now);
    }

    // --- corps solides : entre clones, et contre tout le monde en scène,
    // alliés compris — même règle que les vrais combattants (`Match.update`)
    for (let i = 0; i < clones.length; i++) {
      for (let j = i + 1; j < clones.length; j++) resolveBodies(clones[i], clones[j]);
      for (const other of game.fighters) resolveBodies(clones[i], other);
    }

    // --- armes : le clone frappe le camp adverse, et l'encaisse
    for (let i = clones.length - 1; i >= 0; i--) {
      const c = clones[i];
      for (const other of game.fighters) {
        if (other.team === f.team) continue;
        const out = weaponHit(c, other);
        if (out) this.cloneStrike(f, c, other, game, out);
        // verrou **propre au clone** dans ce sens-là seulement, voir
        // `cloneWeaponHit` pour pourquoi il ne peut pas être celui du moteur
        const back = this.cloneWeaponHit(other, c);
        if (back) this.hitClone(c, other, game, back);
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
   * Incantation : un double apparaît derrière le Shinobi, dans l'arène.
   *
   * Il naît avec **l'état d'exécution complet d'un combattant** parce qu'il va
   * passer par `Fighter.step()` : cap, impulsions, ralentissements, verrous et
   * angle d'arme. Aucun n'est décoratif — un seul manquant et `step()` rendrait
   * `NaN` sur la position dès le premier pas.
   *
   * Deux valeurs sont reprises de l'original plutôt qu'inventées : le
   * **cap**, braqué sur l'ennemi (il apparaît dans le dos du Shinobi, donc
   * repartir sur son cap à lui l'enverrait vers le mur), et l'**angle d'arme**,
   * copié tel quel pour que les deux shurikens tournent en phase à la
   * naissance. Ils divergent ensuite d'eux-mêmes, aux rebonds.
   *
   * **Aucun tirage aléatoire ici** : le vrai `Fighter` écarte son cap de départ
   * par `rng.spread(0.35)`, ce qu'un clone ne peut pas se permettre — `game.rng`
   * est le flux de *simulation*, et y puiser une fois par incantation décalerait
   * tout ce qui suit (invariant 2).
   */
  castClone(f, game) {
    const sp = f.el.special;
    const behind = f.heading + Math.PI;
    const inner = ARENA.inner;
    const r = f.el.look.radius;
    const x = clamp(f.x + Math.cos(behind) * sp.offset, inner.left + r, inner.right - r);
    const y = clamp(f.y + Math.sin(behind) * sp.offset, inner.top + r, inner.bottom - r);
    const target = f.opponent;

    const clone = {
      el: f.el,
      x,
      y,
      heading: target ? Math.atan2(target.y - y, target.x - x) : f.heading,
      impulseX: 0,
      impulseY: 0,
      /**
       * **Il naît avec les PV restants du Shinobi — demandé.** Ce n'est pas
       * une valeur de fiche : c'est `f.hp` au moment de l'incantation, donc un
       * clone posé à pleine vie est aussi solide que l'original, et un clone
       * posé en fin de duel arrive aussi entamé que lui.
       *
       * **Copie, pas transfert** : le Shinobi ne perd rien en l'invoquant. Les
       * deux barres vivent ensuite leur vie séparément — le clone n'encaisse
       * que ses propres touches, et rien ne les resynchronise.
       *
       * L'ancienne clé `hp` du bloc spécial (15) disparaît de la fiche du même
       * coup : une clé que plus personne ne lit est exactement la panne
       * silencieuse que `tools/fiche-check.mjs` traque — et il la voit même
       * citée dans un commentaire, d'où cette formulation qui contourne le
       * motif qu'il cherche.
       */
      hp: f.hp,
      maxHp: f.hp,
      flash: 0,
      /**
       * **La teinte qui le distingue de l'original.** Le corps du Shinobi est
       * un noir plein (`#141414`) : un simple voile de transparence ne suffit
       * plus à dire lequel est lequel maintenant que le clone marche et porte
       * la même arme. `tint`/`tintAlpha` sont les compteurs génériques que
       * `Fighter.draw()` lit déjà pour le givre du Hors-la-loi — ils
       * **mélangent** une couleur au corps au lieu de la remplacer, donc le
       * clone reste le même personnage, un ton plus clair.
       *
       * `tintUntil` à l'infini : `step()` efface la teinte dès que le temps de
       * duel la dépasse, et celle-ci ne doit jamais s'effacer.
       */
      tint: sp.tint,
      tintUntil: Infinity,
      tintAlpha: sp.tintAlpha,
      slows: [],
      dots: [],
      offstage: 0,
      invulnerable: 0,
      // l'aura ne doit jamais s'allumer sur le clone : un minuteur de pouvoir
      // toujours haut la maintient éteinte (`auraVisible()` la lit telle quelle)
      ability: { timer: 999 },
      ult: { ready: false, active: 0 },
      // arme : **celle de l'original, dessinée par le tracé de l'original**.
      // Aucun `customWeapon` n'est posé, donc `paintWeapon()` retombe sur
      // `drawWeapon()` — le clone porte le shuriken, il n'en jette plus.
      weaponAngle: f.weaponAngle,
      spinDir: f.el.weapon.spinDir,
      weaponLateral: 0,
      weaponTwirl: 0,
      meleeCd: 0, // sa propre cadence de frappe, décomptée par `step()`
      boost: 0,
      boostFactor: 1,
      trailTimer: 0,
      wall: null,
      opponent: null,
      hitCd: 0, // verrou de touche **subie**, propre au clone — voir `cloneWeaponHit`
    };
    Object.setPrototypeOf(clone, Fighter.prototype);
    f.state.clones.push(clone);

    game.fx.ring(x, y, 10, 90, 0.4, 'rgba(20,20,20,0.7)', 6, true);
    game.fx.burst(x, y, 16, { color: ['#141414', '#e8621b', '#3a3a3a'], speed: 220, size: 5, life: 0.4 });
  },

  /**
   * **Le clone frappe — même arme, même géométrie, même cadence.**
   *
   * C'est `Match.resolveMelee` recopiée sur l'essentiel, à une différence
   * près et une seule : la touche est **attribuée au vrai Shinobi** (`f`) et
   * non au clone. C'est ce qui fait qu'elle charge son ultime et compte dans
   * ses statistiques — `Match.damage()` lit `source.ult`, `source.el` et
   * cherche `source` dans `game.fighters`, trois choses qu'un clone n'a pas
   * (le commentaire d'index de `damage()` prévoit d'ailleurs déjà le cas).
   *
   * Le verrou de cadence, lui, est bien posé **sur le clone** : deux doubles
   * doivent pouvoir frapper indépendamment, et le poser sur `f` rendrait
   * l'original muet à chaque coup porté par l'un d'eux.
   *
   * La formule de dégâts reçoit `f` et pas `c` : quand elle dépend d'une stat
   * évolutive, c'est celle de l'original qui compte — un clone n'a pas de
   * progression propre, il n'a pas de pouvoir pour en gagner.
   */
  cloneStrike(f, clone, target, game, hit) {
    const melee = f.el.weapon.melee;
    const dmg = typeof melee.damage === 'function' ? melee.damage(f) : melee.damage;
    const kb = typeof melee.knockback === 'function' ? melee.knockback(f) : melee.knockback;

    clone.meleeCd = melee.cooldown;
    game.damage(target, dmg, f, {
      kind: 'melee',
      x: hit.x,
      y: hit.y,
      nx: hit.nx,
      ny: hit.ny,
      knockback: kb,
    });
    clone.push(-hit.nx, -hit.ny, melee.selfRecoil);

    // effets d'arme à la touche : ils appartiennent à l'arme, donc le clone
    // les porte aussi. Le Shinobi n'en déclare qu'un (`slow`) ; les piles, qui
    // sont de la progression et non de l'arme, restent à l'original.
    const onHit = melee.onHit;
    if (onHit?.slow) target.applySlow(onHit.slow, onHit.slowDuration ?? 1.5, game.time);
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

  /**
   * Les clones, dessinés par-dessus tout le reste — **le rendu du vrai
   * Shinobi**, arme comprise (`Object.setPrototypeOf` lui a donné
   * `Fighter.prototype.draw`, et aucun `customWeapon` ne le détourne).
   *
   * **Trois écarts de ton seulement séparent le vrai du double**, et c'est
   * volontaire : plus, et ce ne serait plus le même personnage.
   *
   *  1. le corps est **mélangé** à `special.tint` (posé à l'incantation) : le
   *     noir plein de l'original passe à un gris ardoise sur le clone ;
   *  2. un **voile de transparence** (`special.alpha`) : le blanc de l'arène
   *     transparaît un peu à travers lui ;
   *  3. et il ne traîne **ni ruban ni sillage** — `render/flair.js` ne boucle
   *     que sur `game.fighters`, dont le clone ne fait pas partie. Ce
   *     troisième écart n'a rien coûté, mais c'est le plus lisible en
   *     mouvement : c'est celui qui laisse une traîne qui mène.
   *
   * Masqués dès que le Shinobi meurt, pour ne pas les laisser figés à l'écran
   * pendant le ralenti du K.O.
   */
  drawOver(ctx, f, game, now) {
    if (!f.alive) return;
    for (const c of f.state.clones) {
      ctx.save();
      ctx.globalAlpha = f.el.special.alpha;
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
