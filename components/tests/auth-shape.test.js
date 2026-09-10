// ============================================================================
// 認証の 受け取り方 ── 見張り（★2026-09-11・実機の ご報告から）
//
//   ★★何が 起きたか。
//     lib/withTimeout.js の getUserWithTimeout は
//       ★{ user, unreachable }
//     を 返します。★{ data: { user }, error } では ありません。
//
//     ★私は 新しい 道を 2つ 書くとき、★supabase.auth.getUser() の 形で
//     ★★{ data: { user } = {}, error } と 受けていました。
//     ★★user が いつも undefined に なり、★どなたでも 401 でした。
//
//     ★実機で「ログインが必要です（401）」と ご報告を いただきました。
//     ★★2つの 道が、★書いた ときから ずっと 動いていませんでした
//       （★/api/org/posts と /api/character/unlock）。
//
//   ★★なぜ 気づけなかったか。
//     ★★試験が「呼んでいるか」しか 見ていませんでした。
//     ★「呼び方が 合っているか」を 見ていませんでした。
//     ★→ ★この 見張りが、そこを 見ます。
//
//   ★★「確かめられなかった（つながらない）」と
//     ★「入っておられない（未ログイン）」を、★分けること。
//     ★前者は 503、★後者は 401 です。
//     ★1つに すると、★電波の 悪い ところで「ログインしてください」と 出ます。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, ROOT } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

// ★★まず、★返す 形そのものを 確かめます。
const helper = readCode("lib", "withTimeout.js");
console.log("① 返す 形");
ok(/return \{ user: \(data && data\.user\) \|\| null, unreachable: false \};/.test(helper),
  "★{ user, unreachable } を 返す");
ok(!/return \{ data:/.test(helper), "★{ data: … } では 返さない");

console.log("② 呼ぶ 側の 受け取り方");
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(f.name)) files.push(path.relative(ROOT, p));
  }
})(path.join(ROOT, "app"));

const callers = [];
files.forEach((rel) => {
  const code = readCode(...rel.split(path.sep));
  if (!/= await getUserWithTimeout\(/.test(code)) return;
  [...code.matchAll(/const\s+(\{[^}]*\})\s*=\s*await getUserWithTimeout\(/g)].forEach((m) => {
    callers.push({ rel, shape: m[1].replace(/\s+/g, " ").trim() });
  });
});
ok(callers.length >= 15, `★呼んでいる ところが ある（${callers.length}か所）`);
const bad = callers.filter((c) => /data\s*:/.test(c.shape));
ok(bad.length === 0, "★{ data: … } で 受けている ところが ない"
  + (bad.length ? "（" + bad.map((c) => c.rel).join(" / ") + "）" : ""));
callers.forEach((c) => {
  ok(/\buser\b/.test(c.shape), `★${c.rel} が user を 受け取っている`);
});

console.log("③ つながらない と 未ログイン を 分けている（★道だけ）");
const routes = callers.filter((c) => c.rel.startsWith(path.join("app", "api")));
routes.forEach((c) => {
  const code = readCode(...c.rel.split(path.sep));
  ok(/unreachable/.test(c.shape), `★${c.rel} が unreachable を 受け取っている`);
  ok(/status: 503/.test(code), `★${c.rel} に 503 が ある（★つながらない）`);
  ok(/status: 401/.test(code), `★${c.rel} に 401 が ある（★未ログイン）`);
});

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
