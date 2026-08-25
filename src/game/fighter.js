/**
 * Combattant : état runtime + rendu.
 *
 * Toutes les caractéristiques viennent de la fiche gelée (data/elements.js).
 * Cette classe ne contient que l'état **mutable** d'un duel : position, PV,
 * timers. Deux duels lancés avec la même fiche se comportent donc à
 * l'identique.
 *
 * @module game/fighter
 */

import { ARENA, BODY, MATCH, PHYSICS } from '../data/tuning.js';
import { PIXEL_MAPS } from '../data/pixelmaps.js';
import { TAU, clamp, rotateToward, wrapAngle } from '../core/math.js';
import { drawSmoothCentered, drawSpriteLeft, getTintedSprite } from '../render/sprites.js';

/**
 * Force du flash blanc d'encaissement, **et non 1**. La boule d'origine
 * pouvait virer au blanc pur : son contour noir la délimitait encore. Une
 * silhouette pleinement blanche, elle, disparaît sur l'arène blanche — le
 * combattant s'effaçait un cinquième de seconde à chaque coup encaissé.
 * À 0,7 les contours de la bête restent lisibles sous le flash.
 */
const FLASH_ALPHA = 0.7;

/** Silhouette teintée, centrée — flash d'encaissement et teintes d'état. */
function drawTintedCentered(ctx, key, color, alpha, x, y, height) {
  const s = getTintedSprite(key, color);
  const w = height * (s.width / s.height);
  const avant = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = alpha;
  ctx.drawImage(s, x - w / 2, y - height / 2, w, height);
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = avant;
}

export class Fighter {
  /**
   * @param {object} element fiche gelée
   * @param {0|1} slot 0 = gauche, 1 = droite
   * @param {object} rng
   */
  constructor(element, slot, rng) {
    this.el = element;
    this.slot = slot;
    this.rng = rng;

    const spawn = MATCH.spawn[slot];
    const inner = ARENA.inner;
    this.x = inner.left + (inner.right - inner.left) * spawn.x;
    this.y = inner.top + (inner.bottom - inner.top) * spawn.y;
    // léger écart de cap piloté par la seed : deux duels d'un même
    // affrontement ne se déroulent pas exactement pareil, sans que la fiche
    // de l'élément ne change d'un iota
    this.heading = spawn.heading + rng.spread(0.35);
    this.speed = element.movement.speed;
    this.impulseX = 0;
    this.impulseY = 0;

    this.hp = MATCH.maxHp;
    this.flash = 0;
    this.invulnerable = 0;

    // arme
    this.weaponAngle = slot === 0 ? 0 : Math.PI;
    this.spinDir = element.weapon.spinDir;
    this.meleeCd = 0;

    // pouvoir & ultime
    this.ability = {
      cooldown: element.ability.cooldown, // valeur courante (peut décroître)
      timer: element.ability.cooldown,
      uses: 0,
    };
    this.ult = { charge: 0, active: 0, ready: false };

    // stats évolutives affichées dans le HUD, valeurs de départ dans la fiche
    // `stacks`  : stat principale (Glace « Damage/Slow », Feu « Burn », …)
    // `stacks2` : stat secondaire (Lumière « Knockback », Eau « Size », …)
    this.stacks = element.progression?.stack ?? 1;
    this.stacks2 = element.progression?.stack2 ?? 0;

    // ralentissements empilés
    /** @type {Array<{amount:number, until:number}>} */
    this.slows = [];

    /**
     * Dégâts sur la durée (brûlure du Feu, etc.). Le tic est appliqué par
     * Match, seul point d'entrée des dégâts.
     * @type {Array<{damage:number, interval:number, timer:number, until:number,
     *               source:Fighter, ring:string|null}>}
     */
    this.dots = [];
    /** Teinte du corps imposée par un effet (givre, piège de Lumière). */
    this.tint = null;
    this.tintUntil = 0;
    this.tintAlpha = 1; // 1 = remplace la couleur, <1 = se mélange
    /** Bouclier absorbant (Lumière). */
    this.shield = 0;
    this.shieldMax = 0;

    this.trailTimer = 0;
    this.boost = 0; // durée restante d'un bonus de vitesse
    this.boostFactor = 1;
    /** @type {Fighter|null} */
    this.opponent = null;
    this.state = {}; // bac à sable pour les modules de pouvoirs
    /** @type {((ctx:CanvasRenderingContext2D)=>void)|null} */
    this.customWeapon = null;
    /** Suivi de l'incantation d'ultime, pour la mise en scène (rendu seul). */
    this.wasUlting = false;
    /** Mur touché à ce pas, pour la mise en scène (rendu seul). */
    this.wall = null;
  }

