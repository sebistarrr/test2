import { fiche } from '../defaults.js';

/* ==========================================================================
 *  MANNEQUIN  (DUMMY) — la cible d'entraînement
 *
 *  **Il n'est pas là pour gagner : il est là pour qu'on regarde l'autre.**
 *  Demandé comme tel — sans arme, sans dégâts, blanc, 200 PV — pour servir de
 *  partenaire de démonstration : on le met en face d'un combattant et on voit
 *  enfin *ce que ce combattant fait*, sans qu'un duel ne se joue par-dessus.
 *
 *  C'est le seul combattant du dépôt dont l'utilité n'est pas d'être joué mais
 *  d'être **frappé**, et ça change tout dans sa fiche : chaque valeur est
 *  choisie pour rendre l'adversaire lisible, pas pour le mettre en danger.
 *
 *  **Deux cas limites qu'aucune des six autres fiches n'exerçait**, et qui
 *  méritent d'être connus avant d'y toucher :
 *
 *   1. **Aucune arme.** Pas de `head.sprite`, portée 0, hitbox de rayon 0.
 *      `ui/select.js` prévoyait déjà le repli d'icône (`head.sprite ??
 *      projectile ?? icon`) mais il n'avait jamais servi ; `fighter.js`, lui, a
 *      demandé un garde d'une ligne dans `drawWeapon` — il lisait
 *      `PIXEL_MAPS[undefined].h` sans se poser de question.
 *   2. **Aucun dégât.** Un duel Mannequin contre Mannequin **ne se termine
 *      jamais** : le moteur n'a pas de limite de temps, une partie ne s'arrête
 *      que par un mort. C'est visible dans `tools/matrix-reference.txt`, où sa
 *      ligne miroir est la seule à porter `timeout`.
 * ========================================================================== */
