import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outputPath = join(rootDir, 'src/data/levels/stage-catalog.json');
const gameSettingsPath = join(rootDir, 'src/data/game-settings.json');
const gameSettings = JSON.parse(readFileSync(gameSettingsPath, 'utf8'));
const blueCoinsPerStage = gameSettings.coins?.bluePerStage;

if (!Number.isInteger(blueCoinsPerStage) || blueCoinsPerStage < 1) {
  throw new Error('coins.bluePerStage must be a positive integer.');
}

const legend = {
  '#': 'wall',
  '.': 'floor',
  A: 'start',
  B: 'blueCoin',
  C: 'coin',
  D: 'exit',
};

const difficulties = [
  {
    id: 'easy',
    label: 'easy',
    order: 1,
    sizes: [
      [25, 25],
      [27, 25],
      [29, 25],
      [31, 25],
      [33, 25],
    ],
    braidRate: 0.06,
    coinBase: 4,
    seedBase: 101000,
  },
  {
    id: 'normal',
    label: 'normal',
    order: 2,
    sizes: [
      [31, 25],
      [33, 27],
      [35, 27],
      [37, 27],
      [39, 29],
    ],
    braidRate: 0.045,
    coinBase: 5,
    seedBase: 202000,
  },
  {
    id: 'hard',
    label: 'hard',
    order: 3,
    sizes: [
      [35, 29],
      [37, 29],
      [39, 31],
      [41, 31],
      [43, 33],
    ],
    braidRate: 0.035,
    coinBase: 6,
    seedBase: 303000,
  },
  {
    id: 'harder',
    label: 'harder',
    order: 4,
    sizes: [
      [39, 31],
      [41, 33],
      [43, 33],
      [45, 35],
      [47, 35],
    ],
    braidRate: 0.028,
    coinBase: 7,
    seedBase: 404000,
  },
  {
    id: 'insane',
    label: 'insane',
    order: 5,
    sizes: [
      [43, 35],
      [45, 35],
      [47, 37],
      [49, 37],
      [51, 39],
    ],
    braidRate: 0.022,
    coinBase: 8,
    seedBase: 505000,
  },
  {
    id: 'easy-daemon',
    label: 'easy daemon',
    order: 6,
    sizes: [
      [47, 37],
      [49, 39],
      [51, 39],
      [53, 39],
      [55, 41],
    ],
    braidRate: 0.018,
    coinBase: 9,
    seedBase: 606000,
  },
  {
    id: 'medium-daemon',
    label: 'medium daemon',
    order: 7,
    sizes: [
      [51, 39],
      [53, 41],
      [55, 41],
      [57, 43],
      [59, 43],
    ],
    braidRate: 0.014,
    coinBase: 10,
    seedBase: 707000,
  },
  {
    id: 'hard-daemon',
    label: 'hard daemon',
    order: 8,
    sizes: [
      [55, 41],
      [57, 43],
      [59, 43],
      [61, 45],
      [63, 45],
    ],
    braidRate: 0.011,
    coinBase: 11,
    seedBase: 808000,
  },
  {
    id: 'insane-daemon',
    label: 'insane daemon',
    order: 9,
    sizes: [
      [59, 43],
      [61, 45],
      [63, 45],
      [65, 47],
      [67, 47],
    ],
    braidRate: 0.008,
    coinBase: 12,
    seedBase: 909000,
  },
  {
    id: 'extreme-daemon',
    label: 'extreme daemon',
    order: 10,
    sizes: [
      [63, 45],
      [65, 47],
      [67, 47],
      [69, 49],
      [71, 49],
    ],
    braidRate: 0.006,
    coinBase: 13,
    seedBase: 1010000,
  },
  {
    id: 'god',
    label: 'god',
    order: 11,
    sizes: [
      [67, 47],
      [69, 49],
      [71, 49],
      [73, 51],
      [75, 51],
    ],
    braidRate: 0.004,
    coinBase: 14,
    seedBase: 1111000,
  },
];

function rng(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

function carveMaze(width, height, random) {
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => '#'));
  const stack = [{ row: 1, col: 1 }];
  grid[1][1] = '.';

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const candidates = shuffle(
      [
        { row: current.row - 2, col: current.col, wallRow: current.row - 1, wallCol: current.col },
        { row: current.row + 2, col: current.col, wallRow: current.row + 1, wallCol: current.col },
        { row: current.row, col: current.col - 2, wallRow: current.row, wallCol: current.col - 1 },
        { row: current.row, col: current.col + 2, wallRow: current.row, wallCol: current.col + 1 },
      ],
      random,
    ).filter(
      (next) =>
        next.row > 0 &&
        next.col > 0 &&
        next.row < height - 1 &&
        next.col < width - 1 &&
        grid[next.row][next.col] === '#',
    );

    if (candidates.length === 0) {
      stack.pop();
      continue;
    }

    const next = candidates[0];
    grid[next.wallRow][next.wallCol] = '.';
    grid[next.row][next.col] = '.';
    stack.push({ row: next.row, col: next.col });
  }

  return grid;
}

