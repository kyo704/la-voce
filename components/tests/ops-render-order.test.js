#!/usr/bin/env node

// ============================================================================
// ★運営モードの renderTab ── ★宣言の 前に 使って いないこと
//
//   ★出どころ 2026-09-13、★実機の ご報告。
//     ★「ReferenceError: Cannot access 'l' before initialization」
//     ★★運営モードの「日程」を 開くと、★誰でも 落ちて いました。
//
//   ★★何が 起きて いたか
//     ★`const opsMembers` の 宣言が、★それを 使う 枝の **あと**に ありました。
//     ★★`const` は 巻き上がりません。★名前は 在るのに 触れません（★TDZ）。
//     ★★`npm run lint` の `no-undef` は 見つけられません ── ★名前は 在るからです。
//     ★★`next build` も 通ります。★走らせて はじめて 落ちます。
//
//   ★★だから、★字の 並びを 見ます。
//     ★★renderTab の 中で、★`const 名前 =` より **前**に その 名前が
//       ★出て いないか。★出て いれば、★同じ ことが また 起きます。
// ============================================================================

const { readRaw } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const raw = readRaw("components", "VocalTracker.jsx");

// ★renderTab の かたまりを 切り出します。
const start = raw.indexOf("renderTab={(tabKey) => {");
t(start > 0, "★renderTab が 見つかる");

// ★★終わりは、★次の 同じ 深さの 閉じ ── ★中かっこを 数えます。
let i = raw.indexOf("{", start + "renderTab=".length);
let depth = 0;
let end = -1;
for (let k = i; k < raw.length; k++) {
  if (raw[k] === "{") depth++;
  else if (raw[k] === "}") { depth--; if (depth === 0) { end = k; break; } }
}
t(end > start, "★renderTab の 終わりが 見つかる");

const body = raw.slice(start, end);

console.log("\n① 宣言の 前に 使って いない こと");

// ★★見るのは、★renderTab の **いちばん 外側**の 宣言だけ です。
//   ★★枝（if）の 中の const は、★その 枝の 中でしか 死角を 作りません。
//     ★★外から その 名前に 触れる ことは ありません。
//   ★★いちばん 外側は 字下げ 12 です。★枝の 中は 14 以上に なります。
//   ★★2026-09-13、★はじめ 深さを 見ずに 数えて いて、
//     ★★枝の 中の `const members` を 挙げて しまいました。
const decls = [...body.matchAll(/\n {12}const ([A-Za-z_$][\w$]*) =/g)]
  .map((m) => ({ name: m[1], at: m.index }));

t(decls.length > 0, "★宣言が " + decls.length + " 個 見つかる");

const bad = [];
decls.forEach((d) => {
  // ★★その 名前が、★宣言より 前に 出て いないか。
  //   ★★言葉の 切れ目で 見ます（★opsMembership が opsMembers に 当たらない ため）。
  // ★★JSX の 属性の 名前は、★変数では ありません（★`members={…}`）。
  //   ★★2026-09-13、★それを 変数と 見なして いました。
  //   ★★だから 属性の 形を 先に 外します。
  const before = body.slice(0, d.at)
    .replace(new RegExp("(?<![\\w$])" + d.name + "(?=\\s*=\\s*[{\"'])", "g"), "");
  const re = new RegExp("(?<![\\w$])" + d.name.replace(/\$/g, "\\$") + "(?![\\w$])");
  if (re.test(before)) bad.push(d.name);
});

bad.forEach((n) => console.log("    ✗ ★`" + n + "` が、★宣言より 前に 出て います"));
t(bad.length === 0, "★どの 宣言も、★使う 前に 書かれて いる");

console.log("\n② 落ちた ところが、★もう 直って いる こと");
const iMembers = body.indexOf("const opsMembers =");
const iSchedule = body.indexOf('if (tabKey === "schedule")');
t(iMembers > 0 && iSchedule > 0, "★両方 見つかる");
t(iMembers < iSchedule, "★`opsMembers` は「日程」の 枝より 前に ある");

console.log("\n★★この 見張りが 見て いない こと");
console.log("　★字の 並びだけを 見ます。★走らせて いません。");
console.log("　★同じ 名前が 注記の 中に あると、★前に 出て いると 見なします。");
console.log("　★★それでも 黙って 通すより 安全な ほうへ 倒して います。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
