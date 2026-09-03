/**
 * Cartes de pixel-art du Mage.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 * Les clés de ce registre sont ce que lisent les fiches (`head.sprite`,
 * `projectiles.*.sprite`, `icon`) et `assets/sprites/manifest.json`.
 *
 * @module data/pixelart/mage
 */

import { deepFreeze } from '../freeze.js';

/**
 * Corolle du Mage — la corolle de la Plante, repeinte.
 *
 * Elle **partageait** le tableau `rows` de `FLOWER` plutôt que de le recopier,
 * pour qu'aucune des deux ne puisse dériver de l'autre. La Plante supprimée,
 * il n'y a plus de second exemplaire dont diverger : le dessin est recopié ici,
 * et c'est maintenant le seul.
 */
export const MAGE_FLOWER = deepFreeze({
  w: 11,
  h: 11,
  rows: [
    '...KK.KK...',
    '..KppKppK..',
    '.KpppppppK.',
    'KpppPPPpppK',
    'KppPPywPppK',
    'KppPyyyPppK',
    'KppPPyyPppK',
    'KpppPPPpppK',
    '.KpppppppK.',
    '..KppKppK..',
    '...KK.KK...',
  ],
  palette: {
    K: '#0a1a0f', // contour
    p: '#38cd65', // pétale
    P: '#1f964d', // pétale à l'ombre
    y: '#97e0a0', // cœur clair
    w: '#e8fff0', // point de lumière au cœur
  },
});


/* Sceptre de sève — transcription de la maquette fournie.

 * La maquette est un pixel-art exporté à 6,5 px par pixel d'art : le damier de
 * transparence fait 13 px, soit exactement deux pixels d'art, et c'est lui qui
 * a donné l'échelle. Retour à la grille native par un `BOX` exact (72 x 158
 * pour l'image entière), puis découpe du sceptre : 33 x 139.
 *
 * **La carte est tournée d'un quart de tour** pour que le cristal pointe vers
 * la droite : `drawSpriteLeft` blitte depuis le manche vers la pointe, donc
 * l'axe de l'arme est l'axe des x.
 *
 * **Puis réduite de moitié**, à 70 x 17, pour être dessinée à `scale: 2`. À
 * l'échelle 1 le sceptre tenait dans 139 px d'écran avec un pixel d'art par
 * pixel d'écran : la hampe se réduisait à un trait et le cristal à une tache,
 * là où tout le roster dessine ses armes à 2 ou 3. La réduction est un vote
 * majoritaire par bloc 2 x 2, le cristal l'emportant sur le bois — sans quoi
 * ses quelques cellules brillantes disparaîtraient sous la majorité. */
export const MAGE_STAFF = deepFreeze({
  w: 70,
  h: 17,
  palette: {
    K: '#1b1a1d', // contour, presque noir
    D: '#2d2a27', // écorce dans l’ombre
    E: '#234a32', // feuillage sombre
    F: '#483b33', // bois dans l’ombre
    b: '#3d6c3c', // liane
    c: '#684f3f', // bois
    d: '#1f964d', // cœur du cristal
    e: '#5b605e', // bois délavé (bord)
    G: '#58914e', // feuille éclairée
    H: '#8d6e50', // bois éclairé
    I: '#38cd65', // cristal
    L: '#7eb380', // feuille en pleine lumière
    M: '#97e0a0', // éclat du cristal
  },
  rows: [
    '..........................................................LGM.........',
    '.................................................M....c.H.............',
    '....................................................FFFHFK............',
    '....................................................D.FeDFFFc.........',
    '...............................................b.cFDFDHDFHHcHc........',
    '........eb.....e...................EEE.b......E.DbbDDcDFHHcGdGcLLML...',
    '......bKEbEEF.D.bEEK..............cDeeK..DFKDFDeDcDKHDDFccddIIMMM.....',
    '.DDFKccDDDKGKDFcDbKKcDGDFFFDDFKKFcDbbFcEKKDDcKFDEDcFdEcDcddIIIMMM.....',
    '.FccKKDKFDKKGDFDcFbDKcFGEDccFccDDFbFcbKDGcEKFFKcKKKcbbcFcddIIIdddM....',
    '...eDFK.KEKKKeFDKKFEbEFDKF.eFeF..DKEK.EFDEDKFcDKFcKKccDFHcddddddM.....',
    '...........E..Ebe...b...................Eb..FEKFe..DDcKFHHcbddbLL.....',
    '.......................................GG.bGbK...FKFFDFFcHHcbcHH.IL...',
    '.........................................G........FeDKHDDFFKcF........',
    '....................................................F.FHeD..e.........',
    '.....................................................ecDHH.....L......',
    '..............................................................ML......',
    '......................................................................',
  ],
});

/* Orbe de sève — le projectile.

 * **Composée, pas transcrite** : la maquette ne montre aucune orbe isolée. Les
 * quatre teintes sont donc celles du cristal du sceptre, reprises telles
 * quelles, ce qui interdit à l'orbe de dériver de l'arme qui la lance. */
export const MAGE_ORB = deepFreeze({
  w: 11,
  h: 11,
  palette: {
    K: '#1b1a1d', // contour, presque noir
    d: '#1f964d', // cœur du cristal
    I: '#38cd65', // cristal
    M: '#97e0a0', // éclat du cristal
  },
  rows: [
    '...KKKKK...',
    '..KKIIIKK..',
    '.KMMMMIIdK.',
    'KKMMMMIIdKK',
    'KIMMMMIIddK',
    'KIMMMMIIddK',
    'KIIIIIIIddK',
    'KKIIIIIddKK',
    '.KdddddddK.',
    '..KKdddKK..',
    '...KKKKK...',
  ],
});

/* Icône du titre — **échantillonnée sur `MAGE_STAFF`**, jamais redessinée.

 * `ICON_LANCE` avait divergé deux fois de son arme (restée indigo quand la
 * lance est passée au cuivre, restée une lame fine quand la tête est devenue
 * une pointe de flèche). Cette icône est un vote majoritaire par bloc sur la
 * carte du sceptre : elle ne peut pas mentir sur ce qu'elle annonce. */
export const ICON_STAFF = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    K: '#1b1a1d', // contour, presque noir
    D: '#2d2a27', // écorce dans l’ombre
    E: '#234a32', // feuillage sombre
    F: '#483b33', // bois dans l’ombre
    b: '#3d6c3c', // liane
    c: '#684f3f', // bois
    d: '#1f964d', // cœur du cristal
    e: '#5b605e', // bois délavé (bord)
    G: '#58914e', // feuille éclairée
    H: '#8d6e50', // bois éclairé
    I: '#38cd65', // cristal
    L: '#7eb380', // feuille en pleine lumière
    M: '#97e0a0', // éclat du cristal
  },
  rows: [
    '................',
    '.....MMMddLI....',
    'M..FHdIIIddcF...',
    '.HFDDHDccHHFDeH.',
    '....FDHdKcDFD...',
    '......DEKFF.....',
    '......KDKDbG....',
    '.....EebDE......',
    '.......DDK......',
    '.......DcF......',
    '.......FcF......',
    '......KKcE......',
    '......EbFKe.....',
    '......EDDK......',
    '......EDKK......',
    '.......Dc.......',
  ],
});
