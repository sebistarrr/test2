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
 *   • la **dague principale** est une arme ordinaire, braquée sur la cible —
 *     `weapon.spin = 0`, le module recopie l'angle, exactement comme le
 *     revolver du Pistolero ;
 *   • la **dague libre** n'existe pas pour le moteur. C'est un point que le
 *     module intègre lui-même (ressort + amortissement + contrainte de
 *     longueur) et dont il applique les dégâts par `game.damage`, comme l'Onde
 *     sismique du Golem applique les siens. Aucune ligne de `physics.js` n'a
 *     bougé : le moteur ne connaît toujours qu'une hitbox d'arme par
 *     combattant (invariant 12).
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
       * **La chaîne spectrale**, tracée par le module entre le pommeau de la
       * dague principale et la dague libre. Elle est ici et non dans `weapon`
       * parce qu'elle ne porte **que** des couleurs : la géométrie et les
       * dégâts de la dague libre sont dans `weapon.chain`, qui décide du duel.
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
    reach: 115,
    /**
     * **Zéro : la dague est braquée sur la cible**, comme le revolver du
     * Pistolero et le sceptre du Druide. C'est `abilities/neon.js` qui écrit
     * `weaponAngle` à chaque image — « elle tourne autour de la bille comme
     * l'aiguille d'une boussole ».
     *
     * Troisième arme braquée du roster, donc **troisième fois qu'il lui faut
     * son propre garde-fou** : une arme toujours alignée touche en permanence.
     * Ici c'est le verrou de mêlée (1,15 s) et une hitbox courte qui le
     * portent — voir `melee.cooldown`.
     */
    spin: 0,
    spinDir: 1,
    handle: { length: 41, width: 0, color: '#4c1d95', dark: '#2a1740', outline: '#0a0410', gem: null },
    /**
     * **Vrai PNG** (`assets/sprites/neon-dagger.png`) : la dague gauche de la
     * maquette, détourée du fond blanc par remplissage depuis les bords (un
     * seuil simple aurait percé ses hautes lumières néon) puis **tournée de
     * 145,2°** pour amener la pointe sur l'axe des armes. Cet angle n'est pas
     * choisi à l'œil : il vient d'une **ACP** des pixels sombres de la lame,
     * l'extrémité fine désignant la pointe — mesurer une orientation par un
     * barycentre est un piège que le dépôt a déjà payé.
     *
     * `scale` se déduit du rapport d'aspect du PNG (779 × 616 = 1,2646) et non
     * de la largeur de la carte texte : `74 × 616 / (8 × 779) = 7,314506`, ce
     * qui rend 74 px de large, donc une pointe à 41 + 74 = 115.
     */
    head: { sprite: 'neonDagger', scale: 7.314506 },
    /** Seule la lame coupe, pas la garde ni le pommeau : elle commence à 45 %
     *  de la portée (52 px du centre, soit 11 px au-delà du bord de la bille). */
    hitbox: { from: 0.45, radius: 12 },
    melee: {
      /**
       * **Levier n° 2, et raide.** Une dague frappe vite et peu fort — mais
       * braquée, elle ne rate jamais. Balayé au banc (10 seeds × les deux
       * camps × 6 adversaires, 140 duels) : **6 → 124/140, 4 → 105/140**, soit
       * ~9 duels par point de dégât.
       */
      damage: 4,
      /**
       * **Le garde-fou de l'arme braquée.** Le canon du Pistolero, toujours
       * aligné, gagnait 27 duels sur 27 avant qu'on ne lui donne sa dispersion.
       * Une dague braquée a le même défaut, sans projectile où loger une
       * dispersion : c'est donc le verrou qui le porte, et il est long pour une
       * dague (1,15 s, contre 1 s au Ronin et au Shinobi).
       */
      cooldown: 1.15,
      knockback: 230,
      selfRecoil: 90,
    },
    /**
     * **LA DAGUE LIBRE — la moitié du personnage, et elle n'existe pas pour le
     * moteur.**
     *
     * `physics.js` ne connaît qu'une hitbox d'arme par combattant. Plutôt que
     * de lui en apprendre une seconde (ce qui aurait touché tout le roster pour
     * un seul combattant), le module intègre ce point lui-même et applique ses
     * dégâts par `game.damage` — exactement comme l'Onde sismique du Golem
     * applique les siens sans passer par `resolveMelee`.
     *
     * La physique est un **pendule amorti**, et c'est ce qui produit les deux
     * comportements demandés sans qu'aucun ne soit codé en dur : la lame est
     * tirée vers le pommeau de la dague principale (`pull`), freinée (`damp`)
     * et ne peut jamais s'éloigner de plus de `length`. Quand la bille file
     * droit, la lame **traîne derrière** ; quand la bille tourne sec, elle
     * **part sur le côté**. Aucun tirage : c'est de l'intégration pure.
     */
    chain: {
      length: 100, // demandé : elle flotte à ~100 px
      /** Rappel du ressort, en 1/s². Plus haut = la lame colle au porteur et
       *  le pendule disparaît ; plus bas = elle reste au bout de sa laisse. */
      pull: 26,
      /** Amortissement, en 1/s. C'est lui qui décide si la lame oscille
       *  (bas) ou suit sagement (haut). */
      damp: 2.6,
      /** Rayon de la zone dangereuse autour de la lame libre. Large : c'est une
       *  lame qui virevolte, pas une pointe qu'on vise. */
      radius: 26,
      /** Calé bas devant les 4 de la dague principale : la lame libre est une
       *  **zone de danger passive**, pas la source de dégâts du personnage.
       *  3 → 2 au banc a coûté 7 duels sur 140, pour 20 % de ses dégâts —
       *  levier moyen, gardé bas pour ce qu'il dit du personnage plus que pour
       *  ce qu'il rapporte. */
      damage: 2,
      /** Son propre verrou, indépendant de `melee.cooldown` : sans lui, une
       *  lame qui frôle l'adversaire toucherait à chaque pas. */
      cooldown: 0.9,
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
    /** Demandé : 0,5 s de chaînes. Voir la note sur la borne du moteur. */
    hold: 0.5,
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

  progression: { stack: 0, stack2: 0 },

  hud: {
    /** Ses deux horloges — il n'a aucune stat qui monte, comme le Golem. */
    stats: [
      (f) => `Void Step: ${formatSeconds(Math.max(0, f.ability.timer))}`,
      (f) => (f.state.riftLive ? 'Rift: armed' : `Rift: ${formatSeconds(Math.max(0, f.state.specCd ?? 0))}`),
    ],
    statsFr: [
      (f) => `Pas du vide : ${formatSeconds(Math.max(0, f.ability.timer))}`,
      (f) => (f.state.riftLive ? 'Faille : armée' : `Faille : ${formatSeconds(Math.max(0, f.state.specCd ?? 0))}`),
    ],
    color: '#d8b4fe',
  },
});
