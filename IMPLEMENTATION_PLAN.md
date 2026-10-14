# xAPI Ice Breaker — Implementation Plan

This document is the working implementation checklist for the xAPI Ice Breaker app. It will be updated as work progresses.

The implementation will stop at every milestone breakpoint so the milestone can be reviewed and approved before work continues.

## Status legend

- [ ] Not started or not yet verified
- [x] Completed and verified

## Agreed game rules

- The app is a browser-based SvelteKit application.
- Application styling uses Tailwind utility classes exclusively; no component or custom global CSS is used.
- The player-facing game uses a minimalist tropical visual theme and opens directly into the arena.
- xAPI activity is visible only on the dedicated `/xapi-stream` developer page and is not linked or mentioned on the game page.
- The starting hammer requires five taps to break an ice block.
- Each upgrade reduces the required taps by one, down to a minimum of one tap.
- Upgrade costs are 50, 100, 200, and 400 points.
- Progress is stored in browser `localStorage` and persists between sessions.
- Ice blocks stay fixed at the center of the playable area.
- Break timing begins on the first hit of each ice block.
- Score is calculated from the break duration:

  | Break duration        | Base points |
  | --------------------- | ----------: |
  | Up to 0.2 seconds     |          50 |
  | Up to 0.3 seconds     |          40 |
  | Up to 0.4 seconds     |          30 |
  | Up to 0.5 seconds     |          20 |
  | More than 0.5 seconds |          10 |

- A random variation of -5 to +5 points is applied.
- The final score is never lower than 10 points.
- xAPI statements are produced when the player starts a game, taps an ice block, breaks an ice block, or upgrades the hammer.
- The app remains playable in demo mode when an LRS is not configured.

## Hammer progression

| Level | Hammer         | Taps required |  Upgrade cost |
| ----: | -------------- | ------------: | ------------: |
|     0 | Wooden Mallet  |             5 |            50 |
|     1 | Stone Cracker  |             4 |           100 |
|     2 | Iron Breaker   |             3 |           200 |
|     3 | Frost Smasher  |             2 |           400 |
|     4 | Thunder Hammer |             1 | Maximum level |

## Milestone 1 — Application shell and game model

### Implementation

- [x] Replace the default SvelteKit starter page.
- [x] Create a responsive full-screen game layout.
- [x] Load directly into the ice-breaking arena without a welcome or marketing screen.
- [x] Add a game HUD showing total points at the top center and the current hammer in a floating bottom upgrade dock.
- [x] Add the main ice-breaking arena.
- [x] Add an upgrade panel.
- [x] Add an xAPI activity placeholder on a dedicated `/xapi-stream` page.
- [x] Define typed hammer, scoring, game-state, and ice-state models.
- [x] Add initial unit tests for game configuration.
- [x] Use Tailwind utility classes exclusively for application styling.
- [x] Apply a minimalist tropical visual direction.

### Verification

- [x] Confirm the app loads without browser or console errors.
- [x] Confirm the layout works at mobile and desktop widths.
- [x] Confirm all five hammer levels and four prices are represented correctly.
- [x] Confirm the game route contains no xAPI wording or link to the developer stream.
- [x] Run `npm run check` successfully.
- [x] Run `npm test` successfully.
- [x] Run `npm run build` successfully.

### Breakpoint 1

- [x] Provide a browser preview or screenshots and test results.
- [x] Receive user approval for the structure and visual direction.

> Stop here until Milestone 1 is reviewed and approved.

## Milestone 2 — Core ice-breaking gameplay

### Implementation

- [x] Start a new game session automatically when the arena loads.
- [x] Keep every ice block fixed at the center of the arena.
- [x] Support mouse, touch, and keyboard hits.
- [x] Display progressive ice cracking after each hit.
- [x] Break the ice after the active hammer's required number of hits.
- [x] Measure break duration starting with the first hit.
- [x] Calculate points using the agreed time tiers.
- [x] Apply a random -5 to +5 point variation.
- [x] Enforce the 10-point minimum.
- [x] Show earned points and elapsed time after each break.
- [x] Play a short break transition before spawning the next ice block.
- [x] Prevent duplicate scoring from rapid or repeated input.
- [x] Add unit tests for scoring boundaries and variation limits.
- [x] Add unit tests for hammer tap requirements.

