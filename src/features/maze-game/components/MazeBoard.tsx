import { useMemo } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { mazeThemeVisuals } from '../../../data/themes';
import { playerImages, tileImages } from '../../../game/assets';
import type {
  GameState,
  MazeThemeId,
  PlayerSkinId,
  Position,
  PreparedLevel,
  TrailEffectId,
  TrailMap,
} from '../../../game/types';
import { ClearEffect } from './ClearEffect';
import { CoinPickupEffect } from './CoinPickupEffect';
import { MazeAtmosphere, MazeCellDecoration } from './MazeAtmosphere';
import { Trail } from './Trail';
import type { CoinPickupEffect as CoinPickupEffectData } from '../types';
import { buildMazeDecorations } from '../utils/mazeDecorations';

export function MazeBoard({
  animatedTokenPosition,
  boardHeight,
  boardWidth,
  cellHeight,
  cellWidth,
  clearEffectVisible,
  coinPickupEffects,
  gameState,
  hiddenCoinIds,
  isPaused,
  level,
  mazeThemeId,
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
  clearEffectVisible: boolean;
  coinPickupEffects: CoinPickupEffectData[];
  gameState: GameState;
  hiddenCoinIds: Set<string>;
  isPaused: boolean;
  level: PreparedLevel;
  mazeThemeId: MazeThemeId;
  onCellPress: (position: Position) => void;
  selectedSkinId: PlayerSkinId;
  selectedTrailEffectId: TrailEffectId | null;
  tokenSize: number;
  trailMap: TrailMap;
}) {
  const decorationByCell = useMemo(
    () => buildMazeDecorations(level, mazeThemeId),
    [level, mazeThemeId],
  );
  const wallOutlineByCell = useMemo(
    () => buildWallOutlineStyles(level, mazeThemeId),
    [level, mazeThemeId],
  );
  const isVolcano = mazeThemeId === 'volcano';
  const isForest = mazeThemeId === 'forest';

  return (
    <Pressable
      disabled={isPaused || gameState.isWon}
      onPress={(event) => {
        const col = clamp(Math.floor(event.nativeEvent.locationX / cellWidth), 0, level.width - 1);
        const row = clamp(Math.floor(event.nativeEvent.locationY / cellHeight), 0, level.height - 1);
        onCellPress({ row, col });
      }}
      style={[
        styles.boardFrame,
        isVolcano
          ? styles.volcanoBoardFrame
          : isForest
            ? styles.forestBoardFrame
            : styles.graveyardBoardFrame,
        { width: boardWidth, height: boardHeight },
      ]}
    >
      {level.cells.map((row, rowIndex) =>
        row.map((cell) => {
          const key = `${cell.row}:${cell.col}`;
          const decoration = decorationByCell.get(key);
          const trails = trailMap.get(key);
          const coinVisible = cell.kind === 'coin' && cell.coinId && !hiddenCoinIds.has(cell.coinId);

          return (
            <View
              key={key}
              pointerEvents="none"
              style={[
                styles.cell,
                isVolcano
                  ? cell.kind === 'wall'
                    ? styles.volcanoWallCell
                    : styles.volcanoFloorCell
                  : isForest
                    ? cell.kind === 'wall'
                      ? styles.forestWallCell
                      : styles.forestFloorCell
                    : cell.kind === 'wall'
                      ? styles.wallCell
                      : styles.floorCell,
                wallOutlineByCell.get(key),
                {
                  width: cellWidth,
                  height: cellHeight,
                  left: cell.col * cellWidth,
                  top: rowIndex * cellHeight,
                },
              ]}
            >
              {decoration ? (
                <MazeCellDecoration decoration={decoration} />
              ) : null}
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
                <Image
                  source={cell.coinType === 'blue' ? tileImages.blueCoin : tileImages.coin}
                  style={styles.coinOverlay}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          );
        }),
      )}

      <MazeAtmosphere mazeThemeId={mazeThemeId} />

      <Animated.View
        key={`${level.id}:${gameState.moveKey}`}
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

      {coinPickupEffects.map((effect) => (
        <CoinPickupEffect
          key={effect.id}
          boardHeight={boardHeight}
          boardWidth={boardWidth}
          cellHeight={cellHeight}
          cellWidth={cellWidth}
          effect={effect}
        />
      ))}

      {clearEffectVisible ? <ClearEffect /> : null}

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

function buildWallOutlineStyles(level: PreparedLevel, mazeThemeId: MazeThemeId) {
  const { wallOutlineColor, wallOutlineWidth } = mazeThemeVisuals[mazeThemeId];
  const outlines = new Map<string, ViewStyle>();
  if (!wallOutlineColor || wallOutlineWidth <= 0) {
    return outlines;
  }

  level.cells.forEach((row) => {
    row.forEach((cell) => {
      if (cell.kind !== 'wall') {
        return;
      }

      outlines.set(`${cell.row}:${cell.col}`, {
        borderTopWidth: isWall(level, cell.row - 1, cell.col) ? 0 : wallOutlineWidth,
        borderRightWidth: isWall(level, cell.row, cell.col + 1) ? 0 : wallOutlineWidth,
        borderBottomWidth: isWall(level, cell.row + 1, cell.col) ? 0 : wallOutlineWidth,
        borderLeftWidth: isWall(level, cell.row, cell.col - 1) ? 0 : wallOutlineWidth,
        borderColor: wallOutlineColor,
      });
    });
  });

  return outlines;
}

function isWall(level: PreparedLevel, row: number, col: number) {
  return level.cells[row]?.[col]?.kind === 'wall';
}

const styles = StyleSheet.create({
  boardFrame: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 3,
  },
  graveyardBoardFrame: {
    borderColor: '#4B5850',
    backgroundColor: '#030607',
  },
  volcanoBoardFrame: {
    borderColor: mazeThemeVisuals.volcano.wallOutlineColor,
    backgroundColor: '#2A0903',
  },
  forestBoardFrame: {
    borderColor: mazeThemeVisuals.forest.wallOutlineColor,
    backgroundColor: '#041108',
  },
  cell: {
    position: 'absolute',
    overflow: 'hidden',
  },
  floorCell: {
    backgroundColor: '#07100F',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(74, 93, 80, 0.28)',
  },
  wallCell: {
    backgroundColor: '#232A31',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(118, 126, 116, 0.34)',
  },
  volcanoFloorCell: {
    backgroundColor: 'rgba(21, 20, 21, 0.99)',
  },
  volcanoWallCell: {
    backgroundColor: mazeThemeVisuals.volcano.wallColor,
  },
  forestFloorCell: {
    backgroundColor: 'rgba(8, 18, 12, 0.99)',
  },
  forestWallCell: {
    backgroundColor: mazeThemeVisuals.forest.wallColor,
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
