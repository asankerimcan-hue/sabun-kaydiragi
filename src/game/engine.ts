import {
  BORDER,
  BUBBLE_R,
  BUMPER_RESTITUTION,
  DEADZONE,
  DRAIN_HOLE,
  FIXED_DT,
  FRICTION,
  GOAL_INSET,
  GRAB_PADDING,
  MAX_DRAG,
  MAX_SLIDE,
  MAX_SPEED,
  PILLAR_RESTITUTION,
  ROUGH_MUL,
  SLICK_MUL,
  SOAP_R,
  STOP_SPEED,
  WALL_RESTITUTION,
  WORLD_H,
  WORLD_W,
} from './constants';
import { circleHitsRect, clamp, closestPointOnSegment, hypot } from './math';
import type { Level, Preview, Rect, RunState, Shot, SimEvent } from './types';

export function allWalls(level: Level): Rect[] {
  return [
    { x: 0, y: 0, w: WORLD_W, h: BORDER },
    { x: 0, y: WORLD_H - BORDER, w: WORLD_W, h: BORDER },
    { x: 0, y: 0, w: BORDER, h: WORLD_H },
    { x: WORLD_W - BORDER, y: 0, w: BORDER, h: WORLD_H },
    ...level.walls,
  ];
}

export function createRun(level: Level): RunState {
  return {
    x: level.soap.x,
    y: level.soap.y,
    vx: 0,
    vy: 0,
    phase: 'aim',
    shotsLeft: level.limit,
    shotsUsed: 0,
    collected: level.bubbles.map(() => false),
    anchorX: level.soap.x,
    anchorY: level.soap.y,
    slideTime: 0,
  };
}

export function cloneRun(state: RunState): RunState {
  return { ...state, collected: state.collected.slice() };
}

export function canGrab(sx: number, sy: number, px: number, py: number): boolean {
  return hypot(sx - px, sy - py) <= SOAP_R + GRAB_PADDING;
}

/**
 * Pull-back aiming: the soap launches opposite the drag, like a bar flicked
 * away from the finger. Power saturates after MAX_DRAG pixels.
 */
export function aimFromDrag(
  sx: number,
  sy: number,
  px: number,
  py: number,
): { angle: number; power: number; active: boolean } {
  const dx = sx - px;
  const dy = sy - py;
  const len = hypot(dx, dy);
  if (len < DEADZONE) return { angle: 0, power: 0, active: false };
  return {
    angle: Math.atan2(dy, dx),
    power: clamp((len - DEADZONE) / MAX_DRAG, 0, 1),
    active: true,
  };
}

export function frictionAt(level: Level, x: number, y: number): number {
  let slick = false;
  let rough = false;
  for (const zone of level.zones) {
    if (x < zone.x || y < zone.y || x > zone.x + zone.w || y > zone.y + zone.h) continue;
    if (zone.kind === 'rough') rough = true;
    else slick = true;
  }
  if (rough) return FRICTION * ROUGH_MUL;
  if (slick) return FRICTION * SLICK_MUL;
  return FRICTION;
}

export function applyFriction(
  vx: number,
  vy: number,
  mu: number,
  dt: number,
): { vx: number; vy: number } {
  const speed = hypot(vx, vy);
  if (speed === 0) return { vx: 0, vy: 0 };
  const drop = mu * dt;
  if (drop >= speed) return { vx: 0, vy: 0 };
  const scale = (speed - drop) / speed;
  return { vx: vx * scale, vy: vy * scale };
}

export function isInGoal(x: number, y: number, level: Level): boolean {
  const r = Math.max(8, level.goal.r - GOAL_INSET);
  const dx = x - level.goal.x;
  const dy = y - level.goal.y;
  return dx * dx + dy * dy <= r * r;
}

export function goalRadius(level: Level): number {
  return Math.max(8, level.goal.r - GOAL_INSET);
}

