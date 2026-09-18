// ============================================================================
// ★行事 ── ★時間・場所・対象・表（★裁定 その89 ／ ★お決め Q4・Q5・2026-09-18）
//
//   ★★★見る の は 6つ。
//     ★【一】★入れ口が 8つに なった こと
//     ★【二】★時間 ── ★前後が 逆なら 出せない こと
//     ★【三】★対象 ── ★空の 並び ＝ みなさん（★`null` に しない）
//     ★【四】★表と 札を 幅で 切り替える こと（★境目は 測った 数）
//     ★【五】★字が lib に あり、★画面に 書き写されて いない こと
//     ★【六】★台帳に 渡して いる こと
// ============================================================================

const { readCode, readRaw, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

(async () => {
  const F = await loadLib("lib", "orgEventForm.js");
  const T = await loadLib("lib", "opsEventTable.js");
  const 本文 = readCode("components", "OpsEvents.jsx");
  const 生 = readRaw("components", "OpsEvents.jsx");

  // -------------------------------------------------------------------------
  // 【一】★入れ口
  // -------------------------------------------------------------------------
  console.log("【一】入れ口（★裁定 その89）");
  t(F.FIELDS.length === 8, "8つ に なった（" + F.FIELDS.length + "）");
  ["date", "kind", "title", "startTime", "endTime", "place", "grades", "courses"]
    .forEach((k) => t(F.FIELDS.some((x) => x.key === k), k + " が ある"));
  // ★★★「まだ できない もの」が 空に なった こと。
  t(F.NOT_YET.length === 0, "★まだ できない ものは 無い");
  t(readRaw("lib", "orgEventForm.js").includes("export const NOT_YET = Object.freeze([])"),
    "★形は 残して ある（★次に 使う ため）");

  // -------------------------------------------------------------------------
  // 【二】★時間
  // -------------------------------------------------------------------------
  console.log("【二】時間（★前後が 逆なら 出せない）");
  const 素 = F.emptyForm();
  t(素.startTime === "" && 素.endTime === "", "はじめは 空");
  t(F.timeReversed({ startTime: "15:00", endTime: "13:00" }) === true, "逆を 見つける");
  t(F.timeReversed({ startTime: "13:00", endTime: "15:00" }) === false, "順は 通す");
  t(F.timeReversed({ startTime: "13:00", endTime: "13:00" }) === true, "★同じ 時刻も 逆と 見る");
  t(F.timeReversed({ startTime: "13:00" }) === false, "★終わりが 無いのは よい（未定）");
  t(F.endWithoutStart({ endTime: "15:00" }) === true, "★終わり だけ は だめ");
  // ★★出せる か。
  const 日 = { date: "2026-09-20" };
  t(F.canSubmit(日) === true, "日 だけ でも 出せる");
  t(F.canSubmit({ ...日, startTime: "15:00", endTime: "13:00" }) === false, "★逆なら 出せない");
  t(F.canSubmit({ ...日, endTime: "13:00" }) === false, "★終わり だけ でも 出せない");
  t(F.canSubmit({}) === false, "日が 無ければ 出せない");
  t(F.TIME_STEP_MIN === 5, "5分きざみ");
  t(F.TIME_STEPS.length === 4, "近道は 4つ");

  // -------------------------------------------------------------------------
  // 【三】★対象
  // -------------------------------------------------------------------------
  console.log("【三】対象（★空の 並び ＝ みなさん）");
  t(Array.isArray(素.grades) && 素.grades.length === 0, "はじめは 空の 並び");
  t(素.grades !== null && 素.courses !== null, "★`null` に して いない");
  t(F.isEveryone([]) === true && F.isEveryone(null) === true, "空は みなさん");
  t(F.isEveryone(["3年"]) === false, "選べば みなさん では ない");
  t(F.targetLine([], []) === F.EVERYONE_LABEL, "みなさん の 字");
  t(F.targetLine(["3年"], ["声楽"]) === "声楽　／　3年", "2軸 が 並ぶ");
  t(F.targetLine(["1年", "2年"], []) === "1年・2年", "★片方 だけ でも 出る");

  // -------------------------------------------------------------------------
  // 【四】★表と 札
  // -------------------------------------------------------------------------
  console.log("【四】表と 札（★お決め Q4）");
  t(T.EVENT_COLUMNS.length === 7, "列は 7つ（★見本の とおり）");
  t(T.EVENT_COLUMNS.map((c) => c.label).join("／")
    === "行事／日／時間／場所／対象／届く人／ようす", "並びが 見本の とおり");
  t(T.anchorColumn().key === "title", "錨は 行事の 名前");
  // ★★★境目は **足し算** で 出す こと。★書き写さない こと。
  t(T.TABLE_AT === T.TABLE_WIDTH + T.SHELL_PADDING_X, "境目は 測った 数 ＋ 余白");
  t(T.TABLE_WIDTH === T.EVENT_COLUMNS.reduce((a, c) => a + c.min, 0), "幅は 列の 足し算");
  // ★★★殻の 余白が 本当に その 数か。
  t(readRaw("components", "OpsShell.jsx").includes('padding: "12px 14px 16px"'),
    "★殻の 余白は 左右 14px（★変えた 日に 気づきます）");
  t(T.SHELL_PADDING_X === 28, "余白は 左右で 28");
  t(T.showEventTable(null) === false, "★分からない うちは 札");
  t(T.showEventTable(T.TABLE_AT) === true, "境目 ちょうどで 表");
  t(T.showEventTable(T.TABLE_AT - 1) === false, "1px 足りなければ 札");
  // ★★時間の 1行。
  t(T.timeSpan({ start_time: "13:00:00", end_time: "15:00:00" }) === "13:00〜15:00", "時間の 1行");
  t(T.timeSpan({ start_time: "13:00:00" }) === "13:00〜", "★終わりが 無ければ 〜 だけ");
  t(T.timeSpan({}) === T.NO_VALUE, "★どちらも 無ければ —");
  // ★★画面が 幅で 切り替えて いる こと。
  t(本文.includes("showEventTable(width)"), "画面が lib に 尋ねて いる");
  t(!/width\s*>=?\s*\d{3}/.test(本文), "★幅の 数を 直に 書いて いない");

  // -------------------------------------------------------------------------
  // 【五】★字は lib
  // -------------------------------------------------------------------------
  console.log("【五】字は lib が 持つ");
  t(F.SUB_LINE.includes("出欠は 集めません"), "題の 下の 1行");
  t(!/パソコンの 本命|出欠は 集めません/.test(本文), "★画面が 書き写して いない");
  t(本文.includes("SUB_LINE") && 本文.includes("DATE_HINT") && 本文.includes("TIME_HINT"),
    "画面は lib から もらって いる");
  t(!/ff-display/.test(本文), "★`.ff-display` を 使って いない（★お決め G7）");
  // ★★道具の 較正。
  t(/ff-display/.test('className="ff-display italic"'), "★わざとの 1件を 見つけられる");

  // -------------------------------------------------------------------------
  // 【六】★台帳に 渡して いる
  // -------------------------------------------------------------------------
  console.log("【六】台帳に 渡して いる");
  const 親 = readRaw("components", "VocalTracker.jsx");
  t((親.match(/p_start_time/g) || []).length >= 2, "★2つの 呼び口 とも 時間を 渡す");
  t((親.match(/p_place/g) || []).length >= 2, "★場所も 渡す");
  t((親.match(/p_target_grades/g) || []).length >= 2, "★対象（学年）も 渡す");
  t((親.match(/p_target_courses/g) || []).length >= 2, "★対象（学科）も 渡す");
  // ★★★空の 並びを 渡す こと（★`null` を 渡さない）。
  t(/p_target_grades: (form|newEvent)\.grades \|\| \[\]/.test(親), "★空の 並びを 渡す");
  // ★★学科・コースは、★名簿に まだ 無い こと を 記して ある こと。
  t(親.includes("courses={[]}"), "★学科・コースは 空で 渡して いる");
  t(親.includes("08-10"), "★引き金が その場に ある");
  t(readRaw("docs", "ledgers", "08-保留している決め.md").includes("## 08-10"), "★台帳に ある");

  console.log(`\n○ ${ok}　✗ ${ng}`);
  process.exit(ng === 0 ? 0 : 1);
})();
