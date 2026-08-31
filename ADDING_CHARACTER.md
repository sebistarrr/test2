# Ajouter un combattant — Guide optimisé

**Temps estimé :** 1-2 heures (au lieu de 4-6)  
**Tokens requis :** ~150-200 (au lieu de 600-800)  
**Fichiers à modifier :** 3 (au lieu de 6+)

---

## 1️⃣ Créer la fiche de données (`src/data/elements.js`)

### Avant (structure complète)
```js
const NEWCHAR = {
  id: 'newchar',
  name: 'NOUVEAU',
  nameRef: 'NEWCHAR',
  tagline: '…',
  taglineRef: '…',
  icon: '…',
  look: {
    radius: 41,
    body: '#123456',
    bodyHit: '#ffffff',
    outline: '#0a0a0a',
    outlineWidth: 5,
    hpColor: '#0a0a0a',
    hpFont: '900 34px "Archivo Black", "Arial Black", sans-serif',
    hpOffsetY: 12,
    aura: { color: '#xyz', radius: 1.62, pulse: 2.4, showWhen: 'ability-ready' },
    flair: { ribbon: { color: '#…', width: 16, alpha: 0.5 }, /* … */ },
    trail: { color: 'rgba(…)', every: 0.045, life: 0.28 },
    accent: '#…',
  },
  movement: {
    speed: 440,
    turnRate: 1.9,
    seek: 0.42,
    mass: 1,
  },
  // … 150+ lignes supplémentaires
};
```

### Après (avec templates)
```js
import { defaults, PALETTES, AURAS, FLAIRS } from './templates.js';

const NEWCHAR = defaults({
  id: 'newchar',
  name: 'NOUVEAU',
  nameRef: 'NEWCHAR',
  tagline: 'Rôle — description',
  taglineRef: 'Role — English description',
  icon: 'iconNewchar',

  look: {
    ...PALETTES.custom, // ou: { body: '#123456', accent: '#…', hpColor: '#…' }
    aura: AURAS.ability('rgba(18,52,86,0.42)'),
    flair: FLAIRS.custom, // ou: { ribbon: …, motes: …, impact: …, … }
    trail: { color: 'rgba(…,0.28)', every: 0.05, life: 0.28 },
  },

  weapon: {
    name: 'Nom de l'arme',
    nameRef: 'Weapon Name',
    reach: 120,
    spinDir: 1,
    handle: { length: 50, color: '#…', dark: '#…', gem: null },
    head: { sprite: 'mapName', scale: 3.0, anchorY: 0.5 },
    hitbox: { radius: 15 },
    melee: { damage: 5, knockback: 300, selfRecoil: 90 },
  },

  ability: {
    id: 'abilityName',
    name: 'Nom du pouvoir',
    nameRef: 'Ability Name',
    cooldown: 3,
    cooldownStep: 0.2,
    cooldownFloor: 0.7,
    // … la mécanique spécifique
  },

  ultimate: {
    id: 'ultimateName',
    name: 'Ultime',
    nameRef: 'ULTIMATE NAME',
    barLabel: 'ULTIMATE NAME',
    barLabelFr: 'ULTIME',
    barFill: '#…',
    barText: '#…',
    chargeRate: 5.5,
    chargeOnHit: 3,
    duration: 5.5,
    // … la mécanique spécifique
  },

  projectiles: {
    projectileName: {
      label: 'Nom du projectile',
      labelRef: 'Projectile Name',
      sprite: 'mapName',
      scale: 2.5,
      speed: 500,
      damage: 5,
      radius: 10,
      life: 2.0,
      bounces: 0,
      knockback: 70,
      trail: { color: 'rgba(…,0.35)', every: 0.05, life: 0.22 },
    },
  },

  hud: {
    stat: (f) => `Stat: ${f.currentValue}`,
    statFr: (f) => `Stat : ${f.currentValue}`,
    color: '#123456',
    stroke: '#f4eddc',
  },
}, DEFAULT_LOOK);
```