export function launch(state: RunState, angle: number, power: number): boolean {
  if (state.phase !== 'aim' || state.shotsLeft <= 0) return false;
  const p = clamp(power, 0, 1);
  if (p < 0.04) return false;
  const speed = p * MAX_SPEED;
  state.vx = Math.cos(angle) * speed;
  state.vy = Math.sin(angle) * speed;
  state.phase = 'sliding';
  state.slideTime = 0;
  state.shotsLeft -= 1;
  state.shotsUsed += 1;
  return true;
}

function reflect(state: RunState, nx: number, ny: number, restitution: number): number {
  const vn = state.vx * nx + state.vy * ny;
  if (vn >= 0) return 0;
  const bounce = (1 + restitution) * vn;
  state.vx -= bounce * nx;
  state.vy -= bounce * ny;
  const speed = hypot(state.vx, state.vy);
  if (speed > MAX_SPEED) {
    state.vx = (state.vx / speed) * MAX_SPEED;
    state.vy = (state.vy / speed) * MAX_SPEED;
  }
  return -vn;
}

function resolveAabb(state: RunState, rect: Rect, restitution: number): number {
  const closestX = clamp(state.x, rect.x, rect.x + rect.w);
  const closestY = clamp(state.y, rect.y, rect.y + rect.h);
  let dx = state.x - closestX;
  let dy = state.y - closestY;
  const d2 = dx * dx + dy * dy;
  if (d2 >= SOAP_R * SOAP_R) return 0;

  if (d2 > 1e-8) {
    const dist = Math.sqrt(d2);
    const nx = dx / dist;
    const ny = dy / dist;
    const pen = SOAP_R - dist;
    state.x += nx * (pen + 0.2);
    state.y += ny * (pen + 0.2);
    return reflect(state, nx, ny, restitution);
  }

  const left = state.x - rect.x;
  const right = rect.x + rect.w - state.x;
  const top = state.y - rect.y;
  const bottom = rect.y + rect.h - state.y;
  const min = Math.min(left, right, top, bottom);
  let nx = 0;
  let ny = 0;
  let push = 0;
  if (min === left) {
    nx = -1;
    push = left + SOAP_R;
  } else if (min === right) {
    nx = 1;
    push = right + SOAP_R;
  } else if (min === top) {
    ny = -1;
    push = top + SOAP_R;
  } else {
    ny = 1;
    push = bottom + SOAP_R;
  }
  state.x += nx * (push + 0.2);
  state.y += ny * (push + 0.2);
  return reflect(state, nx, ny, restitution);
}

function resolveCircle(
  state: RunState,
  cx: number,
  cy: number,
  cr: number,
  restitution: number,
): number {
  let dx = state.x - cx;
  let dy = state.y - cy;
  let dist = hypot(dx, dy);
  const min = SOAP_R + cr;
  if (dist >= min) return 0;
  if (dist < 1e-6) {
    dx = 1;
    dy = 0;
    dist = 1;
  }
  const nx = dx / dist;
  const ny = dy / dist;
  state.x += nx * (min - dist + 0.2);
  state.y += ny * (min - dist + 0.2);
  return reflect(state, nx, ny, restitution);
}

function finishRest(state: RunState, level: Level): SimEvent[] {
  state.vx = 0;
  state.vy = 0;
  state.slideTime = 0;
  if (isInGoal(state.x, state.y, level)) {
    state.phase = 'won';
    return [{ type: 'win' }];
  }
  state.anchorX = state.x;
  state.anchorY = state.y;
  if (state.shotsLeft <= 0) {
    state.phase = 'lost';
    return [{ type: 'lose' }];
  }
  state.phase = 'aim';
  return [{ type: 'rest' }];
}

