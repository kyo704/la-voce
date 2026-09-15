#!/usr/bin/env node

// ============================================================================
// ★退会の 約束
//
//   ★出どころ 見本 `SC['退会']`
//     「退会すると、記録・ノート・**レパートリー**・手に入れたものは、
//       全て 消えます。元には 戻せません。」
//     「退会を 隠しません。引き止めを **2回以上** 出しません（この画面の 1回だけ）。」
//     「「もったいない」と 書きません。理由を 聞きません。」
//   ★裁定 2026-09-15・坂本さん
//     「㋕ 追加。1枚目の一覧にレパートリーを明記」
//     「㋖ 追加。『手に入れたもの（台帳）』と 分かる 言い方に 変更」
//     「㋗ 現状維持（3枚のまま）。引き止めの語0件を確認済みのため、
//        構造上の問題ではないと判断」
//     「㋘ 追加。2行を 画面に 追加」
//
//   ★★㋘ が この見張りの 芯です。
//     ★★画面に「引き止めません」と 書いた 以上、★それは 約束 です。
//       ★★書いた あとで 破れる ほうが、★書かない より 悪い。
//     ★★だから 字が 在るかだけ では なく、
//       ★**引き止めの 語が 1件も ない こと** を 毎回 数えます。
//
//   ★★もう1つ ── ★消える 表と、★画面の 一覧が ずれて いないこと。
//     ★★2026-09-15 に 見つけた 欠けが これ です。
//       ★レパートリーは 消えるのに、★画面に 名前が ありません でした。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const NEED = [["lib", "accountDeletion.js"], ["components", "VocalTracker.jsx"]];
const missing = NEED.filter((p) => !fs.existsSync(path.join(__dirname, "..", "..", ...p)));
if (missing.length) {
  missing.forEach((p) => console.log("★★ありません: " + p.join("/")));
  console.log("　★数えません。★止まります。");
  process.exit(1);
}

const del = readCode("lib", "accountDeletion.js");
const ui = readCode("components", "VocalTracker.jsx");
const uiRaw = readRaw("components", "VocalTracker.jsx");

// ★★退会の 3枚だけを 切り出します。★ほかの 画面は 見ません。
//   ★★コメントを 外した 本文で 切ります。★私の 説明を 数えない ため。
//     ★★2026-09-15、★同じ 罠を 2度 踏みました
//       （★道具が 私の コメントを「実装」と 数えた）。
const from = ui.indexOf('activeTab === "deleteAccount1"');
const to = ui.indexOf('activeTab === "questionnaires"');
const screens = from >= 0 && to > from ? ui.slice(from, to) : "";

console.log("① 3枚を 切り出せたこと");
t(screens.length > 0, "deleteAccount1〜3 を 切り出せた");
t(ui.includes('activeTab === "deleteAccount2"'), "2枚目が ある");
t(ui.includes('activeTab === "deleteAccount3"'), "3枚目が ある");

console.log("\n② ★引き止めの 語が、★1件も ないこと（★㋘の 中身）");
// ★★画面に「引き止めません」と 書く 以上、★これは 約束 です。
//   ★★数えるのは 3枚の 中だけ です。
const NAGS = [
  ["もったいない", "見本が 名指しで 禁じて います"],
  ["本当に", "「本当に よろしいですか」の 形"],
  ["よろしい", "同上"],
  ["理由", "見本 ──「理由を 聞きません」"],
  ["残念", "去る人を 責める 言い方"],
  ["惜しい", "同上"],
  ["考え直", "思いとどまらせる 言い方"]
];
NAGS.forEach(([w, why]) => {
  const n = (screens.match(new RegExp(w, "g")) || []).length;
  t(n === 0, "「" + w + "」が 0件（いま " + n + "）── " + why);
});

