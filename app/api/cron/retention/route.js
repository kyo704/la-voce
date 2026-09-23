import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// ★★★掃除を 1日 1回 走らせます（★裁定169 #8 ／ 172 ／ 安全管理措置 1-3）
//
//   ★★★2026-09-23 に 本番を 見て 分かった こと（Opus）──
//     ★掃除の 関数は あります（`purge_ops_audit_log` ／ `purge_code_attempts` ／
//       `purge_closed_school_logs`）。★けれど **誰も 呼んで いません**。
//     ★★`pg_cron` は 本番に 入って いません（★使える 一覧には あります）。
//
//   ★★★呼ぶ 仕組みを ここに 置く わけ
//     ★`pg_cron` を 入れると、★時を 刻む ところが 2つに なります
//       （★Vercel の cron と、★台帳の 中の cron）。
//     ★★この 家の ほかの 掃除（purge-deleted ／ purge-events ／ purge-audit）は、
//       ★ぜんぶ Vercel の cron です。★同じ 道に 揃えます。
//     ★★★増やすのは 1本 だけ です。★Hobby は 1日 100本まで 置けます。
//
//   ★★走った ことは `retention_runs` に 残ります（sql/42）。
//     ★出発の 朝は `retention_health()` を 見ます。
//     ★★どれかが 2日 以上 走って いなければ、★ここが 動いて いません。
//
//   ★★★1つが 失敗しても、★ほかは 走ります（★`run_retention` の 中の 決め）。
//     ★だから ここでは「何本 走ったか」と「失敗が あったか」を 返します。
// ============================================================================

export async function GET(req) {
  // ★★合言葉が 無い ときは 断ります（★ほかの cron と 同じ）。
  //   ★★無い まま くらべると、`Bearer undefined` を 送る だけで 誰でも 叩けます。
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET が設定されていません。掃除を実行しません。");
    return new Response("Not configured", { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("run_retention");
  if (error) {
    console.error("★掃除を 走らせられませんでした:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  const rows = Array.isArray(data) ? data : [];
  // ★★失敗した ぶんも 数えて 返します。★黙って 0件 成功に しません。
  const failed = rows.filter((r) => r && r.ok === false);
  if (failed.length > 0) {
    console.error("★掃除の うち 失敗した もの:", failed);
  }
  return Response.json({
    ok: failed.length === 0, ran: rows.length, failed: failed.length, rows
  });
}
