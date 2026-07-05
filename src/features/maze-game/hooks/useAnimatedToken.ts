import { useEffect, useMemo } from 'react';
import { Animated } from 'react-native';
import type { Position } from '../../../game/types';

export function useAnimatedToken({
  cellHeight,
  cellWidth,
  moveKey,
  movePath,
  position,
  resetKey,
  tokenInsetX,
  tokenInsetY,
}: {
  cellHeight: number;
  cellWidth: number;
  moveKey: number;
  movePath: Position[];
  position: Position;
  resetKey: number;
  tokenInsetX: number;
  tokenInsetY: number;
}) {
  const animatedPosition = useMemo(
    () =>
      new Animated.ValueXY({
        x: position.col * cellWidth + tokenInsetX,
        y: position.row * cellHeight + tokenInsetY,
      }),
    // Animated.ValueXY is intentionally recreated only on explicit resets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resetKey],
  );

  useEffect(() => {
    animatedPosition.stopAnimation();

    const path = movePath.length > 1 ? simplifyPath(movePath) : [position];
    const [first, ...rest] = path;

    animatedPosition.setValue(pointForPosition(first, cellWidth, cellHeight, tokenInsetX, tokenInsetY));

    if (rest.length === 0) {
      return undefined;
    }

    const animation = Animated.sequence(
      rest.map((step, index) =>
        Animated.timing(animatedPosition, {
          toValue: pointForPosition(step, cellWidth, cellHeight, tokenInsetX, tokenInsetY),
          duration: durationForLeg(path[index], step),
          useNativeDriver: true,
        }),
      ),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [
    animatedPosition,
    cellHeight,
    cellWidth,
    moveKey,
    movePath,
    position,
    tokenInsetX,
    tokenInsetY,
  ]);

  return animatedPosition;
}

function pointForPosition(
  position: Position,
  cellWidth: number,
  cellHeight: number,
  tokenInsetX: number,
  tokenInsetY: number,
) {
  return {
    x: position.col * cellWidth + tokenInsetX,
    y: position.row * cellHeight + tokenInsetY,
  };
}

function simplifyPath(path: Position[]) {
  if (path.length <= 2) {
    return path;
  }

  const simplified = [path[0]];
  let previousDirection = directionBetween(path[0], path[1]);

  for (let index = 2; index < path.length; index += 1) {
    const direction = directionBetween(path[index - 1], path[index]);
    if (direction !== previousDirection) {
      simplified.push(path[index - 1]);
      previousDirection = direction;
    }
  }

  simplified.push(path[path.length - 1]);
  return simplified;
}

function directionBetween(from: Position, to: Position) {
  if (from.row === to.row) {
    return 'horizontal';
  }
  return 'vertical';
}

function durationForLeg(from: Position, to: Position) {
  const distance = Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
  return Math.min(95, Math.max(28, distance * 12));
}
