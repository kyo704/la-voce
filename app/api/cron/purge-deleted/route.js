import { createAdminClient } from "@/lib/supabase/admin";
import { purgeAccount, GRACE_PERIOD_DAYS } from "@/lib/accountDeletion";

// ============================================================================
// 猶予期間を過ぎた削除申請を、物理削除する（作業指示-公開前の実装.md A-4）
//
// Vercel Cron から毎日呼ばれる想定（vercel.json）。
// 認証は line-reminder と同じく CRON_SECRET で行う。外部から叩かれて
// 誰かのアカウントが消えることがあってはならない。
//
// ★1件が失敗しても、他の件を止めない。ただし失敗した本人の認証ユーザーは
//   消さない（purgeAccount がそう作られている）ので、翌日また拾われる。
// ============================================================================

export async function GET(req) {
  // ★CRON_SECRET が未設定のときは、必ず拒否すること。
  //   `Bearer ${process.env.CRON_SECRET}` は、未設定だと文字列
  //   "Bearer undefined" になる。その状態では Authorization に
  //   "Bearer undefined" を送るだけで、誰でもこの処理を実行できてしまう。
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET が設定されていません。定期処理を実行しません。");
    return new Response("Not configured", { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS * 86400000).toISOString();

  const { data: targets, error } = await admin
    .from("profiles")
    .select("id, deleted_at")
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff)
    .limit(100);   // 一度に片付けすぎない。残りは翌日拾う。

  if (error) {
    console.error("猶予明けの削除対象を取得できませんでした:", error);
    return new Response("Failed to list targets", { status: 500 });
  }

  const results = { purged: 0, failed: 0 };
  for (const t of targets || []) {
    const { ok, failures } = await purgeAccount(admin, t.id);
    if (ok) {
      results.purged += 1;
    } else {
      results.failed += 1;
      // 誰のものかは user_id で追える。健康データの中身はログに出さない。
      console.error(`猶予明けの削除に失敗しました user_id=${t.id}`, failures);
    }
  }

  console.log(`猶予明けの削除: ${results.purged}件を削除、${results.failed}件が失敗`);
  return Response.json(results);
}
