import type { CoinType, Position } from '../../game/types';

export type CoinPickupEffect = {
  coinType: CoinType;
  id: string;
  position: Position;
  reward: number;
};

export type AudioVolumeKey = 'bgmVolume' | 'clearVolume' | 'coinPickupVolume' | 'tapVolume';
