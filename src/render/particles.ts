export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
  color: string;
};

const CAP = 110;

export function spawnBurst(
  list: Particle[],
  x: number,
  y: number,
  color: string,
  count: number,
  speed = 70,
): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const velocity = speed * (0.45 + Math.random() * 0.7);
    list.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: 0.35 + Math.random() * 0.35,
      max: 0.7,
      r: 1.6 + Math.random() * 2.4,
      color,
    });
  }
  if (list.length > CAP) list.splice(0, list.length - CAP);
}

export function spawnSud(list: Particle[], x: number, y: number, vx: number, vy: number): void {
  const side = Math.random() < 0.5 ? -1 : 1;
  list.push({
    x: x + side * (4 + Math.random() * 6),
    y: y + (Math.random() - 0.5) * 8,
    vx: vx * -0.05 + side * 12,
    vy: vy * -0.05 - 8,
    life: 0.28 + Math.random() * 0.2,
    max: 0.45,
    r: 1.4 + Math.random() * 1.8,
    color: Math.random() < 0.5 ? '#ffffff' : '#d7fff8',
  });
  if (list.length > CAP) list.splice(0, list.length - CAP);
}

export function updateParticles(list: Particle[], dt: number): void {
  for (let i = list.length - 1; i >= 0; i--) {
    const particle = list[i];
    if (!particle) continue;
    particle.life -= dt;
    if (particle.life <= 0) {
      list.splice(i, 1);
      continue;
    }
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.96;
    particle.vy *= 0.96;
  }
}
