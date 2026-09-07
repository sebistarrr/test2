import { fiche, SPIN } from '../defaults.js';
import { formatSeconds } from '../format.js';

/* ==========================================================================
 *  GOLEM  (GOLEM) — le premier combattant **inventé** du roster
 *
 *  Les cinq autres sont relevés sur des vidéos « ballthingsim » : leurs
 *  valeurs portent `mesuré` et se convertissent d'un repère à l'autre. Celui-ci
 *  n'a pas de vidéo. **Aucune de ses valeurs ne peut donc porter `mesuré`** —
 *  tout est `calé` (posé puis vérifié au banc) ou `déduit` (calculé d'une
 *  autre). C'est le même régime que le Tir enraciné du Druide, seul autre
 *  morceau du dépôt conçu et non transcrit.
 *
 *  **Ce qu'il apporte au roster, et pourquoi il tient debout.** Les cinq
 *  existants se partagent deux axes : vite et fragile (Shinobi, Ronin), ou à
 *  distance et fuyant (Pistolero, Druide). Personne n'encaisse. Le Golem est
 *  l'inverse de tous : le plus lent, la portée d'arme la plus courte, mais
 *  **200 PV** au lieu de 100.
 *
 *  **Sa défense, c'est sa barre de vie, et rien d'autre — demandé.** Pas de
 *  réduction de dégâts, pas d'armure qui absorbe, pas d'invulnérabilité
 *  cyclique : il encaisse chaque coup en entier, comme les cinq autres, et il
 *  en encaisse simplement deux fois plus avant de tomber. C'est le réglage le
 *  plus lisible possible — un seul chiffre porte toute sa résistance, et le
 *  banc n'a qu'un levier à tourner.
 *
 *  **Le piège de conception à ne pas rouvrir.** Un corps à corps lent
 *  (370 px/s) face à un tireur rapide (655 px/s pour le Pistolero) ne touche
 *  *jamais* : il perdrait 10 duels sur 10 sans qu'aucun chiffre ne soit
 *  « faux ». D'où les deux pouvoirs ci-dessous, qui existent pour cette raison
 *  précise et pas pour le décor : l'Onde sismique lui donne une allonge qu'il
 *  n'a pas les jambes d'aller chercher, les Éclats de roche lui donnent de quoi
 *  répondre à qui reste au loin.
 * ========================================================================== */
