# Stratégie de roster : Les personnages désactivés sont obsolètes

**Date :** Août 2026  
**Impact :** Simplification majeure de la maintenance  
**Combattants actifs :** 2 (Hors-la-loi, Lancier)  
**Combattants obsolètes :** 9 (gelés, non maintenus)

---

## 📋 Changement de politique

### Avant
- Roster réduit temporaire (9 fiches désactivées)
- Outillage (matrice, lang-check) lisait **tous les 11** combattants
- Raison : garder une référence d'équilibre pour réactivation future
- 66 affrontements × 3 seeds = 198 duels testés

### Après ✅
- Roster réduit **définitif** (9 fiches obsolètes)
- Outillage (matrice, lang-check) lit **seulement PLAYABLE** (2 combattants)
- Raison : pas de réactivation, ces fiches sont archivées
- 3 affrontements × 3 seeds = 9 duels testés
- Maintenance simplifiée : zéro vérification des obsolètes

---

## 🎯 Qu'est-ce qui change pour vous ?

### Avant
```bash
node tools/matrix.mjs
# Testait : 11×11 paires = 66 affrontements
# Sortie : 66+ lignes dans matrix-reference.txt
```

### Après ✅
```bash
node tools/matrix.mjs
# Teste : 2×2 paires = 3 affrontements
# Sortie : 3 lignes dans matrix-reference.txt
```

### Avant
```bash
node tools/lang-check.mjs
# Vérifiait : les 11 fiches
# Temps : ~15 secondes
```

### Après ✅
```bash
node tools/lang-check.mjs
# Vérifie : les 2 fiches actives
# Temps : ~5 secondes
```

---

## 📊 État du roster

### Actifs (2 combattants)
| ID | Nom | État | Maintenance |
|----|----|------|------------|
| `outlaw` | Hors-la-loi | ✅ Jouable | ✅ Oui |
| `lancer` | Lancier | ✅ Jouable | ✅ Oui |

### Obsolètes (9 combattants)
| ID | Nom | État | Maintenance |
|----|-----|------|------------|
| `shadow` | Ombre | ❌ Archivé | ❌ Non |
| `ice` | Glace | ❌ Archivé | ❌ Non |
| `fire` | Feu | ❌ Archivé | ❌ Non |
| `water` | Eau | ❌ Archivé | ❌ Non |
| `light` | Lumière | ❌ Archivé | ❌ Non |
| `lightning` | Foudre | ❌ Archivé | ❌ Non |
| `wind` | Vent | ❌ Archivé | ❌ Non |
| `plant` | Plante | ❌ Archivé | ❌ Non |
| `bladesman` | Bretteur | ❌ Archivé | ❌ Non |

### Accès archivistique
- ✅ Vous pouvez toujours jouer : `?a=fire&b=ice`
- ✅ Les fiches restent intactes et lisibles
- ❌ Pas de rééquilibrage
- ❌ Pas de validation de langue
- ❌ Pas de vérification de bugs

---

## 🔄 Matrice d'équilibre simplifiée

### Avant
```
shadow vs shadow ✓
shadow vs ice ✓
shadow vs fire ✓
… (66 affrontements)
```

### Après ✅
```
outlaw vs outlaw ✓
outlaw vs lancer ✓
lancer vs lancer ✓
```

**Nouveau fichier :** `tools/matrix-reference.txt` (3 lignes)

---

## ✅ Commandes de validation

```bash
# Vérifier la langue (2 fiches seulement)
node tools/lang-check.mjs

# Tester l'équilibre (3 affrontements)
node tools/matrix.mjs

# Comparer vs référence
node tools/matrix.mjs > /tmp/matrix.txt && diff tools/matrix-reference.txt /tmp/matrix.txt
```

Tous ces outils ne touchent **que les 2 actifs**, jamais les obsolètes.

---

## 🚀 Impact sur l'ajout de combattants

### Nouveau combattant = automatiquement **actif**

