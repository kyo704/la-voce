// ============================================================================
// ★★★公演の 情報 ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定141 ／ 裁定144（使い回さない）／ design-v36 の 直し ⑤
//     ／ 見本 `P_koenInfo`（`SC['公演の情報']`）
//        woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//
//   ★★★design-v36 の 直し ── ★題名・本番の 日・会場が **実際に 直せます**。
//     ★前は 打っても 入りませんでした。
//
//   ★★期限（`valid_until`）は **台帳** が 決めます ──
//     ★決め方 …… お支払いの ときの 本番の 最後の 日 ＋30日（`koen_compute_valid_until`）
//     ★延ばす …… `extend_koen(p_koen, p_new_until)`。★1回だけ・90日まで。
//     ★★★画面では 計算しません。★日数を 写すと、★台帳と ずれます。
// ============================================================================

export const COLS_KOEN = "id, org_id, owner_user_id, title, kind, venue, opens_on, status, tier_people, valid_until, extended_at, paid_at";

/** ★直せる 欄（★見本の 3つ。★ここに 無い 列は 画面から 直せません）。 */
export const EDITABLE = Object.freeze([
  { key: "title", label: "題名" },
  { key: "opens_on", label: "本番の 日" },
  { key: "venue", label: "会場" }
]);

/** ★期限が 過ぎて いるか（★台帳の 日 だけ を 見ます）。 */
export function isExpired(koen) {
  if (!koen || !koen.valid_until) return false;
  const d = new Date(koen.valid_until + "T23:59:59+09:00");
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

/** ★直して よいか（★期限が 過ぎたら 直せません）。 */
export function canEditInfo(koen) {
  return Boolean(koen) && !isExpired(koen);
}

/**
 * ★期限を 延ばす ところを 出すか。
 *
 *   ★★★3つ とも 要ります ──
 *     ① 期限が ある（★お支払いが 済んで いる）
 *     ② まだ 延ばして いない（★1回だけ）
 *     ③ 期限が 過ぎて いない
 *   ★★台帳の `extend_koen` も 同じ 3つを 見ます。★こちらは **出すか どうか** だけ です。
 *     ★★★止めるのは 台帳 です。★画面は 先に 隠す だけ。
 */
export function canExtend(koen) {
  if (!koen || !koen.valid_until) return false;
  if (koen.extended_at) return false;
  return !isExpired(koen);
}

/** ★延ばせる いちばん 先の 日（★90日まで）。★台帳と 同じ 決め です。 */
export const EXTEND_MAX_DAYS = 90;

/** ★いまの 期限から `EXTEND_MAX_DAYS` 先（★"2026-06-22" の 形）。 */
export function extendLimit(koen) {
  if (!koen || !koen.valid_until) return null;
  const d = new Date(koen.valid_until + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + EXTEND_MAX_DAYS);
  return d.toISOString().slice(0, 10);
}

/** ★台帳が 返した わけを、★読める 言葉に します。 */
export function extendReason(reason) {
  const 言 = {
    NO_SUCH_KOEN: "その 公演が 見つかりません。",
    NOT_STAFF: "この 公演を 運営して いる 方だけが 延ばせます。",
    NOT_PAID_YET: "お支払いが 済むと、期限が 決まります。",
    ALREADY_EXTENDED: "もう 延ばしました。延ばせるのは 1回だけです。",
    NOT_LATER: "いまの 期限より 先の 日を 選んで ください。",
    OVER_90_DAYS: "延ばせるのは 90日 までです。"
  };
  return 言[String(reason || "")] || "延ばせませんでした。";
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const INFO_EDIT_NOTE = "題名や 本番の 日は 直せます。直しても、使える 期限は 変わりません。";
export const INFO_LIMIT_HEAD = "使える 期限";
export const INFO_LIMIT = "期限";
export const INFO_NOT_PAID = "お支払いの ときに 決まります";
export const INFO_HOW = "決め方";
export const INFO_HOW_VALUE = "お支払いの ときの 本番の 最後の 日＋30日";
export const INFO_EXT = "延期";
export const INFO_EXT_DONE = "延ばしました（もう 延ばせません）";
export const INFO_EXT_YET = "1回だけ、90日まで";
export const INFO_EXT_BUTTON = "本番が 延びたので、期限を 延ばす";
export const INFO_EXT_ASK_HEAD = "期限を 延ばしますか";
export const INFO_EXT_ASK = "本番が 延びた ときの ためです。1回だけ、90日まで 延ばせます。理由は うかがいません。";

/**
 * ★下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★1行目は 裁定144 の 約束 です ── ★使い回せません。
 *   ★★★2行目も 約束 です ── ★期限が 過ぎても、出演者の 記録は ご本人に 残ります。
 */
export const INFO_NOTE = Object.freeze([
  "同じ 公演を、題名と 日を 変えて 使い回すことは できません。期限の 先へは 使えないからです。",
  "期限が 過ぎても、出演者の 記録は ご本人に 残ります。運営の 側は 読むことと 書き出すことが できます。",
  "期限は 画面だけでなく、こちらの 台帳でも 確かめています。"
]);
