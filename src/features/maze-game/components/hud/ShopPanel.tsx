import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { skinItems, trailEffectItems } from '../../../../data/shop';
import { playerImages } from '../../../../game/assets';
import type {
  PlayerSkinId,
  ProgressState,
  ShopSkinId,
  SkinItem,
  TrailEffectId,
  TrailEffectItem,
} from '../../../../game/types';

export function ShopPanel({
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

const styles = StyleSheet.create({
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
