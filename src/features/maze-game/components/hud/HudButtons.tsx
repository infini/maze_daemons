import { Pressable, StyleSheet, Text } from 'react-native';

export function StartButton({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.startButton,
        disabled ? styles.startButtonDisabled : null,
        pressed ? styles.startButtonPressed : null,
      ]}
    >
      <Text style={[styles.startButtonText, disabled ? styles.startButtonTextDisabled : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  active,
  disabled,
  label,
  onPress,
  wide,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  wide?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        wide ? styles.iconButtonWide : null,
        active ? styles.iconButtonActive : null,
        disabled ? styles.iconButtonDisabled : null,
        pressed ? styles.iconButtonPressed : null,
      ]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.iconButtonText, disabled ? styles.iconButtonTextDisabled : null]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  startButton: {
    flex: 1,
    minWidth: 96,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#74E173',
    backgroundColor: '#18351B',
    paddingHorizontal: 10,
  },
  startButtonPressed: {
    backgroundColor: '#214D28',
  },
  startButtonDisabled: {
    borderColor: '#344461',
    backgroundColor: '#10172A',
  },
  startButtonText: {
    color: '#F4EBD0',
    fontSize: 15,
    fontWeight: '900',
  },
  startButtonTextDisabled: {
    color: '#7F8DAA',
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5A6D9B',
    backgroundColor: '#19243F',
    paddingHorizontal: 6,
  },
  iconButtonWide: {
    width: 66,
  },
  iconButtonActive: {
    borderColor: '#FFD447',
    backgroundColor: '#2D260F',
  },
  iconButtonPressed: {
    backgroundColor: '#24365F',
  },
  iconButtonDisabled: {
    borderColor: '#26314F',
    backgroundColor: '#0D1326',
  },
  iconButtonText: {
    color: '#F4EBD0',
    fontSize: 15,
    fontWeight: '900',
  },
  iconButtonTextDisabled: {
    color: '#4F5B78',
  },
});
