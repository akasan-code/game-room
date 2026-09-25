# ガチャゲーム + オバケイドロ 統合版 v2

アップロード済み最新版を土台に、一度構成を整理して統合し直した版です。

## ファイル構成

- `index.html` : ガチャ画面 + オバケイドロ画面DOM
- `styles.css` : 既存ガチャCSS + ミニゲームCSS
- `script.js` : 既存ガチャ本体（最新版をそのまま使用）
- `data/master.js` : ガチャSeries / 経済設定
- `data/cards.csv` : カードマスター。`type` 列正式対応
- `data/card_loader.js` : CSV読込 + 本体/ミニゲームJSを順番に起動
- `minigame/obakeidoro-data.js` : 所持カード接続
- `minigame/obakeidoro-game.js` : ゲームルール
- `minigame/obakeidoro-ui.js` : 画面表示 / 操作

## 今回整理した点

1. `cards.csv` の `human / ghost` を正式に `type` 列へ移動。
2. `card_loader.js` が `card.type` を作成。
3. `card_loader.js` が `script.js` を先に読み、その後ミニゲームを読み込む。
4. ミニゲーム対象Seriesは `standard_001` 固定。
5. 所持数は既存 `GachaMasterAPI.getOwnedCount()` を使用。
6. 9マス盤面はスマホでも最低82〜88px程度を維持。
7. ミニゲーム画面は absolute の重ね替えをやめ、安定した通常フロー表示。

## standard_001 の type 登録状況

- human: 12 枚
- ghost: 14 枚
- type未設定: 1 枚

`type` 未設定カードはミニゲームのカード選択には出ません。

## CSV形式

```csv
collectionNo,id,name,rarity,image,gachas,weights,type
1,oba_n_001,紀子,N,images/OBA/noriko.png,standard_001,,human
3,oba_n_003,花子,N,images/OBA/hanako.png,standard_001,,ghost
```

`weights` を使わない場合でも、`type` の前のカンマを残してください。


## v3 背景マップ

オバケイドロの9マス盤面へ、以下の3マップを追加。

- 夜の学校
- 夕方の黄昏横丁
- おばけ墓場

配置場所:

```text
assets/minigame/maps/
├─ school_night.png
├─ twilight_alley.png
└─ ghost_graveyard.png
```

### 動作

- ミニゲームを開いた時に3種類からランダムで1枚選択
- 1プレイ中は配置画面と探索画面で同じ背景を維持
- 「もう一度遊ぶ」で次のプレイへ進むと別背景を優先して抽選
- 各マスは半透明にして背景マップが見えるよう調整


## v4 発見モーション

ニンゲンが見つかった時に、そのマスのカード画像へ演出を追加。

### 動き
- 少し大きく表示
- 左右に数回揺れる
- 最後に元の枠の中へ落ち着く

### 対象
- プレイヤーがオバケ側のときにニンゲンを発見した場合
- CPUオバケが探索してニンゲンを発見した場合

### 実装箇所
- `minigame/obakeidoro-ui.js`
- `styles.css`


## v5 演出調整

### ニンゲン発見
- 拡大率を強化（最大約1.34倍）
- 横揺れ幅を拡大
- 揺れ時間を約1.34秒へ延長
- 徐々に揺れを弱めながら元の枠へ戻る

### ランタン発見
- マス全体が青く発光
- 青いオーラが外側へ広がる
- 輪郭が青く光る
- ランタン記号も強く発光


## v6 Seriesボタン配置修正

召喚画面上部のガチャSeries切替を中央基準に変更。

- 左端の「オバケイドロ」が画面外へ切れないよう修正
- Seriesボタン全体を画面中央基準へ変更
- 最大幅を画面幅以内に制限
- 狭い画面では横スクロール可能
- モバイルでは左右8pxの余白を確保


## v7 ミニゲームボタン配置

召喚画面のミニゲーム起動ボタンを変更。

- 表示名を「オバケイドロ」→「ミニゲーム」へ変更
- ガチャSeries選択ボタン群の直下へ移動
- 画面中央へ配置
- PC / スマホで位置を個別調整


## v8 ミニゲーム行

Series選択の真下に、同じ3列構成のミニゲーム行を追加。

上段:
- オバケイドロ
- 元素の人影
- overload

下段:
- ミニゲーム
- 準備中
- 準備中

下段ボタンの幅は、対応する上段Seriesボタンの実際の幅へ同期。
そのため「ミニゲーム」が「オバケイドロ」の真下に揃う。


## v9 Series / ミニゲーム配置修正

PCで2段が重なる・スマホでミニゲーム行が消える問題を修正。

変更:
- Series選択とミニゲーム行を `.top-selector-stack` でひとまとめ
- `top` を各行へ個別指定する方式を廃止
- flexの縦並びで必ず「Series → ミニゲーム」の順になる
- PCは8px、スマホは6pxの行間
- スマホでは左右8px以内に収め、両方の行へ最低高さを確保


## v11 カード潰れ修正

v10ではカードそのものへ `aspect-ratio` などを強く上書きしたため、
既存の排出結果レイアウトと競合してカードが潰れていました。

