#!/usr/bin/env node
/**
 * 守りのテスト① ｜ 他人のレスポンスに、本人だけのものが混ざらない
 * （守りのテスト3本.md §3。周期記録の設計.md §2／食事と就寝の設計.md §2）
 *
 * ★文書の例は、生徒・教師・教室オーナーを作って HTTP を叩く形でした。
 *   このリポジトリにはテスト用のDBもユーザーも作る仕組みが無く、
 *   API ルートも（書き出しを含めて）存在しません。
 *   そこで「動かして漏れを探す」のではなく、
 *   ★「漏れる経路が、そもそも構造として存在しないこと」を証明します。
 *   これは cycle-periods.test.js が既に採っている方法と同じです。
 *
 * ★最後の1本（本人は自分の周期を取得できる）を省略していません。
 *   「全部返さない」実装にすると、テストは通っても製品が壊れます。
 */
const { readCode, readRaw } = require("./_source");
const { FORBIDDEN_KEYS, FORBIDDEN_SUBSTRINGS, OWNER_MUST_HAVE_KEYS, collectKeys } = require("./_forbidden");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

const rpc = readCode("supabase", "migration_teacher_student_entries_rpc.sql");
const rpcRaw = readRaw("supabase", "migration_teacher_student_entries_rpc.sql");
const shareScope = readCode("lib", "shareScope.js");
const ui = readCode("components", "VocalTracker.jsx");

console.log("=== ① 教師が生徒を取る経路に、禁止キーが1つも無い ===");
// 教師が生徒の記録を取る唯一の経路は get_student_entries（SECURITY DEFINER）。
//
// ★調べるのは「ファイルに名前が出てこないこと」ではありません。
//   この関数は v_known（全列）から v_allowed（共有が許された列）を引いて
//   v_denied を作り、denied の列を明示的に null で返します。
//   つまり禁止キーは「明示的に打ち消すため」に名前が出てきます。
//   名前の有無で判定すると、安全にしている仕組みそのものを不合格にします。
//   ★本当の性質は「禁止キーが v_allowed に入る経路が無いこと」です。
const allowedBlocks = [...rpc.matchAll(/v_allowed := v_allowed \|\| array\[([\s\S]*?)\];/g)].map((m) => m[1]);
assertTrue(allowedBlocks.length > 0, `共有範囲ごとの許可リストが${allowedBlocks.length}件ある`);
const allowedCols = new Set();
allowedBlocks.forEach((b) => [...b.matchAll(/'([a-z_]+)'/g)].forEach((m) => allowedCols.add(m[1])));
const allowedHits = FORBIDDEN_KEYS.filter((k) => allowedCols.has(k));
assertEqual(allowedHits, [], "★どの共有範囲を選んでも、禁止キーは許可されない");
assertTrue(allowedCols.has("throat_condition"), `許可リストを読めている（${allowedCols.size}列）`);
// 打ち消しは v_known 由来。禁止キーが v_known にあること自体は正しい。
assertTrue(/where not \(c = any\(v_allowed\)\)/.test(rpc),
  "★許可されていない列は、すべて打ち消される（対応表に無い列はキーごと出ない）");
const rpcWordHits = FORBIDDEN_SUBSTRINGS.filter((w) => rpc.includes(w));
assertEqual(rpcWordHits, [], "★教師RPCに禁止語が出てこない");
assertTrue(/security definer/i.test(rpcRaw), "教師RPCは SECURITY DEFINER（列を絞れる唯一の方法）");
assertTrue(/teacher_student_links/.test(rpc), "★担当かどうかだけで判定している");
assertTrue(!/memberships|organizations/.test(rpc),
  "★組織の役割では判定していない（担当していない生徒を混ぜない）");

