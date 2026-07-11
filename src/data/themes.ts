import type { MazeThemeId } from '../game/types';
import { settings } from './settings';

type MazeThemeVisuals = {
  wallColor: string;
  wallOutlineColor: string | null;
  wallOutlineWidth: number;
};

export const mazeThemeVisuals = {
  graveyard: {
    wallColor: '#232A31',
    wallOutlineColor: null,
    wallOutlineWidth: 0,
  },
  volcano: {
    wallColor: '#FF6A13',
    wallOutlineColor: '#B43618',
    wallOutlineWidth: 2,
  },
  forest: {
    wallColor: '#4CB45A',
    wallOutlineColor: '#2D7F3E',
    wallOutlineWidth: 2,
  },
} as const satisfies Record<MazeThemeId, MazeThemeVisuals>;

export const mazeThemeOptions: Array<{
  id: MazeThemeId;
  label: string;
  swatchColor: string;
}> = [
  { id: 'graveyard', label: '기본', swatchColor: '#66736B' },
  { id: 'volcano', label: '볼케이노', swatchColor: mazeThemeVisuals.volcano.wallColor },
  { id: 'forest', label: '포레스트', swatchColor: mazeThemeVisuals.forest.wallColor },
];

export function normalizeMazeThemeId(value: unknown): MazeThemeId {
  return value === 'graveyard' || value === 'volcano' || value === 'forest'
    ? value
    : settings.mazeTheme.defaultId;
}
