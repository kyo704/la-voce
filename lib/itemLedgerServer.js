// ============================================================================
// 手に入れた日の台帳 ── 書き込む 側（★サーバの 道だけ）
//
//   ★出どころ supabase/2026-09-11-手に入れた日の台帳.sql
//
//   ★★なぜ 別の 一枚に するか。
//     lib/itemLedger.js は 画面からも 読みます（★言葉の 直し方が 要るため）。
//     こちらは ★admin の 鍵を 受け取ります。★画面から 呼べない ように、
//     入口を 分けておきます。
//     ★★lib/supabase/admin.js を 画面の 部品へ 持ち込まない、という
//       この 家の 決め（CLAUDE.md）と 同じ 考えです。
//
//   ★★この 一枚は、★失敗しても 投げません。
//     台帳は「あとで 見て うれしい もの」です。
//     ★品物を 受け取る ことより 大事では ありません。
//     ★書けなかったら、★日が 残らないだけです。★取り上げません。
// ============================================================================

import { LEDGER_TABLE } from "@/lib/itemLedger";

/**
 * ★台帳に 1行 足します。
 *
 *   ★★2度目は 静かに 落ちます。
 *     (user_id, item_key) に 一意の 縛りが あり、
 *     ignoreDuplicates で「あるなら 何も しない」に なります。
 *     ★これが「数え直して 減ることは ありません」の 形です。
 *     ★★上書きしません。★はじめの 日が 残ります。
 *
 * @param {object} admin  createAdminClient() の 返り
 * @param {object|null} row  buildAcquisition() の 返り
 * @returns {Promise<boolean>}  ★書けたら true
 */
export async function writeAcquisition(admin, row) {
  if (!admin || !row) return false;
  const { error } = await admin
    .from(LEDGER_TABLE)
    .upsert(row, { onConflict: "user_id,item_key", ignoreDuplicates: true });
  if (error) {
    console.error("台帳に残せませんでした:", error, "item:", row.item_key);
    return false;
  }
  return true;
}

/**
 * ★台帳を、まとめて 足します（★開いた ものは 一度に 何点も 来ます）。
 *   ★1つ 落ちても、★残りは 足します。
 */
export async function writeAcquisitions(admin, rows) {
  const list = (Array.isArray(rows) ? rows : []).filter(Boolean);
  if (!admin || list.length === 0) return 0;
  let done = 0;
  for (const row of list) {
    if (await writeAcquisition(admin, row)) done += 1;
  }
  return done;
}
