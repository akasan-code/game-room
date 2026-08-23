'use strict';


/* =========================================================
   基本ユーティリティ
========================================================= */

const $ = id => document.getElementById(id);

const K = (q, r) => `${q},${r}`;

const D = (a, b) =>
  Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs((a.q + a.r) - (b.q + b.r))
  );

const R = (a, b) =>
  Math.floor(Math.random() * (b - a + 1)) + a;


/* =========================================================
   マップ設定
========================================================= */

const MAP_RADIUS = 15;

const BASE_POS = {
  q: 0,
  r: 0
};


/* =========================================================
   ゲーム状態
========================================================= */

const S = {

  /* ログ */
  log: [],

  /* 日数 */
  day: 1,

  /* 空腹 */
  hunger: 100,
  maxHunger: 100,

  /* ライフ */
  life: 100,
  maxLife: 100,

  /* 資源 */
  food: 0,
  grass: 0,
  wood: 0,
  stone: 0,
  fur: 0,
  red: 0,
  blue: 0,
  yellow: 0,

  /* 施設 */
  fac: {
    base: 0,
    kitchen: 0,
    weapon: 0,
    armor: 0
  },

  /* コンパス */
  compass: false,

  /* 拠点 */
  base: {
    q: BASE_POS.q,
    r: BASE_POS.r
  },

  /*
   * 主人公も拠点に固定
   *
   * 今後もこの値は基本的に変更しない
   */
  pos: {
    q: BASE_POS.q,
    r: BASE_POS.r
  },

  /* マップ */
  tiles: new Map(),

  /* 食材図鑑 */
  book: {},

  /* 特殊地形 */
  special: {
    forest: null,
    pond: null,
    rock: null,
    cave: null
  },

  /* 秘宝 */
  treasure: null,

  /* 現在探索しようとしているマス */
  pending: null
};


/* =========================================================
   地形データ
========================================================= */

const T = {

  grass: {
    name: '草原',
    icon: '🌿',
    food: [1, 1],
    grass: [1, 2],
    damage: 0,
    rare: ['レア食料', 4]
  },

  forest: {
    name: '森',
    icon: '🌲',
    wood: [2, 4],
    damage: 5,
    rare: ['毛皮', 1]
  },

  rock: {
    name: '岩場',
    icon: '⛰️',
    stone: [2, 4],
    damage: 5,
    rare: ['赤い宝石', 1]
  },

  pond: {
    name: '池',
    icon: '💧',
    food: [2, 4],
    damage: 5,
    rare: ['青い宝石', 1]
  },

  cave: {
    name: '洞窟',
    icon: '🕳️',
    damage: 20,
    rare: ['黄色い宝石', 1]
  },

  waste: {
    name: '荒地',
    icon: '🏜️',
    damage: 0,
    rare: ['レア食料', 2]
  },

  sea: {
    name: '海',
    icon: '🌊',
    blocked: true,
    damage: 0
  }

};


/* =========================================================
   食材図鑑
========================================================= */

const foods = [
  ['fish', 'さかながぐつ', '💧'],
  ['otamame', 'おたまじゃくし豆', '🫘'],
  ['umashika', 'ウマシカ', '🌲'],
  ['kutsu', 'くつかぼちゃ', '🌿'],
  ['benri', '荒地ベンリ菜', '🏜️'],
  ['denki', '電気きのこ', '🕳️']
];


/* =========================================================
   資源名
========================================================= */

const costName = {
  grass: '草',
  wood: '木材',
  stone: '石材',
  fur: '毛皮',
  red: '赤い宝石',
  blue: '青い宝石',
  yellow: '黄色い宝石'
};


/* =========================================================
   トースト
========================================================= */

function toast(message) {

  const e = $('toast');

  if (!e) {
    return;
  }

  e.textContent = message;

  e.classList.add('show');

  setTimeout(() => {
    e.classList.remove('show');
  }, 1500);

}


/* =========================================================
   モーダル
========================================================= */

function showModal(id) {

  const e = $(id);

  if (!e) {
    return;
  }

  e.hidden = false;
  e.classList.add('show');

}


function closeModal(id) {

  const e = $(id);

  if (!e) {
    return;
  }

  e.classList.remove('show');
  e.hidden = true;

}