console.log("\n③ 約束の 2行が、★画面に 出ていること（★㋘）");
t(/export const NO_RETENTION_NOTE/.test(del), "NO_RETENTION_NOTE が lib に ある");
t(del.includes("退会を 隠しません。引き止めを 2回以上 出しません（この画面の 1回だけ）。"), "見本の 1行目");
t(del.includes("「もったいない」と 書きません。理由を 聞きません。"), "見本の 2行目");
t(/NO_RETENTION_NOTE\.map\(/.test(screens), "画面が それを 描いている");
t(/NO_RETENTION_BOLD/.test(screens), "見本の 太字を 使っている");
// ★★1枚目に だけ 置きます ──「この画面の 1回だけ」と 書いて いるからです。
const s1 = ui.indexOf('activeTab === "deleteAccount1"');
const s2 = ui.indexOf('activeTab === "deleteAccount2"');
const noteAt = ui.indexOf("NO_RETENTION_NOTE.map(");
t(noteAt > s1 && noteAt < s2, "1枚目に ある（★2枚目・3枚目では ない）");
t(!screens.includes("退会を 隠しません。引き止めを"), "画面側に 直書きしていない");

console.log("\n④ 失われるものの 一覧（★㋕㋖）");
t(/export const LOST_ON_DELETE/.test(del), "LOST_ON_DELETE が lib に ある");
t(/LOST_ON_DELETE\.map\(/.test(screens), "画面が それを 描いている");
// ★★㋕ ── 見本が 名指しして います。
t(/label:\s*"レパートリー/.test(del), "レパートリーが 一覧に ある");
// ★★㋖ ── 台帳も 消えると 読めること。
t(/label:[^"]*"[^"]*台帳[^"]*"/.test(del), "「台帳」と 読める 行が ある");
t(!screens.includes("・稽古ノート・目標・羊のおうちの持ち物"), "古い 4行の 一覧が 残っていない");

console.log("\n⑤ ★消える 表と、★一覧が ずれて いないこと");
// ★★これが 2026-09-15 の 欠けの 形 です。
//   ★★表は 消すのに、★画面に 名前が 無い ── ★黙って 消す ことに なります。
//   ★★表が 増えた とき、★ここが 落ちて 気づかせます。
const COVER = [
  { tables: ["entries"], word: "日々の記録" },
  { tables: ["questionnaire_responses"], word: "質問票" },
  { tables: ["repertoire_tessitura", "role_master", "project_master"], word: "レパートリー" },
  { tables: ["notes", "article_notes"], word: "ノート" },
  { tables: ["item_acquisitions", "character_inventory"], word: "台帳" }
];
COVER.forEach((c) => {
  const inList = c.tables.filter((tb) => new RegExp('"' + tb + '"').test(del));
  t(inList.length > 0, c.tables[0] + " ほか が 消す 一覧に ある");
  t(del.includes(c.word), "その 行が 画面の 一覧に ある（「" + c.word + "」）");
});

console.log("\n⑥ 見本より 多いところが、★消えて いないこと（★㋐㋑㋒㋓㋔）");
t(/GRACE_PERIOD_DAYS/.test(screens) || /deleteGraceNote/.test(screens), "㋐ 30日の 猶予が ある");
t(/deleteNowInstead/.test(screens), "㋐ 今すぐ 消す 道も ある");
t(/deletePasswordPrompt/.test(screens), "㋑ パスワードの 再確認が ある");
t(/blockedOrgs/.test(screens), "㋒ 教室に 他の方が いる ときの 順番");
t(/payerOrgs/.test(screens), "㋓ 契約者が 居なくなる 知らせ");
t(/すぐに切れて、戻らないもの/.test(screens), "㋔ 指導者だけに 出る 3区分");

console.log("\n⑦ 同居問題の 第1段（★㋙）");
// ★★門の **外**の 38名の 画面が 変わって いないこと。
//   ★★`inMore()` は layoutV2 でなければ undefined を返します。
//     ★★だから この 枠は 門の 外では いつも 出ます。★唯一の 入口 です。
t(/if \(!layoutV2\) return undefined;/.test(ui), "inMore() は 門の 外では いつも 出す");
// ★★ログアウトは 木から 外して いません。★display で 隠すだけ です。
t(/display: layoutV2 \? "none" : undefined/.test(ui), "ログアウトを 木から 外して いない");
t(/<LogOut size=\{16\} \/>ログアウト/.test(uiRaw), "門の 外の ログアウトが 残って いる");
// ★★引っ越し先が 実際に 押せること。
t(/ACCOUNT_ROWS/.test(ui), "アカウントの シートが ある");
t(/label === "ログアウト"\) return \{ label, onClick: handleSignOut \}/.test(ui),
  "シートの ログアウトが 押せる");
t(/layoutV2 \? "じぶんの記録" : "アカウント"/.test(ui), "門の 中では 題が「じぶんの記録」");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
