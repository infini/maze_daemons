import { Pressable, StyleSheet, Text, View } from 'react-native';
import { settings } from '../../../../data/settings';
import type { AudioSettings } from '../../../../game/types';
import type { AudioVolumeKey } from '../../types';

const volumeRows: Array<{ key: AudioVolumeKey; label: string }> = [
  { key: 'bgmVolume', label: 'BGM' },
  { key: 'tapVolume', label: '터치' },
  { key: 'coinPickupVolume', label: '코인' },
  { key: 'clearVolume', label: '클리어' },
];

export function SettingsPanel({
  audioSettings,
  onPreviewAudio,
  onSetAudioVolume,
  progressLoaded,
}: {
  audioSettings: AudioSettings;
  onPreviewAudio: (key: AudioVolumeKey) => void;
  onSetAudioVolume: (key: AudioVolumeKey, value: number) => void;
  progressLoaded: boolean;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>설정</Text>
      <View style={styles.controlsGrid}>
        {volumeRows.map((row) => (
          <VolumeRow
            key={row.key}
            disabled={!progressLoaded}
            label={row.label}
            onChange={(value) => onSetAudioVolume(row.key, value)}
            onPreview={() => onPreviewAudio(row.key)}
            value={audioSettings[row.key]}
          />
        ))}
      </View>
    </View>
  );
}

function VolumeRow({
  disabled,
  label,
  onChange,
  onPreview,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: number) => void;
  onPreview: () => void;
  value: number;
}) {
  const step = settings.audio.volumeStep;
  const percentage = Math.round(value * 100);

  return (
    <View style={styles.row}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.label}>
        {label}
      </Text>
      <Pressable
        disabled={disabled || value <= 0}
        onPress={() => onChange(value - step)}
        style={({ pressed }) => [
          styles.stepButton,
          disabled || value <= 0 ? styles.stepButtonDisabled : null,
          pressed ? styles.stepButtonPressed : null,
        ]}
      >
        <Text style={[styles.stepButtonText, disabled || value <= 0 ? styles.stepButtonTextDisabled : null]}>
          -
        </Text>
      </Pressable>
      <View style={styles.valueBox}>
        <Text style={styles.valueText}>{percentage}%</Text>
      </View>
      <Pressable
        disabled={disabled || value >= 1}
        onPress={() => onChange(value + step)}
        style={({ pressed }) => [
          styles.stepButton,
          disabled || value >= 1 ? styles.stepButtonDisabled : null,
          pressed ? styles.stepButtonPressed : null,
        ]}
      >
        <Text style={[styles.stepButtonText, disabled || value >= 1 ? styles.stepButtonTextDisabled : null]}>
          +
        </Text>
      </Pressable>
      <Pressable
        disabled={disabled}
        onPress={onPreview}
        style={({ pressed }) => [
          styles.previewButton,
          disabled ? styles.stepButtonDisabled : null,
          pressed ? styles.stepButtonPressed : null,
        ]}
      >
        <Text style={[styles.previewButtonText, disabled ? styles.stepButtonTextDisabled : null]}>▶</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#344461',
    backgroundColor: '#0F1729',
  },
  title: {
    color: '#F4EBD0',
    fontSize: 16,
    fontWeight: '900',
  },
  controlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  row: {
    flexBasis: 174,
    flexGrow: 0,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  label: {
    width: 34,
    minWidth: 0,
    color: '#B8C3DF',
    fontSize: 11,
    fontWeight: '900',
  },
  stepButton: {
    width: 26,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5A6D9B',
    backgroundColor: '#19243F',
  },
  stepButtonPressed: {
    backgroundColor: '#24365F',
  },
  stepButtonDisabled: {
    borderColor: '#26314F',
    backgroundColor: '#0D1326',
  },
  stepButtonText: {
    color: '#F4EBD0',
    fontSize: 18,
    fontWeight: '900',
  },
  stepButtonTextDisabled: {
    color: '#4F5B78',
  },
  previewButton: {
    width: 26,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#65E7FF',
    backgroundColor: '#132C3E',
  },
  previewButtonText: {
    color: '#65E7FF',
    fontSize: 13,
    fontWeight: '900',
  },
  valueBox: {
    width: 42,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#344461',
    backgroundColor: '#10172A',
  },
  valueText: {
    color: '#FFD447',
    fontSize: 11,
    fontWeight: '900',
  },
});