  get radius() {
    return this.el.look.radius;
  }

  get alive() {
    return this.hp > 0;
  }

  /** Facteur de vitesse courant (1 = nominal), ralentissements inclus. */
  slowFactor(now) {
    let worst = 0;
    for (const s of this.slows) if (s.until > now && s.amount > worst) worst = s.amount;
    return 1 - clamp(worst, 0, 0.75);
  }

  applySlow(amount, duration, now) {
    if (amount <= 0) return;
    this.slows.push({ amount, until: now + duration });
    if (this.slows.length > 8) this.slows.shift();
  }

  /**
   * Applique (ou rafraîchit) un dégât sur la durée.
   * Un seul DoT par source : une nouvelle application remplace la précédente,
   * comme la brûlure du Feu qui se « rafraîchit » à chaque coup.
   */
  applyDot({ damage, interval, duration, source, ring = null, tint = null }, now) {
    const existing = this.dots.find((d) => d.source === source);
    const dot = {
      damage,
      interval,
      timer: existing ? existing.timer : interval,
      until: now + duration,
      source,
      ring,
      tint,
    };
    if (existing) Object.assign(existing, dot);
    else this.dots.push(dot);
  }

  /**
   * Teinte temporaire du corps (effet visuel d'un contrôle adverse).
   * `alpha` < 1 mélange la teinte à la couleur d'élément : c'est ainsi que la
   * Glace givre ses victimes — sur le jaune de la Lumière, le bleu du givre
   * donne le vert pâle qu'on voit dans la vidéo.
   */
  applyTint(color, duration, now, alpha = 1) {
    this.tint = color;
    this.tintUntil = now + duration;
    this.tintAlpha = alpha;
  }

  /** Couleur d'anneau d'état à dessiner autour du corps, s'il y en a une. */
  statusRing(now) {
    for (const d of this.dots) if (d.until > now && d.ring) return d.ring;
    return null;
  }

  /**
   * Teinte de corps imposée par un dégât sur la durée.
   * La brûlure du Feu **colore entièrement sa victime en orange** : au zoom,
   * la boule jaune de la Foudre devient franchement orange, ce n'est pas un
   * simple cerclage.
   */
  statusTint(now) {
    for (const d of this.dots) if (d.until > now && d.tint) return d.tint;
    return null;
  }

  /** Vitesse effective en px/s. */
  currentSpeed(now) {
    return this.el.movement.speed * this.slowFactor(now) * (this.boost > 0 ? this.boostFactor : 1);
  }

