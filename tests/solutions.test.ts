import { describe, expect, it } from 'vitest';
import { collectedCount, playShots, rateRun } from '../src/game/engine';
import { LEVELS } from '../src/game/levels';
import { clamp } from '../src/game/math';
import type { Shot } from '../src/game/types';

/** Lines found against the real physics. Nearby releases of the last shot still finish. */
const LINES: Record<number, readonly Shot[]> = {
  1: [{ angle: -Math.PI / 2, power: 0.9 }],
  2: [{ angle: -2.0943951023931957, power: 0.82 }],
  3: [{ angle: -Math.PI / 2, power: 0.82 }],
  4: [{ angle: -0.8726646259971647, power: 0.94 }],
  5: [
    { angle: -1.0471975511965979, power: 0.7 },
    { angle: 2.7925268031909276, power: 0.7 },
  ],
  6: [{ angle: -Math.PI / 2, power: 0.6 }],
  7: [
    { angle: -0.34906585039886595, power: 0.7 },
    { angle: -Math.PI, power: 0.85 },
    { angle: -1.0471975511965979, power: 0.85 },
    { angle: -1.0471975511965979, power: 0.55 },
  ],
  8: [
    { angle: 1.7453292519943293, power: 0.7 },
    { angle: -1.7453292519943295, power: 0.55 },
    { angle: -0.6981317007977319, power: 0.55 },
  ],
};

function withLast(shots: readonly Shot[], angleDelta: number, powerDelta: number): Shot[] {
  return shots.map((shot, index) =>
    index === shots.length - 1
      ? { angle: shot.angle + angleDelta, power: clamp(shot.power + powerDelta, 0.05, 1) }
      : { ...shot },
  );
}

describe('handcrafted lines', () => {
  it('lets a full-power pull finish level 1', () => {
    const state = playShots(LEVELS[0]!, [{ angle: -Math.PI / 2, power: 1 }]);
    expect(state.phase).toBe('won');
    expect(collectedCount(state)).toBe(1);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])('level %i can be cleared for three stars', (id) => {
    const level = LEVELS[id - 1]!;
    const shots = LINES[id]!;
    const state = playShots(level, shots);
    expect(state.phase).toBe('won');
    expect(collectedCount(state)).toBe(level.bubbles.length);
    expect(state.shotsUsed).toBeLessThanOrEqual(level.par);
    expect(rateRun(level, state)).toBe(3);

    for (const [angleDelta, powerDelta] of [
      [0.02, 0],
      [-0.02, 0],
      [0, 0.02],
      [0, -0.02],
    ] as const) {
      expect(playShots(level, withLast(shots, angleDelta, powerDelta)).phase, `${angleDelta},${powerDelta}`).toBe('won');
    }
  });
});
