// ============================================================================
// ★名簿の 下書き ── ★裁定 その109（2026-09-20）
//
//   ★★★ここが 持つ 決め
//     ①取り消せるのは いつか（★1件も 招いて いない あいだ だけ）
//     ②古い とは 何か（★入れた 日から 1年・★未紐付け）
//     ③紐付けは 何で 決まるか（★招待 ── ★番号では ありません）
//     ④字
//
//   ★★★してはいけない こと（★裁定 その109 `do_not`）
//     ★学籍番号を 入れさせて 自動で 照らし合わせる
//     ★お名前と 学籍番号の 一致で 紐付ける
//     ★★この 蔵に、★その 仕掛けを 1つも 置きません。
//
//   ★見張り components/tests/roster-drafts.test.js
// ============================================================================

/** ★1年。★これを 過ぎた 未紐付けの 下書きを「古い」と 呼びます。 */
export const OLD_DAYS = 365;

/** ★その 下書きは 招かれて いるか。 */
export function isInvited(d) { return !!(d && d.invited_at); }
/** ★その 下書きは 紐付いて いるか。 */
export function isLinked(d) { return !!(d && d.linked_user_id); }

/**
 * ★古い 下書き（★入れた 日から 1年・★まだ 紐付いて いない）。
 *
 *   ★★★消しません。★畳むだけ です。
 *     ★★入学が 遅れる・休学する ── ★あとから 来る 方が います。
 */
export function isOld(d, nowISO) {
  if (!d || isLinked(d)) return false;
  const t = Date.parse(d.imported_at || "");
  const n = Date.parse(nowISO || "");
  if (Number.isNaN(t) || Number.isNaN(n)) return false;
  return (n - t) / 86400000 >= OLD_DAYS;
}

/** ★いま 画面に 出す もの（★古い ものは 畳みます）。 */
export function visibleDrafts(rows, nowISO) {
  return (rows || []).filter((d) => !isOld(d, nowISO));
}
/** ★畳んだ もの。 */
export function oldDrafts(rows, nowISO) {
  return (rows || []).filter((d) => isOld(d, nowISO));
}

/**
 * ★読み込みの 束（★同じ ときに 入った ぶん）。
 *
 *   ★★★束を しまう 列を 増やして いません（★裁定 その109 の 表の とおり）。
 *     ★★`imported_at` は、★1つの 読み込みでは 同じ 値に なります。
 *     ★★だから「入れた 人 と 入れた とき」で 1つの 束に なります。
 */
export function batchOf(rows, importedAt, importedBy) {
  return (rows || []).filter((d) => d
    && d.imported_at === importedAt && String(d.imported_by) === String(importedBy));
}

/**
 * ★取り消せるか（★裁定 その109 `UNDO`）。
 *
 *   ★★★1件でも 招いて いたら、★取り消せません。
 *     ★★相手に 届いて います。★こちらの 都合で 無かった ことに しません。
 *   ★★紐付いた ものが 1つでも あれば、★同じく 取り消せません。
 */
export function mayUndo(batch) {
  const b = batch || [];
  if (b.length === 0) return false;
  return !b.some((d) => isInvited(d) || isLinked(d));
}

/** ★取り消せない わけ（★押せない 札を 置かない ため、★字で 出します）。 */
export function undoBlockedLine(batch) {
  const b = batch || [];
  const 招 = b.filter(isInvited).length;
  if (招 > 0) return `${招}人に もう お送りしました。取り消せません。`;
  const 結 = b.filter(isLinked).length;
  if (結 > 0) return `${結}人が もう 入って います。取り消せません。`;
  return "";
}

// ---------------------------------------------------------------------------
// ★字
// ---------------------------------------------------------------------------

export const DRAFT_HEAD = "下書き";
export const DRAFT_SUB = "まだ 口（アカウント）の 無い 方です。名簿には まだ 入って いません。";
export const DRAFT_EMPTY = "下書きは ありません。";
export const DRAFT_EMPTY_SUB = "「読み込む」で、校務システムの ファイルから 入ります。";
export const INVITE_ONE = "招く";
export const INVITE_ALL = "まとめて 招く";
export const INVITED_MARK = "お送りしました";
export const LINKED_MARK = "入られました";
export const OLD_HEAD = "古い 下書き";
export const OLD_SUB = "1年 経ちました。消して いません。";
export const OLD_OPEN = "古い 下書きを 見る";
export const OLD_CLOSE = "閉じる";
export const DELETE_ONE = "消す";

/** ★まとめて 招く 前の 確かめ（★1度 だけ 出します）。 */
export function inviteAllAsk(n) {
  return `${n}人に お送りします。`;
}
export const INVITE_ASK_NOTE =
  "お送りしたら、取り消せません。催促は しません。1回だけ です。";
export const INVITE_NOTE = Object.freeze([
  { text: "自動では お送りしません。人が 押した ときだけです。", bold: "自動では お送りしません。" },
  { text: "18歳未満の 方は、入る ときに 保護者の 同意を お尋ねします。", bold: "" },
  { text: "学籍番号を 知って いるだけでは、名簿に つながりません。",
    bold: "学籍番号を 知って いるだけでは、名簿に つながりません。" }
]);

export const UNDO_LABEL = "取り消す";
export function importedLine(n) { return `${n}件を 読み込みました。`; }
export const UNDO_NOTE = "まだ 1人も お送りして いません。いまなら 取り消せます。";
export const DELETE_ASK_NOTE = "この 下書きを 消します。名簿には 何も 起きません。";
