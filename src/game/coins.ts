import type { CoinType, Position } from './types';

export function coinKey(levelId: string, coinId: string) {
  return `${levelId}:${coinId}`;
}

export function createCoinId(coinType: CoinType, position: Position) {
  const prefix = coinType === 'blue' ? 'blue-coin' : 'coin';
  return `${prefix}-${String(position.row).padStart(2, '0')}-${String(position.col).padStart(2, '0')}`;
}