/* =========================================================
   画面切り替え
========================================================= */

function showBaseView() {

  $('baseView').hidden = false;
  $('exploreView').hidden = true;

}


function showExploreView() {

  $('baseView').hidden = true;
  $('exploreView').hidden = false;

  renderMap();

}


/* =========================================================
   秘宝生成
   拠点から9～15マス
========================================================= */

function generateTreasure() {

  while (true) {

    const q = R(-MAP_RADIUS, MAP_RADIUS);
    const r = R(-MAP_RADIUS, MAP_RADIUS);

    const distance = D(
      { q, r },
      S.base
    );

    if (distance < 9 || distance > 15) {
      continue;
    }

    /*
     * 海に秘宝が生成されると
     * 到達できなくなるので除外
     */
    const tile = S.tiles.get(K(q, r));

    if (tile && tile.t === 'sea') {
      continue;
    }

    S.treasure = {
      q,
      r
    };

    return;

  }

}


/* =========================================================
   初期化
========================================================= */

function init() {

  /*
   * 状態を初期化
   */
  S.day = 1;

  S.hunger = 100;
  S.maxHunger = 100;

  S.life = 100;
  S.maxLife = 100;

  S.food = 0;
  S.grass = 0;
  S.wood = 0;
  S.stone = 0;
  S.fur = 0;
  S.red = 0;
  S.blue = 0;
  S.yellow = 0;

  S.fac = {
    base: 0,
    kitchen: 0,
    weapon: 0,
    armor: 0
  };

  S.compass = false;

  S.base = {
    q: 0,
    r: 0
  };

  S.pos = {
    q: 0,
    r: 0
  };

  S.tiles = new Map();

  S.book = {};

  S.special = {
    forest: null,
    pond: null,
    rock: null,
    cave: null
  };

  S.treasure = null;
  S.pending = null;
  S.log = [];


  /*
   * マップ全体を生成
   *
   * ただし seen:false のため、
   * プレイヤーから見ると未知のまま。
   */
  for (
    let q = -MAP_RADIUS;
    q <= MAP_RADIUS;
    q++
  ) {

    for (
      let r = -MAP_RADIUS;
      r <= MAP_RADIUS;
      r++
    ) {

      if (
        D(
          { q, r },
          S.base
        ) > MAP_RADIUS
      ) {
        continue;
      }

      gen(q, r);

    }

  }


  /*
   * 拠点は最初から探索済み
   */
  const baseTile =
    S.tiles.get(
      K(S.base.q, S.base.r)
    );

  if (baseTile) {
    baseTile.seen = true;
  }


  /*
   * 秘宝を決定
   */
  generateTreasure();

}


/* =========================================================
   マップ1マス生成
========================================================= */

function gen(q, r) {

  const k = K(q, r);

  if (S.tiles.has(k)) {
    return S.tiles.get(k);
  }


  /*
   * 拠点
   */
  if (
    q === S.base.q &&
    r === S.base.r
  ) {

    const baseTile = {
      q,
      r,
      t: 'grass',
      seen: true
    };

    S.tiles.set(k, baseTile);

    return baseTile;
  }


  const distance = D(
    { q, r },
    S.base
  );


  let t = 'grass';


  if (distance > 0) {

    const opts = [];


    /*
     * 森
     */
    if (
      !S.special.forest &&
      distance >= 2
    ) {

      opts.push([
        'forest',
        Math.exp(
          -((distance - 3) ** 2) / 1.5
        )
      ]);

    }


    /*
     * 池
     */
    if (
      !S.special.pond &&
      distance >= 3
    ) {

      opts.push([
        'pond',
        Math.exp(
          -((distance - 4) ** 2) / 1.5
        )
      ]);

    }


    /*
     * 岩場
     */
    if (
      !S.special.rock &&
      distance >= 4
    ) {

      opts.push([
        'rock',
        Math.exp(
          -((distance - 5) ** 2) / 1.7
        )
      ]);

    }


    /*
     * 洞窟
     */
    if (
      !S.special.cave &&
      distance >= 5
    ) {

      opts.push([
        'cave',
        0.7 *
        Math.exp(
          -((distance - 6) ** 2) / 2
        )
      ]);

    }


    opts.sort(
      (a, b) => b[1] - a[1]
    );


    /*
     * 特殊地形
     */
    if (
      opts[0] &&
      Math.random() <
        opts[0][1] * 0.6
    ) {

      t = opts[0][0];

      S.special[t] = k;

    }

    /*
     * 荒地
     */
    else if (
      Math.random() < 0.12
    ) {

      t = 'waste';

    }

    /*
     * 海
     */
    else if (
      Math.random() < 0.05 &&
      distance > 4
    ) {

      t = 'sea';

    }

  }


  const tile = {
    q,
    r,
    t,
    seen: false
  };

  S.tiles.set(k, tile);

  return tile;

}


