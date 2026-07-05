import { StyleSheet, View } from 'react-native';
import { trailEffectItems } from '../../../data/shop';
import type { Direction, TrailEffectId } from '../../../game/types';

const rainbowColors = ['#FF3232', '#FF8A1D', '#FFD83D', '#32D35C', '#298BFF', '#955CFF'];

export function Trail({
  col,
  directions,
  effectId,
  row,
}: {
  col: number;
  directions: Set<Direction>;
  effectId: TrailEffectId;
  row: number;
}) {
  return (
    <View pointerEvents="none" style={styles.canvas}>
      {Array.from(directions).map((direction, index) => (
        <View
          key={direction}
          style={[
            styles.segment,
            segmentStyle(direction),
            {
              backgroundColor: getTrailColor(effectId, row, col, index),
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.core,
          {
            backgroundColor: getTrailColor(effectId, row, col, directions.size),
          },
        ]}
      />
    </View>
  );
}

function getTrailColor(effectId: TrailEffectId, row: number, col: number, offset: number) {
  if (effectId === 'rainbow') {
    return rainbowColors[(row + col + offset) % rainbowColors.length];
  }

  return trailEffectItems.find((item) => item.id === effectId)?.color ?? '#FFFFFF';
}

function segmentStyle(direction: Direction) {
  if (direction === 'up') {
    return styles.up;
  }
  if (direction === 'right') {
    return styles.right;
  }
  if (direction === 'down') {
    return styles.down;
  }
  return styles.left;
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  core: {
    position: 'absolute',
    left: '35%',
    top: '35%',
    width: '30%',
    height: '30%',
    borderRadius: 999,
    opacity: 0.85,
  },
  segment: {
    position: 'absolute',
    opacity: 0.72,
  },
  up: {
    left: '40%',
    top: 0,
    width: '20%',
    height: '50%',
  },
  right: {
    right: 0,
    top: '40%',
    width: '50%',
    height: '20%',
  },
  down: {
    left: '40%',
    bottom: 0,
    width: '20%',
    height: '50%',
  },
  left: {
    left: 0,
    top: '40%',
    width: '50%',
    height: '20%',
  },
});
