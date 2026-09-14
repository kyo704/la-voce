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

---

# ★2026-09-14 追記② ── 私の 数えの 訂正

★出どころ C1 の Q1〜Q3（★Opus）

## ★訂正 ── 6つの うち **3つは ずれで ありません でした**

★★`wake_note` `routine_note` `pianissimo_high_note` を、
　★「名前は メモ、★中身は 音の 高さ」と 申しました。★**誤りです。**

★★画面の 言葉を 見ると、★**もう 正しく 書いて あります** ──

| 列 | 画面の 言葉（`lib/translations.js`） |
|---|---|
| `wake_note` | **起き抜けの地声の音名** |
| `routine_note` | **ルーティーン後の地声の音名** |
| `pianissimo_high_note` | **弱声の最高音**（`lib/ownRecordFields.js:108`） |

★★音楽で「note」は **音名**です。★メモでは ありません。
　★★私が 英語の note を「メモ」と 読んだ ために 出た 誤りです。
　★★列名は 正しい です。★使う 人に 出る 言葉も 正しい です。

## ★本当に ずれて いるのは **3つ**（★元の とおり）

| 列 | 名前 | 中身 |
|---|---|---|
| `throat_condition` | のどの 調子 | **からだの 感じ**（`bodyFeel`） |
| `voice_quality` | 声の 出来 | **`quality` を 5段に 丸めた もの** |
| `resonance_score` | 響きの 点数 | **声の 出来**（0〜10） |

## Q1　`wake_note` と `routine_note` は 同じ ものか

★★**同じ 中身の 型で、★取る ときが ちがいます。**

| | いつの 記録から | 出どころ |
|---|---|---|
| `wake_note` | `context === "wake"`（★起き抜け） | `wakeEntry.pitchChest` |
| `routine_note` | `context === "after_routine"`（★発声の あと） | `routineEntry.pitchChest` |

★★どちらも **地声の 音名** です。★型は 同じ、★時が ちがいます。

★★この 2つは、★**引き算の ため**に 分けて あります ──
```js
// components/VocalTracker.jsx:7533
const deltaST = routineMidi - wakeMidi;   // ★ウォームアップで 何半音 上がったか
```
★★受け皿を 1つに すると、★同じ 1件が 両方に なり、★差が 必ず 0 に なります。
　★★`components/VocalTracker.jsx:1752` に、★その 注意が 書いて あります。

★★**分析の 拡張(2)の 一覧に 2つ 並べても、★取り違えは 起きません。**
　★言葉が すでに「起き抜けの」「ルーティーン後の」と 分かれて います。

## Q2　`pitchChest` は、★正しい 名前で どこかに あるか

★★**あります。** ★`entries.voice_entries[].pitchChest`。

★★1件ずつの 記録の 中に、★`pitchChest` という 名前の まま 入って います。
　★`wake_note` `routine_note` は、★そこから **取り出した 写し**です。

★★同じく `pitchSoftMax` も `voice_entries[].pitchSoftMax` に あります。

## Q3　6つは、★どう 呼ぶ べきか（★ご提案）

| 列 | いまの 名前 | ご提案 | わけ |
|---|---|---|---|
| `throat_condition` | のどの 調子 | **`body_feel`** | 中身の とおり。画面の 言葉も「からだの 感じ」に |
| `voice_quality` | 声の 出来 | **`voice_quality_5`** | 5段に 丸めた 写し、と 名前で 言う |
| `resonance_score` | 響きの 点数 | **`voice_quality_10`** | 声の 出来の 生の 値。★`score` を 外す |
| `wake_note` | — | **そのまま** | 音名の note。★正しい |
| `routine_note` | — | **そのまま** | 同上 |
| `pianissimo_high_note` | — | **そのまま** | 同上 |

★★`resonance_score` の `score` を 外す わけ ──
　★★「点数」は、★この 製品が **出さないと 決めた** ものです。
　★★列名に 残って いると、★いつか 画面に 出ます。

★★★決めるのは Opus と 坂本さんです。★これは 案です。

## ★直して いません

