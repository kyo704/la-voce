#!/usr/bin/env node
/**
 * 旧ブランド名の棚卸し（ブランド名の改名 v2.md §4-2・§4-3）。
 *
 * ★置換しません。一覧を出すだけです。
 *   §4-3「置換する前に、一覧を出してください」。
 *   §5 のゲートAで、坂本さんが見てから先へ進みます。
 *
 * ★分類がこの道具の仕事です。
 *   「表示に出る」だけが Phase 1〜3 の対象で、配管は触りません。
 *   i18n のキー名・変数名・テーブル名・localStorage のキーは、
 *   1つも置換対象に入れないこと（§3・§5）。
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const PATTERNS = [
  "La Voce", "LaVoce", "la voce", "la-voce", "lavoce", "LA VOCE",
  "ラ・ヴォーチェ", "ラヴォーチェ", "ラ　ヴォーチェ", "ラ・ボーチェ", "ヴォーチェ"
];

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "ios", "out"]);
const EXTS = new Set([".js", ".jsx", ".json", ".css", ".md", ".sql", ".html", ".webmanifest"]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXTS.has(path.extname(name)) || name === "manifest.json") out.push(full);
  }
  return out;
}

// ---- 分類 -------------------------------------------------------------
// ★ここが判断の中心です。迷ったら「表示に出る」に寄せ、人が見て落とします。
//   出るものを見落とすほうが、出ないものを1つ多く見るより高くつきます。
function classify(rel, line, found) {
  const t = line.trim();
  // ★イタリア語の「la voce」は、ふつうの名詞「その声」です。ブランド名ではありません。
  //   改名の理由そのものが「La Voce はイタリア語の一般名詞だから商標にできない」で、
  //   その一般名詞が、イタリア語の翻訳文の中に大量に出てきます。
  //     it: "Qualità della voce"        声の質
  //     it: "…, la voce è prima di…"    声は、まず…
  //   ここを置換すると、イタリア語の本文が壊れます。★絶対に触らないこと。
  //   見分け方: ブランド名は必ず大文字始まりの "La Voce"。小文字は名詞。
  const brandish = found.some((f) => /^(La Voce|LaVoce|LA VOCE|la-voce|lavoce|ラ・ヴォーチェ|ラヴォーチェ)$/.test(f));
  if (!brandish) return { shown: false, why: "★イタリア語などの一般名詞（触らない）" };
  if (/^\s*(\/\/|\*|--|#)/.test(t)) return { shown: false, why: "コメント" };
  if (/localStorage|sessionStorage/.test(line)) return { shown: false, why: "localStorage のキー" };
  if (/CACHE_NAME|caches\.open/.test(line)) return { shown: false, why: "キャッシュ名" };
  if (/downloadFile\(|\.name = `|name: `la-voce-/.test(line)) return { shown: false, why: "書き出しファイル名" };
  if (/^\s*"?name"?:\s*"la-voce"/.test(t)) return { shown: false, why: "パッケージ名" };
  if (/^\s*(const|let|var|function|class)\s/.test(t) && !/["'`]/.test(line)) return { shown: false, why: "識別子" };
  if (rel.startsWith("docs/")) return { shown: false, why: "仕様書（任意・Phase 4）" };
  if (rel.startsWith("components/tests/")) return { shown: false, why: "検査" };
  if (rel.startsWith("scripts/")) return { shown: false, why: "道具" };
  if (rel === "package.json" || rel === "package-lock.json") return { shown: false, why: "パッケージ定義" };
  return { shown: true, why: "★画面・文書に出る" };
}

// 9言語のどれかを含む行なら、言語も出す
const LANGS = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"];
function langsIn(line) {
  return LANGS.filter((l) => new RegExp(`\\b${l}:\\s*["']`).test(line));
}

const hits = [];
walk(ROOT).forEach((full) => {
  const rel = path.relative(ROOT, full);
  const text = fs.readFileSync(full, "utf-8");
  text.split("\n").forEach((line, i) => {
    // ★大文字小文字を区別して数える。区別しないと、ブランド名の "La Voce" と
    //   イタリア語の名詞 "la voce" が同じものになり、見分けがつかなくなる。
    //   最初これで取り違え、イタリア語の本文まで「表示に出る」に入れていた。
    const found = PATTERNS.filter((p) => line.includes(p));
    if (found.length === 0) return;
    const c = classify(rel, line, [...new Set(found)]);
    hits.push({ rel, line: i + 1, found: [...new Set(found)], ...c, langs: langsIn(line), text: line.trim().slice(0, 110) });
  });
});

const shown = hits.filter((h) => h.shown);
const hidden = hits.filter((h) => !h.shown);

console.log("旧ブランド名の棚卸し（置換はしていません）\n");
console.log(`該当 ${hits.length} 行 ／ ★表示に出る ${shown.length} 行 ／ 配管など ${hidden.length} 行\n`);

console.log("━━━ ★表示に出る（Phase 1〜3 の対象）━━━");
if (shown.length === 0) console.log("  なし");
const byFile = {};
shown.forEach((h) => { (byFile[h.rel] = byFile[h.rel] || []).push(h); });
Object.entries(byFile).forEach(([rel, rows]) => {
  console.log(`\n  ${rel}  （${rows.length}行）`);
  rows.forEach((h) => {
    const lang = h.langs.length ? `[${h.langs.join(",")}] ` : "";
    console.log(`    ${String(h.line).padStart(5)}  ${lang}${h.found.join("/")}  ${h.text}`);
  });
});

console.log("\n\n━━━ 配管など（★触らない）━━━");
const byWhy = {};
hidden.forEach((h) => { (byWhy[h.why] = byWhy[h.why] || []).push(h); });
Object.entries(byWhy).sort((a, b) => b[1].length - a[1].length).forEach(([why, rows]) => {
  const files = [...new Set(rows.map((r) => r.rel))];
  console.log(`  ${why.padEnd(24)} ${String(rows.length).padStart(3)}行  ${files.slice(0, 3).join(", ")}${files.length > 3 ? ` ほか${files.length - 3}ファイル` : ""}`);
});

console.log("\n★i18n のキー名・変数名・テーブル名は、1つも対象に入れていません。");
console.log("★この一覧を見てから、置換に進んでください（§5 ゲートA）。");
