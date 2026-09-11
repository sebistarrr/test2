import { fiche, SPIN } from '../defaults.js';
import { formatSeconds } from '../format.js';

/* ==========================================================================
 *  SOLEIL  (SUN) — le premier **boss** du roster
 *
 *  Troisième combattant **inventé** du dépôt, après le Golem et le Mannequin :
 *  il n'a pas de vidéo de référence, donc **aucune de ses valeurs ne peut
 *  porter `mesuré`**. Tout y est `calé` (posé puis vérifié au banc) ou `déduit`
 *  (calculé d'une autre).
 *
 *  **Ce qu'il est, et ce qu'il n'est pas.** Les sept autres sont taillés pour
 *  s'affronter entre eux : la matrice les tient dans une bande de 4 à 13
 *  victoires sur 18, et chaque rééquilibrage cherche à la resserrer. Celui-ci
 *  est demandé pour **gagner contre tout le monde en 1 contre 1**, ce qui est
 *  une intention opposée. Il ne fait donc pas partie du même barème, et sa
 *  ligne de matrice n'est pas un défaut d'équilibrage à corriger — c'est la
 *  spécification.
 *
 *  **Trois choses le rendent boss, et elles se lisent toutes dans cette
 *  fiche :**
 *
 *   1. **Deux fois plus grand** (rayon 82 contre 41) et **500 PV** contre 100.
 *      Comme pour le Golem, la taille est un vrai coût — un corps plus large
 *      est plus facile à toucher — et c'est la barre de vie qui le paie.
 *   2. **Huit rayons au lieu d'une arme.** `weapon.spokes: 8` : la même arme
 *      répétée tous les 45°, donc une couronne qui ne laisse aucun angle mort.
 *      **Elle ne blesse plus** (`melee.damage: 0`, demandé) : elle est
 *      aujourd'hui sa silhouette et son bruit, plus son arme.
 *   3. **Il est lent** (230 px/s, le plus lent du roster et de très loin), et
 *      c'est la contrepartie. Il ne rattrape personne — et n'aurait rien à en
 *      faire s'il y arrivait.
 *
 *  **Le renversement à connaître avant d'y toucher.** À sa création, la
 *  couronne portait **67,3 %** de ses dégâts et le Rayon solaire 18,9 % ; il
 *  était un colosse de contact dont l'ultime était le bouquet. Supprimer les
 *  dégâts de mêlée l'a retourné : il est désormais **entièrement porté par son
 *  ultime**, et tout le reste de la fiche a suivi — horloge d'ultime deux fois
 *  plus rapide (13 s → 7), annonce presque deux fois plus longue (1,1 s → 2),
 *  faisceau deux fois et demie plus long et près de deux fois plus large.
 *
 *  Conséquence de jeu, et c'est le personnage aujourd'hui : **le coller ne
 *  coûte plus rien**, et c'est justement de près que le faisceau est
 *  inesquivable. Le duel contre lui ne se joue plus sur la distance mais sur
 *  **le moment** — les deux secondes d'annonce sont toute la fenêtre.
 * ========================================================================== */
