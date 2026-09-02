/**
 * MAGE — tireur à distance, construit sur la mécanique de Magia.
 *
 *  • **Sceptre braqué et posé sur le flanc.** La fiche porte `weapon.spin = 0`
 *    et c'est ce module qui écrit `weaponAngle` — troisième arme braquée du
 *    roster après le revolver et la lance. Le décalage latéral passe par
 *    `weaponLateral`, le compteur générique du `Fighter` : le moteur le
 *    décompte sans savoir pourquoi, exactement comme pour la charge du
 *    Lancier.
 *
 *  • **Cadence qui monte.** `f.stacks` est la cadence de tir en orbes par
 *    seconde, et **chaque orbe tirée l'augmente de 0,05** — c'est la stat
 *    « Attack Speed » de Magia, mesurée sur sa vidéo (1,00 au départ, 2,00 à
 *    13 s). La montée est donc exponentielle, et plafonnée.
 *
 *  • **Orbes guidées.** Le guidage vit dans `game/projectiles.js`, piloté par
 *    `projectiles.orb.homing` de la fiche ; ce module ne fait que tirer.
 *
 *  • **Semis et Tempête de sève.** Ce sont les deux pouvoirs de la Plante,
 *    demandés tels quels. Ils ne sont **pas recopiés** : la fiche du Mage porte
 *    les mêmes blocs `ability.bulb` et `ultimate.storm`, et tout ce qui les
 *    concerne est délégué à `plant.js`. Une copie aurait divergé au premier
 *    réglage — c'est exactement la duplication que le dépôt a déjà payée deux
 *    fois sur `drawGauge`.
 *
 * @module game/abilities/mage
 */

import { plantAbilities } from './plant.js';

/** Pas de la cadence, par orbe tirée. Mesuré : tous les paliers de la vidéo
 *  sont des multiples de 0,05, et les six premiers tombent en 4,5 s. */
const STEP = 0.05;

/** Plafond de cadence, en orbes par seconde. `calé` : la vidéo de référence ne
 *  dure que 24 s et ne le montre donc jamais. Sans lui, un duel long amène la
 *  cadence à des valeurs qui ne veulent plus rien dire — la montée est
 *  exponentielle. 4,0 laisse la place au ~3,7 de fin de vidéo. */
const RATE_CAP = 4;

/** Décalage du sceptre sur le flanc, en px. Réglé à l'image : à 20 l'arme
 *  chevauche la bille et on ne lit plus le sceptre, à 50 elle flotte à côté
 *  sans lien avec le corps. 34 la pose juste sous le bord de la bille, comme
 *  la baguette de Magia sur sa vidéo. */
const LATERAL = 34;

export const mageAbilities = {
  id: 'mage',

  init(f) {
    plantAbilities.init(f);
    /** Décompte avant la prochaine orbe. Le premier tir attend une cadence
     *  entière : sans ça le Mage ouvre le duel par une orbe gratuite. */
    f.state.shotTimer = 1 / f.stacks;
  },

  update(f, dt, now, game) {
    /* ---------- ce qui vient de la Plante, tel quel ---------- */
    // Semis, Tempête de sève, jauge d'ultime : un seul appel, aucune copie.
    plantAbilities.update(f, dt, now, game);

    /* ---------- le sceptre vise ---------- */
    const target = f.opponent;
    if (target && target.alive) {
      f.weaponAngle = Math.atan2(target.y - f.y, target.x - f.x);
    }
    /**
     * Le décalage est **posé à chaque image**, pas interpolé : `weaponLateral`
     * est un compteur que le moteur remet à zéro, donc il faut le réécrire.
     * Chez le Lancier la même valeur bascule d'un coup au changement de phase,
     * et l'interpoler avait été une erreur de lecture — l'arme se met à
     * glisser au lieu de former un bloc avec la bille.
     */
    f.weaponLateral = LATERAL;

    /* ---------- les orbes ---------- */
    if (game.phase !== 'fight' || !target || !target.alive || !f.onStage) return;
    f.state.shotTimer -= dt;
    if (f.state.shotTimer > 0) return;

    // La cadence courante décide du délai jusqu'au tir suivant : c'est ce qui
    // fait de `stacks` une vraie cadence et pas un simple compteur d'affichage.
    f.state.shotTimer = 1 / f.stacks;
    this.fireOrb(f, game);
  },

  /**
   * Une orbe part **du cristal**, pas du centre de la bille : le sceptre est
   * décalé sur le flanc, et une orbe qui sortirait du corps donnerait
   * l'impression que l'arme n'y est pour rien.
   */
  fireOrb(f, game) {
    const pivot = f.weaponPivot();
    const a = f.weaponAngle;
    const tipX = pivot.x + Math.cos(a) * f.el.weapon.reach;
    const tipY = pivot.y + Math.sin(a) * f.el.weapon.reach;

    // `spawn` place le projectile à `offset` du **porteur** ; on emprunte donc
    // la position du bout du sceptre le temps du tir, comme `plant.js` le fait
    // pour tirer depuis un bulbe.
    const sx = f.x;
    const sy = f.y;
    f.x = tipX;
    f.y = tipY;
    game.projectiles.spawn(f, 'orb', a, 0);
    f.x = sx;
    f.y = sy;

    // La cadence monte d'un cran par orbe. `game.viewRng` n'est pas sollicité
    // et rien ne tire dans `game.rng` : le tir reste un événement pur.
    f.stacks = Math.min(RATE_CAP, f.stacks + STEP);

    game.fx.burst(tipX, tipY, 4, {
      color: ['#38cd65', '#97e0a0'],
      speed: 110,
      size: 4,
      life: 0.25,
    });
  },

  // Bulbes et tempête se dessinent comme chez la Plante. Pas de `drawWeapon` :
  // le Mage a un vrai sprite d'arme, contrairement à la liane courbe.
  drawUnder(ctx, f) {
    plantAbilities.drawUnder(ctx, f);
  },

  drawOver(ctx, f, game, now) {
    plantAbilities.drawOver(ctx, f, game, now);
  },

  barValue(f) {
    return plantAbilities.barValue(f);
  },
};
