import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { skinItems, trailEffectItems } from '../../../data/shop';
import type { PlayerSkinId, ProgressState, ShopSkinId, TrailEffectId } from '../../../game/types';

export function useShopActions({
  setProgress,
  setShopMessage,
}: {
  setProgress: Dispatch<SetStateAction<ProgressState>>;
  setShopMessage: Dispatch<SetStateAction<string>>;
}) {
  const equipTrailEffect = useCallback((effectId: TrailEffectId | null) => {
    if (effectId === null) {
      setProgress((current) => ({ ...current, selectedTrailEffectId: null }));
      setShopMessage('기본 이동 이펙트 없음으로 변경했습니다.');
      return;
    }

    setProgress((current) => {
      if (!current.purchasedTrailEffectIds.includes(effectId)) {
        return current;
      }
      return { ...current, selectedTrailEffectId: effectId };
    });
    setShopMessage('이동 이펙트를 장착했습니다.');
  }, [setProgress, setShopMessage]);

  const purchaseTrailEffect = useCallback((effectId: TrailEffectId) => {
    setProgress((current) => {
      const itemIndex = trailEffectItems.findIndex((item) => item.id === effectId);
      const item = trailEffectItems[itemIndex];
      if (!item || current.purchasedTrailEffectIds.includes(effectId)) {
        return current;
      }
      if (itemIndex > 0 && !current.purchasedTrailEffectIds.includes(trailEffectItems[itemIndex - 1].id)) {
        setShopMessage('왼쪽 상품부터 순서대로 구매해야 합니다.');
        return current;
      }
      if (current.coins < item.price) {
        setShopMessage('코인이 부족합니다.');
        return current;
      }

      setShopMessage(`${item.label} 이동 이펙트를 구매했습니다.`);
      return {
        ...current,
        coins: current.coins - item.price,
        purchasedTrailEffectIds: [...current.purchasedTrailEffectIds, effectId],
        selectedTrailEffectId: effectId,
      };
    });
  }, [setProgress, setShopMessage]);

  const equipSkin = useCallback((skinId: PlayerSkinId) => {
    if (skinId === 'zombie') {
      setProgress((current) => ({ ...current, selectedSkinId: skinId }));
      setShopMessage('기본 좀비 스킨을 장착했습니다.');
      return;
    }

    setProgress((current) => {
      if (!current.purchasedSkinIds.includes(skinId)) {
        return current;
      }
      return { ...current, selectedSkinId: skinId };
    });
    setShopMessage('플레이어 아이콘을 장착했습니다.');
  }, [setProgress, setShopMessage]);

  const purchaseSkin = useCallback((skinId: ShopSkinId) => {
    setProgress((current) => {
      const itemIndex = skinItems.findIndex((item) => item.id === skinId);
      const item = skinItems[itemIndex];
      if (!item || current.purchasedSkinIds.includes(skinId)) {
        return current;
      }
      if (itemIndex > 0 && !current.purchasedSkinIds.includes(skinItems[itemIndex - 1].id)) {
        setShopMessage('왼쪽 스킨부터 순서대로 구매해야 합니다.');
        return current;
      }
      if (current.coins < item.price) {
        setShopMessage('코인이 부족합니다.');
        return current;
      }

      setShopMessage(`${item.label} 아이콘을 구매했습니다.`);
      return {
        ...current,
        coins: current.coins - item.price,
        purchasedSkinIds: [...current.purchasedSkinIds, skinId],
        selectedSkinId: skinId,
      };
    });
  }, [setProgress, setShopMessage]);

  return {
    equipSkin,
    equipTrailEffect,
    purchaseSkin,
    purchaseTrailEffect,
  };
}
