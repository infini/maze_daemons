import { useCallback, useEffect } from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Position } from '../../game/types';
import { GameHud } from './components/GameHud';
import { JumpScareOverlay } from './components/JumpScareOverlay';
import { MazeBoard } from './components/MazeBoard';
import { useAnimatedToken } from './hooks/useAnimatedToken';
import { useJumpScare } from './hooks/useJumpScare';
import { useMazeDaemonsGame } from './hooks/useMazeDaemonsGame';
import { useMazeSounds } from './hooks/useMazeSounds';
import { getBoardMetrics } from './utils/layout';

export function MazeGameScreen() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const useSideLayout = isLandscape || width >= 1000;
  const game = useMazeDaemonsGame();
  const { playClear, playCoinPickup, playJumpScare, playTap, previewSound } = useMazeSounds(game.progress.audioSettings);
  const { jumpScareKey, tryTrigger: tryJumpScare } = useJumpScare();
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
      if (tryJumpScare()) {
        playJumpScare();
      }
    },
    [game.onCellPress, playJumpScare, playTap, tryJumpScare],
  );

  useEffect(() => {
    if (game.coinPickupSoundKey > 0) {
      playCoinPickup();
    }
  }, [game.coinPickupSoundKey, playCoinPickup]);

  useEffect(() => {
    if (game.clearSoundKey > 0) {
      playClear();
    }
  }, [game.clearSoundKey, playClear]);

  return (
    <View style={styles.screen}>
      <ExpoStatusBar hidden style="light" />
      {useSideLayout ? (
        renderContent()
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>{renderContent()}</ScrollView>
      )}
      <JumpScareOverlay triggerKey={jumpScareKey} />
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
