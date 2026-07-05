import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { settings } from '../../../data/settings';
import { playerImages } from '../../../game/assets';

export function ClearEffect() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    opacity.setValue(0);
    scale.setValue(0.9);

    const fadeInDurationMs = Math.min(160, Math.floor(settings.clearEffectDurationMs * 0.2));
    const fadeOutDurationMs = Math.max(0, settings.clearEffectDurationMs - fadeInDurationMs);
    const animation = Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: fadeInDurationMs,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: fadeOutDurationMs,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scale, {
        toValue: 1.08,
        duration: settings.clearEffectDurationMs,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity, scale]);

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View style={[styles.clearGroup, { opacity, transform: [{ scale }] }]}>
        <Image source={playerImages['ender-dragon']} style={styles.dragon} resizeMode="contain" />
        <View style={styles.badge}>
          <Text style={styles.text}>CLEAR</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 11, 24, 0.18)',
  },
  clearGroup: {
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragon: {
    width: 160,
    height: 96,
    marginBottom: -12,
  },
  badge: {
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD447',
    backgroundColor: 'rgba(7, 11, 24, 0.82)',
    paddingHorizontal: 30,
    paddingVertical: 16,
  },
  text: {
    color: '#FFD447',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
