import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { playerImages, tileImages } from '../../../game/assets';
import type {
  GameState,
  PlayerSkinId,
  Position,
  PreparedLevel,
  TrailEffectId,
  TrailMap,
} from '../../../game/types';
import { Trail } from './Trail';

export function MazeBoard({
  animatedTokenPosition,
  boardHeight,
  boardWidth,
  cellHeight,
  cellWidth,
  gameState,
  hiddenCoinIds,
  isPaused,
  level,
  onCellPress,
  selectedSkinId,
  selectedTrailEffectId,
  tokenSize,
  trailMap,
}: {
  animatedTokenPosition: Animated.ValueXY;
  boardHeight: number;
  boardWidth: number;
  cellHeight: number;
  cellWidth: number;
  gameState: GameState;
  hiddenCoinIds: Set<string>;
  isPaused: boolean;
  level: PreparedLevel;
  onCellPress: (position: Position) => void;
  selectedSkinId: PlayerSkinId;
  selectedTrailEffectId: TrailEffectId | null;
  tokenSize: number;
  trailMap: TrailMap;
}) {
  return (
    <Pressable
      disabled={isPaused || gameState.isWon}
      onPress={(event) => {
        const col = clamp(Math.floor(event.nativeEvent.locationX / cellWidth), 0, level.width - 1);
        const row = clamp(Math.floor(event.nativeEvent.locationY / cellHeight), 0, level.height - 1);
        onCellPress({ row, col });
      }}
      style={[styles.boardFrame, { width: boardWidth, height: boardHeight }]}
    >
      {level.cells.map((row, rowIndex) =>
        row.map((cell) => {
          const key = `${cell.row}:${cell.col}`;
          const trails = trailMap.get(key);
          const coinVisible = cell.kind === 'coin' && cell.coinId && !hiddenCoinIds.has(cell.coinId);

          return (
            <View
              key={key}
              pointerEvents="none"
              style={[
                styles.cell,
                cell.kind === 'wall' ? styles.wallCell : styles.floorCell,
                {
                  width: cellWidth,
                  height: cellHeight,
                  left: cell.col * cellWidth,
                  top: rowIndex * cellHeight,
                },
              ]}
            >
              {selectedTrailEffectId && trails ? (
                <Trail
                  col={cell.col}
                  directions={trails}
                  effectId={selectedTrailEffectId}
                  row={cell.row}
                />
              ) : null}
              {cell.kind === 'exit' ? (
                <Image source={tileImages.exit} style={styles.tileOverlay} resizeMode="contain" />
              ) : null}
              {coinVisible ? (
                <Image source={tileImages.coin} style={styles.coinOverlay} resizeMode="contain" />
              ) : null}
            </View>
          );
        }),
      )}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.animatedToken,
          {
            width: tokenSize,
            height: tokenSize,
            transform: [
              { translateX: animatedTokenPosition.x },
              { translateY: animatedTokenPosition.y },
            ],
          },
        ]}
      >
        <Image source={playerImages[selectedSkinId]} style={styles.tokenImage} resizeMode="contain" />
      </Animated.View>

      {isPaused ? (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseOverlayTitle}>일시정지</Text>
          <Text style={styles.pauseOverlayText}>계속 버튼으로 이어서 플레이</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const styles = StyleSheet.create({
  boardFrame: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#5F6F99',
    backgroundColor: '#09101E',
  },
  cell: {
    position: 'absolute',
    overflow: 'hidden',
  },
  floorCell: {
    backgroundColor: '#0E1628',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(43, 57, 88, 0.28)',
  },
  wallCell: {
    backgroundColor: '#273653',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(112, 126, 166, 0.38)',
  },
  tileOverlay: {
    position: 'absolute',
    left: '4%',
    top: '4%',
    width: '92%',
    height: '92%',
  },
  coinOverlay: {
    position: 'absolute',
    left: '16%',
    top: '16%',
    width: '68%',
    height: '68%',
  },
  animatedToken: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  tokenImage: {
    width: '100%',
    height: '100%',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 11, 24, 0.78)',
  },
  pauseOverlayTitle: {
    color: '#F4EBD0',
    fontSize: 30,
    fontWeight: '900',
  },
  pauseOverlayText: {
    marginTop: 8,
    color: '#65E7FF',
    fontSize: 14,
    fontWeight: '700',
  },
});
