import type {
  CellKind,
  Direction,
  GameState,
  LevelData,
  Position,
  PreparedLevel,
  TrailMap,
} from './types';

const directions: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
};

const opposite: Record<Direction, Direction> = {
  up: 'down',
  right: 'left',
  down: 'up',
  left: 'right',
};

export function prepareLevel(level: LevelData): PreparedLevel {
  const width = level.rows[0]?.length ?? 0;
  let start: Position | undefined;
  let exit: Position | undefined;
  const coins: Record<string, Position> = {};
  let coinIndex = 0;

  const cells = level.rows.map((line, row) => {
    if (line.length !== width) {
      throw new Error(`Level ${level.id} has a non-rectangular row at ${row}.`);
    }

    return [...line].map((tile, col) => {
      const position = { row, col };
      const cell = {
        row,
        col,
        kind: tileToCellKind(tile),
      } as {
        row: number;
        col: number;
        kind: CellKind;
        coinId?: string;
      };

      if (tile === 'A') {
        start = position;
      }
      if (tile === 'D') {
        exit = position;
      }
      if (tile === 'C') {
        const coinId = `coin-${String(coinIndex + 1).padStart(2, '0')}`;
        coinIndex += 1;
        coins[coinId] = position;
        cell.coinId = coinId;
      }

      return cell;
    });
  });

  if (!start || !exit) {
    throw new Error(`Level ${level.id} must include A and D markers.`);
  }

  return {
    id: level.id,
    title: level.title,
    subtitle: level.subtitle,
    difficultyId: level.difficultyId,
    difficultyLabel: level.difficultyLabel,
    stageNumber: level.stageNumber,
    width,
    height: level.rows.length,
    cells,
    start,
    exit,
    coins,
  };
}

export function createInitialState(level: PreparedLevel): GameState {
  return {
    player: level.start,
    isWon: false,
    moves: 0,
    collectedCoinIds: [],
    trails: [],
  };
}

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

export function movePlayerTo(
  level: PreparedLevel,
  state: GameState,
  target: Position,
  trailVisibleMs: number,
  trailNowMs: number,
): GameState {
  if (state.isWon || samePosition(state.player, target)) {
    return state;
  }

  const sameRow = state.player.row === target.row;
  const sameCol = state.player.col === target.col;
  if (!sameRow && !sameCol) {
    return state;
  }

  const rowStep = sameRow ? 0 : target.row > state.player.row ? 1 : -1;
  const colStep = sameCol ? 0 : target.col > state.player.col ? 1 : -1;
  const path: Position[] = [];
  let cursor = {
    row: state.player.row + rowStep,
    col: state.player.col + colStep,
  };

  while (!samePosition(cursor, target)) {
    path.push(cursor);
    cursor = { row: cursor.row + rowStep, col: cursor.col + colStep };
  }
  path.push(target);

  return applyPath(level, state, path, trailVisibleMs, trailNowMs);
}

export function buildTrailMap(
  trails: GameState['trails'],
  now: number,
  visibleMs: number,
): TrailMap {
  const map: TrailMap = new Map();

  trails.forEach((segment) => {
    if (now - segment.at > visibleMs) {
      return;
    }

    const direction = directionBetween(segment.from, segment.to);
    if (!direction) {
      return;
    }

    ensureTrailSet(map, segment.from).add(direction);
    ensureTrailSet(map, segment.to).add(opposite[direction]);
  });

  return map;
}

export function coinKey(levelId: string, coinId: string) {
  return `${levelId}:${coinId}`;
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

  for (const next of path) {
    const cell = level.cells[next.row]?.[next.col];
    if (!cell || cell.kind === 'wall' || !areAdjacent(previous, next)) {
      return state;
    }

    segments.push({ from: previous, to: next, at: trailNowMs });
    if (cell.kind === 'coin' && cell.coinId) {
      collectedCoinIds.add(cell.coinId);
    }
    player = next;
    previous = next;
  }

  const trails = state.trails.filter((segment) => trailNowMs - segment.at <= trailVisibleMs);

  return {
    player,
    isWon: samePosition(player, level.exit),
    moves: state.moves + path.length,
    collectedCoinIds: Array.from(collectedCoinIds),
    trails: [...trails, ...segments],
  };
}

function tileToCellKind(tile: string): CellKind {
  if (tile === '#') {
    return 'wall';
  }
  if (tile === 'C') {
    return 'coin';
  }
  if (tile === 'D') {
    return 'exit';
  }
  return 'floor';
}

function ensureTrailSet(map: TrailMap, position: Position) {
  const key = positionKey(position);
  const entry = map.get(key) ?? new Set<Direction>();
  map.set(key, entry);
  return entry;
}

function directionBetween(from: Position, to: Position): Direction | undefined {
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

function positionKey(position: Position) {
  return `${position.row}:${position.col}`;
}

function samePosition(a: Position, b: Position) {
  return a.row === b.row && a.col === b.col;
}

function areAdjacent(a: Position, b: Position) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}
