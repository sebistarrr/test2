/**
 * Cartes de pixel-art du HORS-LA-LOI.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 * Les clés de ce registre sont ce que lisent les fiches (`head.sprite`,
 * `projectiles.*.sprite`, `icon`) et `assets/sprites/manifest.json`.
 *
 * @module data/pixelart/outlaw
 */

import { deepFreeze } from '../freeze.js';

/* ------------------------------------------------------------------
 * HORS-LA-LOI — **revolver de cristal**, transcrit de la maquette fournie.
 *
 * Même méthode que la lance électrique : le fichier est en RGB, le damier de
 * transparence est cuit dans les pixels, donc le premier plan est défini
 * **positivement** — violet/magenta saturé, contour très sombre, éclats très
 * clairs — et non par soustraction du damier, qui laisserait passer les traits
 * de séparation des cases.
 *
 * **La portée ne bouge pas.** `reach: 122` découle de
 * `handle.length + map.w × scale` = 37 + 85 × 1. La carte passe de 34 × 15 à
 * `scale: 2,5` (85 × 37,5 px dessinés) à **85 × 46 à `scale: 1`** : même
 * largeur dessinée, deux fois et demie plus de détail, et un rapport d'aspect
 * qui suit enfin celui de l'artwork (1,84 contre 2,27 pour l'ancienne carte).
 *
 * La réduction passe par une moyenne d'aire avec **alpha prémultiplié** : sans
 * ça, elle mélangerait le RGB des pixels transparents — du noir — à celui de
 * l'arme, et toute la silhouette ressortirait assombrie.
 * ------------------------------------------------------------------ */
export const OUTLAW_REVOLVER = deepFreeze({
  w: 85,
  h: 46,
  palette: {
    0: '#0c1a20',
    1: '#142b36',
    2: '#1e3b49',
    3: '#264b5c',
    4: '#2f5a6d',
    5: '#376b82',
    6: '#417e9a',
    7: '#4f94b3',
    8: '#71a2b9',
    9: '#68b0d1',
    a: '#8abcd2',
    b: '#92cce6',
    c: '#b5dff2',
    d: '#cfebf7',
    e: '#f2f9fd',
    f: '#f7f8f8',
  },
  rows: [
    '..................450..................................................22............',
    '..................34433.......................................7.......0cd............',
    '..................1111110...........................9...7a9..bc......48573...........',
    '.................47777bcca8abccaaaaaa661..........9cb..9ccc.ac6..214764353...........',
    '.......178a5...005a4455555555555555666531452233217cb625b952796233222222232...........',
    '........257a865537644100001111111108777428a156666b96559964677778888b8aaaa8...........',
    '..........3556536843111514457797760ecca51321342699634454444444222222433223..97.......',
    '...........46425a642162726768888860c888511244565646778aaaaab852355554445564967b79....',
    '...........5525763414c3.268bcaacd41656552488735736999999bbcdef955abba46eeb255979eebb.',
    '..........25158643415c3a38844444451333317999bc74859999abbcccddee46aaaabbb925649d..ecb',
    '.........015863334405737377467b9971222214799973534556677bb779ba45777757977367b69babb.',
    '......12777534444421452524688888a50222230257525159aaaaaa999aba4466774533773755.7.....',
    '.....378556434444231331313445555530387422220032311111111111111111111422202..65.......',
    '.....34444355422672313131344456654034425213133334434444444444444444444442............',
    '.....03313444536764330031224667666026635201100000000000000000000000000001............',
    '......0011234347d9633322222222222223333312322346320460271162150312323460.............',
    '.........1223267db544333333333333454332133365697217812822a4151323424650..............',
    '.........0132356b96444444444445546433213379679825553144152151000111110...............',
    '.........01323266643443211111112443231316b77b911111001001001.........................',
    '.........013225344343311252....014421598793761.......................................',
    '.........113235534444113470.....033139b832...........................................',
    '........012326676544410258......034139b4.............................................',
    '........02218720044440..57......03403b7..............................................',
    '.......022351224212441..048....1261.02...............................................',
    '......01327134333214331...2...12650..................................................',
    '......14267343332243334444444575520..................................................',
    '.....03252433231242111245445553210...................................................',
    '....03244344822142101.2000000000.....................................................',
    '...0123524487222410..................................................................',
    '...03253445d5104310..................................................................',
    '..02343444bd111310...................................................................',
    '..14361437c6222310...................................................................',
    '.02343434bb221531....................................................................',
    '.15262339b7121410....................................................................',
    '.2542326b93122310....................................................................',
    '.264221a99321430.....................................................................',
    '0433128966121410.....................................................................',
    '1613168b76111520.....................................................................',
    '1634266995112420.....................................................................',
    '0673455851123310.....................................................................',
    '0478443451022310.....................................................................',
    '.145776444201310.....................................................................',
    '..12457787533210.....................................................................',
    '...00022456766520....................................................................',
    '........001345420....................................................................',
    '...........00000.....................................................................',
  ],
});

