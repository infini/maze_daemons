import { useCallback, useEffect, useMemo, useState } from 'react';
import { difficulties } from '../../../data/levels';
import { settings } from '../../../data/settings';
import {
  buildTrailMap,
  coinKey,
  createInitialState,
  movePlayerToTarget,
  prepareLevel,
} from '../../../game/maze';
import type { Position } from '../../../game/types';
import {
  createTimerState,
  finishTimer,
  getElapsedMs,
  startTimer,
  togglePause,
} from '../utils/timer';
import {
  canAdvanceAfterWin as canAdvanceAfterWinForProgress,
  getNextStageLocation,
  getSelectableStageIndexes,
  getUnlockedDifficultyIds,
  isDifficultyUnlocked,
  isStageUnlocked,
} from '../utils/progression';
import { getStatusText } from '../utils/statusText';
import { useProgressState } from './useProgressState';
import { useShopActions } from './useShopActions';

export function useMazeDaemonsGame() {
  const [difficultyIndex, setDifficultyIndex] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const difficulty = difficulties[difficultyIndex] ?? difficulties[0];
  const levelData = difficulty.stages[stageIndex] ?? difficulty.stages[0];
  const level = useMemo(() => prepareLevel(levelData), [levelData]);
  const [now, setNow] = useState(() => Date.now());
  const [timerState, setTimerState] = useState(() => createTimerState());
  const [gameState, setGameState] = useState(() => createInitialState(level));
  const [animationResetKey, setAnimationResetKey] = useState(0);
  const { progress, progressLoaded, setProgress } = useProgressState();
  const [shopMessage, setShopMessage] = useState('');
  const shopActions = useShopActions({ setProgress, setShopMessage });

  const elapsedMs = getElapsedMs(timerState, now);
  const hasStarted = timerState.startedAt !== null;
  const isPaused = timerState.pausedAt !== null;
  const trailVisibleMs = settings.trailVisibleSeconds * 1000;
  const trailMap = useMemo(
    () => buildTrailMap(gameState.trails, elapsedMs, trailVisibleMs),
    [elapsedMs, gameState.trails, trailVisibleMs],
  );

  const persistedCoinIds = useMemo(() => {
    const prefix = `${level.id}:`;
    return new Set(
      progress.collectedCoinKeys
        .filter((key) => key.startsWith(prefix))
        .map((key) => key.slice(prefix.length)),
    );
  }, [level.id, progress.collectedCoinKeys]);

  const hiddenCoinIds = useMemo(
    () => new Set([...persistedCoinIds, ...gameState.collectedCoinIds]),
    [gameState.collectedCoinIds, persistedCoinIds],
  );
  const completedStageIds = useMemo(
    () => new Set(progress.completedStageKeys),
    [progress.completedStageKeys],
  );
  const effectiveCompletedStageIds = useMemo(() => {
    const stageIds = new Set(completedStageIds);
    if (gameState.isWon) {
      stageIds.add(level.id);
    }
    return stageIds;
  }, [completedStageIds, gameState.isWon, level.id]);
  const unlockedDifficultyIds = useMemo(
    () => getUnlockedDifficultyIds(effectiveCompletedStageIds),
    [effectiveCompletedStageIds],
  );
  const selectableStageIndexes = useMemo(
    () =>
      getSelectableStageIndexes({
        completedStageIds: effectiveCompletedStageIds,
        difficulty,
        stageIndex,
      }),
    [difficulty.stages, effectiveCompletedStageIds, stageIndex],
  );
  const canAdvanceAfterWin = useMemo(() => {
    if (!gameState.isWon) {
      return false;
    }
    return canAdvanceAfterWinForProgress({
      completedStageIds: effectiveCompletedStageIds,
      difficulty,
      difficultyIndex,
      stageIndex,
    });
  }, [
    difficulty,
    difficultyIndex,
    effectiveCompletedStageIds,
    gameState.isWon,
    stageIndex,
  ]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  const resetRunForLevel = useCallback((nextLevel: typeof level) => {
    setNow(Date.now());
    setAnimationResetKey((current) => current + 1);
    setTimerState(createTimerState());
    setGameState(createInitialState(nextLevel));
  }, []);

  const activateStage = useCallback(
    (nextDifficultyIndex: number, nextStageIndex: number) => {
      const nextDifficulty = difficulties[nextDifficultyIndex] ?? difficulties[0];
      const nextLevelData = nextDifficulty.stages[nextStageIndex] ?? nextDifficulty.stages[0];
      const nextLevel = prepareLevel(nextLevelData);

      setDifficultyIndex(nextDifficultyIndex);
      setStageIndex(nextStageIndex);
      resetRunForLevel(nextLevel);
    },
    [resetRunForLevel],
  );

  const commitNextState = useCallback(
    (nextGameState: typeof gameState, timestamp: number) => {
      if (nextGameState === gameState) {
        return;
      }

      const previousCoinIds = new Set(gameState.collectedCoinIds);
      const newlyCollectedCoinIds = nextGameState.collectedCoinIds.filter(
        (coinId) => !previousCoinIds.has(coinId),
      );
      const completedStageKey = nextGameState.isWon ? level.id : null;

      setNow(timestamp);
      setGameState(nextGameState);

      if (newlyCollectedCoinIds.length > 0 || completedStageKey) {
        setProgress((current) => ({
          ...current,
          coins:
            current.coins +
            newlyCollectedCoinIds
              .map((coinId) => coinKey(level.id, coinId))
              .filter((key) => !current.collectedCoinKeys.includes(key)).length,
          collectedCoinKeys: unique([
            ...current.collectedCoinKeys,
            ...newlyCollectedCoinIds.map((coinId) => coinKey(level.id, coinId)),
          ]),
          completedStageKeys: completedStageKey
            ? unique([...current.completedStageKeys, completedStageKey])
            : current.completedStageKeys,
        }));
      }

      if (!gameState.isWon && nextGameState.isWon) {
        setTimerState((current) => finishTimer(current, timestamp));
      }
    },
    [gameState, level.id],
  );

  const moveToCell = useCallback(
    (target: Position) => {
      if (isPaused || gameState.isWon) {
        return;
      }

      const timestamp = Date.now();
      const elapsedAtMove = hasStarted ? getElapsedMs(timerState, timestamp) : 0;
      const nextGameState = movePlayerToTarget(
        level,
        gameState,
        target,
        trailVisibleMs,
        elapsedAtMove,
        settings.movement,
      );
      if (nextGameState === gameState) {
        return;
      }

      if (!hasStarted) {
        setTimerState((current) => startTimer(current, timestamp));
      }
      commitNextState(nextGameState, timestamp);
    },
    [commitNextState, gameState, hasStarted, isPaused, level, timerState, trailVisibleMs],
  );

  const resetRun = useCallback(() => {
    resetRunForLevel(level);
  }, [level, resetRunForLevel]);

  const togglePauseState = useCallback(() => {
    if (!hasStarted || gameState.isWon) {
      return;
    }

    const timestamp = Date.now();
    setNow(timestamp);
    setTimerState((current) => togglePause(current, timestamp));
  }, [gameState.isWon, hasStarted]);

  const startRun = useCallback(() => {
    if (gameState.isWon) {
      const nextLocation = getNextStageLocation({
        completedStageIds: effectiveCompletedStageIds,
        difficulty,
        difficultyIndex,
        stageIndex,
      });
      if (nextLocation) {
        activateStage(nextLocation.difficultyIndex, nextLocation.stageIndex);
      }
      return;
    }

    if (hasStarted && !isPaused) {
      return;
    }

    const timestamp = Date.now();
    setNow(timestamp);
    setTimerState((current) => startTimer(current, timestamp));
  }, [
    difficulty,
    difficultyIndex,
    effectiveCompletedStageIds,
    gameState.isWon,
    hasStarted,
    isPaused,
    stageIndex,
    activateStage,
  ]);

  const loadStage = useCallback(
    (nextIndex: number) => {
      const clampedIndex = Math.max(0, Math.min(difficulty.stages.length - 1, nextIndex));
      if (!isStageUnlocked(difficultyIndex, clampedIndex, effectiveCompletedStageIds)) {
        setShopMessage('이전 스테이지를 먼저 클리어해야 합니다.');
        return;
      }
      activateStage(difficultyIndex, clampedIndex);
    },
    [activateStage, difficulty.stages.length, difficultyIndex, effectiveCompletedStageIds],
  );

  const selectDifficulty = useCallback(
    (nextDifficultyIndex: number) => {
      const clampedIndex = Math.max(0, Math.min(difficulties.length - 1, nextDifficultyIndex));
      if (!isDifficultyUnlocked(clampedIndex, effectiveCompletedStageIds)) {
        setShopMessage('이전 난이도의 모든 스테이지를 클리어해야 합니다.');
        return;
      }
      activateStage(clampedIndex, 0);
    },
    [activateStage, effectiveCompletedStageIds],
  );

  return {
    animationResetKey,
    canAdvanceAfterWin,
    coinCountInLevel: Object.keys(level.coins).length,
    collectedCoinCountInLevel: hiddenCoinIds.size,
    difficulties,
    difficultyIndex,
    elapsedMs,
    gameState,
    hasStarted,
    hiddenCoinIds,
    isPaused,
    level,
    loadStage,
    onCellPress: moveToCell,
    onEquipSkin: shopActions.equipSkin,
    onEquipTrailEffect: shopActions.equipTrailEffect,
    onPauseToggle: togglePauseState,
    onPurchaseSkin: shopActions.purchaseSkin,
    onPurchaseTrailEffect: shopActions.purchaseTrailEffect,
    onReset: resetRun,
    onSelectDifficulty: selectDifficulty,
    onStartPress: startRun,
    progress,
    progressLoaded,
    shopMessage,
    stageIndex,
    stagesInDifficulty: difficulty.stages.length,
    statusText: getStatusText({
      gameState,
      hasStarted,
      isPaused,
      progressLoaded,
      collectedCoinCount: hiddenCoinIds.size,
      coinCount: Object.keys(level.coins).length,
    }),
    trailMap,
    unlockedDifficultyIds,
    selectableStageIndexes,
  };
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}
