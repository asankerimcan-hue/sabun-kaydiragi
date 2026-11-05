export type Lang = 'tr' | 'en';

export type Rect = { x: number; y: number; w: number; h: number };
export type Circle = { x: number; y: number; r: number };
export type Zone = Rect & { kind: 'slick' | 'rough' };

export type Copy = { tr: string; en: string };

export type Level = {
  id: number;
  name: Copy;
  hint: Copy;
  /** Shots that still earn the efficiency star. */
  par: number;
  /** Hard cap. The attempt ends when these are spent outside the dish. */
  limit: number;
  soap: { x: number; y: number };
  goal: Circle;
  walls: Rect[];
  drains: Circle[];
  bumpers: Circle[];
  pillars: Circle[];
  zones: Zone[];
  bubbles: { x: number; y: number }[];
};

export type Phase = 'aim' | 'sliding' | 'won' | 'lost';

export type RunState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: Phase;
  shotsLeft: number;
  shotsUsed: number;
  collected: boolean[];
  anchorX: number;
  anchorY: number;
  slideTime: number;
};

export type Shot = { angle: number; power: number };

export type SimEvent =
  | { type: 'bounce'; speed: number; kind: 'wall' | 'bumper' | 'pillar' }
  | { type: 'collect'; index: number }
  | { type: 'drain'; x: number; y: number }
  | { type: 'rest' }
  | { type: 'win' }
  | { type: 'lose' };

export type Preview = {
  points: { x: number; y: number }[];
  hitDrain: boolean;
  endsInGoal: boolean;
};
