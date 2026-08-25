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
  log: [],

  day: 1,

  hunger: 100,
  maxHunger: 100,

  life: 100,
  maxLife: 100,

  food: 0,
  grass: 0,
  wood: 0,
  stone: 0,
  fur: 0,
  red: 0,
  blue: 0,
  yellow: 0,

  fac: {
    base: 0,
    kitchen: 0,
    weapon: 0,
    armor: 0
  },

  compass: false,

  base: {
    q: BASE_POS.q,
    r: BASE_POS.r
  },

  // 主人公は拠点に固定
  pos: {
    q: BASE_POS.q,
    r: BASE_POS.r
  },

  tiles: new Map(),

  book: {},

  special: {
    forest: null,
    pond: null,
    rock: null,
    cave: null
  },

  treasure: null,

  pending: null,

  // 探索画面を初めて開いたか
  mapInitialized: false
};


/* =========================================================
   地形
========================================================= */

const T = {
  grass: {
    name: '草原',
    icon: '🌿',
    food: [1, 2],
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
   キャラクターアニメーション
========================================================= */
const CHARACTER_ANIMATIONS = {

  idle: {
    frames: [
      'images/character_idle1.png',
      'images/character_idle2.png',
      'images/character_idle3.png',
      'images/character_idle4.png',
      'images/character_idle5.png'
    ],

    // 各フレームの表示時間
    durations: [
      3000,  // 1枚目：じっとする
      450,   // 2枚目
      450,   // 3枚目
      300,   // 4枚目
      3000   // 5枚目：じっとする
    ]
  },

  walk: {
    frames: [
      'images/character_walk1.png',
      'images/character_walk2.png',
      'images/character_walk3.png',
      'images/character_walk4.png',
      'images/character_walk5.png'
    ],

    // 移動中は今まで通り
    durations: [
      150,
      150,
      150,
      150,
      150
    ]
  }

};


let characterAnimationTimer = null;


/* =========================================================
   キャラクターアニメーション開始
========================================================= */

function startCharacterAnimation(type) {

  const char = $('char');

  if (!char) {
    return;
  }

  const animation =
    CHARACTER_ANIMATIONS[type];

  if (!animation) {
    return;
  }


  /*
   * 既存アニメーション停止
   */

  stopCharacterAnimation();


  let frame = 0;


  /*
   * 最初のフレーム
   */

  char.src =
    animation.frames[frame];


  /*
   * 次のフレームへ進む
   */

  function nextFrame() {

    frame++;

    if (frame >= animation.frames.length) {
      frame = 0;
    }


    char.src =
      animation.frames[frame];


    /*
     * 次のフレームまでの時間
     */

    characterAnimationTimer =
      setTimeout(
        nextFrame,
        animation.durations[frame]
      );
  }


  /*
   * 1枚目の表示時間
   */

  characterAnimationTimer =
    setTimeout(
      nextFrame,
      animation.durations[frame]
    );
}


/* =========================================================
   キャラクターアニメーション停止
========================================================= */

function stopCharacterAnimation() {

  if (characterAnimationTimer) {

    clearTimeout(
      characterAnimationTimer
    );

    characterAnimationTimer = null;
  }
}

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

  $('exploreView').classList.remove('active');
  $('baseView').classList.add('active');
}


function showExploreView() {
  $('baseView').hidden = true;
  $('exploreView').hidden = false;

  $('baseView').classList.remove('active');
  $('exploreView').classList.add('active');

  renderMap();
}


/* =========================================================
   秘宝生成
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
  S.mapInitialized = false;


  /*
   * マップ全体を生成
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
   * 拠点を探索済みにする
   */
  const baseTile = S.tiles.get(
    K(S.base.q, S.base.r)
  );

  if (baseTile) {
    baseTile.seen = true;
  }


  /*
   * 秘宝位置決定
   */
  generateTreasure();
}


/* =========================================================
   マップ生成
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
        0.7 * Math.exp(
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
   探索可能マス判定
========================================================= */

function isAdjacentToExplored(tile) {
  for (const explored of S.tiles.values()) {
    if (!explored.seen) {
      continue;
    }

    if (
      D(tile, explored) === 1
    ) {
      return true;
    }
  }

  return false;
}


/* =========================================================
   描画
========================================================= */

