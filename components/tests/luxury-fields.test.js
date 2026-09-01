#!/usr/bin/env node
/**
 * 嗜好品（たばこ・お酒）の扱い（用語辞書の拡張と嗜好品の記録.md §7）
 *
 * ★守りたいこと
 *   ① 未成年には★欄ごと出さない（灰色でも押せなくするでもない）
 *      年齢に答えていない人にも出さない（フェイルクローズ）
 *   ② 本数・量・銘柄を聞かない。二値だけ
 *   ③ 先生に共有しない
 *   ④ 中核5項目に混ぜない。★別の族として扱う
 *   ⑤ 既存の食事タグ「遅い時間にお酒」を消さない（二重に数えない）
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function eq(a, b, label) { assertTrue(JSON.stringify(a) === JSON.stringify(b), `${label}（${JSON.stringify(a)}）`); }

const vt = readCode("components", "VocalTracker.jsx");

(async () => {
  const age = await import("../../lib/ageGate.js");
  const fam = await import("../../lib/analysisFamilies.js");
  const scope = await import("../../lib/shareScope.js");

  console.log("=== ★① 未成年には出さない（フェイルクローズ） ===");
  assertTrue(age.mayShowLuxuryFields({ is_under_18: false }) === true, "18歳以上には出す");
  assertTrue(age.mayShowLuxuryFields({ is_under_18: true }) === false, "★未成年には出さない");
  assertTrue(age.mayShowLuxuryFields({}) === false, "★答えていない人にも出さない");
  assertTrue(age.mayShowLuxuryFields(null) === false, "プロフィールが無くても出さない");
  // 画面：欄ごと出さない（disabled にしていない）
  assertTrue(/\{mayShowLuxuryFields\(profile\) && \(/.test(vt),
    "★画面で、欄ごと出し分けている");
  const ui = vt.slice(vt.indexOf("mayShowLuxuryFields(profile) &&"), vt.indexOf("mayShowLuxuryFields(profile) &&") + 700);
  assertTrue(!/disabled|opacity|グレー/.test(ui), "★灰色にしたり押せなくしたりしていない");

  console.log("\n=== ★② 本数・量・銘柄を聞かない ===");
  assertTrue(/YesNoField label="たばこを吸った"/.test(vt), "たばこは あり／なし の2択");
  assertTrue(/YesNoField label="お酒を飲んだ"/.test(vt), "お酒も2択");
  ["本数", "何本", "銘柄", "杯", "ml", "何杯"].forEach((w) => {
    assertTrue(!new RegExp(`${w}`).test(ui), `★「${w}」を聞いていない`);
  });

  console.log("\n=== ★③ 先生に共有しない ===");
  // ★2026-09-01、共有範囲そのものを廃止しました。
  //   いま先生に渡る記録の列は★1つもありません。
  //   それでも、この2つが「決して渡さない一覧」に載っていることを見ます。
  //   ★将来また共有の話が出たときに、真っ先に外すべき列だからです。
  assertTrue(scope.NEVER_SHARED_COLUMNS.includes("smoked_today"), "たばこは、決して渡さない一覧にある");
  assertTrue(scope.NEVER_SHARED_COLUMNS.includes("drank_today"), "お酒も同じ");
  // ★以前は「RPC の許可リストに入っていないこと」を見ていました。
  //   その RPC は 2026-09-01 に削除しました（migration_drop_student_entries_rpc.sql）。
  //   いま見るのは、★関数そのものが消えていることです。
  const drop = readRaw("supabase", "migration_drop_student_entries_rpc.sql");
  assertTrue(/drop function/i.test(drop), "★先生が記録を読む関数は削除されている");

  console.log("\n=== ★④ 中核5項目に混ぜない（別の族） ===");
  eq(fam.LUXURY_FAMILY, ["smokedToday", "drankToday"], "嗜好品の族は2つ");
  fam.LUXURY_FAMILY.forEach((k) => {
    assertTrue(!fam.CORE_FAMILY.includes(k), `★${k} は中核5項目に入っていない`);
  });
  assertTrue(fam.CORE_FAMILY.length === 5, "中核は5つのまま");

  console.log("\n=== ★⑤ 既存の食事タグを消していない ===");
  assertTrue(/"アルコール"/.test(vt), "★食事タグの「アルコール」は残っている（§7-3）");
  assertTrue(/alcohol: -0\.40|alcohol:/.test(vt), "予報の説明変数も残っている");

  console.log("\n=== 値の形 ===");
  assertTrue(/smoked_today: boolOrNull\(e\.smokedToday\)/.test(vt), "true/false/null に正規化して保存");
  assertTrue(/smokedToday: row\.smoked_today \?\? null/.test(vt), "★?? で読む（false を null にしない）");
  const mig = readRaw("supabase", "migration_luxury_fields.sql");
  assertTrue(/add column if not exists smoked_today boolean/.test(mig), "boolean で作る");
  assertTrue(!/default\s+(true|false)/i.test(mig), "★既定値を入れていない（未回答と『なし』を混ぜない）");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
