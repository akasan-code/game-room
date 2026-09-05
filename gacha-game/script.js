const stage = document.getElementById('summonStage');
const screen = document.querySelector('.screen');
const result = document.getElementById('resultCard');
const rarityEl = document.getElementById('resultRarity');
const tapText = document.getElementById('tapText');
const closeBtn = document.getElementById('closeResult');
const buttons = [...document.querySelectorAll('.summon-btn')];

const orb = document.querySelector('.orb');
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

let running = false;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const RARITY_RATES = [
  { rarity:'UR', rate:0.01 },
  { rarity:'SR', rate:0.05 },
  { rarity:'R',  rate:0.24 },
  { rarity:'N',  rate:0.70 }
];

const COLOR_REVEAL_CHANCE = {
  N:0,
  R:0.60,
  SR:0.45,
  UR:0.35
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

function shouldRevealRarityColor(rarity) {
  return Math.random() < COLOR_REVEAL_CHANCE[rarity];
}

function pickCard() {
  return CARDS[Math.floor(Math.random() * CARDS.length)];
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

function clearState() {
  stage.classList.remove(
    'phase-start','phase-activate','phase-charge','phase-orb',
    'phase-color-reveal','phase-confirm','phase-release'
  );

  clearRarityClasses(stage);
  clearRarityClasses(result);
  clearRarityClasses(cardEjectLayer);
  clearRarityClasses(ejectCard);
  clearRarityClasses(resultLayeredCard);

  screen.classList.remove('summon-running');
  result.classList.remove('show','afterglow','twelve-mode');
  cardEjectLayer.classList.remove('show','play');

  singleResult.style.display = '';
  tenResult.classList.remove('show');
  tenCardGrid.innerHTML = '';
}

async function playCardEject(card, rarity) {
  applyCardData(card, rarity);
  applyResultRarity(rarity);

  cardEjectLayer.classList.remove('show','play');
  void cardEjectLayer.offsetWidth;

  cardEjectLayer.classList.add('show','play');
  await wait(1250);

  cardEjectLayer.classList.remove('show','play');
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

function showSingleResult(card, rarity) {
  result.classList.remove('twelve-mode');
  singleResult.style.display = '';
  tenResult.classList.remove('show');

  applyCardData(card, rarity);
  applyResultRarity(rarity);

  result.classList.add('show');
  setTimeout(() => result.classList.add('afterglow'), 300);
}

function showTenResult(results) {
  result.classList.add('twelve-mode');
  singleResult.style.display = 'none';
  tenResult.classList.add('show');
  tenCardGrid.innerHTML = '';

  results.forEach((item, index) => {
    tenCardGrid.appendChild(createTenCard(item.card, item.rarity, index));
  });

  result.classList.add('show');
}

async function playSummonAnimation(displayRarity, revealColor) {
  setOrbColor('N');

  screen.classList.add('summon-running');
  stage.classList.add('phase-start');
  tapText.textContent = '召喚術式を展開…';
  await wait(450);

  stage.classList.remove('phase-start');
  stage.classList.add('phase-activate');
  tapText.textContent = '召喚装置 起動';
  await wait(900);

  stage.classList.remove('phase-activate');
  stage.classList.add('phase-charge');
  tapText.textContent = '魔力を集積中…';
  await wait(1200);

  stage.classList.remove('phase-charge');
  stage.classList.add('phase-orb');
  tapText.textContent = '召喚球 出現';
  await wait(500);

  if (revealColor && displayRarity !== 'N') {
    stage.classList.add('phase-color-reveal');
    setOrbColor(displayRarity);
    tapText.textContent = `${displayRarity}反応`;
    await wait(650);
  } else {
    tapText.textContent = '召喚反応を維持…';
    await wait(450);
  }

  if (displayRarity === 'UR' && revealColor) {
    stage.classList.remove('phase-orb');
    stage.classList.add('phase-confirm');
    tapText.textContent = '――最高位召喚反応――';
    await wait(900);
  }

  stage.classList.remove('phase-orb','phase-color-reveal','phase-confirm');
  stage.classList.add('phase-release');
  tapText.textContent = 'カード排出';
  await wait(700);
}

async function summon(count = 1) {
  if (running) return;

  running = true;
  buttons.forEach(b => b.disabled = true);
  clearState();

  try {
    if (count === 1) {
      const rarity = rollRarity();
      const revealColor = shouldRevealRarityColor(rarity);
      const card = pickCard();

      await playSummonAnimation(rarity, revealColor);
      await playCardEject(card, rarity);

      stage.classList.remove('phase-release');
      screen.classList.remove('summon-running');

      showSingleResult(card, rarity);
    } else {
      /*
        12連：
        ・召喚演出は1回
        ・結果は12枚まとめて表示
        ・3段 × 4枚
      */
      const results = Array.from({ length: 12 }, () => ({
        rarity: rollRarity(),
        card: pickCard()
      }));

      /*
        オーブ演出は12枚の中で最も高いレア度を基準にする。
        ただし色変化は従来どおり確率判定。
      */
      const rarityRank = { N:0, R:1, SR:2, UR:3 };
      const highest = results.reduce((best, item) =>
        rarityRank[item.rarity] > rarityRank[best.rarity] ? item : best
      );

      const revealColor = shouldRevealRarityColor(highest.rarity);

      await playSummonAnimation(highest.rarity, revealColor);

      stage.classList.remove('phase-release');
      screen.classList.remove('summon-running');

      showTenResult(results);
    }

    tapText.textContent = '✦ タップで召喚開始 ✦';
  } finally {
    running = false;
    buttons.forEach(b => b.disabled = false);
  }
}

buttons.forEach(button => {
  button.addEventListener('click', () => {
    summon(Number(button.dataset.count));
  });
});

stage.addEventListener('click', () => summon(1));

closeBtn.addEventListener('click', () => {
  clearState();
});
