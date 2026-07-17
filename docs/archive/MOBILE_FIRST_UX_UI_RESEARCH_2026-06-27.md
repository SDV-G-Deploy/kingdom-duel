# Kingdom Duel Mobile-First UX/UI Research

Date: 2026-06-27

## Current Problem

The current mobile layout works technically, but it is not a mobile game screen yet.

On a phone, the page reads as a vertical prototype document:

- top nav,
- huge title card,
- player card,
- board card,
- enemy card,
- decision card,
- spell cards,
- combat log.

That is too much scroll before gameplay has a stable shape. The first mobile viewport should feel like a battle screen, not like a responsive landing page.

## Target Direction

Mobile target direction: **single-hand duel cockpit**.

The board remains the main object. Hero, enemy, intent, HP, spells, and log become compact layers around it.

Preserve:

- bright AeroCandy 2007 / glass future direction;
- shared-board duel;
- move preview and enemy intent;
- board-changing spells.

Reduce:

- title/header size;
- standalone player/enemy cards;
- always-visible combat log;
- large moodboard navigation inside the play screen.

Kill for mobile gameplay:

- long page-scroll as the default play mode;
- separate full cards for every system;
- CSS-only placeholder character blobs as final art;
- primitive CSS gems as final tile language.

## Reference Lessons

Observed patterns from mobile match-3 RPG references:

- Puzzle RPGs sell the board as the interaction center, then attach heroes, enemies, spells, and resource meters around it.
- Spells matter when they can alter the gem board, not when they feel like external buttons.
- Enemy spells/intents are stronger when visible in the battle UI, not hidden in logs.
- Hero/roster art is not decoration; it is a readability and motivation layer.
- Mobile stores screenshots emphasize characters, board, powers, and collectible identity in the first glance.

Sources checked:

- Puzzle Quest 3 design note on spells altering the gem board: https://puzzlequest3.com/evolving-the-match-3-rpg/
- Puzzle Quest 3 action points note: enemy spells visible in UI and one-enemy focus: https://puzzlequest3.com/new-game-mode-action-points/
- Gems of War mobile store framing: heroes and match-3 combat as one loop: https://play.google.com/store/apps/details?id=air.com.and.games505.gemsofwar
- MARVEL Puzzle Quest mobile framing: large character roster plus match-3 battle identity: https://apps.apple.com/us/app/marvel-puzzle-quest-hero-rpg/id618349779
- Magic: Puzzle Quest mobile framing: spells, creatures, and match-3 battles: https://play.google.com/store/apps/details?id=com.d3p.olympic
- Candy Crush official control description: tap and drag in the desired direction to swap: https://candycrush.zendesk.com/hc/en-us/articles/360000750278-Controls-how-to-switch-and-match-candies
- MDN `touch-action`: game surfaces can disable browser gestures locally when implementing custom dragging: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action
- Match-3 state-machine discussion: click/tap two adjacent tiles, evaluate, invalid swaps snap back: https://www.reddit.com/r/gamedesign/comments/18wq99z/match3_game_design/
- Match-3 rule summary with both tap-adjacent and swipe-one-cell controls: https://quietpuzzle.com/en/match3

## Recommended Mobile Information Architecture

### Primary Mobile Screen: Duel

Everything needed for the next move should fit in one viewport on a 390px-wide phone, or very close to it.

Suggested order:

1. **Compact Top Bar**
   - `Kingdom Duel`
   - small icon buttons: restart, moodboard/debug
   - height target: 44-52px

2. **Combat Strip**
   - hero portrait left,
   - enemy portrait right,
   - HP/guard bars,
   - current turn / enemy intent in the center or under enemy,
   - height target: 92-120px.

3. **Board**
   - square board,
   - full width with 10-12px side gutters,
   - no big surrounding card,
   - max visual priority.

4. **Action Dock**
   - decision preview line,
   - 3 spell buttons in a compact horizontal row or 2x2 grid,
   - mana costs and disabled states,
   - height target: 120-160px.