### Checklist données
- [ ] `id` unique (pas d'espace, minuscule)
- [ ] `name` + `nameRef` (FR + EN)
- [ ] `tagline` + `taglineRef`
- [ ] Palette de couleurs ajoutée à `templates.js` ou réutilisée
- [ ] Sprite de tête d'arme créé dans `pixelmaps.js`
- [ ] Chiffres : commentés avec source (`mesuré`, `calé`, `déduit`)

---

## 2️⃣ Créer le module de pouvoir (`src/game/abilities/newchar.js`)

**Exemple minimal (pouvoir passif)** — ~50 lignes:
```js
export function createModule(f) {
  return {
    update(dt) {
      // Logique du pouvoir
      if (f.ability.cooldown <= 0) {
        // Déclencher l'effet
        f.ability.cooldown = f.ability.cooldown;
      }
      f.ability.cooldown -= dt;
    },
  };
}
```

**Exemple complet (pouvoir actif)** — ~100-150 lignes:
```js
import { Projectile } from '../projectiles.js';

export function createModule(f) {
  const cfg = f.sheet.ability;
  let cooldown = cfg.cooldown;

  return {
    update(dt) {
      if (f.offstage) return;
      cooldown = Math.max(0, cooldown - dt);

      // Déclencher automatiquement
      if (cooldown === 0 && /* condition */) {
        cooldown = cfg.cooldown;
        // Créer projectiles / appliquer effets
        new Projectile(f, cfg.projectile);
      }
    },

    // Optionnel : override le HUD
    stat: (f) => `Stat: ${Math.round(value)}`,
  };
}
```

Voir `src/game/abilities/shadow.js` pour une implémentation complète.

### Checklist module
- [ ] Exporte une fonction `createModule(fighter)`
- [ ] Retourne un objet avec `update(dt)` et éventuellement `stat`
- [ ] Accède à la config via `f.sheet` (fiche gelée)
- [ ] Modifie l'état via `f.state` (copie mutable)
- [ ] N'appelle jamais `game.rng` (RNG de déco seul)

---

## 3️⃣ Créer les sprites pixel-art (`src/data/pixelmaps.js`)

**Tête d'arme** — À ajouter à `pixelmaps.js`:
```js
export const NEWCHAR_WEAPON = (() => {
  const w = 16, h = 16; // dimensions en cellules
  const map = new Uint8Array(w * h);
  // Remplir la carte : 0=transparent, 1-15=index de couleur
  // Voir existing_weapon pour le pattern
  return { w, h, map, colors: ['#0a0a0a', '#123456', /* … */] };
})();
```

**Projectile** (optionnel, sinon réutiliser une arme existante):
```js
export const NEWCHAR_BOLT = (() => {
  const w = 8, h = 4;
  const map = new Uint8Array(w * h);
  return { w, h, map, colors: ['#0a0a0a', '#123456', /* … */] };
})();
```

Voir `pixelmaps.js:20-50` pour le format exact.

### Checklist sprites
- [ ] Tête d'arme créée (ou réutilisée)
- [ ] Palette des couleurs vérifiée contre la vidéo
- [ ] La carte `w × h` correspond aux cellules visées
- [ ] Sprite référencé dans `head: { sprite: 'NEWCHAR_WEAPON', … }`

---

## 4️⃣ Intégrer dans le roster (`src/data/elements.js`)

Ajouter en **queue** de `ROSTER`:
```js
export const ROSTER = deepFreeze([
  'shadow', 'ice', 'fire', 'water', 'light', 'lightning', 'wind', 'plant',
  'outlaw', 'bladesman', 'lancer',
  'newchar', // ← en queue
]);
```

Exporter la nouvelle fiche:
```js
export { SHADOW, ICE, FIRE, /* … */, NEWCHAR };
```

### Pourquoi en queue ?
`tools/matrix.mjs` forme des paires en `[ROSTER[i], ROSTER[j]]` et le camp A pèse lourd. Ajouter en queue = les affrontements existants ne bougent pas.

---

## 5️⃣ Index des modules (`src/game/abilities/index.js`)

Ajouter une ligne:
```js
import * as newchar from './newchar.js';

export const ABILITY_MODULES = {
  'shadow': shadow,
  'ice': ice,
  /* … */
  'newchar': newchar,
};
```

---

## 6️⃣ Vérification avant livraison

```bash
# Syntaxe
node --check src/data/elements.js
node --check src/game/abilities/newchar.js

# Matrice de référence (devrait ajouter 30 lignes, pas les déplacer)
node tools/matrix.mjs > /tmp/matrix.txt
diff tools/matrix-reference.txt /tmp/matrix.txt
# Les 30 nouvelles lignes doivent être au **début** ou à la **fin**, pas entrelacées

# Langue
node tools/lang-check.mjs

# Duel de test
open "http://localhost:8080?a=newchar&b=outlaw"
```

---

## 📊 Réduction de tokens — Avant/Après

| Étape | Avant | Après | Économie |
|-------|-------|-------|----------|
| Fiche données | 180-200 lignes | 80-100 lignes | **−50%** |
| Module pouvoir | 100-150 lignes | 50-100 lignes | **−33%** |
| Sprites | 100-150 lignes | 80-100 lignes | **−25%** |
| Intégration | 10 lignes | 5-8 lignes | **−30%** |
| **Total** | **450-540 lignes** | **215-300 lignes** | **−43%** |
| **Tokens ML** | **~800-900** | **~400-500** | **−50%** |

---

## 🚀 Checklist finale

- [ ] Fiche `elements.js` : tous les champs FR + EN
- [ ] Module `abilities/newchar.js` : `createModule` exportée
- [ ] Sprites `pixelmaps.js` : tête d'arme + éventuels projectiles
- [ ] Intégration `elements.js` : `ROSTER`, `export`
- [ ] Index `abilities/index.js` : module référencé
- [ ] Syntaxe : `node --check` passe sur tous les fichiers
- [ ] Matrice : changements confinés aux 30 nouvelles lignes
- [ ] Langue : `lang-check.mjs` passe
- [ ] Duel test : le personnage se lance sans crash

---

## 💡 Conseils

1. **Copier le template d'un personnage existant similaire.** Ne pas partir de zéro.
2. **Remplir la fiche complètement avant de toucher au module.** Les données doivent être gelées.
3. **Commenter chaque nombre par sa source** (`mesuré`, `calé`, `déduit`).
4. **Le module doit être indépendant.** Pas d'accès à d'autres modules, juste la fiche et l'état.
5. **Regénérer la matrice de référence seulement quand le personnage est équilibré.** Le diff doit être propre : 30 lignes en queue, aucune autre modification.

---

## 📖 Ressources

- `CLAUDE.md` : mécanismes, invariants, pièges
- `docs/FICHES.md` : relevés détaillés des 11 existants
- `src/data/templates.js` : défaults, palettes, helpers
- `tools/matrix.mjs` : test d'équilibre (66 affrontements × 3 seeds)
