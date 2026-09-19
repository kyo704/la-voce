// ============================================================================
// ★保護者の 同意（★裁定 その107）── ★決めごと 1か所
//
//   ★★★15〜17歳の 方が、★**学校に 入る** ときだけ の 話 です。
//     ★★個人で 使う ぶんには 要りません ── ★記録・ノート・レパートリー・羊・しらべる。
//     ★★★止めるのは「学校に 入る こと」だけ です（★裁定 §2）。
//
//   ★★★保護者に アカウントを 作らせません。★メールを 1通 だけ。
//     ★★保護者に 学生の 記録を 見せません。
//       ★★見えると、★学生が 書かなく なります（★9月10日の 線）。
//
//   ★★★催促しません。★1度 出して、★閉じたら 出しません（★裁定 §2）。
//     ★★もっと → 通って いる ところ から、★ご自分で 開けます。
//
//   ★見張り components/tests/guardian-consent.test.js
// ============================================================================

import { AGE_BANDS, ageBandOf } from "@/lib/ageGate";

/** ★同意が 要る 方か（★15〜17歳 だけ）。 */
export function needsGuardianConsent(profile) {
  return ageBandOf(profile) === AGE_BANDS.TEEN;
}

/**
 * ★学校に 入れるか。
 *
 *   ★★★18歳以上 …… ★そのまま 入れます
 *   ★★★15〜17歳 …… ★同意が 済んで いれば 入れます
 *   ★★★15歳未満 …… ★入れません（★登録の ときに 弾いて います）
 *   ★★★帯が 分からない …… ★入れません（★安全な 側へ 倒します）
 */
export function mayJoinSchool(profile, { hasConsent } = {}) {
  const 帯 = ageBandOf(profile);
  if (帯 === AGE_BANDS.ADULT) return true;
  if (帯 === AGE_BANDS.TEEN) return !!hasConsent;
  return false;
}

export const ASK_HEAD = "保護者の 方に 1通 お送りします";
export const ASK_SUB =
  "学校に 入る ときだけ、保護者の 方の ご承知を いただいて います。";
export const EMAIL_LABEL = "保護者の 方の メールアドレス";
export const SEND_LABEL = "送る";
export const SENT_LINE =
  "お送りしました。保護者の 方が 押されると、学校に 入れます。";
export const EXPIRE_LINE = "7日で 切れます。過ぎたら、もう一度 お送りください。";

/**
 * ★送れなかった ときの 1行。
 *
 *   ★★★行は もう 出来て います。★そこを はっきり 書きます。
 *     ★★「はじめから やり直し」に させません。
 */
export const NOT_SENT_LINE =
  "いま お送りできませんでした。少し 経ってから、もう一度 お試し ください。";

/** ★止めるのは ここだけ、と はっきり 書きます。 */
export const NOT_BLOCKED_LINES = Object.freeze([
  "この あいだも、記録・ノート・レパートリー・羊・しらべる は お使いいただけます。",
  "止まるのは「学校に 入る こと」だけ です。"
]);

/** ★保護者に 見える もの・見えない もの（★裁定 §1）。 */
export const GUARDIAN_SEES = Object.freeze([
  "学校の 名前", "先生の 名前", "学校に 見える ものの 一覧"
]);
// ★★★見本に 合わせました（★2026-09-20・第7版の 荷）。★5つ です。
export const GUARDIAN_NEVER_SEES = Object.freeze([
  "声の 記録", "からだの こと", "ノート", "レパートリー", "ひつじ"
]);

/** ★学校に 見える もの・見えない もの（★メールに 書く 字）。 */
export const SCHOOL_SEES = Object.freeze(["出欠", "空いて いる 時間", "先生との やりとり"]);
// ★★見本の 並び（★5つ）。★「ひつじ」も 学校には 見えません。
export const SCHOOL_NEVER_SEES = Object.freeze([
  "声の 記録", "からだの こと", "ノート", "レパートリー", "ひつじ"
]);

/**
 * ★メールの 中身（★裁定 §1 の 字）。
 *
 *   ★★★1度きり だと 書きます。★お子さまの 記録は 見えないと 書きます。
 *   ★★件名に 学校の 名を 入れません ── ★受け取る 方の 受信箱に 残ります。
 */
