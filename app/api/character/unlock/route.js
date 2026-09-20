import { COLS_ENTRIES } from "@/lib/dbColumns";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { unlockedFromSummary, unlockSummaryFromRows, goalPartOf } from "@/lib/character";
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
  // ★★2026-09-11、★同じ まちがいが ここにも ありました。
  //   ★getUserWithTimeout は { user, unreachable } を 返します。
  //   ★★台帳に「開いた もの」が 1件も 入っていなかった 理由が これです。
  const { user, unreachable } = await getUserWithTimeout(supabase, "開いたものを台帳に残すときの認証確認");
  if (unreachable) {
    return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const admin = createAdminClient();

  // ★見どころを 数えます。
  //
  // ★★2026-09-14（★No.019.5・裁定 その61）、★数えるのを 台帳へ 移しました。
  //
  //   ★★これまでは `select("*")` でした。★理由は 書いて ありました ──
  //     「★列を 絞りません。★『何種類 触れたか』は、★列の 数そのものです」。
  //     ★★それ自体は 正しい 理屈です。★けれど、★要るのは ★列の 数であって、
  //       ★★中身では ありません。
  //
  //   ★★2026-09-14、★本番の x-vercel-id を 測りました。
  //     ★静的 hnd1（東京）／★関数 iad1（米国バージニア）。
  //     ★★つまり、★ご本人の 記録の 全列が、★押す たびに 米国へ 渡って、
  //       ★`v == null` かどうかだけ 見られて、★捨てられて いました。
  //
  //   ★★`character_unlock_summary` は、★3つの 数だけを 返します。
  //     ★記録の 中身は ★1つも 出ません。
  //
  // ★★紙（supabase/migration_no019_5_entry_stats.sql）が まだ なら、
  //   ★古い 道へ 落ちます。★ごほうびが 止まらない ため です。
  //   ★★ずれる 向きは「まだ 開かない」であって、★「消える」では ありません
  //     （★下の 台帳に 既に ある ものは、★組み立て直しません）。
  // ★★★p_user_id は、★その場の ログインの id です（★2026-09-15・No.024）。
  //   ★★この `POST()` は **引数を 持ちません**。★本文を 1度も 読みません。
  //     ★★だから、★呼び手が id を 差し替える 道が ありません。
  //   ★★`user` は `getUserWithTimeout()` が 返した もの ──
  //     ★入れ物つきの サーバ用の 鍵で、★`auth.getUser()` を 引いて います。
  //   ★★★ここを 変える ときは、★先に 読んで ください ──
  //     ★要求の 本文から 取った 値を 渡しては いけません。
  //     ★★この 関数は「ある 1人に 結びついた 値」を 返します。
  //       ★まちがった id を 渡せば、★よその 方の 数が 返ります。
  //     ★★関数は 呼び手が 誰かを 確かめられません
  //       （★service_role の 下では auth.uid() は null）。
  //       ★関数が できるのは「その人が 居るか」を 見る ことだけ です。
  //     ★★見張り `unlock-caller-session-id.test.js` が 数えて います。
  const { data: sumRow } = await admin.rpc("character_unlock_summary", { p_user_id: user.id });
  let rows = null;
  if (!sumRow) {
    // ★★ここに 来るのは、★紙が まだ 流れて いない ときだけ です。
    const legacy = await admin
      .from("entries")
      // ★★列を 名ざしで 引きます（★裁定 その113 §5-1・2026-09-20）。
      .select(COLS_ENTRIES)
      .eq("user_id", user.id);
    if (legacy.error) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
    rows = legacy.data;
  }

  const { data: prof, error: profError } = await admin
    .from("profiles")
    .select("practice_goal, practice_reviews")
    .eq("id", user.id)
    .single();
  if (profError) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });

  // ★台帳が 数えた ときは、★目標の ぶんだけ こちらで 足します。
  //   ★`goalPartOf` は profiles を 見る ものなので、★entries とは 別の 話です。
  //   ★★書き写しません。★lib/character.js の ものを そのまま 呼びます。
  //     ★★同じ 決めを 2か所に 置くと、★片方だけ 直った 形に なります。
  const summary = sumRow
    ? {
        performances: Number(sumRow.performances) || 0,
        hasPianissimo: !!sumRow.hasPianissimo,
        fieldKinds: Number(sumRow.fieldKinds) || 0,
        ...goalPartOf(prof)
      }
    : unlockSummaryFromRows(rows || [], prof);
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
