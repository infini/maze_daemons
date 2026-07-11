import gameSettings from './game-settings.json';
import type { MazeThemeId } from '../game/types';

type GameSettings = {
  audio: {
    bgmVolume: number;
    clearVolume: number;
    coinPickupVolume: number;
    tapVolume: number;
    volumeStep: number;
  };
  clearEffectDurationMs: number;
  coinPickupEffectDurationMs: number;
  coins: {
    standardReward: number;
    blueReward: number;
    bluePerStage: number;
    bluePlacement: {
      detourWeight: number;
      distanceWeight: number;
      minimumCoinDistance: number;
      requireDeadEnd: boolean;
    };
    standardPlacement: {
      challengeWeight: number;
      coverageWeight: number;
      maximumQuadrantShare: number;
      minimumCoinDistance: number;
      minimumOccupiedQuadrants: number;
      spreadWeight: number;
    };
  };
  mazeTheme: {
    defaultId: MazeThemeId;
  };
  movement: {
    directionalFallbackEnabled: boolean;
    maxTargetCornerTurns: number;
  };
  tokenAnimation: {
    durationMsPerCell: number;
    maxLegDurationMs: number;
    minLegDurationMs: number;
  };
  trailVisibleSeconds: number;
};

export const settings = {
  ...gameSettings,
  mazeTheme: {
    ...gameSettings.mazeTheme,
    defaultId: parseMazeThemeId(gameSettings.mazeTheme.defaultId),
  },
} satisfies GameSettings;

function parseMazeThemeId(value: string): MazeThemeId {
  if (value === 'graveyard' || value === 'volcano' || value === 'forest') {
    return value;
  }
  throw new Error(`Invalid default maze theme: ${value}`);
}
