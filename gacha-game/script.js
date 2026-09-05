const stage = document.getElementById('summonStage');
const screen = document.querySelector('.screen');
const result = document.getElementById('resultCard');
const rarityEl = document.getElementById('resultRarity');
const tapText = document.getElementById('tapText');
const closeBtn = document.getElementById('closeResult');
const buttons = [...document.querySelectorAll('.summon-btn')];

const orb = document.querySelector('.orb');
const orbCrack = document.getElementById('orbCrack');
const revealBurst = document.getElementById('revealBurst');
const aura = document.querySelector('.aura');
const lowerFx = document.querySelector('.lower-fx');

const cardEjectLayer = document.getElementById('cardEjectLayer');
const ejectCard = document.getElementById('ejectCard');
const resultLayeredCard = document.getElementById('resultLayeredCard');

const ejectCharacter = document.getElementById('ejectCharacter');
const resultCharacter = document.getElementById('resultCharacter');
const ejectRarity = document.getElementById('ejectRarity');
const resultCardRarity = document.getElementById('resultCardRarity');
const ejectName = document.getElementById('ejectName');
const resultCardName = document.getElementById('resultCardName');

const ejectFrameSizing = document.getElementById('ejectFrameSizing');
const ejectFrameOverlay = document.getElementById('ejectFrameOverlay');
const resultFrameSizing = document.getElementById('resultFrameSizing');
const resultFrameOverlay = document.getElementById('resultFrameOverlay');

const singleResult = document.getElementById('singleResult');
const tenResult = document.getElementById('tenResult');
const tenCardGrid = document.getElementById('tenCardGrid');
const acquisitionReveal = document.getElementById('acquisitionReveal');
const acquisitionCharacter = document.getElementById('acquisitionCharacter');
const acquisitionRarity = document.getElementById('acquisitionRarity');
const acquisitionTapGuide = document.getElementById('acquisitionTapGuide');

let running = false;
let awaitingTap = false;
let tapResolve = null;
let awaitingAcquisitionTap = false;
let acquisitionTapResolve = null;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const imagePreloadCache = new Map();

function preloadImage(src) {
  if (!src) return Promise.resolve();

  if (imagePreloadCache.has(src)) {
    return imagePreloadCache.get(src);
  }

  const promise = new Promise(resolve => {
    const img = new Image();

    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;

    if (img.complete) {
      resolve();
    }
  });

  imagePreloadCache.set(src, promise);
  return promise;
}

async function preloadCardAssets(card, rarity) {
  const frameSrc = FRAME_BY_RARITY[rarity] || FRAME_BY_RARITY.SR;

  await Promise.all([
    preloadImage(frameSrc),
    preloadImage(card.image)
  ]);
}

const RARITY_RATES = [
  { rarity:'UR', rate:0.03 },
  { rarity:'SR', rate:0.07 },
  { rarity:'R',  rate:0.25 },
  { rarity:'N',  rate:0.65 }
];

const ORB_START_RATES = {
  SR: [
    { color:'N',  rate:0.50, promotion:'blue-to-sr' },
    { color:'SR', rate:0.50, promotion:null }
  ],
  UR: [
    { color:'N',  rate:0.10, promotion:'blue-to-ur' },
    { color:'R',  rate:0.40, promotion:'purple-to-ur' },
    { color:'UR', rate:0.50, promotion:null }
  ]
};

const CRACK_IMAGES = {
  silver: [
    'assets/orb_crack_silver_1.png',
    'assets/orb_crack_silver_2.png',
    'assets/orb_crack_silver_3.png'
  ],
  gold: [
    'assets/orb_crack_gold_1.png',
    'assets/orb_crack_gold_2.png',
    'assets/orb_crack_gold_3.png'
  ]
};

const RARITY_COLORS = {
  N:'#58a8ff',
  R:'#d477ff',
  SR:'#dce5ef',
  UR:'#ffd46a'
};

