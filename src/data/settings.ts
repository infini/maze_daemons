import gameSettings from './game-settings.json';

type GameSettings = {
  trailVisibleSeconds: number;
};

export const settings = gameSettings satisfies GameSettings;
