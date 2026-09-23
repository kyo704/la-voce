// ============================================================================
// ★★★授業の 時間を 出す ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定183 P2 ／ 裁定140（学校ごとに 決める・混ぜない）
//     ／ 裁定73（持って いない ものを 出さない）／ sql/71
//     ／ 見本 `SC['授業の時間を出す']`
//        woolsong-2026-09-21_3.zip ／ 00-動く見本-iPhoneで開く用.html
//        ★2026-09-24 に 展開・docs/design/pack-final/ に 反映
//
//   ★★★2026-09-24 に 形が 変わりました ──
//     ★前は「はじめの 1校 だけ」。★いまは **学校ごと** です。
//     ★★台帳は はじめから 学校ごとに 持って いました（`timetable_share(user_id, org_id)`）。
//       ★★★足りなかったのは「その人が どの 学校に いるか」を 返す 道 だけ でした
//         （`my_orgs()` ／ `my_timetable_share()` ／ sql/71）。
//
//   ★★★1校 だけの 方には、★学校の 名も 註も 出しません（★裁定73）。
//     ★1つしか 無い ものを 選ばせません。★持って いない ものを 出しません。
//
//   ★★★出るのは「授業」の ことば **だけ** です。
//     ★科目の 名前・教室・先生の 名前は 出ません。★体調の ことも 出ません。
//     ★★台帳は 真偽 1つ だけ を 持ちます。★何を 出すかを 選ぶ 欄を 作りません。
//
//   ★★★既定は **出しません**（★裁定183 P2「既定オフ」）。
// ============================================================================

/** ★既定。★出しません。 */
export const DEFAULT_SHARES = false;

/**
 * ★学校ごとの 行（★`my_timetable_share()` の 答え）。
 *
 *   ★★並べ替えません。★台帳が 名前の 順で 返します。
 *   ★★読めなかった ときは 空。★1行も 出しません（★迷ったら 閉じる）。
 */
export function shareRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    orgId: r.org_id,
    name: r.name || "（名前なし）",
    shares: r.shares === true
  }));
}

/**
 * ★学校の 名を 出すか（★裁定73）。
 *
 *   ★★★1校 だけの 方には 出しません。★1つしか 無い ものを 選ばせません。
 *     ★その ときは「授業の 時間を 出す」と だけ 書きます（★見本の とおり）。
 */
export function showsOrgName(rows) {
  return (Array.isArray(rows) ? rows : []).length >= 2;
}

/** ★その 学校に 出して いるか。 */
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

/** ★下に 添える 字（★見本の まま）。 */
export function shareHint(row) {
  return isSharing(row) ? "この学校には 出しています" : "出していません";
}

/**
 * ★学校に 見える もの。
 *
 *   ★★★「授業」の 2文字 だけ です。★ほかを 返す 形を 作りません。
 */
export const VISIBLE_WORD = "授業";

export function whatSchoolSees(sharing) {
  return sharing ? VISIBLE_WORD : null;
}

/** ★1校 だけの ときの 行の 字（★見本の とおり）。 */
export const TT_ONE_LABEL = "授業の 時間を 出す";

/** ★見本の 言葉（★1字 も 足しません）。 */
export const TT_HEAD = "授業の 時間を 出す";
export const TT_WARN = Object.freeze([
  "あなたの 時間割は、だれにも 見えません。",
  "これを 入れると、その学校が レッスンや 稽古を 組むときに 「この時間は 授業」とだけ 見えます。"
]);

/**
 * ★2校 以上の ときだけ 出す 註（★見本の とおり）。
 *
 *   ★★★「学校を またいで 混ざる ことは ありません」は 約束 です（★裁定140）。
 *     ★台帳が `(user_id, org_id)` の 組で 持って いる ことが、★その 支え です。
 */
export const TT_MANY_NOTE = Object.freeze([
  "学校ごとに 決められます。A大学には 出して、B教室には 出さない、が できます。",
  "学校を またいで 混ざることは ありません。"
]);

export const TT_NOTE = Object.freeze([
  "出るのは 「授業」の ことばだけです。",
  "科目の 名前・教室・先生の 名前は 出ません。体調の ことも 出ません。",
  "いつでも やめられます。出さないままでも、レッスンは 組めます（重なりが 見えないだけです）。"
]);