v11では:
- v9の元レイアウトへ戻して再実装
- カード本体のwidth/結果アニメーションは変更しない
- フレーム画像だけ廃止
- 隠しsizing要素で3:4の高さを確保
- CSSの枠色だけでN/R/SR/URを表現
- キャラ画像は `object-fit: contain` を維持


## v12 12連結果表示修正

対象は12枚の最終結果画面のみ。

- `.ten-layered-card` 自体を3:4へ固定
- フレーム画像の代替要素を高さ計算から外す
- キャラ画像は `object-fit: contain`
- 4×3グリッドのカードが縦につぶれないよう修正
- 単発排出・図鑑・ミニゲームには追加変更なし


## v13 1枚取得表示サイズ調整

1枚ずつ大きく表示される取得画面を縮小。

### PC
- 最大高さ: 約760px
- 基本: 画面高の76%以内
- 最大幅: 72vw

### スマホ
- 最大高さ: 約80dvh
- 最大幅: 94vw
- 低い画面ではさらに74dvh / 92vwまで縮小

カード名位置も画像サイズに追従するよう調整。


## v14 12連結果を専用カードへ分離

12連最終結果だけ、通常の `.layered-card` を使用しない構造へ変更。

理由:
過去のフレーム画像用CSS・UR用CSS・カード表示調整CSSが
`.layered-card` に多数重なっており、12連だけ潰れる競合が残っていたため。

新しい12連専用構造:
- `.twelve-result-card`
- `.twelve-result-art`
- `.twelve-result-rarity`
- `.twelve-result-name`

カード比率はセルとカード本体の両方で3:4。
画像は変形せず `object-fit: cover` で表示。


## v15 12連結果 決定版

スクリーンショットで確認できた問題を修正。

### 問題
- 高さの低いPCブラウザで12枚カードが横線状に潰れる
- Series / ミニゲームUIが結果画面へ重なる

### 修正
- 12連結果を「残り高さを3等分する4×3グリッド」へ変更
- グリッドセル自身には3:4を持たせない
- セル内の実カードだけを3:4に固定
- カード高さから幅を自動算出
- 12連結果中は上部Series / ミニゲームUIを非表示
- 結果レイヤーを z-index 1000 へ
- 閉じるボタンを独立した最下段へ配置


## v16 12連CSS整理

過去に追加していた12連結果用CSSをASTで整理し、
以下の古い指定を削除しました。

- `.ten-result`
- `.ten-card-grid`
- `.ten-card-item`
- `.ten-layered-card`
- `.twelve-result-*`
- `.result-card.twelve-mode`
- `:has(.ten-result.show)`
- 古い `tenCardAppear`

12連結果はファイル末尾の `v16 12連結果 CLEAN` のみで管理します。

PC:
- 横幅と画面高さの両方からカード幅を計算
- 4×3固定
- 3:4維持

スマホ:
- 4列を維持
- 横幅/画面高の小さい方に合わせて自動縮小
- 低い画面向け追加調整あり


# v17 OVERLORD 5枚固定対戦

## 既存カードデータへの追加
`data/cards.csv` に以下3列を追加しました。

- `battleType`
- `battleTags`
- `battleAbility`

新しいカード一覧は作っていません。

## 所持カードとの連動
`battle/battle-data.js` は `GACHA_MASTER.cards` を参照し、
`GachaMasterAPI.getOwnedCount(card.id)` が1以上のカードだけをプレイヤー選択へ表示します。

## タイプ設定
新キャラは `data/cards.csv` の `battleType` に以下を設定します。

- `attacker`
- `tank`
- `magic`

タイプ未設定カードは「タイプ未設定」と表示し、選択不可です。

## 新タイプ追加
`battle/battle-data.js` の `TYPES` に追加します。
`strongAgainst` を設定するだけで基本相性へ参加できます。

## 新能力追加
1. `cards.csv` の `battleAbility` に能力IDを設定
2. `battle/battle-logic.js` の `ABILITY_HANDLERS` にhandlerを1つ追加

## resolveBattle() の優先順位
1. 両カードの能力を評価
2. ability priority の高いものを採用
3. 特殊結果が無ければ基本タイプ相性
4. 同タイプはDRAW
5. 未定義相性はDRAW

現在:
- `guild_master`: priority 100
- `world_champion`: priority 50

このため「モモンガ相当カード VS たっちみー」は必ずDRAWです。

## モモンガについて
現在の `cards.csv` には「モモンガ」という別カードはなく、
`ovarloard_001` は「アインズ・ウール・ゴウン」です。
カードを複製・改名せず、この既存IDへ
`magic / supreme_41 / guild_master` を追加しました。

## たっちみーについて
`ovarloard_024` に
`supreme_41 / world_champion` を追加しました。

ただし仕様文に基本タイプ指定が無いため、
`battleType` は勝手に推測せず空欄です。
使用する場合はCSVで基本タイプを設定してください。

## 変更/追加ファイル
- `index.html`
- `styles.css`
- `script.js`
- `data/cards.csv`
- `data/card_loader.js`
- `battle/battle-data.js`
- `battle/battle-logic.js`
- `battle/battle-ui.js`
- `battle/battle-tests.js`


