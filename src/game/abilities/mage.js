/**
 * MAGE — tireur à distance, construit sur la mécanique de Magia.
 *
 *  • **Sceptre braqué et posé sur le flanc.** La fiche porte `weapon.spin = 0`
 *    et c'est ce module qui écrit `weaponAngle` — troisième arme braquée du
 *    roster après le revolver et la lance. Le décalage latéral passe par
 *    `weaponLateral`, le compteur générique du `Fighter` : le moteur le
 *    décompte sans savoir pourquoi, exactement comme pour la charge du
 *    Lancier.
 *
 *  • **Cadence qui monte.** `f.stacks` est la cadence de tir en orbes par
 *    seconde, et **chaque orbe tirée l'augmente de 0,05** — c'est la stat
 *    « Attack Speed » de Magia, mesurée sur sa vidéo (1,00 au départ, 2,00 à
 *    13 s). La montée est donc exponentielle, et plafonnée.
 *
 *  • **Orbes guidées.** Le guidage vit dans `game/projectiles.js`, piloté par
 *    `projectiles.orb.homing` de la fiche ; ce module ne fait que tirer.
 *
 *  • **Tempête de sève** (ultime) — la cible disparaît sous une nuée de cubes
 *    verts, clouée sur place, pendant que le Mage se régénère.
 *
 *    Elle vient de la Plante, à qui ce module la **déléguait** tant que celle-ci
 *    existait. La Plante supprimée avec les six autres éléments gelés, il n'y
 *    avait plus rien à qui déléguer : les quatre méthodes concernées sont
 *    rapatriées ici, à comportement identique — matrice vérifiée inchangée. Le
 *    Semis (les bulbes posés au sol), lui, avait déjà été retiré sur demande et
 *    n'est pas revenu.
 *
 *  • **Tir enraciné** (troisième créneau, `special`) — le seul pouvoir du Mage
 *    qui ne soit emprunté à personne. Des racines le clouent au sol une
 *    seconde, ses orbes ordinaires s'interrompent, puis il lâche une **orbe
 *    majeure** à trois fois les dégâts. Le compteur `f.state.spec` a la forme
 *    des compteurs génériques, comme le Blizzard du Hors-la-loi ; l'ancrage
 *    passe par `f.boost`/`f.boostFactor`, exactement comme la phase `brace`
 *    du Lancier.
 *
 * @module game/abilities/mage
 */

import { clamp, hash01, TAU } from '../../core/math.js';
import { drawSpriteCentered } from '../../render/sprites.js';

/** Pas de la cadence, par orbe tirée. Mesuré : tous les paliers de la vidéo
 *  sont des multiples de 0,05, et les six premiers tombent en 4,5 s. */
const STEP = 0.05;

/** Plafond de cadence, en orbes par seconde. `calé` : la vidéo de référence ne
 *  dure que 24 s et ne le montre donc jamais. Sans lui, un duel long amène la
 *  cadence à des valeurs qui ne veulent plus rien dire — la montée est
 *  exponentielle. 4,0 laisse la place au ~3,7 de fin de vidéo. */
const RATE_CAP = 4;

/** Décalage du sceptre sur le flanc, en px. Réglé à l'image : à 20 l'arme
 *  chevauche la bille et on ne lit plus le sceptre, à 50 elle flotte à côté
 *  sans lien avec le corps. 34 la pose juste sous le bord de la bille, comme
 *  la baguette de Magia sur sa vidéo. */
const LATERAL = 34;

