# La Voce ／ 羊のおうち アイテムカタログと素材調達

「おうち」のアイテムを増やすための、**何を作るか・どこから入手するか・どう作るか**の資料。

---

## 0. この文書について

| レーン | 担当 | 該当節 |
|---|---|---|
| **A** | Claude Sonnet 5 | §6 データモデル／§7 価格と解放の実装 |
| **B** | 坂本さん | §3〜§5 アイテムの制作／§8 素材の調達 |

**§9 のプロンプト集が、実質の「素材」です。** AI生成にそのまま貼れる形にしてあります。

前提となる質感の方針は **羊のおうち仕様 §3.2** を参照してください
（マットな粘土質感・テクスチャなし・面取り・2灯）。

---

## 1. 設計原則

### 1.1 アイテムは「増え続ける」ことが仕事

**ショップに新しいものが増え続けることが、継続の動機です。**
一点の完成度より、**追加し続けられること**を優先してください。
だから質感の基準を上げすぎない（羊のおうち仕様 §3.2）。

### 1.2 声のプロ特有のアイテムが、差別化になります

汎用の家具だけなら、他のどのアプリでも同じです。
**譜面台・音叉・台本・はちみつ・加湿器**——これらが置けることが、
「自分たちのためのアプリだ」という感覚を作ります。

**§3 の「声のプロ特有」カテゴリを最優先で作ってください。**

### 1.3 期間限定で「二度と手に入らない」を作らない

季節アイテムは**「今月の新作」として登場させ、以後は常設**にします。

期間限定は「いま買わないと損」というプレッシャーを生みます。
これは羊のおうち仕様 §1 の**「罰を作らない」原則に反します。**
体調が悪くて記録できなかった月に、二度と手に入らないものが流れていくのは、罰です。

### 1.4 達成で解放されるものは、累計ベースのみ

連続記録が途切れても失われないこと（羊のおうち仕様 §5）。

---

## 2. カテゴリと目標点数

既存の11カテゴリを維持します。

| カテゴリ | 現状 | 目標 | 優先度 |
|---|---|---|---|
| 持ち物 | 少 | **24** | ★★★ 声のプロ特有が最も出しやすい |
| 家具 | 少 | **20** | ★★★ |
| 帽子 | 6 | 14 | ★★ |
| 服 | 少 | **16** | ★★★ 職業が最も表れる |
| 壁掛け | 少 | 14 | ★★ |
| 庭の置物 | 少 | 16 | ★★ |
| 床 | 少 | 10 | ★ |
| 壁 | 少 | 10 | ★ |
| 窓枠 | 少 | 6 | ★ |
| 窓の景色 | 少 | 10 | ★★ 時間帯と連動して効く |
| 庭の景観 | 少 | 8 | ★ |

**合計およそ 148点。** 一度に作らず、§10 の順番で。

---

## 3. 声のプロ特有のアイテム（最優先）

**ここが差別化です。他のどのアプリにもありません。**

### 3.1 持ち物

| アイテム | 備考 |
|---|---|
| 音叉 | 美しく、声のプロにしか意味がわからない |
| メトロノーム | 木製の振り子式 |
| 楽譜 | 開いた状態／丸めた状態 |
| 台本 | 声優。付箋つき |
| 原稿 | アナウンサー。クリップボード |
| コンデンサーマイク | ポップガード付き |
| ハンドマイク | ライブ用 |
| ヘッドホン | 収録用 |
| 水筒 | 白湯 |
| はちみつの瓶 | ディッパー付き |
| のど飴の缶 | |
| 加湿マスク | |
| ネブライザー | 吸入器 |
| ストール | 喉を守る |
| 扇子 | 和物の演目にも |
| 花束 | 本番のあと |
| 温湿度計 | **環境の快適帯の機能と対応** |
| ストップウォッチ | 最長発声時間の測定 |

### 3.2 家具

| アイテム | 備考 |
|---|---|
| 譜面台 | **声のプロの象徴。最優先** |
| アップライトピアノ | |
| キーボード | |
| 楽譜の山 | 積み重ね |
| レコードプレーヤー | |
| ミキサー卓 | 声優・アナウンサー |
| 収録ブース | 小型・防音 |
| モニタースピーカー | |
| アンプ | ロック |
| ギタースタンド | |
| 加湿器 | **声のプロの必需品** |
| 姿見 | 発声フォームの確認 |
| 稽古用のバー | ミュージカル |

