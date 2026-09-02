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

import { DARK_BLADE, ORB_DARK } from './pixelart/shadow.js';
import { ICE_AXE_HEAD, ICE_SHARD, SNOWFLAKE } from './pixelart/ice.js';
import { FIRE_BLADE, EMBER, ICON_FLAME } from './pixelart/fire.js';
import { LIGHT_HAMMER_HEAD, ICON_SHIELD } from './pixelart/light.js';
import { WIND_SHURIKEN, WIND_CRESCENT, ICON_TORNADO } from './pixelart/wind.js';
import { BOLT_BLADE, TESLA_NODE, ICON_BOLT } from './pixelart/lightning.js';
import { WATER_TRIDENT, WATER_DROP, WATER_WHIRLPOOL, ICON_DROPLET } from './pixelart/water.js';
import { PLANT_BULB, FLOWER, ICON_LEAF } from './pixelart/plant.js';
import { OUTLAW_REVOLVER, OUTLAW_SHOT, ICON_REVOLVER } from './pixelart/outlaw.js';
import { BLADESMAN_FLAMEBLADE, BLADESMAN_FLAMEWHEEL, ICON_SABRE } from './pixelart/bladesman.js';
import { LANCER_SPEAR, ICON_LANCE } from './pixelart/lancer.js';

export const PIXEL_MAPS = deepFreeze({
  // Ombre & Glace
  darkBlade: DARK_BLADE,
  iceAxeHead: ICE_AXE_HEAD,
  iceShard: ICE_SHARD,
  orbDark: ORB_DARK,
  snowflake: SNOWFLAKE,
  // armes
  fireBlade: FIRE_BLADE,
  lightHammerHead: LIGHT_HAMMER_HEAD,
  windShuriken: WIND_SHURIKEN,
  boltBlade: BOLT_BLADE,
  waterTrident: WATER_TRIDENT,
  // projectiles & entités
  ember: EMBER,
  windCrescent: WIND_CRESCENT,
  waterDrop: WATER_DROP,
  teslaNode: TESLA_NODE,
  waterWhirlpool: WATER_WHIRLPOOL,
  // plante
  plantBulb: PLANT_BULB,
  flower: FLOWER,
  // icônes
  iconFlame: ICON_FLAME,
  iconShield: ICON_SHIELD,
  iconTornado: ICON_TORNADO,
  iconBolt: ICON_BOLT,
  iconDroplet: ICON_DROPLET,
  iconLeaf: ICON_LEAF,
  // Hors-la-loi & Bretteur
  outlawRevolver: OUTLAW_REVOLVER,
  outlawShot: OUTLAW_SHOT,
  bladesmanFlameBlade: BLADESMAN_FLAMEBLADE,
  bladesmanFlameWheel: BLADESMAN_FLAMEWHEEL,
  iconRevolver: ICON_REVOLVER,
  iconSabre: ICON_SABRE,
  // Dragoon
  lancerSpear: LANCER_SPEAR,
  iconLance: ICON_LANCE,
});
