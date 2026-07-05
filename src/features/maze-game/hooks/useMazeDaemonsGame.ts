import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { difficulties } from '../../../data/levels';
import { defaultProgress, skinItems, trailEffectItems } from '../../../data/shop';
import { settings } from '../../../data/settings';
import {
  buildTrailMap,
  coinKey,
  createInitialState,
  movePlayer,
  prepareLevel,
} from '../../../game/maze';
import type {
  Direction,
  PlayerSkinId,
  Position,
  ProgressState,
  ShopSkinId,
  TrailEffectId,
} from '../../../game/types';
import {
  createTimerState,
  finishTimer,
  getElapsedMs,
  startTimer,
  togglePause,
} from '../utils/timer';

const progressStorageKey = 'maze-daemons:progress:v1';

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
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(defaultProgress);
  const [shopMessage, setShopMessage] = useState('');

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
  const unlockedDifficultyIds = useMemo(
    () =>
      new Set(
        difficulties
          .filter((_, index) => isDifficultyUnlocked(index, completedStageIds))
          .map((unlockedDifficulty) => unlockedDifficulty.id),
      ),
    [completedStageIds],
  );

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(progressStorageKey)
      .then((stored) => {
        if (!active) {
          return;
        }
        setProgress(normalizeProgress(stored));
      })
      .catch(() => {
        if (active) {
          setProgress(defaultProgress);
        }
      })
      .finally(() => {
        if (active) {
          setProgressLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!progressLoaded) {
      return;
    }
    AsyncStorage.setItem(progressStorageKey, JSON.stringify(progress)).catch(() => undefined);
  }, [progress, progressLoaded]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setNow(Date.now());
    setTimerState(createTimerState());
    setGameState(createInitialState(level));
    setAnimationResetKey((current) => current + 1);
  }, [level]);

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

      const direction = getDirectionFromTap(gameState.player, target);
      if (!direction) {
        return;
      }

      const timestamp = Date.now();
      const elapsedAtMove = hasStarted ? getElapsedMs(timerState, timestamp) : 0;
      const nextGameState = movePlayer(
        level,
        gameState,
        direction,
        trailVisibleMs,
        elapsedAtMove,
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
    setNow(Date.now());
    setAnimationResetKey((current) => current + 1);
    setTimerState(createTimerState());
    setGameState(createInitialState(level));
  }, [level]);

  const togglePauseState = useCallback(() => {
    if (!hasStarted || gameState.isWon) {
      return;
    }

    const timestamp = Date.now();
    setNow(timestamp);
    setTimerState((current) => togglePause(current, timestamp));
  }, [gameState.isWon, hasStarted]);

  const startRun = useCallback(() => {
    if (gameState.isWon || (hasStarted && !isPaused)) {
      return;
    }

    const timestamp = Date.now();
    setNow(timestamp);
    setTimerState((current) => startTimer(current, timestamp));
  }, [gameState.isWon, hasStarted, isPaused]);

  const loadStage = useCallback(
    (nextIndex: number) => {
      const clampedIndex = Math.max(0, Math.min(difficulty.stages.length - 1, nextIndex));
      if (!isStageUnlocked(difficultyIndex, clampedIndex, completedStageIds)) {
        setShopMessage('이전 스테이지를 먼저 클리어해야 합니다.');
        return;
      }
      setStageIndex(clampedIndex);
    },
    [completedStageIds, difficulty.stages.length, difficultyIndex],
  );

  const selectDifficulty = useCallback(
    (nextDifficultyIndex: number) => {
      const clampedIndex = Math.max(0, Math.min(difficulties.length - 1, nextDifficultyIndex));
      if (!isDifficultyUnlocked(clampedIndex, completedStageIds)) {
        setShopMessage('이전 난이도의 모든 스테이지를 클리어해야 합니다.');
        return;
      }
      setDifficultyIndex(clampedIndex);
      setStageIndex(0);
    },
    [completedStageIds],
  );

  const equipTrailEffect = useCallback((effectId: TrailEffectId | null) => {
    if (effectId === null) {
      setProgress((current) => ({ ...current, selectedTrailEffectId: null }));
      setShopMessage('기본 이동 이펙트 없음으로 변경했습니다.');
      return;
    }

    setProgress((current) => {
      if (!current.purchasedTrailEffectIds.includes(effectId)) {
        return current;
      }
      return { ...current, selectedTrailEffectId: effectId };
    });
    setShopMessage('이동 이펙트를 장착했습니다.');
  }, []);

  const purchaseTrailEffect = useCallback((effectId: TrailEffectId) => {
    setProgress((current) => {
      const itemIndex = trailEffectItems.findIndex((item) => item.id === effectId);
      const item = trailEffectItems[itemIndex];
      if (!item || current.purchasedTrailEffectIds.includes(effectId)) {
        return current;
      }
      if (itemIndex > 0 && !current.purchasedTrailEffectIds.includes(trailEffectItems[itemIndex - 1].id)) {
        setShopMessage('왼쪽 상품부터 순서대로 구매해야 합니다.');
        return current;
      }
      if (current.coins < item.price) {
        setShopMessage('코인이 부족합니다.');
        return current;
      }

      setShopMessage(`${item.label} 이동 이펙트를 구매했습니다.`);
      return {
        ...current,
        coins: current.coins - item.price,
        purchasedTrailEffectIds: [...current.purchasedTrailEffectIds, effectId],
        selectedTrailEffectId: effectId,
      };
    });
  }, []);

  const equipSkin = useCallback((skinId: PlayerSkinId) => {
    if (skinId === 'zombie') {
      setProgress((current) => ({ ...current, selectedSkinId: skinId }));
      setShopMessage('기본 좀비 스킨을 장착했습니다.');
      return;
    }

    setProgress((current) => {
      if (!current.purchasedSkinIds.includes(skinId)) {
        return current;
      }
      return { ...current, selectedSkinId: skinId };
    });
    setShopMessage('플레이어 아이콘을 장착했습니다.');
  }, []);

  const purchaseSkin = useCallback((skinId: ShopSkinId) => {
    setProgress((current) => {
      const itemIndex = skinItems.findIndex((item) => item.id === skinId);
      const item = skinItems[itemIndex];
      if (!item || current.purchasedSkinIds.includes(skinId)) {
        return current;
      }
      if (itemIndex > 0 && !current.purchasedSkinIds.includes(skinItems[itemIndex - 1].id)) {
        setShopMessage('왼쪽 스킨부터 순서대로 구매해야 합니다.');
        return current;
      }
      if (current.coins < item.price) {
        setShopMessage('코인이 부족합니다.');
        return current;
      }

      setShopMessage(`${item.label} 아이콘을 구매했습니다.`);
      return {
        ...current,
        coins: current.coins - item.price,
        purchasedSkinIds: [...current.purchasedSkinIds, skinId],
        selectedSkinId: skinId,
      };
    });
  }, []);

  return {
    animationResetKey,
    canLoadNextStage:
      stageIndex < difficulty.stages.length - 1 &&
      isStageUnlocked(difficultyIndex, stageIndex + 1, completedStageIds),
    canLoadPreviousStage: stageIndex > 0,
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
    onEquipSkin: equipSkin,
    onEquipTrailEffect: equipTrailEffect,
    onPauseToggle: togglePauseState,
    onPurchaseSkin: purchaseSkin,
    onPurchaseTrailEffect: purchaseTrailEffect,
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
  };
}

