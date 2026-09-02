/**
 * Pouvoirs de la PLANTE.
 *
 *  • Semis — la Plante laisse des **bulbes** derrière elle. Un bulbe est à la
 *    fois une mine et une réserve : l'adversaire qui le frôle le fait éclater
 *    et prend la valeur de la statistique, la Plante qui le récupère se soigne
 *    d'autant. C'est exactement ce qu'annonce le libellé du HUD,
 *    « Bulb Damage/Heal » — le seul élément du roster capable de remonter ses
 *    points de vie. Un bulbe mûr tire aussi une fleur sur l'adversaire.
 *
 *  • Tempête de fleurs (ultime) — l'adversaire disparaît sous une **nuée de
 *    cubes roses** : des grappes de carrés plats et opaques, toujours alignés
 *    sur les axes, mêlées de quelques corolles. C'est tout ce que montrent les
 *    vidéos — pas de cerceau. La cible est clouée sur place et la Plante se
 *    régénère pendant toute la durée.
 *
 * L'arme est également particulière : une **liane courbe**, dessinée ici en
 * tracé plutôt qu'en sprite droit (voir `drawWeapon`).
 *
 * @module game/abilities/plant
 */

import { TAU, clamp, dist } from '../../core/math.js';
import { drawSpriteCentered } from '../../render/sprites.js';
import { PIXEL_MAPS } from '../../data/pixelmaps.js';
import { compilePixelMap } from '../../render/pixelart.js';

/* ------------------------------------------------------------------ */
/* Liane : rasterisation en escalier de pixels                         */
/* ------------------------------------------------------------------ */

/** Hachage déterministe → [0,1[ : sert au rendu seul, jamais à la simulation. */
function hash01(x) {
  const v = Math.sin(x) * 43758.5453;
  return v - Math.floor(v);
}

/** Palette de la liane rasterisée (les couleurs viennent de la fiche). */
const VINE_KEYS = { outline: 'K', body: 'g', light: 'l', shine: 's', stem: 'b', stemDark: 'd' };

/** Sprite compilé une fois pour toutes : la géométrie ne change jamais. */
let vineSprite = null;

/**
 * Épaisseur relative le long de la liane : fine au départ, la plus large juste
 * après la crête, puis effilée jusqu'au crochet (relevé sur la vidéo).
 * @param {number} t 0 au pédoncule, 1 au bout
 */
function vineProfile(t) {
  return (0.62 + 0.38 * Math.sin(Math.PI * t ** 0.75)) * (1 - 0.22 * t * t);
}

/**
 * Construit le sprite de la liane : on échantillonne l'arc, on **quantifie**
 * chaque coup de pinceau sur une grille de `block` px, puis on compile la
 * grille comme n'importe quel autre pixel-art. Résultat : le même escalier de
 * blocs que la vidéo, et une rotation en plus-proche-voisin (donc chunky) au
 * lieu d'un tracé lissé.
 *
 * @param {any} w la partie `weapon` de la fiche
 */
