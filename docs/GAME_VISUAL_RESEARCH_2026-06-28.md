# Game Visual Research

Date: 2026-06-28
Subject: current 390x844 mobile play screen after the mobile HUD hierarchy pass
Evidence screenshot: `screenshots/research/current-390x844.png`

## User Critique

1. The broad gradient now feels unnecessary.
2. Frutiger Aero / Web 2.0 Gloss / skeuomorphism dissolved into AI-neutral pastel glass.
3. The screen still does not read as one coherent mobile game design.

## Pass 1 - Independent Review Consensus

Three independent lenses agreed on the same root problem:

- The board and gem assets are the most game-like layer.
- The HUD, log, top controls, actor panels, and action dock still read as tidy web components.
- The style is currently "pastel glassmorphism" more than Frutiger Aero / Web 2.0 Gloss.
- The gradient acts as a pleasant page fill, not as lighting, space, arena, or material.
- The screen lacks a battle frame: Aurora, Shade, board, enemy intent, and abilities do not yet feel physically connected.

The useful target phrase is:

> glossy glass duel arena, not gradient interface.

## Pass 2 - What Actually Broke

### 1. Material Law Is Missing

Current CSS uses one answer for many components: translucent panel, thin border, soft blur, aqua/pink tint.
That makes the interface coherent as a web skin, but weak as a game world.

The target needs one physical law:

- top-left light source;
- hard white specular highlight;
- saturated middle color;
- darker lower inner edge;
- contact shadow;
- double rim: white inner highlight plus colored/chrome outer rim.

### 2. The Gradient Has No Job

The background currently supplies color mood, but it does not explain:

- where the board sits;
- where the light comes from;
- whether this is water, glass, chrome, plastic, sky, or magic;
- why UI elements have this shape.

So it feels like generated atmosphere. It should become either:

- a quiet water-glass arena backing with caustic bands and small bubbles; or
- almost flat aqua pearl plastic, letting the physical UI carry the style.

### 3. The Battle Has No Single Frame

The mobile stack is functionally good, but visually it is still:

top app bar -> actor cards -> board -> action cards -> log.

A mobile game screen wants:

duel header -> arena tray -> command ribbon / skill bar.

The board should not be a page section. It should feel mounted inside a candy-glass tray that belongs to the duel header and action bar.

### 4. The Copy Still Sounds Like System State

Examples that keep the prototype feeling like a tool:

- `BOARD READY`
- `SHADE PLAN`
- `NEXT ACTION`
- `Select a tile`
- `6 swaps`
- `Log`
- `Style`

The copy is clearer than before, but not more game-like. It should become battle language:

- `Aurora's move`
- `Shade prepares`
- `Choose a strike`
- `Swap to charge`
- `Moves left: 6`
- icon-only log/settings/debug controls outside the combat read path.

### 5. Ability Slots Are Not Yet Game Objects

The spell buttons explain behavior, but they do not feel like abilities owned by Aurora and charged by gems.
They need to become collectible skill chips:

- glossy top cap;
- icon or element badge;
- cost gem;
- ready/locked/armed state;
- direct visual relationship to Sun / Moon / Crown tiles.

## Pass 3 - Visual Grammar

### Materials

- **Aqua glass:** board tray, Aurora-side combat meter, selected tile rim.
- **Pearl plastic:** neutral HUD surfaces, top bar, low-priority panels.
- **Candy gem:** tiles and ability chips.
- **Gold foil:** turn medallion, important ready states, Crown Strike.
- **Violet obsidian:** Shade side, enemy intent, backlash risk.
- **Lime gel:** guard/protection states and shield tile language.

### Forms

- Board tray: 18-22px radius, thick beveled rim, inset cells.
- Ability chips: 10-14px radius, more opaque than current glass cards.
- Hero panels: capsule/dash shapes, not equal cards.
- Turn state: central physical medallion/orb, not a rectangular web panel.
- Top controls: icon-only utilities, demoted away from the combat hierarchy.

### Light

Use a consistent top-left light source.

Every major element should have:

- a white upper highlight;
- a darker lower edge;
- a small cast/contact shadow;
- fewer generic outer glows.

### Color

Keep the bright identity, but reduce washed-out mint/cyan spread.

Target accents:

- aqua;
- chrome white;
- lime;
- citrus yellow;
- mango/gold;
- magenta gem;
- royal violet.

Avoid making cyan and pink outline every container.

## Pass 4 - Next Implementation Shape

Recommended next patch: **Game Feel Visual Pass #1**

