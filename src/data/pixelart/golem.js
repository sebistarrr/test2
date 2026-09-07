/**
 * Cartes de pixel-art du GOLEM.
 *
 * Chargées par `data/pixelmaps.js`, qui les recense dans `PIXEL_MAPS`.
 * Les clés de ce registre sont ce que lisent les fiches (`head.sprite`,
 * `projectiles.*.sprite`, `icon`).
 *
 * **Aucune de ces cartes n'est un relevé** : le Golem est inventé, il n'a pas
 * de vidéo de référence. Elles sont donc dessinées, pas transcrites — et c'est
 * exactement pour ça qu'elles sont **anguleuses et non arrondies** : une roche
 * se lit à ses arêtes droites et à ses facettes plates. Le piège du dépôt est
 * ici l'inverse de d'habitude — pas « une formule interpole ce qu'on ne lui a
 * pas demandé », mais « un contour adouci fait un galet, pas un bloc ».
 *
 * @module data/pixelart/golem
 */

import { deepFreeze } from '../freeze.js';

/**
 * **L'amas de roche** — repli texte du vrai PNG.
 *
 * L'arme du Golem est servie par `assets/sprites/golem-rock.png`, une maquette
 * fournie (voir `manifest.json` et l'écart assumé à « aucun binaire » décrit
 * dans `pixelmaps.js`). Cette carte-ci ne se dessine donc **que** si le PNG ne
 * charge pas — mais elle n'est pas décorative pour autant : **`map.h` sert au
 * calcul de la taille dessinée même avec l'override**, `drawSpriteLeft`
 * prenant la hauteur ici et le rapport d'aspect sur l'image. En changer la
 * hauteur déplacerait la pointe de l'arme, donc `weapon.head.scale` avec.
 *
 * Le dessin est volontairement grossier : c'est un repli, pas une
 * transcription. Il dit la bonne chose (une masse minérale pointue, tournée
 * vers l'extérieur) sans prétendre reproduire la maquette — la reproduire à la
 * main serait exactement le geste que le dépôt s'interdit.
 */
export const GOLEM_ROCK = deepFreeze({
  w: 12,
  h: 10,
  palette: {
    K: '#1c1712', // contour, la même encre sombre que le reste du roster
    l: '#a89c88', // facette éclairée
    s: '#7d7264', // corps de la pierre
    d: '#4e4639', // facette d'ombre
  },
  rows: [
    '......KKK...',
    '....KKssllK.',
    '..KKsssslllK',
    'KKsssslllllK',
    'KssslllllllK',
    'KsssdllllllK',
    'KKssdddllllK',
    '..KKddddlllK',
    '....KKddllK.',
    '......KKK...',
  ],
});

/**
 * **Éclat de roche** — le projectile du pouvoir spécial.
 *
 * Un tesson à quatre arêtes, même palette que le poing pour qu'on lise « c'est
 * un morceau de lui qui part ». Volontairement petit (7 × 7) : c'est un
 * fragment, pas un rocher.
 */
export const GOLEM_SHARD = deepFreeze({
  w: 7,
  h: 7,
  palette: {
    K: '#1c1712',
    l: '#a89c88',
    s: '#7d7264',
    d: '#4e4639',
  },
  rows: [
    '..KKK..',
    '.KllsK.',
    'KllssdK',
    'KlsssdK',
    'KlssddK',
    '.KsddK.',
    '..KKK..',
  ],
});

/**
 * Icône de sélection. Elle **s'échantillonne sur le profil de l'arme** plutôt
 * que d'être redessinée à la main : même palette, mêmes facettes, sinon
 * l'icône et l'arme divergent (piège documenté sur le Lancier).
 */
export const ICON_GOLEM = deepFreeze({
  w: 16,
  h: 16,
  palette: {
    K: '#1c1712',
    l: '#a89c88',
    s: '#7d7264',
    d: '#4e4639',
  },
  rows: [
    '................',
    '....KKKKKKKK....',
    '...KllllllssK...',
    '..KlllllsssdK...',
    '..KllllsssddK...',
    '.KlllssssssddK..',
    '.KllssssssdddK..',
    '.KlsssssssdddK..',
    '.KlssssssddddK..',
    '.KsssssssdddK...',
    '.KssssssdddK....',
    '..KsssdddddK....',
    '..KKsddddKK.....',
    '....KKKKK.......',
    '................',
    '................',
  ],
});
