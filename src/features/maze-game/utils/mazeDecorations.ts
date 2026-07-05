import type { PreparedLevel } from '../../../game/types';

export type CellDecorationType = 'grave' | 'spiderWeb';

export type CellDecoration = {
  type: CellDecorationType;
  opacity: number;
  rotation: string;
  scale: number;
};

export function buildMazeDecorations(level: PreparedLevel) {
  const decorations = new Map<string, CellDecoration>();
  const graveCandidates: Array<{ key: string; score: number; decoration: CellDecoration }> = [];
  const webCandidates: Array<{ key: string; score: number; decoration: CellDecoration }> = [];
  const area = level.width * level.height;
  const maxGraves = Math.max(4, Math.min(24, Math.floor(area / 180)));
  const maxWebs = Math.max(5, Math.min(32, Math.floor(area / 140)));

  level.cells.forEach((row) => {
    row.forEach((cell) => {
      const key = `${cell.row}:${cell.col}`;
      if (cell.kind === 'wall' && hasWalkableNeighbor(level, cell.row, cell.col)) {
        const score = stableNoise(`${level.id}:grave`, cell.row, cell.col);
        graveCandidates.push({ key, score, decoration: createDecoration('grave', score) });
        return;
      }

      if (
        cell.kind === 'floor' &&
        !isStartPosition(level, cell.row, cell.col) &&
        hasWallCorner(level, cell.row, cell.col)
      ) {
        const score = stableNoise(`${level.id}:web`, cell.row, cell.col);
        webCandidates.push({ key, score, decoration: createDecoration('spiderWeb', score) });
      }
    });
  });

  selectDecorations(decorations, graveCandidates, maxGraves);
  selectDecorations(decorations, webCandidates, maxWebs);
  return decorations;
}

function createDecoration(type: CellDecorationType, score: number): CellDecoration {
  const wobble = stableNoise(`${type}:wobble`, Math.floor(score * 1000), Math.floor(score * 10000));
  const rotation = type === 'grave' ? (score - 0.5) * 12 : score * 270;
  return {
    type,
    opacity: type === 'grave' ? 0.78 : 0.52,
    rotation: `${rotation.toFixed(1)}deg`,
    scale: type === 'grave' ? 0.76 + wobble * 0.22 : 0.82 + wobble * 0.24,
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

function isStartPosition(level: PreparedLevel, row: number, col: number) {
  return level.start.row === row && level.start.col === col;
}

function hasWalkableNeighbor(level: PreparedLevel, row: number, col: number) {
  return (
    isWalkable(level, row - 1, col) ||
    isWalkable(level, row + 1, col) ||
    isWalkable(level, row, col - 1) ||
    isWalkable(level, row, col + 1)
  );
}

function hasWallCorner(level: PreparedLevel, row: number, col: number) {
  const verticalWall = isWall(level, row - 1, col) || isWall(level, row + 1, col);
  const horizontalWall = isWall(level, row, col - 1) || isWall(level, row, col + 1);
  return verticalWall && horizontalWall;
}

function isWalkable(level: PreparedLevel, row: number, col: number) {
  const cell = level.cells[row]?.[col];
  return Boolean(cell && cell.kind !== 'wall');
}

function isWall(level: PreparedLevel, row: number, col: number) {
  return level.cells[row]?.[col]?.kind === 'wall';
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
