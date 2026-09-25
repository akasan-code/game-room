((root) => {
  'use strict';

  const PUZZLE_CONFIG = Object.freeze({
    BOARD_SIZE: 7,
    PIECE_TYPES: 5,
    MATCH_COUNT: 3,
    SKILL_GAUGE_MAX: 20,
    SCORE_PER_PIECE: 100,
    GENERATE_RETRY_LIMIT: 1000,
    SWAP_MS: 150,
    MATCH_MS: 250,
    FALL_MS: 220,
    CUTIN_MS: 1150,
    TARGET_GLOW_MS: 280
  });

  const PIECES = Object.freeze(['element', 'crystal', 'rune', 'gem', 'arcane']);

  function indexOf(row, col, size = PUZZLE_CONFIG.BOARD_SIZE) {
    return row * size + col;
  }

  function rowCol(index, size = PUZZLE_CONFIG.BOARD_SIZE) {
    return {
      row: Math.floor(index / size),
      col: index % size
    };
  }

  function isAdjacent(a, b, size = PUZZLE_CONFIG.BOARD_SIZE) {
    const pa = rowCol(a, size);
    const pb = rowCol(b, size);
    return Math.abs(pa.row - pb.row) + Math.abs(pa.col - pb.col) === 1;
  }

  function swap(board, a, b) {
    [board[a], board[b]] = [board[b], board[a]];
    return board;
  }

  function findMatches(board, size = PUZZLE_CONFIG.BOARD_SIZE, min = PUZZLE_CONFIG.MATCH_COUNT) {
    const matches = new Set();

    // Horizontal
    for (let row = 0; row < size; row++) {
      let start = 0;
      while (start < size) {
        const value = board[indexOf(row, start, size)];
        let end = start + 1;

        while (end < size && value != null && board[indexOf(row, end, size)] === value) {
          end++;
        }

        if (value != null && end - start >= min) {
          for (let col = start; col < end; col++) {
            matches.add(indexOf(row, col, size));
          }
        }
        start = end;
      }
    }

    // Vertical
    for (let col = 0; col < size; col++) {
      let start = 0;
      while (start < size) {
        const value = board[indexOf(start, col, size)];
        let end = start + 1;

        while (end < size && value != null && board[indexOf(end, col, size)] === value) {
          end++;
        }

        if (value != null && end - start >= min) {
          for (let row = start; row < end; row++) {
            matches.add(indexOf(row, col, size));
          }
        }
        start = end;
      }
    }

    return matches;
  }

  function hasLegalMove(board, size = PUZZLE_CONFIG.BOARD_SIZE) {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const a = indexOf(row, col, size);
        const neighbors = [];

        if (col + 1 < size) neighbors.push(indexOf(row, col + 1, size));
        if (row + 1 < size) neighbors.push(indexOf(row + 1, col, size));

        for (const b of neighbors) {
          swap(board, a, b);
          const legal = findMatches(board, size).size > 0;
          swap(board, a, b);
          if (legal) return true;
        }
      }
    }

    return false;
  }

  function randomPiece(random = Math.random) {
    return PIECES[Math.floor(random() * PIECES.length)];
  }

  function createNoMatchBoard(size = PUZZLE_CONFIG.BOARD_SIZE, random = Math.random) {
    const board = new Array(size * size).fill(null);

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const forbidden = new Set();

        if (col >= 2) {
          const left1 = board[indexOf(row, col - 1, size)];
          const left2 = board[indexOf(row, col - 2, size)];
          if (left1 === left2) forbidden.add(left1);
        }

        if (row >= 2) {
          const up1 = board[indexOf(row - 1, col, size)];
          const up2 = board[indexOf(row - 2, col, size)];
          if (up1 === up2) forbidden.add(up1);
        }

        const candidates = PIECES.filter(piece => !forbidden.has(piece));
        board[indexOf(row, col, size)] = candidates[Math.floor(random() * candidates.length)];
      }
    }

    return board;
  }

  function generateInitialBoard(random = Math.random) {
    for (let attempt = 0; attempt < PUZZLE_CONFIG.GENERATE_RETRY_LIMIT; attempt++) {
      const board = createNoMatchBoard(PUZZLE_CONFIG.BOARD_SIZE, random);
      if (findMatches(board).size === 0 && hasLegalMove(board)) {
        return board;
      }
    }

    throw new Error('合法手を含む初期盤面を生成できませんでした。');
  }

  function clearMatches(board, matchSet) {
    const removed = [];
    for (const index of matchSet) {
      removed.push({ index, piece: board[index] });
      board[index] = null;
    }
    return removed;
  }

  function collapseAndRefill(board, random = Math.random, size = PUZZLE_CONFIG.BOARD_SIZE) {
    for (let col = 0; col < size; col++) {
      const kept = [];
      for (let row = size - 1; row >= 0; row--) {
        const value = board[indexOf(row, col, size)];
        if (value != null) kept.push(value);
      }

      let cursor = 0;
      for (let row = size - 1; row >= 0; row--) {
        board[indexOf(row, col, size)] =
          cursor < kept.length ? kept[cursor++] : randomPiece(random);
      }
    }
    return board;
  }

  function countPiece(removed, pieceId) {
    return removed.reduce((sum, item) => sum + (item.piece === pieceId ? 1 : 0), 0);
  }

  function scoreForRemoval(count, chain) {
    return count * PUZZLE_CONFIG.SCORE_PER_PIECE * Math.max(1, chain);
  }

  function cloneBoard(board) {
    return [...board];
  }

  root.ElementPuzzleCore = Object.freeze({
    PUZZLE_CONFIG,
    PIECES,
    indexOf,
    rowCol,
    isAdjacent,
    swap,
    findMatches,
    hasLegalMove,
    randomPiece,
    createNoMatchBoard,
    generateInitialBoard,
    clearMatches,
    collapseAndRefill,
    countPiece,
    scoreForRemoval,
    cloneBoard
  });
})(typeof window !== 'undefined' ? window : globalThis);
