/**
 * Pouvoirs du SOLEIL — le boss.
 *
 *  • **Réchauffement solaire** (`ability`) — horloge fixe, aucune visée : toutes
 *    les 5 s, tout ennemi dans 240 px prend un coup sec **et se met à brûler**.
 *    C'est la réponse au seul plan qui marche contre un personnage lent : rester
 *    à distance moyenne et attendre.
 *
 *  • **Rayon solaire** (`ultimate`) — le seul pouvoir du dépôt qui **s'annonce
 *    avant de frapper**. 1,1 s de charge pendant lesquelles une bille de lumière
 *    grossit devant lui et l'axe du tir est déjà tracé à l'écran, puis 1 s de
 *    faisceau. Il s'immobilise pendant toute la manœuvre.
 *
 *  **Sa mécanique de base n'est pas ici, et c'est le point.** Les huit rayons
 *  sont une **arme**, pas un pouvoir : `weapon.spokes: 8` dans sa fiche, lu par
 *  `Fighter.bladeSegment(k)` et `weaponHit`. Le moteur ne connaît aucun
 *  combattant (invariant 12), donc rien de tout ça n'a demandé une ligne de
 *  module — et un autre combattant pourrait porter une couronne sans en écrire
 *  une non plus.
 *
 * **Les trois règles du dépôt qui pèsent le plus ici.**
 *
 * 1. *`alive` ≠ `onStage`* (invariant 8) : la zone du Réchauffement et le
 *    faisceau bouclent tous deux sur les combattants, et un adversaire en plein
 *    Bond de l'Hoplite est vivant mais **absent du plateau**. Le frapper à son
 *    dernier point connu serait le bug documenté.
 * 2. *Le flux de simulation* (invariant 2) : ce module **ne tire nulle part**.
 *    Ni `game.rng` ni `game.viewRng` — la visée suit une cible, la charge suit
 *    une horloge, et tout le dessin est déduit de l'état. Il n'y a donc aucun
 *    moyen qu'une décoration d'ici déplace un vainqueur.
 * 3. *Un seul point de sortie* : `endBeam()` remet ensemble la jauge, le drapeau
 *    de tir et le bridage de vitesse. Dispersés, ils laisseraient le Soleil
 *    ralenti à vie si le duel s'achevait pendant une charge.
 *
 * @module game/abilities/sun
 */

import { TAU, rotateToward, segmentPointDistance } from '../../core/math.js';
import { ARENA } from '../../data/tuning.js';

/**
 * `#rrggbb` de la fiche + opacité → `rgba(...)`.
 *
 * **Ce module ne contient plus une seule couleur littérale**, et c'est le
 * point : il en portait onze, ce qui a suffi à faire dériver le Rayon solaire
 * du dessin de l'astre qui le tire. Tout vient désormais de `look.palette`, les
 * cinq teintes relevées sur la maquette — repalettiser le personnage se fait
 * dans sa fiche, et le faisceau suit sans qu'on y pense.
 */