export const GOLEM = fiche({
  id: 'golem',
  name: 'GOLEM',
  /** Même mot dans les deux langues — comme RONIN ou SHINOBI, et contrairement
   *  à DRUIDE/DRUID. Le champ reste obligatoire : `label()` lit `nameRef`. */
  nameRef: 'GOLEM',
  tagline: 'Colosse de pierre — le plus lent, le plus dur à abattre',
  taglineRef: 'Stone colossus — the slowest, and the hardest to bring down',
  icon: 'iconGolem',

  /**
   * **200 PV au lieu de 100 — demandé, et c'est toute sa défense.**
   *
   * Le moteur sait déjà donner des PV par combattant : `Fighter.maxHp` est un
   * paramètre du constructeur (le Clone d'ombre du Shinobi naît à 25), et tout
   * ce qui affiche une proportion de vie divise par **lui**, jamais par une
   * constante — plaque du HUD, cerclage rouge de danger. Il ne manquait que la
   * lecture de la fiche, faite en une ligne dans `Match` (`el.maxHp ??
   * MATCH.maxHp`), donc les cinq autres restent à 100 sans qu'on les touche.
   *
   * À ne pas confondre avec les PV **réglables** retirés du dépôt : ceux-là
   * étaient une option de partie offerte au joueur. Celui-ci est une valeur de
   * fiche, comme la vitesse ou la portée.
   */
  maxHp: 200,

  look: {
    /**
     * **Le plus gros du roster : rayon 50 contre 41 pour les cinq autres.**
     *
     * `look.radius` est déjà lu génériquement (`Fighter.radius`, et
     * `ui/select.js` cadre la carte dessus) : aucune ligne de moteur ne suppose
     * 41. Conséquence de jeu assumée — un corps plus large est **plus facile à
     * toucher**, ce qui est le juste prix des 200 PV.
     */
    radius: 50,
    /** Granit sombre. Il faut qu'il se distingue des cinq autres corps
     *  (`#3f97c9` bleu, `#e8621b` orange, `#7046ac` violet, `#141414` noir,
     *  `#1f7a3d` vert) *et* qu'il porte le chiffre de PV en crème : d'où un
     *  gris franchement plus sombre que la pierre de son arme, sinon le crème
     *  s'y noie — la leçon du cuivre clair du Lancier. */
    body: '#6e6558',
    bodyHit: '#e8e4dc', // le bloc blanchit au coup, comme le reste du roster
    outline: '#1c1712',
    hpColor: '#f5f2ea',
    aura: {
      color: 'rgba(168,156,136,0.45)',
      radius: 1.5,
      pulse: 1.6, // battement lent : c'est de la pierre, pas une flamme
      showWhen: 'ultimate-ready',
    },
    /**
     * **Gamme minérale, et volontairement sobre.** L'arène est blanche : les
     * gris doivent rester tenus pour exister (même leçon que la poudre du
     * Pistolero et que le style ninja du Shinobi). Pas de ruban électrique ni
     * de nuée — un bloc de pierre ne grésille pas, il **laisse tomber de la
     * poussière**.
     */
    flair: {
      /** Ruban de pointe d'arme court et épais : le poing trace une bande
       *  lourde, pas un fil. */
      ribbon: { color: '#8b8071', width: 22, alpha: 0.42 },
      /** Poussière qui **retombe** (`rise` positif, contrairement à tout le
       *  roster dont les motes montent) : c'est ce qui dit le poids. */
      motes: { rate: 8, size: 10, drift: 18, rise: 14, colors: ['#a89c88', '#7d7264', '#4e4639'] },
      impact: ['#c9bda8', '#ffffff', '#7d7264'],
      shape: 'spark',
      castFlash: 'rgba(120,110,95,0.5)',
    },
    trail: { color: 'rgba(110,101,88,0.28)', every: 0.05, life: 0.34 },
    accent: '#b9ae9c',
  },

  /**
   * **Le plus lent du roster, et de loin** : 370 px/s contre 655 (Pistolero),
   * 624 (Druide), 560 (Ronin), 500 (Shinobi) et 430 (Hoplite).
   *
   * `turnRate` bas aussi (1,3 contre 1,3–2,2 ailleurs) : il ne se contente pas
   * d'aller lentement, il **change de direction lentement**, ce qui est la
   * moitié de la sensation de masse. `seek` moyen — il vise sa cible, il ne
   * file pas tout droit comme l'Hoplite.
   *
   * Calé : c'est le premier chiffre à remonter si le banc montre qu'il ne
   * touche jamais un tireur.
   */
  movement: { speed: 370, turnRate: 1.3, seek: 0.34 },

  weapon: {
    name: 'Poing de pierre',
    nameRef: 'Stone Fist',
    /**
     * **La portée la plus courte du roster : 100 px**, contre 197,6 (Ronin),
     * 164 (Hoplite), 122 (Pistolero), 75 (Shinobi, mais en disque tout autour)
     * et 70 (Druide, qui tire).
     *
     * Déduite du sprite, comme partout : `handle.length` 36 + largeur dessinée
     * 64 (12 cellules × 5,333333) = 100. L'invariant tient au pixel près, donc
     * la pointe ne ment pas sur la hitbox.
     *
     * Son corps faisant 50 px de rayon, le poing ne dépasse que de **50 px** du
     * bord : il doit vraiment coller son adversaire pour frapper.
     */
    reach: 100,
    /**
     * **La rotation d'arme la plus lente du roster** : 0,45 × la vitesse
     * commune. Le poing tourne autour de lui comme une masse qu'on peine à
     * lancer — et c'est aussi un garde-fou, une arme qui balaie vite touche
     * souvent (piège documenté sur la lance du Lancier).
     */
    spin: SPIN * 0.45,
    spinDir: 1,
    /** `width: 0` : tout le bloc est dans le sprite, il n'y a pas de manche à
     *  tracer. `length` positif (36) — le poing part **devant** la bille,
     *  contrairement au talon négatif de la lance ou au sprite centré du
     *  Shinobi. */
    handle: { length: 36, width: 0, color: '#4e4639', dark: '#2d2721', outline: '#1c1712', gem: null },
    /** 12 cellules × 5,333333 = 64 px dessinés — voir `reach` ci-dessus. */
    head: { sprite: 'golemFist', scale: 5.333333 },
    /**
     * Seul le bloc frappe, pas le bras : la fraction 0,5 place le début du
     * tranchant à 50 px du centre, soit **exactement au bord de la bille**.
     * Rayon 24, le plus gros du roster après le disque du Shinobi : c'est un
     * bloc épais, pas une lame — mais il ne porte que sur 50 px de long.
     */
    hitbox: { from: 0.5, radius: 24 },
    melee: {
      /**
       * **Dégâts fixes, et fixes est le point.** Trois combattants du roster
       * montent en dégâts au fil du duel (Pistolero 3→8, Ronin 1,6→6, Hoplite
       * 8→16) ; celui-ci frappe pareil à la première et à la dernière seconde.
       * Un colosse ne « s'échauffe » pas, et ça lui donne le profil inverse de
       * l'Hoplite : redoutable tout de suite, jamais plus qu'au début.
       *
       * **C'est son levier d'équilibrage n° 1, et il est raide.** Balayé au
       * banc (10 seeds × les deux camps × 5 adversaires, soit 100 duels) :
       *
       * | dégâts | 14 | 9 | **8** | 7 |
       * | --- | --- | --- | --- | --- |
       * | victoires /100 | 89 | 72 | **54** | 43 |
       *
       * Un point de dégât vaut ~11 duels sur 100 : à 9 il écrase le roster, à 7
       * il ne tient plus. 8 est le seul point de la bande.
       */
      damage: 8,
      /**
       * Le verrou le plus long du roster après le Pistolero (3 s) : 1 s pour le
       * Ronin et le Shinobi, 1,1 s pour l'Hoplite, 1,7 s pour le Druide.
       *
       * **Essayé à 2,2 s, et écarté** : le total tombait bien (54 → 62 puis 61
       * selon la configuration), mais l'**écart s'élargissait** — le Ronin
       * remontait à 20/20 pendant que le Shinobi tombait à 7/20. Ralentir sa
       * frappe le pénalise surtout contre les rapides qu'il n'attrape que par
       * hasard, pas contre celui qui reste collé à lui. Lire le banc ligne par
       * ligne, pas seulement en total : c'est le piège documenté.
       */
      cooldown: 1.6,
      /**
       * Le plus fort du roster (460 pour l'Hoplite, 250 pour le Ronin) : un
       * bloc de pierre qui touche **envoie** sa cible.
       *
       * **Porteur, et vérifié comme tel** : à 300 le total passe de 54 à 42 et
       * le Shinobi de 7/20 à **2/20**. Le recul n'est pas une mise en scène
       * ici, c'est sa seule façon de décoller un corps à corps rapide qui,
       * sinon, le frappe sans jamais s'écarter.
       */
      knockback: 500,
      /**
       * **Volontairement bas (60), et c'est là qu'il pèse ses 200 PV.**
       * Partout ailleurs le recul propre est du même ordre que le recul infligé
       * (l'Hoplite est à 460/460, symétrique). Ici il encaisse un dixième de ce
       * qu'il donne : il ne recule pas quand il frappe. Le moteur n'a aucune
       * notion de masse — `Fighter.push` applique la même impulsion à tout le
       * monde et `movement.mass` n'est lu nulle part — donc c'est **par cette
       * asymétrie-là** que se dit le poids, sans toucher une ligne de physique.
       */
      selfRecoil: 60,
    },
  },

  /* ---------- POUVOIR — Onde sismique ---------- */
  /**
   * **Ce qui rend le personnage jouable, et non un décor lent.**
   *
   * Un corps à corps de 370 px/s avec 100 px de portée ne rattrape jamais un
   * tireur de 655. L'Onde sismique lui donne l'allonge que ses jambes ne lui
   * donnent pas : elle part **toute seule**, à intervalle fixe, et frappe tout
   * ennemi dans un rayon de 170 px — soit près de deux fois sa portée d'arme.
   *
   * Elle ne vise pas, elle ne se déclenche pas « au bon moment » : c'est une
   * horloge, comme le barillet du Pistolero. Le seul choix du personnage, c'est
   * d'être près de quelqu'un quand elle tombe.
   */
  ability: {
    id: 'shockwave',
    name: 'Onde sismique',
    nameRef: 'Shockwave',
    /** Calé : à 6 s, l'onde tombe 3 à 4 fois dans un duel de 20-25 s. */
    cooldown: 6,
    /** 170 px : 1,7 × sa portée d'arme, et un peu au-dessus du rayon du disque
     *  du Shinobi (75) ou du champ de givre du Pistolero (130). */
    radius: 170,
    /**
     * Calé bas devant les 8 du poing : l'onde est là pour **atteindre**, pas
     * pour tuer.
     *
     * **Et elle pèse beaucoup moins qu'il n'y paraît** : l'ablation par source
     * (`opts.kind` dans `game.damage`, 100 duels) lui attribue **9,7 %** des
     * dégâts du Golem, contre 44 % au poing, 28 % aux éclats et 18 % au Séisme.
     * La moitié de ses déclenchements tombe dans le vide — l'adversaire n'est
     * pas dans les 170 px quand l'horloge sonne.
     *
     * Elle a d'abord été soupçonnée d'être son levier n° 1 et descendue à 3 ;
     * la mesure a démenti (le total ne bougeait que de 6 points pour ~380 PV
     * sur 100 duels), et elle est remontée à 6. **Mesurer d'où vient le dégât
     * avant de balayer** : c'est exactement le piège documenté, repayé ici.
     */
    damage: 6,
    /** Elle repousse fort : c'est ce qui décolle un mêlée collé à lui, et ce
     *  qui l'empêche d'enchaîner onde + poing sur la même cible. */
    knockback: 340,
    /** Ralentissement court — sa seule prise sur un adversaire plus rapide. */
    slow: 0.35,
    slowDuration: 1.4,
    /** Anneau de poussière au sol, tracé par `Effects.ring`. */
    ring: { to: 170, time: 0.45, color: 'rgba(168,156,136,0.8)', width: 7 },
  },

  /* ---------- ULTIME — Séisme ---------- */
  /**
   * **La seule fenêtre où il cesse d'être lent.**
   *
   * Le Séisme fait deux choses en même temps, et la seconde compte autant que
   * la première : il frappe très fort sur un rayon qui couvre la moitié de
   * l'arène, **et** il lui donne un bonus de vitesse pendant quelques secondes.
   * Sans ce bonus, il replonge aussitôt dans son problème de fond — toucher
   * fort une fois ne sert à rien s'il ne peut pas suivre ensuite.
   */
  ultimate: {
    id: 'earthquake',
    name: 'Séisme',
    nameRef: 'EARTHQUAKE',
    barLabel: 'EARTHQUAKE',
    barLabelFr: 'SÉISME',
    barFill: '#7d7264',
    barText: '#f2ede2',
    /** Horloge de 12 s, la plus lente du roster (7 s pour le Pistolero, 9 pour
     *  le Ronin, 10 pour l'Hoplite) : elle ne tombe qu'une à deux fois par
     *  duel, donc chaque déclenchement doit peser. */
    chargeRate: 100 / 12,
    chargeOnHit: 6,
    /** Durée du bonus de vitesse **après** la secousse, pas de la secousse
     *  elle-même (qui est instantanée). */
    duration: 3,
    /** +35 % : il passe à 500 px/s, soit la vitesse de croisière d'un Shinobi.
     *  De quoi conclure, pas de quoi devenir mobile. */
    speedBonus: 1.35,
    impact: {
      /**
       * **La deuxième source de dégâts du personnage, et de loin la plus
       * discrète** : 18 % de son total à l'ablation, contre 9,7 % à l'Onde
       * sismique — l'inverse de ce que laisse croire la lecture de la fiche,
       * parce qu'un rayon de 260 px sur une arène de 640 ne rate jamais.
       *
       * Elle valait 18 à la conception ; ramenée à **10** après le banc. C'est
       * le seul chiffre du personnage qui frappe sans que l'adversaire puisse
       * rien y faire — ni s'écarter, ni interposer un mur — donc il ne doit pas
       * porter le duel à lui seul.
       */
      radius: 260, // presque la moitié des 640 px de côté de l'arène
      damage: 10, // plus qu'un coup de poing : c'est le pic de dégâts du jeu
      knockback: 600,
      ring: { to: 300, time: 0.5, color: 'rgba(140,128,110,0.85)', width: 9 },
      shake: 16, // la plus grosse secousse de caméra du roster
      dust: 40, // grains projetés par `Effects.burst` au moment de la secousse
      /** Pas de clé `flash` ici : le voile clair de l'incantation est déjà posé
       *  par `look.flair.castFlash`, que `match.js` déclenche tout seul à
       *  l'entrée en ultime. Une seconde clé ferait doublon — et une valeur de
       *  fiche que personne ne lit ne crie pas (invariant 9). */
    },
  },

  /* ---------- POUVOIR SPÉCIAL — Éclats de roche ---------- */
  /**
   * **La réponse à qui reste au loin, et le troisième créneau du dépôt**
   * (même patron que le Champ de givre, l'Aura de braise et le Dôme de drain :
   * horloge propre dans `f.state.spec`, sans aucun contact avec l'ultime).
   *
   * Contrairement aux trois pouvoirs greffés cités, celui-ci n'est **repris de
   * personne** — il est conçu pour ce combattant, comme le Clone d'ombre et le
   * Tir enraciné.
   *
   * Il jette trois éclats vers son adversaire. Volontairement peu de dégâts et
   * peu souvent : ce n'est pas un tireur, c'est un colosse qui **empêche qu'on
   * l'ignore**. Sans ça, la stratégie gagnante contre lui serait de reculer
   * indéfiniment, ce qui ne fait pas un duel.
   */
  special: {
    id: 'rockShards',
    name: 'Éclats de roche',
    nameRef: 'Rock Shards',
    barLabel: 'ROCK SHARDS',
    barLabelFr: 'ÉCLATS DE ROCHE',
    barFill: '#8b8071',
    barText: '#f2ede2',
    /** Calé sur la durée des duels du roster (20 à 30 s) : trois salves environ. */
    cooldown: 8,
    /** Première salve tôt, pour peser sur un duel qui peut se décider vite. */
    first: 3,
    /**
     * **Huit éclats, en anneau complet autour de lui — demandé.**
     *
     * Ils partaient en éventail vers l'adversaire (trois éclats, ouverture
     * 0,34 rad) ; ils partent maintenant **tout autour**, régulièrement
     * répartis sur le tour complet, comme les éclats de givre du Blizzard du
     * Pistolero.
     *
     * Le nombre monte de 3 à 8 pour cette raison précise : trois éclats répartis
     * sur 360° ne se lisent pas comme un anneau, ils se lisent comme trois
     * éclats qui partent n'importe où. Huit, c'est un éclat tous les 45°.
     *
     * Ce que ça change au jeu, et c'est assumé : il ne **vise** plus. Chaque
     * éclat porte moins souvent qu'un éclat pointé sur la cible, mais il en
     * part presque trois fois plus, et surtout il en part **derrière lui** —
     * ce qui, pour le combattant le plus lent du roster, est le seul moyen de
     * menacer qui le contourne. Il n'y a plus d'ouverture d'éventail à régler :
     * la géométrie est fixée par `count`.
     */
    count: 8,
    projectile: 'shard',
  },

  projectiles: {
    /**
     * Éclat de roche. Lent (380 px/s, contre 936 pour la balle du Pistolero) et
     * peu dégâteux : il est là pour porter, pas pour tuer. Il **ricoche une
     * fois**, ce qui lui donne une seconde chance dans une arène fermée.
     */
    shard: {
      label: 'Éclat de roche',
      labelRef: 'Rock Shard',
      sprite: 'golemShard',
      scale: 3.4, // carte de 7 px → éclat de ~24 px
      speed: 380,
      /** **4 → 3, demandé.** C'est la contrepartie du passage en anneau : huit
       *  éclats au lieu de trois avaient rendu 8 points de victoire au Golem
       *  (54/100 → 62/100 hors Mannequin), et ce point de dégât en reprend
       *  l'essentiel sans toucher à la géométrie du pouvoir. */
      damage: 3,
      radius: 12,
      life: 2.2,
      bounces: 1,
      knockback: 70,
      trail: { color: 'rgba(125,114,100,0.4)', every: 0.04, life: 0.3 },
    },
  },

  /** Aucune stat évolutive : ses dégâts sont fixes (voir `weapon.melee`). Les
   *  deux valeurs restent à zéro, et le HUD affiche ses deux horloges. */
  progression: { stack: 0, stack2: 0 },

  hud: {
    /**
     * **Ses deux horloges, parce que c'est tout son jeu.** Les autres affichent
     * une stat qui monte ; lui n'en a pas — ce qu'un spectateur a besoin de
     * savoir, c'est quand tombe la prochaine onde et la prochaine salve.
     */
    stats: [
      (f) => `Shockwave: ${formatSeconds(Math.max(0, f.ability.timer))}`,
      (f) => `Shards: ${formatSeconds(Math.max(0, f.state.specCd ?? 0))}`,
    ],
    statsFr: [
      (f) => `Onde : ${formatSeconds(Math.max(0, f.ability.timer))}`,
      (f) => `Éclats : ${formatSeconds(Math.max(0, f.state.specCd ?? 0))}`,
    ],
    color: '#b9ae9c', // pierre claire : la ligne est posée sur l'encre sombre
  },
});
