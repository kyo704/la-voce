import { NextResponse } from "next/server";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeAccount, severConnections } from "@/lib/accountDeletion";
import { classifyOwnedOrgs, departingOwnerNotice, departingPayerNotice } from "@/lib/orgClosure";
import { OPERATOR_CONTACT_EMAIL } from "@/lib/brand";
import { getUserWithTimeout } from "@/lib/withTimeout";

// ============================================================================
// アカウントの削除（統合実行ルートv4 G3-17 / 作業指示-公開前の実装.md A-4）
//
// mode = "grace"（既定）… 30日の猶予に入れる。誤操作の救済（A-4）。
//                          ★共有だけは即座に切る（教室の側から見えなくなるのは
//                            即時。30日待たない、と A-4 が明記している）
// mode = "now"          … その場で物理削除する（A-4 の「今すぐ完全に削除する」）
//
// 実際の削除の中身は lib/accountDeletion.js に置いてある。猶予明けの定期処理
// （/api/cron/purge-deleted）と同じ処理を使うため。2通りに分かれるとズレる。
// ============================================================================

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "削除の認証確認");
  // ★「確認できなかった」と「ログインしていない」を分ける。
  //   つながらないときに 401 を返すと、利用者は「ログインし直してください」と
  //   案内され、ログインもできず途方に暮れます。503 を返して、時間を置けば
  //   直ることを伝えます。
  if (unreachable) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  // 本人確認。画面で入力させた文字列を、ここでもう一度突き合わせる。
  // 画面側だけの確認では、リクエストを直接投げれば素通りしてしまう。
  const typed = (body.confirmation || "").trim();
  const okByEmail = typed.toLowerCase() === (user.email || "").toLowerCase();
  const okByPhrase = typed === "削除します";
  if (!okByEmail && !okByPhrase) {
    return NextResponse.json(
      { error: "確認の入力が一致しません。登録メールアドレス、または「削除します」と入力してください。" },
      { status: 400 }
    );
  }

  // ==========================================================================
  // ★本人確認（判断の回答-年齢確認とアカウント削除-20260830.md §2）
  //
  //   上の確認の入力（メールアドレス or「削除します」）は、
  //   ★「間違えて押していないか」を確かめるものです。
  //     どちらも画面に出ているので、端末を一時的に触れる人なら通せます。
  //   ★パスワードは「本人かどうか」を確かめます。目的が違います。
  //
  //   ★猶予つきの削除にも要求します。猶予中でも severConnections が
  //     すぐ走り、先生との共有は戻りません（＝取り返しがつかない）。
  //     「今すぐ」だけ守っても意味がありません。
  //
  //   ★セッションを持たないクライアントで確かめます。
  //     cookie 付きのクライアントで signInWithPassword を呼ぶと、
  //     いまのセッションを書き換えてしまいます。
  // ==========================================================================
  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json({ error: "パスワードをご入力ください。" }, { status: 400 });
  }
  const verifier = createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
  const { error: pwError } = await verifier.auth.signInWithPassword({
    email: user.email, password
  });
  if (pwError) {
    // ★理由を細かく分けないこと。「このメールは存在する」を漏らさないためです。
    return NextResponse.json({ error: "パスワードが一致しません。" }, { status: 401 });
  }

  const admin = createAdminClient();
  const mode = body.mode === "now" ? "now" : "grace";

  // ==========================================================================
  // ★教室の確認（判断 2026-09-01・追加要件）
  //
  //   オーナーが抜けると、その教室は契約者のいない状態になります。
  //   ほかに人がいる教室では、退会を★ここで止めます。
  //
  //   ★猶予つきの削除でも止めます。猶予でも severConnections が
  //     すぐ走り、先生と生徒の紐付けは戻りません。
  //     「今すぐ」だけ止めても、意味がありません。
  //   ★閉じ込めるためではありません。順番の話です。
  //     「教室を閉じる」は、この画面から自分でできます。
  // ==========================================================================
  const orgs = await classifyOwnedOrgs(admin, user.id);
  if (orgs.error) {
    console.error("アカウント削除：教室を確認できませんでした。", orgs.error);
    return NextResponse.json(
      { error: "教室の状態を確認できませんでした。時間をおいて、もう一度お試しください。" },
      { status: 500 }
    );
  }
  if (orgs.blocked.length > 0) {
    return NextResponse.json({
      blocked: true,
      orgs: orgs.blocked.map((o) => ({ ...o, notice: departingOwnerNotice(o.otherCount) }))
    }, { status: 409 });
  }

  // ==========================================================================
  // ★止めないけれど、契約者が居なくなる教室（2026-09-02・Opus の裁定）
  //
  //   ★「教室を動かせるか」と「誰が払うか」は、別の問いです。
  //     責任者が残っていれば教室は動くので、★止めません。
  //     ですが契約者は居なくなるので、★黙っても通しません。
  //
  //   ★一度だけ知らせて、了解したら進みます。
  //     消したあとに知らせても、意味がありません。
  //   ★生徒には出ません。生徒は契約者ではないので、payer に入りません。
  // ==========================================================================
  if (orgs.payer.length > 0 && !body.acknowledgePayerNotice) {
    return NextResponse.json({
      payerNotice: true,
      orgs: orgs.payer.map((o) => ({
        ...o, notice: departingPayerNotice(o, OPERATOR_CONTACT_EMAIL)
      }))
    }, { status: 409 });
  }

  if (mode === "now") {
    const { ok, failures, blocked, countRecorded, countError } = await purgeAccount(admin, user.id);
    // ★数えられなかったことは、削除の失敗ではありません。返り値には出しますが、
    //   利用者には見せません（消えたことが大事で、数は運営の都合です）。
    //   ★ただし、黙って捨てません。ここでログに残します。
    if (ok && countRecorded === false) {
      console.error("★アカウントは削除できましたが、件数を記録できませんでした。", { countError });
    }
    if (!ok && blocked && blocked.length > 0) {
      // ★上の確認をすり抜けた場合の受け皿（同時に誰かが教室へ入った、など）
      return NextResponse.json({
        blocked: true,
        orgs: blocked.map((o) => ({ ...o, notice: departingOwnerNotice(o.otherCount) }))
      }, { status: 409 });
    }
    if (!ok) {
      console.error("アカウント削除：一部のデータを削除できませんでした。", failures);
      return NextResponse.json(
        { error: "一部のデータを削除できませんでした。お手数ですが、時間をおいてもう一度お試しください。" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, mode: "now" });
  }

  // ---- 猶予期間に入れる ----
  // ★共有は待たずに切る。削除を申し出た人の記録が、30日ものあいだ
  //   先生の画面に出続けるのは受け入れられない（A-4）。
  const severFailures = await severConnections(admin, user.id);
  if (severFailures.length > 0) {
    console.error("アカウント削除：共有の解除に失敗しました。", severFailures);
    return NextResponse.json(
      { error: "共有の解除に失敗したため、削除を中断しました。時間をおいてもう一度お試しください。" },
      { status: 500 }
    );
  }

  const { error: markError } = await admin
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", user.id);
  if (markError) {
    console.error("アカウント削除：削除の申請を記録できませんでした。", markError);
    return NextResponse.json(
      { error: "削除を受け付けられませんでした。supabase/migration_account_soft_delete.sql が未実行の可能性があります。" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, mode: "grace" });
}