### Verification

- [x] Confirm the starting hammer consistently requires five hits.
- [x] Confirm ice remains centered and clear of the upgrade controls.
- [x] Confirm every timing tier awards the expected score range.
- [x] Confirm slow breaks never award fewer than 10 points.
- [x] Confirm an ice block cannot be scored more than once.
- [x] Confirm keyboard interaction works.
- [x] Run `npm run check` successfully.
- [x] Run `npm test` successfully.
- [x] Run `npm run build` successfully.

### Breakpoint 2

- [x] Provide the playable core-game build and test results.
- [x] Receive user approval for game feel, placement, timing, and scoring.

> Stop here until Milestone 2 is reviewed and approved.

## Milestone 3 — Hammer upgrades and persistence

### Implementation

- [x] Display the next hammer and its upgrade cost in a button that also acts as the upgrade progress bar.
- [x] Deduct the correct number of points when an upgrade is purchased.
- [x] Change the hammer name after an upgrade.
- [x] Reduce the required hit count after an upgrade.
- [x] Enable the upgrade button only when the player has reached the required points; otherwise show progress toward the cost.
- [x] Prevent duplicate purchases from rapid input.
- [x] Display a maximum-level state for the final hammer.
- [x] Persist points and hammer level in `localStorage`.
- [x] Restore saved progress when the app loads.
- [x] Safely recover from invalid or outdated saved data.
- [x] Add a reset-progress control with confirmation.
- [x] Persist all current player data; preference persistence will be added when preferences exist.
- [x] Add unit tests for successful purchases.
- [x] Add unit tests for insufficient points and maximum level.
- [x] Add unit tests for saved-state restoration and validation.

### Verification

- [x] Confirm refreshing the page preserves points and hammer level.
- [x] Confirm upgrade costs progress through 50, 100, 200, and 400 points.
- [x] Confirm the final hammer breaks ice with one hit.
- [x] Confirm points cannot become negative.
- [x] Confirm the same upgrade cannot be purchased twice.
- [x] Confirm reset progress returns the game to its initial state.
- [x] Run `npm run check` successfully.
- [x] Run `npm test` successfully.
- [x] Run `npm run build` successfully.

### Breakpoint 3

- [x] Provide the complete progression build and test results.
- [x] Receive user approval for upgrades and persistence.

> Stop here until Milestone 3 is reviewed and approved.

## Milestone 4 — xAPI statements and demonstration panel

### Implementation

- [x] Install and configure the `@xapi/xapi` JavaScript wrapper.
- [x] Add private environment configuration for the LRS endpoint.
- [x] Add private environment configuration for LRS authentication.
- [x] Generate a stable pseudonymous xAPI actor for each game session.
- [x] Identify session actors with an xAPI account under `https://buri.io`.
- [x] Add environment configuration for the activity base URL.
- [x] Send statements through a SvelteKit server endpoint so credentials are not exposed in the browser bundle.
- [x] Add demo mode for environments without an LRS configuration.
- [x] Generate a unique registration for each game session.
- [x] Generate a unique activity identifier for each ice block.
- [x] Add the statement inspector to the dedicated `/xapi-stream` page.
- [x] Load the statement inspector from the remote LRS through `+page.server.ts`.
- [x] Add an `/xapi-stats` dashboard with hourly activity and summary metrics.
- [x] Show player counts and names grouped by their latest observed hammer.
- [x] Plot hourly activity across complete days using the viewer's local time.
- [x] Display formatted statement JSON in the inspector.
- [x] Display delivery, demo, and error statuses in the inspector.
- [x] Emit a statement when a game starts.
- [x] Emit a statement for every ice tap, including the hammer name.
- [x] Emit a statement when ice breaks, including hammer, points, duration, and tap count.
- [x] Emit a statement when the hammer is upgraded, including old hammer, new hammer, price, and remaining points.
- [x] Add tests for xAPI statement structures.
- [x] Add tests mapping game events to statements.
- [x] Add a safe `.env.example` without credentials.