const FRAME_BY_RARITY = {
  N:'assets/card_frame_n.png',
  R:'assets/card_frame_r.png',
  SR:'assets/card_frame_sr.png',
  UR:'assets/card_frame_ur.png'
};

const CARDS = [
  {
    id:'sample_001',
    name:'星導の魔導姫',
    image:'assets/sample_character.png'
  }
];

function rollRarity() {
  const r = Math.random();
  let total = 0;

  for (const item of RARITY_RATES) {
    total += item.rate;
    if (r < total) return item.rarity;
  }

  return 'N';
}

function weightedChoice(list) {
  const r = Math.random();
  let total = 0;

  for (const item of list) {
    total += item.rate;
    if (r < total) return item;
  }

  return list[list.length - 1];
}

function decideOrbStart(rarity) {
  if (rarity === 'N') {
    return { color:'N', promotion:null };
  }

  if (rarity === 'R') {
    return { color:'R', promotion:null };
  }

  return weightedChoice(ORB_START_RATES[rarity]);
}

function pickCard() {
  return CARDS[Math.floor(Math.random() * CARDS.length)];
}

function createResultItem() {
  const rarity = rollRarity();
  const orbStart = decideOrbStart(rarity);

  return {
    rarity,
    card: pickCard(),
    orbStartColor: orbStart.color,
    promotion: orbStart.promotion
  };
}

function rarityClass(rarity) {
  return `rarity-${rarity.toLowerCase()}`;
}

function clearRarityClasses(target) {
  target.classList.remove('rarity-n','rarity-r','rarity-sr','rarity-ur');
}

function setOrbColor(rarity) {
  clearRarityClasses(stage);
  stage.classList.add(rarityClass(rarity));
}

function applyCardData(card, rarity) {
  const frameSrc = FRAME_BY_RARITY[rarity] || FRAME_BY_RARITY.SR;

  ejectCharacter.src = card.image;
  resultCharacter.src = card.image;

  ejectFrameSizing.src = frameSrc;
  ejectFrameOverlay.src = frameSrc;
  resultFrameSizing.src = frameSrc;
  resultFrameOverlay.src = frameSrc;

  ejectName.textContent = card.name;
  resultCardName.textContent = card.name;

  ejectRarity.textContent = rarity;
  resultCardRarity.textContent = rarity;

  [ejectCard, resultLayeredCard].forEach(cardEl => {
    clearRarityClasses(cardEl);
    cardEl.classList.add(rarityClass(rarity));
  });
}

function applyResultRarity(rarity) {
  clearRarityClasses(result);
  clearRarityClasses(cardEjectLayer);

  result.classList.add(rarityClass(rarity));
  cardEjectLayer.classList.add(rarityClass(rarity));

  rarityEl.textContent = rarity;
  rarityEl.style.color = RARITY_COLORS[rarity];

  [orb,aura,lowerFx].forEach(el => {
    el.style.filter = '';
  });
}

function clearOrbPhases() {
  stage.classList.remove(
    'phase-orb',
    'phase-color-reveal',
    'phase-confirm',
    'phase-release',
    'phase-device-blackout',
    'phase-ur-react',
    'phase-promotion'
  );

  hideCrack();
}

function clearState() {
  stage.classList.remove(
    'phase-start',
    'phase-activate',
    'phase-charge',
    'phase-await-tap',
    'phase-orb',
    'phase-color-reveal',
    'phase-confirm',
    'phase-release',
    'phase-device-blackout',
    'phase-ur-react',
    'phase-promotion'
  );

  clearRarityClasses(stage);
  clearRarityClasses(result);
  clearRarityClasses(cardEjectLayer);
  clearRarityClasses(ejectCard);
  clearRarityClasses(resultLayeredCard);

  screen.classList.remove('summon-running');
  result.classList.remove('show','afterglow','twelve-mode');
  cardEjectLayer.classList.remove('show','play','fast');
  cardEjectLayer.style.display = 'none';

  singleResult.style.display = '';
  tenResult.classList.remove('show');
  tenCardGrid.innerHTML = '';

  hideCrack();
  hideRevealBurst();
  stage.style.removeProperty('--orb-release-duration');

  awaitingTap = false;
  tapResolve = null;

  awaitingAcquisitionTap = false;
  acquisitionTapResolve = null;
  if (acquisitionReveal) {
    acquisitionReveal.classList.remove(
      'show',
      'rarity-n',
      'rarity-r',
      'rarity-sr',
      'rarity-ur'
    );
    acquisitionReveal.setAttribute('aria-hidden', 'true');
  }

  if (acquisitionCharacter) {
    acquisitionCharacter.removeAttribute('src');
  }
}

