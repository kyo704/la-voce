import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { BOX2_KEYS, box2Rounds, box2ReceivedCount, pickBox2Choices } from "@/lib/wardrobeBoxes";
import { REDRAWN_AS } from "@/lib/legacyWearables";

// ============================================================================
// 記録がたまったときの、よそおいを受け取る（2026-09-07）
//
//   ★出どころ docs/opus/woolsong-裁定-219点の分け方と、追加38項目の安全性（9月7日・夜）.md §5
//
//   ★★ポイントは、1点も動きません。
//     ★箱2に、★値段はありません（★9月7日・坂本さんの決め）。
//     ★値段を付けると、★「あと何点」を数えたくなります。
//     ★数えたくなる形を、★はじめから作りません。
//
//   ★★受け取れるかどうかは、★サーバが数えます。
//     ★画面が「受け取れます」と言ってきても、★それは見ません。
//     ★記録の日数と、★もう持っているものから、★こちらで出し直します。
//
//   ★★お見せした3点の中からしか、★受け取れません。
//     ★鍵だけ差し替えて、★好きな品を取れないようにします。
// ============================================================================

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "よそおいを受け取るときの認証確認");
  if (unreachable) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  let body = null;
  try { body = await request.json(); } catch (e) { body = null; }
  const itemKey = body && typeof body.itemKey === "string" ? body.itemKey : null;
  if (!itemKey) return NextResponse.json({ error: "品物が指定されていません。" }, { status: 400 });
  if (!BOX2_KEYS.includes(itemKey)) {
    return NextResponse.json({ error: "その品物は、ここでは受け取れません。" }, { status: 400 });
  }

  const admin = createAdminClient();

  // ★記録した日数を数えます。★画面から受け取りません。
  const { data: rows, error: rowsError } = await admin
    .from("entries")
    .select("date")
    .eq("user_id", user.id);
  if (rowsError) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  const recordedDays = (rows || []).length;

  // ★もう持っているものを読みます。
  const { data: inv, error: invError } = await admin
    .from("character_inventory")
    .select("item_key")
    .eq("user_id", user.id);
  if (invError) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  const owned = (inv || []).map((r) => r.item_key);

  if (owned.includes(itemKey)) {
    return NextResponse.json({ alreadyOwned: true }, { status: 200 });
  }

  const received = box2ReceivedCount(owned, REDRAWN_AS);
  const rounds = box2Rounds(recordedDays);
  if (rounds <= received) {
    return NextResponse.json(
      { error: "いまは、受け取れるものがありません。" },
      { status: 409 }
    );
  }

  // ★★お見せした3点の中か。★同じ回なら、いつ計算しても同じ3点です。
  const round = received + 1;
  const choices = pickBox2Choices(owned, round);
  if (!choices.includes(itemKey)) {
    return NextResponse.json(
      { error: "その品物は、いまお選びいただけるものではありません。" },
      { status: 400 }
    );
  }

  const { error: insError } = await admin
    .from("character_inventory")
    .insert({ user_id: user.id, item_key: itemKey });
  if (insError) {
    return NextResponse.json({ error: "受け取れませんでした。" }, { status: 503 });
  }

  // ★★ポイントには、★触れていません。★これが、この道の要点です。
  return NextResponse.json({ itemKey });
}
