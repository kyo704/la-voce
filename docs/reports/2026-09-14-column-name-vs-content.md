# 列の 名前と、★中に 入って いる ものの ずれ

★2026-09-14

★★この 紙は、★**名前と 中身が 合って いない 列**を 並べます。

★★直して いません。★38人の 記録が 入って います。
　★★名前を 直す ときは、★**画面の 言葉と いっしょに、★1つの 記録番号で** します。
　★★1つずつ 直すと、★書く 側と 読む 側が 別の 日に 変わります。

## 3つ

| 列 | 名前が 言って いる もの | 実際に 入って いる もの | 出どころ |
|---|---|---|---|
| `throat_condition` | のどの 調子 | **からだの 感じ**（`bodyFeel`） | 裁定 その29 |
| `voice_quality` | 声の 出来 | **`quality` を 10段→5段に 丸めた もの** | 裁定 その29 |
| `resonance_score` | 響き（resonance）の 点数 | **声の 出来**（0〜10・丸めて いない） | ★2026-09-14 |

## `resonance_score` ── ★3つめ

★出どころ `components/VocalTracker.jsx:1794`

```js
resonanceScore: rep.quality, // resonance_scoreは元々0-10なので、qualityとそのまま対応する
```

★★名前は「響き」ですが、★入って いるのは **声の 出来** です。

### ★もう1つ、★名前が ぶつかって います

★★外からの ご提案に あった `resonanceScore`（★点数）は、
　★**永久に 採らない** と 決まって います（★裁定 その46 の 2.6）。

★★同じ 名前が、★
- ★この アプリの 列（★中身は 声の 出来）
- ★採らないと 決めた 点数

★の 2つを 指して います。★読む 人が 取り違えます。

## `resonance_score` と `voice_entries[].quality` の 関係

★★**同じ ときと、★ちがう ときが あります。**

### 同じに なる とき

```js
// components/VocalTracker.jsx:1715
quality: median(qualityVals)      // ★その日の 記録 ぜんぶの 中央値
// components/VocalTracker.jsx:1794
resonanceScore: rep.quality       // ★その 中央値を そのまま
```

★★`voice_entries` が **1件だけ** の 日は、★中央値＝その 値です。★一致します。

### ちがう とき

★★`voice_entries` が **2件以上** の 日。
　★`resonance_score` は **その日の 中央値** ひとつ。
　★`voice_entries[].quality` は **1件ずつ** の 値です。

★★例 ── ★朝 3、★昼 7、★夜 8 と 書いた 日
- `resonance_score` … **7**（中央値）
- `voice_entries[].quality` … **3, 7, 8**

### ★もう1つ、★食い違う 道が あります

★★古い 行を 読み直す とき（`components/VocalTracker.jsx:1648`）──

```js
quality: typeof row.resonance_score === "number"
  ? row.resonance_score
  : fiveScaleToQuality10(row.voice_quality)
```

★★`resonance_score` が 空の 古い 行では、★**5段から 逆算** します。
　★★逆算した 値は、★もとの 10段の 値では ありません。
　　★5段は 丸めた あとです。★戻せません。
　★★その 行の `voice_entries[].quality` は、★**逆算した 値** に なります。

## まとめ（★門に 使う なら）

- ★1日 1つの 値が 要るなら … `resonance_score`（★その日の 中央値）
- ★1件ずつ 要るなら … `voice_entries[].quality`
- ★どちらも 10段です。★`voice_quality` は 使いません（★丸めた 写し）
- ★★ただし **古い 行**は、★5段から 逆算した 値の ことが あります。
  ★★`resonance_score` が 入って いるかで 見分けられます。

## この 紙が 見て いない こと

- 本番の 台帳で、★何行が 逆算の 値かは 数えて いません。
- `voice_entries` が 2件以上 ある 日が 何日 あるかも 数えて いません。