  /* ------------------------------------------------------------------ */
  /* Simulation                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * @param {number} dt pas fixe
   * @param {number} now temps de duel
   */
  step(dt, now) {
    this.meleeCd = Math.max(0, this.meleeCd - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.boost = Math.max(0, this.boost - dt);
    if (this.slows.length) this.slows = this.slows.filter((s) => s.until > now);
    if (this.dots.length) this.dots = this.dots.filter((d) => d.until > now);
    if (this.tint && now >= this.tintUntil) this.tint = null;

    // --- pilotage : on tourne doucement vers l'adversaire (mesuré ~1,9 rad/s)
    const mv = this.el.movement;
    if (this.opponent && mv.seek > 0) {
      const want = Math.atan2(this.opponent.y - this.y, this.opponent.x - this.x);
      this.heading = rotateToward(this.heading, want, mv.turnRate * mv.seek * dt);
    }

    // --- intégration
    const sp = this.currentSpeed(now);
    let vx = Math.cos(this.heading) * sp + this.impulseX;
    let vy = Math.sin(this.heading) * sp + this.impulseY;
    this.x += vx * dt;
    this.y += vy * dt;

    // amortissement du recul
    const k = Math.exp(-PHYSICS.speedRecovery * dt);
    this.impulseX *= k;
    this.impulseY *= k;

    // --- rebonds sur les murs
    const r = this.radius;
    const i = ARENA.inner;
    let bounced = false;
    // `wall` note le mur touché **pour la mise en scène seulement** : simple
    // marquage, aucun effet sur la trajectoire.
    this.wall = null;
    if (this.x - r < i.left) { this.x = i.left + r; this.heading = wrapAngle(Math.PI - this.heading); this.impulseX = Math.abs(this.impulseX); bounced = true; this.wall = 'left'; }
    if (this.x + r > i.right) { this.x = i.right - r; this.heading = wrapAngle(Math.PI - this.heading); this.impulseX = -Math.abs(this.impulseX); bounced = true; this.wall = 'right'; }
    if (this.y - r < i.top) { this.y = i.top + r; this.heading = wrapAngle(-this.heading); this.impulseY = Math.abs(this.impulseY); bounced = true; this.wall = 'top'; }
    if (this.y + r > i.bottom) { this.y = i.bottom - r; this.heading = wrapAngle(-this.heading); this.impulseY = -Math.abs(this.impulseY); bounced = true; this.wall = 'bottom'; }
    if (bounced && PHYSICS.spinFlipsOnBounce) this.spinDir *= -1;

    // --- rotation de l'arme (ralentie comme le déplacement)
    const spinScale = this.slowFactor(now);
    this.weaponAngle = wrapAngle(
      this.weaponAngle + this.el.weapon.spin * this.spinDir * spinScale * dt,
    );
  }

  /** Ajoute une impulsion (recul, choc). */
  push(dirX, dirY, force) {
    const len = Math.hypot(dirX, dirY) || 1;
    this.impulseX += (dirX / len) * force;
    this.impulseY += (dirY / len) * force;
  }

  /* ------------------------------------------------------------------ */
  /* Géométrie de l'arme                                                 */
  /* ------------------------------------------------------------------ */

  /** Segment tranchant [a,b] en coordonnées monde + rayon. */
  bladeSegment() {
    const { reach, hitbox } = this.el.weapon;
    const c = Math.cos(this.weaponAngle);
    const s = Math.sin(this.weaponAngle);
    return {
      ax: this.x + c * reach * hitbox.from,
      ay: this.y + s * reach * hitbox.from,
      bx: this.x + c * reach * hitbox.to,
      by: this.y + s * reach * hitbox.to,
      r: hitbox.radius,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Rendu                                                               */
  /* ------------------------------------------------------------------ */

  /** @param {CanvasRenderingContext2D} ctx */
  draw(ctx, now) {
    const look = this.el.look;

    // halo (pouvoir prêt)
    if (this.auraVisible()) {
      const pulse = 0.75 + 0.25 * Math.sin(now * TAU * look.aura.pulse);
      const rr = this.radius * look.aura.radius * pulse;
      const g = ctx.createRadialGradient(this.x, this.y, this.radius * 0.6, this.x, this.y, rr);
      g.addColorStop(0, look.aura.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, rr, 0, TAU);
      ctx.fill();
    }

    // un module de pouvoirs peut fournir son propre rendu d'arme
    if (this.customWeapon) this.customWeapon(ctx);
    else this.drawWeapon(ctx);

    // corps — le portrait de la bête, à la place de l'ancienne boule de
    // couleur. Le flash blanc d'encaissement prime sur tout (silhouette pleine,
    // comme la boule virait au blanc), puis la teinte d'un contrôle adverse se
    // pose par-dessus le sprite.
    const size = this.radius * BODY.scale;
    drawSmoothCentered(ctx, this.portrait, this.x, this.y, size);
    const dotTint = this.statusTint(now);
    if (this.flash > 0) {
      drawTintedCentered(ctx, this.portrait, look.bodyHit, FLASH_ALPHA, this.x, this.y, size);
    } else if (this.tint || dotTint) {
      drawTintedCentered(
        ctx,
        this.portrait,
        this.tint ?? dotTint.color,
        this.tint ? this.tintAlpha : dotTint.alpha,
        this.x,
        this.y,
        size,
      );
    }

    // anneau d'état (brûlure : cerclage orange autour de la victime)
    const ring = this.statusRing(now);
    if (ring) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + look.outlineWidth * 0.9, 0, TAU);
      ctx.lineWidth = look.outlineWidth * 1.1;
      ctx.strokeStyle = ring;
      ctx.stroke();
    }

    // Égide : sur la vidéo, aucune bulle grise — le bouclier se lit sur un
    // **liseré doré** collé au corps, d'autant plus épais qu'il est plein.
    if (this.shield > 0 && this.shieldMax > 0 && look.shield) {
      const k = this.shield / this.shieldMax;
      const rr = this.radius + look.outlineWidth * 1.15;
      ctx.beginPath();
      ctx.arc(this.x, this.y, rr, 0, TAU);
      ctx.lineWidth = 1.5 + 3 * k;
      ctx.strokeStyle = look.shield.color;
      ctx.stroke();
      const g = ctx.createRadialGradient(this.x, this.y, rr, this.x, this.y, rr * 1.35);
      g.addColorStop(0, look.shield.glow);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, rr * 1.35, 0, TAU);
      ctx.fill();
    }
    // les PV ne sont plus écrits ici : ils vivent dans la barre de vie
    // en haut de l'écran (render/hud.js).
  }

