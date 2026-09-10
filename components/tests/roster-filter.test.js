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
  // ★★2026-09-11、★新しい 動く見本（SH['shiboru']）に そろえました。
  //   ★★「この しぼりで 見る」は、★新しい 見本に ありません。外しました。
  //     ★見張るのは 言葉では なく、★「押した その場で 効く」ことです。
  ok(!/この しぼりで 見る/.test(ui), "★決める ボタンを 置いていない");
  ok(/onChange=\{setChip\}/.test(ui) && /onChange=\{setTeacher\}/.test(ui),
    "★押した その場で 効く");
  ok(/絞る/.test(ui), "★見本の 題（絞る）");
  // ★★学年（★新しい 見本に あります）。
  ok(/gradeFilterOptions/.test(ui) && /matchesGrade/.test(ui), "★学年で しぼれる");
  ok(/gradeOptions\.length > 0/.test(ui), "★学年が 無ければ、札を 出さない");
  // ★★5人未満の 断り。★仕組みは 前から あり、★言葉が 出ていませんでした。
  ok(/人未満の かたまりは、数を 出しません/.test(ui), "★5人未満の 断りが 出る");
  ok(/MIN_GROUP/.test(ui), "★5 を 書き写していない（★lib から 引く）");
  // ★★出口。★字だけの 案内に しない（★2026-09-05 の お決め）。
  ok(/しぼりを けす/.test(ui), "★0人の ときに、しぼりを けす ボタンが ある");
  ok(/閉じる/.test(ui), "★1枚を 閉じる 道が ある");
  ok(/いまの しぼりでは、どなたも 出ません/.test(ui), "★「いません」と 言い分けている");

  console.log("⑤-2 学年は、名簿に あるものだけ");
  const M2 = [
    { user_id: "a", status: "enrolled", grade_label: "声楽3年", teacher_ids: [] },
    { user_id: "b", status: "enrolled", grade_label: "声楽1年", teacher_ids: [] },
    { user_id: "c", status: "enrolled", teacher_ids: [] }
  ];
  const g = R.gradeFilterOptions(M2);
  ok(g.length === 3 && g[0].id === R.GRADE_FILTER_ALL, "★すべて ＋ 実際に ある 2つ");
  ok(!g.some((o) => o.label === "1年"), "★1年〜4年 と 決め打ちに していない");
  ok(R.gradeFilterOptions([{ user_id: "x", status: "enrolled" }]).length === 0,
    "★1つも 無ければ 空（★押せない 札を 出さない）");
  ok(M2.filter((m) => R.matchesGrade(m, "声楽3年")).length === 1, "★学年で 絞れる");
  ok(M2.filter((m) => R.matchesGrade(m, R.GRADE_FILTER_ALL)).length === 3, "★すべてなら 落とさない");

  console.log("⑥ 画面は 数えない");
  ok(!/teacher_ids \|\| \[\]\)\.forEach/.test(ui), "★先生ごとの 数を、画面が 数えていない");

  console.log("⑥-2 学年は、読む道と 書く道が そろっている");
  // ★★読む 道だけ 作って 書く 道を 作らないと、
  //   ★札が 永久に 出ません（★notOutDates と 同じ 形の 穴）。
  ok(/grade_label/.test(ui), "★画面が 学年を 読んでいる");
  ok(/onSetGrade/.test(ui), "★学年を 入れる 道が 画面に ある");
  const vt2 = readCode("components", "VocalTracker.jsx");
  ok(/handleSetMemberGrade/.test(vt2), "★入れる 道が 本体に ある");
  ok(/grade_label: value/.test(vt2), "★本当に 書いている");
  ok(/mayEditRoster/.test(vt2), "★直せる 方を、権限で 決めている");
  // ★★役職の 名前で 分けないこと（★引き継ぎ §「最も重要な 実装原則」）。
  const shell = readCode("lib", "opsShell.js");
  ok(/export function mayEditRoster/.test(shell), "★できることが lib に ある");
  ok(!/post ===|役職名/.test(shell.slice(shell.indexOf("mayEditRoster"), shell.indexOf("mayEditRoster") + 300)),
    "★役職の 名前で 分岐していない");
  // ★★空の 文字と null を、2つの 形に しないこと。
  ok(/trim\(\) !== "" \? label\.trim\(\) : null/.test(vt2),
    "★空は null に する（★「入れていない」と 1つの 形）");

  console.log("⑦ この 画面から 健康の 記録に 行けない");
  ["entries", "throat", "voice_quality", "sleep_hours"].forEach((w) => {
    ok(!ui.includes(w), `★「${w}」を 触っていない`);
  });

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
