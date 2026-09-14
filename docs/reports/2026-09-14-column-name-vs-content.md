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

---

# ★2026-09-14 追記 ── `entries` の 列 ぜんぶを 見ました

★出どころ C1（★Opus）──「3つだけでは なく、★entries の 列 ぜんぶで 見よ」。

★★わけ ── ★分析の 拡張(2)では、★使う 人が **名前で** 項目を 選びます。
　★★「のどの 様子」を 選んだ 人に「からだの 感じ」が 返ったら、★気づけません。

## 数え（`tools/column_name_scan.py`）

```
★entryToRow が 書く 列: 64
  名前と もとが 同じ　: 49
  ★ちがう　　　　　　 : 6
  ★★名前は 合うが、★中で 別の ものから 作って いる: 6
  読めない（式が 複雑）: 3

★★★名前と 中身が ずれて いる 列（★これが 探して いた もの）
  ✗✗ throat_condition　もとは 「bodyFeel」
       intOrNull(rep.bodyFeel)
  ✗✗ voice_quality　もとは 「quality」
       intOrNull(quality10ToFiveScale(rep.quality))
  ✗✗ wake_note　もとは 「pitchChest」
       wakeEntry ? wakeEntry.pitchChest || null : null
  ✗✗ routine_note　もとは 「pitchChest」
       routineEntry ? routineEntry.pitchChest || null : null
  ✗✗ resonance_score　もとは 「quality」
       rep.quality, // resonance_scoreは元々0-10なので、qualityとそのまま対応する
  ✗✗ pianissimo_high_note　もとは 「pitchSoftMax」
       wakeEntry ? wakeEntry.pitchSoftMax || null : null

★★名前と もとの 形が ちがう 列（★多くは 足し算です。★ずれでは ありません）
  ✗ water_intake　（名前なら waterIntake／もとは waterBySlot）
      Object.values(e.waterBySlot || {}).reduce((total, v) => total + (Numbe
  ✗ carbs_g　（名前なら carbsG／もとは meals, carbs）
      hasDetailedMeals ? sumMacro(e.meals, "carbs") : (simpleMacros ? simple
  ✗ protein_g　（名前なら proteinG／もとは meals, protein）
      hasDetailedMeals ? sumMacro(e.meals, "protein") : (simpleMacros ? simp
  ✗ fat_g　（名前なら fatG／もとは meals, fat）
      hasDetailedMeals ? sumMacro(e.meals, "fat") : (simpleMacros ? simpleMa
  ✗ fiber_g　（名前なら fiberG／もとは meals, fiber）
      hasDetailedMeals ? sumMacro(e.meals, "fiber") : (simpleMacros ? simple
  ✗ exercise_minutes　（名前なら exerciseMinutes／もとは exercises）
      (e.exercises || []).reduce((total, x) => total + (Number(x.minutes) ||

★★読めなかった 列（★式が 複雑。★手で 見る 要あり）
  ? repertoire　legacyRepertoire || null
  ? activity_detail　primary
  ? performance_quality　numOrNull(derivedPerformanceQuality)
```

## ★ずれて いる 列　**6つ**（★3つ → 6つに 増えました）

| 列 | 名前が 言って いる もの | 中に 入って いる もの |
|---|---|---|
| `throat_condition` | のどの 調子 | **からだの 感じ**（`bodyFeel`） |
| `voice_quality` | 声の 出来 | **`quality` を 5段に 丸めた もの** |
| `resonance_score` | 響きの 点数 | **声の 出来**（0〜10） |
| `wake_note` | 起き抜けの **メモ** | **胸声の 高さ**（`pitchChest`） |
| `routine_note` | 発声の **メモ** | **胸声の 高さ**（`pitchChest`） |
| `pianissimo_high_note` | pp の **高い音** | **いちばん 弱く 出せる 高さ**（`pitchSoftMax`） |

★★`wake_note` と `routine_note` は、★名前に 「note（メモ）」と 付いて います。
　★★中に 入って いるのは **音の 高さ**です。★文では ありません。
　★★もし 拡張(2)の 一覧に 「起き抜けの メモ」と 出したら、
　　★選んだ 人は **文**を 期待します。★返るのは 音名です。

## ★ずれで **ない** もの（★見分けの ため）

★★次の 6つは、★名前と 中身は 合って います。★**形**だけ ちがいます。

`water_intake`／`carbs_g`／`protein_g`／`fat_g`／`fiber_g`／`exercise_minutes`

★★どれも「足し算した もの」です。
　★例 `water_intake` … `waterBySlot` の 中身を ぜんぶ 足した 数。
　★★水の 量、という 名前は 正しい です。

## ★読めなかった 列　3つ（★手で 見ました）

| 列 | 式 | 見立て |
|---|---|---|
| `repertoire` | `legacyRepertoire \|\| null` | ★曲名を「、」で つないだ もの。★合って います |
| `activity_detail` | `primary` | ★1つ目の 活動の 細目。★合って います |
| `performance_quality` | `numOrNull(derivedPerformanceQuality)` | ★1つ目の 本番の 出来。★合って います |

## 直して いません

★★名前は **画面の 言葉と いっしょに、★1つの 記録番号で** 直します。
　★★38人の 記録が 入って います。
　★★書く 側と 読む 側が 別の 日に 変わると、★その あいだの 記録が 壊れます。

## この 数えが 見て いない こと

- `entryToRow` が 書く 列だけ です。★読む 側（`rowToEntry`）は 見て いません。
- 「名前が 言って いる もの」は、★私が 列名から 読み取った ものです。
  ★★正しい 呼び名は、★画面の 言葉と いっしょに 決める ことに なります。

