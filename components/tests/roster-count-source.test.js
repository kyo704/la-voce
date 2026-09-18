// ============================================================================
// ★見張り ── ★数える 人数は、★在籍（enrollments）から 数える
//
//   ★裁定 2026-09-18・㋐（★坂本さん）
//   ★記録 docs/reports/2026-09-18-数える人数がいつも0.md
//
//   ★★★見つけた こと ──
//     ★★台帳の 決まり `memberships_role_check` が 許す role は
//       ★owner／admin／teacher／staff の 4つ だけ。
//     ★★`lib/orgRoster.js` の `NOT_COUNTED_ROLES` は **その 4つ**。
//     ★★★だから `rosterCount(memberships)` は、★どんな 場合でも 0 でした。
//       ★★数える 人数 0人 ／ 今月の ご請求 0円 ── ★どの 学校でも、いつも。
//
//   ★★測る のは 3つ です。
//     ★一 ★★数の 上でも、★それが 本当か（★measure, not memorise）
//          ★★`NOT_COUNTED_ROLES` と 台帳の 4つを **その場で 突き合わせます**。
//          ★★役割が 1つ 増えた 日に、★この 見張りが 自分で 気づきます。
//     ★二 ★`rosterCount` を 呼ぶ ところが、★memberships を 渡して いないか
//     ★三 ★同じ 並びを 2つ 作って いないか（★写しを 増やして いないか）
// ============================================================================

const assert = require("assert");
const path = require("path");
const { readCode, readRaw, loadLib } = require("./_source");

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

// ★★台帳の 決まりが 許す 役割。★2026-09-18 に 台帳へ 直に 尋ねました。
//   ★★`memberships_role_check`
//     CHECK (role = ANY (ARRAY['owner','admin','teacher','staff']))
//   ★★ここは 書き写し です。★台帳に 尋ねる 道具は 見張りに ありません。
//     ★★だから、★下で「4つ とも 数えない」ことを **計算で** 確かめます。
//       ★★書き写しが 古く なった ときは、★人の 数える 側が 変わります。
const 台帳が許す役割 = ["owner", "admin", "teacher", "staff"];

(async () => {
  const R = await loadLib("lib", "orgRoster.js");

  // ------------------------------------------------------------------------
  // ★一 ★memberships では 数えられない、を 計算で 示す
  // ------------------------------------------------------------------------
  const 数えられる = 台帳が許す役割.filter(
    (role) => R.isCounted({ role, status: "active" }));
  ok(数えられる.length === 0,
    "台帳が 許す 4つの 役割は、1つも 数えられない");

  const にせの名簿 = 台帳が許す役割.map((role) => ({ role, status: "active" }));
  ok(R.rosterCount(にせの名簿) === 0,
    "memberships だけ 渡すと、★4人 居ても 0人");

  // ★★在籍から 作った 並びなら 数えられる。
  const 在籍 = [
    { id: "a", student_id: "s1", status: "active" },
    { id: "b", student_id: "s2", status: "active" },
    { id: "c", student_id: "s3", status: "left" }
  ];
  ok(R.rosterCount(R.toRosterRows(在籍, [])) === 2,
    "在籍から 作ると 数えられる（3人中 やめた1人を 除いて 2人）");

  // ------------------------------------------------------------------------
  // ★二 ★呼ぶ ところが memberships を 渡して いないか
  // ------------------------------------------------------------------------
  const 本体 = readCode("components", "VocalTracker.jsx");

  // ★★`rosterCount(...)` の 中身を、★1つずつ 見ます。
  const 呼び = [...本体.matchAll(/rosterCount\(([^)]*)\)/g)].map((m) => m[1].trim());
  ok(呼び.length > 0, "rosterCount を 呼ぶ ところが ある（" + 呼び.length + "か所）");
  呼び.forEach((引数) => {
    数 += 1;
    assert.ok(!/opsMembers|orgMembers/.test(引数),
      "★落ちました ── rosterCount に memberships を 渡して います: " + 引数);
  });
  console.log("  ok  rosterCount の 引数に memberships が 1つも 無い");

  // ★★画面に 渡す ほうも 見ます。
  ok(!/<OpsSettings[\s\S]{0,120}members=\{opsMembers\}/.test(本体),
    "ご請求に memberships を 渡して いない");
  ok(!/<OpsHome[\s\S]{0,260}members=\{opsMembers\}/.test(本体),
    "ホームに memberships を 渡して いない");

  // ------------------------------------------------------------------------
  // ★三 ★同じ 並びを 2つ 作って いないか
  // ------------------------------------------------------------------------
  //   ★★`toRosterRows(` の 数 ── ★運営の ところで 1つ、★名簿で 1つ。
  //     ★★3つめが 増えたら、★そこが 写し です。
  const 作り = (本体.match(/toRosterRows\(/g) || []).length;
  ok(作り <= 2,
    "同じ 並びを 作る ところは 2つ まで（いま " + 作り + "）");

  // ★★注も 含めて、★経緯が 書いて あること。
  const 生 = readRaw("components", "VocalTracker.jsx");
  ok(/memberships_role_check/.test(生),
    "なぜ こう したか が、★その 場に 書いて ある");

  console.log("\n★" + 数 + "件 通りました ── 数える 人数の 出どころ");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
