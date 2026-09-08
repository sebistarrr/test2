/**
 * **Mise en scène sonore** : le pendant de `render/flair.js` pour l'oreille.
 *
 * Même contrat que la mise en scène visuelle, et pour la même raison :
 *
 * > **Le son ne peut rien changer au duel.** Il ne lit que de l'état déjà
 * > calculé, il n'écrit rien, et il ne tire **jamais** dans `game.rng`
 * > (invariant 2). Une seule ligne d'aléa mal placée ici déplacerait la matrice
 * > entière — c'est déjà arrivé deux fois avec des particules.
 *
 * Le peu d'aléa qu'il utilise (une dérive de hauteur pour que deux impacts de
 * suite ne soient pas jumeaux) passe par `Math.random`, **ni `game.rng` ni
 * `viewRng`** : le premier changerait les vainqueurs, le second déplacerait le
 * tremblement de caméra, donc l'image d'un duel rejoué à la même graine.
 * L'aléa du son n'a besoin d'être reproductible pour personne.
 *
 * **Tout est synthétisé** (voir `data/sound.js` pour les recettes et le
 * pourquoi) : oscillateurs, bruit blanc filtré, enveloppes exponentielles.
 * Aucun fichier audio, donc rien à charger et rien qui puisse manquer à la
 * première touche.
 *
 * **Trois choses peuvent être absentes, et aucune ne doit planter la page :**
 *
 *  1. l'`AudioContext` lui-même (contexte sans audio : `tools/matrix.mjs`,
 *     `tools/shot.mjs`, un navigateur ancien) — tout appel est alors un
 *     `return` immédiat, ce qui rend le son **gratuit** pour les outils ;
 *  2. le **geste d'ouverture** : un navigateur refuse de sonner avant que
 *     l'utilisateur n'ait cliqué, donc le contexte n'est créé qu'à `unlock()`,
 *     appelé au premier clic ou à la première touche (`main.js`) ;
 *  3. la **synthèse vocale** (`speechSynthesis`), absente de certains
 *     navigateurs et de la plupart des environnements de test — les annonces
 *     disparaissent alors sans emporter les bruitages avec elles.
 *
 * **Ce que le son ne fait pas : entrer dans la vidéo exportée.** Les bruitages
 * y arriveraient (il suffirait d'ajouter la piste de `MediaStreamDestination`
 * au flux de `render/recorder.js`), mais **pas les annonces** : la synthèse
 * vocale du navigateur sort directement sur la carte son, hors de tout graphe
 * `AudioContext`, et rien ne permet de la capter. Un export qui porterait les
 * coups sans le nom du vainqueur serait pire que muet — l'export reste donc
 * muet, franchement.
 *
 * @module render/audio
 */

import { ARENA } from '../data/tuning.js';
import { MIX, SOUNDS } from '../data/sound.js';

/** @typedef {'ref'|'fr'} Lang */

/** Étiquettes BCP-47 des deux langues du jeu, pour la voix de l'annonceur. */
const VOICE_LANG = { ref: 'en-US', fr: 'fr-FR' };

class Audio {
  constructor() {
    /** @type {AudioContext|null} créé au premier geste, jamais avant. */
    this.ctx = null;
    /** @type {GainNode|null} */
    this.master = null;
    /** @type {AudioBuffer|null} une seconde de bruit blanc, partagée. */
    this.noise = null;
    this.muted = false;
    /** @type {Lang} */
    this.lang = 'ref';
    /** Dernier départ de chaque recette, pour le garde-fou `MIX.repeatGap`. */
    this.last = new Map();
    /**
     * **Instants de fin des voix en cours**, et non un compteur.
     *
     * Un compteur demanderait de le décrémenter dans `onended`, donc de faire
     * confiance à un rappel : s'il manque une fois, le compteur ne redescend
     * jamais, le plafond de `MIX.maxVoices` reste atteint et **le jeu devient
     * muet définitivement**, sans une erreur. Une liste d'échéances purgée à
     * chaque tir ne peut pas fuir — l'horloge du contexte s'en charge.
     * @type {number[]}
     */
    this.busy = [];
  }

  /** Voix en cours. Lu par `tools/sound-check.mjs`. */
  get voices() {
    return this.busy.length;
  }

  /** Le son est-il en état de jouer ? Faux tant qu'aucun geste n'a eu lieu. */
  get ready() {
    return this.ctx !== null && !this.muted;
  }

