import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { catalog, levels } from '../../../data/levels';
import { defaultProgress, skinItems, trailEffectItems } from '../../../data/shop';
import type { PlayerSkinId, ProgressState, ShopSkinId, TrailEffectId } from '../../../game/types';

const progressStorageKeyPrefix = 'maze-daemons:progress:v';
const progressStorageKey = `maze-daemons:progress:v${catalog.version}`;
const validStageIds = new Set(levels.map((level) => level.id));
const stageOrderById = new Map(levels.map((level, index) => [level.id, index]));

export function useProgressState() {
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(defaultProgress);

  useEffect(() => {
    let active = true;

    loadStoredProgress()
      .then((storedProgress) => {
        if (active) {
          setProgress(storedProgress);
        }
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

  return { progress, progressLoaded, setProgress };
}

async function loadStoredProgress() {
  const currentStored = await AsyncStorage.getItem(progressStorageKey);
  const currentProgress = normalizeProgress(currentStored);
  const previousProgress = await loadBestPreviousProgress();

  if (!previousProgress) {
    return currentProgress;
  }

  return mergeProgress(currentProgress, previousProgress);
}

async function loadBestPreviousProgress() {
  const keys = await AsyncStorage.getAllKeys();
  const previousKeys = keys
    .map((key) => ({ key, version: getProgressVersion(key) }))
    .filter((entry): entry is { key: string; version: number } => entry.version !== null && entry.version < catalog.version)
    .sort((left, right) => right.version - left.version);

  if (previousKeys.length === 0) {
    return null;
  }

  const storedItems = await AsyncStorage.multiGet(previousKeys.map((entry) => entry.key));
  const previousProgresses = storedItems
    .map(([, stored]) => normalizeProgress(stored))
    .filter((storedProgress) => getProgressScore(storedProgress) > 0);

  if (previousProgresses.length === 0) {
    return null;
  }

  return previousProgresses.sort((left, right) => getProgressScore(right) - getProgressScore(left))[0];
}

function mergeProgress(current: ProgressState, previous: ProgressState): ProgressState {
  const purchasedTrailEffectIds = validTrailIds([
    ...previous.purchasedTrailEffectIds,
    ...current.purchasedTrailEffectIds,
  ]);
  const purchasedSkinIds = validSkinIds([...previous.purchasedSkinIds, ...current.purchasedSkinIds]);
  const currentScore = getProgressScore(current);
  const previousScore = getProgressScore(previous);
  const selectedTrailEffectId = chooseSelectedTrailEffectId(
    current.selectedTrailEffectId,
    previous.selectedTrailEffectId,
    purchasedTrailEffectIds,
  );
  const selectedSkinId = chooseSelectedSkinId(current.selectedSkinId, previous.selectedSkinId, purchasedSkinIds);

  return {
    audioSettings: currentScore > 0 ? current.audioSettings : previous.audioSettings,
    coins: Math.max(current.coins, previous.coins),
    collectedCoinKeys: unique([...previous.collectedCoinKeys, ...current.collectedCoinKeys]),
    completedStageKeys: validCompletedStageIds([...previous.completedStageKeys, ...current.completedStageKeys]),
    lastPlayedStageId: chooseLastPlayedStageId(current.lastPlayedStageId, previous.lastPlayedStageId),
    purchasedTrailEffectIds,
    selectedTrailEffectId,
    purchasedSkinIds,
    selectedSkinId,
  };
}

function getProgressVersion(key: string) {
  if (!key.startsWith(progressStorageKeyPrefix)) {
    return null;
  }

  const version = Number(key.slice(progressStorageKeyPrefix.length));
  if (!Number.isInteger(version) || version < 1) {
    return null;
  }
  return version;
}

function getProgressScore(progress: ProgressState) {
  return (
    progress.completedStageKeys.length * 100000 +
    progress.purchasedTrailEffectIds.length * 10000 +
    progress.purchasedSkinIds.length * 10000 +
    progress.coins +
    progress.collectedCoinKeys.length +
    (progress.lastPlayedStageId ? 1 : 0)
  );
}

function chooseLastPlayedStageId(currentStageId: string | null, previousStageId: string | null) {
  if (!currentStageId) {
    return previousStageId;
  }
  if (!previousStageId) {
    return currentStageId;
  }

  return getStageOrder(currentStageId) >= getStageOrder(previousStageId) ? currentStageId : previousStageId;
}

function getStageOrder(stageId: string) {
  return stageOrderById.get(stageId) ?? -1;
}

function chooseSelectedTrailEffectId(
  currentTrailEffectId: TrailEffectId | null,
  previousTrailEffectId: TrailEffectId | null,
  purchasedTrailEffectIds: TrailEffectId[],
) {
  if (currentTrailEffectId && purchasedTrailEffectIds.includes(currentTrailEffectId)) {
    return currentTrailEffectId;
  }
  if (previousTrailEffectId && purchasedTrailEffectIds.includes(previousTrailEffectId)) {
    return previousTrailEffectId;
  }
  return null;
}

function chooseSelectedSkinId(
  currentSkinId: PlayerSkinId,
  previousSkinId: PlayerSkinId,
  purchasedSkinIds: ShopSkinId[],
) {
  if (currentSkinId !== defaultProgress.selectedSkinId && purchasedSkinIds.includes(currentSkinId as ShopSkinId)) {
    return currentSkinId;
  }
  if (previousSkinId !== defaultProgress.selectedSkinId && purchasedSkinIds.includes(previousSkinId as ShopSkinId)) {
    return previousSkinId;
  }
  return defaultProgress.selectedSkinId;
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
    const lastPlayedStageId =
      typeof parsed.lastPlayedStageId === 'string' && validStageIds.has(parsed.lastPlayedStageId)
        ? parsed.lastPlayedStageId
        : null;
    const audioSettings = {
      bgmVolume: normalizeVolume(parsed.audioSettings?.bgmVolume, defaultProgress.audioSettings.bgmVolume),
      clearVolume: normalizeVolume(parsed.audioSettings?.clearVolume, defaultProgress.audioSettings.clearVolume),
      coinPickupVolume: normalizeVolume(
        parsed.audioSettings?.coinPickupVolume,
        defaultProgress.audioSettings.coinPickupVolume,
      ),
      tapVolume: normalizeVolume(parsed.audioSettings?.tapVolume, defaultProgress.audioSettings.tapVolume),
    };

    return {
      audioSettings,
      coins: typeof parsed.coins === 'number' && Number.isFinite(parsed.coins) ? parsed.coins : 0,
      collectedCoinKeys: Array.isArray(parsed.collectedCoinKeys)
        ? unique(parsed.collectedCoinKeys.filter((key): key is string => typeof key === 'string'))
        : [],
      completedStageKeys: validCompletedStageIds(parsed.completedStageKeys),
      lastPlayedStageId,
      purchasedTrailEffectIds,
      selectedTrailEffectId,
      purchasedSkinIds,
      selectedSkinId,
    };
  } catch {
    return defaultProgress;
  }
}

function validCompletedStageIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) {
    return [];
  }
  return unique(ids.filter((id): id is string => typeof id === 'string' && validStageIds.has(id)));
}

function validTrailIds(ids: unknown): TrailEffectId[] {
  if (!Array.isArray(ids)) {
    return [];
  }
  const validIds = new Set(trailEffectItems.map((item) => item.id));
  return unique(
    ids.filter((id): id is TrailEffectId => typeof id === 'string' && validIds.has(id as TrailEffectId)),
  );
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

function normalizeVolume(value: unknown, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, value));
}
