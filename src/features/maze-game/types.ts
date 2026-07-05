import type { Position } from '../../game/types';

export type CoinPickupEffect = {
  id: string;
  position: Position;
};

export type AudioVolumeKey = 'bgmVolume' | 'clearVolume' | 'coinPickupVolume' | 'tapVolume';
