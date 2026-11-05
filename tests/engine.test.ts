import { describe, expect, it } from 'vitest';
import { BUBBLE_R, FIXED_DT, FRICTION, MAX_SPEED, SOAP_R } from '../src/game/constants';
import {
  aimFromDrag,
  applyFriction,
  canGrab,
  collectedCount,
  createRun,
  frictionAt,
  launch,
  levelProblems,
  playShots,
  predict,
  rateRun,
  step,
} from '../src/game/engine';
import { LEVELS } from '../src/game/levels';
import { closestPointOnSegment } from '../src/game/math';
import { arena, play } from './helpers';

describe('aiming', () => {
  it('pulls down to launch upward', () => {
    const aim = aimFromDrag(100, 100, 100, 170);
    expect(aim.active).toBe(true);
    expect(aim.angle).toBeCloseTo(-Math.PI / 2, 5);
    expect(aim.power).toBeGreaterThan(0.4);
    expect(aim.power).toBeLessThan(0.8);
  });

  it('ignores a tiny pull and saturates a long one', () => {
    expect(aimFromDrag(0, 0, 0, 4).active).toBe(false);
    expect(aimFromDrag(0, 0, -400, 0).power).toBe(1);
  });

  it('grabs near the soap and not across the room', () => {
    expect(canGrab(50, 50, 60, 55)).toBe(true);
    expect(canGrab(50, 50, 200, 200)).toBe(false);
  });
});

describe('friction', () => {
  it('slows without reversing and eventually stops', () => {
    let vx = 300;
    let vy = 0;
    for (let i = 0; i < 200; i++) {
      const next = applyFriction(vx, vy, FRICTION, FIXED_DT);
      expect(next.vx).toBeGreaterThanOrEqual(0);
      expect(next.vx).toBeLessThanOrEqual(vx);
      vx = next.vx;
      vy = next.vy;
    }
    expect(vx).toBe(0);
  });

  it('slick tile carries the soap farther than dry tile, and the mat stops it sooner', () => {
    const start = { x: 70, y: 280 };
    const normal = play(arena({ soap: start, goal: { x: 40, y: 40, r: 12 } }), [{ angle: 0, power: 0.32 }]);
    const slick = play(
      arena({
        soap: start,
        goal: { x: 40, y: 40, r: 12 },
        zones: [{ kind: 'slick', x: 0, y: 0, w: 320, h: 560 }],
      }),
      [{ angle: 0, power: 0.32 }],
    );
    const rough = play(
      arena({
        soap: start,
        goal: { x: 40, y: 40, r: 12 },
        zones: [{ kind: 'rough', x: 0, y: 0, w: 320, h: 560 }],
      }),
      [{ angle: 0, power: 0.32 }],
    );
    expect(slick.x).toBeGreaterThan(normal.x + 50);
    expect(rough.x).toBeLessThan(normal.x - 25);
    expect(frictionAt(arena(), 10, 10)).toBe(FRICTION);
  });
});

