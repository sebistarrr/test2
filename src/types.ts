import type { Body } from 'matter-js';

/** Les deux camps nommés du relevé. Le moteur n'en connaît pas d'autres
 *  parce que la vidéo n'en montre pas d'autres — voir CLAUDE.md, section
 *  « Ajouter un personnage sans casser le standard ». */
export type Side = 'O' | 'B';

/** Une arme est une pixelmap rendue en NEAREST, posée à `r0` du centre de
 *  la bille et tournée avec elle. `tip` est DÉRIVÉ de la carte. */
export interface Weapon {
  readonly sprite: HTMLCanvasElement;
  readonly r0: number;
  readonly tip: number;
}

/** État commun aux deux combattants. */
export interface Fighter {
  readonly side: Side;
  readonly body: Body;
  hp: number;
  /** Vitesse de croisière visée, px/s. Le rappel y ramène la norme. */
  base: number;
  /** Horodatage de fin du flash blanc d'impact (ms). */
  flash: number;
  /** Sursaut d'échelle du chiffre de PV, 1 -> 0. */
  pop: number;
  /** Prochaine date d'échantillonnage d'image fantôme (ms). */
  nextGhost: number;
}

/** Outlaw : le chargeur et le palier de dégâts sont des stats affichées. */
export interface Outlaw extends Fighter {
  readonly side: 'O';
  dmg: number;
  ammo: number;
  nextShot: number;
  reloading: boolean;
  reloadEnd: number;
}

/** Bladesman : `damage` n'est JAMAIS stocké ici. Il est dérivé de `spin`
 *  à l'affichage (Damage = 2 x Spin Speed, mesuré sans exception) ; le
 *  stocker séparément fait diverger les deux valeurs. */
export interface Bladesman extends Fighter {
  readonly side: 'B';
  spin: number;
  ang: number;
  atCapSince: number;
  burning: boolean;
  lastHit: number;
}

/** Un relevé d'angle de lame. L'éventail vert est reconstruit par
 *  quadrilatères entre deux relevés successifs. */
export interface ArcSample {
  x: number;
  y: number;
  a: number;
}

/** Éclat d'impact. Intégré à la main dans la boucle Canvas : les
 *  fragments giclent à contresens du coup puis retombent. */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Âge écoulé et durée de vie, en secondes. */
  age: number;
  life: number;
  ang: number;
  sx: number;
  sy: number;
  color: string;
}

/** Projectile de l'Outlaw : un trait pâle, pas un rond. */
export interface Bullet {
  readonly body: Body;
  /** Cap de tir, figé : sert à orienter le trait et son sillage. */
  readonly ang: number;
  alive: boolean;
}

/** Image fantôme laissée par une bille lancée. */
export interface Ghost {
  x: number;
  y: number;
  age: number;
  life: number;
  color: string;
}

/** Instantané lisible par React pour le HUD hors canvas si besoin. */
export interface DuelSnapshot {
  outlawHp: number;
  bladeHp: number;
  outlawDmg: number;
  ammo: number;
  spin: number;
  noon: number;
  rush: number;
  over: boolean;
  winner: string | null;
}