/* =========================================================
   「探索可能なマス」判定
========================================================= */

function isAdjacentToExplored(tile) {

  /*
   * すでに探索済みのマスを全部確認
   */
  for (const explored of S.tiles.values()) {

    if (!explored.seen) {
      continue;
    }

    /*
     * 1マス隣なら探索可能
     */
    if (
      D(tile, explored) === 1
    ) {
      return true;
    }

  }

  return false;

}


/* =========================================================
   全体描画
========================================================= */

function render() {

  /*
   * ログ
   */
  $('log').innerHTML =
    (S.log || [])
      .slice(0, 6)
      .map(
        x =>
          `<div class="log-item">${x}</div>`
      )
      .join('');


  /*
   * Day
   */
  $('day').textContent = S.day;


  /*
   * 空腹
   */
  $('hungerText').textContent =
    `${S.hunger} / ${S.maxHunger}`;


  /*
   * ライフ
   */
  $('lifeText').textContent =
    `${S.life} / ${S.maxLife}`;


  /*
   * バー
   */
  $('hungerBar').style.width =
    `${S.hunger / S.maxHunger * 100}%`;

  $('lifeBar').style.width =
    `${Math.max(0, S.life) / S.maxLife * 100}%`;


  /*
   * 資源表示
   */
  $('resources').innerHTML =
    `🪵 ${S.wood}　` +
    `🪨 ${S.stone}　` +
    `🍖 ${S.food}　` +
    `🌿 ${S.grass}　` +
    `🧥 ${S.fur}　` +
    `🔴${S.red} ` +
    `🔵${S.blue} ` +
    `🟡${S.yellow}`;


  /*
   * 施設
   */
  renderFacilities();


  /*
   * 図鑑
   */
  renderBook();


  /*
   * マップ
   *
   * 探索画面が開いている場合だけ描画
   */
  if (!$('exploreView').hidden) {
    renderMap();
  }

}


/* =========================================================
   マップ描画
========================================================= */