export const SUN = fiche({
  id: 'sun',
  /** Archétype traduit, comme DRUIDE/DRUID : « soleil » et « sun » sont le même
   *  mot d'usage dans les deux langues, et le champ reste obligatoire. */
  name: 'SOLEIL',
  nameRef: 'SUN',
  tagline: 'Astre-roi — huit rayons, cinq cents points de vie, et tout son temps',
  taglineRef: 'King star — eight rays, five hundred hit points, and all the time',
  icon: 'iconSun',

  /**
   * **500 PV, cinq fois la norme et deux fois et demie le Golem.**
   *
   * Calé, et calé haut exprès : c'est le chiffre qui porte la demande « il doit
   * gagner contre tous les autres ». Il n'a **aucune réduction de dégâts**,
   * comme le Golem — un seul chiffre porte toute sa résistance, donc le banc
   * n'a qu'un levier à tourner si la demande change.
   *
   * Lu par `Match` en une ligne (`el.maxHp ?? MATCH.maxHp`), et tout ce qui
   * affiche une proportion de vie divise par `Fighter.maxHp`, jamais par une
   * constante : il n'y a rien d'autre à toucher pour qu'un combattant sorte de
   * la norme.
   */
  maxHp: 500,

  look: {
    /**
     * **Exactement le double de la norme — demandé.** 82 contre 41, là où le
     * Golem, jusqu'ici le plus gros, est à 50.
     *
     * `look.radius` est déjà lu génériquement (`Fighter.radius`, cadrage de la
     * carte de sélection, séparation des corps) : aucune ligne de moteur ne
     * suppose 41. Deux conséquences de jeu, toutes deux assumées :
     *  • il est **beaucoup plus facile à toucher** — c'est le prix de ses PV ;
     *  • il occupe 1/8 de la largeur de l'arène (628 px utiles), donc il ne
     *    peut pas se cacher, et l'adversaire ne peut pas non plus le contourner
     *    de loin.
     */
    radius: 82,
    /**
     * **Les cinq teintes de la maquette, et la source unique de tout ce qui est
     * orange chez lui — corps, couronne, pouvoirs et icône.**
     *
     * Relevées sur `sun-core.png` par bandes de luminance (3ᵉ, 20ᵉ, 50ᵉ, 80ᵉ et
     * 97ᵉ centile des pixels opaques), donc **prises dans le dessin**, pas
     * choisies à côté : le corps et la couronne sont littéralement la même
     * matière, ce qui est le seul moyen que huit flammes plantées sur une bille
     * se lisent comme **un** objet et non comme un objet plus huit décorations.
     *
     * Elles sont **nommées ici et lues par le module**, qui codait ses propres
     * orange en dur — c'est ainsi que le Rayon solaire avait fini par ne plus
     * avoir la même matière que l'astre qui le tire. Le dépôt documente ce
     * piège dans l'autre sens (« un module qui code en dur une clé de sprite se
     * ferme à sa propre réutilisation ») : ici ce sont des couleurs, et le prix
     * n'est pas la réutilisation mais la **dérive**. Repalettiser le personnage
     * demande maintenant de toucher ces cinq lignes, et rien d'autre — les
     * trois cartes de `pixelart/sun.js` les recopient, icône comprise.
     *
     * **Il était jaune vif (`#fbbf24`)**, et le piège du corps clair sur arène
     * blanche demandait alors trois compensations. Cet orange est plus sombre,
     * donc le piège se relâche — mais les compensations restent, parce qu'il
     * reste clair : contour épaissi, chiffre de PV en encre, aura permanente.
     *
     * Le voisinage du Ronin (`#e8621b`) a été vérifié et assumé : celui-ci est
     * plus doré (canal vert 153 contre 98) et surtout dix fois plus gros, cerné
     * de huit flammes. On ne les confond pas à l'écran.
     */
    palette: {
      edge: '#5d0100', // contour, l'encre brûlée du dessin
      shadow: '#c00803', // le rouge profond
      body: '#f9993c', // orange de corps
      light: '#fbcf55', // clair
      core: '#fdf17f', // cœur incandescent
    },
    /**
     * **Le corps est un sprite — le seul du roster.**
     *
     * `assets/sprites/sun-core.png` : la maquette d'astre fournie, détourée de
     * son fond blanc **et de son halo pêche** (le halo est déjà fait en jeu par
     * `look.aura`, qui bat, alors qu'un halo cuit dans l'image serait figé et
     * en ferait trois qui se superposent).
     *
     * **Le halo ne se détoure pas à la couleur** — il a été gardé deux fois par
     * un seuil de saturation avant qu'on trouve pourquoi : la pêche qui touche
     * l'astre (`#f9bf75`, saturation 132) est *aussi saturée* que la flamme
     * pâle, aucun seuil ne les sépare. Ce qui les sépare est **topologique** :
     * la flamme est exactement ce que son propre contour brûlé enferme. Le
     * masque se prend donc par **remplissage depuis le bord de l'image**, les
     * pixels sombres (luminance < 100) faisant mur — le halo, lui, n'est
     * enfermé par rien. À refaire ainsi si la maquette change.
     *
     * **Et coupée à sa sphère, demandé** : la balle ne contient plus que « la
     * sphère de l'image », tout ce qui l'entoure est devenu **l'arme**. La
     * coupe tombe à **172 px** du centre sur ce masque propre, relevée au
     * contour sur 720 directions : c'est la médiane des dix **creux** entre
     * langues, donc le dernier cercle encore plein. Les onze pics sont à 262
     * (297 au plus long) : une langue fait 90 px, soit **52 % du rayon de la
     * sphère** — elle n'était mesurée qu'à 14 % tant que le halo polluait le
     * masque, et c'est ce chiffre-là qui avait fait une coupe trop généreuse.
     *
     * Les huit autres combattants sont des cercles vectoriels ;
     * `assets/sprites/README.md` décrivait depuis toujours comment servir un
     * corps en sprite sans que personne l'ait fait. Le moteur ne connaît
     * toujours aucun combattant : `Fighter.draw()` lit `look.sprite`, et son
     * absence renvoie au tracé d'origine mot pour mot.
     */
    sprite: 'sunCore',
    /**
     * **Pas de `spriteScale` ici, et c'est le résultat d'une mesure.**
     *
     * La clé existe (`Fighter.drawSpriteBody` la lit, défaut 1) pour corriger un
     * dessin qui déborde de son disque plein — l'astre en avait besoin tant que
     * ses pointes étaient dans son sprite, à 1,1236. Elles sont maintenant
     * **l'arme**, donc le PNG est un disque net qui remplit exactement son
     * cadre : la correction vaudrait 1, et une clé qui recopie son défaut est
     * une occasion de divergence silencieuse, pas une intention.
     *
     * À remesurer si la maquette change : couverture par anneau, on cherche le
     * dernier rayon encore plein, et `spriteScale = 1 / ce rayon`.
     */
    /**
     * **Opacité du voile d'encaissement.** Sur un aplat, le flash *remplace* la
     * couleur ; sur un dessin, le remplacer l'effacerait — on ne verrait qu'une
     * pastille unie à chaque coup. 0,6 : le coup se voit franchement, l'astre
     * reste lisible dessous.
     */
    spriteFlash: 0.6,
    /**
     * **Plus peinte, mais toujours lue** : la carte de sélection en cerne sa
     * vignette et `Match.damage` en tire la couleur des gerbes. C'est le
     * `corps` de la maquette d'astre (bande médiane de luminance), donc ces
     * deux usages restent d'accord avec ce qu'on voit à l'écran.
     */
    body: '#f9993c',
    /**
     * **Il flambe au lieu de blanchir.** Le reste du roster passe au blanc
     * quand il est touché ; celui-ci passe au **cœur de sa propre flamme**
     * (`#fcf697`, la teinte la plus claire du sprite). C'est aussi lisible
     * qu'un blanc sur un corps orange, et ça dit la bonne chose : un astre
     * frappé ne pâlit pas, il s'embrase.
     */
    bodyHit: '#fdf17f',
    /** **Plus tracé sur le corps** — un cercle net autour d'un astre hérissé se
     *  lirait comme un carcan, et le sprite porte son propre bord. La clé reste
     *  lue par la carte de sélection, ce n'est donc pas une clé morte
     *  (invariant 9). C'est le contour de la maquette. */
    outline: '#5d0100',
    /** 6 au lieu des 5 universels : sur un corps clair, c'est le trait qui
     *  dessine la silhouette. Même dérogation que le Mannequin. */
    outlineWidth: 6,
    /**
     * La même encre que le contour, donc le chiffre se lit comme **brûlé dans**
     * l'astre. Contraste mesuré : **4,15** sur `#de7f3a` — au-dessus du Ronin
     * (crème sur orange, 3,03), qui est la référence lisible du dépôt. Le crème
     * du reste du roster tomberait ici à 2,6.
     */
    /**
     * **Crème cerné d'encre, et c'est une mesure qui l'impose.**
     *
     * Le corps n'est plus un aplat mais un dessin, et sous l'empreinte exacte
     * des digits **53 % des pixels sont clairs, 40 % sombres**. Aucun aplat ne
     * tient : la meilleure encre sombre tombe à 2,28 de contraste dans son pire
     * cas, la meilleure encre claire à 1,08. D'où le contour (`hpStroke`), qui
     * isole le chiffre de ce qu'il y a dessous au lieu d'essayer de composer
     * avec — le moteur le faisait déjà pour les nombres de dégâts, il a fallu
     * l'ouvrir au chiffre de PV.
     */
    hpColor: '#fff4d0',
    hpStroke: '#3a0b05',
    /**
     * **Halo permanent**, deuxième cas du roster après le Mannequin et pour une
     * raison inverse : lui *a* des pouvoirs, mais un astre sans halo n'est pas
     * un astre. `radius: 1.25` seulement — sur un corps de 82 px de rayon, un
     * halo à 1,5 comme celui du Golem mangerait un quart de l'arène.
     */
    aura: { color: 'rgba(251,207,85,0.42)', radius: 1.25, pulse: 0.7, showWhen: 'always' },
    /**
     * **Pas de ruban de pointe d'arme, et c'est un choix, pas un oubli.**
     * `flair.js` trace le ruban sur `f.bladeSegment()`, qui rend **une** branche
     * — la première. Sur une couronne de huit, un ruban unique désignerait un
     * rayon au hasard et donnerait l'impression que les sept autres ne comptent
     * pas. La couronne se lit d'elle-même, elle n'a pas besoin d'être soulignée.
     *
     * Restent les braises qui **montent** (`rise` négatif, l'inverse de la
     * poussière du Golem qui retombe) : c'est de la chaleur, ça ne pèse rien.
     * Leurs trois teintes sont celles du sprite — cœur, clair, ombre : ce qui
     * s'échappe de lui est fait de la même flamme que lui.
     */
    flair: {
      motes: { rate: 14, size: 9, drift: 22, rise: -26, colors: ['#fdf17f', '#fbcf55', '#c00803'] },
      impact: ['#fdf17f', '#ffffff', '#c00803'],
      shape: 'spark',
      castFlash: 'rgba(253,241,127,0.55)',
    },
    trail: { color: 'rgba(249,153,60,0.26)', every: 0.05, life: 0.36 },
    accent: '#fdf17f',
  },

  /**
   * **Bruitages.** `pitch: 0.78` — presque aussi grave que le Golem (0,72),
   * parce qu'il est encore plus gros que lui, mais **pas** au même endroit : la
   * pierre du Golem est mate et sourde, le feu est large et soufflé. C'est la
   * matière des recettes qui les sépare, pas seulement la transposition — et
   * c'est pour ça qu'aucune des siennes n'est empruntée.
   */
  sound: {
    pitch: 0.78,
    shot: null, // il n'a aucun projectile
    /**
     * **Le son du faisceau, et non celui de la couronne.**
     *
     * Le créneau `hit` est celui de la touche d'arme, et son arme ne blesse
     * plus (`melee.damage: 0`) — il serait donc mort si son module ne le
     * réclamait pas explicitement : le Rayon solaire passe `sound: 'hit'` dans
     * `game.damage`, le mécanisme prévu pour une arme que le moteur ne
     * reconnaît pas comme telle. Sans ça, chaque tic du rayon sonnait comme un
     * projectile perdu, et `sound-check` criait à la recette morte.
     *
     * `scorch` est une **brûlure** et non un choc : le grésillement tient six
     * fois plus longtemps qu'un `pierce`, et l'éclair passe-haut l'ouvre. C'est
     * ce qu'on entend quand ça prend, pas quand ça cogne — ce qui décrit
     * exactement le faisceau, à raison d'un tic toutes les 0,15 s.
     */
    hit: 'scorch',
    impact: 'impact',
    bounce: 'thud',
    /** Le Réchauffement, une nappe qui enfle — l'inverse d'un coup. */
    ability: 'blaze',
    /**
     * **La couronne tourne en permanence**, donc elle a une voix tenue, comme
     * la lame du Ronin et le bloc du Golem. Ses bornes sont les siennes : il
     * tourne à SPIN × 0,55, soit 3,17 rad/s, et son régime est **constant** —
     * la voix dit donc *où il est* et *qu'il est là*, pas une courbe. D'où un
     * `gain` tenu : le Rayon solaire et le Réchauffement doivent rester
     * au-dessus.
     */
    swing: { loop: 'furnace', from: 0.5, to: 5, gain: 0.6 },
    special: null, // il n'a pas de troisième créneau
    /** Le Rayon solaire : la seule recette du banc qui **tienne** une seconde
     *  entière sur une note qui monte, parce que le pouvoir se charge à vue. */
    ultimate: 'flare',
  },

  /**
   * **Le plus lent du roster, et de très loin** : 230 px/s contre 420 (Golem,
   * le précédent détenteur), 430 (Hoplite et Mannequin), 500 (Shinobi), 560
   * (Ronin), 624 (Druide) et 655 (Pistolero). Il va **moitié moins vite que la
   * moyenne du roster**, et presque trois fois moins vite que le Pistolero.
   *
   * **300 → 230, demandé**, en même temps que la suppression de ses dégâts de
   * mêlée. Les deux vont ensemble et disent le même personnage : il ne
   * poursuit plus rien, et il n'aurait rien à en faire s'il rattrapait
   * quelqu'un. Un astre ne court pas après ses cibles, il les cuit.
   *
   * `turnRate: 1` est également le plus bas du roster (1,3 pour le Golem) — un
   * astre ne pivote pas, il dérive.
   */
  movement: { speed: 230, turnRate: 1, seek: 0.32 },

  weapon: {
    name: 'Couronne de rayons',
    nameRef: 'Ray Crown',
    /**
     * **145,41 px — et pas un chiffre choisi : c'est la maquette, à l'échelle.**
     *
     * Déduite du sprite comme partout : `handle.length` 77,23 + largeur dessinée
     * 68,17 = 145,41. La largeur dessinée vaut `map.h × head.scale ×
     * (img.w / img.h)` (voir `head` plus bas), **jamais** `map.w × scale`.
     *
     * Son corps faisant 82 px de rayon, **chaque langue ne dépasse que de 63,4 px
     * du bord** — soit 77 % du rayon du corps, ce que donne le relevé de la
     * maquette (pics à 262 contre sphère à 172). C'est plus court que les 160 px
     * de la couronne d'avant : le dessin est moins hérissé qu'on ne l'avait
     * dessiné de mémoire, et c'est lui qui tranche.
     */
    reach: 145.41,
    /**
     * **SPIN × 0,55**, soit 3,17 rad/s : entre le Golem (0,45) et le reste du
     * roster (1,0). Calé, et calé bas pour la raison documentée sur la lance de
     * l'Hoplite — *une arme qui balaie vite touche souvent* — qui vaut ici au
     * carré, puisque huit branches balaient huit fois le même tour.
     */
    spin: SPIN * 0.55,
    spinDir: 1,
    /**
     * **Huit rayons, un tous les 45° — c'est la mécanique de base du
     * personnage.**
     *
     * `weapon.spokes` est lu par `Fighter.bladeSegment(k)`, `weaponHit` et
     * `drawWeapon` : la même arme répétée à intervalle régulier sur le tour.
     * Le moteur ne connaît aucun combattant (invariant 12) — un autre pourrait
     * déclarer 3 ou 12 sans qu'une ligne de moteur bouge, et les sept qui ne
     * déclarent rien retombent sur 1, donc sur le chemin exact d'avant (la
     * matrice le vérifie au caractère près).
     *
     * **Ce que ça change au jeu :** il n'a plus d'angle mort. Contourner un
     * combattant est la parade normale contre une arme qui tourne ; contre
     * lui, elle n'existe pas. C'est ce qui remplace, chez un personnage lent et
     * sans visée, le fait de savoir placer un coup.
     */
    spokes: 8,
    /**
     * `width: 0` : le rayon est tout entier dans le sprite, il n'y a pas de
     * manche à tracer. `length: 77,23` — **un peu en deçà du rayon du corps**
     * (82), et c'est voulu : la découpe part de 162 px sur la maquette quand la
     * sphère en fait 172, donc la base de la langue **chevauche** la bille de
     * 4,77 px en jeu. Sans ce recouvrement, huit coutures se verraient tourner.
     */
    handle: { length: 77.23, width: 0, color: '#f9993c', dark: '#c00803', outline: '#5d0100', gem: null },
    /**
     * **Le rayon est une pointe découpée dans la maquette de la balle —
     * demandé** (`assets/sprites/sun-ray.png`). C'est la même image que le
     * corps : la balle en prend le disque, l'arme prend « ce qu'il y a
     * autour ». Les huit rayons **reconstituent donc la silhouette du dessin**,
     * à ceci près qu'ils tournent.
     *
     * Découpe : le secteur de ±18° autour de la plus longue langue (313,6° sur
     * la maquette, celle qui va le plus loin et la mieux formée), pris **depuis
     * 162 px** — soit 10 px en deçà de la sphère, pour que sa base chevauche la
     * balle et qu'aucune couture ne se voie — puis tourné pointe vers la droite
     * (l'axe des armes dans ce moteur), au plus proche voisin : c'est du
     * pixel-art, il ne doit pas flouter.
     *
     * **Toute la géométrie découle de la maquette**, à l'échelle
     * `82 / 172 = 0,476744` (rayon du corps / rayon de la sphère source) :
     *
     * | source | jeu |
     * | --- | --- |
     * | base de la langue, 162 px | `handle.length` 77,23 |
     * | bout de la langue, 305 px | `reach` 145,41 |
     *
     * **`reach` remonte donc de 104 à 145,41**, après être tombé de 160 à 104 au
     * découpage précédent — et les trois chiffres viennent du **même** relevé
     * refait sur un masque différent. C'est l'histoire à retenir : le premier
     * masque gardait le halo pêche, qui remplissait les baies entre les langues
     * et enflait le « disque » à 245 px, ne laissant dépasser que 14 % de
     * pointe. Sur le masque propre (voir `look.sprite`), la sphère est à 172 et
     * les pointes à 262 : **52 %**. Un masque faux ne rend pas une mesure
     * fausse — il rend une mesure *juste sur la mauvaise forme*.
     *
     * **Et ça se paie sur le jeu, contrairement à ce qui était écrit ici** :
     * `melee.damage` vaut 0, mais `resolveMelee` pose le verrou de mêlée,
     * applique `selfRecoil` et **décolle les deux corps** *hors* de
     * `Match.damage`. La portée de la couronne reste donc de la géométrie de
     * jeu, et la matrice bouge à chaque fois qu'on y touche (les durées ; pas
     * les vainqueurs).
     *
     * **L'échelle ne se lit pas sur la carte texte, et c'est le piège déjà payé
     * sur la lance de l'Hoplite puis sur l'arme du Golem** : `drawSpriteLeft`
     * dimensionne par la **hauteur** (`map.h × scale`, prise sur la carte
     * texte, donc 13) puis applique le **rapport d'aspect du PNG** (143 × 124,
     * soit 1,153226). La largeur dessinée vaut donc `13 × scale × 1,153226`, et
     * **non** `map.w × scale` — d'où `scale = 68,17 / (13 × 1,153226) =
     * 4,547406`.
     */
    head: { sprite: 'sunRay', scale: 4.547406 },
    /** Les rayons passent **par-dessus** la bille — ils en sortent, ils ne s'y
     *  cachent pas. Purement visuel : `bladeSegment()` ne lit pas ce drapeau. */
    overBody: true,
    /** Le chiffre de PV repasse au-dessus des rayons, sans quoi « 500 » serait
     *  barré par les deux rayons horizontaux à chaque demi-tour. */
    hpOverWeapon: true,
    /**
     * **Le tranchant commence à la base de la langue** : 0,5311 × 145,41 =
     * 77,23, soit `handle.length`. Déduit, pas choisi — les deux doivent bouger
     * ensemble. Il démarre donc 4,77 px *à l'intérieur* de la bille, exactement
     * comme le dessin (voir `handle`).
     *
     * Rayon 15 : plus fin que le bloc du Golem (24), parce qu'un rayon est
     * effilé et qu'il y en a huit. L'épaissir multiplierait la surface
     * couverte par huit, pas par un.
     */
    hitbox: { from: 0.5311, radius: 15 },
    melee: {
      /**
       * **Zéro — la couronne ne blesse plus, demandé.**
       *
       * Elle valait 5, et elle portait **67,3 %** des dégâts du personnage
       * (ablation par `opts.kind`, 70 duels). La supprimer ne retire donc pas
       * un détail : elle retire **les deux tiers de sa production**, et fait de
       * lui un combattant **entièrement porté par son ultime**. C'est ce qui a
       * commandé tout le reste du changement — faisceau plus large, plus long,
       * charge plus longue — et surtout `ultimate.chargeRate`, qu'il a fallu
       * doubler pour qu'il reste le boss qu'il est censé être.
       *
       * **La couronne reste, et c'est voulu** : c'est la silhouette du
       * personnage, elle tourne, elle siffle (`sound.swing`), et elle dit à
       * l'écran qu'on a affaire à un astre. Elle ne fait simplement plus mal.
       * Le contact n'est plus une punition mais un non-événement — ce qui
       * renverse complètement la façon de l'aborder : on peut désormais le
       * coller sans risque, et c'est précisément de près que le faisceau,
       * impossible à esquiver, devient mortel.
       *
       * **Mais une arme à zéro dégât n'est pas une arme inerte, et c'est le
       * piège de cette fiche.** `Match.damage` sort bien avant tout effet quand
       * le montant vaut zéro — donc plus de son de touche, plus de gerbe, et
       * `melee.knockback` n'est effectivement plus lu par personne. En revanche
       * `resolveMelee` fait **trois choses avant et après cet appel**, qui
       * continuent de tourner :
       *
       *  • il pose `meleeCd` ;
       *  • il applique le **recul propre** de l'attaquant (`selfRecoil`
       *    ci-dessous) — le Soleil recule donc à chaque contact ;
       *  • il **décolle les deux corps** dans l'image de la touche.
       *
       * Les deux derniers déplacent des combattants, donc **la géométrie de
       * l'arme reste du gameplay** : changer `reach` a suffi à déplacer toutes
       * les durées de ses affrontements (les vainqueurs, eux, n'ont pas bougé).
       * Vérifié en le faisant — c'est ce qui a coûté une régénération de
       * matrice au passage de l'arme à la pointe de la maquette.
       */
      damage: 0,
      /**
       * Jamais consommé (aucun dégât ne passe), mais lu à la construction du
       * `Fighter`. C'était **le garde-fou du personnage** tant que la couronne
       * blessait : `weaponHit` teste `meleeCd` une fois pour toutes avant
       * d'essayer les huit branches, donc huit rayons ne faisaient pas huit
       * touches par pas. Le jour où elle reblesserait, c'est ce chiffre qu'il
       * faudrait regarder en premier.
       */
      cooldown: 0.8,
      /** **Celui-là n'est plus lu** : il est passé à `damage`, qui sort avant
       *  de s'en servir. Gardé parce que la clé est lue à la construction du
       *  `Fighter` — invariant 9, assumé et écrit ici pour qu'il ne se découvre
       *  pas au prochain réglage. */
      knockback: 400,
      /** **Celui-ci l'est toujours**, et c'est ce qui rend la géométrie de la
       *  couronne encore sensible : `resolveMelee` l'applique hors de `damage`,
       *  donc le Soleil recule un peu à chaque contact, même sans blesser. */
      selfRecoil: 30,
    },
  },

  /* ---------- POUVOIR — Réchauffement solaire ---------- */
  /**
   * **Il brûle tout ce qui reste à côté de lui — demandé.**
   *
   * Horloge fixe, aucune visée : toutes les 5 s, tout ennemi dans 240 px prend
   * un coup sec **et se met à brûler**. C'est la réponse au seul plan qui
   * marche contre un personnage lent — rester à distance moyenne et attendre —
   * et c'est aussi ce qui punit un corps à corps qui s'accroche.
   *
   * **La brûlure compte plus que le coup**, et c'est voulu : 2 à l'impact, mais
   * 2 par seconde pendant 4 s si l'adversaire ne s'éloigne pas. Le pouvoir ne
   * tue pas, il **impose de bouger** — sur un combattant qui, lui, n'a aucun
   * mal à rester où il est.
   */
  ability: {
    id: 'solarWarming',
    name: 'Réchauffement solaire',
    nameRef: 'Solar Warming',
    /** Calé : à 5 s, il tombe 5 à 7 fois dans un duel de 30 s. */
    cooldown: 5,
    /**
     * 240 px : trois fois son rayon de corps, et une portée de plus que le
     * Golem (170). Sur une arène de 628 px de côté, c'est **plus du tiers de la
     * largeur** — assez pour qu'on ne puisse pas l'ignorer en tournant autour,
     * pas assez pour couvrir le plateau.
     */
    radius: 240,
    /** Bas devant les 5 du rayon : le coup n'est que l'amorce, la brûlure fait
     *  le travail. */
    damage: 2,
    /** Il repousse peu : le but est de **maintenir** la pression, pas de
     *  décoller l'adversaire — ce que fait déjà la couronne. */
    knockback: 120,
    /** La brûlure, et c'est le vrai contenu du pouvoir. Rafraîchie à chaque
     *  cycle : rester dans la zone, c'est brûler sans interruption. */
    burn: { damage: 2, interval: 1, duration: 4 },
    /** Anneau de chaleur au sol, tracé par `Effects.ring`. */
    ring: { to: 240, time: 0.55, color: 'rgba(251,191,36,0.85)', width: 9 },
  },

  /* ---------- ULTIME — Rayon solaire ---------- */
  /**
   * **Il se charge à vue, puis il libère — demandé, puis rallongé et élargi.**
   *
   * Le seul pouvoir du dépôt qui **s'annonce avant de frapper**, et c'est tout
   * son intérêt : pendant `windup` secondes, une bille de lumière grossit
   * devant lui, des anneaux se referment dessus et le rayon est **déjà visé**,
   * mais rien ne part encore. L'adversaire voit exactement ce qui arrive et
   * d'où — il a deux secondes pour sortir de l'axe. C'est la seule fenêtre du
   * duel où *lui* est prévisible.
   *
   * **Depuis que la couronne ne blesse plus, c'est son seul vrai moyen de
   * tuer.** Il ne pèse plus 19 % de sa production mais l'essentiel, et tous les
   * chiffres ci-dessous ont bougé pour ça : charge deux fois plus fréquente,
   * annonce presque deux fois plus longue, faisceau deux fois et demie plus
   * long à l'écran et près de deux fois plus large.
   *
   * **Il s'immobilise pendant toute la manœuvre** (`channelSpeed`), et c'est la
   * contrepartie : un personnage qui pourrait charger en marchant n'aurait
   * aucune raison de ne pas le faire en permanence. À 4,5 s de manœuvre contre
   * 2,1 auparavant, c'est devenu une immobilisation **longue** — il passe
   * désormais une bonne moitié du duel presque arrêté.
   *
   * **La visée se fige au tir**, pas au déclenchement : pendant la charge, le
   * rayon suit sa cible à `trackRate` rad/s — assez pour qu'esquiver demande un
   * vrai déplacement, trop peu pour qu'un adversaire rapide soit condamné.
   */
  ultimate: {
    id: 'solarBeam',
    name: 'Rayon solaire',
    nameRef: 'SOLAR BEAM',
    barLabel: 'SOLAR BEAM',
    barLabelFr: 'RAYON SOLAIRE',
    barFill: '#f97316',
    barText: '#fff7cc',
    /**
     * **13 s → 7 s, et ce n'est pas un confort.** C'était l'horloge la plus
     * lente du roster derrière le Golem, du temps où la couronne portait les
     * deux tiers des dégâts. La couronne ne blessant plus, un ultime toutes les
     * 13 s laissait le Soleil sans **aucun** moyen de tuer pendant onze
     * secondes sur treize : il perdait tous ses duels. À 7 s, il enchaîne
     * charge et tir presque sans interruption — c'est le personnage que
     * demandent les autres changements, pas un réglage de confort.
     */
    chargeRate: 100 / 7,
    chargeOnHit: 3,
    /**
     * Charge **puis** tir : **2 s d'annonce, 2,5 s de rayon** (1,1 et 1
     * auparavant, tous deux rallongés sur demande). `duration` porte le total,
     * comme partout, et le module lit `windup` pour savoir où il en est.
     *
     * **`windup` est accordé à la recette `flare` de `data/sound.js`**, dont la
     * dernière couche part en retard de `windup` pour sonner le départ du
     * faisceau. Les deux doivent bouger ensemble — c'est le seul endroit du
     * dépôt où une valeur de fiche et un son sont liés à la milliseconde.
     */
    windup: 2,
    duration: 4.5,
    /** Il tombe à 25 % de sa vitesse pendant toute la manœuvre. Pas zéro : un
     *  combattant totalement figé se lit comme un bug, pas comme une incantation. */
    channelSpeed: 0.25,
    /**
     * Vitesse de suivi pendant la charge, en rad/s. **0,8 → 0,55** : à `windup`
     * inchangé, 0,8 était le bon compromis ; sur une charge presque deux fois
     * plus longue, il rattrapait **1,6 rad** de cap et ne ratait plus personne.
     * Rallonger l'annonce sans ralentir le suivi aurait donc *supprimé*
     * l'esquive au lieu de lui laisser plus de temps — exactement l'inverse de
     * ce qu'une annonce plus longue est censée offrir.
     */
    trackRate: 0.55,
    beam: {
      /** Assez long pour traverser l'arène en diagonale (628 × √2 ≈ 888) depuis
       *  n'importe quel point : le rayon ne s'arrête jamais avant le mur. */
      length: 900,
      /**
       * **34 → 62, demandé.** Le faisceau fait donc **124 px de large**, soit
       * une fois et demie le diamètre d'un combattant de la norme (82) et les
       * trois quarts du Soleil lui-même. Il ne se contourne plus au pas : il
       * faut vraiment sortir de l'axe.
       */
      halfWidth: 62,
      /**
       * **Le faisceau est fait de la même matière que l'astre — demandé.**
       *
       * Cinq bandes concentriques, de l'extérieur vers le cœur, qui reprennent
       * `look.palette` **dans l'ordre du dessin** : le liseré d'encre brûlée,
       * le rouge profond, l'orange de corps, le clair, l'incandescent. C'est la
       * structure de la maquette du corps, étirée le long d'un axe.
       *
       * Le liseré sombre est ce qui compte le plus, et c'est ce qui manquait :
       * le faisceau allait d'orange à blanc, sans bord. Or c'est le trait brûlé
       * qui signe le dessin de l'astre — sans lui, le rayon ressemblait à
       * n'importe quel laser, et surtout il **se dissolvait sur l'arène
       * blanche** faute de bord.
       *
       * Le dégradé est transversal et non longitudinal : un rayon qui pâlirait
       * vers la pointe se lirait comme un rayon qui *s'arrête*, or celui-ci va
       * jusqu'au mur.
       *
       * `at` est une fraction de `halfWidth` — les bandes se peignent de la
       * plus large à la plus étroite, donc l'ordre de cette liste compte.
       */
      bands: [
        { at: 1, tint: 'edge', alpha: 0.9 },
        { at: 0.9, tint: 'shadow', alpha: 0.92 },
        { at: 0.68, tint: 'body', alpha: 0.95 },
        { at: 0.42, tint: 'light', alpha: 0.97 },
        { at: 0.18, tint: 'core', alpha: 1 },
      ],
      /**
       * **6 par tic, un tic toutes les 0,15 s** — inchangés, c'est la *durée*
       * qui a doublé. Sur 2,5 s de tir, cela fait jusqu'à **96 PV** contre 42
       * auparavant : de quoi tuer net un combattant de la norme qui resterait
       * dans l'axe du début à la fin. C'est de très loin l'attaque la plus
       * lourde du dépôt (le Séisme du Golem, le précédent pic, vaut 5), et
       * c'est assumé : elle s'annonce **2 s** à l'avance, elle cloue son
       * lanceur sur place pendant 4,5 s, et elle est désormais sa **seule**
       * façon de faire mal.
       */
      damage: 6,
      interval: 0.15,
      knockback: 90,
      /** Secousse de caméra au départ du tir, entre l'Onde sismique du Golem
       *  (5) et son Séisme (16). */
      shake: 11,
    },
  },

  /** Ni projectile, ni troisième créneau. */
  projectiles: {},

  /** Aucune stat évolutive : ses dégâts sont fixes (voir `weapon.melee`). */
  progression: { stack: 0, stack2: 0 },

  hud: {
    /**
     * **Ses deux horloges**, même choix que le Golem : il n'a pas de stat qui
     * monte, et ce qu'un spectateur a besoin de savoir, c'est *quand ça
     * chauffe* et *où en est le rayon*. L'état du rayon prime sur son compte à
     * rebours pendant la manœuvre — c'est le seul moment du duel où il faut
     * regarder ailleurs que la barre de vie.
     */
    stats: [
      (f) => `Warming: ${formatSeconds(Math.max(0, f.ability.timer))}`,
      (f) => `Solar Beam: ${f.ult.active > 0 ? (f.state.firing ? 'FIRING' : 'charging') : `${Math.floor(f.ult.charge)}%`}`,
    ],
    statsFr: [
      (f) => `Réchauffement : ${formatSeconds(Math.max(0, f.ability.timer))}`,
      (f) => `Rayon : ${f.ult.active > 0 ? (f.state.firing ? 'TIR' : 'charge') : `${Math.floor(f.ult.charge)} %`}`,
    ],
    /** Le clair du sprite : la ligne de stat est posée sur l'encre sombre du
     *  bandeau, elle doit donc rester dans le haut de la palette. */
    color: '#fbcf55',
  },
});
