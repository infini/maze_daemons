import type { MazeThemeId, PreparedLevel } from '../../../game/types';

export type CellDecorationType = 'grave';

export type CellDecoration = {
  type: CellDecorationType;
  opacity: number;
  rotation: string;
  scale: number;
};

export function buildMazeDecorations(level: PreparedLevel, mazeThemeId: MazeThemeId) {
  const decorations = new Map<string, CellDecoration>();
  if (mazeThemeId !== 'graveyard') {
    return decorations;
  }

  const landmarkCandidates: Array<{ key: string; score: number; decoration: CellDecoration }> = [];
  const area = level.width * level.height;
  const maxLandmarks = Math.max(4, Math.min(24, Math.floor(area / 180)));

  level.cells.forEach((row) => {
    row.forEach((cell) => {
      const key = `${cell.row}:${cell.col}`;
      if (
        cell.kind === 'wall' &&
        hasWalkableNeighbor(level, cell.row, cell.col)
      ) {
        const score = stableNoise(`${level.id}:grave`, cell.row, cell.col);
        landmarkCandidates.push({ key, score, decoration: createDecoration(score) });
      }
    });
  });

  selectDecorations(decorations, landmarkCandidates, maxLandmarks);
  return decorations;
}

function createDecoration(score: number): CellDecoration {
  const wobble = stableNoise('grave:wobble', Math.floor(score * 1000), Math.floor(score * 10000));
  return {
    type: 'grave',
    opacity: 0.78,
    rotation: `${((score - 0.5) * 12).toFixed(1)}deg`,
    scale: 0.76 + wobble * 0.22,
  };
}

function selectDecorations(
  output: Map<string, CellDecoration>,
  candidates: Array<{ key: string; score: number; decoration: CellDecoration }>,
  limit: number,
) {
  candidates
    .sort((left, right) => left.score - right.score)
    .slice(0, limit)
    .forEach((candidate) => {
      output.set(candidate.key, candidate.decoration);
    });
}

function hasWalkableNeighbor(level: PreparedLevel, row: number, col: number) {
  return (
    isWalkable(level, row - 1, col) ||
    isWalkable(level, row + 1, col) ||
    isWalkable(level, row, col - 1) ||
    isWalkable(level, row, col + 1)
  );
}

function isWalkable(level: PreparedLevel, row: number, col: number) {
  const cell = level.cells[row]?.[col];
  return Boolean(cell && cell.kind !== 'wall');
}

function stableNoise(seed: string, row: number, col: number) {
  const input = `${seed}:${row}:${col}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}
