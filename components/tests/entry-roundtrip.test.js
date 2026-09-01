#!/usr/bin/env node
/**
 * lavoce-作業計画v2-構造変更の分離.md §4.1「最低限のテスト（6本）」に対応する回帰テスト。
 *
 * 【重要】このスクリプトは VocalTracker.jsx を「コピーして貼り付けた」テストではありません。
 * 実行のたびに VocalTracker.jsx から entryToRow / rowToEntry / migrateLegacyToActivities などの
 * 実装を直接抽出して検証します。これにより、将来これらの関数を変更したときに
 * テストが古いコピーのまま気づかず形骸化する、という事故を防ぎます。
 *
 * 実行方法：
 *   node tests/entry-roundtrip.test.js
 *
 * Jest 等のテストランナーは不要です（依存を増やさない方針）。
 * 声の記録構造変更（記録項目v2 §3.1・3.2）に着手する前に、必ずこれを実行してください。
 */

const fs = require("fs");
const path = require("path");

const SOURCE_PATH = path.join(__dirname, "..", "VocalTracker.jsx");

// ---------------------------------------------------------------------------
// VocalTracker.jsx から、指定した名前の関数定義を「そのまま」抽出するユーティリティ。
// 波かっこの対応を数えることで、関数の終わりを正しく見つける（正規表現の限界を回避）。
// ---------------------------------------------------------------------------
function extractFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`関数 ${name} が VocalTracker.jsx 内に見つかりませんでした。関数名が変更された可能性があります。`);
  }
  let i = source.indexOf("{", start);
  if (i === -1) throw new Error(`関数 ${name} の開始かっこが見つかりません。`);
  let depth = 0;
  let end = -1;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  if (end === -1) throw new Error(`関数 ${name} の終わりが見つかりませんでした（波かっこの対応が崩れている可能性）。`);
  return source.slice(start, end);
}

// 関数だけでなく、`const NAME = {...}` のようなオブジェクト/配列定数も抽出する。
// 波かっこ・角かっこ両方の対応を数えて、宣言の終わり（セミコロン）を正しく見つける。
function extractConst(source, name) {
  const marker = `const ${name} = `;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`定数 ${name} が VocalTracker.jsx 内に見つかりませんでした。`);
  }
  let i = start + marker.length;
  let depth = 0;
  let end = -1;
  for (; i < source.length; i++) {
    if (source[i] === "{" || source[i] === "[") depth++;
    else if (source[i] === "}" || source[i] === "]") depth--;
    else if (source[i] === ";" && depth === 0) { end = i + 1; break; }
  }
  if (end === -1) throw new Error(`定数 ${name} の終わりが見つかりませんでした。`);
  return source.slice(start, end);
}

function loadFunctions(names, constNames = []) {
  const source = fs.readFileSync(SOURCE_PATH, "utf-8");
  const funcSnippets = names.map((n) => extractFunction(source, n));
  const constSnippets = constNames.map((n) => extractConst(source, n));
  const sandbox = {};
  // 定数を先に、関数をあとに評価する（関数の中で定数を参照している場合があるため）。
  const code = constSnippets.join("\n") + "\n" + funcSnippets.join("\n") + "\n" +
    names.concat(constNames).map((n) => `sandbox.${n} = ${n};`).join("\n");
  const fn = new Function("sandbox", code);
  fn(sandbox);
  return sandbox;
}

// ---------------------------------------------------------------------------
// テスト用の最小フレームワーク（依存を増やさないため自前で用意）
// ---------------------------------------------------------------------------
let passCount = 0;
let failCount = 0;
function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) {
    console.log(`  ✓ ${label}`);
    passCount++;
  } else {
    console.log(`  ✗ ${label}`);
    console.log(`      期待値: ${b}`);
    console.log(`      実際値: ${a}`);
    failCount++;
  }
}
function assertTrue(cond, label) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passCount++;
  } else {
    console.log(`  ✗ ${label}`);
    failCount++;
  }
}
function assertNoThrow(fn, label) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passCount++;
  } catch (err) {
    console.log(`  ✗ ${label}（例外: ${err.message}）`);
    failCount++;
  }
}

