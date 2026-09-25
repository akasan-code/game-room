(() => {
  'use strict';

  const CONFIG = Object.freeze({
    BOARD_SIZE: 9,
    HUMAN_COUNT: 3,
    MAX_SEARCHES: 8,
    LANTERN_PENALTY: 1,
    CPU_SEARCH_DELAY: 760
  });

  function emptyBoard() {
    return Array.from({ length: CONFIG.BOARD_SIZE }, (_, index) => ({
      index,
      content: null,
      searched: false
    }));
  }

  function shuffledIndices() {
    const indices = Array.from({ length: CONFIG.BOARD_SIZE }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }

  class ObakeidoroGame {
    constructor() {
      this.resetAll();
    }

    resetAll() {
      this.side = null;
      this.selectedCards = [];
      this.board = emptyBoard();
      this.searchesLeft = CONFIG.MAX_SEARCHES;
      this.foundHumans = 0;
      this.finished = false;
      this.winner = null;
      this.placementStep = 0;
    }

    chooseSide(side) {
      if (!['human', 'ghost'].includes(side)) throw new Error('invalid side');
      this.resetAll();
      this.side = side;
    }

    setSelectedCards(cards) {
      const required = this.side === 'human' ? CONFIG.HUMAN_COUNT : 1;
      if (!Array.isArray(cards) || cards.length !== required) {
        throw new Error(`選択カード数が不正です: ${cards?.length ?? 0}/${required}`);
      }
      this.selectedCards = [...cards];
    }

    setupGhostPlayerBoard(humanCards) {
      this.board = emptyBoard();
      const positions = shuffledIndices();

      humanCards.slice(0, CONFIG.HUMAN_COUNT).forEach((card, i) => {
        this.board[positions[i]].content = { kind: 'human', card };
      });

      this.board[positions[CONFIG.HUMAN_COUNT]].content = { kind: 'lantern' };
      this.beginSearch();
    }

    resetPlacement() {
      this.board = emptyBoard();
      this.placementStep = 0;
    }

    getPlacementTarget() {
      if (this.side !== 'human') return null;
      if (this.placementStep < CONFIG.HUMAN_COUNT) {
        return { kind: 'human', card: this.selectedCards[this.placementStep], step: this.placementStep };
      }
      if (this.placementStep === CONFIG.HUMAN_COUNT) {
        return { kind: 'lantern', step: this.placementStep };
      }
      return null;
    }

    placeAt(index) {
      if (index < 0 || index >= CONFIG.BOARD_SIZE) return { ok:false, reason:'範囲外です' };
      if (this.board[index].content) return { ok:false, reason:'その場所にはすでに配置されています' };

      const target = this.getPlacementTarget();
      if (!target) return { ok:false, reason:'配置は完了しています' };

      this.board[index].content = target.kind === 'human'
        ? { kind:'human', card:target.card }
        : { kind:'lantern' };
      this.placementStep += 1;

      return { ok:true, placed:target, complete:this.isPlacementComplete() };
    }

    isPlacementComplete() {
      return this.placementStep >= CONFIG.HUMAN_COUNT + 1;
    }

    beginSearch() {
      this.searchesLeft = CONFIG.MAX_SEARCHES;
      this.foundHumans = 0;
      this.finished = false;
      this.winner = null;
      this.board.forEach(cell => { cell.searched = false; });
    }

    search(index) {
      if (this.finished) return { ok:false, reason:'ゲーム終了済みです' };
      const cell = this.board[index];
      if (!cell || cell.searched) return { ok:false, reason:'その場所は探索済みです' };

      cell.searched = true;
      this.searchesLeft -= 1;

      let result;
      if (cell.content?.kind === 'human') {
        this.foundHumans += 1;
        result = { kind:'human', card:cell.content.card, message:`${cell.content.card.name} を発見！`, extraPenalty:0 };
      } else if (cell.content?.kind === 'lantern') {
        this.searchesLeft -= CONFIG.LANTERN_PENALTY;
        result = {
          kind:'lantern',
          message:`ランタン発見！ 追加で探索回数 -${CONFIG.LANTERN_PENALTY}`,
          extraPenalty:CONFIG.LANTERN_PENALTY
        };
      } else {
        result = { kind:'empty', message:'誰もいなかった', extraPenalty:0 };
      }

      this.evaluateEnd();
      return {
        ok:true,
        index,
        ...result,
        searchesLeft:this.searchesLeft,
        foundHumans:this.foundHumans,
        finished:this.finished,
        winner:this.winner
      };
    }

    evaluateEnd() {
      if (this.foundHumans >= CONFIG.HUMAN_COUNT) {
        this.finished = true;
        this.winner = 'ghost';
        return;
      }

      if (this.searchesLeft <= 0) {
        this.searchesLeft = 0;
        this.finished = true;
        this.winner = 'human';
      }
    }

    getRandomUnsearchedIndex() {
      const candidates = this.board.filter(cell => !cell.searched).map(cell => cell.index);
      if (!candidates.length) return null;
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  window.ObakeidoroGameCore = {
    CONFIG,
    ObakeidoroGame
  };
})();
