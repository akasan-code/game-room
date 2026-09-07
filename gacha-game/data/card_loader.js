(() => {
  const CSV_URL = 'data/cards.csv';

  function parseCsv(text) {
    text = text.replace(/^\uFEFF/, '');

    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (quoted) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            quoted = false;
          }
        } else {
          field += ch;
        }
        continue;
      }

      if (ch === '"') {
        quoted = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (ch !== '\r') {
        field += ch;
      }
    }

    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }

    if (!rows.length) return [];

    const headers = rows.shift().map(v => v.trim());

    return rows
      .filter(cols => cols.some(v => v.trim() !== ''))
      .map(cols => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = cols[index] ?? '';
        });
        return obj;
      });
  }

  function parseGachas(value) {
    return String(value || '')
      .split('|')
      .map(v => v.trim())
      .filter(Boolean);
  }

  function parseWeights(value) {
    const result = {};
    const source = String(value || '').trim();

    if (!source) return undefined;

    for (const part of source.split('|')) {
      const [gachaId, rawWeight] = part.split(':').map(v => v.trim());
      const weight = Number(rawWeight);

      if (!gachaId || !Number.isFinite(weight) || weight <= 0) {
        console.warn(`weights の記述を無視しました: ${part}`);
        continue;
      }

      result[gachaId] = weight;
    }

    return Object.keys(result).length ? result : undefined;
  }

  function rowToCard(row, lineNumber) {
    const collectionNo = Number(row.collectionNo);
    const id = String(row.id || '').trim();
    const name = String(row.name || '').trim();
    const rarity = String(row.rarity || '').trim().toUpperCase();
    const image = String(row.image || '').trim();
    const gachas = parseGachas(row.gachas);
    const weights = parseWeights(row.weights);

    if (!Number.isInteger(collectionNo) || collectionNo <= 0) {
      throw new Error(`${lineNumber}行目: collectionNo が不正です`);
    }

    if (!id) {
      throw new Error(`${lineNumber}行目: id が空です`);
    }

    if (!name) {
      throw new Error(`${lineNumber}行目: name が空です`);
    }

    if (!['N', 'R', 'SR', 'UR'].includes(rarity)) {
      throw new Error(`${lineNumber}行目: rarity が不正です (${rarity})`);
    }

    if (!image) {
      throw new Error(`${lineNumber}行目: image が空です`);
    }

    if (!gachas.length) {
      throw new Error(`${lineNumber}行目: gachas が空です`);
    }

    const card = {
      id,
      collectionNo,
      name,
      rarity,
      image,
      gachas
    };

    if (weights) {
      card.weights = weights;
    }

    return card;
  }

  function validateCards(cards) {
    const ids = new Set();
    const numbersByGacha = new Map();

    for (const card of Object.values(cards)) {
      if (ids.has(card.id)) {
        throw new Error(`カードIDが重複しています: ${card.id}`);
      }
      ids.add(card.id);

      for (const gachaId of card.gachas) {
        if (!numbersByGacha.has(gachaId)) {
          numbersByGacha.set(gachaId, new Map());
        }

        const numberMap = numbersByGacha.get(gachaId);

        if (numberMap.has(card.collectionNo)) {
          throw new Error(
            `${gachaId} の collectionNo.${String(card.collectionNo).padStart(3, '0')} が重複しています: ` +
            `${numberMap.get(card.collectionNo)} / ${card.id}`
          );
        }

        numberMap.set(card.collectionNo, card.id);
      }
    }
  }

  function showLoadError(error) {
    console.error(error);

    const panel = document.createElement('div');
    panel.style.cssText = `
      position:fixed;
      z-index:99999;
      inset:0;
      display:grid;
      place-items:center;
      padding:24px;
      background:#03070d;
      color:#e8f4ff;
      font-family:system-ui,sans-serif;
    `;

    panel.innerHTML = `
      <div style="
        width:min(680px,100%);
        padding:24px;
        border:1px solid rgba(100,180,255,.4);
        border-radius:14px;
        background:#07111e;
        box-shadow:0 20px 60px rgba(0,0,0,.45);
      ">
        <h2 style="margin-top:0">cards.csv を読み込めませんでした</h2>
        <p style="line-height:1.7">
          index.html を直接ダブルクリックして開くと、
          ブラウザの制限でCSVを読み込めない場合があります。
        </p>
        <p style="line-height:1.7">
          同梱の <b>START_GAME.bat</b>（Windows）、
          またはターミナルで <code>python -m http.server 8000</code>
          を使ってローカルサーバーから開いてください。
        </p>
        <pre style="
          white-space:pre-wrap;
          padding:12px;
          background:#02060b;
          border-radius:8px;
          color:#ffb5b5;
        ">${String(error.message || error)}</pre>
      </div>
    `;

    document.body.appendChild(panel);
  }

  function loadGameScript() {
    const script = document.createElement('script');
    script.src = 'script.js';
    script.defer = false;
    document.body.appendChild(script);
  }

  async function boot() {
    try {
      if (!window.GACHA_MASTER) {
        throw new Error('data/master.js が読み込まれていません');
      }

      const response = await fetch(CSV_URL, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`cards.csv HTTP ${response.status}`);
      }

      const text = await response.text();
      const rows = parseCsv(text);
      const cards = {};

      rows.forEach((row, index) => {
        const card = rowToCard(row, index + 2);

        if (cards[card.id]) {
          throw new Error(`カードIDが重複しています: ${card.id}`);
        }

        cards[card.id] = card;
      });

      validateCards(cards);

      window.GACHA_MASTER.cards = cards;

      console.info(`cards.csv: ${Object.keys(cards).length} cards loaded`);
      loadGameScript();
    } catch (error) {
      showLoadError(error);
    }
  }

  boot();
})();
