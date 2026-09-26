#!/usr/bin/env node
// STRIP: A（振る舞い）── ★門の 開け閉めを 見ます。
/**
 * ★さがす の 門の 見張り（★2026-09-21・坂本さんの お決め）。
 *
 *   ★★★9画面の うち 1枚 しか ありません。★全員に 出しません。
 *     ★★既定は **閉** です。★名簿が 空なら、★誰にも 出ません。
 *
 *   ★★較正 ── ★名簿に 居る 方で 開き、★居ない 方・空の 名簿で 閉じる こと。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, readRaw, libUrl } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "matchingGate.js"), "utf-8");
  // ★★`@/` を 解けないので、★読み込みの 道だけを 本物の 中身に すり替えます。
  // ★★すり替えは `_source.js` の `libUrl` に 寄せました（★2026-09-26）。
  const b64 = (...q) => libUrl(q[q.length - 1]);
  const 解 = src.replace('"@/lib/workField"', JSON.stringify(b64("lib", "workField.js")));
  const m = await import("data:text/javascript;base64," + Buffer.from(解, "utf-8").toString("base64"));
  const 名 = m.MATCHING_ENV;
  const 私 = "99b695d8-ae90-43a5-9767-a8d073a4003d";
  const よそ = "11111111-1111-4111-8111-111111111111";

  console.log("=== 一 ★既定は 閉（★較正の 外し） ===");
  t(m.mayUseMatching(私, {}) === false, "★環境が 空なら 閉じる");
  t(m.mayUseMatching(私, { [名]: "" }) === false, "★名簿が 空なら 閉じる");
  t(m.mayUseMatching(私, { [名]: よそ }) === false, "★名簿に 居なければ 閉じる");
  t(m.mayUseMatching(null, { [名]: 私 }) === false, "★誰か 分からなければ 閉じる");

  console.log("=== 二 ★名簿の 方だけ 開く（★較正の 当たり） ===");
  t(m.mayUseMatching(私, { [名]: 私 }) === true, "★名簿に 居れば 開く");
  t(m.mayUseMatching(私, { [名]: `${よそ}, ${私}` }) === true, "★並べた 中に 居れば 開く");
  t(m.mayUseMatching(私, { [名]: ` ${私} ` }) === true, "★前後の 空白を 落とす");

  console.log("=== 二の二 ★お仕事が 音楽で ない 方には 出さない（★裁定202） ===");
  // ★★見本『お仕事を選ぶ』の 約束 ──「声の お仕事・舞台を えらぶと、「さがす」は 出ません。」
  t(m.mayUseMatching(私, { [名]: 私 }, "music") === true, "★音楽 なら 開く");
  t(m.mayUseMatching(私, { [名]: 私 }, "voice") === false, "★声の お仕事 なら 閉じる");
  t(m.mayUseMatching(私, { [名]: 私 }, "stage") === false, "★舞台 なら 閉じる");
  // ★★列が まだ 無い とき（null／undefined）は 音楽に 倒します ── ★いまの 見え方の まま。
  t(m.mayUseMatching(私, { [名]: 私 }, null) === true, "★まだ 選んで いない 方は そのまま");
  t(m.mayUseMatching(私, { [名]: 私 }, undefined) === true, "★列が 無い ときも そのまま");
  // ★★名簿に 居なければ、★音楽 でも 開きません（★2つ とも 要る こと）。
  t(m.mayUseMatching(よそ, { [名]: 私 }, "music") === false, "★名簿が 先に 効く");
  // ★★決めを 2か所に 書いて いない こと。
  t(/isMusic\(field\)/.test(src), "★`workField` の `isMusic` を 呼んで いる");
  t(!/field\s*===\s*["']music["']/.test(stripComments(src)),
    "★ここに `field === \"music\"` と 書いて いない");
  // ★★台帳の 側にも 同じ 2つが 書いて ある こと（★sql/90）。
  const sql90 = fs.readFileSync(
    path.join(ROOT, "supabase", "opus", "20260925_90_profile_field.sql"), "utf-8");
  t(/can_see_sagasu/.test(sql90) && /'music'/.test(sql90), "★台帳の 側も 音楽だけ");
  t(/enrollments/.test(sql90), "★台帳の 側は 名簿（教室）も 見て いる");

  console.log("=== 三 ★門を 通さずに 出して いない ===");
  const vt = stripComments(readRaw("components", "VocalTracker.jsx"));
  t(/mayUseMatching\(userId/.test(vt), "★画面が 門を 呼んで いる");
  t(/matchingOn && moreSection === "さがす"/.test(vt), "★門を 通ってから 出して いる");
  t(/mayMatch: matchingOn/.test(vt), "★もっと の 行にも 門が かかって いる");
  // ★★門を 通さない 出し方が 無い こと。
  const 出 = (vt.match(/<MatchingSearch/g) || []).length;
  t(出 === 1, `★出す ところは 1か所 だけ（いま ${出}）`);

  console.log("=== 四 ★もっと の 行（★裁定 その94 §4d） ===");
  const more = stripComments(fs.readFileSync(path.join(ROOT, "lib", "moreMenu.js"), "utf-8"));
  t(/key: "さがす"/.test(more), "★もっと に 行が ある");
  t(/if \(key === "さがす"\) return !!opt\.mayMatch;/.test(more),
    "★門を 通らない 方には 出さない");
  // ★★ノートの 下でも、★5つ目の タブ でも ない こと。
  const tabs = stripComments(readRaw("components", "VocalTracker.jsx"));
  t(!/activeTab === "さがす"/.test(tabs), "★5つの タブを 増やして いない");

  console.log("=== 五 ★9画面が 揃ったら 消す、と 書いて ある ===");
  t(/9画面が 揃った/.test(src), "★外す 条件が 紙に ある");
  t(/9画面が 揃ったら/.test(fs.readFileSync(path.join(ROOT, "lib", "moreMenu.js"), "utf-8")),
    "★もっと の 側にも 書いて ある");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
