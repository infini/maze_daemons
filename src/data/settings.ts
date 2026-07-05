import gameSettings from './game-settings.json';

type GameSettings = {
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

export const settings = gameSettings satisfies GameSettings;
