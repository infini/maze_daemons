export type Direction = 'up' | 'right' | 'down' | 'left';

export type Position = {
  row: number;
  col: number;
};

export type TrailEffectId =
  | 'white'
  | 'light-red'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'light-green'
  | 'green'
  | 'light-blue'
  | 'blue'
  | 'navy'
  | 'purple'
  | 'light-brown'
  | 'brown'
  | 'gray'
  | 'black'
  | 'rainbow';

export type ShopSkinId =
  | 'creeper'
  | 'skeleton'
  | 'spider'
  | 'zombie-piglin'
  | 'piglin'
  | 'enderman'
  | 'iron-golem'
  | 'warden'
  | 'ender-dragon';

export type PlayerSkinId = 'zombie' | ShopSkinId;

export type LevelData = {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  difficultyId: string;
  difficultyLabel: string;
  stageNumber: number;
  rows: string[];
  legend: Record<string, string>;
};

export type DifficultyData = {
  id: string;
  label: string;
  order: number;
  stages: LevelData[];
};

export type StageCatalogData = {
  version: number;
  stagesPerDifficulty: number;
  difficulties: DifficultyData[];
};

export type CellKind = 'wall' | 'floor' | 'coin' | 'exit';

export type Cell = {
  kind: CellKind;
  row: number;
  col: number;
  coinId?: string;
};

export type TrailSegment = {
  from: Position;
  to: Position;
  at: number;
};

export type PreparedLevel = {
  id: string;
  title: string;
  subtitle: string;
  difficultyId: string;
  difficultyLabel: string;
  stageNumber: number;
  width: number;
  height: number;
  cells: Cell[][];
  start: Position;
  exit: Position;
  coins: Record<string, Position>;
};

export type GameState = {
  player: Position;
  isWon: boolean;
  lastMovePath: Position[];
  moveKey: number;
  moves: number;
  collectedCoinIds: string[];
  trails: TrailSegment[];
};

export type TrailMap = Map<string, Set<Direction>>;

export type TrailEffectItem = {
  id: TrailEffectId;
  label: string;
  color: string;
  price: number;
};

export type SkinItem = {
  id: ShopSkinId;
  label: string;
  price: number;
};

export type ProgressState = {
  coins: number;
  collectedCoinKeys: string[];
  completedStageKeys: string[];
  purchasedTrailEffectIds: TrailEffectId[];
  selectedTrailEffectId: TrailEffectId | null;
  purchasedSkinIds: ShopSkinId[];
  selectedSkinId: PlayerSkinId;
};