function normalizeProgress(stored: string | null): ProgressState {
  if (!stored) {
    return defaultProgress;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<ProgressState>;
    const purchasedTrailEffectIds = validTrailIds(parsed.purchasedTrailEffectIds);
    const purchasedSkinIds = validSkinIds(parsed.purchasedSkinIds);
    const rawSelectedSkinId = parsed.selectedSkinId;
    const selectedTrailEffectId =
      parsed.selectedTrailEffectId && purchasedTrailEffectIds.includes(parsed.selectedTrailEffectId)
        ? parsed.selectedTrailEffectId
        : null;
    const selectedSkinId: PlayerSkinId =
      rawSelectedSkinId === 'zombie' || purchasedSkinIds.includes(rawSelectedSkinId as ShopSkinId)
        ? (rawSelectedSkinId as PlayerSkinId)
        : defaultProgress.selectedSkinId;

    return {
      coins: typeof parsed.coins === 'number' && Number.isFinite(parsed.coins) ? parsed.coins : 0,
      collectedCoinKeys: Array.isArray(parsed.collectedCoinKeys)
        ? unique(parsed.collectedCoinKeys.filter((key): key is string => typeof key === 'string'))
        : [],
      completedStageKeys: Array.isArray(parsed.completedStageKeys)
        ? unique(parsed.completedStageKeys.filter((key): key is string => typeof key === 'string'))
        : [],
      purchasedTrailEffectIds,
      selectedTrailEffectId,
      purchasedSkinIds,
      selectedSkinId,
    };
  } catch {
    return defaultProgress;
  }
}

