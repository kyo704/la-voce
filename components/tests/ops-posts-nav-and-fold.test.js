// ============================================================================
// ★見張り ── ★役職の 札の「出る ナビ」と、★注の たたみ（★裁定 その75・STEP_1）
//
//   ★出どころ 見本 `00-動く見本-PC・iPad（運営）.html`
//            `navOf()` ／ `foldNotes()` ／ `stPost()` の 最下段
//
//   ★★測る のは 3つ です。
//     ★一 ★ナビを `tabsForPerms` から 出して いるか
//          ★★★見本の `navOf()` を 書き写して いないか。
//            ★★2つは 3つの 役職で 食い違います（★教授・准教授・講師）。
//            ★★見本は「設定」を 出し、★実装は 出しません。
//            ★★`koma_mine` を 条件から 外して あるから です
//              （★2026-09-11「入れると、教授に 学校の 設定が 開きます。漏れです」）。
//            ★★★実装の ほうが 正しい です。★見本に 合わせません。
//     ★二 ★注が 畳んで あるか（`fold`）
//     ★三 ★★札の 字が 見本と 同じ か ── ★見本から 引きます
//
//   ★★この 見張りは、★食い違いを **数で** 押さえます。
//     ★★「ちがう」と 書くだけ では、★次に 誰かが 見本へ 寄せます。
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
  if (!fs.existsSync(見本の道)) {
    console.error("★止まりました ── 見本が ありません: " + 見本の道);
    process.exit(1);
  }
  const 見本 = fs.readFileSync(見本の道, "utf8");
  assert.ok(見本.includes("function navOf("),
    "★止まりました ── 見本に navOf が ありません。★測りの ほうを 疑って ください。");
  assert.ok(見本.includes("function foldNotes("),
    "★止まりました ── 見本に foldNotes が ありません。");

  const 画面 = readCode("components", "OpsPosts.jsx");
  const 生画面 = readRaw("components", "OpsPosts.jsx");

  // ------------------------------------------------------------------------
  // ★一 ★ナビは lib から
  // ------------------------------------------------------------------------
  ok(/tabsForPerms\(p\.perms\)/.test(画面), "札の ナビを tabsForPerms から 出して いる");
  ok(!/monka_write|sched_mine|renraku_all/.test(画面.slice(
    画面.indexOf("出る ナビ") - 400, 画面.indexOf("出る ナビ") + 400)),
    "画面が 自分で できことを 並べて いない（navOf の 写しが 無い）");
  ok(/koma_mine/.test(生画面), "食い違いの わけが、★その 場に 書いて ある");

  // ★★食い違いを 数で 押さえます。
  const P = await loadLib("lib", "opsPerms.js");
  const navOf = (perms) => {
    const s = new Set(perms); const t = [];
    if (s.has("meibo") || s.has("sched_all") || s.has("sched_mine") || s.has("bill") || s.has("bill_pay")) t.push("ホーム");
    if (s.has("sched_all") || s.has("sched_mine")) t.push("日程");
    if (s.has("meibo")) t.push("名簿");
    if (s.has("monka_write")) t.push("門下");
    if (s.has("gyoji")) t.push("行事");
    if (s.has("renraku_all") || s.has("monka_read") || s.has("monka_write")) t.push("連絡");
    if (s.has("koma") || s.has("koma_mine") || s.has("master") || s.has("post") || s.has("bill") || s.has("bill_pay")) t.push("設定");
    return t;
  };
  const 食い違い = P.TEMPLATE_POSTS.filter((po) =>
    navOf(po.perms).join("・") !== P.tabsForPerms(po.perms).map((t) => t.label).join("・"));
  ok(食い違い.length === 3,
    "見本と 食い違うのは 3つ（いま " + 食い違い.length + "：" + 食い違い.map((x) => x.name).join("・") + "）");
  食い違い.forEach((po) => {
    数 += 1;
    assert.ok(!P.tabsForPerms(po.perms).some((t) => t.label === "設定"),
      "★落ちました ── " + po.name + " に「設定」が 開いて います");
  });
  console.log("  ok  教授・准教授・講師に「設定」が 開いて いない");

  // ------------------------------------------------------------------------
  // ★二 ★注は 畳んで ある
  // ------------------------------------------------------------------------
  ok(/<Note fold>/.test(生画面), "注を 畳んで いる（fold）");

  // ------------------------------------------------------------------------
  // ★三 ★札の 字が 見本と 同じ
  // ------------------------------------------------------------------------
  const 開く = /b\.textContent\s*=\s*'([^']+)'/.exec(見本);
  assert.ok(開く, "★止まりました ── 見本の 札の 字を 読めません。");
  const U = await loadLib("components", "UiV2.jsx").catch(() => null);
  const uiv2 = readCode("components", "UiV2.jsx");
  ok(uiv2.includes('NOTE_OPEN = "' + 開く[1] + '"'),
    "たたみの 札の 字が 見本と 同じ（" + 開く[1] + "）");
  // ★★★注を 落として から 見ます（★何度目かの 同じ 罠）。
  //   ★★私が 注に「くわしい 決まりを 見る」と 書きました。★自分の 注に 当たりました。
  ok(!画面.includes(開く[1]),
    "画面が 札の 字を 書き写して いない（UiV2 が 持つ）");

  console.log("\n★" + 数 + "件 通りました ── 出る ナビ と 注の たたみ");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
