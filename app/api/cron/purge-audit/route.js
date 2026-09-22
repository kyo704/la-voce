import { createAdminClient } from "@/lib/supabase/admin";
import { OPS_AUDIT_RETENTION_DAYS } from "@/lib/opsAudit";

// ============================================================================
// ★管理の 操作の 記録を 90日で 消す（★坂本さんの お決め・2026-09-23）
//
//   ★★消すのは 台帳の 関数 です（`purge_ops_audit_log()`）。
//     ★★ここで `delete` を 書きません。★日数が 2か所に 分かれます。
//     ★★台帳の 関数の 中に「90日より 古い 行だけ」と 書いて あります。
//
//   ★★★消して よい 記録 と、★消しては いけない 記録 を 混ぜません。
//     ★消して よい …… `ops_audit_log`（★管理の 操作。90日）
//     ★★消しては いけない …… `monka_read_log`（門下を 開いた 記録）／
//       `org_post_perm_log`（役職の 変更）。★この 道は 触りません。
//
//   ★★`CRON_SECRET` が 無い ときは 503。★他の 定期処理と 同じ です。
//     ★★未設定だと "Bearer undefined" を 送る だけで 誰でも 叩けます。
// ============================================================================

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET が設定されていません。管理の操作の記録の削除を実行しません。");
    return new Response("Not configured", { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("purge_ops_audit_log");
  if (error) {
    console.error("管理の操作の記録を消せませんでした:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, days: OPS_AUDIT_RETENTION_DAYS });
}
