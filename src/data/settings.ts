import gameSettings from './game-settings.json';

type GameSettings = {
  clearEffectDurationMs: number;
  coinPickupEffectDurationMs: number;
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