function renderMap() {

  const map = $('map');

  if (!map) {
    return;
  }


  /*
   * マップ全体のサイズ
   */
  const centerX = 900;
  const centerY = 900;

  const mapWidth = 1800;
  const mapHeight = 1800;


  /*
   * スクロール位置を記憶
   *
   * 初回は拠点中央にする
   */
  const previousLeft = map.scrollLeft;
  const previousTop = map.scrollTop;

  const hasScrollPosition =
    previousLeft > 0 ||
    previousTop > 0;


  /*
   * マップをリセット
   */
  map.innerHTML = '';


  /*
   * マップ本体
   */
  const world =
    document.createElement('div');

  world.style.position = 'relative';
  world.style.width =
    `${mapWidth}px`;

  world.style.height =
    `${mapHeight}px`;


  map.appendChild(world);


  /*
   * マップ全体
   */
  for (
    let q = -MAP_RADIUS;
    q <= MAP_RADIUS;
    q++
  ) {

    for (
      let r = -MAP_RADIUS;
      r <= MAP_RADIUS;
      r++
    ) {

      if (
        D(
          { q, r },
          S.base
        ) > MAP_RADIUS
      ) {
        continue;
      }


      const tile =
        S.tiles.get(
          K(q, r)
        );

      if (!tile) {
        continue;
      }


      const e =
        document.createElement('div');


      /*
       * 拠点
       */
      const isBase =
        q === S.base.q &&
        r === S.base.r;


      /*
       * 秘宝
       */
      const isTreasure =
        S.compass &&
        S.treasure &&
        q === S.treasure.q &&
        r === S.treasure.r;


      /*
       * 探索可能か
       */
      const isAvailable =
        !isBase &&
        tile.t !== 'sea' &&
        !tile.seen &&
        isAdjacentToExplored(tile);


      /*
       * 六角形の位置
       */
      const x =
        centerX +
        q * 84;

      const y =
        centerY +
        r * 70 +
        q * 35;


      /*
       * 基本クラス
       */
      e.className =
        'hex ' +
        (
          tile.seen
            ? `explored ${tile.t}`
            : 'unexplored'
        );


      /*
       * 拠点
       */
      if (isBase) {
        e.classList.add('base');
      }


      /*
       * 海
       */
      if (tile.t === 'sea') {
        e.classList.add('blocked');
      }


      /*
       * 探索可能
       */
      if (isAvailable) {
        e.classList.add('available');
      }


      /*
       * 秘宝
       */
      if (isTreasure) {
        e.dataset.treasure = 'true';
      }


      /*
       * 座標
       */
      e.style.left =
        `${x - 43}px`;

      e.style.top =
        `${y - 49}px`;


      /*
       * 表示内容
       */
      let icon = '?';
      let name = '地形';


      if (isBase) {

        icon = '🏕️';
        name = '拠点';

      }

      else if (isTreasure) {

        icon = '✨';
        name = '秘宝';

      }

      else if (tile.seen) {

        icon = T[tile.t].icon;
        name = T[tile.t].name;

      }


      e.innerHTML = `
        <div class="inside">

          <div class="terrain-icon">
            ${icon}
          </div>

          <div>
            ${name}
          </div>

        </div>
      `;


      /*
       * クリックイベント
       */
      if (isAvailable) {

        e.onclick = () =>
          openExplore(tile);

      }


      world.appendChild(e);

    }

  }


  /*
   * スクロール位置
   *
   * 初回表示は拠点を中央。
   * すでに操作中なら位置を維持。
   */
  requestAnimationFrame(() => {

    if (hasScrollPosition) {

      map.scrollLeft = previousLeft;
      map.scrollTop = previousTop;

    }

    else {

      map.scrollLeft =
        centerX -
        map.clientWidth / 2;

      map.scrollTop =
        centerY -
        map.clientHeight / 2;

    }

  });

}


/* =========================================================
   探索プレビュー
========================================================= */

function preview(tile) {

  const d = T[tile.t];

  const result = [];


  if (d.food) {

    result.push(
      `🍖 食料 ${d.food[0]}～${d.food[1]}`
    );

  }


  if (d.grass) {

    result.push(
      `🌿 草 ${d.grass[0]}～${d.grass[1]}`
    );

  }


  if (d.wood) {

    result.push(
      `🪵 木材 ${d.wood[0]}～${d.wood[1]}`
    );

  }


  if (d.stone) {

    result.push(
      `🪨 石材 ${d.stone[0]}～${d.stone[1]}`
    );

  }


  if (d.damage) {

    const multiplier =
      S.fac.weapon === 2
        ? 0.5
        : S.fac.weapon === 1
          ? 0.8
          : 1;

    result.push(
      `❤️ 地形ダメージ ${
        Math.floor(
          d.damage * multiplier
        )
      }`
    );

  }


  result.push(
    `✨ レア：${d.rare[0]} ×${d.rare[1]}（10%）`
  );


  return result.join('<br>');

}


/* =========================================================
   探索モーダルを開く
========================================================= */

function openExplore(tile) {

  /*
   * 拠点からの距離
   */
  const distance =
    D(tile, S.base);


  /*
   * 探索コスト
   */
  const cost =
    10 + distance * 5;


  /*
   * 地形ダメージ軽減
   */
  const multiplier =
    S.fac.weapon === 2
      ? 0.5
      : S.fac.weapon === 1
        ? 0.8
        : 1;


  const damage =
    Math.floor(
      T[tile.t].damage *
      multiplier
    );


  S.pending = {
    tile,
    cost,
    damage
  };


  /*
   * タイトル
   */
  $('exploreTitle').textContent =
    T[tile.t].name;


  /*
   * プレビュー
   */
  $('explorePreview').innerHTML = `
    <div class="target-icon">
      ${T[tile.t].icon}
    </div>

    <div>
      拠点から ${distance} マス
    </div>
  `;


  /*
   * 消費
   */
  $('travelCost').innerHTML =
    `🍖 空腹 -${cost}　` +
    `❤️ ダメージ -${damage}` +
    (
      S.hunger < cost
        ? '　⚠ 空腹不足分もライフ減少'
        : ''
    );


  /*
   * 獲得予想
   */
  $('resourcePreview').innerHTML =
    preview(tile);


  /*
   * モーダル
   */
  showModal('exploreModal');

}


