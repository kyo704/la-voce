#!/usr/bin/env node
/**
 * 記録画面が書くものと、分析が読むものが、いまも一致しているかを一覧にする。
 *
 * ★このセッションで3件続けて出た不具合が、いずれも同じ形をしていたので作った。
 *     voice_quality  小数を整数の列へ送っていた（型のずれ）
 *     wake_note      場面が「起き抜け」の記録からしか拾っていなかった（条件のずれ）
 *     響きスコア/声の出来  同じ数字が2つの名前で呼ばれていた（名前のずれ）
 *
 *   ★これは検査ではなく棚卸しです。落ちません。
 *     判断の材料を出すだけで、良し悪しは人が決めます。
 *
 * 使い方: node scripts/entry-field-audit.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");

// ★lib/ も見る。VocalTracker.jsx だけを見ていたせいで、
//   lib/vocalDose.js が speakingLevel を読んでいることを見落とした。
//   「どこからも読まれていない」と報告する前に、読む場所を全部見ること。
const LIB_DIR = path.join(ROOT, "lib");
const libFiles = fs.readdirSync(LIB_DIR)
  .filter((f) => f.endsWith(".js") && f !== "translations.js")
  .map((f) => ({ name: `lib/${f}`, text: fs.readFileSync(path.join(LIB_DIR, f), "utf-8") }));
const otherComponents = ["CharacterHome.jsx", "HealthInfo.jsx"]
  .filter((f) => fs.existsSync(path.join(ROOT, "components", f)))
  .map((f) => ({ name: `components/${f}`, text: fs.readFileSync(path.join(ROOT, "components", f), "utf-8") }));
const EXTRA = libFiles.concat(otherComponents);

// entryToRow / rowToEntry / migrate* の中は「入出力の配線」であって、読み書きではない。
// 数えるときはそこを除く（除かないと、全項目が「使われている」ことになってしまう）。
function spanOf(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) return null;
  let i = src.indexOf("{", src.indexOf(")", start));
  let depth = 0;
  for (; i < src.length; i += 1) {
    if (src[i] === "{") depth += 1;
    else if (src[i] === "}") { depth -= 1; if (depth === 0) return [start, i + 1]; }
  }
  return null;
}
const PLUMBING = ["entryToRow", "rowToEntry", "migrateLegacyToActivities",
  "migrateLegacyToVoiceEntries", "deriveLegacyVoiceFieldsFromEntries",
  "deriveVoiceEntryRepresentatives", "derivePrimaryActivityLegacy"];
const spans = PLUMBING.map(spanOf).filter(Boolean).sort((a, b) => b[0] - a[0]);
let analysis = src;
spans.forEach(([a, b]) => { analysis = analysis.slice(0, a) + analysis.slice(b); });

const FIELDS = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"))
  .filter((f) => f !== "date");

function count(hay, re) { return (hay.match(re) || []).length; }

const rows = FIELDS.map((f) => {
  const esc = f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // 記録画面が触っているか: setFormData / onChange / value= で名前が出るか
  const writes =
    count(src, new RegExp(`setFormData\\([^)]*${esc}`, "g")) +
    count(src, new RegExp(`onChange=\\{[^}]*${esc}`, "g")) +
    count(src, new RegExp(`\\b${esc}:\\s*(v|val|value|e\\.target)`, "g")) +
    count(src, new RegExp(`formData\\.${esc}\\b`, "g"));
  // 分析が読んでいるか（配線を除いた本文で）
  const reads =
    count(analysis, new RegExp(`\\be\\.${esc}\\b`, "g")) +
    count(analysis, new RegExp(`\\bentry\\.${esc}\\b`, "g")) +
    count(analysis, new RegExp(`["']${esc}["']`, "g"));
  // どの lib/ ファイルが読んでいるか。名前まで出す（「どこか」では追えないため）
  const libReaders = EXTRA.filter((m) =>
    new RegExp(`\\b(e|entry|d)\\.${esc}\\b`).test(m.text)).map((m) => m.name);
  return { field: f, writes, reads: reads + libReaders.length, libReaders };
});

const dead = rows.filter((r) => r.writes === 0 && r.reads > 0);
const unused = rows.filter((r) => r.writes > 0 && r.reads === 0);
const orphan = rows.filter((r) => r.writes === 0 && r.reads === 0);

function table(title, list, note) {
  console.log(`\n=== ${title}（${list.length}件）===`);
  if (note) console.log(`  ${note}`);
  if (!list.length) { console.log("  なし"); return; }
  list.forEach((r) => console.log(
    `  ${r.field.padEnd(30)} 入力${String(r.writes).padStart(3)}  分析${String(r.reads).padStart(3)}` +
    (r.libReaders.length ? `   ← ${r.libReaders.join(", ")}` : "")));
}

console.log(`記録項目 ${rows.length}件を棚卸ししました。`);
table("★分析が読んでいるが、記録画面に直接の入力が見あたらない", dead,
  "新しい構造から逆算しているだけの可能性があります。逆算の条件を確かめてください。");
table("記録画面にはあるが、分析がどこも読んでいない", unused,
  "記録だけされて使われていない項目です。消すか、使うかの判断がいります。");
table("入力も分析も見あたらない", orphan);
console.log("\n※ 数は目安です。0でも別名で扱われていることがあります（響きスコア/声の出来のように）。");
console.log("※ ★「入力0」は『いま入力が無い』という意味です。『昔も無かった』ではありません。");
console.log("   消す前に git log -S で過去の入力を探し、DBに実データが無いことを数えてください。");
console.log("   speakingLevel で、その確認をせずに『全利用者で必ず null』と報告しかけました。");
