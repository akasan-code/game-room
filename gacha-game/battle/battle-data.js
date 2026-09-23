(() => {
  'use strict';

  const MASTER = window.GACHA_MASTER;

  const CONFIG = Object.freeze({
    SERIES_ID: 'series_003',
    TEAM_SIZE: 5,
    ALLOW_DUPLICATE_CARD_ID: false,
    ROUND_REVEAL_MS: 650,
    ROUND_RESULT_MS: 900
  });

  const TYPES = Object.freeze({
    attacker: Object.freeze({
      id: 'attacker',
      name: 'アタッカー',
      strongAgainst: Object.freeze(['magic'])
    }),
    tank: Object.freeze({
      id: 'tank',
      name: 'タンク',
      strongAgainst: Object.freeze(['attacker'])
    }),
    magic: Object.freeze({
      id: 'magic',
      name: 'マジックキャスター',
      strongAgainst: Object.freeze(['tank'])
    })
  });

  const ABILITY_LABELS = Object.freeze({
    guild_master: 'ギルドマスター',
    world_champion: 'ワールドチャンピオン'
  });

  function getAllSeriesCards() {
    return Object.values(MASTER?.cards || {})
      .filter(card => Array.isArray(card.gachas) && card.gachas.includes(CONFIG.SERIES_ID))
      .sort((a, b) => (a.collectionNo || 0) - (b.collectionNo || 0));
  }

  function getOwnedCount(cardId) {
    return window.GachaMasterAPI?.getOwnedCount?.(cardId) || 0;
  }

  function hasSupportedType(card) {
    return Boolean(card?.battleType && TYPES[card.battleType]);
  }

  function getTypeLabel(card) {
    if (!card?.battleType) return 'タイプ未設定';
    return TYPES[card.battleType]?.name || `未対応タイプ: ${card.battleType}`;
  }

  function getAbilityLabel(card) {
    if (!card?.battleAbility) return '';
    return ABILITY_LABELS[card.battleAbility] || card.battleAbility;
  }

  function isBattleReady(card) {
    return hasSupportedType(card);
  }

  function getOwnedCardsForSelection() {
    return getAllSeriesCards()
      .map(card => ({
        ...card,
        ownedCount: getOwnedCount(card.id),
        battleReady: isBattleReady(card),
        typeLabel: getTypeLabel(card),
        abilityLabel: getAbilityLabel(card)
      }))
      .filter(card => card.ownedCount > 0);
  }

  function getCpuPool() {
    return getAllSeriesCards().filter(isBattleReady);
  }

  function shuffle(list) {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function chooseCpuCards() {
    return shuffle(getCpuPool()).slice(0, CONFIG.TEAM_SIZE);
  }

  window.OverlordBattleData = Object.freeze({
    CONFIG,
    TYPES,
    ABILITY_LABELS,
    getAllSeriesCards,
    getOwnedCount,
    getOwnedCardsForSelection,
    getCpuPool,
    getTypeLabel,
    getAbilityLabel,
    isBattleReady,
    shuffle,
    chooseCpuCards
  });
})();