function waitForSummonTap() {
  awaitingTap = true;
  stage.classList.add('phase-await-tap');
  tapText.textContent = '✦ タップして召喚球を出現 ✦';

  return new Promise(resolve => {
    tapResolve = () => {
      if (!awaitingTap) return;

      awaitingTap = false;
      tapResolve = null;
      stage.classList.remove('phase-await-tap');
      resolve();
    };
  });
}

/*
  1〜3。
  ここまでは1連でも12連でも最初に1度だけ実行。
*/
async function playOpeningSequence() {
  setOrbColor('N');

  screen.classList.add('summon-running');

  // 1. 召喚開始
  stage.classList.add('phase-start');
  tapText.textContent = '';
  await wait(450);

  // 2. 装置起動
  stage.classList.remove('phase-start');
  stage.classList.add('phase-activate');
  tapText.textContent = '';
  await wait(900);

  // 3. 魔力集積
  stage.classList.remove('phase-activate');
  stage.classList.add('phase-charge');
  tapText.textContent = '';
  await wait(1200);

  /*
    3のあとで停止。
    プレイヤーのタップを待ってから4へ。
  */
  await waitForSummonTap();

  stage.classList.remove('phase-charge');
}


function hideCrack() {
  if (!orbCrack) return;

  orbCrack.classList.remove('show','crack-pop','crack-final');
  orbCrack.removeAttribute('src');
}


function hideRevealBurst() {
  if (!revealBurst) return;

  revealBurst.classList.remove('show','burst-sr','burst-ur','fast');
}

async function playPostReleaseBurst(rarity, fast = false) {
  if (!revealBurst) return;
  if (rarity !== 'SR' && rarity !== 'UR') return;

  hideRevealBurst();
  void revealBurst.offsetWidth;

  revealBurst.classList.add('show');
  revealBurst.classList.add(rarity === 'UR' ? 'burst-ur' : 'burst-sr');

  if (fast) {
    revealBurst.classList.add('fast');
  }

  const duration = fast
    ? (rarity === 'UR' ? 620 : 480)
    : (rarity === 'UR' ? 820 : 620);

  await wait(duration);
  hideRevealBurst();
}


async function showCrackSeries(type, {
  compact = false
} = {}) {
  const images = CRACK_IMAGES[type];
  if (!images || !orbCrack) return;

  stage.classList.add('phase-promotion');

  const timings = compact
    ? [170, 190, 240]
    : [340, 420, 520];

  for (let i = 0; i < images.length; i++) {
    orbCrack.classList.remove('show','crack-pop','crack-final');
    orbCrack.src = images[i];

    // 同じ要素のアニメーションを確実に再スタート
    void orbCrack.offsetWidth;

    orbCrack.classList.add('show','crack-pop');

    if (i === images.length - 1) {
      orbCrack.classList.add('crack-final');
    }

    await wait(timings[i]);
  }
}

async function reactUrDevice() {
  stage.classList.remove('phase-device-blackout');
  stage.classList.add('phase-ur-react');

  await wait(650);

  stage.classList.remove('phase-ur-react');
}

async function playBlueToSrPromotion() {
  // 青オーブを見せて「Nかも」と思わせる間
  await wait(650);

  // 銀亀裂：細い亀裂 → 増加 → 一気に全体へ
  await showCrackSeries('silver');

  // 亀裂の隙間から銀光が漏れ、殻が割れるようにSRへ
  stage.classList.add('phase-color-reveal');
  setOrbColor('SR');

  await wait(460);

  hideCrack();
  stage.classList.remove('phase-color-reveal','phase-promotion');

  // SR化後の余韻
  await wait(700);
}