5. **Collapsed Log**
   - one latest event line only;
   - full log opens as a sheet/tab.

This is the default play experience.

### Secondary Mobile Panels

Use tabs/sheets for information that is useful but not required every second:

- `Duel` - main play cockpit;
- `Hero` - hero stats, mana, spell descriptions, future relics;
- `Enemy` - enemy portrait, intent explanation, affinities;
- `Log` - full combat log;
- `Style` or `Moodboard` - keep as a dev/reference view, not the default play route.

The player should not need to scroll through all panels during normal play.

## Mobile Touch Control Model

The current mobile interaction is ambiguous:

- first tap selects a gem;
- the gem highlights;
- the page re-renders;
- the user does not see clearly which second taps are valid;
- non-adjacent taps feel like the game is doing something mysterious;
- because the page is tall, board touches compete psychologically with scroll.

This should become an explicit mobile board interaction model.

### Recommended Control Priority

Primary control:

1. **Swipe / drag one gem toward an adjacent cell.**
   - This is the mobile match-3 default.
   - It feels direct and avoids "what now?" after first tap.
   - A short drag threshold should choose direction.

Fallback control:

2. **Tap gem, then tap adjacent target.**
   - Useful for accessibility, precision, and desktop parity.
   - After first tap, the UI must show eligible adjacent targets.

Do not rely only on tap-select. It is too quiet for a phone unless the valid target hints are obvious.

### Tap-Tap Rules

When the user taps a gem:

- selected gem gets a strong ring;
- legal adjacent swap targets get a bright "can move here" hint;
- adjacent but invalid swaps get a softer "would snap back" hint only if needed;
- non-adjacent gems should not look equally clickable.

Second tap behavior:

- if second tap is a legal adjacent swap: perform swap;
- if adjacent but invalid: animate swap and snap back, then keep or clear selection;
- if non-adjacent: move selection to the newly tapped gem, do not log an error;
- if tapping selected gem again: clear selection.

The player should never need to read a log to know whether a move was valid.

### Swipe / Drag Rules

Pointer flow:

- `pointerdown` on gem stores origin cell and pointer position;
- movement beyond threshold chooses direction;
- direction maps to one adjacent cell;
- release attempts that swap;
- if the move is invalid, show a short bump/snap-back animation;
- if valid, lock input while resolving.

Threshold:

- 18-24px on mobile;
- ignore tiny accidental moves;
- cancel drag if pointer leaves board too far.

Browser behavior:

- board gets `touch-action: none` only inside the playable board surface;
- page/sheets outside the board retain normal scroll;
- during `resolving` and `enemy-turn`, board input is disabled.

### Preview Behavior On Touch

Desktop hover preview does not exist on touch. Mobile needs a different preview contract:

- on first tap: show best preview for the selected gem if only one legal adjacent move exists;
- if multiple adjacent legal moves exist: show small directional hints on each legal neighbor;
- on pressing/dragging toward a neighbor: preview that swap in the action dock before release when possible;
- after selection, the action dock text should change from generic "Select a tile" to "Tap a highlighted neighbor or swipe".

### Animation / Re-render Feel

The current "screen updates every tap" feeling likely comes from full `renderApp()` replacement after selection/hover state changes.

Fix:

- keep state-driven rendering, but reduce perceived redraw:
  - no layout position changes on selection;
  - stable board dimensions;
  - selection rings via classes only;
  - avoid text block changes that resize the board area;
  - animate selected/target rings, not the whole card.

Acceptance:

- first tap should not move the page or resize any card;
- second tap should produce swap/snap feedback;
- invalid move should feel like a board response, not a system error;
- no vertical page scroll starts when swiping inside the board.

## Layout Proposal

### Mobile 390px

Use a fixed-ish game shell:

- body no longer behaves like a tall document during `play`;
- play shell fills `100dvh`;
- top bar fixed height;
- board gets a stable square region;
- bottom action dock can be sticky or fixed inside the shell;
- secondary panels open as overlay sheets, not inline cards.

Approximate allocation:

