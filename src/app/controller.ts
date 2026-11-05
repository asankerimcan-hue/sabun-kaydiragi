import { Sfx } from '../audio/sfx';
import { FIXED_DT, MAX_SPEED, WORLD_H, WORLD_W } from '../game/constants';
import {
  aimFromDrag,
  canGrab,
  collectedCount,
  createRun,
  launch,
  predict,
  rateRun,
  step,
} from '../game/engine';
import { detectLang, t } from '../game/i18n';
import { getLevel, LEVEL_COUNT, LEVELS } from '../game/levels';
import {
  applyWin,
  continueLevelId,
  loadSave,
  maxStars,
  memoryStore,
  totalStars,
  writeSave,
  type KeyValueStore,
  type SaveData,
} from '../game/progress';
import type { Lang, Level, Preview, RunState } from '../game/types';
import { drawScene } from '../render/draw';
import { spawnBurst, spawnSud, updateParticles, type Particle } from '../render/particles';
import { mountShell, type ScreenName, type SheetKind, type Shell, type ShellModel } from '../ui/shell';

type Aim = { pointerId: number; angle: number; power: number; active: boolean };

type Runtime = {
  screen: ScreenName;
  sheet: SheetKind | null;
  lang: Lang;
  save: SaveData;
  level: Level;
  run: RunState;
  aim: Aim | null;
  preview: Preview | null;
  coachStep: number;
  toast: string | null;
  toastUntil: number;
  trail: { x: number; y: number }[];
  particles: Particle[];
  displayAngle: number;
  pending: { at: number; sheet: 'win' | 'lose' } | null;
  recorded: boolean;
  lastBounce: number;
  fingerDone: boolean;
};

function browserStore(): KeyValueStore {
  try {
    const probe = '__sabun__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return memoryStore();
  }
}

