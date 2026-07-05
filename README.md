# MazeDaemons

MazeDaemons is a solo tablet-first maze game built with Expo, React Native, and TypeScript.

The game focuses on high difficulty maze stages, touch-based movement, collectible coins, and a sequential shop for trail effects and player skins.

## Current Scope

- Solo play only. There is no versus mode.
- 11 difficulties: `easy`, `normal`, `hard`, `harder`, `insane`, `easy daemon`, `medium daemon`, `hard daemon`, `insane daemon`, `extreme daemon`, `god`.
- 50 generated stages per difficulty.
- Stage progression is locked in order. Stage 2 opens after clearing stage 1, and the next difficulty opens after all 50 stages in the previous difficulty are cleared.
- Maze movement is driven by tapping the maze board. Directional arrow controls are intentionally not used.
- Coins are placed only on cells reachable before entering the exit.
- Shop purchases are sequential within each product category.

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
- `movement.maxTargetCornerTurns`: how many turns are allowed when moving directly to a tapped target cell.
- `movement.directionalFallbackEnabled`: whether a blocked target tap should still move the player as far as possible in the tap direction.
- `tokenAnimation`: speed limits for fast movement animation.
- `trailVisibleSeconds`: how long purchased trail effects remain visible.

## Generated Data

Level data is generated into [src/data/levels/stage-catalog.json](src/data/levels/stage-catalog.json).

Regenerate stages with:

```bash
npm run generate:levels
```

The stage catalog version is used as part of the progress storage key. If coin placement changes in a way that invalidates existing coin IDs, bump the catalog version in [scripts/generate-levels.mjs](scripts/generate-levels.mjs) before regenerating.