function render() {
  $('log').innerHTML =
    (S.log || [])
      .slice(0, 6)
      .map(
        x => `<div class="log-item">${x}</div>`
      )
      .join('');


  $('day').textContent = S.day;

  $('hungerText').textContent =
    `${S.hunger} / ${S.maxHunger}`;

  $('lifeText').textContent =
    `${S.life} / ${S.maxLife}`;


  $('hungerBar').style.width =
    `${S.hunger / S.maxHunger * 100}%`;

  $('lifeBar').style.width =
    `${Math.max(0, S.life) / S.maxLife * 100}%`;


  $('resources').innerHTML =
    `🪵 ${S.wood}　` +
    `🪨 ${S.stone}　` +
    `🍖 ${S.food}　` +
    `🌿 ${S.grass}　` +
    `🧥 ${S.fur}　` +
    `🔴${S.red} ` +
    `🔵${S.blue} ` +
    `🟡${S.yellow}`;


  renderFacilities();
  renderBook();
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
   * 現在のスクロール位置
   */
  const oldScrollLeft = map.scrollLeft;
  const oldScrollTop = map.scrollTop;

  const hadScroll =
    S.mapInitialized;


  /*
   * マップ全体
   */
  const centerX = 900;
  const centerY = 900;

  const mapWidth = 1800;
  const mapHeight = 1800;


  map.innerHTML = '';


  const world = document.createElement('div');

  world.className = 'hex-world';
  world.style.position = 'relative';
  world.style.width = `${mapWidth}px`;
  world.style.height = `${mapHeight}px`;
  map.appendChild(world);

  /*
   * マップ描画
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


      const isBase =
        q === S.base.q &&
        r === S.base.r;


      const isTreasure =
        S.compass &&
        S.treasure &&
        q === S.treasure.q &&
        r === S.treasure.r;


      const isAvailable =
        !isBase &&
        !tile.seen &&
        tile.t !== 'sea' &&
        isAdjacentToExplored(tile);


      const x =
        centerX +
        q * 84;

      const y =
        centerY +
        r * 70 +
        q * 35;


      const e =
        document.createElement('div');


      /*
       * クラス
       */
      e.className =
        'hex ' +
        (
          tile.seen
            ? `explored ${tile.t}`
            : 'unexplored'
        );


      if (tile.t === 'sea') {
        e.classList.add('blocked');
      }


      if (isBase) {
        e.classList.add('base');
      }


      if (isAvailable) {
        e.classList.add('available');
      }


      if (isTreasure) {
        e.dataset.treasure = 'true';
      }


      /*
       * 位置
       */
      e.style.left =
        `${x - 43}px`;

      e.style.top =
        `${y - 49}px`;


      /* * 表示  */
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
      else if (isAvailable) {
        // 探索可能だが、まだ未探索
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
       * 探索可能マス
       */
      if (isAvailable) {
        e.addEventListener(
          'click',
          () => openExplore(tile)
        );
      }


      world.appendChild(e);
    }
  }


  /*
   * 初回だけ拠点を中央表示
   */
  requestAnimationFrame(() => {
    if (!hadScroll) {
      map.scrollLeft =
        centerX -
        map.clientWidth / 2;

      map.scrollTop =
        centerY -
        map.clientHeight / 2;

      S.mapInitialized = true;
    }

    else {
      map.scrollLeft =
        oldScrollLeft;

      map.scrollTop =
        oldScrollTop;
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
   探索モーダル
========================================================= */

function openExplore(tile) {
  const distance = D(tile, S.base);
  // 拠点から離れる毎に消費が増える
  const cost = 10 + distance * 1;

  const multiplier =
    S.fac.weapon === 2
      ? 0.5
      : S.fac.weapon === 1
        ? 0.8
        : 1;

  const damage = Math.floor(T[tile.t].damage * multiplier);

  S.pending = {
    tile,
    cost,
    damage
  };


  $('exploreTitle').textContent =
    T[tile.t].name;


  $('explorePreview').innerHTML = `
    <div class="target-icon">
      ${T[tile.t].icon}
    </div>

    <div>
      拠点から ${distance} マス
    </div>
  `;


  $('travelCost').innerHTML =
    `🍖 空腹 -${cost}　` +
    `❤️ ダメージ -${damage}` +
    (
      S.hunger < cost
        ? '　⚠ 空腹不足分もライフ減少'
        : ''
    );


  $('resourcePreview').innerHTML =
    preview(tile);


  showModal('exploreModal');
}


/* =========================================================
   探索実行
========================================================= */

function explore() {

  const pending = S.pending;

  if (!pending) {
    return;
  }


  const tile = pending.tile;
  const terrain = T[tile.t];


  /* =====================================================
     探索開始
  ===================================================== */

  /* モーダルを閉じる */
  closeModal('exploreModal');


  /*
   * 探索画面から拠点画面へ戻る
   */
  showBaseView();


  /*
   * 主人公を探索中アニメーションにする
   */
  startCharacterAnimation('walk');


  /*
   * 3秒間、探索アニメーション
   */
  setTimeout(() => {


    /* =================================================
       探索終了
    ================================================= */

    /*
     * 主人公を待機アニメーションへ戻す
     */
    startCharacterAnimation('idle');


    /* =================================================
       空腹・ライフ
    ================================================= */

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
      pending.damage +
      shortage;


    /* =================================================
       資源獲得
    ================================================= */

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


    /* =================================================
       レア素材
    ================================================= */

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
        S.food += terrain.rare[1];
      }


      toast(
        `レア素材：${rareName}`
      );

    }


    /* =================================================
       食材図鑑
    ================================================= */

    const foundFoods =
      foods.filter(
        food =>
          food[2] === terrain.icon
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


    /* =================================================
       探索済みにする
    ================================================= */

    tile.seen = true;


    /* =================================================
       探索ログ
    ================================================= */

    const distance =
      D(tile, S.base);


    S.log.unshift(
      `Day ${S.day}　` +
      `${terrain.name}を探索 ` +
      `(拠点から${distance}マス)`
    );


    /* =================================================
       Day進行
    ================================================= */

    S.day++;


    /* =================================================
       探索先をクリア
    ================================================= */

    S.pending = null;


    /* =================================================
       秘宝発見
    ================================================= */

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


    /* =================================================
       ゲームオーバー
    ================================================= */

    if (S.life <= 0) {

      alert(
        'GAME OVER'
      );


      location.reload();

      return;
    }


    /* =================================================
       拠点画面を更新
    ================================================= */

    render();


  }, 3000);
}

/* =========================================================
   食べる
========================================================= */

function eat() {
  if (!S.food) {
    toast('食料がありません');
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


  $('char').textContent = '🍖';


  setTimeout(() => {
    $('char').textContent = '👨‍💼';
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
   施設UI
========================================================= */

function buildUI() {
  let html = '';


  defs.forEach(def => {
    const id = def[0];
    const level = S.fac[id];
    const nextLevel = level + 1;


    if (nextLevel > 2) {
      return;
    }


    const cost =
      def[2][nextLevel - 1];


    /*
     * 拠点Lv1は最初から作成可能。
     * その他は拠点レベルが条件。
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

        <h3>冷蔵庫</h3>

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

        <h3>コンパス</h3>

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


  $('buildList').innerHTML = html;

  showModal('buildModal');


  document
    .querySelectorAll('[data-b]')
    .forEach(button => {
      button.onclick = () =>
        build(button.dataset.b);
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
    defs.find(x => x[0] === id);

  if (!def) {
    return;
  }


  const nextLevel =
    S.fac[id] + 1;

  const cost =
    def[2][nextLevel - 1];


  if (!cost) {
    return;
  }


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


  pay(cost);

  S.fac[id] = nextLevel;


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

    S.life =
      Math.min(
        S.life,
        S.maxLife
      );
  }


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
      .map(def => `
        <div class="facility">

          <div class="icon">
            ${def[1]}
          </div>

          <h3>
            Lv${S.fac[def[0]]}
          </h3>

        </div>
      `)
      .join('');
}


/* =========================================================
   食材図鑑
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

  startCharacterAnimation('idle');
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
$('confirmExplore').onclick = explore;


/*
 * 探索モーダル閉じる
 */
$('modalClose').onclick = () => {
  closeModal('exploreModal');
};


$('cancelExplore').onclick = () => {
  closeModal('exploreModal');
};


/*
 * 施設開発
 */
$('buildBtn').onclick = buildUI;


/*
 * 食材図鑑
 */
$('bookBtn').onclick = () => {
  renderBook();
  showModal('bookModal');
};


/*
 * ログ消去
 */
$('clearLog').onclick = () => {
  $('log').innerHTML = '';
};


/*
 * モーダル閉じる
 */
document
  .querySelectorAll('.modalClose2')
  .forEach(button => {
    button.onclick = () => {
      const modal =
        button.closest('.modal-backdrop');

      if (modal) {
        closeModal(modal.id);
      }
    };
  });
