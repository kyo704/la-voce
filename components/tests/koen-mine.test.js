#!/usr/bin/env node
// STRIP: A
// ============================================================================
// ★出演者の 側の 公演（★見本 `SC['公演']`・★2026-09-24）
//
//   ★★★この 一枚が 無い ために、★`KoenMySchedule` と `KoenDayFlow` は
//     ★出来て いながら、★どこからも 呼ばれて いません でした。
//   ★★見張る のは 4つ ──
//     ① 鍵が 閉じて いる ときに 1文字も 出さない
//     ② 決めを 画面で 作って いない
//     ③ `select('*')` を 書いて いない
//     ④ 書いた 註が 本当（★台帳の 側でも 確かめる）
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { readCode, readRaw, loadLib } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const L = await loadLib("lib", "koenArea.js");
  const 画 = readCode("components", "KoenMine.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  const mm = await loadLib("lib", "moreMenu.js");

  見る("較正 ── ★読めて いる", () => {
    assert.ok(画.includes("KoenMine"), "★画面が 読めて いません");
    assert.ok(Array.isArray(L.MINE_LINKS), "★束が 読めて いません");
  });

  見る("① 鍵が 閉じて いれば 1文字も 出さない", () => {
    // ★★★2026-09-24 ── ★判じは 束へ 移しました（★1つの 機能に 1か所）。
    //   ★★画面は `featureOn` を 呼びません。★束の `mayShowKoenMine` に 尋ねます。
    assert.ok(/mayShowKoenMine\(features\)/.test(画), "★鍵を 見て いません");
    assert.ok(!/featureOn\s*\(/.test(画), "★画面が 自分で 判じて います");
    // ★★束の 側で、★鍵を 見て いる こと。
    assert.strictEqual(L.mayShowKoenMine({ koen: true }), true, "★開いても 出ません");
    assert.strictEqual(L.mayShowKoenMine({ koen: false }), false, "★閉じても 出します");
    assert.strictEqual(L.mayShowKoenMine(null), false, "★読み込み中に 出します");
    assert.ok(/if \(!開\) return null;/.test(画), "★閉じても 出して います");
    // ★★行の ほうも 出しません（★裁定176 §3）。
    assert.strictEqual(mm.mayShowMoreRow("公演", { koenOn: false }), false, "★行が 出て います");
    assert.strictEqual(mm.mayShowMoreRow("公演", {}), false, "★分からない ときに 出して います");
    assert.strictEqual(mm.mayShowMoreRow("公演", { koenOn: true }), true, "★開いても 出ません");
    // ★★「近日公開」を 置いて いない こと。
    assert.ok(!/近日|まもなく|準備中/.test(画), "★期待を 作る 字が あります");
  });

  見る("② 決めを 画面で 作って いない", () => {
    ["MINE_LINKS", "MINE_NOTES", "MINE_HEAD", "MINE_EMPTY"].forEach((n) =>
      assert.ok(new RegExp(n).test(画), "★" + n + " を 借りて いません"));
    // ★★鍵の 名を 画面に 書いて いない こと。
    //   ★★★`from("koen")` は **表の 名** です。★鍵では ありません。
    //     ★2026-09-24 に 一度 まちがえました ── ★両方を 同じ 顔で 見て いました。
    //   ★★見るのは「鍵を 直に 書いて いないか」だけ です。
    // ★★★`from("koen")` は **表の 名** です。★鍵では ありません。
    //   ★2026-09-24 に 一度 まちがえました ── ★両方を 同じ 顔で 見て いました。
    assert.ok(!/KOEN_KEY/.test(画), "★鍵の 名を 画面が 持って います（★束に 任せます）");
  });

  見る("③ 列を 名指しして いる", () => {
    assert.ok(!/select\("\*"\)/.test(画), "★select('*') を 書いて います");
    assert.ok(/COLS_MINE/.test(画) && /COLS_KOEN_MINE/.test(画), "★列の 名を 借りて いません");
    assert.ok(!/体調|health|condition/.test(L.COLS_MINE + L.COLS_KOEN_MINE),
      "★読む 列に 体調が 混ざって います");
  });

  見る("④ 書いた 註が 本当（★台帳の 側）", () => {
    const 字 = L.MINE_NOTES.join("");
    ["ほかの方の 集合時刻は 見えません", "ご自分の 入りと 出番だけ",
      "体調は、どの 画面からも 見られません"].forEach((w) =>
        assert.ok(字.includes(w), "★" + w + " が ありません"));
    // ★★公演の 表に 体調の 列が 1つも 無い こと（★裁定141）。
    const 表 = readRaw("supabase", "migrations", "20260101000002_base_02_tables.sql");
    const i = 表.indexOf("create table if not exists public.koen_members");
    assert.ok(i > 0, "★較正 ── ★表が 読めて いません");
    const 本 = 表.slice(i, 表.indexOf("create table", i + 10));
    ["throat", "voice", "sleep", "condition", "health"].forEach((w) =>
      assert.ok(!new RegExp(w).test(本), "★" + w + " の 列が あります"));
  });

  見る("⑤ つながって いる", () => {
    assert.ok(/<KoenMine/.test(vt), "★画面が 呼ばれて いません");
    assert.ok(/moreSection === "公演"/.test(vt), "★入口が ありません");
    assert.ok(/koenOn: mayShowKoenMine\(features\)/.test(vt), "★鍵を 渡して いません");
    // ★★中の 2枚が、★この 一枚から 呼ばれて いる こと。
    assert.ok(/<KoenMySchedule/.test(画) && /<KoenDayFlow/.test(画),
      "★2枚を 呼んで いません");
    // ★★「まだ つないで いない」の 紙から 消えて いる こと。
    const 待 = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "not_wired_yet.json"), "utf8"));
    ["KoenDayFlow", "KoenMySchedule"].forEach((k) =>
      assert.ok(!(k in 待), "★" + k + " が まだ 待ちの 紙に あります"));
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
