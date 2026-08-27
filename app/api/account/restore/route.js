import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { graceDaysLeft } from "@/lib/accountDeletion";
import { getUserWithTimeout } from "@/lib/withTimeout";

// アカウントの復元（作業指示-公開前の実装.md A-4「30日間は復元できる」）。
// ★共有（先生とのつながり）は戻らない。申請の時点で切っているため。
//   復元できるのは本人の記録だけで、つながりは相手の同意なしに復活させない。
export async function POST() {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "復元の認証確認");
  // ★「確認できなかった」と「ログインしていない」を分ける。
  //   つながらないときに 401 を返すと、利用者は「ログインし直してください」と
  //   案内され、ログインもできず途方に暮れます。503 を返して、時間を置けば
  //   直ることを伝えます。
  if (unreachable) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const admin = createAdminClient();
  const { data: prof } = await admin.from("profiles").select("deleted_at").eq("id", user.id).maybeSingle();
  if (!prof || !prof.deleted_at) {
    return NextResponse.json({ ok: true, alreadyActive: true });
  }
  if (graceDaysLeft(prof.deleted_at) <= 0) {
    // 猶予を過ぎている。定期処理がまだ拾っていないだけなので、復元させない。
    return NextResponse.json({ error: "復元できる期間を過ぎています。" }, { status: 410 });
  }

  const { error } = await admin.from("profiles").update({ deleted_at: null }).eq("id", user.id);
  if (error) {
    console.error("アカウントの復元に失敗しました:", error);
    return NextResponse.json({ error: "復元できませんでした。時間をおいてもう一度お試しください。" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
