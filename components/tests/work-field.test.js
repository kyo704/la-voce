#!/usr/bin/env node
// STRIP: B（言葉）── ★約束の 文を 見ます。★何も 落としません。
/**
 * ★お仕事を選ぶ の 見張り（★2026-09-25・裁定202）。
 *
 *   ★★★見る もの ──
 *     ①★3つの 字が 見本の まま か
 *     ②★下の 5行（★約束）が 1文字も 変わって いない か
 *     ③★台帳の CHECK の 3つと、★画面の 3つが 同じ か
 *     ④★`occupation`（★11種）に 手を 出して いない か
 *     ⑤★記録（`entries`／`notes`）を 1度も 触って いない か
 *     ⑥★「さがす」の 出し分けが 本当に 効いて いる か（★約束の 3行目）
 *
 *   ★★較正 ── ★5行の どれか を 消したら 落ちる こと を 確かめます。
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
  const libRaw = readRaw("lib", "workField.js");
  const jsx = readRaw("components", "WorkField.jsx");
  const jsxCode = stripComments(jsx);
  const m = await import(libUrl("workField"));

  console.log("=== 一 ★3つ（★見本の 並び そのまま） ===");
  t(m.FIELDS.length === 3, `★3つ だけ（いま ${m.FIELDS.length}）`);
  const 見本 = [
    ["music", "音楽（歌・楽器）", "曲目・レパートリー・演奏会"],
    ["voice", "声の お仕事", "声優・ナレーター・アナウンサー"],
    ["stage", "舞台", "演目・公演"]
  ];
  見本.forEach((x, i) => {
    const f = m.FIELDS[i] || {};
    t(f.key === x[0] && f.name === x[1] && f.sub === x[2], `★${i + 1}つ目 …… ${x[1]}`);
  });
  t(m.TITLE === "どんな お仕事ですか", "★題は 見本の まま");
  t(m.TOAST === "ことばを 変えました", "★選び直した ときの 一言");

  console.log("=== 二 ★下の 5行（★約束。★消さないこと） ===");
  const 約束 = [
    "書いた 記録は、ひとつも 変わりません。",
    "ことばの 見え方だけが 変わります。",
    "声の お仕事・舞台を えらぶと、「さがす」は 出ません。",
    "伴奏の 相手を さがす ことが ないからです。",
    "あとで 音楽に 戻せば、また 出ます。"
  ];
  t(m.NOTE_LINES.length === 5, `★5行（いま ${m.NOTE_LINES.length}）`);
  約束.forEach((l) => t(m.NOTE_LINES.includes(l), `★「${l}」`));
  // ★★較正 ── ★どれか を 消したら、★この 上の どれか が 落ちます。
  t(m.LEAD_LINES.includes("あとから いつでも 変えられます。書いたものは 消えません。"),
    "★題の 下の 約束（★書いたものは 消えません）");

  console.log("=== 三 ★台帳の CHECK と 同じ 3つ（★sql/90） ===");
  const sql = fs.readFileSync(
    path.join(ROOT, "supabase", "opus", "20260925_90_profile_field.sql"), "utf-8");
  const chk = sql.match(/check\s*\(\s*field\s+in\s*\(([^)]*)\)/i);
  t(!!chk, "★CHECK が 書いて ある");
  if (chk) {
    // ★★数を 覚えません。★台帳の 側から 数え直します。
    const 台 = chk[1].split(",").map((s) => s.trim().replace(/^'|'$/g, "")).sort();
    const 画 = m.FIELDS.map((f) => f.key).sort();
    t(JSON.stringify(台) === JSON.stringify(画),
      `★3つが 同じ（台帳 ${台.join("/")} ／ 画面 ${画.join("/")}）`);
  }
  t(m.DEFAULT_FIELD === "music" && /default\s+'music'/i.test(sql),
    "★既定は どちらも music（★裁定119）");
  t(m.normalize(null) === "music" && m.normalize("nope") === "music",
    "★分からない ときは music に 倒す");

  console.log("=== 四 ★occupation（★11種）に 手を 出して いない（★裁定202） ===");
  t(!/occupation\s*[:=]/.test(stripComments(libRaw)), "★字の 側で 触って いない");
  t(!/occupation/.test(jsxCode), "★画面の 側で 触って いない");
  t(!/occupation/i.test(sql.replace(/^--.*$/gm, "")), "★台帳の 側でも 触って いない");

  console.log("=== 五 ★記録を 1度も 触らない（★約束の 1行目） ===");
  ["entries", "notes", "questionnaire_responses"].forEach((tb) => {
    t(!new RegExp(`from\\(["']${tb}["']\\)`).test(jsxCode), `★${tb} を 引いて いない`);
  });
  // ★★送るのは `field` 1つ だけ。
  const p = m.patchOf("voice");
  t(Object.keys(p).length === 1 && p.field === "voice", "★送るのは field 1つ だけ");
  t(m.patchOf("nope").field === "music", "★おかしな 字は 送らない");
  t(m.COLS === "id, field", "★読むのは 2列 だけ（★`select('*')` を 書かない）");

  console.log("=== 六 ★「さがす」は ほんとうに 出なくなる（★約束の 3行目） ===");
  const gate = fs.readFileSync(path.join(ROOT, "lib", "matchingGate.js"), "utf-8");
  // ★★すり替えは `_source.js` の `libUrl` に 寄せました（★2026-09-26）。
  const b64 = (...q) => libUrl(q[q.length - 1]);
  const G = await import("data:text/javascript;base64," + Buffer.from(
    gate.replace('"@/lib/workField"', JSON.stringify(b64("lib", "workField.js"))),
    "utf-8").toString("base64"));
  const 私 = "99b695d8-ae90-43a5-9767-a8d073a4003d";
  const 名 = G.MATCHING_ENV;
  t(G.mayUseMatching(私, { [名]: 私 }, "music") === true, "★音楽 なら 出る");
  t(G.mayUseMatching(私, { [名]: 私 }, "voice") === false, "★声の お仕事 なら 出ない");
  t(G.mayUseMatching(私, { [名]: 私 }, "stage") === false, "★舞台 なら 出ない");
  // ★★「あとで 音楽に 戻せば、また 出ます」── ★戻せる こと。
  t(G.mayUseMatching(私, { [名]: 私 }, "music") === true, "★音楽に 戻せば また 出る");
  t(/isMusic/.test(gate), "★門が `isMusic` を 見て いる");

  console.log("=== 七 ★字を 画面に 書き写して いない ===");
  約束.forEach((l) => t(!jsx.includes(l), `★画面に 直書きして いない …… ${l.slice(0, 12)}…`));
  t(/from "@\/lib\/workField"/.test(jsx), "★字は lib から 受け取って いる");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail) process.exit(1);
}
main();
