import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { tileImages } from '../../../game/assets';
import type { MazeThemeId } from '../../../game/types';
import type { CellDecoration } from '../utils/mazeDecorations';

export function MazeCellDecoration({
  decoration,
}: {
  decoration: CellDecoration;
}) {
  return (
    <Image
      source={tileImages.grave}
      style={[
        styles.cellDecoration,
        styles.graveDecoration,
        {
          opacity: decoration.opacity,
          transform: [{ rotate: decoration.rotation }, { scale: decoration.scale }],
        },
      ]}
      resizeMode="contain"
    />
  );
}

export function MazeAtmosphere({ mazeThemeId }: { mazeThemeId: MazeThemeId }) {
  if (mazeThemeId === 'volcano') {
    return <VolcanoAtmosphere />;
  }
  if (mazeThemeId === 'forest') {
    return <ForestAtmosphere />;
  }

  return (
    <View pointerEvents="none" style={styles.atmosphereLayer}>
      <View style={[styles.fogPatch, styles.fogPatchLeft]} />
      <View style={[styles.fogPatch, styles.fogPatchRight]} />
      <View style={styles.vignette} />
    </View>
  );
}

function VolcanoAtmosphere() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { duration: 1800, toValue: 1, useNativeDriver: true }),
        Animated.timing(pulse, { duration: 1800, toValue: 0, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const heatOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.12],
  });

  return (
    <View pointerEvents="none" style={styles.atmosphereLayer}>
      <Animated.View style={[styles.volcanoHeat, { opacity: heatOpacity }]} />
      <View style={styles.volcanoVignette} />
    </View>
  );
}

function ForestAtmosphere() {
  return (
    <View pointerEvents="none" style={styles.atmosphereLayer}>
      <View style={styles.forestVignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  cellDecoration: {
    position: 'absolute',
  },
  graveDecoration: {
    left: '10%',
    bottom: '2%',
    width: '80%',
    height: '86%',
  },
  atmosphereLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  fogPatch: {
    position: 'absolute',
    width: '42%',
    height: '18%',
    borderRadius: 999,
    backgroundColor: 'rgba(147, 162, 147, 0.08)',
  },
  fogPatchLeft: {
    left: '4%',
    top: '17%',
    transform: [{ rotate: '-10deg' }],
  },
  fogPatchRight: {
    right: '5%',
    bottom: '12%',
    transform: [{ rotate: '8deg' }],
  },
  vignette: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 16,
    borderColor: 'rgba(0, 0, 0, 0.16)',
  },
  volcanoHeat: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FF5A13',
  },
  volcanoVignette: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 18,
    borderColor: 'rgba(17, 3, 1, 0.28)',
  },
  forestVignette: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 18,
    borderColor: 'rgba(0, 18, 6, 0.22)',
  },
});