function buzz(ms: number, muted: boolean): void {
  if (muted || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(ms);
}

export function startGame(root: HTMLElement): void {
  const store = browserStore();
  const sfx = new Sfx();
  const save0 = loadSave(store);
  const lang0 = save0.lang ?? detectLang();
  sfx.setMuted(save0.muted);
  const first = getLevel(1) ?? LEVELS[0];
  if (!first) return;

  const runtime: Runtime = {
    screen: 'title',
    sheet: null,
    lang: lang0,
    save: save0,
    level: first,
    run: createRun(first),
    aim: null,
    preview: null,
    coachStep: 0,
    toast: null,
    toastUntil: 0,
    trail: [],
    particles: [],
    displayAngle: -0.4,
    pending: null,
    recorded: false,
    lastBounce: 0,
    fingerDone: false,
  };

  let shell: Shell;
  const persist = () => writeSave(store, runtime.save);
  const model = (): ShellModel => buildModel(runtime);

  const paint = () => {
    shell.setScreen(runtime.screen);
    shell.setAiming(Boolean(runtime.aim?.active));
    shell.paint(model());
  };

  const finishCoach = () => {
    runtime.coachStep = 0;
    runtime.save = { ...runtime.save, onboarded: true };
    persist();
    paint();
  };

  const begin = (id: number, force = false) => {
    const level = getLevel(id);
    if (!level) return;
    if (!force && id > runtime.save.unlocked) return;
    runtime.level = level;
    runtime.run = createRun(level);
    runtime.aim = null;
    runtime.preview = null;
    runtime.trail = [];
    runtime.particles = [];
    runtime.sheet = null;
    runtime.pending = null;
    runtime.recorded = false;
    runtime.toast = null;
    runtime.fingerDone = false;
    runtime.displayAngle = -0.4;
    runtime.screen = 'game';
    runtime.coachStep = level.id === 1 && !runtime.save.onboarded ? 1 : 0;
    paint();
  };

  shell = mountShell(root, (action, source) => {
    if (action === 'mute') {
      const next = !runtime.save.muted;
      if (!next) {
        sfx.setMuted(false);
        sfx.unlock();
        sfx.click();
      } else {
        sfx.click();
        sfx.setMuted(true);
      }
      runtime.save = { ...runtime.save, muted: next };
      persist();
      paint();
      return;
    }
    if (action !== 'mute') sfx.click();
    if (action === 'lang') {
      const picked = source.dataset.lang === 'en' ? 'en' : 'tr';
      runtime.lang = picked;
      runtime.save = { ...runtime.save, lang: picked };
      persist();
      paint();
      return;
    }
    if (action === 'play') begin(continueLevelId(runtime.save));
    else if (action === 'levels') {
      runtime.pending = null;
      runtime.sheet = null;
      runtime.screen = 'levels';
      paint();
    } else if (action === 'help') {
      runtime.screen = 'help';
      paint();
    } else if (action === 'title') {
      runtime.pending = null;
      runtime.sheet = null;
      runtime.screen = 'title';
      paint();
    } else if (action === 'level') {
      const id = Number(source.dataset.id);
      begin(id);
    } else if (action === 'back') {
      if (runtime.screen === 'game' && !runtime.sheet && runtime.run.phase !== 'won' && runtime.run.phase !== 'lost') {
        runtime.sheet = 'pause';
        paint();
        shell.focusSheet();
      }
    } else if (action === 'pause') {
      if (!runtime.sheet && (runtime.run.phase === 'aim' || runtime.run.phase === 'sliding')) {
        runtime.sheet = 'pause';
        paint();
        shell.focusSheet();
      }
    } else if (action === 'resume') {
      runtime.sheet = null;
      paint();
    } else if (action === 'retry') begin(runtime.level.id, true);
    else if (action === 'next') begin(runtime.level.id + 1, true);
    else if (action === 'coach-skip') finishCoach();
    else if (action === 'coach-next') {
      runtime.coachStep += 1;
      if (runtime.coachStep > 3) finishCoach();
      else paint();
    }
  });

  const canvas = shell.canvas;
  const toWorld = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WORLD_W,
      y: ((event.clientY - rect.top) / rect.height) * WORLD_H,
    };
  };

  const updateAim = (pointerId: number, point: { x: number; y: number }) => {
    const aim = aimFromDrag(runtime.run.x, runtime.run.y, point.x, point.y);
    runtime.aim = { pointerId, ...aim };
    runtime.preview = aim.active
      ? predict(runtime.level, runtime.run.x, runtime.run.y, aim.angle, aim.power, runtime.run.collected)
      : null;
    if (aim.active) runtime.fingerDone = true;
    shell.setAiming(aim.active);
  };

  const release = (event: PointerEvent) => {
    if (!runtime.aim || runtime.aim.pointerId !== event.pointerId) return;
    updateAim(event.pointerId, toWorld(event));
    const aim = runtime.aim;
    runtime.aim = null;
    runtime.preview = null;
    shell.setAiming(false);
    if (runtime.sheet || runtime.run.phase !== 'aim') return;
    if (launch(runtime.run, aim.angle, aim.power)) {
      runtime.trail = [];
      sfx.launch();
      buzz(12, runtime.save.muted);
      if (runtime.coachStep > 0) {
        runtime.coachStep = 0;
        runtime.save = { ...runtime.save, onboarded: true };
        persist();
      }
      paint();
    }
  };

  canvas.addEventListener('pointerdown', (event) => {
    if (runtime.screen !== 'game' || runtime.sheet || runtime.run.phase !== 'aim') return;
    sfx.unlock();
    const point = toWorld(event);
    if (!canGrab(runtime.run.x, runtime.run.y, point.x, point.y)) return;
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
    updateAim(event.pointerId, point);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!runtime.aim || runtime.aim.pointerId !== event.pointerId) return;
    updateAim(event.pointerId, toWorld(event));
  });
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'm') {
      sourceClick('mute');
      return;
    }
    if (key === 'escape') {
      if (runtime.screen !== 'game') {
        runtime.screen = 'title';
        runtime.sheet = null;
        paint();
        return;
      }
      if (runtime.sheet === 'pause') {
        runtime.sheet = null;
        paint();
      } else if (!runtime.sheet && (runtime.run.phase === 'aim' || runtime.run.phase === 'sliding')) {
        runtime.sheet = 'pause';
        paint();
        shell.focusSheet();
      }
      return;
    }
    if (key === 'r' && runtime.screen === 'game') begin(runtime.level.id, true);
  });

  function sourceClick(action: string): void {
    const button = root.querySelector<HTMLElement>(`[data-action="${action}"]`);
    if (button) button.click();
  }

  const fit = () => {
    const bounds = shell.stage.getBoundingClientRect();
    const aspect = WORLD_W / WORLD_H;
    let width = bounds.width;
    let height = width / aspect;
    if (height > bounds.height) {
      height = bounds.height;
      width = height * aspect;
    }
    width = Math.max(1, Math.floor(width));
    height = Math.max(1, Math.floor(height));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bufferW = Math.max(1, Math.floor(width * dpr));
    const bufferH = Math.max(1, Math.floor(height * dpr));
    if (canvas.width !== bufferW || canvas.height !== bufferH) {
      canvas.width = bufferW;
      canvas.height = bufferH;
    }
  };

  const placeFinger = () => {
    const show =
      runtime.screen === 'game' &&
      runtime.level.id === 1 &&
      runtime.run.phase === 'aim' &&
      runtime.run.shotsUsed === 0 &&
      !runtime.fingerDone &&
      !runtime.aim?.active &&
      (runtime.coachStep === 0 || runtime.coachStep === 1);
    shell.finger.hidden = !show;
    if (!show) return;
    const stageRect = shell.stage.getBoundingClientRect();
    const rect = canvas.getBoundingClientRect();
    const x = rect.left - stageRect.left + (runtime.run.x / WORLD_W) * rect.width;
    const y = rect.top - stageRect.top + (runtime.run.y / WORLD_H) * rect.height;
    shell.finger.style.left = `${x}px`;
    shell.finger.style.top = `${y}px`;
  };

  let simDirty = false;
  const noteOutcome = (events: ReturnType<typeof step>) => {
    for (const event of events) {
      if (event.type === 'bounce' && performance.now() - runtime.lastBounce > 90) {
        runtime.lastBounce = performance.now();
        sfx.bounce(event.speed);
      } else if (event.type === 'collect') {
        const bubble = runtime.level.bubbles[event.index];
        sfx.collect();
        if (bubble) spawnBurst(runtime.particles, bubble.x, bubble.y, '#fff4c2', 10, 80);
        simDirty = true;
      } else if (event.type === 'drain') {
        sfx.drain();
        buzz(18, runtime.save.muted);
        spawnBurst(runtime.particles, event.x, event.y, '#9fd8e4', 14, 60);
        if (runtime.run.phase !== 'lost') {
          runtime.toast = t(runtime.lang, 'drainToast');
          runtime.toastUntil = performance.now() + 1400;
        }
        simDirty = true;
      } else if (event.type === 'win' && !runtime.recorded) {
        runtime.recorded = true;
        const stars = rateRun(runtime.level, runtime.run);
        runtime.save = applyWin(runtime.save, runtime.level.id, stars, runtime.run.shotsUsed);
        runtime.save = { ...runtime.save, onboarded: true };
        persist();
        sfx.win();
        buzz(16, runtime.save.muted);
        spawnBurst(runtime.particles, runtime.run.x, runtime.run.y, '#ffe08a', 18, 110);
        runtime.pending = { at: performance.now() + 700, sheet: 'win' };
        simDirty = true;
      } else if (event.type === 'lose') {
        sfx.fail();
        runtime.pending = { at: performance.now() + 450, sheet: 'lose' };
        simDirty = true;
      } else if (event.type === 'rest') simDirty = true;
    }
  };

  paint();
  const requested = Number(new URLSearchParams(location.search).get('level'));
  if (Number.isInteger(requested) && requested >= 1 && requested <= LEVEL_COUNT) begin(requested, true);

  let last = performance.now();
  let accumulator = 0;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    simDirty = false;
    const playing = runtime.screen === 'game' && !runtime.sheet && runtime.run.phase === 'sliding';
    if (playing) {
      accumulator += dt;
      let guard = 0;
      while (accumulator >= FIXED_DT && runtime.run.phase === 'sliding' && guard < 8) {
        noteOutcome(step(runtime.run, runtime.level, FIXED_DT));
        accumulator -= FIXED_DT;
        guard += 1;
      }
    } else {
      accumulator = 0;
    }
    if (simDirty) paint();
    const speed = Math.hypot(runtime.run.vx, runtime.run.vy);
    if (playing && speed > 80 && Math.random() < 0.7) {
      spawnSud(runtime.particles, runtime.run.x, runtime.run.y, runtime.run.vx, runtime.run.vy);
    }
    if (playing) {
      const previous = runtime.trail[runtime.trail.length - 1];
      if (!previous || Math.hypot(previous.x - runtime.run.x, previous.y - runtime.run.y) > 7) {
        runtime.trail.push({ x: runtime.run.x, y: runtime.run.y });
        if (runtime.trail.length > 24) runtime.trail.shift();
      }
    }
    updateParticles(runtime.particles, dt);
    const target = speed > 40 ? Math.atan2(runtime.run.vy, runtime.run.vx) : -0.4;
    const delta = Math.atan2(Math.sin(target - runtime.displayAngle), Math.cos(target - runtime.displayAngle));
    runtime.displayAngle += delta * (1 - Math.exp(-dt * (speed > 40 ? 12 : 3)));

    if (runtime.toast && now > runtime.toastUntil) {
      runtime.toast = null;
      paint();
    }
    if (runtime.pending && now >= runtime.pending.at && runtime.screen === 'game' && !runtime.sheet) {
      runtime.sheet = runtime.pending.sheet;
      runtime.pending = null;
      paint();
      shell.focusSheet();
    }
    if (runtime.screen === 'game') {
      fit();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(canvas.width / WORLD_W, 0, 0, canvas.height / WORLD_H, 0, 0);
        drawScene(ctx, {
          level: runtime.level,
          run: runtime.run,
          aim: runtime.aim,
          preview: runtime.preview,
          trail: runtime.trail,
          particles: runtime.particles,
          time: now / 1000,
          angle: runtime.displayAngle,
          stretch: Math.min(0.2, (speed / MAX_SPEED) * 0.28),
        });
      }
      placeFinger();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function buildModel(runtime: Runtime): ShellModel {
  const { lang, save, level, run } = runtime;
  const next = getLevel(continueLevelId(save));
  const cards = LEVELS.map((entry) => {
    const record = save.levels[String(entry.id)];
    const locked = entry.id > save.unlocked;
    return {
      id: entry.id,
      name: entry.name[lang],
      locked,
      stars: record?.stars ?? 0,
      meta: locked ? t(lang, 'locked') : record?.cleared ? t(lang, 'best', { n: record.bestShots }) : '',
    };
  });
  const coachKeys = ['coach1', 'coach2', 'coach3'] as const;
  const coachKey = coachKeys[runtime.coachStep - 1];
  let sheet: ShellModel['sheet'] = null;
  if (runtime.sheet === 'pause') {
    sheet = {
      kind: 'pause',
      title: t(lang, 'paused'),
      body: t(lang, 'pausedBody'),
      extra: '',
      stars: 0,
      actions: [
        { action: 'resume', label: t(lang, 'resume'), primary: true },
        { action: 'retry', label: t(lang, 'retry') },
        { action: 'levels', label: t(lang, 'toLevels') },
      ],
    };
  } else if (runtime.sheet === 'win') {
    const hasNext = level.id < LEVEL_COUNT;
    const allClear = LEVELS.every((entry) => save.levels[String(entry.id)]?.cleared);
    sheet = {
      kind: 'win',
      title: t(lang, 'winTitle'),
      body: t(lang, 'winBody', { shots: run.shotsUsed, par: level.par }),
      extra: allClear ? t(lang, 'allClear') : '',
      stars: rateRun(level, run),
      actions: hasNext
        ? [
            { action: 'next', label: t(lang, 'next'), primary: true },
            { action: 'retry', label: t(lang, 'retry') },
            { action: 'levels', label: t(lang, 'toLevels') },
          ]
        : [
            { action: 'levels', label: t(lang, 'toLevels'), primary: true },
            { action: 'retry', label: t(lang, 'retry') },
          ],
    };
  } else if (runtime.sheet === 'lose') {
    sheet = {
      kind: 'lose',
      title: t(lang, 'loseTitle'),
      body: t(lang, 'loseBody'),
      extra: '',
      stars: 0,
      actions: [
        { action: 'retry', label: t(lang, 'retryLevel'), primary: true },
        { action: 'levels', label: t(lang, 'toLevels') },
      ],
    };
  }
  return {
    lang,
    muted: save.muted,
    continueLabel: t(lang, 'continueAt', { name: next?.name[lang] ?? level.name[lang] }),
    starLabel: t(lang, 'starsTotal', { n: totalStars(save), max: maxStars() }),
    cards,
    hud: {
      kicker: `${t(lang, 'levelKicker', { n: level.id })} · ${t(lang, 'par', { n: level.par })}`,
      title: level.name[lang],
      shots: t(lang, 'shots', { left: run.shotsLeft }),
      bubbles: t(lang, 'bubbles', { n: collectedCount(run), max: level.bubbles.length }),
      hint: level.hint[lang],
    },
    sheet,
    coach: coachKey
      ? {
          progress: t(lang, 'coachProgress', { n: runtime.coachStep, max: 3 }),
          text: t(lang, coachKey),
          next: runtime.coachStep === 3 ? t(lang, 'start') : t(lang, 'nextCoach'),
        }
      : null,
    toast: runtime.toast,
  };
}
