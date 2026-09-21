#!/usr/bin/env node
/**
 * ★応募した 募集 の 見張り（★裁定 その94 §4c・見本の 断り・2026-09-21）。
 *
 *   ★★★守りたいのは 3つ ──
 *     ★① 終わった **わけ** を 出さない（★誰に 決まったかを 知らせない）
 *     ★② たずねて いない 人に「お返事は ありません」を 出さない
 *     ★③ 無い 仕掛け（90日で 消える）を 在ると 言わない
 *
 *   ★★較正 ── ★故意に 1件 該当を 作り、★見つける ことを 確かめます。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, stripCode, stripCounts, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}
/** ★終わった わけを 言って いないか。 */
function わけを言う(src) {
  // ★★「決まりました」は 送り仮名が 変わります。★語幹で 見ます（★2026-09-21）。
  //   ★★はじめ `決ま(り|っ)た` と 書き、★「決まりました」を 取り逃しました。
  return /(ほかの方|他の人|別の方)に 決ま|選ばれませんでした|落ちました|不採用/.test(src);
}

async function main() {
  const libRaw = fs.readFileSync(path.join(ROOT, "lib", "appliedList.js"), "utf-8");
  const lib = stripComments(libRaw);
  const jsx = stripComments(readRaw("components", "AppliedList.jsx"));
  const sql = stripComments(fs.readFileSync(path.join(ROOT, "supabase", "migration_my_applications_v2.sql"), "utf-8"));
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(libRaw.replace(/import[^;]*;/, "const tx=(s)=>s;"), "utf-8").toString("base64"));
  const 見本 = fs.readFileSync(path.join(ROOT, "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"), "utf-8");
  const 見本素 = 見本.replace(/<[^>]+>/g, "").replace(/\\n|\+'|'\+/g, "");
  console.log("  " + stripCounts(libRaw).line);

  console.log("=== 一 ★終わった わけを 出さない ===");
  // ★★★2026-09-21、★仕組みに 直しました（★裁定 その135）。
  //   ★★手で 断りを 切り出して いました。★字ごと 落とした もので 見ます。
  t(!わけを言う(stripCode(libRaw)), "★lib が わけを 言って いない");
  t(!わけを言う(stripCode(readRaw("components", "AppliedList.jsx"))), "★画面も 言って いない");
  t(Object.keys(m.ENDED_WORDS).length === 2, "★終わり方は 2つ だけ");
  t(!/owner|chosen|winner/.test(sql.slice(sql.indexOf("case"), sql.indexOf("end,"))),
    "★台帳も、★誰に 決まったかを 返して いない");
  t(/終わった 理由は 書きません/.test(lib), "★書かない と 断って いる");

  console.log("=== 二 ★たずねた 人にだけ 出す（★§4c） ===");
  t(m.replyLine({ template_key: "ukeraremasu" }) === "",
    "★たずねて いない 人には 何も 出さない");
  t(m.replyLine({ template_key: "kyokumoku_kikitai" }) === m.REPLY_NONE,
    "★たずねた 人には「まだ お返事は ありません」");
  t(m.replyLine({ template_key: "kyokumoku_kikitai", reply_template_key: "kyokumoku_kotae",
    reply_pieces: ["冬の旅（全曲）"] }).indexOf("冬の旅（全曲）") >= 0, "★曲の 名が 出る");
  t(m.replyLine({ template_key: "kyokumoku_kikitai", reply_template_key: "kyokumoku_kore_kara" })
    === m.REPLY_WORDS.kyokumoku_kore_kara, "★「これから 決めます」も 出る");
  // ★★空の 並びで「届きました」と 言わない こと。
  t(m.replyLine({ template_key: "kyokumoku_kikitai", reply_template_key: "kyokumoku_kotae",
    reply_pieces: [] }) === m.REPLY_NONE, "★中身の 無い 返事を、★届いたと 言わない");

  console.log("=== 三 ★返事は 相手の ものだけ ===");
  t(/m\.sender_user_id = p\.owner_user_id/.test(sql),
    "★自分の 送った ことばを、★返事として 返して いない");
  t((sql.match(/order by m\.created_at desc limit 1/g) || []).length === 2,
    "★いちばん 新しい 1つ だけ");

  console.log("=== 四 ★無い 仕掛けを 在ると 言わない ===");
  t(見本素.indexOf("90日で、この一覧からも 消えます") >= 0, "★見本には 在る（★ちがいの 証）");
  t(!/90日/.test(jsx), "★画面に 出して いない");
  t(m.NOT_YET.some((x) => x.key === "hide90" && x.when), "★外す 条件つきで 控えて ある");

  console.log("=== 五 ★字が 見本と 同じ ===");
  [m.HEAD, m.NOW_HEAD, m.ENDED_HEAD, m.APPLIED, m.REPLY_NONE,
   m.ENDED_WORDS.closed, m.ENDED_WORDS.expired].forEach((s) =>
    t(見本素.indexOf(s) >= 0, `★見本に「${s.slice(0, 20)}」が ある`));

  console.log("=== 六 ★分け方 ===");
  const r = m.split([{ id: 1, ended: null }, { id: 2, ended: "closed" }, { id: 3, ended: "expired" }]);
  t(r.now.length === 1 && r.ended.length === 2, "★いま 1件 ／ 終わったもの 2件");

  console.log("=== 七 ★較正（★故意に 1件 作る） ===");
  t(わけを言う("ほかの方に 決まりました"), "★わけを 言う 字を 見つける");
  t(わけを言う("不採用と なりました"), "★もっと きつい 字も 見つける");
  t(!わけを言う("この募集は 終わりました"), "★終わった だけの 字では 当たらない");
  t(!わけを言う("期限が 過ぎました"), "★期限の 字でも 当たらない");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
