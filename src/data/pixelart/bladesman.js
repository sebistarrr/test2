/**
 * Cartes de pixel-art du BRETTEUR.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 * Les clés de ce registre sont ce que lisent les fiches (`head.sprite`,
 * `projectiles.*.sprite`, `icon`) et `assets/sprites/manifest.json`.
 *
 * @module data/pixelart/bladesman
 */

import { deepFreeze } from '../freeze.js';

/* ------------------------------------------------------------------
 * BRETTEUR — lame de braise, transcrite d'une maquette fournie
 *
 * Remplace le sabre dentelé mesuré sur la vidéo — écart demandé, comme la
 * lance électrique du Lancier. **Transcrite, pas redessinée** : la maquette
 * montre l'arme verticale, pointe de flamme en haut, garde ailée à gemme
 * rouge et poignée enroulée en bas. Méthode :
 *
 *   1. Détourage du fond en damier (la maquette n'a pas de vrai canal
 *      alpha) par seuil de gris, composante connexe la plus grande
 *      retenue — ça élimine les étincelles détachées de la flamme, qui
 *      auraient donné des pixels flottants sans lien avec la lame.
 *   2. Recadrage sur la garde + la lame seules : la poignée enroulée et le
 *      pommeau à gemme, tout en bas de la maquette, restent **hors carte**
 *      — exactement comme sur le sabre d'origine, où `handle.length: 45`
 *      ne dessine rien et laisse cette partie derrière la boule.
 *   3. Rotation 90° pour ramener la pointe **à droite**, la convention du
 *      dépôt (voir l'en-tête du fichier) — la maquette la montre vers le
 *      haut.
 *   4. Réduction par blocs (moyenne, comme `LANCER_SPEAR`) vers une grille
 *      96 × 35, puis quantification à 22 couleurs.
 *
 * La garde ailée sombre occupe les ~10 premières colonnes ; le reste est la
 * flamme, du rouge sombre à la base au jaune vif en pointe.
 * ------------------------------------------------------------------ */