// ---------------------------------------------------------------------------
// 実装の読み込み
// ---------------------------------------------------------------------------
const { intOrNull, numOrNull, boolOrNull, weatherSourceOrNull, sumMacro, derivePrimaryActivityLegacy, migrateLegacyToActivities, fiveScaleToQuality10, migrateLegacyToVoiceEntries, deriveVoiceEntryRepresentatives, deriveLegacyVoiceFieldsFromEntries, rowToEntry, entryToRow } = loadFunctions([
  "numOrNull",
  // ★entryToRow が呼ぶ新しいヘルパは、必ずここに足すこと（CLAUDE.md）。
  "boolOrNull",
  "weatherSourceOrNull",
  "sumMacro",
  "derivePrimaryActivityLegacy",
  "migrateLegacyToActivities",
  "fiveScaleToQuality10",
  "migrateLegacyToVoiceEntries",
  "deriveVoiceEntryRepresentatives",
  "intOrNull",
  "quality10ToFiveScale",
  "deriveLegacyVoiceFieldsFromEntries",
  "rowToEntry",
  "entryToRow"
], [
  "VOICE_QUALITY_SLOT_TIME",
  "VOICE_QUALITY_SLOT_CONTEXT"
]);

const USER_ID = "test-user-id";

function sampleFullEntry() {
  return {
    date: "2026-08-26",
    throatCondition: 4,
    voiceQuality: 3,
    throatSymptoms: ["乾燥", "違和感"],
    sleepHours: 6.5,
    sleepQuality: 4,
    mealNotes: "特になし",
    location: "甲府",
    temperature: 28,
    humidity: 45,
    performanceQuality: null,
    ease: 4,
    notes: "テスト用の記録",
    weightKg: 58.2,
    bodyFatPct: 21.3,
    meals: [{ id: "m1", slot: "朝食", name: "卵", isPreset: false, grams: 100, carbs: 1, protein: 12, fat: 10, fiber: 0 }],
    exercises: [{ id: "ex1", type: "有酸素運動", minutes: 20, intensity: 3, memo: "" }],
    voiceCheckins: {},
    waterBySlot: { total: 1800 },
    weather: "",
    mentalReason: "",
    mentalTags: [],
    throatSymptomsOther: "",
    voiceMemo: "調子は普通",
    wakeNote: "A3",
    routineNote: "C4",
    resonanceScore: 7,
    bedtime: "23:30",
    dinnerTime: "19:00",
    dinnerTags: ["あっさり"],
    loadDetail: {},
    cycleStart: false,
    medicationTags: [],
    ambientNoiseDb: null,
    flightHours: null,
    jetlagHours: null,
    pianissimoHighNote: "E5",
    pianissimoOnsetDelay: false,
    speakingLevel: 1,
    noisyEnvironment: false,
    cppsValue: 12.4,
    exerciseLevel: null,
    proteinLevel: null,
    calorieLevel: null,
    activities: [
      {
        id: "act1",
        kind: "自主練習",
        startAt: "",
        minutes: 60,
        items: [
          { repertoireName: "蝶々夫人", minutesOverride: null, order: 0 },
          { repertoireName: "トスカ", minutesOverride: 20, order: 1 }
        ],
        order: 0,
        detail: { practiceMenu: "スケール練習" }
      }
    ],
    recovery: null
  };
}

function sampleMinimalEntry() {
  // §4.1 テスト2: 任意フィールドが未入力（null/undefined）でも保存・読み出しできること
  return {
    date: "2026-08-27",
    activities: [],
    recovery: { methods: [], note: "" }
  };
}

console.log("=== テスト1: 保存→読み出しで、すべてのフィールドの値が一致する ===");
{
  const original = sampleFullEntry();
  const row = entryToRow(USER_ID, original);
  const loaded = rowToEntry(row);

  assertEqual(loaded.throatCondition, original.throatCondition, "throatCondition が一致する");
  assertEqual(loaded.sleepHours, original.sleepHours, "sleepHours が一致する");
  assertEqual(loaded.weightKg, original.weightKg, "weightKg が一致する");
  assertEqual(loaded.bodyFatPct, original.bodyFatPct, "bodyFatPct が一致する");
  assertEqual(loaded.wakeNote, original.wakeNote, "wakeNote が一致する");
  assertEqual(loaded.pianissimoHighNote, original.pianissimoHighNote, "pianissimoHighNote が一致する");
  assertEqual(loaded.cppsValue, original.cppsValue, "cppsValue が一致する");
  assertEqual(loaded.dinnerTags, original.dinnerTags, "dinnerTags が一致する");
  assertEqual(loaded.activities, original.activities, "activities（曲目リスト含む）が一致する");
  assertEqual(row.user_id, USER_ID, "user_id が正しく設定される");
}