export const DUMMY = fiche({
  id: 'dummy',
  /** Archétype traduit, comme DRUIDE/DRUID : « mannequin » est le mot français
   *  du sac de frappe d'entraînement, « dummy » son équivalent d'usage. */
  name: 'MANNEQUIN',
  nameRef: 'DUMMY',
  tagline: 'Cible d’entraînement — ne frappe pas, encaisse, et laisse voir',
  taglineRef: 'Training target — never strikes, soaks it up, and lets you watch',
  icon: 'iconDummy',

  /** 200 PV, demandé : le double de la norme, pour que la démonstration dure
   *  assez longtemps qu'on voie le cycle complet des pouvoirs d'en face — un
   *  ultime met 7 à 12 s à se charger selon le combattant. Même mécanisme que
   *  le Golem : `Match` lit `el.maxHp ?? MATCH.maxHp`. */
  maxHp: 200,

  look: {
    /**
     * **Blanc pur, demandé — et l'arène est blanche elle aussi.**
     *
     * C'est frontalement le piège que le dépôt documente depuis les jaunes
     * pâles du Lancier : *ce qui est clair n'existe pas sur fond clair*. Trois
     * conséquences, toutes assumées ici plutôt que subies :
     *
     *  • le **contour** passe à 6 px de noir franc (5 partout ailleurs) : sur
     *    un corps blanc, c'est la seule chose qui dessine la silhouette ;
     *  • le **chiffre de PV** passe au noir. Le crème `#f5f2ea` du reste du
     *    roster disparaîtrait purement et simplement — c'est la correction déjà
     *    faite en sens inverse sur le cuivre clair du Lancier ;
     *  • l'**aura est permanente** (`showWhen` sans condition, voir plus bas),
     *    ce que ne fait aucun autre combattant.
     */
    body: '#ffffff',
    /**
     * **Le seul éclat de couleur du personnage, et il est là pour ça.** Partout
     * ailleurs le corps touché **blanchit** (`#e4e4e6`) — sur un corps déjà
     * blanc, ce serait un coup invisible, exactement l'inverse de ce qu'on
     * demande à une cible d'entraînement. Il **rougit** donc, et c'est ce
     * flash-là qui rend chaque touche adverse lisible à l'image près.
     */
    bodyHit: '#ff8a8a',
    outline: '#1a1a1a',
    /** 6 au lieu des 5 universels : voir `body`. C'est le trait qui le sépare
     *  du fond, il ne peut pas être au minimum. */
    outlineWidth: 6,
    hpColor: '#1a1a1a',
    /**
     * **Halo permanent** — `showWhen` ne vaut ni `ability-ready` ni
     * `ultimate-ready`, et `Fighter.auraVisible()` retombe alors sur `true`.
     * C'est volontaire et c'est le seul cas du roster : le Mannequin n'a ni
     * pouvoir ni ultime, donc aucune condition n'aurait jamais été vraie, et un
     * disque blanc sur fond blanc a besoin de ce cerne gris pour se détacher.
     */
    aura: { color: 'rgba(120,120,130,0.35)', radius: 1.35, pulse: 0.9, showWhen: 'always' },
    /**
     * **Presque rien, et c'est le sujet.** Pas de ruban (il n'a pas de pointe
     * d'arme à faire traîner), pas de fuseau, pas de motes : tout ce qu'il
     * ajouterait à l'écran serait autant de pris sur ce qu'on vient regarder,
     * c'est-à-dire les effets de l'autre.
     *
     * Ne restent que les couleurs d'impact — **les siennes servent quand il est
     * touché** — et elles sont sombres pour trancher sur son corps blanc.
     */
    flair: {
      impact: ['#6b6b76', '#1a1a1a', '#ff8a8a'],
      shape: 'dot',
    },
    /** Sillage gris très tenu : il dit où il est passé sans rien masquer. */
    trail: { color: 'rgba(150,150,160,0.22)', every: 0.06, life: 0.26 },
    accent: '#8a8a94',
  },

  /**
   * **Il se déplace, mais il ne poursuit personne.** `seek: 0` — comme
   * l'Hoplite, il file droit et ne change de cap qu'aux rebonds. C'est le
   * réglage qui sert la démonstration : une cible **mobile** montre les
   * mécaniques de poursuite (orbes guidées du Druide, charge de l'Hoplite,
   * visée du Pistolero) qu'une cible plantée ne montrerait pas, mais une cible
   * qui *chargerait* l'adversaire fausserait la lecture en allant au-devant des
   * coups.
   *
   * Vitesse moyenne du roster (430, comme l'Hoplite) : ni fuyant, ni facile.
   */
  movement: { speed: 430, turnRate: 1.6, seek: 0 },

  weapon: {
    /** Il n'en a pas. Le nom sert la carte de sélection, qui affiche toujours
     *  une ligne « Arme » — mieux vaut y lire « aucune » qu'un vide. */
    name: 'Aucune',
    nameRef: 'None',
    /**
     * **Portée 0 et hitbox de rayon 0 : il ne peut pas toucher.**
     *
     * Ce n'est pas une valeur basse, c'est une géométrie vide, et c'est plus
     * sûr que des dégâts à zéro. `weaponHit` compare la distance de la cible au
     * **segment tranchant** ; avec `from`/`to` à 0, ce segment se réduit au
     * pivot, et avec `radius: 0` la condition devient « le centre adverse est à
     * moins de son propre rayon du centre du Mannequin » — or `resolveBodies`
     * maintient les deux corps séparés d'au moins la somme des rayons. La
     * condition est donc **structurellement impossible**, et pas seulement
     * inoffensive.
     *
     * `melee.damage: 0` en plus, par ceinture et bretelles : si un jour un
     * mécanisme faisait quand même passer un contact, il ne retirerait rien —
     * `Match.damage` sort avant tout effet quand le montant arrondi vaut zéro.
     */
    reach: 0,
    spin: 0,
    spinDir: 1,
    handle: { length: 0, width: 0, color: '#8a8a94', dark: '#5a5a64', outline: '#1a1a1a', gem: null },
    /**
     * **Pas de sprite — le seul du roster.** `drawWeapon` retombe sur son
     * garde (rien à dessiner) et `ui/select.js` sur sa chaîne de repli, qui
     * prend l'icône. Celle-ci est plus petite que la bille et centrée sur le
     * pivot, donc entièrement cachée derrière elle : la carte montre un disque
     * blanc nu, ce qui est exactement le personnage.
     */
    head: { sprite: null, scale: 1 },
    hitbox: { from: 0, to: 0, radius: 0 },
    melee: {
      damage: 0,
      /** Jamais consommé (aucune touche possible), mais lu à la construction du
       *  `Fighter` : une valeur finie éviterait un `Infinity` qui se propage. */
      cooldown: 1,
      knockback: 0,
      selfRecoil: 0,
    },
  },

  /**
   * **Aucun pouvoir.** Même patron que la Charge de lance de l'Hoplite et la
   * Sève montante du Druide : le moteur lit `ability.cooldown` à la
   * construction, donc la clé doit exister ; `Infinity` n'est jamais décompté
   * et `ui/select.js` l'affiche comme un passif (`Number.isFinite`).
   */
  ability: {
    id: 'none',
    name: 'Immobilité',
    nameRef: 'Stillness',
    cooldown: Infinity,
    cooldownStep: 0,
    cooldownFloor: Infinity,
  },

  /**
   * **Aucun ultime non plus, mais le bloc reste obligatoire** : `render/hud.js`
   * lit `ultimate.barFill`, `barText` et `barLabel` sans les tester, pour tout
   * combattant du tableau. La jauge existe donc, et **elle ne se remplit
   * jamais** — `chargeRate: 0`, et le module rend 0 en permanence.
   *
   * C'est le choix honnête : masquer la rangée aurait demandé une exception
   * dans le HUD, là où une jauge vide **dit** ce qu'est le personnage.
   */
  ultimate: {
    id: 'none',
    name: 'Aucun',
    nameRef: 'None',
    barLabel: 'NO ULTIMATE',
    barLabelFr: 'AUCUN ULTIME',
    barFill: '#8a8a94',
    barText: '#f4f4f6',
    chargeRate: 0,
    chargeOnHit: 0,
    duration: 0,
  },

  /** Ni projectile, ni troisième créneau : `ui/select.js` sait déjà afficher
   *  « aucun » pour l'un comme pour l'autre. */
  projectiles: {},

  progression: { stack: 0, stack2: 0 },

  hud: {
    /**
     * **La ligne de stat sert la démonstration, pas le Mannequin** : elle
     * n'affiche rien sur lui (il n'a aucune stat qui bouge) mais **les dégâts
     * qu'il a encaissés**, donc ce que l'adversaire a réellement produit depuis
     * le début du duel. C'est la mesure qu'on vient chercher en le mettant sur
     * le terrain.
     */
    stats: [(f) => `Damage taken: ${Math.max(0, f.maxHp - Math.ceil(f.hp))}`],
    statsFr: [(f) => `Dégâts subis : ${Math.max(0, f.maxHp - Math.ceil(f.hp))}`],
    color: '#d4d4dc',
  },
});
