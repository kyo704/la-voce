#!/usr/bin/env node
/**
 * 記録した項目が、すべて本人に返る（2026-09-01）
 *
 * ★憲章 §10「書けるのに、本人に返らない項目を作らない。
 *   新しい記録項目を足すときは、返す場所を同時に作る。」
 *   を、口約束で終わらせないための検査です。
 *
 * ★何が起きていたか
 *   記録される項目は65個ありました。そのうち3つは、保存されるだけで
 *   ★どこにも表示されていませんでした。
 *     throatSymptomsOther  … 利用者が自分の言葉で書いた症状
 *     pianissimoOnsetDelay … 弱声の立ち上がりの遅れ
 *     activityDetail       … 活動の詳細
 *   とくに1つめは、選択肢に無い症状をわざわざ書いた人の言葉が、
 *   ★二度と本人に返らない状態でした。
 *
 *   さらに waterIntake・exerciseMinutes などは、相関が
 *   統計的に有意になった日にしか出ませんでした。
 *   ★3重ゲートは「関係についての主張」に掛けるものです。
 *     記録そのものに掛けてはいけません。
 *
 * ★この検査の要点
 *   rowToEntry が返す項目と、lib/ownRecordFields.js の表を
 *   ★突き合わせます。片方に足してもう片方を忘れたら、ここで落ちます。
 */
