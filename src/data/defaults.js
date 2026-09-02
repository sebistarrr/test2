/**
 * ============================================================================
 *  VALEURS PAR DÉFAUT DES FICHES
 * ============================================================================
 *
 *  Les huit valeurs ci-dessous sont **identiques sur tout le roster** — sept
 *  sur les onze fiches, deux avec un seul dérogataire (le Shinobi). Elles ont
 *  été recopiées onze fois pendant longtemps ; les factoriser retire autant de
 *  décisions à qui écrit une nouvelle fiche, et supprime la classe d'erreur
 *  « j'ai oublié `hpOffsetY`, le chiffre de PV est décalé ».
 *
 *  **Le seuil d'entrée est strict : une valeur n'atterrit ici que si elle est
 *  la même partout.** Une valeur qui varie d'un combattant à l'autre — couleur
 *  du corps, portée, dégâts, cadence — reste dans sa fiche même si deux
 *  combattants s'accordent par hasard : c'est ce qui garde une fiche lisible
 *  seule, sans aller-retour vers ce fichier.
 *
 *  Corollaire : ce fichier ne grossit pas. S'il faut y ajouter une clé, c'est
 *  qu'on vient de constater qu'elle est universelle, pas qu'on cherche à
 *  raccourcir une fiche.
 *
 * @module data/defaults
 */

/** Vitesse de rotation d'arme commune : 330 °/s ≈ 5,76 rad/s (mesurée). */
export const SPIN = 5.76;

/**
 * Ce que `fiche()` pose sous chaque combattant. Chaque valeur est `mesuré` :
 * ce sont les cotes de la boule et du chiffre de PV, relevées sur la vidéo de
 * référence et jamais démenties depuis.
 */
export const FICHE_DEFAULTS = {
  look: {
    radius: 41, // mesuré : boule de 83 px de diamètre, contour compris
    outlineWidth: 5,
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12, // décalage de la ligne de base pour centrer les chiffres
  },
  movement: {
    mass: 1,
  },
  weapon: {
    head: { anchorY: 0.5 },
    /** `to: 1` = le tranchant va jusqu'à la pointe. Le Shinobi l'écrase à 0 :
     *  sa hitbox est un disque centré sur la bille, voir sa fiche. */
    hitbox: { to: 1 },
  },
  hud: {
    /** Liseré clair : la ligne de stat est posée sur le fond sombre. */
    stroke: '#f4eddc',
  },
};

/**
 * Fusion profonde, la fiche l'emportant sur le défaut.
 *
 * Volontairement minuscule et sans magie : pas de tableau fusionné (une liste
 * de couleurs se **remplace**, elle ne s'additionne pas), pas de traitement
 * spécial des fonctions (`hud.stat` en est une), pas de clonage des valeurs de
 * la fiche — `deepFreeze` s'en charge en aval.
 *
 * @template T
 * @param {T} fiche
 * @returns {T}
 */
export function fiche(fiche_) {
  return merge(FICHE_DEFAULTS, fiche_);
}

const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function merge(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = isPlain(v) && isPlain(base[k]) ? merge(base[k], v) : v;
  }
  return out;
}