### 3.3 壁掛け

| アイテム | 備考 |
|---|---|
| 公演ポスター | |
| 額入りの楽譜 | |
| レコード盤 | |
| 賞状 | |
| 温湿度計（壁掛け） | |
| ヘッドホン掛け | |
| 掛け時計 | |

---

## 4. 職業別アイテム

**職業を切り替えたとき、ショップの並び順が変わる**ようにすると、
「自分のために作られている」感覚が強まります（§6.2）。

| 職業 | 服 | 持ち物 | 家具 |
|---|---|---|---|
| **声楽家** | 燕尾服／ロングドレス／稽古着 | 楽譜・音叉・花束 | 譜面台・ピアノ |
| **アナウンサー** | スーツ／ジャケット | 原稿・クリップボード・ヘッドセット | デスク・卓上マイク |
| **声優** | パーカー／ラフな部屋着 | 台本・ヘッドホン | 収録ブース・ミキサー卓 |
| **ポップス/ロック** | 革ジャン／ライブT | ハンドマイク・ピック | アンプ・ギタースタンド |
| **共通** | ストール・エプロン | 水筒・はちみつ・のど飴 | 加湿器・本棚 |

**どの職業でも全アイテムを買えるようにしてください。** 制限はしない。
兼業が普通の業界なので、並び順を変えるだけに留めます。

---

## 5. 達成で解放されるアイテム（購入不可）

**買えないからこそ意味があります。** すべて**累計ベース**で、失われません。

| 条件 | 解放されるもの |
|---|---|
| 累計 7日 | 庭の木：若木 |
| 累計 30日 | 庭の木：花が咲く |
| 累計 100日 | 庭の木：実がなる |
| 累計 365日 | 庭の木：大樹 |
| 初めて本番を記録 | 花束 |
| 本番の記録 10回 | 額入りの公演ポスター |
| 初めて弱声の最高音を記録 | 音叉 |
| 記録項目を10種類以上使った | 温湿度計 |
| 稽古ノートの目標を1つ達成 | 賞状 |

**「連続◯日」を条件にしないこと**（羊のおうち仕様 §5）。

---

## 6. データモデルと実装（レーンA）

### 6.1 アイテムの定義

```ts
type ItemCategory =
  | 'hat' | 'clothes' | 'held'
  | 'floor' | 'wall' | 'windowFrame' | 'windowView'
  | 'gardenScene' | 'furniture' | 'gardenObject' | 'wallHanging'

interface ShopItem {
  key: string
  category: ItemCategory
  nameKey: string                  // i18n キー（国際展開仕様 §2.4）
  price: number | null             // null = 購入不可（達成解放）
  unlock?: UnlockCondition         // 達成解放の条件
  professions?: ProfessionKey[]    // 並び順の優先に使う。購入制限には使わない
  season?: 'spring'|'summer'|'autumn'|'winter'|'event'
  layer: 'back' | 'mid' | 'front'  // 羊のおうち仕様 §2.2
  anchor: 'floor' | 'wall' | 'sheep'
  render: '2d' | 'prerender3d'     // 同 §3.5
  src: string
  width: number
  height: number
}
```

### 6.2 並び順

```
1. 未購入かつ、いま買えるもの（所持ptが足りている）  ← いちばん上
2. 未購入で、あと少しで買えるもの
3. その他の未購入
4. 購入済み

同じ層の中では、profession が一致するものを優先
```

**「あと3ptで買える」ものを目立たせてください**（羊のおうち仕様 §4.2 と対応）。

### 6.3 価格の目安

ポイントの入り方（羊のおうち仕様 §4.6）から逆算すると、**月あたり約135pt**です。

| 種別 | 価格 |
|---|---|
| 小物（持ち物・帽子） | 15〜30pt |
| 服 | 30〜50pt |
| 家具・庭の置物 | 40〜80pt |
| 床・壁・窓枠 | 60〜100pt |
| 窓の景色・庭の景観 | 80〜120pt |

