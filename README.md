# MazeDaemons

MazeDaemons is a solo tablet-first maze game built with Expo, React Native, and TypeScript.

The game focuses on high difficulty maze stages, touch-based movement, collectible coins, and a sequential shop for trail effects and player skins.

## Current Scope

- Solo play only. There is no versus mode.
- 11 difficulties: `easy`, `normal`, `hard`, `harder`, `insane`, `easy daemon`, `medium daemon`, `hard daemon`, `insane daemon`, `extreme daemon`, `god`.
- 50 generated stages per difficulty.
- Stage progression is locked in order. Stage 2 opens after clearing stage 1, and the next difficulty opens after all 50 stages in the previous difficulty are cleared.
- Maze movement is driven by tapping the maze board. Directional arrow controls are intentionally not used.
- The maze board can switch between graveyard, volcano, and forest themes from settings.
- Graveyard uses graves and fog. Volcano uses dark corridors with molten-orange walls outlined in deep red. Forest uses dark woodland corridors with medium-green walls outlined in deep green.
- Coins are placed only on cells reachable before entering the exit.
- Every stage has one blue coin worth five standard coins, placed in a distant dead end away from the main exit route.
- Coins are spread across all map quadrants instead of clustering in one area.
- Blue coin pickup uses an unmodified two-second CC0 recorded sound.
- Shop purchases are sequential within each product category.
- BGM, touch, coin, and clear audio channels have separate settings and in-settings previews.
- Progress from compatible older stage catalog versions is migrated automatically after app updates.

## Documentation

- [Architecture](docs/ARCHITECTURE.md): module layout, responsibilities, and extension points.
- [Game Rules](docs/GAME_RULES.md): movement, progression, coins, shop, and persistence rules.
- [Development](docs/DEVELOPMENT.md): setup, generation scripts, build, install, and verification commands.

## Key Commands

```bash
npm install
npx tsc --noEmit
npm run build:android:release
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## Configurable Gameplay Settings

Gameplay constants live in [src/data/game-settings.json](src/data/game-settings.json).

Important fields:

- `clearEffectDurationMs`: how long the `CLEAR` effect remains visible before automatic stage advance.
- `coinPickupEffectDurationMs`: how long the coin pickup pig effect remains visible.
- `coins`: standard/blue rewards, blue coin count per stage, and difficult blue coin placement weights.
- `mazeTheme.defaultId`: the theme selected for new progress data.
- `audio`: default BGM, tap, coin pickup, clear, and volume step values.
- `movement.maxTargetCornerTurns`: how many turns are allowed when moving directly to a tapped target cell.
- `movement.directionalFallbackEnabled`: whether a blocked target tap should still move the player as far as possible in the tap direction.
- `tokenAnimation`: speed limits for fast movement animation.
- `trailVisibleSeconds`: how long purchased trail effects remain visible.

Theme wall colors, outline colors, and outline widths are defined in [src/data/themes.ts](src/data/themes.ts).

## Generated Data

Level data is generated into [src/data/levels/stage-catalog.json](src/data/levels/stage-catalog.json).

Regenerate stages with:

```bash
npm run generate:levels
```

Regenerate original local sound effects with:

```bash
npm run generate:sounds
```

The sound generator uses local synthesis plus source recordings under [assets/sounds/sources](assets/sounds/sources). The stage catalog version is used as part of the progress storage key. Compatible older progress is migrated into the newest key on launch. If coin placement changes in a way that invalidates existing coin IDs, bump the catalog version in [scripts/generate-levels.mjs](scripts/generate-levels.mjs) before regenerating.
