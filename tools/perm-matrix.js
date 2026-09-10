// ============================================================================
// 権限の 総当たり ── 10役職 × 主要12画面（★2026-09-11）
//
//   ★出どころ 「Woolsong 総合評価（Opus・9月10日）」§2
//     「足りない検査が2つ：①権限の総当たり（10役職 × 主要12画面 = 120通り）」
//   ★見本　　 00-動く見本（さわれる・全画面）.html の var PERM / var POSTS
//
//   ★★見本を 書き写しません。★ファイルから 取り出します。
//   ★★いまの 実装は lib/opsShell.js から 呼びます。
//
//   使い方  node tools/perm-matrix.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const mihon = fs.readFileSync(
  path.join(ROOT, "docs/design/pack-final/00-動く見本（さわれる・全画面）.html"), "utf8");

/** ★見本の var PERM ── できること 14。★3つ目は「学校ぜんぶに かかるか」。 */
function readPerm() {
  const i = mihon.indexOf("var PERM=[");
  const body = mihon.slice(i, mihon.indexOf("];", i));
  return [...body.matchAll(/\['([a-z_]+)','([^']+)',([01])\]/g)]
    .map((m) => ({ key: m[1], label: m[2], schoolWide: m[3] === "1" }));
}

/** ★見本の var POSTS ── 役職 10。 */
function readPosts() {
  const i = mihon.indexOf("var POSTS=[");
  const body = mihon.slice(i, mihon.indexOf("];", i));
  return [...body.matchAll(/\{n:'([^']+)',base:'([a-z]+)',p:\{([^}]*)\}\}/g)].map((m) => ({
    name: m[1], base: m[2],
    perms: new Set([...m[3].matchAll(/([a-z_]+):1/g)].map((x) => x[1]))
  }));
}

/**
 * ★主要12画面と、★それを 開ける できること。
 *
 *   ★★役職の 名前で 決めません。★できること で 決めます
 *     （★引き継ぎ「画面の 出し分けは 権限から 導いてください」）。
 */
const SCREENS = [
  { key: "home", label: "ホーム", need: null },              // ★運営に 入れれば 出ます
  { key: "schedule", label: "日程", need: ["sched_all", "sched_mine"] },
  { key: "roster", label: "名簿", need: ["meibo"] },
  { key: "events", label: "行事", need: ["gyoji"] },
  { key: "threads", label: "連絡", need: ["renraku_all", "monka_write"] },
  { key: "settings", label: "設定", need: ["master", "koma"] },
  { key: "attend", label: "出欠つけ", need: ["shukketsu"] },
  { key: "monka", label: "門下", need: ["monka_write"] },
  { key: "bill", label: "ご請求", need: ["bill"] },
  { key: "pay", label: "支払い方法", need: ["bill_pay"] },
  { key: "post", label: "役職を変える", need: ["post"] },
  { key: "koma", label: "コマを決める", need: ["koma", "koma_mine"] }
];

const PERM = readPerm();
const POSTS = readPosts();

// ★いまの 実装
const shellSrc = fs.readFileSync(path.join(ROOT, "lib/opsShell.js"), "utf8")
  .replace(/^export /gm, "").replace(/import[^\n]*\n/g, "");
// eslint-disable-next-line no-new-func
const shell = new Function(shellSrc + "; return { tabsFor, mayEnterOps, maySeeMoney, mayEditRoster, OPS_TABS };")();

console.log("見本の できること:", PERM.length, "／ 役職:", POSTS.length, "／ 画面:", SCREENS.length);
console.log("総当たり:", POSTS.length * SCREENS.length, "通り\n");

const wide = PERM.filter((p) => p.schoolWide).map((p) => p.key);
const rows = [];
let mismatch = 0, cannot = 0;

for (const post of POSTS) {
  for (const sc of SCREENS) {
    // ★見本が 言う「開けるか」
    const want = sc.need === null ? true : sc.need.some((k) => post.perms.has(k));
    // ★いまの 実装が 言う「開けるか」
    // ★★tabsFor は {key,label} の 並びを 返します。★鍵だけに します。
    //   ★はじめ 中身を そのまま 数えて、★ぜんぶ 食い違いに 見えていました。
    const tabs = shell.tabsFor(post.base).map((t) => t.key);
    let have;
    if (sc.key === "bill" || sc.key === "pay") have = shell.maySeeMoney(post.base);
    else if (sc.key === "roster") have = tabs.includes("roster");
    else if (sc.key === "attend") have = tabs.includes("schedule");
    else if (sc.key === "monka") have = post.base === "teacher";
    else if (sc.key === "post" || sc.key === "koma") have = shell.mayEditRoster(post.base);
    else have = tabs.includes(sc.key);
    const ok = want === have;
    if (!ok) mismatch++;
    // ★★いちばん 危ないのは「見本は だめ、実装は 出す」です。
    const leak = !want && have;
    if (leak) cannot++;
    rows.push({ post: post.name, base: post.base, screen: sc.label, want, have, leak });
  }
}

console.log("役職".padEnd(8) + "もと " + SCREENS.map((s) => s.label.slice(0, 3).padEnd(5)).join(""));
for (const post of POSTS) {
  const line = SCREENS.map((sc) => {
    const r = rows.find((x) => x.post === post.name && x.screen === sc.label);
    return (r.leak ? "★漏" : r.want === r.have ? (r.want ? " ○ " : " ・ ") : " ✕ ").padEnd(5);
  }).join("");
  console.log(post.name.padEnd(8) + post.base.padEnd(8) + line);
}
console.log("\n○＝見本も実装も 出す ／ ・＝どちらも 出さない ／ ✕＝食い違い ／ ★漏＝実装が よけいに 出す");
console.log(`食い違い ${mismatch} 通り（うち ★漏れ ${cannot} 通り）／ 全 ${rows.length} 通り`);

console.log("\n★★学校ぜんぶに かかる できること（" + wide.length + "）");
console.log("  " + PERM.filter((p) => p.schoolWide).map((p) => p.label).join("／"));
console.log("★その方 自身にだけ かかる（" + (PERM.length - wide.length) + "）");
console.log("  " + PERM.filter((p) => !p.schoolWide).map((p) => p.label).join("／"));

console.log("\n★★食い違いの 中身");
const bad = rows.filter((r) => r.want !== r.have);
const by = {};
bad.forEach((r) => { (by[r.screen] = by[r.screen] || []).push(r.post + (r.leak ? "（漏）" : "")); });
Object.entries(by).forEach(([sc, list]) =>
  console.log(`  ${sc}: ${list.join("・")}`));
