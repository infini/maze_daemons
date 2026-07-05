import type { GameState } from '../../../game/types';

export function getStatusText({
  coinCount,
  collectedCoinCount,
  gameState,
  hasStarted,
  isPaused,
  progressLoaded,
}: {
  coinCount: number;
  collectedCoinCount: number;
  gameState: GameState;
  hasStarted: boolean;
  isPaused: boolean;
  progressLoaded: boolean;
}) {
  if (!progressLoaded) {
    return '저장 데이터를 불러오는 중입니다.';
  }
  if (gameState.isWon) {
    return `클리어. 코인 ${collectedCoinCount}/${coinCount}개를 확인했습니다.`;
  }
  if (!hasStarted) {
    return '시작 버튼 또는 미로 터치로 타이머와 이동이 시작됩니다.';
  }
  if (isPaused) {
    return '일시정지 중입니다. 계속 버튼으로 이어서 플레이하세요.';
  }
  return `출구로 이동하세요. 코인 ${collectedCoinCount}/${coinCount}`;
}
