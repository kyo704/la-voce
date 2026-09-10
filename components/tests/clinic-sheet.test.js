// ============================================================================
// ★受診用の 1枚 ── ★何を 載せるかの 見張り（★2026-09-11）
//
//   ★出どころ 裁定-9月11日の12点… §14 ／ 裁定-9月10日夜の7点（役職への一本化…）§4
//
//   ★★確かめること
//     ① 既定で 足すものが 1つも 無いこと（★個人情報の 塊を 出さない）。
//     ② 名前が 既定で 入っていないこと。
//     ③ 5行の 断りが、★1文字も 変わらずに あること。
//     ④ 見出しに「かならず」を 使っていないこと（★強すぎる）。
//     ⑤ 病名・尺度の 名前・点数が、★どの項目にも 無いこと。
//     ⑥ 数えていないこと（★「あと◯項目」「◯/10」）。
//     ⑦ 壊れた 値でも 落ちないこと。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const src = fs.readFileSync(path.join(ROOT, "lib", "clinicSheet.js"), "utf8");
  // ★★「無いこと」を 数えるのは、★注記を 外した 本文で（★10回目）。
  //   ★★この 帳面の 註は、★裁定の 消した 一文を そのまま 引いています。
  //     ★「かならず 入るもの」も「紙の 意味が ありません」も、
  //     ★★なぜ 消したかを 書くために、★註の 中に あります。
  //   ★★禁じれば 禁じるほど 当たりやすく なる ── ★その形の 10回目でした。
  const srcCode = readCode("lib", "clinicSheet.js");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const {
    CLINIC_ALWAYS, CLINIC_OPTIONAL, CLINIC_DEFAULT, CLINIC_NOTICE, CLINIC_HEADINGS,
    normalizePick, togglePick, isOn, readPick, writePick
  } = m;

  console.log("① 既定で 足すものが 1つも 無い");
  ok(CLINIC_DEFAULT.length === 0, "★既定は 空");
  ok(normalizePick(undefined).length === 0, "★何も 渡さなくても 空");
  ok(readPick().length === 0, "★端末が 無いときも 空");
  // ★★「おすすめ」を 用意していないこと。★用意した とたん 既定に なります。
  ok(!/おすすめ|recommended|SUGGEST/i.test(srcCode), "★「おすすめ」を 用意していない");

  console.log("② 名前は 既定で 入らない");
  ok(CLINIC_OPTIONAL.some((x) => x.key === "name"), "★名前は「足すなら」の 側に ある");
  ok(!CLINIC_ALWAYS.some((x) => x.key === "name"), "★はじめから 入っているものに 名前が 無い");
  ok(isOn([], "name") === false, "★何も 選ばなければ、名前は 載らない");

  console.log("③ 5行の 断り");
  ok(CLINIC_NOTICE.length === 5, "★5行 ある");
  [
    "この紙は 要配慮個人情報です。落とすと 取り返せません",
    "アプリの中から 医療機関へ 送る道は ありません",
    "学校にも 先生にも 運営にも 届きません",
    "多く 載せるほど、渡した相手に 分かることが 増えます",
    "迷ったら、少ないほうを 選んでください"
  ].forEach((line, i) => ok(CLINIC_NOTICE[i] === line, "★" + (i + 1) + "行目が そのまま"));

  console.log("④ 「かならず」を 使っていない");
  // ★★9/10夜 §4「★『これが 無いと、紙の 意味が ありません』←★消しました」
  //   ★「かならず 入るもの」→「はじめから 入っているもの」
  ok(CLINIC_HEADINGS.always === "はじめから 入っているもの", "★見出しが 直っている");
  ok(!/かならず 入る/.test(srcCode), "★「かならず 入る」が 無い");
  ok(!/紙の 意味が ありません/.test(srcCode), "★消した 一文が 戻っていない");
  ok(CLINIC_HEADINGS.enough === "この 2つだけで、1枚に できます。",
    "★「2つだけで できます」と 言っている");

  console.log("⑤ 病名・尺度・点数が 無い");
  const all = CLINIC_ALWAYS.concat(CLINIC_OPTIONAL).map((x) => x.label).join(" ");
  ["逆流", "GERD", "LPR", "RSI", "VFI", "SVHI", "EASE", "点", "スコア", "偏差"].forEach((w) => {
    ok(!all.includes(w), "★項目の 名前に「" + w + "」が 無い");
  });

  console.log("⑥ 数えていない");
  const ui = readCode("components", "VocalTracker.jsx");
  ok(!/あと\s*\d+\s*項目/.test(ui), "★「あと◯項目」を 出していない");
  ok(!/CLINIC_OPTIONAL\.length/.test(readCode("components", "VocalTracker.jsx")),
    "★「◯/10」の 形も 作っていない");

  console.log("⑦ 壊れた 値でも 落ちない");
  [null, undefined, 7, "あ", {}, ["nope"]].forEach((bad) => {
    ok(Array.isArray(normalizePick(bad)), "★" + JSON.stringify(bad) + " → 一覧が 返る");
  });
  ok(togglePick([], "sleep").includes("sleep"), "★押すと 入る");
  ok(togglePick(["sleep"], "sleep").length === 0, "★もう一度 押すと 外れる");
  ok(isOn([], "period") === true, "★はじめから 入っているものは、いつも 載る");
  ok(Array.isArray(writePick(["sleep"])), "★端末が 無くても 書ける");

  console.log("⑧ 画面に、★決めが 効いていること");
  const v = readRaw("components", "VocalTracker.jsx");
  // ★★足すものは ぜんぶ、★選ばれなければ 出ないこと。
  const gated = (v.match(/isOn\(clinicPick, "/g) || []).length;
  ok(gated === 6, "★足すものの 節が、★6つ とも 出し分けられている（いま " + gated + "）");
  ["name", "speech", "sleep", "history", "ownWords", "dinnerToBed"].forEach((k) => {
    ok(new RegExp('isOn\\(clinicPick, "' + k + '"\\)').test(v), "★「" + k + "」が 出し分けの 中");
  });
  // ★★はじめから 入っている 2つは、★出し分けの 外に あること。
  ok(!/isOn\(clinicPick, "period"\)/.test(v), "★期間は いつも 載る");
  ok(!/isOn\(clinicPick, "hardDays"\)/.test(v), "★出づらかった日も いつも 載る");
  // ★★5行の 断りが、★画面に 出ていること。
  ok(/CLINIC_NOTICE\.map/.test(v), "★5行の 断りを 出している");
  ok(/CLINIC_HEADINGS\.always/.test(v) && /CLINIC_HEADINGS\.enough/.test(v),
    "★見出しも 決めから 取っている（★画面に 書き写していない）");
  // ★★既定が 空なので、★はじめて 開いた方には 2項目だけ 出ます。
  ok(/useState\(\[\]\)/.test(v.slice(v.indexOf("const [clinicPick"), v.indexOf("const [clinicPick") + 80)),
    "★はじめは 空（★足すものは 1つも 載らない）");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
