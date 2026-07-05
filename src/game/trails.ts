import { directionBetween, opposite, positionKey } from './grid';
import type { Direction, GameState, Position, TrailMap } from './types';

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

function ensureTrailSet(map: TrailMap, position: Position) {
  const key = positionKey(position);
  const entry = map.get(key) ?? new Set<Direction>();
  map.set(key, entry);
  return entry;
}
