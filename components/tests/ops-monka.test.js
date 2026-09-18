// ============================================================================
// ★門下の 画面（★見本 `P_monka` ／ ★裁定 その90・2026-09-18）
//
//   ★★★見る の は 6つ。
//     ★【一】★担当の 生徒だけ（★終わった 受け持ちを 出さない）
//     ★【二】★並びは 名前順（★出席では 並べない）
//     ★【三】★出席の 数（★率を 出さない）
//     ★【四】★★印は 線が 決まって いる ときだけ
//     ★【五】★型が 無ければ 分母を 出さない
//     ★【六】★出せない ものを、★引き金つきで 記して ある
// ============================================================================

const { readCode, readRaw, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

(async () => {
  const M = await loadLib("lib", "opsMonka.js");
  const A = await loadLib("lib", "attendanceCount.js");
  const 本文 = readCode("components", "OpsMonka.jsx");
  const 生 = readRaw("components", "OpsMonka.jsx");
  const 親 = readRaw("components", "VocalTracker.jsx");

  const 受 = [
    { teacher_id: "t", student_id: "s2", ended_at: null },
    { teacher_id: "t", student_id: "s1", ended_at: null, is_representative: true },
    { teacher_id: "t", student_id: "s3", ended_at: "2026-01-01" },
    { teacher_id: "x", student_id: "s4", ended_at: null }
  ];
  const 名 = (i) => ({ s1: "あべ", s2: "いとう", s3: "うえだ", s4: "えのき" })[i] || "";
  const 学 = (i) => ({ s1: "2年", s2: "1年" })[i] || "";

  // -------------------------------------------------------------------------
  // 【一】★担当の 生徒だけ
  // -------------------------------------------------------------------------
  console.log("【一】担当の 生徒だけ");
  const r = M.monkaRows(受, "t", { gradeOf: 学, nameOf: 名 });
  t(r.length === 2, "2人（" + r.length + "）");
  t(!r.some((x) => x.studentId === "s4"), "★よその 先生の 生徒を 出さない");
  t(!r.some((x) => x.studentId === "s3"), "★★終わった 受け持ちを 出さない");
  t(M.monkaRows(null, "t") .length === 0, "★渡されなくても 落ちない");
  t(M.mayOpen(["monka_write"]) === true && M.mayOpen([]) === false, "門は `monka_write`");
  t(!/["']monka_write["']/.test(本文), "★画面が できことの 名を 直に 見て いない");

  // -------------------------------------------------------------------------
  // 【二】★並び
  // -------------------------------------------------------------------------
  console.log("【二】並びは 名前順（★裁定 その90 §4）");
  t(r[0].grade === "1年" && r[1].grade === "2年", "学年の 順");
  t(!/sort\([^)]*came|sort\([^)]*出席/.test(readCode("lib", "opsMonka.js")),
    "★出席で 並べて いない");
  t(!/\.sort\(/.test(本文), "★画面でも 並べ替えて いない");

  // -------------------------------------------------------------------------
  // 【三】★出席の 数
  // -------------------------------------------------------------------------
  console.log("【三】出席の 数（★率を 出さない）");
  const L = [
    { teacher_id: "t", student_id: "s1", attendance: "came" },
    { teacher_id: "t", student_id: "s1", attendance: "absent" },
    { teacher_id: "x", student_id: "s1", attendance: "came" },
    { teacher_id: "t", student_id: "s2", attendance: "came" }
  ];
  const 本 = M.lessonsOfStudent(L, "t", "s1");
  t(本.length === 2, "★よその 先生の コマを 混ぜない");
  t(A.cameWord(本) === "出席 1", "出席の 数（" + A.cameWord(本) + "）");
  t(本文.includes("NO_RATE_LINE"), "★率を 出さない、と 画面に 書いて いる");
  const 元 = readCode("lib", "opsMonka.js");
  ["％", "パーセント", "達成", "出席率"].forEach((w) => {
    t(!元.split("率（％）は 出しません").join("").includes(w), "lib に「" + w + "」が ない");
  });

  // -------------------------------------------------------------------------
  // 【四】★★印
  // -------------------------------------------------------------------------
  console.log("【四】★印（★線が 決まって いる ときだけ）");
  t(親.includes("need={null}"), "★いまは 線を 渡して いない");
  t(A.looksShort({ came: 1, held: 12, total: 30, need: null }) === false,
    "★線が 無ければ ★印は 出ない");
  t(親.includes("08-11"), "★引き金が その場に ある");
  t(本文.includes("SHORT_NOTE"), "★印の わけを 画面に 出して いる");
  // ★★色で 示して いない こと。
  t(!/color: C\.(curtain|rust)[^\n]*SHORT_MARK/.test(生), "★印を 色で 示して いない");

  // -------------------------------------------------------------------------
  // 【五】★型が 無ければ 分母を 出さない
  // -------------------------------------------------------------------------
  console.log("【五】型");
  t(M.presetOf([], "t") === null, "★無ければ null");
  t(M.presetOf([{ teachers: ["t"], name: "声楽実技" }], "t").name === "声楽実技", "当たって いれば 返す");
  t(M.presetCount([{ teachers: ["t"] }, { teachers: ["t"] }], "t") === 2, "★いくつ 当たって いるか 数える");
  t(M.MANY_PRESETS_LINE.includes("いくつも"), "★2つ 以上 なら 断りを 出す");
  t(M.NO_PRESET_LINE.includes("回数の 目安は 出ません"), "★無い ものを 見せない");
  t(A.progressWord(12, null) === "12回目", "★分母を 出さない");

  // -------------------------------------------------------------------------
  // 【六】★出せない もの
  // -------------------------------------------------------------------------
  console.log("【六】出せない もの（★引き金つき）");
  t(M.NOT_YET.length === 2, "2つ");
  M.NOT_YET.forEach((x) => {
    t(!!x.why && !!x.needs, x.key + " に わけと 要る ものが ある");
  });
  t(M.NOT_YET.some((x) => x.why.includes("my_timetable_own")), "★台帳の 決まりの 名を 書いて いる");
  t(readRaw("docs", "ledgers", "08-保留している決め.md").includes("## 08-11"), "台帳に ある");
  // ★★★空の 列を 並べて いない こと。
  t(!本文.includes("空いて いる コマ<"), "★空の 列を 並べて いない");
  t(本文.includes("まだ 出せません"), "★何が まだかを 書いて いる");

  // -------------------------------------------------------------------------
  // 【七】★呼ぶ 側
  // -------------------------------------------------------------------------
  console.log("【七】呼ぶ 側");
  t(親.includes('if (tabKey === "monka")'), "門下の 帯を 出して いる");
  t(親.includes("<OpsMonka"), "画面を 出して いる");
  t(親.includes("teacherId={userId}"), "★見て いる 方の 門下 です");
  t(親.includes("orgAssignments[opsOrgId]"), "受け持ちから 引いて いる");

  console.log(`\n○ ${ok}　✗ ${ng}`);
  process.exit(ng === 0 ? 0 : 1);
})();
