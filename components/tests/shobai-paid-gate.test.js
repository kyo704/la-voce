#!/usr/bin/env node

// ============================================================================
// ★音楽家の商い（章8・9）は、★お支払いの 方だけ
//
//   ★★出どころ　坂本さん（★2026-09-16）──
//     「★音楽家の商い（章8・9）は 有料コンテンツ。
//       ★一般利用者（無料）には 見せては いけない」
//
//   ★★調べた ところ ── ★**もともと 出て いません** でした。
//     ★`canSeeShobaiArticles` は `canSeeBetaFeatures` を 返して いました。
//     ★つまり 管理者と 指導者ベータ だけ。★漏れて いた わけでは ありません。
//     ★★閉じ方が「お支払い」では なかった、★という ことです。
//
//   ★★★いちばん 危ない ところ ──
//     ★プランの 画面で 使った `paidGateApplies` を、★ここへ 持って くる こと。
//     ★★あれは「試しの 一覧に 居ない 方」に **false** を 返します。
//       ★= 壁を 出さない、の 意味 です。★「見せてよい」では ありません。
//     ★★それで 囲うと、★閉じる つもりで **全員に 開きます**。
//   ★★だから この 見張りは、★**開いて しまう 形**を 名指しで 止めます。
//
//   ★★この 見張りは 字を 読むだけ では ありません。★実際に 呼んで 試します。
//     ★★「読んで 確かめた」で 何度か 間違えて います。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const F = path.join(ROOT, "lib", "featureFlags.js");
  if (!fs.existsSync(F)) {
    console.log("★★ありません: lib/featureFlags.js");
    console.log("　★数えません。★止まります。");
    process.exit(1);
  }
  // ★★そのまま 読み込みます。★書き写しません。
  const src = fs.readFileSync(F, "utf8");
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(src, "utf8").toString("base64"));

  const FREE = { is_admin: false, teacher_beta_access: false };
  const ADMIN = { is_admin: true };
  const BETA = { teacher_beta_access: true };

  console.log("① 無料の 方には 出さない");
  t(m.canSeeShobaiArticles(FREE) === false, "お支払いなし → 出さない");
  t(m.canSeeShobaiArticles(FREE, {}) === false, "第2引数が 空 → 出さない");
  t(m.canSeeShobaiArticles(FREE, { subscribed: false }) === false, "false → 出さない");
  // ★★まだ 読めて いない ときは 閉じます。★迷ったら 閉じる。
  t(m.canSeeShobaiArticles(FREE, { subscribed: null }) === false, "★null（読めていない）→ 出さない");
  t(m.canSeeShobaiArticles(FREE, { subscribed: undefined }) === false, "undefined → 出さない");
  t(m.canSeeShobaiArticles(null) === false, "profile が null → 出さない");
  t(m.canSeeShobaiArticles(undefined) === false, "profile が 無い → 出さない");

  console.log("\n② `true` だけ を 通す（★字や 数を 通さない）");
  // ★★"active" や 1 を 通すと、★呼ぶ 側の 書き方 1つで 開きます。
  t(m.canSeeShobaiArticles(FREE, { subscribed: "active" }) === false, '★"active" → 出さない');
  t(m.canSeeShobaiArticles(FREE, { subscribed: 1 }) === false, "★1 → 出さない");
  t(m.canSeeShobaiArticles(FREE, { subscribed: "true" }) === false, '★"true" → 出さない');

  console.log("\n③ お支払いの 方には 出す");
  t(m.canSeeShobaiArticles(FREE, { subscribed: true }) === true, "お支払いあり → 出す");

  console.log("\n④ 管理者・指導者ベータには、これまでどおり");
  // ★★坂本さんが 中身を 確かめられなく なると 困ります。
  t(m.canSeeShobaiArticles(ADMIN) === true, "管理者 → 出す");
  t(m.canSeeShobaiArticles(BETA) === true, "指導者ベータ → 出す");

  console.log("\n⑤ どの 記事が「商い」か");
  t(m.isShobaiArticle({ id: "shobai-01" }) === true, "shobai-01 は 商い");
  t(m.isShobaiArticle({ id: "C1-1" }) === false, "C1-1 は ちがう");
  t(m.isShobaiArticle(null) === false, "null は ちがう");

  console.log("\n⑥ ★閉じる つもりで 開く 形を、名指しで 止める");
  t(!/paidGateApplies|mayViewSummary/.test(readCode("lib", "featureFlags.js")),
    "featureFlags が paidGateApplies / mayViewSummary を 使っていない");
  const ui = readCode("components", "VocalTracker.jsx");
  const at = ui.indexOf("const canSeeShobai =");
  const line = at < 0 ? "" : ui.slice(at, ui.indexOf("\n", at));
  t(at > 0, "画面に 判定が ある");
  t(!/paidGateApplies|mayViewSummary/.test(line),
    "★画面の 判定にも 使っていない");
  t(/subscribed === true/.test(line), "★`=== true` で 渡している");

  console.log("\n⑦ 一覧も 本文も、同じ 1つで 止める");
  // ★★一覧には 出して 本文で 止める、★という 形に しないこと。
  //   ★★読めない 記事が 並ぶのは、★鍵を かけられて いるのと 同じ です。
  t(/const visibleArticle = \(a\) => canSeeShobai \|\| !isShobaiArticle\(a\)/.test(ui),
    "一覧・検索・本文が 同じ 判定を 通る");
  t(/learnChapters = canSeeShobai \?/.test(ui), "章の 一覧も 同じ 判定");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
