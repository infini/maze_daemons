# Architecture

This document describes the current module layout and the intended responsibility boundaries.

## App Entry

- `App.tsx`: mounts `MazeGameScreen`.
- `src/features/maze-game/MazeGameScreen.tsx`: screen-level composition. It calculates board metrics, wires the animated token, renders `MazeBoard`, and renders `GameHud`.

Keep screen-level files focused on composition. New game rules should not be added directly to `MazeGameScreen`.

## Feature Modules

### Board And Rendering

- `src/features/maze-game/components/MazeBoard.tsx`
  - Renders the rectangular maze board.
  - Converts touch coordinates into row/column positions.
  - Displays walls, floor, coins, exit, decorative overlays, trail overlays, and the player token.
- `src/features/maze-game/components/MazeAtmosphere.tsx`
  - Renders grave, spider web, fog, and vignette visuals on top of the board without changing touch behavior.
- `src/features/maze-game/components/Trail.tsx`
  - Renders purchased movement trail segments.
  - Does not render a center dot.
- `src/features/maze-game/components/CoinPickupEffect.tsx`
  - Renders the short blocky pink pig `YUMMY!` effect when a newly visible coin is collected.
- `src/features/maze-game/components/ClearEffect.tsx`
  - Renders the short `CLEAR` overlay with the ender dragon before automatic stage advance.
- `src/features/maze-game/components/JumpScareOverlay.tsx`
  - Renders the family-safe full-screen block ghost scare overlay.
- `src/features/maze-game/hooks/useAnimatedToken.ts`
  - Animates the player token along the latest movement path.
  - Reads animation timings from `src/data/game-settings.json`.
- `src/features/maze-game/hooks/useJumpScare.ts`
  - Applies configured chance, cooldown, and duration for random scare events.
- `src/features/maze-game/hooks/useMazeSounds.ts`
  - Owns BGM playback and short sound effects through `expo-audio`.
  - Applies saved BGM, tap, coin, clear, and jump scare volume settings.

### HUD

- `src/features/maze-game/components/GameHud.tsx`
  - Composes the HUD layout.
  - Owns only local UI open/closed state for shop and stage picker.
- `src/features/maze-game/components/hud/HudButtons.tsx`
  - Start, pause, reset, and shop button primitives.
- `src/features/maze-game/components/hud/StageSelectors.tsx`
  - Difficulty selector and stage picker.
- `src/features/maze-game/components/hud/ShopPanel.tsx`
  - Shop UI for trail effects and skins.
- `src/features/maze-game/components/hud/SettingsPanel.tsx`
  - Per-channel audio volume controls for BGM, touch, coin, and clear sounds.
  - Provides per-channel preview buttons so settings can verify sounds without gameplay events.

When adding new HUD controls, prefer creating or extending a HUD subcomponent instead of growing `GameHud.tsx`.

### Game State Hook

- `src/features/maze-game/hooks/useMazeDaemonsGame.ts`
  - Coordinates current difficulty/stage, timer, prepared level, runtime game state, progress state, shop actions, and derived UI state.
  - Should remain orchestration-focused. Business rules should live in utility or domain modules.
- `src/features/maze-game/hooks/useProgressState.ts`
  - Loads, normalizes, and persists progress through AsyncStorage.
  - Storage key includes the generated stage catalog version.
  - Migrates compatible progress from older catalog storage keys into the current catalog key.
  - Persists the last played stage ID.
  - Persists per-channel audio volume settings.
- `src/features/maze-game/hooks/useShopActions.ts`
  - Contains shop purchase/equip behavior and shop messages.

### Feature Utilities

- `src/features/maze-game/utils/layout.ts`
  - Board and panel sizing.
- `src/features/maze-game/utils/mazeDecorations.ts`
  - Selects deterministic grave and spider web decoration positions for each prepared level.
- `src/features/maze-game/utils/progression.ts`
  - Difficulty unlocks, stage unlocks, selectable stage list, and next-stage location.
- `src/features/maze-game/utils/statusText.ts`
  - User-facing status text.
- `src/features/maze-game/utils/timer.ts`
  - Timer state transitions and formatting.

## Game Domain Modules

`src/game/maze.ts` is intentionally a small compatibility barrel that re-exports domain modules.

- `src/game/level.ts`
  - Converts raw level rows into a prepared level.
  - Creates initial game state for a prepared level.
- `src/game/movement.ts`
  - Applies player movement.
  - Supports direct target movement with a configurable maximum number of turns.
  - Applies directional fallback movement when target movement is not possible.
- `src/game/trails.ts`
  - Builds the trail map used by `Trail`.
- `src/game/coins.ts`
  - Builds persisted coin keys.
- `src/game/grid.ts`
  - Grid helpers such as directions, adjacency, position keys, and walkability.
- `src/game/types.ts`
  - Shared domain types.
- `src/game/sounds.ts`
  - Static sound asset registry.

## Data Modules

- `src/data/game-settings.json`
  - Runtime-tunable gameplay constants.
- `src/data/settings.ts`
  - Typed settings export.
- `src/data/shop.ts`
  - Shop products, prices, and default progress.
- `src/data/levels.ts`
  - Stage catalog export.
- `src/data/levels/stage-catalog.json`
  - Generated stage catalog.
- `assets/sounds/*.wav`
  - Generated audio assets.
- `assets/sounds/sources/*`
  - Source recordings and license notes used by the sound generator.
- `assets/tiles/*.png`
  - Generated tile, coin, exit, grave, and spider web image assets.
- `assets/effects/*.png`
  - Generated visual effect assets such as the block ghost jump scare.
- `scripts/generate-assets.mjs`
  - Generates local PNG assets for tiles, characters, and app icons.
- `scripts/generate-sounds.mjs`
  - Generates the BGM loop and short sound effects.

## Extension Guidelines

- Add new game rules to `src/game/*` or `src/features/maze-game/utils/*`, not directly inside UI components.
- Add new shop categories in `src/data/shop.ts`, `useShopActions.ts`, and `ShopPanel.tsx`.
- Add new settings to `src/data/game-settings.json` and update `src/data/settings.ts` at the same time.
- If generated level semantics change, update `scripts/generate-levels.mjs`, regenerate the catalog, and consider bumping the catalog version. Compatible progress is migrated by stage ID, but incompatible coin IDs should use a new catalog version.
- Keep `GameHud.tsx` and `useMazeDaemonsGame.ts` as orchestration files; split new responsibilities before they grow large.