console.log("\n=== ② 共有する列の対応表に、禁止キーが1つも無い ===");
// lib/shareScope.js が「どの列がどの共有範囲に入るか」を決める唯一の場所。
// ★ここも同じ。cycle_start は「どの範囲にも属さない」ことを示すために
//   null として名前が出ます。見るべきは「範囲名が割り当てられていないこと」です。
const scopeHits = FORBIDDEN_KEYS.filter((k) => new RegExp(`^\\s*${k}:\\s*"`, "m").test(shareScope));
assertEqual(scopeHits, [], "★禁止キーに、共有範囲が割り当てられていない");
FORBIDDEN_KEYS.filter((k) => new RegExp(`^\\s*${k}:`, "m").test(shareScope)).forEach((k) => {
  assertTrue(new RegExp(`^\\s*${k}:\\s*null`, "m").test(shareScope),
    `★${k} は null（＝どの範囲にも入れない）として明記されている`);
});
assertTrue(/cycle_start/.test(readRaw("lib", "shareScope.js")),
  "cycle_start は「渡さない列」として名指しされている");

console.log("\n=== ③ 画面が、他人の禁止テーブルを直接読んでいない ===");
// 周期・食事と就寝のテーブルを、本人以外の文脈で読んでいないこと。
const otherPersonReads = [
  /from\("cycle_periods"\)[\s\S]{0,200}?student/i,
  /from\("cycle_periods"\)[\s\S]{0,200}?teacher/i,
  /from\("meal_sleep_logs"\)/i,
  /from\("reflux_/i
];
otherPersonReads.forEach((re, i) => {
  assertTrue(!re.test(ui), `★他人の文脈で禁止テーブルを読んでいない（${i + 1}）`);
});
// cycle_periods を読むときは必ず自分の user_id で絞る
const cycleReads = [...ui.matchAll(/from\("cycle_periods"\)[\s\S]{0,160}/g)].map((m) => m[0]);
assertTrue(cycleReads.length > 0, `cycle_periods を読む箇所が${cycleReads.length}件ある`);
cycleReads.forEach((block, i) => {
  // 読み書きのどちらでも、必ず自分の user_id が付いていること。
  // insert は「絞る」のではなく「自分のものとして書く」ので、書き方が違う。
  assertTrue(/eq\("user_id", userId\)|user_id: userId/.test(block),
    `★${i + 1}件目が、必ず自分の user_id を伴っている`);
});

console.log("\n=== ④ 教師が生徒の profiles から取る列 ===");
// 教師画面が profiles から取るのは、名前と職業だけであること。
const teacherProfileSelects = [...ui.matchAll(/from\("profiles"\)\.select\("([^"]+)"\)[\s\S]{0,80}?\.in\("id"/g)]
  .map((m) => m[1]);
assertTrue(teacherProfileSelects.length > 0, `教師が profiles を読む箇所が${teacherProfileSelects.length}件`);
teacherProfileSelects.forEach((cols, i) => {
  const hits = FORBIDDEN_KEYS.filter((k) => cols.split(/\s*,\s*/).includes(k));
  assertEqual(hits, [], `★${i + 1}件目の列に禁止キーが無い（${cols}）`);
});

console.log("\n=== ⑤ 共有カードは存在しない（作るときはここに検査を足すこと） ===");
const hasShareCard = /opengraph-image|ImageResponse|satori/.test(ui);
assertTrue(!hasShareCard,
  "共有カードの生成が無い。★作るときは、禁止語の検査をこのテストに足すこと");

console.log("\n=== ⑥ ★本人は、自分の周期を取り出せる（守りすぎていないか） ===");
console.log("     「全部返さない」実装にすると、テストは通っても製品が壊れます。");
const exportSrc = readCode("lib", "exportData.js");
const exported = collectKeys(JSON.parse(JSON.stringify(
  { tables: (exportSrc.match(/table: "([a-z_]+)"/g) || []).map((t) => t.replace(/table: "|"/g, "")) }
)));
assertTrue(exportSrc.includes("cycle_periods"), "★本人の書き出しに cycle_periods が入っている");
OWNER_MUST_HAVE_KEYS.forEach((k) => {
  assertTrue(exportSrc.includes(k), `★本人向けには ${k} を返している`);
});
assertTrue(readCode("lib", "accountDeletion.js").includes("cycle_periods"),
  "★本人の削除の対象にも入っている");
assertTrue(exported.size > 0, "書き出しの対象表を読み取れている");

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
console.log("\n✓ すべて成功しました。");
