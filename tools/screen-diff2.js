// ============================================================================
// ★両方向で くらべる（★2026-09-11・実機の ご報告から）
//
//   ★★何が いけなかったか。
//     ★tools/screen-check.js は「★見本の 言葉が、実装に あるか」しか 見ません。
//     ★★片道です。★「実装に あって、見本に 無い もの」を 見ません。
//     ★★だから、★古い 画面が まるごと 残っていても「一致」と 出ます。
//     ★A03 を 14/14 と 報告しましたが、★実機は まったく 別の 形でした。
//
//   ★★もう1つ。★くらべる 相手が 古い ものでした。
//     ★screens/*.html（★静止画）は、★00-動く見本 より 古い ことが あります。
//     ★A03 も A05 も、★動く見本の ほうが 新しく、★形が ちがいます。
//
//   ★★だから この 道具は
//     ① ★動く見本（★新しい ほう）を 相手に する
//     ② ★両方向で 数える（★足りない ／ ★よけい）
//
//   使い方  node tools/screen-diff2.js 記録
// ============================================================================

const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const { readCode } = require(path.join(ROOT, "components/tests/_source"));

const MIHON = fs.readFileSync(
  path.join(ROOT, "docs/design/pack-final/00-動く見本（さわれる・全画面）.html"), "utf8");

/** ★かっこを 数えて 切ります（★正規表現で 切りません）。 */
function bodyOf(head) {
  const i = MIHON.indexOf(head);
  if (i < 0) return null;
  let d = 0, k = MIHON.indexOf("{", i), mode = "code", q = "", prev = "";
  for (; k < MIHON.length; k++) {
    const c = MIHON[k], e = MIHON[k + 1];
    if (mode === "code") {
      if (c === "/" && e === "/") { mode = "line"; k++; continue; }
      if (c === "/" && e === "*") { mode = "block"; k++; continue; }
      if (c === "/" && !/[\w)\]]/.test(prev || " ")) { mode = "re"; continue; }
      if (c === '"' || c === "'" || c === "`") { mode = "q"; q = c; continue; }
      if (c === "{") d++;
      else if (c === "}") { d--; if (d === 0) return MIHON.slice(i, k + 1); }
      if (!/\s/.test(c)) prev = c;
    } else if (mode === "line") { if (c === "\n") mode = "code"; }
    else if (mode === "block") { if (c === "*" && e === "/") { mode = "code"; k++; } }
    else if (mode === "re") { if (c === "\\") { k++; continue; } if (c === "/") { mode = "code"; prev = "/"; } }
    else { if (c === "\\") { k++; continue; } if (c === q) { mode = "code"; prev = q; } }
  }
  return null;
}

const SCREENS = {
  "記録": { mihon: "function S_kiroku(){", parts: ["RecordV2Head", "RecordSheets"], libs: ["recordV2", "recordSheets"] },
  "きょう": { mihon: "function S_kyou(){", parts: ["HomeV2", "TodayBand"], libs: ["todayBand", "todayCard"] },
  "ふりかえる": { mihon: "function S_furi(){", parts: ["LookBackV2", "LineUpChart", "LookBackPanel"], libs: ["lineUp", "lookBack"] }
};

const key = process.argv[2];
const spec = SCREENS[key];
if (!spec) { console.log("使い方: node tools/screen-diff2.js " + Object.keys(SCREENS).join("|")); process.exit(1); }

const body = bodyOf(spec.mihon);
if (!body) { console.log("★見本が 見つかりません:", spec.mihon); process.exit(1); }

/** ★画面に 出る 日本語を 拾います。 */
function words(src) {
  const out = new Set();
  [...src.matchAll(/['"]([^'"\\]{2,}?)['"]/g)].forEach((m) => {
    m[1].split(/<[^>]*>|＋|✓|›|‹/).forEach((piece) => {
      const t = piece.replace(/&[a-z]+;/g, " ").trim();
      if (t.length >= 3 && /[ぁ-んァ-ヶ一-龥]/.test(t) && !t.startsWith("★")) out.add(t);
    });
  });
  return out;
}

const want = words(body);
const mine = new Set();
[...spec.parts.map((n) => ["components", n + ".jsx"]),
 ...spec.libs.map((n) => ["lib", n + ".js"])].forEach((p) => {
  const full = path.join(ROOT, ...p);
  if (fs.existsSync(full)) words(readCode(...p)).forEach((w) => mine.add(w));
});

console.log(`══════ ${key}　★動く見本 と くらべます\n`);
console.log("① ★見本に あって、実装に 無い（★足りない）");
const missing = [...want].filter((w) => ![...mine].some((m) => m.includes(w) || w.includes(m)));
console.log(`  ${missing.length}件`);
missing.slice(0, 20).forEach((w) => console.log("    ★" + w.slice(0, 46)));

console.log("\n② ★実装に あって、見本に 無い（★よけい・★古い かも）");
const extra = [...mine].filter((w) => ![...want].some((t) => t.includes(w) || w.includes(t)));
console.log(`  ${extra.length}件`);
extra.slice(0, 20).forEach((w) => console.log("    ★" + w.slice(0, 46)));

console.log(`\n★足りない ${missing.length} ／ よけい ${extra.length} ／ 見本の 言葉 ${want.size}`);