export const BLADESMAN_FLAMEBLADE = deepFreeze({
  /**
   * **Repli seulement — le rendu réel passe par un PNG.** Les deux premiers
   * essais de manche (rectangle plein, puis chevron modélisé ci-dessous)
   * étaient encore une modélisation, pas la maquette elle-même — demande
   * explicite : « il ne faut pas modéliser l'arme ». `head.sprite` de
   * `bladesman` est donc servi par `assets/sprites/bladesman-flameblade.png`
   * (déclaré dans `assets/sprites/manifest.json`), un recadrage direct de la
   * maquette fournie — lame, garde et manche/pommeau en un seul morceau,
   * fond transparent, pointe tournée vers la droite. C'est un **écart à
   * l'invariant « aucun binaire dans le dépôt »** (voir `CLAUDE.md`),
   * délibéré et demandé.
   *
   * Cette carte texte n'est donc plus lue pour le rendu : elle reste comme
   * **repli automatique** si le PNG venait à manquer (`render/sprites.js`
   * retombe dessus tout seul), et `h` (35, lu par `fighter.js` pour la
   * hauteur dessinée) doit rester cohérent avec `weapon.head.scale` — `w`,
   * en revanche, n'est jamais lu pour la portée ni la hitbox, seulement
   * validé contre la longueur des lignes ci-dessous.
   */
  w: 136,
  h: 35,
  palette: {
    1: '#fada34', // jaune vif : pointe de flamme
    2: '#f6c224',
    3: '#f19c15',
    4: '#f88108',
    5: '#f67107',
    6: '#ac743e', // braise/fumée
    7: '#f55f07',
    8: '#f14c05',
    9: '#d24e15',
    A: '#89523c', // garde, bois/cuir sombre
    B: '#614f45',
    C: '#e02f04', // rouge sombre : base de la flamme
    D: '#cb1403',
    E: '#923121',
    F: '#ac0a05',
    G: '#960206', // gemme de la garde
    H: '#4a2824',
    I: '#281f22', // garde, presque noir
    J: '#500a15',
    K: '#12080a', // contour (partagé avec la manche)
    L: '#64000a',
    M: '#000000', // creux entre les langues de flamme
    N: '#1c1a24', // manche : cuir du chevron, ton de base — médiane de la maquette
    O: '#0a0910', // manche : creux du chevron — 5e percentile de la maquette
    P: '#3a3948', // manche : arête claire du chevron — 80e percentile de la maquette
  },
  rows: [
    '..................................................KK....................................................................................',
    '.................................................KKI..............B.....................................................................',
    '................................................IKB..............69A6A..................................................................',
    '............................................KKKLJIM.............6359AA6.................................................................',
    '...........................................KKLEJIA..............BABBA...................................................................',
    '.......................................KMMIEJJLJKI..............96EDCE..................................................................',
    '.....................................KKNMHELJJJKII.........BE6HA137EA96.AB..............................................................',
    '...................................KKOON.IHJIIKIBM........BE5E98439BBA9AA.............................BAB...............................',
    '.................................KKNNPOOKJIKKHAIH.........H9D5D73E59EABB66.......BBAB....BA..........B97EAAA............................',
    '...............................KKPONNNPOLJIKHIIIH.....HHI.ADFGC4H.BEEA.AE6....IA95334BBAA9AAA........A1379EA............................',
    '.............................KKNNNPONNNPJJKHIHBB....HDFL.KDFGGC5K..........II5458822BAJB66..........A33AAA..............................',
    '...........................KKNPONNNPONNNIIIIIBBIKMKGFLFEHDFGGLDC8HHK....KH958C4CD22K.............IAE31213AB..............AAB............',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKKKNNNPONNNPONNKMHIHIKIJJGGLLLFFGLLGGDDC8777545448DD9FF8421K........KK323733721HAB.............A559A...........',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKNPONNNPONNNPONMIIAIKKHLLGGLGGLLLGGFFDCFFC87778CCCDDCCCDC4311HMMMMB2234885C731K........IIIIH..63234EEEA........',
    'NNNPONNNPONNNPONNNPONNNPONNNPONNNPONNNPOKIAIIKIIJJLLLLLGGLLGGLGDCFFDFFFFFCDD77558CC74322334478C844888416M....BA11111112AAABA9EBB........',
    'ONNNPONNNPONNNPONNNPONNNPONNNPONNNPONNNPIB6IIIHIIHJJIIJLJJLLGFFFFFCFDFDCCDFCCCCCC88D8877778C87424457C84211HH11433333222116HB....AAAA....',
    'PONNNPONNNPONNNPONNNPONNNPONNNPONNNPONNNJJJABK37FIIIHHHHHHBBAGFCFFFFFDCFFC858CCC788CD87DD8875337534458854333333444444432211AHJJE9557EB..',
    'POONNPOONNPOONNPOONNPOONNPOONNPOONNPOONNJJEFJ1B27DF999FFGGJHBA66DFFCFFFFCCCCCC8CC8888DDD77887788C8743358775434555453221222222444424779A.',
    'PONNNPONNNPONNNPONNNPONNNPONNNPONNNPONNNJJLH6K3DFLIIJJIIHHHBBEFFDDDFDCCCCCCCCFFD88888887888C8CCCCCC7545733345773336MMMM3112111125AEBAAEB',
    'ONNNPONNNPONNNPONNNPONNNPONNNPONNNPONNNPIAAIIHEJIHIJIIHLJHGFDDDDDFDCFFDCCCCDFC77888844888D85C5433378845555754412B..........IKKKKA.....AB',
    'NNNPONNNPONNNPONNNPONNNPONNNPONNNPONNNPOKIAIIKBIJJLLLJLGGDDDFCCDDFFFDDDD8CDFC8887CC85854775C422223223532232211A.........................',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKNPONNNPONNNPONMII6IIIJLLLGLLLGFFGLLLLFCDFGFDFFFF8444444458CC834CC41BI...II11122211B...........................',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKKKNNNPONNNPONNKKHIAIIBJLLLGGLGGLLDCCCGFDFDFFDC854433HHH6234CCC45832...JAA...IIIHII............................',
    '..........................KKKNPONNNPONNNIKHIMBHIIMJGGLLDGGD88778DDDDCCF854AM.......KA33555C823363E3A....................................',
    '...........................KKKKNNNPONNNPKJKHIBBB...IFGLFFD9BBBBA5C75FDCC43B..A........MA22244116BBEEB...................................',
    '.............................KKKKPONNNPOJJIHHKIIK...KEGGDCBBBBBBBB9445CC81AHA9A..6A......A934AAAEAA.....................................',
    '...............................KKKKNNPOOKLIMIBBHH....HEFGD9HEABBBBB4EBB775215ABBAAA.......A13559E6A.....................................',
    '.................................KKKKOON.IIIKIKIBM.....IEDC8756BBBBA6B.EE5239AE9EE.........A329A........................................',
    '...................................KKKKNKBLJIHHKHK.......JA6ABJB36BBBLA..B92259AABB.........AAA.........................................',
    '.....................................KKKKKEEJHJIII..............A19EA.....AE9EA.............69AE........................................',
    '.......................................K...KILEJIB..............AEEA.........................AAB........................................',
    '............................................KJHLJHK.....................................................................................',
    '................................................IKH.....................................................................................',
    '.................................................KHI....................................................................................',
    '..................................................MI....................................................................................',
  ],
});