  /**
   * **Ouvre le son. À appeler depuis un vrai geste de l'utilisateur.**
   *
   * Les navigateurs interdisent de créer un contexte audio qui joue sans geste
   * préalable ; un contexte créé au chargement naît `suspended` et reste muet
   * même une fois le duel lancé. On le crée donc au premier clic — et on le
   * `resume()` à chaque fois, parce qu'il peut retomber en `suspended` quand
   * l'onglet passe en arrière-plan.
   */
  unlock() {
    const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!Ctor) return false;
    if (!this.ctx) {
      try {
        this.ctx = new Ctor();
      } catch {
        this.ctx = null;
        return false;
      }
      /**
       * Un compresseur avant la sortie. Un duel empile facilement six voix —
       * deux rebonds, une rafale, une brûlure, un ultime — et leur somme
       * dépasse alors 1 : le navigateur écrête, et ça s'entend comme un
       * craquement, pas comme un duel intense.
       */
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 24;
      comp.ratio.value = 8;
      comp.attack.value = 0.004;
      comp.release.value = 0.18;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MIX.master;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
      this.noise = this._buildNoise();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return true;
  }

  /** @param {Lang} lang langue de l'annonceur (voix **et** texte). */
  setLang(lang) {
    this.lang = lang === 'fr' ? 'fr' : 'ref';
  }

  /**
   * Coupe ou rétablit **tout** — bruitages et annonces. Le contexte n'est pas
   * fermé : le rouvrir demanderait un nouveau geste, et l'utilisateur qui
   * remet le son n'en fera pas forcément un.
   */
  setMuted(on) {
    this.muted = !!on;
    if (this.master) this.master.gain.value = this.muted ? 0 : MIX.master;
    if (this.muted) this.silence();
    return this.muted;
  }

