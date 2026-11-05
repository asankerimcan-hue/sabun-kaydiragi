# Sabun Kaydırağı

A mobile puzzle about sliding a bar of soap across wet tile. Pull it back, let go, and live with the momentum. Friction, walls, drains, and a shot limit decide whether it comes to rest in the dish.

By Kerim Can Aşan and Ali Caka.

## Play

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://127.0.0.1:5173/). The board is portrait-first: on a phone it fills the screen, and on a wide desktop it sits in a centered column. Progress, mute, and language are stored in `localStorage` under `sabun-kaydiragi-save-v1`.

`?level=3` jumps straight to a level while you are trying a layout.

## How to play

- Press the soap and pull back. The arrow is the direction it will travel; a longer pull is a faster slide.
- Release. The soap slows down, bounces off walls and sponges, and stops.
- Land at rest inside the dish. Passing over it does not count.
- Drains cost the shot and send the soap back to where that shot started.
- Bubbles and a par score are how a clear becomes three stars.
- Desktop keys: `R` retry, `M` mute, `Esc` pause.

The first visit shows a three-step coach on level 1. How to play stays available from the title.

## Checks

```bash
npm test
npm run build
```

`npm test` covers friction, bounces, drains, the dish (you must stop inside it), stars, save data, and a solved line for every level. `npm run build` typechecks and bundles. In the browser, the title, level select, how-to, language toggle, and mute were checked, and level 1 was cleared with the aim line and a three-star result. Nothing here is deployed.
