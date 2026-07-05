import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { skinItems, trailEffectItems } from '../../../data/shop';
import { playerImages } from '../../../game/assets';
import type {
  DifficultyData,
  PlayerSkinId,
  ProgressState,
  ShopSkinId,
  SkinItem,
  TrailEffectId,
  TrailEffectItem,
} from '../../../game/types';
import { formatElapsedTime } from '../utils/timer';

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

function DifficultySelector({
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

function StagePicker({
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

function ShopPanel({
  onEquipSkin,
  onEquipTrailEffect,
  onPurchaseSkin,
  onPurchaseTrailEffect,
  progress,
  progressLoaded,
  shopMessage,
}: {
  onEquipSkin: (skinId: PlayerSkinId) => void;
  onEquipTrailEffect: (effectId: TrailEffectId | null) => void;
  onPurchaseSkin: (skinId: ShopSkinId) => void;
  onPurchaseTrailEffect: (effectId: TrailEffectId) => void;
  progress: ProgressState;
  progressLoaded: boolean;
  shopMessage: string;
}) {
  return (
    <View style={styles.shopPanel}>
      <View style={styles.shopHeaderRow}>
        <Text style={styles.shopTitle}>상점</Text>
        <Text style={styles.shopCoinText}>보유 {progress.coins}</Text>
      </View>

      <Text style={styles.shopSectionTitle}>이동 이펙트</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shopRow}
      >
        <Pressable
          disabled={!progressLoaded}
          onPress={() => onEquipTrailEffect(null)}
          style={[
            styles.shopItem,
            progress.selectedTrailEffectId === null ? styles.shopItemSelected : null,
          ]}
        >
          <View style={styles.emptySwatch} />
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.shopItemLabel}>
            기본 없음
          </Text>
          <Text style={styles.shopItemMeta}>
            {progress.selectedTrailEffectId === null ? '장착중' : '장착'}
          </Text>
        </Pressable>
        {trailEffectItems.map((item, index) => (
          <TrailShopItem
            key={item.id}
            index={index}
            item={item}
            onEquip={onEquipTrailEffect}
            onPurchase={onPurchaseTrailEffect}
            progress={progress}
            progressLoaded={progressLoaded}
          />
        ))}
      </ScrollView>

      <Text style={styles.shopSectionTitle}>플레이어 아이콘</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shopRow}
      >
        <Pressable
          disabled={!progressLoaded}
          onPress={() => onEquipSkin('zombie')}
          style={[
            styles.shopItem,
            progress.selectedSkinId === 'zombie' ? styles.shopItemSelected : null,
          ]}
        >
          <Image source={playerImages.zombie} style={styles.shopSkinImage} resizeMode="contain" />
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.shopItemLabel}>
            기본 좀비
          </Text>
          <Text style={styles.shopItemMeta}>
            {progress.selectedSkinId === 'zombie' ? '장착중' : '장착'}
          </Text>
        </Pressable>
        {skinItems.map((item, index) => (
          <SkinShopItem
            key={item.id}
            index={index}
            item={item}
            onEquip={onEquipSkin}
            onPurchase={onPurchaseSkin}
            progress={progress}
            progressLoaded={progressLoaded}
          />
        ))}
      </ScrollView>

      <Text numberOfLines={2} style={styles.shopMessage}>
        {shopMessage || '코인은 스테이지 안에서 한 번씩만 획득됩니다.'}
      </Text>
    </View>
  );
}

