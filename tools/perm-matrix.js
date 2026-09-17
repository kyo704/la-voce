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
const permsSrc = fs.readFileSync(path.join(ROOT, "lib/opsPerms.js"), "utf8")
  .replace(/^export /gm, "");
// eslint-disable-next-line no-new-func
// ★★★まだ 作って いない 画面（★2026-09-18・坂本さんの お決め ㋐）。
//
//   ★★`pay`（支払い方法を 変える）…… ★運営の 画面に 控えが ありません。
//     ★★`OpsSettings` は 金額を **出すだけ** です。★Stripe の 窓口へ 行けません。
//     ★★`OpsShell:85` に「お支払いの ことは、教室の 責任者の 方が ご覧に なれます」
//       ★という 断りが ある だけ です。
//   ★★`koma`（学校の 時間の 割り方・場所）… ★運営の 画面に ありません。
//     ★★`MyTimetable` の「自分の コマ」は **その方 自身**の もの です。
//       ★学校の コマでは ありません。
//
//   ★★★無い ものを「出す」と 数えません。★見本との 差は 残します。
//     ★★差が 残る ことが、★**まだ 作って いない**という 印 です。
//     ★★作った 日に、★ここを `can(perms, "…")` に 変えます。★それが 引き金 です。
const NO_SCREEN = Object.freeze({ pay: false, koma: false });

const P = new Function(permsSrc
  + "; return { tabsForPerms, can, mayGrant, maySeeBill, mayPay, TEMPLATE_POSTS };")();
const shell = new Function(
  permsSrc + "\n" + shellSrc
  + "; return { tabsFor, mayEnterOps, maySeeMoney, mayEditRoster, OPS_TABS };")();

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
    // ★★2つの 道で 数えます（★2026-09-11）。
    //   ★いま　… ★古い 4つの 役割（★3段目の 前）
    //   ★あと　… ★できこと（★3段目の あと）
    // ★★★2026-09-18（★A2）、★測る 先を 変えました。
    //
    //   ★★もとは `post.base`（★役割の 名）で 測って いました。
    //     ★★わざと です ── ★「落ち道が どれだけ 見本と ちがうか」を
    //       ★見せる ための 道具 でした。★33通り 出て いました。
    //   ★★A2 で 落ち道を 外しました。★役割の 名では 何も 開きません。
    //     ★★いま `post.base` で 測ると、★ぜんぶ「出さない」に なります。
    //     ★★それは 実装の 姿では ありません ── ★**道が 1本に なった** ので、
    //       ★★その 1本を 測ります。
    //   ★★★数が 33 → 0 に なるのは、★道具を 甘く した から では ありません。
    //     ★★下の 較正が、★それを 確かめます。
    const tabs = shell.tabsFor([...post.perms]).map((t) => t.key);
    const ptabs = tabs;
    let have;
    // ★★★2026-09-18、★1つずつ 測り先を 合わせました。
    //   ★★きょうまで、★`pay` を `bill` で、★`post` と `koma` を `meibo` で
    //     ★測って いました。★**ちがう できこと**を 見て いました。
    //   ★★そのうち 2つは、★画面 そのものが **まだ ありません**。
    //     ★★無い 画面を「実装が 出す」と 数えません。★`false` に します。
    //     ★★見本との 差は 残ります。★それが 正しい 姿 です ── ★まだ 無い の です。
    if (sc.key === "bill") have = shell.maySeeMoney([...post.perms]);
    else if (sc.key === "pay") have = NO_SCREEN.pay;
    else if (sc.key === "roster") have = tabs.includes("roster");
    else if (sc.key === "attend") have = tabs.includes("schedule");
    else if (sc.key === "monka") have = post.base === "teacher";
    else if (sc.key === "post") have = P.can([...post.perms], "post");
    else if (sc.key === "koma") have = NO_SCREEN.koma;
    else have = tabs.includes(sc.key);
    // ★できことで 決めた ときの 答え
    let after;
    if (sc.key === "bill") after = P.maySeeBill([...post.perms]);
    else if (sc.key === "pay") after = P.mayPay([...post.perms]);
    else if (sc.key === "roster") after = ptabs.includes("roster");
    else if (sc.key === "attend") after = post.perms.has("shukketsu");
    else if (sc.key === "monka") after = ptabs.includes("monka");
    else if (sc.key === "post") after = post.perms.has("post");
    else if (sc.key === "koma") after = post.perms.has("koma") || post.perms.has("koma_mine");
    else after = ptabs.includes(sc.key);
    const ok = want === have;
    if (!ok) mismatch++;
    // ★★いちばん 危ないのは「見本は だめ、実装は 出す」です。
    const leak = !want && have;
    if (leak) cannot++;
    rows.push({ post: post.name, base: post.base, screen: sc.label, want, have, leak, after });
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

// ★★★較正（★2026-09-18・A2）。
//   ★★「落ち道が 本当に 無い」ことを、★この 道具 自身が 確かめます。
//   ★★役割の 名を 渡して 何かが 開けば、★A2 は 効いて いません。
//   ★★数が 0 に なった のは 道具を 甘く した から では ない、という 印 です。
const 役割の名 = ["owner", "admin", "staff", "teacher"];
let 開いた = [];
for (const r of 役割の名) {
  if (shell.tabsFor(r).length > 0) 開いた.push(r + "（tabsFor）");
  if (shell.maySeeMoney(r)) 開いた.push(r + "（maySeeMoney）");
  if (shell.mayEditRoster(r)) 開いた.push(r + "（mayEditRoster）");
}
console.log("\n★★較正 ── ★役割の 名では 何も 開かない こと");
if (開いた.length) {
  console.log("  ★★NG ── ★まだ 開きます: " + 開いた.join(" / "));
  process.exitCode = 1;
} else {
  console.log("  ok  ★owner / admin / staff / teacher の どれでも 0 でした");
}
// ★★逆の 向きも。★できことを 渡せば 開く こと（★甘く なって いない 印）。
const 試し = shell.tabsFor(["home", "meibo"]).length;
console.log(試し > 0
  ? "  ok  ★できことを 渡せば 開きます（" + 試し + "枚）"
  : "  ★★NG ── ★できことでも 開きません。★締めすぎ です");
if (試し === 0) process.exitCode = 1;

console.log("\n★★学校ぜんぶに かかる できること（" + wide.length + "）");
console.log("  " + PERM.filter((p) => p.schoolWide).map((p) => p.label).join("／"));
console.log("★その方 自身にだけ かかる（" + (PERM.length - wide.length) + "）");
console.log("  " + PERM.filter((p) => !p.schoolWide).map((p) => p.label).join("／"));

// ★★3段目（できことで 決める）に したら どう なるか
const afterBad = rows.filter((r) => r.want !== r.after);
const afterLeak = afterBad.filter((r) => !r.want && r.after);
console.log(`\n★★できことで 決めたら ── 食い違い ${afterBad.length} 通り（うち 漏れ ${afterLeak.length} 通り）`);
if (afterBad.length) {
  const by2 = {};
  afterBad.forEach((r) => { (by2[r.screen] = by2[r.screen] || []).push(r.post); });
  Object.entries(by2).forEach(([sc, list]) => console.log(`  ${sc}: ${list.join("・")}`));
}

console.log("\n★★食い違いの 中身（★いま）");
const bad = rows.filter((r) => r.want !== r.have);
const by = {};
bad.forEach((r) => { (by[r.screen] = by[r.screen] || []).push(r.post + (r.leak ? "（漏）" : "")); });
Object.entries(by).forEach(([sc, list]) =>
  console.log(`  ${sc}: ${list.join("・")}`));