function buildVineSprite(w) {
  const v = w.vine;
  const h = w.handle;
  const b = v.block;

  // centre de l'arc : le point de départ doit tomber au bout du pédoncule
  const cx = h.length - Math.cos(v.start) * v.radius;
  const cy = -Math.sin(v.start) * v.radius;

  // boîte englobante généreuse, en px de scène
  const pad = v.width + v.outlineWidth * 2 + b;
  const minX = Math.min(24, cx - v.radius - pad);
  const maxX = cx + v.radius + pad;
  const minY = cy - v.radius - pad;
  const maxY = cy + v.radius + pad;
  const cols = Math.ceil((maxX - minX) / b);
  const rows = Math.ceil((maxY - minY) / b);
  const grid = Array.from({ length: rows }, () => new Array(cols).fill('.'));

  const stampDisc = (x, y, r, ch) => {
    const i0 = Math.max(0, Math.floor((x - r - minX) / b));
    const i1 = Math.min(cols - 1, Math.floor((x + r - minX) / b));
    const j0 = Math.max(0, Math.floor((y - r - minY) / b));
    const j1 = Math.min(rows - 1, Math.floor((y + r - minY) / b));
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const dx = minX + (i + 0.5) * b - x;
        const dy = minY + (j + 0.5) * b - y;
        if (dx * dx + dy * dy <= r * r) grid[j][i] = ch;
      }
    }
  };

  const stampRect = (x0, y0, x1, y1, ch) => {
    const i0 = Math.max(0, Math.floor((x0 - minX) / b));
    const i1 = Math.min(cols - 1, Math.floor((x1 - minX) / b));
    const j0 = Math.max(0, Math.floor((y0 - minY) / b));
    const j1 = Math.min(rows - 1, Math.floor((y1 - minY) / b));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) grid[j][i] = ch;
  };

  // 1. pédoncule brun (il part de sous la boule pour qu'aucun trou n'apparaisse)
  const stemHalf = h.width / 2;
  const stemFrom = 26;
  stampRect(stemFrom, -stemHalf - v.outlineWidth, h.length, stemHalf + v.outlineWidth, VINE_KEYS.outline);
  stampRect(stemFrom, -stemHalf, h.length - b, stemHalf, VINE_KEYS.stem);
  stampRect(stemFrom, 0.5, h.length - b, stemHalf, VINE_KEYS.stemDark);

  // 2. la liane, passe après passe : contour, corps, reflet, brillance
  const N = 200;
  const passes = [
    { key: VINE_KEYS.outline, radius: v.radius, k: 0.5, extra: v.outlineWidth },
    { key: VINE_KEYS.body, radius: v.radius, k: 0.5, extra: 0 },
    { key: VINE_KEYS.light, radius: v.radius - v.width * 0.22, k: 0.2, extra: 0 },
    { key: VINE_KEYS.shine, radius: v.radius - v.width * 0.3, k: 0.15, extra: 0 },
  ];
  for (const p of passes) {
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = v.start + v.sweep * t;
      const r = v.width * p.k * vineProfile(t) + p.extra;
      stampDisc(cx + Math.cos(a) * p.radius, cy + Math.sin(a) * p.radius, r, p.key);
    }
  }

  const map = {
    w: cols,
    h: rows,
    palette: {
      [VINE_KEYS.outline]: v.outline,
      [VINE_KEYS.body]: v.body,
      [VINE_KEYS.light]: v.light,
      [VINE_KEYS.shine]: v.shine,
      [VINE_KEYS.stem]: h.color,
      [VINE_KEYS.stemDark]: h.dark,
    },
    rows: grid.map((r) => r.join('')),
  };

  return {
    canvas: compilePixelMap(map, 4),
    x: minX,
    y: minY,
    w: cols * b,
    h: rows * b,
  };
}