Scope: CSS + small markup/copy changes, no mechanics.

### P0 - Kill AI-Neutral Gradient As Primary Design

- Replace the broad page gradient with a low-noise aqua/pearl material.
- Add subtle water-glass texture using CSS layers only: caustic lines, tiny bubbles, top-left sheen.
- Ensure the background supports the board instead of competing with it.

Acceptance:

- On 390x844, the first read is board/duel, not background gradient.
- The screen still feels bright and AeroCandy, not flat SaaS.

### P0 - Give The Board A Physical Arena Tray

- Strengthen the board rim into a glossy beveled tray.
- Make cell wells feel inset, not just evenly spaced buttons.
- Reduce generic glow and replace it with inner shadows and hard highlights.

Acceptance:

- Board looks like the main game object even in grayscale/squint test.
- Tiles feel seated inside a physical tray.

### P1 - Rebuild Combat Strip As Duel Header

- Turn actor cards into side capsules: Aurora left, Shade right.
- Make HP bars more liquid/physical.
- Make the center turn indicator a round/oval glass medallion.
- Move enemy intent visually closer to Shade and the board.

Acceptance:

- The top reads as "two fighters in conflict", not three dashboard cards.

### P1 - Convert Action Dock Into Command Ribbon + Skill Chips

- Replace `NEXT ACTION` web panel feel with a battle command ribbon.
- Convert spell cards into ability chips with element badges and clear ready/locked states.
- Make ability chips visually related to Sun / Moon / Crown tiles.

Acceptance:

- The lower area reads as playable controls, not explanation cards.

### P1 - Copy Pass From System Language To Battle Language

- `Board ready` -> `Aurora's move`
- `Shade plan` -> `Shade prepares`
- `Next action` -> `Choose strike` / `Command`
- `Select a tile` -> `Choose a tile to swap`
- `6 swaps` -> `6 moves left`
- `Style` -> icon/debug route outside primary battle surface.

Acceptance:

- A first-time mobile player understands what to do, but the screen sounds like a game.

## Do Not Do Next

- Do not solve this by adding more decorative gradient.
- Do not generate new full-screen art before the material/component grammar is fixed.
- Do not add more mechanics or spells until the current game screen feels physically unified.
- Do not make every panel more transparent; some surfaces should become opaque glossy plastic.

## Final Synthesis

The previous pass improved clarity. It did not improve game-ness enough.

The next pass should deliberately move the product from:

> readable web prototype with glossy assets

to:

> glossy plastic-glass mobile duel toy.

## Pass 5 - Reference Translation

The user's reference list should not be copied literally as scenery.
Kingdom Duel is not a beach resort, runner, or social world.
The useful extraction is the emotional and material grammar:

- **Wii Sports Resort:** optimistic white UI, clean blue water, rounded friendly menus, lightness, vacation-future mood.
- **Mirror's Edge:** white futuristic surfaces plus strong accent colors; the lesson is clarity and sharp contrast, not gritty city scale.
- **Super Mario Galaxy:** toy-like wonder, bubbles, glass spheres, saturated celestial candy objects.
- **Sonic Colors / resort-era Sonic:** fruit-bright future parks, saturated blue/green/orange, glossy attraction-like objects.
- **Spore:** late-2000s rounded biological/plastic UI, playful iconography, tactile editors.
- **Frutiger Space:** the clearest current north star for mood: blue glass character, dolphins, bubbles, green grass, futuristic white/nature harmony, "future we were promised."

### What To Use From Frutiger Space

Use:

- sunny optimism;
- blue glass body/material language;
- bubbles and water as physical depth cues;
- idealized green/white/blue future;
- rounded toy-like silhouettes;
- social-game warmth and softness.

Do not use:

- wide open social-world emptiness;
- dolphins/grass/lifestyle motifs directly in the battle screen;
- overly calm exploration mood that would weaken the duel.

For Kingdom Duel, translate it into:

- **Aurora side:** aqua glass, sun-white shine, lime guard gel, optimistic future knight.
- **Shade side:** violet/pink glossy danger, still candy-like, not dark fantasy.
- **Board:** glass tray / water arcade machine / candy puzzle object.
- **Action bar:** glossy ability chips, not flat cards.
- **Background:** water/sky/pearl material, not scenic landscape.

### Practical Formula

The target should feel like:

> Frutiger Space optimism + Wii Sports Resort cleanliness + Super Mario Galaxy toy magic, compressed into a one-screen match-3 duel.

This means the next visual pass should add nature/future motifs through material and lighting, not through big illustration.