**月に「大物1〜2点＋小物数点」**のペースになります。
安すぎると全部買えてしまい、高すぎると届きません。

---

## 7. 季節・イベントアイテム

**月替わりで1〜2点ずつ追加**し、**以後は常設**にします（§1.3）。

| 時期 | 候補 |
|---|---|
| 春 | 桜の木・花見の敷物・チューリップの花壇 |
| 夏 | 風鈴・浴衣・入道雲の窓景色・かき氷 |
| 秋 | 紅葉の木・月見団子・読書灯 |
| 冬 | こたつ・雪の窓景色・マフラー・ミカン |
| イベント | クリスマスツリー・鏡餅・ハロウィンのかぼちゃ |

「今月の新作」としてショップの先頭に出す。**入手期限は設けない。**

---

## 8. 素材の調達（レーンB・坂本さん）

**すべてをAI生成する必要はありません。無料で手に入るものが多くあります。**

| 入手先 | ライセンス | 内容 | おすすめ度 |
|---|---|---|---|
| **Kenney**（kenney.nl） | **CC0（帰属不要・商用可）** | スタイルの揃った低ポリの家具・小物が数千点 | **★★★ まずここ** |
| **Poly Haven** | **CC0（帰属不要・商用可）** | HDRI・テクスチャ・写実モデル | ★★★ **HDRIをBlenderの環境光に** |
| Sketchfab | **モデルごとに異なる** | 数百万点。玉石混交 | ★ **CC0/CC-BYで絞り、1点ずつ確認が必要** |
| Meshy（AI生成） | 無料枠は **CC BY 4.0（帰属表示が必要）**／**Pro $20/月から商用自由** | 何でも作れる | ★★ **無い物だけ** |

### 8.1 推奨の使い分け

```
汎用の家具・小物（ベッド・椅子・本棚・ラグ・机）
  → Kenney で探す。CC0 なので帰属表示も不要

Blender の環境光
  → Poly Haven の HDRI（studio 系のやわらかいもの）

声のプロ特有のもの（譜面台・音叉・台本・加湿器・羊）
  → ここだけ AI 生成、または自分でモデリング
```

**この分け方なら、AI生成が必要なのは30〜40点程度**で済みます。
**$20 のプランを1〜2ヶ月契約して作り切り、解約**すれば十分です。

### 8.2 無料枠の注意

Meshy の無料プランの出力は **CC BY 4.0** で、
**商用アプリで使うとアプリ内に帰属表示（クレジット）を載せる義務**が生じます。

**試作は無料枠でよいが、本番に載せるものは Pro 以降で作り直してください。**

### 8.3 どの素材でも共通の後処理

```
1. Blender に読み込む
2. マテリアルを全部剥がし、単色の Principled BSDF に置き換える
   （Roughness 0.75〜0.85 / Specular 0.2 / Metallic 0）
3. Bevel modifier をかける（幅 0.01〜0.02、セグメント 3）
4. 固定のカメラ・ライトのシーンに置く
5. 透過PNGで書き出す
```

**この後処理を通すことで、出どころの違う素材でもスタイルが揃います。**
Kenney の低ポリも、AI生成も、自作も、同じ見た目になります。

---

## 9. AI生成用プロンプト集（そのまま貼れます）

**全プロンプトの末尾に、必ずこの共通指定を付けてください。**

```
STYLE SUFFIX（共通・必須）:
, soft matte clay style, rounded beveled edges, single flat color,
no texture, no text, no logo, simple, cute, miniature toy, neutral pose
```

### 9.1 声のプロ特有（最優先）

```
a wooden music stand, folded music sheets on it
a small upright piano with closed lid
a metal tuning fork standing upright
a wooden pendulum metronome
a stack of sheet music books
a rolled-up music score with a ribbon
a script booklet with sticky notes on the pages
a clipboard with a paper script
a condenser microphone on a desk stand with pop filter
a handheld vocal microphone on a floor stand
over-ear studio headphones
a small vinyl record player with an open lid
a compact audio mixing console
a small soundproof recording booth, one door, one window
a cool mist humidifier with a soft steam plume
a nebulizer inhaler device
a honey jar with a wooden dipper
a round tin of throat lozenges
an insulated water bottle
a folded scarf
a folding hand fan, closed
a bouquet of flowers wrapped in paper
a wall-mounted thermometer and hygrometer
a full-length standing mirror with a wooden frame
a ballet practice barre, short section
a guitar stand, empty
a small guitar amplifier
a pair of monitor speakers
a framed concert poster
a framed sheet of music
a certificate in a frame
```