export const mageAbilities = {
  id: 'mage',

  init(f) {
    f.state.stormTick = 0;
    f.state.stormHeal = 0;
    f.state.stormSpin = 0; // angle de la nuée : rendu seul
    /** Décompte avant la prochaine orbe. Le premier tir attend une cadence
     *  entière : sans ça le Mage ouvre le duel par une orbe gratuite. */
    f.state.shotTimer = 1 / f.stacks;
    /** Secondes de charge restantes ; 0 = pas enraciné. Même forme que le
     *  `spec` du Blizzard : un module l'allume, le module le décompte. */
    f.state.spec = 0;
    f.state.specCd = f.el.special.first;
    f.state.specSpan = f.el.special.first;
  },

  update(f, dt, now, game) {
    /* ---------- Tempête de sève ---------- */
    this.updateStorm(f, dt, now, game);

    /* ---------- le sceptre vise ---------- */
    const target = f.opponent;
    if (target && target.alive) {
      f.weaponAngle = Math.atan2(target.y - f.y, target.x - f.x);
    }
    /**
     * Le décalage est **posé à chaque image**, pas interpolé : `weaponLateral`
     * est un compteur que le moteur remet à zéro, donc il faut le réécrire.
     * Chez le Lancier la même valeur bascule d'un coup au changement de phase,
     * et l'interpoler avait été une erreur de lecture — l'arme se met à
     * glisser au lieu de former un bloc avec la bille.
     */
    f.weaponLateral = LATERAL;

    if (game.phase !== 'fight' || !target || !target.alive || !f.onStage) return;

    /* ---------- Tir enraciné ---------- */
    const sp = f.el.special;
    if (f.state.spec > 0) {
      f.state.spec -= dt;
      /**
       * L'ancrage est **réécrit à chaque image**, pas posé une fois : `boost`
       * est un compteur que le moteur décompte, donc il faut le retenir tant
       * que la charge dure. Même mécanique que la phase `brace` du Lancier,
       * `boostFactor: 0` — arrêt net, pas un ralentissement. C'est le risque
       * du pouvoir, il doit être franc.
       */
      f.boost = Math.max(f.boost, dt * 2);
      f.boostFactor = 0;
      if (f.state.spec <= 0) {
        f.state.spec = 0;
        f.boost = 0;
        f.boostFactor = 1;
        f.state.specCd = sp.cooldown;
        f.state.specSpan = sp.cooldown;
        this.releaseRootedShot(f, game);
      }
      // Enraciné, il ne tire pas ses orbes ordinaires : c'est ce qui fait
      // *attendre* le grand coup au lieu de l'ajouter par-dessus le reste.
      return;
    }

    f.state.specCd -= dt;
    if (f.state.specCd <= 0) {
      f.state.spec = sp.duration;
      return;
    }

    /* ---------- les orbes ---------- */
    f.state.shotTimer -= dt;
    if (f.state.shotTimer > 0) return;

    // La cadence courante décide du délai jusqu'au tir suivant : c'est ce qui
    // fait de `stacks` une vraie cadence et pas un simple compteur d'affichage.
    f.state.shotTimer = 1 / f.stacks;
    this.fireOrb(f, game);
  },

  /**
   * Fin de la charge : l'orbe majeure part du cristal, comme les autres.
   *
   * Elle **ne fait pas monter la cadence** (`f.stacks`) : cette pile compte les
   * orbes ordinaires, et la nourrir ici ferait du Tir enraciné un accélérateur
   * déguisé en plus d'être une frappe — deux effets pour un pouvoir, dont un
   * invisible.
   */
  releaseRootedShot(f, game) {
    const tip = this.crystal(f);
    this.spawnFromCrystal(f, f.el.special.projectile, game);
    game.fx.burst(tip.x, tip.y, 14, {
      color: ['#38cd65', '#97e0a0', '#e8fff0'],
      speed: 220,
      size: 5,
      life: 0.45,
    });
    game.fx.ring(f.x, f.y, f.radius, f.radius * 2.1, 0.4, 'rgba(56,205,101,0.9)', 5, true);
  },

  /** Le bout du sceptre, d'où part tout ce que le Mage envoie. */
  crystal(f) {
    const pivot = f.weaponPivot();
    return {
      x: pivot.x + Math.cos(f.weaponAngle) * f.el.weapon.reach,
      y: pivot.y + Math.sin(f.weaponAngle) * f.el.weapon.reach,
    };
  },

  /**
   * Un projectile part **du cristal**, pas du centre de la bille : le sceptre
   * est décalé sur le flanc, et une orbe qui sortirait du corps donnerait
   * l'impression que l'arme n'y est pour rien.
   *
   * `spawn` place le projectile à `offset` du **porteur** : on emprunte donc la
   * position du bout du sceptre le temps du tir. Emprunter plutôt que passer une copie du
   * combattant : `Projectiles` garde `owner` par **identité** pour savoir qui
   * ne pas toucher, et une copie ferait que l'orbe frappe son propre tireur.
   */
  spawnFromCrystal(f, key, game) {
    const tip = this.crystal(f);
    const sx = f.x;
    const sy = f.y;
    f.x = tip.x;
    f.y = tip.y;
    game.projectiles.spawn(f, key, f.weaponAngle, 0);
    f.x = sx;
    f.y = sy;
  },

  fireOrb(f, game) {
    const tip = this.crystal(f);
    this.spawnFromCrystal(f, 'orb', game);

    // La cadence monte d'un cran par orbe. `game.viewRng` n'est pas sollicité
    // et rien ne tire dans `game.rng` : le tir reste un événement pur.
    f.stacks = Math.min(RATE_CAP, f.stacks + STEP);

    game.fx.burst(tip.x, tip.y, 4, {
      color: ['#38cd65', '#97e0a0'],
      speed: 110,
      size: 4,
      life: 0.25,
    });
  },

  /**
   * Les racines du Tir enraciné, **sous** le Mage — c'est la seule chose que
   * ce module dessine au sol, et elle est accrochée à lui, pas posée dans
   * l'arène (l'inverse exact des bulbes du Semis, retirés).
   *
   * Rendu pur : la direction de chaque racine sort d'un **hachage** de son
   * indice, jamais d'un tirage. Une décoration qui puiserait dans `game.rng`
   * décalerait tous les duels — le dépôt l'a déjà payé deux fois.
   *
   * Pas de `drawWeapon` par ailleurs : le Mage a un vrai sprite d'arme,
   * contrairement à la liane courbe de la Plante.
   */
  drawUnder(ctx, f) {
    if (f.state.spec <= 0 || !f.onStage) return;
    const sp = f.el.special;
    const r = sp.roots;
    // 0 au déclenchement, 1 juste avant le tir : les racines poussent.
    const grow = clamp(1 - f.state.spec / sp.duration, 0, 1);

    /**
     * Les racines partent du **bord de la bille**, pas de son centre : mesurées
     * depuis le centre, les 58 px de `length` restaient sous les 41 px de rayon
     * pendant les deux premiers tiers de la charge, et on ne voyait rien venir.
     * Elles sortent donc du corps dès la première image.
     */
    const from = f.radius * 0.75;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < r.count; i++) {
      const a = (i / r.count) * TAU + hash01(i * 12.9898) * 0.5;
      const len = f.radius + r.length * (0.55 + 0.45 * hash01(i * 78.233 + 3.1)) * grow;
      const sx = f.x + Math.cos(a) * from;
      const sy = f.y + Math.sin(a) * from;
      // légère cassure au milieu : une racine ne pousse pas droit
      const bend = (hash01(i * 41.7 + 9.4) - 0.5) * 0.7;
      const mx = f.x + Math.cos(a + bend) * ((from + len) * 0.5);
      const my = f.y + Math.sin(a + bend) * ((from + len) * 0.5);
      const ex = f.x + Math.cos(a) * len;
      const ey = f.y + Math.sin(a) * len;

      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();

      // pointe plus claire, pour que la racine se lise jusqu'au bout
      ctx.strokeStyle = r.tip;
      ctx.lineWidth = Math.max(1, r.width - 3);
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();
  },

  drawOver(ctx, f, game, now) {
    this.drawStorm(ctx, f);

    // Halo qui enfle au bout du sceptre : sans lui, l'immobilité se lit comme
    // un blocage plutôt que comme une charge.
    if (f.state.spec <= 0 || !f.onStage) return;
    const sp = f.el.special;
    const grow = clamp(1 - f.state.spec / sp.duration, 0, 1);
    const tip = this.crystal(f);
    const rr = sp.glow.radius * (0.3 + 0.7 * grow);
    ctx.save();
    const g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, rr);
    g.addColorStop(0, sp.glow.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, rr, 0, TAU);
    ctx.fill();
    ctx.restore();
  },

  /**
   * Seconde rangée du HUD : pleine pendant la charge, elle se remplit sinon.
   * Méthode **optionnelle** côté moteur — les combattants sans troisième
   * créneau n'affichent pas de cadre vide.
   */
  /* ------------------------------------------------------------------ */
  /* Tempête de sève — rapatriée de la Plante à sa suppression             */
  /* ------------------------------------------------------------------ */

  updateStorm(f, dt, now, game) {
    const ult = f.el.ultimate;
    if (f.ult.active > 0) {
      f.ult.active -= dt;
      f.state.stormSpin += ult.storm.swarm.churn * dt;
      this.tickStorm(f, dt, now, game);
      if (f.ult.active <= 0) {
        f.ult.active = 0;
        f.ult.charge = 0;
        f.ult.ready = false;
      }
    } else if (game.phase === 'fight') {
      f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castStorm(f, game);
    }
  },

  castStorm(f, game) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.state.stormTick = 0;
    f.state.stormHeal = 0;
    const target = f.opponent;
    if (target) {
      game.fx.ring(target.x, target.y, 20, 220, 0.55, 'rgba(74,222,128,0.9)', 8, true);
    }
    game.shake(5, 0.3);
  },

  tickStorm(f, dt, now, game) {
    const storm = f.el.ultimate.storm;
    const target = f.opponent;

    // le Mage se régénère pendant sa tempête
    f.state.stormHeal -= dt;
    if (f.state.stormHeal <= 0) {
      f.state.stormHeal = storm.healInterval;
      game.heal(f, storm.healAmount, f);
    }

    if (!target || !target.alive) return;

    // clouée sur place par le cerceau de lianes
    target.applySlow(storm.root, 0.2, now);

    // nuée de pétales autour de la cible
    const p = storm.petals;
    if (game.rng.chance(dt * p.rate)) {
      const ang = game.rng.range(0, TAU);
      const rad = target.radius * game.rng.range(0.6, 2.4);
      game.fx.spawn({
        kind: 'spark',
        x: target.x + Math.cos(ang) * rad,
        y: target.y + Math.sin(ang) * rad,
        vx: game.rng.spread(p.speed),
        vy: game.rng.spread(p.speed),
        life: p.life * game.rng.range(0.6, 1.2),
        size: p.size * game.rng.range(0.5, 1.2),
        color: game.rng.pick(p.colors),
        drag: 2,
      });
    }

    f.state.stormTick -= dt;
    if (f.state.stormTick <= 0) {
      f.state.stormTick = storm.tickInterval;
      game.damage(target, storm.tickDamage(f), f, { kind: 'storm', silent: true });
    }
  },

  drawStorm(ctx, f) {
    if (f.ult.active <= 0) return;
    const target = f.opponent;
    if (!target || !target.alive) return;
    const fade = Math.min(1, f.ult.active / 0.5);
    const sw = f.el.ultimate.storm.swarm;
    if (!sw) return;

    /**
     * Amas de cubes qui recouvre la cible. Rendu **pur** : la disposition sort
     * d'un hachage de l'indice, jamais d'un tirage — une décoration qui
     * puiserait dans `game.rng` décalerait tous les duels.
     */
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = sw.color;
    const reach = target.radius * sw.radius;

    for (let c = 0; c < sw.clusters; c++) {
      const u = hash01(c * 12.9898);
      const w = hash01(c * 78.233 + 4.7);
      const a = u * TAU + f.state.stormSpin * (0.4 + w * 0.9);
      const rad = reach * (0.06 + 0.94 * w * w); // masse ramenée vers le centre
      const cx = target.x + Math.cos(a) * rad;
      const cy = target.y + Math.sin(a) * rad;

      for (let k = 0; k < sw.perCluster; k++) {
        const i = c * 7 + k;
        const p = hash01(i * 31.7 + 1.3);
        const q = hash01(i * 53.1 + 9.1);
        const s = Math.round(sw.size * (1 - sw.sizeVar + sw.sizeVar * 2 * p));
        const x = cx + (p - 0.5) * sw.spread * 2;
        const y = cy + (q - 0.5) * sw.spread * 2;
        ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
      }
    }

    // quelques corolles qui volent dans la nuée, chacune à son propre rythme
    for (let i = 0; i < sw.flowers; i++) {
      const u = hash01(i * 17.3 + 2.9);
      const w = hash01(i * 41.9 + 6.2);
      const a = u * TAU + f.state.stormSpin * (0.45 + w);
      const rad = reach * (0.25 + 0.6 * w);
      drawSpriteCentered(
        ctx,
        sw.flowerSprite,
        target.x + Math.cos(a) * rad,
        target.y + Math.sin(a) * rad,
        sw.flowerSize,
      );
    }
    ctx.restore();
  },

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },

  specialBar(f) {
    const sp = f.el.special;
    // Pendant la charge la jauge **se remplit** au lieu de se vider : c'est un
    // tir qu'on charge, pas un effet qui s'épuise comme le Blizzard. Vidée,
    // elle se lisait comme un pouvoir qui se termine à l'instant où il commence.
    if (f.state.spec > 0) {
      return { value: clamp(1 - f.state.spec / sp.duration, 0, 1), active: true };
    }
    return { value: 1 - clamp(f.state.specCd / f.state.specSpan, 0, 1), active: false };
  },

};
