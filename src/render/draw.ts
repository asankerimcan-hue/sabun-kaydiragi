import { BORDER, BUBBLE_R, DRAIN_HOLE, SOAP_R, WORLD_H, WORLD_W } from '../game/constants';
import { goalRadius } from '../game/engine';
import type { Level, Preview, RunState } from '../game/types';
import type { Particle } from './particles';

export type Scene = {
  level: Level;
  run: RunState;
  aim: { active: boolean; angle: number; power: number } | null;
  preview: Preview | null;
  trail: { x: number; y: number }[];
  particles: Particle[];
  time: number;
  angle: number;
  stretch: number;
};

let floor: HTMLCanvasElement | null = null;

function floorCanvas(): HTMLCanvasElement {
  if (floor) return floor;
  const canvas = document.createElement('canvas');
  canvas.width = WORLD_W;
  canvas.height = WORLD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = '#7ebcb4';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  const size = 20;
  for (let y = 0; y < WORLD_H; y += size) {
    for (let x = 0; x < WORLD_W; x += size) {
      const n = (x * 3 + y * 5) % 9;
      ctx.fillStyle = n === 0 ? '#e7faf6' : n === 4 ? '#c6eee6' : '#d5f5ef';
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    }
  }
  floor = canvas;
  return canvas;
}

