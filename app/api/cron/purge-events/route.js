import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_RETENTION_MONTHS } from "@/lib/events";

// ============================================================================
// 行動ログを13か月で消す（計測とユーザー調査仕様.md §3.5）
//
// ★削除ジョブは最初から入れておくこと、と仕様が指定しています。
//   あとから足すと、その時点で13か月より古いログが既に溜まっています。
// ============================================================================

export async function GET(req) {
  // ★CRON_SECRET が未設定のときは必ず拒否する（他の定期処理と同じ）。
  //   未設定だと "Bearer undefined" を送るだけで誰でも叩けてしまう。
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET が設定されていません。行動ログの削除を実行しません。");
    return new Response("Not configured", { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - EVENT_RETENTION_MONTHS);

  const { error, count } = await admin
    .from("events")
    .delete({ count: "exact" })
    .lt("at", cutoff.toISOString());

  if (error) {
    console.error("行動ログの削除に失敗しました:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, deleted: count ?? 0, cutoff: cutoff.toISOString() });
}
