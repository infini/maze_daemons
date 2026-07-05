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
```

Generated asset output is written under `assets/`.

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
- every coin is reachable before entering the exit

If generated stage semantics change, update `scripts/generate-levels.mjs` and consider bumping the catalog version. The catalog version is tied to the AsyncStorage progress key.

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
2. Confirm coins are visible on a fresh catalog version.
3. Tap a reachable path cell and confirm movement occurs.
4. Tap a cell that requires up to two turns and confirm direct movement.
5. Clear a stage and press `다음`; the next stage must start at its own start cell.
6. Use the stage button to return to a cleared stage; it must also start at that stage's start cell.
7. Open the shop and confirm products still render horizontally.

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
- Progression rules belong in `utils/progression`.
- Pure maze domain behavior belongs in `src/game`.

If a function starts handling persistence, UI, and game rules at the same time, split it before adding more behavior.