### Proposed xAPI verb mapping

| Game event      | xAPI verb                                                      |
| --------------- | -------------------------------------------------------------- |
| Game started    | `http://adlnet.gov/expapi/verbs/launched`                      |
| Ice tapped      | Custom `tapped` verb under the configured activity namespace   |
| Ice broken      | Custom `broken` verb under the configured activity namespace   |
| Hammer upgraded | Custom `upgraded` verb under the configured activity namespace |

### Verification

- [x] Confirm each game action produces exactly one expected statement.
- [x] Confirm every statement has an actor, verb, object, timestamp, and registration.
- [x] Confirm hammer and scoring details appear in results or extensions.
- [x] Confirm gameplay works normally without an LRS configured.
- [x] Confirm delivery success or failure is reported by configured-LRS unit tests.
- [x] Deliver a statement through `/api/xapi` to the configured remote LRS and confirm the returned statement ID.
- [x] Confirm LRS credentials do not appear in the browser bundle.
- [x] Run `npm run check` successfully.
- [x] Run `npm test` successfully.
- [x] Run `npm run build` successfully.

### Breakpoint 4

- [x] Provide sample JSON for all four statement types.
- [ ] Receive user approval for the statement vocabulary and payloads.

> Stop here until Milestone 4 is reviewed and approved.

## Milestone 5 — Visual, audio, and interaction polish

### Implementation

- [x] Add a polished playful visual design.
- [x] Add a hammer-swing animation.
- [x] Add ice shake and progressive fracture effects.
- [x] Add ice-shatter particles.
- [x] Add floating score feedback.
- [x] Add smooth centered ice entrances.
- [x] Give each hammer level a distinct visual treatment.
- [x] Add generated impact and shatter sounds using browser audio.
- [x] Add a persistent sound toggle.
- [x] Prevent accidental scrolling, zooming, and text selection during play.
- [x] Add reduced-motion support.
- [x] Add accessible focus states, labels, and contrast.
- [x] Refine the layout for phone, tablet, and desktop viewports.

### Verification

- [x] Confirm the game works with mouse, touch, and keyboard input.
- [x] Confirm play does not accidentally scroll or select page content.
- [x] Confirm audio begins only after user interaction.
- [x] Confirm sound can be muted and the setting persists.
- [x] Confirm reduced-motion preferences disable intensive animation.
- [x] Confirm the interface remains usable at common viewport sizes.
- [x] Run `npm run check` successfully.
- [x] Run `npm test` successfully.
- [x] Run `npm run build` successfully.

### Breakpoint 5

- [x] Provide a polished browser preview and test results.
- [ ] Receive user approval for the visual and interaction design.

> Stop here until Milestone 5 is reviewed and approved.

## Milestone 6 — Final QA and handoff

### Implementation and QA

- [ ] Run a full gameplay regression pass.
- [ ] Verify saved-state migration and invalid-data recovery.
- [ ] Verify LRS success, failure, and unconfigured behavior.
- [x] Remove unused starter examples and placeholder library code.
- [ ] Update the README with setup instructions.
- [ ] Document gameplay and scoring rules.
- [ ] Document LRS environment configuration.
- [ ] Document xAPI event and statement mappings.
- [ ] Document local development, testing, and build commands.
- [ ] Add a final manual verification checklist.
- [ ] Run formatting and lint checks successfully.
- [ ] Run `npm run check` successfully.
- [ ] Run `npm test` successfully.
- [ ] Run `npm run build` successfully.

### Final breakpoint

- [ ] Provide a final changed-file summary.
- [ ] Provide all automated test and build results.
- [ ] Provide known limitations, if any.
- [ ] Provide exact instructions for connecting the app to an LRS.
- [ ] Receive final user acceptance.

> The implementation is complete only after the final breakpoint is approved.
