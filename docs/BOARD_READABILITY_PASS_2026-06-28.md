# Board Readability Pass

Date: 2026-06-28
Pass: 11

## Goal

Improve gem and state readability on the mobile 390px cockpit without changing board size or mechanics.

## Direction

- Keep sprite gems as the main identity layer.
- Add subtle color backplates behind loaded sprites so tile kind stays readable when sprites are small.
- Separate state meanings:
  - selected: warm square anchor ring
  - valid target: aqua bullseye
  - preview/matched cells: cyan route ring
  - enemy threat: magenta danger notch
- Avoid new text labels on the board; the board must stay compact and tappable.

## Acceptance

- On a 390x844 screenshot, board cells should remain tappable, non-overlapping, and visually distinct.
- Threat cells should not be confused with valid swap targets.
- Sprite silhouettes should remain visible over the glossy AeroCandy surfaces.
