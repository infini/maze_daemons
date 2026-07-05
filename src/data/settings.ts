import gameSettings from './game-settings.json';

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
  jumpScare: {
    chancePerTap: number;
    cooldownMs: number;
    durationMs: number;
    enabled: boolean;
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

export const settings = gameSettings satisfies GameSettings;
