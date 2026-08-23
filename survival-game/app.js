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

  /* 拠点は固定 */
  base: {
    q: BASE_POS.q,
    r: BASE_POS.r
  },

  /* 主人公も拠点から動かさない */
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
   その他
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

function toast(s) {
  const e = $('toast');

  e.textContent = s;
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

  e.hidden = false;
  e.classList.add('show');
}


function closeModal(id) {
  const e = $(id);

  e.classList.remove('show');
  e.hidden = true;
}


/* =========================================================
   秘宝生成
   拠点から9～15マスの範囲
========================================================= */

function generateTreasure() {
  while (true) {
    const q = R(-MAP_RADIUS, MAP_RADIUS);
    const r = R(-MAP_RADIUS, MAP_RADIUS);

    const distance = D(
      { q, r },
      S.base
    );

    if (distance >= 9 && distance <= 15) {
      S.treasure = {
        q,
        r
      };

      return;
    }
  }
}


/* =========================================================
   マップ生成
========================================================= */

function init() {
  generateTreasure();

  /*
   * 拠点マスを先に生成
   */
  gen(S.base.q, S.base.r);

  /*
   * マップ全体を準備
   *
   * 実際の探索状態は seen:false のままなので、
   * 生成されていてもプレイヤーからは未知マスとして見える。
   */
  for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) {
    for (let r = -MAP_RADIUS; r <= MAP_RADIUS; r++) {
      if (D({ q, r }, S.base) > MAP_RADIUS) {
        continue;
      }

      gen(q, r);
    }
  }
}


/* =========================================================
   1マス生成
========================================================= */

function gen(q, r) {
  const k = K(q, r);

  if (S.tiles.has(k)) {
    return S.tiles.get(k);
  }

  /*
   * 拠点
   */
  if (q === S.base.q && r === S.base.r) {
    const c = {
      q,
      r,
      t: 'grass',
      seen: true
    };

    S.tiles.set(k, c);

    return c;
  }

  const distance = D(
    { q, r },
    S.base
  );

  let t = 'grass';

  if (distance > 0) {
    const opts = [];

    if (!S.special.forest && distance >= 2) {
      opts.push([
        'forest',
        Math.exp(-((distance - 3) ** 2) / 1.5)
      ]);
    }

    if (!S.special.pond && distance >= 3) {
      opts.push([
        'pond',
        Math.exp(-((distance - 4) ** 2) / 1.5)
      ]);
    }

    if (!S.special.rock && distance >= 4) {
      opts.push([
        'rock',
        Math.exp(-((distance - 5) ** 2) / 1.7)
      ]);
    }

    if (!S.special.cave && distance >= 5) {
      opts.push([
        'cave',
        0.7 * Math.exp(-((distance - 6) ** 2) / 2)
      ]);
    }

    opts.sort((a, b) => b[1] - a[1]);

    if (
      opts[0] &&
      Math.random() < opts[0][1] * 0.6
    ) {
      t = opts[0][0];

      S.special[t] = k;
    } else if (Math.random() < 0.12) {
      t = 'waste';
    } else if (
      Math.random() < 0.05 &&
      distance > 4
    ) {
      t = 'sea';
    }
  }

  const c = {
    q,
    r,
    t,
    seen: false
  };

  S.tiles.set(k, c);

  return c;
}


/* =========================================================
   全体描画
========================================================= */

function render() {
  $('log').innerHTML = (S.log || [])
    .slice(0, 6)
    .map(x => `<div class="log-item">${x}</div>`)
    .join('');

  $('day').textContent = S.day;

  $('hungerText').textContent =
    `${S.hunger} / ${S.maxHunger}`;

  $('lifeText').textContent =
    `${S.life} / ${S.maxLife}`;

  $('hungerBar').style.width =
    `${S.hunger / S.maxHunger * 100}%`;

  $('lifeBar').style.width =
    `${S.life / S.maxLife * 100}%`;

  $('resources').innerHTML =
    `🪵 ${S.wood}　` +
    `🪨 ${S.stone}　` +
    `🍖 ${S.food}　` +
    `🌿 ${S.grass}　` +
    `🧥 ${S.fur}　` +
    `🔴${S.red} ` +
    `🔵${S.blue} ` +
    `🟡${S.yellow}`;

  renderMap();
  renderFacilities();
  renderBook();
}


/* =========================================================
   マップ描画
========================================================= */

