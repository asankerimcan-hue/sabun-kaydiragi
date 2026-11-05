import { playShots } from '../src/game/engine';
import type { Level, RunState, Shot } from '../src/game/types';

export function arena(overrides: Partial<Level> = {}): Level {
  return {
    id: 99,
    name: { tr: 'Deneme', en: 'Test' },
    hint: { tr: 'ipucu', en: 'hint' },
    par: 1,
    limit: 4,
    soap: { x: 160, y: 420 },
    goal: { x: 160, y: 120, r: 30 },
    walls: [],
    drains: [],
    bumpers: [],
    pillars: [],
    zones: [],
    bubbles: [],
    ...overrides,
  };
}

export function play(level: Level, shots: readonly Shot[]): RunState {
  return playShots(level, shots);
}