describe('collisions and rules', () => {
  it('bounces off the right-hand wall', () => {
    const level = arena({ soap: { x: 250, y: 280 }, goal: { x: 60, y: 60, r: 16 } });
    const state = createRun(level);
    launch(state, 0, 0.8);
    let flipped = false;
    for (let i = 0; i < 400 && state.phase === 'sliding'; i++) {
      step(state, level, FIXED_DT);
      if (state.vx < 0) flipped = true;
    }
    expect(flipped).toBe(true);
    expect(state.x).toBeLessThan(320);
    expect(state.x).toBeGreaterThan(18);
  });

  it('wins only when the soap comes to rest in the dish', () => {
    const power = 0.58;
    const speed = power * MAX_SPEED;
    const distance = (speed * speed) / (2 * FRICTION);
    const level = arena({
      soap: { x: 160, y: 470 },
      goal: { x: 160, y: 470 - distance, r: 28 },
    });
    const won = play(level, [{ angle: -Math.PI / 2, power }]);
    expect(won.phase).toBe('won');
    expect(rateRun(level, won)).toBe(3);

    const flyby = arena({
      soap: { x: 160, y: 430 },
      goal: { x: 160, y: 360, r: 22 },
      zones: [{ kind: 'rough', x: 40, y: 250, w: 240, h: 70 }],
    });
    const state = createRun(flyby);
    launch(state, -Math.PI / 2, 0.85);
    let crossedFast = false;
    for (let i = 0; i < 2000 && state.phase === 'sliding'; i++) {
      const speedNow = Math.hypot(state.vx, state.vy);
      const inside = Math.hypot(state.x - 160, state.y - 360) <= 22;
      if (inside && speedNow > 120) {
        crossedFast = true;
        expect(state.phase).toBe('sliding');
      }
      step(state, flyby, FIXED_DT);
    }
    expect(crossedFast).toBe(true);
    expect(state.phase).not.toBe('won');
  });

  it('collects a bubble once and remembers it after a later rest', () => {
    const level = arena({
      soap: { x: 80, y: 280 },
      bubbles: [{ x: 130, y: 280 }],
      goal: { x: 40, y: 40, r: 12 },
    });
    const state = play(level, [{ angle: 0, power: 0.55 }]);
    expect(collectedCount(state)).toBe(1);
    expect(state.collected[0]).toBe(true);
    expect(SOAP_R + BUBBLE_R).toBeGreaterThan(0);
  });

  it('returns to the last rest spot when it falls in a drain, then ends the attempt on the last shot', () => {
    const level = arena({
      soap: { x: 160, y: 480 },
      drains: [{ x: 160, y: 280, r: 32 }],
      goal: { x: 250, y: 80, r: 18 },
      limit: 2,
      par: 1,
    });
    const first = play(level, [{ angle: -Math.PI / 2, power: 0.22 }]);
    expect(first.phase).toBe('aim');
    expect(first.y).toBeLessThan(470);
    expect(first.shotsUsed).toBe(1);

    const drained = play(level, [
      { angle: -Math.PI / 2, power: 0.22 },
      { angle: -Math.PI / 2, power: 1 },
    ]);
    expect(drained.phase).toBe('lost');
    expect(drained.x).toBeCloseTo(first.x, 3);
    expect(drained.y).toBeCloseTo(first.y, 3);
    expect(drained.shotsUsed).toBe(2);
  });

  it('rates stars from bubbles and par', () => {
    const level = arena({ par: 2, bubbles: [{ x: 100, y: 100 }] });
    const state = createRun(level);
    state.shotsUsed = 2;
    state.collected[0] = true;
    expect(rateRun(level, state)).toBe(3);
    state.collected[0] = false;
    expect(rateRun(level, state)).toBe(2);
    state.shotsUsed = 4;
    expect(rateRun(level, state)).toBe(1);
  });

  it('matches the preview to the simulated rest point', () => {
    const level = arena({ soap: { x: 90, y: 300 }, goal: { x: 40, y: 40, r: 12 } });
    const shot = { angle: 0.4, power: 0.5 };
    const preview = predict(level, 90, 300, shot.angle, shot.power, []);
    const sim = playShots(level, [shot]);
    const end = preview.points[preview.points.length - 1];
    expect(end).toBeDefined();
    expect(end!.x).toBeCloseTo(sim.x, 0);
    expect(end!.y).toBeCloseTo(sim.y, 0);
    expect(preview.hitDrain).toBe(false);
  });

  it('stops the preview on a drain', () => {
    const level = arena({
      soap: { x: 160, y: 460 },
      drains: [{ x: 160, y: 300, r: 30 }],
      goal: { x: 40, y: 80, r: 16 },
    });
    const preview = predict(level, 160, 460, -Math.PI / 2, 0.8, []);
    expect(preview.hitDrain).toBe(true);
    expect(preview.endsInGoal).toBe(false);
  });
});

describe('campaign levels', () => {
  it('has eight numbered bathrooms with valid layouts', () => {
    expect(LEVELS.map((level) => level.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const level of LEVELS) {
      expect(levelProblems(level), level.name.en).toEqual([]);
      expect(level.name.tr.length).toBeGreaterThan(0);
      expect(level.hint.en.length).toBeGreaterThan(0);
    }
  });
});

describe('segment distance', () => {
  it('measures the middle of a segment and its endpoints', () => {
    const mid = closestPointOnSegment(0, 1, -10, 0, 10, 0);
    expect(mid.dist).toBeCloseTo(1);
    expect(mid.x).toBeCloseTo(0);
    const end = closestPointOnSegment(30, 0, 0, 0, 10, 0);
    expect(end.x).toBeCloseTo(10);
    expect(end.dist).toBeCloseTo(20);
  });
});