/* =========================================================
   探索実行
========================================================= */

function explore() {

  const pending =
    S.pending;

  if (!pending) {
    return;
  }


  const tile =
    pending.tile;

  const terrain =
    T[tile.t];


  /*
   * モーダルを閉じる
   */
  closeModal('exploreModal');


  /*
   * 探索アニメーション
   */
  $('char').textContent = '🏃';


  setTimeout(() => {

    $('char').textContent = '👨‍💼';


    /*
     * 空腹不足
     */
    const shortage =
      Math.max(
        0,
        pending.cost - S.hunger
      );


    /*
     * 空腹
     */
    S.hunger =
      Math.max(
        0,
        S.hunger - pending.cost
      );


    /*
     * ライフ
     */
    S.life -=
      pending.damage + shortage;


    /*
     * 通常資源
     */
    if (terrain.food) {

      S.food +=
        R(...terrain.food);

    }

    if (terrain.grass) {

      S.grass +=
        R(...terrain.grass);

    }

    if (terrain.wood) {

      S.wood +=
        R(...terrain.wood);

    }

    if (terrain.stone) {

      S.stone +=
        R(...terrain.stone);

    }


    /*
     * レア素材
     */
    if (
      terrain.rare &&
      Math.random() < 0.1
    ) {

      const rareName =
        terrain.rare[0];


      if (rareName === '毛皮') {

        S.fur++;

      }

      if (rareName === '赤い宝石') {

        S.red++;

      }

      if (rareName === '青い宝石') {

        S.blue++;

      }

      if (rareName === '黄色い宝石') {

        S.yellow++;

      }

      if (rareName === 'レア食料') {

        S.food +=
          terrain.rare[1];

      }


      toast(
        `レア素材：${rareName}`
      );

    }


    /*
     * 食材図鑑
     */
    const foundFoods =
      foods.filter(
        f =>
          f[2] ===
          terrain.icon
      );


    if (
      foundFoods.length &&
      Math.random() < 0.35
    ) {

      const found =
        foundFoods[
          R(
            0,
            foundFoods.length - 1
          )
        ];

      S.book[found[0]] = 1;

    }


    /*
     * 探索済みにする
     */
    tile.seen = true;


    /*
     * 探索ログ
     */
    const distance =
      D(tile, S.base);

    S.log.unshift(
      `Day ${S.day}　` +
      `${terrain.name}を探索 ` +
      `(拠点から${distance}マス)`
    );


    /*
     * 日数
     */
    S.day++;


    /*
     * 秘宝発見
     */
    if (
      S.treasure &&
      tile.q === S.treasure.q &&
      tile.r === S.treasure.r
    ) {

      alert(
        '秘宝を発見！ GAME CLEAR'
      );

      location.reload();

      return;

    }


    /*
     * ゲームオーバー
     */
    if (S.life <= 0) {

      alert(
        'GAME OVER'
      );

      location.reload();

      return;

    }


    /*
     * 主人公は拠点から動かない
     *
     * ここでは S.pos を変更しない。
     */


    /*
     * 再描画
     */
    render();


  }, 3000);

}


/* =========================================================
   食べる
========================================================= */

function eat() {

  if (!S.food) {

    toast(
      '食料がありません'
    );

    return;

  }


  const amount =
    S.fac.kitchen === 2
      ? 15
      : S.fac.kitchen === 1
        ? 12
        : 10;


  S.food--;


  S.hunger =
    Math.min(
      S.maxHunger,
      S.hunger + amount
    );


  $('char').textContent =
    '🍖';


  setTimeout(() => {

    $('char').textContent =
      '👨‍💼';

  }, 700);


  render();

}


