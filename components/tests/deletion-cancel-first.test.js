#!/usr/bin/env node

// ============================================================================
// ★退会の 前に、★お支払いの 会社を 先に 止める（★第2段）
//
//   ★★出どころ　坂本さん（★2026-09-16・第2段）──
//     「★1 Stripe の解約を 先に 呼ぶ ／ ★2 成功を 確かめる
//       ★3 成功した ときだけ 記録を 消す ／ ★4 失敗したら 中止し、そう 伝える」
//
//   ★★★この 見張りの 芯は「★順番」です。
//     ★★消してから 呼ぶ形は、★失敗した とき 何も 残りません。
//
//   ★★もう 1つ ── ★**写しを 見ない** こと（★台帳 ㊶）。
//     ★★`subscriptions` は Stripe の 写しで、★手で 書いた 行が ありました。
//     ★★だから「いくつ 生きて いるか」は 会社に 聞きます。
//       ★写しから 引くのは `stripe_customer_id` だけ です。
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
  for (const f of ["lib/stripeCancel.js", "app/api/account/delete/route.js",
    "components/VocalTracker.jsx"]) {
    if (!fs.existsSync(path.join(ROOT, f))) {
      console.log("★★ありません: " + f);
      console.log("　★数えません。★止まります。");
      process.exit(1);
    }
  }

  console.log("① 会社を 先に 呼び、★そのあとで 消す（★順番）");
  const route = readCode("app", "api", "account", "delete", "route.js");
  const iCancel = route.indexOf("cancelLiveSubscriptions(");
  const iPurge = Math.min(
    ...["purgeAccount(", "severConnections("].map((k) => {
      const i = route.indexOf(k);
      return i < 0 ? Number.MAX_SAFE_INTEGER : i;
    }));
  t(iCancel > 0, "★会社を 止める 手を 呼んでいる");
  t(iCancel > 0 && iPurge < Number.MAX_SAFE_INTEGER && iCancel < iPurge,
    "★★消すより 先に 呼んでいる");

  console.log("\n② 止まらなければ、★1行も 消さない");
  // ★★窓を 決め打ちに しません（★きょう 1度 踏みました）。
  //   ★★覚え書きの 長さで、★200字を 超えて 落ちました。
  t(/if \(!cancelResult\.ok\)[\s\S]{0,600}status: 409/.test(route),
    "★止まらなければ 409 で 返す");
  // ★★`return` して いる こと。★続けて 消しては いけません。
  const blk = route.slice(route.indexOf("if (!cancelResult.ok)"),
    route.indexOf("if (!cancelResult.ok)") + 400);
  t(/return NextResponse/.test(blk), "★★そこで 返して いる（★先へ 進まない）");

  console.log("\n③ 写しを 見ない（★台帳 ㊶）");
  const lib = readCode("lib", "stripeCancel.js");
  // ★★会社に 聞いて いる こと。
  t(/stripe\.subscriptions\.list\(/.test(lib), "★会社に 一覧を 聞いている");
  t(/stripe\.subscriptions\.cancel\(/.test(lib), "★会社に 止めるよう 言っている");
  // ★★写しの `status` を 判断に 使って いない こと。
  //   ★★写しから 引くのは お客さま番号 だけ。
  // ★★★`indexOf` は **読み込みの 行**に 当たります（★きょう 1度 踏みました）。
  //   ★★呼んで いる ところは ずっと 下 です。★`lastIndexOf` で 取ります。
  const iCall = route.lastIndexOf("cancelLiveSubscriptions(");
  const routeSel = route.slice(Math.max(0, iCall - 900), iCall);
  t(/select\("stripe_customer_id"\)/.test(routeSel),
    "★★写しから 引くのは お客さま番号 だけ");
  t(!/payRow[\s\S]{0,60}\.status/.test(route), "★写しの 状態で 判断して いない");

  console.log("\n④ 止まった ことを 確かめて いる（★呼べた だけ では 足りない）");
  t(/done\.status === "canceled"/.test(lib), "★返事の 状態を 見ている");
  t(/failures\.push/.test(lib), "★確かめられなければ 失敗に 入れる");

  console.log("\n⑤ 分からない ときは 止める（★閉じる ほうへ 倒す）");
  t(/if \(!stripeConfigured\(\)\)[\s\S]{0,200}ok: false/.test(lib),
    "★鍵が 無ければ 進めない");
  t(/catch[\s\S]{0,200}ok: false/.test(lib), "★聞けなければ 進めない");
  // ★★お客さま番号が 無い ときだけ、★素通りして よい。★止める ものが ありません。
  t(/if \(!customerId\)[\s\S]{0,140}ok: true/.test(lib),
    "お客さま番号が 無ければ 素通り（★止める ものが ない）");

  console.log("\n⑥ 期末までの 予約に して いない こと");
  // ★★`cancel_at_period_end` に すると、★そのあいだに 記録が 消え、
  //   ★誰の 契約か 分からない ものが 残ります。
  t(!/cancel_at_period_end/.test(lib), "★★期末の 予約では なく、いま 止める");

  console.log("\n⑦ 画面が「消えて いない」と 言って いること");
  const vt = readRaw("components", "VocalTracker.jsx");
  t(/deleteStatus === "cancelFailed"/.test(vt), "★止められなかった ことを 出す");
  t(/記録は、1つも 消えて いません。/.test(vt),
    "★★1行も 消えて いない、と 先に 言う");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
