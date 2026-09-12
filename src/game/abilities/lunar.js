/**
 * Pouvoirs de LUNE — **Météores** et **Pluie de météores**.
 *
 * Ce module est particulier à un titre : **il porte la totalité des dégâts du
 * personnage**. LUNE n'a plus d'arme (demandé), donc `resolveMelee` n'a rien à
 * lui appliquer et `Match.damage` ne la voit jamais passer par le moteur. Tout
 * ce qu'elle retire à quelqu'un part d'ici, et tombe du ciel.
 *
 * **Un seul mécanisme, deux échelles.** Une pierre est un objet minuscule —
 * un point de chute, une horloge, une taille et une silhouette — et les deux
 * pouvoirs ne font qu'en semer, l'un par trois toutes les 2,6 s, l'autre par
 * treize sur quatre secondes de nuit. Ils partagent donc `sème()`, `tickRocks()`
 * et `impact()` : le seul endroit où ils diffèrent est le bloc de fiche qu'ils
 * lisent, `ability` ou `ultimate`.
 *
 * **Aucun tirage, nulle part.** Ni `game.rng` ni `viewRng` : le semis est déduit
 * d'un compteur par l'angle d'or, et tout le rendu est une fonction de l'état et
 * du temps. Deux duels à la même graine creusent les mêmes cratères aux mêmes
 * endroits (invariant 2).
 *
 * **Ce que le moteur en sait : rien** (invariant 12). La taille passe par
 * `f.sizeFactor`, la vitesse par `f.boost`/`f.boostFactor` — deux compteurs
 * génériques, aucun nom de combattant côté moteur.
 *
 * @module game/abilities/lunar
 */

import { TAU } from '../../core/math.js';
import { ARENA } from '../../data/tuning.js';
import { drawSpriteCentered } from '../../render/sprites.js';

/** `#rrggbb` → `rgba()`, pour ne jamais recopier une teinte de la palette.
 *  Ce module n'a **aucun littéral de couleur** : tout vient de `look.palette`,
 *  les cinq bandes relevées sur la maquette du corps plus le halo `glow`. */
