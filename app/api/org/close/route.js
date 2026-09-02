import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { closeOrg, listOwnedOrgs } from "@/lib/orgClosure";
import { getUserWithTimeout } from "@/lib/withTimeout";

// ============================================================================
// 教室を閉じる（判断 2026-09-01 の追加要件）
//
//   出典 docs/lavoce-教室プラン仕様-複数教師と複数生徒.md §46
//        「owner … 課金・席の増減・★教室の削除」
//   ★仕様には最初からありましたが、★作られていませんでした（2026-09-01 に確認）。
//     退会を止める知らせが「教室を閉じてください」と言う以上、
//     ★閉じる手段が無いと、ただの締め出しになります。
//
//   ★なぜ管理者クライアントで消すのか
//     消す表が6つあり、そのすべてに DELETE のポリシーを足すことになります。
//     RLS を6か所ゆるめるより、★ここ1か所で「あなたはこの教室の
//     オーナーか」を確かめるほうが、あとから緩みません。
//
//   ★生徒さんの記録（entries）には、一切触れません。
//     消えるのは、教室そのもの／先生と生徒の紐付け／レッスンの予定だけです。
// ============================================================================

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "教室を閉じる認証確認");
  if (unreachable) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const orgId = typeof body.orgId === "string" ? body.orgId.trim() : "";
  if (!orgId) return NextResponse.json({ error: "教室が指定されていません。" }, { status: 400 });

  // 誤って押していないかの確認。★画面だけの確認では、
  //   リクエストを直接投げれば素通りします。
  if ((body.confirmation || "").trim() !== "閉じます") {
    return NextResponse.json(
      { error: "確認の入力が一致しません。「閉じます」とご入力ください。" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // ==========================================================================
  // ★本当にこの人の教室か。
  //   ★listOwnedOrgs（オーナーだけ）を使います。listOperatedOrgs ではありません。
  //     2026-09-02、退会の判定のほうは listOperatedOrgs（オーナー＋責任者）に
  //     変えましたが、★こちらは変えません。答えている問いが違います。
  //       退会：「この人が抜けると、困る教室はどれか」→ 責任者も含む
  //       ここ：「この教室を★閉じてよいのは誰か」    → オーナーだけ
  //     ★ここに責任者を足すと、責任者が教室を消せるようになります。
  //     閉じるのは取り返しがつきません。同じ関数で兼ねないこと。
  // ==========================================================================
  const owned = await listOwnedOrgs(admin, user.id);
  if (owned.error) {
    console.error("教室を閉じる：オーナーを確認できませんでした。", owned.error);
    return NextResponse.json(
      { error: "教室の状態を確認できませんでした。時間をおいて、もう一度お試しください。" },
      { status: 500 }
    );
  }
  if (!owned.orgIds.includes(orgId)) {
    // ★「あなたのものではない」と「そんな教室は無い」を分けません。
    //   分けると、教室の存在を確かめる道具になります。
    return NextResponse.json({ error: "この教室を閉じる権限がありません。" }, { status: 403 });
  }

  const failures = await closeOrg(admin, orgId);
  if (failures.length > 0) {
    console.error("教室を閉じる：一部を削除できませんでした。", { orgId, failures });
    return NextResponse.json(
      { error: "教室を閉じられませんでした。お手数ですが、時間をおいてもう一度お試しください。" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, orgId });
}
