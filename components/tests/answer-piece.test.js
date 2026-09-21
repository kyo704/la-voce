#!/usr/bin/env node
// STRIP: A（振る舞い）── ★落とすのは 註 だけ です（★裁定 その137）。
//   ★★「字が 見本と 同じか」の 節は、★字を そのまま 見ます。
/**
 * ★曲目を 答える の 見張り（★裁定 その94 §4c・2026-09-21）。
 *
 *   ★★★守りたいのは 4つ ──
 *     ★① 自由に 書ける 欄を 置かない（★曲の 名は データ です）
 *     ★② 曲と「決まった ことば」を 同時に 送れない
 *     ★③ たずねられて いる ときしか 送れない（★台帳の 門）
 *     ★④ 足した 曲は、★ふだんの レパートリーと 同じ 表に 入る
 *
 *   ★★較正 ── ★2件（★註の 中は 出ない ／ 中身は 出る）。
 */
const fs = require("fs");
const path = require("path");
const { stripCode, stripSqlCode, stripCounts, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

async function main() {
  const libRaw = fs.readFileSync(path.join(ROOT, "lib", "answerPiece.js"), "utf-8");
  const lib = stripCode(libRaw);
  const jsx = stripCode(readRaw("components", "AnswerPiece.jsx"));
  const vt = stripCode(readRaw("components", "VocalTracker.jsx"));
  const 門 = stripSqlCode(fs.readFileSync(
    path.join(ROOT, "supabase", "migration_message_insert_guard.sql"), "utf-8"));
  const 表 = stripSqlCode(fs.readFileSync(
    path.join(ROOT, "supabase", "migration_application_messages.sql"), "utf-8"));
  console.log("  " + stripCounts(libRaw).line);
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(libRaw.replace(/import[^;]*;/, "const tx=(s)=>s;"), "utf-8").toString("base64"));
  const 見本 = fs.readFileSync(path.join(ROOT, "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"), "utf-8");
  const 見本素 = 見本.replace(/<[^>]+>/g, "").replace(/\\n|\+'|'\+/g, "");

  console.log("=== 一 ★自由に 書ける 欄を 置かない（★§4c） ===");
  // ★★入れ口は 1つ だけ。★曲の 名を 足す ため です。
  const 入 = (jsx.match(/<(?:input|textarea)/g) || []).length;
  t(入 === 1, `★入れ口は 1つ だけ（いま ${入}）`);
  t(!/<textarea/.test(jsx), "★長い 文の 欄が 無い");
  t(/placeholder=\{ADD_HINT\}/.test(jsx), "★その 1つは 曲の 名の ため");
  t(!/\bbody\b|free_text|comment/.test(lib), "★lib に 自由文の 名が 無い");
  t(!/\bbody\b/.test(表), "★台帳にも 自由文の 列が 無い");

  console.log("=== 二 ★曲と ことばを 同時に 送れない ===");
  t(m.canSubmit({ pieces: ["あ"], fallback: null }) === true, "★曲だけ なら 送れる");
  t(m.canSubmit({ pieces: [], fallback: "toujitsu_made_ni" }) === true, "★ことばだけ なら 送れる");
  t(m.canSubmit({ pieces: ["あ"], fallback: "toujitsu_made_ni" }) === false, "★両方は 送れない");
  t(m.canSubmit({ pieces: [], fallback: null }) === false, "★どちらも 無ければ 送れない");
  t(m.whyNot({ pieces: ["あ"], fallback: "toujitsu_made_ni" }).length > 0, "★わけが 出る");
  // ★★画面でも 片方を 外して いる こと。
  t(/fallback: null/.test(jsx) && /pieces: \[\]/.test(jsx), "★片方を 選ぶと もう片方を 外す");

  console.log("=== 三 ★台帳に 渡す 形 ===");
  t(m.toRow({ pieces: ["あ", "い"], fallback: null }).template_key === "kyokumoku_kotae",
    "★曲を 選んだ ときの 名");
  t(m.toRow({ pieces: [], fallback: "kyokumoku_kore_kara" }).pieces === null,
    "★ことばの ときは 並びを 付けない（★台帳の 縛り）");
  // ★★台帳の 縛りと 同じ 名 で ある こと。
  ["kyokumoku_kotae", "kyokumoku_kore_kara", "toujitsu_made_ni"].forEach((k) =>
    t(new RegExp(`'${k}'`).test(表), `★台帳の 縛りに ${k} が ある`));

  console.log("=== 四 ★たずねられて いる ときだけ（★台帳の 門） ===");
  t(/p\.owner_user_id = auth\.uid\(\)/.test(門), "★返すのは 募集の 持ち主 だけ");
  t(/a\.template_key = 'kyokumoku_kikitai'/.test(門), "★たずねられて いる ときだけ");
  t(/matching_visible\(a\.applicant_user_id, p\.owner_user_id\)/.test(門), "★切れて いない こと");
  t(/a\.status <> 'withdrawn'/.test(門), "★取り下げられて いない こと");
  // ★★画面でも、★たずねられて いない 方に 札を 出さない こと。
  const ad = stripCode(readRaw("components", "ApplicantDetail.jsx"));
  t(/onAnswer && isAsking\(detail\)/.test(ad), "★画面でも 出し分けて いる");

  console.log("=== 五 ★足した 曲は 同じ 表に 入る（★§4c inline_add） ===");
  t(/from\("repertoire_tessitura"\)/.test(vt), "★ふだんの レパートリーと 同じ 表");
  t(/onConflict: "user_id,repertoire_name"/.test(vt), "★同じ 曲を 2つ 作らない");
  t(!/from\("matching_repertoire"|answer_pieces/.test(vt), "★別の 表を 作って いない");
  t(m.NOT_YET.some((x) => x.key === "composer" && x.when), "★作った人は when つきで 控えて ある");

  console.log("=== 六 ★字が 見本と 同じ ===");
  // ★★★見本は「曲目」を `W('piece')` で 出して います（★裁定 その119 の 辞書）。
  //   ★★だから 続けた 字は 見本に ありません。★辞書を 使わない ぶん を 見ます。
  //   ★★裁定 その119 は 後回しです。★いまは「曲目」で 書いて います。
  const 辞書ぬき = (s2) => s2.replace(/^曲目/, "");
  [m.HEAD, m.FROM_REP, m.ADD_HERE, m.OR_HEAD, m.SUBMIT,
   ...m.FALLBACKS.map((x) => x.label)].forEach((s2) =>
    t(見本素.indexOf(辞書ぬき(s2)) >= 0, `★見本に「${辞書ぬき(s2).slice(0, 18)}」が ある`));
  t(/W\('piece'\)/.test(見本), "★見本は 曲目を 辞書から 出して いる（★裁定 その119）");

  console.log("=== 七 ★較正（★2件） ===");
  const 語 = "kariNoGo";
  t(!new RegExp(語).test(stripCode(`// ${語}\nconst a = 1;`)), "★① 註の 中は 出ない");
  t(new RegExp(語).test(stripCode(`const a = ${語};`)), "★② 中身は 出る");
  t(new RegExp(語).test(stripCode(`const a = "${語}";`)), "★字は 残る（★裁定 その137）");
  t(!new RegExp(語).test(stripSqlCode(`comment on table t is '${語}';`)),
    "★SQL の 覚え書きは 落ちる");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
