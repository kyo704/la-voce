// ============================================================================
// ★見張り ── ★題の 下の 1行（★役職 ／ できこと）
//
//   ★出どころ docs/design/pack-final/00-動く見本-PC・iPad（運営）.html
//            の `function permLine(pp)`
//
//   ★★測る のは 3つ です。
//     ★一 ★見本と 同じ 形か（★並び・区切り・0つの ときの 言葉）
//     ★二 ★設定の 画面に、★本当に 出て いるか
//     ★三 ★★文の 組み立てが **1か所** に あるか
//          ★★画面が 自分で `join(" ／ ")` を 書き始めたら、★そこで 落とします。
//          ★★この 蔵の 持病は「同じ 決めが 2か所」です。
//
//   ★★★数は 書き写しません（★2026-09-16 の 決まり）。
//     ★★見本の HTML から 引いて、★その場で 数えます。
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { readCode, readRaw, loadLib } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
const 見本の道 = path.join(ROOT, "docs/design/pack-final/00-動く見本-PC・iPad（運営）.html");

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

(async () => {
  // ------------------------------------------------------------------------
  // ★★較正 ── ★見本が 無ければ 止まります。★無い ものと 比べません。
  // ------------------------------------------------------------------------
  if (!fs.existsSync(見本の道)) {
    console.error("★止まりました ── 見本が ありません: " + 見本の道);
    process.exit(1);
  }
  const 見本 = fs.readFileSync(見本の道, "utf8");
  assert.ok(見本.includes("function permLine("),
    "★止まりました ── 見本に permLine が ありません。★測りの ほうを 疑って ください。");

  // ★★`@/` の 取り込みが ある ので、★loadLib で 読みます（★_source.js）。
  const { permLine, permHeadLine, PERMS, TEMPLATE_POSTS } = await loadLib("lib/opsPerms.js");

  // ------------------------------------------------------------------------
  // ★一 ★見本と 同じ 形か
  // ------------------------------------------------------------------------
  // ★★区切りは 見本から 引きます。★書き写しません。
  //   ★★★はじめ、★見本ぜんぶ から 探して いました。
  //     ★★別の `join(` に 当たり、★区切りを「・」と 読みました。
  //     ★★「・」は できことの 名の 中にも あります
  //       （★「ご請求を 払う・支払い方法を 変える」）。
  //     ★★だから 見張りは **通って しまいます**。★誤りが 素通りします。
  //   ★★permLine の 中 だけ を 見ます。
  const 本体 = 見本.slice(見本.indexOf("function permLine("));
  const 区切り = /a\.join\('([^']*)'\)/.exec(本体.slice(0, 400));
  assert.ok(区切り, "★止まりました ── 見本の 区切りを 読めません。");
  ok(permLine(["bill", "meibo"]).includes(区切り[1]),
    "区切りが 見本と 同じ（" + JSON.stringify(区切り[1]) + "）");

  const 空のことば = /:\s*'([^']*ありません[^']*)'/.exec(本体.slice(0, 400));
  assert.ok(空のことば, "★止まりました ── 見本の「0つの とき」を 読めません。");
  ok(permLine([]) === 空のことば[1],
    "0つの ときの 言葉が 見本と 同じ（" + 空のことば[1] + "）");
  ok(permLine(null) === 空のことば[1], "null でも 空の 行を 返さない");
  ok(permLine({}) === 空のことば[1], "{} でも 空の 行を 返さない");

  // ★★並びは PERMS の 順。★持って いる 順では ありません。
  //   ★★同じ 役職の 2人で、★並びが 変わらない こと。
  const 順1 = permLine(["meibo", "bill"]);
  const 順2 = permLine(["bill", "meibo"]);
  ok(順1 === 順2, "渡す 順を 変えても 同じ 行に なる");
  ok(順1.indexOf("ご請求を 見る") < 順1.indexOf("学校全部の 名簿"),
    "並びが PERMS の 順");

  // ★★学長は できこと 10。★数は TEMPLATE_POSTS から 数えます。
  const 学長 = TEMPLATE_POSTS.find((p) => p.name === "学長");
  assert.ok(学長, "★止まりました ── 学長が ありません。");
  ok(permLine(学長.perms).split(区切り[1]).length === 学長.perms.length,
    "学長の 行は できことの 数と 同じ（" + 学長.perms.length + "）");

  // ★★頭の 役職の 名。
  ok(permHeadLine("学長", 学長.perms).startsWith("学長" + 区切り[1]),
    "役職の 名が 頭に つく");
  ok(!permHeadLine(null, 学長.perms).startsWith(区切り[1]),
    "役職が 無い とき、★頭に 区切りが 残らない");

  // ------------------------------------------------------------------------
  // ★二 ★設定の 画面に 出て いるか
  // ------------------------------------------------------------------------
  const 設定 = readRaw("components", "OpsSettings.jsx");
  ok(/permHeadLine\(/.test(設定), "設定の 画面が permHeadLine を 呼んで いる");
  // ★★★取り込みの 行（import）も "permHeadLine" です。★1文字目から 数えると
  //   ★★いつも 取り込みが 先に なり、★見張りは いつも 落ちます。
  //   ★★見るのは **描く ところ** です。★題の 終わりから 先を 見ます。
  const 題の終わり = 設定.indexOf("</h2>");
  ok(題の終わり > 0 && 設定.indexOf("permHeadLine(", 題の終わり) > 0,
    "1行は 題の **下** に ある");

  const 画面の本体 = readRaw("components", "VocalTracker.jsx");
  ok(/<OpsSettings[\s\S]{0,220}perms=\{myPerms\}/.test(画面の本体),
    "できことを 設定の 画面へ 渡して いる");
  ok(/<OpsSettings[\s\S]{0,220}postName=/.test(画面の本体),
    "役職の 名を 設定の 画面へ 渡して いる");

  // ------------------------------------------------------------------------
  // ★三 ★組み立ては 1か所か
  // ------------------------------------------------------------------------
  //   ★★画面が 自分で できことを つなぎ 始めたら、★そこで 落とします。
  const 画面たち = ["OpsSettings.jsx", "OpsPeople.jsx", "OpsShell.jsx"];
  画面たち.forEach((f) => {
    const p = path.join(ROOT, "components", f);
    if (!fs.existsSync(p)) return;
    const src = readCode("components", f);
    ok(!/PERMS[\s\S]{0,80}\.join\(/.test(src),
      f + " が 自分で できことを つないで いない");
  });

  console.log("\n★" + 数 + "件 通りました ── 題の 下の 1行");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
