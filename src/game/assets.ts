import type { PlayerSkinId } from './types';

export const tileImages = {
  coin: require('../../assets/tiles/coin.png'),
  exit: require('../../assets/tiles/exit.png'),
  floor: require('../../assets/tiles/floor.png'),
  wall: require('../../assets/tiles/wall.png'),
};

export const playerImages: Record<PlayerSkinId, number> = {
  zombie: require('../../assets/characters/zombie.png'),
  creeper: require('../../assets/characters/creeper.png'),
  skeleton: require('../../assets/characters/skeleton.png'),
  spider: require('../../assets/characters/spider.png'),
  'zombie-piglin': require('../../assets/characters/zombie-piglin.png'),
  piglin: require('../../assets/characters/piglin.png'),
  enderman: require('../../assets/characters/enderman.png'),
  'iron-golem': require('../../assets/characters/iron-golem.png'),
  warden: require('../../assets/characters/warden.png'),
  'ender-dragon': require('../../assets/characters/ender-dragon.png'),
};