console.log("\n=== テスト2: 任意フィールドが未入力（null/undefined）でも保存・読み出しができる ===");
{
  const minimal = sampleMinimalEntry();
  assertNoThrow(() => entryToRow(USER_ID, minimal), "空に近いエントリで entryToRow が例外を投げない");
  const row = entryToRow(USER_ID, minimal);
  assertNoThrow(() => rowToEntry(row), "その結果を rowToEntry に渡しても例外を投げない");
  const loaded = rowToEntry(row);
  assertEqual(loaded.activities, [], "activities は空配列のまま");
  assertTrue(loaded.throatCondition === null || loaded.throatCondition === undefined, "throatCondition は null/undefined のまま（勝手に既定値を入れない）");
}

console.log("\n=== テスト3: entryToRow は入力オブジェクトを変更しない（副作用がない） ===");
{
  const original = sampleFullEntry();
  const snapshot = JSON.parse(JSON.stringify(original));
  entryToRow(USER_ID, original);
  assertEqual(original, snapshot, "entryToRow 呼び出し後も、渡したオブジェクトの中身が変わっていない");
  console.log("  ℹ「過去日を編集しても他の日が変わらない」の本体は React 側の状態管理（setEntries の不変更新）に" +
    "依存するため、ここでは entryToRow 自体に副作用がないことまでを保証します。");
}

console.log("\n=== テスト4/5: 重複防止・オフライン同期について ===");
{
  console.log("  ℹ これらは Supabase への実際の書き込み（upsert の onConflict 挙動、ネットワーク再送）に" +
    "依存するため、純粋関数の単体テストでは検証できません。手動またはE2Eでの確認が必要です。");
  console.log(`  ✓ entryToRow が常に同じ (user_id, date) の組を返すことだけ確認します`);
  const e = sampleFullEntry();
  const row1 = entryToRow(USER_ID, e);
  const row2 = entryToRow(USER_ID, e);
  assertEqual([row1.user_id, row1.date], [row2.user_id, row2.date], "同じエントリなら (user_id, date) は毎回一致する（upsertの前提条件）");
}

console.log("\n=== テスト6: 曲目配列の並べ替え・削除後も order が連番で整合している ===");
{
  // §2.1の並べ替え・削除ロジックと同じ規則（順序変更後にorderを振り直す）を、
  // 独立した純粋関数として検証する。実装（moveRepertoireItemInActivity等）はUI状態に
  // 密結合しているため、ここでは同じ不変条件をロジックとして再現して検証する。
  function reindexOrder(items) {
    return items.map((it, i) => ({ ...it, order: i }));
  }
  const items = [
    { repertoireName: "A", order: 0 },
    { repertoireName: "B", order: 1 },
    { repertoireName: "C", order: 2 }
  ];
  // 削除（Bを削除）
  const afterRemove = reindexOrder(items.filter((it) => it.repertoireName !== "B"));
  assertEqual(afterRemove.map((it) => it.order), [0, 1], "削除後、order が連番になっている");
  assertEqual(afterRemove.map((it) => it.repertoireName), ["A", "C"], "削除後、残った項目の順序が正しい");
  // 並べ替え（0番目と1番目を入れ替え）
  const swapped = [afterRemove[1], afterRemove[0]];
  const afterSwap = reindexOrder(swapped);
  assertEqual(afterSwap.map((it) => it.order), [0, 1], "並べ替え後も order が連番になっている");
  assertEqual(afterSwap.map((it) => it.repertoireName), ["C", "A"], "並べ替え後、順序が正しく入れ替わっている");
}

console.log("\n=== 移行レイヤーの検証: 旧形式（単一activityType）→ activities[] への変換 ===");
{
  const legacyRow = {
    date: "2026-08-01",
    activity_type: "本番",
    activity_duration: 90,
    repertoire: "蝶々夫人",
    activity_detail: {}
  };
  const { activities, recovery } = migrateLegacyToActivities(legacyRow);
  assertEqual(activities.length, 1, "旧形式の単一活動が、activities配列1件に変換される");
  assertEqual(activities[0].kind, "本番", "活動種別が正しく引き継がれる");
  assertEqual(activities[0].minutes, 90, "活動時間が正しく引き継がれる");
  assertEqual(activities[0].items[0].repertoireName, "蝶々夫人", "曲目名が正しく引き継がれる");
  assertEqual(activities[0].source, "migrated", "移行フラグ source:'migrated' が立っている");
  assertEqual(recovery, null, "本番の日は recovery が null");

  const legacyRestRow = { date: "2026-08-02", activity_type: "休養", activity_detail: { restMethods: ["読書"], restMethodOther: "" } };
  const restResult = migrateLegacyToActivities(legacyRestRow);
  assertEqual(restResult.activities, [], "休養日は activities が空配列になる");
  assertEqual(restResult.recovery.methods, ["読書"], "休養方法が recovery.methods に正しく移る");
}

