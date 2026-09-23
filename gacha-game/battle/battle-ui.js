(() => {
  'use strict';

  const Data = window.OverlordBattleData;
  const Logic = window.OverlordBattleLogic;

  const $ = selector => document.querySelector(selector);
  const overlay = $('#ovbOverlay');
  if (!overlay) return;

  const screens = [...overlay.querySelectorAll('[data-ovb-screen]')];
  const closeButtons = [...overlay.querySelectorAll('[data-ovb-close]')];

  const enemyPreview = $('#ovbEnemyPreview');
  const typeTabs = $('#ovbTypeTabs');
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
  let activeTypeTab = 'all';
  let battleToken = 0;

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  const TYPE_TABS = [
    { id: 'all', label: 'すべて' },
    { id: 'attacker', label: 'アタッカー', icon: 'assets/type-icons/attacker.png' },
    { id: 'tank', label: 'タンク', icon: 'assets/type-icons/tank.png' },
    { id: 'magic', label: 'マジックキャスター', icon: 'assets/type-icons/magic.png' },
    { id: 'noncombatant', label: '非戦闘員', icon: 'assets/type-icons/noncombatant.png' },
    { id: 'unset', label: 'タイプ未設定' }
  ];

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

  const TYPE_ICONS = Object.freeze({
    attacker: 'assets/type-icons/attacker.png',
    tank: 'assets/type-icons/tank.png',
    magic: 'assets/type-icons/magic.png',
    noncombatant: 'assets/type-icons/noncombatant.png'
  });

  const SKILL_ICON = 'assets/type-icons/skill.png';

  function getTypeIconPath(cardOrType) {
    const typeId = typeof cardOrType === 'string'
      ? cardOrType
      : cardOrType?.battleType;

    return TYPE_ICONS[typeId] || '';
  }

  function typeIconMarkup(card, extraClass = '') {
    const iconPath = getTypeIconPath(card);
    if (!iconPath) {
      return `<span class="ovb-type-icon ovb-type-icon-fallback ${extraClass}" aria-hidden="true">？</span>`;
    }

    return `<span class="ovb-type-icon ${extraClass}" aria-label="${Data.getTypeLabel(card)}"><img src="${iconPath}" alt=""></span>`;
  }

  function skillBadgeMarkup(card) {
    const ability = Data.getAbilityLabel(card);
    if (!ability) return '';

    return `
      <span class="ovb-skill-badge" title="スキル: ${ability}" aria-label="スキル: ${ability}">
        <img src="${SKILL_ICON}" alt="">
      </span>
    `;
  }

  function cardHtml(card, compact = false) {
    const ability = Data.getAbilityLabel(card);
    return `
      <article class="ovb-card ${typeClass(card)} ${compact ? 'compact' : ''}">
        <div class="ovb-card-art">
          <img src="${card.image}" alt="${card.name}">
          <div class="ovb-card-badges">
            ${typeIconMarkup(card, 'ovb-type-badge')}
            ${skillBadgeMarkup(card)}
          </div>
        </div>
        <div class="ovb-card-info">
          <div class="ovb-card-topline">
            <span class="ovb-rarity rarity-${String(card.rarity).toLowerCase()}">${card.rarity}</span>
            <span class="ovb-type">
              <span>${Data.getTypeLabel(card)}</span>
            </span>
          </div>
          <div class="ovb-card-name-row">
            <div class="ovb-card-name">${card.name}</div>
            ${ability ? `<span class="ovb-ability-inline"><span>${ability}</span></span>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  function hiddenEnemyCardHtml(index) {
    return `
      <article class="ovb-enemy-hidden" aria-label="未公開カード ${index}">
        <div class="ovb-hidden-rune">?</div>
        <div class="ovb-hidden-label">UNKNOWN</div>
      </article>
    `;
  }

  function refreshOwned() {
    ownedCards = Data.getOwnedCardsForSelection();
  }

  function chooseCpuForMatch() {
    cpuCards = Data.chooseCpuCards();
  }

  function openGame() {
    battleToken++;
    selectedIds.clear();
    playerOrderCards = [];
    cpuCards = [];
    cpuOrder = [];
    activeTypeTab = 'all';

    refreshOwned();
    chooseCpuForMatch();

    renderEnemyPreview();
    renderTypeTabs();
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

  function renderEnemyPreview(target = enemyPreview) {
    if (!target) return;

    const visible = cpuCards.slice(0, 3);

    target.innerHTML = [
      ...visible.map(card => cardHtml(card, true)),
      hiddenEnemyCardHtml(4),
      hiddenEnemyCardHtml(5)
    ].join('');
  }

  function renderTypeTabs() {
    if (!typeTabs) return;

    typeTabs.innerHTML = '';

    TYPE_TABS.forEach(tab => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `ovb-type-tab ${activeTypeTab === tab.id ? 'is-active' : ''}`;

      const count = ownedCards.filter(card => {
        if (tab.id === 'all') return true;
        if (tab.id === 'unset') return !card.battleType;
        return card.battleType === tab.id;
      }).length;

      button.innerHTML = `${tab.icon ? `<img class="ovb-type-tab-icon" src="${tab.icon}" alt="">` : ''}<span class="ovb-type-tab-label">${tab.label}</span><span>${count}</span>`;

      button.addEventListener('click', () => {
        activeTypeTab = tab.id;
        renderTypeTabs();
        renderSelection();
      });

      typeTabs.appendChild(button);
    });
  }

  function getFilteredCards() {
    if (activeTypeTab === 'all') return ownedCards;
    if (activeTypeTab === 'unset') return ownedCards.filter(card => !card.battleType);
    return ownedCards.filter(card => card.battleType === activeTypeTab);
  }

  function renderSelection() {
    selectGrid.innerHTML = '';

    const readyCount = ownedCards.filter(card => card.battleReady).length;
    const cpuReady = cpuCards.length >= Data.CONFIG.TEAM_SIZE;

    if (!ownedCards.length) {
      selectHelp.textContent = 'overload(series_003) の所持カードがありません。';
    } else {
      selectHelp.textContent =
        `所持 ${ownedCards.length}種類 / 対戦可能 ${readyCount}種類。` +
        ` CPU公開3枚を見ながら5枚を選択してください。`;
    }

    const cards = getFilteredCards();

    if (!cards.length) {
      selectGrid.innerHTML = '<div class="ovb-empty-tab">このタイプの所持カードはありません。</div>';
    }

    cards.forEach(card => {
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
        if (disabled) return;

        if (selectedIds.has(card.id)) {
          selectedIds.delete(card.id);
        } else if (selectedIds.size < Data.CONFIG.TEAM_SIZE) {
          selectedIds.add(card.id);
        }

        renderSelection();
      });

      selectGrid.appendChild(button);
    });

    selectedCount.textContent = `${selectedIds.size} / ${Data.CONFIG.TEAM_SIZE}`;
    toPrep.disabled = selectedIds.size !== Data.CONFIG.TEAM_SIZE || !cpuReady;

    if (!cpuReady) {
      selectHelp.textContent += ' CPU用のbattleType設定済み所持カードも5種類以上必要です。';
    }
  }

  function prepareBattle() {
    refreshOwned();

    const selected = ownedCards.filter(card => selectedIds.has(card.id));
    if (selected.length !== Data.CONFIG.TEAM_SIZE) {
      renderSelection();
      return;
    }

    if (cpuCards.length !== Data.CONFIG.TEAM_SIZE) {
      chooseCpuForMatch();
    }

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
    renderEnemyPreview(cpuPreview);

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

    resultTitle.textContent =
      wins > loses ? 'VICTORY' :
      wins < loses ? 'DEFEAT' :
      'DRAW';

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
    chooseCpuForMatch();
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
    renderEnemyPreview();
    renderTypeTabs();
    renderSelection();
    showScreen('select');
  });

  battleStart?.addEventListener('click', startBattle);
  rematch?.addEventListener('click', rematchSameCards);

  resultToSelect?.addEventListener('click', () => {
    selectedIds.clear();
    activeTypeTab = 'all';
    refreshOwned();
    chooseCpuForMatch();
    renderEnemyPreview();
    renderTypeTabs();
    renderSelection();
    showScreen('select');
  });

  window.OverlordBattleUI = Object.freeze({
    open: openGame,
    close: closeGame
  });
})();
