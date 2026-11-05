import { describe, expect, it } from 'vitest';
import {
  applyWin,
  continueLevelId,
  defaultSave,
  loadSave,
  maxStars,
  memoryStore,
  normalizeSave,
  totalStars,
  writeSave,
} from '../src/game/progress';

describe('progress', () => {
  it('round-trips a save and ignores a broken one', () => {
    const store = memoryStore();
    const save = applyWin(defaultSave(), 1, 2, 3);
    writeSave(store, { ...save, muted: true, lang: 'en', onboarded: true });
    const loaded = loadSave(store);
    expect(loaded.muted).toBe(true);
    expect(loaded.lang).toBe('en');
    expect(loaded.onboarded).toBe(true);
    expect(loaded.levels['1']?.stars).toBe(2);
    expect(loaded.unlocked).toBe(2);

    expect(loadSave(memoryStore({ 'sabun-kaydiragi-save-v1': '{oops' })).unlocked).toBe(1);
    expect(normalizeSave({ version: 2 }).unlocked).toBe(1);
    expect(normalizeSave({ version: 1, unlocked: 99, levels: { 40: { stars: 9, bestShots: 0, cleared: true } } }).unlocked).toBe(8);
  });

  it('keeps the better star count and the fewer shots', () => {
    let save = applyWin(defaultSave(), 2, 3, 4);
    save = applyWin(save, 2, 1, 2);
    expect(save.levels['2']).toEqual({ stars: 3, bestShots: 2, cleared: true });
    expect(save.unlocked).toBe(3);
    expect(totalStars(save)).toBe(3);
    expect(maxStars()).toBe(24);
  });

  it('continues at the first uncleared unlocked level', () => {
    let save = defaultSave();
    expect(continueLevelId(save)).toBe(1);
    save = applyWin(save, 1, 3, 1);
    save = applyWin(save, 2, 2, 2);
    expect(continueLevelId(save)).toBe(3);
  });

  it('does not throw if the store rejects writes', () => {
    const store = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(() => writeSave(store, defaultSave())).not.toThrow();
  });
});
