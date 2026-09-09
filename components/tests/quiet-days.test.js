#!/usr/bin/env node
// ============================================================================
// 静かにする期間の 見張り（2026-09-09）
//
//   ★出どころ 坂本さんのご指示：「本番の3日前〜翌々日、羊が呼びに来ないように。
//            これは、約束を書く前に、必ず、入れてください。」
//
//   ★★確かめること
//     ① 窓が -3 〜 +2 であること（★片側だけ ずれていないこと）。
//     ② 呼びに行く道が、★1つ残らず この門を 通ること。
//     ③ 本番の日が 読めなかったら、★送らないこと（★fail closed）。
//     ④ 静かにするのは「呼びに行く」道だけで、★画面を 閉じないこと。
//     ⑤ 静かな日を 数えて 見せないこと。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}
function eq(a, b, label) {
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  t(ja === jb, label + (ja === jb ? "" : `  期待:${jb} 実際:${ja}`));
}

(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "quietDays.js"), "utf8");
  const q = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("=== ① 窓は 3日前 〜 翌々日 ===");
  eq(q.QUIET_BEFORE_DAYS, 3, "3日前から");
  eq(q.QUIET_AFTER_DAYS, 2, "翌々日まで");
  const P = ["2026-09-14"];
  const expect = {
    "2026-09-10": false, // ★4日前は 呼びます
    "2026-09-11": true,  // ★3日前から 静か
    "2026-09-12": true,
    "2026-09-13": true,
    "2026-09-14": true,  // ★本番の日
    "2026-09-15": true,
    "2026-09-16": true,  // ★翌々日まで 静か
    "2026-09-17": false  // ★3日後は 呼びます
  };
  Object.keys(expect).forEach((d) => {
    eq(q.isQuietDay(d, P), expect[d], `${d} は ${expect[d] ? "静か" : "呼ぶ"}`);
  });
  eq(Object.values(expect).filter(Boolean).length, 6, "★静かな日は 6日（★-3〜+2）");

  console.log("\n=== 本番が 無い・おかしいとき ===");
  eq(q.isQuietDay("2026-09-14", []), false, "本番が 1つも 無ければ 呼ぶ");
  eq(q.isQuietDay("2026-09-14", null), false, "並びが 無くても 落ちない");
  eq(q.isQuietDay("2026-09-14", ["", null, "でたらめ"]), false, "★おかしい日付で 落ちない");
  eq(q.isQuietDay("2026-09-14", ["でたらめ", "2026-09-15"]), true, "★1つ おかしくても、ほかは 効く");
  eq(q.isQuietDay("2026-09-14", ["2026-09-01", "2026-09-15"]), true, "★近いほうが あれば 静か");
  eq(q.mayCall("2026-09-13", P), false, "静かな日は 呼ばない");
  eq(q.mayCall("2026-09-20", P), true, "離れていれば 呼ぶ");
  // ★月をまたぐ
  eq(q.isQuietDay("2026-10-01", ["2026-09-30"]), true, "★月をまたいでも 数えられる");
  eq(q.isQuietDay("2027-01-01", ["2026-12-31"]), true, "★年をまたいでも 数えられる");

  console.log("\n=== ② 呼びに行く道は、すべて 門を通る ===");
  const routes = fs.readdirSync(path.join(__dirname, "..", "..", "app", "api", "cron"));
  const callers = routes.filter((r) => {
    const f = path.join(__dirname, "..", "..", "app", "api", "cron", r, "route.js");
    if (!fs.existsSync(f)) return false;
    // ★LINE へ 押し出す道だけを 見ます。
    return /api\.line\.me|pushMessage/.test(fs.readFileSync(f, "utf8"));
  });
  t(callers.length > 0, `★呼びに行く道が 見つかっている（${callers.join(", ")}）`);
  callers.forEach((r) => {
    const code = readCode("app", "api", "cron", r, "route.js");
    t(/mayCall\(/.test(code), `★${r} は mayCall を 通している`);
    t(!/-\s*3|3日前/.test(code.replace(/QUIET_BEFORE_DAYS/g, "")),
      `★${r} が 日数を 自分で 数えていない（★決めは lib に 1つ）`);
  });

  console.log("\n=== ③ 読めなければ 送らない ===");
  {
    const code = readCode("app", "api", "cron", "line-reminder", "route.js");
    t(/perfError[\s\S]{0,300}status:\s*500/.test(code),
      "★本番の日が 読めなければ、★送らずに 止まる");
    const gateAt = code.indexOf("mayCall(");
    const sendAt = code.indexOf("pushMessage(p.line_user_id");
    t(gateAt > 0 && sendAt > 0 && gateAt < sendAt, "★門が、送るより 前にある");
    const perfAt = code.indexOf('.from("performances")');
    t(perfAt > 0 && perfAt < sendAt, "★本番の日を、送るより 前に 読んでいる");
  }

  console.log("\n=== ④ 画面は 閉じない ===");
  {
    const vt = readCode("components", "VocalTracker.jsx");
    t(!/isQuietDay|mayCall/.test(vt),
      "★画面は 静かにする期間を 見ない（★開けば いつでも 書ける）");
    const lib = readCode("lib", "quietDays.js");
    t(/呼びに行く/.test(readRaw("lib", "quietDays.js")), "★何を止めるのかが 書いてある");
  }

  console.log("\n=== ⑤ 数えて 見せない ===");
  {
    const lib = readCode("lib", "quietDays.js");
    t(!/あと\s*\d|残り|日あります/.test(lib), "★「あと◯日」を 作らない");
    const code = readCode("app", "api", "cron", "line-reminder", "route.js");
    t(!/pushMessage[^)]*quietCount/.test(code), "★静かな日の数を、利用者に 送らない");
  }

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
