# Kingdom Duel — Demo Script

A short guide to running the build and showing it in about two minutes.

## Run It

```bash
npm ci
npm run dev            # http://localhost:5173/
# or the production build
npx vite build && npx vite preview   # http://localhost:4173/
```

Use a phone, or desktop devtools at **390×844**. The layout also works on desktop.

To reset to a first-time visitor, clear site data. The run save is `kingdom-duel.run.v2` and the coach progress is `kingdom-duel.coach.v1`. You can also switch **Coach hints** off and on again on the title screen to replay the hints.

Automated walkthrough with screenshots (needs a running dev server and a Chromium binary):

```bash
npm run dev -- --host 127.0.0.1 --port 4173 &
DEMO_URL=http://127.0.0.1:4173/ DEMO_SHOTS=tmp/demo-shots DEMO_SEED=2009 \
  PW_CHROMIUM_EXECUTABLE=/path/to/chromium npm run demo:play
# DEMO_VIEWPORT=1280x800, DEMO_MODE=daily, DEMO_MOTION=1 are optional
```

Sound starts after the first tap. Toggle it on the title screen (*Sound*, *Music*) or with the ♪ button in the battle cockpit. To show offline play, open the production build (`npx vite build && npx vite preview`), reload once, switch the browser offline and reload again.

The bot plays each turn with the spell-aware simulator policy through the real UI: taps, spell aim and confirm, reward choice and the recap.

## Two-Minute Walkthrough

1. **Title (10 s).** Aurora faces Shade, with three options: *Continue run*, *New run* and *Daily seed* (the same boards for everyone that UTC day). Point at the four-line *How to play*.
2. **First duel, Glass Edge (40 s).** Tap **New run**. The purple **Coach** card explains swapping. Tap *Got it* and make a match (tap a gem, then a neighbour, or swipe).
   - Drag a gem toward a neighbour (or hover with a mouse after selecting) to show the **move preview**: damage, Guard and mana before you commit. Pink sockets warn about Shade backlash.
   - Point out the pink **intent rail**, which shows what Shade Knight will do next and its Veil Rift charge (`M3/5`).
   - Gems slide, pop and drop through each cascade, with a rising chime per cascade step.
   - Hits show **floating numbers** and the portrait shakes.
3. **Cast a spell (20 s).** When a spell charges, the coach spotlights it with a pulsing green ring. Tap the spell, tap a target to preview the exact result, then tap the same tile again to cast.
4. **Victory → prism (20 s).** A **Victory** banner appears and the recap explains the deciding exchange. Tap **Choose a prism** and pick one of three mechanical upgrades. They change rules, not percentages; for example, Solar Halo turns Sun Bloom into a 3×3 field.
5. **Route and resume (15 s).** Tap **⌂** to go home, reload the page and tap **Continue run**. The duel resumes exactly, including a pending enemy turn.
6. **Boss and recap (15 s).** The route is normal → normal → elite → **Eclipse Crown** boss. The run recap lists each encounter, its turns and actions, and the final build, with buttons for a new run or the daily seed.

Shortcut for a live demo: `DEMO_SEED=2009` is a seed the bot clears end to end in about 25 player actions, so you can show the boss and the *Run complete* recap without playing a full run by hand.

## Talking Points

- Deterministic engine: the same seed and actions always produce the same duel. Debug traces copy from the log sheet.
- Every gem is a trade-off on one shared board: damage, defence, mana and denial.
- Mobile first: tap-tap or swipe, works with keyboard, and plays at 390×700.
