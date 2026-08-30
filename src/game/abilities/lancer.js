/**
 * Pouvoirs du LANCIER — relevés sur « Dragoon vs Outlaw » (576 × 1024, 30 fps).
 *
 *  • **La lance suit le cap.** C'est la mécanique centrale du personnage, et
 *    les deux portages précédents l'avaient manquée chacun à sa façon. La
 *    lance ne tourne pas librement et ne vise pas non plus : elle est
 *    **soudée à la vitesse**, et pointe là où le Lancier va.
 *
 *  • **Charge de lance** — il accélère en ligne droite, pointe en avant, en
 *    laissant une traînée d'images fantômes cramoisies.
 *
 *  • Furie du lancier — passif : la stat « Damage » du HUD monte à chaque
 *    touche portée. Rien à faire ici, c'est `weapon.melee.onHit.stackGain`
 *    qui l'applique.
 *
 *  • BOND (JUMP) — ultime. Le seul pouvoir du jeu qui **retire son porteur de
 *    l'arène** : le Lancier prend son élan (0,45 s), disparaît une seconde et
 *    demie, puis retombe sur l'adversaire. Pendant le vol, un disque gris suit
 *    la cible : il enfle au sommet du bond puis se resserre — c'est le
 *    resserrement qui annonce la chute.
 *
 * ## Le relevé de l'angle d'arme
 *
 * Mesuré sur 141 images réparties sur toute la vidéo, lance isolée par ACP de
 * son contour sombre — les fantômes translucides et la traînée cramoisie sont
 * écartés par seuil, ce qui est précisément ce qui manquait au premier relevé.
 *
 * | Ce à quoi on compare l'axe de la lance | Écart médian |
 * | --- | --- |
 * | **cap de déplacement** | **6,6°** (3,7° sur les images les mieux isolées) |
 * | cap vers l'adversaire | 37,9° |
 *
 * Et ça tient à tous les régimes de vitesse : 10,6° en marche lente, 6,1° en
 * croisière, 4,8° à l'accélération, 6,1° en pleine charge. 94 % des images
 * sont à moins de 15° du cap de déplacement.
 *
 * ### Ce que les deux relevés précédents avaient donné, et pourquoi
 *
 *  1. **327 °/s de rotation libre.** Le détecteur prenait le barycentre des
 *     pixels indigo les plus lointains ; pendant une charge, ce sont les
 *     **images fantômes**, pas la lance.
 *  2. **« Elle vise, à ±5° ».** Mesuré sur les seules plages où le Lancier
 *     fonçait *sur* l'adversaire — là où cap de déplacement et cap adverse se
 *     confondent. Un sous-ensemble biaisé : la conclusion était vraie sur
 *     l'échantillon et fausse en général.
 *
 * ### Ce que `weaponAngle = heading` rend, et qu'aucun des deux ne rendait
 *
 *  - l'angle **figé une demi-seconde** quand il va tout droit (2,13 → 2,67 s,
 *    moins de 10° d'écart) ;
 *  - un **saut de 85° en une image** au rebond mural (2,667 → 2,700 s) —
 *    `Fighter.step` réfléchit `heading` sur les murs, l'arme suit ;
 *  - une rotation lente le reste du temps : |ω| médian **33 °/s**, 88 % des
 *    images sous 100 °/s — c'est le pilotage (1,85 × 0,4 = 0,74 rad/s), pas
 *    une règle d'arme.
 *
 * Aucune de ces trois valeurs n'est réglée nulle part : elles tombent toutes
 * seules. C'est la marque d'un mécanisme juste plutôt que d'un chiffre calé.
 *
 * ## Ordre d'exécution
 *
 * `Match` appelle `Fighter.step()` **avant** `mod.update()`. Quand ce module
 * recopie `heading` dans `weaponAngle`, il lit donc le cap déjà intégré et
 * déjà réfléchi par les rebonds du pas courant : l'arme ne traîne jamais d'une
 * image derrière le corps.
 *
 * Déterminisme : tout ce qui est ici tourne dans le fil de simulation. La
 * décoration passe donc par `fx.ring`, qui **ne tire aucun aléa** — un
 * `fx.burst` de plus dans ce chemin décalerait `game.rng` et changerait des
 * vainqueurs. Les images fantômes, elles, sont dans `render/flair.js` : le
 * module ne fait qu'allumer le compteur `f.ghosting`.
 *
 * @module game/abilities/lancer
 */

