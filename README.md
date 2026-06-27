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
- a mobile-first duel cockpit with compact combat strip, board frame, action dock, and latest-event line;
- mobile touch controls: drag/swipe gems as the primary input, with tap-tap as fallback;
- move preview for selected swaps;
- visible enemy turn feedback, including enemy action state, board highlights, and latest-event summary;
- first playable board-changing spells;
- stable portrait and gem asset slots with CSS fallbacks;
- first-pass Aurora Knight and Shade Knight portrait assets;
- first-pass readable gem sprite assets;
- a `Style` view for the AeroCandy 2007 visual direction;
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
