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

  gate: null,

  // ゲートを一度探索したか
  gateDiscovered: false,

  // 初回確定報酬の黄色宝石を受け取ったか
  gateRewardClaimed: false,

  // コンパスでゲートを起動したか
  gateActivated: false,

  pending: null,

  isExploring: false,

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
    rare: ['食料', 4]
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
    red: [1, 1],
    blue: [1, 1],
    damage: 20,
    rare: ['黄色い宝石', 1]
  },

  waste: {
    name: '荒地',
    icon: '🏜️',
    damage: 0,
    rare: ['食料', 2]
  },

  gate: {
    name: 'ゲート',
    icon: '🌀',
    damage: 0,
    rare: ['黄色い宝石', 1]
  },

};

/* =========================================================
   マップ地形画像
========================================================= */

const TERRAIN_IMAGES = {

  grass: [
    'images/map/grass_1.png',
    'images/map/grass_2.png',
    'images/map/grass_3.png',
    'images/map/grass_4.png'
  ],

  forest: [
    'images/map/forest_1.png',
    'images/map/forest_2.png'
  ],

  rock: [
    'images/map/rock_1.png',
    'images/map/rock_2.png',
    'images/map/rock_3.png',
    'images/map/rock_4.png'
  ],

  pond: [
    'images/map/pond_1.png',
    'images/map/pond_2.png',
    'images/map/pond_3.png',
    'images/map/pond_4.png'
  ],

  cave: [
    'images/map/cave_1.png',
    'images/map/cave_2.png',
    'images/map/cave_3.png',
    'images/map/cave_4.png'
  ],

  waste: [
    'images/map/waste_1.png',
    'images/map/waste_2.png',
    'images/map/waste_3.png',
    'images/map/waste_4.png'
  ],

  gate: [
    'images/map/gate.png'
  ]  

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
      'images/character_idle5.png',
      'images/character_idle4.png',
    ],

    // 各フレームの表示時間
    durations: [
      6000,  // 1枚目：じっとする
      450,   // 2枚目
      450,   // 3枚目
      8000,  // 5枚目：じっとする
      800,   // 4枚目：斜め上をみる
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

    durations: [
      300,
      300,
      300,
      300,
      300
    ]
  },

  discover: {
    // 専用差分ができるまでは待機画像を使用
    frames: [
      'images/character_idle1.png'
    ],

    durations: [
      550
    ]
  }

};


/* =========================================================
   探索背景
========================================================= */

const EXPLORATION_BACKGROUNDS = {
  grass: 'images/bg/explore_grass.png',
  forest: 'images/bg/explore_forest.png',
  pond: 'images/bg/explore_pond.png',
  rock: 'images/bg/explore_rock.png',

  // 専用背景がない地形は草原へフォールバック
  cave: 'images/bg/explore_grass.png',
  waste: 'images/bg/explore_grass.png',
  gate: 'images/bg/explore_grass.png'
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
  $('exploreSign').hidden = false;

  $('exploreView').classList.remove('active');
  $('baseView').classList.add('active');
}


function showExploreView() {
  $('baseView').hidden = true;
  $('exploreView').hidden = false;
  $('exploreSign').hidden = true;
  
  $('baseView').classList.remove('active');
  $('exploreView').classList.add('active');

  renderMap();
}


/* =========================================================
   ゲート生成
========================================================= */

function generateGate() {

  while (true) {

    const q = R(-MAP_RADIUS, MAP_RADIUS);
    const r = R(-MAP_RADIUS, MAP_RADIUS);

    const distance = D(
      { q, r },
      S.base
    );

    /*
     * 拠点から7～9マス
     */
    if (
      distance < 7 ||
      distance > 9
    ) {
      continue;
    }

    const tile = S.tiles.get(
      K(q, r)
    );

    /*
     * 特殊地形には置かない
     */
    if (
      !tile ||
      tile.t !== 'grass'
    ) {
      continue;
    }

    S.gate = {
      q,
      r
    };

    /*
    * 選ばれたマスをゲート地形に変更
    */
    tile.t = 'gate';
    tile.special = true;
    /*
    * ゲート画像は1種類なのでindexは0で固定　*/
    tile.imageIndex = 0;

    return;
  }
}

/* マップの外縁を作る　*/
function generateDarkTiles() {

  for (const tile of S.tiles.values()) {
    /*
     * 拠点からの距離
     */
    const distance = D(
      tile,
      S.base
    );


    /*
     * 距離10未満は暗闇にしない
     */
    if (distance < 10) {
      continue;
    }


    /*
     * ゲートは暗闇にしない
     */
    if (tile.t === 'gate') {
      continue;
    }


    /*
     * 外側ほど暗闇になりやすくする
     */
    let darkChance = 0;

    if (distance === 10) {
      darkChance = 0.40;
    }

    else if (distance === 11) {
      darkChance = 0.50;
    }

    else if (distance === 12) {
      darkChance = 0.70;
    }

    else if (distance === 13) {
      darkChance = 0.90;
    }

    else {
      darkChance = 1.00;
    }


    /*
     * 暗闇化
     */
    if (
      Math.random() < darkChance
    ) {
      tile.isDark = true;
    }

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

  S.gate = null;
  S.gateDiscovered = false;
  S.gateRewardClaimed = false;
  S.gateActivated = false;

  S.pending = null;
  S.isExploring = false;
  S.log = [];
  S.mapInitialized = false;


  /*
   * マップ全体を生成
   */
  for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) {
    for (let r = -MAP_RADIUS; r <= MAP_RADIUS; r++) {
      if ( D({ q, r }, S.base) > MAP_RADIUS ) {
        continue;
      }

      gen(q, r);
    }
  }

  /* 特殊地形を配置 */
  generateSpecialTerrains();

  /* ゲート位置決定 */
  generateGate();

 /* マップの外縁を決定 */
  generateDarkTiles();

  /*
   * 拠点を探索済みにする
   */
  const baseTile = S.tiles.get(
    K(S.base.q, S.base.r)
  );

  if (baseTile) {
    baseTile.seen = true;
  }

}


