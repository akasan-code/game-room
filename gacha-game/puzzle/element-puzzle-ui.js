(() => {
  'use strict';

  const Data = window.ElementPuzzleData;
  const Core = window.ElementPuzzleCore;
  if (!Data || !Core) {
    console.error('[ElementPuzzle] 初期化モジュールがありません。');
    return;
  }

  const C = Core.PUZZLE_CONFIG;
  const $ = selector => document.querySelector(selector);
  const overlay = $('#elpOverlay');
  if (!overlay) return;

  const screens = [...overlay.querySelectorAll('[data-elp-screen]')];

  const closeButtons = [...overlay.querySelectorAll('[data-elp-close]')];
  const cardGrid = $('#elpCardGrid');
  const cardEmpty = $('#elpCardEmpty');
  const startButton = $('#elpStartButton');
  const selectionPreview = $('#elpSelectionPreview');

  const gameCardImage = $('#elpGameCardImage');
  const gameCardName = $('#elpGameCardName');
  const gameElementSymbol = $('#elpGameElementSymbol');
  const scoreEl = $('#elpScore');
  const highScoreEl = $('#elpHighScore');
  const gaugeFill = $('#elpGaugeFill');
  const gaugeText = $('#elpGaugeText');
  const skillButton = $('#elpSkillButton');
  const boardEl = $('#elpBoard');
  const chainEl = $('#elpChain');
  const gameMessage = $('#elpGameMessage');

  const cutin = $('#elpCutin');
  const cutinImage = $('#elpCutinImage');
  const cutinName = $('#elpCutinName');
  const cutinSymbol = $('#elpCutinSymbol');

  const finalScore = $('#elpFinalScore');
  const finalHighScore = $('#elpFinalHighScore');
  const finalCard = $('#elpFinalCard');
  const replayButton = $('#elpReplay');
  const backSelectButton = $('#elpBackSelect');

  let cards = [];
  let selectedCard = null;
  let board = [];
  let selectedIndex = null;
  let score = 0;
  let highScore = Data.getHighScore();
  let gauge = 0;
  let inputLocked = false;
  let sessionToken = 0;

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function showScreen(name) {
    screens.forEach(screen => {
      const active = screen.dataset.elpScreen === name;
      screen.hidden = !active;
      screen.classList.toggle('is-active', active);
    });
  }

  function openGame() {
    sessionToken++;
    cards = Data.getOwnedElementCards();
    selectedCard = null;
    selectedIndex = null;
    renderCardSelection();
    showScreen('select');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeGame() {
    sessionToken++;
    inputLocked = false;
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function rarityClass(rarity) {
    return `rarity-${String(rarity || 'N').toLowerCase()}`;
  }

  function renderCardSelection() {
    cardGrid.innerHTML = '';
    startButton.disabled = !selectedCard;

    if (!cards.length) {
      cardEmpty.hidden = false;
      selectionPreview.innerHTML = '<span>元素シリーズの所持カードがありません。</span>';
      return;
    }

    cardEmpty.hidden = true;

    cards.forEach(card => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `elp-card-choice ${rarityClass(card.rarity)}`;
      if (selectedCard?.id === card.id) button.classList.add('is-selected');

      button.innerHTML = `
        <div class="elp-card-choice-art">
          <img src="${card.image}" alt="${card.name}">
          <span class="elp-card-choice-symbol">${card.elementSymbol}</span>
        </div>
        <div class="elp-card-choice-meta">
          <strong>${card.name}</strong>
          <span>${card.rarity} ・ 所持 ${card.ownedCount}</span>
        </div>
      `;

      button.addEventListener('click', () => {
        selectedCard = card;
        startButton.disabled = false;
        selectionPreview.innerHTML = `
          <img src="${card.image}" alt="">
          <div><b>${card.elementSymbol}</b><span>${card.name}</span></div>
        `;
        renderCardSelection();
      });

      cardGrid.appendChild(button);
    });

    if (!selectedCard) {
      selectionPreview.innerHTML = '<span>使用する元素カードを1枚選択</span>';
    }
  }

  function startSelectedGame() {
    if (!selectedCard) return;
    beginGame(selectedCard);
  }

  function beginGame(card) {
    sessionToken++;
    selectedCard = card;
    selectedIndex = null;
    score = 0;
    gauge = 0;
    highScore = Data.getHighScore();
    inputLocked = false;
    board = Core.generateInitialBoard();

    gameCardImage.src = card.image;
    gameCardImage.alt = card.name;
    gameCardName.textContent = card.name;
    gameElementSymbol.textContent = card.elementSymbol;

    chainEl.classList.remove('show');
    gameMessage.textContent = '隣り合うピースを2つタップして入れ替え';
    updateHud();
    renderBoard();
    showScreen('game');
  }

  function updateHud() {
    scoreEl.textContent = score.toLocaleString();
    highScoreEl.textContent = Math.max(highScore, score).toLocaleString();

    const percent = Math.min(100, (gauge / C.SKILL_GAUGE_MAX) * 100);
    gaugeFill.style.width = `${percent}%`;
    gaugeText.textContent = `${gauge} / ${C.SKILL_GAUGE_MAX}`;

    const skillReady = gauge >= C.SKILL_GAUGE_MAX;
    skillButton.disabled = inputLocked || !skillReady;
    skillButton.classList.toggle('is-ready', skillReady);
  }

  function pieceMarkup(piece) {
    if (piece === 'element') {
      return `<span class="elp-piece-symbol">${selectedCard.elementSymbol}</span>`;
    }

    const marks = {
      crystal: '◆',
      rune: 'ᚱ',
      gem: '◇',
      arcane: '✦'
    };

    return `<span class="elp-piece-glyph">${marks[piece] || '?'}</span>`;
  }

  function renderBoard(options = {}) {
    const matched = options.matched || new Set();
    const skillTargets = options.skillTargets || new Set();

    boardEl.innerHTML = '';

    board.forEach((piece, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `elp-piece piece-${piece || 'empty'}`;
      button.dataset.index = index;
      button.disabled = inputLocked || piece == null;

      if (index === selectedIndex) button.classList.add('is-selected');
      if (matched.has(index)) button.classList.add('is-matched');
      if (skillTargets.has(index)) button.classList.add('is-skill-target');

      button.innerHTML = piece == null ? '' : pieceMarkup(piece);

      button.addEventListener('click', () => onPieceTap(index));
      boardEl.appendChild(button);
    });
  }

  async function onPieceTap(index) {
    if (inputLocked || !board[index]) return;

    if (selectedIndex == null) {
      selectedIndex = index;
      renderBoard();
      return;
    }

    if (selectedIndex === index) {
      selectedIndex = null;
      renderBoard();
      return;
    }

    if (!Core.isAdjacent(selectedIndex, index)) {
      selectedIndex = index;
      renderBoard();
      return;
    }

    const first = selectedIndex;
    selectedIndex = null;
    await attemptSwap(first, index);
  }

  async function attemptSwap(a, b) {
    const token = sessionToken;
    inputLocked = true;
    updateHud();

    Core.swap(board, a, b);
    renderBoard();
    await wait(C.SWAP_MS);
    if (token !== sessionToken) return;

    const matches = Core.findMatches(board);

    if (!matches.size) {
      Core.swap(board, a, b);
      renderBoard();
      gameMessage.textContent = 'マッチなし：交換を戻しました';
      await wait(C.SWAP_MS);
      inputLocked = false;
      updateHud();
      renderBoard();
      return;
    }

    await resolveCascades(matches, 1, true, token);
    if (token !== sessionToken) return;

    inputLocked = false;
    updateHud();
    renderBoard();
    checkGameOver();
  }

  async function resolveCascades(initialMatches, startChain, allowGauge, token) {
    let matches = initialMatches;
    let chain = startChain;

    while (matches.size) {
      showChain(chain);

      renderBoard({ matched: matches });
      await wait(C.MATCH_MS);
      if (token !== sessionToken) return;

      const removed = Core.clearMatches(board, matches);
      score += Core.scoreForRemoval(removed.length, chain);

      if (allowGauge) {
        const elementRemoved = Core.countPiece(removed, 'element');
        gauge = Math.min(C.SKILL_GAUGE_MAX, gauge + elementRemoved);
      }

      highScore = Math.max(highScore, score);
      updateHud();
      renderBoard();

      Core.collapseAndRefill(board);
      await wait(C.FALL_MS);
      if (token !== sessionToken) return;

      renderBoard();
      await wait(70);

      matches = Core.findMatches(board);
      chain++;
    }

    gameMessage.textContent = '盤面静止：次の手を選択';
  }

  function showChain(chain) {
    chainEl.textContent = `${chain} CHAIN`;
    chainEl.classList.remove('show');
    void chainEl.offsetWidth;
    chainEl.classList.add('show');
  }

  async function activateSkill() {
    if (inputLocked || gauge < C.SKILL_GAUGE_MAX || !selectedCard) return;

    const token = sessionToken;
    inputLocked = true;
    gauge = 0;
    updateHud();

    const targets = new Set();
    board.forEach((piece, index) => {
      if (piece === 'element') targets.add(index);
    });

    await playCutin(token);
    if (token !== sessionToken) return;

    renderBoard({ skillTargets: targets });
    await wait(C.TARGET_GLOW_MS);
    if (token !== sessionToken) return;

    // スキル直接消去ではゲージを増やさない。
    const removed = Core.clearMatches(board, targets);
    score += Core.scoreForRemoval(removed.length, 1);
    highScore = Math.max(highScore, score);
    updateHud();
    renderBoard();

    Core.collapseAndRefill(board);
    await wait(C.FALL_MS);
    if (token !== sessionToken) return;

    renderBoard();
    await wait(70);

    // 補充後に自然発生した連鎖は通常どおりゲージ加算。
    const cascade = Core.findMatches(board);
    if (cascade.size) {
      await resolveCascades(cascade, 1, true, token);
      if (token !== sessionToken) return;
    }

    inputLocked = false;
    updateHud();
    renderBoard();
    checkGameOver();
  }

  async function playCutin(token) {
    cutinImage.src = selectedCard.image;
    cutinImage.alt = selectedCard.name;
    cutinName.textContent = selectedCard.name;
    cutinSymbol.textContent = selectedCard.elementSymbol;

    cutin.classList.remove('is-active');
    void cutin.offsetWidth;
    cutin.classList.add('is-active');
    cutin.setAttribute('aria-hidden', 'false');

    await wait(C.CUTIN_MS);
    if (token !== sessionToken) return;

    cutin.classList.remove('is-active');
    cutin.setAttribute('aria-hidden', 'true');
  }

  function checkGameOver() {
    if (Core.hasLegalMove(board)) return;

    // 合法手がなくても、スキルがMAXならまだ続行可能。
    if (gauge >= C.SKILL_GAUGE_MAX) {
      gameMessage.textContent = '合法手なし。SKILLで盤面を変えられます。';
      return;
    }

    endGame();
  }

  function endGame() {
    inputLocked = true;
    highScore = Data.saveHighScore(score);

    finalScore.textContent = score.toLocaleString();
    finalHighScore.textContent = highScore.toLocaleString();
    finalCard.innerHTML = `
      <img src="${selectedCard.image}" alt="${selectedCard.name}">
      <div>
        <b>${selectedCard.elementSymbol}</b>
        <strong>${selectedCard.name}</strong>
        <span>${selectedCard.rarity}</span>
      </div>
    `;

    showScreen('over');
  }

  document.addEventListener('click', event => {
    if (event.target.closest('#openElementPuzzle')) {
      event.preventDefault();
      openGame();
    }
  });

  closeButtons.forEach(button => button.addEventListener('click', closeGame));
  startButton.addEventListener('click', startSelectedGame);
  skillButton.addEventListener('click', activateSkill);

  replayButton.addEventListener('click', () => {
    if (selectedCard) beginGame(selectedCard);
  });

  backSelectButton.addEventListener('click', () => {
    cards = Data.getOwnedElementCards();
    selectedCard = null;
    renderCardSelection();
    showScreen('select');
  });

  window.ElementPuzzleUI = Object.freeze({
    open: openGame,
    close: closeGame
  });
})();
