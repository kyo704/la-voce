// ============================================================================
// 動く見本を JavaScript として 読み、★1画面ずつ 数える
//
//   ★出どころ docs/design/pack-final/00-動く見本-iPhone.html
//            docs/design/pack-final/00-動く見本-PC.html
//
//   ★★見本を 書き写しません。★ファイルから 取り出します。
//   ★★かっこは 数えて 切ります。★正規表現で 切りません
//     （★この家の 決め。★入れ子の かっこで 何度も 壊しました）。
//
//   使い方  node tools/mihon-scan.js            … 一覧
//           node tools/mihon-scan.js 画面名      … その画面の 中身
// ============================================================================

const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

/** ★開きかっこから、★対応する 閉じかっこまでを 切り出します。 */
function braceBody(src, openIndex) {
  let depth = 0, i = openIndex, mode = "code", q = "", prev = "";
  for (; i < src.length; i++) {
    const c = src[i], d = src[i + 1];
    if (mode === "code") {
      if (c === "/" && d === "/") { mode = "line"; i++; continue; }
      if (c === "/" && d === "*") { mode = "block"; i++; continue; }
      // ★★正規表現の リテラル。★中の 引用符に だまされない ため、飛ばします。
      //   ★★これが 無いと、★.replace(/"/g,…) の 中の " で
      //     ★引用符の 中に 入ったと 思い込み、★かっこの 数が 狂います。
      //     ★★5画面が 切り出せずに 落ちていました（★2026-09-11）。
      //   ★割り算と 見分けるのは、★直前の 文字です。
      //     ★値の あとの / は 割り算、★それ以外は 正規表現です。
      if (c === "/" && !/[\w)\]]/.test(prev)) { mode = "re"; continue; }
      if (c === '"' || c === "'" || c === "`") { mode = "q"; q = c; continue; }
      if (c === "{") depth++;
      else if (c === "}") { depth--; if (depth === 0) return src.slice(openIndex + 1, i); }
      if (!/\s/.test(c)) prev = c;
      continue;
    }
    if (mode === "line") { if (c === "\n") mode = "code"; continue; }
    if (mode === "block") { if (c === "*" && d === "/") { mode = "code"; i++; } continue; }
    if (mode === "re") {
      if (c === "\\") { i++; continue; }
      if (c === "/") { mode = "code"; prev = "/"; }
      continue;
    }
    if (c === "\\") { i++; continue; }
    if (c === q) { mode = "code"; prev = q; }
  }
  return null;
}

/** ★SC['名'] / SH['名'] を、★名前 → 中身 で 取り出します。 */
function collect(src, table) {
  const out = new Map();
  const re = new RegExp(table + "\\['([^']+)'\\]\\s*=\\s*function\\s*\\([^)]*\\)\\s*\\{", "g");
  let m;
  while ((m = re.exec(src)) !== null) {
    const open = src.indexOf("{", m.index + m[0].length - 1);
    const body = braceBody(src, open);
    if (body != null) out.set(m[1], body);
  }
  return out;
}

/** ★画面に 出る 日本語（★注記★で 始まるものは 除く）。 */
function words(body) {
  const out = new Set();
  const re = /['"]([^'"\\]{2,}?)['"]/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const t = m[1].replace(/<[^>]*>/g, "").replace(/&[a-z]+;/g, "").trim();
    if (!/[ぁ-んァ-ヶ一-龥]/.test(t)) continue;
    t.split(/[<>]/).forEach((piece) => {
      const p = piece.trim();
      if (p.length >= 2 && /[ぁ-んァ-ヶ一-龥]/.test(p) && !p.startsWith("★")) out.add(p);
    });
  }
  return [...out];
}

/** ★その画面から どこへ 行くか。 */
function moves(body) {
  const push = [...body.matchAll(/push\(\\?'([^'\\]+)\\?'\)/g)].map((m) => m[1]);
  const sheet = [...body.matchAll(/openSheet\(\\?'([^'\\]+)\\?'/g)].map((m) => m[1]);
  const go = [...body.matchAll(/go\(\\?'([^'\\]+)\\?'\)/g)].map((m) => m[1]);
  return { push: [...new Set(push)], sheet: [...new Set(sheet)], go: [...new Set(go)] };
}

const ip = fs.readFileSync(path.join(ROOT, "docs/design/pack-final/00-動く見本-iPhone.html"), "utf8");
const SC = collect(ip, "SC");
const SH = collect(ip, "SH");

// ★★ほかの 道具から 読まれた ときは、★一覧を 出しません。
if (require.main !== module) {
  module.exports = { SC, SH, words, moves, braceBody, collect };
} else {

const arg = process.argv[2];
if (arg) {
  const body = SC.get(arg) || SH.get(arg);
  if (!body) { console.log("そんな画面は ありません:", arg); process.exit(1); }
  console.log(body);
  process.exit(0);
}

console.log("=== iPhone の 動く見本");
console.log("画面(SC):", SC.size, "／ シート(SH):", SH.size);
let total = 0;
for (const [name, body] of SC) {
  const mv = moves(body);
  const w = words(body);
  total += w.length;
  const to = [...mv.push.map((x) => "→" + x), ...mv.sheet.map((x) => "▼" + x), ...mv.go.map((x) => "⇒" + x)];
  console.log(`  ${name}\t${body.length}字\t文${w.length}\t${to.join(" ") || ""}`);
}
console.log("画面に 出る 言葉（のべ）:", total);
}