/* =========================================================
   マップ生成
========================================================= */

/* =========================================================
   基本マップ生成
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
    const baseImages = TERRAIN_IMAGES.grass || [];

    const baseTile = {
      q,
      r,
      t: 'grass',
      seen: true,
      isDark: false,
      imageIndex:
        baseImages.length > 0
          ? R(0, baseImages.length - 1)
          : 0
    };

    S.tiles.set(k, baseTile);

    return baseTile;

  }


  const distance = D(
    { q, r },
    S.base
  );


  /*
   * 基本は草原
   */
  let t = 'grass';


  /*
   * 荒地
   */
  if (
    Math.random() < 0.12
  ) {
    t = 'waste';
  }

  // マップイラストを1つ選ぶ
  const terrainImages = TERRAIN_IMAGES[t] || [];
  const imageIndex = terrainImages.length > 0 ? R(0, terrainImages.length - 1) : 0;

  const tile = {
    q,
    r,
    t,
    seen: false,
    isDark: false,
    imageIndex
  };

  S.tiles.set(k, tile);

  return tile;
}

/* =========================================================
   特殊地形配置
========================================================= */

/*
 * 配置可能なマスを取得
 */
function getSpecialCandidates(
  minDistance,
  maxDistance
) {

  const candidates = [];

  for (const tile of S.tiles.values()) {

    const distance = D(
      tile,
      S.base
    );

    /*
     * 距離範囲
     */
    if (
      distance < minDistance ||
      distance > maxDistance
    ) {
      continue;
    }

    /*
     * 草原だけを対象
     */
    if (tile.t !== 'grass' && tile.t !== 'waste') {
      continue;
    }

    /*
     * 既に特殊地形が置かれている
     */
    if (
      tile.special
    ) {
      continue;
    }

    candidates.push(tile);
  }

  return candidates;
}

/* =========================================================
   4マス特殊地形
========================================================= */

function placeCluster(
  terrain,
  minDistance,
  maxDistance
) {

  const candidates =
    getSpecialCandidates(
      minDistance,
      maxDistance
    );


  /*
   * 候補をランダムに並べる
   */
  candidates.sort(
    () => Math.random() - 0.5
  );


  for (const center of candidates) {

    /*
     * 中心マス
     */
    const cluster = [
      center
    ];


    /*
     * 中心に隣接するマスを探す
     */
    const neighbors =
      candidates
        .filter(tile =>
          D(tile, center) === 1
        )
        .sort(
          () => Math.random() - 0.5
        );


    /*
     * 4マスになるまで追加
     */
    for (
      const tile of neighbors
    ) {

      if (
        cluster.length >= 4
      ) {
        break;
      }

      cluster.push(tile);
    }


    /*
     * 4マス揃わなければ
     * 別の中心を試す
     */
    if (
      cluster.length < 4
    ) {
      continue;
    }


    /*
     * 配置
     */
    cluster.forEach(tile => {

      tile.t = terrain;
      tile.special = true;

    });


    return true;
  }


  return false;
}

/* =========================================================
   1マス特殊地形
========================================================= */

function placeSingle(
  terrain,
  minDistance,
  maxDistance
) {

  const candidates =
    getSpecialCandidates(
      minDistance,
      maxDistance
    );


  if (
    candidates.length === 0
  ) {
    return false;
  }


  const tile =
    candidates[
      R(
        0,
        candidates.length - 1
      )
    ];


  tile.t = terrain;
  tile.special = true;

  return true;
}

/* =========================================================
   特殊地形を指定数だけ配置
========================================================= */

function placeSpecialRepeated(
  placer,
  terrain,
  count,
  minDistance,
  maxDistance,
  maxAttempts = 50
) {

  let placed = 0;
  let attempts = 0;

  while (
    placed < count &&
    attempts < maxAttempts
  ) {

    const success =
      placer(
        terrain,
        minDistance,
        maxDistance
      );

    if (success) {
      placed++;
    }

    attempts++;
  }

  if (placed < count) {
    console.warn(
      `${terrain} の生成数が不足しています。` +
      `予定: ${count} / 実際: ${placed}`
    );
  }
}

/* =========================================================
   特殊地形を配置
========================================================= */

