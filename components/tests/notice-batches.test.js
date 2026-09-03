// お知らせの束と宛先（TASK A・2026-09-03）
//
//   ★3つの条件が守られているかを見張ります。
//     ① 専用の表になっていないか（type があるか）
//     ② 状態を上書きしていないか（時刻の列が並んでいるか）
//     ③ 退会で宛先だけが消え、束は残るか
//   ★そして5つの台帳すべてに登録されているか。
const { readCode } = require("./_source");
const fs = require("fs");
const path = require("path");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const 根 = path.join(__dirname, "..", "..");
const 取込 = (p) => import("data:text/javascript;base64," +
  Buffer.from(fs.readFileSync(path.join(根, p), "utf8")).toString("base64"));

(async () => {
  const B = await 取込("lib/noticeBatches.js");
  const SQL = readCode("supabase/migration_notice_batches.sql");

  console.log("\n① ★専用の表になっていないこと");
  ok("type の列がある", /type\s+text not null/.test(SQL));
  ok("型が複数ある", B.NOTICE_TYPES.length >= 4);
  ok("同意の取り直しは、そのうちの1つ", B.NOTICE_TYPES.includes("consent_renewal"));
  // ★「A-2」「再同意」専用の列を作っていないこと。
  ok("★特定のお知らせ専用の列が無い",
    !/a2_|再同意_|consent_renewal\s+(boolean|timestamptz)/.test(SQL));

  console.log("\n② ★状態を上書きしていないこと");
  ok("status の列が無い", !/\bstatus\s+text/.test(SQL));
  for (const c of B.TARGET_TIMESTAMPS) ok(`${c} がある`, new RegExp(c + "\\s+timestamptz").test(SQL));
  ok("段階は時刻から読む（未送信）", B.targetStage(null) === "未送信");
  ok("段階は時刻から読む（送信済み）", B.targetStage({ sent_at: 1 }) === "送信済み");
  ok("段階は時刻から読む（開いた）", B.targetStage({ sent_at: 1, opened_at: 1 }) === "開いた");
  ok("段階は時刻から読む（応じた）",
    B.targetStage({ sent_at: 1, opened_at: 1, progressed_at: 1 }) === "応じた");
  ok("★送っただけなら、もう一度送れる", B.canResend({ sent_at: 1 }));
  ok("★開いた方には送らない", !B.canResend({ sent_at: 1, opened_at: 1 }));
  ok("★応じた方には送らない", !B.canResend({ sent_at: 1, progressed_at: 1 }));
  ok("送っていない相手に再送しない", !B.canResend({}));

  console.log("\n③ ★退会で宛先だけが消え、束は残ること");
  ok("宛先は auth.users を cascade で参照",
    /user_id\s+uuid not null references auth\.users\(id\) on delete cascade/.test(SQL));
  // ★create table の中身だけを、かっこを数えて取り出します。
  //   前は 400 文字の窓で見ていて、★隣の表まで拾っていました。
  //   （窓の幅で境界を決めない。共通の教訓です）
  function 表の中身(sql, 名) {
    const i = sql.indexOf(`create table if not exists public.${名} (`);
    if (i === -1) return null;
    const 開き = sql.indexOf("(", i);
    let 深さ = 0;
    for (let j = 開き; j < sql.length; j++) {
      if (sql[j] === "(") 深さ++;
      else if (sql[j] === ")") { 深さ--; if (深さ === 0) return sql.slice(開き, j + 1); }
    }
    return null;
  }
  const 束の中身 = 表の中身(SQL, "notice_batches");
  ok("束の定義が取り出せた", !!束の中身);
  ok("★束に user_id が無い（誰のものでもない）", 束の中身 && !/user_id/.test(束の中身));
  ok("frozen_count がある", /frozen_count\s+integer/.test(SQL));
  const 集 = B.batchSummary({ frozen_count: 30 }, [{ sent_at: 1 }, { sent_at: 1, opened_at: 1 }]);
  ok("★決めた時点の人数は動かない", 集.決めた時点 === 30);
  ok("★退会された方の数が出る", 集.退会された方 === 28);

  console.log("\n④ ★宛先を凍らせること（cohort を読み直さない）");
  const src = readCode("lib/noticeBatches.js");
  ok("freezeTargets がある", typeof B.freezeTargets === "function");
  ok("★判定を書き写していない（cohort を直接見ない）", !/cohort/.test(src));
  ok("★is_internal も直接見ない", !/is_internal/.test(src));
  const A = await 取込("lib/noticeAudience.js");
  const 凍 = B.freezeTargets(
    [{ id: "a", cohort: "founder" }, { id: "b", cohort: "tester" },
     { id: "c", is_internal: true, cohort: "founder" }],
    A.NOTICE_ROLLOUT[0], A.shouldNotify);
  ok("段①では運営者だけが凍る", JSON.stringify(凍) === JSON.stringify(["a"]));

  console.log("\n⑤ RLS");
  ok("両方で RLS を有効にしている",
    /notice_batches enable row level security/.test(SQL) &&
    /notice_targets enable row level security/.test(SQL));
  ok("★束にはポリシーを作らない（運営だけのもの）",
    !/on public\.notice_batches for/.test(SQL));
  ok("宛先は本人だけが読める", /on public\.notice_targets for select[\s\S]{0,80}auth\.uid\(\) = user_id/.test(SQL));
  ok("★宛先に書き込みのポリシーが無い（押していないのに開いたことにできない）",
    !/on public\.notice_targets for (insert|update|delete)/.test(SQL));

  console.log("\n⑥ ★5つの台帳すべてに登録されていること");
  const 台 = {
    削除: readCode("lib/accountDeletion.js"),
    控え: readCode("lib/backupTables.js"),
    auth参照: readCode("lib/authUserReferences.js"),
    書き出し: readCode("lib/exportData.js"),
    外へ出る道: readCode("lib/outboundRoutes.js")
  };
  ok("削除：notice_targets がある", /"notice_targets"/.test(台.削除));
  ok("★削除：notice_batches は無い（1人の退会で束が消えない）", !/"notice_batches"/.test(台.削除));
  ok("控え：両方ある", /notice_batches/.test(台.控え) && /notice_targets/.test(台.控え));
  ok("auth参照：notice_targets がある", /notice_targets/.test(台.auth参照));
  ok("書き出し：notice_targets がある", /notice_targets/.test(台.書き出し));
  ok("★書き出し：notice_batches は無い（ほかの方の分が混ざる）", !/notice_batches/.test(台.書き出し));
  ok("外へ出る道：Resend の記述に書かれている", /notice_batches/.test(台.外へ出る道));

  console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
  process.exit(否 ? 1 : 0);
})();
