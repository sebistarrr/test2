/**
 * Pouvoirs de LUNE — **Marée** et **Éclipse**, et surtout le cycle des phases
 * dont tout le reste du personnage découle.
 *
 * Ce module est particulier à un titre : il ne se contente pas d'ajouter des
 * pouvoirs, il **réécrit trois grandeurs du combattant à chaque pas** — sa
 * taille, sa vitesse et, indirectement, ses dégâts de contact. Les trois
 * passent par des **compteurs génériques** du `Fighter` (`sizeFactor`,
 * `boostFactor`) ou par une valeur de fiche en fonction (`melee.damage`), donc
 * le moteur n'a pas une ligne qui connaisse LUNE — invariant 12.
 *
 * **Aucun tirage.** Le cycle est une fonction pure du temps de duel, comme
 * l'animation de charge du Soleil : ni `game.rng` ni `viewRng`. Deux duels à la
 * même graine montrent la même lune aux mêmes instants.
 *
 * @module game/abilities/lunar
 */

import { TAU } from '../../core/math.js';
import { drawSpriteCentered } from '../../render/sprites.js';

/** `#rrggbb` → `rgba()`, pour ne jamais recopier une teinte de la palette. */
function teinte(hex, alpha = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export const lunarAbilities = {
  id: 'lunar',

  init(f) {
    /**
     * **L'illumination, et c'est tout le personnage.** Elle démarre à 0 — LUNE
     * entre en nouvelle lune : petite, rapide, inoffensive. Un boss qui
     * apparaît à son maximum ne laisserait pas voir qu'il en a un.
     */
    f.state.ill = 0;
    f.state.waxing = true;
    /** Horloge propre du drain d'Éclipse, indépendante du verrou de mêlée :
     *  l'ultime ne passe pas par l'arme, il ne peut donc pas s'appuyer sur
     *  `meleeCd`. */
    f.state.drainTimer = 0;
    this.applyPhase(f);
  },

  /**
   * **Le cycle, posé avant tout le reste.**
   *
   * Triangulaire et non sinusoïdal : une sinusoïde passe l'essentiel de son
   * temps près de ses extrêmes, donc LUNE serait presque toujours pleine ou
   * presque toujours neuve, et les phases intermédiaires — celles qui rendent
   * le personnage lisible — ne se verraient qu'en coup de vent. Une rampe
   * donne **autant de temps à chaque phase**.
   */
  update(f, dt, now, game) {
    const el = f.el;

    const p = el.moon.period;
    // position dans le cycle, de 0 à 1 ; la rampe monte sur la première moitié
    const u = ((game.time % p) + p) % p / p;
    f.state.waxing = u < 0.5;
    f.state.ill = f.state.waxing ? u * 2 : 2 - u * 2;

    /**
     * **L'Éclipse écrase le cycle, elle ne l'accélère pas.** Tant qu'elle dure,
     * l'illumination est **maintenue à 0** : c'est une nouvelle lune forcée, pas
     * un tour de cadran plus rapide. La différence se voit — le disque ne
     * grossit pas derrière, il reste éteint le temps de la chasse.
     */
    if (f.ult.active > 0) f.state.ill = 0;

    this.applyPhase(f);

    /* ---------- ultime : aucune annonce, il est déjà en cours ------------ */
    const ult = el.ultimate;
    if (f.ult.active > 0) {
      f.ult.active -= dt;
      this.tickDrain(f, dt, game);
      if (f.ult.active <= 0) this.endEclipse(f);
    } else if (game.phase === 'fight') {
      f.ult.charge = Math.min(100, f.ult.charge + ult.chargeRate * dt);
      f.ult.ready = f.ult.charge >= 100;
      if (f.ult.ready) this.castEclipse(f, game);
    }

    if (game.phase !== 'fight') return;

    /* ---------- Marée : horloge fixe, force pilotée par la phase ---------- */
    f.ability.timer -= dt;
    if (f.ability.timer <= 0) {
      f.ability.timer = el.ability.cooldown;
      f.ability.uses += 1;
      this.castTide(f, game);
    }
  },

  /**
   * **Les trois grandeurs que la phase réécrit**, toutes par des clés
   * génériques — le moteur ne sait pas pourquoi elles bougent.
   *
   * `boost` est reposé **à chaque pas** plutôt qu'une fois pour toutes : c'est
   * un compteur qui se décompte, et le laisser expirer rendrait la vitesse
   * nominale au milieu d'une phase, sans que rien ne crie. On paie une
   * écriture par pas pour ne pas avoir à surveiller une échéance.
   */
  applyPhase(f) {
    const m = f.el.moon;
    const i = f.state.ill;
    f.sizeFactor = m.size.min + (m.size.max - m.size.min) * i;
    f.boostFactor = m.speed.max + (m.speed.min - m.speed.max) * i;
    f.boost = 1; // reposé chaque pas, voir ci-dessus
  },

  /* ------------------------------------------------------------------ */
  /*  Marée                                                              */
  /* ------------------------------------------------------------------ */

  /**
   * **Elle ne poursuit pas, elle attire** — et la force suit l'illumination,
   * donc elle est **nulle à la nouvelle lune**. Ce n'est pas un détail
   * d'équilibrage : c'est ce qui fait que la phase où LUNE ne blesse presque
   * pas est aussi celle où elle lâche prise. Les deux vont ensemble, sinon elle
   * serait oppressante en permanence.
   *
   * L'attraction passe par `push`, le même point d'entrée que tous les reculs
   * du dépôt : c'est une **impulsion**, donc l'adversaire garde son pilotage et
   * peut lutter. Une téléportation, ou une écriture directe de la position,
   * lui retirerait le contrôle — ce qui se lit comme un bug plutôt que comme
   * une force.
   */
  castTide(f, game) {
    const a = f.el.ability;
    const i = f.state.ill;

    /**
     * Le son **monte d'une octave** entre nouvelle et pleine lune : la même
     * recette, transposée par `opts.pitch`, qui se multiplie à celle de la
     * fiche au lieu de la remplacer. C'est la façon la moins chère de faire
     * entendre un état continu avec une recette d'événement — et le module ne
     * nomme toujours qu'un **créneau**, jamais une recette (invariant 12).
     */
    game.sfx.cast(f, 'ability', { pitch: 0.75 + 0.75 * i });
    game.fx.ring(f.x, f.y, f.radius, a.ring.to, a.ring.time,
      teinte(f.el.look.palette.body, 0.35 + 0.5 * i), a.ring.width, true);
    if (i > 0.6) game.shake(3 * i, 0.2);

    for (const g of this.enemiesInRange(f, a.radius, game)) {
      const dx = f.x - g.x;
      const dy = f.y - g.y;
      g.push(dx, dy, a.pull * i);

      /**
       * **Écrasé s'il est dans le puits** — au contact du corps, plus une marge.
       *
       * La marge n'est pas une commodité, c'est une **nécessité mesurée** :
       * écrite d'abord « à l'intérieur du corps » (`d <= f.radius + g.radius`),
       * la condition n'a été vraie **aucune fois sur 45 pulsations**. Deux corps
       * ne se chevauchent jamais dans ce moteur — `resolveBodies` les sépare à
       * chaque pas, et `resolveMelee` les décolle en plus à la touche. Un test
       * de chevauchement est donc toujours faux, et il ne crie pas : le pouvoir
       * était simplement mort, 0 PV sur 24 duels.
       *
       * Le test porte sur `f.radius`, donc sur la taille **courante** : la zone
       * qui blesse enfle et se rétracte avec l'astre sans qu'un chiffre de la
       * fiche ait à le dire. C'est tout l'intérêt de `sizeFactor` — la géométrie
       * de jeu suit le dessin toute seule.
       */
      if (Math.hypot(dx, dy) <= f.radius + g.radius + a.crushMargin) {
        game.damage(g, a.crush * i, f, { kind: 'tide', nx: -dx, ny: -dy, knockback: 0, sound: 'hit' });
      }
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Éclipse                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * **Le seul ultime du dépôt sans temps de chargement.**
   *
   * Les sept autres s'annoncent : une incantation, un éclat, deux secondes de
   * charge pour le Soleil. Celui-ci est **déjà en cours quand on le voit**, et
   * c'est la réponse au faisceau solaire : là où le Soleil met toute sa tension
   * dans une fenêtre d'esquive, LUNE n'en laisse aucune. Ce qui se paie sur la
   * fréquence — horloge de 9 s contre 7.
   */
  castEclipse(f, game) {
    f.ult.charge = 0;
    f.ult.ready = false;
    f.ult.active = f.el.ultimate.duration;
    f.state.drainTimer = 0;
    game.sfx.cast(f, 'ultimate');
    game.shake(7, 0.35);
  },

  /**
   * **Le drain remplace le contact, il ne s'y ajoute pas** — et il le faut : à
   * illumination 0, `melee.damage` ne rend plus que 1, donc sans lui l'Éclipse
   * serait une *baisse* de puissance. C'est le même renversement que le Soleil
   * a connu quand sa couronne a cessé de blesser : retirer la source principale
   * d'un combattant ne le diminue pas, ça le **retourne**, et il faut alors lui
   * en rendre une autre.
   *
   * Point de sortie unique par `endEclipse()`, comme les ruées du dépôt : c'est
   * là que tout est remis, ensemble.
   */
  tickDrain(f, dt, game) {
    const d = f.el.ultimate.drain;
    f.state.drainTimer -= dt;
    if (f.state.drainTimer > 0) return;

    for (const g of this.enemiesInRange(f, d.reach, game)) {
      /**
       * **On mesure ce qui a été pris, on ne le suppose pas.** `Match.damage`
       * ne rend rien — il arrondit, applique `damageScale()` et s'arrête net
       * sur un coup à zéro. Soigner de `d.damage` reviendrait donc à fabriquer
       * des PV sur un adversaire qui n'en avait plus assez à donner. La
       * différence des deux barres est la seule valeur vraie.
       */
      const avant = g.hp;
      game.damage(g, d.damage, f, {
        kind: 'eclipse', nx: g.x - f.x, ny: g.y - f.y, knockback: 0, sound: 'hit',
      });
      const pris = avant - g.hp;
      if (pris > 0) game.heal(f, pris * d.heal, f);
      f.state.drainTimer = d.interval;
      break; // une cible par tic : le drain colle à un adversaire, il ne moissonne pas
    }
  },

  /** Point de sortie unique : l'ultime rend la main, la phase reprend son cours
   *  au pas suivant (`update` recalcule `ill` avant tout le reste). */
  endEclipse(f) {
    f.ult.active = 0;
    f.state.drainTimer = 0;
  },

  /* ------------------------------------------------------------------ */

  /**
   * Ennemis à portée. Repris tel quel du Soleil et du Golem, pour les trois
   * mêmes raisons : camp adverse seulement (invariant 13), `onStage` et non
   * `alive` (invariant 8), et distance mesurée **de bord à bord** — ce qui, ici,
   * suit la taille courante de LUNE sans une ligne de plus.
   */
  enemiesInRange(f, radius, game) {
    const out = [];
    for (const g of game.fighters) {
      if (g === f || g.team === f.team || !g.onStage) continue;
      if (Math.hypot(g.x - f.x, g.y - f.y) <= radius + f.radius + g.radius) out.push(g);
    }
    return out;
  },

  /* ------------------------------------------------------------------ */
  /*  Rendu                                                              */
  /* ------------------------------------------------------------------ */

  /** Rien sous les combattants : la Marée se dit par son onde (`fx.ring`, qui
   *  a son propre banc) et par le corps qui enfle. Une nappe permanente au sol
   *  irait contre la règle de composition de `flair.js` — rien entre le
   *  spectateur et les combattants. */
  drawUnder() {},

  /**
   * **La face éclairée, découpée au terminateur.**
   *
   * Le corps déclaré par la fiche est la face **d'ombre** ; celle-ci se pose
   * par-dessus, limitée à la part éclairée du disque. Les deux sprites sont
   * dimensionnés sur le **même** diamètre (`radius × 2`, comme
   * `drawSpriteBody`), sans quoi le terminateur glisserait hors du disque.
   *
   * **La construction du croissant.** La zone éclairée est bornée par deux
   * arcs : le **limbe** (un demi-cercle, le bord de l'astre) et le
   * **terminateur** (une demi-ellipse dont le demi-axe horizontal vaut
   * `|1 − 2i| × R`). Le signe décide du sens de parcours, donc du côté vers
   * lequel l'ellipse se bombe :
   *  • `i = 1` → demi-axe `R`, bombée vers l'extérieur : le disque entier ;
   *  • `i = 0,5` → demi-axe nul, une droite : le demi-disque exact ;
   *  • `i = 0` → bombée vers l'intérieur jusqu'à annuler le limbe : rien.
   * C'est la construction classique des phases, et elle est **continue** — pas
   * de saut entre deux images, à aucune valeur.
   *
   * La lumière vient toujours de la **droite**, fixe. La faire suivre
   * l'adversaire aurait été plus joli et parfaitement faux : la lune serait
   * alors éclairée par sa cible.
   */
  drawOver(ctx, f, game) {
    if (!f.onStage) return;
    const i = f.state.ill ?? 0;
    if (i <= 0.002) return; // nouvelle lune : la face d'ombre suffit

    const R = f.radius;
    const k = 1 - 2 * i;

    ctx.save();
    ctx.beginPath();
    ctx.arc(f.x, f.y, R, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(f.x, f.y, Math.abs(k) * R, R, 0, Math.PI / 2, -Math.PI / 2, k > 0);
    ctx.closePath();
    ctx.clip();
    drawSpriteCentered(ctx, 'lunarLit', f.x, f.y, R * 2);
    ctx.restore();

    /**
     * **Le limbe**, un liseré clair posé sur l'arc éclairé seulement. Sans lui,
     * la face claire se dissout dans l'arène blanche — c'est le piège du corps
     * clair sur fond clair, mesuré ici à **1,54** de contraste médian contre
     * 6,5 pour la face d'ombre. Il ne fait pas tout, mais il rend le bord.
     */
    const pal = f.el.look.palette;
    ctx.save();
    ctx.globalAlpha = 0.55 * i;
    ctx.strokeStyle = teinte(pal.core, 1);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(f.x, f.y, R - 1, -Math.PI / 2, Math.PI / 2, false);
    ctx.stroke();
    ctx.restore();
  },

  /**
   * **Deux jauges en une, et c'est assumé.** La barre porte la charge
   * d'Éclipse ; pendant l'ultime elle se **vide** au lieu de rester pleine,
   * pour dire le temps qu'il reste — seule façon de lire, sans annonce, quand
   * la chasse s'arrête.
   */
  barValue(f) {
    if (f.ult.active > 0) return f.ult.active / f.el.ultimate.duration;
    return f.ult.charge / 100;
  },
};