function stepOnce(state: RunState, level: Level, dt: number): SimEvent[] {
  if (state.phase !== 'sliding') return [];
  state.slideTime += dt;
  const speed = hypot(state.vx, state.vy);
  if (speed < STOP_SPEED || state.slideTime > MAX_SLIDE) return finishRest(state, level);

  const slowed = applyFriction(state.vx, state.vy, frictionAt(level, state.x, state.y), dt);
  state.vx = slowed.vx;
  state.vy = slowed.vy;
  if (hypot(state.vx, state.vy) < STOP_SPEED) return finishRest(state, level);

  const prevX = state.x;
  const prevY = state.y;
  state.x += state.vx * dt;
  state.y += state.vy * dt;

  let bounceSpeed = 0;
  let bounceKind: 'wall' | 'bumper' | 'pillar' = 'wall';
  for (let pass = 0; pass < 4; pass++) {
    for (const wall of allWalls(level)) {
      const impact = resolveAabb(state, wall, WALL_RESTITUTION);
      if (impact > bounceSpeed) {
        bounceSpeed = impact;
        bounceKind = 'wall';
      }
    }
    for (const pillar of level.pillars) {
      const impact = resolveCircle(state, pillar.x, pillar.y, pillar.r, PILLAR_RESTITUTION);
      if (impact > bounceSpeed) {
        bounceSpeed = impact;
        bounceKind = 'pillar';
      }
    }
    for (const bumper of level.bumpers) {
      const impact = resolveCircle(state, bumper.x, bumper.y, bumper.r, BUMPER_RESTITUTION);
      if (impact > bounceSpeed) {
        bounceSpeed = impact;
        bounceKind = 'bumper';
      }
    }
  }

  const events: SimEvent[] = [];
  if (bounceSpeed > 55) events.push({ type: 'bounce', speed: bounceSpeed, kind: bounceKind });

  if (state.x < -40 || state.y < -40 || state.x > WORLD_W + 40 || state.y > WORLD_H + 40) {
    events.push({ type: 'drain', x: prevX, y: prevY });
    state.x = state.anchorX;
    state.y = state.anchorY;
    state.vx = 0;
    state.vy = 0;
    state.slideTime = 0;
    if (state.shotsLeft <= 0) {
      state.phase = 'lost';
      events.push({ type: 'lose' });
    } else {
      state.phase = 'aim';
    }
    return events;
  }

  const collectR = SOAP_R + BUBBLE_R * 0.85;
  for (let i = 0; i < level.bubbles.length; i++) {
    if (state.collected[i]) continue;
    const bubble = level.bubbles[i];
    if (!bubble) continue;
    const hit = closestPointOnSegment(bubble.x, bubble.y, prevX, prevY, state.x, state.y);
    if (hit.dist <= collectR) {
      state.collected[i] = true;
      events.push({ type: 'collect', index: i });
    }
  }

  for (const drain of level.drains) {
    const hit = closestPointOnSegment(drain.x, drain.y, prevX, prevY, state.x, state.y);
    if (hit.dist <= drain.r * DRAIN_HOLE) {
      events.push({ type: 'drain', x: hit.x, y: hit.y });
      state.x = state.anchorX;
      state.y = state.anchorY;
      state.vx = 0;
      state.vy = 0;
      state.slideTime = 0;
      if (state.shotsLeft <= 0) {
        state.phase = 'lost';
        events.push({ type: 'lose' });
      } else {
        state.phase = 'aim';
      }
      return events;
    }
  }

  return events;
}

/** Advance the slide. Mutates `state`. `dt` is split into fixed steps. */
export function step(state: RunState, level: Level, dt: number): SimEvent[] {
  if (state.phase !== 'sliding') return [];
  const events: SimEvent[] = [];
  let left = Math.min(dt, 0.05);
  while (left > 1e-6 && state.phase === 'sliding') {
    const h = Math.min(FIXED_DT, left);
    events.push(...stepOnce(state, level, h));
    left -= h;
  }
  return events;
}

function phaseOf(state: RunState): RunState['phase'] {
  return state.phase;
}

export function playShots(level: Level, shots: readonly Shot[]): RunState {
  const state = createRun(level);
  for (const shot of shots) {
    if (phaseOf(state) !== 'aim') break;
    if (!launch(state, shot.angle, shot.power)) break;
    for (let i = 0; i < 4000 && phaseOf(state) === 'sliding'; i++) step(state, level, FIXED_DT);
  }
  return state;
}

