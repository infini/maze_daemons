import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { DifficultyData } from '../../../../game/types';

export function DifficultySelector({
  activeIndex,
  difficulties,
  onSelect,
  unlockedDifficultyIds,
}: {
  activeIndex: number;
  difficulties: DifficultyData[];
  onSelect: (index: number) => void;
  unlockedDifficultyIds: Set<string>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.difficultyRow}
    >
      {difficulties.map((difficulty, index) => {
        const selected = index === activeIndex;
        const unlocked = unlockedDifficultyIds.has(difficulty.id);
        return (
          <Pressable
            disabled={!unlocked}
            key={difficulty.id}
            onPress={() => onSelect(index)}
            style={({ pressed }) => [
              styles.difficultyButton,
              selected ? styles.difficultyButtonSelected : null,
              !unlocked ? styles.difficultyButtonLocked : null,
              pressed ? styles.difficultyButtonPressed : null,
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.difficultyButtonText,
                selected ? styles.difficultyButtonTextSelected : null,
                !unlocked ? styles.difficultyButtonTextLocked : null,
              ]}
            >
              {difficulty.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function StagePicker({
  activeIndex,
  onSelect,
  selectableStageIndexes,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
  selectableStageIndexes: number[];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stagePickerRow}
    >
      {selectableStageIndexes.map((index) => {
        const selected = index === activeIndex;
        return (
          <Pressable
            key={index}
            onPress={() => onSelect(index)}
            style={({ pressed }) => [
              styles.stagePickerButton,
              selected ? styles.stagePickerButtonSelected : null,
              pressed ? styles.stagePickerButtonPressed : null,
            ]}
          >
            <Text
              style={[
                styles.stagePickerButtonText,
                selected ? styles.stagePickerButtonTextSelected : null,
              ]}
            >
              {index + 1}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  difficultyRow: {
    minHeight: 34,
    flexDirection: 'row',
    gap: 6,
    paddingRight: 6,
  },
  difficultyButton: {
    width: 96,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#344461',
    backgroundColor: '#10172A',
    paddingHorizontal: 7,
  },
  difficultyButtonSelected: {
    borderColor: '#65E7FF',
    backgroundColor: '#17324C',
  },
  difficultyButtonLocked: {
    opacity: 0.42,
  },
  difficultyButtonPressed: {
    backgroundColor: '#24365F',
  },
  difficultyButtonText: {
    color: '#B8C3DF',
    fontSize: 12,
    fontWeight: '900',
  },
  difficultyButtonTextSelected: {
    color: '#F4EBD0',
  },
  difficultyButtonTextLocked: {
    color: '#6F7890',
  },
  stagePickerRow: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 6,
  },
  stagePickerButton: {
    width: 34,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#344461',
    backgroundColor: '#10172A',
  },
  stagePickerButtonSelected: {
    borderColor: '#FFD447',
    backgroundColor: '#2B230D',
  },
  stagePickerButtonPressed: {
    backgroundColor: '#24365F',
  },
  stagePickerButtonText: {
    color: '#B8C3DF',
    fontSize: 12,
    fontWeight: '900',
  },
  stagePickerButtonTextSelected: {
    color: '#F4EBD0',
  },
});
