/*
  ============================================================
  ガチャゲーム マスターデータ
  ============================================================

  ★ v27
  poolは手動で書かない。
  各カードの gachas に対象ガチャIDを登録すると、
  script.js側でレア度別poolを自動生成する。

  例:
  gachas: ['standard_001']

  複数ガチャに入れる場合:
  gachas: ['standard_001', 'limited_001']

  同レア内の重みを変えたい場合だけ任意で:
  weights: {
    standard_001: 2
  }

  weights未指定なら weight: 1 として扱う。
*/

window.GACHA_MASTER = {
  cards: {
    oba_n_001: {
      id: 'oba_n_001',
      name: '紀子',
      rarity: 'N',
      image: 'images/OBA/noriko.png',
      gachas: ['standard_001']
    },

    oba_n_002: {
      id: 'oba_n_002',
      name: '秋彦',
      rarity: 'N',
      image: 'images/OBA/akihiko.png',
      gachas: ['standard_001']
    },

    oba_n_003: {
      id: 'oba_n_003',
      name: '花子',
      rarity: 'N',
      image: 'images/OBA/hanako.png',
      gachas: ['standard_001']
    },

    oba_r_001: {
      id: 'oba_r_001',
      name: '赤マント',
      rarity: 'R',
      image: 'images/OBA/akamant.png',
      gachas: ['standard_001']
    },

    oba_r_002: {
      id: 'oba_r_002',
      name: '大ガマ',
      rarity: 'R',
      image: 'images/OBA/oogama.png',
      gachas: ['standard_001']
    },

    oba_r_003: {
      id: 'oba_r_003',
      name: '青べえ',
      rarity: 'R',
      image: 'images/OBA/aobee.png',
      gachas: ['standard_001']
    },

    oba_r_004: {
      id: 'oba_r_004',
      name: '赤べえ',
      rarity: 'R',
      image: 'images/OBA/akabee.png',
      gachas: ['standard_001']
    },

    oba_sr_001: {
      id: 'oba_sr_001',
      name: '九郎',
      rarity: 'SR',
      image: 'images/OBA/kurou.png',
      gachas: ['standard_001']
    },

    oba_sr_002: {
      id: 'oba_sr_002',
      name: 'はじめ',
      rarity: 'SR',
      image: 'images/OBA/hajime.png',
      gachas: ['standard_001']
    },

    oba_sr_003: {
      id: 'oba_sr_003',
      name: '青マント',
      rarity: 'SR',
      image: 'images/OBA/aomant.png',
      gachas: ['standard_001']
    },

    oba_sr_004: {
      id: 'oba_sr_004',
      name: 'ガシャ',
      rarity: 'SR',
      image: 'images/OBA/gasya.png',
      gachas: ['standard_001']
    },

    oba_ur_001: {
      id: 'oba_ur_001',
      name: 'メリーさん',
      rarity: 'UR',
      image: 'images/OBA/merry.png',
      gachas: ['standard_001']
    },

    oba_ur_002: {
      id: 'oba_ur_002',
      name: 'ヤミ子さん',
      rarity: 'UR',
      image: 'images/OBA/yami.png',
      gachas: ['standard_001']
    },

    oba_ur_003: {
      id: 'oba_ur_003',
      name: 'お雪',
      rarity: 'UR',
      image: 'images/OBA/oyuki.png',
      gachas: ['standard_001']
    }
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

      currency: 'gem',

      summon: {
        single: {
          count: 1,
          cost: 300
        },
        multi: {
          count: 12,
          cost: 3600
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

  currentGachaId: 'standard_001'
};
