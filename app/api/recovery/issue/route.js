import { NextResponse } from "next/server";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { createRecoveryCode } from "@/lib/recoveryCodeServer";
import { verifyPassword, reauthStillValid } from "@/lib/reauth";

// ============================================================================
// 復旧コードを出す（2026-09-05）
//
//   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §3
//            docs/reports/2026-09-05-復旧コードの使い方-設計.md
//
//   ★★元のコードを、★こちらに残しません。
//     ★返すのは1度きりです。★保存するのは、ハッシュと塩だけです。
//     ★ログにも出しません。★出た瞬間、Vercel の記録に残ります。
//
//   ★2通りの呼ばれ方があります。
//     ・登録の直後   ★はじめての1本。★確かめは要りません
//     ・出し直し     ★★もう一度パスワードを確かめます（§4 の4操作の1つ）
//
//   ★1人1行です。★出し直すと上書きされ、★古いほうはその場で使えなくなります。
// ============================================================================

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "復旧コードの発行");
  if (unreachable) {
    return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const admin = createAdminClient();

  // ★すでに持っておられるかを、先に見ます。
  //   ★★持っていない方への1本目は、★確かめを求めません。
  //     ★登録の直後だからです。★ここで聞くと、始める前に止まります。
  //   ★持っている方の出し直しは、★取り返しがつきません（★古いのが死にます）。
  const { data: existing, error: peekErr } = await admin
    .from("recovery_codes").select("user_id").eq("user_id", user.id).maybeSingle();
  if (peekErr) {
    // ★★表がまだ無いときは、42P01 で来ます。
    //   ★黙って「持っていない」に倒さないこと。★出したつもりで、残りません。
    console.error("★復旧コードの表を読めませんでした:", peekErr.message);
    return NextResponse.json(
      { error: "いま、控えをお出しできません。少し置いて、もう一度お試しください。" },
      { status: 503 }
    );
  }

  const isReissue = !!existing;

  if (isReissue) {
    // ★★出し直しは、★もう一度確かめます。
    //   ★5分以内に確かめてあれば、また聞きません。
    let fresh = false;
    const { data: prof } = await supabase
      .from("profiles").select("reauth_at").eq("id", user.id).maybeSingle();
    fresh = reauthStillValid(prof && prof.reauth_at, new Date());

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
        email: user.email,
        password
      });
      if (!ok) {
        return NextResponse.json({ error: "パスワードが一致しません。" }, { status: 401 });
      }
    }
  }

  const { code, salt, hash } = await createRecoveryCode();

  // ★1人1行です。★上書きします。★★古いほうは、この瞬間に使えなくなります。
  const { error } = await admin.from("recovery_codes").upsert({
    user_id: user.id,
    code_hash: hash,
    code_salt: salt,
    issued_at: new Date().toISOString(),
    used_at: null,
    failed_attempts: 0,
    locked_until: null
  }, { onConflict: "user_id" });

  if (error) {
    console.error("★復旧コードを保存できませんでした:", error.message);
    // ★★保存できていないコードを、★返さないこと。
    //   ★お客さまは、★使えない番号を書き写すことになります。
    return NextResponse.json(
      { error: "いま、控えをお出しできません。少し置いて、もう一度お試しください。" },
      { status: 503 }
    );
  }

  // ★★返すのは、この1度きりです。★こちらには残っていません。
  return NextResponse.json({ code, reissued: isReissue }, { status: 200 });
}
