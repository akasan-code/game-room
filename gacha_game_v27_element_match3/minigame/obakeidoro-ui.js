(() => {
  'use strict';

  const Data = window.ObakeidoroCardData;
  const Core = window.ObakeidoroGameCore;
  if (!Data || !Core) {
    console.error('[Obakeidoro] 初期化に必要なモジュールがありません。');
    return;
  }

  const { CONFIG, ObakeidoroGame } = Core;
  const game = new ObakeidoroGame();
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const overlay = $('#obkOverlay');
  const openBtn = $('#openObakeidoroGame');
  const closeBtn = $('#obkClose');
  const screens = $$('.obk-screen');
  const dataNote = $('#obkDataNote');
  const cardGrid = $('#obkCardGrid');
  const cardTitle = $('#obkCardSelectTitle');
  const cardHelp = $('#obkCardSelectHelp');
  const selectionCount = $('#obkSelectionCount');
  const cardConfirm = $('#obkCardConfirm');
  const placementBoard = $('#obkPlacementBoard');
  const placementGuide = $('#obkPlacementGuide');
  const placementNext = $('#obkPlacementNext');
  const placementCards = $('#obkPlacementCards');
  const placementReset = $('#obkPlacementReset');
  const startHumanGame = $('#obkStartHumanGame');
  const gameBoard = $('#obkGameBoard');
  const gameCards = $('#obkGameCards');
  const searchesLeft = $('#obkSearchesLeft');
  const foundCount = $('#obkFoundCount');
  const gameLog = $('#obkGameLog');
  const turnLabel = $('#obkTurnLabel');
  const lanternAlert = $('#obkLanternAlert');
  const resultTitle = $('#obkResultTitle');
  const resultMessage = $('#obkResultMessage');
  const resultFound = $('#obkResultFound');
  const resultSearches = $('#obkResultSearches');
  const resultCards = $('#obkResultCards');
  const playAgain = $('#obkPlayAgain');
  const resultClose = $('#obkResultClose');

  let selectableCards = [];
  let selectedIds = new Set();
  let cpuToken = 0;
  let interactionLocked = false;

  const MAPS = [
    {
      id: 'school-night',
      name: '夜の学校',
      image: 'assets/minigame/maps/school_night.png'
    },
    {
      id: 'twilight-alley',
      name: '夕方の黄昏横丁',
      image: 'assets/minigame/maps/twilight_alley.png'
    },
    {
      id: 'ghost-graveyard',
      name: 'おばけ墓場',
      image: 'assets/minigame/maps/ghost_graveyard.png'
    }
  ];

  let currentMap = null;

  function chooseRandomMap() {
    const candidates = currentMap && MAPS.length > 1
      ? MAPS.filter(map => map.id !== currentMap.id)
      : MAPS;

    currentMap = candidates[Math.floor(Math.random() * candidates.length)];
    applyCurrentMap();
  }

  function applyCurrentMap() {
    if (!currentMap) return;

    const boards = [placementBoard, gameBoard];

    boards.forEach(board => {
      if (!board) return;
      board.style.setProperty('--obk-map-image', `url("${currentMap.image}")`);
      board.dataset.mapId = currentMap.id;
      board.setAttribute('aria-label',
        board === placementBoard
          ? `配置ボード：${currentMap.name}`
          : `探索ボード：${currentMap.name}`
      );
    });
  }

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function showScreen(name) {
    const target = screens.find(el => el.dataset.obkScreen === name);
    if (!target) return false;

    screens.forEach(el => {
      const active = el === target;
      el.hidden = !active;
      el.classList.toggle('is-active', active);
    });

    $('.obk-body')?.scrollTo({ top:0, behavior:'instant' });
    return true;
  }

  function rarityClass(rarity) {
    return `rarity-${String(rarity || 'N').toLowerCase()}`;
  }

  function cardMini(card) {
    return `<div class="obk-mini-card ${rarityClass(card.rarity)}">
      <div class="obk-mini-art"><img src="${card.image}" alt="${card.name}"></div>
      <div class="obk-mini-info"><strong>${card.name}</strong><span>${card.rarity}</span></div>
    </div>`;
  }

  function updateDataNote() {
    const h = Data.getCards('human');
    const g = Data.getCards('ghost');
    const humanReal = h.cards.filter(c => c.source === 'gacha').length;
    const ghostReal = g.cards.filter(c => c.source === 'gacha').length;
    dataNote.textContent = `所持カード: ニンゲン ${humanReal}枚 / オバケ ${ghostReal}枚` +
      ((h.usingSample || g.usingSample) ? '（不足分は仮カードで補完）' : '');
  }

  function openGame() {
    cpuToken++;
    interactionLocked = false;
    game.resetAll();
    selectedIds.clear();
    chooseRandomMap();
    showScreen('side');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    updateDataNote();
  }

  function closeGame() {
    cpuToken++;
    interactionLocked = false;
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
  }

  function chooseSide(side) {
    game.chooseSide(side);
    selectedIds.clear();
    const result = Data.getCards(side);
    selectableCards = result.cards;

    const required = side === 'human' ? CONFIG.HUMAN_COUNT : 1;
    cardTitle.textContent = side === 'human' ? 'ニンゲンカードを3枚選択' : 'オバケカードを1枚選択';
    cardHelp.textContent = result.message;
    selectionCount.textContent = `0 / ${required}`;
    cardConfirm.disabled = true;
    renderCardSelection();
    showScreen('cards');
  }

  function renderCardSelection() {
    const required = game.side === 'human' ? CONFIG.HUMAN_COUNT : 1;
    cardGrid.innerHTML = '';

    for (const card of selectableCards) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `obk-select-card ${rarityClass(card.rarity)}`;
      button.classList.toggle('selected', selectedIds.has(card.id));
      button.innerHTML = `
        <div class="obk-select-art"><img src="${card.image}" alt="${card.name}"></div>
        <div class="obk-select-meta"><strong>${card.name}</strong><span>${card.rarity}${card.owned > 1 ? ` ・ 所持${card.owned}` : ''}</span></div>`;

      button.addEventListener('click', () => {
        if (selectedIds.has(card.id)) {
          selectedIds.delete(card.id);
        } else {
          if (required === 1) selectedIds.clear();
          else if (selectedIds.size >= required) return;
          selectedIds.add(card.id);
        }
        selectionCount.textContent = `${selectedIds.size} / ${required}`;
        cardConfirm.disabled = selectedIds.size !== required;
        renderCardSelection();
      });
      cardGrid.appendChild(button);
    }
  }

  function confirmCards() {
    const chosen = selectableCards.filter(card => selectedIds.has(card.id));
    const required = game.side === 'human' ? CONFIG.HUMAN_COUNT : 1;
    if (chosen.length !== required) return;

    game.setSelectedCards(chosen);

    if (game.side === 'human') {
      game.resetPlacement();
      showScreen('placement');
      renderPlacement();
    } else {
      game.setupGhostPlayerBoard(Data.getCpuHumanCards(CONFIG.HUMAN_COUNT));
      startSearchGame();
    }
  }

  function renderPlacement() {
    placementCards.innerHTML = game.selectedCards.map(cardMini).join('');
    placementBoard.innerHTML = '';
    applyCurrentMap();

    game.board.forEach(cell => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'obk-cell';

      if (cell.content?.kind === 'human') {
        button.classList.add('placed-human');
        button.innerHTML = `<img src="${cell.content.card.image}" alt="${cell.content.card.name}"><span>${cell.content.card.name}</span>`;
      } else if (cell.content?.kind === 'lantern') {
        button.classList.add('placed-lantern');
        button.innerHTML = '<b>✦</b><span>ランタン</span>';
      } else {
        button.innerHTML = `<span class="obk-cell-number">${cell.index + 1}</span>`;
      }

      button.addEventListener('click', () => {
        const placed = game.placeAt(cell.index);
        if (!placed.ok) {
          placementGuide.textContent = placed.reason;
          return;
        }
        renderPlacement();
      });
      placementBoard.appendChild(button);
    });

    const target = game.getPlacementTarget();
    if (target?.kind === 'human') {
      placementGuide.textContent = `${target.card.name} の隠れ場所を選択`;
      placementNext.innerHTML = `次に配置：${cardMini(target.card)}`;
    } else if (target?.kind === 'lantern') {
      placementGuide.textContent = '最後にランタンを配置してください。';
      placementNext.innerHTML = '<div class="obk-placement-lantern">✦ ランタンを配置</div>';
    } else {
      placementGuide.textContent = '配置完了。ゲームを開始できます。';
      placementNext.innerHTML = '<div class="obk-placement-complete">配置完了</div>';
    }
    startHumanGame.disabled = !game.isPlacementComplete();
  }

  function startSearchGame() {
    cpuToken++;
    interactionLocked = false;
    game.beginSearch();
    gameCards.innerHTML = game.selectedCards.map(cardMini).join('');
    updateStatus();
    renderGameBoard();
    gameLog.textContent = game.side === 'ghost' ? '怪しいマスをタップして探索！' : '配置を隠しました。CPUオバケが探索を開始します。';
    turnLabel.textContent = game.side === 'ghost' ? '探索するマスを選択' : 'CPUオバケ探索中…';
    showScreen('game');

    if (game.side === 'human') {
      const token = cpuToken;
      setTimeout(() => cpuSearchLoop(token), 650);
    }
  }

  function updateStatus() {
    searchesLeft.textContent = game.searchesLeft;
    foundCount.textContent = `${game.foundHumans} / ${CONFIG.HUMAN_COUNT}`;
  }

  function renderGameBoard(lastIndex = null, revealKind = null) {
    gameBoard.innerHTML = '';
    applyCurrentMap();
    game.board.forEach(cell => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'obk-cell';
      if (lastIndex === cell.index) button.classList.add('just-searched');

      if (!cell.searched) {
        button.innerHTML = `<span class="obk-hide-mark">?</span><span class="obk-cell-number">${cell.index + 1}</span>`;
      } else if (cell.content?.kind === 'human') {
        button.classList.add('found-human');
        if (lastIndex === cell.index && revealKind === 'human') {
          button.classList.add('human-caught-motion');
        }
        button.innerHTML = `<img src="${cell.content.card.image}" alt="${cell.content.card.name}"><span>${cell.content.card.name}</span>`;
      } else if (cell.content?.kind === 'lantern') {
        button.classList.add('found-lantern');
        if (lastIndex === cell.index && revealKind === 'lantern') {
          button.classList.add('lantern-found-motion');
        }
        button.innerHTML = '<b>✦</b><span>ランタン</span>';
      } else {
        button.classList.add('found-empty');
        button.innerHTML = '<b>×</b><span>空</span>';
      }

      button.disabled = game.side !== 'ghost' || cell.searched || game.finished || interactionLocked;
      button.addEventListener('click', () => playerSearch(cell.index));
      gameBoard.appendChild(button);
    });
  }

  async function playerSearch(index) {
    if (game.side !== 'ghost' || game.finished || interactionLocked) return;
    interactionLocked = true;
    const result = game.search(index);
    if (!result.ok) {
      interactionLocked = false;
      return;
    }
    await presentSearchResult(result);
    interactionLocked = false;
    if (!game.finished) renderGameBoard(index);
  }

  async function presentSearchResult(result) {
    updateStatus();
    renderGameBoard(result.index, result.kind);
    gameLog.textContent = result.message;

    if (result.kind === 'lantern') {
      lanternAlert.classList.add('show');
      lanternAlert.setAttribute('aria-hidden','false');
      await wait(1250);
      lanternAlert.classList.remove('show');
      lanternAlert.setAttribute('aria-hidden','true');
    } else if (result.kind === 'human') {
      await wait(game.side === 'human' ? 1450 : 1320);
    } else {
      await wait(game.side === 'human' ? 520 : 160);
    }

    if (game.finished) {
      await wait(320);
      showResult();
    }
  }

  async function cpuSearchLoop(token) {
    while (!game.finished && token === cpuToken && overlay.classList.contains('show')) {
      await wait(CONFIG.CPU_SEARCH_DELAY);
      if (token !== cpuToken || game.finished) return;
      const index = game.getRandomUnsearchedIndex();
      if (index === null) return;
      const result = game.search(index);
      if (result.ok) await presentSearchResult(result);
    }
  }

  function showResult() {
    cpuToken++;
    const playerWon = game.winner === game.side;
    resultTitle.textContent = playerWon ? '勝利！' : '敗北…';
    resultMessage.textContent = game.winner === 'ghost' ? 'オバケ側が3人全員を発見しました。' : 'ニンゲンが最後まで隠れきりました。';
    resultFound.textContent = `${game.foundHumans} / ${CONFIG.HUMAN_COUNT}`;
    resultSearches.textContent = game.searchesLeft;
    resultCards.innerHTML = game.selectedCards.map(cardMini).join('');
    const panel = $('#obkResultPanel');
    panel.classList.toggle('player-win', playerWon);
    panel.classList.toggle('player-lose', !playerWon);
    showScreen('result');
  }

  openBtn.addEventListener('click', openGame);
  closeBtn.addEventListener('click', closeGame);
  resultClose.addEventListener('click', closeGame);
  playAgain.addEventListener('click', openGame);
  cardConfirm.addEventListener('click', confirmCards);
  startHumanGame.addEventListener('click', () => {
    if (!game.isPlacementComplete()) return;
    startSearchGame();
  });
  placementReset.addEventListener('click', () => {
    game.resetPlacement();
    renderPlacement();
  });

  $$('.obk-side-card').forEach(button => {
    button.addEventListener('click', () => chooseSide(button.dataset.obkSide));
  });

  $$('.obk-back').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.obkBack;
      if (target === 'cards' && game.selectedCards.length) {
        selectedIds = new Set(game.selectedCards.map(c => c.id));
        renderCardSelection();
      }
      showScreen(target);
    });
  });

  overlay.addEventListener('click', event => {
    if (event.target === overlay) closeGame();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay.classList.contains('show')) closeGame();
  }, true);

  window.ObakeidoroMiniGame = { open:openGame, close:closeGame, game, CONFIG };
})();
