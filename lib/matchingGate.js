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
//   ★★★2026-09-25 ── ★お仕事（`field`）も 見ます（★裁定202）。
//     ★★見本『お仕事を選ぶ』の 約束 ──
//       「声の お仕事・舞台を えらぶと、「さがす」は 出ません。」
//     ★★音楽の 方だけ です。★伴奏の 相手を さがす ことが ない からです。
//     ★★★見る ところは 1つ です ── `lib/workField.js` の `isMusic`。
//       ★ここに `field === "music"` と 書くと、★決めが 2か所に なります。
//     ★★台帳の 側は `public.can_see_sagasu()`（★sql/90）です。★同じ 2つを 見ます。
//
//   ★見張り components/tests/matching-gate.test.js
// ============================================================================

import { isMusic } from "@/lib/workField";

/** ★環境変数の 名。★2か所で 書かない ため、★ここに 置きます。 */
export const MATCHING_ENV = "NEXT_PUBLIC_MATCHING_USER_IDS";

/**
 * ★その方に「さがす」を 出してよいか。
 *
 *   ★★★既定は **閉** です。★名簿が 空なら false。
 *     ★★`layoutV2` と 同じ 考え です ── ★開いて いない ものは 出しません。
 */
export function mayUseMatching(userId, env, field) {
  const raw = (env && env[MATCHING_ENV]) || "";
  const ids = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return false;
  if (!ids.includes(String(userId || ""))) return false;
  // ★★お仕事が 音楽でなければ 出しません（★見本の 約束）。
  //   ★★`field` が まだ 無い とき（★台帳に 列が 来る 前）は 音楽に 倒します ──
  //     ★いまの 方の 見え方を 変えない ため です（★裁定119）。
  return isMusic(field);
}