console.log("\n=== 声の構造変更（作業計画v2 §5）: VoiceEntry[] 移行ロジックの検証 ===");
{
  // ケースA: 総合（1組）だけの日 → 正午のVoiceEntry 1件にまとまる
  const totalOnlyRow = { date: "2026-08-10", throat_condition: 4, voice_quality: 3, resonance_score: 7, throat_symptoms: ["乾燥"], voice_memo: "普通" };
  const totalEntries = migrateLegacyToVoiceEntries(totalOnlyRow);
  assertEqual(totalEntries.length, 1, "総合のみの日は VoiceEntry 1件になる");
  assertEqual(totalEntries[0].context, "other", "総合のみの日は context:'other'");
  assertEqual(totalEntries[0].bodyFeel, 4, "throat_condition が bodyFeel にそのまま入る");
  assertEqual(totalEntries[0].quality, 7, "響きスコア(resonance_score)があれば、それを quality として優先する");

  // ケースB: 響きスコアが無い日 → 声の調子（5段階）を0-10に線形変換したものがqualityになる
  const noResonanceRow = { date: "2026-08-11", throat_condition: 3, voice_quality: 3 };
  const noResEntries = migrateLegacyToVoiceEntries(noResonanceRow);
  assertEqual(noResEntries[0].quality, 5, "響きスコアが無い場合、声の調子3（中央）は quality=5 に変換される");

  // ケースC: 朝昼晩の3枠がある日 → VoiceEntry 3件に分解される
  const checkinsRow = {
    date: "2026-08-12",
    voice_checkins: { "朝": { throat: 3, voice: 3 }, "昼": { throat: 4, voice: 4 }, "晩": { throat: 4, voice: 5 } }
  };
  const checkinEntries = migrateLegacyToVoiceEntries(checkinsRow);
  assertEqual(checkinEntries.length, 3, "朝昼晩の3枠は VoiceEntry 3件に分解される");
  assertEqual(checkinEntries.map((e) => e.at), ["08:00", "13:00", "20:00"], "各エントリの時刻が朝→昼→晩の順で正しく設定される");
  assertEqual(checkinEntries[0].context, "wake", "朝の枠は context:'wake'");

  // ケースD: 起き抜けの音名と弱声の最高音は、同じ context:'wake' のエントリに統合される（別々の2件にならない）
  const wakeRow = { date: "2026-08-13", wake_note: "A3", pianissimo_high_note: "E5", routine_note: "C4" };
  const wakeEntries = migrateLegacyToVoiceEntries(wakeRow);
  const wakeEntry = wakeEntries.find((e) => e.context === "wake");
  assertTrue(!!wakeEntry, "context:'wake' のエントリが作られる");
  assertEqual(wakeEntry.pitchChest, "A3", "起き抜けの音名が pitchChest に入る");
  assertEqual(wakeEntry.pitchSoftMax, "E5", "弱声の最高音が、同じエントリの pitchSoftMax に入る（別エントリに分裂しない）");
  const routineEntry = wakeEntries.find((e) => e.context === "after_routine");
  assertEqual(routineEntry.pitchChest, "C4", "ルーティン後の音名は別エントリ(context:'after_routine')に入る");

  // ケースE: 何も記録がない日 → 空配列（例外を投げない）
  assertNoThrow(() => migrateLegacyToVoiceEntries({ date: "2026-08-14" }), "記録が何もない日でも例外を投げない");
  assertEqual(migrateLegacyToVoiceEntries({ date: "2026-08-14" }), [], "記録が何もない日は空配列になる");

  // ケースF: 代表値の導出（中央値・日内変動）
  const rep = deriveVoiceEntryRepresentatives(checkinEntries);
  assertEqual(rep.bodyFeel, 4, "代表bodyFeelは中央値（3,4,4の中央値=4）");
  assertTrue(rep.wakeEntry.context === "wake", "代表の起き抜けエントリが正しく取得できる");
}