function renderMap() {
  const m = $('map');

  /*
   * CSSの overflow:hidden をJS側で上書きして、
   * マップをスクロール可能にする。
   */
  m.style.overflow = 'auto';
  m.style.position = 'relative';
  m.style.touchAction = 'pan-x pan-y';

  /*
   * マップ全体のサイズ
   */
  const centerX = 900;
  const centerY = 900;

  const mapWidth = 1800;
  const mapHeight = 1800;

  /*
   * 内部コンテナを作る
   */
  const world = document.createElement('div');

  world.style.position = 'relative';
  world.style.width = `${mapWidth}px`;
  world.style.height = `${mapHeight}px`;

  m.innerHTML = '';
  m.appendChild(world);

  /*
   * マップ全体を描画
   */
  for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) {
    for (let r = -MAP_RADIUS; r <= MAP_RADIUS; r++) {

      if (
        D(
          { q, r },
          S.base
        ) > MAP_RADIUS
      ) {
        continue;
      }

      const c = gen(q, r);

      const e = document.createElement('div');

      const isBase =
        q === S.base.q &&
        r === S.base.r;

      const isTreasure =
        S.compass &&
        S.treasure &&
        q === S.treasure.q &&
        r === S.treasure.r;

      /*
       * 六角形配置
       */
      const x =
        centerX +
        q * 84;

      const y =
        centerY +
        r * 70 +
        q * 35;

      e.className =
        'hex ' +
        (
          c.seen
            ? `explored ${c.t}`
            : 'unexplored'
        ) +
        (
          c.t === 'sea'
            ? ' blocked'
            : ''
        ) +
        (
          isBase
            ? ' base'
            : ''
        );

      /*
       * 拠点には特別な属性
       */
      if (isBase) {
        e.dataset.base = 'true';
      }

      /*
       * コンパス取得後は秘宝を表示
       */
      if (isTreasure) {
        e.dataset.treasure = 'true';
      }

      e.style.left = `${x - 43}px`;
      e.style.top = `${y - 49}px`;

      /*
       * 拠点・秘宝・通常地形の表示を分ける
       */
      let icon = '?';
      let name = '地形';

      if (isBase) {
        icon = '🏕️';
        name = '拠点';
      } else if (isTreasure) {
        icon = '✨';
        name = '秘宝';
      } else if (c.seen) {
        icon = T[c.t].icon;
        name = T[c.t].name;
      }

      e.innerHTML = `
        <div class="inside">
          <div class="terrain-icon">${icon}</div>
          <div>${name}</div>
        </div>
      `;

      /*
       * 隣接マスだけ探索可能
       *
       * 海と拠点は探索対象外
       */
      const adjacent =
        D(c, S.base) === 1;

      if (
        !isBase &&
        c.t !== 'sea' &&
        adjacent
      ) {
        e.classList.add('available');
        e.onclick = () => openExplore(c);
      }

      world.appendChild(e);
    }
  }

  /*
   * 初回表示時は拠点が中央に来るようにする
   */
  requestAnimationFrame(() => {
    m.scrollLeft =
      centerX - m.clientWidth / 2;

    m.scrollTop =
      centerY - m.clientHeight / 2;
  });
}


/* =========================================================
   探索プレビュー
========================================================= */

