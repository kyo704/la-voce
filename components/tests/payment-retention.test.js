#!/usr/bin/env node

// ============================================================================
// ★お支払いの 記録だけは 残す ── ★人と 切り離して（★第3段）
//
//   ★★出どころ　坂本さん（★2026-09-16・第3段）──
//     「★subscriptions の行を 全部 消しては いけません。
//       ★法人税法・所得税法 ── 取引の帳簿は 7年 保存。
//       ★GDPR 17条3項(b)・個情法 ── 法令に基づく保存は 削除の例外。
//       ★★個人が 分からない形で（user_id を 切り離す）」
//
//   ★★この 見張りが 見る のは 3つ ──
//     ★① 残す 列・切る 列が ずれて いないか
//     ★② 消す 前に 写して いるか（★順番）
//     ★③ 画面と 紙の 3か所で、★同じ ことを 言って いるか
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const need = ["lib/paymentRetention.js", "lib/accountDeletion.js",
    "supabase/migration_payment_records.sql",
    "app/legal/privacy/page.js", "app/legal/tokushoho/page.js"];
  for (const f of need) {
    if (!fs.existsSync(path.join(ROOT, f))) {
      console.log("★★ありません: " + f);
      console.log("　★数えません。★止まります。");
      process.exit(1);
    }
  }
  const src = fs.readFileSync(path.join(ROOT, "lib/paymentRetention.js"), "utf8");
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(src, "utf8").toString("base64"));

  console.log("① 残す 列・切る 列");
  t(m.RETENTION_YEARS === 7, "★7年（法人税法・所得税法）");
  t(!m.KEEP_FROM_SUBSCRIPTION.includes("user_id"), "★契約から user_id を 残さない");
  t(!m.KEEP_FROM_PURCHASE.includes("user_id"), "★買い切りから user_id を 残さない");
  ["stripe_customer_id", "stripe_subscription_id", "plan"].forEach((k) => {
    t(m.KEEP_FROM_SUBSCRIPTION.includes(k), "契約に " + k + " を 残す");
  });
  ["amount_yen", "started_at"].forEach((k) => {
    t(m.KEEP_FROM_PURCHASE.includes(k), "買い切りに " + k + " を 残す");
  });
  t(m.MUST_SEVER.includes("user_id"), "★切る 一覧に user_id");

  console.log("\n② 実際に 切れて いるか（★呼んで 試します）");
  const row = {
    user_id: "u1", email: "a@b.c", display_name: "だれか",
    stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1",
    plan: "monthly", status: "active", current_period_end: "2026-10-09"
  };
  const kept = m.toRetained(row, m.KEEP_FROM_SUBSCRIPTION, "subscription");
  t(kept.user_id === undefined, "★user_id が 落ちて いる");
  t(kept.email === undefined, "★メールが 落ちて いる");
  t(kept.display_name === undefined, "★お名前が 落ちて いる");
  t(kept.stripe_customer_id === "cus_1", "お客さま番号は 残る");
  t(kept.kind === "subscription", "どちらの 取引か 残る");
  t(m.severedProblems(kept).length === 0, "★切り忘れ なし");
  // ★★知らない 列は 落とす。★「残す」と 決めた ものだけ 通す 形で ある こと。
  const sneaky = m.toRetained({ ...row, secret_note: "x" },
    m.KEEP_FROM_SUBSCRIPTION, "subscription");
  t(sneaky.secret_note === undefined,
    "★★知らない 列は 落ちる（★新しい 列が 黙って 残らない）");
  t(m.severedProblems({ ...kept, user_id: "u1" }).length === 1,
    "★user_id が 混ざれば 気づく");

  console.log("\n③ 消す 前に 写して いるか（★順番）");
  const del = readCode("lib", "accountDeletion.js");
  const iRetain = del.indexOf("retainPaymentRecords(");
  const iDelete = del.indexOf("for (const table of USER_OWNED_TABLES)");
  t(iRetain > 0, "★写す 手が ある");
  t(iRetain > 0 && iDelete > 0 && iRetain < iDelete, "★★消す 前に 写して いる");
  // ★★写せなかったら 止める。★帳簿を 残さずに 消さない ため。
  t(/if \(retainFailures\.length > 0\)[\s\S]{0,80}return \{ ok: false/.test(del),
    "★写せなかったら 退会を 止める");

  console.log("\n④ 残り先の 表が、user_id を 持たない こと");
  const sql = readRaw("supabase", "migration_payment_records.sql");
  const create = sql.slice(sql.indexOf("create table"), sql.indexOf(");"));
  t(!/\buser_id\b/.test(create), "★★表そのものに user_id の 列が ない");
  t(/enable row level security/.test(sql), "RLS を 立てて いる");
  t(!/create policy/.test(sql), "★policy を 1つも 作って いない（★誰も 読めない）");
  t(sql.indexOf("revoke all") < sql.indexOf("grant "), "★revoke が grant より 先");

  console.log("\n⑤ 3か所で 同じ ことを 言って いるか");
  const vt = readRaw("components", "VocalTracker.jsx");
  const priv = readRaw("app", "legal", "privacy", "page.js");
  const toku = readRaw("app", "legal", "tokushoho", "page.js");
  t(/RETENTION_LINES/.test(vt), "★退会の 画面が lib を 読む（★書き写さない）");
  t(/7年/.test(priv) || /7年間/.test(priv), "★個人情報の 紙に 7年が ある");
  t(/7年/.test(toku) || /7年間/.test(toku), "★特商法の 紙に 7年が ある");
  t(/切り離/.test(priv), "★個人情報の 紙に「切り離す」が ある");
  t(/切り離/.test(toku), "★特商法の 紙に「切り離す」が ある");
  // ★★前の 字は「そのような 記録は お預かりして いません」でした。
  //   ★★残す ように なった ので、★もう 誤り です。
  // ★★★「無いこと」を 数える ときは、★注記を 外した 本文で 見ます。
  //   ★★この家で 2度 踏んだ 罠 です（★周期の ことば、★「データ不足」）。
  //     ★★禁じた 語は、★かならず 注記に 引用されて います。
  //   ★★見張りの 見張り（`_meta-absence-checks`）が、★きょう 教えて くれました。
  t(!/そのような記録はお預かりしていません/.test(readCode("app", "legal", "privacy", "page.js")),
    "★★「お預かりしていません」が 消えて いる（★もう 誤り）");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