## v18 12連結果サイズ修正

12連結果のカードサイズ計算から CSS calc の除算 (`/ 4`) を廃止。

ブラウザによって除算式が無効になり、
カード幅のカスタムプロパティが壊れて極小表示になる問題を修正。

PC:
- 1枚 約112〜150px幅
- 4列×3段
- 高さ不足時はカードを極小化せず結果パネルを縦スクロール

スマホ:
- 4列固定
- Gridの1frで画面幅に合わせる
- 3:4比率維持


## v19 12連カード固定サイズ

自動サイズ計算をやめました。

PC:
- 140 × 187px 固定
- 4列 × 3段
- これ以下に縮まない

スマホ:
- 78 × 104px 固定

360px以下:
- 72 × 96px 固定

画面に入りきらない場合はカードを縮小せず、
結果画面をスクロールします。


## v20 CPUカード選択変更

CPUが使う5枚も、プレイヤーが実際に所持している `series_003` のカードからランダム選択するよう変更。

条件:
- 所持数が1以上
- `battleType` が設定済み
- 5種類からランダム選択
- プレイヤーが選んだカードとCPU側で同じカードが選ばれることはある


## v21 OVERLORD カード選択UI

CPU:
- 選択画面開始時に所持カードから5枚を決定
- 3枚だけ公開
- 残り2枚は伏せカード
- 対戦準備画面でも2枚は非公開
- バトル開始時に5枚の順番だけランダム化

PLAYER:
- すべて
- アタッカー
- タンク
- マジックキャスター
- タイプ未設定

のタブで所持カードを絞り込み。
タブ切替後も選択中の5枚は維持。
タイプ未設定カードは表示するが選択不可。


## v22 非戦闘員タイプ

追加タイプ:
- `noncombatant`
- 表示名: 非戦闘員

基本ルール:
- アタッカーにLOSE
- タンクにLOSE
- マジックキャスターにLOSE
- 非戦闘員同士はDRAW
- `world_champion`（たっちみー）にのみWIN

優先順位:
- guild_master: 100
- anti_world_champion: 80
- world_champion: 50
- 基本タイプ相性

そのため、
- モモンガ相当 vs たっちみー → DRAW
- 非戦闘員 vs たっちみー → WIN
- 通常タイプ vs 非戦闘員 → 通常タイプWIN

タイプアイコン:
- attacker: ⚔
- tank: ⬢
- magic: ✦
- noncombatant: ⚑
- unset: ？

カードUI上のタイプ名の左に表示。

## v23 変更点
- タイプアイコン（アタッカー / タンク / マジックキャスター / 非戦闘員）をカード表示へ実画像で反映。
- スキル持ちカードにスキル紋章を追加。
- カード画像の左上にタイプ、右上にスキルのバッジを表示して視認性を向上。
- タイプタブにもアイコンを反映。



## v24 アイコン整理

- カード情報欄のタイプ名横アイコンを削除
- カード名横のスキルアイコンを削除
- カード画像左上のタイプアイコンを大型化
- カード画像右上のスキルマークは維持
- 非戦闘員の `battleType` 指定値は `noncombatant`

## v25 スマホ図鑑ボタン修正

原因:
スマホ時の `.top-selector-stack` が `left:8px; right:8px; width:auto` で画面幅近くまで広がり、
`z-index:122` で `z-index:119` の図鑑ボタンより上に存在していたため、透明部分がタップを奪っていました。

修正:
- `.collection-open-btn` を `z-index:132` へ
- スマホ時の `.top-selector-stack` 自体は `pointer-events:none`
- 実際に操作する `.series-tab` / `.minigame-tab` だけ `pointer-events:auto`
- 図鑑ボタンへ `touch-action: manipulation` を追加


## v26 対戦アニメーション

各ROUND:
1. PLAYER / CPUカード表示
2. 両カードが中央へ突進
3. 衝突
4. WIN / LOSE / DRAW表示
5. 敗者カードのみ画面下へ落下
6. DRAWは両カードが少し弾かれて元位置へ
7. 次ROUND

スマホでは移動量を少し小さくしています。
`prefers-reduced-motion` にも対応。


## v27 元素マッチ3 ミニゲーム

実装対象: `series_002`（元素の人影）

- 最新アップロード版 `cards.csv` を採用
- 既存カードへ `elementSymbol` 列を追加
- 元素カード 118 枚に元素記号を設定
- 所持している元素カードだけ選択可能
- 7×7 / 5種類 / 3マッチ
- 無効交換は元に戻る
- 消去 → 落下 → 補充 → 自動連鎖
- 1ピース100点 × CHAIN倍率
- 元素ピース20個消去でSKILL
- スキルは盤面上の元素ピースを全消去
- スキル直接消去ではゲージ再充填なし
- スキル後の自然連鎖はゲージ加算あり
- 選択カード画像を使う共通カットイン
- 合法手なし + スキル使用不可でGAME OVER
- 全体ハイスコアをlocalStorageへ保存
- スマートフォン対応

調整値:
`puzzle/element-puzzle-core.js` の `PUZZLE_CONFIG`