/* ------------------------------------------------------------------
 * HORS-LA-LOI — **balle de cristal**, composée d'après la maquette.
 *
 * **Composée et non transcrite, contrairement au revolver**, et c'est la
 * maquette qui l'impose : elle montre les munitions en **paquet**, six rounds
 * dont les pointes se chevauchent et forment une seule masse connexe. Aucun
 * recadrage rectangulaire n'en isole un, et une composante connexe en attrape
 * deux — les deux ont été essayés. Le projectile, lui, a besoin d'un round
 * seul.
 *
 * Le sprite est donc construit avec les **couleurs pipettées sur la maquette**
 * et son profil : culot, étui violet parcouru d'un cœur magenta, gorges
 * d'extraction, col, puis pointe de cristal effilée à arête claire. Les arêtes
 * de la pointe sont posées **explicitement** et non tracées par une formule —
 * c'est la leçon de la première lance de cuivre, où un exposant convexe avait
 * rendu une feuille arrondie là où il fallait une pointe.
 *
 * Encombrement : 30 × 9 à `scale: 1`. L'ancienne carte faisait 9 × 3 à
 * `scale: 3,2`, soit 28,8 × 9,6 : le projectile garde sa taille à l'écran. Sa
 * collision, elle, ne dépend pas du sprite — `projectiles.shot.radius: 8`.
 * ------------------------------------------------------------------ */
export const OUTLAW_SHOT = deepFreeze({
  w: 30,
  h: 9,
  palette: {
    K: '#071e29',
    d: '#0d3142',
    e: '#1c475b',
    m: '#3d96be',
    p: '#28779b',
    c: '#77b6d3',
    C: '#d4edf8',
    W: '#f2f9fd',
  },
  rows: [
    'KKKKKKKKKKKKKKKKKKKK..........',
    'ddeKeeeeeeeeeKepppCCKKKK......',
    'ddeKeeeeeeeeeKepppWWWWCCKKKK..',
    'ddpKmmmmmmmmmKppppccccWWWWWWKK',
    'ddmKmmmmmmmmmKmpppcccccccccccc',
    'dddKdddddddddKdeeeppppppppppKK',
    'dddKdddddddddKdeeeppppppKKKK..',
    'dddKdddddddddKdeeeppKKKK......',
    'KKKKKKKKKKKKKKKKKKKK..........',
  ],
});

/* ------------------------------------------------------------------
 * Icônes de titre du Hors-la-loi et du Bretteur.
 * Elles sont posées sur le fond sombre `#1c1a26` : elles doivent tenir par
 * leurs **valeurs claires**, un contour noir n'y dessine rien.
 * ------------------------------------------------------------------ */
export const ICON_REVOLVER = deepFreeze({
  w: 16,
  h: 16,
  palette: { K: '#13262f', S: '#94afbb', l: '#e6eff3', s: '#6c8d9d', W: '#5eadd1', w: '#377d9d' },
  rows: [
    '................',
    '................',
    '....KKKKKK......',
    '...KSSSSSSKKKKK.',
    '..KSllllllSSSSSK',
    '..KSllllllllllsK',
    '..KSllllllSSSSSK',
    '..KSSllllSSKKKKK',
    '..KSSSSSSSSK....',
    '.KWWWWWWSSSK....',
    '.KWWWWWWWWK.....',
    '.KWwwwwwWK......',
    '..KWwwwwWK......',
    '..KWwwwWK.......',
    '...KKKKK........',
    '................',
  ],
});
