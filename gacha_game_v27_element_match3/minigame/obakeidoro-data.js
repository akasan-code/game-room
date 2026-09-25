(() => {
  'use strict';

  const TARGET_GACHA_ID = 'standard_001';

  function makePlaceholder(label, type, rarity) {
    const main = type === 'ghost' ? '#7657b8' : '#3f8fc7';
    const accent = rarity === 'UR' ? '#f0c45f' : rarity === 'SR' ? '#dbe8f4' : rarity === 'R' ? '#d39bf3' : '#72b8ee';
    const safe = String(label).replace(/[&<>"']/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#07111e"/><stop offset="1" stop-color="${main}"/></linearGradient></defs>
      <rect width="600" height="800" rx="28" fill="url(#g)"/>
      <circle cx="300" cy="295" r="125" fill="none" stroke="${accent}" stroke-width="8" opacity=".55"/>
      <text x="300" y="320" text-anchor="middle" font-size="150" fill="${accent}" font-family="serif">${type === 'ghost' ? '☾' : '♙'}</text>
      <text x="300" y="575" text-anchor="middle" font-size="38" fill="#fff" font-family="sans-serif">${safe}</text>
      <text x="300" y="635" text-anchor="middle" font-size="28" fill="${accent}" font-family="sans-serif">${rarity}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  const SAMPLE_CARDS = [
    { id:'sample_h_1', name:'ミオ', type:'human', rarity:'N' },
    { id:'sample_h_2', name:'ソラ', type:'human', rarity:'R' },
    { id:'sample_h_3', name:'アカリ', type:'human', rarity:'SR' },
    { id:'sample_g_1', name:'グリム', type:'ghost', rarity:'R' }
  ].map(card => ({
    ...card,
    image: makePlaceholder(card.name, card.type, card.rarity),
    owned:1,
    source:'sample'
  }));

  function getOwnedCount(cardId) {
    if (window.GachaMasterAPI?.getOwnedCount) {
      return Number(window.GachaMasterAPI.getOwnedCount(cardId)) || 0;
    }

    // 念のためAPI未準備時も既存セーブから読めるようにする。
    try {
      const raw = localStorage.getItem('gachaGameCollection_v31b');
      const parsed = raw ? JSON.parse(raw) : null;
      return Number(parsed?.ownedCounts?.[cardId]) || 0;
    } catch {
      return 0;
    }
  }

  function getRealCards(type) {
    const master = window.GACHA_MASTER;
    if (!master?.gachas?.[TARGET_GACHA_ID] || !master?.cards) return [];

    return Object.values(master.cards)
      .filter(card => Array.isArray(card.gachas) && card.gachas.includes(TARGET_GACHA_ID))
      .filter(card => card.type === type)
      .map(card => ({
        id:card.id,
        name:card.name,
        type:card.type,
        rarity:card.rarity || 'N',
        image:card.image || makePlaceholder(card.name, type, card.rarity || 'N'),
        owned:getOwnedCount(card.id),
        source:'gacha'
      }))
      .filter(card => card.owned > 0);
  }

  function getCards(type) {
    const required = type === 'human' ? 3 : 1;
    const real = getRealCards(type);

    if (real.length >= required) {
      return {
        cards:real,
        usingSample:false,
        message:`standard_001 の所持${type === 'human' ? 'ニンゲン' : 'オバケ'}カードを使用します。`
      };
    }

    const samples = SAMPLE_CARDS.filter(card => card.type === type);
    const needed = Math.max(0, required - real.length);
    return {
      cards:[...real, ...samples.slice(0, needed)],
      usingSample:true,
      message:`所持カードが必要数に足りないため、${needed}枚だけ仮カードを補っています。`
    };
  }

  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getCpuHumanCards(count = 3) {
    return shuffle(getCards('human').cards).slice(0, count);
  }

  window.ObakeidoroCardData = {
    TARGET_GACHA_ID,
    getCards,
    getCpuHumanCards,
    getOwnedCount
  };
})();