★★名前は **画面の 言葉と、★分析の 項目一覧と いっしょに**、
　★1つの 記録番号で 直します（★9月15日の あと）。

---

# ★2026-09-14 追記③ ── `voice_quality` を 読んで いる ところ

★出どころ RENAME_DECISION（★Opus）──「列ごと 消す（B案）が 使えるか、★読み手を 並べよ」。

## 答え ── ★**B案（列ごと 消す）は、★いま 使えません**

★★`voice_quality` は、★**いま も 読まれて います**。★36か所 です。

## 読み手（★アプリの 中の `voiceQuality`）

| ファイル | 数 | 何に 使って いるか |
|---|---|---|
| `components/VocalTracker.jsx` | 16 | 分析の ほとんど（★休養の 方法別／滞在地別／前の日との つなぎ／時間帯／…） |
| `lib/compareView.js` | 2 | ★**くらべる の 門**（★声の 出来を 群に 分ける） |
| `lib/lookBack.js` | 1 | ならべる の 線 |
| `lib/todayCard.js` | 1 | きょうの 1枚 |
| `lib/ownRecordFields.js` | 1 | 自分の 記録の 一覧 |
| `lib/exportSummary.js` | 1 | 書き出し |
| `lib/character.js` | 1 | 羊の 点 |
| `lib/recordV2.js` | 1 | 記録の 画面 |
| `components/NotesV2.jsx` | 1 | 曲の 台帳 |

★★とくに 重い ものが 2つ あります。

★★**① `lib/compareView.js`** ── ★くらべる の 門が、★ここを 読みます。
　★★裁定 その46 は「門は 10段（`resonance_score`）を 読む」と 決めました。
　★★けれど **いまの くらべるは 5段を 読んで います**。
　★★つまり、★門の 読み先を 変える 作業が、★この 消去の 前に 要ります。

★★**② `app/api/advice/route.js:24`** ── ★AI の 助言に 送る 文。
```js
parts.push(`声:${r.voice_quality ?? "-"}/5`);
```
★★「/5」と 書いて 送って います。★10段に 変えるなら、★この 文も 変わります。

## ★台帳の 側にも あります

| 置き場所 | 何 |
|---|---|
| `supabase/migration_teacher_student_entries_rpc.sql:40,82` | ★**先生に 見せる 列**の 並びに 入って います |
| `lib/entryColumns.js:45` | 書いて よい 列の 並び |
| `lib/events.js:67` | 出来事に 記録する 列 |

★★先生に 見せる 列から 消すと、★先生の 画面から 声の 出来が 消えます。
　★★これは **見せ方の お決め**です。★名前の 話では ありません。

## ★別の 名前（`role_master.voice_quality`）

★★`components/VocalTracker.jsx:6215, 12439, 12595` の `voice_quality` は、
　★**`entries` では ありません**。★`role_master`（★役の 台帳）の 列です。

★★中身は「その 役に 求められる 声の 質」── ★自由な 字です。★5段では ありません。

★★**同じ 名前が、★2つの 表で 別の ものを 指して います。**
　★★これは 4つめの ずれ です。★きょうまで 見つけて いません でした。

## ご提案

| 案 | できるか | わけ |
|---|---|---|
| B（列ごと 消す） | ★いまは 無理 | 36か所が 読んで います。門も 先生の 画面も |
| A（`voice_quality_5_display`） | できます | 名前で「写し」と 言えます |
| C（順番を 変える） | ★これを ご提案します | ① 読み手を 10段に 移す → ② そのあと 消す |

★★**C案の 中身**
- ★① `lib/compareView.js` の 門を `resonance_score` に 移す（★裁定 その46 の とおり）
- ★② `app/api/advice/route.js` の「/5」を 直す
- ★③ 残りの 読み手を 1つずつ 10段に 移す
- ★④ 先生に 見せる 列の お決めを いただく
- ★⑤ そこまで 済んでから、★列を 消す

★★①〜③の あいだ、★列は `voice_quality_5_display` の 名前で 残します。
　★★「これは 写しです」と、★名前で 言えます。