function TrailShopItem({
  index,
  item,
  onEquip,
  onPurchase,
  progress,
  progressLoaded,
}: {
  index: number;
  item: TrailEffectItem;
  onEquip: (effectId: TrailEffectId) => void;
  onPurchase: (effectId: TrailEffectId) => void;
  progress: ProgressState;
  progressLoaded: boolean;
}) {
  const owned = progress.purchasedTrailEffectIds.includes(item.id);
  const selected = progress.selectedTrailEffectId === item.id;
  const locked = index > 0 && !progress.purchasedTrailEffectIds.includes(trailEffectItems[index - 1].id);
  const expensive = !owned && progress.coins < item.price;

  return (
    <Pressable
      disabled={!progressLoaded}
      onPress={() => (owned ? onEquip(item.id) : onPurchase(item.id))}
      style={[
        styles.shopItem,
        selected ? styles.shopItemSelected : null,
        locked || expensive ? styles.shopItemDimmed : null,
      ]}
    >
      {item.id === 'rainbow' ? <RainbowSwatch /> : <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />}
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.shopItemLabel}>
        {item.label}
      </Text>
      <Text style={styles.shopItemMeta}>
        {selected ? '장착중' : owned ? '장착' : locked ? '잠김' : `${item.price}`}
      </Text>
    </Pressable>
  );
}

function SkinShopItem({
  index,
  item,
  onEquip,
  onPurchase,
  progress,
  progressLoaded,
}: {
  index: number;
  item: SkinItem;
  onEquip: (skinId: ShopSkinId) => void;
  onPurchase: (skinId: ShopSkinId) => void;
  progress: ProgressState;
  progressLoaded: boolean;
}) {
  const owned = progress.purchasedSkinIds.includes(item.id);
  const selected = progress.selectedSkinId === item.id;
  const locked = index > 0 && !progress.purchasedSkinIds.includes(skinItems[index - 1].id);
  const expensive = !owned && progress.coins < item.price;

  return (
    <Pressable
      disabled={!progressLoaded}
      onPress={() => (owned ? onEquip(item.id) : onPurchase(item.id))}
      style={[
        styles.shopItem,
        selected ? styles.shopItemSelected : null,
        locked || expensive ? styles.shopItemDimmed : null,
      ]}
    >
      <Image source={playerImages[item.id]} style={styles.shopSkinImage} resizeMode="contain" />
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.shopItemLabel}>
        {item.label}
      </Text>
      <Text style={styles.shopItemMeta}>
        {selected ? '장착중' : owned ? '장착' : locked ? '잠김' : `${item.price}`}
      </Text>
    </Pressable>
  );
}

function RainbowSwatch() {
  return (
    <View style={styles.rainbowSwatch}>
      {['#FF3232', '#FF8A1D', '#FFD83D', '#32D35C', '#298BFF', '#955CFF'].map((color) => (
        <View key={color} style={[styles.rainbowStripe, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

function StartButton({
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

function IconButton({
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
  iconCluster: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
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
  shopPanel: {
    gap: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#344461',
    backgroundColor: '#0F1729',
  },
  shopHeaderRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  shopTitle: {
    color: '#F4EBD0',
    fontSize: 16,
    fontWeight: '900',
  },
  shopCoinText: {
    color: '#FFD447',
    fontSize: 13,
    fontWeight: '900',
  },
  shopSectionTitle: {
    color: '#B8C3DF',
    fontSize: 12,
    fontWeight: '900',
  },
  shopRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  shopItem: {
    width: 92,
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#344461',
    backgroundColor: '#10172A',
    padding: 7,
  },
  shopItemSelected: {
    borderColor: '#FFD447',
    backgroundColor: '#2B230D',
  },
  shopItemDimmed: {
    opacity: 0.58,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: '#6B789C',
  },
  emptySwatch: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: '#5A6D9B',
    backgroundColor: '#0B1020',
  },
  rainbowSwatch: {
    width: 34,
    height: 34,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#6B789C',
  },
  rainbowStripe: {
    flex: 1,
  },
  shopSkinImage: {
    width: 38,
    height: 38,
  },
  shopItemLabel: {
    width: '100%',
    color: '#F4EBD0',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  shopItemMeta: {
    color: '#65E7FF',
    fontSize: 11,
    fontWeight: '900',
  },
  shopMessage: {
    minHeight: 34,
    color: '#D1DAEF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