/**
 * **Roue de flamme — effet d'incantation de BLADE RUSH, demandé.**
 * Remplace l'anneau plein (`game.fx.ring`) qui marquait jusqu'ici le
 * déclenchement de la ruée : un moyeu à rayons et gemme centrale, cerné de
 * langues de flamme irrégulières et de grains de cendre — pas une
 * transcription, une conception originale, sur la même grille de pixels que
 * le reste du roster. Carré (`drawSpriteCentered`, pas d'orientation) :
 * treize langues à longueur/largeur tirées d'une graine fixe, donc identiques
 * à chaque duel — l'irrégularité vient du dessin, pas d'un tirage en jeu (qui
 * consommerait `game.rng` ou `game.viewRng` selon où il est posé). Voir
 * `abilities/bladesman.js` (`_drawRushWheel`) pour l'animation : échelle et
 * opacité seules bougent, jamais la carte elle-même.
 */
export const BLADESMAN_FLAMEWHEEL = deepFreeze({
  w: 48,
  h: 48,
  palette: {
    1: '#fada34',
    2: '#f6c224',
    3: '#f19c15',
    4: '#f88108',
    5: '#f67107',
    7: '#f55f07',
    8: '#f14c05',
    9: '#d24e15',
    C: '#e02f04',
    D: '#cb1403',
    G: '#960206', // gemme centrale du moyeu
    H: '#2a1710', // moyeu, bois sombre
    A: '#89523c', // rayons du moyeu
    K: '#12080a', // contour
    S: '#3a322e', // cendre sombre
    T: '#6e6458', // cendre claire
  },
  rows: [
    '................................................',
    '................................................',
    '................................................',
    '................................................',
    '................................................',
    '................................................',
    '.........................1......................',
    '..................1......22.....................',
    '..................12.....33..........T..........',
    '..................32......44.....1..............',
    '..................44S....7S5...S21..............',
    '..................45....S77S...33...............',
    '..................57T...888....44...............',
    '...........11.....788..9999....55...............',
    '............2.....899C.CCC....877...............',
    '............34....CCCDDDDDK.DC988...............',
    '............445889DKDHHHHHHKDCC9...75433211.....',
    '..............789CDHH...A..HHDC...875543........',
    '................CDHA.KKKKKK..HK..9887...........',
    '................KH.AKHHHHHHKAAHKC998............',
    '.........34579C.KH.KHHHHHHHHK.HDDC9.............',
    '......11235789CDH.KHHHHHHHHHHK.HDC..............',
    '.............9CDH.KHHHHKKHHHHK.HD.....43........',
    '............S.CDHAKHHHKGGKHHHK.HDC9S754321......',
    '...............KHAKHHHKGGKHHHKAHDC98755.........',
    '.........45...CDH.KHHHHKKHHHHK.HDC987...........',
    '........345789CDH.KHHHHHHHHHHK.HK...............',
    '...T..123..789CCDH.KHHHHHHHHK.HDD...T...........',
    '......1....S.99.DHAAKHHHHHHKA.HDC9S75...........',
    '................DDH..KKKKKK.AHDC998554..........',
    '............T..CCDDHH..AA..HHDCC....43..........',
    '..........T....99C.DDHHHHHHKDCC99....32.........',
    '.........S....8899.CDDKKDDD..C988.....1.........',
    '..............778.99CC..99C...877.....S.........',
    '............45578.8T9..888....755...............',
    '........T.23345...888..77......44...............',
    '........S123......777..544.....33...............',
    '...................55...33.....321..............',
    '...................44....21.......1.............',
    '...................33.....1.....................',
    '...................23...........................',
    '..................1.............................',
    '.......................T........................',
    '............................S...................',
    '................................................',
    '................................................',
    '................................................',
    '................................................',
  ],
});

/** Icône du Bretteur, **dérivée de `BLADESMAN_FLAMEBLADE`** et non redessinée
 *  — même précaution que `ICON_LANCE` (voir sa note), qui avait divergé de
 *  l'arme trois fois de suite pour avoir été retouchée à la main. La grille
 *  96 × 35 est tournée à 40° puis réduite au plus proche voisin (pas de
 *  lissage : un dégradé ferait fuiter les couleurs du fond transparent), en
 *  réutilisant exactement les teintes de la lame. */
export const ICON_SABRE = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    a: '#fada34',
    b: '#89523c',
    c: '#f19c15',
    d: '#614f45',
    e: '#f6c224',
    f: '#d24e15',
    g: '#923121',
    h: '#f88108',
    i: '#ac743e',
    j: '#f55f07',
    k: '#e02f04',
    l: '#cb1403',
    m: '#f14c05',
    n: '#500a15',
    o: '#ac0a05',
    p: '#f67107',
    q: '#281f22',
    r: '#4a2824',
    s: '#960206',
    t: '#000000',
  },
  rows: [
    '................',
    '..............ab',
    '.............cd.',
    '............ceb.',
    '........fgacb...',
    '........h.hi....',
    '......g.jjhcd...',
    '.....e.klc......',
    '....hmlmhn......',
    '...gllolp.......',
    '.qrsloj.........',
    'gdnrdl.i........',
    'nqnqolbf........',
    '.bdn............',
    '..tqq...........',
    '...q............',
  ],
});
