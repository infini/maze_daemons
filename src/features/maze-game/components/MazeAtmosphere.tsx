import { Image, StyleSheet, View } from 'react-native';
import { tileImages } from '../../../game/assets';
import type { CellDecoration } from '../utils/mazeDecorations';

export function MazeCellDecoration({ decoration }: { decoration: CellDecoration }) {
  return (
    <Image
      source={decoration.type === 'grave' ? tileImages.grave : tileImages.spiderWeb}
      style={[
        styles.cellDecoration,
        decoration.type === 'grave' ? styles.graveDecoration : styles.webDecoration,
        {
          opacity: decoration.opacity,
          transform: [{ rotate: decoration.rotation }, { scale: decoration.scale }],
        },
      ]}
      resizeMode="contain"
    />
  );
}

export function MazeAtmosphere() {
  return (
    <View pointerEvents="none" style={styles.atmosphereLayer}>
      <View style={[styles.fogPatch, styles.fogPatchLeft]} />
      <View style={[styles.fogPatch, styles.fogPatchRight]} />
      <View style={styles.vignette} />
      <Image source={tileImages.spiderWeb} style={[styles.cornerWeb, styles.cornerWebTopLeft]} resizeMode="contain" />
      <Image source={tileImages.spiderWeb} style={[styles.cornerWeb, styles.cornerWebBottomRight]} resizeMode="contain" />
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
  webDecoration: {
    top: '-8%',
    left: '-8%',
    width: '108%',
    height: '108%',
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
  cornerWeb: {
    position: 'absolute',
    width: '11%',
    height: '16%',
    opacity: 0.44,
  },
  cornerWebTopLeft: {
    top: '-1%',
    left: '-1%',
  },
  cornerWebBottomRight: {
    right: '-1%',
    bottom: '-1%',
    transform: [{ rotate: '180deg' }],
  },
});