export const MAIL_SUBJECT = "【Woolsong】お子さまが 学校に 入ろうと して います";

export function mailLines({ studentName, orgName, teacherName, url }) {
  const 生 = studentName || "お子さま";
  const 校 = orgName || "学校";
  const 師 = teacherName ? `${teacherName}先生の 門下` : "先生の 門下";
  return [
    `${生}さんが ${校}の ${師}に 入ろうと して います。`,
    "",
    "学校に 見える もの",
    "　" + SCHOOL_SEES.join("／"),
    "学校に 見えない もの",
    "　" + SCHOOL_NEVER_SEES.join("／"),
    "",
    "よろしければ、下を 押して ください。",
    "",
    url || "",
    "",
    "※この メールは 1度きり です。",
    "※お子さまの 記録は、保護者の 方にも 見えません。"
  ];
}

/** ★押した あとの 画面の 字。 */
export const DONE_HEAD = "承知しました";
/** ★保護者の 画面の 断り（★見本の note）。 */
export const GUARDIAN_NOTES = Object.freeze([
  "お子さまの 記録は、保護者の 方にも 見えません。",
  "このページは 7日で 切れます。1度 押すと、二度目は ひらきません。",
  "あとで お気持ちが 変わられたら、お子さまの 画面から 取り消せます。"
]);
export const GUARDIAN_LATER = "いまは やめて おく";

export const DONE_LINES = Object.freeze([
  "ありがとうございます。学校に 入れる ように なりました。",
  "この 画面は 閉じて いただいて かまいません。",
  "お子さまの 記録は、保護者の 方にも 見えません。"
]);

/** ★通らなかった ときの 1行（★わけを 分けません・裁定 その77）。 */
export const FAILED_LINE = "この 道は お使いに なれません。";

// ----------------------------------------------------------------------------
// ★取り消す（★学生 ご本人の 画面から・★見本 `SC['同意を取り消す']`）
// ----------------------------------------------------------------------------
//   ★★★「消える もの」と「消えない もの」を、★両方 並べます。
//     ★★消えない ものを 書かないと、★押す 手が 止まります。
export const WITHDRAW_LABEL = "保護者の 同意を 取り消す";
export const WITHDRAW_HEAD = "保護者の 同意を 取り消す";
export const WITHDRAW_WARN = Object.freeze([
  "取り消すと、この 教室から 出ます。",
  "保護者の 方にも、お知らせが 届きます。"
]);
export const WITHDRAW_GONE = Object.freeze([
  "この 教室の 予定・行事",
  "門下の 連絡",
  "この 教室から、あなたが 見えなく なる こと"
]);
export const WITHDRAW_KEPT = Object.freeze([
  "声の 記録", "からだの こと", "ノート", "レパートリー", "ひつじ"
]);
export const WITHDRAW_KEPT_WORD = "そのまま";
export const WITHDRAW_KEPT_LINE = "ひとつも 消えません。";
export const WITHDRAW_DO = "取り消す";
export const WITHDRAW_CANCEL = "やめる";
export const WITHDRAW_NOTES = Object.freeze([
  "これまでの 出欠と、連絡に 書いた ことは、教室の 記録として 残ります（運営の 義務です）。",
  "また 入る ときは、もう一度 保護者の 方に ひとこと いただきます。",
  "18歳に なられても、聞き直しません。一度 いただいた ひとことは、そのまま です。"
]);
export const WITHDRAW_DONE = "取り消しました。";
export const WITHDRAW_FAILED = "いま 取り消せませんでした。もう一度 お試し ください。";

/** ★取り消した ことを、★保護者に お伝えする メール。 */
export const WITHDRAW_MAIL_SUBJECT = "【Woolsong】学校に 入る ことを 取り消しました";
export function withdrawMailLines({ studentName, orgName }) {
  const 生 = studentName || "お子さま";
  const 校 = orgName || "学校";
  return [
    `${生}さんが、${校}に 入る ことを 取り消しました。`,
    "",
    "学校からは、これ以上 新しい ことは 見えません。",
    "これまでの 出欠と 連絡は、教室の 記録として 残ります。",
    "",
    "お子さまの 記録（声・からだ・ノート）は、これまでどおり",
    "保護者の 方にも 見えません。",
    "",
    "※この メールに お返事は いりません。"
  ];
}