import { TAU, clamp, wrapAngle } from '../../core/math.js';
import { ARENA } from '../../data/tuning.js';

/**
 * Phase du cycle de charge.
 *
 *  - `seek`    : deplacement normal, la lance suit le cap ;
 *  - `dash`    : le corps file en ligne droite, cap gele ;
 *  - `recover` : temps mort apres la charge ou la touche.
 *
 * Il n'y a plus de phase de visee ni de verrouillage : la lance suivant le cap
 * de deplacement, elle est **deja** dans l'axe de la charge. Viser n'aurait
 * aucun sens, et geler l'angle non plus — c'est le cap qui est gele pendant la
 * charge, et l'arme suit.
 *
 * @typedef {'seek'|'windup'|'brace'|'dash'|'recover'} LungePhase
 */

export const lancerAbilities = {
  id: 'lancer',

  /** @param {import('../fighter.js').Fighter} f */
  init(f) {
    /** @type {LungePhase} */
    f.state.phase = 'seek';
    f.state.phaseTimer = 0;
    /** Cap figé au départ de la charge : elle le suit sans le corriger. */
    f.state.dashAngle = f.heading;
    // 'ground' | 'windup' | 'flight' — le vol est le seul état où le Lancier
    // quitte le plateau (voir Fighter.offstage)
    f.state.jump = 'ground';
    f.state.jumpTimer = 0;
    /** Position du marqueur (suit l'adversaire) + son rayon courant. */
    f.state.mark = null;
  },

  /**
   * @param {import('../fighter.js').Fighter} f
   * @param {number} dt
   * @param {number} now
   * @param {import('../match.js').Match} game
   */
  update(f, dt, now, game) {
    const ult = f.el.ultimate;

    if (f.ult.active > 0) {
      f.ult.active -= dt;
      f.state.jumpTimer += dt;
      if (f.state.jump === 'windup' && f.state.jumpTimer >= ult.windup) this.takeOff(f, game);
      if (f.state.jump === 'flight') {
        this.trackMark(f, ult);
        if (f.ult.active <= 0) this.land(f, game);
      }
      return;
    }

    if (game.phase !== 'fight') return;

    this.tickLunge(f, dt, now, game);

    f.ult.charge = clamp(f.ult.charge + ult.chargeRate * dt, 0, 100);
    f.ult.ready = f.ult.charge >= 100;
    if (f.ult.ready) this.castJump(f, game);
  },

  /* ------------------------------------------------------------------ */
  /* Charge de lance                                                     */
  /* ------------------------------------------------------------------ */

  /** @param {import('../fighter.js').Fighter} f @param {LungePhase} phase */
  setPhase(f, phase) {
    f.state.phase = phase;
    f.state.phaseTimer = 0;
  },

  /**
   * Machine d'états de la charge, et **l'unique endroit qui écrit
   * `weaponAngle`** — d'un bout à l'autre du cycle, il vaut le cap.
   */
  tickLunge(f, dt, now, game) {
    const L = f.el.weapon.lunge;
    const target = f.opponent;
    f.state.phaseTimer += dt;

    /**
     * **La lance suit le cap.** Tout le personnage tient dans cette ligne :
     * pas de visée, pas de rotation propre, pas d'inertie d'arme. Le cap est
     * déjà intégré et déjà réfléchi par les rebonds — `Fighter.step` tourne
     * avant ce module — donc l'arme ne traîne pas d'une image derrière le
     * corps.
     *
     * Pendant la charge, `heading` est réécrit sur `dashAngle` juste en
     * dessous : l'angle d'arme est donc gelé lui aussi, sans qu'on ait à le
     * geler explicitement.
     */
    /**
     * **Écart volontaire, et le seul du personnage : le moulinet d'élan.**
     *
     * Pendant `windup`, et pendant lui seul, l'arme tourne sur elle-même au
     * lieu de suivre le cap. Ce n'est **pas** un relevé : la vidéo ne montre
     * aucune rotation propre (9,6° d'écart médian au cap sur 294 images), et
     * c'est une demande de mise en scène assumée comme telle. Tout le reste du
     * cycle garde `weaponAngle = heading`.
     *
     * Le garde-fou « la lance ne blesse qu'en charge » couvre le moulinet
     * gratuitement : il retient `meleeCd` dans toutes les phases sauf `dash`,
     * donc une lance de 164 px qui balaie un tour complet ne touche personne.
     * Sans lui, un moulinet à 14 rad/s serait l'arme la plus meurtrière du jeu.
     */
    if (f.state.phase === 'windup') {
      f.weaponAngle = wrapAngle(f.weaponAngle + L.windupSpin * dt);
    } else {
      f.weaponAngle = wrapAngle(f.heading);
    }

    /**
     * **Ancrage latéral — binaire, jamais interpolé.**
     *
     * Relevé sur la vidéo, décalage signé de l'axe de la lance au centre de la
     * bille (rayon 33 px vidéo) : **+20 px au repos**, **+38 px en croisière**,
     * et **+1 px en pleine charge**, c'est-à-dire pile au centre.
     *
     * Le premier relevé de ce décalage rendait 6 px partout, régime après
     * régime, et concluait donc « rien ne bouge ». Il mesurait le **centroïde**
     * du nuage sombre, et son masque attrapait le **contour de la bille** —
     * noir et centré, il tirait tout centroïde vers zéro quoi que fasse la
     * lance. La bonne quantité est la distance du centre à **l'axe ajusté**,
     * mesurée sur des pixels pris hors du disque.
     *
     * Le rapprochement était d'abord borné en vitesse (420 px/s). C'était une
     * erreur de lecture : une interpolation, si rapide soit-elle, fait *glisser*
     * l'arme pendant la charge — donc elle « court après » la bille au lieu de
     * former un bloc avec elle. Le décalage est maintenant **posé**, pas
     * interpolé : il vaut `lateral` ou zéro, et il bascule dans l'image même où
     * la phase change.
     */
    f.weaponLateral = f.state.phase === 'brace' || f.state.phase === 'dash' ? 0 : L.lateral;

    /**
     * **La lance ne blesse qu'en charge.** Hors charge elle est *portée*, pas
     * poussée : le verrou de touche est retenu à chaque pas, et seule la phase
     * `dash` le laisse courir.
     *
     * C'est la contrepartie obligée d'une arme de 164 px braquée dans l'axe du
     * déplacement — et le Lancier se déplace vers son adversaire. Sans ce
     * verrou il l'embroche en continu : au banc, **0,42 coup/s** contre 0,181
     * relevé, et 30 duels gagnés en 19 s. C'est exactement le piège du
     * Hors-la-loi, dont le canon asservi gagnait 27 duels sur 27 avant que sa
     * dispersion ne le ramène à sa précision relevée.
     */
    if (f.state.phase !== 'dash') f.meleeCd = Math.max(f.meleeCd, L.guard);

    switch (f.state.phase) {
      case 'seek': {
        if (!target || !target.onStage) return;
        const d = Math.hypot(target.x - f.x, target.y - f.y);
        // **fenetre d'engagement**, bornee des deux cotes : un lancier charge
        // de loin. Trop pres, il embroche a coup sur et la charge n'est plus
        // qu'une formalite ; trop loin, il n'arrive jamais au contact.
        if (d > L.range || d < L.minRange) return;
        // l'adversaire doit etre dans l'axe de la lance — c'est-a-dire du cap
        const bear = Math.atan2(target.y - f.y, target.x - f.x);
        if (Math.abs(wrapAngle(bear - f.heading)) <= L.cone) this.windup(f);
        break;
      }

      /**
       * **Moulinet d'élan.** Le corps continue sa route, seule l'arme tourne.
       * Il se termine par un verrouillage franc sur le cap — c'est `brace()`
       * qui le pose, et le contraste entre le tournoiement et l'arrêt net est
       * précisément ce qui fait lire l'intention.
       */
      case 'windup':
        if (f.state.phaseTimer >= L.windup) this.brace(f);
        break;

      /**
       * **Le temps d'arrêt avant la charge.** Le corps est cloué sur place et
       * le cap gelé ; c'est pendant ce battement que la lance se recentre.
       *
       * Relevé : la vitesse tombe à **163 px/s une image avant le
       * déclenchement**, contre ~1 700 juste avant et ~3 100 juste après. Le
       * personnage se plante, puis part. Sur deux déclenchements seulement —
       * l'échantillon est mince, et c'est la description de la vidéo qui le
       * corrobore, pas la statistique seule.
       */
      case 'brace':
        f.heading = f.state.dashAngle;
        if (f.state.phaseTimer >= L.brace) this.dash(f, game);
        break;

      case 'dash':
        // ligne droite : le cap est reecrit a chaque pas sur l'angle de depart,
        // sinon le pilotage automatique de `Fighter.step` incurverait la charge
        f.heading = f.state.dashAngle;
        if (f.state.phaseTimer >= L.dash) this.endDash(f);
        break;

      case 'recover':
        if (f.state.phaseTimer >= L.recover) this.setPhase(f, 'seek');
        break;

      default:
        this.setPhase(f, 'seek');
    }
  },

  /**
   * Entrée en arrêt. Le cap de la charge est figé **ici**, pas au départ du
   * dash : c'est ce qui fait que l'arrêt vise déjà juste, et que la charge
   * part exactement là où la lance pointait quand elle s'est immobilisée.
   */
  /** Entrée en moulinet d'élan. Le corps n'est pas touché : seule l'arme
   *  tourne, et le déplacement continue normalement. */
  windup(f) {
    this.setPhase(f, 'windup');
  },

  /**
   * Entrée en arrêt. Le cap de la charge est figé **ici** — donc à la fin du
   * moulinet — et l'arme est **remise d'autorité dans l'axe** : c'est le
   * verrouillage franc qui clôt le tournoiement. Sans cette ligne, l'arme
   * reprendrait le cap en douceur à l'image suivante et le moulinet finirait
   * en glissade au lieu d'un claquement.
   */
  brace(f) {
    const L = f.el.weapon.lunge;
    f.state.dashAngle = f.heading;
    f.weaponAngle = wrapAngle(f.heading);
    this.setPhase(f, 'brace');
    // L'arrêt passe par le levier de vitesse **du moteur** (`boost` /
    // `boostFactor`) plutôt que par un champ à lui : `endDash` les remet déjà
    // tous les deux, donc l'arrêt hérite gratuitement du point de sortie
    // unique, au lieu d'ouvrir une seconde chose à oublier.
    f.boost = L.brace;
    f.boostFactor = 0;
  },

  /** Départ de la charge : vitesse, cap et traînée sont allumés ensemble. */
  dash(f, game) {
    const L = f.el.weapon.lunge;
    this.setPhase(f, 'dash');
    /**
     * **La charge est strictement linéaire.** Le cap est réécrit à chaque pas
     * et la vitesse est un facteur constant, donc la trajectoire est déjà une
     * droite parcourue à vitesse fixe — mais un recul encaissé juste avant
     * survivrait dans `impulse`, que `Fighter.step` ajoute à la vitesse, et
     * incurverait la charge sans que rien dans ce module ne l'explique. On
     * repart donc d'une impulsion nulle.
     */
    f.impulseX = 0;
    f.impulseY = 0;
    f.boost = L.dash;
    f.boostFactor = L.speed;
    // le compteur couvre exactement la charge ; passé zéro, `flair` vide la
    // file par le plus ancien, donc la traînée se résorbe derrière lui au lieu
    // de disparaître d'un coup
    f.ghosting = L.dash;
    game.fx.ring(f.x, f.y, f.radius * 0.9, f.radius * 2.6, 0.22, L.dashRing, 5, true);
  },

  /**
   * **Seul point de sortie de la charge.** Vitesse, facteur de vitesse et
   * traînée sont remis ensemble, et la phase passe à `recover`. Dispersées,
   * ces remises à zéro laissaient un bonus de vitesse accroché au Lancier
   * quand la charge s'interrompait sur une touche — c'est le piège du Bretteur,
   * qui a déjà coûté une fin de duel en pleine ruée.
   */
  endDash(f) {
    f.boost = 0;
    f.boostFactor = 1;
    f.ghosting = 0;
    this.setPhase(f, 'recover');
  },

  /**
   * La pointe a touché. Le Lancier est **repoussé en arrière** et repart au
   * début du cycle : c'est ce que montre la vidéo, où chaque touche de lance
   * est suivie d'un recul net avant la charge suivante.
   *
   * `Match.resolveMelee` a déjà appliqué `melee.selfRecoil` et posé le verrou
   * de touche ; on n'ajoute ici que le surplus propre à la charge, et
   * seulement si la touche est bien arrivée **pendant** une charge.
   */
  onLand(f, target, hit, game) {
    if (f.state.phase !== 'dash') return;
    const L = f.el.weapon.lunge;
    this.endDash(f);
    f.push(-hit.nx, -hit.ny, L.recoil);
    game.fx.ring(hit.x, hit.y, 6, L.hitRing.to, L.hitRing.time, L.hitRing.color, 6, true);
  },

  /* ------------------------------------------------------------------ */
  /* Bond                                                                */
  /* ------------------------------------------------------------------ */

  /** Élan : le Lancier reste au sol, mais la jauge se vide déjà (mesuré). */
  castJump(f, game) {
    const ult = f.el.ultimate;
    // une charge en cours ne survit pas au Bond : sans ça, le bonus de vitesse
    // et la traînée repartiraient avec lui à l'atterrissage
    if (f.state.phase === 'dash') this.endDash(f);
    f.ult.active = ult.duration;
    f.ult.ready = false;
    f.ult.charge = 0;
    f.state.jump = 'windup';
    f.state.jumpTimer = 0;
    game.fx.burst(f.x, f.y, 16, {
      color: [f.el.look.accent, f.el.look.body, '#ffffff'],
      speed: 240,
      size: 5,
      life: 0.4,
    });
  },

  /** Décollage : le Lancier quitte le plateau pour toute la durée du vol. */
  takeOff(f, game) {
    const ult = f.el.ultimate;
    f.state.jump = 'flight';
    f.state.jumpTimer = 0;
    // marge de sécurité : c'est `land()` qui remet le Lancier sur le plateau,
    // le décompte de `offstage` ne doit surtout pas l'y ramener avant
    f.offstage = ult.flight + 0.1;
    // il ne peut plus être touché : il n'est plus là
    f.invulnerable = Math.max(f.invulnerable, ult.flight + 0.1);
    f.impulseX = 0;
    f.impulseY = 0;
    const target = f.opponent;
    f.state.mark = { x: target?.x ?? f.x, y: target?.y ?? f.y, r: f.radius };
    // **onde de choc au sol, au point de décollage** : le Lancier disparaît
    // d'une image à l'autre, et sans elle rien ne dit d'où il est parti.
    const lift = ult.liftoff;
    game.fx.ring(f.x, f.y, f.radius * 0.8, lift.to, lift.time, lift.color, lift.width, true);
    // gerbe de poussière au point de décollage
    game.fx.burst(f.x, f.y, 20, {
      color: [f.el.look.body, '#cfc2f0', '#ffffff'],
      speed: 380,
      size: 6,
      life: 0.5,
    });
    game.shake(5, 0.25);
  },

  /**
   * Le marqueur colle à l'adversaire et respire : il enfle sur la première
   * moitié du vol, se resserre sur la seconde jusqu'au rayon d'atterrissage.
   */
  trackMark(f, ult) {
    const target = f.opponent;
    const mark = f.state.mark;
    if (!mark) return;
    if (target && target.alive) {
      mark.x = target.x;
      mark.y = target.y;
    }
    const t = clamp(f.state.jumpTimer / ult.flight, 0, 1);
    const m = ult.marker;
    // montée : rayon → grow ; descente : grow → land
    const k = t < 0.5 ? t / 0.5 : 1;
    const up = f.radius + (m.grow * f.radius - f.radius) * k;
    mark.r = t < 0.5 ? up : up + (m.land * f.radius - up) * ((t - 0.5) / 0.5);
  },

  /**
   * Chute : le Lancier retombe **collé à l'adversaire** et frappe autour de
   * lui. Le décalage est pris le long du cap adversaire → marqueur pour que
   * les deux billes se touchent sans s'interpénétrer : posé pile sur la cible,
   * il serait aussitôt séparé par `resolveBodies`, ce qui rendait la chute
   * illisible d'une image à l'autre.
   */
  land(f, game) {
    const ult = f.el.ultimate;
    const imp = ult.impact;
    const inner = ARENA.inner;
    const mark = f.state.mark;
    const target = f.opponent;

    f.state.jump = 'ground';
    f.ult.active = 0;
    f.offstage = 0;
    f.state.mark = null;
    // il retombe lance en avant : la visée reprend au pas suivant
    this.setPhase(f, 'recover');

    if (mark) {
      let x = mark.x;
      let y = mark.y;
      if (target && target.alive) {
        // décalé le long de l'axe qui le sépare encore du marqueur, ou par
        // défaut vers le haut : la chute vient du ciel
        const dx = mark.x - f.x;
        const dy = mark.y - f.y;
        const len = Math.hypot(dx, dy) || 1;
        const ox = len > 1 ? dx / len : 0;
        const oy = len > 1 ? dy / len : -1;
        const gap = (f.radius + target.radius) * ult.landOffset;
        x = mark.x - ox * gap;
        y = mark.y - oy * gap;
        f.weaponAngle = Math.atan2(target.y - y, target.x - x);
      }
      f.x = clamp(x, inner.left + f.radius, inner.right - f.radius);
      f.y = clamp(y, inner.top + f.radius, inner.bottom - f.radius);
    }

    if (target && target.alive) {
      const dx = target.x - f.x;
      const dy = target.y - f.y;
      const d = Math.hypot(dx, dy);
      if (d <= imp.radius + target.radius) {
        const len = d || 1;
        // mêmes dégâts que la lance à cet instant, et la stat monte comme
        // après une touche normale (mesuré : 100 → 90 PV puis « Damage: 12 »)
        const melee = f.el.weapon.melee;
        const dmg = typeof melee.damage === 'function' ? melee.damage(f) : melee.damage;
        game.damage(target, dmg, f, {
          kind: 'melee',
          x: target.x,
          y: target.y,
          nx: dx / len,
          ny: dy / len,
          knockback: imp.knockback,
        });
        // même comptabilité que `Match.resolveMelee` : la chute est une touche,
        // donc elle fait monter la pile **et** pose le verrou. Sans le verrou,
        // la lance pouvait toucher une seconde fois dans la foulée : pendant le
        // vol, `Fighter.step` sort avant de décompter `meleeCd`, qui reste donc
        // figé à la valeur qu'il avait au décollage — zéro si le Bond a été
        // lancé en pleine charge, la seule phase où le garde-fou ne s'applique
        // pas.
        f.meleeCd = melee.cooldown;
        f.stacks += melee.onHit?.stackGain ?? 0;
        if (melee.onHit?.stackMax) f.stacks = Math.min(f.stacks, melee.onHit.stackMax);
      }
    }

    // mise en scène de l'impact : onde grise, éclat blanc, éclats indigo
    game.fx.ring(f.x, f.y, f.radius, imp.ring.to, imp.ring.time, imp.ring.color, imp.ring.width, true);
    game.fx.ring(f.x, f.y, f.radius * 0.5, imp.radius, 0.22, 'rgba(212,150,168,0.75)', 14, true);
    game.fx.burst(f.x, f.y, imp.sparks, {
      color: [f.el.look.body, f.el.look.accent, '#cfc2f0', '#ffffff'],
      speed: 520,
      size: 7,
      life: 0.7,
    });
    game.flair.flash = 0.18;
    game.flair.flashMax = 0.18;
    game.flair.flashColor = imp.flash;
    game.shake(imp.shake, 0.4);
  },

  /* ---------- rendu ---------- */

  /** Marqueur au sol : sous les combattants, jamais devant. */
  drawUnder(ctx, f) {
    const mark = f.state.mark;
    if (!mark || f.state.jump !== 'flight') return;
    const m = f.el.ultimate.marker;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mark.x, mark.y, mark.r, 0, TAU);
    ctx.fillStyle = m.fill;
    ctx.fill();
    ctx.lineWidth = m.edgeWidth;
    ctx.strokeStyle = m.edge;
    ctx.stroke();
    ctx.restore();
  },

  drawOver() {},

  /**
   * Jauge : elle se vide d'un coup à l'élan et reste à zéro tout le bond,
   * exactement comme sur la vidéo (vidée à 10,60 s, immobile jusqu'à 13,03 s).
   */
  barValue(f) {
    if (f.ult.active > 0) return 0;
    return f.ult.charge / 100;
  },
};