function preview(c) {
  const d = T[c.t];

  const a = [];

  if (d.food) {
    a.push(
      `🍖 食料 ${d.food[0]}～${d.food[1]}`
    );
  }

  if (d.grass) {
    a.push(
      `🌿 草 ${d.grass[0]}～${d.grass[1]}`
    );
  }

  if (d.wood) {
    a.push(
      `🪵 木材 ${d.wood[0]}～${d.wood[1]}`
    );
  }

  if (d.stone) {
    a.push(
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

    a.push(
      `❤️ 地形ダメージ ${
        Math.floor(d.damage * multiplier)
      }`
    );
  }

  a.push(
    `✨ レア：${d.rare[0]} ×${d.rare[1]}（10%）`
  );

  return a.join('<br>');
}


/* =========================================================
   探索モーダル
========================================================= */

function openExplore(c) {
  const distance =
    D(c, S.base);

  const cost =
    10 + distance * 5;

  const multiplier =
    S.fac.weapon === 2
      ? 0.5
      : S.fac.weapon === 1
        ? 0.8
        : 1;

  const dam =
    Math.floor(
      T[c.t].damage * multiplier
    );

  S.pending = {
    c,
    cost,
    dam
  };

  $('exploreTitle').textContent =
    T[c.t].name;

  $('explorePreview').innerHTML = `
    <div class="target-icon">
      ${T[c.t].icon}
    </div>

    <div>
      拠点から ${distance} マス
    </div>
  `;

  $('travelCost').innerHTML =
    `🍖 空腹 -${cost}　` +
    `❤️ ダメージ -${dam}` +
    (
      S.hunger < cost
        ? '　⚠ 空腹不足分もライフ減少'
        : ''
    );

  $('resourcePreview').innerHTML =
    preview(c);

  showModal('exploreModal');
}


/* =========================================================
   探索実行
========================================================= */

function explore() {
  const p = S.pending;

  if (!p) {
    return;
  }

  const c = p.c;
  const d = T[c.t];

  closeModal('exploreModal');

  $('char').textContent = '🏃';

  setTimeout(() => {
    $('char').textContent = '👨‍💼';

    /*
     * 空腹消費
     */
    const shortage =
      Math.max(
        0,
        p.cost - S.hunger
      );

    S.hunger =
      Math.max(
        0,
        S.hunger - p.cost
      );

    /*
     * ライフ減少
     */
    S.life -=
      p.dam + shortage;

    /*
     * 通常資源
     */
    if (d.food) {
      S.food += R(...d.food);
    }

    if (d.grass) {
      S.grass += R(...d.grass);
    }

    if (d.wood) {
      S.wood += R(...d.wood);
    }

    if (d.stone) {
      S.stone += R(...d.stone);
    }

    /*
     * レア素材
     */
    if (
      d.rare &&
      Math.random() < 0.1
    ) {
      const x = d.rare[0];

      if (x === '毛皮') {
        S.fur++;
      }

      if (x === '赤い宝石') {
        S.red++;
      }

      if (x === '青い宝石') {
        S.blue++;
      }

      if (x === '黄色い宝石') {
        S.yellow++;
      }

      if (x === 'レア食料') {
        S.food += d.rare[1];
      }

      toast(`レア素材：${x}`);
    }

    /*
     * 食材図鑑
     */
    const fs =
      foods.filter(
        x => x[2] === T[c.t].icon
      );

    if (
      fs.length &&
      Math.random() < 0.35
    ) {
      const f =
        fs[R(0, fs.length - 1)];

      S.book[f[0]] = 1;
    }

    /*
     * 探索済みにする
     */
    c.seen = true;

    /*
     * 主人公は移動しない
     * 拠点から探索するゲームなので、
     * S.pos は変更しない。
     */

    S.log.unshift(
      `Day ${S.day}　${T[c.t].name}を探索`
    );

    S.day++;

    /*
     * 秘宝発見
     */
    if (
      S.treasure &&
      c.q === S.treasure.q &&
      c.r === S.treasure.r
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
      alert('GAME OVER');

      location.reload();

      return;
    }

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

  const n =
    S.fac.kitchen === 2
      ? 15
      : S.fac.kitchen === 1
        ? 12
        : 10;

  S.food--;

  S.hunger =
    Math.min(
      S.maxHunger,
      S.hunger + n
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
   建設画面
========================================================= */

function buildUI() {
  let h = '';

  defs.forEach(d => {
    const lv = S.fac[d[0]];
    const n = lv + 1;

    if (n <= 2) {
      const a = d[2][n - 1];

      /*
       * 拠点Lv1だけは例外。
       * 初期状態でも建設可能。
       *
       * その他の施設は拠点Lvが必要。
       */
      const baseRequirement =
        d[0] === 'base'
          ? n <= 1
          : n <= S.fac.base;

      const ok =
        baseRequirement &&
        can(a);

      h += `
        <div class="build-row">
          <div>
            <h3>${d[1]} Lv${n}</h3>
            <p>${a[7]} / ${a[8]}</p>
          </div>

          <button
            data-b="${d[0]}"
            ${ok ? '' : 'disabled'}
          >
            建設
          </button>
        </div>
      `;
    }
  });

  /*
   * 冷蔵庫
   */
  h += `
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
  h += `
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

  $('buildList').innerHTML = h;

  showModal('buildModal');

  /*
   * 通常施設
   */
  document
    .querySelectorAll('[data-b]')
    .forEach(b => {
      b.onclick = () =>
        build(b.dataset.b);
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
  const d =
    defs.find(x => x[0] === id);

  if (!d) {
    return;
  }

  const n =
    S.fac[id] + 1;

  const a =
    d[2][n - 1];

  if (!a) {
    return;
  }

  /*
   * 拠点以外は拠点Lvが必要
   */
  const baseRequirement =
    id === 'base'
      ? n <= 1
      : n <= S.fac.base;

  if (
    !baseRequirement ||
    !can(a)
  ) {
    return;
  }

  pay(a);

  S.fac[id] = n;

  /*
   * 防具
   */
  if (id === 'armor') {
    S.maxLife =
      n === 1
        ? 120
        : 150;

    /*
     * 最大ライフが増えたときは
     * 現在ライフも同じ分だけ増やす。
     */
    S.life =
      Math.min(
        S.maxLife,
        S.life +
          (n === 1 ? 20 : 30)
      );
  }

  render();
  buildUI();

  toast(
    `${d[1]} Lv${n}`
  );
}


/* =========================================================
   施設表示
========================================================= */

function renderFacilities() {
  $('facilities').innerHTML =
    defs
      .map(d => `
        <div class="facility">
          <div class="icon">
            ${d[1]}
          </div>

          <h3>
            Lv${S.fac[d[0]]}
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
      .map(f => `
        <div
          class="book-card ${
            S.book[f[0]]
              ? ''
              : 'locked'
          }"
        >
          <div class="food-art">
            ${
              S.book[f[0]]
                ? f[2]
                : '?'
            }
          </div>

          <div>
            ${
              S.book[f[0]]
                ? f[1]
                : '？？？'
            }
          </div>
        </div>
      `)
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
  render();
};


/*
 * 食べる
 */
$('eat').onclick = eat;


/*
 * 探索
 */
$('confirmExplore').onclick = explore;


/*
 * 探索モーダル閉じる
 */
$('modalClose').onclick = () =>
  closeModal('exploreModal');

$('cancelExplore').onclick = () =>
  closeModal('exploreModal');


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
 * その他のモーダル閉じるボタン
 */
document
  .querySelectorAll('.modalClose2')
  .forEach(b => {
    b.onclick = () => {
      const modal =
        b.closest('.modal-backdrop');

      closeModal(modal.id);
    };
  });
