import { t, type StringKey } from '../game/i18n';
import type { Lang } from '../game/types';

export type ScreenName = 'title' | 'levels' | 'help' | 'game';
export type SheetKind = 'pause' | 'win' | 'lose';

export type LevelCard = {
  id: number;
  name: string;
  locked: boolean;
  stars: number;
  meta: string;
};

export type SheetModel = {
  kind: SheetKind;
  title: string;
  body: string;
  extra: string;
  stars: number;
  actions: { action: string; label: string; primary?: boolean }[];
};

export type ShellModel = {
  lang: Lang;
  muted: boolean;
  continueLabel: string;
  starLabel: string;
  cards: LevelCard[];
  hud: { kicker: string; title: string; shots: string; bubbles: string; hint: string };
  sheet: SheetModel | null;
  coach: { progress: string; text: string; next: string } | null;
  toast: string | null;
};

export type Shell = {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  finger: HTMLElement;
  setScreen(screen: ScreenName): void;
  setAiming(aiming: boolean): void;
  paint(model: ShellModel): void;
  focusSheet(): void;
};

const LANGS = `<div class="langs"><button type="button" class="lang-btn" data-action="lang" data-lang="tr">TR</button><button type="button" class="lang-btn" data-action="lang" data-lang="en">EN</button></div>`;

