import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { skinItems, trailEffectItems } from '../../../data/shop';
import { playerImages } from '../../../game/assets';
import type {
  DifficultyData,
  Direction,
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
  canLoadNextStage,
  canLoadPreviousStage,
  coinCountInLevel,
  collectedCoinCountInLevel,
  difficulties,
  difficultyIndex,
  elapsedMs,
  hasStarted,
  isPaused,
  levelLabel,
  moves,
  onDirectionPress,
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
  won,
}: {
  boardHeight: number;
  canLoadNextStage: boolean;
  canLoadPreviousStage: boolean;
  coinCountInLevel: number;
  collectedCoinCountInLevel: number;
  difficulties: DifficultyData[];
  difficultyIndex: number;
  elapsedMs: number;
  hasStarted: boolean;
  isPaused: boolean;
  levelLabel: string;
  moves: number;
  onDirectionPress: (direction: Direction) => void;
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
  won: boolean;
}) {
  const [shopOpen, setShopOpen] = useState(false);

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
              {levelLabel} · {stageIndex + 1}/{stagesInDifficulty}
            </Text>
          </View>
          <View style={styles.coinPill}>
            <Text style={styles.coinLabel}>COIN</Text>
            <Text style={styles.coinValue}>{progress.coins}</Text>
          </View>
        </View>

        <DifficultySelector
          activeIndex={difficultyIndex}
          difficulties={difficulties}
          onSelect={onSelectDifficulty}
        />

        <View style={styles.iconCluster}>
          <StartButton
            disabled={won || (hasStarted && !isPaused)}
            label={!hasStarted ? '시작' : isPaused ? '계속' : '진행 중'}
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

        <View style={styles.statusBand}>
          <Text numberOfLines={2} style={styles.statusText}>
            {statusText}
          </Text>
          <View style={styles.timerRow}>
            <Text style={styles.timerLabel}>{won ? '클리어 시간' : '진행 시간'}</Text>
            <Text style={styles.timerText}>{formatElapsedTime(elapsedMs)}</Text>
          </View>
          <Text style={styles.stageText}>
            이동 {moves} · 코인 {collectedCoinCountInLevel}/{coinCountInLevel}
          </Text>
        </View>

        <DPad disabled={!hasStarted || isPaused || won} onDirectionPress={onDirectionPress} />

        <View style={styles.stageNavRow}>
          <StageNavButton
            disabled={!canLoadPreviousStage}
            label="‹"
            onPress={() => onLoadStage(stageIndex - 1)}
          />
          <View style={styles.stageCounter}>
            <Text style={styles.stageCounterTitle}>스테이지</Text>
            <Text style={styles.stageCounterText}>
              {stageIndex + 1} / {stagesInDifficulty}
            </Text>
          </View>
          <StageNavButton
            disabled={!canLoadNextStage}
            label="›"
            onPress={() => onLoadStage(stageIndex + 1)}
          />
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
}: {
  activeIndex: number;
  difficulties: DifficultyData[];
  onSelect: (index: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.difficultyRow}
    >
      {difficulties.map((difficulty, index) => {
        const selected = index === activeIndex;
        return (
          <Pressable
            key={difficulty.id}
            onPress={() => onSelect(index)}
            style={({ pressed }) => [
              styles.difficultyButton,
              selected ? styles.difficultyButtonSelected : null,
              pressed ? styles.difficultyButtonPressed : null,
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.difficultyButtonText,
                selected ? styles.difficultyButtonTextSelected : null,
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

function DPad({
  disabled,
  onDirectionPress,
}: {
  disabled: boolean;
  onDirectionPress: (direction: Direction) => void;
}) {
  return (
    <View style={styles.dpad}>
      <View style={styles.dpadRow}>
        <DPadButton disabled={disabled} label="↑" onPress={() => onDirectionPress('up')} />
      </View>
      <View style={styles.dpadRow}>
        <DPadButton disabled={disabled} label="←" onPress={() => onDirectionPress('left')} />
        <View style={styles.dpadSpacer} />
        <DPadButton disabled={disabled} label="→" onPress={() => onDirectionPress('right')} />
      </View>
      <View style={styles.dpadRow}>
        <DPadButton disabled={disabled} label="↓" onPress={() => onDirectionPress('down')} />
      </View>
    </View>
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

function StageNavButton({
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
        styles.stageNavButton,
        disabled ? styles.stageNavButtonDisabled : null,
        pressed ? styles.stageNavButtonPressed : null,
      ]}
    >
      <Text style={[styles.stageNavButtonText, disabled ? styles.stageNavButtonTextDisabled : null]}>
        {label}
      </Text>
    </Pressable>
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

function DPadButton({
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
        styles.dpadButton,
        disabled ? styles.dpadButtonDisabled : null,
        pressed ? styles.dpadButtonPressed : null,
      ]}
    >
      <Text style={[styles.dpadButtonText, disabled ? styles.dpadButtonTextDisabled : null]}>
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
    gap: 9,
    paddingRight: 2,
  },
  hudRow: {
    minHeight: 48,
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
    fontSize: 29,
    fontWeight: '900',
  },
  levelTitle: {
    marginTop: 1,
    color: '#65E7FF',
    fontSize: 14,
    fontWeight: '800',
  },
  coinPill: {
    minWidth: 82,
    height: 44,
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
    fontSize: 18,
    fontWeight: '900',
  },
  difficultyRow: {
    minHeight: 38,
    flexDirection: 'row',
    gap: 6,
    paddingRight: 6,
  },
  difficultyButton: {
    width: 96,
    minHeight: 36,
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
  iconCluster: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  startButton: {
    flex: 1,
    minWidth: 96,
    height: 42,
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
    width: 42,
    height: 42,
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
  statusBand: {
    minHeight: 78,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#344461',
    backgroundColor: '#11182D',
  },
  statusText: {
    color: '#F4EBD0',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  timerRow: {
    minHeight: 28,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timerLabel: {
    color: '#B8C3DF',
    fontSize: 13,
    fontWeight: '700',
  },
  timerText: {
    color: '#FFD447',
    fontSize: 18,
    fontWeight: '900',
  },
  stageText: {
    marginTop: 2,
    color: '#65E7FF',
    fontSize: 12,
    fontWeight: '800',
  },
  dpad: {
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  dpadRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dpadSpacer: {
    width: 38,
    height: 38,
  },
  dpadButton: {
    width: 58,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5A6D9B',
    backgroundColor: '#19243F',
  },
  dpadButtonPressed: {
    backgroundColor: '#24365F',
  },
  dpadButtonDisabled: {
    borderColor: '#26314F',
    backgroundColor: '#0D1326',
  },
  dpadButtonText: {
    color: '#F4EBD0',
    fontSize: 21,
    lineHeight: 23,
    fontWeight: '900',
  },
  dpadButtonTextDisabled: {
    color: '#4F5B78',
  },
  stageNavRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  stageNavButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5A6D9B',
    backgroundColor: '#19243F',
  },
  stageNavButtonPressed: {
    backgroundColor: '#24365F',
  },
  stageNavButtonDisabled: {
    borderColor: '#26314F',
    backgroundColor: '#0D1326',
  },
  stageNavButtonText: {
    color: '#F4EBD0',
    fontSize: 22,
    fontWeight: '900',
  },
  stageNavButtonTextDisabled: {
    color: '#4F5B78',
  },
  stageCounter: {
    width: 104,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#344461',
    backgroundColor: '#10172A',
  },
  stageCounterTitle: {
    color: '#7F8DAA',
    fontSize: 10,
    fontWeight: '800',
  },
  stageCounterText: {
    marginTop: 1,
    color: '#F4EBD0',
    fontSize: 13,
    fontWeight: '900',
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