function teinte(hex, alpha = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** **L'angle d'or**, en radians. Il oriente chaque semis sans consommer un
 *  tirage : deux pierres successives sont tournées de 137,5°, donc elles ne se
 *  superposent jamais et l'averse n'a pas l'air réglée. */
const OR = Math.PI * (3 - Math.sqrt(5));

/** Les trois silhouettes de météore, dans l'ordre de `pixelmaps.js`. Choisies
 *  par compteur, donc sans aléa — et trois valent mieux qu'une répétée treize
 *  fois : une seule forme se lit comme un motif, pas comme une averse. */
const PIERRES = ['lunarRock1', 'lunarRock2', 'lunarRock3'];

export const lunarAbilities = {
  id: 'lunar',

  init(f) {
    /** Les météores en vol, des deux pouvoirs confondus. Chacun porte son point
     *  de chute, son horloge, sa taille et sa silhouette. */
    f.state.rocks = [];
    /** Compteur de pierres semées. Sert à deux choses et à rien d'autre :
     *  choisir la silhouette et tourner le semis. C'est ce qui remplace un
     *  tirage. */
    f.state.jet = 0;
    /** Cratères creusés. Affiché au HUD : une salve qui n'a rien touché a quand
     *  même frappé le sol, et c'est cette production-là qu'on veut lire. */
    f.state.impacts = 0;
    /** Vrai pendant l'averse de l'ultime, faux pendant son annonce. Lu par le
     *  rendu — même forme que `f.state.firing` du Soleil : un seul drapeau dit
     *  où en est la manœuvre. */
    f.state.storm = false;
    /** Horloge interne de l'averse, entre deux pierres. */
    f.state.stormTimer = 0;
  },

  update(f, dt, now, game) {
    const el = f.el;

    /** Les pierres en vol retombent quoi qu'il arrive : suspendre leur horloge
     *  à la fin du combat les laisserait suspendues en l'air pendant la parade. */
    this.tickRocks(f, dt, game);

    /* ---------- Pluie de météores : annonce, averse, reprise -------------- */
    if (f.ult.active > 0) {
      this.tickStorm(f, dt, now, game);
    } else if (game.phase === 'fight') {
      f.ult.charge = Math.min(100, f.ult.charge + el.ultimate.chargeRate * dt);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castStorm(f);
    }

    if (game.phase !== 'fight') return;

    /* ---------- Météores : horloge fixe, semis sur la cible --------------- */
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) {
      f.ability.timer = el.ability.cooldown;
      f.ability.uses += 1;
      this.castMeteors(f, now, game);
    }
  },

  /**
   * **Le point visé : là où la cible *sera*, pas là où elle est.**
   *
   * C'est la seule chose qui rende son averse jouable des deux côtés, et c'est
   * une asymétrie mesurée, pas une intuition. Sans anticipation, le taux de
   * touche ne dépend que de la **vitesse de la cible** : l'Hoplite, qui charge à
   * 1118 px/s, quitte un cercle de 62 px avant que la pierre n'arrive, tandis
   * que le Soleil, le plus lent du roster (230 px/s), le prend en entier. Elle
   * écrasait donc le seul boss et se faisait battre par le plus rapide des
   * six — l'inverse exact de sa spécification.
   *
   * Le tir mène d'une fraction `lead` du temps de chute, sur le **cap et la
   * vitesse courante** de la cible, lus au moteur (`currentSpeed`) pour ne pas
   * réimplémenter ses ralentissements et ses ruées. Conséquence de jeu : on
   * n'esquive plus en **continuant** de courir, on esquive en **changeant de
   * direction** — ce qui demande de regarder le sol, donc de voir l'annonce.
   *
   * Et l'asymétrie tombe où on la voulait : mener la trajectoire d'un
   * combattant lent ne déplace presque rien, mener celle d'un combattant rapide
   * déplace tout.
   */
  vise(cible, dt, now) {
    const v = cible.currentSpeed(now) * dt;
    return { x: cible.x + Math.cos(cible.heading) * v, y: cible.y + Math.sin(cible.heading) * v };
  },

  /* ------------------------------------------------------------------ */
  /*  Le semis — commun aux deux pouvoirs                                */
  /* ------------------------------------------------------------------ */

  /**
   * **Une pierre, lâchée sur un point.**
   *
   * `src` ne sert qu'à retrouver le bloc de fiche à l'atterrissage : les deux
   * pouvoirs sèment exactement de la même façon, ils ne diffèrent que par leurs
   * chiffres. C'est ce qui permet à l'ultime d'être « le pouvoir, en treize
   * fois » sans une ligne de code en double.
   *
   * Le point est **borné à l'arène** : un cratère à cheval sur le mur
   * annoncerait une zone dont la moitié n'existe pas.
   */
  seme(f, src, x, y, delai) {
    const b = src === 'storm' ? f.el.ultimate : f.el.ability;
    const i = ARENA.inner;
    f.state.jet += 1;
    f.state.rocks.push({
      src,
      x: Math.max(i.left + b.blast, Math.min(i.right - b.blast, x)),
      y: Math.max(i.top + b.blast, Math.min(i.bottom - b.blast, y)),
      t: b.fall + delai,
      sprite: PIERRES[f.state.jet % PIERRES.length],
    });
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
   * **Les deux averses ne sonnent pas pareil, et c'est voulu.** Les pierres du
   * pouvoir jouent `impact`, le choc sec ; celles de l'ultime passent
   * `sound: 'hit'` dans `game.damage`, donc le **glas** de sa fiche. C'est le
   * mécanisme prévu pour une arme que le moteur ne reconnaît pas comme telle, et
   * c'est aussi ce qui garde `knell` en vie depuis que l'arme a disparu.
   */
  impact(f, r, game) {
    const b = r.src === 'storm' ? f.el.ultimate : f.el.ability;
    const pal = f.el.look.palette;
    f.state.impacts += 1;
    game.sfx.cast(f, 'impact');
    game.fx.ring(r.x, r.y, b.blast * 0.35, b.blast, b.ring.time,
      teinte(pal.glow, 0.85), b.ring.width, false);
    game.shake(b.shake, 0.15);

    for (const g of game.fighters) {
      if (g === f || g.team === f.team || !g.onStage) continue;
      const dx = g.x - r.x;
      const dy = g.y - r.y;
      /**
       * **De centre à centre, et c'est le seul écart du dépôt.** Toutes les
       * autres zones se mesurent de **bord à bord** (`rayon + g.radius`), ce qui
       * est juste pour une onde ou un faisceau : ils balaient un volume, et une
       * bille posée juste au bord en fait partie.
       *
       * Un cratère, non — et pour deux raisons qui se rejoignent :
       *
       *  • **le cercle est dessiné au sol**, et il doit dire la vérité. En bord
       *    à bord, un combattant debout à 100 px d'un cercle de 62 prend quand
       *    même le coup : le dessin mentirait sur la géométrie, ce que le dépôt
       *    s'interdit partout ailleurs (`handle.length + largeur = reach`) ;
       *  • **en bord à bord, un gros corps est puni deux fois.** La surface de
       *    capture vaut `(blast + rayon)²` : 144² pour le Soleil (rayon 82)
       *    contre 103² pour la norme, soit **deux fois plus de surface**. Relevé
       *    avant correction : 13,0 PV/s et **44 touches par duel** contre le
       *    Soleil, pour 2,1 à 4,3 PV/s et 9 touches contre tous les autres. Elle
       *    ne gagnait pas parce qu'elle est forte, elle gagnait parce qu'il est
       *    **gros et lent** — et aucun nerf global ne pouvait corriger ça sans
       *    la faire perdre contre les six autres d'abord.
       */
      if (Math.hypot(dx, dy) > b.blast) continue;
      const opts = { kind: r.src === 'storm' ? 'storm' : 'meteor', nx: dx, ny: dy, knockback: b.knockback };
      if (r.src === 'storm') opts.sound = 'hit';
      game.damage(g, b.damage, f, opts);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Météores — le pouvoir                                              */
  /* ------------------------------------------------------------------ */

  /**
   * **Trois pierres partent sur l'adversaire.**
   *
   * La première tombe sur sa position **à l'instant du tir**, les deux autres à
   * `spread` de là. Viser la position courante et non une position anticipée est
   * délibéré : le pouvoir n'est pas censé toucher un adversaire qui bouge, il
   * est censé lui **interdire de s'arrêter**.
   *
   * **Sans cible, rien ne part**, et l'horloge est quand même consommée : une
   * salve tirée dans le vide creuserait trois cratères que personne n'a
   * provoqués.
   */
  castMeteors(f, now, game) {
    const a = f.el.ability;
    const cible = f.opponent;
    if (!cible || !cible.onStage) return;

    game.sfx.cast(f, 'ability');
    const p = this.vise(cible, a.fall * a.lead, now);
    for (let k = 0; k < a.count; k++) {
      const ang = f.ability.uses * OR + (k * TAU) / a.count;
      const d = k === 0 ? 0 : a.spread;
      // décalées, sinon les trois touchent dans le même pas : un seul fracas
      // (`MIX.repeatGap`) et une gerbe unique, donc une salve qui se lit comme
      // un unique gros coup
      this.seme(f, 'power', p.x + Math.cos(ang) * d, p.y + Math.sin(ang) * d, k * a.stagger);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Pluie de météores — l'ultime                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Déclenchement. Elle se bride tout de suite — `f.boost` / `f.boostFactor`
   * sont les compteurs génériques du `Fighter` (invariant 7) : un module les
   * allume, le moteur les décompte et **ne sait pas pourquoi**.
   *
   * Pas de `game.sfx.cast` ici : `match.js` détecte la bascule de `f.ult.active`
   * et joue la recette que la fiche nomme, pour tout ultime du dépôt.
   */
  castStorm(f) {
    const ult = f.el.ultimate;
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.state.storm = false;
    f.state.stormTimer = 0;
    f.boost = ult.duration;
    f.boostFactor = ult.channelSpeed;
  },

  /**
   * Les trois temps de la manœuvre.
   *
   * **L'annonce** (`windup`) : la nuit tombe, le corps gonfle en `t²` — lent
   * d'abord, franc à la fin — et des pierres se détachent d'elle (dessinées
   * seulement, voir `drawLift`). **L'averse** : une pierre toutes les
   * `interval`, semée autour d'un adversaire sur `spread`. **La reprise** :
   * plus rien n'est semé pendant les `tail` dernières secondes, pour que la
   * dernière pierre touche le sol avant que la nuit ne se lève.
   *
   * Le semis vise l'adversaire **à l'instant de chaque pierre**, pas une fois
   * pour toutes : une averse qui tomberait toute au même endroit se contourne en
   * marchant, et ce serait alors un pouvoir plus lent, pas un ultime.
   */
  tickStorm(f, dt, now, game) {
    const ult = f.el.ultimate;
    f.ult.active -= dt;
    const ecoule = ult.duration - f.ult.active;

    let t = Math.min(1, Math.max(0, ecoule / ult.windup));
    t *= t;
    if (f.ult.active < ult.settle) t = Math.min(t, Math.max(0, f.ult.active) / ult.settle);
    f.sizeFactor = 1 + (ult.swell - 1) * t;

    const dedans = ecoule >= ult.windup && f.ult.active > ult.tail;
    if (dedans && !f.state.storm) f.state.storm = true;

    if (dedans) {
      f.state.stormTimer -= dt;
      if (f.state.stormTimer <= 0) {
        f.state.stormTimer = ult.interval;
        this.tombe(f, now, game);
      }
    }

    if (f.ult.active <= 0) this.endStorm(f);
  },

  /**
   * Une pierre de l'averse. Elle tombe **autour** d'un adversaire et non sur
   * lui : `spread` vaut 200 px contre 92 pour le pouvoir, donc l'ultime couvre
   * une zone au lieu de poursuivre un point. Le rayon est pris en racine pour
   * que le semis soit **uniforme en surface** — sans ça, treize pierres
   * s'agglutineraient au centre et laisseraient le pourtour vide.
   */
  tombe(f, now, game) {
    const ult = f.el.ultimate;
    const cible = f.opponent;
    const p = cible && cible.onStage ? this.vise(cible, ult.fall * ult.lead, now) : { x: f.x, y: f.y };
    const ax = p.x;
    const ay = p.y;
    const n = f.state.jet;
    const ang = n * OR;
    const d = ult.spread * Math.sqrt(((n * 0.618033988) % 1));
    this.seme(f, 'storm', ax + Math.cos(ang) * d, ay + Math.sin(ang) * d, 0);
  },

  /**
   * **Seul point de sortie de l'ultime**, comme les ruées du dépôt : jauge,
   * drapeau, taille et bridage de vitesse sont remis **ensemble**. Dispersés,
   * une fin de duel en pleine averse laisserait la Lune gonflée et à 55 % de sa
   * vitesse pour la parade — exactement la régression que la Ruée du Ronin a
   * déjà payée une fois.
   *
   * Les pierres déjà en vol, elles, **ne sont pas annulées** : elles ont été
   * annoncées au sol, elles doivent tomber.
   */
  endStorm(f) {
    f.ult.active = 0;
    f.ult.charge = 0;
    f.ult.ready = false;
    f.state.storm = false;
    f.state.stormTimer = 0;
    f.sizeFactor = 1;
    f.boost = 0;
    f.boostFactor = 1;
  },

  /* ------------------------------------------------------------------ */
  /*  Rendu                                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Tout ce qui est **au sol** : la nuit et les points de chute.
   *
   * Les deux sont sous les combattants, ce qui est la règle de composition de
   * `flair.js` — *rien entre le spectateur et les combattants*. C'est aussi ce
   * qui permet de les rendre francs : une ombre à 55 % ne gêne personne au sol,
   * la même posée devant masquerait un chiffre de PV.
   */
  drawUnder(ctx, f) {
    if (!f.onStage) return;
    this.drawNight(ctx, f);
    this.drawTargets(ctx, f);
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
    if (!f.state.rocks.length) return;
    const pal = f.el.look.palette;

    ctx.save();
    for (const r of f.state.rocks) {
      const b = r.src === 'storm' ? f.el.ultimate : f.el.ability;
      const u = Math.max(0, Math.min(1, r.t / b.fall)); // 1 au départ → 0 à l'impact
      const v = 1 - u;

      ctx.globalAlpha = 0.14 + 0.42 * v;
      ctx.fillStyle = teinte(pal.edge, 1);
      ctx.beginPath();
      ctx.arc(r.x, r.y, (b.size / 2) * (0.35 + 0.65 * v), 0, TAU);
      ctx.fill();

      ctx.globalAlpha = 0.32 + 0.5 * v;
      ctx.strokeStyle = teinte(pal.glow, 1);
      ctx.lineWidth = 2 + 2 * v;
      ctx.beginPath();
      ctx.arc(r.x, r.y, b.blast * (1 + 0.9 * u), 0, TAU);
      ctx.stroke();

      ctx.globalAlpha = 0.22 + 0.3 * v;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, b.blast, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  },

  /**
   * **La nuit d'arène**, et c'est la mécanique de la chaleur du Soleil, en
   * miroir : deux couches dans `drawUnder`, un lavis au sol et un bord qui
   * s'assombrit.
   *
   * Elle n'est pas décorative, c'est ce qui **rend l'averse visible** : des
   * pierres grises qui tombent sur une arène blanche ne se voient pas ; sur une
   * arène éteinte, chacune est une lumière qui descend.
   *
   * Le décor, lui, n'a pas bougé (invariant 4) : il reste rasterisé une fois
   * dans `scene.js` et blitté en un `drawImage`. On peint **par-dessus**, ce qui
   * ne coûte que deux remplissages et se retire en changeant deux nombres de la
   * fiche.
   *
   * **La montée suit l'annonce**, en carré — discrète longtemps, franche à la
   * fin —, et elle se retire sur `settle`, en même temps que le corps
   * redescend : les deux disent la même chose, elles doivent finir ensemble.
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
    k *= k;

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
   * Ce qui est **en l'air** : les pierres qui tombent, celles qui décollent
   * d'elle, et la couronne de glace pendant l'ultime.
   *
   * `match.js` repasse le chiffre de PV après cette boucle, donc recouvrir un
   * adversaire ici ne le rend pas illisible — piège documenté.
   */
  drawOver(ctx, f, game, now) {
    if (!f.onStage) return;
    this.drawRocks(ctx, f);
    this.drawLift(ctx, f, now);
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
   * **Chaque pierre tourne**, et c'est la deuxième moitié de l'effet : une
   * silhouette figée qui grandit se lit comme un zoom. La rotation est déduite
   * du point de chute (une fonction pure des coordonnées), donc sans aléa et
   * stable d'une image à l'autre.
   *
   * La traînée est tracée **derrière** la pierre, donc vers le haut : c'est elle
   * qui dit d'où ça vient quand le point de chute est près du bord haut et que
   * la pierre entre déjà dans le cadre.
   */
  drawRocks(ctx, f) {
    if (!f.state.rocks.length) return;
    const pal = f.el.look.palette;

    for (const r of f.state.rocks) {
      const b = r.src === 'storm' ? f.el.ultimate : f.el.ability;
      const u = Math.max(0, Math.min(1, r.t / b.fall));
      const h = b.height * (1 - (1 - u) * (1 - u));
      const y = r.y - h;

      /**
       * **Deux traits, et c'est le même piège que l'axe du Rayon solaire** :
       * *un trait clair seul n'existe pas sur l'arène blanche*. Un liseré large
       * en `light` porte la lisibilité de jour, un cœur fin en `glow` dit que
       * c'est de la lumière — et c'est lui qu'on voit sous la nuit de l'ultime,
       * quand le premier disparaît dans le noir. Aucun des deux ne suffit aux
       * deux fonds.
       */
      const q = Math.min(150, h * 0.6);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.18 + 0.34 * u;
      ctx.strokeStyle = teinte(pal.light, 1);
      ctx.lineWidth = 5 + b.size / 12;
      ctx.beginPath();
      ctx.moveTo(r.x, y);
      ctx.lineTo(r.x, y - q);
      ctx.stroke();
      ctx.globalAlpha = 0.3 + 0.5 * u;
      ctx.strokeStyle = teinte(pal.glow, 1);
      ctx.lineWidth = 2 + b.size / 26;
      ctx.beginPath();
      ctx.moveTo(r.x, y);
      ctx.lineTo(r.x, y - q * 0.82);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(r.x, y);
      // rotation déduite du point de chute : pure, donc déterministe
      ctx.rotate(((r.x * 0.031 + r.y * 0.017) % TAU) + u * 1.2);
      drawSpriteCentered(ctx, r.sprite, 0, 0, b.size);
      ctx.restore();
    }
  },

  /**
   * **Les pierres qui se détachent d'elle pendant l'annonce.**
   *
   * C'est la chaîne causale qu'il fallait rendre visible : le ciel ne tombe pas
   * tout seul, c'est *elle* qui le lâche. Cinq éclats montent du limbe et
   * sortent du cadre pendant les 1,1 s de charge, chacun sur son propre azimut,
   * accélérant en `t²` comme le corps qui gonfle.
   *
   * Purement dessinées : elles ne blessent pas et ne coûtent aucun état. Leur
   * position est une fonction du temps écoulé et de l'index, donc sans aléa
   * (invariant 2) et identique à chaque relecture d'une même graine.
   */
  drawLift(ctx, f) {
    const ult = f.el.ultimate;
    if (f.ult.active <= 0 || f.state.storm) return;
    const ecoule = ult.duration - f.ult.active;
    const t = Math.min(1, Math.max(0, ecoule / ult.windup));
    if (t <= 0.02) return;

    for (let k = 0; k < ult.lift; k++) {
      // décalés dans le temps : ils ne décollent pas tous ensemble
      const p = Math.max(0, Math.min(1, t * 1.35 - k * 0.11));
      if (p <= 0) continue;
      const ang = -Math.PI / 2 + (k - (ult.lift - 1) / 2) * 0.42;
      const d = f.radius * (0.55 + 1.9 * p * p);
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.95;
      ctx.translate(f.x + Math.cos(ang) * d, f.y + Math.sin(ang) * d);
      ctx.rotate(k * 1.7 + p * 2.4);
      drawSpriteCentered(ctx, PIERRES[k % PIERRES.length], 0, 0, 30 * (1 - 0.35 * p));
      ctx.restore();
    }
  },

  /**
   * **La couronne de glace** — deux traits sur le limbe, plus les anneaux qui se
   * referment pendant l'annonce.
   *
   * Deux traits et pas un, pour la raison que le dépôt a déjà écrite à propos de
   * l'axe du Rayon solaire : *un trait clair seul n'existe pas sur l'arène
   * blanche*. La pierre porte la lisibilité, le halo dit que c'est de la
   * lumière — et c'est littéralement ce que montre la maquette, un disque gris
   * cerclé de glace.
   *
   * Les anneaux **se referment** au lieu de s'ouvrir, comme la charge du Soleil
   * et pour le même motif : un anneau qui s'ouvre dit qu'une onde part, un
   * anneau qui se referme dit que quelque chose se ramasse. Ils s'arrêtent net
   * quand l'averse commence — à ce moment-là, ce qui part, ce sont les pierres.
   */
  drawCorona(ctx, f, now) {
    if (f.ult.active <= 0) return;
    const ult = f.el.ultimate;
    const pal = f.el.look.palette;
    const ecoule = ult.duration - f.ult.active;
    const t = Math.min(1, Math.max(0, ecoule / ult.windup));
    const R = f.radius + 3;

    ctx.save();
    ctx.globalAlpha = 0.3 + 0.55 * t;
    ctx.strokeStyle = teinte(pal.light, 1);
    ctx.lineWidth = 5 + 5 * t;
    ctx.beginPath();
    ctx.arc(f.x, f.y, R, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = teinte(pal.glow, 1);
    ctx.lineWidth = 2 + 3 * t;
    ctx.beginPath();
    ctx.arc(f.x, f.y, R, 0, TAU);
    ctx.stroke();

    if (!f.state.storm) {
      ctx.strokeStyle = teinte(pal.glow, 0.9);
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
   * **Deux jauges en une, et c'est assumé.** La barre porte la charge de
   * l'averse ; pendant l'ultime elle se **vide** au lieu de rester pleine, pour
   * dire le temps qu'il reste — l'annonce et l'averse y passent d'un bloc, comme
   * chez le Soleil.
   */
  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },
};
