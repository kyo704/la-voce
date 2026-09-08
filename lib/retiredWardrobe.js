// ============================================================================
// 棚から下げた 着せかえの品（2026-09-08 夜）
//
//   ★★新しい絵に 置き換わった品を、★一覧から 下げます。
//
//   ★★消しません。★下げるだけです。
//     ・★絵は 残します（public/sheep/items/ に あるまま）
//     ・★名簿からも 消しません
//     ・★いま 着ている方は、★そのまま 着ていられます
//     ★★受け取ったものを、こちらから 取り上げないためです。
//
//   ★★2026-09-08、★Opus から マフラー28点（scarf_01〜28）が 届きました。
//     ★manifest の supersedes に、こう 書かれています。
//       「neck_01 マフラー ／ neck_02 チェックのマフラー ／ neck_03 ストール
//         （★この3点は隠してください）」
//     ★★古い3点は「あご下を1色で塗って、下に長方形を1枚」でした。
//       ★新しい28点は「巻いた布を 筒として描く」形です。
//
//   ★★この決めは、ここ1か所です。
//     ★一覧を作る側（lib/drawerItems.js）が、ここを 見ます。
//     ★画面では 判じません。
//
//   ★見張り components/tests/retired-wardrobe.test.js
// ============================================================================

/**
 * ★棚から下げた 品の 鍵。
 *
 *   ★★下げた理由も 一緒に 置きます。
 *     ★あとから「なぜ出ないのか」を 探さずに 済むようにします。
 */
export const RETIRED = Object.freeze({
  neck_01: "scarf_01〜28 に 置き換わりました（★2026-09-08・scarf-v1）",
  neck_02: "scarf_01〜28 に 置き換わりました（★2026-09-08・scarf-v1）",
  neck_03: "scarf_01〜28 に 置き換わりました（★2026-09-08・scarf-v1）"
});

/** ★棚から下げた品か。 */
export function isRetired(key) {
  return Object.prototype.hasOwnProperty.call(RETIRED, key);
}

/**
 * ★一覧から、下げた品を 取り除きます。
 *
 *   ★★いま 着ている品は、★残します。
 *     ★★着ているのに 一覧から 消えると、
 *     ★「外したいのに 押せない」に なります。★出口を 塞がないこと。
 *
 *   @param items   品の並び
 *   @param wearing いま着ているもの（★{slot: key} の形。★無くてもよい）
 */
export function withoutRetired(items, wearing) {
  const list = Array.isArray(items) ? items : [];
  const on = new Set(Object.values(wearing || {}).filter((v) => typeof v === "string"));
  return list.filter((i) => !isRetired(i.key) || on.has(i.key));
}
