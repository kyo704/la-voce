// ============================================================================
// ★日程の 字 ── ★R1〜R4（★裁定 その85・2026-09-18）
//
//   ★★★R4 の うち 1行は、★わざと 置いて いません。
//     ★★見本の 4行目 ──「先生の『自分の 予定』は『予定あり』とだけ 出ます」。
//     ★★その 札が この 蔵に ありません。★無い ものの 説明を しません。
//     ★★台帳 docs/ledgers/08-保留している決め.md 08-8
//
//   ★★見る の は 5つ。
//     ★【一】★字が lib に あり、★画面に 書き写されて いない こと
//     ★【二】★見本の 字と 1文字も ずれて いない こと
//     ★【三】★置いて いない 1行が、★引き金つきで 記して ある こと
//     ★【四】★空いた ところの 札が「押すと 何か 起きる」形で ある こと
//     ★【五】★太い ところが 行の 中に ある こと
// ============================================================================

const { readCode, readRaw, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

(async () => {
  const S = await loadLib("lib", "opsSchedule.js");
  const 本文 = readCode("components", "OpsSchedule.jsx");
  const 生 = readRaw("components", "OpsSchedule.jsx");
  const 見本 = readRaw("docs", "opus", "visual-2026-09-18", "pack",
    "00-動く見本-PC・iPad（運営）.html");
  const i = 見本.indexOf("function P_nittei(");
  const 塊 = 見本.slice(i, 見本.indexOf("\nfunction ", i + 1));
  // ★★見本の 中では 字の 途中に `<b>` が 入ります。★外して から くらべます。
  const 素 = 塊.replace(/<\/?b>/g, "");
  t(塊.length > 1000, "見本の 節を 切り出せた");
  t(素.length < 塊.length, "★`<b>` を 外せた（★道具の 較正）");

  // -------------------------------------------------------------------------
  // 【一】★決めは lib に
  // -------------------------------------------------------------------------
  console.log("【一】字は lib が 持つ");
  t(本文.includes("SUB_LINE") && 本文.includes("DAY_NOTES")
    && 本文.includes("WEEK_NOTES") && 本文.includes("SLOT_NOT_YET"),
    "画面は lib から もらって いる");
  t(!/パソコンの 本命/.test(本文), "画面が 添え字を 書き写して いない");
  t(!/時間の 列は 左に 止まります/.test(本文), "画面が 注を 書き写して いない");

  // -------------------------------------------------------------------------
  // 【二】★見本と 1文字も ずれて いない
  // -------------------------------------------------------------------------
  console.log("【二】見本の 字と ずれて いない");
  t(素.includes(S.SUB_LINE), "添え字 ──「" + S.SUB_LINE + "」");
  S.DAY_NOTES.forEach((n) => {
    t(素.includes(n.text.slice(0, 20)), "1日の 注 ──「" + n.text.slice(0, 16) + "…」");
  });
  S.WEEK_NOTES.forEach((n) => {
    t(素.includes(n.text.slice(0, 16)), "週の 注 ──「" + n.text.slice(0, 16) + "…」");
  });
  // ★★★見本の 4行目が、★見本には ある こと（★消えたのでは ありません）。
  t(素.includes(S.NOT_YET_NOTES[0].line.slice(0, 20)), "★見本には その 1行が ある");

  // -------------------------------------------------------------------------
  // 【三】★置いて いない 1行
  // -------------------------------------------------------------------------
  console.log("【三】置いて いない 1行（★引き金つき）");
  t(S.NOT_YET_NOTES.length === 1, "置いて いないのは 1行");
  t(!!S.NOT_YET_NOTES[0].why && !!S.NOT_YET_NOTES[0].needs, "わけと、要る ものが 書いて ある");
  // ★★★その 字が、★画面に 出て いない こと。
  t(!本文.includes("予定あり"), "★「予定あり」を 画面に 書いて いない");
  t(!S.DAY_NOTES.some((n) => n.text.includes("予定あり")), "★注の 一覧にも 入って いない");
  t(readRaw("docs", "ledgers", "08-保留している決め.md").includes("## 08-8"), "台帳に ある");
  t(readRaw("lib", "opsSchedule.js").includes("08-8"), "★引き金が その場に ある");
  // ★★5行目（★約束）は 置いて ある こと。
  t(S.DAY_NOTES.some((n) => n.text.includes("理由も 聞きません")), "★約束の 1行は 置いて ある");
  // ★★★その 約束が、★いま 本当に 守られて いる こと。
  //   ★★運営の 表に 流れ込むのは `lessons` だけ です。
  const 親 = readCode("components", "VocalTracker.jsx");
  t(/lessons=\{\(orgLessons\[opsOrgId\] \|\| \[\]\)\}/.test(親),
    "★表に 渡して いるのは 学校の コマ だけ");
  t(!/performances/.test(readCode("components", "OpsSchedule.jsx")),
    "★画面が 個人の 予定を 読んで いない");

  // -------------------------------------------------------------------------
  // 【四】★空いた ところ
  // -------------------------------------------------------------------------
  console.log("【四】空いた ところ（★裁定 その84 の 形）");
  t(S.SLOT_MARK === "＋", "見本と 同じ しるし");
  t(typeof S.SLOT_NOT_YET === "string" && S.SLOT_NOT_YET.length > 10, "断りの 字が ある");
  t(!/坂本|API|env|null が 返/.test(S.SLOT_NOT_YET), "★台帳の 言葉を 画面に 出して いない");
  t(/onClick=\{\(\) => setSlotNote\(SLOT_NOT_YET\)\}/.test(生), "押すと 断りが 出る");
  t(/埋まって \? null :/.test(生), "★コマの ある ところには 出さない");
  t(/minHeight: 44/.test(生), "★押しどころは 44 以上");

  // -------------------------------------------------------------------------
  // 【五】★太い ところ
  // -------------------------------------------------------------------------
  console.log("【五】太い ところは 行の 中");
  S.DAY_NOTES.concat(S.WEEK_NOTES).forEach((n) => {
    if (!n.bold) return;
    t(n.text.includes(n.bold), "太い ところが 行の 中に ある ──「" + n.bold + "」");
  });
  t(/n\.text\.slice\(0, n\.text\.indexOf\(n\.bold\)\)/.test(生),
    "★行の 頭 とは 限らない 形で 切って いる");

  console.log(`\n○ ${ok}　✗ ${ng}`);
  process.exit(ng === 0 ? 0 : 1);
})();