function speaker(muted: boolean): string {
  const wave = muted
    ? '<path d="M5 5l14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    : '<path d="M16 9.2a4 4 0 0 1 0 5.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9.5h3.2L12 5v14l-4.8-4.5H4z"/>${wave}</svg>`;
}

function starRow(count: number): string {
  return Array.from({ length: 3 }, (_, index) => {
    const on = index < count ? ' is-on' : '';
    return `<span class="star${on}" style="animation-delay:${index * 90}ms">★</span>`;
  }).join('');
}

export function mountShell(root: HTMLElement, onAction: (action: string, source: HTMLElement) => void): Shell {
  root.innerHTML = `
    <div class="scene" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div id="shell">
      <section id="view-title" class="view">
        <div class="title-top">
          ${LANGS}
          <button type="button" class="icon-btn mute" data-action="mute"></button>
        </div>
        <div class="title-body">
          <p class="eyebrow" data-copy="tagline"></p>
          <h1 class="logo">Sabun <span>Kaydırağı</span></h1>
          <div class="hero" aria-hidden="true">
            <div class="hero-floor">
              <i class="hero-bubble one"></i>
              <i class="hero-bubble two"></i>
              <div class="hero-soap"></div>
              <div class="hero-dish"></div>
            </div>
          </div>
          <p class="credit" data-copy="credit"></p>
          <button type="button" class="btn-primary" data-action="play" data-copy="play"></button>
          <p id="continue-label" class="continue"></p>
          <button type="button" class="btn-secondary" data-action="levels" data-copy="levels"></button>
          <button type="button" class="btn-secondary" data-action="help" data-copy="howTo"></button>
          <p id="stars-total" class="stars-total"></p>
        </div>
      </section>
      <section id="view-levels" class="view" hidden>
        <header class="bar">
          <button type="button" class="btn-ghost" data-action="title" data-copy="back"></button>
          <h1 data-copy="levels"></h1>
          ${LANGS}
        </header>
        <div class="scroll">
          <p id="stars-total-2" class="stars-total"></p>
          <div id="level-grid" class="level-grid"></div>
        </div>
      </section>
      <section id="view-help" class="view" hidden>
        <header class="bar">
          <button type="button" class="btn-ghost" data-action="title" data-copy="back"></button>
          <h1 data-copy="howTo"></h1>
          ${LANGS}
        </header>
        <div class="scroll help">
          <ol class="steps">
            <li><b>1</b><div><h2 data-copy="help1Title"></h2><p data-copy="help1"></p></div></li>
            <li><b>2</b><div><h2 data-copy="help2Title"></h2><p data-copy="help2"></p></div></li>
            <li><b>3</b><div><h2 data-copy="help3Title"></h2><p data-copy="help3"></p></div></li>
            <li><b>4</b><div><h2 data-copy="help4Title"></h2><p data-copy="help4"></p></div></li>
          </ol>
          <h2 data-copy="legend"></h2>
          <ul class="legend">
            <li><i class="swatch soap"></i><span data-copy="lgSoap"></span></li>
            <li><i class="swatch dish"></i><span data-copy="lgDish"></span></li>
            <li><i class="swatch drain"></i><span data-copy="lgDrain"></span></li>
            <li><i class="swatch bubble"></i><span data-copy="lgBubble"></span></li>
            <li><i class="swatch sponge"></i><span data-copy="lgSponge"></span></li>
            <li><i class="swatch slick"></i><span data-copy="lgSlick"></span></li>
            <li><i class="swatch mat"></i><span data-copy="lgMat"></span></li>
            <li><i class="swatch wall"></i><span data-copy="lgWall"></span></li>
          </ul>
          <p class="keys" data-copy="keys"></p>
        </div>
      </section>
      <section id="view-game" class="view" hidden>
        <header class="hud">
          <button type="button" class="icon-btn" data-action="back" id="hud-back" aria-label="Back">←</button>
          <div class="hud-copy">
            <p id="hud-kicker"></p>
            <h1 id="hud-title"></h1>
          </div>
          <button type="button" class="icon-btn mute" data-action="mute"></button>
        </header>
        <div id="coach" class="coach" hidden>
          <p id="coach-progress"></p>
          <p id="coach-text"></p>
          <div class="coach-actions">
            <button type="button" class="btn-ghost" data-action="coach-skip" data-copy="skip"></button>
            <button type="button" class="btn-primary slim" data-action="coach-next" id="coach-next"></button>
          </div>
        </div>
        <div id="stage">
          <canvas id="board" width="320" height="560"></canvas>
          <div id="finger" class="finger" hidden><i></i></div>
          <p id="toast" class="toast" hidden></p>
        </div>
        <footer class="dock">
          <div class="stats">
            <span id="hud-shots"></span>
            <span id="hud-bubbles"></span>
          </div>
          <p id="hud-hint"></p>
          <div class="dock-actions">
            <button type="button" class="btn-secondary" data-action="retry" data-copy="retry"></button>
            <button type="button" class="btn-secondary" data-action="pause" data-copy="pause"></button>
          </div>
        </footer>
      </section>
      <div id="sheet" hidden>
        <div class="sheet-card" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <div id="sheet-stars" class="sheet-stars" hidden></div>
          <h2 id="sheet-title"></h2>
          <p id="sheet-body"></p>
          <p id="sheet-extra" class="extra" hidden></p>
          <div id="sheet-actions" class="sheet-actions"></div>
        </div>
      </div>
    </div>
  `;

  root.addEventListener('click', (event) => {
    const source = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]');
    if (!source || source.hasAttribute('disabled')) return;
    onAction(source.dataset.action ?? '', source);
  });

  const canvas = root.querySelector<HTMLCanvasElement>('#board');
  const stage = root.querySelector<HTMLElement>('#stage');
  const finger = root.querySelector<HTMLElement>('#finger');
  if (!canvas || !stage || !finger) throw new Error('Game shell is missing its board.');

  const text = (id: string, value: string) => {
    const node = root.querySelector<HTMLElement>(`#${id}`);
    if (node && node.textContent !== value) node.textContent = value;
  };

  let sheetSignature = '';

  const paint = (model: ShellModel) => {
    document.documentElement.lang = model.lang;
    root.querySelectorAll<HTMLElement>('[data-copy]').forEach((node) => {
      const key = node.dataset.copy as StringKey | undefined;
      if (!key) return;
      node.textContent = t(model.lang, key);
    });
    root.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((button) => {
      button.classList.toggle('is-on', button.dataset.lang === model.lang);
    });
    const label = t(model.lang, model.muted ? 'unmute' : 'mute');
    root.querySelectorAll<HTMLButtonElement>('.mute').forEach((button) => {
      button.innerHTML = speaker(model.muted);
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', model.muted ? 'true' : 'false');
    });
    const back = root.querySelector<HTMLButtonElement>('#hud-back');
    if (back) back.setAttribute('aria-label', t(model.lang, 'back'));

    text('continue-label', model.continueLabel);
    text('stars-total', model.starLabel);
    text('stars-total-2', model.starLabel);
    text('hud-kicker', model.hud.kicker);
    text('hud-title', model.hud.title);
    text('hud-shots', model.hud.shots);
    text('hud-bubbles', model.hud.bubbles);
    text('hud-hint', model.hud.hint);

    const grid = root.querySelector('#level-grid');
    if (grid) {
      grid.innerHTML = model.cards
        .map((card) => {
          const locked = card.locked ? ' is-locked' : '';
          const disabled = card.locked ? ' disabled' : '';
          const detail = card.locked
            ? `<span class="level-meta">${card.meta}</span>`
            : `<span class="level-stars" aria-label="${card.stars}">${starRow(card.stars)}</span><span class="level-meta">${card.meta}</span>`;
          return `<button type="button" class="level-card${locked}" data-action="level" data-id="${card.id}"${disabled}>
            <span class="level-num">${card.id}</span>
            <span class="level-name">${card.name}</span>
            ${detail}
          </button>`;
        })
        .join('');
    }

    const coach = root.querySelector<HTMLElement>('#coach');
    if (coach) coach.hidden = !model.coach;
    if (model.coach) {
      text('coach-progress', model.coach.progress);
      text('coach-text', model.coach.text);
      text('coach-next', model.coach.next);
    }

    const toast = root.querySelector<HTMLElement>('#toast');
    if (toast) {
      toast.hidden = !model.toast;
      if (model.toast) toast.textContent = model.toast;
    }

    const sheet = root.querySelector<HTMLElement>('#sheet');
    const signature = model.sheet ? JSON.stringify(model.sheet) : '';
    if (sheet && signature !== sheetSignature) {
      sheetSignature = signature;
      sheet.hidden = !model.sheet;
      if (model.sheet) {
        text('sheet-title', model.sheet.title);
        text('sheet-body', model.sheet.body);
        const extra = root.querySelector<HTMLElement>('#sheet-extra');
        if (extra) {
          extra.hidden = !model.sheet.extra;
          extra.textContent = model.sheet.extra;
        }
        const stars = root.querySelector<HTMLElement>('#sheet-stars');
        if (stars) {
          stars.hidden = model.sheet.kind !== 'win';
          stars.innerHTML = starRow(model.sheet.stars);
        }
        const actions = root.querySelector('#sheet-actions');
        if (actions) {
          actions.innerHTML = model.sheet.actions
            .map(
              (action) =>
                `<button type="button" class="${action.primary ? 'btn-primary' : 'btn-secondary'}" data-action="${action.action}">${action.label}</button>`,
            )
            .join('');
        }
      }
    }
  };

  return {
    canvas,
    stage,
    finger,
    setScreen(screen) {
      for (const name of ['title', 'levels', 'help', 'game'] as const) {
        const view = root.querySelector<HTMLElement>(`#view-${name}`);
        if (view) view.hidden = name !== screen;
      }
    },
    setAiming(aiming) {
      canvas.classList.toggle('is-aiming', aiming);
    },
    paint,
    focusSheet() {
      root.querySelector<HTMLButtonElement>('#sheet-actions .btn-primary')?.focus();
    },
  };
}
