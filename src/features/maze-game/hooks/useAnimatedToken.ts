import { useEffect, useMemo } from 'react';
import { Animated } from 'react-native';
import type { Position } from '../../../game/types';

export function useAnimatedToken({
  cellSize,
  position,
  resetKey,
  tokenInset,
}: {
  cellSize: number;
  position: Position;
  resetKey: number;
  tokenInset: number;
}) {
  const animatedPosition = useMemo(
    () =>
      new Animated.ValueXY({
        x: position.col * cellSize + tokenInset,
        y: position.row * cellSize + tokenInset,
      }),
    // Animated.ValueXY is intentionally recreated only on explicit resets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resetKey],
  );

  useEffect(() => {
    Animated.timing(animatedPosition, {
      toValue: {
        x: position.col * cellSize + tokenInset,
        y: position.row * cellSize + tokenInset,
      },
      duration: 85,
      useNativeDriver: true,
    }).start();
  }, [animatedPosition, cellSize, position.col, position.row, tokenInset]);

  return animatedPosition;
}