- top bar: 48px;
- combat strip: 108px;
- board: 360px;
- action dock: 150px;
- latest event: 34px.

Total: ~700px, which fits many modern phones in portrait if chrome is not too tall. On smaller screens, compress action dock and use sheet tabs.

### Desktop

Desktop can keep a wider layout, but should still adopt the new hierarchy:

- board center;
- hero/enemy art as side portraits;
- spells as a dock, not disabled-looking cards;
- log as a side rail or bottom compact list.

Desktop should not drive the mobile structure.

## Hero and Enemy Art Plan

The current blue/pink blobs are useful placeholders, but they do not sell RPG identity.

Needed bounded assets:

### Hero Portrait: Aurora Knight

Slot:

- mobile combat strip portrait: 72-96px;
- desktop side card portrait: 220-320px;
- source asset: 768x768 or 1024x1024 transparent PNG/WebP.

Art direction:

- optimistic glass knight / solar paladin;
- early-2000s glossy toy-like 3D;
- aqua, sun yellow, clean white, tiny lime accent;
- friendly silhouette, readable at 80px;
- no medieval grimdark armor;
- no realistic face detail.

### Enemy Portrait: Shade Knight

Slot:

- mobile combat strip portrait: 72-96px;
- desktop side card portrait: 220-320px;
- source asset: 768x768 or 1024x1024 transparent PNG/WebP.

Art direction:

- glossy violet/pink glass rival;
- elegant, dangerous, not horror;
- shade energy as candy-like refraction;
- clear helmet/crest silhouette;
- no black smoky fantasy blob.

### Asset Rules

- transparent background;
- no embedded text;
- no UI frame baked into the art;
- strong silhouette at 72px;
- compressed WebP/AVIF for deploy;
- CSS glass fallback if image fails.

## Gem Art Plan

Current gems are colorful but primitive because they are CSS shapes with simple pseudo-icons.

For the next visual pass, make a bounded tile asset set:

- `sword` - aqua glass blade drop;
- `shield` - lime glass shield;
- `sun` - golden sun drop;
- `moon` - violet pearl crescent;
- `crown` - orange/yellow crown gem;
- `shade` - pink/violet danger shard.

Source size:

- generate/paint at 256x256;
- ship 128x128 or 96x96 WebP/PNG depending quality;
- keep transparent background;
- keep large top-left highlight;
- keep icon silhouette inside the gem, not tiny line art.

Acceptance checks:

- readable at 48px mobile;
- distinct in grayscale enough to avoid pure color dependence;
- shade reads as risky;
- no text, logos, noisy micro-details;
- file budget: ideally under 25-40KB per tile after compression.

## Component Model

Replace the current tall mobile card stack with these reusable components:

- `GameShell`
- `TopGameBar`
- `CombatStrip`
- `PortraitBadge`
- `BoardFrame`
- `ActionDock`
- `SpellButton`
- `IntentBadge`
- `LatestEvent`
- `InfoSheet`

State vocabulary:

- `player-turn`;
- `enemy-turn`;
- `selecting-swap`;
- `previewing-swap`;
- `targeting-spell`;
- `resolving`;
- `battle-ended`.

The UI should render from state, not from page sections.

## Priority Fixes

### P0 - Mobile Play Screen Is Too Tall

Evidence:

- The current 390px screenshot requires long vertical scroll before the user sees all relevant battle systems.

Impact:

- The player is reading the page instead of playing the board.

Fix:

- Convert mobile play view into a `100dvh` game shell with compact combat strip, board, action dock, and collapsible log.

Acceptance:

- On 390x844, the player can see combat state, board, and primary action dock without scrolling.
- If not physically possible, only secondary details scroll inside a sheet, not the whole page.

### P1 - Character Identity Is Missing

Evidence:

- Hero and enemy are currently generic glossy blobs.

Impact:

- RPG duel has no emotional anchor; enemy intent is abstract.

Fix:

- Add bounded hero/enemy portrait assets and reserve stable portrait slots.

Acceptance:

