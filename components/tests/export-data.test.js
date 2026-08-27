#!/usr/bin/env node
/**
 * データの書き出し（統合実行ルートv4 G3-16 / 改善タスクv2 P0-3）のテスト。
 *
 * 【いちばん守りたいこと】
 * 機微な項目こそ、本人の書き出しから漏らさないこと。
 * 月経周期・既往症・アレルギー・常用薬は、先生には一切共有しない設定だが
 * （lib/shareScope.js の11列）、本人が自分のデータを持ち出す権利は別の話。
 * 「共有しない」と「本人も取り出せない」を混同すると、削除権・可搬性の侵害になる。
 */
const fs = require("fs");
const path = require("path");
// ★コメント除去は components/tests/_source.js の1か所から使う。
//   各テストが自前で持つと、除去の仕方が少しずつずれていく。
const { stripComments } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}`); console.log(`      期待値: ${JSON.stringify(b)}`); console.log(`      実際値: ${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "exportData.js"), "utf-8");
  const mod = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
  const { EXPORTED_TABLES, EXPORTED_PROFILE_COLUMNS, csvCell, entriesToCsv, buildExportPayload } = mod;

  console.log("=== テスト1: 機微な項目が、本人の書き出しに含まれている ===");
  ["conditions", "allergies", "regular_medications", "health_notes"].forEach((c) =>
    assertTrue(EXPORTED_PROFILE_COLUMNS.includes(c), `プロフィールに「${c}」が含まれる`));
  assertTrue(EXPORTED_TABLES.some((x) => x.table === "entries"), "日々の記録(entries)が含まれる");
  assertTrue(EXPORTED_TABLES.some((x) => x.table === "questionnaire_responses"), "質問票の回答履歴が含まれる");
  // 月経周期は entries の一部（cycle_start）。select("*") で必ず入ることを、実装側で確認する。
  const tracker = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");
  assertTrue(/from\(table\)\.select\("\*"\)\.eq\("user_id", userId\)/.test(tracker),
    "entries は select(\"*\") で取得している（cycle_start を含む）");

  console.log("\n=== テスト2: 共有範囲の設定を、書き出しに持ち込んでいない ===");
  // コメント内の言及（「共有しない」との対比の説明）は除いて、実際の参照だけを見る。
  const codeOnly = stripComments(src);
  assertTrue(!/shareScope|allowedColumnsForScope|get_student_entries/.test(codeOnly),
    "書き出しが、先生向けの共有範囲の仕組みを実際には参照していない（本人の権利は別物）");

  console.log("\n=== テスト3: CSV が壊れない ===");
  assertEqual(csvCell('a,b'), '"a,b"', "カンマを含む値は引用符で囲む");
  assertEqual(csvCell('say "hi"'), '"say ""hi"""', "引用符は二重にして囲む");
  assertEqual(csvCell("line\nbreak"), '"line\nbreak"', "改行を含む値も1セルに収める");
  assertEqual(csvCell(null), "", "null は空欄");
  assertEqual(csvCell(undefined), "", "undefined は空欄");
  assertEqual(csvCell(0), "0", "0 は空欄にしない");
  assertEqual(csvCell(false), "false", "false も残す");
  assertEqual(csvCell({ a: 1 }), '"{""a"":1}"', "入れ子はJSON文字列にして1セルに入れる");

  console.log("\n=== テスト4: CSV は日付を先頭列にし、欠けた項目を空欄にする ===");
  const csv = entriesToCsv([
    { date: "2026-08-01", sleep_hours: 7, cycle_start: true },
    { date: "2026-08-02", notes: "メモ,あり" }
  ]);
  const lines = csv.split("\n");
  assertTrue(lines[0].startsWith("date,"), "1列目は date");
  assertTrue(lines[0].includes("cycle_start"), "cycle_start が列として出る");
  assertTrue(lines[2].includes('"メモ,あり"'), "カンマを含むメモが壊れない");
  assertEqual(entriesToCsv([]), "", "記録が無ければ空文字（空のCSVを作らない）");

  console.log("\n=== テスト5: 書き出しの中身 ===");
  const p = buildExportPayload({ profile: { allergies: ["そば"] }, tables: { entries: [{ date: "2026-08-01" }] }, exportedAt: "2026-08-27T00:00:00Z" });
  assertTrue(p.formatVersion >= 1, "形式のバージョンが入っている");
  assertEqual(p.exportedAt, "2026-08-27T00:00:00Z", "書き出した日時が入っている");
  assertEqual(p.profile.allergies, ["そば"], "プロフィールがそのまま入る");
  assertEqual(p.entries.length, 1, "テーブルが展開されて入る");

  console.log("\n=== テスト6: 1つのテーブルが失敗しても、全体を諦めない ===");
  assertTrue(/tables\[table\] = error \?/.test(tracker), "失敗したテーブルはエラー内容を残し、他は書き出す");
  assertTrue(/setExportStatus\("error"\)/.test(tracker), "失敗の表示がある");
  assertTrue(!/setExportStatus\("error"\)[\s\S]{0,120}setTimeout/.test(tracker), "失敗の表示を自動で消していない");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
