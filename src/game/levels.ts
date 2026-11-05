import type { Level } from './types';

/**
 * Hand-authored bathrooms. Coordinates are on the 320×560 board, y grows downward.
 * Borders are added by the engine. Each layout is checked by tests for a robust line.
 */
export const LEVELS: readonly Level[] = [
  {
    id: 1,
    name: { tr: 'İlk Kayış', en: 'First Glide' },
    hint: {
      tr: 'Geri çek ve bırak. Sert çeksen de sabunluğa oturur.',
      en: 'Pull back and release. A firm pull still settles in the dish.',
    },
    par: 1,
    limit: 4,
    soap: { x: 160, y: 470 },
    goal: { x: 160, y: 185, r: 80 },
    walls: [],
    drains: [],
    bumpers: [],
    pillars: [],
    zones: [{ kind: 'rough', x: 60, y: 90, w: 200, h: 250 }],
    bubbles: [{ x: 160, y: 390 }],
  },
  {
    id: 2,
    name: { tr: 'Seken Sabun', en: 'Bank Shot' },
    hint: {
      tr: 'Ortadaki duvar düz yolu keser. Soldan sektir.',
      en: 'The middle wall blocks a straight slide. Bank off the left.',
    },
    par: 1,
    limit: 4,
    soap: { x: 160, y: 486 },
    goal: { x: 80, y: 122, r: 46 },
    walls: [{ x: 132, y: 236, w: 64, h: 156 }],
    drains: [],
    bumpers: [],
    pillars: [],
    zones: [],
    bubbles: [{ x: 58, y: 310 }],
  },
  {
    id: 3,
    name: { tr: 'Tam Kıvam', en: 'Just Right' },
    hint: {
      tr: 'Paspas yavaşlatır. Çok sert çekersen üstteki ızgaraya kaçarsın.',
      en: 'The mat slows you. Pull too hard and the top drain takes the shot.',
    },
    par: 1,
    limit: 5,
    soap: { x: 160, y: 500 },
    goal: { x: 160, y: 206, r: 58 },
    walls: [],
    drains: [{ x: 160, y: 64, r: 26 }],
    bumpers: [],
    pillars: [],
    zones: [{ kind: 'rough', x: 72, y: 148, w: 176, h: 150 }],
    bubbles: [{ x: 160, y: 400 }],
  },
  {
    id: 4,
    name: { tr: 'Yan Koridor', en: 'Side Lane' },
    hint: {
      tr: 'Izgaraların sağından çık, sağ duvardan sektir.',
      en: 'Pass right of the drains and bank off the right wall.',
    },
    par: 1,
    limit: 5,
    soap: { x: 72, y: 486 },
    goal: { x: 246, y: 124, r: 44 },
    walls: [],
    drains: [
      { x: 78, y: 300, r: 36 },
      { x: 168, y: 300, r: 34 },
    ],
    bumpers: [],
    pillars: [],
    zones: [{ kind: 'rough', x: 190, y: 78, w: 108, h: 100 }],
    bubbles: [{ x: 206, y: 328 }],
  },
  {
    id: 5,
    name: { tr: 'Sünger', en: 'The Sponge' },
    hint: {
      tr: 'Düz çıkış kapalı. Süngere alttan çarp, yukarı sektir.',
      en: 'The way up is walled off. Clip the underside of the sponge to pop upward.',
    },
    par: 2,
    limit: 5,
    soap: { x: 74, y: 478 },
    goal: { x: 214, y: 150, r: 48 },
    walls: [
      { x: 18, y: 268, w: 156, h: 22 },
      { x: 236, y: 268, w: 66, h: 22 },
    ],
    drains: [],
    bumpers: [{ x: 198, y: 372, r: 32 }],
    pillars: [],
    zones: [{ kind: 'rough', x: 150, y: 96, w: 140, h: 120 }],
    bubbles: [{ x: 148, y: 360 }],
  },
  {
    id: 6,
    name: { tr: 'Kaygan Zemin', en: 'Soapy Floor' },
    hint: {
      tr: 'Mavi şerit çok kaygan. Şeritte kal; paspas seni sabunlukta tutar.',
      en: 'The blue strip is slick. Stay on it — the mat catches you in the dish.',
    },
    par: 1,
    limit: 5,
    soap: { x: 160, y: 500 },
    goal: { x: 160, y: 150, r: 42 },
    walls: [],
    drains: [
      { x: 62, y: 330, r: 32 },
      { x: 258, y: 330, r: 32 },
    ],
    bumpers: [],
    pillars: [],
    zones: [
      { kind: 'slick', x: 118, y: 210, w: 84, h: 250 },
      { kind: 'rough', x: 112, y: 118, w: 96, h: 92 },
    ],
    bubbles: [{ x: 160, y: 330 }],
  },
  {
    id: 7,
    name: { tr: 'Fayans Yolu', en: 'Tile Path' },
    hint: {
      tr: 'Boşluklar sağda, solda, yine sağda. Her köşede durabilirsin.',
      en: 'Gaps go right, left, then right again. You can stop in each corner.',
    },
    par: 4,
    limit: 7,
    soap: { x: 150, y: 504 },
    goal: { x: 250, y: 108, r: 46 },
    walls: [
      { x: 18, y: 428, w: 214, h: 20 },
      { x: 96, y: 300, w: 206, h: 20 },
      { x: 18, y: 172, w: 214, h: 20 },
    ],
    drains: [],
    bumpers: [],
    pillars: [],
    zones: [],
    bubbles: [
      { x: 252, y: 478 },
      { x: 64, y: 364 },
      { x: 252, y: 230 },
    ],
  },
  {
    id: 8,
    name: { tr: 'Usta Kayışı', en: 'Master Glide' },
    hint: {
      tr: 'Düz yolda ızgara var. Kaygan kenardan çık.',
      en: 'A drain blocks the straight path. Ride a slick edge.',
    },
    par: 3,
    limit: 6,
    soap: { x: 160, y: 492 },
    goal: { x: 160, y: 108, r: 44 },
    walls: [{ x: 132, y: 214, w: 56, h: 146 }],
    drains: [{ x: 160, y: 404, r: 30 }],
    bumpers: [
      { x: 64, y: 330, r: 20 },
      { x: 256, y: 330, r: 20 },
    ],
    pillars: [],
    zones: [
      { kind: 'slick', x: 36, y: 250, w: 78, h: 176 },
      { kind: 'slick', x: 206, y: 250, w: 78, h: 176 },
      { kind: 'rough', x: 108, y: 72, w: 104, h: 92 },
    ],
    bubbles: [{ x: 64, y: 196 }],
  },
];

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((level) => level.id === id);
}

export const LEVEL_COUNT = LEVELS.length;
