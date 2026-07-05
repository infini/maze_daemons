import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  findStageLocationById,
  getNextStageLocation,
  getSelectableStageIndexes,
  getUnlockedDifficultyIds,
  isDifficultyUnlocked,
  isStageUnlocked,
} from '../utils/progression';
import type { CoinPickupEffect } from '../types';
import { getStatusText } from '../utils/statusText';
import { useProgressState } from './useProgressState';
import { useShopActions } from './useShopActions';

export function useMazeDaemonsGame() {
  const [run, setRun] = useState(() => createStageRun(0, 0, 0));
  const { animationResetKey, difficultyIndex, gameState, level, stageIndex } = run;
  const difficulty = difficulties[difficultyIndex] ?? difficulties[0];
  const [now, setNow] = useState(() => Date.now());
  const [timerState, setTimerState] = useState(() => createTimerState());
  const clearEffectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coinEffectTimeoutRefs = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const lastPlayedRestoredRef = useRef(false);
  const [clearEffectVisible, setClearEffectVisible] = useState(false);
  const [coinPickupEffects, setCoinPickupEffects] = useState<CoinPickupEffect[]>([]);
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

  useEffect(
    () => () => {
      if (clearEffectTimeoutRef.current) {
        clearTimeout(clearEffectTimeoutRef.current);
      }
      coinEffectTimeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    },
    [],
  );

  const clearPendingClearEffect = useCallback(() => {
    if (clearEffectTimeoutRef.current) {
      clearTimeout(clearEffectTimeoutRef.current);
      clearEffectTimeoutRef.current = null;
    }
    setClearEffectVisible(false);
  }, []);

  const clearCoinPickupEffects = useCallback(() => {
    coinEffectTimeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    coinEffectTimeoutRefs.current = [];
    setCoinPickupEffects([]);
  }, []);

  const showCoinPickupEffects = useCallback(
    (coinIds: string[]) => {
      const timestamp = Date.now();
      const effects = coinIds.flatMap((coinId, index) => {
        const position = level.coins[coinId];
        if (!position) {
          return [];
        }

        return [
          {
            id: `${level.id}:${coinId}:${timestamp}:${index}`,
            position,
          },
        ];
      });

      if (effects.length === 0) {
        return;
      }

      const effectIds = new Set(effects.map((effect) => effect.id));
      setCoinPickupEffects((current) => [...current, ...effects]);
      const timeout = setTimeout(() => {
        setCoinPickupEffects((current) => current.filter((effect) => !effectIds.has(effect.id)));
        coinEffectTimeoutRefs.current = coinEffectTimeoutRefs.current.filter(
          (storedTimeout) => storedTimeout !== timeout,
        );
      }, settings.coinPickupEffectDurationMs);
      coinEffectTimeoutRefs.current.push(timeout);
    },
    [level.coins, level.id],
  );

  const resetCurrentRun = useCallback(() => {
    clearPendingClearEffect();
    clearCoinPickupEffects();
    setNow(Date.now());
    setTimerState(createTimerState());
    setRun((current) => ({
      ...current,
      animationResetKey: current.animationResetKey + 1,
      gameState: createInitialState(current.level),
    }));
  }, [clearCoinPickupEffects, clearPendingClearEffect]);

  const activateStage = useCallback(
    (nextDifficultyIndex: number, nextStageIndex: number) => {
      clearPendingClearEffect();
      clearCoinPickupEffects();
      const nextStageId = getStageId(nextDifficultyIndex, nextStageIndex);
      setRun((current) =>
        createStageRun(nextDifficultyIndex, nextStageIndex, current.animationResetKey + 1),
      );
      setNow(Date.now());
      setTimerState(createTimerState());
      setProgress((current) =>
        current.lastPlayedStageId === nextStageId
          ? current
          : { ...current, lastPlayedStageId: nextStageId },
      );
    },
    [clearCoinPickupEffects, clearPendingClearEffect, setProgress],
  );

  useEffect(() => {
    if (!progressLoaded || lastPlayedRestoredRef.current) {
      return;
    }

    lastPlayedRestoredRef.current = true;
    const lastPlayedLocation = findStageLocationById(progress.lastPlayedStageId);
    if (!lastPlayedLocation) {
      return;
    }

    const completedStageIdsForRestore = new Set(progress.completedStageKeys);
    if (
      !isStageUnlocked(
        lastPlayedLocation.difficultyIndex,
        lastPlayedLocation.stageIndex,
        completedStageIdsForRestore,
      )
    ) {
      return;
    }

    activateStage(lastPlayedLocation.difficultyIndex, lastPlayedLocation.stageIndex);
  }, [activateStage, progress.completedStageKeys, progress.lastPlayedStageId, progressLoaded]);

  const scheduleStageClear = useCallback(
    (nextLocation: { difficultyIndex: number; stageIndex: number } | null) => {
      clearPendingClearEffect();
      setClearEffectVisible(true);
      clearEffectTimeoutRef.current = setTimeout(() => {
        clearEffectTimeoutRef.current = null;
        setClearEffectVisible(false);
        if (nextLocation) {
          activateStage(nextLocation.difficultyIndex, nextLocation.stageIndex);
        }
      }, settings.clearEffectDurationMs);
    },
    [activateStage, clearPendingClearEffect],
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
      const newlyVisibleCoinIds = newlyCollectedCoinIds.filter(
        (coinId) => !persistedCoinIds.has(coinId),
      );
      const completedStageKey = nextGameState.isWon ? level.id : null;
      const nextCompletedStageIds = new Set(completedStageIds);
      if (completedStageKey) {
        nextCompletedStageIds.add(completedStageKey);
      }

      setNow(timestamp);
      setRun((current) => {
        if (current.level.id !== level.id) {
          return current;
        }
        return {
          ...current,
          gameState: nextGameState,
        };
      });

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

      showCoinPickupEffects(newlyVisibleCoinIds);

      if (!gameState.isWon && nextGameState.isWon) {
        setTimerState((current) => finishTimer(current, timestamp));
        const nextLocation = getNextStageLocation({
          completedStageIds: nextCompletedStageIds,
          difficulty,
          difficultyIndex,
          stageIndex,
        });
        scheduleStageClear(nextLocation);
      }
    },
    [
      completedStageIds,
      difficulty,
      difficultyIndex,
      gameState,
      level.id,
      persistedCoinIds,
      scheduleStageClear,
      showCoinPickupEffects,
      stageIndex,
    ],
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
    clearEffectVisible,
    coinPickupEffects,
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
    onReset: resetCurrentRun,
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

function createStageRun(
  requestedDifficultyIndex: number,
  requestedStageIndex: number,
  animationResetKey: number,
) {
  const difficultyIndex =
    requestedDifficultyIndex >= 0 && requestedDifficultyIndex < difficulties.length
      ? requestedDifficultyIndex
      : 0;
  const difficulty = difficulties[difficultyIndex] ?? difficulties[0];
  const stageIndex =
    requestedStageIndex >= 0 && requestedStageIndex < difficulty.stages.length
      ? requestedStageIndex
      : 0;
  const levelData = difficulty.stages[stageIndex] ?? difficulty.stages[0];
  const level = prepareLevel(levelData);

  return {
    animationResetKey,
    difficultyIndex,
    gameState: createInitialState(level),
    level,
    stageIndex,
  };
}

function getStageId(requestedDifficultyIndex: number, requestedStageIndex: number) {
  const difficultyIndex =
    requestedDifficultyIndex >= 0 && requestedDifficultyIndex < difficulties.length
      ? requestedDifficultyIndex
      : 0;
  const difficulty = difficulties[difficultyIndex] ?? difficulties[0];
  const stageIndex =
    requestedStageIndex >= 0 && requestedStageIndex < difficulty.stages.length
      ? requestedStageIndex
      : 0;
  return (difficulty.stages[stageIndex] ?? difficulty.stages[0]).id;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}
