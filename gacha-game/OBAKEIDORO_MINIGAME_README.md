# オバケイドロ ミニゲーム prototype v1

## 追加・変更ファイル
- index.html: 起動ボタン、ミニゲーム画面DOM、minigameスクリプト読込を追加
- styles.css: ミニゲーム用UIを末尾へ追加
- script.js: 既存ガチャ処理は変更なし
- minigame/obakeidoro-data.js: カードデータ接続層。既存所持データ / 仮カードを切替
- minigame/obakeidoro-game.js: ルール・盤面・探索処理。UI非依存
- minigame/obakeidoro-ui.js: 画面遷移、カード選択、配置、CPU探索、結果表示

## 定数
minigame/obakeidoro-game.js の CONFIG で変更できます。
- BOARD_SIZE = 9
- HUMAN_COUNT = 3
- MAX_SEARCHES = 8
- LANTERN_PENALTY = 1
- CPU_SEARCH_DELAY = 760

## 既存カードデータとの接続
「オバケイドロ」という名前を含むSeriesを自動検索します。
そのSeriesのカードに以下の type を付与すると、所持カードが自動でミニゲームへ出ます。

- type: human
- type: ghost

`type` のほか `gameType` / `obakeidoroType` も認識します。
CSVローダーがまだ type 列を読まない場合は、`obakeidoro-data.js` の `TYPE_OVERRIDES` にカードIDと human/ghost を登録しても接続できます。
所持数は既存 `window.GachaMasterAPI.getOwnedCount(cardId)` を利用します。
必要枚数（human 3 / ghost 1）が不足する場合は、仮カードへ自動フォールバックします。

## ゲームフロー
陣営選択 → カード選択 → （ニンゲンのみ配置） → 3×3探索 → 勝敗 → もう一度遊ぶ

## 未実装
カード能力、レアリティ性能差、報酬、ガチャ石、オンライン対戦。
