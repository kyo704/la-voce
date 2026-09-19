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

/** ★止めるのは ここだけ、と はっきり 書きます。 */
export const NOT_BLOCKED_LINES = Object.freeze([
  "この あいだも、記録・ノート・レパートリー・羊・しらべる は お使いいただけます。",
  "止まるのは「学校に 入る こと」だけ です。"
]);

/** ★保護者に 見える もの・見えない もの（★裁定 §1）。 */
export const GUARDIAN_SEES = Object.freeze([
  "学校の 名前", "先生の 名前", "学校に 見える ものの 一覧"
]);
export const GUARDIAN_NEVER_SEES = Object.freeze([
  "声の 記録", "からだの 記録", "ノート", "レパートリー"
]);

/** ★学校に 見える もの・見えない もの（★メールに 書く 字）。 */
export const SCHOOL_SEES = Object.freeze(["出欠", "空いて いる 時間", "先生との やりとり"]);
export const SCHOOL_NEVER_SEES = Object.freeze(["声の 記録", "体調", "ノート", "レパートリー"]);

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
export const DONE_LINES = Object.freeze([
  "ありがとうございます。学校に 入れる ように なりました。",
  "この 画面は 閉じて いただいて かまいません。",
  "お子さまの 記録は、保護者の 方にも 見えません。"
]);

/** ★通らなかった ときの 1行（★わけを 分けません・裁定 その77）。 */
export const FAILED_LINE = "この 道は お使いに なれません。";

/** ★取り消す（★学生 ご本人の 画面から）。 */
export const WITHDRAW_LABEL = "保護者の 同意を 取り消す";
export const WITHDRAW_NOTES = Object.freeze([
  "学校から 出ます。記録は 1つも 消えません。",
  "出欠と 講評は、学校に 残ります（学校の 決まりです）。",
  "保護者の 方に、1通 お知らせが いきます。"
]);
