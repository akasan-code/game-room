(() => {
  'use strict';

  const Data = window.OverlordBattleData;
  if (!Data) throw new Error('OverlordBattleData が読み込まれていません');

  const RESULTS = Object.freeze({
    WIN: 'WIN',
    LOSE: 'LOSE',
    DRAW: 'DRAW'
  });

  const invert = result => {
    if (result === RESULTS.WIN) return RESULTS.LOSE;
    if (result === RESULTS.LOSE) return RESULTS.WIN;
    return RESULTS.DRAW;
  };

  const hasTag = (card, tag) =>
    Array.isArray(card?.battleTags) && card.battleTags.includes(tag);

  const ABILITY_HANDLERS = Object.freeze({
    guild_master: Object.freeze({
      priority: 100,
      resolve({ opponent }) {
        if (hasTag(opponent, 'supreme_41')) {
          return {
            result: RESULTS.DRAW,
            reason: 'ギルドマスター：至高の41人同士はDRAW'
          };
        }
        return null;
      }
    }),

    world_champion: Object.freeze({
      priority: 50,
      resolve() {
        return {
          result: RESULTS.WIN,
          reason: 'ワールドチャンピオン：基本的に相手へ勝利'
        };
      }
    })
  });

  function collectAbilityEffects(cardA, cardB) {
    const effects = [];

    const add = (owner, opponent, ownerSide) => {
      const abilityId = owner?.battleAbility;
      const handler = ABILITY_HANDLERS[abilityId];
      if (!handler) return;

      const effect = handler.resolve({ owner, opponent });
      if (!effect) return;

      effects.push({
        abilityId,
        priority: handler.priority ?? 0,
        resultA: ownerSide === 'A' ? effect.result : invert(effect.result),
        reason: effect.reason
      });
    };

    add(cardA, cardB, 'A');
    add(cardB, cardA, 'B');

    return effects.sort((a, b) => b.priority - a.priority);
  }

  function resolveAbilityResult(cardA, cardB) {
    const effects = collectAbilityEffects(cardA, cardB);
    if (!effects.length) return null;

    const priority = effects[0].priority;
    const top = effects.filter(effect => effect.priority === priority);
    const values = [...new Set(top.map(effect => effect.resultA))];

    const resultA = values.length === 1 ? values[0] : RESULTS.DRAW;

    return {
      resultA,
      resultB: invert(resultA),
      source: 'ability',
      reason: top.map(effect => effect.reason).join(' / ')
    };
  }

  function resolveTypeResult(cardA, cardB) {
    const typeA = Data.TYPES[cardA?.battleType];
    const typeB = Data.TYPES[cardB?.battleType];

    if (!typeA || !typeB) {
      return {
        resultA: RESULTS.DRAW,
        resultB: RESULTS.DRAW,
        source: 'invalid',
        reason: '対戦タイプ未設定'
      };
    }

    if (typeA.id === typeB.id) {
      return {
        resultA: RESULTS.DRAW,
        resultB: RESULTS.DRAW,
        source: 'type',
        reason: '同タイプ'
      };
    }

    if (typeA.strongAgainst.includes(typeB.id)) {
      return {
        resultA: RESULTS.WIN,
        resultB: RESULTS.LOSE,
        source: 'type',
        reason: `${typeA.name} ＞ ${typeB.name}`
      };
    }

    if (typeB.strongAgainst.includes(typeA.id)) {
      return {
        resultA: RESULTS.LOSE,
        resultB: RESULTS.WIN,
        source: 'type',
        reason: `${typeB.name} ＞ ${typeA.name}`
      };
    }

    return {
      resultA: RESULTS.DRAW,
      resultB: RESULTS.DRAW,
      source: 'type',
      reason: '相性未定義'
    };
  }

  function resolveBattle(cardA, cardB) {
    return resolveAbilityResult(cardA, cardB) || resolveTypeResult(cardA, cardB);
  }

  window.OverlordBattleLogic = Object.freeze({
    RESULTS,
    ABILITY_HANDLERS,
    resolveBattle,
    resolveAbilityResult,
    resolveTypeResult,
    invert
  });
})();