export const plantAbilities = {
  id: 'plant',

  init(f) {
    /** @type {Array<{x:number,y:number,life:number,shoot:number,born:number}>} */
    f.state.bulbs = [];
    f.state.stormTick = 0;
    f.state.stormHeal = 0;
    f.state.stormSpin = 0; // angle de la nuée : rendu seul
  },

  update(f, dt, now, game) {
    const el = f.el;
    const b = el.ability.bulb;
    const target = f.opponent;

    /* ---------- bulbes ---------- */
    for (let i = f.state.bulbs.length - 1; i >= 0; i--) {
      const bulb = f.state.bulbs[i];
      bulb.life -= dt;
      if (bulb.life <= 0) {
        f.state.bulbs.splice(i, 1);
        continue;
      }

      // tant qu'il germe, le bulbe n'est actif pour personne
      const armed = bulb.life <= b.life - b.armDelay;

      // l'adversaire le fait éclater
      if (armed && target && target.alive && dist(bulb.x, bulb.y, target.x, target.y) <= b.radius + target.radius) {
        game.damage(target, b.damage(f), f, { kind: 'bulb', x: bulb.x, y: bulb.y });
        target.applySlow(b.slow, b.slowDuration, now);
        game.fx.burst(bulb.x, bulb.y, 16, {
          // Même raison que la corolle : la gerbe se dit dans la fiche, et le
          // rose de la Plante reste le repli. Le nombre de particules ne bouge
          // pas, donc `game.rng` est consommé à l'identique.
          color: b.burstColors ?? ['#4ade80', '#bbf7d0', '#f472b6'],
          speed: 240,
          size: 5,
          life: 0.5,
        });
        f.state.bulbs.splice(i, 1);
        continue;
      }

      // la Plante le récupère et se soigne
      if (armed && dist(bulb.x, bulb.y, f.x, f.y) <= b.radius + f.radius) {
        const healed = game.heal(f, b.heal(f), f);
        if (healed > 0) game.fx.ring(f.x, f.y, f.radius, f.radius * 1.7, 0.35, 'rgba(74,222,128,0.9)', 5, true);
        f.state.bulbs.splice(i, 1);
        continue;
      }

      // un bulbe mûr tire une fleur
      if (!armed || game.phase !== 'fight' || !target || !target.alive) continue;
      bulb.shoot -= dt;
      if (bulb.shoot <= 0) {
        bulb.shoot = b.shootInterval;
        if (dist(bulb.x, bulb.y, target.x, target.y) <= b.shootRange) {
          this.shootFrom(f, bulb, Math.atan2(target.y - bulb.y, target.x - bulb.x), game);
        }
      }
    }

    /* ---------- ultime ---------- */
    const ult = el.ultimate;
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

    /* ---------- semis ---------- */
    if (game.phase !== 'fight') return;
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) this.plantBulb(f, game);
  },

  plantBulb(f, game) {
    const a = f.el.ability;
    const b = a.bulb;
    f.state.bulbs.push({ x: f.x, y: f.y, life: b.life, shoot: b.shootInterval, born: game.time });
    if (f.state.bulbs.length > b.max) f.state.bulbs.shift();
    game.fx.burst(f.x, f.y, 8, { color: ['#4ade80', '#bbf7d0'], speed: 120, size: 4, life: 0.4 });
    f.ability.timer = a.cooldown;
  },

  /** Le tir part du bulbe, pas de la Plante. */
  shootFrom(f, bulb, angle, game) {
    const sx = f.x;
    const sy = f.y;
    f.x = bulb.x;
    f.y = bulb.y;
    game.projectiles.spawn(f, f.el.ability.bulb.projectile, angle, 18);
    f.x = sx;
    f.y = sy;
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

    // la Plante se régénère pendant sa tempête
    f.state.stormHeal -= dt;
    if (f.state.stormHeal <= 0) {
      f.state.stormHeal = storm.healInterval;
      game.heal(f, storm.healAmount, f);
    }

    if (!target || !target.alive) return;

    // cloué sur place par le cerceau de lianes
    target.applySlow(storm.root, 0.2, now);

    // nuée de pétales roses autour de la cible
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

  /* ------------------------------------------------------------------ */
  /* Rendu                                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Liane : pédoncule brun puis grand crochet vert, le tout **en escalier de
   * pixels** comme sur la vidéo (voir `buildVineSprite`). Le sprite est
   * compilé une seule fois puis simplement blitté et tourné.
   * @param {CanvasRenderingContext2D} ctx
   */
  drawWeapon(ctx, f) {
    const s = (vineSprite ??= buildVineSprite(f.el.weapon));
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.weaponAngle);
    ctx.drawImage(s.canvas, s.x, s.y, s.w, s.h);
    ctx.restore();
  },

  /** Bulbes posés au sol. */
  drawUnder(ctx, f) {
    const b = f.el.ability.bulb;
    const map = PIXEL_MAPS[b.sprite];
    const h = map.h * b.scale;
    for (const bulb of f.state.bulbs) {
      const fade = Math.min(1, bulb.life / 1.5);
      ctx.save();
      ctx.globalAlpha = fade;
      drawSpriteCentered(ctx, b.sprite, bulb.x, bulb.y, h);
      ctx.restore();
    }
  },

  /**
   * Tempête de fleurs : la **nuée de cubes roses** qui recouvre la cible. Sur
   * les vidéos, l'ultime n'est fait que de ça — des grappes de carrés plats et
   * opaques, alignés sur les axes, denses au point de masquer complètement
   * l'adversaire, plus quelques corolles emportées avec elles.
   */
  drawOver(ctx, f, game, now) {
    if (f.ult.active <= 0) return;
    const target = f.opponent;
    if (!target || !target.alive) return;
    const fade = Math.min(1, f.ult.active / 0.5);
    this.drawSwarm(ctx, f.el.ultimate.storm.swarm, target, f.state.stormSpin, fade);
  },

  /**
   * Amas de cubes roses qui recouvre la cible. Rendu **pur** : la disposition
   * vient d'un hachage déterministe de l'indice et de l'angle de tempête,
   * jamais du RNG de simulation — un même `?seed=` reste rejouable au pixel
   * près. Les carrés ne tournent jamais : ils restent alignés sur les axes,
   * comme sur la vidéo.
   */
  drawSwarm(ctx, sw, target, spin, fade) {
    if (!sw) return;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = sw.color;
    const reach = target.radius * sw.radius;

    for (let c = 0; c < sw.clusters; c++) {
      const u = hash01(c * 12.9898);
      const w = hash01(c * 78.233 + 4.7);
      const a = u * TAU + spin * (0.4 + w * 0.9);
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
      const a = u * TAU + spin * (0.45 + w);
      const rad = reach * (0.25 + 0.6 * w);
      drawSpriteCentered(
        ctx,
        // La clé de sprite vient de la fiche : le Mage réutilise cette
        // tempête avec sa propre corolle. Repli sur celle de la Plante, donc
        // rien ne change pour elle.
        sw.flowerSprite ?? 'flower',
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
};
