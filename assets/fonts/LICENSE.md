# Polices embarquées

Les deux familles sont distribuées sous **SIL Open Font License 1.1**, qui
autorise la redistribution avec un projet.

| Fichier                        | Famille       | Auteur                    | Source                                        |
| ------------------------------ | ------------- | ------------------------- | --------------------------------------------- |
| `archivo-black-*.woff2`        | Archivo Black | Omnibus-Type              | https://fonts.google.com/specimen/Archivo+Black |
| `oswald-*.woff2`               | Oswald        | Vernon Adams, Kalapi Gajjar, Cyreal | https://fonts.google.com/specimen/Oswald |

Texte complet de la licence : <https://openfontlicense.org/>

## Pourquoi auto-héberger

- **rendu identique partout** : pas de FOUT ni de repli surprise si Google
  Fonts est bloqué (réseau d'entreprise, extension, hors-ligne) ;
- **fidélité** : la mise en page du HUD est mesurée au pixel, un repli de
  police décalerait les libellés ;
- **GitHub Pages** : aucune requête tierce, donc pas de latence au chargement.

## Remplacer par ta propre police

1. Dépose ton `.woff2` ici.
2. Modifie le `@font-face` correspondant dans `styles/style.css`.
3. Mets à jour les chaînes de police dans `src/data/tuning.js` (titre, HUD) et
   `look.hpFont` de chaque fiche dans `src/data/elements.js`.
4. Ajoute la face à la liste de `src/core/fonts.js` pour qu'elle soit
   pré-chargée avant la première frame.