/* =========================================================
   施設定義
========================================================= */

const defs = [

  [
    'base',
    '拠点',

    [
      [
        5,
        0,
        0,
        0,
        0,
        0,
        0,
        '草5',
        '藁のテント'
      ],

      [
        10,
        10,
        0,
        0,
        0,
        0,
        0,
        '木材10＋石材10',
        '小屋'
      ]
    ]
  ],


  [
    'kitchen',
    '食堂',

    [
      [
        5,
        0,
        0,
        0,
        0,
        0,
        0,
        '木材5',
        '焚き火'
      ],

      [
        10,
        0,
        1,
        0,
        0,
        0,
        0,
        '石材10＋赤い宝石1',
        '電気鍋'
      ]
    ]
  ],


  [
    'weapon',
    '武器',

    [
      [
        5,
        0,
        0,
        0,
        0,
        0,
        0,
        '木材5',
        '軽減20%'
      ],

      [
        10,
        0,
        1,
        0,
        0,
        0,
        0,
        '石材10＋赤い宝石1',
        '軽減50%'
      ]
    ]
  ],


  [
    'armor',
    '防具',

    [
      [
        5,
        0,
        0,
        0,
        0,
        0,
        0,
        '木材5',
        '最大ライフ+20'
      ],

      [
        10,
        0,
        1,
        0,
        0,
        0,
        0,
        '石材10＋赤い宝石1',
        '最大ライフ+50'
      ]
    ]
  ]

];


/* =========================================================
   建設条件
========================================================= */

function can(a) {

  return (
    S.grass >= a[0] &&
    S.wood >= a[1] &&
    S.stone >= a[2] &&
    S.fur >= a[3] &&
    S.red >= a[4] &&
    S.blue >= a[5] &&
    S.yellow >= a[6]
  );

}


function pay(a) {

  S.grass -= a[0];
  S.wood -= a[1];
  S.stone -= a[2];
  S.fur -= a[3];
  S.red -= a[4];
  S.blue -= a[5];
  S.yellow -= a[6];

}


/* =========================================================
   施設開発UI
========================================================= */

function buildUI() {

  let html = '';


  defs.forEach(def => {

    const id = def[0];

    const level =
      S.fac[id];

    const nextLevel =
      level + 1;


    if (nextLevel > 2) {
      return;
    }


    const cost =
      def[2][nextLevel - 1];


    /*
     * 拠点Lv1だけは
     * 初期状態から作成可能。
     *
     * その他は拠点レベルが必要。
     */
    const baseRequirement =
      id === 'base'
        ? nextLevel === 1
        : nextLevel <= S.fac.base;


    const enabled =
      baseRequirement &&
      can(cost);


    html += `
      <div class="build-row">

        <div>

          <h3>
            ${def[1]} Lv${nextLevel}
          </h3>

          <p>
            ${cost[7]} / ${cost[8]}
          </p>

        </div>

        <button
          data-b="${id}"
          ${enabled ? '' : 'disabled'}
        >
          建設
        </button>

      </div>
    `;

  });


  /*
   * 冷蔵庫
   */
  html += `
    <div class="build-row">

      <div>

        <h3>
          冷蔵庫
        </h3>

        <p>
          黄色1＋青3＋石材20 /
          空腹最大+50
        </p>

      </div>

      <button
        id="fridge"
        ${
          S.maxHunger > 100 ||
          S.yellow < 1 ||
          S.blue < 3 ||
          S.stone < 20
            ? 'disabled'
            : ''
        }
      >
        建設
      </button>

    </div>
  `;


  /*
   * コンパス
   */
  html += `
    <div class="build-row">

      <div>

        <h3>
          コンパス
        </h3>

        <p>
          黄色1＋青1＋赤1 /
          秘宝マス表示
        </p>

      </div>

      <button
        id="compass"
        ${
          S.compass ||
          S.yellow < 1 ||
          S.blue < 1 ||
          S.red < 1
            ? 'disabled'
            : ''
        }
      >
        建設
      </button>

    </div>
  `;


  $('buildList').innerHTML =
    html;


  showModal('buildModal');


  /*
   * 通常施設
   */
  document
    .querySelectorAll('[data-b]')
    .forEach(button => {

      button.onclick = () => {

        build(
          button.dataset.b
        );

      };

    });


  /*
   * 冷蔵庫
   */
  $('fridge').onclick = () => {

    S.yellow--;
    S.blue -= 3;
    S.stone -= 20;

    S.maxHunger = 150;

    render();

    buildUI();

  };


  /*
   * コンパス
   */
  $('compass').onclick = () => {

    S.yellow--;
    S.blue--;
    S.red--;

    S.compass = true;

    toast(
      '秘宝マスが分かるようになった'
    );

    render();

    buildUI();

  };

}


