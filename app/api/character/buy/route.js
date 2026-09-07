import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { SHOP_ITEMS, POINTS_RULE_V2_FROM, DAILY_POINTS } from "@/lib/character";

// ============================================================================
// おうちの品物を、ポイントで受け取る（2026-09-07）
//
//   ★★なぜ、サーバへ移したか。
//     ★持ちぶんは「記録から作った合計 − 使ったぶん」で出しています。
//     ★「使ったぶん」（profiles.character_points_spent）を、
//       ★ブラウザから直に書けていました。
//     ★★小さく書き直せば、★記録しないままポイントが増えます。
//     ★お金は関わりません。★ただの自己申告でした。
//
//   ★これからは、★足すぶんを、サーバが決めます。
//     ★受け取るのは品物の名前だけです。★値段は、こちらが引きます。
//     ★★値段を受け取らないこと。★受け取ると、0円で買えます。
//
//   ★列そのものも、2枚で守ります（Opus）。
//     ① supabase/2026-09-08-profiles-サーバ側だけの列をトリガーで守る.sql
//     ② supabase/2026-09-08-profiles-列ごとの権限.sql
//     ★一覧の正は lib/profileServerOnlyColumns.js です。
//
//   ★★だから、この道は admin（RLS を通り抜ける鍵）で書きます。
//     ★本人であることは、★その前に、cookie で確かめています。
//     ★書くのは、★確かめた本人の行だけです（eq("id", user.id)）。
// ============================================================================

/**
 * ★受け取れるポイントの、★多く見積もった上限。
 *
 *   ★★ここで本当の合計を出そうとすると、
 *     ★行を entry に組み直す処理（rowToEntry）が要ります。
 *     ★それは画面の中にあり、★写すと2か所になります。
 *     ★★このリポジトリが、いちばん繰り返してきた壊れ方です。
 *
 *   ★代わりに、★絶対に本当の合計を下回らない数を出します。
 *     ・2026-08-27 以降は、★記録した日は一律 5 点
 *     ・それより前は、★どんなに書いても 1日 10 点まで
 *     ・初めて使った項目のごほうびは、★全部で 10 種 × 3 点 ＝ 30 点まで
 *
 *   ★★多めに見るので、★正しく貯めた方を、★決して止めません。
 *     ★止めるのは、★ありえない額まで使おうとしたときだけです。
 */
const LEGACY_MAX_PER_DAY = 10;
const FIRST_USE_MAX_TOTAL = 30;

async function ceilingOfEarned(admin, userId) {
  const { data, error } = await admin
    .from("entries")
    .select("date")
    .eq("user_id", userId);
  if (error) return null;
  let v2 = 0, legacy = 0;
  for (const r of data || []) {
    if (String(r.date) >= POINTS_RULE_V2_FROM) v2 += 1;
    else legacy += 1;
  }
  return v2 * DAILY_POINTS + legacy * LEGACY_MAX_PER_DAY + FIRST_USE_MAX_TOTAL;
}

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "品物を受け取るときの認証確認");
  // ★「確かめられなかった」と「入っておられない」を、分けます。
  if (unreachable) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  let body = null;
  try { body = await request.json(); } catch (e) { body = null; }
  const itemKey = body && typeof body.itemKey === "string" ? body.itemKey : null;
  if (!itemKey) return NextResponse.json({ error: "品物が指定されていません。" }, { status: 400 });

  // ★★値段は、サーバが引きます。★送られてきた数は、見ません。
  const item = SHOP_ITEMS.find((i) => i.key === itemKey);
  if (!item) return NextResponse.json({ error: "その品物はありません。" }, { status: 400 });
  const cost = Number(item.cost);
  if (!Number.isFinite(cost) || cost < 0) {
    return NextResponse.json({ error: "その品物は、いま受け取れません。" }, { status: 400 });
  }

  const admin = createAdminClient();

  // ★すでに持っておられるなら、★二重に引きません。
  //   ★★押し直し・通信のやり直しで、★2回引かれるのを止めます。
  const { data: had, error: hadError } = await admin
    .from("character_inventory")
    .select("item_key")
    .eq("user_id", user.id)
    .eq("item_key", itemKey)
    .limit(1);
  if (hadError) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  if (had && had.length > 0) {
    return NextResponse.json({ alreadyOwned: true }, { status: 200 });
  }

  const { data: prof, error: profError } = await admin
    .from("profiles")
    .select("character_points_spent")
    .eq("id", user.id)
    .single();
  if (profError || !prof) {
    return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  }
  const spent = Number(prof.character_points_spent) || 0;
  const nextSpent = spent + cost;

  // ★多く見積もった上限を、★超えていないか。
  //   ★★正しく貯めた方は、★ここで止まりません。
  const ceiling = await ceilingOfEarned(admin, user.id);
  if (ceiling != null && nextSpent > ceiling) {
    return NextResponse.json(
      { error: "いまは、ポイントが足りません。" },
      { status: 409 }
    );
  }

  // ★★先に持ち物へ入れます。
  //   ★こちらが失敗したら、★ポイントは引きません。
  //   ★逆にすると、★引かれたのに品物が無い、が起こります。
  const { error: invError } = await admin
    .from("character_inventory")
    .insert({ user_id: user.id, item_key: itemKey });
  if (invError) {
    return NextResponse.json({ error: "受け取れませんでした。" }, { status: 503 });
  }

  const { data: updated, error: updError } = await admin
    .from("profiles")
    .update({ character_points_spent: nextSpent })
    .eq("id", user.id)
    .select("character_points_spent");
  if (updError || !updated || updated.length === 0) {
    // ★★ここで止めても、★品物は、もうお手もとにあります。
    //   ★取り上げません（★「受け取ったものは取り上げない」）。
    //   ★次に受け取るときに、★同じ数から引き直されます。
    console.error("ポイントの記録に失敗しました:", updError, "user:", user.id);
    return NextResponse.json({ pointsSpent: spent, warned: true }, { status: 200 });
  }

  return NextResponse.json({ pointsSpent: Number(updated[0].character_points_spent) || nextSpent });
}