function validTrailIds(ids: unknown): TrailEffectId[] {
  if (!Array.isArray(ids)) {
    return [];
  }
  const validIds = new Set(trailEffectItems.map((item) => item.id));
  return unique(ids.filter((id): id is TrailEffectId => typeof id === 'string' && validIds.has(id as TrailEffectId)));
}

function validSkinIds(ids: unknown): ShopSkinId[] {
  if (!Array.isArray(ids)) {
    return [];
  }
  const validIds = new Set(skinItems.map((item) => item.id));
  return unique(ids.filter((id): id is ShopSkinId => typeof id === 'string' && validIds.has(id as ShopSkinId)));
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function getStatusText({
  coinCount,
  collectedCoinCount,
  gameState,
  hasStarted,
  isPaused,
  progressLoaded,
}: {
  coinCount: number;
  collectedCoinCount: number;
  gameState: ReturnType<typeof createInitialState>;
  hasStarted: boolean;
  isPaused: boolean;
  progressLoaded: boolean;
}) {
  if (!progressLoaded) {
    return '저장 데이터를 불러오는 중입니다.';
  }
  if (gameState.isWon) {
    return `클리어. 코인 ${collectedCoinCount}/${coinCount}개를 확인했습니다.`;
  }
  if (!hasStarted) {
    return '시작 버튼 또는 미로 터치로 타이머와 이동이 시작됩니다.';
  }
  if (isPaused) {
    return '일시정지 중입니다. 계속 버튼으로 이어서 플레이하세요.';
  }
  return `출구로 이동하세요. 코인 ${collectedCoinCount}/${coinCount}`;
}

function getDirectionFromTap(player: Position, target: Position): Direction | null {
  const rowDelta = target.row - player.row;
  const colDelta = target.col - player.col;

  if (rowDelta === 0 && colDelta === 0) {
    return null;
  }

  if (Math.abs(colDelta) >= Math.abs(rowDelta)) {
    return colDelta > 0 ? 'right' : 'left';
  }

  return rowDelta > 0 ? 'down' : 'up';
}

function isDifficultyUnlocked(difficultyIndex: number, completedStageIds: Set<string>) {
  if (difficultyIndex <= 0) {
    return true;
  }

  const previousDifficulty = difficulties[difficultyIndex - 1];
  return previousDifficulty.stages.every((stage) => completedStageIds.has(stage.id));
}

function isStageUnlocked(
  difficultyIndex: number,
  stageIndex: number,
  completedStageIds: Set<string>,
) {
  if (!isDifficultyUnlocked(difficultyIndex, completedStageIds)) {
    return false;
  }
  if (stageIndex <= 0) {
    return true;
  }

  const difficulty = difficulties[difficultyIndex];
  const previousStage = difficulty.stages[stageIndex - 1];
  return completedStageIds.has(previousStage.id);
}