async function playPurpleToUrPromotion() {
  // 紫オーブを0.5秒見せる
  await wait(650);

  // 金亀裂
  await showCrackSeries('gold');

  // ゴールド化
  stage.classList.add('phase-color-reveal');
  setOrbColor('UR');

  await wait(460);
  hideCrack();
  stage.classList.remove('phase-color-reveal','phase-promotion');

  // UR到達時は装置全体が0.3秒一斉反応
  await reactUrDevice();

  // ゴールド状態を0.8秒見せる
  await wait(1000);
}

async function playBlueToUrPromotion() {
  // 青オーブを0.5秒見せる
  await wait(650);

  // 最初はSR昇格と同じ銀亀裂
  await showCrackSeries('silver');

  // 装置全体消灯
  stage.classList.add('phase-device-blackout');
  hideCrack();
  stage.classList.remove('phase-promotion');

  // 0.5秒暗転
  await wait(500);

  // 暗闇の中で金亀裂だけ浮かび上がる。
  // 0.3秒の中で3段階を一気に見せる。
  await showCrackSeries('gold', { compact:true });

  // 0.3秒後、ゴールド化と同時に暗転終了・装置復活
  setOrbColor('UR');
  hideCrack();
  stage.classList.remove('phase-promotion');

  await reactUrDevice();

  // URの余韻
  await wait(1000);
}

async function playDirectUrArrival() {
  // 最初から金URでも、UR認識時の装置全体反応は共通
  await reactUrDevice();

  // 金色を認識できる余韻
  await wait(1000);
}


/*
  4以降の「1枚分」の演出。
  12連ではこの処理だけ12回繰り返す。
*/
async function playOneOrbResult(item, {
  index = 0,
  total = 1,
  fast = false
} = {}) {
  const {
    rarity,
    card,
    orbStartColor,
    promotion
  } = item;

  clearOrbPhases();

  /*
    初期オーブ色ルール
    N  : 青のみ
    R  : 紫のみ
    SR : 青50% / 銀50%
    UR : 青10% / 紫40% / 金50%
  */
  setOrbColor(orbStartColor);

  if (index > 0) {
    tapText.textContent = '';
    await wait(fast ? 180 : 220);
  }

  // 4. オーブ出現
  stage.classList.add('phase-orb');
  tapText.textContent = '';

  await wait(fast ? 450 : 650);

  /*
    1段階アップは存在しない。
    昇格は以下の3パターンだけ。
      青 → SR
      紫 → UR
      青 → UR
  */
  if (promotion === 'blue-to-sr') {
    await playBlueToSrPromotion();
  } else if (promotion === 'purple-to-ur') {
    await playPurpleToUrPromotion();
  } else if (promotion === 'blue-to-ur') {
    await playBlueToUrPromotion();
  } else if (rarity === 'UR' && orbStartColor === 'UR') {
    // 最初から金UR
    await playDirectUrArrival();
  } else {
    // N / R / 銀SR はその色を少し見せてから解放
    await wait(fast ? 420 : 600);
  }

  // 8. オーブ解放
  stage.classList.remove(
    'phase-orb',
    'phase-color-reveal',
    'phase-confirm',
    'phase-promotion',
    'phase-device-blackout',
    'phase-ur-react'
  );
  hideCrack();

  const releaseDurations = fast
    ? {
        N:520,
        R:720,
        SR:950,
        UR:1200
      }
    : {
        N:820,
        R:1050,
        SR:1280,
        UR:1550
      };

  const releaseDuration = releaseDurations[rarity] || releaseDurations.N;

  // CSS側のオーブ拡大・消失速度もレア度ごとに変える。
  stage.style.setProperty(
    '--orb-release-duration',
    `${releaseDuration}ms`
  );

  stage.classList.add('phase-release');
  tapText.textContent = '';

  await wait(releaseDuration);

  stage.classList.remove('phase-release');

  // オーブが消えた直後に、SR / URだけ追加の確定演出を入れる
  await playPostReleaseBurst(rarity, fast);

  /*
    9. カード排出の代わりに、
    取得イラストを直接・全画面で表示する。
  */
  await showAcquisitionReveal(item, index, total);

  stage.style.removeProperty('--orb-release-duration');
  clearRarityClasses(stage);
}

