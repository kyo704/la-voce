#!/usr/bin/env node
// STRIP: A（振る舞い）── ★出どころが 1つ か を 見ます。
// ============================================================================
// ★★★ページの 節の 出どころは **台帳の 関数 だけ**（★2026-09-26・裁定207）
//
//   ★きょうまで この 紙は、★手で 書いた 一覧（`KINDS_BY_FIELD`）が
//     ★増えて いない ことを 見て いました。
//   ★★★その 一覧 そのものを 消した ので、★見る ものを 変えました ──
//     ★「一覧が どこにも 無い こと」を 見ます。★前より 強い 決まり です。
//
//   ★★★なぜ こうした か（★Opus の お指し・2026-09-26）──
//     ★台帳は 16種、★見本は music 9／voice 11／stage 11。
//     ★★手書きは music 9／voice 7／stage 8 で、★節の 名も 古い まま でした。
//     ★★★2か所に 書いた から ずれました。★だから 1か所に しました。
//
//   ★★較正 ── ★手書きの 一覧を 戻すと 落ちる こと。
// ============================================================================
const fs = require("fs");
const path = require("path");
const { stripComments, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let 済 = 0, 悪 = [];
const よし = (b, m) => { 済 += 1; if (!b) 悪.push(m); };

// ── ★① 手で 書いた 一覧が どこにも 無い ──────────────────────
const 禁 = ["KINDS_BY_FIELD", "ENTRY_KINDS", "enabledKinds", "kindsOfField"];
const 紙 = [];
(function 歩く(d) {
  fs.readdirSync(d).forEach((n) => {
    const f = path.join(d, n);
    if (fs.statSync(f).isDirectory()) {
      if (n === "tests" || n === "node_modules") return;
      return 歩く(f);
    }
    if (/\.jsx?$/.test(n)) 紙.push(f);
  });
})(path.join(ROOT, "lib"));
(function 歩く2(d) {
  fs.readdirSync(d).forEach((n) => {
    const f = path.join(d, n);
    if (fs.statSync(f).isDirectory()) return;
    if (/\.jsx?$/.test(n)) 紙.push(f);
  });
})(path.join(ROOT, "components"));

禁.forEach((名) => {
  const 出 = 紙.filter((f) => {
    const s = stripComments(fs.readFileSync(f, "utf-8"));
    return new RegExp(`(export\\s+(const|function)\\s+${名}\\b|\\b${名}\\s*[=(])`).test(s);
  }).map((f) => path.relative(ROOT, f));
  よし(出.length === 0, `★${名} が まだ あります …… ${出.join("／")}`);
});

// ── ★② 出どころの 紙に 節の 名が 1つも 無い ──────────────────
const pf = stripComments(readRaw("lib", "pageFields.js"));
["education", "teacher", "award", "performance", "repertoire", "recording",
  "role", "skill", "physical", "management", "press"].forEach((k) => {
  よし(!new RegExp(`["']${k}["']`).test(pf), `★lib/pageFields.js に ${k} が 書いて あります`);
});
よし(!/学んだところ|師事した方|レパートリー|役の はば/.test(pf),
  "★lib/pageFields.js に 札の 字が 書いて あります");

// ── ★③ 倒れ先の 一覧を 作って いない ──────────────────────────
よし(/export const NOT_YET = Object\.freeze\(\[\]\)/.test(pf),
  "★まだ の とき の 一覧が 空で ありません（★倒れ先を 作らない）");

// ── ★④ 台帳の 関数の 名は 1か所 だけ ─────────────────────────
const 呼 = 紙.filter((f) => /my_page_fields/.test(stripComments(fs.readFileSync(f, "utf-8"))))
  .map((f) => path.relative(ROOT, f));
よし(呼.length <= 2, `★関数の 名を 書いて いる 紙が 多すぎます …… ${呼.join("／")}`);
よし(/export const RPC = "my_page_fields"/.test(pf), "★関数の 名は `lib/pageFields.js` が 持つ");

// ── ★⑤ 台帳の 側の 数（★覚えず、★SQL から 数え直す）────────────
const sql = fs.readFileSync(
  path.join(ROOT, "supabase", "opus", "20260925_96_portfolio_fields.sql"), "utf-8");
よし(/create or replace function public\.my_page_fields/.test(sql), "★SQL が その 関数を 作る");
// ★★★数を 覚えません。★`values (…)` の 12行を 読んで、★札の 式を **その場で 解き**ます。
//   ★★式は 2つの 形 だけ です ── ★`'字'` と
//     ★`case f when 'x' then A [when 'y' then B] else C end`（★A/B/C は 字 か null）。
//   ★★これで お仕事ごとの 数が 出ます。★台帳の 関数と 同じ 判じ です。
const 行群 = [...sql.matchAll(/\(\s*'([a-z_]+)'\s*,([\s\S]*?),\s*'[^']*'\s*,\s*(\d+)\)/g)];
function 札(式, f) {
  const t = 式.trim();
  const 直 = /^'([^']*)'$/.exec(t);
  if (直) return 直[1];
  if (/^null$/i.test(t)) return null;
  const c = /^case\s+f\s+([\s\S]*?)\s+else\s+([\s\S]*?)\s+end$/i.exec(t);
  if (!c) return undefined;
  for (const w of c[1].matchAll(/when\s+'([a-z]+)'\s+then\s+('[^']*'|null)/gi)) {
    if (w[1] === f) return /^null$/i.test(w[2]) ? null : w[2].slice(1, -1);
  }
  return /^null$/i.test(c[2].trim()) ? null : c[2].trim().slice(1, -1);
}
よし(行群.length === 12, `★節は 12 行 書いて ある（いま ${行群.length}）`);
const 数 = (f) => 行群.filter((m) => 札(m[2], f) !== null && 札(m[2], f) !== undefined).length;
// ★★式を 解けなかった 行が 無い こと（★解けないと 数が 嘘に なります）。
const 解けず = 行群.filter((m) => 札(m[2], "music") === undefined).map((m) => m[1]);
よし(解けず.length === 0, `★式を 解けない 行が あります …… ${解けず.join("／")}`);
よし(数("music") === 9, `★music は 9（いま ${数("music")}）`);
よし(数("voice") === 11, `★voice は 11（いま ${数("voice")}）`);
よし(数("stage") === 11, `★stage は 11（いま ${数("stage")}）`);

// ── ★⑥ 呼ぶ 側が 渡して いる ────────────────────────────────
const pv = stripComments(readRaw("components", "PortfolioV2.jsx"));
よし(/fields = \[\]/.test(pv), "★`PortfolioV2` が `fields` を 受ける");
よし(/\(Array\.isArray\(fields\) \? fields : \[\]\)\.map/.test(pv),
  "★渡されなければ 1つも 並べない");
const nk = stripComments(readRaw("lib", "naniwoKaku.js"));
よし(/export function rowsOf\(fields, entries\)/.test(nk), "★`なにを書く` も 渡されて 並べる");

console.log(`\n★${済} 件 見ました ／ ★落ち ${悪.length} 件`);
悪.forEach((m) => console.log("  ✗ " + m));
if (悪.length) process.exit(1);
