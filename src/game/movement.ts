import {
  areAdjacent,
  directions,
  isWalkable,
  orderedDirections,
  samePosition,
} from './grid';
import type { Direction, GameState, Position, PreparedLevel } from './types';

export type MovementSettings = {
  directionalFallbackEnabled: boolean;
  maxTargetCornerTurns: number;
};

export function movePlayer(
  level: PreparedLevel,
  state: GameState,
  direction: Direction,
  trailVisibleMs: number,
  trailNowMs: number,
): GameState {
  if (state.isWon) {
    return state;
  }

  const delta = directions[direction];
  return applyPath(
    level,
    state,
    [{ row: state.player.row + delta.row, col: state.player.col + delta.col }],
    trailVisibleMs,
    trailNowMs,
  );
}

export function movePlayerToTarget(
  level: PreparedLevel,
  state: GameState,
  target: Position,
  trailVisibleMs: number,
  trailNowMs: number,
  movementSettings: MovementSettings,
): GameState {
  if (state.isWon) {
    return state;
  }

  const path = findPathWithMaxTurns(
    level,
    state.player,
    target,
    movementSettings.maxTargetCornerTurns,
  );
  const fallbackPath =
    path.length > 0 || !movementSettings.directionalFallbackEnabled
      ? path
      : findDirectionalFallbackPath(level, state.player, target);
  if (fallbackPath.length === 0) {
    return state;
  }

  return applyPath(level, state, fallbackPath, trailVisibleMs, trailNowMs);
}

function applyPath(
  level: PreparedLevel,
  state: GameState,
  path: Position[],
  trailVisibleMs: number,
  trailNowMs: number,
): GameState {
  if (path.length === 0) {
    return state;
  }

  let previous = state.player;
  let player = state.player;
  const collectedCoinIds = new Set(state.collectedCoinIds);
  const segments = [];
  const traveledPath = [];

  for (const next of path) {
    const cell = level.cells[next.row]?.[next.col];
    if (!cell || cell.kind === 'wall' || !areAdjacent(previous, next)) {
      return state;
    }

    segments.push({ from: previous, to: next, at: trailNowMs });
    traveledPath.push(next);
    if (cell.kind === 'coin' && cell.coinId) {
      collectedCoinIds.add(cell.coinId);
    }
    player = next;
    previous = next;

    if (samePosition(player, level.exit)) {
      break;
    }
  }

  const trails = state.trails.filter((segment) => trailNowMs - segment.at <= trailVisibleMs);

  return {
    player,
    isWon: samePosition(player, level.exit),
    lastMovePath: [state.player, ...traveledPath],
    moveKey: state.moveKey + 1,
    moves: state.moves + traveledPath.length,
    collectedCoinIds: Array.from(collectedCoinIds),
    trails: [...trails, ...segments],
  };
}

function findPathWithMaxTurns(
  level: PreparedLevel,
  from: Position,
  target: Position,
  maxTurns: number,
) {
  if (samePosition(from, target) || !isWalkable(level, target)) {
    return [];
  }

  const queue: Array<{
    direction: Direction | null;
    path: Position[];
    position: Position;
    turns: number;
  }> = [{ direction: null, path: [], position: from, turns: 0 }];
  const visited = new Set([pathSearchKey(from, null, 0)]);

  for (const current of queue) {
    for (const direction of orderedDirections) {
      const delta = directions[direction];
      const next = {
        row: current.position.row + delta.row,
        col: current.position.col + delta.col,
      };
      if (!isWalkable(level, next)) {
        continue;
      }

      const turns =
        current.direction !== null && current.direction !== direction
          ? current.turns + 1
          : current.turns;
      if (turns > maxTurns) {
        continue;
      }

      const key = pathSearchKey(next, direction, turns);
      if (visited.has(key)) {
        continue;
      }

      const path = [...current.path, next];
      if (samePosition(next, target)) {
        return path;
      }

      visited.add(key);
      queue.push({ direction, path, position: next, turns });
    }
  }

  return [];
}

function findDirectionalFallbackPath(
  level: PreparedLevel,
  from: Position,
  target: Position,
) {
  if (samePosition(from, target)) {
    return [];
  }

  const rowDelta = target.row - from.row;
  const colDelta = target.col - from.col;
  const primaryAxis = Math.abs(colDelta) >= Math.abs(rowDelta) ? 'horizontal' : 'vertical';
  const axes = primaryAxis === 'horizontal' ? ['horizontal', 'vertical'] : ['vertical', 'horizontal'];

  for (const axis of axes) {
    const path = buildDirectionalRunPath(
      level,
      from,
      axis === 'horizontal' ? Math.sign(colDelta) : 0,
      axis === 'vertical' ? Math.sign(rowDelta) : 0,
    );
    if (path.length > 0) {
      return path;
    }
  }

  return [];
}

function buildDirectionalRunPath(
  level: PreparedLevel,
  from: Position,
  colStep: number,
  rowStep: number,
) {
  if (rowStep === 0 && colStep === 0) {
    return [];
  }

  const path: Position[] = [];
  let current = from;

  while (true) {
    const next = { row: current.row + rowStep, col: current.col + colStep };
    if (!isWalkable(level, next)) {
      break;
    }
    path.push(next);
    if (samePosition(next, level.exit)) {
      break;
    }
    current = next;
  }

  return path;
}

function pathSearchKey(position: Position, direction: Direction | null, turns: number) {
  return `${position.row}:${position.col}:${direction ?? 'start'}:${turns}`;
}
