/**
 * Pouvoirs du MANNEQUIN — **il n'en a aucun, et c'est le module qui le dit.**
 *
 * Il aurait pu retomber sur le module neutre d'`abilities/index.js` (le repli
 * `NOOP` que `fiche-check` signale comme un oubli de câblage). Deux raisons de
 * lui en écrire un quand même :
 *
 *  • `fiche-check` **crie** sur tout combattant du `ROSTER` servi par le module
 *    neutre — à raison : dans tous les autres cas, c'est un module oublié. Un
 *    garde-fou qui crie à tort n'est plus lu (leçon du dépôt), donc mieux vaut
 *    un module explicite qu'une exception à ajouter au garde-fou ;
 *  • le repli neutre rend `f.ult.charge / 100` comme jauge. Ici la jauge ne
 *    doit **jamais** bouger, et la dire à zéro noir sur blanc vaut mieux que
 *    dépendre d'une charge qui se trouve ne jamais monter.
 *
 * @module game/abilities/dummy
 */

export const dummyAbilities = {
  id: 'dummy',

  /** Aucun état : il n'a ni minuterie, ni pile, ni phase. */
  init() {},

  /**
   * **Rien, volontairement — et surtout aucun tirage.**
   *
   * Un module vide est ici une garantie de déterminisme autant qu'un choix de
   * personnage : le Mannequin ne consomme pas une seule valeur de `game.rng`,
   * donc le mettre en face d'un combattant ne décale pas le flux de simulation
   * de celui-ci. C'est ce qui en fait un banc d'observation **fidèle** : ce
   * qu'on voit l'adversaire faire ici, il le ferait pareil ailleurs.
   */
  update() {},

  drawUnder() {},
  drawOver() {},

  /** Jauge plate : il n'a pas d'ultime (voir le bloc `ultimate` de sa fiche). */
  barValue() {
    return 0;
  },
};