function generateSpecialTerrains() {

  /*
   * 森
   * 4マスセット × 2箇所
   * 拠点から2～4マス
   */
  placeSpecialRepeated(
    placeCluster,
    'forest',
    2,
    2,
    4
  );


  /*
   * 岩場
   * 4マスセット × 2箇所
   * 拠点から3～5マス
   */
  placeSpecialRepeated(
    placeCluster,
    'rock',
    2,
    3,
    5
  );


  /*
   * 池
   * 1マス × 4箇所
   * 拠点から3～6マス
   */
  placeSpecialRepeated(
    placeSingle,
    'pond',
    4,
    3,
    6
  );


  /*
   * 洞窟
   * 1マス × 4箇所
   * 拠点から4～6マス
   */
  placeSpecialRepeated(
    placeSingle,
    'cave',
    4,
    4,
    6
  );
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

  $('food').textContent = S.food;

  $('hungerText').textContent =
    `${S.hunger} / ${S.maxHunger}`;

  $('lifeText').textContent =
    `${S.life} / ${S.maxLife}`;


  $('hungerBar').style.width =
    `${S.hunger / S.maxHunger * 100}%`;

  $('lifeBar').style.width =
    `${Math.max(0, S.life) / S.maxLife * 100}%`;


  $('resources').innerHTML = `
    <div class="resource-item">
      <img src="images/UI/materials_grass.png" alt="草">
      <span>${S.grass}</span>
    </div>

    <div class="resource-item">
      <img src="images/UI/materials_wood.png" alt="木材">
      <span>${S.wood}</span>
    </div>

    <div class="resource-item">
      <img src="images/UI/materials_stone.png" alt="石材">
      <span>${S.stone}</span>
    </div>

    <div class="resource-item">
      <img src="images/UI/materials_fur.png" alt="毛皮">
      <span>${S.fur}</span>
    </div>

    <div class="resource-item">
      <img src="images/UI/materials_gem_red.png" alt="赤い宝石">
      <span>${S.red}</span>
    </div>

    <div class="resource-item">
      <img src="images/UI/materials_gem_blue.png" alt="青い宝石">
      <span>${S.blue}</span>
    </div>

    <div class="resource-item">
      <img src="images/UI/materials_gem_yellow.png" alt="黄色い宝石">
      <span>${S.yellow}</span>
    </div>
  `;

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
  const centerX = 1800;
  const centerY = 1800;

  const mapWidth = 3600;
  const mapHeight = 3600;


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

      const isAvailable =
        !isBase &&
        !tile.seen &&
        !tile.isDark &&
        isAdjacentToExplored(tile);

      const isDarkRevealed =
        tile.isDark &&
        isAdjacentToExplored(tile);

      const isgate =
        tile.t === 'gate' &&
        (
          tile.seen ||
          isAvailable
        );

      const x =
        centerX +
        q * 84;

      const y =
        centerY +
        r * 108 +
        q * 54;


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


      if (isBase) {
        e.classList.add('base');
      }


      if (isAvailable) {
        e.classList.add('available');
      }

      if (isDarkRevealed) {
        e.classList.add('dark');
      }

      if (isgate) {
        e.dataset.gate = 'true';
      }


      /*
       * 位置
       */
      e.style.left =
        `${x - 43}px`;

      e.style.top =
        `${y - 49}px`;


      /* =====================================================
        マス表示
      ===================================================== */

      let content = '';


      /*
      * 拠点
      */
      if (isBase) {

        content = `
          <div class="inside">

            <div class="terrain-icon">
              🏕️
            </div>

            <div>
              拠点
            </div>

          </div>
        `;

      }
      else if (isDarkRevealed) {
        content = '';
      }

      /*
      * 探索済み
      * または
      * 次に探索可能な未探索マス
      */
      else if (
        tile.seen ||
        isAvailable
      ) {

        const terrainImages = TERRAIN_IMAGES[tile.t] || [];
        const safeImageIndex =
          terrainImages.length > 0
            ? (tile.imageIndex || 0) % terrainImages.length
            : 0;

        const terrainImage =
          terrainImages[safeImageIndex];

        content = `
          <div class="terrain-layer">

            ${terrainImage ? `
               <img src="${terrainImage}" alt="${T[tile.t].name}" onerror="this.style.display='none';">
                `
                : ''
            }
          </div>
          <div class="inside terrain-label">${T[tile.t].name}</div>
        `;
      }


      /*
      * まだ探索できない未探索マス
      */
      else {
        e.classList.add('blocked');

        content = `
          <div class="fog-layer"></div>
        `;
      }
      // html描写
      e.innerHTML = content;

      /*
       * 探索可能マス
       */
      if (isAvailable) {
        e.addEventListener(
          'click',
          () => openExplore(tile)
        );
      }
      else if (
        S.gateDiscovered &&
        !S.gateActivated &&
        tile.t === 'gate'
      ) {
        e.style.cursor = 'pointer';

        e.addEventListener(
          'click',
          () => openGateControl(tile)
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

  const normalItems = [];
  const rareItems = [];


  /*
   * 通常素材
   */

  if (d.food) {
    normalItems.push(`
      <div class="resource-inline">
        <img
          src="images/UI/materials_food.png"
          alt="食料"
        >
        <span>
          ${d.food[0]}～${d.food[1]}
        </span>
      </div>
    `);
  }


  if (d.grass) {
    normalItems.push(`
      <div class="resource-inline">
        <img
          src="images/UI/materials_grass.png"
          alt="草"
        >
        <span>
          ${d.grass[0]}～${d.grass[1]}
        </span>
      </div>
    `);
  }


  if (d.wood) {
    normalItems.push(`
      <div class="resource-inline">
        <img
          src="images/UI/materials_wood.png"
          alt="木材"
        >
        <span>
          ${d.wood[0]}～${d.wood[1]}
        </span>
      </div>
    `);
  }


  if (d.stone) {
    normalItems.push(`
      <div class="resource-inline">
        <img
          src="images/UI/materials_stone.png"
          alt="石材"
        >
        <span>
          ${d.stone[0]}～${d.stone[1]}
        </span>
      </div>
    `);
  }


  if (d.red) {
    normalItems.push(`
      <div class="resource-inline">
        <img
          src="images/UI/materials_gem_red.png"
          alt="赤い宝石"
        >
        <span>
          ${
            d.red[0] === d.red[1]
              ? `×${d.red[0]}`
              : `${d.red[0]}～${d.red[1]}`
          }
        </span>
      </div>
    `);
  }


  if (d.blue) {
    normalItems.push(`
      <div class="resource-inline">
        <img
          src="images/UI/materials_gem_blue.png"
          alt="青い宝石"
        >
        <span>
          ${
            d.blue[0] === d.blue[1]
              ? `×${d.blue[0]}`
              : `${d.blue[0]}～${d.blue[1]}`
          }
        </span>
      </div>
    `);
  }


  /*
   * レア素材
   */

  if (d.rare) {
    let rareImage = '';

    if (
      d.rare[0] === '食料' ||
      d.rare[0] === 'レア食料'
    ) {
      rareImage =
        'images/UI/materials_food.png';
    }

    else if (
      d.rare[0] === '毛皮'
    ) {
      rareImage =
        'images/UI/materials_fur.png';
    }

    else if (
      d.rare[0] === '赤い宝石'
    ) {
      rareImage =
        'images/UI/materials_gem_red.png';
    }

    else if (
      d.rare[0] === '青い宝石'
    ) {
      rareImage =
        'images/UI/materials_gem_blue.png';
    }

    else if (
      d.rare[0] === '黄色い宝石'
    ) {
      rareImage =
        'images/UI/materials_gem_yellow.png';
    }


    rareItems.push(`
      <div class="resource-inline rare-resource">
        <img
          src="${rareImage}"
          alt="${d.rare[0]}"
        >
        <span>?</span>
      </div>
    `);
  }


  return `
    <div class="resource-preview-normal">
      ${normalItems.join('')}
    </div>

    <div class="resource-preview-rare">
      ${rareItems.join('')}
    </div>
  `;
}
/* =========================================================
   探索モーダル
========================================================= */

function openExplore(tile) {
  if (S.isExploring) {
    return;
  }


  /*
   * 通常探索ボタンへ戻す
   */
  const confirmButton =
    $('confirmExplore');

  confirmButton.textContent =
    'ここを探索する';

  confirmButton.disabled =
    false;


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


  $('exploreTitle').textContent = '';

  const terrainImages =
    TERRAIN_IMAGES[tile.t] || [];

  const safeImageIndex =
    terrainImages.length > 0
      ? (tile.imageIndex || 0) % terrainImages.length
      : 0;

  const terrainImage =
    terrainImages[safeImageIndex];

  $('explorePreview').innerHTML = `
    <div class="target-icon">

      ${
        terrainImage
          ? `
            <img
              src="${terrainImage}"
              alt="${T[tile.t].name}"
            >
          `
          : T[tile.t].icon
      }

    </div>

    <div class="target-info">

      <strong>
        ${T[tile.t].name}
      </strong>

      <span>
        拠点から ${distance} マス
      </span>
    </div>

    <div class="target-costs">
      <span class="target-cost-item">
        <img
          src="images/UI/hunger.png"
          alt="食料"
        >
         -${cost}
      </span>

              ${
          S.hunger < cost
            ? `
              <small>
                ⚠ 空腹不足分もライフ減少
              </small>
            `
            : ''
        }

      <span class="target-cost-item">
        <img
          src="images/UI/life.png"
          alt="ライフ"
        >
         -${damage}
      </span>

    </div>
  `;

  $('resourcePreview').innerHTML =
    preview(tile);


  showModal('exploreModal');
}

/* =========================================================
   発見済みゲート操作
========================================================= */
function openGateControl(tile) {

  if (
    S.isExploring ||
    S.gateActivated ||
    !S.gateDiscovered
  ) {
    return;
  }


  S.pending = {
    mode: 'gateActivate',
    tile
  };


  $('exploreTitle').textContent =
    'ゲート';


  $('explorePreview').innerHTML = `
    <div class="target-icon">
      🌀
    </div>

    <div>
      ゲート発見済み・未起動
    </div>
  `;


  if (S.compass) {

    $('resourcePreview').innerHTML = `
      🧭 コンパスが強く反応している。<br>
      ゲートを起動できそうだ。
    `;

  }

  else {

    $('resourcePreview').innerHTML = `
      ゲートは反応しない。<br>
      🧭 起動にはコンパスが必要なようだ。
    `;

  }

  const button =
    $('confirmExplore');

  button.textContent =
    'ゲートを起動する';

  button.disabled =
    !S.compass;


  showModal(
    'exploreModal'
  );
}

/* =========================================================
   ゲート起動
========================================================= */

function activateGate() {

  /*
   * 二重起動防止
   */
  if (
    S.isExploring ||
    S.gateActivated
  ) {
    return;
  }


  /*
   * ゲート未発見なら起動不可
   */
  if (!S.gateDiscovered) {
    return;
  }


  /*
   * コンパス必須
   */
  if (!S.compass) {

    toast(
      'ゲートの起動にはコンパスが必要です'
    );

    return;
  }


  /*
   * 起動処理
   */
  S.isExploring = true;

  S.gateActivated = true;

  S.pending = null;


  closeModal(
    'exploreModal'
  );


  /*
   * コンパスは消費しない
   */


  /*
   * クリア
   */
  alert(
    'ゲートが起動した！ GAME CLEAR'
  );

  location.reload();
}

/* =========================================================
   探索演出ユーティリティ
========================================================= */

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}


function setExplorationBackground(terrainId) {
  const area = $('characterArea');

  if (!area) {
    return;
  }

  const background =
    EXPLORATION_BACKGROUNDS[terrainId] ||
    EXPLORATION_BACKGROUNDS.grass;

  area.style.backgroundImage =
    `url("${background}")`;
}


function resetCharacterPosition() {
  const area = $('characterArea');
  const char = $('char');

  if (!area || !char) {
    return;
  }

  char.style.transition = 'none';
  area.classList.remove('walking');

  void char.offsetWidth;

  char.style.transition = '';
}


function resetExploreAnimation() {
  const area = $('characterArea');
  const discoveryMark = $('discoveryMark');

  if (discoveryMark) {
    discoveryMark.hidden = true;
  }

  resetCharacterPosition();

  if (area) {
    area.style.backgroundImage = '';
  }

  startCharacterAnimation('idle');
}


/* =========================================================
   探索結果決定
========================================================= */

function createExploreResult(tile) {
  const terrain = T[tile.t];

  const result = {
    terrainId: tile.t,
    food: 0,
    grass: 0,
    wood: 0,
    stone: 0,
    red: 0,
    blue: 0,
    rare: null,
    discoveredFood: null,
    isRare: false,
    gateReward: false
  };

  if (terrain.food) {
    result.food = R(...terrain.food);
  }

  if (terrain.grass) {
    result.grass = R(...terrain.grass);
  }

  if (terrain.wood) {
    result.wood = R(...terrain.wood);
  }

  if (terrain.stone) {
    result.stone = R(...terrain.stone);
  }

  if (terrain.red) {
    result.red = R(...terrain.red);
  }

  if (terrain.blue) {
    result.blue = R(...terrain.blue);
  }

  if (
    terrain.rare &&
    Math.random() < 0.2
  ) {
    result.rare = {
      name: terrain.rare[0],
      amount: terrain.rare[1],
      rare: true
    };

    result.isRare = true;
  }

  const foundFoods =
    foods.filter(
      food =>
        food[2] === terrain.icon
    );

  if (
    foundFoods.length &&
    Math.random() < 0.35
  ) {
    result.discoveredFood =
      foundFoods[
        R(0, foundFoods.length - 1)
      ];
  }

  if (
    tile.t === 'gate' &&
    !S.gateRewardClaimed
  ) {
    result.gateReward = true;
  }

  return result;
}


/* =========================================================
   探索結果反映
========================================================= */

function applyExploreResult(result) {
  S.food += result.food;
  S.grass += result.grass;
  S.wood += result.wood;
  S.stone += result.stone;
  S.red += result.red;
  S.blue += result.blue;

if (result.rare) {
    const rareName = result.rare.name;
    const amount = result.rare.amount;

    if (rareName === '毛皮') {
      S.fur += amount;
    }

    if (rareName === '赤い宝石') {
      S.red += amount;
    }

    if (rareName === '青い宝石') {
      S.blue += amount;
    }

    if (rareName === '黄色い宝石') {
      S.yellow += amount;
    }

    if (rareName === '食料') {
      S.food += amount;
    }
  }

  if (
    result.gateReward &&
    !S.gateRewardClaimed
  ) {
    S.yellow += 1;
    S.gateRewardClaimed = true;
  }

  if (result.discoveredFood) {
    S.book[result.discoveredFood[0]] = 1;
  }

}


/* =========================================================
   探索アニメーション
========================================================= */

async function playExploreAnimation(terrainId, result) {
  const area = $('characterArea');
  const discoveryMark = $('discoveryMark');

  setExplorationBackground(terrainId);

  stopCharacterAnimation();
  startCharacterAnimation('walk');

  if (area) {
    area.classList.add('walking');
  }

  await wait(3000);

  stopCharacterAnimation();
  await wait(150);

  if (result.isRare) {
    startCharacterAnimation('discover');

    if (discoveryMark) {
      discoveryMark.hidden = false;
    }

    await wait(550);
  }
}


/* =========================================================
   探索実行
========================================================= */
async function explore() {

  /*
   * 二重実行防止
   */
  if (S.isExploring) {
    return;
  }


  const pending = S.pending;

  if (!pending) {
    return;
  }


  /*
   * ゲート起動
   */
  if (
    pending.mode === 'gateActivate'
  ) {

    activateGate();

    return;
  }


  S.isExploring = true;

  const tile = pending.tile;
  const terrain = T[tile.t];


  /* =====================================================
     探索結果を先に決定
  ===================================================== */
  const result = createExploreResult(tile);


  /* =====================================================
     探索開始
  ===================================================== */
  closeModal('exploreModal');
  showBaseView();

  /*
  * 移動中は探検看板を隠す
  */
  $('exploreSign').hidden = true;

  /*
   * 歩行・レア発見演出
   */
  await playExploreAnimation(tile.t,result);


  /* =====================================================
     空腹・ライフ
  ===================================================== */

  const shortage =
    Math.max(
      0,
      pending.cost - S.hunger
    );


  S.hunger =
    Math.max(
      0,
      S.hunger - pending.cost
    );


  S.life -=
    pending.damage +
    shortage;


  /* =====================================================
     獲得結果反映
  ===================================================== */

  applyExploreResult(
    result
  );


  /* =====================================================
     探索済み
  ===================================================== */

  tile.seen = true;

  /* =====================================================
     ログ
  ===================================================== */

  const distance =
    D(
      tile,
      S.base
    );


  S.log.unshift(
    `Day ${S.day}　` +
    `${terrain.name}を探索 ` +
    `(拠点から${distance}マス)`
  );


  /* =====================================================
     Day進行
  ===================================================== */
  S.day++;

  /* =====================================================
    拠点によるライフ回復
  ===================================================== */
  recoverLifeFromBase();

  /* =====================================================
     今回の探索先をクリア
  ===================================================== */

  S.pending = null;


  /* =====================================================
     ゲート・ゲームオーバー判定を保存
  ===================================================== */
  const exploredGate = tile.t === 'gate';

  if (exploredGate) {

    S.gateDiscovered = true;

    /*
    * コンパス所持時だけ、その場でゲート起動
    */
    if (
      S.compass &&
      !S.gateActivated
    ) {

      S.gateActivated = true;
      S.pendingGameClear = true;

    }

    else {

      S.pendingGameClear = false;

    }

  }

  else {

    S.pendingGameClear = false;

  }


  S.pendingGameOver =
    S.life <= 0;


  /* =====================================================
     画面更新
  ===================================================== */

  render();


  /* =====================================================
     結果表示
  ===================================================== */

  /*
   * ここでは探索演出をリセットしない。
   *
   * キャラクターは歩いた先で停止。
   * S.isExploring も true のまま。
   *
   * OKボタンを押したときに終了処理する。
   */
  showExploreResult(
    result
  );

}

/* =========================================================
   探索結果表示
========================================================= */
function showExploreResult(result) {

  const detail =
    $('exploreResultDetail');


  if (!detail) {
    return;
  }


  const items = [];


  /* =====================================================
     通常資源
  ===================================================== */

  if (result.food > 0) {

    items.push({
      icon: '🍖',
      name: '食料',
      amount: result.food,
      rare: false
    });

  }


  if (result.grass > 0) {

    items.push({
      icon: '🌿',
      name: '草',
      amount: result.grass,
      rare: false
    });

  }


  if (result.wood > 0) {

    items.push({
      icon: '🪵',
      name: '木材',
      amount: result.wood,
      rare: false
    });

  }


  if (result.stone > 0) {

    items.push({
      icon: '🪨',
      name: '石材',
      amount: result.stone,
      rare: false
    });

  }

  if (result.red > 0) {

    items.push({
      icon: '🔴',
      name: '赤い宝石',
      amount: result.red,
      rare: false
    });

  }


  if (result.blue > 0) {

    items.push({
      icon: '🔵',
      name: '青い宝石',
      amount: result.blue,
      rare: false
    });

  }

  /* =====================================================
     レア
  ===================================================== */
  if (result.rare) {

    const rareIcons = {

      '毛皮': '🧥',

      '赤い宝石': '🔴',

      '青い宝石': '🔵',

      '黄色い宝石': '🟡',

      '食料': '🍖'

    };


    items.push({

      icon:
        rareIcons[
          result.rare.name
        ] || '✨',

      name:
        result.rare.name,

      amount:
        result.rare.amount,

      rare: true

    });

    
  }

  /* =====================================================
     ゲートでの発見物
  ===================================================== */
  if (result.gateReward) {
    items.push({
      icon: '🟡',
      name: '黄色い宝石',
      amount: 1,
      rare: true
    });
  }

  /* =====================================================
     食材図鑑発見
  ===================================================== */

  if (result.discoveredFood) {

    items.push({

      icon: '📖',

      name:
        `新しい食材：${result.discoveredFood[1]}`,

      amount: null,

      rare: true

    });

  }


  /* =====================================================
     HTML生成
  ===================================================== */

  if (items.length === 0) {

    detail.innerHTML = `
      <div class="explore-result-empty">
        今回は何も見つからなかった……
      </div>
    `;

  }

  else {

    detail.innerHTML = `
      <div class="explore-result-list">

        ${
          items
            .map(item => {

              return `
                <div
                  class="
                    explore-result-item
                    ${item.rare ? 'rare' : ''}
                  "
                >

                  <span>
                    ${item.icon}
                    ${item.name}
                  </span>

                  ${
                    item.amount !== null
                      ? `
                        <strong>
                          ×${item.amount}
                        </strong>
                      `
                      : ''
                  }

                </div>
              `;

            })
            .join('')
        }

      </div>
    `;

  }


  showModal(
    'exploreResultModal'
  );

}

/* =========================================================
   1日経過時の拠点回復
========================================================= */
function recoverLifeFromBase() {

  const recovery =
    S.fac.base === 2
      ? 2
      : S.fac.base === 1
        ? 1
        : 0;


  if (recovery <= 0) {
    return;
  }


  S.life =
    Math.min(
      S.maxLife,
      S.life + recovery
    );

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

const FACILITIES = {
  base: {
    name: '拠点',
    icon: '🏕️',
    images: [
      'images/base_lv0.png',
      'images/base_lv1.png',
      'images/base_lv2.png'
    ],
    levels: [
      { name: '藁の寝床', cost: { grass: 5 }, effect: '1日ごとにライフ +1' },
      { name: '簡易小屋', cost: { grass: 10, wood: 5, stone: 2}, effect: '1日ごとにライフ +2' }
    ]
  },

  kitchen: {
    name: '食堂',
    icon: '🔥',
    images: [
      'images/kitchen_lv0.png',
      'images/kitchen_lv1.png',
      'images/kitchen_lv2.png'
    ],
    levels: [
      { name: '焚き火', cost: { wood: 5 }, effect: '食事回復量 10 → 12' },
      { name: '電気鍋', cost: { stone: 5, red: 1 }, effect: '食事回復量 12 → 15' }
    ]
  },

  weapon: {
    name: '武器',
    icon: '⚔️',
    images: [
      'images/weapon_lv0.png',
      'images/weapon_lv1.png',
      'images/weapon_lv2.png'
    ],
    levels: [
      { name: '木の棍棒', cost: { wood: 5 }, effect: '探索ダメージを20%軽減' },
      { name: '石の槍', cost: { stone: 5, fur: 1 }, effect: '探索ダメージを50%軽減' }
    ]
  },

  armor: {
    name: '防具',
    icon: '🛡️',
    images: [
      'images/armor_lv0.png',
      'images/armor_lv1.png',
      'images/armor_lv2.png'
    ],
    levels: [
      { name: '木の盾', cost: { wood: 5 }, effect: '最大ライフ 100 → 120' },
      { name: '石の盾', cost: { stone: 5, fur: 1 }, effect: '最大ライフ 120 → 150' }
    ]
  }
};

const RESOURCE_NAMES = {
  grass: '草',
  wood: '木材',
  stone: '石材',
  fur: '毛皮',
  red: '赤い宝石',
  blue: '青い宝石',
  yellow: '黄色い宝石'
};

function canPayCost(cost) {
  return Object.entries(cost).every(([key, amount]) => S[key] >= amount);
}

function payCost(cost) {
  Object.entries(cost).forEach(([key, amount]) => {
    S[key] -= amount;
  });
}

function costText(cost) {
  return Object.entries(cost)
    .map(([key, amount]) => `${RESOURCE_NAMES[key]} ×${amount}`)
    .join('　');
}

function imageWithFallback(src, alt, fallback) {
  return `
    <div class="facility-art-wrap">
      <img
        class="facility-image"
        src="${src}"
        alt="${alt}"
        onerror="this.hidden=true;this.nextElementSibling.hidden=false;"
      >
      <div class="facility-fallback" hidden>${fallback}</div>
    </div>
  `;
}

const SPECIAL_FACILITIES = {
  fridge: {
    name: '冷蔵庫',
    icon: '🧊',
    image: 'images/goods_fridge.png',
    cost: {
      yellow: 1,
      blue: 2,
      stone: 10
    },
    effect: '空腹最大値 +50'
  },

  compass: {
    name: 'コンパス',
    icon: '🧭',
    image: 'images/goods_compass.png',
    cost: {
      yellow: 1,
      blue: 1,
      red: 1
    },
    effect: 'ゲートの位置が分かる'
  }
};

/* =========================================================
   施設確認モーダル
========================================================= */

function openFacilityModal(id) {
  const facility = FACILITIES[id];
  if (!facility) return;

  const currentLevel = S.fac[id];
  const nextLevel = currentLevel + 1;

  $('facilityTitle').textContent = facility.name;

  if (nextLevel > facility.levels.length) {
    $('facilityDetail').innerHTML = `
      ${imageWithFallback(facility.images[currentLevel], facility.name, facility.icon)}
      <div class="facility-modal-copy">
        <strong>${facility.name} Lv${currentLevel}</strong>
        <p>最大レベルです。</p>
      </div>
    `;
    $('facilityUpgradeBtn').hidden = true;
    showModal('facilityModal');
    return;
  }

  const next = facility.levels[nextLevel - 1];
  const baseRequirement = id === 'base' || nextLevel <= S.fac.base;
  const affordable = canPayCost(next.cost);

  $('facilityDetail').innerHTML = `
    <div class="facility-upgrade-preview">
      <div>
        <small>現在</small>
        ${imageWithFallback(facility.images[currentLevel], `${facility.name} Lv${currentLevel}`, facility.icon)}
        <strong>Lv${currentLevel}</strong>
      </div>
      <div class="facility-arrow">→</div>
      <div>
        <small>レベルアップ後</small>
        ${imageWithFallback(facility.images[nextLevel], `${facility.name} Lv${nextLevel}`, facility.icon)}
        <strong>Lv${nextLevel}　${next.name}</strong>
      </div>
    </div>

    <div class="facility-modal-copy">
      <p><b>必要素材</b><br>${costText(next.cost)}</p>
      <p><b>効果</b><br>${next.effect}</p>
      ${!baseRequirement ? `<p class="facility-warning">先に拠点を Lv${nextLevel} にしてください。</p>` : ''}
      ${baseRequirement && !affordable ? '<p class="facility-warning">素材が足りません。</p>' : ''}
    </div>
  `;

  const button = $('facilityUpgradeBtn');
  button.textContent = 'レベルアップ';
  button.hidden = false;
  button.disabled = !baseRequirement || !affordable;
  button.onclick = () => upgradeFacility(id);

  showModal('facilityModal');
}

function upgradeFacility(id) {
  const facility = FACILITIES[id];
  if (!facility) return;

  const nextLevel = S.fac[id] + 1;
  const next = facility.levels[nextLevel - 1];
  if (!next) return;

  const baseRequirement = id === 'base' || nextLevel <= S.fac.base;
  if (!baseRequirement || !canPayCost(next.cost)) return;

  payCost(next.cost);
  S.fac[id] = nextLevel;

  if (id === 'armor') {
    if (nextLevel === 1) {
      S.maxLife = 120;
      S.life += 20;
    } else if (nextLevel === 2) {
      S.maxLife = 150;
      S.life += 30;
    }
    S.life = Math.min(S.life, S.maxLife);
  }

  closeModal('facilityModal');
  render();
  toast(`${facility.name} Lv${nextLevel}：${next.name}`);
}

function openSpecialFacilityModal(type) {
  const isFridge = type === 'fridge';
  const built = isFridge ? S.maxHunger > 100 : S.compass;
  const name = isFridge ? '冷蔵庫' : 'コンパス';
  const icon = isFridge ? '🧊' : '🧭';
  const image = isFridge ? 'images/goods_fridge.png' : 'images/goods_compass.png';
  const cost = isFridge
    ? { yellow: 1, blue: 2, stone: 10 }
    : { yellow: 1, blue: 1, red: 1 };
  const effect = isFridge ? '空腹最大値 +50' : 'ゲートの位置が分かる';

  $('facilityTitle').textContent = name;
  $('facilityDetail').innerHTML = `
    ${imageWithFallback(
      image,
      name,
      icon
    )}
    <div class="facility-modal-copy">
      <strong>${name}</strong>
      ${built
        ? '<p>建設済みです。</p>'
        : `<p><b>必要素材</b><br>${costText(cost)}</p><p><b>効果</b><br>${effect}</p>${!canPayCost(cost) ? '<p class="facility-warning">素材が足りません。</p>' : ''}`}
    </div>
  `;

  const button = $('facilityUpgradeBtn');
  button.hidden = built;
  button.disabled = built || !canPayCost(cost);
  button.textContent = '建設する';
  button.onclick = () => {
    if (!canPayCost(cost)) return;
    payCost(cost);
    if (isFridge) {
      S.maxHunger = 150;
    } else {
      S.compass = true;
    }
    closeModal('facilityModal');
    render();
    toast(`${name}を建設した`);
  };

  showModal('facilityModal');
}

/* =========================================================
   施設表示
========================================================= */

function renderFacilities() {

  const facilities = $('facilities');

  if (!facilities) {
    return;
  }

  /*
   * この配列の順番で施設を表示する
   *
   * 1段目：拠点・食堂・冷蔵庫
   * 2段目：武器・防具・コンパス
   */
  const facilityOrder = [
    'base',
    'kitchen',
    'fridge',
    'weapon',
    'armor',
    'compass'
  ];


  facilities.innerHTML =
    facilityOrder
      .map(id => {

        /*
        * 冷蔵庫
        */
        if (id === 'fridge') {

          return `
            <button class="facility" data-special-facility="fridge">
              <div class="facility-image-wrap">
                <img class="facility-image" src="images/goods_fridge.png" alt="冷蔵庫"
                  onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">

                <div class="facility-fallback" style="display:none">
                  🧊
                </div>
              </div>
              <div class="facility-name">冷蔵庫</div>
              <div class="facility-level">
                ${
                  S.maxHunger > 100
                    ? '建設済'
                    : '未建設'
                }
              </div>
            </button>
          `;
        }

        /*
        * コンパス
        */
        if (id === 'compass') {

          return `
            <button class="facility" data-special-facility="compass">
              <div class="facility-image-wrap">
                <img class="facility-image" src="images/goods_compass.png" alt="コンパス"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">

                <div class="facility-fallback" style="display:none">
                  🧭
                </div>
              </div>

              <div class="facility-name">コンパス</div>
              <div class="facility-level">
                ${
                  S.compass
                    ? '建設済'
                    : '未建設'
                }
              </div>
            </button>
          `;
        }

        /*
         * 通常施設
         */
        const facility =
          FACILITIES[id];

        if (!facility) {
          return '';
        }

        const level =
          S.fac[id];

        const image =
          facility.images[level];


        return `
          <button
            class="facility"
            data-facility="${id}"
          >

            <div class="facility-image-wrap">

              <img
                class="facility-image"
                src="${image}"
                alt="${facility.name}"
                onerror="
                  this.style.display='none';
                  this.nextElementSibling.style.display='flex';
                "
              >

              <div
                class="facility-fallback"
                style="display:none"
              >
                ${facility.icon}
              </div>

            </div>

            <div class="facility-name">
              ${facility.name}
            </div>

            <div class="facility-level">
              Lv${level}
            </div>

          </button>
        `;
      })
      .join('');


  /*
   * 通常施設クリック
   */
  document
    .querySelectorAll('[data-facility]')
    .forEach(button => {

      button.onclick = () => {
        openFacilityModal(
          button.dataset.facility
        );
      };

    });


  /*
   * 冷蔵庫・コンパスクリック
   */
  document
    .querySelectorAll('[data-special-facility]')
    .forEach(button => {

      button.onclick = () => {
        openSpecialFacilityModal(
          button.dataset.specialFacility
        );
      };

    });
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
$('exploreSign').onclick = () => {
  if (S.isExploring) {
    return;
  }

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



/* 施設確認モーダル */
$('facilityClose').onclick = () => closeModal('facilityModal');
$('facilityCancel').onclick = () => closeModal('facilityModal');

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

  /* =========================================================
   探索結果 OK
========================================================= */
$('exploreResultOk').onclick = () => {

  /*
   * 結果モーダルを閉じる
   */
  closeModal(
    'exploreResultModal'
  );


  /*
   * 探索演出をリセット
   *
   * ・キャラを通常位置へ
   * ・発見マーク削除
   * ・背景リセット
   * ・待機アニメーション再開
   */
  resetExploreAnimation();


  /*
   * 探索ロック解除
   */
  S.isExploring = false;


  /*
   * 拠点画面へ
   */
  showBaseView();


  /*
   * 最新状態を表示
   */
  render();


  /* =====================================================
     ゲームクリア
  ===================================================== */

  if (S.pendingGameClear) {

    S.pendingGameClear = false;

    alert(
      'ゲートが起動した！ GAME CLEAR'
    );

    location.reload();

    return;
  }


  /* =====================================================
     ゲームオーバー
  ===================================================== */

  if (S.pendingGameOver) {

    S.pendingGameOver = false;

    alert(
      'GAME OVER'
    );

    location.reload();

    return;
  }

};
