/*
  ============================================================
  ガチャゲーム マスターデータ
  ============================================================

  カード情報は data/cards.csv で管理する。

  このファイルには、
  ・ガチャSeries
  ・召喚コスト
  ・レア度排出率
  ・魔力設定
  を置く。

  cards は card_loader.js が cards.csv から自動生成する。
*/

window.GACHA_MASTER = {
  cards: {
    // data/cards.csv から card_loader.js が自動登録する

  },

  /*
    ガチャ側には、
    ・名称
    ・価格
    ・レア度排出率
    だけを持たせる。

    poolは不要。
  */
  gachas: {
    standard_001: {
      id: 'standard_001',
      name: 'オバケイドロ召喚',
      enabled: true,

      currency: 'magic',

      summon: {
        single: {
          count: 1,
          cost: 300
        },
        multi: {
          count: 12,
          cost: 3000
        }
      },

      rarityRates: [
        { rarity: 'UR', rate: 0.03 },
        { rarity: 'SR', rate: 0.07 },
        { rarity: 'R',  rate: 0.25 },
        { rarity: 'N',  rate: 0.65 }
      ]
    },

    series_002: {
      id: 'series_002',
      name: '深淵の召喚',
      enabled: true,

      currency: 'magic',

      summon: {
        single: {
          count: 1,
          cost: 300
        },
        multi: {
          count: 12,
          cost: 3000
        }
      },

      rarityRates: [
        { rarity: 'UR', rate: 0.03 },
        { rarity: 'SR', rate: 0.07 },
        { rarity: 'R',  rate: 0.25 },
        { rarity: 'N',  rate: 0.65 }
      ]
    }
  },

  economy: {
    initialMagic: 3000,

    magicPerSecond: {
      N: 1,
      R: 10,
      SR: 100,
      UR: 500
    },

    contributionCaps: {
      N: 99,
      R: 20,
      SR: 9,
      UR: 3
    }
  },

  currentGachaId: 'standard_001'
};
