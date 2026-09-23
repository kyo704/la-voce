// ============================================================================
// ★★★授業の 時間を 出す ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定183 P2
//     ／ 見本 `SC['授業の時間を出す']`
//        woolsong-2026-09-21_1.zip ／ 00-動く見本-iPhoneで開く用.html（md5 67c56244）
//        ★2026-09-24 に 確かめ
//
//   ★★★出るのは「授業」の ことば **だけ** です。
//     ★科目の 名前・教室・先生の 名前は 出ません。★体調の ことも 出ません。
//     ★★台帳は `timetable_share(user_id, org_id, shares)` の 真偽 1つ だけ を 持ちます。
//       ★★★何を 出すかを 選ぶ 欄を 作りません ── ★選べると、★いつか 増えます。
//
//   ★★★既定は **出しません**（★裁定183 P2「既定オフ」）。
//     ★いつでも やめられます。★やめた ことを 学校に 知らせません。
// ============================================================================

export const COLS_SHARE = "user_id, org_id, shares, updated_at";

/** ★既定。★出しません。 */
export const DEFAULT_SHARES = false;

/** ★いま 出して いるか（★行が 無ければ 出して いません）。 */
export function isSharing(row) {
  return Boolean(row) && row.shares === true;
}

/** ★押した あとの 値。 */
export function nextShares(row) {
  return !isSharing(row);
}

/** ★札の 字（★見本の まま）。 */
export function shareWord(row) {
  return isSharing(row) ? "出す" : "出さない";
}

/**
 * ★学校に 見える もの。
 *
 *   ★★★「授業」の 2文字 だけ です。★ほかを 返す 形を 作りません。
 *   ★★この 関数が あるのは、★「何が 見えるか」を 1か所で 答える ため です。
 */
export const VISIBLE_WORD = "授業";

export function whatSchoolSees(sharing) {
  return sharing ? VISIBLE_WORD : null;
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const TT_HEAD = "授業の 時間を 出す";
export const TT_WARN = Object.freeze([
  "あなたの 時間割は、だれにも 見えません。",
  "これを 入れると、学校が レッスンや 稽古を 組むときに 「この時間は 授業」とだけ 見えます。"
]);
export const TT_TOGGLE = "授業の 時間を 出す";
export const TT_TOGGLE_SUB = "いつでも やめられます";
export const TT_NOTE = Object.freeze([
  "出るのは 「授業」の ことばだけです。",
  "科目の 名前・教室・先生の 名前は 出ません。体調の ことも 出ません。",
  "出さないままでも、レッスンは 組めます（重なりが 見えないだけです）。"
]);
