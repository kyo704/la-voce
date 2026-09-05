import { NextResponse } from "next/server";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { verifyPassword, reauthStillValid } from "@/lib/reauth";
import { sendEmailChangedNotice } from "@/lib/securityMail";

// ============================================================================
// メールアドレスの変更（★入れているうちに・2026-09-05）
//
//   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §2①・§7
//
//   ★★裁定は、★2つに分けています。
//     ① メールの変更（★まだ入れるうち）      ★作る    ← ★これです
//     ② 入れなくなってからの復旧              ★窓口は作らない
//                                              ★代わりに復旧コード（/recovery）
//
//   ★★①が抜けていました（2026-09-05 に気づきました）。
//     ★②だけがあり、★ふつうの変更ができませんでした。
//     ★アドレスを変えたい方が、★「メールを失った方」の道を通ることになります。
//
//   ★大事な操作の1つです（§4）。★もう一度、確かめます。
//   ★新旧の両方に、お知らせします（§7）。
// ============================================================================

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "メール変更の認証確認");
  if (unreachable) {
    return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const newEmail = String(body.newEmail || "").trim().toLowerCase();
  const oldEmail = String(user.email || "").trim().toLowerCase();
  if (!newEmail || !newEmail.includes("@")) {
    return NextResponse.json({ error: "メールアドレスをご確認ください。" }, { status: 400 });
  }
  if (newEmail === oldEmail) {
    return NextResponse.json(
      { error: "いまと同じアドレスです。" }, { status: 400 }
    );
  }

  // ★★もう一度の確かめ（§4 の4操作の1つ）。
  //   ★5分以内に確かめてあれば、また聞きません。
  //   ★★service role のクライアントは、★確かめてから作ります。
  let fresh = false;
  {
    const { data: prof, error } = await supabase
      .from("profiles").select("reauth_at").eq("id", user.id).maybeSingle();
    if (error) console.error("★確かめの時刻を読めませんでした:", error.message);
    else fresh = reauthStillValid(prof && prof.reauth_at, new Date());
  }
  if (!fresh) {
    const password = typeof body.password === "string" ? body.password : "";
    if (!password) {
      return NextResponse.json(
        { error: "パスワードをご入力ください。", needsPassword: true },
        { status: 401 }
      );
    }
    const ok = await verifyPassword({
      createPlainClient,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      email: oldEmail,
      password
    });
    if (!ok) {
      return NextResponse.json({ error: "パスワードが一致しません。" }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  // ★★確かめは、このあとの番号でします（/recovery と同じ形です）。
  //   ★2026-09-05 夜、★false のままで届いて通ることを、実機で確かめました。
  const { error: mailErr } = await admin.auth.admin.updateUserById(user.id, {
    email: newEmail,
    email_confirm: false
  });
  if (mailErr) {
    console.error("★アドレスを変えられませんでした:", mailErr.message);
    return NextResponse.json(
      { error: "いま、変更できません。少し置いて、もう一度お試しください。" },
      { status: 503 }
    );
  }

  // ★履歴。★足すだけです。★消しません（§7）。
  const { error: logErr } = await admin.from("email_change_log").insert({
    user_id: user.id,
    old_email: oldEmail,
    new_email: newEmail,
    via: "settings"
  });
  if (logErr) console.error("★履歴を残せませんでした:", logErr.message);

  // ★★新旧の両方に、お知らせします（§7）。
  //   ★古いほうにも送ります。★「まだ生きていた」場合が、いちばん危ないからです。
  const notified = await sendEmailChangedNotice({
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.FEEDBACK_FROM_EMAIL,
    oldEmail,
    newEmail,
    changedVia: "settings"
  });
  if (notified === 0) console.error("★変更のお知らせを送れませんでした");

  return NextResponse.json({ ok: true, notified }, { status: 200 });
}
