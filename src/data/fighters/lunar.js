import { fiche } from '../defaults.js';
import { formatSeconds } from '../format.js';

/* ==========================================================================
 *  LUNE  (MOON) — le **second boss**, et le seul combattant sans arme qui gagne
 *
 *  Quatrième combattant **inventé** du dépôt. Aucune vidéo de référence, donc
 *  **aucune valeur ne peut porter `mesuré`** : tout y est `calé` ou `déduit`.
 *
 *  ------------------------------------------------------------------------
 *  **Trois demandes, dans l'ordre, et elles forment un seul personnage.**
 *
 *   1. *« Remplace le design de la balle par celui de l'arme »* — l'arme était
 *      trois petites lunes en orbite ; le corps prend donc le dessin d'une lune
 *      pleine. La maquette fournie avec la demande en porte une, criblée de
 *      cratères et cerclée de glace : c'est elle, `lunar-ball.png`. Les deux
 *      images précédentes (l'éclipse violette et la pleine lune cyan) sont
 *      **supprimées** — plus rien ne les lit.
 *   2. *« Supprime l'arme »* — et c'est le geste qui définit le personnage. Elle
 *      est le **second combattant du roster sans arme**, après le Mannequin :
 *      `reach: 0`, `hitbox.radius: 0`, aucun `head.sprite`. Elle ne peut pas
 *      toucher, jamais. Le Soleil avait déjà une couronne qui ne blesse pas ;
 *      elle n'a même plus la couronne.
 *   3. *« Revois l'ultime météorite pour le rendre plus impressionnant, effet
 *      chute de météorites »* — d'où **Pluie de météores**, treize pierres qui
 *      tombent sur quatre secondes sous un ciel noir. C'est devenu son ultime,
 *      à la place de l'Éclipse, dont il ne reste que la nuit d'arène : c'est
 *      elle qui fait lire les pierres.
 *
 *  **Ce que ça fait d'elle.** Le Soleil est planté et tire *une* ligne annoncée
 *  deux secondes à l'avance. LUNE ne touche rien, ne tire rien, n'a pas de
 *  portée propre : **tout son dégât tombe du ciel**, et sa seule décision est
 *  *où elle se trouve* quand elle l'appelle. Son corps n'est plus une arme, ce
 *  qui le rend libre d'être ce qu'il est — un obstacle de 176 px de diamètre qui
 *  bouscule, bloque et encaisse.
 *
 *  | | ☀️ SOLEIL | 🌙 LUNE |
 *  | --- | --- | --- |
 *  | arme | couronne à 8 branches qui ne blesse pas | **aucune** |
 *  | d'où vient le dégât | le faisceau, 79 % | **le ciel, 100 %** |
 *  | ce qui s'annonce | une ligne, 2 s | des zones au sol, 0,75 s chacune |
 *  | déplacement | 230 px/s, le plus lent | 430 px/s |
 * ========================================================================== */
