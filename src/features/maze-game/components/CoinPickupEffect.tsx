import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { settings } from '../../../data/settings';
import type { CoinPickupEffect as CoinPickupEffectData } from '../types';

export function CoinPickupEffect({
  boardHeight,
  boardWidth,
  cellHeight,
  cellWidth,
  effect,
}: {
  boardHeight: number;
  boardWidth: number;
  cellHeight: number;
  cellWidth: number;
  effect: CoinPickupEffectData;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const metrics = useMemo(() => {
    const width = Math.max(118, Math.min(168, cellWidth * 5.4));
    const height = Math.max(58, Math.min(78, cellHeight * 2.4));
    const left = clamp(
      effect.position.col * cellWidth + cellWidth / 2 - width / 2,
      2,
      Math.max(2, boardWidth - width - 2),
    );
    const top = clamp(
      effect.position.row * cellHeight - height * 0.72,
      2,
      Math.max(2, boardHeight - height - 2),
    );

    return { height, left, top, width };
  }, [boardHeight, boardWidth, cellHeight, cellWidth, effect.position.col, effect.position.row]);

  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: settings.coinPickupEffectDurationMs,
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [progress]);

  const opacity = progress.interpolate({
    inputRange: [0, 0.12, 0.72, 1],
    outputRange: [0, 1, 1, 0],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [4, -cellHeight * 0.85],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.86, 1.06, 1],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          height: metrics.height,
          left: metrics.left,
          opacity,
          top: metrics.top,
          transform: [{ translateY }, { scale }],
          width: metrics.width,
        },
      ]}
    >
      <PixelPig />
      <View style={styles.bubble}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.bubbleText}>
          YUMMY! ✨
        </Text>
      </View>
    </Animated.View>
  );
}

function PixelPig() {
  return (
    <View style={styles.pig}>
      <View style={[styles.ear, styles.leftEar]} />
      <View style={[styles.ear, styles.rightEar]} />
      <View style={styles.head}>
        <View style={[styles.eye, styles.leftEye]} />
        <View style={[styles.eye, styles.rightEye]} />
        <View style={styles.snout}>
          <View style={[styles.nostril, styles.leftNostril]} />
          <View style={[styles.nostril, styles.rightNostril]} />
        </View>
      </View>
    </View>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  pig: {
    width: 38,
    height: 34,
    position: 'relative',
  },
  ear: {
    position: 'absolute',
    top: 1,
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: '#8F4962',
    backgroundColor: '#F29BBC',
  },
  leftEar: {
    left: 4,
  },
  rightEar: {
    right: 4,
  },
  head: {
    position: 'absolute',
    left: 3,
    top: 7,
    width: 32,
    height: 25,
    borderWidth: 2,
    borderColor: '#8F4962',
    backgroundColor: '#F5A9C7',
  },
  eye: {
    position: 'absolute',
    top: 5,
    width: 4,
    height: 5,
    backgroundColor: '#27212A',
  },
  leftEye: {
    left: 7,
  },
  rightEye: {
    right: 7,
  },
  snout: {
    position: 'absolute',
    left: 8,
    bottom: 3,
    width: 14,
    height: 9,
    borderWidth: 1,
    borderColor: '#A85F78',
    backgroundColor: '#FFC1D6',
  },
  nostril: {
    position: 'absolute',
    top: 3,
    width: 3,
    height: 3,
    backgroundColor: '#6E354A',
  },
  leftNostril: {
    left: 3,
  },
  rightNostril: {
    right: 3,
  },
  bubble: {
    minWidth: 72,
    maxWidth: 118,
    borderWidth: 2,
    borderColor: '#F5A9C7',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  bubbleText: {
    color: '#3A1F2D',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
