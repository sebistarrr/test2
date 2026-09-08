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
 * **Les bruitages entrent dans la vidéo exportée, les annonces non.** Le graphe
 * se sépare en deux après le compresseur (voir `unlock()`) : une branche va aux
 * enceintes, l'autre est une **piste audio** que `render/recorder.js` ajoute au
 * flux du `MediaRecorder`. Le fichier téléchargé est donc sonore, ce qui est
 * tout l'objet de l'export — publier le duel.
 *
 * La **voix**, elle, ne peut pas suivre : `speechSynthesis` sort directement
 * sur la carte son, hors de tout graphe `AudioContext`, et aucune API ne permet
 * de la router ni de la capter. Ce n'est pas un oubli, c'est la spécification.
 * L'annonce reste donc **une chose qu'on entend en jouant**, et la vidéo dit la
 * même chose **par l'image** : le titre d'arène nomme les deux camps pendant
 * tout le duel, le bandeau de parade nomme le vainqueur. Ce qui manquerait à un
 * spectateur — savoir qui se bat et qui gagne — est à l'écran.
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
    /** @type {GainNode|null} robinet des **enceintes seules** (le bouton de coupure). */
    this.speaker = null;
    /** @type {MediaStreamAudioDestinationNode|null} la piste que filme l'export. */
    this.record = null;
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

  /**
   * Le son est-il en état de jouer ? Faux tant qu'aucun geste n'a eu lieu.
   *
   * **La coupure n'entre pas dans cette condition**, et c'est volontaire : un
   * duel coupé continue de monter ses voix, qui partent dans la piste
   * d'enregistrement et s'arrêtent au robinet des enceintes. Sans ça, couper le
   * son livrerait une vidéo muette.
   */
  get ready() {
    return this.ctx !== null;
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
      this.master.gain.value = MIX.master;
      this.master.connect(comp);

      /**
       * **Le graphe se sépare en deux après le compresseur**, et c'est ce qui
       * met le son dans la vidéo exportée :
       *
       *   master → compresseur ┬→ `speaker` (le bouton de coupure) → enceintes
       *                        └→ `record`  (piste audio) → `MediaRecorder`
       *
       * Deux conséquences, toutes deux voulues :
       *
       *  • **couper le son ne coupe que les enceintes.** L'export garde ses
       *    bruitages — c'est même le geste de qui monte une vidéo : regarder en
       *    silence et publier avec le son. Le contraire (mixer la coupure dans
       *    la piste) livrerait un fichier muet sans que rien ne le dise, et ça
       *    ne se découvrirait qu'après téléchargement ;
       *  • la piste enregistrée est prise **après** le compresseur, donc elle
       *    porte exactement le mixage qu'on entend, pas la somme brute.
       */
      this.speaker = this.ctx.createGain();
      this.speaker.gain.value = this.muted ? 0 : 1;
      comp.connect(this.speaker);
      this.speaker.connect(this.ctx.destination);
      if (typeof this.ctx.createMediaStreamDestination === 'function') {
        this.record = this.ctx.createMediaStreamDestination();
        comp.connect(this.record);
      }

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
   * Coupe ou rétablit **les enceintes** — bruitages et annonces.
   *
   * **Pas la vidéo exportée** : la piste d'enregistrement est branchée avant ce
   * robinet (voir `unlock()`), donc un duel regardé en silence se télécharge
   * quand même avec son. C'est la seule lecture utile du bouton pour qui monte
   * une vidéo, et l'inverse livrerait un fichier muet sans prévenir.
   *
   * Le contexte n'est pas fermé : le rouvrir demanderait un nouveau geste, et
   * l'utilisateur qui remet le son n'en fera pas forcément un.
   */
  setMuted(on) {
    this.muted = !!on;
    if (this.speaker) this.speaker.gain.value = this.muted ? 0 : 1;
    if (this.muted) this.silence();
    return this.muted;
  }

  /**
   * **La piste audio du duel, pour `render/recorder.js`.**
   *
   * `null` tant que le son n'a pas été ouvert par un geste : l'enregistreur
   * filme alors sans son, comme avant. Il la redemande à chaque duel, donc un
   * premier duel muet (page ouverte sur `?a=…&b=…`, sans un clic) n'empêche pas
   * la revanche d'être sonore.
   */
  captureTrack() {
    return this.record?.stream.getAudioTracks()[0] ?? null;
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
   * (invariant 12). Le Golem tonne et le Shinobi siffle sans une ligne de code
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
    // seule chose que la coupure arrête vraiment : la voix ne va pas dans la
    // piste enregistrée, il n'y a donc rien à préserver
    if (!this.ready || this.muted || !texte) return;
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
