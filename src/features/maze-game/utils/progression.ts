import { difficulties } from '../../../data/levels';
import type { DifficultyData } from '../../../game/types';

export function getUnlockedDifficultyIds(completedStageIds: Set<string>) {
  return new Set(
    difficulties
      .filter((_, index) => isDifficultyUnlocked(index, completedStageIds))
      .map((difficulty) => difficulty.id),
  );
}

export function getSelectableStageIndexes({
  completedStageIds,
  difficulty,
  stageIndex,
}: {
  completedStageIds: Set<string>;
  difficulty: DifficultyData;
  stageIndex: number;
}) {
  return difficulty.stages
    .map((_, index) => index)
    .filter((index) => {
      const stage = difficulty.stages[index];
      return index === stageIndex || completedStageIds.has(stage.id);
    });
}

export function canAdvanceAfterWin({
  completedStageIds,
  difficulty,
  difficultyIndex,
  stageIndex,
}: {
  completedStageIds: Set<string>;
  difficulty: DifficultyData;
  difficultyIndex: number;
  stageIndex: number;
}) {
  if (stageIndex < difficulty.stages.length - 1) {
    return isStageUnlocked(difficultyIndex, stageIndex + 1, completedStageIds);
  }

  const nextDifficultyIndex = difficultyIndex + 1;
  return (
    nextDifficultyIndex < difficulties.length &&
    isDifficultyUnlocked(nextDifficultyIndex, completedStageIds)
  );
}

export function getNextStageLocation({
  completedStageIds,
  difficulty,
  difficultyIndex,
  stageIndex,
}: {
  completedStageIds: Set<string>;
  difficulty: DifficultyData;
  difficultyIndex: number;
  stageIndex: number;
}) {
  if (
    stageIndex < difficulty.stages.length - 1 &&
    isStageUnlocked(difficultyIndex, stageIndex + 1, completedStageIds)
  ) {
    return { difficultyIndex, stageIndex: stageIndex + 1 };
  }

  const nextDifficultyIndex = difficultyIndex + 1;
  if (
    nextDifficultyIndex < difficulties.length &&
    isDifficultyUnlocked(nextDifficultyIndex, completedStageIds)
  ) {
    return { difficultyIndex: nextDifficultyIndex, stageIndex: 0 };
  }

  return null;
}

export function findStageLocationById(stageId: string | null) {
  if (!stageId) {
    return null;
  }

  for (let difficultyIndex = 0; difficultyIndex < difficulties.length; difficultyIndex += 1) {
    const difficulty = difficulties[difficultyIndex];
    const stageIndex = difficulty.stages.findIndex((stage) => stage.id === stageId);
    if (stageIndex >= 0) {
      return { difficultyIndex, stageIndex };
    }
  }

  return null;
}

export function isDifficultyUnlocked(difficultyIndex: number, completedStageIds: Set<string>) {
  if (difficultyIndex <= 0) {
    return true;
  }

  const previousDifficulty = difficulties[difficultyIndex - 1];
  return previousDifficulty.stages.every((stage) => completedStageIds.has(stage.id));
}

export function isStageUnlocked(
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
