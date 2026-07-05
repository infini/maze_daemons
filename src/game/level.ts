import type { CellKind, GameState, LevelData, Position, PreparedLevel } from './types';

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
