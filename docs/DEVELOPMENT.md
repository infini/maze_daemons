# Development

This document lists setup, generation, build, install, and verification steps for MazeDaemons.

## Requirements

- Node.js and npm
- Android SDK and Gradle through the generated Expo Android project
- `adb` for tablet installation

The current app is an Expo/React Native mobile app. The Android package is `com.infini.mazedaemons`.

## Install Dependencies

```bash
npm install
```

## Run Locally

```bash
npm start
```

For Android native run:

```bash
npm run android
```

## Generate Assets

Assets are generated from scripts:

```bash
npm run generate:assets
npm run generate:sounds
```

Generated visual and audio asset output is written under `assets/`.

`generate:sounds` uses local synthesis for most sounds. It also processes source recordings in `assets/sounds/sources/` when available; the coin pickup burp uses a CC0 BigSoundBank recording as its source. On macOS it uses the built-in `say` and `afconvert` tools as a clearer voice layer for the clear cue, then falls back to pure local synthesis when those tools are unavailable.

## Generate Levels

```bash
npm run generate:levels
```

This writes `src/data/levels/stage-catalog.json`.

The generator validates:

- start marker exists
- exit marker exists
- at least one coin exists
- exit is reachable
- exit path distance is not too close to the start
- every coin is reachable before entering the exit

If generated stage semantics change, update `scripts/generate-levels.mjs` and consider bumping the catalog version. The catalog version is tied to the AsyncStorage progress key, and compatible older progress is migrated into the newest key on launch.

## Type Check

```bash
npx tsc --noEmit
```

Run this after code changes and before building a release APK.

## Android Release Build

```bash
npm run build:android:release
```

Equivalent direct command:

```bash
cd android
./gradlew assembleRelease
```

Output APK:

```text
android/app/build/outputs/apk/release/app-release.apk
```

## Install On Tablet

```bash
adb devices
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell monkey -p com.infini.mazedaemons -c android.intent.category.LAUNCHER 1
```

## Runtime Smoke Checks

After installing on the tablet:

1. Confirm the app opens without crash.
2. Confirm the maze board shows the graveyard style with graves, spider webs, fog, and visible paths.
3. Confirm coins are visible on a fresh catalog version.
4. Collect a visible coin and confirm the pink pig `YUMMY!` effect appears briefly.
5. Confirm BGM plays quietly after app launch.
6. Tap a reachable path cell and confirm movement occurs and the touch sound plays.
7. Tap a cell that requires up to two turns and confirm direct movement.
8. Collect a coin and confirm the coin sound is the short full-belly burp cue.
9. Clear a stage and confirm the ender dragon `CLEAR` effect and heavy eerie clear sound play, then the next stage starts at its own start cell.
10. Open settings and confirm BGM, touch, coin, and clear volume controls can preview sounds and persist after relaunch.
11. Relaunch the app and confirm it restores the last played stage.
12. After bumping the stage catalog version, install without clearing app data and confirm the previous unlocked difficulty, stage, coins, purchases, and selected items migrate.
13. Use the stage button to return to a cleared stage; it must also start at that stage's start cell.
14. Open the shop and confirm products still render horizontally.

Useful log command:

```bash
adb logcat -d -t 300 | rg -i 'mazedaemons|fatal|exception|crash|reactnativejs' || true
```

## Configuration Workflow

Gameplay settings live in `src/data/game-settings.json`.

When adding a setting:

1. Add the value to `src/data/game-settings.json`.
2. Add the TypeScript shape to `src/data/settings.ts`.
3. Read the setting from the domain or feature module that owns the behavior.
4. Run `npx tsc --noEmit`.

Current movement settings:

```json
{
  "audio": {
    "bgmVolume": 0.18,
    "clearVolume": 0.9,
    "coinPickupVolume": 0.76,
    "tapVolume": 0.34,
    "volumeStep": 0.1
  },
  "movement": {
    "maxTargetCornerTurns": 2,
    "directionalFallbackEnabled": true
  }
}
```

## Refactoring Rules

- UI layout belongs in `src/features/maze-game/components`.
- HUD-specific pieces belong in `src/features/maze-game/components/hud`.
- Runtime orchestration belongs in `useMazeDaemonsGame`.
- Persistence belongs in `useProgressState`.
- Shop behavior belongs in `useShopActions`.
- Audio playback belongs in `useMazeSounds`.
- Progression rules belong in `utils/progression`.
- Pure maze domain behavior belongs in `src/game`.

If a function starts handling persistence, UI, and game rules at the same time, split it before adding more behavior.
