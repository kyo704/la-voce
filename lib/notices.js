// ============================================================================
// 「1回だけ出す知らせ」を、1つの仕組みでまとめる
//
//   ★これまでは、知らせを1つ足すたびに profiles へ列を1本足していました。
//     occupation_notice_shown_at / age_question_shown_at / survey_day7_shown_at。
//     知らせが増えるたびに移行が要り、そのたびに
//     「コードは出たが SQL はまだ」の窓が開きます（2026-08-30 に2回）。
//
//   ★これからは user_notices に1行入れるだけです。列は増えません。
//
//   ★知らせの鍵は、ここが唯一の正です。文字列を画面に直接書かないこと。
//     書くと、綴り違いで「出したのに出続ける」が起きます。
// ============================================================================

/** 出しうる知らせの鍵。★増やすときは、ここに足してから使うこと。 */
export const NOTICE_KEYS = [
  // 初回のダッシュボードで1度だけ。文字の大きさを変えられることを伝える。
  "displayScaleHint"
];

/** 知らせの本文。★9言語にしていません。いまは日本語だけで出します。 */
export const NOTICE_TEXT = {
  displayScaleHint: "文字が小さければ、いつでも設定から変えられます"
};

export function isNoticeKey(key) {
  return NOTICE_KEYS.includes(key);
}

/**
 * その知らせを、いま出してよいか。
 *
 * @param {object} state  { [key]: shown_at } の形。読めていなければ null を渡す
 * @param {string} key
 * @returns {boolean}
 *
 * ★state が null（テーブルがまだ無い／読めなかった）のときは false。
 *   出しません。出してしまうと、既読にできず★毎回出続けます。
 *   「1回だけ」を守れないなら、出さないほうがましです。
 */
export function shouldShowNotice(state, key) {
  if (!isNoticeKey(key)) return false;
  if (!state) return false;
  return !state[key];
}

/**
 * 既読にした状態を作る。★元の state は変えません。
 * shown_at は呼ぶ側から渡します（この関数の中で時刻を作らない）。
 */
export function withNoticeShown(state, key, shownAt) {
  if (!isNoticeKey(key)) return state;
  return { ...(state || {}), [key]: shownAt };
}

/** 読み込んだ行の配列を、{ key: shown_at } の形にする。 */
export function noticeStateFromRows(rows) {
  const out = {};
  (rows || []).forEach((r) => {
    if (r && isNoticeKey(r.notice_key)) out[r.notice_key] = r.shown_at || true;
  });
  return out;
}
