#!/usr/bin/env node
/**
 * 先生が生徒の記録に届く道が、無いこと（2026-09-01 に廃止）
 *
 * ★この検査は、以前とは逆向きです。
 *   以前は「共有範囲の表と SQL がずれていないか」を見ていました。
 *   いまは「そもそも見せる道が無いか」を見ます。
 *
 * ★何をやめたのか
 *   先生が、つながっている生徒の記録の中身を★常時見られる仕組みです。
 *   共有したいときは、生徒さんが自分で書き出して、アプリの外で渡します。
 *   お医者さんに紙を1枚渡すのと同じで、1回きりです。
 *
 * ★新しい線引き（Opus・2026-09-01）
 *   中身だけでなく、★記録した日・件数・記録があるかどうかも渡しません。
 *   「この生徒は1週間つけていない」は、中身を見るのと同じだけ害があります。
 */
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const root = path.join(__dirname, "..", "..");
const vt = readCode("components", "VocalTracker.jsx");

console.log("=== ★サーバ側の関数が、もう無い ===");
{
  const rpcFile = path.join(root, "supabase/migration_teacher_student_entries_rpc.sql");
  const dropFile = path.join(root, "supabase/migration_drop_student_entries_rpc.sql");
  assertTrue(fs.existsSync(dropFile), "削除の移行ファイルがある");
  const drop = readRaw("supabase", "migration_drop_student_entries_rpc.sql");
  assertTrue(/drop function/i.test(drop), "★無効化ではなく削除している");
  assertTrue(/get_student_entries/.test(drop), "対象の関数を名指ししている");
  // ★元の定義ファイルは残してよい（何があったかの記録）。
  //   ただし、そこから作り直す道が画面に無いこと。
  assertTrue(!/get_student_entries/.test(vt),
    "★画面から get_student_entries を呼んでいない");
  if (fs.existsSync(rpcFile)) {
    console.log("  （元の定義ファイルは、記録として残しています）");
  }
}

console.log("\n=== ★画面に、共有範囲という考え方が残っていない ===");
{
  ["shareScopeDraft", "DEFAULT_SHARE_SCOPE", "handleUpdateShareScope",
   "canViewHealth", "computeStudentSummary", "studentEntriesCache"].forEach((n) => {
    assertTrue(!vt.includes(n), `★${n} が残っていない`);
  });
  assertTrue(!/allowedColumnsForScope/.test(vt), "★列の絞り込みも残っていない");
}

console.log("\n=== ★中身を出す画面が無い ===");
{
  // ★範囲を区切ること。先頭から末尾まで見ると、
  //   生徒自身の画面（問診票の「直近の記録（日付）」など）まで拾ってしまいます。
  const teachAt = vt.indexOf('activeTab === "lesson" && lessonRole === "teach"');
  assertTrue(teachAt > 0, "先生の画面がある");
  const teachScreen = vt.slice(teachAt, teachAt + 9000);
  assertTrue(!teachScreen.includes("直近の記録"),
    "★先生の画面に「直近の記録」が無い");
  ["throatCondition", "throatSymptoms", "sleepHours", "voiceQuality", "avgThroat", "avgSleep"]
    .forEach((n) => {
      assertTrue(!teachScreen.includes(n), `★先生の画面に ${n} が出ていない`);
    });
}

console.log("\n=== ★記録した日・件数・有無も出さない（2026-09-01 の新しい線） ===");
{
  // 「1週間つけていない」は、中身を見るのと同じだけ害がある。
  const teachAt = vt.indexOf('activeTab === "lesson" && lessonRole === "teach"');
  const teachScreen = vt.slice(teachAt, teachAt + 9000);
  ["daysSinceLastRecord", "lastDate", "totalDays", "最終記録", "今日記録あり", "記録がまだありません"]
    .forEach((n) => {
      assertTrue(!teachScreen.includes(n), `★先生の画面に「${n}」が出ていない`);
    });
}

console.log("\n=== ★アプリの中に「先生に送る」を作っていない ===");
{
  // ★作ると、先生が「送った？」と聞ける関係になり、
  //   常時アクセスを別の形で作り直すことになります。
  assertTrue(!/送信先.*先生|先生に送る|sendToTeacher|shareWithTeacher/.test(vt),
    "★「先生に送る」導線が無い");
}

console.log("\n=== ★役割から記録へ届く道が無い ===");
{
  assertTrue(!/shareWithAdmin|share_with_admin/.test(vt), "★shareWithAdmin を作っていない");
  const files = fs.readdirSync(path.join(root, "supabase")).filter((f) => f.endsWith(".sql"));
  const bad = files.filter((f) => {
    const sql = fs.readFileSync(path.join(root, "supabase", f), "utf8");
    return /share_with_admin/.test(sql);
  });
  assertTrue(bad.length === 0, `★DBにも作っていない${bad.length ? "（" + bad.join(",") + "）" : ""}`);
}

console.log("\n=== 決して渡さない列の一覧は、残してある ===");
{
  const ss = readCode("lib", "shareScope.js");
  assertTrue(/NEVER_SHARED_COLUMNS/.test(ss), "一覧が残っている");
  ["cycle_start", "medication_tags", "location"].forEach((c) => {
    assertTrue(ss.includes(`"${c}"`), `${c} が入っている`);
  });
  // ★もう「見せるための表」ではないこと
  assertTrue(!/allowedColumnsForScope|COLUMN_SCOPE|SHARE_SCOPE_KEYS/.test(ss),
    "★見せるための仕組みは消えている");
}

console.log("\n=== 憲章に、消したことが書いてある ===");
{
  const charter = readRaw("docs", "lavoce-設計憲章.md");
  assertTrue(/shareScope として一度実装され、2026年9月1日に削除した/.test(charter),
    "★§10 に、あったことと消したことが書いてある");
  assertTrue(/記録した日・件数・有無も含む/.test(charter), "★日・件数・有無も含むと書いてある");
  assertTrue(/役割（role）と、記録へのアクセスを、決して結びつけない/.test(charter),
    "★役割と記録を結びつけない、と書いてある");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
