import type { PlayerSkinId, ProgressState, SkinItem, TrailEffectItem } from '../game/types';
import { settings } from './settings';

export const defaultPlayerSkinId: PlayerSkinId = 'zombie';

export const defaultProgress: ProgressState = {
  audioSettings: {
    bgmVolume: settings.audio.bgmVolume,
    clearVolume: settings.audio.clearVolume,
    coinPickupVolume: settings.audio.coinPickupVolume,
    tapVolume: settings.audio.tapVolume,
  },
  coins: 0,
  collectedCoinKeys: [],
  completedStageKeys: [],
  lastPlayedStageId: null,
  mazeThemeId: settings.mazeTheme.defaultId,
  purchasedTrailEffectIds: [],
  selectedTrailEffectId: null,
  purchasedSkinIds: [],
  selectedSkinId: defaultPlayerSkinId,
};

export const trailEffectItems: TrailEffectItem[] = [
  { id: 'white', label: '하얀색', color: '#FFFFFF', price: 20 },
  { id: 'light-red', label: '연한 빨강', color: '#FF9AA2', price: 35 },
  { id: 'red', label: '빨강', color: '#FF3232', price: 55 },
  { id: 'orange', label: '주황', color: '#FF8A1D', price: 80 },
  { id: 'yellow', label: '노랑', color: '#FFD83D', price: 110 },
  { id: 'light-green', label: '연한 초록', color: '#A8F28A', price: 145 },
  { id: 'green', label: '초록', color: '#32D35C', price: 185 },
  { id: 'light-blue', label: '연한 파랑', color: '#81D7FF', price: 230 },
  { id: 'blue', label: '파랑', color: '#298BFF', price: 280 },
  { id: 'navy', label: '네이비', color: '#122A76', price: 340 },
  { id: 'purple', label: '보라', color: '#955CFF', price: 410 },
  { id: 'light-brown', label: '연한 갈색', color: '#C79563', price: 490 },
  { id: 'brown', label: '갈색', color: '#7A4B2B', price: 580 },
  { id: 'gray', label: '회색', color: '#9299A6', price: 680 },
  { id: 'black', label: '검은색', color: '#0B0D12', price: 800 },
  { id: 'rainbow', label: '무지개색', color: '#FFFFFF', price: 950 },
];

export const skinItems: SkinItem[] = [
  { id: 'creeper', label: '크리퍼', price: 120 },
  { id: 'skeleton', label: '스켈레톤', price: 220 },
  { id: 'spider', label: '거미', price: 360 },
  { id: 'zombie-piglin', label: '좀비 피글린', price: 540 },
  { id: 'piglin', label: '피글린', price: 760 },
  { id: 'enderman', label: '엔더맨', price: 1050 },
  { id: 'iron-golem', label: '철골렘', price: 1400 },
  { id: 'warden', label: '워든', price: 1850 },
  { id: 'ender-dragon', label: '엔더드래곤', price: 2400 },
];
