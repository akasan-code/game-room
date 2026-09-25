(() => {
  'use strict';

  const TARGET_GACHA_ID = 'series_002';
  const HIGH_SCORE_KEY = 'gachaElementPuzzleHighScore_v1';

  function getOwnedCount(cardId) {
    if (window.GachaMasterAPI?.getOwnedCount) {
      return Number(window.GachaMasterAPI.getOwnedCount(cardId)) || 0;
    }

    try {
      const raw = localStorage.getItem('gachaGameCollection_v31b');
      const parsed = raw ? JSON.parse(raw) : null;
      return Number(parsed?.ownedCounts?.[cardId]) || 0;
    } catch {
      return 0;
    }
  }

  function deriveElementSymbol(card) {
    if (card?.elementSymbol) return String(card.elementSymbol).trim();

    // 古いCSV互換用。v27のcards.csvではelementSymbolを正式に持たせる。
    const match = String(card?.name || '').match(/^\s*([A-Z][a-z]?)\s+/);
    return match ? match[1] : '?';
  }

  function getOwnedElementCards() {
    const master = window.GACHA_MASTER;
    if (!master?.cards) return [];

    return Object.values(master.cards)
      .filter(card => Array.isArray(card.gachas) && card.gachas.includes(TARGET_GACHA_ID))
      .map(card => ({
        ...card,
        elementSymbol: deriveElementSymbol(card),
        ownedCount: getOwnedCount(card.id)
      }))
      .filter(card => card.ownedCount > 0)
      .sort((a, b) => (a.collectionNo || 0) - (b.collectionNo || 0));
  }

  function getHighScore() {
    try {
      return Math.max(0, Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0);
    } catch {
      return 0;
    }
  }

  function saveHighScore(score) {
    const next = Math.max(getHighScore(), Number(score) || 0);
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(next));
    } catch {
      // 保存不可環境でもゲーム進行は止めない
    }
    return next;
  }

  window.ElementPuzzleData = Object.freeze({
    TARGET_GACHA_ID,
    HIGH_SCORE_KEY,
    getOwnedCount,
    deriveElementSymbol,
    getOwnedElementCards,
    getHighScore,
    saveHighScore
  });
})();
