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

    anti_world_champion: Object.freeze({
      priority: 80,
      resolve({ owner, opponent }) {
        if (owner?.battleType === 'noncombatant' &&
            opponent?.battleAbility === 'world_champion') {
          return {
            result: RESULTS.WIN,
            reason: '非戦闘員：たっち・みーにだけ勝利'
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

    const pushEffect = (abilityId, handler, owner, opponent, ownerSide) => {
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

    const add = (owner, opponent, ownerSide) => {
      // 非戦闘員の「対ワールドチャンピオン」特効はタイプ固有ルール。
      pushEffect(
        'anti_world_champion',
        ABILITY_HANDLERS.anti_world_champion,
        owner,
        opponent,
        ownerSide
      );

      const abilityId = owner?.battleAbility;
      if (!abilityId) return;

      pushEffect(
        abilityId,
        ABILITY_HANDLERS[abilityId],
        owner,
        opponent,
        ownerSide
      );
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

    // 非戦闘員は通常タイプすべてに弱い。
    // 非戦闘員同士だけDRAW。
    if (typeA.id === 'noncombatant' || typeB.id === 'noncombatant') {
      if (typeA.id === typeB.id) {
        return {
          resultA: RESULTS.DRAW,
          resultB: RESULTS.DRAW,
          source: 'type',
          reason: '非戦闘員同士'
        };
      }

      if (typeA.id === 'noncombatant') {
        return {
          resultA: RESULTS.LOSE,
          resultB: RESULTS.WIN,
          source: 'type',
          reason: `非戦闘員 ＜ ${typeB.name}`
        };
      }

      return {
        resultA: RESULTS.WIN,
        resultB: RESULTS.LOSE,
        source: 'type',
        reason: `${typeA.name} ＞ 非戦闘員`
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