function traceRound(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawZones(ctx: CanvasRenderingContext2D, level: Level, time: number): void {
  for (const zone of level.zones) {
    ctx.save();
    traceRound(ctx, zone.x, zone.y, zone.w, zone.h, 10);
    ctx.clip();
    if (zone.kind === 'rough') {
      ctx.fillStyle = '#e4bc8d';
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.strokeStyle = 'rgba(140, 90, 48, 0.35)';
      ctx.lineWidth = 2;
      for (let y = zone.y - zone.w; y < zone.y + zone.h; y += 7) {
        ctx.beginPath();
        ctx.moveTo(zone.x, y);
        ctx.lineTo(zone.x + zone.w, y + zone.w);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = 'rgba(96, 186, 214, 0.38)';
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      const shift = (time * 36) % 18;
      for (let y = zone.y - zone.w + shift; y < zone.y + zone.h; y += 18) {
        ctx.beginPath();
        ctx.moveTo(zone.x, y);
        ctx.lineTo(zone.x + zone.w, y + 28);
        ctx.stroke();
      }
    }
    ctx.restore();
    traceRound(ctx, zone.x, zone.y, zone.w, zone.h, 10);
    ctx.strokeStyle = zone.kind === 'rough' ? 'rgba(122, 78, 40, 0.35)' : 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawDrains(ctx: CanvasRenderingContext2D, level: Level, time: number): void {
  for (const drain of level.drains) {
    ctx.save();
    ctx.translate(drain.x, drain.y);
    ctx.fillStyle = 'rgba(20, 24, 28, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 4, drain.r * 0.92, drain.r * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    const metal = ctx.createRadialGradient(-4, -4, 4, 0, 0, drain.r);
    metal.addColorStop(0, '#d5dde0');
    metal.addColorStop(0.55, '#6d7c82');
    metal.addColorStop(1, '#2c353a');
    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.arc(0, 0, drain.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14191c';
    ctx.beginPath();
    ctx.arc(0, 0, drain.r * DRAIN_HOLE, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, drain.r * DRAIN_HOLE + 3, time * 0.6, time * 0.6 + 1.4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-drain.r * 0.55, 0);
    ctx.lineTo(drain.r * 0.55, 0);
    ctx.moveTo(0, -drain.r * 0.55);
    ctx.lineTo(0, drain.r * 0.55);
    ctx.stroke();
    ctx.strokeStyle = '#e07a72';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, drain.r - 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawGoal(ctx: CanvasRenderingContext2D, level: Level, armed: boolean, time: number): void {
  const { x, y, r } = level.goal;
  const cup = goalRadius(level);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(20, 50, 54, 0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 5, r * 0.86, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  if (armed) {
    ctx.fillStyle = `rgba(226, 176, 64, ${0.18 + Math.sin(time * 4) * 0.06})`;
    ctx.beginPath();
    ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
    ctx.fill();
  }
  const bowl = ctx.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.2, 0, 0, r);
  bowl.addColorStop(0, '#fffaf0');
  bowl.addColorStop(0.7, '#f3d48a');
  bowl.addColorStop(1, '#c8892e');
  ctx.fillStyle = bowl;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5fffc';
  ctx.beginPath();
  ctx.arc(0, 0, cup, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(120, 190, 184, 0.35)';
  ctx.beginPath();
  ctx.arc(2, 3, cup * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-cup * 0.15, -cup * 0.2, cup * 0.45, Math.PI * 1.1, Math.PI * 1.8);
  ctx.stroke();
  ctx.restore();
}

function drawBubbles(ctx: CanvasRenderingContext2D, level: Level, collected: readonly boolean[], time: number): void {
  level.bubbles.forEach((bubble, index) => {
    if (collected[index]) return;
    const bob = Math.sin(time * 3 + index) * 2.2;
    ctx.save();
    ctx.translate(bubble.x, bubble.y + bob);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, BUBBLE_R + 2, 0, Math.PI * 2);
    ctx.fill();
    const gloss = ctx.createRadialGradient(-3, -3, 1, 0, 0, BUBBLE_R);
    gloss.addColorStop(0, 'rgba(255,255,255,0.95)');
    gloss.addColorStop(0.45, 'rgba(190, 236, 255, 0.75)');
    gloss.addColorStop(1, 'rgba(120, 190, 230, 0.2)');
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.arc(0, 0, BUBBLE_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.ellipse(-3, -3, 2.2, 1.3, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawWalls(ctx: CanvasRenderingContext2D, level: Level): void {
  for (const wall of level.walls) {
    traceRound(ctx, wall.x, wall.y, wall.w, wall.h, 6);
    ctx.fillStyle = '#187277';
    ctx.fill();
    ctx.save();
    traceRound(ctx, wall.x, wall.y, wall.w, wall.h, 6);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(wall.x, wall.y, wall.w, 5);
    ctx.restore();
  }
  ctx.fillStyle = '#14686c';
  ctx.fillRect(0, 0, WORLD_W, BORDER);
  ctx.fillRect(0, WORLD_H - BORDER, WORLD_W, BORDER);
  ctx.fillRect(0, 0, BORDER, WORLD_H);
  ctx.fillRect(WORLD_W - BORDER, 0, BORDER, WORLD_H);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(0, 0, WORLD_W, 3);
  ctx.fillRect(0, 0, 3, WORLD_H);
}

function drawBumpers(ctx: CanvasRenderingContext2D, level: Level): void {
  for (const bumper of level.bumpers) {
    ctx.save();
    ctx.translate(bumper.x, bumper.y);
    ctx.fillStyle = 'rgba(20, 50, 40, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 4, bumper.r * 0.8, bumper.r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    const sponge = ctx.createRadialGradient(-6, -8, 4, 0, 0, bumper.r);
    sponge.addColorStop(0, '#ffe08a');
    sponge.addColorStop(0.6, '#f0b429');
    sponge.addColorStop(1, '#c98418');
    ctx.fillStyle = sponge;
    ctx.beginPath();
    ctx.arc(0, 0, bumper.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(140, 90, 20, 0.35)';
    for (const [x, y] of [
      [-8, -4],
      [6, -6],
      [0, 7],
      [10, 4],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  for (const pillar of level.pillars) {
    ctx.save();
    ctx.translate(pillar.x, pillar.y);
    const ceramic = ctx.createRadialGradient(-3, -3, 2, 0, 0, pillar.r);
    ceramic.addColorStop(0, '#ffffff');
    ceramic.addColorStop(1, '#8fd0cb');
    ctx.fillStyle = ceramic;
    ctx.beginPath();
    ctx.arc(0, 0, pillar.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#147278';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}

function strokePath(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[], width: number, color: string): void {
  if (points.length < 2) return;
  ctx.beginPath();
  const first = points[0];
  if (!first) return;
  ctx.moveTo(first.x, first.y);
  for (const point of points) ctx.lineTo(point.x, point.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

function drawPreview(ctx: CanvasRenderingContext2D, preview: Preview, aim: { angle: number; power: number }): void {
  const color = preview.endsInGoal ? '#c47d00' : preview.hitDrain ? '#d64545' : '#14343a';
  const points = preview.points;
  strokePath(ctx, points, 7, 'rgba(255,255,255,0.95)');
  strokePath(ctx, points, 3.2, color);
  ctx.fillStyle = color;
  points.forEach((point, index) => {
    if (index % 2 !== 0) return;
    ctx.beginPath();
    ctx.arc(point.x, point.y, index === points.length - 1 ? 5 : 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
  const end = points[points.length - 1];
  if (end && !preview.hitDrain) {
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(end.x, end.y, SOAP_R + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const origin = points[0];
  if (!origin) return;
  const length = 28 + aim.power * 58;
  const x2 = origin.x + Math.cos(aim.angle) * length;
  const y2 = origin.y + Math.sin(aim.angle) * length;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const head = 11;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(aim.angle - 0.45) * head, y2 - Math.sin(aim.angle - 0.45) * head);
  ctx.lineTo(x2 - Math.cos(aim.angle + 0.45) * head, y2 - Math.sin(aim.angle + 0.45) * head);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSoap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  stretch: number,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha * 0.9;
  ctx.fillStyle = 'rgba(16, 54, 58, 0.2)';
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 5, SOAP_R + stretch * 8, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(1 + stretch, 1 - stretch * 0.65);
  const body = ctx.createRadialGradient(-5, -6, 2, 0, 1, SOAP_R + 2);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(0.55, '#f3fffc');
  body.addColorStop(1, '#7dcdc4');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, SOAP_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, SOAP_R, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(15, 124, 120, 0.55)';
  ctx.fillRect(-SOAP_R, -3.2, SOAP_R * 2, 6.4);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.ellipse(-4.5, -5, 4, 2.2, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.max);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene): void {
  ctx.clearRect(0, 0, WORLD_W, WORLD_H);
  ctx.drawImage(floorCanvas(), 0, 0);
  drawZones(ctx, scene.level, scene.time);
  drawDrains(ctx, scene.level, scene.time);
  drawGoal(ctx, scene.level, Boolean(scene.preview?.endsInGoal), scene.time);
  drawBubbles(ctx, scene.level, scene.run.collected, scene.time);
  drawBumpers(ctx, scene.level);
  drawWalls(ctx, scene.level);

  scene.trail.forEach((point, index) => {
    ctx.globalAlpha = ((index + 1) / scene.trail.length) * 0.22;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  if (scene.aim?.active && scene.preview) drawPreview(ctx, scene.preview, scene.aim);
  if (scene.aim?.active) {
    const pull = 16 + scene.aim.power * 100;
    const fx = scene.run.x - Math.cos(scene.aim.angle) * pull;
    const fy = scene.run.y - Math.sin(scene.aim.angle) * pull;
    ctx.strokeStyle = 'rgba(20, 52, 58, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(scene.run.x, scene.run.y);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    ctx.setLineDash([]);
    const aimColor = scene.preview?.endsInGoal ? '#c47d00' : scene.preview?.hitDrain ? '#d64545' : '#0f7c78';
    ctx.strokeStyle = aimColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(scene.run.x, scene.run.y, SOAP_R + 7, -Math.PI / 2, -Math.PI / 2 + scene.aim.power * Math.PI * 2);
    ctx.stroke();
  }

  drawSoap(ctx, scene.run.x, scene.run.y, scene.angle, scene.stretch);
  drawParticles(ctx, scene.particles);

  const shade = ctx.createRadialGradient(WORLD_W / 2, WORLD_H / 2, 120, WORLD_W / 2, WORLD_H / 2, 360);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(12, 60, 64, 0.14)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}
