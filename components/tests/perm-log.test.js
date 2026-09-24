#!/usr/bin/env node
// STRIP: A
// ============================================================================
// ★役職を 変えた 記録（★裁定194・2026-09-24）
//
//   ★★★「消しません」と 決めた 記録に、★読む 画面を 付けました。
//     ★★読めない 記録は 守りに なりません。
//   ★★見るのは 4つ ──
//     ① 誰が 読めるかを **画面で** 決めて いない（★台帳が 決めます）
//     ② 列を 名指しで 引いて いる
//     ③ 名前は そのときの 名前（`post_name_at`）で 出す
//     ④ 書いた 註が 本当（★台帳の 側でも 確かめる）
// ============================================================================

const assert = require("assert");
const { readCode, readRaw, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const L = await loadLib("lib", "permLog.js");
  const 画 = readCode("components", "OpsPermLog.jsx");
  const 人 = readCode("components", "OpsPeople.jsx");
  const vt = readCode("components", "VocalTracker.jsx");

  見る("較正 ── ★読めて いる", () => {
    assert.ok(画.includes("OpsPermLog"), "★画面が 読めて いません");
    assert.ok(Array.isArray(L.NOTES), "★束が 読めて いません");
  });

  見る("① 誰が 読めるかを 画面で 決めて いない", () => {
    // ★★★決めるのは 台帳（`org_post_perm_log_select`）です。
    assert.ok(!/has_can|master|'post'/.test(画), "★画面で 絞って います");
    // ★★札の 出し分けは 呼ぶ 側。★どちらも 無い 方には 渡しません。
    assert.ok(/canOps\(gate, "post"\) \|\| canOps\(gate, "master"\)/.test(vt),
      "★札の 出し分けが ありません");
    assert.ok(/onGoPermLog/.test(人), "★入口が ありません");
    // ★★渡されなければ 出さない こと。
    assert.ok(/onGoPermLog \?/.test(人), "★押せない 札を 置いて います");
  });

  見る("② 列を 名指しで 引いて いる", () => {
    assert.ok(!/select\("\*"\)/.test(画), "★select('*') を 書いて います");
    assert.ok(/COLS_PERM_LOG/.test(画), "★列の 名を 借りて いません");
    // ★★体調に 関わる 列が 混ざって いない こと。
    ["throat", "voice", "sleep", "health"].forEach((w) =>
      assert.ok(!L.COLS_PERM_LOG.includes(w), "★" + w + " が 混ざって います"));
  });

  見る("③ 名前は そのときの 名前", () => {
    assert.ok(L.COLS_PERM_LOG.includes("post_name_at"), "★そのときの 名を 引いて いません");
    const r = L.rowsOf([{ id: "1", changed_at: "2026-09-22T00:00:00Z",
      changed_by_kind: "system", post_name_at: "学長", added: [], removed: ["master"], op: "delete" }]);
    assert.strictEqual(r[0].post, "学長", "★役職の 名が 出ません");
    assert.strictEqual(r[0].who, L.SYSTEM_WORD, "★仕組みを 人の ように 出して います");
    assert.ok(/外した master/.test(r[0].what), "★何を したかが 出ません");
    // ★★★「不明」と 書かない こと（★退会された 方かも しれません）。
    const r2 = L.rowsOf([{ id: "2", changed_by_kind: "user", changed_by: "x" }], () => "");
    assert.strictEqual(r2[0].who, L.NO_NAME_WORD, "★埋めて います");
    assert.ok(!/不明/.test(L.NO_NAME_WORD), "★『不明』と 書いて います");
  });

  見る("④ 書いた 註が 本当", () => {
    const 字 = L.NOTES.join("");
    assert.ok(/消せません/.test(字), "★消せない ことを 書いて いません");
    // ★★★`NEVER_PURGE` に 入って いる こと。
    const oa = readCode("lib", "opsAudit.js");
    assert.ok(/org_post_perm_log/.test(oa), "★消さない 一覧に ありません");
    const i = oa.indexOf("NEVER_PURGE");
    assert.ok(oa.slice(i, i + 400).includes("org_post_perm_log"), "★消さない 一覧の 中に ありません");
    // ★★掃除の 一覧に 入って いない こと。
    assert.ok(!/PURGEABLE[\s\S]{0,120}org_post_perm_log/.test(oa), "★消す 一覧に 入って います");
    // ★★「人に 役職を 渡した 記録は べつ」── ★別の 表が ある こと。
    assert.ok(/post_change_log/.test(readRaw("lib", "opsAudit.js"))
      || /post_change_log/.test(readRaw("lib", "backupTables.js")), "★別の 表が ありません");
  });

  見る("⑤ 1つも 無い ときに 白く しない", () => {
    assert.ok(/EMPTY_HEAD/.test(画) && /EMPTY_SUB/.test(画), "★空の ときの 字が ありません");
    // ★★「見せません」と 書かない こと（★在る／無いを 教えません）。
    assert.ok(!/見られません|権限|見せません/.test(L.EMPTY_HEAD + L.EMPTY_SUB),
      "★読めない ことを 教えて います");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
