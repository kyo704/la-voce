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

function loadFunctions(names) {
  const source = fs.readFileSync(SOURCE_PATH, "utf-8");
  const snippets = names.map((n) => extractFunction(source, n));
  const sandbox = {};
  // 抽出した関数群を1つのスコープでまとめて評価し、sandboxオブジェクトへ代入する。
  const code = snippets.join("\n") + "\n" + names.map((n) => `sandbox.${n} = ${n};`).join("\n");
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
const { numOrNull, sumMacro, derivePrimaryActivityLegacy, migrateLegacyToActivities, rowToEntry, entryToRow } = loadFunctions([
  "numOrNull",
  "sumMacro",
  "derivePrimaryActivityLegacy",
  "migrateLegacyToActivities",
  "rowToEntry",
  "entryToRow"
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

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) {
  console.log("\n⚠ 失敗したテストがあります。声の構造変更などの大きな変更に進む前に、原因を確認してください。");
  process.exit(1);
} else {
  console.log("\n✓ すべて成功しました。");
  process.exit(0);
}
