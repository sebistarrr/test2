import { fiche } from '../defaults.js';
import { formatSeconds } from '../format.js';

/* ==========================================================================
 *  NEON SHADOW — le Maître des Illusions  (inventé)
 *
 *  Troisième combattant conçu et non relevé, après le Golem et le Mannequin :
 *  **aucune de ses valeurs ne porte `mesuré`**, tout y est `calé` ou `déduit`.
 *
 *  **Ce qu'il apporte, et ce qu'il coûte au moteur.** Le roster savait faire
 *  une arme braquée (Pistolero, Hoplite, Druide), une arme centrée sur la bille
 *  (Shinobi) et une arme lourde (Golem). Il ne savait pas faire **deux armes à
 *  la fois**, dont une qui n'est pas accrochée au corps. C'est toute la
 *  nouveauté ici, et elle tient dans le module plutôt que dans le moteur :
 *
 *   • **les deux dagues sont mobiles et reliées l'une à l'autre** — demandé.
 *     Aucune n'est accrochée au corps, donc aucune ne peut être l'arme au sens
 *     de `physics.js`, qui ne connaît qu'un segment rigide partant du pivot ;
 *   • le bloc `weapon` est donc **neutralisé** comme celui du Mannequin
 *     (portée 0, hitbox 0, dégâts 0), et `weapon.blades` porte tout. Les deux
 *     lames sont deux pendules que le module intègre lui-même et dont il
 *     applique les dégâts par `game.damage`, comme l'Onde sismique du Golem
 *     applique les siens. **Aucune ligne de `physics.js` n'a bougé** — le
 *     moteur ne connaît toujours qu'une hitbox d'arme par combattant, il n'en
 *     a simplement aucune ici (invariant 12).
 *
 *  **Ce que le dépôt savait déjà faire et qu'il fallait juste brancher** :
 *  `Fighter.ghosting` (les images fantômes de la charge de l'Hoplite) devient
 *  permanent chez lui, `Fighter.offstage` (le Bond de l'Hoplite) porte le Void
 *  Step, et `applySlow` porte les chaînes du Void Rift.
 * ========================================================================== */
