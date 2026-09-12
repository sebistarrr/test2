/**
 * Cartes de pixel-art de LUNE.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 *
 * **Cinq cartes, et elles viennent toutes de la même planche** — la maquette
 * fournie, qui montre une lune criblée et cinq astéroïdes dans le même trait.
 * C'est ce qui règle, gratuitement, le piège que le dépôt répète : *un corps,
 * son arme et ses pouvoirs doivent être de la même matière pour se lire comme un
 * objet.* Ici la matière est littéralement la même feuille de dessin.
 *
 *  • `LUNAR_BALL` — le corps, et **il a remplacé l'ancien** (demandé : « remplace
 *    le design de la balle par celui de l'arme »). Les deux lunes précédentes,
 *    l'éclipse violette et la pleine lune cyan, ont été **supprimées** : plus
 *    rien ne les lit ;
 *  • `LUNAR_ROCK1/2/3` — les météores. Trois silhouettes et non une, parce que
 *    l'ultime en fait tomber treize : une seule, répétée treize fois, se lit
 *    comme un motif et non comme une averse.
 *
 * Les quatre sont des **réductions mécaniques** des PNG (Lanczos vers 16 × 16
 * puis plus proche voisin dans la palette). Elles passent, comme les lunes
 * d'avant et contrairement à la sphère du Soleil : ces dessins sont faits de
 * **cratères ronds sur des aplats**, ce qui survit à une réduction, là où un
 * tourbillon rend du bruit. C'est la règle du dépôt : *ça s'essaie et se
 * regarde, ça ne se suppose pas.*
 *
 * @module data/pixelart/lunar
 */

import { deepFreeze } from '../freeze.js';

/**
 * **Les cinq bandes de luminance de la maquette**, relevées sur les pixels
 * opaques de `lunar-ball.png` — 3ᵉ · 20ᵉ · 50ᵉ · 80ᵉ · 97ᵉ centile, la méthode du
 * Soleil.
 *
 * La lune est **grise** : c'est ce que dit la mesure et c'est ce que dit le
 * dessin. Sa couleur à elle n'est pas dans le sprite, elle est autour — le halo
 * de glace, `#9df6fb`, relevé séparément sur la planche et porté par
 * `look.palette.glow` dans la fiche. Il a été **coupé du sprite exprès** (comme
 * le halo pêche du Soleil) pour que le jeu le fasse battre au lieu de le figer.
 */
const PALETTE = {
  K: '#1a2632', // encre du contour
  d: '#2f3c48', // ombre
  s: '#5f6d77', // la pierre — la teinte médiane du corps
  b: '#98aab3', // arêtes éclairées
  w: '#d8f8fc', // blanc de glace des crêtes
};

/**
 * **Le corps** — repli de `assets/sprites/lunar-ball.png`.
 *
 * **Carré, et il doit le rester** : `drawSpriteCentered` impose la hauteur et
 * déduit la largeur du rapport d'aspect. Le PNG est carré (262 × 262, découpé au
 * **disque** ajusté sur la maquette) ; un repli rectangulaire donnerait un astre
 * ovale le jour où le PNG manque, sans que rien ne le signale.
 *
 * **Il tient sur l'arène blanche**, et c'était la question à trancher avant de
 * l'adopter : contraste médian relevé **5,32**, avec **9 %** de pixels sous le
 * seuil de visibilité. À comparer aux deux dessins qu'il remplace — 6,51 pour
 * l'éclipse, et **1,54** (48 % de pixels invisibles) pour la pleine lune cyan,
 * qui était justement le design de l'arme. Le remplacement demandé n'a donc pas
 * coûté de lisibilité : cette lune-ci a de vrais cratères sombres.
 */
export const LUNAR_BALL = deepFreeze({
  w: 16,
  h: 16,
  palette: PALETTE,
  rows: [
    '.....bwwwbs.....',
    '...wwwwbbbsss...',
    '..wwssbbbbssss..',
    '.wwddsssbbbssds.',
    '.wsdsssbbbbsbdd.',
    'wwsssssbbsdssddd',
    'bbbsssbbbbssdKdd',
    'bbbbsbsbbbsssddd',
    'bbbbbbbssssssdKs',
    'bbbbsbssssssdddb',
    'sssssssssssddKdb',
    '.ssssssssddddds.',
    '.dddsssssddKdsb.',
    '..KdddddddKdds..',
    '...ddddKKdddb...',
    '.....ddddds.....',
  ],
});

/**
 * **Météore n° 1** — le plus gros et le plus anguleux de la planche, une masse
 * de biais avec une arête claire sur le dessus.
 *
 * Les trois cartes gardent chacune le **rapport d'aspect de leur PNG** à moins
 * de 1 % près, comme le repli de couronne du Soleil : le module dimensionne le
 * météore par sa **hauteur** et laisse l'image donner la largeur, donc un repli
 * carré sur une image rectangulaire ferait grossir ou maigrir la pierre le jour
 * où le PNG manque. 192 × 195 pour celui-ci, soit 0,985 : 16 × 16 suffit.
 */
