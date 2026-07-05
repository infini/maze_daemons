import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { settings } from '../../../data/settings';
import { effectImages } from '../../../game/assets';

export function JumpScareOverlay({ triggerKey }: { triggerKey: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.72)).current;

  useEffect(() => {
    if (triggerKey === 0) {
      return;
    }

    opacity.setValue(0);
    scale.setValue(0.72);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          duration: 70,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          duration: 90,
          toValue: 1.04,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(Math.max(80, settings.jumpScare.durationMs - 210)),
      Animated.parallel([
        Animated.timing(opacity, {
          duration: 120,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          duration: 120,
          toValue: 1.1,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [opacity, scale, triggerKey]);

  if (triggerKey === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Image source={effectImages.ghostFace} style={styles.ghost} resizeMode="contain" />
        <Text style={styles.booText}>BOO!</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  content: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    width: '92%',
    height: '78%',
  },
  booText: {
    position: 'absolute',
    bottom: '13%',
    color: '#F4EBD0',
    fontSize: 52,
    fontWeight: '900',
    textShadowColor: '#101719',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
});
