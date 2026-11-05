/** Virtual board. Origin is the top-left; +y points down, matching the canvas. */
export const WORLD_W = 320;
export const WORLD_H = 560;
export const BORDER = 18;
export const SOAP_R = 13;
export const BUBBLE_R = 10;

/** Coulomb-style deceleration on dry tile, in px/s². */
export const FRICTION = 400;
export const SLICK_MUL = 0.32;
export const ROUGH_MUL = 2.4;
export const STOP_SPEED = 22;
export const MAX_SPEED = 720;
export const MAX_DRAG = 100;
export const DEADZONE = 16;
export const GRAB_PADDING = 30;

export const WALL_RESTITUTION = 0.55;
export const BUMPER_RESTITUTION = 0.86;
export const PILLAR_RESTITUTION = 0.45;

export const FIXED_DT = 1 / 120;
export const MAX_SLIDE = 10;

/** How far inside the painted dish the center must stop. */
export const GOAL_INSET = 6;
/** Fraction of a drain's painted radius that is the actual hole. */
export const DRAIN_HOLE = 0.74;