const { readCode, readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const raw = readRaw("components", "VocalTracker.jsx");

/** rowToEntry が返す項目名を、ソースから読み取る。 */
function fieldsFromMapper() {
  const start = raw.indexOf("function rowToEntry(row)");
  const end = raw.indexOf("function entryToRow(userId, e)");
  const body = raw.slice(start, end);
  const names = new Set();
  // 「    name:」の形（返り値のオブジェクト）
  const re = /^\s{4}([a-zA-Z][a-zA-Z0-9]*)\s*:/gm;
  let m;
  while ((m = re.exec(body)) !== null) names.add(m[1]);
  // 短縮記法（activities, recovery, voiceEntries）
  ["activities", "recovery", "voiceEntries"].forEach((n) => {
    if (new RegExp(`^\\s{4}${n},?\\s*$`, "m").test(body)) names.add(n);
  });
  return [...names];
}

(async () => {
  const reg = await import("../../lib/ownRecordFields.js");
  const mapperFields = fieldsFromMapper();
  const registered = new Set(reg.OWN_RECORD_FIELDS.map((f) => f.key));
  const excluded = new Set(reg.NOT_A_RECORDED_VALUE);

  console.log("=== ★記録される項目が、すべて表にある ===");
  {
    assertTrue(mapperFields.length > 50, `rowToEntry から ${mapperFields.length} 項目を読み取れた`);
    const missing = mapperFields.filter((n) => !registered.has(n) && !excluded.has(n));
    assertTrue(missing.length === 0,
      missing.length === 0
        ? "★返らない項目が無い"
        : `★返る場所が無い項目: ${missing.join(", ")}（lib/ownRecordFields.js に足してください）`);
  }

  console.log("\n=== ★表にあるのに、記録されていない項目が無い ===");
  {
    // ★こちら向きが無いと、消した項目が表に残り続けます。
    //   使われない行が増えると、表そのものが信用できなくなります。
    const known = new Set(mapperFields);
    // mptSeconds は voiceEntries の中の値なので、rowToEntry には出ません。
    const derived = new Set(["mptSeconds"]);
    const stale = reg.OWN_RECORD_FIELDS.map((f) => f.key)
      .filter((k) => !known.has(k) && !derived.has(k));
    assertTrue(stale.length === 0,
      stale.length === 0 ? "古い項目が残っていない" : `★記録されていないのに表にある: ${stale.join(", ")}`);
  }

  console.log("\n=== 表の形 ===");
  {
    reg.OWN_RECORD_FIELDS.forEach((f) => {
      if (!f.label || !f.label.trim()) assertTrue(false, `★${f.key} に名前が無い`);
      if (!reg.OWN_RECORD_KINDS.includes(f.kind)) assertTrue(false, `★${f.key} の種類「${f.kind}」が不明`);
      if (typeof f.get !== "function") assertTrue(false, `★${f.key} に取り出し方が無い`);
    });
    assertTrue(true, `${reg.OWN_RECORD_FIELDS.length} 項目すべてに、名前・種類・取り出し方がある`);
    const dup = reg.OWN_RECORD_FIELDS.map((f) => f.key)
      .filter((k, i, a) => a.indexOf(k) !== i);
    assertTrue(dup.length === 0, `同じ項目が2度書かれていない${dup.length ? `（${dup.join(",")}）` : ""}`);
  }

  console.log("\n=== ★かつて返らなかった3つが、いま返る ===");
  {
    ["throatSymptomsOther", "pianissimoOnsetDelay", "activityDetail"].forEach((k) => {
      assertTrue(registered.has(k), `★${k} が表にある`);
    });
    // 自由記述は、文字として並べること（数のグラフにしない）
    assertTrue(reg.ownRecordField("throatSymptomsOther").kind === "text",
      "★自由記述は、書いた文字のまま返す");
  }

  console.log("\n=== ★3重ゲートに掛かっていた項目も、素で返る ===");
  {
    ["waterIntake", "exerciseMinutes", "temperature", "humidity", "carbs", "protein", "fat", "fiber", "weightKg"]
      .forEach((k) => assertTrue(registered.has(k), `${k} が表にある`));
  }

  console.log("\n=== 0 と false は「記録した」 ===");
  {
    assertTrue(reg.hasValue(0) === true, "★0 は記録された値（むくみ『なし』を消さない）");
    assertTrue(reg.hasValue(false) === true, "★false も記録された値");
    assertTrue(reg.hasValue(null) === false, "null は未記録");
    assertTrue(reg.hasValue("") === false, "空文字は未記録");
    assertTrue(reg.hasValue([]) === false, "空の配列は未記録");
    assertTrue(reg.hasValue({}) === false, "空のオブジェクトは未記録");
  }

  console.log("\n=== 触っていない項目は、並べない ===");
  {
    const entries = { "2026-09-01": { sleepHours: 7, meals: [], throatSymptomsOther: "声がかすれる" } };
    const shown = reg.recordedFieldsFor(entries).map((f) => f.key);
    assertTrue(shown.includes("sleepHours"), "記録した項目は出る");
    assertTrue(shown.includes("throatSymptomsOther"), "★自由記述も出る");
    assertTrue(!shown.includes("meals"), "空の項目は出ない");
    assertTrue(!shown.includes("weightKg"), "一度も触っていない項目は出ない");
    assertTrue(reg.recordedFieldsFor({}).length === 0, "記録が無ければ、何も出ない");
  }

  console.log("\n=== 値をそのまま返す（加工しない） ===");
  {
    const entries = {
      "2026-09-01": { sleepHours: 7.5 },
      "2026-08-31": { sleepHours: 6 },
      "2026-08-30": { sleepHours: null }
    };
    const s = reg.seriesFor(entries, "sleepHours");
    assertTrue(s.length === 2, "記録がある日だけ返る");
    assertTrue(s[0].date === "2026-09-01" && s[0].value === 7.5, "★新しい順・値はそのまま");
    // ★解釈の言葉を、この表に入れないこと
    const src = readCode("lib", "ownRecordFields.js");
    ["高め", "低め", "良い", "悪い", "順調", "注意"].forEach((w) => {
      assertTrue(!src.includes(w), `★「${w}」のような解釈を入れていない`);
    });
  }

  console.log("\n=== 憲章に、約束が書いてある ===");
  {
    const charter = readRaw("docs", "lavoce-設計憲章.md");
    assertTrue(/書けるのに、本人に返らない項目を作らない/.test(charter), "★§10 に書いてある");
  }

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
