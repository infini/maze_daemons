import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { catalog, levels } from '../../../data/levels';
import { defaultProgress, skinItems, trailEffectItems } from '../../../data/shop';
import type { PlayerSkinId, ProgressState, ShopSkinId, TrailEffectId } from '../../../game/types';

const progressStorageKey = `maze-daemons:progress:v${catalog.version}`;
const validStageIds = new Set(levels.map((level) => level.id));

export function useProgressState() {
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(defaultProgress);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(progressStorageKey)
      .then((stored) => {
        if (active) {
          setProgress(normalizeProgress(stored));
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

    return {
      coins: typeof parsed.coins === 'number' && Number.isFinite(parsed.coins) ? parsed.coins : 0,
      collectedCoinKeys: Array.isArray(parsed.collectedCoinKeys)
        ? unique(parsed.collectedCoinKeys.filter((key): key is string => typeof key === 'string'))
        : [],
      completedStageKeys: Array.isArray(parsed.completedStageKeys)
        ? unique(parsed.completedStageKeys.filter((key): key is string => typeof key === 'string'))
        : [],
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
