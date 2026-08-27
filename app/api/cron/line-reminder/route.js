// このファイルは app/api/cron/line-reminder/route.js として配置してください。
//
// 実行順マスター Stage 2-3・毎朝のリマインド。Vercel Cronから毎朝呼び出される想定。
// 【対象】LINE連携済み(line_user_idがある)・通知が有効(line_notification_enabled=true)・
// かつ「今日まだ記録していない」ユーザーだけに送る。記録済みの人に送ると鬱陶しいだけなので、
// 送る前に必ずその日のentriesの有無を確認する。
//
// 【認証】Vercel Cronからの呼び出しであることを、CRON_SECRET環境変数で確認する
// （外部から誰でもこのURLを叩いてリマインドを乱発できないようにするため）。

import { createAdminClient } from "@/lib/supabase/admin";

function todayISO() {
  const d = new Date();
  // 日本時間を基準にする（実行順マスターの想定ユーザーは日本在住のため）。
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

async function pushMessage(lineUserId, text) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text }]
    })
  });
}

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
  const today = todayISO();

  const { data: targets, error: profilesError } = await admin
    .from("profiles")
    .select("id, line_user_id")
    .not("line_user_id", "is", null)
    .eq("line_notification_enabled", true);

  if (profilesError) {
    return new Response(JSON.stringify({ error: profilesError.message }), { status: 500 });
  }

  let sentCount = 0;
  for (const p of targets || []) {
    const { data: todayEntry } = await admin
      .from("entries")
      .select("date")
      .eq("user_id", p.id)
      .eq("date", today)
      .maybeSingle();

    if (todayEntry) continue; // 既に今日記録済みの人には送らない

    await pushMessage(p.line_user_id, "おはようございます。今日の声・喉の調子を、30秒だけ記録してみませんか？\nhttps://la-voce.vercel.app/");
    sentCount += 1;
  }

  return new Response(JSON.stringify({ ok: true, sentCount, totalTargets: (targets || []).length }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