  /**
   * Sprite du corps. Une bête sans portrait retomberait sur sa tête d'arme,
   * mais les huit fiches en ont un — le repli n'est là que pour ne pas casser
   * le rendu si l'on ajoute une bête en cours de route.
   */
  get portrait() {
    return this.el.portrait ?? this.el.weapon.head.sprite ?? this.el.icon;
  }

  auraVisible() {
    const when = this.el.look.aura.showWhen;
    if (when === 'ability-ready') return this.ability.timer <= 0.35;
    if (when === 'ultimate-ready') return this.ult.ready || this.ult.active > 0;
    return true;
  }

  /** @param {CanvasRenderingContext2D} ctx */
  drawWeapon(ctx) {
    const w = this.el.weapon;
    const map = PIXEL_MAPS[w.head.sprite];
    const headH = map.h * w.head.scale;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.weaponAngle);

    // manche : rectangle sombre + liseré, comme sur la vidéo.
    // `width: 0` = arme posée à même la boule (shuriken du Vent) : rien à tracer,
    // `length` ne sert plus qu'à décaler le sprite.
    const h = w.handle;
    if (h.width > 0) {
      const half = h.width / 2;
      ctx.fillStyle = h.outline;
      ctx.fillRect(-2, -half - 2, h.length + 4, h.width + 4);
      ctx.fillStyle = h.color;
      ctx.fillRect(0, -half, h.length, h.width);
      ctx.fillStyle = h.dark;
      ctx.fillRect(0, 0, h.length, half); // moitié basse plus sombre (volume)
      if (h.gem) {
        ctx.fillStyle = h.gem.color;
        ctx.fillRect(h.length * h.gem.at - h.gem.size / 2, -h.gem.size / 2, h.gem.size, h.gem.size);
      }
    }

    // tête d'arme (sprite)
    drawSpriteLeft(ctx, w.head.sprite, h.length, 0, headH, w.head.anchorY);
    ctx.restore();
  }

  /** Silhouette utilisée pour les fantômes de téléportation. */
  ghostColor() {
    return this.el.look.trail.color;
  }

  /** Petit utilitaire de debug (`?debug=1`). */
  drawDebug(ctx) {
    const b = this.bladeSegment();
    ctx.save();
    ctx.strokeStyle = 'rgba(255,0,0,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.ax, b.ay);
    ctx.lineTo(b.bx, b.by);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b.bx, b.by, b.r, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, TAU);
    ctx.strokeStyle = 'rgba(0,120,255,0.7)';
    ctx.stroke();
    ctx.restore();
  }
}
