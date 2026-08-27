import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeAccount, severConnections } from "@/lib/accountDeletion";

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
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
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

  const admin = createAdminClient();
  const mode = body.mode === "now" ? "now" : "grace";

  if (mode === "now") {
    const { ok, failures } = await purgeAccount(admin, user.id);
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
