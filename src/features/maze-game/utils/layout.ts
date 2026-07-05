export function getBoardMetrics({
  height,
  isLandscape,
  levelHeight,
  levelWidth,
  width,
}: {
  height: number;
  isLandscape: boolean;
  levelHeight: number;
  levelWidth: number;
  width: number;
}) {
  const padding = isLandscape ? 4 : 4;
  const panelWidth = isLandscape ? Math.min(340, Math.max(292, width * 0.22)) : width - padding * 2;
  const maxBoardWidth = isLandscape ? width - panelWidth - padding * 3 : width - padding * 2;
  const maxBoardHeight = isLandscape ? height - padding * 2 : height * 0.72;
  const cellSize = Math.max(5, Math.min(maxBoardWidth / levelWidth, maxBoardHeight / levelHeight));

  return {
    boardHeight: cellSize * levelHeight,
    boardWidth: cellSize * levelWidth,
    cellSize,
    panelWidth,
  };
}