/*
  将来ここを「未所持カードだけ true」に変更する。
  現在は全カードを取得時に大きく表示する。
*/
function shouldShowAcquisitionReveal(item) {
  return true;
}

function waitForAcquisitionTap() {
  awaitingAcquisitionTap = true;

  return new Promise(resolve => {
    acquisitionTapResolve = () => {
      if (!awaitingAcquisitionTap) return;

      awaitingAcquisitionTap = false;
      acquisitionTapResolve = null;
      resolve();
    };
  });
}

async function showAcquisitionReveal(item, index = 0, total = 1) {
  if (!shouldShowAcquisitionReveal(item)) return;

  const { card, rarity } = item;

  /*
    カード枠は一切使わない。
    キャラクター画像だけ先読みして専用レイヤーへ直接表示する。
  */
  await preloadImage(card.image);

  acquisitionReveal.classList.remove(
    'show',
    'rarity-n',
    'rarity-r',
    'rarity-sr',
    'rarity-ur'
  );

  acquisitionReveal.classList.add(rarityClass(rarity));

  acquisitionCharacter.classList.add('preparing');
  acquisitionCharacter.src = card.image;

  acquisitionRarity.textContent = rarity;

  if (acquisitionTapGuide) {
    acquisitionTapGuide.textContent = total > 1
      ? `TAP  ${index + 1} / ${total}`
      : 'TAP';
  }

  /*
    src反映後に2フレーム待ってから表示。
    枠画像・layered-cardには一切依存しない。
  */
  await new Promise(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(resolve);
  }));

  acquisitionCharacter.classList.remove('preparing');

  acquisitionReveal.setAttribute('aria-hidden', 'false');
  acquisitionReveal.classList.add('show');

  await waitForAcquisitionTap();

  acquisitionReveal.classList.remove('show');
  acquisitionReveal.setAttribute('aria-hidden', 'true');

  await wait(200);

  acquisitionCharacter.removeAttribute('src');
}

async function playCardEject(card, rarity, fast = false) {
  /*
    前回カードの枠が一瞬見えないように、
    新しいキャラ画像とフレームを完全に読み込んでから差し替える。
  */
  cardEjectLayer.classList.remove('show','play','fast');
  ejectCard.classList.add('card-preparing');

  await preloadCardAssets(card, rarity);

  applyCardData(card, rarity);
  applyResultRarity(rarity);

  /*
    src差し替え後、ブラウザが1フレーム描画するまで非表示を維持。
  */
  await new Promise(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(resolve);
  }));

  ejectCard.classList.remove('card-preparing');

  void cardEjectLayer.offsetWidth;

  if (fast) {
    cardEjectLayer.classList.add('fast');
  }

  cardEjectLayer.classList.add('show','play');

  await wait(fast ? 900 : 1400);

  cardEjectLayer.classList.remove('show','play','fast');
}

function createTenCard(card, rarity, index) {
  const wrapper = document.createElement('div');
  wrapper.className = `ten-card-item ${rarityClass(rarity)}`;
  wrapper.style.setProperty('--card-index', index);

  const frameSrc = FRAME_BY_RARITY[rarity] || FRAME_BY_RARITY.SR;

  wrapper.innerHTML = `
    <div class="layered-card ten-layered-card ${rarityClass(rarity)}">
      <img class="card-frame-sizing" src="${frameSrc}" alt="">
      <div class="card-art-window">
        <img class="card-character" src="${card.image}" alt="${card.name}">
      </div>
      <img class="card-frame-overlay" src="${frameSrc}" alt="">
      <div class="card-rarity-label">${rarity}</div>
      <div class="card-nameplate">
        <div class="card-name">${card.name}</div>
      </div>
    </div>
  `;

  return wrapper;
}

