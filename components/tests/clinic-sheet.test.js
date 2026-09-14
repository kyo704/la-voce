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



// ============================================================================
// ★見本の 形に なって いること（★2026-09-14）
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     の `nJushin()`（★受診用の 1枚）
//
//   ★★坂本さんの お決め（★㋐）──
//     ★「入・変更不可」＝ 緑の ✓・`cursor:default`・反応しない
//     ★「入・変更可」　＝ 緑で「✓ 載せる」
//     ★「切・変更可」　＝ 薄い字で「載せない」
//     ★区切り　　　　 ＝ `.box` の 中に 行を 並べ、★行間に 罫線
//
//   ★★この 見張りが 見て いない こと
//     ★字の 並びだけ を 見ます。★色の 見え方は 見て いません。
//     ★実際の 色は 実機で 確かめます（★docs/design/compare/ichimai/）。
// ============================================================================
  {
  const ui = readCode("components", "NotesV2.jsx");
  const lib = readCode("lib", "clinicSheet.js");

  console.log("\n★見本の 形");

  // ★① 右に 出す 字は、★1か所で 決める
  ok(/export function rowMark\(/.test(lib), "★右の 字は lib が 決める");
  ok(/"✓ 載せる"/.test(lib) && /"載せない"/.test(lib), "★見本の 字の まま");
  ok(!/"✓ 載せる"/.test(ui) && !/"載せない"/.test(ui),
    "★画面に 書き写して いない");

  // ★② 外せない 行は 押せない
  ok(/rowMark\("always"\)/.test(ui), "★外せない 行の 印を lib から 取る");
  ok(/cursor: "default"/.test(ui), "★押せない 形に して いる");

  // ★③ 箱に 入れて、★行間に 罫線（★Li が 引きます）
  ok(/<Box>[\s\S]{0,400}CLINIC_ALWAYS/.test(ui), "★外せない 行は Box の 中");
  ok(/<Box>[\s\S]{0,400}CLINIC_OPTIONAL/.test(ui), "★足す 行も Box の 中");
  ok(!/className="li w-full text-left"/.test(ui),
    "★生の button を 並べて いない（★Li に そろえた）");

  // ★④ 期間は 札。★暦は「選ぶ」の ときだけ
  ok(/export const CLINIC_PERIODS/.test(lib), "★期間の 札が lib に ある");
  ok(/clinicPeriod === "pick" \?/.test(ui), "★暦は「選ぶ」の ときだけ");
  ok(/periodRange\("3m", todayISO\)/.test(ui),
    "★はじめの 期間も 同じ 決まりから 出す");

  // ★⑤ 数は「いま 載る 数」
  ok(/export function pickCount\(/.test(lib), "★数え方が lib に ある");
  ok(/pickCount\(clinicPick\)/.test(ui), "★画面は lib に 尋ねる");
  ok(!/2項目で/.test(ui), "★数を 決め打ちして いない");

  // ★⑥ 見本の 字を 画面に 書き写して いない
  ok(/export const CLINIC_INTRO/.test(lib), "★はじめの 3行が lib に ある");
  ok(/export const CLINIC_FOOT/.test(lib), "★下の 3行も lib に ある");
  ok(/これは 無料です。/.test(lib), "★「無料です」まで 見本の とおり");
  ok(!/一番少ない/.test(ui), "★はじめの 3行を 書き写して いない");

  // ★⑦ 「足りない」と 読ませない
  ok(/CLINIC_HEADINGS\.enough/.test(ui), "★「この 2つだけで、1枚に できます」を 出す");
  ok(!/あと\s*\{|あと.項目/.test(ui), "★「あと◯項目」と 書いて いない");

  console.log("\n★レッスンに 持っていく 1枚（★見本 nLesson）");
  // ★★2026-09-14 まで、★札を 押しても 中身が 変わりませんでした。
  //   ★「お医者さんに 見せる 1枚を 作ります」と 出た ままでした。
  ok(/clinicMode === "lesson" \? lessonScreen\(\)/.test(ui),
    "★札で 中身が 変わる");
  ok(/export const LESSON_ITEMS/.test(lib), "★載せるものが lib に ある");
  ok(/export const LESSON_PERIODS/.test(lib), "★期間の 札も lib に ある");
  ok(/export const LESSON_NOTICE/.test(lib), "★断りも lib に ある");
  // ★★外せない ものは ありません。★ぜんぶ 外せます（★見本の 断り）。
  ok(!/LESSON_ALWAYS/.test(lib), "★外せない 行を 作って いない");
  ok(/載せないと 選べる/.test(lib), "★見本の 断りを そのまま 持って いる");
  // ★★覚え場所は 分けます。★受診用と 混ぜません。
  ok(/export const LESSON_PICK_KEY/.test(lib), "★覚え場所を 分けて いる");
  ok(/woolsong-lesson-pick/.test(lib) && /woolsong-clinic-pick/.test(lib),
    "★2つの 名前が 別");
  ok(/lessonCount\(lessonPick\)/.test(ui), "★数も lib に 尋ねる");
  // ★★出来ばえ・点数・順位を 入れない、と 画面で 言う。
  ok(/出来ばえ・点数・順位は、どの項目にも 入りません/.test(lib),
    "★点数を 出さない、と 言って いる");
  }

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