### 9.2 汎用の家具・小物（Kenney に無い場合のみ）

```
a single bed with a folded blanket
a small armchair
a low wooden bookshelf with a few books
a round side table
a floor lamp with a fabric shade
a potted houseplant with round leaves
a woven round rug
a wooden desk with one drawer
a wall clock, round
a small alarm clock
a tea cup on a saucer
a stack of folded towels
```

### 9.3 庭

```
a wooden garden bench
a small stone fountain
a round pond with lily pads
a garden lamp post
a flower bed with small round flowers
a wooden mailbox on a post
a small wooden shed
a rope swing hanging from a branch
a clothesline with hanging wool
a birdbath
a stone path, three stepping stones
a young tree with a slender trunk
a tree with pink blossoms
a tree with round fruit
a large old tree with a thick trunk
```

### 9.4 帽子・服（羊が装備するもの）

```
a straw hat with a ribbon band
a knitted winter hat with a pompom
a beret
a top hat
a laurel wreath crown
a small tiara
a broadcast headset with a boom microphone
a black tailcoat, front view, flat lay
a long evening dress, flat lay
a business suit jacket, flat lay
a casual hoodie, flat lay
a leather jacket, flat lay
a band t-shirt, flat lay, no text
a knitted scarf, coiled
```

> **服のプロンプトには `no text` を必ず入れてください。**
> AI生成はロゴや文字を勝手に入れ、それが権利問題になります。

### 9.5 羊本体（最初に作るもの）

```
a small fluffy sheep character, standing, front view,
round cloud-like wool body, small cream face, two dot eyes,
two drooping ears, a red ribbon on the head
, soft matte clay style, rounded beveled edges, single flat color,
no texture, no text, simple, cute, miniature toy
```

**表情や姿勢の違いは、生成し直すのではなく Blender で調整してください。**
生成し直すと羊の形が変わり、同一のキャラクターに見えなくなります。

---

## 10. 制作の順番（レーンB）

| 順 | 内容 | 点数 | 備考 |
|---|---|---|---|
| 1 | **羊**（idle 3 / happy 4 / sleep 2 / react 4） | 1体・13枚 | **ここで質感を確定させる** |
| 2 | 既存アイテムの3D化 | 現有分 | まず今あるものを置き換える |
| 3 | **§3 声のプロ特有** | 約40点 | **差別化。ここが本体** |
| 4 | §4 職業別の服 | 約16点 | |
| 5 | §5 達成解放（木の4段階ほか） | 約9点 | |
| 6 | 庭・床・壁・窓の景色 | 約40点 | |
| 7 | §7 季節（月1〜2点） | 継続 | |

**1 で作った羊が、以後すべての基準になります。** ここに時間をかけてください。

**そして1体できたら、いったん止めて、いまの2D背景に置いてみてください。**
質感の判断はそこで。良ければ2以降に進みます。

---

## 11. Sonnet 5 への依頼のコツ

- **レーンB（§3〜§5 の制作、§8 の調達、§9 のプロンプト）には手を出さない。**
  アセットは作れません
- §6 のデータモデルを先に作り、**アイテムが増えても実装を触らずに済む形**にする。
  アイテム追加が「JSONに1行足すだけ」になっていること
- **`professions` を購入制限に使わせない**（§4）。並び順の優先だけ
- **`season` を入手期限に使わせない**（§1.3）。「今月の新作」の表示にだけ使う
- 達成解放の条件を**連続記録ベースにさせない**（§5）。累計のみ
- 価格は §6.3 の範囲に収め、**バランス調整は定数ファイル1箇所**でできるようにする

---

## 注意書き

本書はアイテム設計の検討材料です。
外部素材を使う場合は、必ず各サイトのライセンスを個別に確認してください
（Sketchfab はモデルごとに異なります）。
AI生成の出力に文字・ロゴが含まれていないか、書き出し前に必ず目視で確認してください。
