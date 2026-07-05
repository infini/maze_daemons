import type { Direction, Position, PreparedLevel } from './types';

export const directions: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
};

export const opposite: Record<Direction, Direction> = {
  up: 'down',
  right: 'left',
  down: 'up',
  left: 'right',
};

export const orderedDirections: Direction[] = ['up', 'right', 'down', 'left'];

export function isWalkable(level: PreparedLevel, position: Position) {
  const cell = level.cells[position.row]?.[position.col];
  return Boolean(cell && cell.kind !== 'wall');
}

export function positionKey(position: Position) {
  return `${position.row}:${position.col}`;
}

export function samePosition(a: Position, b: Position) {
  return a.row === b.row && a.col === b.col;
}

export function areAdjacent(a: Position, b: Position) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function directionBetween(from: Position, to: Position): Direction | undefined {
  if (to.row === from.row - 1 && to.col === from.col) {
    return 'up';
  }
  if (to.row === from.row + 1 && to.col === from.col) {
    return 'down';
  }
  if (to.col === from.col - 1 && to.row === from.row) {
    return 'left';
  }
  if (to.col === from.col + 1 && to.row === from.row) {
    return 'right';
  }
  return undefined;
}
