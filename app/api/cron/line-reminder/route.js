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
import { absoluteUrl } from "@/lib/baseUrl";
import { mayCall, QUIET_BEFORE_DAYS, QUIET_AFTER_DAYS } from "@/lib/quietDays";

/** ★ISO の 日付を ずらします。★UTC で 組み立てます（★時差で ずれないため）。 */
function shiftISO(iso, days) {
  const t = Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  return new Date(t + days * 86400000).toISOString().slice(0, 10);
}

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

  // ★★静かにする期間（★2026-09-09・坂本さんのご指示・最優先）。
  //   ★★本番の 3日前〜翌々日は、★こちらから 呼びに行きません。
  //     ★いちばん張りつめている 数日に、★催促を 足さないためです。
  //   ★★決めるのは lib/quietDays.js だけです。★ここで 日を 数えません。
  //   ★★1人ずつ 尋ねません。★窓のぶんを 1回で 引きます。
  //     ★人数ぶん 尋ねると、★増えたときに 時間切れで 誰にも 届かなくなります。
  //   ★今日が 静かに なる本番は、★[今日-翌々日, 今日+3日前] の 間にあります。
  const windowFrom = shiftISO(today, -QUIET_AFTER_DAYS);
  const windowTo = shiftISO(today, QUIET_BEFORE_DAYS);
  const { data: perfRows, error: perfError } = await admin
    .from("performances")
    .select("user_id, performed_on")
    .gte("performed_on", windowFrom)
    .lte("performed_on", windowTo);
  // ★★読めなかったときは、★送りません（★fail closed）。
  //   ★★読めないまま 送ると、★静かにする約束を 破ります。
  //     ★★届かない日が 1日 あるより、★張りつめた日に 催促が 届くほうが 重い。
  if (perfError) {
    console.error("本番の日を読めませんでした。静かにする期間を守れないため、送信を見送ります:", perfError);
    return new Response(JSON.stringify({ error: perfError.message, sentCount: 0 }), { status: 500 });
  }
  const perfByUser = new Map();
  (perfRows || []).forEach((r) => {
    if (!r || !r.user_id || !r.performed_on) return;
    const list = perfByUser.get(r.user_id) || [];
    list.push(r.performed_on);
    perfByUser.set(r.user_id, list);
  });

  let sentCount = 0;
  let quietCount = 0;
  for (const p of targets || []) {
    // ★★静かにする日は、★記録の有無を 尋ねる前に 抜けます。
    //   ★尋ねる必要が ありません。★どちらでも 送らないからです。
    if (!mayCall(today, perfByUser.get(p.id))) { quietCount += 1; continue; }
    const { data: todayEntry } = await admin
      .from("entries")
      .select("date")
      .eq("user_id", p.id)
      .eq("date", today)
      .maybeSingle();

    if (todayEntry) continue; // 既に今日記録済みの人には送らない

    // ★URLを直書きしない（ドメイン切替 §3）。ここに書くと、ドメインを変えたとき
    //   利用者の手元に届くリンクだけが古いまま残る。いちばん気づきにくい形。
    await pushMessage(p.line_user_id,
      `おはようございます。今日の声・喉の調子を、30秒だけ記録してみませんか？\n${absoluteUrl("/")}`);
    sentCount += 1;
  }

  // ★quietCount は 数えた数です。★誰かに 見せる 数では ありません。
  //   ★静かにできているかを、★こちらで 確かめるためだけに 返します。
  return new Response(JSON.stringify({ ok: true, sentCount, quietCount, totalTargets: (targets || []).length }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
