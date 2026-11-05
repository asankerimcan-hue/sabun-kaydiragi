import { LEVEL_COUNT } from './levels';
import type { Lang } from './types';

export const SAVE_KEY = 'sabun-kaydiragi-save-v1';

export type LevelRecord = {
  stars: number;
  bestShots: number;
  cleared: boolean;
};

export type SaveData = {
  version: 1;
  muted: boolean;
  /** Null until the player picks a language. */
  lang: Lang | null;
  onboarded: boolean;
  unlocked: number;
  levels: Record<string, LevelRecord>;
};

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function defaultSave(): SaveData {
  return {
    version: 1,
    muted: false,
    lang: null,
    onboarded: false,
    unlocked: 1,
    levels: {},
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function normalizeSave(input: unknown): SaveData {
  const blank = defaultSave();
  if (!input || typeof input !== 'object') return blank;
  const raw = input as Partial<SaveData>;
  if (raw.version !== 1) return blank;

  const levels: Record<string, LevelRecord> = {};
  if (raw.levels && typeof raw.levels === 'object') {
    for (const [key, value] of Object.entries(raw.levels)) {
      const id = Number(key);
      if (!Number.isInteger(id) || id < 1 || id > LEVEL_COUNT) continue;
      if (!value || typeof value !== 'object') continue;
      const record = value as Partial<LevelRecord>;
      levels[String(id)] = {
        stars: clampInt(record.stars, 0, 3, 0),
        bestShots: clampInt(record.bestShots, 1, 99, 99),
        cleared: Boolean(record.cleared),
      };
    }
  }

  const lang = raw.lang === 'tr' || raw.lang === 'en' ? raw.lang : null;
  return {
    version: 1,
    muted: Boolean(raw.muted),
    lang,
    onboarded: Boolean(raw.onboarded),
    unlocked: clampInt(raw.unlocked, 1, LEVEL_COUNT, 1),
    levels,
  };
}

export function loadSave(store: KeyValueStore): SaveData {
  try {
    const raw = store.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return normalizeSave(JSON.parse(raw) as unknown);
  } catch {
    return defaultSave();
  }
}

export function writeSave(store: KeyValueStore, save: SaveData): void {
  try {
    store.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Private mode and full disks should not crash a puzzle.
  }
}

export function applyWin(save: SaveData, levelId: number, stars: number, shots: number): SaveData {
  const key = String(levelId);
  const prev = save.levels[key];
  const next: LevelRecord = {
    stars: Math.max(prev?.stars ?? 0, clampInt(stars, 1, 3, 1)),
    bestShots: Math.min(prev?.bestShots ?? shots, shots),
    cleared: true,
  };
  return {
    ...save,
    unlocked: Math.max(save.unlocked, Math.min(LEVEL_COUNT, levelId + 1)),
    levels: { ...save.levels, [key]: next },
  };
}

export function totalStars(save: SaveData): number {
  return Object.values(save.levels).reduce((sum, record) => sum + record.stars, 0);
}

export function maxStars(): number {
  return LEVEL_COUNT * 3;
}

export function continueLevelId(save: SaveData): number {
  for (let id = 1; id <= LEVEL_COUNT; id++) {
    if (id <= save.unlocked && !save.levels[String(id)]?.cleared) return id;
  }
  return 1;
}

export function memoryStore(initial?: Record<string, string>): KeyValueStore {
  const map = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}
