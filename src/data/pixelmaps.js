/**
 * ============================================================================
 *  PIXEL-ART — registre des cartes
 * ============================================================================
 *
 *  Ce fichier n'est plus qu'un **registre** : chaque carte vit dans
 *  `pixelart/<combattant>.js`, du même nom que sa fiche et que son module de
 *  pouvoirs. Retoucher le shuriken du Shinobi n'oblige donc plus à ouvrir les
 *  trente et une cartes du roster.
 *
 *  Une carte est un dessin en **texte** : `rows` liste les lignes, une lettre
 *  par cellule, et `palette` associe chaque lettre à une couleur (`.` =
 *  transparent). C'est ce qui garde le dépôt sans binaire — à trois exceptions
 *  près, documentées dans `assets/sprites/manifest.json`, où un vrai PNG prend
 *  la place de la carte et où celle-ci reste comme repli.
 *
 *  **`PIXEL_MAPS` est la table que lisent les fiches** (`weapon.head.sprite`,
 *  `projectiles.*.sprite`, `icon`), `render/sprites.js` et le manifeste. Une
 *  clé absente d'ici est un sprite invisible, sans erreur : ajouter une carte,
 *  c'est aussi l'inscrire ci-dessous.
 *
 *  L'ordre du registre est **lu** par `render/sprites.js` (parcours des
 *  overrides PNG) : on ajoute en queue de section, on ne réordonne pas.
 *
 * @module data/pixelmaps
 */

import { deepFreeze } from './freeze.js';

import { WIND_SHURIKEN, ICON_TORNADO } from './pixelart/wind.js';
import { OUTLAW_REVOLVER, OUTLAW_SHOT, ICON_REVOLVER, ICE_SHARD } from './pixelart/outlaw.js';
import { BLADESMAN_FLAMEBLADE, BLADESMAN_FLAMEWHEEL, ICON_SABRE } from './pixelart/bladesman.js';
import { LANCER_SPEAR, ICON_LANCE } from './pixelart/lancer.js';
import { MAGE_STAFF, MAGE_ORB, MAGE_FLOWER, ICON_STAFF } from './pixelart/mage.js';
import { COLOSSUS_SHIELD, ICON_PAVISE } from './pixelart/colossus.js';

export const PIXEL_MAPS = deepFreeze({
  // Hors-la-loi
  outlawRevolver: OUTLAW_REVOLVER,
  outlawShot: OUTLAW_SHOT,
  iceShard: ICE_SHARD,
  iconRevolver: ICON_REVOLVER,
  // Bretteur
  bladesmanFlameBlade: BLADESMAN_FLAMEBLADE,
  bladesmanFlameWheel: BLADESMAN_FLAMEWHEEL,
  iconSabre: ICON_SABRE,
  // Lancier
  lancerSpear: LANCER_SPEAR,
  iconLance: ICON_LANCE,
  // Shinobi
  windShuriken: WIND_SHURIKEN,
  iconTornado: ICON_TORNADO,
  // Mage
  mageStaff: MAGE_STAFF,
  mageOrb: MAGE_ORB,
  mageFlower: MAGE_FLOWER,
  iconStaff: ICON_STAFF,
  // Colosse
  colossusShield: COLOSSUS_SHIELD,
  iconPavise: ICON_PAVISE,
});