```js
// src/data/elements.js
export const DISABLED = deepFreeze(['shadow', 'ice', /* … obsolètes … */]);
export const PLAYABLE = deepFreeze(ROSTER.filter((id) => !DISABLED.includes(id)));
```

Ajouter un combattant:
1. Ajouter la config dans `elements.js`
2. L'ajouter à `ROSTER` en queue
3. Le laisser **hors de `DISABLED`** → automatiquement actif
4. Lancer `matrix.mjs` et `lang-check.mjs` → il sera validé

**Aucun entretien des obsolètes requis.**

---

## 📝 Mise à jour de la doc

- ✅ `CLAUDE.md` : « Roster actif » au lieu de « Roster réduit temporaire »
- ✅ `tools/matrix.mjs` : lit `PLAYABLE` au lieu de `ROSTER`
- ✅ `tools/lang-check.mjs` : vérifie `PLAYABLE` au lieu de `ROSTER`
- ✅ `matrix-reference.txt` : régénérée (3 lignes vs 66)

---

## 🎓 FAQ

### Q: Et si je veux réactiver un combattant obsolète?
**R:** Vous pouvez toujours le consulter avec `?a=fire&b=ice`, mais ce n'est pas un combattant jouable. Si vous voulez un nouveau combattant similaire, créez-en un nouveau à partir du template dans `ADDING_CHARACTER.md`.

### Q: Pourquoi ne pas les supprimer du tout?
**R:** Ils gardent la valeur historique des relevés vidéo (cf. `docs/FICHES.md`). Les garder en place, c'est documenter le travail antérieur sans le maintenir.

### Q: La matrice perd-elle sa fonction de garde-fou?
**R:** Elle reste un garde-fou, mais pour **les 2 actifs**. La nouvelle matrice (3 affrontements) est plus ciblée: tout changement au Lancier ou au Hors-la-loi sera détecté immédiatement. Les 9 obsolètes ne pourraient jamais être réactivés sans recalibrage complet — donc c'est plus honnête de les laisser gelés.

### Q: Ça veut dire qu'on ne peut pas équilibrer 11 combattants?
**R:** Correct. Le roster actif se limite à 2. Pour en ajouter d'autres, ce sont des combattants **nouveaux** qu'on crée avec le système de templates, pas des réactivations. Chaque nouveau vient avec son équilibre propriétaire.

### Q: Que se passe-t-il si je modifie une fiche obsolète?
**R:** Rien. `matrix.mjs` et `lang-check.mjs` ne le verront pas. C'est volontaire: vous ne devriez pas les modifier. Si vous le faites accidentellement, un `git diff` le montrera et vous pourrez le revenir en arrière.

### Q: Les obsolètes restent-ils dans le build de production?
**R:** Oui, pour l'accès archivistique (`?a=fire&b=ice`). Ils ne sont pas supprimés du code, juste pas maintenus.

---

## 📌 Checklist de validation

- [x] `matrix.mjs` lit `PLAYABLE` (3 affrontements)
- [x] `lang-check.mjs` vérifie `PLAYABLE` (2 fiches)
- [x] `matrix-reference.txt` régénérée (3 lignes)
- [x] `CLAUDE.md` mis à jour
- [x] Les obsolètes restent accessibles en URL
- [x] Zéro régression sur les 2 actifs
- [x] Aucun combat de obsolètes n'est testé

---

## 🎯 Résultat final

**Avant :**
- Maintenir 11 combattants
- Tester 66 affrontements
- Vérifier 11 fiches de langue
- Impossible de réactiver sans recalibrage

**Après ✅**
- Maintenir 2 combattants (actifs)
- Tester 3 affrontements (rapide)
- Vérifier 2 fiches de langue (trivial)
- Ajouter des combattants avec templates (−50% tokens)
- Zéro coût de maintenance pour les obsolètes

**C'est un changement de stratégie clair et définitif.**
