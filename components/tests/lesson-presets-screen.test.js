// ============================================================================
// ★授業の 型の 画面（★裁定 その90 §6・2026-09-18）
//
//   ★★★見るのは 事務 と 先生。★作る・消すのは 事務 だけ。
//     ★★見るだけ の 方に、★作る 札を 出しません（★§8⑤）。
//   ★★★型を 消しても 出席は 消えない、と 画面に 書いて ある こと。
// ============================================================================

const { readCode, readRaw, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

(async () => {
  const P = await loadLib("lib", "lessonPresets.js");
  const 本文 = readCode("components", "OpsPresets.jsx");
  const 生 = readRaw("components", "OpsPresets.jsx");

  // -------------------------------------------------------------------------
  // 【一】★門
  // -------------------------------------------------------------------------
  console.log("【一】門（★作るのは 事務 だけ）");
  t(P.mayEdit(["meibo"]) === true, "事務は 作れる");
  t(P.mayEdit(["monka_write"]) === false, "★先生は 作れない");
  t(P.mayEdit([]) === false && P.mayEdit(null) === false, "★何も 無ければ 作れない");
  t(P.maySee(["monka_write"]) === true, "先生も 見られる");
  t(P.maySee(["meibo"]) === true, "事務も 見られる");
  t(P.maySee([]) === false, "★何も 無ければ 見えない");
  // ★★画面が 判じて いない こと。
  t(本文.includes("mayEdit(perms)"), "lib に 尋ねて いる");
  t(!/["']meibo["']/.test(本文), "★できことの 名を 直に 見て いない");
  // ★★★作る 札を、★見るだけ の 方に 出さない こと。
  t(/\{直せる \? \(/.test(生), "★事務の ときだけ 作る 札を 出す");
  t(/if \(!直せる\) \{\s*\n\s*return <span/.test(生), "★先生には 押せない 字 に する");

  // -------------------------------------------------------------------------
  // 【二】★回数の 幅（★台帳の `check` と 同じ 数）
  // -------------------------------------------------------------------------
  console.log("【二】回数の 幅");
  t(P.TOTAL_MIN === 1 && P.TOTAL_MAX === 400, "1〜400");
  // ★★★SQL の 数と 合って いる こと。★2か所に 書いて います。
  const sql = readRaw("supabase", "migration_lesson_presets.sql");
  t(sql.includes("total_count > 0") && sql.includes("total_count <= 400"),
    "★台帳の `check` と 同じ 数");
  t(P.canSave({ name: "声楽実技", total_count: 30 }) === true, "出せる");
  t(P.canSave({ name: "", total_count: 30 }) === false, "★名前が 無ければ 出せない");
  t(P.canSave({ name: "x", total_count: 0 }) === false, "★0回は 出せない");
  t(P.canSave({ name: "x", total_count: 401 }) === false, "★401回は 出せない");
  t(P.canSave({ name: "x", total_count: 1.5 }) === false, "★小数は 出せない");
  // ★★★わけを 出す こと。★黙って 灰色に しません。
  t(P.whyCannotSave({ name: "", total_count: 30 }).includes("名前"), "★わけを 言う");
  t(P.whyCannotSave({ name: "x", total_count: 30 }) === "", "★出せる ときは 黙る");
  t(本文.includes("whyCannotSave"), "画面が それを 出して いる");

  // -------------------------------------------------------------------------
  // 【三】★字
  // -------------------------------------------------------------------------
  console.log("【三】字は lib が 持つ");
  t(P.NOTES.length === 3, "注は 3行");
  t(P.NOTES.some((x) => x.includes("出席の 記録は 消えません")), "★いちばん 大事な 1行");
  t(P.EDIT_NOTES.some((x) => x.includes("出席の 記録は 消えません")), "★中の 画面にも");
  t(!/作れるのは 事務の 方だけ|年間の 回数は 学校が/.test(本文), "★画面が 書き写して いない");
  t(本文.includes("NOTES") && 本文.includes("EDIT_NOTES"), "lib から もらって いる");
  // ★★見本の 字と 合って いる こと。
  const 見本 = readRaw("docs", "opus", "visual-2026-09-18", "pack",
    "00-動く見本-PC・iPad（運営）.html");
  const i = 見本.indexOf("function P_presets(");
  const 塊 = 見本.slice(i, 見本.indexOf("\nfunction ", i + 1)).replace(/<\/?b>/g, "");
  t(塊.length > 500, "見本の 節を 切り出せた");
  t(塊.includes(P.SUB_LINE), "添え字が 見本の まま");
  P.NOTES.forEach((x) => {
    t(塊.includes(x.slice(0, 14)), "注が 見本に ある ──「" + x.slice(0, 12) + "…」");
  });

  // -------------------------------------------------------------------------
  // 【四】★当てて いる 門下
  // -------------------------------------------------------------------------
  console.log("【四】当てて いる 門下");
  t(P.targetsWord([]) === P.NOT_ASSIGNED, "★0の ときは 空に しない");
  t(P.targetsWord(["高橋", "斎藤", "渡辺", "大川"]) === "4つ　高橋・斎藤・渡辺 ほか",
    "3人まで 名を 出す");
  t(P.targetsWord(["高橋"]) === "1つ　高橋", "1人でも 出る");
  t(P.totalWord(30) === "年 30回", "回数の 1行");
  t(P.totalWord(null) === "", "★数が 無ければ 空");

  // -------------------------------------------------------------------------
  // 【五】★色を 直に 書いて いない
  // -------------------------------------------------------------------------
  console.log("【五】色を 直に 書いて いない");
  t(!/#[0-9A-Fa-f]{6}/.test(本文.replace(/#FFFDF8/g, "")), "色を 直に 書いて いない");
  t(本文.includes("TABLE_CLASS"), "★表は `.tblwrap` に 任せて いる");
  t(!/position: "sticky"/.test(本文), "★自分で 貼り付けて いない");
  // ★★境目を 新しく 作って いない こと。
  t(本文.includes("showEventTable(width)"), "★行事の 表と 同じ 境目を 使って いる");
  t(!/width\s*>=?\s*\d{3}/.test(本文), "★幅の 数を 直に 書いて いない");

  console.log(`\n○ ${ok}　✗ ${ng}`);
  process.exit(ng === 0 ? 0 : 1);
})();
