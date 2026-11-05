import { describe, expect, it } from 'vitest';
import { STRINGS, t } from '../src/game/i18n';

describe('copy', () => {
  it('has matching Turkish and English placeholders', () => {
    const placeholders = (value: string) =>
      [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(',');
    for (const [key, value] of Object.entries(STRINGS)) {
      expect(value.tr.trim().length, key).toBeGreaterThan(0);
      expect(value.en.trim().length, key).toBeGreaterThan(0);
      expect(placeholders(value.tr), key).toBe(placeholders(value.en));
    }
  });

  it('fills named slots', () => {
    expect(t('en', 'shots', { left: 3 })).toBe('Shots 3');
    expect(t('tr', 'levelKicker', { n: 4 })).toBe('Bölüm 4');
  });
});
