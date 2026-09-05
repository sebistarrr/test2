import { fiche, SPIN } from '../defaults.js';
import { formatSeconds } from '../format.js';

/* ==========================================================================
 *  VENT  (WIND)
 *  Relevé : vidéo « WIND vs PLANT ».
 * ========================================================================== */
/**
 * **Réactivé et reskin, à la demande — le Vent devient le Shinobi.** Même
 * patron que le Bretteur (`fighters/bladesman.js`) : `id: 'wind'` ne bouge
 * pas (URL d'archive, module de pouvoirs, clés de sprite — rien de tout ça
 * n'est montré au joueur), seuls le nom, l'arme et les projectiles changent.
 * Stats, tornade et ultime restent le relevé vidéo d'origine, inchangé.
 */
export const WIND = fiche({
  id: 'wind',
  name: 'SHINOBI',
  nameRef: 'SHINOBI',
  tagline: 'Harcèlement — le plus rapide, tornades et shurikens',
  taglineRef: 'Harassment — the fastest of all, tornadoes and shurikens',
  icon: 'iconTornado',

  look: {
    /** **Écart assumé au relevé, demandé.** Corps crème-sable (or clair,
     *  220,196,98-ish) passé au noir — la couleur d'un shinobi. Le contour
     *  mesuré (`#0a0a0a`) collait déjà au noir, et le chiffre de PV aussi
     *  (`hpColor`) : les deux auraient disparu **noir sur noir** une fois le
     *  corps assombri (exactement le piège déjà payé sur le Bretteur — voir
     *  sa fiche). Contour repassé à une couleur franche (contraste net sur le
     *  noir du corps *et* sur le blanc de l'arène) — c'était l'orange de
     *  braise du shuriken à l'époque, c'est du gris depuis le style ninja,
     *  voir `outline` juste en dessous. Chiffre de PV au crème mesuré ailleurs
     *  dans le roster (`#f5f2ea`) plutôt qu'assombri une deuxième fois. */
    body: '#141414',
    bodyHit: '#ffffff',
    /** **Contour gris, demandé** — c'était le dernier élément chaud du
     *  combattant (orange de braise, hérité du temps où le shuriken était en
     *  flammes). Il garde son rôle : détacher la bille — le « trou » — des
     *  lames grises qui rayonnent autour. D'où un gris **plus clair que le
     *  corps** (`#141414`) et **plus sombre que le blanc de l'arène**, tenu
     *  un cran sous le point le plus clair du shuriken (168/255) pour que
     *  l'anneau reste lisible par-dessus les lames. */
    outline: '#8f8f99',
    hpColor: '#f5f2ea',
    /**
     * **Style sombre ninja — demandé, purement visuel.**
     *
     * Tout ce qui restait khaki-crème (`#d6cdaa`-ish, la palette du Vent
     * d'origine) passe au gris-noir. Une première passe n'avait touché que
     * `aura` et `trail`, en laissant le bloc `flair` — or c'est **lui** qui
     * porte ce qu'on voit vraiment traîner derrière le combattant : le ruban
     * de 75 px, les motes, la gerbe d'impact. D'où cette seconde passe, plus
     * complète.
     *
     * Deux contraintes tiennent la gamme :
     *  • **l'arène est blanche**, donc les gris doivent rester *tenus* — un
     *    gris pâle n'y existe pas (même leçon que la poudre du Hors-la-loi) ;
     *  • le corps est déjà `#141414`, donc les effets doivent s'en décoller
     *    un peu : ils sont en gris ardoise (`#33333c` → `#71717a`), pas en
     *    noir pur.
     */
    aura: {
      color: 'rgba(38,38,44,0.5)',
      radius: 1.6,
      pulse: 2.6,
      showWhen: 'ability-ready',
    },
    flair: {
      ribbon: { color: '#33333c', width: 20, alpha: 0.5 },
      motes: { rate: 11, size: 9, drift: 46, rise: -6, colors: ['#3f3f46', '#71717a', '#18181b'] },
      impact: ['#52525b', '#27272a', '#8b8b93'],
      shape: 'streak',
      /** Éclat d'incantation : sombre, donc l'écran **s'assombrit** un huitième
       *  de seconde au lieu de blanchir. C'est l'effet voulu pour un ninja, et
       *  c'est assez bref pour ne rien masquer du duel. */
      castFlash: 'rgba(30,30,36,0.55)',
    },
    trail: { color: 'rgba(42,42,50,0.32)', every: 0.035, life: 0.3 },
    /**
     * **`accent` porte le nombre de dégâts infligés** (`Flair.hit` le remplit
     * avec, sur un contour noir posé par le moteur), la marque au sol, les
     * traits de sillage et la gerbe d'impact.
     *
     * **Passé du noir au gris, demandé.** Le noir `#1f1f24` de la passe
     * précédente se noyait dans le contour `#0a0a0a` que le moteur pose
     * autour du chiffre : le nombre devenait une masse noire sans relief. Un
     * gris moyen y gagne des deux côtés — il tranche sur le contour noir *et*
     * sur le blanc de l'arène. Même valeur que le contour de la bille : le
     * combattant n'a plus qu'un seul accent, et c'est ce gris.
     */
    accent: '#8f8f99',
  },

  // le plus rapide et le plus manœuvrant du roster (observé)
  movement: { speed: 500, turnRate: 2.2, seek: 0.4 },

  weapon: {
    /** **Écart assumé au relevé, demandé.** Le losange crème du Vent est
     *  remplacé par un shuriken de flamme transcrit d'une maquette fournie —
     *  huit branches de métal sombre cerclées de flamme continue, gemme de
     *  crâne de dragon au centre. `head.sprite` est servi par un **vrai
     *  PNG** (`assets/sprites/shinobi-shuriken.png`, déclaré dans
     *  `assets/sprites/manifest.json`), même technique que la lame du
     *  Bretteur — voir `fighters/bladesman.js` pour l'écart à l'invariant
     *  « aucun binaire dans le dépôt » que ça implique. `BLADESMAN_FLAMEBLADE` avait besoin
     *  d'un recadrage soigné à l'extraction (la maquette isole mal l'objet
     *  du damier de transparence sur les zones sombres) ; `cv2.inpaint`
     *  (Telea) a rebouché les poches de damier prises dans l'ombre du métal
     *  sans toucher au reste — un simple retrait de fond ne suffisait pas
     *  ici, contrairement à la lame.
     *
     *  **Repeint en gris-noir depuis, sur demande** (« style sombre ninja ») :
     *  `manifest.json` pointe maintenant sur `shinobi-shuriken-dark.png`, la
     *  même maquette dont la luminance est remappée sur une rampe de gris
     *  (métal quasi noir, anciennes flammes en gris moyen), alpha conservé au
     *  pixel près. L'original en flammes reste dans le dossier : c'est
     *  exactement à ça que sert la couche d'indirection du manifeste, et il
     *  suffit d'y changer une ligne pour revenir en arrière. Le nom de l'arme
     *  suit la teinte — « de flamme » aurait menti sur ce qu'on voit. */
    name: 'Shuriken d’ombre',
    nameRef: 'Shadow Shuriken',
    /**
     * **La bille EST le shuriken — demandé, écart assumé au relevé.**
     *
     * L'arme ne pend plus à côté du corps : le sprite est **centré sur la
     * bille**, qui joue le trou central du shuriken pendant que les lames
     * rayonnent autour d'elle. Trois valeurs suffisent à le dire, et elles
     * tiennent ensemble :
     *
     *  • `head.scale` porte la largeur dessinée à **150 px** (17 cellules du
     *    repli texte × 8,912656, corrigé du ratio 198/200 du PNG) ;
     *  • `handle.length` vaut **−75**, soit la moitié de cette largeur :
     *    `drawSpriteLeft` blitte à partir de là, donc le sprite démarre une
     *    demi-largeur *avant* le pivot et retombe exactement centré ;
     *  • `reach` vaut **75**, le rayon des pointes.
     *
     * L'invariant du dépôt tient toujours au caractère près :
     * `handle.length + largeur dessinée = −75 + 150 = 75 = reach`. La pointe
     * dessinée ne ment donc pas sur la portée, comme pour les dix autres.
     *
     * **Taille : 150 px pour une bille de 82.** Les lames dépassent de 34 px
     * tout autour — assez pour se lire comme un shuriken, pas assez pour
     * occuper un quart de l'arène. Caler la bille sur le vrai moyeu de la
     * maquette (30 % du rayon) aurait demandé 273 px, hors de question.
     * L'arme reste **sous** le corps (pas de `overBody`) : c'est ce qui fait
     * que la bille bouche le moyeu au lieu de passer derrière.
     */
    reach: 75, // déduit : rayon des pointes du shuriken dessiné
    /**
     * Relevé à `SPIN * 1,1` (il tournait déjà plus vite que le reste du
     * roster), poussé ×1,3 puis, sur cette nouvelle demande, **encore ×1,2**
     * (1,43 → 1,716) — deux écarts assumés cumulés, et toujours **purement
     * visuels** : depuis que la hitbox est un disque centré (`from`/`to` à
     * zéro), `weaponAngle` ne décide plus d'aucune collision. Il ne reste
     * que le sprite qui tourne sur lui-même et le ruban qui suit `reach`.
     * La matrice le confirme — inchangée au caractère près, comme pour le
     * premier passage à ×1,3.
     */
    spin: SPIN * 1.716,
    spinDir: 1,
    /**
     * **Aucun manche**, et `length` **négatif** : `width: 0` demande au moteur
     * de ne rien dessiner, et la longueur ne sert plus qu'à reculer le sprite
     * d'une demi-largeur pour le centrer sur la bille (même mécanique que le
     * talon de la lance du Lancier, poussée jusqu'au centrage complet).
     */
    handle: { length: -75, width: 0, color: '#6f6a55', dark: '#3f3b30', outline: '#201c12', gem: null },
    /** 17 cellules du repli texte × 8,912656 = 151,5 px de haut, soit
     *  150 px de large une fois le ratio 198/200 du PNG appliqué. */
    head: { sprite: 'windShuriken', scale: 8.912656 },
    /**
     * **Il blesse tout autour de lui — c'est la conséquence demandée.**
     *
     * `from` et `to` à zéro écrasent le segment tranchant sur le pivot :
     * `bladeSegment()` rend alors deux extrémités confondues au centre du
     * corps, et `segmentPointDistance` (qui traite déjà `len2 === 0`) mesure
     * la distance à ce point. Le test d'`weaponHit` devient donc
     * `distance ≤ rayon adverse + 75` : un **disque** centré sur la bille,
     * sans direction privilégiée. Aucune ligne de moteur n'a eu à bouger — la
     * forme de la hitbox se dit entièrement dans la fiche.
     *
     * `radius: 75` est le rayon des pointes, le même que `reach` : la lame
     * touche là où on la voit.
     */
    hitbox: { from: 0, to: 0, radius: 75 },
    melee: {
      /**
       * **3 → 2, pour resserrer le roster réduit.** Le Shinobi était l'écart
       * du relevé (18 victoires sur 24 au banc des deux camps, contre 9 à 10
       * pour le Hors-la-loi, le Bretteur et le Mage), et sa hitbox en disque
       * de 75 px lui donne une fenêtre de touche qu'aucun autre n'a.
       *
       * C'est **son** levier et pas celui des deux derniers, parce que leurs
       * leviers à eux sont morts ou coûteux : le rayon de balle du Hors-la-loi
       * ne bouge rien (8 / 10 / 12 / 14 → 10 / 9 / 10 / 9, du bruit), sa
       * dispersion marche mais elle est **déduite d'une mesure** (0,75 rad
       * reproduit les 0,60 coup/s relevés), et le palier de surchauffe du
       * Bretteur est plat lui aussi (1,8 / 2,6 / 3,5 / 5 → 9 / 7 / 9 / 9).
       *
       * Écarté : réduire `hitbox.radius` (75). Il est **déduit du shuriken
       * dessiné** — le rétrécir ferait mentir le sprite sur l'endroit où il
       * touche, ce que le dépôt s'interdit.
       */
      damage: 2,
      cooldown: 1, // cadence la plus rapide du roster
      knockback: 205,
      selfRecoil: 70,
      onHit: { slow: 0.12, slowDuration: 1.2 },
    },
  },

  /** Tornade : la stat monte et la recharge descend à chaque incantation. */
  ability: {
    id: 'tornado',
    name: 'Tornade',
    nameRef: 'Tornado',
    cooldown: 4, // mesuré : 4 s au départ
    /**
     * Deux mesures à concilier, toutes deux relevées automatiquement :
     *  • la **cadence réelle** des rafales passe de 4,8 s à 1,4 s en
     *    17 déclenchements → elle se raccourcit un peu à chaque incantation ;
     *  • le **couple affiché** avance par pas de +2 dégâts / −0,5 s, et sept
     *    fois seulement sur le même duel → ces pas-là suivent les rafales qui
     *    touchent (7 progressions pour 10 → 24 de dégâts, pile).
     * D'où deux décréments distincts.
     */
    cooldownStepOnCast: 0.15,
    cooldownStep: 0.5, // mesuré, apparié aux +2 dégâts, quand la rafale touche
    cooldownFloor: 0.5, // mesuré : le HUD descend jusqu'à 0,5 s
    tornado: {
      /**
       * **Rafale, pas une zone.** Détection automatique sur trois vidéos :
       * la tornade n'existe que 4 à 6 images (0,13 → 0,20 s) et son centre
       * est toujours à moins de 30 px du Vent — c'est un tourbillon qu'il
       * déclenche *autour de lui*, pas un vortex lancé sur l'adversaire.
       */
      radius: 125, // mesuré : ~120-130 px de diamètre visible
      duration: 0.2,
      knockback: 430, // la rafale projette au lieu d'aspirer
      /** « Tornado Damage » du HUD, ramené à l'échelle des PV. */
      damage: (self) => Math.max(2, Math.round(self.stacks / 2)),
      damageGain: 2, // mesuré : 10 → 24 par pas de 2
      damageMax: 24, // plafond mesuré, apparié au plancher de 0,5 s
      /**
       * **Aspect passé au gris, demandé — style ninja.** Était un disque flou
       * couleur sable composé de larges pales en éventail qui rayonnent du
       * centre, sans le moindre contour — pas des cercles concentriques. Le
       * cœur était plus dense et plus chaud. Ramené à la gamme grise ardoise
       * pour tenir le style cohérent.
       */
      color: 'rgba(78,78,88,0.46)', // gris ardoise, même gamme que le ruban
      edge: 'rgba(102,102,112,0.42)', // bord un cran plus clair
      core: 'rgba(55,55,65,0.6)', // cœur plus foncé
      blades: 9, // pales de l'éventail (comptées sur la vidéo)
    },
  },

  ultimate: {
    id: 'tempestVolley',
    /** Renommé sur demande : `TEMPEST VOLLEY` → `SHURIKEN TORNADO`. L'`id`
     *  (`tempestVolley`) ne bouge pas — il n'est montré à personne, et le
     *  renommer toucherait le module de pouvoirs sans rien apporter au
     *  joueur ; même règle que `id: 'wind'` gardé sous le nom SHINOBI. */
    name: 'Tornade de shurikens',
    nameRef: 'SHURIKEN TORNADO',
    barLabel: 'SHURIKEN TORNADO',
    barLabelFr: 'TORNADE DE SHURIKENS',
    /** **Jauges passées au gris, demandé.** Étaient en khaki-crème comme la
     *  Tornade avant le style ninja. */
    barFill: '#71717a',
    barText: '#e0e0e5',
    /** Cycle de jauge mesuré : ~8 à 10 s entre deux décharges. */
    chargeRate: 11,
    chargeOnHit: 2,
    /**
     * Décharge **courte et dense** : sur la vidéo, la cible perd ~16 PV en
     * une seconde et demie au moment où la jauge se vide.
     */
    duration: 1.5,
    volley: { interval: 0.3, count: 2, spread: 1.1, projectile: 'crescent' },
    speedBonus: 1.25,
  },

  /**
   * **CLONE D'OMBRE — pouvoir demandé, troisième créneau.**
   *
   * Même patron que le Blizzard/l’Aura de braise/le Dôme de drain
   * (invariant 7) : greffé à côté d'`ability` (Tornade) et d'`ultimate`
   * (Salve de tempête), sur sa propre horloge (`f.state.cloneCd`), sans
   * toucher ni l'une ni l'autre.
   *
   * **Différence avec les trois autres greffes : celle-ci n'est pas reprise
   * d'un autre combattant, elle est conçue pour le Shinobi.** Et c'est le seul
   * pouvoir du dépôt qui **change le nombre de combattants en jeu**.
   *
   * Le clone n'est plus une entité du module : c'est un **`Fighter` inscrit
   * dans `game.fighters`**, dans le camp du Shinobi, avec son module, ses
   * pouvoirs, sa plaque de PV, ses jauges, sa ligne de statistiques et sa place
   * au classement. Le duel devient un **2 contre 1** — demandé — et il le
   * devient par la seule notion de camp que le moteur portait déjà : la partie
   * s'arrête quand il ne reste qu'un camp debout, donc elle continue si le vrai
   * Shinobi tombe pendant qu'un clone tient.
   *
   * **Mêmes pouvoirs, même recharge** — Tornade et Salve de shurikens
   * comprises, avec la recharge *courante* de l'original et ses dégâts de
   * Tornade acquis (voir `castClone`). Une seule limite : **un clone
   * n'invoque pas de clone**, sans quoi le nombre de doubles doublerait toutes
   * les `cooldown` secondes.
   *
   * Trois versions ont précédé celle-ci, et chacune tombait par le haut : un
   * double stationnaire et incorporel qui jetait des shurikens (le moteur ne
   * connaissait alors que deux combattants), puis un double mobile et armé mais
   * sans pouvoir, coiffé du prototype `Fighter` sans être du tableau. Chaque
   * étape a rendu du code au moteur ; celle-ci lui rend le reste.
   */
  special: {
    id: 'shadowClone',
    name: 'Clone d\'ombre',
    nameRef: 'Shadow Clone',
    barLabel: 'SHADOW CLONE',
    barLabelFr: 'CLONE D\'OMBRE',
    /** Reprend la couleur de la jauge d'ultime juste au-dessus — même
     *  convention que les trois autres pouvoirs greffés (sixième vague du
     *  Bretteur) : les deux jauges d'un même combattant se lisent comme une
     *  paire. Passées au gris avec les autres, demandé. */
    barFill: '#71717a',
    barText: '#e0e0e5',
    /**
     * **25 PV, demandé** — une valeur de fiche à nouveau.
     *
     * Le clone a hérité un temps des PV **restants** du Shinobi. Ça n'a plus
     * cours : il naît à 25, quel que soit l'état de celui qui l'invoque. Le
     * pouvoir cesse donc d'être auto-décroissant, et cesse surtout de peser sur
     * un troisième combattant — c'est l'héritage qui avait fait tomber le
     * Pistolero de 15/48 à 10/48 sans que sa fiche ne bouge, un clone à 100 PV
     * absorbant le barillet entier là où un clone fragile tombait en quatre
     * balles.
     *
     * 25 contre 100 pour un vrai combattant : il meurt vite, et c'est ce qui
     * borne un pouvoir qui donne désormais un **combattant complet** de plus.
     */
    hp: 25,
    /**
     * **Deux minuteries, et ce n'est plus la même qui commande.**
     *
     * `first` est le délai avant la **première** invocation d'un combattant.
     * Tant qu'un clone ne pouvait pas invoquer, il ne concernait que
     * l'original et ne servait qu'à laisser le duel s'installer. Depuis que la
     * récursion est ouverte, **il décide de la pente de la chaîne** : chaque
     * nouveau-né attend `first` avant de poser le suivant, donc c'est lui, et
     * non `cooldown`, qui fixe la vitesse à laquelle l'arène se remplit.
     * `cooldown` ne règle plus que l'entretien.
     *
     * Balayés dans cet ordre, sur les deux camps (référence : **23/48**) :
     *
     * | `first` | 5 s | 8 s | 10 s | 11 s | **12 s** | 16 s |
     * | --- | --- | --- | --- | --- | --- | --- |
     * | Shinobi /48 | 39 | 33 | 34 | 29 | **20** | 18 |
     * | corps vivants au pire | 5 | 5 | 4 | 4 | **4** | 3 |
     *
     * Puis `cooldown`, `first` figé à 12 s : 12 s → 31, 16 → 26, **17 → 21**,
     * 19 → 20, 22 → 20. Les trois derniers sont plats à un duel près, donc du
     * bruit ; 17 s est le premier qui remonte franchement.
     *
     * D'où **12 s / 17 s** : 21/48 contre 23 de référence, et **au plus quatre
     * corps vivants** dans l'arène, cinq créés dans le pire duel du banc.
     *
     * **Le seuil entre 11 et 12 s est une falaise** (29 → 20), et c'est
     * attendu : c'est là que la chaîne bascule entre « les clones naissent plus
     * vite qu'ils ne meurent » et l'inverse. Un réglage posé juste à côté d'une
     * falaise n'est pas robuste — celui-ci est du bon côté, sur le plateau.
     *
     * Historique des paliers, chacun répondant à une demande qui a changé ce
     * que vaut un clone : 12 s (stationnaire et désarmé) → 5 s (mobile et armé,
     * donc fragile) → 9 s (PV hérités) → 22 s (combattant complet) → 17 s
     * (récursion). Le détail des balayages est dans `docs/FICHES.md`.
     */
    cooldown: 17,
    first: 12, // calé : c'est LUI qui borne la chaîne, voir ci-dessus
    // Permanent : demandé. Rien ne le fait expirer, seuls ses PV le peuvent.
    offset: 130, // calé : apparaît derrière le Shinobi, hors de son propre corps
    /**
     * **La légère différence de ton qui dit lequel est le vrai — demandé.**
     *
     * Deux valeurs, et deux seulement, parce que le clone doit rester *le même
     * personnage* : un double repeint ne serait plus un double.
     *
     *  • `tint` / `tintAlpha` **se mélangent** au corps au lieu de le
     *    remplacer (`Fighter.draw` lit déjà ce couple pour le givre du
     *    Hors-la-loi) : le noir plein `#141414` de l'original ressort en
     *    `#444`-ish sur le clone. Un gris de la gamme ninja, pas une couleur
     *    étrangère ;
     *  • le clone ne traînait **ni ruban ni sillage**, `render/flair.js` ne
     *    bouclant que sur les combattants du tableau. Il en fait partie
     *    maintenant, donc il traîne comme les autres : cet écart-là est tombé,
     *    et la teinte reste seule à distinguer les deux.
     *
     * `special.alpha`, le voile de transparence, est parti avec le `drawOver`
     * qui l'appliquait : un combattant du tableau est dessiné par la boucle de
     * rendu du moteur, qui ne connaît pas d'opacité par combattant — et c'est
     * cohérent, un Shinobi à part entière doit se lire comme un corps plein.
     */
    tint: '#6b6b76',
    tintAlpha: 0.55,
  },

  /** **Écart assumé au relevé, demandé.** « Remplacer les projectiles par
   *  des shurikens de la même taille » : la clé `crescent` — toujours celle
   *  que lit `ultimate.volley` — pointe maintenant sur le même sprite que
   *  l'arme (`windShuriken`, servi par le même PNG) plutôt que sur
   *  `windCrescent`, et à la **même échelle** que l'arme (`scale: 4.35`,
   *  contre 3,6 pour l'ancien croissant) : le projectile lancé a exactement
   *  la taille dessinée du shuriken en main (~74 px), pas une taille propre.
   *  `radius` (rayon de collision) suit la même proportion (12 → 15) pour
   *  que la hitbox ne mente pas sur un projectile devenu plus grand — même
   *  discipline que la lame agrandie du Bretteur (invariant 5). */
  projectiles: {
    crescent: {
      label: 'Shuriken',
      labelRef: 'Shuriken',
      sprite: 'windShuriken',
      scale: 4.35,
      speed: 430,
      damage: 4,
      radius: 15,
      life: 2.2,
      bounces: 1,
      knockback: 80,
      // gris ardoise comme le reste du style ninja : c'est une traînée, elle
      // suit la même gamme que le ruban et les motes du corps
      trail: { color: 'rgba(58,58,68,0.42)', every: 0.04, life: 0.32 },
    },
  },

  progression: { stack: 10, stack2: 0 },

  hud: {
    /** Libellé renommé sur demande : « Tornado Damage » → « Shuriken Damage ».
     *  La valeur affichée reste `f.stacks`, la stat relevée sur la vidéo — seul
     *  le mot change, pour coller au personnage tel qu'il est maintenant. */
    stats: [
      (f) => `Shuriken Damage: ${Math.round(f.stacks)}`,
      (f) => `Cooldown: ${formatSeconds(f.ability.cooldown)}`,
    ],
    statsFr: [
      (f) => `Dégâts de shuriken : ${Math.round(f.stacks)}`,
      (f) => `Recharge : ${formatSeconds(f.ability.cooldown)}`,
    ],
    /** Couleur passée au gris, demandé. Étaient khaki et crème clair comme le
     *  reste du Vent avant le style ninja. */
    color: '#71717a',
    stroke: '#d0d0d5', // liseré clair : la ligne de stat est posée sur le fond sombre
  },
});