export const LUNAR = fiche({
  id: 'lunar',
  /** Archétype traduit, comme SOLEIL/SUN et DRUIDE/DRUID. */
  name: 'LUNE',
  nameRef: 'MOON',
  tagline: 'Astre criblé — elle ne touche à rien, c’est le ciel qui tombe',
  taglineRef: 'Cratered star — it touches nothing; the sky does the falling',
  icon: 'iconLunar',
  /** **Rangée de l'écran de sélection**, et rien d'autre.
   *  Boss, comme le Soleil, et regroupé avec lui à l'écran de sélection. Clé lue
   *  par `ui/select.js` seul : le moteur ne la connaît pas. */
  tier: 'boss',

  /**
   * **280 PV** — et c'est **480 → 460 → 280** en trois versions, le chiffre le
   * plus instable de la fiche parce qu'il est le seul levier du duel des boss.
   *
   * La chute tient en une phrase : **elle ne prend plus aucun risque.** L'arme
   * supprimée, elle n'a plus jamais besoin d'être quelque part — tout son dégât
   * tombe du ciel sur un point qu'elle choisit à distance. Une barre de boss
   * *en plus* de ça rendait le duel imperdable (50/50 au banc avant calage).
   * 280 reste 2,8 fois la norme et se lit comme sa contrepartie : **le Soleil
   * est une forteresse (500 PV, il encaisse), elle est un bombardier.**
   *
   * Balayage **monotone**, 25 graines × les deux camps (elle gagne, sur 50) :
   * 250 → 13, 285 → 16, 320 → 21 avant le calage final des pierres ; à la
   * cadence définitive, **280 → 27/50**. Et c'est bien le seul levier qui
   * fonctionne : les dégâts par pierre et le rayon d'explosion ont tous deux
   * été balayés et **plafonnent** (à moitié moins de dégâts, elle gagnait
   * encore 28 fois sur 30), parce qu'ils déplacent sa production contre *tout
   * le monde* en même temps.
   *
   * Aucune réduction de dégâts, comme tous les autres : un seul chiffre porte
   * sa résistance, donc le banc n'a qu'un levier à tourner.
   */
  maxHp: 280,

  look: {
    /**
     * **88, fixe** — demandé (« conserve sa taille »), et c'est maintenant sa
     * seule présence physique : sans arme, son corps ne sert plus qu'à
     * **occuper l'espace**. Il bouscule (`resolveBodies` sépare tout le monde à
     * chaque pas), il bloque une ligne de tir, il encaisse. Le plus gros corps
     * du jeu, devant le Soleil (82).
     *
     * `f.sizeFactor` (compteur générique, invariant 7) reste écrit par l'ultime,
     * qui la gonfle de 12 % le temps de l'averse — elle inspire avant de faire
     * tomber le ciel. C'est de la mise en scène, pas du gameplay : n'ayant plus
     * d'arme, grossir ne lui donne rien d'autre que de la place.
     */
    radius: 88,
    /**
     * **Cinq bandes de luminance relevées sur `lunar-ball.png`** (3ᵉ · 20ᵉ ·
     * 50ᵉ · 80ᵉ · 97ᵉ centile des pixels opaques), la méthode du Soleil — plus
     * **une sixième teinte**, et elle est la plus importante.
     *
     * La lune est **grise** : c'est ce que dit la mesure. Sa couleur à elle est
     * autour d'elle — le **halo de glace `#9df6fb`**, relevé séparément sur la
     * planche parce qu'il a été **coupé du sprite exprès**. Même raisonnement
     * que le halo pêche du Soleil : un halo cuit dans l'image serait figé, celui
     * du jeu bat. `glow` est donc la seule teinte que le module dépense
     * largement — traînées, anneaux d'impact, couronne d'ultime.
     *
     * Source unique, comme pour le Soleil : le module n'a **aucun littéral de
     * couleur**, et les cinq cartes de `pixelart/lunar.js` recopient les cinq
     * bandes.
     */
    palette: {
      edge: '#1a2632', // encre du contour
      shadow: '#2f3c48', // ombre
      body: '#5f6d77', // la pierre — teinte médiane du corps
      light: '#98aab3', // arêtes éclairées
      core: '#d8f8fc', // blanc de glace des crêtes
      /** Le halo, relevé hors sprite. Sa couleur, au sens où l'orange est celle
       *  du Soleil : c'est elle qu'on voit quand elle agit. */
      glow: '#9df6fb',
    },
    /**
     * **Le corps prend le dessin de l'ancienne arme — demandé.**
     *
     * Il était la face d'éclipse ; l'arme était une petite pleine lune. La
     * demande inverse les deux, et la maquette fournie donne la pleine lune à
     * garder : criblée, contrastée, cerclée de glace.
     *
     * **Et ça ne coûte pas de lisibilité, c'est mesuré** : contraste médian
     * contre l'arène blanche **5,32**, avec **9 %** de pixels sous le seuil de
     * visibilité. L'éclipse qu'elle remplace tenait 6,51 / 16 % ; la *première*
     * pleine lune du dépôt, elle, ne tenait que **1,54 / 48 %** — c'est
     * précisément pour ça qu'elle n'avait jamais pu être un corps, et pourquoi
     * c'est la lune de la nouvelle planche qui prend la place et non l'ancienne.
     *
     * Pas de `spriteScale` : le PNG est découpé à son **disque** (cercle ajusté
     * sur la maquette, 262 × 262), il remplit exactement son cadre, la
     * correction vaudrait 1 — et une clé qui recopie son défaut est une occasion
     * de divergence silencieuse.
     */
    sprite: 'lunarBall',
    /** Le voile d'encaissement se **pose par-dessus** le dessin au lieu de le
     *  remplacer (sinon chaque coup effacerait la lune). Plus discret que celui
     *  du Soleil : le corps est sombre, un voile clair y ressort davantage. */
    spriteFlash: 0.5,
    body: '#5f6d77',
    /** **Il éclaircit au lieu d'assombrir** — l'inverse du roster. Sur un corps
     *  de pierre sombre, un flash sombre ne se verrait pas ; c'est la même
     *  compensation que le Mannequin, qui rougit au lieu de blanchir. */
    bodyHit: '#d8f8fc',
    outline: '#1a2632',
    outlineWidth: 6,
    /**
     * **Chiffre de PV cerné.** Sous l'empreinte des digits cohabitent l'encre
     * des cratères et le blanc des crêtes — aucune encre unique ne tient sur les
     * deux. Même situation que le Soleil (53 % clair / 40 % sombre), qui avait
     * forcé l'apparition de `hpStroke`. Le contour isole le chiffre au lieu
     * d'essayer de composer.
     */
    hpColor: '#d8f8fc',
    hpStroke: '#1a2632',
    /**
     * **Le halo de glace de la maquette, rendu au jeu plutôt que cuit dans
     * l'image.** Il est sur la planche, autour de la lune comme autour de chaque
     * astéroïde ; il a été coupé au détourage pour que le jeu le fasse **battre**
     * au lieu de le figer. Même raisonnement que pour le halo pêche du Soleil.
     */
    aura: { color: 'rgba(157,246,251,0.42)', radius: 1.14, pulse: 0.5, showWhen: 'always' },
    flair: {
      motes: { rate: 12, size: 8, drift: 18, rise: -14, colors: ['#d8f8fc', '#9df6fb', '#98aab3'] },
      impact: ['#d8f8fc', '#ffffff', '#9df6fb'],
      shape: 'spark',
      castFlash: 'rgba(157,246,251,0.55)',
    },
    trail: { color: 'rgba(95,109,119,0.22)', every: 0.05, life: 0.4 },
    accent: '#9df6fb',
  },

  sound: {
    pitch: 0.62,
    shot: null, // aucun projectile : les météores sont tenus par son module
    /**
     * **Le glas, et c'est le fracas des grosses pierres** — celles de l'ultime,
     * qui passent `sound: 'hit'` dans `game.damage`. Sans ce branchement la
     * recette serait morte le jour où l'arme a été supprimée : *une recette
     * meurt quand le créneau qui la nommait cesse d'être joué*, piège déjà payé
     * sur `scorch` quand la couronne du Soleil a cessé de blesser.
     */
    hit: 'knell',
    /** Le choc sec des météores du **pouvoir**, joué à l'atterrissage. Deux
     *  tailles de pierre, deux bruits : c'est ce qui les distingue à l'oreille
     *  quand les deux tombent en même temps. */
    impact: 'impact',
    bounce: 'thud',
    /** Le sifflement du départ. Voir `data/sound.js`. */
    ability: 'hail',
    special: null,
    ultimate: 'umbra',
  },

  /**
   * **430 px/s — et c'est le chiffre qui la sépare le plus du Soleil.**
   *
   * Lui est **planté** (230, le plus lent du roster de très loin) parce que
   * toute sa production passe par un faisceau qu'il tire à l'arrêt. Elle n'a
   * rien à viser et rien à tirer : ses météores partent vers la position de
   * l'adversaire, pas depuis elle. Sa vitesse ne sert donc pas à toucher, elle
   * sert à **ne pas se faire acculer** — sans arme, se faire coller est sa seule
   * vraie défaite.
   *
   * `turnRate` 1,5 : au-dessus du Soleil (1,0), sous les tireurs (1,9 · 2,0).
   * Elle vire mal pour un mobile, ce qui est la contrepartie de sa masse.
   */
  movement: { speed: 430, turnRate: 1.5, seek: 0.38 },

  /* ---------- ARME — aucune ---------- */
  /**
   * **Elle n'en a pas — demandé** (« supprime l'arme »), et c'est le second cas
   * du dépôt après le Mannequin.
   *
   * Le bloc reprend sa géométrie **vide**, qui est plus sûre que des dégâts à
   * zéro : `weaponHit` compare la distance de la cible au segment tranchant ;
   * avec `from`/`to` à 0 ce segment se réduit au pivot, et avec `radius: 0` la
   * condition devient « le centre adverse est à moins de son propre rayon du
   * centre de LUNE » — or `resolveBodies` maintient les deux corps séparés d'au
   * moins la somme des rayons. La condition est **structurellement
   * impossible**, pas seulement inoffensive.
   *
   * **Ce que ça coûte, et c'est énorme** : l'anneau de débris portait **60,5 %**
   * de sa production. Le supprimer ne la diminue pas, ça la **retourne** — c'est
   * exactement ce que le Soleil a vécu quand sa couronne a cessé de blesser, et
   * la leçon qui en reste est que le levier de rattrapage n'est pas la *taille*
   * de ce qui subsiste mais sa **fréquence**. D'où un pouvoir à 2,6 s au lieu de
   * 3,2 et un ultime qui lâche treize pierres au lieu d'une onde.
   *
   * **Et ça reste du gameplay malgré tout** : `resolveMelee` n'a plus rien à
   * appliquer, mais le corps, lui, bouscule toujours. Un obstacle de 176 px qui
   * avance à 430 px/s n'est pas un détail de mise en scène.
   */
  weapon: {
    /** Le nom sert la carte de sélection, qui affiche toujours une ligne
     *  « Arme » — mieux vaut y lire « aucune » qu'un vide. */
    name: 'Aucune',
    nameRef: 'None',
    reach: 0,
    spin: 0,
    spinDir: 1,
    handle: { length: 0, width: 0, color: '#5f6d77', dark: '#2f3c48', outline: '#1a2632', gem: null },
    /** **Pas de sprite.** `drawWeapon` retombe sur son garde (rien à dessiner)
     *  et `ui/select.js` sur sa chaîne de repli, qui prend l'icône. */
    head: { sprite: null, scale: 1 },
    hitbox: { from: 0, to: 0, radius: 0 },
    melee: {
      /** Zéro, par ceinture et bretelles : si un mécanisme faisait quand même
       *  passer un contact, il ne retirerait rien — `Match.damage` sort avant
       *  tout effet quand le montant arrondi vaut zéro. */
      damage: 0,
      /** Jamais consommé (aucune touche possible), mais lu à la construction du
       *  `Fighter` : une valeur finie évite un `Infinity` qui se propage. */
      cooldown: 1,
      knockback: 0,
      selfRecoil: 0,
    },
  },

  /* ---------- POUVOIR — Météores ---------- */
  /**
   * **Trois pierres tombent sur la cible, toutes les 2,6 s.**
   *
   * C'est devenu sa **seule production continue** depuis que l'arme a disparu,
   * d'où la cadence resserrée (3,2 → 2,6 s) et la pierre plus lourde (6 → 11).
   * Le premier caillou tombe sur la position de l'adversaire **à l'instant du
   * tir**, les deux autres à `spread` de là — viser la position courante et non
   * une position anticipée est délibéré : le pouvoir n'est pas censé toucher qui
   * bouge, il est censé **interdire de s'arrêter**.
   *
   * **Annoncé, et c'est la différence avec le Soleil.** Lui trace *une ligne* et
   * fige son axe : on s'en sort en sortant de la ligne. Elle sème **des zones**
   * autour d'une cible mobile : on s'en sort en continuant de bouger.
   *
   * **Aucun tirage** — invariant 2. Le semis est déduit de `ability.uses` par
   * l'angle d'or, donc deux salves ne se superposent jamais et deux duels à la
   * même graine creusent les mêmes cratères.
   */
  ability: {
    id: 'meteors',
    name: 'Météores',
    nameRef: 'Meteors',
    /** Calé, et resserré avec la suppression de l'arme : 3,2 → 2,6 s. Elle n'a
     *  plus que ça entre deux averses. */
    cooldown: 2.6,
    count: 3,
    /** Rayon du semis autour de la cible. Le premier caillou tombe **sur** elle,
     *  les deux autres à 92 px — assez pour que reculer droit devant n'en évite
     *  pas deux d'un coup. */
    spread: 92,
    /**
     * **Temps de chute, donc temps d'esquive — et le second levier asymétrique
     * de la fiche.**
     *
     * Il valait 0,75 s. Relevé à cette valeur : elle produisait **1,3 à 3,0
     * PV/s** contre les six (qui sortent du cercle en marchant) et **13 PV/s**
     * contre le Soleil, le plus lent du roster. Aucun réglage global ne pouvait
     * corriger ça — la baisser la faisait perdre contre les six *avant* de la
     * faire perdre contre lui. À **0,45 s**, la fenêtre ne suffit plus à un
     * rapide qui ne regarde pas le sol : 3,0 à 5,6 PV/s contre les six, et le
     * Soleil, lui, ne gagne presque rien (il prenait déjà tout).
     *
     * C'est court, et c'est quand même une annonce : le cercle se resserre, le
     * disque d'ombre grossit, la pierre entre dans le cadre. Le Soleil, lui,
     * annonce 2 s — mais il annonce *une ligne* qui traverse l'arène.
     */
    fall: 0.45,
    /**
     * **Anticipation, en fraction du temps de chute** — la pierre vise là où la
     * cible *sera*, pas là où elle est.
     *
     * C'est le seul réglage qui sépare un adversaire rapide d'un adversaire
     * lent, et c'est pour ça qu'il existe : sans lui, le taux de touche ne
     * dépend que de la vitesse de la cible, donc elle écrasait le Soleil (230
     * px/s, il prend tout) et perdait contre l'Hoplite (jusqu'à 1118 px/s en
     * charge, il ne prend rien) — l'inverse exact de sa spécification. Mener la
     * trajectoire d'un lent ne déplace presque rien ; mener celle d'un rapide
     * déplace tout.
     *
     * Conséquence de jeu, et c'est la bonne : on n'esquive plus en
     * **continuant** de courir, on esquive en **changeant de direction**.
     */
    lead: 0.5,
    /** Décalage entre deux pierres d'une même salve. Sans lui les trois touchent
     *  **dans le même pas**, donc un seul fracas (`MIX.repeatGap`) et une gerbe
     *  unique : la salve se lisait comme un unique gros coup. */
    stagger: 0.15,
    /**
     * **Hauteur apparente du départ, en px de scène — et elle est basse
     * exprès.** À 330, la pierre passait les trois quarts de sa chute **au-delà
     * du bord haut de l'arène**, donc invisible : `drawOver` est clippé au
     * cadre. On ne voyait qu'un cercle au sol et un caillou qui apparaît. À
     * 210, toute la chute tient dans l'image.
     */
    height: 210,
    /** Diamètre dessiné. Moins que les pierres de l'ultime (64) : on doit lire
     *  d'un coup d'œil laquelle des deux averses est en train de tomber. */
    size: 46,
    /** Par pierre. Trois par salve, mais on n'en prend normalement qu'une. */
    damage: 14,
    /**
     * **Rayon d'explosion, mesuré de *centre à centre* — le seul écart du
     * dépôt**, et il est double :
     *
     *  • le cercle est **dessiné au sol**, donc il doit dire la vérité. En bord
     *    à bord, un combattant debout à 100 px d'un cercle de 78 prendrait quand
     *    même le coup ;
     *  • en bord à bord, **un gros corps est puni deux fois** : la surface de
     *    capture vaut `(blast + rayon)²`, soit deux fois plus pour le Soleil
     *    (rayon 82) que pour la norme (41). Relevé avant correction : **44
     *    touches par duel contre lui** pour 9 contre tous les autres.
     *
     * Voir le détail dans `game/abilities/lunar.js`, à `impact()`.
     */
    blast: 78,
    knockback: 170,
    /**
     * **Secousse d'impact, volontairement petite.** Trois pierres décalées de
     * 0,15 s font une secousse continue d'une demi-seconde ; or le décor ne
     * tremble pas (invariant 4, voulu) alors que son contenu tremble sous le
     * clip, donc une secousse franche découvre un liseré d'arène nue au bord.
     * 2,2 la laisse sous le pixel, et la touche en ajoute déjà une.
     */
    shake: 2.2,
    ring: { time: 0.42, width: 6 },
  },

  /* ---------- ULTIME — Pluie de météores ---------- */
  /**
   * **Vingt-cinq pierres, trois secondes, sous un ciel noir — demandé** (« revois
   * l'ultime météorite pour le rendre plus impressionnant, effet chute de
   * météorites »).
   *
   * Il remplace l'Éclipse, dont **seule la nuit d'arène subsiste** — et elle
   * n'est plus décorative : c'est elle qui fait lire les pierres. Une averse de
   * cailloux gris sur une arène blanche ne se voit pas ; sur une arène éteinte,
   * chaque météore est une lumière qui descend.
   *
   * Trois temps, et chacun a un travail :
   *
   *  1. **1,1 s d'annonce.** La nuit tombe, LUNE gonfle de 12 %, et **des
   *     pierres se détachent d'elle** et montent hors du cadre. C'est la chaîne
   *     causale qu'il fallait rendre visible : le ciel ne tombe pas tout seul,
   *     c'est *elle* qui le lâche.
   *  2. **3,2 s d'averse.** Une pierre **toutes les 0,13 s** — vingt-cinq en
   *     tout, trois ou quatre en l'air en permanence, semées autour des
   *     adversaires sur 200 px. Elles sont plus grosses (64) que celles du
   *     pouvoir et sonnent le **glas** là où celles-ci font un choc sec.
   *
   *     **La densité est le sujet, pas la puissance.** À la première écriture
   *     elles tombaient toutes les 0,26 s et frappaient à 15 : treize pierres,
   *     une seule en l'air à la fois, et ça se lisait comme un pouvoir un peu
   *     plus rapide. Doublées en nombre et divisées par deux en dégâts
   *     (0,13 s / 8), la production est la même au banc et **l'image n'a rien à
   *     voir** — c'est une averse.
   *  3. **0,6 s de reprise.** La nuit se lève, le corps redescend.
   *
   * Elle **rampe** pendant toute la manœuvre (`channelSpeed`) : elle appelle le
   * ciel, elle ne court pas en même temps. C'est la contrepartie, et c'est la
   * même que celle du Soleil, en moins brutale — il est cloué, elle ralentit.
   */
  ultimate: {
    id: 'meteorStorm',
    name: 'Pluie de météores',
    nameRef: 'METEOR STORM',
    barLabel: 'METEOR STORM',
    barLabelFr: 'PLUIE DE MÉTÉORES',
    barFill: '#5f6d77',
    barText: '#d8f8fc',
    /** Horloge de 9 s, contre 7 au Soleil. 7 et 9 sont premiers entre eux : les
     *  deux ultimes ne retombent en phase que toutes les 63 s, donc deux duels
     *  de boss ne se ressemblent jamais tout à fait. */
    chargeRate: 100 / 9,
    chargeOnHit: 2,
    /** L'annonce : le temps que met la nuit à tomber et les pierres à décoller
     *  d'elle. */
    windup: 1.1,
    /** **Total, annonce comprise.** Le module lit `windup` pour savoir où il en
     *  est, exactement comme celui du Soleil. */
    duration: 5.2,
    /** Dernière fraction pendant laquelle la nuit se lève et le corps redescend.
     *  Sans elle, les deux basculeraient d'un pas à l'autre, ce qui se lit comme
     *  un défaut d'affichage. */
    settle: 0.6,
    /** Plus aucune pierre n'est semée pendant les 0,9 dernières secondes : avec
     *  0,7 s de chute, la dernière touche le sol juste avant que la nuit ne se
     *  lève. Sans cette marge, des météores tomberaient en plein jour. */
    tail: 0.9,
    /** Elle rampe : 55 % de sa vitesse, soit 237 px/s — au niveau du Soleil, et
     *  seulement pendant ces 5,2 s. */
    channelSpeed: 0.55,
    /** **Facteur de `sizeFactor` à l'averse** : 88 × 1,12 = 98,6 de rayon. Le
     *  seul lecteur du compteur générique. Discret exprès — sans arme, grossir
     *  ne lui rend rien, c'est de la mise en scène. */
    swell: 1.12,
    /** Une pierre toutes les 0,13 s : sur les 3,2 s d'averse utile,
     *  **vingt-cinq**, et trois ou quatre en l'air en permanence. */
    interval: 0.13,
    /** Rayon du semis autour des adversaires. Bien plus large que celui du
     *  pouvoir (92) : une averse doit couvrir une **zone**, pas poursuivre un
     *  point — sinon ce n'est qu'un pouvoir plus rapide. */
    spread: 200,
    /** Moitié moins qu'une pierre du pouvoir (14) : elles sont deux fois plus
     *  nombreuses et se recouvrent. Voir plus haut — la densité est le sujet. */
    damage: 8,
    /** De centre à centre, comme celui du pouvoir (voir `ability.blast`), et un
     *  peu plus large : une averse couvre, une salve pique. */
    blast: 86,
    /** Encore plus court que le pouvoir (0,45) : sous une pluie, on ne regarde
     *  plus les cercles un par un, on regarde où il n'y en a pas. */
    fall: 0.42,
    /** Même anticipation que le pouvoir (voir `ability.lead`), et il le
     *  faut : treize pierres qui tomberaient toutes derrière une cible
     *  rapide feraient un très joli ultime sans aucun effet. */
    lead: 0.5,
    /** Un peu plus haut que le pouvoir (210) : les pierres de l'averse entrent
     *  dans le cadre par le bord, ce qui donne le ciel. Au-delà de ~260 elles
     *  passeraient l'essentiel de leur chute hors du clip, donc invisibles. */
    height: 250,
    /** Plus grosses que celles du pouvoir (46), et c'est la moitié de
     *  l'impression : une averse de gros cailloux, pas de gravier. */
    size: 64,
    knockback: 210,
    /** Une secousse par pierre, un peu plus franche que celle du pouvoir mais
     *  toujours sous le seuil où le liseré de bord se voit. */
    shake: 3.4,
    /** Pierres qui se détachent d'elle pendant l'annonce. Purement dessinées :
     *  elles ne blessent pas, elles expliquent d'où vient l'averse. */
    lift: 5,
    ring: { to: 260, time: 0.6, width: 10 },
    /**
     * **La nuit, et c'est la mécanique de la chaleur du Soleil, en miroir.**
     *
     * Deux couches dans `drawUnder`, donc **sous** les combattants : un lavis au
     * sol et une nuit qui monte des quatre bords. La règle de composition de
     * `flair.js` est explicite — *rien entre le spectateur et les combattants* —
     * et une nuit d'arène est exactement le cas prévu : on remplit par le fond
     * et par les bords.
     *
     * **Plus forte que l'ambiance solaire** (0,54 / 0,78 contre 0,38 / 0,64) :
     * elle dure cinq secondes au lieu de monter lentement sur cinq, et surtout
     * c'est elle qui rend les pierres visibles. Les deux combattants et leurs
     * deux chiffres de PV restent lisibles à nuit pleine — le contour du chiffre
     * s'en charge.
     */
    ambience: { tint: 0.54, vignette: 0.78 },
  },

  projectiles: {},
  progression: { stack: 0, stack2: 0 },

  hud: {
    stats: [
      (f) => `Meteors: ${formatSeconds(Math.max(0, f.ability.timer))}`,
      /** **Les pierres tombées**, pas les salves tirées : une salve qui n'a rien
       *  touché a quand même creusé trois cratères, et c'est cette production-là
       *  qu'on veut lire. Même esprit que la ligne du Mannequin. */
      (f) => `Craters: ${f.state.impacts ?? 0}`,
    ],
    statsFr: [
      (f) => `Météores : ${formatSeconds(Math.max(0, f.ability.timer))}`,
      (f) => `Cratères : ${f.state.impacts ?? 0}`,
    ],
    color: '#9df6fb',
  },
});
