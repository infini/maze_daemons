import { useCallback, useEffect } from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Position } from '../../game/types';
import { GameHud } from './components/GameHud';
import { MazeBoard } from './components/MazeBoard';
import { useAnimatedToken } from './hooks/useAnimatedToken';
import { useMazeDaemonsGame } from './hooks/useMazeDaemonsGame';
import { useMazeSounds } from './hooks/useMazeSounds';
import { getBoardMetrics } from './utils/layout';

export function MazeGameScreen() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const useSideLayout = isLandscape || width >= 1000;
  const game = useMazeDaemonsGame();
  const { playBlueCoinPickup, playClear, playCoinPickup, playTap, previewSound } = useMazeSounds(
    game.progress.audioSettings,
  );
  const { boardHeight, boardWidth, cellHeight, cellWidth, panelWidth } = getBoardMetrics({
    height,
    isLandscape: useSideLayout,
    levelHeight: game.level.height,
    levelWidth: game.level.width,
    width,
  });
  const tokenSize = Math.min(cellWidth, cellHeight) * 0.84;
  const tokenInsetX = (cellWidth - tokenSize) / 2;
  const tokenInsetY = (cellHeight - tokenSize) / 2;
  const animatedTokenPosition = useAnimatedToken({
    cellHeight,
    cellWidth,
    moveKey: game.gameState.moveKey,
    movePath: game.gameState.lastMovePath,
    position: game.gameState.player,
    resetKey: game.animationResetKey,
    tokenInsetX,
    tokenInsetY,
  });
  const handleCellPress = useCallback(
    (position: Position) => {
      playTap();
      game.onCellPress(position);
    },
    [game.onCellPress, playTap],
  );

  useEffect(() => {
    if (game.coinPickupSoundKey > 0) {
      playCoinPickup();
    }
  }, [game.coinPickupSoundKey, playCoinPickup]);

  useEffect(() => {
    if (game.blueCoinPickupSoundKey > 0) {
      playBlueCoinPickup();
    }
  }, [game.blueCoinPickupSoundKey, playBlueCoinPickup]);

  useEffect(() => {
    if (game.clearSoundKey > 0) {
      playClear();
    }
  }, [game.clearSoundKey, playClear]);

  return (
    <View
      style={[
        styles.screen,
        game.progress.mazeThemeId === 'volcano' ? styles.volcanoScreen : null,
        game.progress.mazeThemeId === 'forest' ? styles.forestScreen : null,
      ]}
    >
      <ExpoStatusBar hidden style="light" />
      {useSideLayout ? (
        renderContent()
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>{renderContent()}</ScrollView>
      )}
    </View>
  );

  function renderContent() {
    return (
      <View style={[styles.stage, useSideLayout ? styles.stageSide : styles.stageStacked]}>
        <MazeBoard
          animatedTokenPosition={animatedTokenPosition}
          boardHeight={boardHeight}
          boardWidth={boardWidth}
          cellHeight={cellHeight}
          cellWidth={cellWidth}
          clearEffectVisible={game.clearEffectVisible}
          coinPickupEffects={game.coinPickupEffects}
          gameState={game.gameState}
          hiddenCoinIds={game.hiddenCoinIds}
          isPaused={game.isPaused}
          level={game.level}
          mazeThemeId={game.progress.mazeThemeId}
          onCellPress={handleCellPress}
          selectedSkinId={game.progress.selectedSkinId}
          selectedTrailEffectId={game.progress.selectedTrailEffectId}
          tokenSize={tokenSize}
          trailMap={game.trailMap}
        />
        <GameHud
          audioSettings={game.progress.audioSettings}
          boardHeight={useSideLayout ? boardHeight : height}
          canAdvanceAfterWin={game.canAdvanceAfterWin}
          coinCountInLevel={game.coinCountInLevel}
          collectedCoinCountInLevel={game.collectedCoinCountInLevel}
          difficulties={game.difficulties}
          difficultyIndex={game.difficultyIndex}
          elapsedMs={game.elapsedMs}
          hasStarted={game.hasStarted}
          isPaused={game.isPaused}
          levelLabel={game.level.difficultyLabel}
          moves={game.gameState.moves}
          onEquipSkin={game.onEquipSkin}
          onEquipTrailEffect={game.onEquipTrailEffect}
          onLoadStage={game.loadStage}
          onPauseToggle={game.onPauseToggle}
          onPurchaseSkin={game.onPurchaseSkin}
          onPurchaseTrailEffect={game.onPurchaseTrailEffect}
          onPreviewAudio={previewSound}
          onReset={game.onReset}
          onSelectDifficulty={game.onSelectDifficulty}
          onSetAudioVolume={game.onSetAudioVolume}
          onSetMazeTheme={game.onSetMazeTheme}
          onStartPress={game.onStartPress}
          panelWidth={useSideLayout ? panelWidth : boardWidth}
          progress={game.progress}
          progressLoaded={game.progressLoaded}
          shopMessage={game.shopMessage}
          stageIndex={game.stageIndex}
          stagesInDifficulty={game.stagesInDifficulty}
          statusText={game.statusText}
          selectableStageIndexes={game.selectableStageIndexes}
          unlockedDifficultyIds={game.unlockedDifficultyIds}
          won={game.gameState.isWon}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070B18',
  },
  volcanoScreen: {
    backgroundColor: '#120805',
  },
  forestScreen: {
    backgroundColor: '#061009',
  },
  scrollContent: {
    flexGrow: 1,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    gap: 6,
  },
  stageSide: {
    flexDirection: 'row',
  },
  stageStacked: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingTop: 2,
    paddingBottom: 48,
  },
});
