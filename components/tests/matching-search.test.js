#!/usr/bin/env node
// STRIP: B（文言）── ★見本の 字と 突き合わせます。
//   ★★並べ替えの 有無だけ A です（★`.sort(` を 探します）。
/**
 * ★さがす の 見張り（★見本 `SC['伴奏をさがす']`・裁定 その94〜95・その120〜123）。
 *
 *   ★★★守りたいのは 4つ ──
 *     ★① 並べ替えを 画面で しない（★おすすめ順に しない・裁定 その95）
 *     ★② 人を さがす 道を 作らない（★募集を 見る だけ）
 *     ★③ 1件も 無い ときこそ、★出す 口が 残る（★裁定 その120）
 *     ★④ 表を 直に 引かない（★`get_postings()` を 通す・裁定 その122）
 *
 *   ★★較正 ── ★故意に 1件 該当を 作り、★見つける ことを 確かめます。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}
/** ★並べ替えを 画面で して いないか。 */
function 並べ替え(src) {
  return /\.sort\(/.test(src);
}
/** ★人を さがす 道（★名前で 人を 引く）を 作って いないか。 */
function 人をさがす(src) {
  return /from\(\s*["'`]profiles["'`]\s*\)|rpc\(\s*["'`]get_org_student_names/.test(src);
}

async function main() {
  const libRaw = fs.readFileSync(path.join(ROOT, "lib", "matchingSearch.js"), "utf-8");
  const lib = stripComments(libRaw);
  const jsxRaw = readRaw("components", "MatchingSearch.jsx");
  const jsx = stripComments(jsxRaw);
  const 見本 = fs.readFileSync(path.join(ROOT, "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"), "utf-8");

  console.log("=== 一 ★字が 見本と 同じ ===");
  // ★★★見本の 字は `<b>` で 切れて います（★2026-09-21 に 気づきました）。
  //   ★★「ことばは <b>決まった 言い方から 選びます</b>（自由には 書けません）」
  //   ★★札を 外してから 比べないと、★同じ 字を「無い」と 報せます。
  const 見本素 = 見本.replace(/<[^>]+>/g, "").replace(/\\n|\+'|'\+/g, "");
  // ★★`NOT_YET` の 字は 見本に ありません。★こちらで 足した 断り です。
  // ★★見本に 無い 字（★こちらで 足した 断り）は 突き合わせません。
  //   ★★`NO_ENROLL` …… ★在籍が 無い ときの 断り（★2026-09-21）。
  //     ★★見本には ありません。★見本は「在籍して いる 方」を 前提に して います。
  //   ★★`SCHOOL_HEAD` …… ★学校を 選ぶ 題（★裁定 その140・2026-09-21）。
  //     ★★見本には ありません。★見本は 1校を 前提に して います。
  const 私の字 = (lib.match(/KIND_NOT_YET = Object\.freeze\(\{[\s\S]*?\}\)/) || [""])[0]
    + (lib.match(/NO_ENROLL[\s\S]*?NO_ENROLL_SUB = tx\("[^"]*"\);/) || [""])[0]
    + (lib.match(/SCHOOL_HEAD = tx\("[^"]*"\);/) || [""])[0];
  [...lib.matchAll(/tx\("([^"{]+)"\)/g)].map((m) => m[1])
    .filter((s) => s.length >= 8 && !/\{n\}/.test(s) && 私の字.indexOf(s) < 0)
    .forEach((s) => t(見本素.indexOf(s) >= 0, `★見本に「${s.slice(0, 26)}…」が ある`));

  console.log("=== 二 ★並べ替えを して いない（★裁定 その95） ===");
  t(!並べ替え(jsx), "★画面で 並べ替えて いない");
  t(!並べ替え(lib), "★lib でも 並べ替えて いない");
  t(/新しい順に 並べています。おすすめ順には しません。/.test(lib),
    "★「おすすめ順に しません」と 言って いる");

  console.log("=== 三 ★人を さがす 道が 無い ===");
  t(!人をさがす(jsx), "★画面が 人の 表を 引いて いない");
  t(!人をさがす(lib), "★lib も 引いて いない");
  t(/こちらから 人を さがすことは できません。/.test(lib), "★その 断りが 出て いる");

  console.log("=== 四 ★表を 直に 引いて いない（★裁定 その122） ===");
  ["postings", "applications", "matching_cuts", "application_messages"].forEach((表) => {
    t(!new RegExp(`from\\(\\s*["'\`]${表}["'\`]`).test(jsx), `★画面が ${表} を 直に 引いて いない`);
  });
  t(!/createClient|supabase/.test(jsx), "★画面が 台帳に 触れて いない（★もらった ものを 出すだけ）");

  console.log("=== 五 ★1件も 無い ときの 入口（★裁定 その120） ===");
  // ★★★頭の import にも 同じ 名が 並びます（★2026-09-21）。
  //   ★★そこから 切ると、★中身では なく 名前の 列を 見る ことに なります。
  const 本体 = jsx.slice(jsx.indexOf("export default function"));
  const 空 = 本体.slice(本体.indexOf("EMPTY_HEAD"), 本体.indexOf("SECTION_MINE"));
  t(空.length > 200, `★中身を 切り出せて いる（${空.length}字）`);
  // ★★★行き先の 画面が まだ ありません（★2026-09-21）。
  //   ★★押せない 札を 置きません。★いまは 字だけ 出します。
  //   ★★★入口を **黙って 消して いない** ことを 見ます（★裁定 その120）。
  // ★★2026-09-21、★行き先（募集を 出す）が できたので 札に 戻しました。
  t(/onNewPosting/.test(空), "★0件の ときも「募集を 出す」の 札が 出る");
  t(/GO_NEW/.test(空), "★字は lib から 取って いる");
  t(/EMPTY_NOTES/.test(空), "★0件の ときの 断りが 出る");

  console.log("=== 五の二 ★在籍が 無い とき（★2026-09-21・実機で 分かりました） ===");
  // ★★★空の 一覧と 押せる 札を 出して、★押させてから 断りません。
  //   ★★「いま 出せませんでした」は 嘘に なります。★仕組みで できません。
  t(/NO_ENROLL/.test(lib), "★在籍が 無い ときの 字が ある");
  t(/在籍して いる 方が 使えます/.test(lib), "★できない ことを 先に 伝える");
  t(/{!enrolled \?/.test(本体), "★画面が 出し分けて いる");
  t(/onNewPosting && enrolled/.test(本体), "★在籍が 無ければ 出す 札を 出さない");
  t((本体.match(/onNewPosting && enrolled/g) || []).length === 2,
    "★0件の ときも、★1件でも ある ときも、★同じ 条件");

  console.log("=== 五の三 ★学校を 選ぶ（★裁定 その140） ===");
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(libRaw.replace(/import[^;]*;/, "const tx=(s)=>s;"), "utf-8").toString("base64"));
  // ★Q1 ── ★1校 だけ なら 出しません。
  t(m.showSchoolPicker([{ org_id: "a" }]) === false, "★Q1 1校 だけ なら 札を 出さない");
  t(m.showSchoolPicker([{ org_id: "a" }, { org_id: "b" }]) === true, "★2校 以上なら 出す");
  t(m.showSchoolPicker([]) === false, "★0校でも 出さない");
  // ★★覚えて いる 学校を 選び直す こと。
  const 校 = [{ org_id: "a" }, { org_id: "b" }];
  t(m.pickSchool(校, "b") === "b", "★覚えた 学校を 選ぶ");
  t(m.pickSchool(校, "z") === "a", "★覚えた 学校に 在籍して いなければ 1つ目");
  t(m.pickSchool(校, null) === "a", "★覚えが 無ければ 1つ目");
  t(m.pickSchool([], "a") === null, "★1校も 無ければ null");
  // ★★覚えるのは 端末だけ（★台帳に 持たない）。
  t(/localStorage/.test(本体) || /localStorage/.test(stripComments(readRaw("components", "VocalTracker.jsx"))),
    "★端末に 覚えて いる");
  const vt = stripComments(readRaw("components", "VocalTracker.jsx"));
  t(!/insert[^;]*last_org|update[^;]*last_org/.test(vt), "★台帳に 覚えて いない");
  // ★★混ぜて いない こと（★1つの 学校ぶん だけ を 引く）。
  t(/get_postings", \{ p_org_id: orgId \}/.test(vt), "★1つの 学校ぶん だけ 引いて いる");
  t(!/schools\.map[^;]{0,120}get_postings/.test(vt), "★学校ごとに 引いて 混ぜて いない");
  // ★★11枚 並んでも 横に 流せる こと（★Q7）。
  t(/overflowX: "auto"/.test(本体), "★Q7 横に 流せる");
  t(!/flexWrap: "wrap"/.test(本体.slice(本体.indexOf("showSchoolPicker"),
    本体.indexOf("showSchoolPicker") + 700)), "★折り返して いない");

  console.log("=== 六 ★出さない ものを 出して いない（★§4g・§7） ===");
  ["start_time", "end_time", "venue", "place", "age", "grade", "enrollment_year"]
    .forEach((名) => t(!new RegExp(`\\b${名}\\b`).test(jsx + lib), `★${名} を 触って いない`));

  console.log("=== 七 ★0件の 数を 出して いない（★裁定 その95・§4e） ===");
  const f = (lib.match(/export function applicationWord[\s\S]*?\n}/) || [""])[0];
  t(/<= 0\) return ""/.test(f), "★0件の ときは 何も 言わない");

  console.log("=== 八 ★効かない 札を 並べて いない（★§8⑤） ===");
  const p = (lib.match(/KIND_PILLS = Object\.freeze\(\[([^\]]*)\]\)/) || ["", ""])[1];
  t((p.match(/tx\(/g) || []).length === 1, `★絞りの 札は 1つ だけ（いま ${(p.match(/tx\(/g) || []).length}）`);
  t(/KIND_NOT_YET/.test(lib) && /when:/.test(lib), "★まだ できない ことに、★外す 条件が 添えて ある");

  console.log("=== 九 ★較正（★故意に 1件 作る） ===");
  t(並べ替え("const x = rows.sort((a,b) => a.t - b.t);"), "★並べ替えを 見つける");
  t(!並べ替え("const x = rows.map((r) => r.t);"), "★map では 当たらない");
  t(人をさがす('await sb.from("profiles").select("display_name")'), "★人の 表を 引く 形を 見つける");
  t(!人をさがす('await sb.rpc("get_postings", { p_org_id: id })'), "★募集を 引く 形では 当たらない");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
