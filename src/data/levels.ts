import stageCatalog from './levels/stage-catalog.json';
import type { StageCatalogData } from '../game/types';

export const catalog = stageCatalog satisfies StageCatalogData;
export const difficulties = catalog.difficulties;
export const levels = difficulties.flatMap((difficulty) => difficulty.stages);
export const firstLevel = levels[0];
