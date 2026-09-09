#!/usr/bin/env node
// ============================================================================
// 毎日の控え と、止まったことに 気づく（2026-09-10）の 見張り
//
//   ★出どころ 坂本さんの お決め（2026-09-10）
//     「★⑤バックアップ：日次で 自動実行、★30日 保持」
//     「★⑥障害通知：keep-alive 失敗時に 運営宛メールを 1通、★1日1通を 上限」
//
//   ★★確かめること
//     ① 1日1通が、★数ではなく 決まりで 守られていること。
//     ② 送る前に 控えを 入れていること（★送りすぎない）。
//     ③ 知らせが 送れなくても、★定期処理を 止めないこと。
//     ④ 知らせに、★人の ことを 書かないこと。
//     ⑤ 控えが 毎日 走ること・30日 保持であること。
//     ⑥ 秘密を、★リポジトリに 書いていないこと。
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
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "systemAlert.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const sql = readRaw("supabase", "2026-09-10-止まったことに気づく.sql");

  console.log("=== ① 1日1通は、決まりで 守る ===");
  t(/unique \(kind, sent_on\)/.test(sql), "★（kind, sent_on）が 一意");
  t(/system_alerts_once_a_day/.test(sql), "★決まりに 名前が ある");
  const lib = readCode("lib", "systemAlert.js");
  t(!/select[\s\S]{0,80}count/i.test(lib), "★数を 数えて 判断していない");
  t(/23505/.test(lib), "★重なりを、決まりの 返事で 見分けている");

  console.log("\n=== 日本時間で 1日を 切る ===");
  eq(m.todayJST(new Date("2026-09-10T20:00:00Z")), "2026-09-11", "★UTC 20時は 日本の 翌日");
  eq(m.todayJST(new Date("2026-09-10T10:00:00Z")), "2026-09-10", "UTC 10時は 同じ日");

  console.log("\n=== ② 送る前に 控えを 入れる ===");
  {
    const at = lib.indexOf('.insert({ kind');
    const sendAt = lib.indexOf("api.resend.com");
    t(at > 0 && sendAt > 0 && at < sendAt, "★控えが 先、★送るのが あと");
    t(/送りすぎる」より「送り漏らす/.test(readRaw("lib", "systemAlert.js")),
      "★どちらに 倒すかが 書いてある");
  }
  {
    const calls = [];
    const admin = { from: () => ({ insert: async (row) => { calls.push(row); return { error: null }; } }) };
    const r = await m.sendAlertOncePerDay(admin, {
      kind: "keep-alive", detail: "500", apiKey: "k", to: "a@b.c",
      fetchImpl: async () => ({ ok: true })
    });
    eq(r, "sent", "1通目は 送る");
    eq(calls.length, 1, "控えを 1行 入れる");
    eq(calls[0].kind, "keep-alive", "種類を 残す");
  }
  {
    const admin = { from: () => ({ insert: async () => ({ error: { code: "23505" } }) }) };
    const r = await m.sendAlertOncePerDay(admin, {
      kind: "keep-alive", apiKey: "k", to: "a@b.c", fetchImpl: async () => ({ ok: true })
    });
    eq(r, "already", "★2通目は 送らない");
  }
  {
    // ★★送れなくても、★控えは 残ること
    const admin = { from: () => ({ insert: async () => ({ error: null }) }) };
    const r = await m.sendAlertOncePerDay(admin, {
      kind: "keep-alive", apiKey: "k", to: "a@b.c",
      fetchImpl: async () => ({ ok: false, status: 500 })
    });
    eq(r, "failed", "★送れなければ failed を 返す");
  }
  eq(await m.sendAlertOncePerDay(null, { kind: "keep-alive" }), "skipped", "client が 無ければ skipped");
  eq(await m.sendAlertOncePerDay({ from: () => ({ insert: async () => ({ error: null }) }) },
    { kind: "しらない種類" }), "skipped", "★知らない 種類は 送らない");

  console.log("\n=== ③ 知らせが 送れなくても、定期処理を 止めない ===");
  const ka = readCode("app", "api", "cron", "keep-alive", "route.js");
  t(/const alerted = await sendAlertOncePerDay/.test(ka), "★知らせを 呼んでいる");
  {
    // ★★知らせの 前に、★もとの 500 を 返す 道が 消えていないこと
    const at = ka.indexOf("sendAlertOncePerDay");
    const ret = ka.indexOf("status: 500 }", at);
    t(ret > at, "★知らせの あとに、★もとどおり 500 を 返す");
    t(!/throw/.test(ka.slice(at, at + 400)), "★知らせで 例外を 投げない");
  }
  t(/CRON_SECRET/.test(ka) && /503/.test(ka), "★門は そのまま（★未設定なら 503）");

  console.log("\n=== ④ 人の ことを 書かない ===");
  const lines = m.alertLines({ kind: "keep-alive", detail: "boom", at: "2026-09-10T00:00:00Z" }).join("\n");
  ["メール", "名前", "user_id", "@"].forEach((w) => {
    t(!lines.includes(w), `★知らせに「${w}」が 出ない`);
  });
  t(/1日に1通まで/.test(lines), "★1日1通と、知らせ自身に 書いてある");
  t(/毎回は届きません/.test(lines), "★毎回は 来ないと 書いてある");
  t(/slice\(0, 300\)/.test(lib), "★わけを 短く 切っている");

  console.log("\n=== ⑤ 控えは 毎日・30日 ===");
  const wf = readRaw(".github", "workflows", "backup.yml");
  t(/schedule:/.test(wf), "★時間で 走る");
  t(/cron: "10 18 \* \* \*"/.test(wf), "★毎日 1回");
  t(/retention-days: 30/.test(wf), "★GitHub に 30日");
  t(/RETENTION_DAYS=30/.test(readRaw("scripts", "backup-dump.sh")), "★台本の 中も 30日");
  t(/if-no-files-found: error/.test(wf), "★取れていなければ 失敗に する（★空を 成功に しない）");
  t(/rm -f backups\/\*\.sql/.test(wf), "★中身を 後片づけする");
  t(/workflow_dispatch:/.test(wf), "★手でも 走らせられる");

  console.log("\n=== ⑥ 秘密を 書いていない ===");
  t(/secrets\.BACKUP_DATABASE_URL/.test(wf), "★秘密は Secrets から");
  t(!/postgresql:\/\/[^$]/.test(wf), "★接続の 文字列を 直に 書いていない");
  t(!/postgres:\/\/|password/i.test(readCode("lib", "systemAlert.js")), "★lib にも 無い");
  t(/\.env\*\.local/.test(readRaw(".gitignore")) || /\.env/.test(readRaw(".gitignore")),
    "★手元の 秘密は .gitignore に ある");
  t(/backups/.test(readRaw(".gitignore")), "★控えの 置き場も .gitignore に ある");

  console.log("\n=== 表の 守り ===");
  t(/revoke all on public\.system_alerts from anon/.test(sql), "★anon から 剥奪");
  t(/revoke all on public\.system_alerts from authenticated/.test(sql), "★authenticated からも 剥奪");
  t(/enable row level security/.test(sql), "★行の 門も 立てる");
  t(/ポリシーを 1つも 作りません/.test(sql), "★ポリシーを 置かない（★誰にも 見えない）");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
