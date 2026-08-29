# Portage React + TypeScript + Matter.js

Portage du jeu vers la pile demandée : **React 18, TypeScript strict, Matter.js
et Canvas 2D**. Il vit dans `app/` et non à la racine, pour une raison précise :
le portage n'est **pas terminé** (voir « Ce qui reste »), et la racine héberge
toujours le jeu complet en JS, publié sur GitHub Pages. Tant que les onze
combattants n'ont pas traversé, écraser la racine mettrait en ligne une version
amputée. Basculer la publication est un changement d'une ligne dans le workflow,
le jour où ça vaut le coup.

## Lancer

```bash
cd app
npm install
npm run dev        # serveur de développement
npm run typecheck  # tsc --noEmit, en mode strict
npm run build      # typecheck + build de production
```

`?debug=1` affiche les silhouettes de collision et, en rouge, **le pivot** —
c'est la façon la plus rapide de vérifier qu'il est bien sur la poignée.

Commandes : `Espace` = estoc, `R` = moulinet.

## Les cinq points du brief

| Point | Où | Ce qu'il faut savoir |
| --- | --- | --- |
| 1. Rendu pixel perfect | `render/pixelCanvas.ts` | `imageSmoothingEnabled = false` **reposé après chaque redimensionnement** (changer `canvas.width` réinitialise le contexte), échelle arrondie à l'entier, `image-rendering: pixelated` |
| 2. Corps allongé + pivot déporté | `physics/lanceBody.ts` | `Body.setCentre(body, offset, true)` |
| 3. Liaison sprite / corps | `physics/lanceBody.ts` + `render/drawLance.ts` | `render.sprite.texture` renseigné, **mais le rendu de jeu ne passe pas par là** — voir ci-dessous |
| 4. Estoc et moulinet | `combat/attacks.ts` | `applyForce` mise à l'échelle de la masse, `setAngularVelocity` |
| 5. VFX foudre | `vfx/lightning.ts` | déplacement de point milieu, banc séparé de la simulation |

## Trois écarts au brief, et pourquoi

**`render.sprite.texture` ne peut pas porter le rendu.** Il n'est lu que par le
renderer intégré `Matter.Render`, qui ne permet ni de couper le lissage, ni de
superposer les éclairs. La propriété est donc renseignée — le renderer de debug
affiche la bonne arme — mais le rendu de jeu passe par une boucle Canvas maison
(`render/drawLance.ts`). Les deux premiers points du brief sont incompatibles
avec le troisième pris au pied de la lettre ; c'est le troisième qui cède.

**La bille n'est pas un corps physique.** Elle l'a été : deux contraintes
rigides reliaient la bille à la lance. Une contrainte tire la lance en un point
qui n'est pas son centre de masse — puisqu'on vient justement de le déporter sur
le manche — et le couple parasite faisait dériver et pivoter l'ensemble tout
seul, sans qu'aucune commande soit jouée. Un seul corps supprime le problème, et
rend le déport bien plus lisible : le moulinet fait tournoyer la lance **autour
de sa poignée**.

**Le pas de simulation est fixe.** Matter est un intégrateur à pas fixe : lui
passer le `dt` réel d'un `requestAnimationFrame` rend la simulation dépendante
de la fréquence de l'écran. Le temps réel est accumulé et consommé par pas de
1/60 s, avec un plafond de rattrapage — sans lui, un onglet remis au premier
plan après une minute simule 3 600 pas d'un coup et fige la page.

## Deux bugs trouvés à l'image, pas au compilateur

- **Les éclairs étaient invisibles.** Ils étaient tracés en
  `globalCompositeOperation = 'lighter'`, réflexe correct sur fond sombre. Or
  l'arène du jeu est **blanche** : additionner quoi que ce soit à du blanc
  redonne du blanc. Les arcs s'affichaient sur le cadre sombre et disparaissaient
  au-dessus de l'arène. Un effet qui marche sur la moitié du cadre est un effet
  faux. En `source-over`, et sur fond clair c'est le **halo** qui est la teinte
  claire et le **cœur** la teinte saturée — l'inverse de ce qu'on écrit pour un
  fond sombre.
- **Les arcs pendaient au lieu de grésiller.** Ils couraient sur toute la lance
  (0,15 → 1,12 de la portée) avec une amplitude fixe en pixels : sur 160 px,
  13 px d'amplitude donnent une ligne ondulée molle. C'est la **longueur** de
  l'arc qui décide du grésillement, pas l'amplitude. Ils sont désormais courts,
  accrochés près du fer, avec une amplitude **relative** à leur longueur.

Aucun des deux ne sortait du typecheck. Les deux se voient sur une capture.

## Le sprite

`public/sprites/electric-lance.png`, détouré de la maquette (624 × 129, alpha).
Le damier de transparence a été retiré en définissant le premier plan
**positivement** — violet saturé, blanc des éclairs, noir du contour — et non en
soustrayant le fond : le JPEG bruite les gris, et les traits de séparation du
damier sont des gris intermédiaires que la soustraction laissait passer.

La géométrie est reprise du relevé vidéo de l'ancienne lance de cuivre, pour que
le changement d'arme ne change pas l'allonge du personnage : `worldLength = 208`
et `pivot.x = 44/208`, donc pointe à **164 px** et talon à **44 px** derrière le
pivot. Les deux mesures sont encodées dans un seul couple et ne peuvent pas
diverger.

## Ce qui reste à porter

Le brief portait sur **l'arme**, et l'arme est complète. Le reste du jeu ne l'est
pas :

- les **dix autres combattants** (`src/data/elements.js`, ~1 200 lignes de
  fiches) et leurs modules de pouvoir ;
- le **duel** lui-même : `match.js`, dégâts, projectiles, ultimes ;
- la **mise en scène** de `render/flair.js` (rubans, fuseaux, nappes, ondes) ;
- les **écrans DOM** — sélection, fin de duel, bascule de langue ;
- l'outillage : `tools/matrix.mjs` et la matrice d'équilibrage, qui est ce qui
  garantit que les onze combattants tiennent dans la bande de 13 à 17 victoires.

Ce dernier point est le plus lourd, et il faut le dire : **les onze fiches sont
calées sur l'intégration maison** du moteur JS, qui intègre à la main et pilote
au cap. Matter.js intègre autrement. Aucune constante de cadence, de portée ou
de dégât ne se reporte telle quelle — c'est exactement ce que disait déjà la
documentation du jeu d'origine, et ce qu'a confirmé le portage des trois invités.
Tout l'équilibrage sera à refaire au banc.
