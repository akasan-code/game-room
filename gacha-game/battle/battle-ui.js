(() => {
  'use strict';

  const Data = window.OverlordBattleData;
  const Logic = window.OverlordBattleLogic;

  const $ = selector => document.querySelector(selector);
  const overlay = $('#ovbOverlay');
  if (!overlay) return;

  const screens = [...overlay.querySelectorAll('[data-ovb-screen]')];
  const closeButtons = [...overlay.querySelectorAll('[data-ovb-close]')];

  const selectGrid = $('#ovbSelectGrid');
  const selectedCount = $('#ovbSelectedCount');
  const selectHelp = $('#ovbSelectHelp');
  const toPrep = $('#ovbToPrep');

  const cpuPreview = $('#ovbCpuPreview');
  const playerOrder = $('#ovbPlayerOrder');
  const battleStart = $('#ovbBattleStart');
  const backToSelect = $('#ovbBackToSelect');

  const roundNo = $('#ovbRoundNo');
  const battlePlayer = $('#ovbBattlePlayer');
  const battleCpu = $('#ovbBattleCpu');
  const battleOutcome = $('#ovbBattleOutcome');
  const battleReason = $('#ovbBattleReason');

  const resultTitle = $('#ovbResultTitle');
  const resultWin = $('#ovbResultWin');
  const resultLose = $('#ovbResultLose');
  const resultDraw = $('#ovbResultDraw');
  const resultRounds = $('#ovbResultRounds');
  const rematch = $('#ovbRematch');
  const resultToSelect = $('#ovbResultToSelect');

  let ownedCards = [];
  let selectedIds = new Set();
  let playerOrderCards = [];
  let cpuCards = [];
  let cpuOrder = [];
  let battleToken = 0;

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function showScreen(name) {
    screens.forEach(screen => {
      const active = screen.dataset.ovbScreen === name;
      screen.hidden = !active;
      screen.classList.toggle('is-active', active);
    });
  }

  function typeClass(card) {
    return card?.battleType ? `type-${card.battleType}` : 'type-unset';
  }

  function cardHtml(card, compact = false) {
    const ability = Data.getAbilityLabel(card);
    return `
      <article class="ovb-card ${typeClass(card)} ${compact ? 'compact' : ''}">
        <div class="ovb-card-art"><img src="${card.image}" alt="${card.name}"></div>
        <div class="ovb-card-info">
          <div class="ovb-card-topline">
            <span class="ovb-rarity rarity-${String(card.rarity).toLowerCase()}">${card.rarity}</span>
            <span class="ovb-type">${Data.getTypeLabel(card)}</span>
          </div>
          <div class="ovb-card-name">${card.name}</div>
          ${ability ? `<div class="ovb-ability">${ability}</div>` : ''}
        </div>
      </article>
    `;
  }

  function refreshOwned() {
    ownedCards = Data.getOwnedCardsForSelection();
  }

  function openGame() {
    battleToken++;
    selectedIds.clear();
    playerOrderCards = [];
    cpuCards = [];
    refreshOwned();
    renderSelection();
    showScreen('select');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeGame() {
    battleToken++;
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function renderSelection() {
    selectGrid.innerHTML = '';

    const readyCount = ownedCards.filter(card => card.battleReady).length;
    if (!ownedCards.length) {
      selectHelp.textContent = 'overload(series_003) の所持カードがありません。';
    } else {
      selectHelp.textContent =
        `所持 ${ownedCards.length}種類 / 対戦可能 ${readyCount}種類。タイプ未設定カードは選択できません。`;
    }

    ownedCards.forEach(card => {
      const selected = selectedIds.has(card.id);
      const disabled = !card.battleReady;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = `ovb-select-card ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`;
      button.disabled = disabled;
      button.innerHTML = `
        ${cardHtml(card)}
        <div class="ovb-owned">所持 ×${card.ownedCount}</div>
        ${disabled ? '<div class="ovb-disabled-note">タイプ未設定</div>' : ''}
        ${selected ? '<div class="ovb-selected-mark">SELECTED</div>' : ''}
      `;

      button.addEventListener('click', () => {
        if (selectedIds.has(card.id)) selectedIds.delete(card.id);
        else if (selectedIds.size < Data.CONFIG.TEAM_SIZE) selectedIds.add(card.id);
        renderSelection();
      });

      selectGrid.appendChild(button);
    });

    selectedCount.textContent = `${selectedIds.size} / ${Data.CONFIG.TEAM_SIZE}`;

    const cpuReady = Data.getCpuPool().length >= Data.CONFIG.TEAM_SIZE;
    toPrep.disabled = selectedIds.size !== Data.CONFIG.TEAM_SIZE || !cpuReady;

    if (!cpuReady) {
      selectHelp.textContent += ' CPU用のbattleType設定済みカードも5種類以上必要です。';
    }
  }

  function prepareBattle() {
    refreshOwned();
    const selected = ownedCards.filter(card => selectedIds.has(card.id));
    if (selected.length !== Data.CONFIG.TEAM_SIZE) {
      renderSelection();
      return;
    }

    cpuCards = Data.chooseCpuCards();
    if (cpuCards.length !== Data.CONFIG.TEAM_SIZE) {
      showScreen('select');
      renderSelection();
      return;
    }

    playerOrderCards = selected;
    renderPrep();
    showScreen('prep');
  }

  function renderPrep() {
    cpuPreview.innerHTML = cpuCards.map(card => cardHtml(card, true)).join('');

    playerOrder.innerHTML = '';
    playerOrderCards.forEach((card, index) => {
      const row = document.createElement('div');
      row.className = 'ovb-order-row';
      row.innerHTML = `
        <div class="ovb-order-no">${index + 1}</div>
        <div class="ovb-order-card">${cardHtml(card, true)}</div>
        <div class="ovb-order-controls">
          <button type="button" data-move="-1" ${index === 0 ? 'disabled' : ''}>▲</button>
          <button type="button" data-move="1" ${index === playerOrderCards.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
      `;

      row.querySelectorAll('[data-move]').forEach(button => {
        button.addEventListener('click', () => {
          const next = index + Number(button.dataset.move);
          if (next < 0 || next >= playerOrderCards.length) return;
          [playerOrderCards[index], playerOrderCards[next]] =
            [playerOrderCards[next], playerOrderCards[index]];
          renderPrep();
        });
      });

      playerOrder.appendChild(row);
    });
  }

  function sideHtml(card, label) {
    return `<div class="ovb-battle-side-label">${label}</div>${cardHtml(card)}`;
  }

  async function startBattle() {
    battleToken++;
    const token = battleToken;
    cpuOrder = Data.shuffle(cpuCards);
    const roundResults = [];
    showScreen('battle');

    for (let i = 0; i < Data.CONFIG.TEAM_SIZE; i++) {
      if (token !== battleToken) return;

      const player = playerOrderCards[i];
      const cpu = cpuOrder[i];
      const result = Logic.resolveBattle(player, cpu);

      roundNo.textContent = `ROUND ${i + 1}`;
      battlePlayer.innerHTML = sideHtml(player, 'PLAYER');
      battleCpu.innerHTML = sideHtml(cpu, 'CPU');
      battleOutcome.textContent = '';
      battleOutcome.className = 'ovb-battle-outcome';
      battleReason.textContent = 'VS';

      await wait(Data.CONFIG.ROUND_REVEAL_MS);
      if (token !== battleToken) return;

      battleOutcome.textContent = result.resultA;
      battleOutcome.className = `ovb-battle-outcome result-${result.resultA.toLowerCase()}`;
      battleReason.textContent = result.reason;
      roundResults.push({ player, cpu, result });

      await wait(Data.CONFIG.ROUND_RESULT_MS);
    }

    if (token !== battleToken) return;
    renderResult(roundResults);
    showScreen('result');
  }

  function renderResult(roundResults) {
    const wins = roundResults.filter(r => r.result.resultA === 'WIN').length;
    const loses = roundResults.filter(r => r.result.resultA === 'LOSE').length;
    const draws = roundResults.filter(r => r.result.resultA === 'DRAW').length;

    resultWin.textContent = wins;
    resultLose.textContent = loses;
    resultDraw.textContent = draws;
    resultTitle.textContent = wins > loses ? 'VICTORY' : wins < loses ? 'DEFEAT' : 'DRAW';

    resultRounds.innerHTML = roundResults.map((round, index) => `
      <div class="ovb-round-summary result-${round.result.resultA.toLowerCase()}">
        <span>R${index + 1}</span>
        <span>${round.player.name}</span>
        <strong>${round.result.resultA}</strong>
        <span>${round.cpu.name}</span>
      </div>
    `).join('');
  }

  function rematchSameCards() {
    cpuCards = Data.chooseCpuCards();
    if (cpuCards.length !== Data.CONFIG.TEAM_SIZE) return;
    renderPrep();
    showScreen('prep');
  }

  document.addEventListener('click', event => {
    if (event.target.closest('#openOverlordBattleGame')) {
      event.preventDefault();
      openGame();
    }
  });

  closeButtons.forEach(button => button.addEventListener('click', closeGame));
  toPrep?.addEventListener('click', prepareBattle);
  backToSelect?.addEventListener('click', () => {
    refreshOwned();
    renderSelection();
    showScreen('select');
  });
  battleStart?.addEventListener('click', startBattle);
  rematch?.addEventListener('click', rematchSameCards);
  resultToSelect?.addEventListener('click', () => {
    selectedIds.clear();
    refreshOwned();
    renderSelection();
    showScreen('select');
  });

  window.OverlordBattleUI = Object.freeze({ open: openGame, close: closeGame });
})();
