export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function hypot(x: number, y: number): number {
  return Math.hypot(x, y);
}

export function circleHitsRect(
  cx: number,
  cy: number,
  r: number,
  rect: { x: number; y: number; w: number; h: number },
): boolean {
  const x = clamp(cx, rect.x, rect.x + rect.w);
  const y = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - x;
  const dy = cy - y;
  return dx * dx + dy * dy < r * r - 0.01;
}

/** Closest point on segment AB to P, plus the distance. */
export function closestPointOnSegment(
  px: number,
  py: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { x: number; y: number; dist: number } {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : clamp(((px - x0) * dx + (py - y0) * dy) / len2, 0, 1);
  const x = x0 + dx * t;
  const y = y0 + dy * t;
  return { x, y, dist: Math.hypot(px - x, py - y) };
}