function addLoops(grid, braidRate, random) {
  const candidates = [];
  for (let row = 1; row < grid.length - 1; row += 1) {
    for (let col = 1; col < grid[row].length - 1; col += 1) {
      if (grid[row][col] !== '#') {
        continue;
      }

      const horizontal = grid[row][col - 1] === '.' && grid[row][col + 1] === '.';
      const vertical = grid[row - 1][col] === '.' && grid[row + 1][col] === '.';
      if (horizontal || vertical) {
        candidates.push({ row, col });
      }
    }
  }

  shuffle(candidates, random)
    .slice(0, Math.floor(candidates.length * braidRate))
    .forEach(({ row, col }) => {
      grid[row][col] = '.';
    });
}

function floorCells(grid) {
  const cells = [];
  for (let row = 1; row < grid.length - 1; row += 1) {
    for (let col = 1; col < grid[row].length - 1; col += 1) {
      if (grid[row][col] === '.') {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

function bfs(grid, start, blocked = new Set()) {
  const distances = new Map();
  const queue = [start];
  distances.set(keyOf(start), 0);

  for (const current of queue) {
    const distance = distances.get(keyOf(current));
    for (const next of neighbors(current)) {
      const key = keyOf(next);
      if (
        next.row < 0 ||
        next.col < 0 ||
        next.row >= grid.length ||
        next.col >= grid[0].length ||
        grid[next.row][next.col] === '#' ||
        blocked.has(key) ||
        distances.has(key)
      ) {
        continue;
      }
      distances.set(key, distance + 1);
      queue.push(next);
    }
  }

  return distances;
}

function degree(grid, position) {
  return neighbors(position).filter((next) => grid[next.row]?.[next.col] === '.').length;
}

function chooseMarkers(grid, random, coinCount, blueCoinCount) {
  const start = { row: 1, col: 1 };
  const distances = bfs(grid, start);
  const minimumExitDistance = getMinimumExitDistance(grid[0].length, grid.length);
  const cells = floorCells(grid).filter((cell) => !same(cell, start));
  const scoredExitCandidates = cells
    .map((cell) => ({ cell, score: distances.get(keyOf(cell)) ?? 0, deadEnd: degree(grid, cell) === 1 }))
    .sort((a, b) => b.score - a.score || Number(b.deadEnd) - Number(a.deadEnd));
  const distantExitCandidates = scoredExitCandidates.filter(
    (candidate) => candidate.score >= minimumExitDistance,
  );
  const exitCandidates = distantExitCandidates.length > 0 ? distantExitCandidates : scoredExitCandidates;

  const exitPool = exitCandidates.slice(0, Math.max(1, Math.ceil(exitCandidates.length * 0.08)));
  const exit = exitPool[Math.floor(random() * exitPool.length)].cell;
  const coinReachable = bfs(grid, start, new Set([keyOf(exit)]));
  const coinCandidates = cells
    .filter((cell) => !same(cell, exit) && coinReachable.has(keyOf(cell)))
    .map((cell) => {
      const distance = coinReachable.get(keyOf(cell)) ?? 0;
      const distanceBias = distance / Math.max(1, grid.length + grid[0].length);
      return {
        cell,
        score: distanceBias + (degree(grid, cell) === 1 ? 0.45 : 0) + random() * 0.25,
      };
    })
    .sort((a, b) => b.score - a.score);

  const blocked = new Set([keyOf(start), keyOf(exit)]);
  const selectedCoins = chooseSpreadCoins(grid, coinCandidates, blocked, coinCount);

  const rankedBlueCoinCandidates = rankBlueCoinCandidates(grid, coinCandidates, start, exit);
  const blueCoins = chooseBlueCoins(
    rankedBlueCoinCandidates,
    blocked,
    selectedCoins,
    blueCoinCount,
  );
  return { start, exit, coins: selectedCoins, blueCoins };
}

function chooseSpreadCoins(grid, candidates, blocked, count) {
  const selectedCoins = [];
  const placement = gameSettings.coins.standardPlacement;
  const distanceScale = Math.max(1, grid.length + grid[0].length);
  const minimumCandidateScore = Math.min(...candidates.map((candidate) => candidate.score));
  const candidateScoreRange = Math.max(
    1,
    Math.max(...candidates.map((candidate) => candidate.score)) - minimumCandidateScore,
  );

  while (selectedCoins.length < count) {
    const nextCandidate = candidates
      .filter(
        (candidate) =>
          !blocked.has(keyOf(candidate.cell)) &&
          !tooCloseToExisting(candidate.cell, selectedCoins, placement.minimumCoinDistance),
      )
      .map((candidate) => {
        const candidateQuadrant = quadrantOf(candidate.cell, grid[0].length, grid.length);
        const occupiesNewQuadrant = selectedCoins.every(
          (coin) => quadrantOf(coin, grid[0].length, grid.length) !== candidateQuadrant,
        );
        const spreadDistance =
          selectedCoins.length === 0
            ? 0
            : Math.min(...selectedCoins.map((coin) => manhattanDistance(candidate.cell, coin)));
        const challengeScore = (candidate.score - minimumCandidateScore) / candidateScoreRange;
        return {
          ...candidate,
          selectionScore:
            challengeScore * placement.challengeWeight +
            (occupiesNewQuadrant ? placement.coverageWeight : 0) +
            (spreadDistance / distanceScale) * placement.spreadWeight,
        };
      })
      .sort((left, right) => right.selectionScore - left.selectionScore || right.score - left.score)[0];

    if (!nextCandidate) {
      throw new Error(`Unable to spread ${count} standard coins.`);
    }

    blocked.add(keyOf(nextCandidate.cell));
    selectedCoins.push(nextCandidate.cell);
  }

  return selectedCoins;
}

function rankBlueCoinCandidates(grid, candidates, start, exit) {
  const startDistances = bfs(grid, start);
  const exitDistances = bfs(grid, exit);
  const shortestExitDistance = startDistances.get(keyOf(exit)) ?? 0;
  const placement = gameSettings.coins.bluePlacement;

  return candidates
    .filter((candidate) => !placement.requireDeadEnd || degree(grid, candidate.cell) === 1)
    .map((candidate) => {
      const startDistance = startDistances.get(keyOf(candidate.cell)) ?? 0;
      const exitDistance = exitDistances.get(keyOf(candidate.cell)) ?? 0;
      const detourDistance = Math.max(0, startDistance + exitDistance - shortestExitDistance);
      return {
        ...candidate,
        blueScore:
          detourDistance * placement.detourWeight +
          startDistance * placement.distanceWeight,
      };
    })
    .sort((left, right) => right.blueScore - left.blueScore || right.score - left.score);
}

function chooseBlueCoins(candidates, blocked, standardCoins, count) {
  const selectedBlueCoins = [];
  const minimumCoinDistance = gameSettings.coins.bluePlacement.minimumCoinDistance;

  for (const candidate of candidates) {
    if (selectedBlueCoins.length >= count) {
      return selectedBlueCoins;
    }

    const key = keyOf(candidate.cell);
    const selectedCoins = [...standardCoins, ...selectedBlueCoins];
    if (blocked.has(key) || tooCloseToExisting(candidate.cell, selectedCoins, minimumCoinDistance)) {
      continue;
    }

    blocked.add(key);
    selectedBlueCoins.push(candidate.cell);
  }

  if (selectedBlueCoins.length === count) {
    return selectedBlueCoins;
  }

  throw new Error(`Unable to place ${count} blue coin(s).`);
}

function getMinimumExitDistance(width, height) {
  return Math.floor((width + height) * 0.9);
}

function tooCloseToExisting(cell, selected, minDistance) {
  return selected.some((other) => manhattanDistance(cell, other) < minDistance);
}

function manhattanDistance(left, right) {
  return Math.abs(left.row - right.row) + Math.abs(left.col - right.col);
}

function quadrantOf(position, width, height) {
  return (position.row >= height / 2 ? 2 : 0) + (position.col >= width / 2 ? 1 : 0);
}

function makeStage(config, stageNumber) {
  const [width, height] = config.sizes[Math.floor((stageNumber - 1) / 10)];
  const random = rng(config.seedBase + stageNumber * 9973);
  const grid = carveMaze(width, height, random);
  addLoops(grid, config.braidRate, random);
  const coinCount = config.coinBase + Math.floor((stageNumber - 1) / 10);
  const markers = chooseMarkers(grid, random, coinCount, blueCoinsPerStage);

  grid[markers.start.row][markers.start.col] = 'A';
  grid[markers.exit.row][markers.exit.col] = 'D';
  markers.coins.forEach((coin) => {
    grid[coin.row][coin.col] = 'C';
  });
  markers.blueCoins.forEach((coin) => {
    grid[coin.row][coin.col] = 'B';
  });

  return {
    id: `${config.id}-${String(stageNumber).padStart(3, '0')}`,
    title: `${config.label} ${stageNumber}`,
    subtitle: `${config.label} difficulty stage ${stageNumber}`,
    theme: 'daemon',
    difficultyId: config.id,
    difficultyLabel: config.label,
    stageNumber,
    rows: grid.map((row) => row.join('')),
    legend,
  };
}

function validateStage(stage) {
  const grid = stage.rows.map((row) => [...row]);
  const markers = { blueCoins: [], coins: [] };

  stage.rows.forEach((row, rowIndex) => {
    [...row].forEach((tile, col) => {
      if (tile === 'A') markers.start = { row: rowIndex, col };
      if (tile === 'B') markers.blueCoins.push({ row: rowIndex, col });
      if (tile === 'D') markers.exit = { row: rowIndex, col };
      if (tile === 'C') markers.coins.push({ row: rowIndex, col });
    });
  });

  if (!markers.start || !markers.exit || markers.coins.length === 0) {
    throw new Error(`Invalid markers in ${stage.id}`);
  }
  if (markers.blueCoins.length !== blueCoinsPerStage) {
    throw new Error(
      `Invalid blue coin count in ${stage.id}. expected=${blueCoinsPerStage}, actual=${markers.blueCoins.length}`,
    );
  }

  const allCoins = [...markers.coins, ...markers.blueCoins];
  for (const marker of [markers.start, markers.exit, ...allCoins]) {
    grid[marker.row][marker.col] = '.';
  }

  const reachable = bfs(grid, markers.start);
  if (!reachable.has(keyOf(markers.exit))) {
    throw new Error(`Exit is unreachable in ${stage.id}`);
  }
  const exitDistance = reachable.get(keyOf(markers.exit)) ?? 0;
  const minimumExitDistance = getMinimumExitDistance(stage.rows[0].length, stage.rows.length);
  if (exitDistance < minimumExitDistance) {
    throw new Error(
      `Exit is too close in ${stage.id}. distance=${exitDistance}, minimum=${minimumExitDistance}`,
    );
  }

  const reachableBeforeExit = bfs(grid, markers.start, new Set([keyOf(markers.exit)]));
  allCoins.forEach((coin) => {
    if (!reachable.has(keyOf(coin))) {
      throw new Error(`Coin is unreachable in ${stage.id}`);
    }
    if (!reachableBeforeExit.has(keyOf(coin))) {
      throw new Error(`Coin is only reachable through the exit in ${stage.id}`);
    }
  });
  markers.blueCoins.forEach((coin) => {
    if (gameSettings.coins.bluePlacement.requireDeadEnd && degree(grid, coin) !== 1) {
      throw new Error(`Blue coin is not in a dead end in ${stage.id}`);
    }
    if (
      tooCloseToExisting(
        coin,
        markers.coins,
        gameSettings.coins.bluePlacement.minimumCoinDistance,
      )
    ) {
      throw new Error(`Blue coin is too close to another coin in ${stage.id}`);
    }
  });
  markers.coins.forEach((coin, index) => {
    if (
      tooCloseToExisting(
        coin,
        markers.coins.slice(index + 1),
        gameSettings.coins.standardPlacement.minimumCoinDistance,
      )
    ) {
      throw new Error(`Standard coins are too close in ${stage.id}`);
    }
  });
  validateCoinDistribution(stage, allCoins);
}

function validateCoinDistribution(stage, coins) {
  const placement = gameSettings.coins.standardPlacement;
  const quadrantCounts = [0, 0, 0, 0];
  coins.forEach((coin) => {
    quadrantCounts[quadrantOf(coin, stage.rows[0].length, stage.rows.length)] += 1;
  });
  const occupiedQuadrants = quadrantCounts.filter((count) => count > 0).length;
  const largestQuadrantShare = Math.max(...quadrantCounts) / coins.length;

  if (occupiedQuadrants < placement.minimumOccupiedQuadrants) {
    throw new Error(`Coins do not cover enough map quadrants in ${stage.id}`);
  }
  if (largestQuadrantShare > placement.maximumQuadrantShare) {
    throw new Error(`Too many coins are clustered in one quadrant in ${stage.id}`);
  }
}

function neighbors(position) {
  return [
    { row: position.row - 1, col: position.col },
    { row: position.row + 1, col: position.col },
    { row: position.row, col: position.col - 1 },
    { row: position.row, col: position.col + 1 },
  ];
}

function keyOf(position) {
  return `${position.row}:${position.col}`;
}

function same(a, b) {
  return a.row === b.row && a.col === b.col;
}

const catalog = {
  version: 4,
  stagesPerDifficulty: 50,
  difficulties: difficulties.map((difficulty) => ({
    id: difficulty.id,
    label: difficulty.label,
    order: difficulty.order,
    stages: Array.from({ length: 50 }, (_, index) => makeStage(difficulty, index + 1)),
  })),
};

catalog.difficulties.forEach((difficulty) => {
  difficulty.stages.forEach(validateStage);
});

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Generated ${catalog.difficulties.length * catalog.stagesPerDifficulty} stages.`);