// ---------------------------------------------------------------------------
// 旧列は整数の列。小数を送ると保存が400で落ちる
//
//   声の出来スライダーは0〜10の0.5刻み。そこから逆算する voice_quality は
//   1 + (q/10)*4 なので、21段階のうち18段階で小数になる。
//   schema.sql の voice_quality / throat_condition は int。
//   PostgREST は "3.8" を integer に入れられず、22P02 で400を返す。
//
//   ★今日の新規記録は既定値 quality=5 → voice_quality=3 で通ってしまう。
//     落ちるのは、保存済みの値を読み込んで開いたとき（＝過去の日付）。
//     「今日は保存できるのに、過去の日付だけ落ちる」の正体がこれ。
// ---------------------------------------------------------------------------
console.log("\n=== 旧列（整数）へ小数を書かない ===");
{
  const mkVoice = (q) => ({ id: "v1", date: "2026-08-01", at: "09:00", context: "other",
    bodyFeel: 3, quality: q, pitchChest: "", pitchSoftMax: "", symptoms: [], note: "",
    mptSeconds: null, toneEvenness: null, routineMinutes: null });

  let decimals = 0;
  for (let q = 0; q <= 10; q += 0.5) {
    const r = entryToRow(USER_ID, { ...sampleFullEntry(), voiceEntries: [mkVoice(q)] });
    if (!Number.isInteger(r.voice_quality) || !Number.isInteger(r.throat_condition)) decimals += 1;
  }
  assertEqual(decimals, 0, "★スライダー21段階すべてで、voice_quality と throat_condition が整数");

  // 保存済みの行を読み込んで、そのまま保存し直す（過去の日付を開いたときの経路）
  let reDecimals = 0;
  for (let rs = 0; rs <= 10; rs += 1) {
    const stored = { date: "2026-08-01", user_id: USER_ID, throat_condition: 3, voice_quality: 3,
      resonance_score: rs, throat_symptoms: [], voice_checkins: {} };
    const back = entryToRow(USER_ID, rowToEntry(stored));
    if (!Number.isInteger(back.voice_quality) || !Number.isInteger(back.throat_condition)) reDecimals += 1;
  }
  assertEqual(reDecimals, 0, "★保存済みの0〜10を開いて保存し直しても、整数のまま");

  // 声の記録が2件あると中央値が .5 になる。ここも整数へ丸まること。
  const two = entryToRow(USER_ID, { ...sampleFullEntry(),
    voiceEntries: [{ ...mkVoice(6), bodyFeel: 3 }, { ...mkVoice(9), bodyFeel: 4 }] });
  assertTrue(Number.isInteger(two.voice_quality) && Number.isInteger(two.throat_condition),
    "声の記録が2件（中央値が .5 になる）でも整数");

  // ★0 と null を取り違えないこと。0 は「記録された0」。
  assertEqual(intOrNull(0), 0, "★0 は 0 のまま（null にしない）");
  assertEqual(intOrNull(null), null, "null は null のまま");
  assertEqual(intOrNull(""), null, "空文字は null");
  assertEqual(intOrNull(3.8), 4, "3.8 は 4 に丸まる");
}

console.log("\n=== 型ごとの追加項目（職業を声の型で切り直す §5-2） ===");
{
  // ★中身は lib/typeFields.js が決める。ここで確かめるのは往復だけ。
  const tf = { passaggioDifficulty: 4, highNoteEase: 2 };
  const row = entryToRow("u1", { date: "2026-08-28", typeFields: tf });
  assertEqual(row.type_fields, tf, "書き込みで type_fields に入る");
  assertEqual(rowToEntry(row).typeFields, tf, "読み出しで typeFields に戻る");
  // 空のときは {} を残さない（中身のない塊を保存しない）
  assertEqual(entryToRow("u1", { date: "2026-08-28", typeFields: {} }).type_fields, null,
    "空のときは null で保存する");
  assertEqual(entryToRow("u1", { date: "2026-08-28" }).type_fields, null,
    "未記録のときも null");
  assertEqual(rowToEntry({ date: "2026-08-28" }).typeFields, {},
    "列が無い行を読んでも壊れない");
}