export const NEON = fiche({
  id: 'neon',
  name: 'NEON SHADOW',
  nameRef: 'NEON SHADOW',
  tagline: 'Illusionniste — il glisse, se dédouble en fantômes, et frappe de dos',
  taglineRef: 'Illusionist — glides, splinters into ghosts, and strikes from behind',
  icon: 'iconNeon',

  look: {
    /**
     * **Obsidienne, presque noire.** Le Shinobi est déjà en `#141414` : celui-ci
     * s'en distingue par le **bleu-violet** de sa base (`#0b0714`) et surtout
     * par son contour, qui est la vraie signature du personnage.
     */
    body: '#0b0714',
    /**
     * **Il éclate en pixels d'ombre quand il encaisse — demandé.** Le corps
     * touché ne blanchit pas comme le reste du roster : il vire au **rose
     * néon**, la teinte de sa propre gerbe. C'est la moitié visible de
     * l'effet ; l'autre moitié est la gerbe de fragments que le module tire
     * quand il détecte une perte de PV (voir `abilities/neon.js`).
     */
    bodyHit: '#f0abfc',
    /** Violet néon **épais** (7 contre 5 partout ailleurs) : sur un corps
     *  presque noir posé sur une arène blanche, c'est le contour qui dessine
     *  le personnage, pas le remplissage. */
    outline: '#a855f7',
    outlineWidth: 7,
    /** Rose très clair : le crème du roster serait terne sur ce noir, et le
     *  violet du contour s'y confondrait. */
    hpColor: '#f5d0fe',
    /**
     * **Halo permanent** (`showWhen` sans condition, comme le Mannequin) : la
     * « fine aura sombre » demandée. Elle ne s'allume pas sur un pouvoir prêt,
     * elle appartient au personnage — c'est son bord flou.
     */
    aura: { color: 'rgba(168,85,247,0.4)', radius: 1.45, pulse: 2.6, showWhen: 'always' },
    flair: {
      /** Ruban de pointe de dague, rose néon et vif. */
      ribbon: { color: '#f0abfc', width: 12, alpha: 0.6 },
      /** Fuseau derrière la bille : c'est lui qui donne le **glissement**, large
       *  et violet là où le ruban est fin et rose. */
      smear: { color: '#7e22ce', width: 26, alpha: 0.42 },
      /**
       * **Les images fantômes, et elles sont permanentes — c'est la mécanique
       * du personnage.** Le mécanisme existait déjà : `Fighter.ghosting` est un
       * compteur générique que l'Hoplite allume le temps d'une charge, et
       * `render/flair.js` sème alors des silhouettes qui s'effacent. Ici le
       * module le **réarme à chaque pas**, donc la traînée ne s'arrête jamais :
       * il ne court pas, il glisse et se laisse derrière lui.
       *
       * `every` court (0,028 s) pour une file dense, `lance` fin (10) parce
       * qu'une dague n'est pas une lance de 164 px.
       */
      /** `alpha` descendu de 0,40 à 0,26 après capture : à 0,40 la file de
       *  silhouettes formait une **bande pleine** qui mangeait la moitié de
       *  l'arène et masquait le combattant qu'elle est censée suivre. Une
       *  traînée doit dire le mouvement, pas remplir le cadre. */
      /** `lance` descendu de 10 à 5 : à 10, les traits d'arme des silhouettes
       *  successives se rejoignaient et la traînée se lisait comme une
       *  **échelle** posée derrière lui. À 5, on lit des dagues répétées. */
      ghost: { color: '#c084fc', every: 0.028, alpha: 0.26, lance: 5 },
      motes: { rate: 12, size: 8, drift: 30, rise: -12, colors: ['#f0abfc', '#a855f7', '#7e22ce'] },
      impact: ['#f0abfc', '#ffffff', '#a855f7'],
      shape: 'streak',
      castFlash: 'rgba(168,85,247,0.55)',
      /**
       * **La chaîne spectrale**, tracée par le module **entre les deux lames** —
       * pas entre une lame et le corps : c'est ce que montre la maquette, et
       * c'est ce qui garde la bille nue au milieu.
       *
       * Elle est ici et non dans `weapon` parce qu'elle ne porte **que** des
       * couleurs : la géométrie et les dégâts des lames sont dans
       * `weapon.blades`, qui décide du duel.
       */
      chain: {
        color: '#a855f7',
        core: '#f5d0fe',
        width: 5,
        coreWidth: 1.6,
        alpha: 0.75,
        /** Maillons semés le long du lien : dessinés par un hachage pur du
         *  rang, donc **aucun tirage** — la chaîne ne peut pas décaler le duel. */
        links: 7,
        linkSize: 4.5,
      },
    },
    trail: { color: 'rgba(168,85,247,0.3)', every: 0.028, life: 0.34 },
    accent: '#d946ef',
  },

  /**
   * **Bruitages** (recettes dans `data/sound.js`). Le plus haut avec le Shinobi,
   * mais pour l'inverse : lui n'est pas léger, il est *irréel*. Ses deux sons
   * propres sont des balayages — `warp` monte quand il disparaît, `eclipse`
   * descend quand la lumière s'en va — là où tout le reste du roster frappe.
   */
  sound: {
    pitch: 1.15,
    shot: null, // ses lames ne sont pas des projectiles : le module les intègre
    hit: 'blade',
    impact: 'impact',
    bounce: 'thud',
    ability: 'warp',
    special: 'zap',
    /** L'unique usage de `eclipse`, et la seule recette descendante du banc. */
    ultimate: 'eclipse',
  },

  /**
   * **Il glisse.** Rapide et très manœuvrant (2,4 rad/s, le plus haut du
   * roster), mais `seek` modéré : il ne fonce pas droit sur sa cible, il
   * l'aborde en courbe — ce qui sert la lecture des images fantômes, qui ne
   * disent rien sur une ligne droite.
   */
  movement: { speed: 545, turnRate: 2.4, seek: 0.38 },

  weapon: {
    name: 'Dagues du vide enchaînées',
    nameRef: 'Chained Void Blades',
    /**
     * **115 px, et le pommeau est collé au bord de la bille — demandé.**
     * `handle.length` vaut donc 41, le rayon exact du corps, et la largeur
     * dessinée fait le reste : 41 + 74 = 115. C'est une portée courte, entre
     * celle du Golem (100) et celle du Pistolero (122) : une dague ne prête
     * pas de l'allonge, elle en demande.
     */
    /**
     * **Zéro : il n'a plus d'arme *pour le moteur* — demandé.**
     *
     * Les deux dagues sont mobiles et reliées entre elles ; aucune des deux
     * n'est accrochée au corps, donc aucune ne peut être l'arme au sens de
     * `physics.js`, qui ne connaît qu'un segment tranchant rigide partant du
     * pivot. Le bloc `weapon` est donc **neutralisé** exactement comme celui du
     * Mannequin — portée 0, hitbox de rayon 0, dégâts 0 — et c'est
     * `weapon.blades` (plus bas) qui porte tout, appliqué par le module.
     *
     * Ce n'est pas un contournement : c'est la même sortie que le dépôt a déjà
     * prise deux fois (l'Onde sismique du Golem, la première dague libre). Un
     * module a le droit d'appeler `game.damage` ; le moteur n'a pas à
     * apprendre une géométrie par personnage (invariant 12).
     */
    reach: 0,
    spin: 0,
    spinDir: 1,
    handle: { length: 0, width: 0, color: '#4c1d95', dark: '#2a1740', outline: '#0a0410', gem: null },
    /**
     * **Vrai PNG** (`assets/sprites/neon-dagger.png`) : la dague gauche de la
     * maquette, détourée du fond blanc par remplissage depuis les bords (un
     * seuil simple aurait percé ses hautes lumières néon) puis **tournée de
     * 145,2°** pour amener la pointe sur l'axe des armes. Cet angle n'est pas
     * choisi à l'œil : il vient d'une **ACP** des pixels sombres de la lame,
     * l'extrémité fine désignant la pointe.
     *
     * La clé reste renseignée bien que le moteur ne dessine plus rien (le module
     * pose `f.customWeapon`) : c'est **le module** qui blitte ce sprite, deux
     * fois, et `ui/select.js` en a besoin pour la carte.
     */
    head: { sprite: 'neonDagger', scale: 7.314506 },
    hitbox: { from: 0, to: 0, radius: 0 },
    melee: { damage: 0, cooldown: 1, knockback: 0, selfRecoil: 0 },
    /**
     * **LES DEUX LAMES — tout le personnage, et rien de tout ça n'est dans le
     * moteur.**
     *
     * Chacune est un **pendule amorti** que le module intègre : rappel vers un
     * point de repos, amortissement, et une laisse qui borne la distance au
     * corps. Les trois comportements demandés en sortent sans être écrits — en
     * ligne droite elles traînent derrière, en virage sec elles se déportent, au
     * repos elles flottent à `length`.
     *
     * Les deux points de repos sont symétriques de part et d'autre du dos du
     * cap (`spread`), sinon les deux lames se superposeraient : elles
     * partageraient la même équation, donc la même trajectoire, et on ne verrait
     * qu'une dague en double.
     */
    blades: {
      /** Distance de flottement au corps. */
      length: 96,
      /**
       * Écart angulaire des deux points de repos, de part et d'autre du dos du
       * cap. À 0 les deux lames se confondent ; à π/2 elles encadrent le
       * porteur.
       *
       * **0,85 → 1,45 après mesure.** À 0,85 les deux lames se reposaient
       * franchement *derrière* lui : quand il fonçait sur sa cible, elles
       * étaient du mauvais côté et ne touchaient presque jamais (31/140). À
       * 1,45 (~83°) elles le **flanquent**, donc elles balaient ce qu'il
       * aborde. Le gain seul est modeste (31 → 36) mais la géométrie devait
       * être juste avant de toucher aux dégâts, sans quoi on aurait compensé un
       * défaut de placement par de la puissance.
       */
      spread: 1.45,
      /** Rappel du ressort (1/s²) et amortissement (1/s). Le second décide si la
       *  lame oscille (bas) ou suit sagement (haut). */
      pull: 26,
      damp: 2.6,
      /** Rayon dangereux autour de chaque lame : elles virevoltent, on ne les
       *  vise pas. */
      radius: 26,
      /**
       * **Les lames montent en puissance au fil du duel — demandé.**
       *
       * Elles frappaient à 8, plat. Le banc avait montré qu'il **perdait 20 duels
       * sur 20 contre le Golem tout en lui infligeant plus qu'à n'importe qui
       * d'autre** (124 PV contre 200 à franchir, pendant que le Golem lui en
       * plaçait 100, soit sa barre entière). Il n'était pas dominé : il lui
       * manquait du temps. Une production **croissante** est la seule réponse
       * qui n'exige de toucher ni sa vitesse, ni les autres fiches.
       *
       * Les dégâts effectifs sont donc `Math.round(f.stacks)`, et `f.stacks`
       * monte de `gain` à chaque touche de lame jusqu'à `cap` — le même
       * mécanisme que la pile du Pistolero (3 → 8) et de l'Hoplite (8 → 16),
       * affiché au HUD comme chez eux.
       *
       * `damage` reste ici comme **valeur de repli** si jamais la pile n'était
       * pas initialisée : sa valeur exacte n'est plus lue en duel.
       */
      damage: 8,
      /** Départ de la pile — voir `progression.stack`, qui porte la vraie
       *  valeur initiale lue par le moteur. */
      gain: 0.35,
      cap: 13,
      /** Verrou **par lame**, chacune le sien : sans lui, une lame qui frôle
       *  l'adversaire toucherait à chaque pas. */
      cooldown: 0.85,
      knockback: 120,
    },
  },

  /* ---------- POUVOIR — Void Step ---------- */
  /**
   * **Le dash invisible.** Il disparaît, et réapparaît **dans le dos** de
   * l'adversaire — dans le dos au sens propre : le point d'arrivée se calcule
   * depuis le *cap* de la cible, pas depuis la position du Neon.
   *
   * L'absence passe par `Fighter.offstage`, le compteur générique que l'Hoplite
   * utilise pour son Bond : pendant ce temps il n'est ni dessiné, ni touchable,
   * ni touchant (invariant 8). Les deux règles du dépôt s'appliquent telles
   * quelles — les minuteurs sont **figés** pendant l'absence, et `offstage` ne
   * doit pas expirer avant le module (marge de 0,1 s).
   */
  ability: {
    id: 'voidStep',
    name: 'Pas du vide',
    nameRef: 'Void Step',
    /**
     * Calé : trois à quatre pas dans un duel de 25 s.
     *
     * **Testé à 10 s, et écarté : c'est un levier plat.** On pouvait croire que
     * ce pas était ce qui lui donne les tireurs (il annule le kiting) ; le banc
     * dit non — 105 → 102 sur 140, et la forme empire (le Golem tombe à 0/20).
     * Ce qui lui donne les tireurs, c'est l'éclipse, qui est autant une esquive
     * qu'une attaque. Voir `ultimate.chargeRate`.
     */
    cooldown: 6.5,
    /** Durée de l'absence. Courte — c'est un clignement, pas un Bond de
     *  l'Hoplite (1,5 s). */
    duration: 0.35,
    /** Distance derrière la cible où il se repose. Un peu plus que la somme
     *  des rayons, pour ne pas naître dans son corps. */
    offset: 96,
    /**
     * **La ruée de lames à l'atterrissage — l'axe qui rend ce pouvoir visible.**
     *
     * Mesure d'abord, parce qu'elle contredit l'intuition : dans les 1,2 s qui
     * suivent un pas, ses lames produisent **5,00 PV/s contre 2,43 le reste du
     * temps** — la fenêtre double déjà sa production. Le pouvoir n'était donc
     * pas cassé. Il était **trop court pour peser** : 1,2 s × 2,74 pas = 3,3 s
     * sur un duel de 26,7 s, soit ~8,5 PV de surplus sur ~100 infligés. C'est
     * pourquoi en changer la *fréquence* ne bougeait rien (6,5 → 10 s : 3 duels
     * sur 140) — le levier n'est pas la fréquence, c'est l'**ampleur**.
     *
     * À l'atterrissage, les deux lames sont donc **projetées vers la cible** à
     * cette vitesse, verrous remis à zéro. Le pas cesse d'être une
     * relocalisation pour devenir une frappe.
     */
    lunge: 900,
    /** Fumée noire au départ **et** à l'arrivée : sans marque au point de
     *  départ, il disparaît d'une image à l'autre sans que rien ne le dise —
     *  c'est la leçon de l'onde de décollage du Bond. */
    smoke: { count: 22, speed: 240, size: 7, life: 0.5, colors: ['#0b0714', '#4c1d95', '#a855f7'] },
  },

  /* ---------- ULTIME — TOTAL ECLIPSE ---------- */
  /**
   * **L'arène s'éteint.** Le Canvas passe au noir et il ne reste que les
   * contours néon des combattants, pendant qu'il frappe depuis des angles
   * tirés au hasard. Fin sur un flash blanc.
   *
   * Le noir est peint dans `drawOver`, la seule passe qui vienne **après** les
   * combattants tout en restant dans le cadre de l'arène. Une conséquence
   * assumée : `match.js` **repasse les chiffres de PV après `drawOver`** (règle
   * posée pour que jamais un pouvoir ne masque une barre de vie), donc ils
   * restent lisibles pendant l'éclipse. On ne se bat pas contre cette règle,
   * elle a été écrite exprès.
   */
  ultimate: {
    id: 'totalEclipse',
    name: 'Éclipse totale',
    nameRef: 'TOTAL ECLIPSE',
    barLabel: 'TOTAL ECLIPSE',
    barLabelFr: 'ÉCLIPSE TOTALE',
    barFill: '#a855f7',
    barText: '#f5d0fe',
    /**
     * **LE levier du personnage, et de très loin.** L'éclipse n'est pas qu'une
     * source de dégâts : pendant deux secondes il **se téléporte neuf fois**,
     * donc il devient introuvable pour un tireur. Espacer l'ultime retire les
     * deux à la fois.
     *
     * Balayage de l'horloge, 140 duels à chaque point :
     *
     * | horloge | 11 s | 14 s | **15 s** | 17 s |
     * | --- | --- | --- | --- | --- |
     * | victoires /140 | 98 | 89 | **84** | 56 |
     *
     * La falaise entre 15 et 17 s est brutale : à 17 s il ne gagne plus que 3
     * duels sur 20 contre le Druide, contre 20 sur 20 à 15 s. 15 s est le
     * dernier point de la bande — s'en éloigner d'une seconde le fait basculer
     * d'un extrême à l'autre.
     */
    chargeRate: 100 / 15,
    chargeOnHit: 4,
    duration: 2, // demandé : deux secondes de frappes
    /** Le noir de l'éclipse, et le liseré qui reste. */
    eclipse: {
      veil: '#000000',
      /** Le contour néon des **deux** combattants — pas seulement le sien :
       *  c'est ce qui rend l'effet lisible plutôt qu'aveuglant. Chacun garde sa
       *  propre teinte (`look.outline`), celle-ci n'est que l'épaisseur et le
       *  halo commun. */
      rimWidth: 5,
      rimGlow: 16,
      /** Le flash blanc final, en fraction de la durée. */
      flash: 0.18,
    },
    strike: {
      /** Une frappe toutes les 0,22 s pendant 2 s, soit neuf passages. */
      interval: 0.22,
      /** **Inesquivable, donc bas.** Il se téléporte sur la cible : ces dégâts
       *  ne se jouent ni sur la distance ni sur la visée. Ils valaient 4 à la
       *  conception (36 % de sa production à l'ablation) ; ramenés à 2, ils en
       *  pèsent encore 28 %. Neuf frappes à 2 font 18 dégâts par éclipse. */
      damage: 2,
      /** Distance à laquelle il se repose autour de la cible avant de frapper. */
      offset: 78,
      knockback: 120,
    },
  },

  /* ---------- POUVOIR SPÉCIAL — Void Rift ---------- */
  /**
   * **Le piège lumineux.** Il pose un orbe au sol ; il y reste jusqu'à ce qu'un
   * adversaire le touche. Déclenché, l'orbe fige la cible dans des chaînes de
   * fumée et éclate en flash violet.
   *
   * « Figé » est ici un ralentissement de **0,75**, et pas un arrêt : le moteur
   * **borne les ralentissements à 0,75** dans `Fighter.slowFactor` (`1 −
   * clamp(worst, 0, 0.75)`), et cette borne est une protection commune à tout
   * le roster. On prend donc le maximum qu'elle autorise plutôt que de la
   * lever pour un seul combattant.
   */
  special: {
    id: 'voidRift',
    name: 'Faille du vide',
    nameRef: 'Void Rift',
    barLabel: 'VOID RIFT',
    barLabelFr: 'FAILLE DU VIDE',
    barFill: '#7e22ce',
    barText: '#f5d0fe',
    cooldown: 9,
    first: 4,
    /** Rayon de déclenchement, bord à bord. */
    radius: 46,
    damage: 5,
    /**
     * **0,5 → 1 s.** Le piège se déclenchait bien (1,55 fois par duel, soit
     * 83 % des orbes posés — les adversaires le poursuivent, donc ils passent
     * là où il était) mais ne rapportait que 7,6 % de ses dégâts, et son
     * maintien était trop court pour préparer quoi que ce soit.
     *
     * À 1 s, il cesse d'être une source de dégâts pour devenir une **mise en
     * place** : la faille cloue, le Pas du vide amène les lames, les lames
     * frappent une cible immobilisée. C'est le premier enchaînement du
     * personnage — avant, ses trois pouvoirs étaient trois horloges qui ne se
     * parlaient pas.
     */
    hold: 1,
    slow: 0.75,
    /** L'orbe au sol, tant qu'il n'a pas servi. */
    orb: { radius: 18, fill: 'rgba(126,34,206,0.55)', edge: '#f0abfc', pulse: 3.2 },
    /** Le flash violet du déclenchement. */
    burst: { to: 190, time: 0.35, color: 'rgba(240,171,252,0.85)', width: 6 },
    /** Les chaînes de fumée qui tiennent la cible pendant `hold`. */
    chains: { count: 6, length: 54, width: 4, color: '#0b0714', tip: '#a855f7' },
  },

  /** Aucun projectile : tout passe par les deux lames et les pouvoirs. */
  projectiles: {},

  /** **La pile est sa stat de HUD**, comme chez le Pistolero et l'Hoplite :
   *  elle démarre à 6 et monte à chaque touche de lame jusqu'à 13. */
  progression: { stack: 6, stack2: 0 },

  hud: {
    /** Ses deux horloges — il n'a aucune stat qui monte, comme le Golem. */
    stats: [
      (f) => `Blade Damage: ${Math.round(f.stacks)}`,
      (f) => (f.state.riftLive ? 'Rift: armed' : `Rift: ${formatSeconds(Math.max(0, f.state.specCd ?? 0))}`),
    ],
    statsFr: [
      (f) => `Dégâts de lame : ${Math.round(f.stacks)}`,
      (f) => (f.state.riftLive ? 'Faille : armée' : `Faille : ${formatSeconds(Math.max(0, f.state.specCd ?? 0))}`),
    ],
    color: '#d8b4fe',
  },
});
