#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★時計で 走る 道は、★合言葉が 無ければ 必ず 断る
//
//   ★出どころ  2026-09-14 の 事故 ──
//     ★`CRON_SECRET` を 置き忘れた とき、`Bearer ${undefined}` は
//       ★「Bearer undefined」という **字** に なります。
//       ★★その 字を 送る だけで、★誰でも 叩けました。
//     ★★だから「無ければ 503」を、★くらべる **前** に 置きます。
//
//   ★★この 見張りは 道の 名前を 覚えません（★2026-09-23）。
//     ★`app/api/cron/` を 数えて、★`vercel.json` と 突き合わせます。
//     ★★道が 増えた ときに、★自分で 気づきます。
//
//   ★★見る こと
//     ① `app/api/cron/` の 道は ぜんぶ `vercel.json` に ある（★逆も）
//     ② どの 道も `CRON_SECRET` が 無ければ 503
//     ③ その 503 は、★合言葉を くらべる **前** に ある
//     ④ 台帳に 触るのは、★くらべた **あと**
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

const 置場 = path.join(ROOT, "app", "api", "cron");
const 道 = fs.readdirSync(置場).filter((n) =>
  fs.statSync(path.join(置場, n)).isDirectory()
  && fs.existsSync(path.join(置場, n, "route.js"))).sort();

console.log("① 道の 一覧と vercel.json が 合って いる");
const v = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
const 書 = (v.crons || []).map((c) => c.path.replace("/api/cron/", "")).sort();
t(道.length > 0, "★道が ある（" + 道.length + "本）");
t(JSON.stringify(道) === JSON.stringify(書),
  "★置いた 道と 書いた 道が 同じ（置=" + 道.join("／") + " ／ 書=" + 書.join("／") + "）");
// ★★1日 1回まで（★Hobby の 決め）。★分の 欄が * の ものは 落とします。
(v.crons || []).forEach((c) => {
  const 分 = String(c.schedule).trim().split(/\s+/)[0];
  t(分 !== "*", "★" + c.path + " は 1日 1回の 形（" + c.schedule + "）");
});

console.log("\n② 合言葉が 無ければ 503／③ くらべる 前に／④ 台帳は あと");
道.forEach((n) => {
  const code = readCode("app/api/cron/" + n, "route.js");
  const 読 = code.indexOf("process.env.CRON_SECRET");
  const 五 = code.indexOf("503");
  const 比 = code.search(/authHeader\s*!==|headers\.get\("authorization"\)/);
  const 台 = code.search(/createAdminClient\(\)|createClient\(\)/);
  t(読 >= 0, "★" + n + " ── CRON_SECRET を 読んで いる");
  t(五 >= 0 && 五 > 読, "★" + n + " ── 読んだ あとに 503 が ある");
  t(比 >= 0 && 五 < 比, "★" + n + " ── 503 は くらべる 前に ある");
  t(台 < 0 || 台 > 比, "★" + n + " ── 台帳に 触るのは くらべた あと");
});

console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
process.exit(落ち === 0 ? 0 : 1);
