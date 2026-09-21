// ============================================================================
// ★さがす（マッチング）を 出してよいか ── ★決めごと 1か所
//
//   ★★★いま 9画面の うち 1枚 しか ありません（★2026-09-21）。
//     ★★全員に 出すと、★募集を 出しても 応募する 方が 居ない 姿に なります。
//     ★★出来て いない ものを、★出来て いる ように 見せません。
//
//   ★★★だから 名簿で 絞ります。★`lib/layoutV2.js` と 同じ 形 です。
//     ★★環境の `NEXT_PUBLIC_MATCHING_USER_IDS` に 並べた 方 だけ。
//     ★★空なら 誰にも 出ません（★既定は 閉 です）。
//
//   ★★★9画面が 揃った 日に、★この 門を 外します。
//     ★★外す ときは、★この 紙ごと 消します。★`mayUseMatching` を 呼ぶ ところも。
//
//   ★見張り components/tests/matching-gate.test.js
// ============================================================================

/** ★環境変数の 名。★2か所で 書かない ため、★ここに 置きます。 */
export const MATCHING_ENV = "NEXT_PUBLIC_MATCHING_USER_IDS";

/**
 * ★その方に「さがす」を 出してよいか。
 *
 *   ★★★既定は **閉** です。★名簿が 空なら false。
 *     ★★`layoutV2` と 同じ 考え です ── ★開いて いない ものは 出しません。
 */
export function mayUseMatching(userId, env) {
  const raw = (env && env[MATCHING_ENV]) || "";
  const ids = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return false;
  return ids.includes(String(userId || ""));
}
