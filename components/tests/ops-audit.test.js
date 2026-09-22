// STRIP: A（振る舞い）
//
// ★管理の 操作の 記録 …… ★90日で 消す。★消しては いけない 記録と 混ぜない。
const fs = require("fs");
const path = require("path");
const { readCode, readRaw, loadLib } = require("./_source");

let 数 = 0, 落 = 0;
const t = (名, ok, 註) => { 数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "✓" : "✗"} ${名}${註 ? "  -- " + 註 : ""}`); };

(async () => {
  const m = await loadLib("lib/opsAudit.js");
  const sql = readRaw("docs/design/pack-final/sql", "20260930_14_ops_audit_log.sql");
  const route = readCode("app/api/cron/purge-audit", "route.js");
  const vercel = readRaw("", "vercel.json");

  console.log("=== 一 日数が 1つ ===");
  t("★lib の 日数は 90", m.OPS_AUDIT_RETENTION_DAYS === 90, String(m.OPS_AUDIT_RETENTION_DAYS));
  // ★★★台帳の 関数の 中の 日数と 合って いるか。★数えます。★写しません。
  const 台 = /interval\s+'(\d+)\s+days'/.exec(sql);
  t("★台帳の 関数にも 日数が 書いて ある", !!台, 台 ? 台[1] : "見つかりません");
  t("★2つが 同じ 数", !!台 && Number(台[1]) === m.OPS_AUDIT_RETENTION_DAYS,
    台 ? `台帳 ${台[1]} ／ lib ${m.OPS_AUDIT_RETENTION_DAYS}` : "");

  console.log("\n=== 二 道は 台帳の 関数を 呼ぶ ===");
  t("★`purge_ops_audit_log` を 呼んで いる", /rpc\("purge_ops_audit_log"\)/.test(route));
  t("★道で `delete` を 書いて いない", !/\.delete\(/.test(route));
  t("★合言葉が 無ければ 503", /CRON_SECRET/.test(route) && /503/.test(route));

  console.log("\n=== 三 消しては いけない 記録と 混ぜない ===");
  for (const 名 of ["monka_read_log", "org_post_perm_log", "score_log"]) {
    t(`★${名} は 消さない ほうに ある`, m.NEVER_PURGE.includes(名));
    t(`★${名} は 消す ほうに **無い**`, !m.PURGEABLE.includes(名));
  }

  console.log("\n=== 四 時計に 入って いる ===");
  t("★vercel.json に purge-audit が ある", /purge-audit/.test(vercel));

  console.log(`\n  ${数 - 落} / ${数}`);
  process.exit(落 ? 1 : 0);
})();