function teinte(hex, alpha = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export const sunAbilities = {
  id: 'sun',

  init(f) {
    /** Vrai pendant la **seconde moitié** de l'ultime : le faisceau est sorti.
     *  Lu par le HUD (`hud.stats`) autant que par le rendu — c'est l'information
     *  qui décide si l'adversaire doit fuir ou peut encore avancer. */
    f.state.firing = false;
    /** Axe du tir. Posé au déclenchement, il **suit** la cible pendant la
     *  charge puis se fige au premier pas de tir. */
    f.state.beamAngle = 0;
    /** Minuterie entre deux tics de dégâts du faisceau. */
    f.state.beamTick = 0;
  },

  update(f, dt, now, game) {
    const el = f.el;

    /* ---------- ultime : charge, annonce, tir ---------------------------- */
    const ult = el.ultimate;
    if (f.ult.active > 0) {
      this.tickBeam(f, dt, game);
    } else if (game.phase === 'fight') {
      f.ult.charge = Math.min(100, f.ult.charge + ult.chargeRate * dt);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castBeam(f);
    }

    if (game.phase !== 'fight') return;

    /* ---------- réchauffement : horloge fixe, aucune visée ---------------- */
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) {
      f.ability.timer = el.ability.cooldown;
      f.ability.uses += 1;
      this.castWarming(f, now, game);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Réchauffement solaire                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Coup sec puis **brûlure** sur tout ennemi dans le rayon.
   *
   * La brûlure est le vrai contenu du pouvoir : 2 à l'impact contre 2 par
   * seconde pendant 4 s. Elle est **rafraîchie** à chaque cycle (`applyDot`
   * remplace le DoT de la même source), donc rester dans la zone, c'est brûler
   * sans interruption — le pouvoir n'a pas à tuer, il a à **imposer de bouger**.
   */
  castWarming(f, now, game) {
    const a = f.el.ability;
    game.sfx.cast(f, 'ability');
    game.fx.ring(f.x, f.y, f.radius, a.ring.to, a.ring.time, a.ring.color, a.ring.width, false);
    game.shake(4, 0.25);

    for (const g of this.enemiesInRange(f, a.radius, game)) {
      const dx = g.x - f.x;
      const dy = g.y - f.y;
      game.damage(g, a.damage, f, { kind: 'warming', nx: dx, ny: dy, knockback: a.knockback });
      // un mort ne brûle pas : `applyDot` sur un cadavre laisserait un tic
      // orphelin que `tickDots` écarterait ensuite en silence
      if (!g.alive) continue;
      g.applyDot({ ...a.burn, source: f, tint: { color: f.el.look.palette.body, alpha: 0.6 } }, now);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Rayon solaire — l'ultime                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Déclenchement : l'axe est posé **vers l'adversaire**, et le Soleil se bride.
   *
   * `f.boost` / `f.boostFactor` sont les compteurs génériques du `Fighter`
   * (invariant 7) : un module les allume, le moteur les décompte et **ne sait
   * pas pourquoi**. Ils servent ailleurs à accélérer (le Séisme du Golem, la
   * Ruée du Ronin) ; rien n'interdit de s'en servir pour ralentir, et c'est
   * exactement la forme qu'on veut — aucune ligne de moteur à ajouter pour
   * qu'un combattant s'immobilise pendant une incantation.
   *
   * Pas de `game.sfx.cast` ici : `match.js` détecte la bascule de
   * `f.ult.active` et joue la recette que la fiche nomme, pour tout ultime du
   * dépôt.
   */
  castBeam(f) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.state.firing = false;
    f.state.beamTick = 0;

    // à défaut d'adversaire présent, il tire droit devant : un ultime qui
    // s'annulerait faute de cible se lirait comme un pouvoir en panne
    const t = f.opponent;
    f.state.beamAngle = t && t.onStage ? Math.atan2(t.y - f.y, t.x - f.x) : f.heading;

    f.boost = ult.duration;
    f.boostFactor = ult.channelSpeed;
  },

  /**
   * Les deux temps de la manœuvre.
   *
   * **Pendant la charge**, l'axe suit encore la cible, mais à `trackRate` rad/s
   * seulement : assez pour qu'esquiver demande un vrai déplacement, trop peu
   * pour qu'un adversaire rapide soit condamné. **Au premier pas de tir**, il se
   * fige — c'est ce qui rend l'esquive possible, et c'est tout l'équilibre du
   * pouvoir.
   */
  tickBeam(f, dt, game) {
    const ult = f.el.ultimate;
    f.ult.active -= dt;
    const ecoule = ult.duration - f.ult.active;

    if (ecoule < ult.windup) {
      const t = f.opponent;
      if (t && t.onStage) {
        const vise = Math.atan2(t.y - f.y, t.x - f.x);
        f.state.beamAngle = rotateToward(f.state.beamAngle, vise, ult.trackRate * dt);
      }
      return;
    }

    if (!f.state.firing) {
      f.state.firing = true;
      f.state.beamTick = 0;
      game.shake(ult.beam.shake, 0.35);
    }

    f.state.beamTick -= dt;
    if (f.state.beamTick <= 0) {
      f.state.beamTick = ult.beam.interval;
      this.burnBeam(f, game);
    }

    if (f.ult.active <= 0) this.endBeam(f);
  },

  /**
   * Un tic de faisceau : tout ennemi dont le corps coupe le segment prend des
   * dégâts.
   *
   * Le recul est porté **le long de l'axe** et non vers l'extérieur : un rayon
   * pousse dans son sens, il n'écarte pas. Conséquence assumée — être poussé ne
   * sort pas du faisceau, il faut en sortir soi-même.
   */
  burnBeam(f, game) {
    const b = f.el.ultimate.beam;
    const c = Math.cos(f.state.beamAngle);
    const s = Math.sin(f.state.beamAngle);
    const bx = f.x + c * b.length;
    const by = f.y + s * b.length;

    for (const g of game.fighters) {
      if (g === f || g.team === f.team || !g.onStage) continue;
      const { d } = segmentPointDistance(f.x, f.y, bx, by, g.x, g.y);
      // de bord à bord, comme toutes les zones du dépôt : une bille posée juste
      // au bord du faisceau ne doit pas passer pour dehors
      if (d > b.halfWidth + g.radius) continue;
      /**
       * **`sound: 'hit'` — le faisceau dit qu'il est une arme.**
       *
       * Le moteur ne reconnaît une touche d'arme qu'à `kind: 'melee'` ; sans ce
       * mot, chaque tic du rayon sonnerait comme un projectile perdu
       * (`impact`), alors que c'est **le geste principal du personnage** depuis
       * que la couronne ne blesse plus. C'est le mécanisme exactement prévu
       * pour ça, et le seul usage du dépôt : un module l'écrit, le moteur s'en
       * sert, et il ne sait pas pourquoi.
       *
       * Effet de bord voulu : le créneau `hit` de sa fiche (`scorch`, une
       * brûlure) reste vivant alors que son arme ne blesse plus. Sans ce
       * branchement, `sound-check` criait « recette morte » — et il avait
       * raison.
       */
      game.damage(g, b.damage, f, { kind: 'beam', sound: 'hit', nx: c, ny: s, knockback: b.knockback });
    }
  },

  /**
   * **Seul point de sortie de l'ultime.** Jauge, drapeau de tir et bridage de
   * vitesse sont remis ensemble : dispersés, une fin de partie en pleine charge
   * laisserait le Soleil à 25 % de sa vitesse pour le reste du duel — c'est
   * exactement la régression que la Ruée du Ronin a déjà payée.
   */
  endBeam(f) {
    f.ult.active = 0;
    f.ult.charge = 0;
    f.ult.ready = false;
    f.state.firing = false;
    f.boost = 0;
    f.boostFactor = 1;
  },

  /* ------------------------------------------------------------------ */
  /*  Outils                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Les ennemis **présents sur le plateau** à moins de `radius` du Soleil.
   * Repris tel quel du Golem, pour les trois mêmes raisons : camp adverse
   * seulement (invariant 13), `onStage` et non `alive` (invariant 8), et
   * distance mesurée **de bord à bord**.
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
   * **La zone de Réchauffement, en permanence, et qui se resserre.**
   *
   * Elle n'est pas décorative : c'est la seule façon pour un spectateur de
   * comprendre *pourquoi* l'adversaire brûle en restant à distance. L'anneau
   * s'intensifie à mesure que l'horloge approche de zéro — on voit donc le coup
   * venir, comme on voit la charge du rayon.
   *
   * Aucun tirage : tout est déduit de `f.ability.timer`. Une décoration qui
   * consommerait un flux d'aléa déplacerait la matrice entière (invariant 2).
   */
  drawUnder(ctx, f) {
    if (!f.onStage) return;
    const a = f.el.ability;
    const t = 1 - Math.max(0, Math.min(1, f.ability.timer / a.cooldown)); // 0 → 1
    this.drawAmbiance(ctx, a, t, f.el.look.palette);
    ctx.save();
    ctx.globalAlpha = 0.1 + 0.28 * t * t;
    const g = ctx.createRadialGradient(f.x, f.y, f.radius, f.x, f.y, a.radius);
    const p = f.el.look.palette;
    g.addColorStop(0, teinte(p.light, 0.55));
    g.addColorStop(1, teinte(p.body, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, a.radius, 0, TAU);
    ctx.fill();
    ctx.restore();
  },

  /**
   * L'annonce puis le faisceau, tous deux **par-dessus** les combattants : un
   * rayon qui passerait derrière sa cible ne dirait pas qu'il la traverse.
   *
   * `match.js` repasse le chiffre de PV après cette boucle, donc recouvrir un
   * adversaire ici ne le rend pas illisible — piège documenté, et c'est ce qui
   * autorise un faisceau aussi large.
   */
  drawOver(ctx, f, game, now) {
    if (f.ult.active <= 0 || !f.onStage) return;
    const ult = f.el.ultimate;
    const ecoule = ult.duration - f.ult.active;
    if (f.state.firing) this.drawBeam(ctx, f, ult, now);
    else this.drawWindup(ctx, f, ult, Math.max(0, Math.min(1, ecoule / ult.windup)), now);
  },

  /**
   * **L'annonce** : l'axe tracé jusqu'au mur, et la bille de lumière qui enfle.
   *
   * L'axe compte autant que la bille — c'est lui qui dit *où* ça va tomber, et
   * c'est la seule information dont l'adversaire a besoin pour s'en sortir. Il
   * s'affirme avec la charge (`t²`), donc il est discret au début et
   * franchement lisible à la fin.
   */
  drawWindup(ctx, f, ult, t, now) {
    const c = Math.cos(f.state.beamAngle);
    const s = Math.sin(f.state.beamAngle);
    const b = ult.beam;

    ctx.save();
    /**
     * **Deux traits, pas un.** Un liseré orange large sous un cœur crème fin :
     * sur l'arène blanche, un trait clair seul est presque invisible — c'est le
     * piège du corps clair sur fond clair, appliqué à une ligne. L'orange porte
     * la lisibilité, le crème dit que c'est de la lumière.
     */
    const p = f.el.look.palette;
    ctx.globalAlpha = 0.2 + 0.55 * t * t;
    const x0 = f.x + c * f.radius;
    const y0 = f.y + s * f.radius;
    const x1 = f.x + c * b.length;
    const y1 = f.y + s * b.length;
    ctx.lineCap = 'round';
    ctx.strokeStyle = teinte(p.shadow, 0.85);
    ctx.lineWidth = 5 + 12 * t;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = teinte(p.core, 0.95);
    ctx.lineWidth = 2 + 4 * t;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    /**
     * **Le foyer**, posé juste devant lui : c'est autour de ce point que se
     * joue toute l'animation de charge, et c'est de là que le faisceau
     * partira. Le poser à `halfWidth × 0,55` du bord le fait grossir *vers
     * l'extérieur* — au centre du corps, la charge aurait eu l'air d'être
     * avalée au lieu d'être crachée.
     */
    const d = f.radius + b.halfWidth * 0.55;
    const fx = f.x + c * d;
    const fy = f.y + s * d;
    // la bille grossit jusqu'à la demi-largeur du faisceau : on lit son
    // diamètre final avant qu'il ne parte
    const r = 8 + (b.halfWidth - 8) * t;

    this.drawChargeRings(ctx, fx, fy, r, t, now, p);
    this.drawChargeShards(ctx, fx, fy, r, t, now, p);

    /**
     * **Le battement**, et il accélère : `8 + 26 t` rad/s, soit un peu plus de
     * une pulsation par seconde au début et quatre à la fin. C'est ce qui dit
     * que la charge *monte* — un cœur à battement constant se lit comme un
     * objet posé, pas comme quelque chose qui se remplit.
     */
    const pulse = 1 + 0.07 * Math.sin(now * (8 + 26 * t));
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r * pulse);
    /** Pas de blanc : le cœur du foyer est celui de la maquette. Un blanc pur
     *  serait la seule couleur du personnage à ne pas venir du dessin, et c'est
     *  exactement par ce genre d'exception que le faisceau avait dérivé. */
    g.addColorStop(0, teinte(p.core, 0.98));
    g.addColorStop(0.32, teinte(p.core, 0.92));
    g.addColorStop(0.6, teinte(p.light, 0.8));
    g.addColorStop(1, teinte(p.body, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(fx, fy, r * pulse, 0, TAU);
    ctx.fill();
    ctx.restore();
  },

  /**
   * **Trois anneaux qui se referment sur le foyer.**
   *
   * C'est la moitié de l'animation de charge, et le sens de marche est tout :
   * un anneau qui *s'ouvre* dit qu'une onde part, un anneau qui *se referme*
   * dit qu'on ramasse de l'énergie. Ils sont déphasés d'un tiers de cycle pour
   * qu'il y en ait toujours un en route, et leur cadence suit la charge
   * (`1,1 + 1,6 t` cycles par seconde) — de plus en plus pressés à mesure que
   * le tir approche.
   *
   * **Aucun tirage** : la phase est une fonction du temps, l'angle une
   * constante. Une décoration qui consommerait un flux d'aléa déplacerait la
   * matrice entière (invariant 2), et ce module n'en touche aucun.
   */
  drawChargeRings(ctx, fx, fy, r, t, now, pal) {
    const cadence = 1.1 + 1.6 * t;
    ctx.strokeStyle = teinte(pal.core, 0.9);
    for (let i = 0; i < 3; i++) {
      const phase = (now * cadence + i / 3) % 1; // 0 → 1, l'anneau se referme
      const rr = r * (3.4 - 2.4 * phase);
      // il s'affirme en arrivant puis s'éteint net sur le foyer
      const a = Math.min(1, phase * 3) * (1 - phase) * (0.35 + 0.5 * t);
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      ctx.lineWidth = 2 + 5 * phase * t;
      ctx.beginPath();
      ctx.arc(fx, fy, rr, 0, TAU);
      ctx.stroke();
    }
  },

  /**
   * **Huit éclats qui tombent vers le foyer**, un par rayon de la couronne —
   * c'est ce qui raccroche l'animation au personnage plutôt que d'être un
   * effet posé devant lui : la charge a l'air d'être aspirée *de ses propres
   * rayons*.
   *
   * Leur trajet est le même que celui des anneaux mais deux fois plus rapide,
   * décalé par index. Purement déduit du temps et de l'index, donc sans aléa.
   */
  drawChargeShards(ctx, fx, fy, r, t, now, pal) {
    const n = 8;
    ctx.strokeStyle = teinte(pal.light, 0.95);
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const phase = (now * (0.9 + 1.3 * t) + i / n) % 1;
      const from = r * (4.2 - 3.2 * phase);
      const to = from - r * 0.55;
      const a = Math.min(1, phase * 2.5) * (1 - phase) * (0.5 + 0.5 * t);
      if (a <= 0.01 || to <= 0) continue;
      const ang = (TAU * i) / n;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      ctx.globalAlpha = a;
      ctx.lineWidth = 2 + 3 * t;
      ctx.beginPath();
      ctx.moveTo(fx + ca * from, fy + sa * from);
      ctx.lineTo(fx + ca * to, fy + sa * to);
      ctx.stroke();
    }
  },

  /**
   * **Le faisceau, fait de la même matière que l'astre — demandé.**
   *
   * Les bandes ne sont plus écrites ici mais dans la fiche
   * (`ultimate.beam.bands`), et leurs teintes nomment `look.palette`, les cinq
   * couleurs relevées sur la maquette du corps. Le rayon reprend donc la
   * **structure du dessin** — liseré d'encre brûlée, rouge profond, orange de
   * corps, clair, incandescent — étirée le long d'un axe.
   *
   * Ce qui manquait avant, et qui change tout : le **liseré sombre**. Le
   * faisceau allait d'orange à blanc, sans bord ; c'est le trait brûlé qui
   * signe le dessin de l'astre, et sans lui le rayon se dissolvait en plus sur
   * l'arène blanche.
   *
   * Le dégradé est transversal (perpendiculaire à l'axe) et non longitudinal :
   * un rayon qui pâlirait vers la pointe se lirait comme un rayon qui *s'arrête*
   * — or celui-ci va jusqu'au mur. Ce qui varie sur la longueur, c'est
   * l'opacité d'ensemble, et seulement à l'extinction.
   */
  drawBeam(ctx, f, ult, now) {
    const b = ult.beam;
    const pal = f.el.look.palette;
    // dernier quart de seconde : le faisceau s'éteint au lieu de disparaître
    const fade = Math.min(1, f.ult.active / 0.25);

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.state.beamAngle);
    ctx.globalAlpha = fade;

    // de la plus large à la plus étroite : l'ordre de la liste de la fiche
    for (const bande of b.bands) {
      const demi = b.halfWidth * bande.at;
      ctx.fillStyle = teinte(pal[bande.tint], bande.alpha);
      ctx.fillRect(0, -demi, b.length, demi * 2);
    }

    this.drawFilaments(ctx, b, pal, now);
    this.drawEmbers(ctx, b, pal, now);

    // le point de départ, plus intense : le rayon sort de lui, il n'apparaît pas
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, b.halfWidth * 2);
    g.addColorStop(0, teinte(pal.core, 0.9));
    g.addColorStop(1, teinte(pal.light, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, b.halfWidth * 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  },

  /**
   * **L'arène chauffe à mesure que le Réchauffement approche — demandé.**
   *
   * Le seul signe de l'horloge était jusqu'ici une ligne de HUD et le halo de
   * 240 px sous l'astre. Le pouvoir arrivait donc *sur* l'adversaire sans que
   * rien, dans l'image, n'ait dit qu'il montait.
   *
   * **Deux couches, et le choix des deux est contraint.** La règle de
   * composition de `flair.js` est explicite : *rien entre le spectateur et les
   * combattants — remplir le cadre par le fond, les bords ou l'arrière du
   * combattant, jamais par une nuée flottante.* D'où un **lavis au sol** et une
   * **braise qui monte des quatre bords**, les deux dans `drawUnder`, donc sous
   * les billes. À pleine chaleur, on voit toujours les deux combattants et les
   * deux chiffres de PV exactement comme à froid.
   *
   * **La montée est en carré**, pas linéaire : une rampe droite se lit comme un
   * fondu d'écran, `t²` reste froid longtemps puis bascule sur la dernière
   * seconde — ce qui est l'information utile. Et la décharge remet à zéro d'un
   * coup, ce qui donne au pouvoir la respiration qu'il n'avait pas.
   *
   * **Le décor, lui, n'a pas bougé** (invariant 4) : il reste rasterisé une
   * fois dans `scene.js` et blitté en un `drawImage`. On peint **par-dessus**,
   * ce qui ne coûte que deux remplissages et se retire en changeant deux
   * nombres de la fiche.
   *
   * En miroir (deux Soleils), les deux ambiances s'additionnent : l'arène est
   * deux fois plus chaude, ce qui est exactement ce qu'on veut voir, et les
   * opacités sont assez basses pour que la somme ne sature pas.
   *
   * Les trois teintes viennent de `look.palette`, comme tout le reste du
   * module : **aucun littéral de couleur ici non plus**. C'est ce qui fait
   * que repalettiser le Soleil repeint aussi sa chaleur d'ambiance, au lieu de
   * la laisser dériver du personnage qu'elle annonce.
   */
  drawAmbiance(ctx, a, t, pal) {
    const amb = a.ambience;
    if (!amb) return;
    const k = t * t; // voir ci-dessus : carré, pas rampe
    const i = ARENA.inner;
    const w = i.right - i.left;
    const h = i.bottom - i.top;

    ctx.save();
    // 1. le lavis au sol
    ctx.globalAlpha = amb.tint * k;
    ctx.fillStyle = teinte(pal.body, 1);
    ctx.fillRect(i.left, i.top, w, h);

    // 2. la braise qui monte des bords — un dégradé radial inversé, centré sur
    //    l'arène : transparent au milieu, saturé aux quatre bords
    ctx.globalAlpha = amb.vignette * k;
    const cx = i.left + w / 2;
    const cy = i.top + h / 2;
    const g = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.18, cx, cy, Math.max(w, h) * 0.72);
    g.addColorStop(0, teinte(pal.shadow, 0));
    g.addColorStop(0.55, teinte(pal.shadow, 0.25));
    g.addColorStop(1, teinte(pal.edge, 0.95));
    ctx.fillStyle = g;
    ctx.fillRect(i.left, i.top, w, h);
    ctx.restore();
  },

  /**
   * **Les filaments** — les zigzags de la maquette, et ce qui fait que le
   * faisceau *coule* au lieu d'être allumé.
   *
   * **Les sommets sont posés aux pointes, pas échantillonnés.** Évaluer une
   * onde triangulaire à pas régulier donnerait des dents dont l'amplitude
   * *respire* au lieu de défiler — l'échantillonnage bat avec la phase. On pose
   * donc un sommet toutes les demi-longueurs d'onde, alternativement en haut et
   * en bas, et on **décale toute la ligne** : la dent garde sa forme exacte et
   * remonte le faisceau.
   *
   * Le tracé est écrêté au faisceau : sans ça, les pointes dépasseraient à la
   * bouche, là où le rayon est censé sortir du corps.
   */
  drawFilaments(ctx, b, pal, now) {
    const fl = b.filaments;
    if (!fl) return;
    const onde = b.halfWidth * fl.wavelength;
    const amp = b.halfWidth * fl.amplitude;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -b.halfWidth, b.length, b.halfWidth * 2);
    ctx.clip();
    ctx.lineWidth = fl.width;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = teinte(pal.core, fl.alpha);

    for (let k = 0; k < fl.count; k++) {
      // chaque filament part d'une phase différente et du côté opposé : deux
      // dents en miroir, comme sur la maquette
      const sens = k % 2 ? -1 : 1;
      const decal = ((now * fl.speed + k / fl.count) % 1) * onde;
      ctx.beginPath();
      let premier = true;
      for (let i = -1; i * (onde / 2) - decal <= b.length + onde; i++) {
        const x = i * (onde / 2) - decal;
        const y = sens * amp * (i % 2 ? 1 : -1);
        if (premier) { ctx.moveTo(x, y); premier = false; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  },

  /**
   * **Les braises**, qui remontent le faisceau depuis l'émetteur et pâlissent
   * en s'éloignant. Elles disent le **sens de l'écoulement** — sans elles, un
   * faisceau symétrique ne dit pas d'où il part.
   *
   * Déterministes comme tout le reste du personnage : position et taille sont
   * des fonctions du temps et de l'index, jamais d'un tirage. Une décoration
   * qui puiserait dans `game.rng` déplacerait les vainqueurs (invariant 2).
   */
  drawEmbers(ctx, b, pal, now) {
    const em = b.embers;
    if (!em) return;
    ctx.save();
    for (let k = 0; k < em.count; k++) {
      const u = (now * em.speed + k / em.count) % 1;
      const x = u * b.length;
      const y = Math.sin(k * 2.39 + now * 1.7) * b.halfWidth * em.span;
      const r = b.halfWidth * em.radius * (1 - u * 0.6);
      ctx.globalAlpha = (1 - u) * 0.85;
      ctx.fillStyle = teinte(pal.core, 1);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, r), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  },

  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },
};