export const LUNAR_ROCK1 = deepFreeze({
  w: 16,
  h: 16,
  palette: PALETTE,
  rows: [
    '........bsbbbb..',
    '....bssbbbwbwbs.',
    '...bwbbbbsbbsdd.',
    '...wwwwwwsbbsddd',
    '.bwwbssbbbbsddd.',
    '.bbbKdsssbsdsdK.',
    '.bwsdssbsssssddd',
    'bwbsssbbssssKddd',
    'bssbsbbssbsbsddd',
    'sssbwbsssbbsddds',
    '.sssssdsssdKdKd.',
    '.ssdssdsdddddds.',
    '.dssssddddddKd..',
    '..dddKdddddddd..',
    '...dddddddss....',
    '......ddd.......',
  ],
});

/** **Météore n° 2** — plus trapu, un grand cratère au centre. 142 × 137, soit
 *  1,036 : la carte carrée reste à 3,5 % du rapport, sous le seuil où l'écart se
 *  voit à 46 px de haut. */
export const LUNAR_ROCK2 = deepFreeze({
  w: 16,
  h: 16,
  palette: PALETTE,
  rows: [
    '.....bbbbss.....',
    '....bwbbwbbss...',
    '..bwwwbwwbbbss..',
    '..wwwwwwbKdsssd.',
    '.bbbwbbwbKssssd.',
    '.wwwbbwbwsdssdd.',
    'bbbbwbsbbbbbsdd.',
    'bbsbbdsbssssdKdd',
    'bbssssbssbssdddd',
    'sbssbsssssssdddd',
    'ssbssssbsdsdddd.',
    '.dbssssssdKdsdd.',
    '.sdddKddddKdds..',
    '..sddddssdddd...',
    '...sddddddds....',
    '.....sdKds......',
  ],
});

/** **Météore n° 3** — le petit, presque rond : c'est lui qui tombe le plus
 *  souvent dans l'averse, et sa silhouette compacte évite que treize pierres
 *  anguleuses fassent une bouillie. 94 × 92, soit 1,022. */
export const LUNAR_ROCK3 = deepFreeze({
  w: 16,
  h: 16,
  palette: PALETTE,
  rows: [
    '.........bbbbb..',
    '......sbbbbbsbs.',
    '....bbbbbbbsdsss',
    '..bwwbssbbsbssdd',
    '..bbbdssbbbssdsd',
    '.bwwbsbbssssdKdd',
    '.bwwbbbbbbddddds',
    'bbsbbbsbwbdddddd',
    'bssbbsbbbsssKddd',
    'ssssdsbbsssdddd.',
    'sssssssdssdKddd.',
    '.ssssdsddddddd..',
    '.sbsddsddKddd...',
    '.sdKdddddKdd....',
    '..dKddddddds....',
    '....dddd........',
  ],
});

/**
 * Icône de sélection : **la lune, et ce qui lui tombe dessus**.
 *
 * Elle montrait un disque éteint et trois satellites en orbite ; les satellites
 * étaient l'arme, et l'arme a été supprimée. Ce qui distingue le personnage à
 * l'écran est maintenant **une lune grise et des pierres qui tombent** — c'est
 * ce que dit l'icône, avec deux météores traînant vers le haut-droite pour
 * donner le sens de la chute.
 *
 * **Composée, pas réduite**, et le dire est la règle : une réduction de la
 * maquette rendrait le corps seul, sans l'averse, qui est pourtant tout son jeu.
 * Elle est en revanche **échantillonnée sur la palette du personnage**, comme
 * les quatre autres cartes.
 *
 * **Elle remplit son cadre** — la vignette dimensionne le sprite sur la hauteur
 * de sa carte, pas sur sa matière, et une composition centrée sur dix pixels de
 * seize rend à 57 % de la taille apparente de son voisin. Piège mesuré la fois
 * précédente, appliqué d'emblée ici : la lune touche le bord gauche et le bas,
 * les météores le bord droit et le haut.
 */
export const ICON_LUNAR = deepFreeze({
  w: 16,
  h: 16,
  palette: PALETTE,
  rows: [
    '................',
    '..............b.',
    '.............w..',
    '...........bs...',
    '...........sd...',
    '....bbbb........',
    '..bbbbbss.......',
    '.bbbbbdsss.....w',
    '.bbbssssssd..bs.',
    'bbbbsssssdd..sd.',
    'bbssssssddd.....',
    'bbsssssdddd.....',
    'bsssssdKddK.....',
    '.ssdsddddKK.....',
    '..ssddddKK......',
    '...ddddKK.......',
  ],
});
