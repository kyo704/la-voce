#!/usr/bin/env node
// ============================================================================
// ★合言葉を、★住所（URL）に 残さない
//
//   ★★★2026-09-20、★手元の 開発サーバの 記録に、★こう 残りました ──
//     `GET /login?email=…&password=…`
//   ★★★なぜ ──
//     ★`<form>` に `method` が 無いと、★HTML の 既定は **GET** です。
//     ★ふだんは `onSubmit` が 止めます（`preventDefault`）。
//     ★★★けれど、★画面の 仕掛けが まだ 動いて いない 間に 送られると、
//       ★★止める 人が いません。★browser が そのまま GET で 送ります。
//     ★★住所に 入った ものは ── ★見た 履歴・★配る 仕組みの 記録・
//       ★★次に 行く 先へ 渡る 印（Referer）に 残ります。
//
//   ★★直し ── ★`method="post"` を 付けます。★1語 です。
//     ★★万一 送られても、★住所には 何も 乗りません。
//
//   ★★較正 ── ★`method` の 無い 形で 当たり、★有る 形で 外れる こと。
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

// ★★合言葉を 打つ ところの ある 画面 を、★自分で 探します。★名を 覚えません。
function 合言葉の画面() {
  const 出 = [];
  const 歩く = (d) => {
    for (const n of fs.readdirSync(d)) {
      const p = path.join(d, n);
      const s = fs.statSync(p);
      if (s.isDirectory()) { 歩く(p); continue; }
      if (!/\.jsx?$/.test(n)) continue;
      const src = fs.readFileSync(p, "utf8");
      if (/type="password"/.test(src)) 出.push(path.relative(ROOT, p));
    }
  };
  歩く(path.join(ROOT, "app"));
  return 出;
}

見る("★合言葉の 画面が 見つかる（★道具が 動いて いる）", () => {
  const 画面 = 合言葉の画面();
  assert.ok(画面.length >= 1, "★1つも 見つかりません（★道具が 壊れて います）");
});

見る("★どの `form` にも `method=\"post\"` が ある", () => {
  合言葉の画面().forEach((rel) => {
    const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
    const 数 = (src.match(/<form\b/g) || []).length;
    const 印 = (src.match(/method="post"/g) || []).length;
    assert.ok(印 >= 数, `★${rel} …… form ${数}／method ${印}`);
  });
});

見る("★較正 ── ★無い 形で 当たり、★有る 形で 外れる", () => {
  const なし = '<form onSubmit={x}>';
  const あり = '<form method="post" onSubmit={x}>';
  const 見る式 = (s) => (s.match(/method="post"/g) || []).length
    >= (s.match(/<form\b/g) || []).length;
  assert.strictEqual(見る式(なし), false);
  assert.strictEqual(見る式(あり), true);
});

console.log("\n★" + 数 + "つ 通りました。");
