import { fiche, SPIN } from '../defaults.js';

/* ==========================================================================
 *  PLANTE  (PLANT)
 *  Relevé : vidéos « PLANT vs FIRE », « ICE vs PLANT », « DARK vs PLANT »
 *  et « WIND vs PLANT ».
 * ========================================================================== */
export const PLANT = fiche({
  id: 'plant',
  name: 'PLANTE',
  nameRef: 'PLANT',
  tagline: 'Endurance — sème des bulbes qui blessent l’un et soignent l’autre',
  taglineRef: 'Endurance — sows bulbs that wound one and heal the other',
  icon: 'iconLeaf',

  look: {
    body: '#15c701', // pipette : rgb(21,199,1)
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    hpColor: '#0a0a0a',
    aura: {
      color: 'rgba(34,197,94,0.45)',
      radius: 1.65,
      pulse: 1.5,
      showWhen: 'ultimate-ready',
    },
    flair: {
      ribbon: { color: '#4ade80', width: 19, alpha: 0.55 },
      motes: { rate: 9, size: 10, drift: 26, rise: -18, colors: ['#16a34a', '#4ade80', '#ec4899'] },
      impact: ['#4ade80', '#bbf7d0', '#f472b6'],
      shape: 'dot',
      castFlash: 'rgba(74,222,128,0.6)',
    },
    trail: { color: 'rgba(74,222,128,0.26)', every: 0.05, life: 0.28 },
    accent: '#22c55e',
  },

  movement: { speed: 445, turnRate: 1.7, seek: 0.45 },

  /**
   * La liane est **courbe** : elle n'est pas un sprite mais un tracé, dessiné
   * par game/abilities/plant.js (`drawWeapon`). Le reste de la fiche décrit
   * quand même sa géométrie, dont se sert la détection de touche.
   */
  weapon: {
    name: 'Liane fouettante',
    nameRef: 'Lashing Vine',
    reach: 160, // mesuré : ~164 px
    spin: SPIN,
    spinDir: 1,
    /** Pédoncule brun : ~30 px visibles au-delà de la boule (mesuré). */
    handle: { length: 73, width: 13, color: '#6a513a', dark: '#4b351f', outline: '#0a0a0a', gem: null },
    head: { sprite: null, scale: 1 },
    /**
     * Tracé de la liane, **rasterisé en escalier de pixels** par
     * game/abilities/plant.js : la vidéo ne montre pas une courbe lisse mais
     * une suite de blocs, exactement comme les autres armes.
     *
     * Géométrie obtenue en faisant passer un cercle par trois points relevés
     * sur la liane de la vidéo (départ, crête, extrémité droite) : centre à
     * 41 px devant le pédoncule, **rayon 46,7 px**, balayage de 207° à 358°.
     * La liane monte, passe la crête et redescend en crochet ; sa pointe tombe
     * pile sur la portée mesurée (160 px), crête 38 px au-dessus de l'axe et
     * crochet 34 px en dessous — les trois cotes de la vidéo.
     */
    vine: {
      radius: 46, // mesuré (ajustement de cercle : 46,7)
      start: 3.62, // rad (≈207°)
      sweep: 2.64, // rad (≈151°) : montée + crête + crochet
      width: 20, // épaisseur du corps au plus large (mesuré ~20 px)
      /**
       * Taille d'un « pixel » de l'escalier (mesuré ~4,2 px). Le contour doit
       * dépasser d'au moins **un bloc et quart**, sinon la quantification
       * l'avale par endroits et la liane perd son liseré noir.
       */
      block: 4,
      outlineWidth: 5.2,
      outline: '#050d04',
      body: '#3fa848', // pipette : rgb(70,161,76)
      light: '#6ec46a', // pipette : rgb(98,189,115)
      shine: '#96de84', // pipette : rgb(149,207,118)
    },
    hitbox: { from: 0.42, radius: 22 },
    melee: {
      damage: 3,
      cooldown: 1.15,
      knockback: 235,
      selfRecoil: 80,
      onHit: {
        stackGain: 1, // « Bulb Damage/Heal » : 1 → 8 mesuré
        stackMax: 14,
      },
    },
  },

  /** Bulbes semés dans l'arène : mine pour l'adversaire, soin pour la Plante. */
  ability: {
    id: 'bulb',
    name: 'Semis',
    nameRef: 'Bulb',
    cooldown: 5,
    cooldownStep: 0,
    cooldownFloor: 5,
    bulb: {
      max: 4,
      life: 18,
      sprite: 'plantBulb',
      scale: 2.5, // mesuré : cosse de ~29 × 37 px, pattes comprises
      /** Rayon de déclenchement (pour les deux camps). */
      radius: 36,
      /**
       * Délai d'amorçage : sans lui, la Plante ramasserait son propre bulbe
       * à l'instant où elle le pose. Le temps qu'il germe, elle est repartie.
       */
      armDelay: 0.9,
      /** Une fois mûr, le bulbe tire une fleur sur l'adversaire. */
      shootInterval: 2.2,
      shootRange: 460,
      projectile: 'flower',
      /** Dégâts à l'adversaire et soin à la Plante : la stat du HUD. */
      damage: (self) => Math.max(1, Math.round(self.stacks)),
      heal: (self) => Math.max(1, Math.round(self.stacks * 0.8)),
      slow: 0.25,
      slowDuration: 1.6,
    },
  },

  ultimate: {
    id: 'flowerStorm',
    name: 'Tempête de fleurs',
    nameRef: 'FLOWER STORM',
    barLabel: 'FLOWER STORM',
    barLabelFr: 'TEMPÊTE DE FLEURS',
    barFill: '#22c55e',
    barText: '#052e16',
    chargeRate: 4,
    chargeOnHit: 3,
    duration: 5,
    storm: {
      /**
       * **Nuée de cubes roses opaques.** Relevé sur WIND vs PLANT, confirmé sur
       * DARK vs PLANT : des carrés plats parfaitement alignés sur les axes,
       * d'un rose unique (pipette rgb(248,120,184)), sans contour ni dégradé,
       * assez serrés pour masquer complètement la cible. Longueur des segments :
       * 9 à 21 px vidéo, soit 11 à 26 px de scène.
       *
       * Aucun cerceau de lianes n'apparaît sur ces vidéos : la tempête **est**
       * la nuée, à laquelle s'ajoutent quelques corolles qui volent avec elle.
       */
      petals: { rate: 60, size: 13, speed: 210, life: 1, colors: ['#f87ab8', '#f06aae', '#fb8fc4'] },
      /**
       * Amas dessiné par-dessus les particules (rendu pur, sans aléa simulé) :
       * des **grappes** de cubes, comme sur la vidéo, plus quelques fleurs.
       */
      swarm: {
        clusters: 17, // grappes qui tournent autour de la cible
        perCluster: 6, // cubes par grappe
        radius: 2.6, // portée, en rayons de la cible
        spread: 0.75, // dispersion d'une grappe, en px
        size: 17,
        sizeVar: 0.5,
        churn: 1.9,
        color: '#f87ab8',
        flowers: 4, // corolles emportées par la tempête
        flowerSize: 42,
      },
      root: 0.7, // la cible est quasiment clouée sur place
      tickInterval: 0.7,
      tickDamage: (self) => Math.max(1, Math.round(self.stacks / 4)),
      /** La Plante se régénère pendant sa tempête. */
      healInterval: 1,
      healAmount: 1,
    },
  },

  projectiles: {
    flower: {
      label: 'Fleur',
      labelRef: 'Flower',
      sprite: 'flower',
      scale: 3.6, // mesuré : corolle de ~40 px
      speed: 340,
      damage: 2,
      radius: 12,
      life: 2.4,
      bounces: 0,
      knockback: 60,
      trail: { color: 'rgba(244,114,182,0.45)', every: 0.04, life: 0.4 },
    },
  },

  progression: { stack: 1, stack2: 0 },

  hud: {
    stats: [(f) => `Bulb Damage/Heal: ${Math.round(f.stacks)}`],
    statsFr: [(f) => `Bulbe — dégâts/soin : ${Math.round(f.stacks)}`],
    color: '#16a02c',
  },
});