- At mobile size, player can immediately distinguish hero and enemy by silhouette.

### P1 - Gems Are Still Prototype Tokens

Evidence:

- Current gems are CSS shapes and small pseudo-icons.

Impact:

- The style reads colorful but not premium/game-ready.

Fix:

- Generate or paint a coherent 6-tile AeroCandy gem set.

Acceptance:

- Each tile remains readable at 48px and 96px.

### P1 - Moodboard Navigation Competes With Gameplay

Evidence:

- `Playable / Moodboard` sits in the first mobile viewport.

Impact:

- It makes the game feel like a project page instead of a playable game.

Fix:

- On mobile, keep `Duel` primary and move moodboard to a small debug/info button or secondary sheet.

Acceptance:

- First viewport starts with game identity and combat state, not project navigation.

### P2 - Combat Log Is Too Prominent On Mobile

Evidence:

- Full log appears inline under spells.

Impact:

- It consumes vertical space that should belong to actions and board reading.

Fix:

- Show latest event line; full log in `Log` sheet.

Acceptance:

- Latest event is visible without forcing scroll; full log remains accessible.

### P1 - Touch Move Intent Is Ambiguous

Evidence:

- On mobile, tapping a gem highlights it but does not clearly answer "what can I do now?"

Impact:

- The user feels like the UI has selected something but has not entered a known game action.

Fix:

- Add swipe-to-swap primary control and tap-adjacent fallback.
- Highlight legal adjacent targets immediately after selection.
- Add snap-back feedback for invalid adjacent swaps.

Acceptance:

- On a phone, the user can make a valid swap with one directional swipe.
- With tap-tap, the second tap target is visually obvious.
- Non-adjacent taps change selection rather than creating confusing invalid feedback.

## Next Implementation Pass

Recommended milestone: `Mobile Duel Cockpit + Art Slots`.

Do in this order:

1. Convert play route to mobile-first cockpit layout.
2. Replace current tap-only ambiguity with swipe-to-swap plus tap-adjacent fallback.
3. Add `Duel / Hero / Enemy / Log` or sheet-based secondary panels.
4. Replace actor cards with compact combat strip.
5. Add stable portrait slots with temporary local generated images or refined placeholders.
6. Add real gem asset slots and CSS fallback.
7. Keep desktop working, but let mobile structure drive the component model.
8. Capture and compare:
   - 390x844 mobile,
   - 390x1200 mobile full-page,
   - 1440 desktop.

## Art Generation Briefs For Next Pass

Use image generation only for bounded assets, not for whole screens.

### Hero Prompt

Transparent-background game character portrait, optimistic early-2000s Frutiger Aero / Windows Aero inspired glossy toy-like 3D, Aurora Knight, friendly solar glass paladin, aqua glass armor, sun-yellow highlights, clean white rim lights, lime eco-tech accent, rounded readable silhouette, polished game asset, bright hopeful future, readable at small mobile UI size, no text, no logo, no dark medieval grit, no realism, no cyberpunk.

### Enemy Prompt

Transparent-background game character portrait, glossy early-2000s Frutiger Aero rival knight, Shade Knight, violet and bubble-pink glass armor, elegant dangerous silhouette, candy-like refraction, clean specular highlights, playful but threatening, readable at small mobile UI size, no horror, no black smoke, no dirty fantasy, no text, no logo.

### Gem Set Prompt

Six transparent-background match-3 tile sprites in one coherent AeroCandy 2007 style: sword aqua glass blade drop, shield lime glass shield, sun golden drop, moon violet pearl crescent, crown orange-yellow crown gem, shade pink-violet danger shard. Glossy glass candy material, strong silhouettes, big top-left white highlight, subtle inner glow, soft shadow, readable at 48px and 96px, no text, no logos, no busy reflections, no dark grunge.

## Recommendation

Do not polish the current vertical mobile page.

The right move is to rebuild the play route as a mobile-first game cockpit, then add art assets into stable slots. That gives us both usability and style: one screen for play, sheets for details, real characters/gems for identity.