/* =========================================================
   建設実行
========================================================= */

function build(id) {

  const def =
    defs.find(
      x => x[0] === id
    );

  if (!def) {
    return;
  }


  const level =
    S.fac[id];

  const nextLevel =
    level + 1;


  const cost =
    def[2][nextLevel - 1];


  if (!cost) {
    return;
  }


  /*
   * 拠点
   */
  const baseRequirement =
    id === 'base'
      ? nextLevel === 1
      : nextLevel <= S.fac.base;


  if (
    !baseRequirement ||
    !can(cost)
  ) {
    return;
  }


  /*
   * 支払い
   */
  pay(cost);


  /*
   * レベルアップ
   */
  S.fac[id] =
    nextLevel;


  /*
   * 防具
   */
  if (id === 'armor') {

    if (nextLevel === 1) {

      S.maxLife = 120;
      S.life += 20;

    }

    else {

      S.maxLife = 150;
      S.life += 30;

    }

  }


  /*
   * 上限を超えない
   */
  S.life =
    Math.min(
      S.life,
      S.maxLife
    );


  render();

  buildUI();

  toast(
    `${def[1]} Lv${nextLevel}`
  );

}


/* =========================================================
   施設表示
========================================================= */

function renderFacilities() {

  $('facilities').innerHTML =
    defs
      .map(def => {

        const id = def[0];

        return `
          <div class="facility">

            <div class="icon">
              ${def[1]}
            </div>

            <h3>
              Lv${S.fac[id]}
            </h3>

          </div>
        `;

      })
      .join('');

}


/* =========================================================
   食材図鑑表示
========================================================= */

function renderBook() {

  $('book').innerHTML =
    foods
      .map(food => {

        const discovered =
          !!S.book[food[0]];

        return `
          <div
            class="book-card ${
              discovered
                ? ''
                : 'locked'
            }"
          >

            <div class="food-art">

              ${
                discovered
                  ? food[2]
                  : '?'
              }

            </div>

            <div>

              ${
                discovered
                  ? food[1]
                  : '？？？'
              }

            </div>

          </div>
        `;

      })
      .join('');

}


/* =========================================================
   イベント
========================================================= */


/*
 * START
 */
$('start').onclick = () => {

  $('title').hidden = true;
  $('game').hidden = false;

  init();

  showBaseView();

  render();

};


/*
 * 食べる
 */
$('eat').onclick = eat;


/*
 * 探索画面へ
 */
$('exploreMode').onclick = () => {

  showExploreView();

};


/*
 * 拠点画面へ
 */
$('backToBase').onclick = () => {

  showBaseView();

};


/*
 * 探索確定
 */
$('confirmExplore').onclick =
  explore;


/*
 * 探索モーダルを閉じる
 */
$('modalClose').onclick = () => {

  closeModal(
    'exploreModal'
  );

};


$('cancelExplore').onclick = () => {

  closeModal(
    'exploreModal'
  );

};


/*
 * 施設開発
 */
$('buildBtn').onclick =
  buildUI;


/*
 * 食材図鑑
 */
$('bookBtn').onclick = () => {

  renderBook();

  showModal(
    'bookModal'
  );

};


/*
 * ログ消去
 */
$('clearLog').onclick = () => {

  $('log').innerHTML = '';

};


/*
 * モーダルの×ボタン
 */
document
  .querySelectorAll('.modalClose2')
  .forEach(button => {

    button.onclick = () => {

      const modal =
        button.closest(
          '.modal-backdrop'
        );

      if (modal) {

        closeModal(
          modal.id
        );

      }

    };

  });
