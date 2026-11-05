import type { Lang } from './types';

export const STRINGS = {
  tagline: {
    tr: 'Kaygan fayans. Sınırlı hamle.',
    en: 'Slick tile. Limited shots.',
  },
  credit: {
    tr: 'Kerim Can Aşan  ·  Ali Caka',
    en: 'Kerim Can Aşan  ·  Ali Caka',
  },
  play: { tr: 'Oyna', en: 'Play' },
  levels: { tr: 'Bölümler', en: 'Levels' },
  howTo: { tr: 'Nasıl oynanır', en: 'How to play' },
  continueAt: { tr: 'Sıradaki: {name}', en: 'Up next: {name}' },
  back: { tr: 'Geri', en: 'Back' },
  mute: { tr: 'Sesi kapat', en: 'Mute sound' },
  unmute: { tr: 'Sesi aç', en: 'Turn sound on' },
  starsTotal: { tr: '{n} / {max} yıldız', en: '{n} / {max} stars' },
  help1Title: { tr: 'Geri çek', en: 'Pull back' },
  help1: {
    tr: 'Sabuna dokun ve ters yöne çek. Ok, kayacağı yönü gösterir. Ne kadar çekersen o kadar hızlanır.',
    en: 'Touch the soap and pull the other way. The arrow shows where it will slide. Pull farther for more speed.',
  },
  help2Title: { tr: 'Bırak', en: 'Release' },
  help2: {
    tr: 'Sabun fayansın üstünde kayar, sürtünmeyle yavaşlar ve duvarlardan seker.',
    en: 'The soap slides across the tile, slows with friction, and bounces off walls.',
  },
  help3Title: { tr: 'Sabunluğa oturt', en: 'Settle in the dish' },
  help3: {
    tr: 'Durduğu yer sabunluğun içiyse bölüm biter. Üstünden hızla geçmek sayılmaz.',
    en: 'The level ends when it comes to rest inside the dish. Racing across it does not count.',
  },
  help4Title: { tr: 'Dikkat', en: 'Watch out' },
  help4: {
    tr: 'Izgaraya düşersen o hamle gider ve sabun kalktığı yere döner. Baloncuklar fazladan yıldız kazandırır.',
    en: 'Fall in a drain and that shot is gone — the soap returns. Bubbles earn the extra stars.',
  },
  legend: { tr: 'Fayansın üstünde', en: 'On the tile' },
  lgSoap: { tr: 'Sabun', en: 'Soap' },
  lgDish: { tr: 'Sabunluk', en: 'Dish' },
  lgDrain: { tr: 'Izgara', en: 'Drain' },
  lgBubble: { tr: 'Baloncuk', en: 'Bubble' },
  lgSponge: { tr: 'Sünger', en: 'Sponge' },
  lgSlick: { tr: 'Kaygan', en: 'Slick' },
  lgMat: { tr: 'Paspas', en: 'Bath mat' },
  lgWall: { tr: 'Duvar', en: 'Wall' },
  keys: {
    tr: 'Masaüstü: sürükle bırak, R yeniden, M ses, Esc duraklat.',
    en: 'Desktop: drag and release, R retry, M mute, Esc pause.',
  },
  levelKicker: { tr: 'Bölüm {n}', en: 'Level {n}' },
  par: { tr: 'par {n}', en: 'par {n}' },
  shots: { tr: 'Hamle {left}', en: 'Shots {left}' },
  bubbles: { tr: 'Baloncuk {n}/{max}', en: 'Bubbles {n}/{max}' },
  retry: { tr: 'Yeniden', en: 'Retry' },
  pause: { tr: 'Duraklat', en: 'Pause' },
  resume: { tr: 'Devam', en: 'Resume' },
  paused: { tr: 'Duraklatıldı', en: 'Paused' },
  pausedBody: {
    tr: 'Sabun yerinde seni bekliyor.',
    en: 'The soap is waiting right where you left it.',
  },
  toLevels: { tr: 'Bölümlere dön', en: 'Back to levels' },
  winTitle: { tr: 'Yerini buldu', en: 'Right where it belongs' },
  winBody: { tr: '{shots} hamle · par {par}', en: '{shots} shots · par {par}' },
  next: { tr: 'Sonraki', en: 'Next' },
  allClear: {
    tr: 'Bütün banyo ışıldıyor.',
    en: 'The whole bathroom is shining.',
  },
  loseTitle: { tr: 'Hamle kalmadı', en: 'No shots left' },
  loseBody: {
    tr: 'Sabun sabunluğa varamadı. Bir kez daha.',
    en: 'The soap never settled in the dish. Slide it again.',
  },
  retryLevel: { tr: 'Tekrar dene', en: 'Try again' },
  drainToast: { tr: 'Izgara! Hamle gitti.', en: 'Drain! That shot is gone.' },
  coach1: {
    tr: 'Sabuna dokun ve geri çek. Ok, gideceği yönü gösterir.',
    en: 'Touch the soap and pull back. The arrow shows where it will go.',
  },
  coach2: {
    tr: 'Bırak. Sabun kayar, yavaşlar, duvarlardan seker.',
    en: 'Release. The soap slides, slows, and bounces off walls.',
  },
  coach3: {
    tr: 'Sabunlukta dur. Izgaradan kaç, baloncuk topla, hamleni koru.',
    en: 'Come to rest in the dish. Dodge drains, collect bubbles, and spend shots carefully.',
  },
  nextCoach: { tr: 'İleri', en: 'Next' },
  start: { tr: 'Başla', en: 'Start' },
  skip: { tr: 'Atla', en: 'Skip' },
  coachProgress: { tr: '{n} / {max}', en: '{n} / {max}' },
  best: { tr: 'En iyi {n}', en: 'Best {n}' },
  locked: { tr: 'Kilitli', en: 'Locked' },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string {
  let text: string = STRINGS[key][lang];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function detectLang(): Lang {
  const nav = typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase();
  return nav.startsWith('tr') ? 'tr' : 'en';
}
