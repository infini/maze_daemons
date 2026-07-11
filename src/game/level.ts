import { settings } from '../data/settings';
import type { CellKind, CoinType, GameState, LevelCoin, LevelData, Position, PreparedLevel } from './types';
import { createCoinId } from './coins';

export function prepareLevel(level: LevelData): PreparedLevel {
  const width = level.rows[0]?.length ?? 0;
  let start: Position | undefined;
  let exit: Position | undefined;
  const coins: Record<string, LevelCoin> = {};

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
        coinType?: CoinType;
      };

      if (tile === 'A') {
        start = position;
      }
      if (tile === 'D') {
        exit = position;
      }
      if (tile === 'C' || tile === 'B') {
        const coinType: CoinType = tile === 'B' ? 'blue' : 'standard';
        const coinId = createCoinId(coinType, position);
        coins[coinId] = {
          position,
          reward: coinType === 'blue' ? settings.coins.blueReward : settings.coins.standardReward,
          type: coinType,
        };
        cell.coinId = coinId;
        cell.coinType = coinType;
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
  if (tile === 'C' || tile === 'B') {
    return 'coin';
  }
  if (tile === 'D') {
    return 'exit';
  }
  return 'floor';
}
