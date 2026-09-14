#!/usr/bin/env node

// ============================================================================
// ★消した 曲が、★読み直しても 戻らない こと
//
//   ★出どころ 2026-09-13、★実機の ご報告 ──
//     「レパートリーを 消すと 画面から 消えるが、★読み直すと 戻る」。
//
//   ★★調べて 分かった こと
//     ★① 消す こと 自体は 効いて いた。
//       ★repertoire_tessitura／role_master／project_master は **行を 消す**。
//       ★ノートだけ **deleted_at を 入れる**（★行は 残る）。
//     ★② 一覧を 作る ところで、★その deleted_at を 見て いなかった。
//       ★★7行 下では 見て いた。★同じ 画面の 中で 片方だけ。
//     ★③ 消した 直後は 手もとの 並びから 抜くので 消えて 見える。
//       ★★読み直すと、★消えた 行を 拾って 戻る。
//
//   ★★この 見張りは、★一覧を 作る どの 枝も deleted_at を 見て いるかを 見ます。
// ============================================================================

const { readCode } = require("./_source");

let ok = 0;
let ng = 0;
const t = (c, l) => { if (c) { console.log("  ✓ " + l); ok++; } else { console.log("  ✗ " + l); ng++; } };

const vt = readCode("components", "VocalTracker.jsx");

console.log("① 曲の 一覧を 作る ところ");
// ★★`kind === "repertoire"` で ノートを 拾う 枝を、★1つずつ 見ます。
const lines = vt.split("\n");
const picks = [];
lines.forEach((l, i) => {
  if (!/myNotes\s*\n?/.test(l) && !/myNotes\./.test(l)) return;
  if (!/kind === "repertoire"/.test(l)) return;
  picks.push({ n: i + 1, text: l.trim() });
});
t(picks.length > 0, "★曲を 拾う 枝が " + picks.length + " 本 見つかる");

const bad = picks.filter((p) => !/deleted_at/.test(p.text));
bad.forEach((p) => console.log("    ✗ " + p.n + ": " + p.text.slice(0, 76)));
t(bad.length === 0, "★どの 枝も deleted_at を 見て いる");

console.log("\n② 消す ほうは 台帳に 書いて いる こと");
t(/from\("repertoire_tessitura"\)\s*\n?\s*\.delete\(\)/.test(vt)
  || /from\("repertoire_tessitura"\)\.delete\(\)/.test(vt),
  "★repertoire_tessitura の 行を 消して いる");
t(/from\("role_master"\)\.delete\(\)/.test(vt), "★role_master も 消して いる");
t(/from\("project_master"\)\.delete\(\)/.test(vt), "★project_master も 消して いる");
t(/handleDeleteNote\(noteId\)/.test(vt), "★ノートも 消して いる");

console.log("\n★★この 見張りが 見て いない こと");
console.log("　★字の 並びだけ を 見ます。★実際に 消えるかは 見て いません。");
console.log("　★消し方が 2つ ある こと（★行を 消す ／ deleted_at）は 直して いません。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
