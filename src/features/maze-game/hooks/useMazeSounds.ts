import { useCallback, useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { soundAssets } from '../../../game/sounds';
import type { AudioSettings } from '../../../game/types';
import type { AudioVolumeKey } from '../types';

const playerOptions = {
  downloadFirst: true,
  keepAudioSessionActive: true,
  updateInterval: 1000,
};

export function useMazeSounds(audioSettings: AudioSettings) {
  const bgmPlayer = useAudioPlayer(soundAssets.bgm, playerOptions);
  const tapPlayer = useAudioPlayer(soundAssets.tap, playerOptions);
  const coinPickupPlayer = useAudioPlayer(soundAssets.coinPickup, playerOptions);
  const clearPlayer = useAudioPlayer(soundAssets.clear, playerOptions);
  const jumpScarePlayer = useAudioPlayer(soundAssets.jumpScare, playerOptions);

  useEffect(() => {
    setAudioModeAsync({
      interruptionMode: 'mixWithOthers',
      playsInSilentMode: true,
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    bgmPlayer.loop = true;
    bgmPlayer.play();

    return () => {
      bgmPlayer.pause();
    };
  }, [bgmPlayer]);

  useEffect(() => {
    bgmPlayer.volume = audioSettings.bgmVolume;
    tapPlayer.volume = audioSettings.tapVolume;
    coinPickupPlayer.volume = audioSettings.coinPickupVolume;
    clearPlayer.volume = audioSettings.clearVolume;
    jumpScarePlayer.volume = audioSettings.clearVolume * 0.82;
  }, [audioSettings, bgmPlayer, clearPlayer, coinPickupPlayer, jumpScarePlayer, tapPlayer]);

  const playTap = useCallback(() => {
    replay(tapPlayer);
  }, [tapPlayer]);

  const playCoinPickup = useCallback(() => {
    replay(coinPickupPlayer);
  }, [coinPickupPlayer]);

  const playClear = useCallback(() => {
    replay(clearPlayer);
  }, [clearPlayer]);

  const playJumpScare = useCallback(() => {
    replay(jumpScarePlayer);
  }, [jumpScarePlayer]);

  const previewSound = useCallback(
    (key: AudioVolumeKey) => {
      const players: Record<AudioVolumeKey, AudioPlayer> = {
        bgmVolume: bgmPlayer,
        clearVolume: clearPlayer,
        coinPickupVolume: coinPickupPlayer,
        tapVolume: tapPlayer,
      };

      replay(players[key]);
    },
    [bgmPlayer, clearPlayer, coinPickupPlayer, tapPlayer],
  );

  return { playClear, playCoinPickup, playJumpScare, playTap, previewSound };
}

function replay(player: AudioPlayer) {
  const play = () => {
    try {
      player.play();
    } catch {
      // Sound effects must never block gameplay.
    }
  };

  try {
    player.pause();
    const fallbackTimeout = setTimeout(play, 80);
    player
      .seekTo(0)
      .catch(() => undefined)
      .finally(() => {
        clearTimeout(fallbackTimeout);
        play();
      });
  } catch {
    play();
  }
}