export function predict(
  level: Level,
  x: number,
  y: number,
  angle: number,
  power: number,
  collected: readonly boolean[],
): Preview {
  const state = createRun(level);
  state.x = x;
  state.y = y;
  state.anchorX = x;
  state.anchorY = y;
  state.collected = collected.slice();
  state.shotsLeft = 99;
  const points: { x: number; y: number }[] = [{ x, y }];
  if (!launch(state, angle, power)) return { points, hitDrain: false, endsInGoal: false };

  const push = (px: number, py: number, force = false) => {
    const last = points[points.length - 1];
    if (!last || force || hypot(last.x - px, last.y - py) >= 8) points.push({ x: px, y: py });
  };

  let hitDrain = false;
  const maxSteps = Math.ceil(MAX_SLIDE / FIXED_DT) + 2;
  for (let i = 0; i < maxSteps && state.phase === 'sliding'; i++) {
    const events = step(state, level, FIXED_DT);
    const drain = events.find((event) => event.type === 'drain');
    if (drain && drain.type === 'drain') {
      push(drain.x, drain.y, true);
      hitDrain = true;
      break;
    }
    if (i % 2 === 0) push(state.x, state.y);
    if (state.phase !== 'sliding') {
      push(state.x, state.y, true);
      break;
    }
  }
  return { points, hitDrain, endsInGoal: state.phase === 'won' };
}

export function collectedCount(state: RunState): number {
  return state.collected.filter(Boolean).length;
}

/** 1 for reaching the dish, plus one for every bubble, plus one for a par-or-better line. Capped at 3. */
export function rateRun(level: Level, state: RunState): number {
  const all = level.bubbles.length === 0 || collectedCount(state) === level.bubbles.length;
  const efficient = state.shotsUsed <= level.par;
  if (all && efficient) return 3;
  if (all || efficient) return 2;
  return 1;
}

export function levelProblems(level: Level): string[] {
  const problems: string[] = [];
  const inside = (x: number, y: number, pad: number) =>
    x >= BORDER + pad &&
    y >= BORDER + pad &&
    x <= WORLD_W - BORDER - pad &&
    y <= WORLD_H - BORDER - pad;

  if (!inside(level.soap.x, level.soap.y, SOAP_R + 2)) problems.push('soap is outside the tile');
  if (!inside(level.goal.x, level.goal.y, 10)) problems.push('dish is outside the tile');
  if (isInGoal(level.soap.x, level.soap.y, level)) problems.push('soap starts in the dish');
  if (level.par < 1 || level.limit < level.par || level.limit > 10) problems.push('shot limit is invalid');
  if (level.bubbles.length > 4) problems.push('too many bubbles');

  for (const wall of allWalls(level)) {
    if (circleHitsRect(level.soap.x, level.soap.y, SOAP_R + 1, wall)) {
      problems.push('soap overlaps a wall');
    }
  }
  for (const drain of level.drains) {
    if (!inside(drain.x, drain.y, 4)) problems.push('drain is outside the tile');
    if (hypot(level.soap.x - drain.x, level.soap.y - drain.y) < drain.r * DRAIN_HOLE + SOAP_R) {
      problems.push('soap starts in a drain');
    }
    const goalR = goalRadius(level);
    if (hypot(level.goal.x - drain.x, level.goal.y - drain.y) < drain.r * DRAIN_HOLE + goalR) {
      problems.push('dish overlaps a drain');
    }
  }
  for (const bubble of level.bubbles) {
    if (!inside(bubble.x, bubble.y, BUBBLE_R)) problems.push('bubble is outside the tile');
  }
  for (const bumper of level.bumpers) {
    if (!inside(bumper.x, bumper.y, bumper.r)) problems.push('sponge is outside the tile');
    if (hypot(level.soap.x - bumper.x, level.soap.y - bumper.y) < bumper.r + SOAP_R + 2) {
      problems.push('soap overlaps a sponge');
    }
  }
  for (const pillar of level.pillars) {
    if (!inside(pillar.x, pillar.y, pillar.r)) problems.push('pillar is outside the tile');
  }
  for (const zone of level.zones) {
    if (zone.w <= 0 || zone.h <= 0) problems.push('zone has no area');
    if (zone.x < 0 || zone.y < 0 || zone.x + zone.w > WORLD_W || zone.y + zone.h > WORLD_H) {
      problems.push('zone leaves the board');
    }
  }
  return problems;
}
