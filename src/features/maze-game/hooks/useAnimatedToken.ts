import { useEffect, useMemo } from 'react';
import { Animated } from 'react-native';
import type { Position } from '../../../game/types';

export function useAnimatedToken({
  cellHeight,
  cellWidth,
  position,
  resetKey,
  tokenInsetX,
  tokenInsetY,
}: {
  cellHeight: number;
  cellWidth: number;
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
    Animated.timing(animatedPosition, {
      toValue: {
        x: position.col * cellWidth + tokenInsetX,
        y: position.row * cellHeight + tokenInsetY,
      },
      duration: 85,
      useNativeDriver: true,
    }).start();
  }, [animatedPosition, cellHeight, cellWidth, position.col, position.row, tokenInsetX, tokenInsetY]);

  return animatedPosition;
}
