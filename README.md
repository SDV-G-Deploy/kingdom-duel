# Kingdom Duel

Clean standalone prototype for a Puzzle Quest-inspired match-3 RPG duel.

This repo intentionally does not reuse `LittleWarCraft2but`, `Kingdom OS 2000`, or old RTS/idle code. Those projects may be used only as distant visual backup references.

## Direction

Working visual language: **AeroCandy 2007**.

Core ingredients:

- Frutiger Aero / Windows Aero nostalgia
- glossy optimistic 2000s future
- clear match-3 tile readability
- glass candy objects, aqua panels, soft blur, sky/water/green optimism
- no dark medieval fantasy, cyberpunk, grunge, or busy unreadable gem clutter

## Current Artifact

The current app contains:

- a playable `Match Duel` core;
- move preview for selected swaps;
- visible enemy intent on the shared board;
- first playable board-changing spells;
- a `Moodboard` view for the AeroCandy 2007 visual direction;
- deterministic engine modules under `src/engine`;
- gameplay design notes under `docs/`.

Run:

```bash
npm install
npm run dev
```

Checks:

```bash
npm test
npm run build
```
