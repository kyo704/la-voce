// ============================================================================
// 名簿の しぼり込み（★見本 G02・G07）── 見張り
//
//   ★出どころ docs/design/pack-final/screens/G07-しぼり込み.html
//            docs/design/pack-final/screens/G02-名簿.html
//
//   ★★何を 見張るか
//     ① 札の 数が、★しぼっても 変わらない（★名簿ぜんぶの 数）
//     ② ご請求の 人数が、★しぼっても 変わらない（★安く 見えない）
//     ③ 先生・事務が、★どの 数にも 入らない
//     ④ 2人の 先生に つく 生徒が、★どちらの 数にも 入る
//     ⑤ 0人に なったとき、★出口が 押せる ボタンで ある
//     ⑥ 決めが lib に あり、★画面が 自分で 数えていない
// ============================================================================

const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const src = readRaw("lib", "orgRoster.js")
    .replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g, (m, n) => `from "${
      "file://" + path.join(__dirname, "..", "..", "lib", n + ".js")}"`);
  const R = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  // ★見本 G07 と 同じ 形の 名簿を 組みます。
  const M = [
    { user_id: "a", status: "enrolled", teacher_ids: ["t1"] },
    { user_id: "b", status: "enrolled", teacher_ids: ["t2", "t3"] },  // ★2人に つく
    { user_id: "c", status: "enrolled", teacher_ids: ["t3"] },
    { user_id: "d", status: "paused", teacher_ids: ["t1"] },
    { user_id: "e", status: "invited", teacher_ids: [] },
    { user_id: "t1", role: "teacher", teacher_ids: [] },
    { user_id: "s1", role: "staff", teacher_ids: [] }
  ];
  const nameOf = (id) => ({ t1: "斎藤", t2: "三浦", t3: "小林" }[id] || "");

  console.log("① 札の 数");
  const c = R.chipCounts(M);
  ok(c.all === 5, "★すべて は 5（★先生・事務を 抜く）");
  ok(c.enrolled === 3 && c.paused === 1 && c.invited === 1, "★数えます 3／休会 1／返事まち 1");
  ok(R.ROSTER_CHIPS.map((x) => x.label).join("／") === "すべて／数えます／休会／返事まち",
    "★見本の 4つと 同じ 言葉・同じ 順");

  console.log("② 札で しぼる");
  ok(M.filter((m) => R.matchesChip(m, "all")).length === 5, "★すべて で 5人");
  ok(M.filter((m) => R.matchesChip(m, "paused")).length === 1, "★休会 で 1人");
  ok(M.filter((m) => R.matchesChip(m, "all")).every((m) => !m.role), "★先生・事務は 出ない");

  console.log("③ 先生で しぼる");
  const opts = R.teacherFilterOptions(M, nameOf);
  ok(opts[0].id === R.TEACHER_FILTER_ALL && opts[0].label === "すべて", "★すべてが いちばん 先");
  ok(opts[0].count === null, "★すべて に 数を 付けない");
  const byName = Object.fromEntries(opts.slice(1).map((o) => [o.label, o.count]));
  ok(byName["斎藤"] === 2, "★斎藤 2人（★休会中の 方も 担当の 数には 入る）");
  ok(byName["小林"] === 2, "★小林 2人");
  ok(byName["三浦"] === 1, "★三浦 1人");
  // ★★足すと 5 に なりますが、★生徒は 4人です。★これで 正しいです。
  ok(opts.slice(1).reduce((s, o) => s + o.count, 0) === 5, "★かけもちは 両方に 数える");
  ok(M.filter((m) => R.matchesTeacher(m, "t3")).length === 2, "★小林 で しぼると 2人");
  ok(M.filter((m) => R.matchesTeacher(m, R.TEACHER_FILTER_ALL)).length === M.length,
    "★すべて なら 落とさない");

  console.log("④ しぼっても、ご請求は 動かない");
  // ★★これが いちばん 大事です。★絞った ぶんだけ 安く 見えると、
  //   ★お見積りが 狂います。
  const before = R.rosterCount(M);
  const shown = M.filter((m) => R.matchesTeacher(m, "t1") && R.matchesChip(m, "all"));
  ok(shown.length < M.length, "★絞れている");
  ok(R.rosterCount(M) === before, "★ご請求の 人数は 変わらない");

  console.log("⑤ 画面");
  const ui = readCode("components", "OpsRoster.jsx");
  // ★★下の 帯は、★絞った あとの list では なく members から 数えること。
  ok(/rosterCount\(members\)/.test(ui), "★ご請求は members から 数えている");
  ok(!/rosterCount\(list\)/.test(ui), "★絞った あとから 数えていない");
  ok(/chipCounts\(members\)/.test(ui), "★札の 数も members から");
  ok(!/chipCounts\(list\)/.test(ui), "★札の 数を 絞った あとから 数えていない");
  ok(/この しぼりで 見る/.test(ui), "★見本の ボタンの 言葉");
  ok(/setTeacher\(sheetPick\)/.test(ui), "★押したときに はじめて 効く");
  // ★★出口。★字だけの 案内に しない（★2026-09-05 の お決め）。
  ok(/しぼりを けす/.test(ui), "★0人の ときに、しぼりを けす ボタンが ある");
  ok(/やめる/.test(ui), "★1枚を 閉じる 道が ある");
  ok(/いまの しぼりでは、どなたも 出ません/.test(ui), "★「いません」と 言い分けている");

  console.log("⑥ 画面は 数えない");
  ok(!/teacher_ids \|\| \[\]\)\.forEach/.test(ui), "★先生ごとの 数を、画面が 数えていない");

  console.log("⑦ この 画面から 健康の 記録に 行けない");
  ["entries", "throat", "voice_quality", "sleep_hours"].forEach((w) => {
    ok(!ui.includes(w), `★「${w}」を 触っていない`);
  });

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
