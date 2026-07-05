import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type {
  DifficultyData,
  PlayerSkinId,
  ProgressState,
  ShopSkinId,
  TrailEffectId,
} from '../../../game/types';
import { formatElapsedTime } from '../utils/timer';
import { IconButton, StartButton } from './hud/HudButtons';
import { ShopPanel } from './hud/ShopPanel';
import { DifficultySelector, StagePicker } from './hud/StageSelectors';

export function GameHud({
  boardHeight,
  canAdvanceAfterWin,
  coinCountInLevel,
  collectedCoinCountInLevel,
  difficulties,
  difficultyIndex,
  elapsedMs,
  hasStarted,
  isPaused,
  levelLabel,
  moves,
  onEquipSkin,
  onEquipTrailEffect,
  onLoadStage,
  onPauseToggle,
  onPurchaseSkin,
  onPurchaseTrailEffect,
  onReset,
  onSelectDifficulty,
  onStartPress,
  panelWidth,
  progress,
  progressLoaded,
  shopMessage,
  stageIndex,
  stagesInDifficulty,
  statusText,
  selectableStageIndexes,
  unlockedDifficultyIds,
  won,
}: {
  boardHeight: number;
  canAdvanceAfterWin: boolean;
  coinCountInLevel: number;
  collectedCoinCountInLevel: number;
  difficulties: DifficultyData[];
  difficultyIndex: number;
  elapsedMs: number;
  hasStarted: boolean;
  isPaused: boolean;
  levelLabel: string;
  moves: number;
  onEquipSkin: (skinId: PlayerSkinId) => void;
  onEquipTrailEffect: (effectId: TrailEffectId | null) => void;
  onLoadStage: (index: number) => void;
  onPauseToggle: () => void;
  onPurchaseSkin: (skinId: ShopSkinId) => void;
  onPurchaseTrailEffect: (effectId: TrailEffectId) => void;
  onReset: () => void;
  onSelectDifficulty: (index: number) => void;
  onStartPress: () => void;
  panelWidth: number;
  progress: ProgressState;
  progressLoaded: boolean;
  shopMessage: string;
  stageIndex: number;
  stagesInDifficulty: number;
  statusText: string;
  selectableStageIndexes: number[];
  unlockedDifficultyIds: Set<string>;
  won: boolean;
}) {
  const [shopOpen, setShopOpen] = useState(false);
  const [stagePickerOpen, setStagePickerOpen] = useState(false);

  return (
    <View style={[styles.controlPanel, { width: panelWidth, maxHeight: boardHeight }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.panelContent}
      >
        <View style={styles.hudRow}>
          <View style={styles.titleBlock}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.appTitle}>
              MazeDaemons
            </Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.levelTitle}>
              {levelLabel}
            </Text>
          </View>
          <Pressable
            onPress={() => setStagePickerOpen((current) => !current)}
            style={({ pressed }) => [
              styles.stageButton,
              stagePickerOpen ? styles.stageButtonActive : null,
              pressed ? styles.stageButtonPressed : null,
            ]}
          >
            <Text style={styles.stageButtonTitle}>STAGE</Text>
            <Text style={styles.stageButtonText}>
              {stageIndex + 1}/{stagesInDifficulty}
            </Text>
          </Pressable>
          <View style={styles.coinPill}>
            <Text style={styles.coinLabel}>COIN</Text>
            <Text style={styles.coinValue}>{progress.coins}</Text>
          </View>
        </View>

        {stagePickerOpen ? (
          <StagePicker
            activeIndex={stageIndex}
            onSelect={(index) => {
              onLoadStage(index);
              setStagePickerOpen(false);
            }}
            selectableStageIndexes={selectableStageIndexes}
          />
        ) : null}

        <DifficultySelector
          activeIndex={difficultyIndex}
          difficulties={difficulties}
          onSelect={onSelectDifficulty}
          unlockedDifficultyIds={unlockedDifficultyIds}
        />

        <View style={styles.iconCluster}>
          <StartButton
            disabled={won ? !canAdvanceAfterWin : hasStarted && !isPaused}
            label={
              won
                ? canAdvanceAfterWin
                  ? '다음'
                  : '완료'
                : !hasStarted
                  ? '시작'
                  : isPaused
                    ? '계속'
                    : '진행 중'
            }
            onPress={onStartPress}
          />
          <IconButton
            active={isPaused}
            disabled={!hasStarted || won}
            label={isPaused ? '▶' : '||'}
            onPress={onPauseToggle}
          />
          <IconButton label="↻" onPress={onReset} />
          <IconButton active={shopOpen} label="상점" wide onPress={() => setShopOpen((current) => !current)} />
        </View>

        <View style={styles.statusStrip}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statusLine}>
            {statusText} · {won ? '클리어' : '시간'} {formatElapsedTime(elapsedMs)} · 이동 {moves} · 코인 {collectedCoinCountInLevel}/{coinCountInLevel}
          </Text>
        </View>

        {shopOpen ? (
          <ShopPanel
            onEquipSkin={onEquipSkin}
            onEquipTrailEffect={onEquipTrailEffect}
            onPurchaseSkin={onPurchaseSkin}
            onPurchaseTrailEffect={onPurchaseTrailEffect}
            progress={progress}
            progressLoaded={progressLoaded}
            shopMessage={shopMessage}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  controlPanel: {
    alignSelf: 'center',
  },
  panelContent: {
    gap: 6,
    paddingRight: 2,
  },
  hudRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  appTitle: {
    color: '#F4EBD0',
    fontSize: 25,
    fontWeight: '900',
  },
  levelTitle: {
    marginTop: 1,
    color: '#65E7FF',
    fontSize: 14,
    fontWeight: '800',
  },
  stageButton: {
    width: 82,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#344461',
    backgroundColor: '#10172A',
  },
  stageButtonActive: {
    borderColor: '#65E7FF',
    backgroundColor: '#17324C',
  },
  stageButtonPressed: {
    backgroundColor: '#24365F',
  },
  stageButtonTitle: {
    color: '#7F8DAA',
    fontSize: 9,
    fontWeight: '800',
  },
  stageButtonText: {
    marginTop: 1,
    color: '#F4EBD0',
    fontSize: 12,
    fontWeight: '900',
  },
  coinPill: {
    minWidth: 82,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6D5A21',
    backgroundColor: '#241D0B',
  },
  coinLabel: {
    color: '#BDAA67',
    fontSize: 10,
    fontWeight: '800',
  },
  coinValue: {
    color: '#FFD447',
    fontSize: 16,
    fontWeight: '900',
  },
  iconCluster: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusStrip: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#344461',
    backgroundColor: '#11182D',
  },
  statusLine: {
    color: '#F4EBD0',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
});
