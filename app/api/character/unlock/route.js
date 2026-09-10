import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { unlockedFromSummary, unlockSummaryFromRows } from "@/lib/character";
import { UNLOCKS } from "@/lib/sheepWardrobe";
import { ACQUIRED_BY, COUNT_KIND, LEDGER_TABLE, buildAcquisition } from "@/lib/itemLedger";
import { writeAcquisitions } from "@/lib/itemLedgerServer";

// ============================================================================
// 開いた ものを、台帳に 残す（★J05・2026-09-11）
//
//   ★★手に入る 道は 3つ あります。
//     ・買う（/api/character/buy）      … 点で
//     ・贈られる（/api/character/gift）  … 箱②
//     ・開く（ここ）                    … 条件が 揃って
//
//   ★★開く ものだけ、★これまで 行が 立ちませんでした。
//     computeUnlocked() が、★その場で 計算していたからです。
//     ★だから「いつ 開いたか」が、どこにも 残っていません。
//     ★★きょう 開いた ものの 日は、きょうしか 分かりません。
//
//   ★★画面から「開きました」を 受け取りません。
//     受け取ると、★書いていない 方の 台帳に、★好きな 日を 入れられます。
//     ★★ここで 数え直します。★受け取るのは、呼ばれた という ことだけです。
//
//   ★★何度 呼ばれても、増えません。
//     (user_id, item_key) に 一意の 縛りが あり、
//     2度目は 静かに 落ちます（★lib/itemLedgerServer.js）。
//     ★はじめの 日が 残ります。★上書きしません。
//
//   ★★台帳は、★持ち物を 決めません。
//     何を 着られるかは、これまでどおり computeUnlocked() が 決めます。
//     ここが 失敗しても、★品物は 手もとに あります。
// ============================================================================

export async function POST() {
  const supabase = createClient();
  const { data: { user } = {}, error: authError } = await getUserWithTimeout(supabase);
  if (authError || !user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const admin = createAdminClient();

  // ★見どころを、★こちらで 数えます。
  //   ★★列を 絞りません。★「何種類 触れたか」は、★列の 数そのものです。
  const { data: rows, error: rowsError } = await admin
    .from("entries")
    .select("*")
    .eq("user_id", user.id);
  if (rowsError) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });

  const { data: prof, error: profError } = await admin
    .from("profiles")
    .select("practice_goal, practice_reviews")
    .eq("id", user.id)
    .single();
  if (profError) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });

  const summary = unlockSummaryFromRows(rows || [], prof);
  const unlocked = unlockedFromSummary(summary);
  if (unlocked.size === 0) return NextResponse.json({ written: 0 });

  // ★すでに 台帳に ある ものは、★組み立てません。
  //   ★★一意の 縛りが あるので 二重には なりませんが、
  //     ★要らない 書き込みを 出しません。
  const { data: had, error: hadError } = await admin
    .from(LEDGER_TABLE)
    .select("item_key")
    .eq("user_id", user.id)
    .eq("acquired_by", ACQUIRED_BY.UNLOCK);
  if (hadError) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  const already = new Set((had || []).map((r) => r.item_key));

  // ★その 鍵で 開く 品を、★台帳の 1行に します。
  //   ★★数は、その 鍵が 見ている ものを 出します。
  //     本番の 鍵なら「本番 ◯回」、それ以外は「記録 ◯日」です。
  //     ★見本の「燕尾服　8月24日　本番 3回」が、これです。
  const recordedDays = (rows || []).length;
  const rowsToWrite = [];
  for (const flag of unlocked) {
    const keys = UNLOCKS[flag] || [];
    const byPerformance = flag === "firstPerformance" || flag === "performances10";
    for (const itemKey of keys) {
      if (already.has(itemKey)) continue;
      rowsToWrite.push(buildAcquisition({
        userId: user.id,
        itemKey,
        acquiredBy: ACQUIRED_BY.UNLOCK,
        countKind: byPerformance ? COUNT_KIND.PERFORMANCES : COUNT_KIND.RECORD_DAYS,
        countValue: byPerformance ? summary.performances : recordedDays
      }));
    }
  }

  const written = await writeAcquisitions(admin, rowsToWrite);
  return NextResponse.json({ written });
}