async function showSingleResult(card, rarity) {
  result.classList.remove('twelve-mode');

  singleResult.style.display = '';
  tenResult.classList.remove('show');

  resultLayeredCard.classList.add('card-preparing');

  await preloadCardAssets(card, rarity);

  applyCardData(card, rarity);
  applyResultRarity(rarity);

  await new Promise(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(resolve);
  }));

  resultLayeredCard.classList.remove('card-preparing');

  result.classList.add('show');
  setTimeout(() => result.classList.add('afterglow'), 300);
}

async function showTenResult(results) {
  result.classList.add('twelve-mode');

  singleResult.style.display = 'none';
  tenResult.classList.remove('show');
  tenCardGrid.innerHTML = '';

  await Promise.all(
    results.map(item => preloadCardAssets(item.card, item.rarity))
  );

  results.forEach((item, index) => {
    tenCardGrid.appendChild(
      createTenCard(item.card, item.rarity, index)
    );
  });

  await new Promise(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(resolve);
  }));

  tenResult.classList.add('show');
  result.classList.add('show');
}

async function summon(count = 1) {
  if (running) return;

  running = true;
  buttons.forEach(button => button.disabled = true);
  clearState();

  try {
    /*
      抽選結果は開始時にまとめて作っておく。
      演出表示は1枚ごとに独立。
    */
    const results = Array.from(
      { length: count },
      () => createResultItem()
    );

    /*
      1〜3 → タップ待ち
    */
    await playOpeningSequence();

    if (count === 1) {
      /*
        1連：
        タップ → 4以降を1回 → 1枚結果表示
      */
      await playOneOrbResult(results[0], {
        index:0,
        total:1,
        fast:false
      });

      screen.classList.remove('summon-running');

      /*
        1連は、playOneOrbResult内の全画面取得表示が
        そのまま最終結果を兼ねる。
      */
    } else {
      /*
        12連：
        最初のタップ後、
        4 → 1枚排出 → 4 → 1枚排出…
        を12回自動で繰り返す。
      */
      for (let i = 0; i < results.length; i++) {
        await playOneOrbResult(results[i], {
          index:i,
          total:results.length,
          fast:true
        });
      }

      screen.classList.remove('summon-running');

      /*
        12枚すべて排出し終えたら一覧表示。
      */
      await showTenResult(results);
    }

    tapText.textContent = '✦ 召喚ボタンを選択 ✦';
  } finally {
    running = false;
    awaitingTap = false;
    tapResolve = null;
    buttons.forEach(button => button.disabled = false);
  }
}

/*
  フレーム4種はページ表示時に先読みしておく。
  2回目以降だけでなく、最初の召喚でも枠のチラつきを抑える。
*/
// 途中の枠つきカード排出演出は使用しない
cardEjectLayer.style.display = 'none';

Object.values(FRAME_BY_RARITY).forEach(preloadImage);
CARDS.forEach(card => preloadImage(card.image));

buttons.forEach(button => {
  button.addEventListener('click', () => {
    summon(Number(button.dataset.count));
  });
});

/*
  ステージタップ：
  ・魔力集積後なら「オーブ出現」のトリガー
  ・待機中なら従来どおり1連召喚開始
*/
stage.addEventListener('click', () => {
  // 召喚装置のタップは、魔力集積後の確定タップだけに使用する。
  // 待機画面から召喚を開始することはできない。
  if (awaitingTap && tapResolve) {
    tapResolve();
  }
});


acquisitionReveal.addEventListener('click', event => {
  if (!awaitingAcquisitionTap || !acquisitionTapResolve) return;

  event.preventDefault();
  acquisitionTapResolve();
});

closeBtn.addEventListener('click', event => {
  event.stopPropagation();

  if (awaitingAcquisitionTap) return;

  clearState();
  tapText.textContent = '✦ 召喚ボタンを選択 ✦';
});
