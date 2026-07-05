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
    lastMovePath: [],
    moveKey: 0,
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

export function movePlayerToTarget(
  level: PreparedLevel,
  state: GameState,
  target: Position,
  trailVisibleMs: number,
  trailNowMs: number,
): GameState {
  if (state.isWon) {
    return state;
  }

  const path = findDirectOrOneTurnPath(level, state.player, target);
  const fallbackPath = path.length > 0 ? path : findDirectionalFallbackPath(level, state.player, target);
  if (fallbackPath.length === 0) {
    return state;
  }

  return applyPath(level, state, fallbackPath, trailVisibleMs, trailNowMs);
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

function findDirectOrOneTurnPath(
  level: PreparedLevel,
  from: Position,
  target: Position,
) {
  if (samePosition(from, target) || !isWalkable(level, target)) {
    return [];
  }

  const directPath = buildLinePath(from, target);
  if (directPath && isPathWalkable(level, from, directPath)) {
    return directPath;
  }

  const corners = [
    { row: from.row, col: target.col },
    { row: target.row, col: from.col },
  ];

  for (const corner of corners) {
    if (!isWalkable(level, corner)) {
      continue;
    }

    const firstLeg = buildLinePath(from, corner);
    const secondLeg = buildLinePath(corner, target);
    if (!firstLeg || !secondLeg) {
      continue;
    }

    const path = [...firstLeg, ...secondLeg];
    if (isPathWalkable(level, from, path)) {
      return path;
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

function buildLinePath(from: Position, to: Position) {
  const path: Position[] = [];

  if (from.row === to.row) {
    const step = Math.sign(to.col - from.col);
    for (let col = from.col + step; col !== to.col + step; col += step) {
      path.push({ row: from.row, col });
    }
    return path;
  }

  if (from.col === to.col) {
    const step = Math.sign(to.row - from.row);
    for (let row = from.row + step; row !== to.row + step; row += step) {
      path.push({ row, col: from.col });
    }
    return path;
  }

  return null;
}

function isPathWalkable(level: PreparedLevel, from: Position, path: Position[]) {
  let previous = from;

  for (const position of path) {
    if (!isWalkable(level, position) || !areAdjacent(previous, position)) {
      return false;
    }
    previous = position;
  }

  return true;
}

function isWalkable(level: PreparedLevel, position: Position) {
  const cell = level.cells[position.row]?.[position.col];
  return Boolean(cell && cell.kind !== 'wall');
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
