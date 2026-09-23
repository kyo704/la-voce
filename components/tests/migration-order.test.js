#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★紙の 並びで、★そのまま 建て直せる
//
//   ★出どころ 2026-09-23 ──
//     ★`opus_61` と `opus_62` の 紙が、★番号 ちがいで **2枚ずつ** ありました。
//       ★★直した 59 を 当て直した とき、★新しい 番号で もう 1枚 書かれた ためです。
//     ★★★悪い のは 重なった ことだけ では ありません ──
//       ★`470007`（61）が `480001`（59）より **前** に 並んで いました。
//       ★★61 は `jury_slots` を 読みます。★59 が それを 作ります。
//       ★★★並びの まま 流すと、★61 が 先に 走って 落ちます。
//     ★★FX7 で 分かった とおり、★**自分の 歴史から 建て直せない 台帳**は、
//       ★試しの 場を 作れません。★並びは 飾りでは ありません。
//
//   ★★見る こと
//     ① 同じ 名の 紙が 2枚 無い
//     ② 表を 作る 紙は 1枚 だけ
//        ★★ただし `base_*`（FX7 で 本番から 書き出した 土台）は 別 です。
//          ★土台は **いまの 本番の 姿** を そのまま 写した もの なので、
//          ★★あとから 来た 紙が 作る 表も、★もう そこに 載って います。
//          ★★★その 重なりは 誤りでは ありません ── ★`if not exists` で ありさえ すれば。
//     ③ その 表を 使う 紙は、★作る 紙より **後ろ** に 並ぶ
//
//   ★★数を 覚えません。★毎回 紙を 読み直して 数えます。
// ============================================================================
const fs = require("fs");
const path = require("path");

const 置場 = path.join(__dirname, "..", "..", "supabase", "migrations");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

const 紙 = fs.readdirSync(置場).filter((f) => f.endsWith(".sql")).sort();

console.log("① 同じ 名の 紙が 2枚 無い");
const 名 = {};
紙.forEach((f) => {
  const n = f.replace(/^\d+_/, "");
  (名[n] = 名[n] || []).push(f);
});
const 重 = Object.keys(名).filter((n) => 名[n].length > 1);
t(紙.length > 0, "★紙が ある（" + 紙.length + "枚）");
t(重.length === 0, "★重なった 名が 無い" + (重.length ? "（" + 重.map((n) => 名[n].join("／")).join(" ／ ") + "）" : ""));

// ★★註と 字の 中を 落とします（★STRIP: A）
function 実(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, " ")
          .replace(/^\s*--.*$/gm, " ")
          .replace(/'(?:[^']|'')*'/g, "''")
          .replace(/\$\$[\s\S]*?\$\$/g, function (m) { return m; });  // ★中身は 残す（★関数の 本文に 表が 出ます）
}

console.log("\n② 表を 作る 紙は 1枚 だけ／③ 使う 紙は 後ろ");
const 中 = {};
紙.forEach((f) => { 中[f] = 実(fs.readFileSync(path.join(置場, f), "utf8")); });

// ★★土台（FX7 の 書き出し）か どうか
const 土台 = (f) => /_base_\d+_/.test(f);

const 作 = {};      // ★表 → ★作る 紙
const 無ければ = {}; // ★表＋紙 → ★`if not exists` が 付いて いるか
紙.forEach((f) => {
  const re = /create\s+table\s+(if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?/gi;
  let m;
  while ((m = re.exec(中[f]))) {
    const T = m[2].toLowerCase();
    (作[T] = 作[T] || []).push(f);
    無ければ[T + "|" + f] = !!m[1];
  }
});
const 表 = Object.keys(作).sort();
t(表.length > 0, "★表を 作る 紙が ある（" + 表.length + "表）");

let 重表 = 0, 危 = 0;
表.forEach((T) => {
  const 枚 = Array.from(new Set(作[T]));
  const 後 = 枚.filter((f) => !土台(f));
  if (後.length > 1) {
    t(false, "★" + T + " を 作る 紙が（土台の ほかに）" + 後.length + "枚（" + 後.join("／") + "）");
    重表++;
  }
  // ★★土台と 重なる とき ── ★`if not exists` が 要ります
  if (枚.length > 1 && 枚.some(土台)) {
    後.forEach((f) => {
      if (!無ければ[T + "|" + f]) {
        t(false, "★" + f + " の " + T + " に `if not exists` が ない（★土台と 重なります）");
        危++;
      }
    });
  }
});
t(重表 === 0, "★土台の ほかに 同じ 表を 作る 紙が 無い（" + 重表 + "表）");
t(危 === 0, "★土台と 重なる 表は すべて `if not exists`（" + 危 + "件）");

let 逆 = 0;
表.forEach((T) => {
  const 初 = 作[T].slice().sort()[0];
  const 使 = new RegExp("(?:from|join|update|into|references|alter\\s+table|on)\\s+(?:only\\s+)?public\\." + T + "\\b", "i");
  紙.forEach((f) => {
    if (f >= 初) return;
    if (使.test(中[f])) {
      t(false, "★" + f + " は " + T + " を 使うのに、★作る " + 初 + " より 前");
      逆++;
    }
  });
});
t(逆 === 0, "★作る より 前に 使う 紙が 無い（" + 逆 + "件）");

console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
process.exit(落ち === 0 ? 0 : 1);
