// ============================================================================
// ★見張り ── ★運営の ホームの 節（★裁定 その79・2026-09-18）
//
//   ★★測る のは 4つ です。
//     ★一 ★節の 条件が 裁定の 表の とおり か
//     ★二 ★★ひな型 10役職 の どれも、★節が 1つ以上 出るか（★VERIFY）
//     ★三 ★役職の 名で 分けて いない（★A2 の 決め）
//     ★四 ★出欠に 行けない 方が いないか（★裁定 その79 Q2 の VERIFY）
// ============================================================================

const assert = require("assert");
const { readCode, loadLib } = require("./_source");

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

(async () => {
  const H = await loadLib("lib", "opsHomeSections.js");
  const P = await loadLib("lib", "opsPerms.js");

  // ------------------------------------------------------------------------
  // ★一 ★裁定の 表の とおり か
  // ------------------------------------------------------------------------
  const 裁定 = {
    nagare: ["sched_all", "sched_mine"],
    lesson: ["sched_mine"],
    monka: ["monka_write"],
    gyoji: ["gyoji"],
    oshirase: ["renraku_all"],
    bill: ["bill", "bill_pay"]
  };
  ok(H.HOME_SECTIONS.length === Object.keys(裁定).length,
    "節は " + Object.keys(裁定).length + "つ（いま " + H.HOME_SECTIONS.length + "）");
  H.HOME_SECTIONS.forEach((x) => {
    数 += 1;
    assert.ok(裁定[x.key] && 裁定[x.key].join(",") === x.any.join(","),
      "★落ちました ── 「" + x.label + "」の 条件が 裁定と ちがいます: " + x.any.join(","));
  });
  console.log("  ok  どの 節も、★裁定の 表の とおり");

  // ------------------------------------------------------------------------
  // ★二 ★VERIFY ── ★10役職 とも 1つ以上 出る か
  // ------------------------------------------------------------------------
  const 空 = P.TEMPLATE_POSTS.filter((po) => H.homeSections(po.perms).length === 0);
  ok(空.length === 0,
    "ひな型 10役職 とも、★節が 1つ以上 出る（0件: " + (空.map((x) => x.name).join("・") || "なし") + "）");
  // ★★いちばん 少ない 役職も 記します。★減った 日に 気づける ように。
  const 最少 = P.TEMPLATE_POSTS
    .map((po) => ({ n: po.name, c: H.homeSections(po.perms).length }))
    .sort((a, b) => a.c - b.c)[0];
  ok(最少.c >= 1, "いちばん 少ない 役職も 1つ以上（" + 最少.n + " … " + 最少.c + "）");

  // ★★できことが 1つも 無い 方には、★空の 1行が ある。
  ok(H.homeSections([]).length === 0, "できことが 無ければ 節も 0");
  ok(typeof H.EMPTY_LINE === "string" && H.EMPTY_LINE.length > 0,
    "1つも 出ない ときの 1行が ある");
  ok(!/できません|ありません。$/.test(H.EMPTY_LINE.slice(0, 20)),
    "できない ことでは なく、★できる ことを 書いて いる");

  // ------------------------------------------------------------------------
  // ★三 ★役職の 名で 分けて いない
  // ------------------------------------------------------------------------
  const 束 = readCode("lib", "opsHomeSections.js");
  ["学長", "副学長", "事務長", "教授", "講師", "職員"].forEach((名) => {
    数 += 1;
    assert.ok(!束.includes(名),
      "★落ちました ── 役職の 名で 分けて います: " + 名);
  });
  console.log("  ok  役職の 名が、★判じる ところに 1つも ない");

  const 画面 = readCode("components", "OpsHome.jsx");
  ok(/homeSections\(perms\)/.test(画面), "画面が lib に 尋ねて いる");
  ok(!/role ===|"owner"|"admin"|"teacher"|"staff"/.test(画面),
    "画面が 役割の 名で 分けて いない");

  // ------------------------------------------------------------------------
  // ★四 ★出欠に 行けない 方（★裁定 その79 Q2）
  // ------------------------------------------------------------------------
  const 迷子 = P.TEMPLATE_POSTS.filter((po) => H.attendanceOrphan(po.perms));
  ok(迷子.length === 0,
    "出欠を 持つのに 行けない 方が いない（いま: " + (迷子.map((x) => x.name).join("・") || "なし") + "）");
  // ★★仕掛けそのものが 効いて いるか（★わざと 1件 作って 確かめます）。
  ok(H.attendanceOrphan(["shukketsu"]) === true,
    "★較正 ── 日程を 持たず 出欠だけ の 方は、★迷子と 出る");
  ok(H.attendanceOrphan(["shukketsu", "sched_mine"]) === false,
    "★較正 ── 日程が あれば 迷子では ない");

  console.log("\n★" + 数 + "件 通りました ── ホームの 節");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
