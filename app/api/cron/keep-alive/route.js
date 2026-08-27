import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// Supabase の自動停止よけ（無料プラン）
//
// ★調べた事実（推測ではありません）
//   Supabase 無料プランは「過去7日間のユーザーからのDB活動が少ない」
//   プロジェクトを停止します。判定は7日の窓で、公式ドキュメントは
//   「毎日数回のリクエストがあれば止まらない」としています。
//   https://supabase.com/docs/guides/platform/free-project-pausing
//
//   Vercel の Hobby プランは、cron を1日1回までしか実行できません
//   （それより短い式はデプロイ時に失敗します）。起動時刻も±59分ずれます。
//   https://vercel.com/docs/cron-jobs/usage-and-pricing
//
//   つまり「1日1回」が、Hobby で可能な最大であり、かつ Supabase の
//   7日の窓に対しては十分です。
//
// ★注意: 認証に失敗した cron は、DBに触れないまま終わります。
//   つまり活動として数えられません。CRON_SECRET が未設定・不一致のときは、
//   この停止よけも効きません。ログに残るようにしてあります。
// ============================================================================

export async function GET(req) {
  // ★CRON_SECRET が未設定のときは、必ず拒否すること（purge-deleted と同じ）。
  //   未設定だと `Bearer ${undefined}` は "Bearer undefined" という文字列になり、
  //   それを送るだけで誰でも叩けてしまう。
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET が設定されていません。停止よけを実行しません。");
    return new Response("Not configured", { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  // ★いちばん軽い読み取り。行の中身は要らないので、件数だけを頭で受け取る。
  //   誰のデータも読まず、1行も書き換えません。
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (error) {
    // 失敗しても、次の日にまた走る。ここで例外にして落とす必要はない。
    console.error("停止よけの読み取りに失敗しました:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, profiles: count ?? null, at: new Date().toISOString() });
}
