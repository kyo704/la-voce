import { createAdminClient } from "@/lib/supabase/admin";
import {
  GO_LIVE_DATE, NOTICE_STARTS_AT, MAIL_KEY, noticeIsDue, mayMail,
  MAIL_SUBJECT, mailBody
} from "@/lib/pricingNotice";

// ============================================================================
// 有料化のお知らせ ── メールを送る
//
//   ★★数えるだけが、★既定です。★送るには ?send=1 が要ります。
//     ★メールは、取り消せません。★うっかり流さないための形です。
//     ★まず数えて、★宛先の数を坂本さんにご確認いただいてから送ります。
//
//   ★★二度送らないこと。
//     ★user_notices に、★1人ずつ「送った」を残します（MAIL_KEY）。
//     ★途中で落ちても、★次に流したとき、★残っている方だけに送ります。
//     ★★送る前に残すのではなく、★送れてから残します。
//       ★先に残すと、★落ちたときに「送ったことになって」届きません。
//
//   ★★日付が決まるまで、★1通も送りません。
//     ★GO_LIVE_DATE が null のあいだは、★数えるだけです。
//
//   ★認証は、ほかの定期処理と同じです。★未設定なら 503。
// ============================================================================

// ★1回に送る数。★Resend の制限に当てないための足かせです。
const BATCH = 40;

export async function GET(req) {
  // ★CRON_SECRET が未設定のときは、必ず拒否すること。
  //   未設定だと `Bearer ${undefined}` が "Bearer undefined" になり、
  //   その文字列を送るだけで誰でも実行できてしまう。
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET が設定されていません。お知らせを送りません。");
    return new Response("Not configured", { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  // ★★既定は「数えるだけ」です。★送るには、はっきり ?send=1 と書きます。
  const reallySend = url.searchParams.get("send") === "1";
  const todayISO = new Date().toISOString().slice(0, 10);

  const admin = createAdminClient();

  // ★★宛先を組み立てます。★profiles と、認証の側のメールを突き合わせます。
  const { data: profiles, error: pErr } = await admin
    .from("profiles").select("id, is_internal, deleted_at");
  if (pErr) {
    console.error("★profiles を読めませんでした:", pErr.message);
    return Response.json({ ok: false, where: "profiles", error: pErr.message }, { status: 500 });
  }
  const byId = new Map((profiles || []).map((p) => [p.id, p]));

  // ★★すでに送った方を、外します。
  const { data: sentRows, error: sErr } = await admin
    .from("user_notices").select("user_id").eq("notice_key", MAIL_KEY);
  if (sErr) {
    console.error("★送信済みを読めませんでした:", sErr.message);
    return Response.json({ ok: false, where: "user_notices", error: sErr.message }, { status: 500 });
  }
  const alreadySent = new Set((sentRows || []).map((r) => r.user_id));

  // ★★メールは、認証の側にあります。★ページ送りです。
  //   ★1ページだけ読むと、多いときに取りこぼします。
  const targets = [];
  let page = 1;
  for (;;) {
    const { data: authPage, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error("★利用者の一覧を読めませんでした:", error.message);
      return Response.json({ ok: false, where: "listUsers", error: error.message }, { status: 500 });
    }
    const users = (authPage && authPage.users) || [];
    if (users.length === 0) break;
    for (const u of users) {
      if (alreadySent.has(u.id)) continue;
      if (!mayMail(byId.get(u.id), u.email)) continue;
      targets.push({ id: u.id, email: u.email });
    }
    if (users.length < 200) break;
    page += 1;
  }

  // ★★ここまでは、★1通も送っていません。
  const summary = {
    ok: true,
    goLiveDate: GO_LIVE_DATE,
    noticeStartsAt: NOTICE_STARTS_AT,
    today: todayISO,
    due: noticeIsDue(todayISO),
    alreadySent: alreadySent.size,
    targets: targets.length,
    sent: 0,
    failed: 0,
    mode: reallySend ? "send" : "count-only"
  };

  // ★★日付が決まっていないうちは、★数えるだけで終わります。
  if (!reallySend) return Response.json(summary);
  if (!GO_LIVE_DATE) {
    return Response.json({ ...summary, ok: false,
      reason: "GO_LIVE_DATE が決まっていません。送りません。" }, { status: 409 });
  }
  if (!noticeIsDue(todayISO)) {
    return Response.json({ ...summary, ok: false,
      reason: "知らせ始める日より前です。送りません。" }, { status: 409 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FEEDBACK_FROM_EMAIL;
  if (!apiKey || !from) {
    return Response.json({ ...summary, ok: false,
      reason: "メールの設定がありません。" }, { status: 503 });
  }

  const label = `${Number(GO_LIVE_DATE.slice(5, 7))}月${Number(GO_LIVE_DATE.slice(8, 10))}日`;
  const link = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/legal/tokushoho`;
  const body = mailBody(label, link);

  // ★★1回に送る数を、区切ります。★残りは、次に流したときに送ります。
  for (const t of targets.slice(0, BATCH)) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: t.email, subject: MAIL_SUBJECT, text: body })
      });
      if (!res.ok) {
        // ★★黙らないこと。★止めないことと、黙ることは、別です。
        const detail = await res.text();
        console.error("★送れませんでした:", t.id, res.status, detail.slice(0, 200));
        summary.failed += 1;
        continue;
      }
      // ★★送れてから、残します。★先に残すと、落ちたときに届きません。
      const { error: markErr } = await admin.from("user_notices")
        .insert({ user_id: t.id, notice_key: MAIL_KEY, shown_at: new Date().toISOString() });
      if (markErr) {
        // ★★ここで落ちると、★次に流したとき、もう一度送ってしまいます。
        //   ★だから、はっきり残します。
        console.error("★送信済みを残せませんでした（★二重送信の恐れ）:", t.id, markErr.message);
      }
      summary.sent += 1;
    } catch (e) {
      console.error("★送信中の例外:", t.id, e && e.message);
      summary.failed += 1;
    }
  }
  summary.remaining = Math.max(0, targets.length - summary.sent);
  return Response.json(summary);
}