  /** Arrête net l'annonce en cours (changement d'écran, coupure du son). */
  silence() {
    try {
      globalThis.speechSynthesis?.cancel();
    } catch {
      /* la synthèse vocale n'est jamais indispensable */
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Bruitages                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Joue une recette du banc.
   *
   * @param {string} name clé de `SOUNDS`. Inconnue ou nulle : rien, en silence.
   *   C'est volontaire — une fiche qui ne déclare pas de son pour un créneau
   *   (le Mannequin n'a ni pouvoir ni ultime) passe par ici sans condition.
   * @param {{x?:number, pitch?:number, gain?:number, drift?:number}} [opts]
   *   `x` place le son dans le stéréo (abscisse de scène) ; `pitch` transpose
   *   toute la recette ; `drift` est l'ampleur de la dérive de hauteur
   *   aléatoire qui évite l'effet mitraillette sur deux coups identiques.
   */
  play(name, opts = {}) {
    if (!this.ready || !name) return;
    const rec = SOUNDS[name];
    if (!rec) return;

    const now = this.ctx.currentTime;
    // deux fois la même recette dans la même poignée de millisecondes ne
    // s'entend pas comme deux coups, mais comme un seul saturé
    if (now - (this.last.get(name) ?? -Infinity) < MIX.repeatGap) return;
    this.last.set(name, now);
    // purge des voix éteintes, puis plafond de mixage
    let vivantes = 0;
    for (const fin of this.busy) if (fin > now) this.busy[vivantes++] = fin;
    this.busy.length = vivantes;
    if (this.busy.length >= MIX.maxVoices) return;

    const pitch = opts.pitch ?? 1;
    const derive = opts.drift ?? 0.04;
    // dérive commune à toutes les couches d'un même coup : les transposer
    // séparément désaccorderait la recette au lieu de la varier
    const k = pitch * (1 + (Math.random() - 0.5) * 2 * derive);
    const vol = opts.gain ?? 1;
    const pan = this._pan(opts.x);

    for (const layer of rec) this._layer(layer, now, k, vol, pan);
  }

  /**
   * **Le son d'un créneau de la fiche.** `slot` est une clé du bloc `sound`
   * (`shot`, `hit`, `ability`, `special`, `ultimate`, `impact`…).
   *
   * C'est par ici que passent les modules de pouvoirs et le moteur : ni l'un ni
   * l'autre ne nomme jamais une recette, ils nomment un **créneau**, et c'est
   * la fiche qui dit avec quelle matière ce combattant-là le remplit
   * (invariant 12). Le Golem tonne et Neon Shadow siffle sans une ligne de code
   * qui les distingue.
   *
   * @param {{el:object, x:number}} f combattant émetteur
   * @param {string} slot
   * @param {{gain?:number, x?:number}} [opts]
   */
  cast(f, slot, opts = {}) {
    const spec = f?.el?.sound;
    if (!spec) return;
    this.play(spec[slot], { x: opts.x ?? f.x, pitch: spec.pitch ?? 1, gain: opts.gain });
  }

  /** Panoramique déduit de l'abscisse : centre d'arène = centre du stéréo. */
  _pan(x) {
    if (x === undefined) return 0;
    const i = ARENA.inner;
    const t = ((x - i.left) / (i.right - i.left)) * 2 - 1;
    return Math.max(-1, Math.min(1, t)) * MIX.panWidth;
  }

  /** Une couche de recette : source → (filtre) → enveloppe → panoramique. */
  _layer(spec, now, pitch, vol, pan) {
    const ctx = this.ctx;
    const t0 = now + (spec.delay ?? 0);
    const dur = spec.dur;
    const attack = spec.attack ?? 0.003;

    /** @type {AudioScheduledSourceNode} */
    let src;
    if (spec.wave === 'noise') {
      const n = ctx.createBufferSource();
      n.buffer = this.noise;
      n.loop = true;
      src = n;
    } else {
      const o = ctx.createOscillator();
      o.type = spec.wave ?? 'sine';
      const f0 = (spec.f0 ?? 440) * pitch;
      const f1 = (spec.f1 ?? spec.f0 ?? 440) * pitch;
      o.frequency.setValueAtTime(f0, t0);
      // rampe **exponentielle** : c'est la seule qui s'entende comme un
      // glissando régulier, une rampe linéaire traîne dans les aigus
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
      src = o;
    }

    let node = src;
    if (spec.filter) {
      const bq = ctx.createBiquadFilter();
      bq.type = spec.filter;
      const c0 = (spec.cut0 ?? 1000) * pitch;
      const c1 = (spec.cut1 ?? spec.cut0 ?? 1000) * pitch;
      bq.frequency.setValueAtTime(Math.max(20, c0), t0);
      if (c1 !== c0) bq.frequency.exponentialRampToValueAtTime(Math.max(20, c1), t0 + dur);
      bq.Q.value = spec.q ?? 1;
      node.connect(bq);
      node = bq;
    }

    const g = ctx.createGain();
    const peak = Math.max(0.0001, (spec.gain ?? 0.3) * vol);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + attack);
    // décroissance exponentielle vers un plancher non nul : `exponentialRamp`
    // n'accepte pas zéro, et un `linearRamp` donnerait une extinction plate
    // qui s'entend comme un bourdon coupé au couteau
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    node.connect(g);

    let sortie = g;
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      sortie = p;
    }
    sortie.connect(this.master);

    const fin = t0 + dur + 0.02;
    this.busy.push(fin);
    src.start(t0);
    src.stop(fin);
  }

  /** Une seconde de bruit blanc, générée une fois et rejouée en boucle. */
  _buildNoise() {
    const n = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, n, n);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  /* ------------------------------------------------------------------ */
  /*  Annonces parlées                                                   */
  /* ------------------------------------------------------------------ */

  /**
   * **L'annonceur.** Demandé en anglais, donc dans la langue de l'application
   * (`ui/lang.js`) : c'est l'anglais par défaut, et `?lang=fr` bascule la voix
   * avec le reste de l'écran — la règle du dépôt est une seule langue par
   * écran, et une voix anglaise sur une interface française serait exactement
   * la moitié d'écran que `ui/lang.js` interdit.
   *
   * `cancel()` d'abord : l'annonce d'ouverture peut durer plus longtemps que
   * l'attente d'avant-combat, et rien ne doit retarder celle du vainqueur.
   *
   * @param {string} texte déjà construit dans la bonne langue par l'appelant
   */
  say(texte) {
    if (!this.ready || !texte) return;
    const synth = globalThis.speechSynthesis;
    if (!synth || typeof globalThis.SpeechSynthesisUtterance !== 'function') return;
    try {
      synth.cancel();
      const u = new globalThis.SpeechSynthesisUtterance(texte);
      u.lang = VOICE_LANG[this.lang];
      u.rate = MIX.voice.rate;
      u.pitch = MIX.voice.pitch;
      u.volume = MIX.voice.volume;
      synth.speak(u);
    } catch {
      /* une voix indisponible ne doit pas emporter les bruitages */
    }
  }
}

/**
 * **Un seul moteur audio pour la page.** Un `AudioContext` par duel épuiserait
 * le quota du navigateur en quelques revanches (la même leçon que le
 * `captureStream()` de l'enregistreur, qui ne s'ouvre qu'une fois par session).
 * `Match` n'en possède donc pas : il utilise celui-ci.
 */
export const sfx = new Audio();
