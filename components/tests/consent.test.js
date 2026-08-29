#!/usr/bin/env node
/**
 * 同意の記録（EUの下地づくり.md §3・作業指示-研究利用の同意.md）
 *
 * ★守りたいこと
 *   ① 目的ごとに分かれていること（まとめて1つにしない）
 *   ② 既定でオンにしないこと
 *   ③ ★撤回しても行を消さないこと
 *   ④ ★文言の版とハッシュを必ず持つこと
 *   ⑤ ★IPを保存しないこと
 *   ⑥ ★同意しなくても、全機能が同じに使えること
 *   ⑦ ★未成年には求めないこと
 */
const fs = require("fs");
const path = require("path");
const { ROOT, readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "consent.js"), "utf-8");
  const C = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
  const sql = readRaw("supabase", "migration_consent_records.sql");
  const sqlCode = readCode("supabase", "migration_consent_records.sql");

  console.log("=== ★目的ごとに分かれている（§3-3） ===");
  assertTrue(C.CONSENT_PURPOSES.length >= 3, `目的が複数ある（${C.CONSENT_PURPOSES.length}個）`);
  const keys = C.CONSENT_PURPOSES.map((p) => p.key);
  assertEqual(new Set(keys).size, keys.length, "鍵が重複していない");
  assertTrue(keys.includes("research.anonymized"), "研究利用が独立した目的になっている");
  assertTrue(keys.includes("health.cycle"), "周期が独立した目的になっている");
  // ★1つにまとめると、何に同意したのか答えられなくなる
  assertTrue(C.OPTIONAL_PURPOSE_KEYS.length >= 2, "任意の目的が複数ある（1つに束ねていない）");

  console.log("\n=== ★既定でオンにしない ===");
  assertEqual(C.isGranted([], "research.anonymized"), false, "記録が無ければ、同意していない");
  assertEqual(C.isGranted([], "health.record"), false, "必須の目的も、既定ではオンでない");

  console.log("\n=== ★撤回しても行を消さない（§3-2） ===");
  assertTrue(!/for delete/i.test(sqlCode), "★delete のポリシーを作っていない（消せない）");
  assertTrue(/withdrawn_at timestamptz/.test(sqlCode), "撤回の時刻を持つ列がある");
  assertTrue(/for update using \(auth\.uid\(\) = user_id\)/.test(sqlCode), "撤回のための update は許す");
  // 同意 → 撤回 → 再同意 が正しく読めること
  const rows = [
    { purpose_key: "research.anonymized", granted_at: "2026-01-01", withdrawn_at: "2026-02-01" },
    { purpose_key: "research.anonymized", granted_at: "2026-03-01", withdrawn_at: null }
  ];
  assertEqual(C.isGranted(rows, "research.anonymized"), true, "撤回のあと、また同意していれば有効");
  assertEqual(C.isGranted([rows[0]], "research.anonymized"), false, "撤回したままなら無効");

  console.log("\n=== ★文言の版とハッシュ（§3-2） ===");
  const row = C.buildConsentRow({ userId: "u1", purposeKey: "health.cycle", locale: "ja", method: "checkbox", now: "2026-08-29T00:00:00Z" });
  assertTrue(!!row.policy_version, "版を持つ");
  assertTrue(/^fnv1a-[0-9a-f]{8}$/.test(row.text_hash), "文言のハッシュを持つ");
  assertEqual(C.textHash("あ"), C.textHash("あ"), "同じ文言なら同じハッシュ");
  assertTrue(C.textHash("あ") !== C.textHash("い"), "違う文言なら違うハッシュ");
  // ★文言を変えたのにハッシュが同じ、では意味がない
  const cycle = C.purposeByKey("health.cycle");
  assertEqual(row.text_hash, C.textHash(cycle.text), "実際に見せた文面のハッシュである");

  console.log("\n=== ★IPを保存しない（§3-2） ===");
  assertTrue(!("ip" in row), "組み立てた行に ip が無い");
  assertTrue(!/\bip\b/.test(sqlCode.replace(/description/g, "")), "★SQL に ip の列が無い");

  console.log("\n=== ★本人だけが読める ===");
  assertTrue(/enable row level security/.test(sqlCode), "RLS が有効");
  const policies = (sqlCode.match(/create policy/g) || []).length;
  assertEqual(policies, 3, "ポリシーは3つ（select / insert / update）");
  assertTrue(!/teacher|share_scope|org/i.test(sqlCode), "★教師や教室に見せる道が無い");

  console.log("\n=== ★未成年には求めない（研究利用の同意 §1-④） ===");
  // ★判断そのものは lib/ageGate.js に移りました（age-gate.test.js が固定します）。
  //   ここでは「consent.js が自分で決め直していないこと」だけを見ます。
  //   同じ判断が2か所に戻ると、片方だけ変わります。
  assertTrue(typeof C.mayAskForConsent === "undefined",
    "★consent.js は、年齢の判断を持たない（lib/ageGate.js が持つ）");
  assertTrue(typeof C.ADULT_AGE === "undefined",
    "★consent.js は、年齢のしきい値を持たない");
  const consentBody = readCode("lib", "consent.js");
  assertTrue(!/profile\.age\b/.test(consentBody),
    "★consent.js が profiles.age を読んでいない（あれは体組成用の数値）");

  console.log("\n=== ★同意しなくても、全機能が同じに使える ===");
  // 同意の有無で機能を出し分けるコードが無いこと。
  const consentSrc = readCode("lib", "consent.js");
  ["locked", "disabled", "premium", "upgrade"].forEach((w) => {
    assertTrue(!consentSrc.includes(w), `★「${w}」が出てこない（同意を条件にしていない）`);
  });

  console.log("\n=== 本人の書き出しと削除 ===");
  assertTrue(readCode("lib", "exportData.js").includes("consent_records"),
    "★書き出しに含まれる（いつ何に同意したかを本人が確かめられる）");
  assertTrue(readCode("lib", "accountDeletion.js").includes("consent_records"),
    "★アカウント削除では消える（第17条）");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