console.log("\n=== テスト: 起きたときのむくみ（中核5項目 §2-2②） ===");
{
  // ★0（なし）と null（答えていない）を、往復で取り違えないこと。
  //   rowToEntry で || を使うと 0 が null に化けます。
  const base = sampleFullEntry();

  const row0 = entryToRow(USER_ID, { ...base, morningEdema: 0 });
  assertEqual(row0.morning_edema, 0, "「なし」は 0 として保存される");
  assertEqual(rowToEntry(row0).morningEdema, 0, "★0 が読み戻せる（|| で null にしない）");

  const rowNull = entryToRow(USER_ID, { ...base, morningEdema: null });
  assertEqual(rowNull.morning_edema, null, "答えていなければ null");
  assertEqual(rowToEntry(rowNull).morningEdema, null, "null は null のまま");

  const row2 = entryToRow(USER_ID, { ...base, morningEdema: 2 });
  assertEqual(row2.morning_edema, 2, "「はっきり」は 2");
  assertEqual(rowToEntry(row2).morningEdema, 2, "2 が読み戻せる");

  // ★列がまだ無い環境（移行前）でも壊れないこと
  assertEqual(rowToEntry({ date: "2026-08-30" }).morningEdema, null,
    "★列が無い行を読んでも null（移行前でも落ちない）");
}

console.log("\n=== テスト: 嗜好品（用語辞書の拡張と嗜好品の記録 §7） ===");
{
  // ★false（しなかった）と null（答えていない）を、往復で取り違えないこと。
  const base = sampleFullEntry();

  const rowFalse = entryToRow(USER_ID, { ...base, smokedToday: false, drankToday: false });
  assertEqual(rowFalse.smoked_today, false, "「なし」は false として保存される");
  assertEqual(rowFalse.drank_today, false, "お酒の「なし」も false");
  assertEqual(rowToEntry(rowFalse).smokedToday, false, "★false が読み戻せる（|| で null にしない）");
  assertEqual(rowToEntry(rowFalse).drankToday, false, "★お酒の false も読み戻せる");

  const rowTrue = entryToRow(USER_ID, { ...base, smokedToday: true, drankToday: true });
  assertEqual(rowTrue.smoked_today, true, "「あり」は true");
  assertEqual(rowToEntry(rowTrue).drankToday, true, "true が読み戻せる");

  const rowNull = entryToRow(USER_ID, { ...base, smokedToday: null, drankToday: null });
  assertEqual(rowNull.smoked_today, null, "答えていなければ null");
  assertEqual(rowToEntry(rowNull).smokedToday, null, "null は null のまま");

  // ★変な値が来ても、true/false/null のどれかに落ちること
  assertEqual(entryToRow(USER_ID, { ...base, smokedToday: "はい" }).smoked_today, null,
    "★文字列は null にする（true として保存しない）");
  assertEqual(entryToRow(USER_ID, { ...base, smokedToday: 1 }).smoked_today, null,
    "★数値も null にする");

  // ★列がまだ無い環境でも壊れない
  assertEqual(rowToEntry({ date: "2026-08-31" }).smokedToday, null, "★列が無い行を読んでも null");
  assertEqual(rowToEntry({ date: "2026-08-31" }).drankToday, null, "★お酒も同じ");
}

console.log("\n=== テスト: 気温・湿度の出どころ（weather_source） ===");
{
  const base = sampleFullEntry();
  ["entered", "carried"].forEach((v) => {
    const row = entryToRow(USER_ID, { ...base, weatherSource: v });
    assertEqual(row.weather_source, v, `${v} がそのまま保存される`);
    assertEqual(rowToEntry(row).weatherSource, v, `${v} が読み戻せる`);
  });
  // ★知らない値は null にする（DBの制約に当たる前に止める）
  assertEqual(entryToRow(USER_ID, { ...base, weatherSource: "guessed" }).weather_source, null,
    "★知らない値は null にする");
  assertEqual(entryToRow(USER_ID, { ...base, weatherSource: "" }).weather_source, null,
    "空文字も null");
  assertEqual(entryToRow(USER_ID, { ...base, weatherSource: null }).weather_source, null,
    "null は null のまま");
  // ★列がまだ無い環境でも壊れない
  assertEqual(rowToEntry({ date: "2026-09-01" }).weatherSource, null,
    "★列が無い行を読んでも null（移行前でも落ちない）");
}

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) {
  console.log("\n⚠ 失敗したテストがあります。声の構造変更などの大きな変更に進む前に、原因を確認してください。");
  process.exit(1);
} else {
  console.log("\n✓ すべて成功しました。");
  process.exit(0);
}
